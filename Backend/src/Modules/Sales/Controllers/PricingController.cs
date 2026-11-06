using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Sales.Controllers
{
    [ApiController]
    [Route("api/v1/sales/pricing")]
    [Authorize]
    public class PricingController : ControllerBase
    {
        private readonly IPricingEngineService _pricingService;
        private readonly ITenantAccessor _tenantAccessor;

        public PricingController(
            IPricingEngineService pricingService,
            ITenantAccessor tenantAccessor)
        {
            _pricingService = pricingService;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("price-lists")]
        public async Task<IActionResult> GetPriceLists()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var lists = await _pricingService.GetPriceListsAsync(tenantId);
            return Ok(new { success = true, data = lists });
        }

        [HttpPost("calculate-effective-price")]
        public async Task<IActionResult> CalculateEffectivePrice([FromBody] PriceCalculationRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var result = await _pricingService.CalculateEffectivePriceAsync(tenantId, req);
            return Ok(new { success = true, data = result });
        }

        [HttpPost("price-lists")]
        public async Task<IActionResult> SavePriceList([FromBody] PriceListSummaryDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var saved = await _pricingService.SavePriceListAsync(tenantId, dto);
            return Ok(new { success = true, data = saved });
        }
    }
}
