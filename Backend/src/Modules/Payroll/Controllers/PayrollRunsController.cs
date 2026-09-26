using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Api.Models;

namespace UabIndia.Api.Modules.Payroll.Controllers
{
    /// <summary>
    /// Dedicated controller for Payroll Runs lifecycle:
    /// create, list, complete, bank-file export, and delete.
    /// Route: api/v1/payroll/runs
    /// </summary>
    [ApiController]
    [Route("api/v1/payroll/runs")]
    [Authorize]
    [Authorize(Policy = "Module:payroll")]
    public class PayrollRunsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IPayrollEngine _payrollEngine;

        public PayrollRunsController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IPayrollEngine payrollEngine)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _payrollEngine = payrollEngine;
        }

        /// <summary>GET api/v1/payroll/runs — list runs with optional status filter</summary>
        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? status, [FromQuery] Guid? companyId, [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.PayrollRuns.AsNoTracking().Where(r => r.TenantId == tenantId && !r.IsDeleted);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(r => r.Status == status);
            if (companyId.HasValue)
                query = query.Where(r => r.CompanyId == companyId.Value);

            var total = await query.CountAsync(ct);
            var items = await query
                .OrderByDescending(r => r.RunDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new { r.Id, r.CompanyId, r.RunDate, r.Status, r.TotalGross, r.TotalNet, r.CreatedAt })
                .ToListAsync(ct);

            return Ok(new { total, page, pageSize, items });
        }

        /// <summary>GET api/v1/payroll/runs/{id} — single run with summary</summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var run = await _db.PayrollRuns.AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted, ct);
            if (run == null) return NotFound(new { message = "Payroll run not found." });

            var payslipCount = await _db.Payslips.CountAsync(p => p.PayrollRunId == id && !p.IsDeleted, ct);
            return Ok(new { run, payslipCount });
        }

        /// <summary>POST api/v1/payroll/runs — create a new draft run</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePayrollRunDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var run = new PayrollRun
            {
                CompanyId = dto.CompanyId,
                RunDate = dto.RunDate,
                Status = "Draft",
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.PayrollRuns.Add(run);
            await _db.SaveChangesAsync(ct);
            return Ok(new { run.Id, run.CompanyId, run.RunDate, run.Status });
        }

        /// <summary>POST api/v1/payroll/runs/{id}/complete — run the payroll engine and generate payslips</summary>
        [HttpPost("{id:guid}/complete")]
        public async Task<IActionResult> Complete(Guid id, CancellationToken ct)
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
                return ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase)
                    ? NotFound(new { message = ex.Message })
                    : BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>POST api/v1/payroll/runs/{id}/revert — revert a completed run back to draft</summary>
        [HttpPost("{id:guid}/revert")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Revert(Guid id, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var run = await _db.PayrollRuns.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted, ct);
            if (run == null) return NotFound(new { message = "Payroll run not found." });
            if (run.Status != "Completed") return BadRequest(new { message = "Only completed runs can be reverted." });

            run.Status = "Draft";
            run.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Run reverted to Draft." });
        }

        /// <summary>GET api/v1/payroll/runs/{id}/bank-file — download NEFT bank disbursement CSV</summary>
        [HttpGet("{id:guid}/bank-file")]
        public async Task<IActionResult> BankFile(Guid id, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var run = await _db.PayrollRuns.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted, ct);
            if (run == null) return NotFound(new { message = "Payroll run not found." });

            var rows = await (
                from p in _db.Payslips.AsNoTracking()
                join e in _db.Employees.AsNoTracking() on p.EmployeeId equals e.Id
                where p.PayrollRunId == id && !p.IsDeleted
                select new { e.EmployeeCode, e.FullName, e.BankAccountHolder, e.BankAccountNumber, e.BankIfsc, e.BankName, p.Net }
            ).ToListAsync(ct);

            var csv = new System.Text.StringBuilder();
            csv.AppendLine("EmployeeCode,BeneficiaryName,AccountNumber,IFSC,BankName,Amount,PaymentType");
            foreach (var row in rows.Where(r => r.Net > 0))
            {
                var name = CsvEscape(row.BankAccountHolder ?? row.FullName ?? row.EmployeeCode);
                csv.AppendLine($"{CsvEscape(row.EmployeeCode)},{name},{CsvEscape(row.BankAccountNumber)},{CsvEscape(row.BankIfsc)},{CsvEscape(row.BankName)},{row.Net:0.00},NEFT");
            }

            return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"salary-neft-{run.RunDate:yyyyMM}.csv");
        }

        /// <summary>GET api/v1/payroll/runs/{id}/summary — KPI summary for the run</summary>
        [HttpGet("{id:guid}/summary")]
        public async Task<IActionResult> Summary(Guid id, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var run = await _db.PayrollRuns.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted, ct);
            if (run == null) return NotFound(new { message = "Payroll run not found." });

            var payslips = await _db.Payslips.AsNoTracking().Where(p => p.PayrollRunId == id && !p.IsDeleted).ToListAsync(ct);
            return Ok(new
            {
                runId = run.Id,
                runDate = run.RunDate,
                status = run.Status,
                employeeCount = payslips.Count,
                totalGross = payslips.Sum(p => p.Gross),
                totalNet = payslips.Sum(p => p.Net),
                totalDeductions = payslips.Sum(p => p.TotalDeductions),
                totalPfEmployee = payslips.Sum(p => p.PfEmployee),
                totalPfEmployer = payslips.Sum(p => p.PfEmployee), // standard 12% match
                totalEsiEmployee = payslips.Sum(p => p.EsiEmployee),
                totalEsiEmployer = payslips.Sum(p => p.EsiEmployee > 0 ? Math.Round(p.EsiEmployee / 0.0075m * 0.0325m, 2) : 0m),
                totalTds = payslips.Sum(p => p.Tds),
                totalPt = payslips.Sum(p => p.ProfessionalTax),
            });
        }

        /// <summary>DELETE api/v1/payroll/runs/{id} — soft delete a draft run</summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var run = await _db.PayrollRuns.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted, ct);
            if (run == null) return NotFound(new { message = "Payroll run not found." });
            if (run.Status == "Completed") return BadRequest(new { message = "Cannot delete completed payroll runs." });

            run.IsDeleted = true;
            run.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Payroll run deleted." });
        }

        private static string CsvEscape(string? value)
        {
            var text = (value ?? string.Empty).Replace("\"", "\"\"");
            return text.Contains(',') || text.Contains('"') || text.Contains('\n') ? $"\"{text}\"" : text;
        }
    }
}
