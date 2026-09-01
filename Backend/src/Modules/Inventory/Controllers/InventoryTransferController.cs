using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Inventory.Controllers
{
    [ApiController]
    [Route("api/v1/inventory")]
    [Authorize]
    public class InventoryTransferController : ControllerBase
    {
        private readonly IStockTransferService _transferService;
        private readonly IAutomatedReorderService _reorderService;
        private readonly IBatchTrackingService _batchService;
        private readonly ITenantAccessor _tenantAccessor;

        public InventoryTransferController(
            IStockTransferService transferService,
            IAutomatedReorderService reorderService,
            IBatchTrackingService batchService,
            ITenantAccessor tenantAccessor)
        {
            _transferService = transferService;
            _reorderService = reorderService;
            _batchService = batchService;
            _tenantAccessor = tenantAccessor;
        }

        public class CreateTransferApiRequest
        {
            public Guid FromWarehouseId { get; set; }
            public Guid ToWarehouseId { get; set; }
            public Guid ItemId { get; set; }
            public decimal Quantity { get; set; }
            public Guid? CompanyId { get; set; }
            public string? Notes { get; set; }
        }

        [HttpPost("transfers/create")]
        public async Task<IActionResult> CreateTransfer([FromBody] CreateTransferApiRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var transferReq = new StockTransferRequest
            {
                TenantId = tenantId,
                CompanyId = req.CompanyId,
                FromWarehouseId = req.FromWarehouseId,
                ToWarehouseId = req.ToWarehouseId,
                ItemId = req.ItemId,
                Quantity = req.Quantity,
                Notes = req.Notes
            };

            var result = await _transferService.CreateAndDispatchTransferAsync(transferReq);
            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.ErrorMessage });
            }

            return Ok(new { success = true, data = result });
        }

        public class ReceiveTransferApiRequest
        {
            public decimal? ReceivedQuantity { get; set; }
        }

        [HttpPost("transfers/{id:guid}/receive")]
        public async Task<IActionResult> ReceiveTransfer(Guid id, [FromBody] ReceiveTransferApiRequest req)
        {
            var result = await _transferService.ReceiveTransferAsync(id, req.ReceivedQuantity);
            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.ErrorMessage });
            }

            return Ok(new { success = true, data = result });
        }

        [HttpGet("transfers")]
        public async Task<IActionResult> GetTransfers([FromQuery] Guid? warehouseId = null, [FromQuery] string? status = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var transfers = await _transferService.GetTransfersAsync(tenantId, warehouseId, status);
            return Ok(new { success = true, data = transfers });
        }

        [HttpPost("reorder/evaluate")]
        public async Task<IActionResult> EvaluateReorderPoints([FromQuery] Guid? warehouseId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var result = await _reorderService.EvaluateAndGeneratePurchaseRequestsAsync(tenantId, warehouseId);
            return Ok(new { success = true, data = result });
        }

        [HttpGet("batches/expiring")]
        public async Task<IActionResult> GetExpiringBatches([FromQuery] int daysThreshold = 30)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var alerts = await _batchService.GetExpiringBatchesAsync(tenantId, daysThreshold);
            return Ok(new { success = true, data = alerts });
        }
    }
}
