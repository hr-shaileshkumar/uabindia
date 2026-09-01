using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Payroll.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Authorize(Policy = "Module:payroll")]
    public class PayrollController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IPayrollEngine _payrollEngine;
        private readonly IDocumentNumberService _numbers;
        private readonly IExpenseClaimService _expenseClaims;
        private readonly IPayrollSettlementService _settlements;
        private readonly IPayrollEmployeeFinanceService _employeeFinance;

        public PayrollController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IPayrollEngine payrollEngine,
            IDocumentNumberService numbers,
            IExpenseClaimService expenseClaims,
            IPayrollSettlementService settlements,
            IPayrollEmployeeFinanceService employeeFinance)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _payrollEngine = payrollEngine;
            _numbers = numbers;
            _expenseClaims = expenseClaims;
            _settlements = settlements;
            _employeeFinance = employeeFinance;
        }

        // ===== SALARY STRUCTURES =====

        [HttpGet("structures")]
        public async Task<IActionResult> GetStructures()
        {
            var data = await _db.PayrollStructures
                .AsNoTracking()
                .OrderByDescending(s => s.EffectiveFrom)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("structures/{id}")]
        public async Task<IActionResult> GetStructure(Guid id)
        {
            var structure = await _db.PayrollStructures
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == id);

            if (structure == null)
                return NotFound(new { message = "Structure not found" });

            return Ok(structure);
        }

        [HttpPost("structures")]
        public async Task<IActionResult> CreateStructure([FromBody] CreatePayrollStructureDto dto)
        {
            if (!ModelState.IsValid) 
                return BadRequest(ModelState);

            var structure = new PayrollStructure
            {
                Name = dto.Name,
                EffectiveFrom = dto.EffectiveFrom,
                EffectiveTo = dto.EffectiveTo
            };

            _db.PayrollStructures.Add(structure);
            await _db.SaveChangesAsync();

            return Ok(structure);
        }

        [HttpPut("structures/{id}")]
        public async Task<IActionResult> UpdateStructure(Guid id, [FromBody] UpdatePayrollStructureDto dto)
        {
            var structure = await _db.PayrollStructures.FindAsync(id);
            if (structure == null)
                return NotFound(new { message = "Structure not found" });

            structure.Name = dto.Name;
            structure.EffectiveFrom = dto.EffectiveFrom;
            structure.EffectiveTo = dto.EffectiveTo;

            await _db.SaveChangesAsync();
            return Ok(structure);
        }

        [HttpDelete("structures/{id}")]
        public async Task<IActionResult> DeleteStructure(Guid id)
        {
            var structure = await _db.PayrollStructures.FindAsync(id);
            if (structure == null)
                return NotFound(new { message = "Structure not found" });

            structure.IsDeleted = true;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Structure deleted successfully" });
        }

        // ===== PAYROLL COMPONENTS =====

        [HttpGet("components")]
        public async Task<IActionResult> GetComponents([FromQuery] Guid? structureId)
        {
            var query = _db.PayrollComponents.AsNoTracking();

            if (structureId.HasValue)
                query = query.Where(c => c.StructureId == structureId.Value);

            var data = await query.OrderBy(c => c.Name).ToListAsync();
            return Ok(data);
        }

        [HttpGet("components/{id}")]
        public async Task<IActionResult> GetComponent(Guid id)
        {
            var component = await _db.PayrollComponents
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (component == null)
                return NotFound(new { message = "Component not found" });

            return Ok(component);
        }

        [HttpPost("components")]
        public async Task<IActionResult> CreateComponent([FromBody] CreatePayrollComponentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var structureExists = await _db.PayrollStructures.AnyAsync(s => s.Id == dto.StructureId);
            if (!structureExists)
                return BadRequest(new { message = "Payroll structure not found. Create a structure first." });

            var component = new PayrollComponent
            {
                StructureId = dto.StructureId,
                Name = dto.Name,
                Type = dto.Type,
                Amount = dto.Amount,
                Percentage = dto.Percentage,
                IsStatutory = dto.IsStatutory
            };

            _db.PayrollComponents.Add(component);
            await _db.SaveChangesAsync();

            return Ok(component);
        }

        [HttpPut("components/{id}")]
        public async Task<IActionResult> UpdateComponent(Guid id, [FromBody] UpdatePayrollComponentDto dto)
        {
            var component = await _db.PayrollComponents.FindAsync(id);
            if (component == null)
                return NotFound(new { message = "Component not found" });

            component.Name = dto.Name;
            component.Type = dto.Type;
            component.Amount = dto.Amount;
            component.Percentage = dto.Percentage;
            component.IsStatutory = dto.IsStatutory;

            await _db.SaveChangesAsync();
            return Ok(component);
        }

        [HttpDelete("components/{id}")]
        public async Task<IActionResult> DeleteComponent(Guid id)
        {
            var component = await _db.PayrollComponents.FindAsync(id);
            if (component == null)
                return NotFound(new { message = "Component not found" });

            component.IsDeleted = true;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Component deleted successfully" });
        }

        // ===== PAYROLL RUNS =====

        [HttpGet("runs")]
        public async Task<IActionResult> GetRuns([FromQuery] string? status)
        {
            var query = _db.PayrollRuns.AsNoTracking();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(r => r.Status == status);

            var data = await query
                .OrderByDescending(r => r.RunDate)
                .Select(r => new PayrollRunDto
                {
                    Id = r.Id,
                    CompanyId = r.CompanyId,
                    RunDate = r.RunDate,
                    Status = r.Status
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("runs/{id}")]
        public async Task<IActionResult> GetRun(Guid id)
        {
            var run = await _db.PayrollRuns
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == id);

            if (run == null)
                return NotFound(new { message = "Payroll run not found" });

            return Ok(new PayrollRunDto
            {
                Id = run.Id,
                CompanyId = run.CompanyId,
                RunDate = run.RunDate,
                Status = run.Status
            });
        }

        [HttpPost("runs")]
        public async Task<IActionResult> CreateRun([FromBody] CreatePayrollRunDto dto)
        {
            if (!ModelState.IsValid) 
                return BadRequest(ModelState);

            var run = new PayrollRun
            {
                CompanyId = dto.CompanyId,
                RunDate = dto.RunDate,
                Status = "Draft",
                TenantId = _tenantAccessor.GetTenantId(),
                CreatedAt = DateTime.UtcNow
            };

            _db.PayrollRuns.Add(run);
            await _db.SaveChangesAsync();

            return Ok(new PayrollRunDto
            {
                Id = run.Id,
                CompanyId = run.CompanyId,
                RunDate = run.RunDate,
                Status = run.Status
            });
        }

        [HttpPost("runs/{id}/complete")]
        public async Task<IActionResult> CompleteRun(Guid id)
        {
            try
            {
                var result = await _payrollEngine.CompleteRunAsync(id);
                return Ok(new
                {
                    id = result.RunId,
                    payslipsGenerated = result.PayslipsGenerated,
                    statutoryRecordsGenerated = result.StatutoryRecordsGenerated,
                    journalEntryId = result.JournalEntryId,
                    totalGross = result.TotalGross,
                    totalNet = result.TotalNet,
                    status = "Completed",
                    message = result.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                    return NotFound(new { message = ex.Message });
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("runs/{id:guid}/bank-file")]
        public async Task<IActionResult> BankFile(Guid id)
        {
            var run = await _db.PayrollRuns.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);
            if (run == null) return NotFound(new { message = "Payroll run not found" });

            var rows = await (
                from p in _db.Payslips.AsNoTracking()
                join e in _db.Employees.AsNoTracking() on p.EmployeeId equals e.Id
                where p.PayrollRunId == id && !p.IsDeleted
                select new
                {
                    e.EmployeeCode,
                    e.FullName,
                    e.BankAccountHolder,
                    e.BankAccountNumber,
                    e.BankIfsc,
                    e.BankName,
                    p.Net
                }).ToListAsync();

            var csv = new StringBuilder();
            csv.AppendLine("EmployeeCode,BeneficiaryName,AccountNumber,IFSC,BankName,Amount,PaymentType");
            foreach (var row in rows.Where(r => r.Net > 0))
            {
                var name = Csv(row.BankAccountHolder ?? row.FullName ?? row.EmployeeCode);
                csv.AppendLine($"{Csv(row.EmployeeCode)},{name},{Csv(row.BankAccountNumber)},{Csv(row.BankIfsc)},{Csv(row.BankName)},{row.Net:0.00},NEFT");
            }

            return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"salary-neft-{run.RunDate:yyyyMM}.csv");
        }

        [HttpDelete("runs/{id}")]
        public async Task<IActionResult> DeleteRun(Guid id)
        {
            var run = await _db.PayrollRuns.FindAsync(id);
            if (run == null)
                return NotFound(new { message = "Payroll run not found" });

            if (run.Status == "Completed")
                return BadRequest(new { message = "Cannot delete completed payroll runs" });

            run.IsDeleted = true;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Payroll run deleted successfully" });
        }

        // ===== PAYSLIPS =====

        [HttpGet("payslips/me")]
        public async Task<IActionResult> GetMyPayslips()
        {
            var employeeId = await ResolveCurrentEmployeeIdAsync();
            if (employeeId == Guid.Empty)
                return NotFound(new { message = "No employee record linked to this user." });
            return await GetPayslips(null, employeeId);
        }

        [HttpGet("payslips")]
        public async Task<IActionResult> GetPayslips([FromQuery] Guid? runId, [FromQuery] Guid? employeeId)
        {
            var query = _db.Payslips.AsNoTracking();

            if (runId.HasValue)
                query = query.Where(p => p.PayrollRunId == runId.Value);

            if (employeeId.HasValue)
                query = query.Where(p => p.EmployeeId == employeeId.Value);

            var data = await (
                from p in query
                join r in _db.PayrollRuns.AsNoTracking() on p.PayrollRunId equals r.Id into runs
                from r in runs.DefaultIfEmpty()
                join e in _db.Employees.AsNoTracking() on p.EmployeeId equals e.Id into emps
                from e in emps.DefaultIfEmpty()
                select new PayslipDto
                {
                    Id = p.Id,
                    PayrollRunId = p.PayrollRunId,
                    EmployeeId = p.EmployeeId,
                    EmployeeName = e != null ? (e.FullName ?? e.EmployeeCode) : null,
                    Gross = p.Gross,
                    Net = p.Net,
                    TotalDeductions = p.Gross - p.Net,
                    Month = r != null ? r.RunDate.Month : p.CreatedAt.Month,
                    Year = r != null ? r.RunDate.Year : p.CreatedAt.Year,
                    Status = r != null && r.Status == "Completed" ? "Generated" : "Draft",
                    Details = p.Details
                }).ToListAsync();

            return Ok(data);
        }

        [HttpGet("payslips/{id:guid}")]
        public async Task<IActionResult> GetPayslip(Guid id)
        {
            var payslip = await _db.Payslips
                .AsNoTracking()
                .Include(p => p.Lines)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (payslip == null)
                return NotFound(new { message = "Payslip not found" });

            var run = await _db.PayrollRuns.AsNoTracking().FirstOrDefaultAsync(r => r.Id == payslip.PayrollRunId);
            var employee = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == payslip.EmployeeId);

            return Ok(new PayslipDto
            {
                Id = payslip.Id,
                PayrollRunId = payslip.PayrollRunId,
                EmployeeId = payslip.EmployeeId,
                EmployeeName = employee?.FullName ?? employee?.EmployeeCode,
                Gross = payslip.Gross,
                Net = payslip.Net,
                TotalDeductions = payslip.TotalDeductions > 0 ? payslip.TotalDeductions : payslip.Gross - payslip.Net,
                Basic = payslip.Basic,
                LopDays = payslip.LopDays,
                PayableDays = payslip.PayableDays,
                PfEmployee = payslip.PfEmployee,
                EsiEmployee = payslip.EsiEmployee,
                ProfessionalTax = payslip.ProfessionalTax,
                Tds = payslip.Tds,
                Month = run?.RunDate.Month ?? payslip.Month,
                Year = run?.RunDate.Year ?? payslip.Year,
                Status = run?.Status == "Completed" ? "Generated" : "Draft",
                Details = payslip.Details,
                Lines = payslip.Lines.OrderBy(l => l.SortOrder).Select(l => new PayslipLineDto
                {
                    Name = l.Name,
                    Type = l.Type,
                    Amount = l.Amount,
                    IsStatutory = l.IsStatutory
                }).ToList()
            });
        }

        [HttpGet("payslips/{id:guid}/download")]
        public async Task<IActionResult> DownloadPayslip(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var payslip = await _db.Payslips
                .AsNoTracking()
                .Include(p => p.Lines)
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);

            if (payslip == null)
                return NotFound(new { message = "Payslip not found" });

            var employee = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == payslip.EmployeeId);
            var title = $"Payslip {employee?.FullName ?? payslip.EmployeeId.ToString()} — {payslip.Month:00}/{payslip.Year}";
            var lines = new List<string>
            {
                $"Employee: {employee?.FullName} ({employee?.EmployeeCode})",
                $"Period: {payslip.Month:00}/{payslip.Year}",
                $"Payable days: {payslip.PayableDays}  LOP: {payslip.LopDays}",
                $"Basic: {payslip.Basic:0.00}",
                $"Gross Pay: {payslip.Gross:0.00}",
                $"Net Pay: {payslip.Net:0.00}",
                $"PF: {payslip.PfEmployee:0.00}  ESI: {payslip.EsiEmployee:0.00}  PT: {payslip.ProfessionalTax:0.00}  TDS: {payslip.Tds:0.00}",
                string.Empty,
                "Components:"
            };
            foreach (var line in payslip.Lines.OrderBy(l => l.SortOrder))
                lines.Add($"  {line.Type,-10} {line.Name,-28} {line.Amount,12:0.00}");

            if (!string.IsNullOrWhiteSpace(payslip.Details))
            {
                lines.Add(string.Empty);
                lines.Add("Details:");
                lines.Add(payslip.Details);
            }

            var pdfBytes = BuildSimplePdf(title, lines);
            return File(pdfBytes, "application/pdf", $"payslip-{id}.pdf");
        }

        [HttpPost("payslips")]
        public async Task<IActionResult> CreatePayslip([FromBody] CreatePayslipDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var payslip = new Payslip
            {
                PayrollRunId = dto.PayrollRunId,
                EmployeeId = dto.EmployeeId,
                Gross = dto.Gross,
                Net = dto.Net,
                Details = dto.Details
            };

            _db.Payslips.Add(payslip);
            await _db.SaveChangesAsync();

            return Ok(new PayslipDto
            {
                Id = payslip.Id,
                PayrollRunId = payslip.PayrollRunId,
                EmployeeId = payslip.EmployeeId,
                Gross = payslip.Gross,
                Net = payslip.Net,
                Details = payslip.Details
            });
        }

        private static byte[] BuildSimplePdf(string title, IEnumerable<string> lines)
        {
            static string EscapePdfText(string value)
            {
                var builder = new StringBuilder(value.Length);
                foreach (var ch in value)
                {
                    if (ch is '\r' or '\n')
                    {
                        builder.Append(' ');
                        continue;
                    }

                    if (ch == '\\' || ch == '(' || ch == ')')
                    {
                        builder.Append('\\');
                    }

                    builder.Append(ch <= 0x7F ? ch : '?');
                }

                return builder.ToString();
            }

            var content = new StringBuilder();
            content.AppendLine("BT");
            content.AppendLine("/F1 12 Tf");
            content.AppendLine("72 760 Td");
            content.Append('(');
            content.Append(EscapePdfText(title));
            content.AppendLine(") Tj");

            foreach (var line in lines)
            {
                content.AppendLine("0 -18 Td");
                content.Append("(");
                content.Append(EscapePdfText(line));
                content.AppendLine(") Tj");
            }

            content.AppendLine("ET");

            var contentBytes = Encoding.ASCII.GetBytes(content.ToString());
            var objects = new List<string>
            {
                "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
                "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
                "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
                "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
                $"5 0 obj << /Length {contentBytes.Length} >> stream\n{content}\nendstream endobj\n"
            };

            using var buffer = new MemoryStream();
            using (var writer = new StreamWriter(buffer, Encoding.ASCII, leaveOpen: true))
            {
                writer.NewLine = "\n";
                writer.Write("%PDF-1.4\n");
                writer.Flush();

                var offsets = new List<long>();
                foreach (var obj in objects)
                {
                    offsets.Add(buffer.Position);
                    var bytes = Encoding.ASCII.GetBytes(obj);
                    buffer.Write(bytes, 0, bytes.Length);
                }

                var xrefPosition = buffer.Position;
                writer.Write("xref\n");
                writer.Write("0 6\n");
                writer.Write("0000000000 65535 f \n");
                foreach (var offset in offsets)
                {
                    writer.Write($"{offset:0000000000} 00000 n \n");
                }

                writer.Write("trailer << /Size 6 /Root 1 0 R >>\n");
                writer.Write("startxref\n");
                writer.Write(xrefPosition);
                writer.Write("\n%%EOF");
                writer.Flush();
            }

            return buffer.ToArray();
        }

        // ===== STATUTORY COMPLIANCE =====

        private static int ToMonthYear(DateTime? month)
        {
            var d = month ?? DateTime.UtcNow;
            return d.Year * 100 + d.Month;
        }

        [HttpGet("statutory/pf")]
        public async Task<IActionResult> GetPFReport([FromQuery] DateTime? month)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var period = month ?? DateTime.UtcNow;
            var monthYear = ToMonthYear(period);

            var query = _db.ProvidentFunds.AsNoTracking()
                .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.MonthYear == monthYear);

            var records = await (
                from p in query
                join e in _db.Employees.AsNoTracking() on p.EmployeeId equals e.Id into emps
                from e in emps.DefaultIfEmpty()
                select new
                {
                    p.Id,
                    p.EmployeeId,
                    EmployeeName = e != null ? (e.FullName ?? e.EmployeeCode) : null,
                    p.EmployeeContribution,
                    p.EmployerContributionPF,
                    p.TotalContribution,
                    p.MonthYear,
                    p.Status
                }).ToListAsync();

            return Ok(new
            {
                month = period,
                monthYear,
                totalPF = records.Sum(r => r.TotalContribution),
                records
            });
        }

        [HttpGet("statutory/pf/ecr")]
        public async Task<IActionResult> PfEcr([FromQuery] DateTime? month)
        {
            var period = month ?? DateTime.UtcNow;
            var monthYear = ToMonthYear(period);
            var rows = await (
                from p in _db.ProvidentFunds.AsNoTracking()
                join e in _db.Employees.AsNoTracking() on p.EmployeeId equals e.Id into emps
                from e in emps.DefaultIfEmpty()
                where p.MonthYear == monthYear && !p.IsDeleted
                select new { p, Employee = e }).ToListAsync();

            var csv = new StringBuilder();
            csv.AppendLine("UAN,MemberName,GrossWages,EPFWages,EPSWages,EDLIWages,EEShare,ERShareEPF,ERShareEPS,NCPDays");
            foreach (var row in rows)
            {
                var uan = row.Employee?.Uan ?? "";
                var name = row.Employee?.FullName ?? row.p.EmployeeName;
                csv.AppendLine($"{Csv(uan)},{Csv(name)},{row.p.BasicSalary:0.00},{row.p.PFWages:0.00},{row.p.PFWages:0.00},{row.p.PFWages:0.00},{row.p.EmployeeContribution:0.00},{row.p.EmployerContributionPF:0.00},{row.p.EmployerContributionEPS:0.00},0");
            }

            return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"pf-ecr-{monthYear}.csv");
        }

        [HttpGet("statutory/esi/challan")]
        public async Task<IActionResult> EsiChallan([FromQuery] DateTime? month)
        {
            var period = month ?? DateTime.UtcNow;
            var monthYear = ToMonthYear(period);
            var rows = await (
                from p in _db.EmployeeStateInsurances.AsNoTracking()
                join e in _db.Employees.AsNoTracking() on p.EmployeeId equals e.Id into emps
                from e in emps.DefaultIfEmpty()
                where p.MonthYear == monthYear && !p.IsDeleted
                select new { p, Employee = e }).ToListAsync();

            var csv = new StringBuilder();
            csv.AppendLine("IPNumber,EmployeeName,Wages,EmployeeContribution,EmployerContribution,Total,Days");
            foreach (var row in rows)
            {
                csv.AppendLine($"{Csv(row.Employee?.EsiNumber ?? row.p.ESINumber)},{Csv(row.Employee?.FullName ?? row.p.EmployeeName)},{row.p.ESIWages:0.00},{row.p.EmployeeContribution:0.00},{row.p.EmployerContribution:0.00},{row.p.TotalContribution:0.00},{row.p.ContributionDays}");
            }

            return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"esi-challan-{monthYear}.csv");
        }

        [HttpGet("statutory/tds/form24q")]
        public async Task<IActionResult> Form24Q([FromQuery] int? financialYear)
        {
            var fy = financialYear ?? (DateTime.UtcNow.Month >= 4 ? DateTime.UtcNow.Year : DateTime.UtcNow.Year - 1);
            var rows = await (
                from t in _db.IncomeTaxes.AsNoTracking()
                join e in _db.Employees.AsNoTracking() on t.EmployeeId equals e.Id into emps
                from e in emps.DefaultIfEmpty()
                where t.FinancialYear == fy && !t.IsDeleted
                select new { t, Employee = e }).ToListAsync();

            var csv = new StringBuilder();
            csv.AppendLine("PAN,EmployeeName,GrossSalary,TaxableIncome,TDSDeducted,Regime");
            foreach (var row in rows)
            {
                csv.AppendLine($"{Csv(row.Employee?.Pan ?? row.t.PAN)},{Csv(row.Employee?.FullName ?? row.t.EmployeeName)},{row.t.GrossSalary:0.00},{row.t.TaxableIncome:0.00},{row.t.TDSDeducted:0.00},{row.t.TaxRegime}");
            }

            return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"form24q-fy{fy}.csv");
        }

        [HttpGet("statutory/form16/{employeeId:guid}")]
        public async Task<IActionResult> Form16(Guid employeeId, [FromQuery] int? financialYear)
        {
            var fy = financialYear ?? (DateTime.UtcNow.Month >= 4 ? DateTime.UtcNow.Year : DateTime.UtcNow.Year - 1);
            var employee = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == employeeId && !e.IsDeleted);
            if (employee == null) return NotFound(new { message = "Employee not found." });
            var tax = await _db.IncomeTaxes.AsNoTracking()
                .FirstOrDefaultAsync(t => t.EmployeeId == employeeId && t.FinancialYear == fy && !t.IsDeleted);
            var lines = new[]
            {
                $"Form 16 — FY {fy}-{(fy + 1) % 100:00}",
                $"Employee: {employee.FullName} ({employee.EmployeeCode})",
                $"PAN: {employee.Pan ?? tax?.PAN}",
                $"Gross salary: {(tax?.GrossSalary ?? employee.MonthlyCtc * 12m):0.00}",
                $"Standard deduction: {tax?.StandardDeduction:0.00}",
                $"Taxable income: {tax?.TaxableIncome:0.00}",
                $"Tax after rebate: {tax?.TaxAfterRebate:0.00}",
                $"TDS deducted: {tax?.TDSDeducted:0.00}",
                $"Regime: {tax?.TaxRegime.ToString() ?? "NewRegime"}",
                "This is an employer certificate generated from payroll TDS. File with Form 16 Part B as required."
            };
            var pdf = BuildSimplePdf($"Form 16 {employee.EmployeeCode} FY{fy}", lines);
            return File(pdf, "application/pdf", $"form16-{employee.EmployeeCode}-{fy}.pdf");
        }

        [HttpGet("statutory/esi")]
        public async Task<IActionResult> GetESIReport([FromQuery] DateTime? month)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var period = month ?? DateTime.UtcNow;
            var monthYear = ToMonthYear(period);

            var query = _db.EmployeeStateInsurances.AsNoTracking()
                .Where(e => e.TenantId == tenantId && !e.IsDeleted && e.MonthYear == monthYear);

            var records = await (
                from row in query
                join emp in _db.Employees.AsNoTracking() on row.EmployeeId equals emp.Id into emps
                from emp in emps.DefaultIfEmpty()
                select new
                {
                    row.Id,
                    row.EmployeeId,
                    EmployeeName = emp != null ? (emp.FullName ?? emp.EmployeeCode) : null,
                    row.EmployeeContribution,
                    row.EmployerContribution,
                    row.TotalContribution,
                    row.MonthYear,
                    row.IsESIEligible
                }).ToListAsync();

            return Ok(new
            {
                month = period,
                monthYear,
                totalESI = records.Sum(r => r.TotalContribution),
                records
            });
        }

        [HttpGet("statutory/pt")]
        public async Task<IActionResult> GetPTReport([FromQuery] DateTime? month)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var period = month ?? DateTime.UtcNow;
            var monthYear = ToMonthYear(period);

            var query = _db.ProfessionalTaxes.AsNoTracking()
                .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.MonthYear == monthYear);

            var records = await (
                from p in query
                join e in _db.Employees.AsNoTracking() on p.EmployeeId equals e.Id into emps
                from e in emps.DefaultIfEmpty()
                select new
                {
                    p.Id,
                    p.EmployeeId,
                    EmployeeName = e != null ? (e.FullName ?? e.EmployeeCode) : null,
                    p.StateCode,
                    p.PTDeduction,
                    p.MonthYear,
                    p.IsPTExempt
                }).ToListAsync();

            return Ok(new
            {
                month = period,
                monthYear,
                totalPT = records.Sum(r => r.PTDeduction),
                records
            });
        }

        [HttpGet("statutory/tds")]
        public async Task<IActionResult> GetTDSReport([FromQuery] DateTime? month)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var period = month ?? DateTime.UtcNow;
            var fy = period.Month >= 4 ? period.Year : period.Year - 1;

            var query = _db.IncomeTaxes.AsNoTracking()
                .Where(t => t.TenantId == tenantId && !t.IsDeleted && t.FinancialYear == fy);

            var records = await (
                from t in query
                join e in _db.Employees.AsNoTracking() on t.EmployeeId equals e.Id into emps
                from e in emps.DefaultIfEmpty()
                select new
                {
                    t.Id,
                    t.EmployeeId,
                    EmployeeName = e != null ? (e.FullName ?? e.EmployeeCode) : null,
                    t.PAN,
                    t.GrossSalary,
                    t.TaxableIncome,
                    t.TDSDeducted,
                    t.FinancialYear,
                    t.TaxRegime
                }).ToListAsync();

            return Ok(new
            {
                month = period,
                financialYear = fy,
                totalTDS = records.Sum(r => r.TDSDeducted),
                records
            });
        }

        // ===== EMPLOYEE PICKER =====

        [HttpGet("employees")]
        public async Task<IActionResult> GetEmployees()
        {
            var employees = await _db.Employees.AsNoTracking()
                .OrderBy(e => e.FullName)
                .Take(300)
                .Select(e => new { e.Id, e.FullName, e.EmployeeCode, e.Status })
                .ToListAsync();

            return Ok(new { employees });
        }

        // ===== TAX DECLARATIONS =====

        [HttpGet("tax-declarations")]
        public async Task<IActionResult> GetTaxDeclarations([FromQuery] int? financialYear)
        {
            var query = _db.TaxDeclarations.AsNoTracking();
            if (financialYear.HasValue)
                query = query.Where(d => d.FinancialYear == financialYear.Value);

            var rows = await query
                .OrderByDescending(d => d.FinancialYear)
                .ThenBy(d => d.EmployeeName)
                .Select(d => new
                {
                    d.Id,
                    d.EmployeeId,
                    d.EmployeeName,
                    d.FinancialYear,
                    regime = d.Section80C_Total == 0 && d.Section80D_Total == 0 && d.Section80G_Donation == 0 ? "New" : "Old",
                    declaredAmount = d.TotalDeductionsUnderOldRegime,
                    approvedAmount = d.Status == DeclarationStatus.Verified ? d.TotalDeductionsUnderOldRegime : 0,
                    d.Section80C_Total,
                    d.Section80D_Total,
                    d.Section80G_Donation,
                    d.RentPaid,
                    d.ProofSubmitted,
                    status = d.Status.ToString()
                })
                .ToListAsync();

            return Ok(rows);
        }

        [HttpPost("tax-declarations")]
        public async Task<IActionResult> CreateTaxDeclaration([FromBody] UpsertPayrollTaxDeclarationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var employee = await ResolveEmployeeAsync(dto.EmployeeId);
            if (employee == null) return BadRequest(new { message = "Employee not found." });

            var exists = await _db.TaxDeclarations.AnyAsync(d => d.EmployeeId == dto.EmployeeId && d.FinancialYear == dto.FinancialYear);
            if (exists) return BadRequest(new { message = "A declaration already exists for this employee and financial year." });

            var incomeTax = await EnsureIncomeTaxAsync(employee, dto.FinancialYear, dto.Regime);
            var declared = dto.Section80C_Total + dto.Section80D_Total + dto.Section80G_Donation;
            var status = dto.ProofSubmitted ? DeclarationStatus.ProofSubmitted : DeclarationStatus.Declared;

            var row = new TaxDeclaration
            {
                EmployeeId = employee.Id,
                EmployeeName = employee.FullName ?? employee.EmployeeCode ?? "Employee",
                EmployeeNumber = employee.EmployeeCode ?? string.Empty,
                FinancialYear = dto.FinancialYear,
                IncomeTaxId = incomeTax.Id,
                Section80C_Total = dto.Section80C_Total,
                Section80D_Total = dto.Section80D_Total,
                Section80G_Donation = dto.Section80G_Donation,
                RentPaid = dto.RentPaid,
                TotalDeductionsUnderOldRegime = declared,
                ProofSubmitted = dto.ProofSubmitted,
                ProofSubmittedDate = dto.ProofSubmitted ? DateTime.UtcNow : null,
                ProofDocuments = string.Empty,
                DeclarationDate = DateTime.UtcNow,
                ProofSubmissionDeadline = new DateTime(dto.FinancialYear + 1, 6, 30),
                Status = status,
                IncomeTax = incomeTax
            };

            _db.TaxDeclarations.Add(row);
            await _db.SaveChangesAsync();
            return Ok(row);
        }

        [HttpPut("tax-declarations/{id:guid}")]
        public async Task<IActionResult> UpdateTaxDeclaration(Guid id, [FromBody] UpsertPayrollTaxDeclarationDto dto)
        {
            var row = await _db.TaxDeclarations.FirstOrDefaultAsync(d => d.Id == id);
            if (row == null) return NotFound(new { message = "Tax declaration not found." });

            row.Section80C_Total = dto.Section80C_Total;
            row.Section80D_Total = dto.Section80D_Total;
            row.Section80G_Donation = dto.Section80G_Donation;
            row.RentPaid = dto.RentPaid;
            row.TotalDeductionsUnderOldRegime = dto.Section80C_Total + dto.Section80D_Total + dto.Section80G_Donation;
            row.ProofSubmitted = dto.ProofSubmitted;
            if (dto.ProofSubmitted && row.ProofSubmittedDate == null)
                row.ProofSubmittedDate = DateTime.UtcNow;
            if (row.Status != DeclarationStatus.Verified)
                row.Status = dto.ProofSubmitted ? DeclarationStatus.ProofSubmitted : DeclarationStatus.Declared;

            await _db.SaveChangesAsync();
            return Ok(row);
        }

        [HttpPost("tax-declarations/{id:guid}/verify")]
        public async Task<IActionResult> VerifyTaxDeclaration(Guid id)
        {
            var row = await _db.TaxDeclarations.FirstOrDefaultAsync(d => d.Id == id);
            if (row == null) return NotFound(new { message = "Tax declaration not found." });

            row.Status = DeclarationStatus.Verified;
            row.ProofSubmitted = true;
            row.ProofSubmittedDate ??= DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Declaration verified." });
        }

        // ===== REIMBURSEMENTS (ExpenseClaims) =====

        [HttpGet("reimbursements")]
        public async Task<IActionResult> GetReimbursements([FromQuery] string? status)
        {
            var query = _db.ExpenseClaims.AsNoTracking();
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(e => e.Status == status);

            var rows = await query
                .OrderByDescending(e => e.ExpenseDate)
                .Take(200)
                .Select(e => new
                {
                    e.Id,
                    e.ClaimNumber,
                    e.EmployeeId,
                    employeeName = e.EmployeeName,
                    category = e.Category,
                    title = e.Title,
                    amount = e.Amount,
                    submittedDate = e.SubmittedAt ?? e.ExpenseDate,
                    e.Status
                })
                .ToListAsync();

            return Ok(rows);
        }

        [HttpPost("reimbursements")]
        public async Task<IActionResult> CreateReimbursement([FromBody] CreatePayrollReimbursementDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (dto.Amount <= 0) return BadRequest(new { message = "Amount must be greater than zero." });

            string employeeName = dto.EmployeeName?.Trim() ?? string.Empty;
            if (dto.EmployeeId.HasValue)
            {
                var employee = await ResolveEmployeeAsync(dto.EmployeeId.Value);
                if (employee == null) return BadRequest(new { message = "Employee not found." });
                employeeName = employee.FullName ?? employee.EmployeeCode ?? employeeName;
            }

            var claim = new ExpenseClaim
            {
                TenantId = _tenantAccessor.GetTenantId(),
                ClaimNumber = await _numbers.NextAsync("PayrollReimbursement", "REIM-", 5),
                EmployeeId = dto.EmployeeId,
                EmployeeName = employeeName,
                Title = dto.Title.Trim(),
                Description = dto.Description,
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim(),
                Amount = dto.Amount,
                ExpenseDate = dto.Date ?? DateTime.UtcNow.Date,
                Status = "Submitted",
                SubmittedAt = DateTime.UtcNow
            };

            _db.ExpenseClaims.Add(claim);
            await _db.SaveChangesAsync();
            return Ok(claim);
        }

        [HttpPost("reimbursements/{id:guid}/approve")]
        public async Task<IActionResult> ApproveReimbursement(Guid id)
        {
            try
            {
                await _expenseClaims.ApproveAsync(id, User.Identity?.Name ?? "payroll");
                return Ok(new { message = "Reimbursement approved." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Reimbursement not found." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("reimbursements/{id:guid}/reject")]
        public async Task<IActionResult> RejectReimbursement(Guid id)
        {
            try
            {
                await _expenseClaims.RejectAsync(id);
                return Ok(new { message = "Reimbursement rejected." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Reimbursement not found." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("reimbursements/{id:guid}/mark-paid")]
        public async Task<IActionResult> MarkReimbursementPaid(Guid id)
        {
            try
            {
                await _expenseClaims.MarkPaidAsync(id);
                return Ok(new { message = "Reimbursement marked paid and posted to GL." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Reimbursement not found." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ===== FINAL SETTLEMENT =====

        [HttpGet("settlements")]
        public async Task<IActionResult> GetSettlements()
        {
            var rows = await _db.PayrollFinalSettlements.AsNoTracking()
                .OrderByDescending(s => s.ExitDate)
                .ToListAsync();
            return Ok(rows);
        }

        [HttpPost("settlements/compute")]
        public async Task<IActionResult> ComputeSettlement([FromBody] UpsertPayrollSettlementDto dto)
        {
            try
            {
                var computed = await _settlements.ComputeAsync(dto.EmployeeId, dto.ExitDate);
                return Ok(computed);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("settlements")]
        public async Task<IActionResult> CreateSettlement([FromBody] UpsertPayrollSettlementDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var employee = await _db.Employees.FirstOrDefaultAsync(e => e.Id == dto.EmployeeId && !e.IsDeleted);
            if (employee == null) return BadRequest(new { message = "Employee not found." });

            var computed = await _settlements.ComputeAsync(employee.Id, dto.ExitDate);
            var gratuity = dto.Gratuity > 0 ? dto.Gratuity : computed.Gratuity;
            var leave = dto.LeaveEncashment > 0 ? dto.LeaveEncashment : computed.LeaveEncashment;
            var other = dto.OtherDues > 0 ? dto.OtherDues : computed.OtherDues;
            var recoveries = dto.Recoveries > 0 ? dto.Recoveries : computed.Recoveries;
            var row = new PayrollFinalSettlement
            {
                EmployeeId = employee.Id,
                EmployeeName = employee.FullName ?? employee.EmployeeCode ?? "Employee",
                ExitDate = dto.ExitDate,
                Gratuity = gratuity,
                LeaveEncashment = leave,
                OtherDues = other,
                Recoveries = recoveries,
                TotalSettlement = gratuity + leave + other - recoveries,
                Status = "Pending",
                Remarks = dto.Remarks ?? computed.Remarks
            };

            employee.Status = "Terminated";
            employee.ExitDate ??= dto.ExitDate;
            _db.PayrollFinalSettlements.Add(row);
            await _db.SaveChangesAsync();
            return Ok(row);
        }

        [HttpPut("settlements/{id:guid}")]
        public async Task<IActionResult> UpdateSettlement(Guid id, [FromBody] UpsertPayrollSettlementDto dto)
        {
            var row = await _db.PayrollFinalSettlements.FirstOrDefaultAsync(s => s.Id == id);
            if (row == null) return NotFound(new { message = "Settlement not found." });

            row.ExitDate = dto.ExitDate;
            row.Gratuity = dto.Gratuity;
            row.LeaveEncashment = dto.LeaveEncashment;
            row.OtherDues = dto.OtherDues;
            row.Recoveries = dto.Recoveries;
            row.TotalSettlement = dto.Gratuity + dto.LeaveEncashment + dto.OtherDues - dto.Recoveries;
            row.Remarks = dto.Remarks;
            await _db.SaveChangesAsync();
            return Ok(row);
        }

        [HttpPost("settlements/{id:guid}/settle")]
        public async Task<IActionResult> MarkSettlementSettled(Guid id)
        {
            try
            {
                var result = await _settlements.SettleAsync(id);
                return Ok(new { message = "Settlement posted to GL.", journalEntryId = result.JournalEntryId });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Settlement not found." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("settlements/{id:guid}")]
        public async Task<IActionResult> DeleteSettlement(Guid id)
        {
            var row = await _db.PayrollFinalSettlements.FirstOrDefaultAsync(s => s.Id == id);
            if (row == null) return NotFound(new { message = "Settlement not found." });
            row.IsDeleted = true;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Settlement deleted." });
        }

        // ===== LOANS =====

        [HttpGet("loans")]
        public async Task<IActionResult> GetLoans([FromQuery] string? status)
        {
            var query = _db.PayrollLoans.AsNoTracking();
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(l => l.Status == status);
            return Ok(await query.OrderByDescending(l => l.DisbursementDate).ToListAsync());
        }

        [HttpPost("loans")]
        public async Task<IActionResult> CreateLoan([FromBody] CreatePayrollLoanDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (dto.PrincipalAmount <= 0 || dto.EmiAmount <= 0)
                return BadRequest(new { message = "Principal and EMI must be greater than zero." });

            var employee = await ResolveEmployeeAsync(dto.EmployeeId);
            if (employee == null) return BadRequest(new { message = "Employee not found." });

            var row = new PayrollLoan
            {
                EmployeeId = employee.Id,
                EmployeeName = employee.FullName ?? employee.EmployeeCode ?? "Employee",
                EmployeeCode = employee.EmployeeCode ?? string.Empty,
                LoanType = dto.LoanType.Trim(),
                PrincipalAmount = dto.PrincipalAmount,
                OutstandingAmount = dto.PrincipalAmount,
                EmiAmount = dto.EmiAmount,
                InterestRate = dto.InterestRate,
                DisbursementDate = dto.DisbursementDate,
                TotalInstallments = dto.TotalInstallments < 1 ? 12 : dto.TotalInstallments,
                Purpose = dto.Purpose,
                Status = "Pending"
            };
            _db.PayrollLoans.Add(row);
            await _db.SaveChangesAsync();
            return Ok(row);
        }

        [HttpPost("loans/{id:guid}/approve")]
        public async Task<IActionResult> ApproveLoan(Guid id)
        {
            try
            {
                await _employeeFinance.ApproveLoanAsync(id);
                return Ok(new { message = "Loan approved." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Loan not found." });
            }
        }

        [HttpPost("loans/{id:guid}/activate")]
        public async Task<IActionResult> ActivateLoan(Guid id)
        {
            try
            {
                await _employeeFinance.ActivateLoanAsync(id);
                return Ok(new { message = "Loan activated." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Loan not found." });
            }
        }

        [HttpPost("loans/{id:guid}/emi")]
        public async Task<IActionResult> RecordLoanEmi(Guid id)
        {
            try
            {
                var row = await _employeeFinance.RecordEmiAsync(id);
                return Ok(row);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Loan not found." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("loans/{id:guid}/close")]
        public async Task<IActionResult> CloseLoan(Guid id)
        {
            try
            {
                await _employeeFinance.CloseLoanAsync(id);
                return Ok(new { message = "Loan closed." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Loan not found." });
            }
        }

        // ===== BONUSES =====

        [HttpGet("bonuses")]
        public async Task<IActionResult> GetBonuses([FromQuery] string? status)
        {
            var query = _db.PayrollBonuses.AsNoTracking();
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(b => b.Status == status);
            return Ok(await query.OrderByDescending(b => b.CreatedAt).ToListAsync());
        }

        [HttpPost("bonuses")]
        public async Task<IActionResult> CreateBonus([FromBody] CreatePayrollBonusDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (dto.Amount <= 0) return BadRequest(new { message = "Bonus amount must be greater than zero." });

            var employee = await ResolveEmployeeAsync(dto.EmployeeId);
            if (employee == null) return BadRequest(new { message = "Employee not found." });

            var row = new PayrollBonus
            {
                EmployeeId = employee.Id,
                EmployeeName = employee.FullName ?? employee.EmployeeCode ?? "Employee",
                EmployeeCode = employee.EmployeeCode ?? string.Empty,
                BonusType = dto.BonusType.Trim(),
                Amount = dto.Amount,
                PaymentMonth = dto.PaymentMonth.Trim(),
                Remarks = dto.Remarks,
                Status = "Pending"
            };
            _db.PayrollBonuses.Add(row);
            await _db.SaveChangesAsync();
            return Ok(row);
        }

        [HttpPost("bonuses/{id:guid}/approve")]
        public async Task<IActionResult> ApproveBonus(Guid id)
        {
            try
            {
                await _employeeFinance.ApproveBonusAsync(id);
                return Ok(new { message = "Bonus approved." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Bonus not found." });
            }
        }

        [HttpPost("bonuses/{id:guid}/pay")]
        public async Task<IActionResult> PayBonus(Guid id)
        {
            try
            {
                await _employeeFinance.PayBonusAsync(id);
                return Ok(new { message = "Bonus marked paid." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Bonus not found." });
            }
        }

        [HttpPost("bonuses/{id:guid}/reject")]
        public async Task<IActionResult> RejectBonus(Guid id)
        {
            try
            {
                await _employeeFinance.RejectBonusAsync(id);
                return Ok(new { message = "Bonus rejected." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Bonus not found." });
            }
        }

        // ===== ARREARS =====

        [HttpGet("arrears")]
        public async Task<IActionResult> GetArrears([FromQuery] string? status)
        {
            var query = _db.PayrollArrears.AsNoTracking();
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(a => a.Status == status);
            return Ok(await query.OrderByDescending(a => a.CreatedAt).ToListAsync());
        }

        [HttpPost("arrears")]
        public async Task<IActionResult> CreateArrear([FromBody] CreatePayrollArrearDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (dto.Amount <= 0) return BadRequest(new { message = "Arrears amount must be greater than zero." });

            var employee = await ResolveEmployeeAsync(dto.EmployeeId);
            if (employee == null) return BadRequest(new { message = "Employee not found." });

            var row = new PayrollArrear
            {
                EmployeeId = employee.Id,
                EmployeeName = employee.FullName ?? employee.EmployeeCode ?? "Employee",
                EmployeeCode = employee.EmployeeCode ?? string.Empty,
                Period = dto.Period.Trim(),
                Amount = dto.Amount,
                Reason = string.IsNullOrWhiteSpace(dto.Reason) ? "Other" : dto.Reason.Trim(),
                Status = "Pending"
            };
            _db.PayrollArrears.Add(row);
            await _db.SaveChangesAsync();
            return Ok(row);
        }

        [HttpPost("arrears/{id:guid}/approve")]
        public async Task<IActionResult> ApproveArrear(Guid id)
        {
            try
            {
                await _employeeFinance.ApproveArrearAsync(id);
                return Ok(new { message = "Arrears approved." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Arrears entry not found." });
            }
        }

        [HttpPost("arrears/{id:guid}/process")]
        public async Task<IActionResult> ProcessArrear(Guid id)
        {
            try
            {
                await _employeeFinance.ProcessArrearAsync(id);
                return Ok(new { message = "Arrears processed." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Arrears entry not found." });
            }
        }

        private async Task<Employee?> ResolveEmployeeAsync(Guid id) =>
            await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id);

        private async Task<Guid> ResolveCurrentEmployeeIdAsync()
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Guid.Empty;
            return await _db.Employees.AsNoTracking()
                .Where(e => e.UserId == userId && !e.IsDeleted)
                .Select(e => e.Id)
                .FirstOrDefaultAsync();
        }

        private Guid GetUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }

        private static string Csv(string? value)
        {
            var text = (value ?? string.Empty).Replace("\"", "\"\"");
            return text.Contains(',') || text.Contains('"') || text.Contains('\n') ? $"\"{text}\"" : text;
        }

        private async Task<IncomeTax> EnsureIncomeTaxAsync(Employee employee, int financialYear, string regime)
        {
            var existing = await _db.IncomeTaxes
                .FirstOrDefaultAsync(t => t.EmployeeId == employee.Id && t.FinancialYear == financialYear);
            if (existing != null) return existing;

            var tax = new IncomeTax
            {
                EmployeeId = employee.Id,
                EmployeeName = employee.FullName ?? employee.EmployeeCode ?? "Employee",
                EmployeeNumber = employee.EmployeeCode ?? string.Empty,
                FinancialYear = financialYear,
                AssessmentYear = financialYear + 1,
                TaxRegime = string.Equals(regime, "Old", StringComparison.OrdinalIgnoreCase) ? TaxRegime.OldRegime : TaxRegime.NewRegime,
                OptedOldRegime = string.Equals(regime, "Old", StringComparison.OrdinalIgnoreCase),
                CalculatedDate = DateTime.UtcNow,
                Status = ITStatus.Calculated
            };
            _db.IncomeTaxes.Add(tax);
            await _db.SaveChangesAsync();
            return tax;
        }
    }
}
