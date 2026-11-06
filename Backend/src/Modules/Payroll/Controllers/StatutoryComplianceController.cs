using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Api.Models;

namespace UabIndia.Api.Modules.Payroll.Controllers
{
    /// <summary>
    /// Dedicated controller for Statutory Compliance reports (PF, ESI, PT):
    /// list, generate EPFO ECR, generate ESI contribution, generate PT challans.
    /// Route: api/v1/payroll/statutory
    /// </summary>
    [ApiController]
    [Route("api/v1/payroll/statutory")]
    [Authorize]
    [Authorize(Policy = "Module:payroll")]
    public class StatutoryComplianceController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public StatutoryComplianceController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private static int ToMonthYear(DateTime? month)
        {
            var d = month ?? DateTime.UtcNow;
            return d.Year * 100 + d.Month;
        }

        // ─── PROVIDENT FUND ───────────────────────────────────────────────────

        /// <summary>GET api/v1/payroll/statutory/pf — PF contribution report for a month</summary>
        [HttpGet("pf")]
        public async Task<IActionResult> GetPFReport([FromQuery] DateTime? month, CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var period = month ?? DateTime.UtcNow;
            var monthYear = ToMonthYear(period);

            var query = _db.ProvidentFunds.AsNoTracking()
                .Where(pf => pf.TenantId == tenantId && pf.MonthYear == monthYear && !pf.IsDeleted);

            var rows = await query.OrderBy(pf => pf.EmployeeNumber).ToListAsync(ct);
            var totalEmployeeContrib = rows.Sum(r => r.EmployeeContribution);
            var totalEmployerContrib = rows.Sum(r => r.EmployerContributionPF + r.EmployerContributionEPS);

            return Ok(new
            {
                period = period.ToString("yyyy-MM"),
                monthYear,
                employeeCount = rows.Count,
                totalEmployeeContribution = totalEmployeeContrib,
                totalEmployerContribution = totalEmployerContrib,
                totalContribution = totalEmployeeContrib + totalEmployerContrib,
                rows
            });
        }

        /// <summary>GET api/v1/payroll/statutory/pf/ecr — download EPFO ECR flat file for a month</summary>
        [HttpGet("pf/ecr")]
        public async Task<IActionResult> DownloadPFEcr([FromQuery] DateTime? month, CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var period = month ?? DateTime.UtcNow;
            var monthYear = ToMonthYear(period);

            var rows = await _db.ProvidentFunds.AsNoTracking()
                .Where(pf => pf.TenantId == tenantId && pf.MonthYear == monthYear && !pf.IsDeleted)
                .OrderBy(pf => pf.EmployeeNumber)
                .ToListAsync(ct);

            var csv = new System.Text.StringBuilder();
            csv.AppendLine("#~#");
            csv.AppendLine($"# EPFO ECR - Period: {period:MM/yyyy}");
            csv.AppendLine("#~#");
            csv.AppendLine("UAN~Member Name~Gross Wages~EPF Wages~EPS Wages~EPF Contribution~EPS Contribution~EPF EPS Diff~NCP Days~Refund of Advances");
            foreach (var r in rows)
            {
                csv.AppendLine($"{r.PFAccountNumber}~{r.EmployeeName}~{r.PFWages:0.00}~{r.PFWages:0.00}~{r.PFWages:0.00}~{r.EmployeeContribution:0.00}~{r.EmployerContributionEPS:0.00}~{r.EmployerContributionPF:0.00}~0~0");
            }

            return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/plain", $"EPFO-ECR-{period:yyyy-MM}.txt");
        }

        // ─── ESI ──────────────────────────────────────────────────────────────

        /// <summary>GET api/v1/payroll/statutory/esi — ESI contribution report for a month</summary>
        [HttpGet("esi")]
        public async Task<IActionResult> GetESIReport([FromQuery] DateTime? month, CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var period = month ?? DateTime.UtcNow;
            var monthYear = ToMonthYear(period);

            var rows = await _db.EmployeeStateInsurances.AsNoTracking()
                .Where(e => e.TenantId == tenantId && e.MonthYear == monthYear && !e.IsDeleted)
                .OrderBy(e => e.EmployeeNumber).ToListAsync(ct);

            return Ok(new
            {
                period = period.ToString("yyyy-MM"),
                employeeCount = rows.Count,
                totalEmployeeContribution = rows.Sum(r => r.EmployeeContribution),
                totalEmployerContribution = rows.Sum(r => r.EmployerContribution),
                rows
            });
        }

