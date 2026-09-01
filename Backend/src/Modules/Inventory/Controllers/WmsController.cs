using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Inventory.Controllers
{
    [ApiController]
    [Route("api/v1/inventory/wms")]
    [Authorize]
    public class WmsController : ControllerBase
    {
        private readonly IWmsService _wmsService;
        private readonly ITenantAccessor _tenantAccessor;

        public WmsController(
            IWmsService wmsService,
            ITenantAccessor tenantAccessor)
        {
            _wmsService = wmsService;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("bins")]
        public async Task<IActionResult> GetBins([FromQuery] Guid? warehouseId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var bins = await _wmsService.GetWarehouseBinHierarchyAsync(tenantId, warehouseId);
            return Ok(new { success = true, data = bins });
        }

        [HttpPost("put-away")]
        public async Task<IActionResult> ExecutePutAway([FromBody] ScanBarcodePutAwayRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var result = await _wmsService.ExecutePutAwayScanAsync(tenantId, req);
            return Ok(new { success = true, data = result });
        }

        [HttpPost("pick-pack")]
        public async Task<IActionResult> ExecutePickPack([FromBody] ScanBarcodePickPackRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var result = await _wmsService.ExecutePickPackScanAsync(tenantId, req);
            return Ok(new { success = true, data = result });
        }
    }
}
