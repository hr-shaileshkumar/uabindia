using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.CRM.Controllers
{
    [ApiController]
    [Route("api/v1/crm/contacts")]
    [Authorize]
    public class CrmContactsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public CrmContactsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public class CrmContactUpsertDto
        {
            public string? FirstName { get; set; }
            public string? LastName { get; set; }
            public string? FullName { get; set; }
            public string? Email { get; set; }
            public string? Phone { get; set; }
            public string? CompanyName { get; set; }
            public string? JobTitle { get; set; }
            public string? Status { get; set; }
            public string? Source { get; set; }
            public string? Notes { get; set; }
            public Guid? CompanyId { get; set; }
            public Guid? ProjectId { get; set; }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 200,
            [FromQuery] string? search = null,
            [FromQuery] string? status = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            page = Math.Max(1, page);
            limit = Math.Clamp(limit, 1, 500);

            var query = _db.CrmContacts.AsNoTracking()
                .Where(c => c.TenantId == tenantId && !c.IsDeleted);

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(c => c.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(c =>
                    (c.FirstName != null && c.FirstName.ToLower().Contains(s)) ||
                    (c.LastName != null && c.LastName.ToLower().Contains(s)) ||
                    (c.FullName != null && c.FullName.ToLower().Contains(s)) ||
                    (c.Email != null && c.Email.ToLower().Contains(s)) ||
                    (c.CompanyName != null && c.CompanyName.ToLower().Contains(s)) ||
                    (c.Phone != null && c.Phone.ToLower().Contains(s)));
            }

            var total = await query.CountAsync();
            var contacts = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(c => new
                {
                    c.Id,
                    c.FirstName,
                    c.LastName,
                    FullName = !string.IsNullOrWhiteSpace(c.FullName) ? c.FullName : $"{c.FirstName} {c.LastName}".Trim(),
                    c.Email,
                    c.Phone,
                    c.CompanyName,
                    c.JobTitle,
                    c.Status,
                    c.Source,
                    c.Notes,
                    c.CompanyId,
                    c.ProjectId,
                    c.CreatedAt,
                    c.UpdatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = contacts,
                items = contacts,
                total,
                page,
                limit,
                pages = (total + limit - 1) / limit
            });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var contact = await _db.CrmContacts.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);

            if (contact == null)
                return NotFound(new { success = false, message = "Contact not found." });

            return Ok(new { success = true, data = contact });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CrmContactUpsertDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FirstName) && string.IsNullOrWhiteSpace(dto.FullName) && string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { success = false, message = "Contact name or email is required." });
            }

            var tenantId = _tenantAccessor.GetTenantId();
            var contact = new CrmContact
            {
                TenantId = tenantId,
                FirstName = dto.FirstName?.Trim(),
                LastName = dto.LastName?.Trim(),
                FullName = !string.IsNullOrWhiteSpace(dto.FullName)
                    ? dto.FullName.Trim()
                    : $"{dto.FirstName} {dto.LastName}".Trim(),
                Email = dto.Email?.Trim(),
                Phone = dto.Phone?.Trim(),
                CompanyName = dto.CompanyName?.Trim(),
                JobTitle = dto.JobTitle?.Trim(),
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim(),
                Source = string.IsNullOrWhiteSpace(dto.Source) ? "Website" : dto.Source.Trim(),
                Notes = dto.Notes?.Trim(),
                CompanyId = dto.CompanyId,
                ProjectId = dto.ProjectId,
                CreatedAt = DateTime.UtcNow
            };

            _db.CrmContacts.Add(contact);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Contact created successfully.",
                data = contact
            });
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CrmContactUpsertDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var contact = await _db.CrmContacts.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);
            if (contact == null)
                return NotFound(new { success = false, message = "Contact not found." });

            contact.FirstName = dto.FirstName?.Trim() ?? contact.FirstName;
            contact.LastName = dto.LastName?.Trim() ?? contact.LastName;
            contact.FullName = !string.IsNullOrWhiteSpace(dto.FullName)
                ? dto.FullName.Trim()
                : $"{dto.FirstName ?? contact.FirstName} {dto.LastName ?? contact.LastName}".Trim();
            contact.Email = dto.Email?.Trim() ?? contact.Email;
            contact.Phone = dto.Phone?.Trim() ?? contact.Phone;
            contact.CompanyName = dto.CompanyName?.Trim() ?? contact.CompanyName;
            contact.JobTitle = dto.JobTitle?.Trim() ?? contact.JobTitle;
            if (!string.IsNullOrWhiteSpace(dto.Status)) contact.Status = dto.Status.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Source)) contact.Source = dto.Source.Trim();
            contact.Notes = dto.Notes?.Trim() ?? contact.Notes;
            if (dto.CompanyId.HasValue) contact.CompanyId = dto.CompanyId;
            if (dto.ProjectId.HasValue) contact.ProjectId = dto.ProjectId;
            contact.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Contact updated successfully.",
                data = contact
            });
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var contact = await _db.CrmContacts.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);
            if (contact == null)
                return NotFound(new { success = false, message = "Contact not found." });

            contact.IsDeleted = true;
            contact.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Contact deleted successfully."
            });
        }
    }
}
