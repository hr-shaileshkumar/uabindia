using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/hrms")]
    [Authorize]
    public class GlobalHrmsController : ControllerBase
    {
        private readonly IPayrollCalculationEngine _payrollRouter;
        private readonly IHrLifecycleService _lifecycleService;
        private readonly IAttendanceVerificationService _attendanceService;
        private readonly ITenantAccessor _tenantAccessor;

        public GlobalHrmsController(
            IPayrollCalculationEngine payrollRouter,
            IHrLifecycleService lifecycleService,
            IAttendanceVerificationService attendanceService,
            ITenantAccessor tenantAccessor)
        {
            _payrollRouter = payrollRouter;
            _lifecycleService = lifecycleService;
            _attendanceService = attendanceService;
            _tenantAccessor = tenantAccessor;
        }

        [HttpPost("payroll/calculate")]
        public IActionResult CalculatePayroll([FromBody] PayrollCalculationRequest request)
        {
            var result = _payrollRouter.CalculatePayroll(request);
            return Ok(new { success = true, data = result });
        }

        public class InitializeLifecycleApiRequest
        {
            public Guid EmployeeId { get; set; }
            public string LifecycleKind { get; set; } = "Onboarding";
        }

        [HttpPost("lifecycle/initialize")]
        public async Task<IActionResult> InitializeLifecycle([FromBody] InitializeLifecycleApiRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var result = await _lifecycleService.InitializeEmployeeLifecycleTasksAsync(tenantId, req.EmployeeId, req.LifecycleKind);
            return Ok(new { success = true, data = result });
        }

        public class PunchVerifyApiRequest
        {
            public Guid EmployeeId { get; set; }
            public string PunchType { get; set; } = "IN";
            public decimal Latitude { get; set; }
            public decimal Longitude { get; set; }
            public decimal? OfficeLatitude { get; set; }
            public decimal? OfficeLongitude { get; set; }
            public double MaxRadiusMeters { get; set; } = 300;
            public string? DeviceId { get; set; }
            public string? Source { get; set; }
        }

        [HttpPost("attendance/punch-verify")]
        public async Task<IActionResult> PunchVerify([FromBody] PunchVerifyApiRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var punchReq = new AttendancePunchRequest
            {
                TenantId = tenantId,
                EmployeeId = req.EmployeeId,
                PunchType = req.PunchType,
                Latitude = req.Latitude,
                Longitude = req.Longitude,
                DeviceId = req.DeviceId,
                Source = req.Source
            };

            var result = await _attendanceService.VerifyAndRecordPunchAsync(
                punchReq,
                req.OfficeLatitude,
                req.OfficeLongitude,
                req.MaxRadiusMeters);

            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.ErrorMessage });
            }

            return Ok(new { success = true, data = result });
        }
    }
}
