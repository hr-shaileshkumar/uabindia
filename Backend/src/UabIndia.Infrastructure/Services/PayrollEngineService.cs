using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class PayrollEngineService : IPayrollEngine
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IComplianceRepository _compliance;
        private readonly ILedgerPostingService _ledger;

        public PayrollEngineService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IComplianceRepository compliance,
            ILedgerPostingService ledger)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _compliance = compliance;
            _ledger = ledger;
        }

        public async Task<PayrollEngineResult> CompleteRunAsync(Guid payrollRunId, CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var run = await _db.PayrollRuns.FirstOrDefaultAsync(r => r.Id == payrollRunId && !r.IsDeleted, cancellationToken)
                ?? throw new InvalidOperationException("Payroll run not found");

            if (!string.Equals(run.Status, "Draft", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Only draft runs can be completed");

            var periodStart = run.PeriodStart ?? new DateTime(run.RunDate.Year, run.RunDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var periodEnd = run.PeriodEnd ?? periodStart.AddMonths(1).AddDays(-1);
            run.PeriodStart = periodStart;
            run.PeriodEnd = periodEnd;

            var employeesQuery = _db.Employees.Where(e => !e.IsDeleted &&
                (e.Status == null || e.Status == "Active" || e.Status == "OnProbation" || e.Status == "OnLeave"));
            if (run.CompanyId.HasValue && run.CompanyId != Guid.Empty)
                employeesQuery = employeesQuery.Where(e => e.CompanyId == run.CompanyId.Value);

            var employees = await employeesQuery.ToListAsync(cancellationToken);
            var structures = await _db.PayrollStructures.AsNoTracking().Where(s => !s.IsDeleted).ToListAsync(cancellationToken);
            var components = await _db.PayrollComponents.AsNoTracking().Where(c => !c.IsDeleted).ToListAsync(cancellationToken);
            var assignments = await _db.EmployeeSalaryAssignments.AsNoTracking()
                .Where(a => a.IsActive && !a.IsDeleted)
                .ToListAsync(cancellationToken);

            var unpaidLeave = await (
                from req in _db.LeaveRequests.AsNoTracking()
                join policy in _db.LeavePolicies.AsNoTracking() on req.LeavePolicyId equals policy.Id into policies
                from policy in policies.DefaultIfEmpty()
                where req.Status == "Approved"
                      && req.FromDate <= periodEnd && req.ToDate >= periodStart
                select new
                {
                    req.EmployeeId,
                    req.Days,
                    TypeName = policy != null ? (policy.Name ?? "") : "",
                    TypeCode = policy != null ? (policy.Type ?? "") : "",
                    IsPaid = policy == null || !(
                        (policy.Type ?? "").ToLower().Contains("lop") ||
                        (policy.Name ?? "").ToLower().Contains("unpaid") ||
                        (policy.Type ?? "").ToLower().Contains("unpaid"))
                }
            ).ToListAsync(cancellationToken);

            var loans = await _db.PayrollLoans.Where(l => !l.IsDeleted && l.Status == "Active").ToListAsync(cancellationToken);
            var bonuses = await _db.PayrollBonuses.Where(b => !b.IsDeleted && (b.Status == "Approved" || b.Status == "Pending")).ToListAsync(cancellationToken);
            var arrears = await _db.PayrollArrears.Where(a => !a.IsDeleted && (a.Status == "Approved" || a.Status == "Pending")).ToListAsync(cancellationToken);
            var overtimeRequests = await _db.OvertimeRequests
                .Where(o => !o.IsDeleted
                    && o.Status == OvertimeRequestStatus.Approved
                    && o.CompensationType != CompensationType.TimeOff
                    && o.OvertimeDate >= periodStart
                    && o.OvertimeDate <= periodEnd)
                .ToListAsync(cancellationToken);
            var paidOvertimeIds = await _db.OvertimeLogs.AsNoTracking()
                .Where(l => l.IsProcessedInPayroll && !l.IsDeleted)
                .Select(l => l.OvertimeRequestId)
                .ToListAsync(cancellationToken);
            var unpaidOvertime = overtimeRequests.Where(o => !paidOvertimeIds.Contains(o.Id)).ToList();

            var alreadyGenerated = await _db.Payslips.AnyAsync(p => p.PayrollRunId == run.Id && !p.IsDeleted, cancellationToken);
            var calendarDays = DateTime.DaysInMonth(periodStart.Year, periodStart.Month);
            var workingDays = (decimal)calendarDays;
            var monthYear = periodStart.Year * 100 + periodStart.Month;
            var financialYear = periodStart.Month >= 4 ? periodStart.Year : periodStart.Year - 1;
            var stateCode = "KA";
            if (run.CompanyId.HasValue && run.CompanyId != Guid.Empty)
            {
                var companyState = await _db.Companies.AsNoTracking()
                    .Where(c => c.Id == run.CompanyId)
                    .Select(c => c.State)
                    .FirstOrDefaultAsync(cancellationToken);
                if (!string.IsNullOrWhiteSpace(companyState))
                    stateCode = companyState.Trim().Length == 2 ? companyState.Trim().ToUpperInvariant() : companyState.Trim()[..2].ToUpperInvariant();
            }

            var statutory = 0;
            decimal totalGross = 0;
            decimal totalNet = 0;
            decimal totalPfEe = 0, totalPfEr = 0, totalEsiEe = 0, totalEsiEr = 0, totalPt = 0, totalTds = 0;

            if (!alreadyGenerated)
            {
                var defaultStructure = structures.OrderByDescending(s => s.EffectiveFrom).FirstOrDefault();
                foreach (var employee in employees)
                {
                    var assignment = assignments
                        .Where(a => a.EmployeeId == employee.Id && a.EffectiveFrom <= periodEnd && (a.EffectiveTo == null || a.EffectiveTo >= periodStart))
                        .OrderByDescending(a => a.EffectiveFrom)
                        .FirstOrDefault();

                    var structureId = assignment?.StructureId ?? employee.PayrollStructureId ?? defaultStructure?.Id;
                    var structureComponents = structureId.HasValue
                        ? components.Where(c => c.StructureId == structureId.Value).ToList()
                        : new List<PayrollComponent>();

                    var basic = assignment?.BasicSalary > 0
                        ? assignment.BasicSalary
                        : employee.BasicSalary > 0
                            ? employee.BasicSalary
                            : employee.MonthlyCtc > 0
                                ? IndiaStatutoryCalculator.RoundMoney(employee.MonthlyCtc * 0.40m)
                                : structureComponents.Where(c => c.Type == "Earning" && c.Name.Contains("Basic", StringComparison.OrdinalIgnoreCase)).Sum(c => c.Amount ?? 0m);

                    if (basic <= 0)
                    {
                        var earningAmt = structureComponents.Where(c => c.Type == "Earning").Sum(c => c.Amount ?? 0m);
                        basic = earningAmt > 0 ? earningAmt : 0m;
                    }

                    if (basic <= 0 && (assignment?.MonthlyCtc ?? employee.MonthlyCtc) <= 0)
                        continue;

                    var serviceStart = periodStart;
                    var serviceEnd = periodEnd;
                    if (employee.DateOfJoining.HasValue && employee.DateOfJoining.Value.Date > serviceStart)
                        serviceStart = employee.DateOfJoining.Value.Date;
                    if (employee.ExitDate.HasValue && employee.ExitDate.Value.Date < serviceEnd)
                        serviceEnd = employee.ExitDate.Value.Date;
                    if (serviceEnd < serviceStart)
                        continue;

                    var servedDays = (decimal)((serviceEnd.Date - serviceStart.Date).Days + 1);
                    var lopDays = unpaidLeave
                        .Where(l => l.EmployeeId == employee.Id && (!l.IsPaid || l.TypeCode.Contains("LOP", StringComparison.OrdinalIgnoreCase) || l.TypeName.Contains("unpaid", StringComparison.OrdinalIgnoreCase)))
                        .Sum(l => l.Days);
                    lopDays = Math.Min(servedDays, Math.Max(0m, lopDays));
                    var payableDays = Math.Max(0m, servedDays - lopDays);
                    var factor = workingDays <= 0 ? 1m : payableDays / workingDays;

                    var lines = new List<PayslipLine>();
                    decimal earnings = 0;
                    decimal deductions = 0;
                    var sort = 0;

                    void AddLine(string name, string type, decimal amount, bool statutoryLine = false)
                    {
                        amount = IndiaStatutoryCalculator.RoundMoney(amount);
                        if (amount == 0) return;
                        lines.Add(new PayslipLine
                        {
                            TenantId = tenantId,
                            Name = name,
                            Type = type,
                            Amount = amount,
                            IsStatutory = statutoryLine,
                            SortOrder = sort++,
                            CreatedAt = DateTime.UtcNow
                        });
                        if (type == "Earning") earnings += amount;
                        else deductions += amount;
                    }

                    if (structureComponents.Count > 0)
                    {
                        foreach (var component in structureComponents.Where(c => c.Type == "Earning"))
                        {
                            var amount = component.Amount ?? 0m;
                            if (component.Percentage is > 0)
                                amount = basic * component.Percentage.Value / 100m;
                            else if (component.Name.Contains("Basic", StringComparison.OrdinalIgnoreCase) && amount <= 0)
                                amount = basic;
                            AddLine(component.Name, "Earning", amount * factor, component.IsStatutory);
                        }

                        foreach (var component in structureComponents.Where(c => c.Type == "Deduction" && !componentLooksStatutory(c.Name)))
                        {
                            var amount = component.Amount ?? 0m;
                            if (component.Percentage is > 0)
                                amount = basic * component.Percentage.Value / 100m;
                            AddLine(component.Name, "Deduction", amount * factor, component.IsStatutory);
                        }
                    }
                    else
                    {
                        AddLine("Basic", "Earning", basic * factor);
                        var hra = assignment?.Hra > 0 ? assignment.Hra : IndiaStatutoryCalculator.RoundMoney(basic * 0.40m);
                        var special = assignment?.SpecialAllowance > 0 ? assignment.SpecialAllowance : Math.Max(0m, (assignment?.MonthlyCtc ?? employee.MonthlyCtc) - basic - hra);
                        AddLine("HRA", "Earning", hra * factor);
                        AddLine("Special Allowance", "Earning", special * factor);
                    }

                    foreach (var bonus in bonuses.Where(b => b.EmployeeId == employee.Id))
                    {
                        AddLine(bonus.BonusType, "Earning", bonus.Amount);
                        bonus.Status = "Paid";
                        bonus.PaidAt = DateTime.UtcNow;
                    }

                    foreach (var arrear in arrears.Where(a => a.EmployeeId == employee.Id))
                    {
                        AddLine($"Arrear {arrear.Period}", "Earning", arrear.Amount);
                        arrear.Status = "Processed";
                    }

                    foreach (var ot in unpaidOvertime.Where(o => o.EmployeeId == employee.Id))
                    {
                        var hours = ot.ActualWorkedHours ?? (ot.NetOvertimeHours > 0 ? ot.NetOvertimeHours : ot.TotalHours);
                        var hourly = basic > 0 ? basic / 26m / 8m : (employee.MonthlyCtc > 0 ? employee.MonthlyCtc / 26m / 8m : 0m);
                        var multiplier = ot.OvertimeRate > 0 ? ot.OvertimeRate : 1.5m;
                        var amount = ot.OvertimeAmount > 0
                            ? ot.OvertimeAmount
                            : IndiaStatutoryCalculator.RoundMoney(hours * hourly * multiplier);
                        AddLine("Overtime", "Earning", amount);
                        ot.Status = OvertimeRequestStatus.Completed;
                        ot.UpdatedAt = DateTime.UtcNow;
                        _db.OvertimeLogs.Add(new OvertimeLog
                        {
                            TenantId = tenantId,
                            OvertimeRequestId = ot.Id,
                            EmployeeId = employee.Id,
                            OvertimeDate = ot.OvertimeDate,
                            OvertimeHours = hours,
                            OvertimeRate = multiplier,
                            OvertimeAmount = amount,
                            OvertimeType = ot.OvertimeType,
                            CompensationType = ot.CompensationType,
                            IsProcessedInPayroll = true,
                            PayrollRunId = run.Id,
                            PayrollProcessedDate = DateTime.UtcNow,
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    var gross = earnings;
                    var alreadyCoveredEsi = !string.IsNullOrWhiteSpace(employee.EsiNumber);
                    var pf = IndiaStatutoryCalculator.CalculatePf(basic * factor);
                    var esi = IndiaStatutoryCalculator.CalculateEsi(gross, alreadyCoveredEsi);
                    var pt = IndiaStatutoryCalculator.CalculateProfessionalTax(employee.State ?? stateCode, gross, periodStart.Month);
                    var tds = IndiaStatutoryCalculator.CalculateMonthlyTds(gross * 12m, TaxRegimeKind.New).MonthlyTds;

                    AddLine("Provident Fund", "Deduction", pf.EmployeeContribution, true);
                    AddLine("ESI", "Deduction", esi.EmployeeContribution, true);
                    AddLine("Professional Tax", "Deduction", pt, true);
                    AddLine("TDS", "Deduction", tds, true);

                    foreach (var loan in loans.Where(l => l.EmployeeId == employee.Id && l.OutstandingAmount > 0))
                    {
                        var emi = Math.Min(loan.EmiAmount, loan.OutstandingAmount);
                        AddLine($"{loan.LoanType} EMI", "Deduction", emi);
                        loan.OutstandingAmount = Math.Max(0m, loan.OutstandingAmount - emi);
                        loan.InstallmentsPaid += 1;
                        if (loan.OutstandingAmount <= 0)
                        {
                            loan.Status = "Closed";
                            loan.ClosedAt = DateTime.UtcNow;
                        }
                    }

                    var net = Math.Max(0m, earnings - deductions);
                    var payslip = new Payslip
                    {
                        TenantId = tenantId,
                        PayrollRunId = run.Id,
                        EmployeeId = employee.Id,
                        Gross = gross,
                        Net = net,
                        Month = periodStart.Month,
                        Year = periodStart.Year,
                        WorkingDays = workingDays,
                        PayableDays = payableDays,
                        LopDays = lopDays,
                        Basic = IndiaStatutoryCalculator.RoundMoney(basic * factor),
                        TotalEarnings = earnings,
                        TotalDeductions = deductions,
                        PfEmployee = pf.EmployeeContribution,
                        EsiEmployee = esi.EmployeeContribution,
                        ProfessionalTax = pt,
                        Tds = tds,
                        Details = $"Basic={basic:0.00}; payableDays={payableDays:0.##}/{workingDays}; LOP={lopDays:0.##}",
                        CreatedAt = DateTime.UtcNow,
                        Lines = lines
                    };
                    _db.Payslips.Add(payslip);

                    totalGross += gross;
                    totalNet += net;
                    totalPfEe += pf.EmployeeContribution;
                    totalPfEr += pf.EmployerEpf + pf.EmployerEps;
                    totalEsiEe += esi.EmployeeContribution;
                    totalEsiEr += esi.EmployerContribution;
                    totalPt += pt;
                    totalTds += tds;

                    statutory += await UpsertStatutoryAsync(employee, tenantId, run, periodStart, monthYear, financialYear, stateCode, pf, esi, pt, tds, gross, basic * factor);
                }
            }
            else
            {
                var slips = await _db.Payslips.Where(p => p.PayrollRunId == run.Id && !p.IsDeleted).ToListAsync(cancellationToken);
                totalGross = slips.Sum(s => s.Gross);
                totalNet = slips.Sum(s => s.Net);
                totalPfEe = slips.Sum(s => s.PfEmployee);
                totalEsiEe = slips.Sum(s => s.EsiEmployee);
                totalPt = slips.Sum(s => s.ProfessionalTax);
                totalTds = slips.Sum(s => s.Tds);
            }

            JournalEntry? journal = null;
            if (totalGross > 0)
            {
                var employerCost = totalPfEr + totalEsiEr;
                journal = await _ledger.PostAsync(
                    "JE-PAY-",
                    periodEnd,
                    $"Payroll {periodStart:MMM yyyy}",
                    new List<LedgerLine>
                    {
                        new("5100", "Salary Expense", "Expense", totalGross + employerCost, 0, "Gross pay + employer statutory"),
                        new("2101", "Salary Payable", "Liability", 0, totalNet, "Net pay"),
                        new("2102", "PF Payable", "Liability", 0, totalPfEe + totalPfEr, "PF EE+ER"),
                        new("2103", "ESI Payable", "Liability", 0, totalEsiEe + totalEsiEr, "ESI EE+ER"),
                        new("2104", "PT Payable", "Liability", 0, totalPt, "Professional tax"),
                        new("2105", "TDS Payable", "Liability", 0, totalTds, "Income tax TDS"),
                    },
                    "PayrollRun",
                    run.Id,
                    cancellationToken);
            }

            var slipCount = await _db.Payslips.CountAsync(p => p.PayrollRunId == run.Id && !p.IsDeleted, cancellationToken);
            run.Status = "Completed";
            run.UpdatedAt = DateTime.UtcNow;
            run.PayslipCount = slipCount;
            run.TotalGross = totalGross;
            run.TotalNet = totalNet;
            run.JournalEntryId = journal?.Id;
            await _db.SaveChangesAsync(cancellationToken);

            return new PayrollEngineResult(
                run.Id,
                slipCount,
                statutory,
                journal?.Id,
                totalGross,
                totalNet,
                $"Payroll run completed with {slipCount} payslip(s), statutory records, and GL posting.");
        }

        private static bool componentLooksStatutory(string name)
        {
            var n = name.ToLowerInvariant();
            return n.Contains("pf") || n.Contains("esi") || n.Contains("tds") || n.Contains("pt") || n.Contains("provident") || n.Contains("professional tax");
        }

        private async Task<int> UpsertStatutoryAsync(
            Employee employee,
            Guid tenantId,
            PayrollRun run,
            DateTime periodStart,
            int monthYear,
            int financialYear,
            string stateCode,
            PfContribution pf,
            EsiContribution esi,
            decimal ptAmount,
            decimal tds,
            decimal gross,
            decimal basic)
        {
            var created = 0;
            var name = employee.FullName ?? employee.EmployeeCode ?? employee.Id.ToString();
            var code = employee.EmployeeCode ?? employee.Id.ToString("N")[..8].ToUpperInvariant();

            if (!await _db.ProvidentFunds.AnyAsync(p => p.EmployeeId == employee.Id && p.MonthYear == monthYear && !p.IsDeleted))
            {
                await _compliance.CreateProvidentFundAsync(new ProvidentFund
                {
                    TenantId = tenantId,
                    EmployeeId = employee.Id,
                    EmployeeNumber = code,
                    EmployeeName = name,
                    PFAccountNumber = employee.PfNumber ?? "",
                    BasicSalary = basic,
                    DA = 0,
                    MonthYear = monthYear,
                    FinancialYear = financialYear,
                    EffectiveFrom = periodStart,
                    Status = PFStatus.Active
                });
                created++;
            }

            if (!await _db.EmployeeStateInsurances.AnyAsync(p => p.EmployeeId == employee.Id && p.MonthYear == monthYear && !p.IsDeleted))
            {
                await _compliance.CreateESIAsync(new EmployeeStateInsurance
                {
                    TenantId = tenantId,
                    EmployeeId = employee.Id,
                    EmployeeNumber = code,
                    EmployeeName = name,
                    ESINumber = employee.EsiNumber ?? "",
                    StateCode = employee.State ?? stateCode,
                    MonthlySalary = gross,
                    MonthYear = monthYear,
                    FinancialYear = financialYear,
                    ContributionMonth = periodStart,
                    ContributionDays = DateTime.DaysInMonth(periodStart.Year, periodStart.Month),
                    EffectiveFrom = periodStart,
                    Status = ESIStatus.Active
                });
                created++;
            }

            if (!await _db.ProfessionalTaxes.AnyAsync(p => p.EmployeeId == employee.Id && p.MonthYear == monthYear && !p.IsDeleted))
            {
                await _compliance.CreatePTAsync(new ProfessionalTax
                {
                    TenantId = tenantId,
                    EmployeeId = employee.Id,
                    EmployeeNumber = code,
                    EmployeeName = name,
                    StateCode = employee.State ?? stateCode,
                    MonthlySalary = gross,
                    MonthYear = monthYear,
                    FinancialYear = financialYear,
                    PTDeduction = ptAmount,
                    EffectiveFrom = periodStart,
                    Status = PTStatus.Active
                });
                created++;
            }

            var it = await _db.IncomeTaxes.FirstOrDefaultAsync(p => p.EmployeeId == employee.Id && p.FinancialYear == financialYear && !p.IsDeleted);
            if (it == null)
            {
                await _compliance.CreateIncomeTaxAsync(new IncomeTax
                {
                    TenantId = tenantId,
                    EmployeeId = employee.Id,
                    EmployeeNumber = code,
                    EmployeeName = name,
                    PAN = employee.Pan ?? "",
                    TaxRegime = TaxRegime.NewRegime,
                    BasicSalary = basic,
                    GrossSalary = gross * 12m,
                    TDSDeducted = tds,
                    FinancialYear = financialYear,
                    AssessmentYear = financialYear + 1,
                    Status = ITStatus.Calculated
                });
                created++;
            }
            else
            {
                it.TDSDeducted += tds;
                it.UpdatedAt = DateTime.UtcNow;
            }

            return created;
        }
    }
}
