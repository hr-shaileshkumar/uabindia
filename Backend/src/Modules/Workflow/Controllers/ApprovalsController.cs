using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Authorization;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
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

        public ApprovalsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
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

            var tenantId = _tenantAccessor.GetTenantId();
            var workflow = await _db.WorkflowDefinitions
                .Include(w => w.Steps)
                .FirstOrDefaultAsync(w => w.ModuleKey == dto.ModuleKey && w.TenantId == tenantId && w.IsActive);

            if (workflow == null) return BadRequest(new { message = "No active workflow configured for module." });

            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var request = new ApprovalRequest
            {
                TenantId = tenantId,
                ModuleKey = dto.ModuleKey,
                EntityType = dto.EntityType,
                EntityId = dto.EntityId,
                WorkflowDefinitionId = workflow.Id,
                CurrentStep = 1,
                Status = "Pending",
                RequestedBy = userId,
                RequestedAt = DateTime.UtcNow,
                Comments = dto.Comments
            };

            _db.ApprovalRequests.Add(request);
            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("{id}/approve")]
        [PolicyCheck("approval", "approve")]
        public async Task<IActionResult> Approve(Guid id, [FromBody] ApprovalActionDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var request = await _db.ApprovalRequests
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId);

            if (request == null) return NotFound();
            if (request.Status != "Pending") return BadRequest(new { message = "Request is not pending." });

            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            request.Status = "Approved";
            request.ApprovedBy = userId;
            request.ApprovedAt = DateTime.UtcNow;
            request.Comments = dto?.Comments ?? request.Comments;

            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("{id}/reject")]
        [PolicyCheck("approval", "reject")]
        public async Task<IActionResult> Reject(Guid id, [FromBody] ApprovalActionDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var request = await _db.ApprovalRequests
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId);

            if (request == null) return NotFound();
            if (request.Status != "Pending") return BadRequest(new { message = "Request is not pending." });

            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            request.Status = "Rejected";
            request.RejectedBy = userId;
            request.RejectedAt = DateTime.UtcNow;
            request.Comments = dto?.Comments ?? request.Comments;

            await _db.SaveChangesAsync();
            return Ok();
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
