using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Inventory.Controllers
{
    [ApiController]
    [Route("api/v1/inventory/forecasting")]
    [Authorize]
    public class DemandForecastingController : ControllerBase
    {
        private readonly IDemandForecastingService _forecastingService;
        private readonly ITenantAccessor _tenantAccessor;

        public DemandForecastingController(
            IDemandForecastingService forecastingService,
            ITenantAccessor tenantAccessor)
        {
            _forecastingService = forecastingService;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("simulate")]
        public async Task<IActionResult> Simulate([FromQuery] Guid? warehouseId = null, [FromQuery] double serviceLevel = 1.65)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var result = await _forecastingService.GenerateDemandForecastAsync(
                tenantId,
                warehouseId,
                serviceLevel);

            return Ok(new { success = true, data = result });
        }
    }
}
