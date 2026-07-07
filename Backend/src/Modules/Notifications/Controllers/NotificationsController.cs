using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Notifications.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public NotificationsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("nameidentifier")?.Value
                ?? User?.FindFirst("sub")?.Value;

            return Guid.TryParse(userIdClaim, out var id) ? id : Guid.Empty;
        }

        [HttpGet("me")]
        public async Task<IActionResult> ListMine([FromQuery] bool? unreadOnly = null, [FromQuery] int take = 50)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var query = _db.NotificationMessages
                .AsNoTracking()
                .Where(n => n.TenantId == tenantId && n.RecipientUserId == userId);

            if (unreadOnly == true)
            {
                query = query.Where(n => !n.IsRead);
            }

            var data = await query
                .OrderByDescending(n => n.CreatedAt)
                .Take(Math.Clamp(take, 1, 200))
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    RecipientUserId = n.RecipientUserId,
                    CompanyId = n.CompanyId,
                    ProjectId = n.ProjectId,
                    Channel = n.Channel,
                    Type = n.Type,
                    Title = n.Title,
                    Message = n.Message,
                    Status = n.Status,
                    IsRead = n.IsRead,
                    SentAt = n.SentAt,
                    ReadAt = n.ReadAt,
                    MetadataJson = n.MetadataJson
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("me/unread-count")]
        public async Task<IActionResult> UnreadCount()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var count = await _db.NotificationMessages
                .CountAsync(n => n.TenantId == tenantId && n.RecipientUserId == userId && !n.IsRead);

            return Ok(new { unread = count });
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateNotificationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var recipientExists = await _db.Users.AnyAsync(u => u.TenantId == tenantId && u.Id == dto.RecipientUserId && u.IsActive);
            if (!recipientExists) return BadRequest(new { message = "Recipient user not found." });

            var entity = new NotificationMessage
            {
                TenantId = tenantId,
                RecipientUserId = dto.RecipientUserId,
                CompanyId = dto.CompanyId,
                ProjectId = dto.ProjectId,
                Channel = dto.Channel,
                Type = dto.Type,
                Title = dto.Title,
                Message = dto.Message,
                Status = "Pending",
                MetadataJson = dto.MetadataJson
            };

            _db.NotificationMessages.Add(entity);
            await _db.SaveChangesAsync();

            return Ok(new { id = entity.Id });
        }

        [HttpPost("{id:guid}/read")]
        public async Task<IActionResult> MarkRead(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var entity = await _db.NotificationMessages
                .FirstOrDefaultAsync(n => n.TenantId == tenantId && n.Id == id && n.RecipientUserId == userId);

            if (entity == null) return NotFound();

            entity.IsRead = true;
            entity.ReadAt = DateTime.UtcNow;
            if (entity.Status == "Pending")
            {
                entity.Status = "Sent";
                entity.SentAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return Ok();
        }
    }
}
