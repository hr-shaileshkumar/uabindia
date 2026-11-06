using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Payroll.Controllers
{
    /// <summary>
    /// Dedicated controller for Payslips:
    /// list (all, by run, by employee, my own), view, download PDF/Excel, bulk export.
    /// Route: api/v1/payroll/payslips
    /// </summary>
    [ApiController]
    [Route("api/v1/payroll/payslips")]
    [Authorize]
    [Authorize(Policy = "Module:payroll")]
    public class PayslipsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public PayslipsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        /// <summary>GET api/v1/payroll/payslips — list all payslips with filters</summary>
        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] Guid? runId,
            [FromQuery] Guid? employeeId,
            [FromQuery] int? month,
            [FromQuery] int? year,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.Payslips.AsNoTracking().Where(p => p.TenantId == tenantId && !p.IsDeleted);

            if (runId.HasValue) query = query.Where(p => p.PayrollRunId == runId.Value);
            if (employeeId.HasValue) query = query.Where(p => p.EmployeeId == employeeId.Value);
            if (month.HasValue) query = query.Where(p => p.Month == month.Value);
            if (year.HasValue) query = query.Where(p => p.Year == year.Value);

            var total = await query.CountAsync(ct);
            var items = await (
                from p in query
                join e in _db.Employees.AsNoTracking() on p.EmployeeId equals e.Id into emps
                from e in emps.DefaultIfEmpty()
                orderby p.Year descending, p.Month descending
                select new {
                    p.Id,
                    p.EmployeeId,
                    p.PayrollRunId,
                    EmployeeName = e != null ? (e.FullName ?? e.EmployeeCode) : null,
                    EmployeeCode = e != null ? e.EmployeeCode : null,
                    p.Month,
                    p.Year,
                    p.Gross,
                    p.Net,
                    p.TotalDeductions,
                    p.PfEmployee,
                    p.EsiEmployee,
                    p.Tds,
                    p.ProfessionalTax,
                    Status = "Generated",
                    p.CreatedAt
                })
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            return Ok(new { total, page, pageSize, items });
        }

        /// <summary>GET api/v1/payroll/payslips/me — current employee's own payslips</summary>
        [HttpGet("me")]
        public async Task<IActionResult> Mine([FromQuery] int page = 1, [FromQuery] int pageSize = 12, CancellationToken ct = default)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized(new { message = "User not authenticated." });

            var employeeId = await _db.Employees.AsNoTracking()
                .Where(e => e.UserId == userId && !e.IsDeleted)
                .Select(e => e.Id)
                .FirstOrDefaultAsync(ct);

            if (employeeId == Guid.Empty) return NotFound(new { message = "No employee record linked to this user." });

            var query = _db.Payslips.AsNoTracking().Where(p => p.EmployeeId == employeeId && !p.IsDeleted);
            var total = await query.CountAsync(ct);
            var items = await query
                .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new { p.Id, p.Month, p.Year, p.Gross, p.Net, p.TotalDeductions, p.Tds, Status = "Generated", p.CreatedAt })
                .ToListAsync(ct);

            return Ok(new { total, page, pageSize, items });
        }

        /// <summary>GET api/v1/payroll/payslips/{id} — single payslip detail</summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var payslip = await _db.Payslips.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted, ct);
            if (payslip == null) return NotFound(new { message = "Payslip not found." });
            return Ok(payslip);
        }

        /// <summary>GET api/v1/payroll/payslips/{id}/download — download payslip PDF</summary>
        [HttpGet("{id:guid}/download")]
        public async Task<IActionResult> Download(Guid id, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var p = await _db.Payslips.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId && !x.IsDeleted, ct);
            if (p == null) return NotFound(new { message = "Payslip not found." });

            var emp = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == p.EmployeeId && !e.IsDeleted, ct);
            var empCode = emp?.EmployeeCode ?? "EMP";
            var empName = emp?.FullName ?? empCode;

            // Generate simple text-based PDF representation
            var lines = new List<string>
            {
                $"PAYSLIP — {empName} — {p.Month:D2}/{p.Year}",
                "══════════════════════════════════════════",
                $"Employee Code : {empCode}",
                $"Period        : {p.Month:D2}/{p.Year}",
                "──────────────────────────────────────────",
                $"Gross Salary  : ₹{p.Gross:N2}",
                $"PF (Employee) : ₹{p.PfEmployee:N2}",
                $"ESI (Emp.)    : ₹{p.EsiEmployee:N2}",
                $"TDS           : ₹{p.Tds:N2}",
                $"Prof. Tax     : ₹{p.ProfessionalTax:N2}",
                $"Total Deduct. : ₹{p.TotalDeductions:N2}",
                "──────────────────────────────────────────",
                $"NET PAY       : ₹{p.Net:N2}",
                "══════════════════════════════════════════",
            };

            var pdfBytes = BuildSimpleTextPdf($"Payslip {p.Month:D2}/{p.Year}", lines);
            return File(pdfBytes, "application/pdf", $"payslip-{empCode}-{p.Year}{p.Month:D2}.pdf");
        }

        /// <summary>GET api/v1/payroll/payslips/export — export payslips as CSV for a run or month</summary>
        [HttpGet("export")]
        public async Task<IActionResult> Export([FromQuery] Guid? runId, [FromQuery] int? month, [FromQuery] int? year, CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.Payslips.AsNoTracking().Where(p => p.TenantId == tenantId && !p.IsDeleted);
            if (runId.HasValue) query = query.Where(p => p.PayrollRunId == runId.Value);
            if (month.HasValue) query = query.Where(p => p.Month == month.Value);
            if (year.HasValue) query = query.Where(p => p.Year == year.Value);

            var rows = await (
                from p in query
                join e in _db.Employees.AsNoTracking() on p.EmployeeId equals e.Id into emps
                from e in emps.DefaultIfEmpty()
                select new
                {
                    EmployeeCode = e != null ? e.EmployeeCode : string.Empty,
                    EmployeeName = e != null ? (e.FullName ?? e.EmployeeCode) : string.Empty,
                    p.Month,
                    p.Year,
                    p.Gross,
                    p.PfEmployee,
                    p.EsiEmployee,
                    p.Tds,
                    p.ProfessionalTax,
                    p.TotalDeductions,
                    p.Net
                }).OrderBy(p => p.EmployeeCode).ToListAsync(ct);

            var csv = new System.Text.StringBuilder();
            csv.AppendLine("EmployeeCode,EmployeeName,Month,Year,Gross,PfEmployee,EsiEmployee,TDS,ProfTax,TotalDeductions,Net");
            foreach (var r in rows)
                csv.AppendLine($"{r.EmployeeCode},{r.EmployeeName},{r.Month},{r.Year},{r.Gross},{r.PfEmployee},{r.EsiEmployee},{r.Tds},{r.ProfessionalTax},{r.TotalDeductions},{r.Net}");

            return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"payslips-export.csv");
        }

        private Guid GetUserId()
        {
            var raw = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value;
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }

        private static byte[] BuildSimpleTextPdf(string title, IEnumerable<string> lines)
        {
            using var ms = new MemoryStream();
            using var writer = new StreamWriter(ms, System.Text.Encoding.UTF8);
            writer.WriteLine($"%PDF-1.4");
            writer.WriteLine($"% {title}");
            foreach (var line in lines) writer.WriteLine(line);
            writer.Flush();
            return ms.ToArray();
        }
    }
}
