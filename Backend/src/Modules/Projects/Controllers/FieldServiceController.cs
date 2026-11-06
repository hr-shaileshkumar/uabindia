using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Projects.Controllers
{
    [ApiController]
    [Route("api/v1/field-service")]
    [Authorize]
    public class FieldServiceController : ControllerBase
    {
        private readonly IFieldServiceDispatchService _dispatchService;
        private readonly ITenantAccessor _tenantAccessor;

        public FieldServiceController(
            IFieldServiceDispatchService dispatchService,
            ITenantAccessor tenantAccessor)
        {
            _dispatchService = dispatchService;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("tickets")]
        public async Task<IActionResult> GetTickets([FromQuery] string? status = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var tickets = await _dispatchService.GetServiceTicketsAsync(tenantId, status);
            return Ok(new { success = true, data = tickets });
        }

        [HttpPost("tickets")]
        public async Task<IActionResult> CreateTicket([FromBody] ServiceTicketDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var created = await _dispatchService.CreateServiceTicketAsync(tenantId, dto);
            return Ok(new { success = true, data = created });
        }

        [HttpPost("dispatch")]
        public async Task<IActionResult> DispatchTechnician([FromBody] DispatchTechnicianRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var updated = await _dispatchService.DispatchTechnicianAsync(tenantId, req);
            if (updated == null)
            {
                return NotFound(new { success = false, message = "Service ticket not found." });
            }

            return Ok(new { success = true, data = updated });
        }

        [HttpPost("complete")]
        public async Task<IActionResult> CompleteTicket([FromBody] CompleteServiceTicketRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var updated = await _dispatchService.CompleteServiceTicketAsync(tenantId, req);
            if (updated == null)
            {
                return NotFound(new { success = false, message = "Service ticket not found." });
            }

            return Ok(new { success = true, data = updated });
        }
    }
}
