using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/system")]
    [Authorize]
    public class SystemController : ControllerBase
    {
        private readonly ISystemMetrics? _metrics;
        private readonly IIndianEnterpriseDemoSeeder? _demoSeeder;
        private readonly ITenantAccessor? _tenantAccessor;

        public SystemController(
            ISystemMetrics? metrics = null,
            IIndianEnterpriseDemoSeeder? demoSeeder = null,
            ITenantAccessor? tenantAccessor = null)
        {
            _metrics = metrics;
            _demoSeeder = demoSeeder;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("financial-years")]
        public IActionResult GetFinancialYears()
        {
            var today = DateTime.UtcNow.Date;
            var startYear = today.Month >= 4 ? today.Year : today.Year - 1;
            var years = new List<object>();

            for (var y = startYear - 2; y <= startYear + 1; y++)
            {
                var fyStart = new DateTime(y, 4, 1);
                var fyEnd = new DateTime(y + 1, 3, 31);
                var label = $"{y}-{(y + 1).ToString().Substring(2)}";

                years.Add(new
                {
                    key = $"{y}-{y + 1}",
                    label,
                    startDate = fyStart,
                    endDate = fyEnd,
                    isCurrent = y == startYear
                });
            }

            return Ok(years);
        }

        [HttpGet("metrics/summary")]
        public IActionResult GetMetricsSummary()
        {
            if (_metrics == null)
            {
                return Ok(new SystemMetricsSummary());
            }

            return Ok(_metrics.GetSummary());
        }

        [HttpPost("seed-demo-data")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> SeedDemoData()
        {
            if (_demoSeeder == null || _tenantAccessor == null)
            {
                return BadRequest(new { success = false, message = "Demo seeder service unavailable." });
            }

            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Valid tenant context required." });
            }

            var result = await _demoSeeder.SeedDemoTenantAsync(tenantId);
            return Ok(result);
        }
    }
}
