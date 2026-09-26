using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Route("api/v1/administration/number-ranges")]
    [Authorize]
    [Authorize(Policy = "Module:platform")]
    public class NumberRangesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public NumberRangesController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private Guid TenantId => _tenantAccessor.GetTenantId();

        private static readonly (string EntityName, string Prefix, int Padding, string Description)[] StandardSequenceDefaults =
        {
            ("Invoice", "INV", 5, "Sales Tax Invoices"),
            ("PurchaseOrder", "PO", 5, "Procurement Purchase Orders"),
            ("SalesOrder", "SO", 5, "Customer Sales Orders"),
            ("Employee", "EMP", 4, "Employee Code Identifiers"),
            ("JournalEntry", "JV", 6, "General Ledger Journal Vouchers"),
            ("GoodsReceipt", "GRN", 5, "Warehouse Goods Receipt Notes"),
            ("Customer", "CUST", 5, "CRM Customer Identifiers"),
            ("Vendor", "VEND", 5, "Supplier / Vendor Identifiers"),
            ("Quotation", "QTN", 5, "Sales Price Quotations"),
            ("Asset", "AST", 5, "Fixed Org Capital Assets"),
            ("Payment", "PAY", 5, "Treasury Payment Vouchers")
        };

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] Guid? companyId = null, [FromQuery] Guid? projectId = null)
        {
            var tenantId = TenantId;

            if (!companyId.HasValue && Request.Headers.TryGetValue("X-Company-Id", out var ch) && Guid.TryParse(ch, out var parsedC))
            {
                companyId = parsedC;
            }
            if (!projectId.HasValue && Request.Headers.TryGetValue("X-Project-Id", out var ph) && Guid.TryParse(ph, out var parsedP))
            {
                projectId = parsedP;
            }

            var query = _db.BusinessIdSequences.Where(s => s.TenantId == tenantId);

            if (companyId.HasValue && companyId.Value != Guid.Empty)
            {
                // Return company-specific sequences plus tenant-level fallbacks
                query = query.Where(s => s.CompanyId == companyId.Value || s.CompanyId == null);
            }

            var sequences = await query
                .OrderBy(s => s.CompanyId.HasValue ? 0 : 1)
                .ThenBy(s => s.EntityName)
                .ToListAsync();

            // Auto-initialize standard sequence objects if none exist
            if (sequences.Count == 0 && (!companyId.HasValue || companyId == Guid.Empty))
            {
                var toAdd = new List<BusinessIdSequence>();
                var now = DateTime.UtcNow;

                foreach (var def in StandardSequenceDefaults)
                {
                    toAdd.Add(new BusinessIdSequence
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        EntityName = def.EntityName,
                        Prefix = def.Prefix,
                        Padding = def.Padding,
                        CurrentValue = 0,
                        UpdatedAt = now
                    });
                }

                _db.BusinessIdSequences.AddRange(toAdd);
                await _db.SaveChangesAsync();
                sequences = toAdd;
            }

            // Hydrate company codes for display
            var companyIds = sequences.Where(s => s.CompanyId.HasValue).Select(s => s.CompanyId!.Value).Distinct().ToList();
            var companies = await _db.Companies
                .AsNoTracking()
                .Where(c => companyIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, c => string.IsNullOrWhiteSpace(c.Code) ? c.Name : c.Code);

            var year = DateTime.UtcNow.Year;
            var fyShort = $"{year % 100}-{(year + 1) % 100}";

            var data = sequences.Select(s =>
            {
                string companyTag = string.Empty;
                if (s.CompanyId.HasValue && companies.TryGetValue(s.CompanyId.Value, out var cName))
                {
                    companyTag = cName.Length > 4 ? cName.Substring(0, 4).ToUpperInvariant() : cName.ToUpperInvariant();
                }

                var nextNum = (s.CurrentValue + 1).ToString($"D{Math.Max(s.Padding, 3)}");
                var preview = !string.IsNullOrEmpty(companyTag)
                    ? $"{companyTag}-{s.Prefix ?? "DOC"}-{nextNum}"
                    : $"{s.Prefix ?? "DOC"}-{nextNum}";

                return new
                {
                    id = s.Id,
                    entityName = s.EntityName,
                    prefix = s.Prefix ?? string.Empty,
                    padding = s.Padding,
                    currentValue = s.CurrentValue,
                    companyId = s.CompanyId,
                    projectId = s.ProjectId,
                    companyTag = string.IsNullOrEmpty(companyTag) ? "Global (All Companies)" : companyTag,
                    namingPattern = s.NamingPattern,
                    fiscalYear = s.FiscalYear,
                    updatedAt = s.UpdatedAt,
                    preview
                };
            });

            return Ok(new { sequences = data, total = sequences.Count });
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] NumberRangeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.EntityName))
                return BadRequest(new { message = "EntityName is required." });

            var tenantId = TenantId;
            var exists = await _db.BusinessIdSequences
                .AnyAsync(s => s.TenantId == tenantId &&
                               s.CompanyId == dto.CompanyId &&
                               s.ProjectId == dto.ProjectId &&
                               s.EntityName == dto.EntityName.Trim());

            if (exists)
                return Conflict(new { message = $"Number range for '{dto.EntityName}' already exists for this company/project scope." });

            var sequence = new BusinessIdSequence
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                CompanyId = dto.CompanyId,
                ProjectId = dto.ProjectId,
                EntityName = dto.EntityName.Trim(),
                Prefix = dto.Prefix?.Trim().ToUpperInvariant() ?? "DOC",
                Padding = Math.Clamp(dto.Padding, 3, 10),
                CurrentValue = Math.Max(0, dto.CurrentValue),
                NamingPattern = dto.NamingPattern,
                FiscalYear = dto.FiscalYear,
                UpdatedAt = DateTime.UtcNow
            };

            _db.BusinessIdSequences.Add(sequence);
            await _db.SaveChangesAsync();

            return Ok(sequence);
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(Guid id, [FromBody] NumberRangeDto dto)
        {
            var tenantId = TenantId;
            var sequence = await _db.BusinessIdSequences
                .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId);

            if (sequence == null)
                return NotFound(new { message = "Number range sequence not found." });

            if (!string.IsNullOrWhiteSpace(dto.Prefix))
                sequence.Prefix = dto.Prefix.Trim().ToUpperInvariant();

            if (dto.Padding >= 3 && dto.Padding <= 10)
                sequence.Padding = dto.Padding;

            if (dto.CurrentValue >= 0)
                sequence.CurrentValue = dto.CurrentValue;

            if (dto.NamingPattern != null)
                sequence.NamingPattern = dto.NamingPattern;

            if (dto.FiscalYear != null)
                sequence.FiscalYear = dto.FiscalYear;

            sequence.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(sequence);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = TenantId;
            var sequence = await _db.BusinessIdSequences
                .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId);

            if (sequence == null)
                return NotFound(new { message = "Number range sequence not found." });

            _db.BusinessIdSequences.Remove(sequence);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Sequence deleted successfully." });
        }

        [HttpPost("initialize-defaults")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> InitializeDefaults([FromQuery] Guid? companyId = null)
        {
            var tenantId = TenantId;
            var existing = await _db.BusinessIdSequences
                .Where(s => s.TenantId == tenantId && s.CompanyId == companyId)
                .Select(s => s.EntityName)
                .ToListAsync();

            var toAdd = new List<BusinessIdSequence>();
            var now = DateTime.UtcNow;

            foreach (var def in StandardSequenceDefaults)
            {
                if (!existing.Contains(def.EntityName, StringComparer.OrdinalIgnoreCase))
                {
                    toAdd.Add(new BusinessIdSequence
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        CompanyId = companyId,
                        EntityName = def.EntityName,
                        Prefix = def.Prefix,
                        Padding = def.Padding,
                        CurrentValue = 0,
                        UpdatedAt = now
                    });
                }
            }

            if (toAdd.Count > 0)
            {
                _db.BusinessIdSequences.AddRange(toAdd);
                await _db.SaveChangesAsync();
            }

            return Ok(new { message = $"Initialized {toAdd.Count} standard document sequences." });
        }
    }

    public class NumberRangeDto
    {
        public string EntityName { get; set; } = string.Empty;
        public string? Prefix { get; set; }
        public int Padding { get; set; } = 5;
        public long CurrentValue { get; set; } = 0;
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string? NamingPattern { get; set; }
        public string? FiscalYear { get; set; }
    }
}
