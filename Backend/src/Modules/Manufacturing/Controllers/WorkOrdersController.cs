using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Manufacturing.Controllers
{
    [ApiController]
    [Route("api/v1/manufacturing/work-orders")]
    [Authorize]
    public class WorkOrdersController : ControllerBase
    {
        private readonly IWorkOrderService _workOrderService;
        private readonly ITenantAccessor _tenantAccessor;

        public WorkOrdersController(
            IWorkOrderService workOrderService,
            ITenantAccessor tenantAccessor)
        {
            _workOrderService = workOrderService;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? status = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var orders = await _workOrderService.GetWorkOrdersAsync(tenantId, status);
            return Ok(new { success = true, data = orders });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateWorkOrderRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var order = await _workOrderService.CreateWorkOrderAsync(tenantId, req);
            return Ok(new { success = true, data = order });
        }

        [HttpPost("{id:guid}/operations/update-status")]
        public async Task<IActionResult> UpdateOperation(Guid id, [FromBody] UpdateOperationStatusRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var updated = await _workOrderService.UpdateOperationStatusAsync(tenantId, id, req);
            if (updated == null)
            {
                return NotFound(new { success = false, message = "Work order or operation sequence not found." });
            }

            return Ok(new { success = true, data = updated });
        }

        [HttpPost("{id:guid}/complete")]
        public async Task<IActionResult> Complete(Guid id, [FromBody] CompleteWorkOrderRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var completed = await _workOrderService.CompleteWorkOrderAsync(tenantId, id, req);
            if (completed == null)
            {
                return NotFound(new { success = false, message = "Work order not found." });
            }

            return Ok(new { success = true, data = completed });
        }
    }
}
