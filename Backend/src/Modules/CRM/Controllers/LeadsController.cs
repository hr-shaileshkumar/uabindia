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
    [Route("api/v1/crm/leads")]
    [Authorize(Policy = "Module:crm")]
    public class LeadsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;
        private readonly IDocumentConversionService _conversions;

        public LeadsController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers,
            IDocumentConversionService conversions)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
            _conversions = conversions;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 50)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (page < 1) page = 1;
            if (limit < 1) limit = 50;
            if (limit > 100) limit = 100;

            var query = _db.CrmLeads.AsNoTracking()
                .Where(l => l.TenantId == tenantId && !l.IsDeleted);

            var total = await query.CountAsync();
            var leads = await query
                .OrderByDescending(l => l.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(l => new
                {
                    l.Id,
                    l.LeadCode,
                    l.LeadName,
                    CustomerName = l.CompanyName,
                    l.CompanyName,
                    l.Email,
                    l.Phone,
                    l.Stage,
                    l.Status,
                    l.Value,
                    l.Probability,
                    l.ExpectedCloseDate,
                    Owner = l.OwnerName,
                    l.OwnerUserId,
                    l.Source,
                    l.Notes,
                    l.CreatedAt,
                    l.UpdatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = leads, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var lead = await _db.CrmLeads
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId && !l.IsDeleted);

            if (lead == null)
                return NotFound(new { success = false, error = "Lead not found" });

            return Ok(new { success = true, data = lead });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCrmLeadDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.LeadName))
                return BadRequest(new { success = false, error = "Lead name is required" });

            var tenantId = _tenantAccessor.GetTenantId();
            var lead = new CrmLead
            {
                LeadCode = string.IsNullOrWhiteSpace(dto.LeadCode)
                    ? await _numbers.NextAsync("CrmLead", "LD-", 5)
                    : dto.LeadCode.Trim(),
                LeadName = dto.LeadName.Trim(),
                CompanyName = dto.CompanyName ?? dto.CustomerName,
                Email = dto.Email,
                Phone = dto.Phone,
                Stage = string.IsNullOrWhiteSpace(dto.Stage) ? "New" : dto.Stage,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Open" : dto.Status,
                Value = dto.Value,
                Probability = Math.Clamp(dto.Probability, 0, 100),
                ExpectedCloseDate = dto.ExpectedCloseDate,
                OwnerName = dto.Owner ?? dto.OwnerName,
                OwnerUserId = dto.OwnerUserId,
                Source = dto.Source,
                Notes = dto.Notes,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.CrmLeads.Add(lead);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Lead created successfully", data = lead });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCrmLeadDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var lead = await _db.CrmLeads
                .FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId && !l.IsDeleted);

            if (lead == null)
                return NotFound(new { success = false, error = "Lead not found" });

            if (dto.LeadName != null) lead.LeadName = dto.LeadName;
            if (dto.CompanyName != null) lead.CompanyName = dto.CompanyName;
            if (dto.CustomerName != null) lead.CompanyName = dto.CustomerName;
            if (dto.Email != null) lead.Email = dto.Email;
            if (dto.Phone != null) lead.Phone = dto.Phone;
            if (dto.Stage != null) lead.Stage = dto.Stage;
            if (dto.Status != null) lead.Status = dto.Status;
            if (dto.Value.HasValue) lead.Value = dto.Value.Value;
            if (dto.Probability.HasValue) lead.Probability = Math.Clamp(dto.Probability.Value, 0, 100);
            if (dto.ExpectedCloseDate.HasValue) lead.ExpectedCloseDate = dto.ExpectedCloseDate;
            if (dto.Owner != null) lead.OwnerName = dto.Owner;
            if (dto.OwnerName != null) lead.OwnerName = dto.OwnerName;
            if (dto.OwnerUserId.HasValue) lead.OwnerUserId = dto.OwnerUserId;
            if (dto.Source != null) lead.Source = dto.Source;
            if (dto.Notes != null) lead.Notes = dto.Notes;
            lead.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Lead updated successfully", data = lead });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var lead = await _db.CrmLeads
                .FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId && !l.IsDeleted);

            if (lead == null)
                return NotFound(new { success = false, error = "Lead not found" });

            lead.IsDeleted = true;
            lead.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Lead deleted successfully" });
        }

        /// <summary>
        /// Converts a qualified lead into a draft sales quotation (and ensures a Customer exists).
        /// </summary>
        [HttpPost("{id}/convert-to-quotation")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ConvertToQuotation(Guid id)
        {
            try
            {
                var result = await _conversions.ConvertLeadToQuotationAsync(id);
                return Ok(new
                {
                    success = true,
                    message = "Lead converted to quotation",
                    data = new { quotationId = result.QuotationId, customerId = result.CustomerId, quotation = result.Quotation }
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }
    }

    public class CreateCrmLeadDto
    {
        public string? LeadCode { get; set; }
        public string LeadName { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
        public string? CustomerName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Stage { get; set; }
        public string? Status { get; set; }
        public decimal Value { get; set; }
        public int Probability { get; set; }
        public DateTime? ExpectedCloseDate { get; set; }
        public string? Owner { get; set; }
        public string? OwnerName { get; set; }
        public Guid? OwnerUserId { get; set; }
        public string? Source { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateCrmLeadDto
    {
        public string? LeadName { get; set; }
        public string? CompanyName { get; set; }
        public string? CustomerName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Stage { get; set; }
        public string? Status { get; set; }
        public decimal? Value { get; set; }
        public int? Probability { get; set; }
        public DateTime? ExpectedCloseDate { get; set; }
        public string? Owner { get; set; }
        public string? OwnerName { get; set; }
        public Guid? OwnerUserId { get; set; }
        public string? Source { get; set; }
        public string? Notes { get; set; }
    }
}
