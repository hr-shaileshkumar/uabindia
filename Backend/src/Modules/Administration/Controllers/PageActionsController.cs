using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Common.Cqrs;
using UabIndia.Application.Common.PageActions;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/page-actions")]
    [Authorize]
    public class PageActionsController : ControllerBase
    {
        private readonly IDispatcher _dispatcher;
        private readonly ITenantAccessor _tenantAccessor;

        public PageActionsController(IDispatcher dispatcher, ITenantAccessor tenantAccessor)
        {
            _dispatcher = dispatcher;
            _tenantAccessor = tenantAccessor;
        }

        [HttpPost("execute")]
        public async Task<IActionResult> Execute([FromBody] ExecutePageActionDto dto, CancellationToken ct = default)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.PageKey) || string.IsNullOrWhiteSpace(dto.ActionKey))
            {
                return BadRequest(new { message = "PageKey and ActionKey are required." });
            }

            var userId = GetUserId();
            var tenantId = _tenantAccessor.GetTenantId();

            var command = new ExecutePageActionCommand
            {
                PageKey = dto.PageKey,
                ActionKey = dto.ActionKey,
                ActionType = string.IsNullOrWhiteSpace(dto.ActionType) ? "custom" : dto.ActionType,
                EntityId = dto.EntityId,
                SelectedIds = dto.SelectedIds ?? new List<Guid>(),
                Parameters = dto.Parameters ?? new Dictionary<string, object?>(),
                UserId = userId,
                TenantId = tenantId
            };

            var result = await _dispatcher.SendAsync(command, ct);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message, success = false });
            }

            return Ok(result);
        }

        private Guid GetUserId()
        {
            var userIdClaim = User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("nameidentifier")?.Value
                ?? User?.FindFirst("sub")?.Value;

            return Guid.TryParse(userIdClaim, out var id) ? id : Guid.Empty;
        }
    }

    public class ExecutePageActionDto
    {
        public string PageKey { get; set; } = string.Empty;
        public string ActionKey { get; set; } = string.Empty;
        public string? ActionType { get; set; }
        public Guid? EntityId { get; set; }
        public List<Guid>? SelectedIds { get; set; }
        public Dictionary<string, object?>? Parameters { get; set; }
    }
}
