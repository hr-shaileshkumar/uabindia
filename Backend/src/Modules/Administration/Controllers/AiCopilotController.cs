using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/ai/copilot")]
    [Authorize]
    public class AiCopilotController : ControllerBase
    {
        private readonly IAiCopilotService _copilotService;
        private readonly ITenantAccessor _tenantAccessor;

        public AiCopilotController(IAiCopilotService copilotService, ITenantAccessor tenantAccessor)
        {
            _copilotService = copilotService;
            _tenantAccessor = tenantAccessor;
        }

        public class PromptApiRequest
        {
            public string Prompt { get; set; } = string.Empty;
            public string? ModuleScope { get; set; }
        }

        [HttpPost("query")]
        public async Task<IActionResult> Query([FromBody] PromptApiRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            Guid? userId = null;
            var sub = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst("sub")?.Value
                      ?? User.FindFirst("uid")?.Value;
            if (Guid.TryParse(sub, out var parsedId))
            {
                userId = parsedId;
            }

            var queryReq = new CopilotQueryRequest
            {
                TenantId = tenantId,
                Prompt = req.Prompt,
                ModuleScope = req.ModuleScope,
                RequestedByUserId = userId
            };

            var response = await _copilotService.ExecutePromptAsync(queryReq);
            return Ok(new { success = true, data = response });
        }

        [HttpGet("anomalies")]
        public async Task<IActionResult> GetAnomalies()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var anomalies = await _copilotService.DetectAnomaliesAsync(tenantId);
            return Ok(new { success = true, data = anomalies });
        }
    }
}
