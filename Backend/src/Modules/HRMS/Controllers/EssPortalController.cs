using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    /// <summary>
    /// Dedicated Employee Self-Service (ESS) Portal Controller.
    /// Provides the current employee with direct access to their profile, dashboard,
    /// attendance, clock in/out, leave requests, payslips, and self-service updates.
    /// Routes: api/v1/portal | api/v1/ess | api/v1/hrms/employees/me
    /// </summary>
    [ApiController]
    [Authorize]
    [Route("api/v1/portal")]
    public class EssPortalController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public EssPortalController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private Guid GetUserId()
        {
            var raw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value
                   ?? User.FindFirst("uid")?.Value;
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }

        private async Task<Employee?> GetCurrentEmployeeAsync(CancellationToken ct = default)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return null;

            var tenantId = _tenantAccessor.GetTenantId();
            return await _db.Employees.AsNoTracking()
                .FirstOrDefaultAsync(e => e.UserId == userId && e.TenantId == tenantId && !e.IsDeleted, ct);
        }

        /// <summary>
        /// GET api/v1/portal/dashboard — Complete personal dashboard for the logged-in employee.
        /// </summary>
        [HttpGet("dashboard")]
        [HttpGet("me")]
        public async Task<IActionResult> GetDashboard(CancellationToken ct = default)
        {
            var emp = await GetCurrentEmployeeAsync(ct);
            if (emp == null) return NotFound(new { message = "No employee record associated with this account." });

            var today = DateTime.UtcNow.Date;
            var startOfMonth = new DateTime(today.Year, today.Month, 1);
            var endOfMonth = startOfMonth.AddMonths(1).AddTicks(-1);

            // Today's attendance punches
            var todayPunches = await _db.AttendanceRecords.AsNoTracking()
                .Where(a => a.EmployeeId == emp.Id && a.Timestamp >= today && a.Timestamp < today.AddDays(1) && !a.IsDeleted)
                .OrderBy(a => a.Timestamp)
                .ToListAsync(ct);

            var lastPunch = todayPunches.LastOrDefault();
            var clockStatus = lastPunch?.PunchType == "IN" ? "ClockedIn" : "ClockedOut";

            // Monthly attendance summary
            var monthPunches = await _db.AttendanceRecords.AsNoTracking()
                .Where(a => a.EmployeeId == emp.Id && a.Timestamp >= startOfMonth && a.Timestamp <= endOfMonth && !a.IsDeleted)
                .ToListAsync(ct);

            var daysPresent = monthPunches.Select(p => p.Timestamp.Date).Distinct().Count();

            // Leave summary
            var leaveAllocations = await _db.LeaveAllocations.AsNoTracking()
                .Where(l => l.EmployeeId == emp.Id && l.Year == today.Year && !l.IsDeleted)
                .ToListAsync(ct);

            var totalLeaveAllocated = leaveAllocations.Sum(l => l.AllocatedDays + (l.CarryForwardDays ?? 0m));

            var leavesTaken = await _db.LeaveRequests.AsNoTracking()
                .Where(r => r.EmployeeId == emp.Id && r.FromDate.Year == today.Year && r.Status == "Approved" && !r.IsDeleted)
                .SumAsync(r => r.Days, ct);

            var pendingLeaveCount = await _db.LeaveRequests.AsNoTracking()
                .Where(r => r.EmployeeId == emp.Id && r.Status == "Pending" && !r.IsDeleted)
                .CountAsync(ct);

            // Recent payslips (last 3)
            var recentPayslips = await _db.Payslips.AsNoTracking()
                .Where(p => p.EmployeeId == emp.Id && !p.IsDeleted)
                .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month)
                .Take(3)
                .Select(p => new
                {
                    p.Id,
                    p.Month,
                    p.Year,
                    p.Gross,
                    p.Net,
                    p.TotalDeductions
                })
                .ToListAsync(ct);

            // Fetch Department, Designation, Branch names
            string? deptName = null;
            if (emp.DepartmentId.HasValue)
            {
                var d = await _db.Departments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == emp.DepartmentId.Value, ct);
                deptName = d?.Name;
            }

            string? desigName = null;
            if (emp.DesignationId.HasValue)
            {
                var dg = await _db.Designations.AsNoTracking().FirstOrDefaultAsync(x => x.Id == emp.DesignationId.Value, ct);
                desigName = dg?.Name;
            }

            return Ok(new
            {
                employee = new
                {
                    emp.Id,
                    emp.EmployeeCode,
                    emp.FullName,
                    emp.WorkEmail,
                    emp.Phone,
                    emp.DateOfJoining,
                    emp.Status,
                    Department = deptName,
                    Designation = desigName,
                    emp.WorkLocation
                },
                today = new
                {
                    date = today.ToString("yyyy-MM-dd"),
                    clockStatus,
                    firstPunchIn = todayPunches.FirstOrDefault(p => p.PunchType == "IN")?.Timestamp,
                    lastPunchOut = todayPunches.LastOrDefault(p => p.PunchType == "OUT")?.Timestamp,
                    totalPunchesToday = todayPunches.Count
                },
                monthlyAttendance = new
                {
                    month = today.Month,
                    year = today.Year,
                    daysPresent
                },
                leaveBalance = new
                {
                    totalAllocated = totalLeaveAllocated,
                    taken = leavesTaken,
                    available = Math.Max(0, totalLeaveAllocated - leavesTaken),
                    pendingRequests = pendingLeaveCount
                },
                recentPayslips
            });
        }

        /// <summary>
        /// GET api/v1/portal/profile — Full employee self-service profile.
        /// </summary>
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile(CancellationToken ct = default)
        {
            var emp = await GetCurrentEmployeeAsync(ct);
            if (emp == null) return NotFound(new { message = "No employee record found." });
            return Ok(emp);
        }

        /// <summary>
        /// PUT api/v1/portal/profile — Employee updates their personal contact and address details.
        /// </summary>
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateEmployeeSelfProfileDto dto, CancellationToken ct = default)
        {
            var userId = GetUserId();
            var tenantId = _tenantAccessor.GetTenantId();
            var emp = await _db.Employees.FirstOrDefaultAsync(e => e.UserId == userId && e.TenantId == tenantId && !e.IsDeleted, ct);
            if (emp == null) return NotFound(new { message = "No employee record found." });

            if (!string.IsNullOrWhiteSpace(dto.Phone)) emp.Phone = dto.Phone;
            if (!string.IsNullOrWhiteSpace(dto.AlternatePhone)) emp.AlternatePhone = dto.AlternatePhone;
            if (!string.IsNullOrWhiteSpace(dto.PersonalEmail)) emp.PersonalEmail = dto.PersonalEmail;
            if (!string.IsNullOrWhiteSpace(dto.Address)) emp.Address = dto.Address;
            if (!string.IsNullOrWhiteSpace(dto.City)) emp.City = dto.City;
            if (!string.IsNullOrWhiteSpace(dto.State)) emp.State = dto.State;
            if (!string.IsNullOrWhiteSpace(dto.PostalCode)) emp.PostalCode = dto.PostalCode;

            emp.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Profile updated successfully.", employee = emp });
        }

        /// <summary>
        /// POST api/v1/portal/clock-in — Quick clock in for current employee.
        /// </summary>
        [HttpPost("clock-in")]
        public async Task<IActionResult> ClockIn([FromBody] ClockInOutRequest? req, CancellationToken ct = default)
        {
            var emp = await GetCurrentEmployeeAsync(ct);
            if (emp == null) return NotFound(new { message = "No employee record found." });

            var punch = new AttendanceRecord
            {
                TenantId = _tenantAccessor.GetTenantId(),
                EmployeeId = emp.Id,
                ProjectId = emp.ProjectId,
                PunchType = "IN",
                Timestamp = DateTime.UtcNow,
                Latitude = req?.Latitude,
                Longitude = req?.Longitude,
                Source = req?.Source ?? "WebPortal",
                GeoValidated = true,
                CreatedAt = DateTime.UtcNow
            };

            _db.AttendanceRecords.Add(punch);
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Clocked in successfully.", timestamp = punch.Timestamp });
        }

        /// <summary>
        /// POST api/v1/portal/clock-out — Quick clock out for current employee.
        /// </summary>
        [HttpPost("clock-out")]
        public async Task<IActionResult> ClockOut([FromBody] ClockInOutRequest? req, CancellationToken ct = default)
        {
            var emp = await GetCurrentEmployeeAsync(ct);
            if (emp == null) return NotFound(new { message = "No employee record found." });

            var punch = new AttendanceRecord
            {
                TenantId = _tenantAccessor.GetTenantId(),
                EmployeeId = emp.Id,
                ProjectId = emp.ProjectId,
                PunchType = "OUT",
                Timestamp = DateTime.UtcNow,
                Latitude = req?.Latitude,
                Longitude = req?.Longitude,
                Source = req?.Source ?? "WebPortal",
                GeoValidated = true,
                CreatedAt = DateTime.UtcNow
            };

            _db.AttendanceRecords.Add(punch);
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Clocked out successfully.", timestamp = punch.Timestamp });
        }

        /// <summary>
        /// GET api/v1/portal/leaves — Current employee's leave balance &amp; request history.
        /// </summary>
        [HttpGet("leaves")]
        public async Task<IActionResult> GetMyLeaves(CancellationToken ct = default)
        {
            var emp = await GetCurrentEmployeeAsync(ct);
            if (emp == null) return NotFound(new { message = "No employee record found." });

            var year = DateTime.UtcNow.Year;
            var allocations = await _db.LeaveAllocations.AsNoTracking()
                .Where(l => l.EmployeeId == emp.Id && l.Year == year && !l.IsDeleted)
                .ToListAsync(ct);

            var requests = await _db.LeaveRequests.AsNoTracking()
                .Where(r => r.EmployeeId == emp.Id && !r.IsDeleted)
                .OrderByDescending(r => r.FromDate)
                .Take(20)
                .ToListAsync(ct);

            return Ok(new { year, allocations, requests });
        }
    }

    public class UpdateEmployeeSelfProfileDto
    {
        public string? Phone { get; set; }
        public string? AlternatePhone { get; set; }
        public string? PersonalEmail { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
    }

    public class ClockInOutRequest
    {
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? Source { get; set; }
    }
}
