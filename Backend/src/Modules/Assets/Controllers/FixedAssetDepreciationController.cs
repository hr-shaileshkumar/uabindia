using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Assets.Controllers
{
    [ApiController]
    [Route("api/v1/assets/depreciation")]
    [Authorize]
    public class FixedAssetDepreciationController : ControllerBase
    {
        private readonly IFixedAssetDepreciationService _depreciationService;
        private readonly ITenantAccessor _tenantAccessor;

        public FixedAssetDepreciationController(
            IFixedAssetDepreciationService depreciationService,
            ITenantAccessor tenantAccessor)
        {
            _depreciationService = depreciationService;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("schedule")]
        public async Task<IActionResult> GetSchedule(
            [FromQuery] int fiscalYear = 2026,
            [FromQuery] int fiscalMonth = 8)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var result = await _depreciationService.CalculateDepreciationScheduleAsync(tenantId, fiscalYear, fiscalMonth);
            return Ok(new { success = true, data = result });
        }

        [HttpPost("run-post")]
        public async Task<IActionResult> PostDepreciationRun([FromBody] PostDepreciationRunRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var result = await _depreciationService.PostDepreciationRunAsync(tenantId, req);
            return Ok(new { success = true, data = result });
        }
    }
}
