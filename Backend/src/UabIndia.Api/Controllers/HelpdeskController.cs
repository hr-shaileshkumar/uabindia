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

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/helpdesk")]
    [Authorize]
    public class HelpdeskController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public HelpdeskController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("tickets")]
        public async Task<IActionResult> ListTickets(
            [FromQuery] string? status = null,
            [FromQuery] string? priority = null,
            [FromQuery] string? assignedTo = null,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.HelpdeskTickets.AsNoTracking().Where(t => t.TenantId == tenantId);

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(t => t.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(priority))
            {
                query = query.Where(t => t.Priority == priority);
            }

            if (Guid.TryParse(assignedTo, out var assignedToUserId))
            {
                query = query.Where(t => t.AssignedToUserId == assignedToUserId);
            }

            var skip = Math.Max(page - 1, 0) * Math.Clamp(limit, 1, 200);
            var records = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip(skip)
                .Take(Math.Clamp(limit, 1, 200))
                .Select(t => new HelpdeskTicketDto
                {
                    Id = t.Id,
                    TicketNumber = t.TicketNumber,
                    Subject = t.Subject,
                    Requester = _db.Users.IgnoreQueryFilters().Where(u => u.Id == t.RequesterUserId).Select(u => u.Email).FirstOrDefault() ?? t.RequesterUserId.ToString(),
                    Category = t.Category,
                    Priority = t.Priority,
                    AssignedTo = t.AssignedToUserId == null
                        ? string.Empty
                        : _db.Users.IgnoreQueryFilters().Where(u => u.Id == t.AssignedToUserId).Select(u => u.Email).FirstOrDefault() ?? string.Empty,
                    Status = t.Status,
                    CreatedAt = t.CreatedAt,
                    SlaDueAt = t.SlaDueAt
                })
                .ToListAsync();

            return Ok(new { tickets = records, records, page, limit });
        }

        [HttpGet("tickets/{id:guid}")]
        public async Task<IActionResult> GetTicketById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var ticket = await _db.HelpdeskTickets
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.TenantId == tenantId && t.Id == id);

            if (ticket == null) return NotFound();

            return Ok(ticket);
        }

        [HttpPost("tickets")]
        public async Task<IActionResult> CreateTicket([FromBody] CreateHelpdeskTicketDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var requesterUserId = GetUserId();
            if (requesterUserId == Guid.Empty) return Unauthorized();

            if (dto.AssignedToUserId.HasValue)
            {
                var assigneeExists = await _db.Users.AnyAsync(u => u.TenantId == tenantId && u.Id == dto.AssignedToUserId.Value && u.IsActive);
                if (!assigneeExists) return BadRequest(new { message = "Assigned user not found." });
            }

            var entity = new HelpdeskTicket
            {
                TicketNumber = await GenerateTicketNumberAsync(tenantId),
                Subject = dto.Subject.Trim(),
                Description = dto.Description.Trim(),
                Category = NormalizeOrDefault(dto.Category, "General"),
                Priority = NormalizeOrDefault(dto.Priority, "Low"),
                Status = "Open",
                RequesterUserId = requesterUserId,
                AssignedToUserId = dto.AssignedToUserId,
                CompanyId = dto.CompanyId,
                ProjectId = dto.ProjectId,
                SlaDueAt = dto.SlaDueAt
            };

            _db.HelpdeskTickets.Add(entity);
            await _db.SaveChangesAsync();

            return Ok(new { id = entity.Id, ticketNumber = entity.TicketNumber });
        }

        [HttpPut("tickets/{id:guid}")]
        public async Task<IActionResult> UpdateTicket(Guid id, [FromBody] UpdateHelpdeskTicketDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var entity = await _db.HelpdeskTickets.FirstOrDefaultAsync(t => t.TenantId == tenantId && t.Id == id);
            if (entity == null) return NotFound();

            if (dto.Subject != null) entity.Subject = dto.Subject.Trim();
            if (dto.Description != null) entity.Description = dto.Description.Trim();
            if (dto.Category != null) entity.Category = dto.Category.Trim();
            if (dto.Priority != null) entity.Priority = dto.Priority.Trim();
            if (dto.Status != null) entity.Status = dto.Status.Trim();
            if (dto.SlaDueAt.HasValue) entity.SlaDueAt = dto.SlaDueAt;
            if (dto.CompanyId.HasValue) entity.CompanyId = dto.CompanyId;
            if (dto.ProjectId.HasValue) entity.ProjectId = dto.ProjectId;

            if (dto.AssignedToUserId.HasValue)
            {
                var assigneeExists = await _db.Users.AnyAsync(u => u.TenantId == tenantId && u.Id == dto.AssignedToUserId.Value && u.IsActive);
                if (!assigneeExists) return BadRequest(new { message = "Assigned user not found." });
                entity.AssignedToUserId = dto.AssignedToUserId;
                entity.FirstResponseAt ??= DateTime.UtcNow;
            }

            if (string.Equals(entity.Status, "Resolved", StringComparison.OrdinalIgnoreCase))
            {
                entity.ResolvedAt ??= DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("tickets/{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteTicket(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var entity = await _db.HelpdeskTickets.FirstOrDefaultAsync(t => t.TenantId == tenantId && t.Id == id);
            if (entity == null) return NotFound();

            entity.IsDeleted = true;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("escalations")]
        public async Task<IActionResult> ListEscalations([FromQuery] string? status = null, [FromQuery] int page = 1, [FromQuery] int limit = 20)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.HelpdeskEscalations.AsNoTracking().Where(e => e.TenantId == tenantId);

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(e => e.Status == status);
            }

            var skip = Math.Max(page - 1, 0) * Math.Clamp(limit, 1, 200);
            var records = await query
                .OrderByDescending(e => e.EscalatedAt)
                .Skip(skip)
                .Take(Math.Clamp(limit, 1, 200))
                .Select(e => new HelpdeskEscalationDto
                {
                    Id = e.Id,
                    TicketRef = _db.HelpdeskTickets.IgnoreQueryFilters().Where(t => t.Id == e.HelpdeskTicketId).Select(t => t.TicketNumber).FirstOrDefault() ?? e.HelpdeskTicketId.ToString(),
                    Reason = e.Reason,
                    EscalatedTo = e.EscalatedToUserId == null
                        ? string.Empty
                        : _db.Users.IgnoreQueryFilters().Where(u => u.Id == e.EscalatedToUserId).Select(u => u.Email).FirstOrDefault() ?? string.Empty,
                    EscalatedAt = e.EscalatedAt,
                    SlaBreached = e.SlaBreached,
                    Status = e.Status
                })
                .ToListAsync();

            return Ok(new { escalations = records, records, page, limit });
        }

        [HttpGet("escalations/{id:guid}")]
        public async Task<IActionResult> GetEscalationById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var entity = await _db.HelpdeskEscalations.AsNoTracking().FirstOrDefaultAsync(e => e.TenantId == tenantId && e.Id == id);
            if (entity == null) return NotFound();
            return Ok(entity);
        }

        [HttpPost("escalations")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> CreateEscalation([FromBody] CreateHelpdeskEscalationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var ticket = await _db.HelpdeskTickets.FirstOrDefaultAsync(t => t.TenantId == tenantId && t.Id == dto.TicketId);
            if (ticket == null) return BadRequest(new { message = "Ticket not found." });

            if (dto.EscalatedToUserId.HasValue)
            {
                var assigneeExists = await _db.Users.AnyAsync(u => u.TenantId == tenantId && u.Id == dto.EscalatedToUserId.Value && u.IsActive);
                if (!assigneeExists) return BadRequest(new { message = "Escalation target user not found." });
            }

            var entity = new HelpdeskEscalation
            {
                HelpdeskTicketId = dto.TicketId,
                Reason = dto.Reason.Trim(),
                EscalatedToUserId = dto.EscalatedToUserId,
                SlaBreached = dto.SlaBreached,
                Status = NormalizeOrDefault(dto.Status, "Open"),
                EscalatedAt = DateTime.UtcNow
            };

            _db.HelpdeskEscalations.Add(entity);
            ticket.Status = "Escalated";
            await _db.SaveChangesAsync();

            return Ok(new { id = entity.Id });
        }

        [HttpGet("faq")]
        public async Task<IActionResult> ListFaq([FromQuery] string? category = null, [FromQuery] string? search = null, [FromQuery] int page = 1, [FromQuery] int limit = 20)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.HelpdeskFaqArticles.AsNoTracking().Where(f => f.TenantId == tenantId);

            if (!string.IsNullOrWhiteSpace(category))
            {
                query = query.Where(f => f.Category == category);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(f => f.Question.Contains(search) || f.Answer.Contains(search));
            }

            var skip = Math.Max(page - 1, 0) * Math.Clamp(limit, 1, 200);
            var records = await query
                .OrderBy(f => f.DisplayOrder)
                .ThenBy(f => f.Question)
                .Skip(skip)
                .Take(Math.Clamp(limit, 1, 200))
                .Select(f => new HelpdeskFaqDto
                {
                    Id = f.Id,
                    Question = f.Question,
                    Category = f.Category,
                    Views = f.Views,
                    Helpful = f.HelpfulCount,
                    Status = f.Status
                })
                .ToListAsync();

            return Ok(new { faqs = records, records, page, limit });
        }

        [HttpPost("faq")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> CreateFaq([FromBody] CreateHelpdeskFaqDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var entity = new HelpdeskFaqArticle
            {
                Question = dto.Question.Trim(),
                Answer = dto.Answer.Trim(),
                Category = NormalizeOrDefault(dto.Category, "General"),
                Status = NormalizeOrDefault(dto.Status, "Draft"),
                DisplayOrder = dto.DisplayOrder
            };

            _db.HelpdeskFaqArticles.Add(entity);
            await _db.SaveChangesAsync();
            return Ok(new { id = entity.Id });
        }

        [HttpPut("faq/{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateFaq(Guid id, [FromBody] UpdateHelpdeskFaqDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var entity = await _db.HelpdeskFaqArticles.FirstOrDefaultAsync(f => f.TenantId == tenantId && f.Id == id);
            if (entity == null) return NotFound();

            if (dto.Question != null) entity.Question = dto.Question.Trim();
            if (dto.Answer != null) entity.Answer = dto.Answer.Trim();
            if (dto.Category != null) entity.Category = dto.Category.Trim();
            if (dto.Status != null) entity.Status = dto.Status.Trim();
            if (dto.Views.HasValue) entity.Views = dto.Views.Value;
            if (dto.Helpful.HasValue) entity.HelpfulCount = dto.Helpful.Value;
            if (dto.DisplayOrder.HasValue) entity.DisplayOrder = dto.DisplayOrder.Value;

            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("faq/{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteFaq(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var entity = await _db.HelpdeskFaqArticles.FirstOrDefaultAsync(f => f.TenantId == tenantId && f.Id == id);
            if (entity == null) return NotFound();

            entity.IsDeleted = true;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        private Guid GetUserId()
        {
            var userIdClaim = User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("nameidentifier")?.Value
                ?? User?.FindFirst("sub")?.Value;

            return Guid.TryParse(userIdClaim, out var id) ? id : Guid.Empty;
        }

        private async Task<string> GenerateTicketNumberAsync(Guid tenantId)
        {
            var count = await _db.HelpdeskTickets.IgnoreQueryFilters().CountAsync(t => t.TenantId == tenantId);
            return $"TKT-{DateTime.UtcNow:yyyyMMdd}-{count + 1:0000}";
        }

        private static string NormalizeOrDefault(string? value, string fallback)
        {
            return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
        }
    }
}
