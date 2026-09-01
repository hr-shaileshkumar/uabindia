using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Authorization;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Workflow.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class ApprovalsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IApprovalRequestService _approvals;

        public ApprovalsController(ApplicationDbContext db, ITenantAccessor tenantAccessor, IApprovalRequestService approvals)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _approvals = approvals;
        }

        [HttpGet]
        [PolicyCheck("approval", "view")]
        public async Task<IActionResult> List([FromQuery] string status = "Pending")
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var data = await _db.ApprovalRequests
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && a.Status == status)
                .OrderByDescending(a => a.RequestedAt)
                .Select(a => new ApprovalRequestDto
                {
                    Id = a.Id,
                    ModuleKey = a.ModuleKey,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    CurrentStep = a.CurrentStep,
                    Status = a.Status,
                    RequestedBy = a.RequestedBy,
                    RequestedAt = a.RequestedAt,
                    ApprovedBy = a.ApprovedBy,
                    ApprovedAt = a.ApprovedAt,
                    RejectedBy = a.RejectedBy,
                    RejectedAt = a.RejectedAt,
                    Comments = a.Comments
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpPost]
        [PolicyCheck("approval", "create")]
        public async Task<IActionResult> Create([FromBody] CreateApprovalRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            try
            {
                await _approvals.CreateAsync(dto.ModuleKey, dto.EntityType, dto.EntityId, dto.Comments, userId);
                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/approve")]
        [PolicyCheck("approval", "approve")]
        public async Task<IActionResult> Approve(Guid id, [FromBody] ApprovalActionDto dto)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            try
            {
                await _approvals.ApproveAsync(id, userId, dto?.Comments);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/reject")]
        [PolicyCheck("approval", "reject")]
        public async Task<IActionResult> Reject(Guid id, [FromBody] ApprovalActionDto dto)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            try
            {
                await _approvals.RejectAsync(id, userId, dto?.Comments);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private Guid GetUserId()
        {
            var userIdClaim = User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("nameidentifier")?.Value
                ?? User?.FindFirst("sub")?.Value;

            return Guid.TryParse(userIdClaim, out var id) ? id : Guid.Empty;
        }
    }
}
