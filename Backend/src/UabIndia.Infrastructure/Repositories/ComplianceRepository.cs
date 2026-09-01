using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation for Compliance module
    /// Handles PF, ESI, IT, PT, Tax Declarations, Compliance Reports, and Audits
    /// All queries include multi-tenancy filtering and soft delete checks
    /// </summary>
    public class ComplianceRepository : IComplianceRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ComplianceRepository> _logger;

        private const decimal DefaultPfCeiling = 15000m;
        private const decimal DefaultEsiCeiling = 21000m;
        private const decimal DefaultStandardDeduction = 75000m;

        public ComplianceRepository(ApplicationDbContext context, ILogger<ComplianceRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        private sealed class TaxSlabSetting
        {
            public decimal From { get; set; }
            public decimal To { get; set; }
            public decimal Rate { get; set; }
        }

        private async Task<List<TaxSlabSetting>> GetTaxSlabsAsync(int financialYear, string regime)
        {
            var key = $"IT_SLAB_{regime.ToUpperInvariant()}_FY{financialYear}";
            var setting = await _context.StatutorySettings
                .AsNoTracking()
                .Where(s => s.SettingKey == key && s.IsActive && !s.IsDeleted)
                .OrderByDescending(s => s.EffectiveFrom)
                .FirstOrDefaultAsync();

            if (setting == null || string.IsNullOrWhiteSpace(setting.SettingValue))
            {
                return GetDefaultSlabs(regime);
            }

            try
            {
                var slabs = JsonSerializer.Deserialize<List<TaxSlabSetting>>(setting.SettingValue);
                return slabs ?? GetDefaultSlabs(regime);
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Invalid tax slab JSON for {SettingKey}", key);
                return GetDefaultSlabs(regime);
            }
        }

        private static List<TaxSlabSetting> GetDefaultSlabs(string regime)
        {
            if (string.Equals(regime, "NewRegime", StringComparison.OrdinalIgnoreCase))
            {
                return new List<TaxSlabSetting>
                {
                    new TaxSlabSetting { From = 0, To = 300000, Rate = 0.00m },
                    new TaxSlabSetting { From = 300000, To = 700000, Rate = 0.05m },
                    new TaxSlabSetting { From = 700000, To = 1000000, Rate = 0.10m },
                    new TaxSlabSetting { From = 1000000, To = 1700000, Rate = 0.15m },
                    new TaxSlabSetting { From = 1700000, To = decimal.MaxValue, Rate = 0.20m }
                };
            }

            return new List<TaxSlabSetting>
            {
                new TaxSlabSetting { From = 0, To = 250000, Rate = 0.00m },
                new TaxSlabSetting { From = 250000, To = 500000, Rate = 0.05m },
                new TaxSlabSetting { From = 500000, To = 1000000, Rate = 0.20m },
                new TaxSlabSetting { From = 1000000, To = decimal.MaxValue, Rate = 0.30m }
            };
        }

        private static decimal CalculateTaxBySlabs(decimal taxableIncome, List<TaxSlabSetting> slabs)
        {
            var tax = 0m;
            foreach (var slab in slabs.OrderBy(s => s.From))
            {
                if (taxableIncome <= slab.From)
                {
                    break;
                }

                var upper = Math.Min(taxableIncome, slab.To);
                var taxable = upper - slab.From;
                if (taxable > 0)
                {
                    tax += taxable * slab.Rate;
                }
            }

            return tax;
        }

        // ==================== PROVIDENT FUND OPERATIONS ====================
        #region Provident Fund Operations

        public async Task<ProvidentFund?> GetProvidentFundByIdAsync(Guid id)
        {
            return await _context.ProvidentFunds
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        }

        public async Task<ProvidentFund?> GetProvidentFundByEmployeeAsync(Guid employeeId)
        {
            return await _context.ProvidentFunds
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.EmployeeId == employeeId && !p.IsDeleted);
        }

        public async Task<List<ProvidentFund>> GetAllProvidentFundsAsync(int pageNumber = 1, int pageSize = 10)
        {
            return await _context.ProvidentFunds
                .AsNoTracking()
                .OrderByDescending(p => p.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<List<ProvidentFund>> GetProvidentFundsByFinancialYearAsync(int financialYear)
        {
            return await _context.ProvidentFunds
                .AsNoTracking()
                .Where(p => p.FinancialYear == financialYear && !p.IsDeleted)
                .OrderBy(p => p.EmployeeName)
                .ToListAsync();
        }

        public async Task<List<ProvidentFund>> GetProvidentFundsByDepartmentAsync(Guid departmentId)
        {
            return await _context.ProvidentFunds
                .AsNoTracking()
                .Where(p => p.DepartmentId == departmentId && !p.IsDeleted)
                .OrderBy(p => p.EmployeeName)
                .ToListAsync();
        }

        public async Task<List<ProvidentFund>> GetProvidentFundsByStatusAsync(string status)
        {
            return await _context.ProvidentFunds
                .AsNoTracking()
                .Where(p => p.Status.ToString() == status && !p.IsDeleted)
                .OrderBy(p => p.EmployeeName)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalPFBalanceByDepartmentAsync(Guid departmentId)
        {
            return await _context.ProvidentFunds
                .Where(p => p.DepartmentId == departmentId && !p.IsDeleted)
                .SumAsync(p => p.TotalBalance);
        }

        public async Task<decimal> GetTotalPFBalanceByCompanyAsync()
        {
            return await _context.ProvidentFunds
                .Where(p => !p.IsDeleted)
                .SumAsync(p => p.TotalBalance);
        }

        public async Task<ProvidentFund> CreateProvidentFundAsync(ProvidentFund pf)
        {
            pf.CreatedAt = DateTime.UtcNow;
            pf.UpdatedAt = DateTime.UtcNow;
            var pfCeiling = await GetPFCeilingAsync(pf.FinancialYear > 0 ? pf.FinancialYear : DateTime.UtcNow.Year);
            var calc = UabIndia.Core.Services.IndiaStatutoryCalculator.CalculatePf(pf.BasicSalary, pf.DA, pfCeiling > 0 ? pfCeiling : DefaultPfCeiling);
            pf.PFWages = calc.PfWages;
            pf.EmployeeContribution = calc.EmployeeContribution;
            pf.EmployerContributionPF = calc.EmployerEpf;
            pf.EmployerContributionEPS = calc.EmployerEps;
            pf.AdminCharges = calc.AdminCharges;
            pf.TotalContribution = calc.TotalPf;
            pf.TotalBalance = calc.TotalPf;

            _context.ProvidentFunds.Add(pf);
            await _context.SaveChangesAsync();
            return pf;
        }

        public async Task<ProvidentFund> UpdateProvidentFundAsync(ProvidentFund pf)
        {
            pf.UpdatedAt = DateTime.UtcNow;
            var pfCeiling = await GetPFCeilingAsync(pf.FinancialYear > 0 ? pf.FinancialYear : DateTime.UtcNow.Year);
            var calc = UabIndia.Core.Services.IndiaStatutoryCalculator.CalculatePf(pf.BasicSalary, pf.DA, pfCeiling > 0 ? pfCeiling : DefaultPfCeiling);
            pf.PFWages = calc.PfWages;
            pf.EmployeeContribution = calc.EmployeeContribution;
            pf.EmployerContributionPF = calc.EmployerEpf;
            pf.EmployerContributionEPS = calc.EmployerEps;
            pf.AdminCharges = calc.AdminCharges;
            pf.TotalContribution = calc.TotalPf;

            _context.ProvidentFunds.Update(pf);
            await _context.SaveChangesAsync();
            return pf;
        }

        public async Task<bool> DeleteProvidentFundAsync(Guid id)
        {
            var pf = await _context.ProvidentFunds.FirstOrDefaultAsync(p => p.Id == id);
            if (pf == null) return false;

            pf.IsDeleted = true;
            pf.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<ProvidentFund>> GetPFClosuresAsync(int financialYear)
        {
            return await _context.ProvidentFunds
                .AsNoTracking()
                .Where(p => p.FinancialYear == financialYear && p.Status == PFStatus.Closed && !p.IsDeleted)
                .ToListAsync();
        }

        #endregion

        // ==================== PF WITHDRAWAL OPERATIONS ====================
        #region PF Withdrawal Operations

        public async Task<PFWithdrawal?> GetPFWithdrawalByIdAsync(Guid id)
        {
            return await _context.PFWithdrawals
                .AsNoTracking()
                .Include(w => w.ProvidentFund)
                .FirstOrDefaultAsync(w => w.Id == id && !w.IsDeleted);
        }

        public async Task<List<PFWithdrawal>> GetPFWithdrawalsByEmployeeAsync(Guid employeeId)
        {
            return await _context.PFWithdrawals
                .AsNoTracking()
                .Where(w => w.EmployeeId == employeeId && !w.IsDeleted)
                .OrderByDescending(w => w.ApplicationDate)
                .ToListAsync();
        }

        public async Task<List<PFWithdrawal>> GetAllPFWithdrawalsAsync(int pageNumber = 1, int pageSize = 10)
        {
            return await _context.PFWithdrawals
                .AsNoTracking()
                .OrderByDescending(w => w.ApplicationDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<List<PFWithdrawal>> GetPFWithdrawalsByStatusAsync(string status)
        {
            return await _context.PFWithdrawals
                .AsNoTracking()
                .Where(w => w.Status.ToString() == status && !w.IsDeleted)
                .OrderByDescending(w => w.ApplicationDate)
                .ToListAsync();
        }

        public async Task<List<PFWithdrawal>> GetPendingPFWithdrawalsAsync()
        {
            return await _context.PFWithdrawals
                .AsNoTracking()
                .Where(w => w.Status == WithdrawalStatus.Pending && !w.IsDeleted)
                .OrderBy(w => w.ApplicationDate)
                .ToListAsync();
        }

        public async Task<List<PFWithdrawal>> GetPFWithdrawalsByTypeAsync(string withdrawalType)
        {
            return await _context.PFWithdrawals
                .AsNoTracking()
                .Where(w => w.WithdrawalType.ToString() == withdrawalType && !w.IsDeleted)
                .OrderByDescending(w => w.ApplicationDate)
                .ToListAsync();
        }

        public async Task<List<PFWithdrawal>> GetPFWithdrawalsByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.PFWithdrawals
                .AsNoTracking()
                .Where(w => w.ApplicationDate >= startDate && w.ApplicationDate <= endDate && !w.IsDeleted)
                .OrderByDescending(w => w.ApplicationDate)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalWithdrawalByEmployeeAsync(Guid employeeId)
        {
            return await _context.PFWithdrawals
                .Where(w => w.EmployeeId == employeeId && w.Status == WithdrawalStatus.Completed && !w.IsDeleted)
                .SumAsync(w => w.WithdrawalAmount);
        }

        public async Task<PFWithdrawal> CreatePFWithdrawalAsync(PFWithdrawal withdrawal)
        {
            withdrawal.CreatedAt = DateTime.UtcNow;
            withdrawal.UpdatedAt = DateTime.UtcNow;
            withdrawal.ApplicationDate = DateTime.UtcNow;
            withdrawal.TDSOnWithdrawal = withdrawal.WithdrawalAmount * 0.20m; // 20% TDS for premature withdrawal

            _context.PFWithdrawals.Add(withdrawal);
            await _context.SaveChangesAsync();
            return withdrawal;
        }

        public async Task<PFWithdrawal> UpdatePFWithdrawalAsync(PFWithdrawal withdrawal)
        {
            withdrawal.UpdatedAt = DateTime.UtcNow;

            if (withdrawal.Status == WithdrawalStatus.Approved)
                withdrawal.ApprovedDate = DateTime.UtcNow;
            else if (withdrawal.Status == WithdrawalStatus.Rejected)
                withdrawal.RejectedDate = DateTime.UtcNow;
            else if (withdrawal.Status == WithdrawalStatus.Completed)
                withdrawal.ProcessedDate = DateTime.UtcNow;

            _context.PFWithdrawals.Update(withdrawal);
            await _context.SaveChangesAsync();
            return withdrawal;
        }

        public async Task<bool> DeletePFWithdrawalAsync(Guid id)
        {
            var withdrawal = await _context.PFWithdrawals.FirstOrDefaultAsync(w => w.Id == id);
            if (withdrawal == null) return false;

            withdrawal.IsDeleted = true;
            withdrawal.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<PFWithdrawal>> GetUnprocessedWithdrawalsAsync()
        {
            return await _context.PFWithdrawals
                .AsNoTracking()
                .Where(w => (w.Status == WithdrawalStatus.Approved || w.Status == WithdrawalStatus.Processing) && !w.IsDeleted)
                .OrderBy(w => w.ApprovedDate)
                .ToListAsync();
        }

        #endregion

        // ==================== ESI OPERATIONS ====================
        #region ESI Operations

        public async Task<EmployeeStateInsurance?> GetESIByIdAsync(Guid id)
        {
            return await _context.EmployeeStateInsurances
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
        }

        public async Task<EmployeeStateInsurance?> GetESIByEmployeeAsync(Guid employeeId)
        {
            return await _context.EmployeeStateInsurances
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId && !e.IsDeleted);
        }

        public async Task<List<EmployeeStateInsurance>> GetAllESIAsync(int pageNumber = 1, int pageSize = 10)
        {
            return await _context.EmployeeStateInsurances
                .AsNoTracking()
                .OrderBy(e => e.EmployeeName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<List<EmployeeStateInsurance>> GetESIByStateAsync(string stateCode)
        {
            return await _context.EmployeeStateInsurances
                .AsNoTracking()
                .Where(e => e.StateCode == stateCode && !e.IsDeleted)
                .OrderBy(e => e.EmployeeName)
                .ToListAsync();
        }

        public async Task<List<EmployeeStateInsurance>> GetESIByStatusAsync(string status)
        {
            return await _context.EmployeeStateInsurances
                .AsNoTracking()
                .Where(e => e.Status.ToString() == status && !e.IsDeleted)
                .ToListAsync();
        }

        public async Task<List<EmployeeStateInsurance>> GetEligibleESIEmployeesAsync()
        {
            return await _context.EmployeeStateInsurances
                .AsNoTracking()
                .Where(e => e.IsESIEligible && !e.IsDeleted)
                .OrderBy(e => e.EmployeeName)
                .ToListAsync();
        }

        public async Task<List<EmployeeStateInsurance>> GetESIByDateRangeAsync(int monthYear)
        {
            return await _context.EmployeeStateInsurances
                .AsNoTracking()
                .Where(e => e.MonthYear == monthYear && !e.IsDeleted)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalESIContributionAsync(int monthYear)
        {
            return await _context.EmployeeStateInsurances
                .Where(e => e.MonthYear == monthYear && e.IsESIEligible && !e.IsDeleted)
                .SumAsync(e => e.TotalContribution);
        }

        public async Task<EmployeeStateInsurance> CreateESIAsync(EmployeeStateInsurance esi)
        {
            esi.CreatedAt = DateTime.UtcNow;
            esi.UpdatedAt = DateTime.UtcNow;
            var esiCeiling = await GetESICeilingAsync(esi.FinancialYear > 0 ? esi.FinancialYear : DateTime.UtcNow.Year);
            var calc = UabIndia.Core.Services.IndiaStatutoryCalculator.CalculateEsi(esi.MonthlySalary, false, esiCeiling > 0 ? esiCeiling : DefaultEsiCeiling);
            esi.ESIWages = calc.EsiWages;
            esi.IsESIEligible = calc.IsEligible;
            esi.EmployeeContribution = calc.EmployeeContribution;
            esi.EmployerContribution = calc.EmployerContribution;
            esi.TotalContribution = calc.Total;

            _context.EmployeeStateInsurances.Add(esi);
            await _context.SaveChangesAsync();
            return esi;
        }

        public async Task<EmployeeStateInsurance> UpdateESIAsync(EmployeeStateInsurance esi)
        {
            esi.UpdatedAt = DateTime.UtcNow;
            var esiCeiling = await GetESICeilingAsync(esi.FinancialYear > 0 ? esi.FinancialYear : DateTime.UtcNow.Year);
            var calc = UabIndia.Core.Services.IndiaStatutoryCalculator.CalculateEsi(esi.MonthlySalary, false, esiCeiling > 0 ? esiCeiling : DefaultEsiCeiling);
            esi.ESIWages = calc.EsiWages;
            esi.IsESIEligible = calc.IsEligible;
            esi.EmployeeContribution = calc.EmployeeContribution;
            esi.EmployerContribution = calc.EmployerContribution;
            esi.TotalContribution = calc.Total;

            _context.EmployeeStateInsurances.Update(esi);
            await _context.SaveChangesAsync();
            return esi;
        }

        public async Task<bool> DeleteESIAsync(Guid id)
        {
            var esi = await _context.EmployeeStateInsurances.FirstOrDefaultAsync(e => e.Id == id);
            if (esi == null) return false;

            esi.IsDeleted = true;
            esi.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        #endregion

        // ==================== INCOME TAX OPERATIONS ====================
        #region Income Tax Operations

        public async Task<IncomeTax?> GetIncomeTaxByIdAsync(Guid id)
        {
            return await _context.IncomeTaxes
                .AsNoTracking()
                .FirstOrDefaultAsync(it => it.Id == id && !it.IsDeleted);
        }

        public async Task<IncomeTax?> GetIncomeTaxByEmployeeAsync(Guid employeeId)
        {
            return await _context.IncomeTaxes
                .AsNoTracking()
                .FirstOrDefaultAsync(it => it.EmployeeId == employeeId && !it.IsDeleted);
        }

        public async Task<List<IncomeTax>> GetAllIncomeTaxAsync(int pageNumber = 1, int pageSize = 10)
        {
            return await _context.IncomeTaxes
                .AsNoTracking()
                .OrderBy(it => it.EmployeeName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<List<IncomeTax>> GetIncomeTaxByFinancialYearAsync(int financialYear)
        {
            return await _context.IncomeTaxes
                .AsNoTracking()
                .Where(it => it.FinancialYear == financialYear && !it.IsDeleted)
                .OrderBy(it => it.EmployeeName)
                .ToListAsync();
        }

        public async Task<List<IncomeTax>> GetIncomeTaxByRegimeAsync(string regime)
        {
            return await _context.IncomeTaxes
                .AsNoTracking()
                .Where(it => it.TaxRegime.ToString() == regime && !it.IsDeleted)
                .ToListAsync();
        }

        public async Task<List<IncomeTax>> GetIncomeTaxByStatusAsync(string status)
        {
            return await _context.IncomeTaxes
                .AsNoTracking()
                .Where(it => it.Status.ToString() == status && !it.IsDeleted)
                .ToListAsync();
        }

        public async Task<decimal> CalculateTaxableIncomeAsync(Guid employeeId)
        {
            var it = await GetIncomeTaxByEmployeeAsync(employeeId);
            if (it == null) return 0;

            return await CalculateTaxableIncomeAsync(it);
        }

        private async Task<decimal> CalculateTaxableIncomeAsync(IncomeTax incomeTax)
        {
            var grossSalary = incomeTax.BasicSalary + incomeTax.DA + incomeTax.HRA +
                              incomeTax.SpecialAllowance + incomeTax.OtherAllowance;
            var standardDeduction = DefaultStandardDeduction;

            var deductions = 0m;
            if (incomeTax.TaxRegime == TaxRegime.OldRegime)
            {
                var declaration = await _context.TaxDeclarations
                    .AsNoTracking()
                    .Where(td => td.EmployeeId == incomeTax.EmployeeId && td.FinancialYear == incomeTax.FinancialYear && !td.IsDeleted)
                    .OrderByDescending(td => td.DeclarationDate)
                    .FirstOrDefaultAsync();

                deductions = (declaration?.TotalDeductionsUnderOldRegime ?? 0m) + (declaration?.HRAClaim ?? 0m);
            }

            return Math.Max(0, grossSalary - standardDeduction - deductions);
        }

        public async Task<decimal> CalculateTaxLiabilityAsync(Guid employeeId, string regime)
        {
            var taxableIncome = await CalculateTaxableIncomeAsync(employeeId);
            var slabs = await GetTaxSlabsAsync(DateTime.UtcNow.Year, regime);
            var baseTax = CalculateTaxBySlabs(taxableIncome, slabs);

            var rebateThreshold = string.Equals(regime, "NewRegime", StringComparison.OrdinalIgnoreCase)
                ? 1200000m
                : 500000m;

            var rebate = taxableIncome <= rebateThreshold ? baseTax : 0m;
            var taxAfterRebate = Math.Max(0, baseTax - rebate);
            var cess = taxAfterRebate * 0.04m;

            return taxAfterRebate + cess;
        }

        public async Task<decimal> GetTotalTDSDeductedAsync(Guid employeeId)
        {
            var it = await GetIncomeTaxByEmployeeAsync(employeeId);
            if (it == null)
            {
                return 0;
            }

            return it.TDSDeducted;
        }

        public async Task<decimal> GetTaxRefundableAsync(Guid employeeId)
        {
            var it = await GetIncomeTaxByEmployeeAsync(employeeId);
            if (it == null) return 0;

            var totalPayments = it.TDSDeducted + it.AdvanceTaxPaid;
            return Math.Max(0, totalPayments - it.TotalTaxLiability);
        }

        private async Task ApplyIncomeTaxCalculationsAsync(IncomeTax incomeTax)
        {
            incomeTax.GrossSalary = incomeTax.BasicSalary + incomeTax.DA + incomeTax.HRA +
                                    incomeTax.SpecialAllowance + incomeTax.OtherAllowance;

            incomeTax.StandardDeduction = DefaultStandardDeduction;
            incomeTax.TaxableIncome = await CalculateTaxableIncomeAsync(incomeTax);

            var slabs = await GetTaxSlabsAsync(incomeTax.FinancialYear, incomeTax.TaxRegime.ToString());
            var baseTax = CalculateTaxBySlabs(incomeTax.TaxableIncome, slabs);

            var rebateThreshold = incomeTax.TaxRegime == TaxRegime.NewRegime ? 1200000m : 500000m;
            incomeTax.RebateUnder87A = incomeTax.TaxableIncome <= rebateThreshold ? baseTax : 0m;
            incomeTax.TaxAfterRebate = Math.Max(0, baseTax - incomeTax.RebateUnder87A);

            incomeTax.SurCharge = 0m;
            incomeTax.HealthEducationCess = incomeTax.TaxAfterRebate * 0.04m;
            incomeTax.TotalTaxLiability = incomeTax.TaxAfterRebate + incomeTax.HealthEducationCess + incomeTax.SurCharge;

            incomeTax.TotalPaymentsMade = incomeTax.TDSDeducted + incomeTax.AdvanceTaxPaid;
            incomeTax.TaxRefundable = Math.Max(0, incomeTax.TotalPaymentsMade - incomeTax.TotalTaxLiability);
        }

        public async Task<IncomeTax> CreateIncomeTaxAsync(IncomeTax incomeTax)
        {
            incomeTax.CreatedAt = DateTime.UtcNow;
            incomeTax.UpdatedAt = DateTime.UtcNow;
            incomeTax.CalculatedDate = DateTime.UtcNow;
            await ApplyIncomeTaxCalculationsAsync(incomeTax);

            _context.IncomeTaxes.Add(incomeTax);
            await _context.SaveChangesAsync();
            return incomeTax;
        }

        public async Task<IncomeTax> UpdateIncomeTaxAsync(IncomeTax incomeTax)
        {
            incomeTax.UpdatedAt = DateTime.UtcNow;
            await ApplyIncomeTaxCalculationsAsync(incomeTax);

            _context.IncomeTaxes.Update(incomeTax);
            await _context.SaveChangesAsync();
            return incomeTax;
        }

        public async Task<bool> DeleteIncomeTaxAsync(Guid id)
        {
            var it = await _context.IncomeTaxes.FirstOrDefaultAsync(x => x.Id == id);
            if (it == null) return false;

            it.IsDeleted = true;
            it.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        #endregion

        // ==================== PROFESSIONAL TAX OPERATIONS ====================
        #region Professional Tax Operations

        public async Task<ProfessionalTax?> GetPTByIdAsync(Guid id)
        {
            return await _context.ProfessionalTaxes
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        }

        public async Task<ProfessionalTax?> GetPTByEmployeeAsync(Guid employeeId)
        {
            return await _context.ProfessionalTaxes
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.EmployeeId == employeeId && !p.IsDeleted);
        }

        public async Task<List<ProfessionalTax>> GetAllPTAsync(int pageNumber = 1, int pageSize = 10)
        {
            return await _context.ProfessionalTaxes
                .AsNoTracking()
            .Where(p => !p.IsDeleted)
                .OrderBy(p => p.EmployeeName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<List<ProfessionalTax>> GetPTByStateAsync(string stateCode)
        {
            return await _context.ProfessionalTaxes
                .AsNoTracking()
                .Where(p => p.StateCode == stateCode && !p.IsDeleted)
                .OrderBy(p => p.EmployeeName)
                .ToListAsync();
        }

        public async Task<List<ProfessionalTax>> GetPTByFinancialYearAsync(int financialYear)
        {
            return await _context.ProfessionalTaxes
                .AsNoTracking()
                .Where(p => p.FinancialYear == financialYear && !p.IsDeleted)
                .OrderBy(p => p.EmployeeName)
                .ToListAsync();
        }

        public async Task<List<ProfessionalTax>> GetPTByStatusAsync(string status)
        {
            return await _context.ProfessionalTaxes
                .AsNoTracking()
                .Where(p => p.Status.ToString() == status && !p.IsDeleted)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalPTDeductionAsync(string stateCode, int monthYear)
        {
            return await _context.ProfessionalTaxes
            .Where(p => p.StateCode == stateCode && p.MonthYear == monthYear && !p.IsDeleted)
                .SumAsync(p => p.PTDeduction);
        }

        private async Task<decimal> GetProfessionalTaxDeductionAsync(string stateCode, int financialYear, decimal monthlySalary)
        {
            var key = $"PT_SLAB_{stateCode}_FY{financialYear}";
            var setting = await _context.StatutorySettings
                .AsNoTracking()
                .Where(s => s.SettingKey == key && s.IsActive && !s.IsDeleted)
                .OrderByDescending(s => s.EffectiveFrom)
                .FirstOrDefaultAsync();

            if (setting == null || string.IsNullOrWhiteSpace(setting.SettingValue))
            {
                return UabIndia.Core.Services.IndiaStatutoryCalculator.CalculateProfessionalTax(stateCode, monthlySalary, DateTime.UtcNow.Month);
            }

            try
            {
                var slabs = JsonSerializer.Deserialize<List<TaxSlabSetting>>(setting.SettingValue) ?? new List<TaxSlabSetting>();
                var slab = slabs.FirstOrDefault(s => monthlySalary >= s.From && monthlySalary <= s.To);
                return slab?.Rate ?? 0m;
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Invalid PT slab JSON for {SettingKey}", key);
                return 0m;
            }
        }

        public async Task<List<ProfessionalTax>> GetPTExemptEmployeesAsync()
        {
            return await _context.ProfessionalTaxes
                .AsNoTracking()
                .Where(p => p.IsPTExempt && !p.IsDeleted)
                .ToListAsync();
        }

        public async Task<ProfessionalTax> CreatePTAsync(ProfessionalTax pt)
        {
            pt.CreatedAt = DateTime.UtcNow;
            pt.UpdatedAt = DateTime.UtcNow;
            var financialYear = pt.FinancialYear > 0 ? pt.FinancialYear : DateTime.UtcNow.Year;
            pt.PTDeduction = await GetProfessionalTaxDeductionAsync(pt.StateCode, financialYear, pt.MonthlySalary);
            pt.IsPTExempt = pt.PTDeduction <= 0;

            _context.ProfessionalTaxes.Add(pt);
            await _context.SaveChangesAsync();
            return pt;
        }

        public async Task<ProfessionalTax> UpdatePTAsync(ProfessionalTax pt)
        {
            pt.UpdatedAt = DateTime.UtcNow;
            var financialYear = pt.FinancialYear > 0 ? pt.FinancialYear : DateTime.UtcNow.Year;
            pt.PTDeduction = await GetProfessionalTaxDeductionAsync(pt.StateCode, financialYear, pt.MonthlySalary);
            pt.IsPTExempt = pt.PTDeduction <= 0;
            _context.ProfessionalTaxes.Update(pt);
            await _context.SaveChangesAsync();
            return pt;
        }

        public async Task<bool> DeletePTAsync(Guid id)
        {
            var pt = await _context.ProfessionalTaxes.FirstOrDefaultAsync(p => p.Id == id);
            if (pt == null) return false;

            pt.IsDeleted = true;
            pt.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        #endregion

        // ==================== TAX DECLARATION OPERATIONS ====================
        #region Tax Declaration Operations

        public async Task<TaxDeclaration?> GetTaxDeclarationByIdAsync(Guid id)
        {
            return await _context.TaxDeclarations
                .AsNoTracking()
                .FirstOrDefaultAsync(td => td.Id == id && !td.IsDeleted);
        }

        public async Task<TaxDeclaration?> GetTaxDeclarationByEmployeeAsync(Guid employeeId, int financialYear)
        {
            return await _context.TaxDeclarations
                .AsNoTracking()
                .FirstOrDefaultAsync(td => td.EmployeeId == employeeId && td.FinancialYear == financialYear && !td.IsDeleted);
        }

        public async Task<List<TaxDeclaration>> GetAllTaxDeclarationsAsync(int pageNumber = 1, int pageSize = 10)
        {
            return await _context.TaxDeclarations
                .AsNoTracking()
                .OrderBy(td => td.EmployeeName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<List<TaxDeclaration>> GetTaxDeclarationsByFinancialYearAsync(int financialYear)
        {
            return await _context.TaxDeclarations
                .AsNoTracking()
                .Where(td => td.FinancialYear == financialYear && !td.IsDeleted)
                .OrderBy(td => td.EmployeeName)
                .ToListAsync();
        }

        public async Task<List<TaxDeclaration>> GetPendingProofSubmissionsAsync()
        {
            return await _context.TaxDeclarations
                .AsNoTracking()
                .Where(td => !td.ProofSubmitted && td.ProofSubmissionDeadline >= DateTime.UtcNow && !td.IsDeleted)
                .OrderBy(td => td.ProofSubmissionDeadline)
                .ToListAsync();
        }

        public async Task<List<TaxDeclaration>> GetTaxDeclarationsByStatusAsync(string status)
        {
            return await _context.TaxDeclarations
                .AsNoTracking()
                .Where(td => td.Status.ToString() == status && !td.IsDeleted)
                .ToListAsync();
        }

        public async Task<decimal> GetTotal80CDeductionAsync(Guid employeeId)
        {
            var declaration = await _context.TaxDeclarations
                .AsNoTracking()
                .Where(td => td.EmployeeId == employeeId && !td.IsDeleted)
                .OrderByDescending(td => td.FinancialYear)
                .FirstOrDefaultAsync();

            if (declaration == null)
            {
                return 0;
            }

            return declaration.Section80C_Total;
        }

        public async Task<decimal> GetTotalDeductionsAsync(Guid employeeId)
        {
            var declaration = await _context.TaxDeclarations
                .AsNoTracking()
                .Where(td => td.EmployeeId == employeeId && !td.IsDeleted)
                .OrderByDescending(td => td.FinancialYear)
                .FirstOrDefaultAsync();

            if (declaration == null) return 0;

            return declaration.Section80C_Total + declaration.Section80D_Total + 
                   declaration.Section80E_InterestOnEducationLoan + declaration.OtherDeductions;
        }

        public async Task<TaxDeclaration> CreateTaxDeclarationAsync(TaxDeclaration declaration)
        {
            declaration.CreatedAt = DateTime.UtcNow;
            declaration.UpdatedAt = DateTime.UtcNow;
            declaration.DeclarationDate = DateTime.UtcNow;
            declaration.ProofSubmissionDeadline = new DateTime(declaration.FinancialYear, 6, 30);
            declaration.TotalDeductionsUnderOldRegime = declaration.Section80C_Total + 
                                                        declaration.Section80D_Total + 
                                                        declaration.Section80G_DeductionClaimed;

            _context.TaxDeclarations.Add(declaration);
            await _context.SaveChangesAsync();
            return declaration;
        }

        public async Task<TaxDeclaration> UpdateTaxDeclarationAsync(TaxDeclaration declaration)
        {
            declaration.UpdatedAt = DateTime.UtcNow;
            declaration.TotalDeductionsUnderOldRegime = declaration.Section80C_Total + 
                                                        declaration.Section80D_Total + 
                                                        declaration.Section80G_DeductionClaimed;

            if (declaration.ProofSubmitted && !declaration.ProofSubmittedDate.HasValue)
                declaration.ProofSubmittedDate = DateTime.UtcNow;

            _context.TaxDeclarations.Update(declaration);
            await _context.SaveChangesAsync();
            return declaration;
        }

        #endregion

        // ==================== COMPLIANCE REPORT OPERATIONS ====================
        #region Compliance Report Operations

        public async Task<ComplianceReport?> GetComplianceReportByIdAsync(Guid id)
        {
            return await _context.ComplianceReports
                .AsNoTracking()
                .FirstOrDefaultAsync(cr => cr.Id == id && !cr.IsDeleted);
        }

        public async Task<List<ComplianceReport>> GetAllComplianceReportsAsync(int pageNumber = 1, int pageSize = 10)
        {
            return await _context.ComplianceReports
                .AsNoTracking()
                .OrderByDescending(cr => cr.GeneratedDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<List<ComplianceReport>> GetComplianceReportsByTypeAsync(string reportType)
        {
            return await _context.ComplianceReports
                .AsNoTracking()
                .Where(cr => cr.ReportType == reportType && !cr.IsDeleted)
                .OrderByDescending(cr => cr.GeneratedDate)
                .ToListAsync();
        }

        public async Task<List<ComplianceReport>> GetComplianceReportsByFinancialYearAsync(int financialYear)
        {
            return await _context.ComplianceReports
                .AsNoTracking()
                .Where(cr => cr.FinancialYear == financialYear && !cr.IsDeleted)
                .OrderByDescending(cr => cr.MonthYear)
                .ToListAsync();
        }

        public async Task<List<ComplianceReport>> GetComplianceReportsByMonthAsync(int monthYear)
        {
            return await _context.ComplianceReports
                .AsNoTracking()
                .Where(cr => cr.MonthYear == monthYear && !cr.IsDeleted)
                .OrderBy(cr => cr.ReportType)
                .ToListAsync();
        }

        public async Task<List<ComplianceReport>> GetComplianceReportsByStatusAsync(string status)
        {
            return await _context.ComplianceReports
                .AsNoTracking()
                .Where(cr => cr.Status.ToString() == status && !cr.IsDeleted)
                .OrderByDescending(cr => cr.GeneratedDate)
                .ToListAsync();
        }

        public async Task<List<ComplianceReport>> GetPendingSubmissionReportsAsync()
        {
            return await _context.ComplianceReports
                .AsNoTracking()
                .Where(cr => (cr.Status == ComplianceReportStatus.Generated || cr.Status == ComplianceReportStatus.Pending) 
                            && cr.SubmissionDeadline >= DateTime.UtcNow && !cr.IsDeleted)
                .OrderBy(cr => cr.SubmissionDeadline)
                .ToListAsync();
        }

        public async Task<ComplianceReport?> GetLatestReportByTypeAsync(string reportType)
        {
            return await _context.ComplianceReports
                .AsNoTracking()
                .Where(cr => cr.ReportType == reportType && !cr.IsDeleted)
                .OrderByDescending(cr => cr.GeneratedDate)
                .FirstOrDefaultAsync();
        }

        public async Task<ComplianceReport> CreateComplianceReportAsync(ComplianceReport report)
        {
            report.CreatedAt = DateTime.UtcNow;
            report.UpdatedAt = DateTime.UtcNow;
            report.GeneratedDate = DateTime.UtcNow;

            _context.ComplianceReports.Add(report);
            await _context.SaveChangesAsync();
            return report;
        }

        public async Task<ComplianceReport> UpdateComplianceReportAsync(ComplianceReport report)
        {
            report.UpdatedAt = DateTime.UtcNow;
            _context.ComplianceReports.Update(report);
            await _context.SaveChangesAsync();
            return report;
        }

        #endregion

        // ==================== COMPLIANCE AUDIT OPERATIONS ====================
        #region Compliance Audit Operations

        public async Task<ComplianceAudit?> GetComplianceAuditByIdAsync(Guid id)
        {
            return await _context.ComplianceAudits
                .AsNoTracking()
                .FirstOrDefaultAsync(ca => ca.Id == id && !ca.IsDeleted);
        }

        public async Task<List<ComplianceAudit>> GetAllComplianceAuditsAsync(int pageNumber = 1, int pageSize = 10)
        {
            return await _context.ComplianceAudits
                .AsNoTracking()
                .OrderByDescending(ca => ca.AuditDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<List<ComplianceAudit>> GetComplianceAuditsByTypeAsync(string auditType)
        {
            return await _context.ComplianceAudits
                .AsNoTracking()
                .Where(ca => ca.AuditType == auditType && !ca.IsDeleted)
                .OrderByDescending(ca => ca.AuditDate)
                .ToListAsync();
        }

        public async Task<List<ComplianceAudit>> GetComplianceAuditsByFinancialYearAsync(int financialYear)
        {
            return await _context.ComplianceAudits
                .AsNoTracking()
                .Where(ca => ca.FinancialYear == financialYear && !ca.IsDeleted)
                .OrderByDescending(ca => ca.AuditDate)
                .ToListAsync();
        }

        public async Task<List<ComplianceAudit>> GetComplianceAuditsByStatusAsync(string status)
        {
            return await _context.ComplianceAudits
                .AsNoTracking()
                .Where(ca => ca.Status.ToString() == status && !ca.IsDeleted)
                .OrderByDescending(ca => ca.AuditDate)
                .ToListAsync();
        }

        public async Task<List<ComplianceAudit>> GetInProgressAuditsAsync()
        {
            return await _context.ComplianceAudits
                .AsNoTracking()
                .Where(ca => ca.Status == AuditStatus.InProgress && !ca.IsDeleted)
                .OrderBy(ca => ca.StartDate)
                .ToListAsync();
        }

        public async Task<List<ComplianceAudit>> GetCompletedAuditsAsync()
        {
            return await _context.ComplianceAudits
                .AsNoTracking()
                .Where(ca => ca.Status == AuditStatus.Completed && !ca.IsDeleted)
                .OrderByDescending(ca => ca.CompletionDate)
                .ToListAsync();
        }

        public async Task<int> GetTotalDiscrepanciesByTypeAsync(string auditType)
        {
            return await _context.ComplianceAudits
                .Where(ca => ca.AuditType == auditType && !ca.IsDeleted)
                .SumAsync(ca => ca.DiscrepanciesFound);
        }

        public async Task<ComplianceAudit> CreateComplianceAuditAsync(ComplianceAudit audit)
        {
            audit.CreatedAt = DateTime.UtcNow;
            audit.UpdatedAt = DateTime.UtcNow;
            audit.AuditDate = DateTime.UtcNow;

            _context.ComplianceAudits.Add(audit);
            await _context.SaveChangesAsync();
            return audit;
        }

        public async Task<ComplianceAudit> UpdateComplianceAuditAsync(ComplianceAudit audit)
        {
            audit.UpdatedAt = DateTime.UtcNow;
            if (audit.Status == AuditStatus.Completed)
                audit.CompletionDate = DateTime.UtcNow;

            _context.ComplianceAudits.Update(audit);
            await _context.SaveChangesAsync();
            return audit;
        }

        #endregion

        // ==================== STATUTORY SETTINGS OPERATIONS ====================
        #region Statutory Settings Operations

        public async Task<StatutorySettings?> GetSettingByKeyAsync(string settingKey)
        {
            return await _context.StatutorySettings
                .AsNoTracking()
                .Where(s => s.SettingKey == settingKey && s.IsActive && !s.IsDeleted)
                .OrderByDescending(s => s.EffectiveFrom)
                .FirstOrDefaultAsync();
        }

        public async Task<List<StatutorySettings>> GetAllActiveSettingsAsync()
        {
            return await _context.StatutorySettings
                .AsNoTracking()
                .Where(s => s.IsActive && !s.IsDeleted)
                .OrderBy(s => s.SettingKey)
                .ToListAsync();
        }

        public async Task<List<StatutorySettings>> GetSettingsByFinancialYearAsync(int financialYear)
        {
            return await _context.StatutorySettings
                .AsNoTracking()
                .Where(s => s.FinancialYear == financialYear && s.IsActive && !s.IsDeleted)
                .OrderBy(s => s.SettingKey)
                .ToListAsync();
        }

        public async Task<decimal> GetPFCeilingAsync(int financialYear)
        {
            var setting = await GetSettingByKeyAsync("PF_CEILING");
            return setting != null ? decimal.Parse(setting.SettingValue) : 15000;
        }

        public async Task<decimal> GetESICeilingAsync(int financialYear)
        {
            var setting = await GetSettingByKeyAsync("ESI_CEILING");
            return setting != null ? decimal.Parse(setting.SettingValue) : 21000;
        }

        public async Task<List<StatutorySettings>> GetTaxSlabsByYearAsync(int financialYear)
        {
            return await _context.StatutorySettings
                .AsNoTracking()
                .Where(s => s.SettingKey.StartsWith("IT_SLAB") && s.FinancialYear == financialYear && 
                           s.IsActive && !s.IsDeleted)
                .ToListAsync();
        }

        public async Task<StatutorySettings> CreateStatutorySettingAsync(StatutorySettings setting)
        {
            setting.CreatedAt = DateTime.UtcNow;
            setting.UpdatedAt = DateTime.UtcNow;

            _context.StatutorySettings.Add(setting);
            await _context.SaveChangesAsync();
            return setting;
        }

        public async Task<StatutorySettings> UpdateStatutorySettingAsync(StatutorySettings setting)
        {
            setting.UpdatedAt = DateTime.UtcNow;
            _context.StatutorySettings.Update(setting);
            await _context.SaveChangesAsync();
            return setting;
        }

        #endregion

        // ==================== COMPLIANCE STATISTICS ====================
        #region Compliance Statistics

        public async Task<int> GetTotalPFEmployeesAsync()
        {
            return await _context.ProvidentFunds
                .Where(p => !p.IsDeleted && p.Status == PFStatus.Active)
                .CountAsync();
        }

        public async Task<int> GetTotalESIEligibleEmployeesAsync()
        {
            return await _context.EmployeeStateInsurances
                .Where(e => !e.IsDeleted && e.IsESIEligible && e.Status == ESIStatus.Active)
                .CountAsync();
        }

        public async Task<decimal> GetTotalComplianceDeductionsAsync(Guid employeeId, int monthYear)
        {
            var pfDeduction = await _context.ProvidentFunds
                .Where(p => p.EmployeeId == employeeId && !p.IsDeleted)
                .SumAsync(p => p.EmployeeContribution);

            var esiDeduction = await _context.EmployeeStateInsurances
                .Where(e => e.EmployeeId == employeeId && e.MonthYear == monthYear && !e.IsDeleted)
                .SumAsync(e => e.EmployeeContribution);

            var itDeduction = await _context.IncomeTaxes
                .Where(it => it.EmployeeId == employeeId && !it.IsDeleted)
                .SumAsync(it => it.TDSDeducted);

            var ptDeduction = await _context.ProfessionalTaxes
                .Where(p => p.EmployeeId == employeeId && !p.IsDeleted)
                .SumAsync(p => p.PTDeduction);

            return pfDeduction + esiDeduction + itDeduction + ptDeduction;
        }

        public async Task<decimal> GetMonthlyComplianceOutflowAsync(int monthYear)
        {
            var pfContributions = await _context.ProvidentFunds
                .Where(p => !p.IsDeleted)
                .SumAsync(p => p.TotalContribution);

            var esiContributions = await _context.EmployeeStateInsurances
                .Where(e => e.MonthYear == monthYear && !e.IsDeleted)
                .SumAsync(e => e.TotalContribution);

            return pfContributions + esiContributions;
        }

        public async Task<Dictionary<string, decimal>> GetComplianceBreakdownByTypeAsync(int monthYear)
        {
            var breakdown = new Dictionary<string, decimal>();

            breakdown["PF"] = await _context.ProvidentFunds
                .Where(p => !p.IsDeleted)
                .SumAsync(p => p.TotalContribution);

            breakdown["ESI"] = await _context.EmployeeStateInsurances
                .Where(e => e.MonthYear == monthYear && !e.IsDeleted)
                .SumAsync(e => e.TotalContribution);

            breakdown["IT"] = await _context.IncomeTaxes
                .Where(it => !it.IsDeleted)
                .SumAsync(it => it.TDSDeducted);

            breakdown["PT"] = await _context.ProfessionalTaxes
                .Where(p => !p.IsDeleted)
                .SumAsync(p => p.PTDeduction);

            return breakdown;
        }

        public async Task<List<string>> GetNonCompliantEmployeesAsync(int financialYear)
        {
            var nonCompliant = new List<string>();

            // Find employees without PF registration
            var noPF = await _context.ProvidentFunds
                .Where(p => !p.IsDeleted && p.FinancialYear == financialYear)
                .Select(p => p.EmployeeId)
                .ToListAsync();

            // Find employees in low salary category without ESI
            var lowSalaryNoESI = await _context.EmployeeStateInsurances
                .Where(e => !e.IsDeleted && e.MonthlySalary < 21000 && !e.IsESIEligible)
                .Select(e => e.EmployeeNumber)
                .ToListAsync();

            nonCompliant.AddRange(lowSalaryNoESI);

            return nonCompliant;
        }

        #endregion
    }
}