        /// <summary>GET api/v1/payroll/statutory/esi/challan — download ESI monthly contribution CSV</summary>
        [HttpGet("esi/challan")]
        public async Task<IActionResult> DownloadEsiChallan([FromQuery] DateTime? month, CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var period = month ?? DateTime.UtcNow;
            var monthYear = ToMonthYear(period);

            var rows = await _db.EmployeeStateInsurances.AsNoTracking()
                .Where(e => e.TenantId == tenantId && e.MonthYear == monthYear && !e.IsDeleted)
                .OrderBy(e => e.EmployeeNumber).ToListAsync(ct);

            var csv = new System.Text.StringBuilder();
            csv.AppendLine("IP Number,IP Name,No of Days Worked,Total Monthly Wages,ESI Employee,ESI Employer");
            foreach (var r in rows)
                csv.AppendLine($"{r.ESINumber},{r.EmployeeName},{r.ContributionDays},{r.ESIWages:0.00},{r.EmployeeContribution:0.00},{r.EmployerContribution:0.00}");

            return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"ESI-Challan-{period:yyyy-MM}.csv");
        }

        // ─── PROFESSIONAL TAX ─────────────────────────────────────────────────

        /// <summary>GET api/v1/payroll/statutory/pt — Professional Tax deduction summary for a month</summary>
        [HttpGet("pt")]
        public async Task<IActionResult> GetPTReport([FromQuery] DateTime? month, CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var period = month ?? DateTime.UtcNow;

            var rows = await (
                from p in _db.Payslips.AsNoTracking()
                join e in _db.Employees.AsNoTracking() on p.EmployeeId equals e.Id into emps
                from e in emps.DefaultIfEmpty()
                where p.TenantId == tenantId && p.Year == period.Year && p.Month == period.Month && !p.IsDeleted && p.ProfessionalTax > 0
                select new
                {
                    EmployeeCode = e != null ? e.EmployeeCode : string.Empty,
                    EmployeeName = e != null ? (e.FullName ?? e.EmployeeCode) : string.Empty,
                    p.ProfessionalTax
                })
                .OrderBy(r => r.EmployeeCode)
                .ToListAsync(ct);

            return Ok(new
            {
                period = period.ToString("yyyy-MM"),
                employeeCount = rows.Count,
                totalProfessionalTax = rows.Sum(r => r.ProfessionalTax),
                rows
            });
        }

        // ─── TDS ──────────────────────────────────────────────────────────────

        /// <summary>GET api/v1/payroll/statutory/tds — TDS deduction summary for a month/quarter</summary>
        [HttpGet("tds")]
        public async Task<IActionResult> GetTDSReport([FromQuery] int? month, [FromQuery] int? year, CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var targetMonth = month ?? DateTime.UtcNow.Month;
            var targetYear = year ?? DateTime.UtcNow.Year;

            var rows = await (
                from p in _db.Payslips.AsNoTracking()
                join e in _db.Employees.AsNoTracking() on p.EmployeeId equals e.Id into emps
                from e in emps.DefaultIfEmpty()
                where p.TenantId == tenantId && p.Year == targetYear && p.Month == targetMonth && !p.IsDeleted && p.Tds > 0
                select new
                {
                    EmployeeCode = e != null ? e.EmployeeCode : string.Empty,
                    EmployeeName = e != null ? (e.FullName ?? e.EmployeeCode) : string.Empty,
                    p.Gross,
                    p.Tds
                })
                .OrderBy(r => r.EmployeeCode)
                .ToListAsync(ct);

            return Ok(new
            {
                month = targetMonth,
                year = targetYear,
                employeeCount = rows.Count,
                totalTds = rows.Sum(r => r.Tds),
                rows
            });
        }

        // ─── STATUTORY SUMMARY ────────────────────────────────────────────────

        /// <summary>GET api/v1/payroll/statutory/dashboard — compliance dashboard KPIs</summary>
        [HttpGet("dashboard")]
        public async Task<IActionResult> Dashboard([FromQuery] DateTime? month, CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var period = month ?? DateTime.UtcNow;
            var monthYear = ToMonthYear(period);

            var pf = await _db.ProvidentFunds.AsNoTracking()
                .Where(p => p.TenantId == tenantId && p.MonthYear == monthYear && !p.IsDeleted)
                .SumAsync(p => p.EmployeeContribution + p.EmployerContributionPF + p.EmployerContributionEPS, ct);

            var esi = await _db.EmployeeStateInsurances.AsNoTracking()
                .Where(e => e.TenantId == tenantId && e.MonthYear == monthYear && !e.IsDeleted)
                .SumAsync(e => e.EmployeeContribution + e.EmployerContribution, ct);

            var tds = await _db.Payslips.AsNoTracking()
                .Where(p => p.TenantId == tenantId && p.Year == period.Year && p.Month == period.Month && !p.IsDeleted)
                .SumAsync(p => p.Tds, ct);

            var pt = await _db.Payslips.AsNoTracking()
                .Where(p => p.TenantId == tenantId && p.Year == period.Year && p.Month == period.Month && !p.IsDeleted)
                .SumAsync(p => p.ProfessionalTax, ct);

            return Ok(new
            {
                period = period.ToString("yyyy-MM"),
                pfTotal = pf,
                esiTotal = esi,
                tdsTotal = tds,
                ptTotal = pt,
                grandTotal = pf + esi + tds + pt
            });
        }
    }
}
