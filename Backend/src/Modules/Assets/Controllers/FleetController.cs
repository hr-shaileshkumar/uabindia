using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Assets.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class FleetController : ControllerBase
    {
        private readonly IFleetService _fleetService;
        private readonly ITenantAccessor _tenantAccessor;

        public FleetController(IFleetService fleetService, ITenantAccessor tenantAccessor)
        {
            _fleetService = fleetService;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("kpis")]
        public async Task<IActionResult> GetKpis()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var kpis = await _fleetService.GetFleetKpisAsync(tenantId);
            return Ok(new { success = true, data = kpis });
        }

        [HttpGet("vehicles")]
        public async Task<IActionResult> GetVehicles([FromQuery] string? status = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var vehicles = await _fleetService.GetVehiclesAsync(tenantId, status);
            return Ok(new { success = true, data = vehicles });
        }

        [HttpGet("vehicles/{id:guid}")]
        public async Task<IActionResult> GetVehicleById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var vehicle = await _fleetService.GetVehicleByIdAsync(tenantId, id);
            if (vehicle == null)
            {
                return NotFound(new { success = false, message = "Vehicle not found." });
            }

            return Ok(new { success = true, data = vehicle });
        }

        [HttpPost("vehicles")]
        public async Task<IActionResult> CreateVehicle([FromBody] CreateVehicleRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            if (string.IsNullOrWhiteSpace(req.VehicleNumber))
            {
                return BadRequest(new { success = false, message = "Vehicle number is required." });
            }

            var created = await _fleetService.CreateVehicleAsync(tenantId, req);
            return Ok(new { success = true, data = created });
        }

        [HttpPut("vehicles/{id:guid}")]
        public async Task<IActionResult> UpdateVehicle(Guid id, [FromBody] UpdateVehicleRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var updated = await _fleetService.UpdateVehicleAsync(tenantId, id, req);
            if (updated == null)
            {
                return NotFound(new { success = false, message = "Vehicle not found." });
            }

            return Ok(new { success = true, data = updated });
        }

        [HttpDelete("vehicles/{id:guid}")]
        public async Task<IActionResult> DeleteVehicle(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var deleted = await _fleetService.DeleteVehicleAsync(tenantId, id);
            if (!deleted)
            {
                return NotFound(new { success = false, message = "Vehicle not found." });
            }

            return Ok(new { success = true, message = "Vehicle deleted successfully." });
        }

        [HttpGet("maintenance")]
        public async Task<IActionResult> GetMaintenances([FromQuery] Guid? vehicleId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var list = await _fleetService.GetMaintenancesAsync(tenantId, vehicleId);
            return Ok(new { success = true, data = list });
        }

        [HttpPost("maintenance")]
        public async Task<IActionResult> CreateMaintenance([FromBody] CreateMaintenanceRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            if (req.VehicleId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Vehicle ID is required." });
            }

            var created = await _fleetService.CreateMaintenanceAsync(tenantId, req);
            return Ok(new { success = true, data = created });
        }

        [HttpGet("fuel-logs")]
        public async Task<IActionResult> GetFuelLogs([FromQuery] Guid? vehicleId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var list = await _fleetService.GetFuelLogsAsync(tenantId, vehicleId);
            return Ok(new { success = true, data = list });
        }

        [HttpPost("fuel-logs")]
        public async Task<IActionResult> CreateFuelLog([FromBody] CreateFuelLogRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            if (req.VehicleId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Vehicle ID is required." });
            }

            var created = await _fleetService.CreateFuelLogAsync(tenantId, req);
            return Ok(new { success = true, data = created });
        }
    }
}
