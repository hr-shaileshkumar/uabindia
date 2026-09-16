using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/hrms/dashboard")]
    [Route("api/v1/hr/dashboard")]
    [Route("api/v1/hr")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class HumanResourcesDashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public HumanResourcesDashboardController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var today = DateTime.UtcNow.Date;

            var totalEmployees = await _db.Employees.CountAsync(e => e.TenantId == tenantId);
            var activeEmployees = await _db.Employees.CountAsync(e => e.TenantId == tenantId && (e.Status == null || e.Status == "Active"));
            var onLeaveToday = await _db.LeaveRequests.CountAsync(r => r.TenantId == tenantId && r.Status == "Approved" && r.FromDate <= today && r.ToDate >= today);

            var presentToday = await _db.AttendanceRecords
                .Where(a => a.TenantId == tenantId && a.Timestamp.Date == today)
                .Select(a => a.EmployeeId)
                .Distinct()
                .CountAsync();

            var pendingLeaves = await _db.LeaveRequests.CountAsync(r => r.TenantId == tenantId && r.Status == "Pending");

            var response = new
            {
                totalEmployees,
                activeEmployees,
                onLeaveToday,
                newJoinersMTD = 0,
                exitsMTD = 0,
                openPositions = 0,
                presentToday,
                absentToday = Math.Max(0, totalEmployees - presentToday - onLeaveToday),
                lateCheckins = 0,
                attendancePctMTD = totalEmployees == 0 ? 0 : Math.Round((double)presentToday / totalEmployees * 100, 1),
                pendingLeaves,
                approvedLeavesMTD = 0,
                leaveAlerts = 0,
                attendanceTrend = Array.Empty<int>(),
                headcountTrend = Array.Empty<int>(),
                attritionTrend = Array.Empty<int>(),
                activity = Array.Empty<object>()
            };

            return Ok(response);
        }
    }

    [NonController]
    [Obsolete("Use HumanResourcesDashboardController instead.")]
    public class HrController : HumanResourcesDashboardController
    {
        public HrController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
            : base(db, tenantAccessor) { }
    }
}

