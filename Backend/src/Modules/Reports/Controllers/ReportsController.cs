using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Reports.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Authorize(Policy = "Module:reports")]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public ReportsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        // ===== HR REPORTS =====

        [HttpGet("hr/overview")]
        public async Task<IActionResult> HROverview()
        {
            var totalEmployees = await _db.Employees.CountAsync(e => !e.IsDeleted);
            var activeEmployees = await _db.Employees.CountAsync(e => !e.IsDeleted && e.Status == "Active");
            var totalCompanies = await _db.Companies.CountAsync(c => !c.IsDeleted);

            return Ok(new
            {
                totalEmployees,
                activeEmployees,
                inactiveEmployees = totalEmployees - activeEmployees,
                totalCompanies
            });
        }

        [HttpGet("hr/headcount")]
        public async Task<IActionResult> HeadcountByCompany()
        {
            var headcount = await _db.Employees
                .Where(e => !e.IsDeleted)
                .GroupBy(e => e.CompanyId)
                .Select(g => new
                {
                    companyId = g.Key,
                    count = g.Count(),
                    activeCount = g.Count(e => e.Status == "Active")
                })
                .ToListAsync();

            // Enrich with company names
            var companyIds = headcount.Select(h => h.companyId).ToList();
            var companies = await _db.Companies
                .Where(c => companyIds.Contains(c.Id))
                .Select(c => new { c.Id, c.Name })
                .ToListAsync();

            var result = headcount.Select(h => new
            {
                companyId = h.companyId,
                companyName = companies.FirstOrDefault(c => c.Id == h.companyId)?.Name ?? "Unknown",
                totalEmployees = h.count,
                activeEmployees = h.activeCount
            });

            return Ok(result);
        }

        [HttpGet("hr/attendance-summary")]
        public async Task<IActionResult> AttendanceSummary([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            var from = fromDate ?? DateTime.UtcNow.AddDays(-30);
            var to = toDate ?? DateTime.UtcNow;

            var total = await _db.AttendanceRecords
                .CountAsync(a => a.Timestamp >= from && a.Timestamp <= to);

            var byDate = await _db.AttendanceRecords
                .Where(a => a.Timestamp >= from && a.Timestamp <= to)
                .GroupBy(a => a.Timestamp.Date)
                .Select(g => new
                {
                    date = g.Key,
                    punchIns = g.Count(a => a.PunchType == "IN"),
                    punchOuts = g.Count(a => a.PunchType == "OUT"),
                    total = g.Count()
                })
                .OrderBy(x => x.date)
                .ToListAsync();

            return Ok(new
            {
                totalRecords = total,
                dateRange = new { from, to },
                daily = byDate
            });
        }

        [HttpGet("hr/leave-summary")]
        public async Task<IActionResult> LeaveSummary([FromQuery] int? year)
        {
            var targetYear = year ?? DateTime.UtcNow.Year;

            var leaveRequests = await _db.LeaveRequests
                .Where(lr => lr.FromDate.Year == targetYear || lr.ToDate.Year == targetYear)
                .GroupBy(lr => lr.Status)
                .Select(g => new
                {
                    status = g.Key,
                    count = g.Count(),
                    totalDays = g.Sum(lr => lr.Days)
                })
                .ToListAsync();

            var totalRequests = leaveRequests.Sum(lr => lr.count);
            var approvedDays = leaveRequests.Where(lr => lr.status == "Approved").Sum(lr => lr.totalDays);

            return Ok(new
            {
                year = targetYear,
                totalRequests,
                approvedDays,
                byStatus = leaveRequests
            });
        }

        [HttpGet("hr/project-compare")]
        public async Task<IActionResult> ProjectCompare(
            [FromQuery] Guid? companyId,
            [FromQuery] Guid[]? projectIds,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var fromDateValue = fromDate ?? DateTime.UtcNow.AddDays(-30);
            var toDateValue = toDate ?? DateTime.UtcNow;

            var projectsQuery = _db.Projects
                .AsNoTracking()
                .Where(p => !p.IsDeleted);

            if (companyId.HasValue)
            {
                projectsQuery = projectsQuery.Where(p => p.CompanyId == companyId.Value);
            }

            if (projectIds is { Length: > 0 })
            {
                projectsQuery = projectsQuery.Where(p => projectIds.Contains(p.Id));
            }

            var projects = await projectsQuery
                .Select(p => new
                {
                    p.Id,
                    p.Name
                })
                .ToListAsync();

            if (projects.Count == 0)
            {
                return Ok(new
                {
                    projects = Array.Empty<object>(),
                    dateRange = new { from = fromDateValue, to = toDateValue }
                });
            }

            var targetProjectIds = projects.Select(p => p.Id).ToList();

            var employeeStats = await _db.Employees
                .AsNoTracking()
                .Where(e => !e.IsDeleted && e.ProjectId.HasValue && targetProjectIds.Contains(e.ProjectId.Value))
                .GroupBy(e => e.ProjectId!.Value)
                .Select(g => new
                {
                    projectId = g.Key,
                    totalEmployees = g.Count(),
                    activeEmployees = g.Count(e => e.Status == "Active" || e.Status == "active")
                })
                .ToListAsync();

            var attendanceStats = await _db.AttendanceRecords
                .AsNoTracking()
                .Where(a => a.ProjectId.HasValue
                            && targetProjectIds.Contains(a.ProjectId.Value)
                            && a.Timestamp >= fromDateValue
                            && a.Timestamp <= toDateValue)
                .GroupBy(a => a.ProjectId!.Value)
                .Select(g => new
                {
                    projectId = g.Key,
                    attendanceRecords = g.Count()
                })
                .ToListAsync();

            var leaveStats = await (
                from lr in _db.LeaveRequests.AsNoTracking()
                join e in _db.Employees.AsNoTracking() on lr.EmployeeId equals e.Id
                where !lr.IsDeleted
                      && !e.IsDeleted
                      && e.ProjectId != null
                      && targetProjectIds.Contains(e.ProjectId ?? Guid.Empty)
                        && lr.FromDate <= toDateValue
                        && lr.ToDate >= fromDateValue
                group lr by e.ProjectId into g
                select new
                {
                    projectId = g.Key ?? Guid.Empty,
                    leaveRequests = g.Count(),
                    approvedLeaveDays = g.Where(x => x.Status == "Approved").Sum(x => (decimal?)x.Days) ?? 0
                })
                .ToListAsync();

            var rows = projects.Select(project =>
            {
                var employee = employeeStats.FirstOrDefault(x => x.projectId == project.Id);
                var attendance = attendanceStats.FirstOrDefault(x => x.projectId == project.Id);
                var leave = leaveStats.FirstOrDefault(x => x.projectId == project.Id);

                return new
                {
                    projectId = project.Id,
                    projectName = project.Name,
                    totalEmployees = employee?.totalEmployees ?? 0,
                    activeEmployees = employee?.activeEmployees ?? 0,
                    attendanceRecords = attendance?.attendanceRecords ?? 0,
                    leaveRequests = leave?.leaveRequests ?? 0,
                    approvedLeaveDays = leave?.approvedLeaveDays ?? 0
                };
            });

            return Ok(new
            {
                projects = rows,
                dateRange = new { from = fromDateValue, to = toDateValue }
            });
        }

        // ===== PAYROLL REPORTS =====

        [HttpGet("payroll/overview")]
        public async Task<IActionResult> PayrollOverview()
        {
            var totalRuns = await _db.PayrollRuns.CountAsync();
            var completedRuns = await _db.PayrollRuns.CountAsync(pr => pr.Status == "Completed");
            var totalPayslips = await _db.Payslips.CountAsync();
            var totalPayout = await _db.Payslips.SumAsync(p => (decimal?)p.Net) ?? 0;

            return Ok(new
            {
                totalRuns,
                completedRuns,
                draftRuns = totalRuns - completedRuns,
                totalPayslips,
                totalPayout
            });
        }

        [HttpGet("payroll/monthly")]
        public async Task<IActionResult> MonthlyPayroll([FromQuery] int? year)
        {
            var targetYear = year ?? DateTime.UtcNow.Year;

            var monthly = await _db.PayrollRuns
                .Where(pr => pr.RunDate.Year == targetYear && pr.Status == "Completed")
                .GroupBy(pr => pr.RunDate.Month)
                .Select(g => new
                {
                    month = g.Key,
                    runsCount = g.Count(),
                    payslipsCount = _db.Payslips.Count(p => g.Select(r => r.Id).Contains(p.PayrollRunId)),
                    totalGross = _db.Payslips.Where(p => g.Select(r => r.Id).Contains(p.PayrollRunId)).Sum(p => (decimal?)p.Gross) ?? 0,
                    totalNet = _db.Payslips.Where(p => g.Select(r => r.Id).Contains(p.PayrollRunId)).Sum(p => (decimal?)p.Net) ?? 0
                })
                .OrderBy(x => x.month)
                .ToListAsync();

            return Ok(new
            {
                year = targetYear,
                monthly
            });
        }

        [HttpGet("payroll/components")]
        public async Task<IActionResult> ComponentsBreakdown()
        {
            var components = await _db.PayrollComponents
                .GroupBy(pc => new { pc.Type, pc.IsStatutory })
                .Select(g => new
                {
                    type = g.Key.Type,
                    isStatutory = g.Key.IsStatutory,
                    count = g.Count(),
                    avgAmount = g.Average(pc => pc.Amount ?? 0),
                    avgPercentage = g.Average(pc => pc.Percentage ?? 0)
                })
                .ToListAsync();

            return Ok(components);
        }

        [HttpGet("payroll/structures")]
        public async Task<IActionResult> StructuresReport()
        {
            var now = DateTime.UtcNow;

            var structures = await _db.PayrollStructures
                .Select(ps => new
                {
                    id = ps.Id,
                    name = ps.Name,
                    effectiveFrom = ps.EffectiveFrom,
                    effectiveTo = ps.EffectiveTo,
                    isActive = ps.EffectiveTo == null || ps.EffectiveTo > now,
                    componentsCount = _db.PayrollComponents.Count(pc => pc.StructureId == ps.Id)
                })
                .OrderByDescending(x => x.effectiveFrom)
                .ToListAsync();

            return Ok(structures);
        }

        // ===== COMPLIANCE REPORTS =====

        [HttpGet("compliance/audit-log")]
        public async Task<IActionResult> AuditLogSummary([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            var from = fromDate ?? DateTime.UtcNow.AddDays(-30);
            var to = toDate ?? DateTime.UtcNow;

            var logs = await _db.AuditLogs
                .Where(al => al.PerformedAt >= from && al.PerformedAt <= to)
                .GroupBy(al => new { al.EntityName, al.Action })
                .Select(g => new
                {
                    entity = g.Key.EntityName,
                    action = g.Key.Action,
                    count = g.Count()
                })
                .OrderByDescending(x => x.count)
                .ToListAsync();

            var totalLogs = logs.Sum(l => l.count);

            return Ok(new
            {
                totalLogs,
                dateRange = new { from, to },
                breakdown = logs
            });
        }

        [HttpGet("compliance/data-quality")]
        public async Task<IActionResult> DataQualitySummary()
        {
            var employeesWithoutCode = await _db.Employees.CountAsync(e => string.IsNullOrEmpty(e.EmployeeCode));
            var employeesWithoutProject = await _db.Employees.CountAsync(e => e.ProjectId == null);
            var employeesWithoutManager = await _db.Employees.CountAsync(e => e.ManagerId == null);

            var totalEmployees = await _db.Employees.CountAsync();

            return Ok(new
            {
                totalEmployees,
                missingEmployeeCode = employeesWithoutCode,
                missingProject = employeesWithoutProject,
                missingManager = employeesWithoutManager,
                dataQualityScore = totalEmployees > 0 
                    ? (1.0 - ((employeesWithoutCode + employeesWithoutProject + employeesWithoutManager) / (double)(totalEmployees * 3))) * 100
                    : 100
            });
        }

        [HttpGet("compliance/module-usage")]
        public async Task<IActionResult> ModuleUsageSummary()
        {
            var tenantModules = await _db.TenantModules
                .Where(tm => tm.IsEnabled)
                .GroupBy(tm => tm.ModuleKey)
                .Select(g => new
                {
                    moduleKey = g.Key,
                    enabledTenants = g.Count(),
                    lastEnabled = g.Max(tm => tm.EnabledAt)
                })
                .ToListAsync();

            var modules = await _db.Set<UabIndia.Core.Entities.Module>()
                .Select(m => new { m.ModuleKey, m.DisplayName, m.ModuleType })
                .ToListAsync();

            var result = modules.Select(m => new
            {
                moduleKey = m.ModuleKey,
                displayName = m.DisplayName,
                moduleType = m.ModuleType,
                enabledTenants = tenantModules.FirstOrDefault(tm => tm.moduleKey == m.ModuleKey)?.enabledTenants ?? 0,
                lastEnabled = tenantModules.FirstOrDefault(tm => tm.moduleKey == m.ModuleKey)?.lastEnabled
            });

            return Ok(result);
        }

        // ===== DASHBOARD SUMMARY =====

        [HttpGet("dashboard")]
        public async Task<IActionResult> DashboardSummary()
        {
            var totalEmployees = await _db.Employees.CountAsync();
            var activeEmployees = await _db.Employees.CountAsync(e => e.Status == "Active");
            var todayAttendance = await _db.AttendanceRecords.CountAsync(a => a.Timestamp.Date == DateTime.UtcNow.Date);
            var pendingLeaves = await _db.LeaveRequests.CountAsync(lr => lr.Status == "Pending");
            var thisMonthPayrolls = await _db.PayrollRuns.CountAsync(pr => pr.RunDate.Month == DateTime.UtcNow.Month && pr.RunDate.Year == DateTime.UtcNow.Year);
            var totalPayout = await _db.Payslips.SumAsync(p => (decimal?)p.Net) ?? 0;

            return Ok(new
            {
                hr = new
                {
                    totalEmployees,
                    activeEmployees,
                    todayAttendance,
                    pendingLeaves
                },
                payroll = new
                {
                    thisMonthRuns = thisMonthPayrolls,
                    totalPayout
                },
                timestamp = DateTime.UtcNow
            });
        }
    }
}
