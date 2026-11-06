using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Manufacturing.Controllers
{
    [ApiController]
    [Route("api/v1/manufacturing/mrp")]
    [Authorize]
    public class MrpController : ControllerBase
    {
        private readonly IMrpEngineService _mrpService;
        private readonly ITenantAccessor _tenantAccessor;

        public MrpController(IMrpEngineService mrpService, ITenantAccessor tenantAccessor)
        {
            _mrpService = mrpService;
            _tenantAccessor = tenantAccessor;
        }

        public class CalculateMrpApiRequest
        {
            public Guid FinishedGoodItemId { get; set; }
            public decimal TargetProductionQuantity { get; set; } = 1;
            public DateTime? RequiredByDate { get; set; }
        }

        [HttpPost("calculate-requirements")]
        public async Task<IActionResult> CalculateRequirements([FromBody] CalculateMrpApiRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var mrpReq = new MrpCalculationRequest
            {
                TenantId = tenantId,
                FinishedGoodItemId = req.FinishedGoodItemId,
                TargetProductionQuantity = req.TargetProductionQuantity,
                RequiredByDate = req.RequiredByDate ?? DateTime.UtcNow.AddDays(14)
            };

            var result = await _mrpService.CalculateMaterialRequirementsAsync(mrpReq);
            return Ok(new { success = true, data = result });
        }
    }
}
