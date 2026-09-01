using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Sales.Controllers
{
    [ApiController]
    [Route("api/v1/sales/portal")]
    [Authorize]
    public class B2BPortalController : ControllerBase
    {
        private readonly IB2BPortalService _portalService;
        private readonly ITenantAccessor _tenantAccessor;

        public B2BPortalController(
            IB2BPortalService portalService,
            ITenantAccessor tenantAccessor)
        {
            _portalService = portalService;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview(
            [FromQuery] Guid? partnerId = null,
            [FromQuery] string partnerType = "Customer")
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var targetPartnerId = partnerId ?? Guid.Parse("00000000-0000-0000-0000-000000000001");
            var overview = await _portalService.GetPartnerPortalOverviewAsync(tenantId, targetPartnerId, partnerType);

            return Ok(new { success = true, data = overview });
        }

        [HttpPost("accept-quotation")]
        public async Task<IActionResult> AcceptQuotation([FromBody] AcceptQuotationRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var success = await _portalService.AcceptQuotationAsync(tenantId, req);
            return Ok(new { success = true, message = "Quotation digitally signed and approved." });
        }
    }
}
