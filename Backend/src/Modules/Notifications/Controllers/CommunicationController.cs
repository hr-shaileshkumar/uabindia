using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Notifications.Controllers
{
    [ApiController]
    [Route("api/v1/communication")]
    [Authorize]
    public class CommunicationController : ControllerBase
    {
        private const string AnnouncementType = "Announcement";
        private const string EmailTemplateKind = "Email";
        private const string SmsTemplateKind = "SMS";

        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public CommunicationController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("announcements")]
        public async Task<IActionResult> ListAnnouncements([FromQuery] int page = 1, [FromQuery] int limit = 24)
        {
            page = Math.Max(page, 1);
            limit = Math.Clamp(limit, 1, 100);

            var query = _db.NotificationMessages
                .AsNoTracking()
                .Where(message => message.Type == AnnouncementType);

            var total = await query.CountAsync();
            var rows = await query
                .OrderByDescending(message => message.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            var records = rows.Select(MapAnnouncement).ToList();

            return Ok(new { records, total, page, limit });
        }

        [HttpGet("announcements/{id:guid}")]
        public async Task<IActionResult> GetAnnouncement(Guid id)
        {
            var item = await _db.NotificationMessages
                .AsNoTracking()
                .FirstOrDefaultAsync(message => message.Id == id && message.Type == AnnouncementType);

            return item == null ? NotFound() : Ok(MapAnnouncement(item));
        }

        [HttpPost("announcements")]
        public async Task<IActionResult> CreateAnnouncement([FromBody] AnnouncementUpsertDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var tenantId = _tenantAccessor.GetTenantId();
            var entity = new NotificationMessage
            {
                TenantId = tenantId,
                RecipientUserId = Guid.Empty,
                Channel = "InApp",
                Type = AnnouncementType,
                Title = dto.Title.Trim(),
                Message = dto.Body.Trim(),
                Status = NormalizeStatus(dto.Status),
                MetadataJson = BuildAnnouncementMetadataJson(dto.Audience),
            };

            _db.NotificationMessages.Add(entity);
            await _db.SaveChangesAsync();

            return Ok(MapAnnouncement(entity));
        }

        [HttpPut("announcements/{id:guid}")]
        public async Task<IActionResult> UpdateAnnouncement(Guid id, [FromBody] AnnouncementUpsertDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var entity = await _db.NotificationMessages
                .FirstOrDefaultAsync(message => message.Id == id && message.Type == AnnouncementType);

            if (entity == null)
            {
                return NotFound();
            }

            entity.Title = dto.Title.Trim();
            entity.Message = dto.Body.Trim();
            entity.Status = NormalizeStatus(dto.Status);
            entity.MetadataJson = BuildAnnouncementMetadataJson(dto.Audience);
            entity.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(MapAnnouncement(entity));
        }

        [HttpDelete("announcements/{id:guid}")]
        public async Task<IActionResult> DeleteAnnouncement(Guid id)
        {
            var entity = await _db.NotificationMessages
                .FirstOrDefaultAsync(message => message.Id == id && message.Type == AnnouncementType);

            if (entity == null)
            {
                return NotFound();
            }

            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("email-templates")]
        public async Task<IActionResult> ListEmailTemplates([FromQuery] int page = 1, [FromQuery] int limit = 24)
        {
            return await ListTemplates(EmailTemplateKind, page, limit);
        }

        [HttpGet("email-templates/{id:guid}")]
        public async Task<IActionResult> GetEmailTemplate(Guid id)
        {
            return await GetTemplate(EmailTemplateKind, id);
        }

        [HttpPost("email-templates")]
        public async Task<IActionResult> CreateEmailTemplate([FromBody] CommunicationTemplateUpsertDto dto)
        {
            return await CreateTemplate(EmailTemplateKind, dto);
        }

        [HttpPut("email-templates/{id:guid}")]
        public async Task<IActionResult> UpdateEmailTemplate(Guid id, [FromBody] CommunicationTemplateUpsertDto dto)
        {
            return await UpdateTemplate(EmailTemplateKind, id, dto);
        }

        [HttpDelete("email-templates/{id:guid}")]
        public async Task<IActionResult> DeleteEmailTemplate(Guid id)
        {
            return await DeleteTemplate(EmailTemplateKind, id);
        }

        [HttpGet("sms-templates")]
        public async Task<IActionResult> ListSmsTemplates([FromQuery] int page = 1, [FromQuery] int limit = 24)
        {
            return await ListTemplates(SmsTemplateKind, page, limit);
        }

        [HttpGet("sms-templates/{id:guid}")]
        public async Task<IActionResult> GetSmsTemplate(Guid id)
        {
            return await GetTemplate(SmsTemplateKind, id);
        }

        [HttpPost("sms-templates")]
        public async Task<IActionResult> CreateSmsTemplate([FromBody] CommunicationTemplateUpsertDto dto)
        {
            return await CreateTemplate(SmsTemplateKind, dto);
        }

        [HttpPut("sms-templates/{id:guid}")]
        public async Task<IActionResult> UpdateSmsTemplate(Guid id, [FromBody] CommunicationTemplateUpsertDto dto)
        {
            return await UpdateTemplate(SmsTemplateKind, id, dto);
        }

        [HttpDelete("sms-templates/{id:guid}")]
        public async Task<IActionResult> DeleteSmsTemplate(Guid id)
        {
            return await DeleteTemplate(SmsTemplateKind, id);
        }

        private async Task<IActionResult> ListTemplates(string templateKind, int page, int limit)
        {
            page = Math.Max(page, 1);
            limit = Math.Clamp(limit, 1, 100);

            var query = _db.CommunicationTemplates
                .AsNoTracking()
                .Where(template => template.TemplateKind == templateKind);

            var total = await query.CountAsync();
            var rows = await query
                .OrderByDescending(template => template.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            var records = rows.Select(MapTemplate).ToList();

            return Ok(new { records, total, page, limit });
        }

        private async Task<IActionResult> GetTemplate(string templateKind, Guid id)
        {
            var entity = await _db.CommunicationTemplates
                .AsNoTracking()
                .FirstOrDefaultAsync(template => template.Id == id && template.TemplateKind == templateKind);

            return entity == null ? NotFound() : Ok(MapTemplate(entity));
        }

        private async Task<IActionResult> CreateTemplate(string templateKind, CommunicationTemplateUpsertDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var entity = new CommunicationTemplate
            {
                TenantId = _tenantAccessor.GetTenantId(),
                TemplateKind = templateKind,
                Name = dto.Name.Trim(),
                Subject = NormalizeOptional(dto.Subject),
                Body = dto.Body.Trim(),
                TriggerEvent = NormalizeOptional(dto.TriggerEvent),
                Language = NormalizeOptional(dto.Language),
                Status = NormalizeStatus(dto.Status),
            };

            _db.CommunicationTemplates.Add(entity);
            await _db.SaveChangesAsync();

            return Ok(MapTemplate(entity));
        }

        private async Task<IActionResult> UpdateTemplate(string templateKind, Guid id, CommunicationTemplateUpsertDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var entity = await _db.CommunicationTemplates
                .FirstOrDefaultAsync(template => template.Id == id && template.TemplateKind == templateKind);

            if (entity == null)
            {
                return NotFound();
            }

            entity.Name = dto.Name.Trim();
            entity.Subject = NormalizeOptional(dto.Subject);
            entity.Body = dto.Body.Trim();
            entity.TriggerEvent = NormalizeOptional(dto.TriggerEvent);
            entity.Language = NormalizeOptional(dto.Language);
            entity.Status = NormalizeStatus(dto.Status);
            entity.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(MapTemplate(entity));
        }

        private async Task<IActionResult> DeleteTemplate(string templateKind, Guid id)
        {
            var entity = await _db.CommunicationTemplates
                .FirstOrDefaultAsync(template => template.Id == id && template.TemplateKind == templateKind);

            if (entity == null)
            {
                return NotFound();
            }

            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return NoContent();
        }

        private static AnnouncementDto MapAnnouncement(NotificationMessage message)
        {
            return new AnnouncementDto
            {
                Id = message.Id,
                Title = message.Title,
                Body = message.Message,
                Audience = ReadMetadataValue(message.MetadataJson, "audience")
                    ?? ReadMetadataValue(message.MetadataJson, "targetAudience")
                    ?? "All Employees",
                Status = string.IsNullOrWhiteSpace(message.Status) ? "Draft" : message.Status,
                UpdatedAt = message.UpdatedAt ?? message.CreatedAt,
            };
        }

        private static CommunicationTemplateDto MapTemplate(CommunicationTemplate template)
        {
            return new CommunicationTemplateDto
            {
                Id = template.Id,
                Name = template.Name,
                Subject = template.Subject ?? string.Empty,
                Message = template.Body,
                TriggerEvent = template.TriggerEvent ?? string.Empty,
                Language = template.Language ?? string.Empty,
                Status = string.IsNullOrWhiteSpace(template.Status) ? "Draft" : template.Status,
                TemplateKind = template.TemplateKind,
            };
        }

        private static string? ReadMetadataValue(string? json, string propertyName)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return null;
            }

            try
            {
                using var document = JsonDocument.Parse(json);
                if (document.RootElement.ValueKind != JsonValueKind.Object)
                {
                    return null;
                }

                if (!document.RootElement.TryGetProperty(propertyName, out var value))
                {
                    return null;
                }

                return value.ValueKind == JsonValueKind.String ? value.GetString() : value.ToString();
            }
            catch
            {
                return null;
            }
        }

        private static string BuildAnnouncementMetadataJson(string? audience)
        {
            if (string.IsNullOrWhiteSpace(audience))
            {
                return "{}";
            }

            return JsonSerializer.Serialize(new { audience = audience.Trim() });
        }

        private static string NormalizeStatus(string? status)
        {
            return string.IsNullOrWhiteSpace(status) ? "Draft" : status.Trim();
        }

        private static string? NormalizeOptional(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }
    }

    public class AnnouncementDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? UpdatedAt { get; set; }
    }

    public class AnnouncementUpsertDto
    {
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? Audience { get; set; }
        public string? Status { get; set; }
    }

    public class CommunicationTemplateDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string TriggerEvent { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public string Status { get; set; } = "Draft";
        public string TemplateKind { get; set; } = string.Empty;
    }

    public class CommunicationTemplateUpsertDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Subject { get; set; }
        public string Body { get; set; } = string.Empty;
        public string? TriggerEvent { get; set; }
        public string? Language { get; set; }
        public string? Status { get; set; }
    }
}
