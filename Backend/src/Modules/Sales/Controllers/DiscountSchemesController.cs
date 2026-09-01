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

namespace UabIndia.Api.Modules.Sales.Controllers
{
    [ApiController]
    [Route("api/v1/discountschemes")]
    [Authorize(Policy = "Module:sales")]
    public class DiscountSchemesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;

        public DiscountSchemesController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int limit = 50)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 50;
            if (limit > 200) limit = 200;

            var query = _db.DiscountSchemes.AsNoTracking().Include(s => s.Lines).ThenInclude(l => l.Item);
            var total = await query.CountAsync();
            var schemes = await query
                .OrderByDescending(s => s.Priority)
                .ThenBy(s => s.SchemeName)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return Ok(new { success = true, data = schemes.Select(MapScheme).ToList(), total, page, limit });
        }

        [HttpGet("active")]
        public async Task<IActionResult> Active()
        {
            var today = DateTime.UtcNow.Date;
            var rows = await _db.DiscountSchemes.AsNoTracking()
                .Include(s => s.Lines)
                .ThenInclude(l => l.Item)
                .Where(s => s.Status == "Active" && s.ValidFrom <= today && s.ValidTo >= today)
                .OrderByDescending(s => s.Priority)
                .ToListAsync();

            return Ok(new { success = true, data = rows.Select(MapScheme).ToList() });
        }

        [HttpGet("product-map")]
        public async Task<IActionResult> ProductMap()
        {
            var today = DateTime.UtcNow.Date;
            var schemes = await _db.DiscountSchemes
                .AsNoTracking()
                .Include(s => s.Lines)
                .Where(s => s.Status == "Active" && s.ValidFrom <= today && s.ValidTo >= today)
                .OrderByDescending(s => s.Priority)
                .ToListAsync();

            var items = await _db.Items.AsNoTracking()
                .Where(i => i.IsActive)
                .OrderBy(i => i.ItemName)
                .Take(400)
                .ToListAsync();

            var rows = items.Select(item =>
            {
                var match = MatchScheme(schemes, item, 1);
                return new
                {
                    item.Id,
                    item.ItemCode,
                    item.ItemName,
                    item.Category,
                    item.SellingPrice,
                    item.MRP,
                    schemeId = match?.Scheme.Id,
                    schemeName = match?.Scheme.SchemeName,
                    discountType = match?.Type,
                    discountValue = match?.Value,
                    netRate = match == null ? item.SellingPrice : NetRate(item.SellingPrice, match.Type, match.Value)
                };
            });

            return Ok(new { success = true, data = rows });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var scheme = await _db.DiscountSchemes.AsNoTracking()
                .Include(s => s.Lines)
                .ThenInclude(l => l.Item)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (scheme == null) return NotFound(new { success = false, error = "Discount scheme not found" });
            return Ok(new { success = true, data = MapScheme(scheme) });
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] SaveDiscountSchemeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.SchemeName))
                return BadRequest(new { success = false, error = "Scheme name is required" });

            var tenantId = _tenantAccessor.GetTenantId();
            var scheme = new DiscountScheme
            {
                TenantId = tenantId,
                SchemeCode = string.IsNullOrWhiteSpace(dto.SchemeCode)
                    ? await _numbers.NextAsync("DiscountScheme", "DSC-", 4)
                    : dto.SchemeCode.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            ApplyDto(scheme, dto);
            ReplaceLines(scheme, dto.Lines, tenantId);
            _db.DiscountSchemes.Add(scheme);
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Discount scheme created", data = scheme.Id });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(Guid id, [FromBody] SaveDiscountSchemeDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var scheme = await _db.DiscountSchemes.Include(s => s.Lines).FirstOrDefaultAsync(s => s.Id == id);
            if (scheme == null) return NotFound(new { success = false, error = "Discount scheme not found" });

            ApplyDto(scheme, dto);
            foreach (var line in scheme.Lines.ToList())
            {
                line.IsDeleted = true;
                line.UpdatedAt = DateTime.UtcNow;
            }
            ReplaceLines(scheme, dto.Lines, tenantId);
            scheme.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Discount scheme updated" });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var scheme = await _db.DiscountSchemes.Include(s => s.Lines).FirstOrDefaultAsync(s => s.Id == id);
            if (scheme == null) return NotFound(new { success = false, error = "Discount scheme not found" });
            scheme.IsDeleted = true;
            scheme.UpdatedAt = DateTime.UtcNow;
            foreach (var line in scheme.Lines)
            {
                line.IsDeleted = true;
                line.UpdatedAt = DateTime.UtcNow;
            }
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Discount scheme deleted" });
        }

        private static object MapScheme(DiscountScheme scheme) => new
        {
            scheme.Id,
            scheme.SchemeCode,
            scheme.SchemeName,
            scheme.DiscountType,
            scheme.Scope,
            scheme.Value,
            scheme.Priority,
            scheme.ValidFrom,
            scheme.ValidTo,
            scheme.MinQuantity,
            scheme.MinBillAmount,
            scheme.MaxDiscountAmount,
            scheme.Status,
            scheme.Category,
            scheme.Notes,
            productCount = scheme.Lines.Count(l => !l.IsDeleted),
            lines = scheme.Lines.Where(l => !l.IsDeleted).Select(l => new
            {
                l.Id,
                l.ItemId,
                itemName = l.Item != null ? l.Item.ItemName : null,
                itemCode = l.Item != null ? l.Item.ItemCode : null,
                l.Category,
                l.Value
            })
        };

        private static void ApplyDto(DiscountScheme scheme, SaveDiscountSchemeDto dto)
        {
            scheme.SchemeName = dto.SchemeName.Trim();
            if (!string.IsNullOrWhiteSpace(dto.SchemeCode)) scheme.SchemeCode = dto.SchemeCode.Trim();
            scheme.DiscountType = NormalizeType(dto.DiscountType);
            scheme.Scope = NormalizeScope(dto.Scope);
            scheme.Value = Math.Max(0, dto.Value);
            scheme.Priority = dto.Priority <= 0 ? 10 : dto.Priority;
            scheme.ValidFrom = dto.ValidFrom == default ? DateTime.UtcNow.Date : dto.ValidFrom.Date;
            scheme.ValidTo = dto.ValidTo == default ? scheme.ValidFrom.AddMonths(1) : dto.ValidTo.Date;
            scheme.MinQuantity = Math.Max(0, dto.MinQuantity);
            scheme.MinBillAmount = Math.Max(0, dto.MinBillAmount);
            scheme.MaxDiscountAmount = Math.Max(0, dto.MaxDiscountAmount);
            scheme.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim();
            scheme.Category = string.IsNullOrWhiteSpace(dto.Category) ? null : dto.Category.Trim();
            scheme.Notes = dto.Notes;
        }

        private static void ReplaceLines(DiscountScheme scheme, List<SaveDiscountSchemeLineDto>? lines, Guid tenantId)
        {
            if (lines == null) return;
            foreach (var line in lines)
            {
                if (line.ItemId == null && string.IsNullOrWhiteSpace(line.Category)) continue;
                scheme.Lines.Add(new DiscountSchemeLine
                {
                    TenantId = tenantId,
                    ItemId = line.ItemId,
                    Category = string.IsNullOrWhiteSpace(line.Category) ? null : line.Category.Trim(),
                    Value = line.Value,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        private static string NormalizeType(string? value) =>
            value is "Amount" or "SpecialPrice" or "Percent" ? value : "Percent";

        private static string NormalizeScope(string? value) =>
            value is "AllItems" or "Category" or "Items" ? value : "Items";

        private static Match? MatchScheme(IEnumerable<DiscountScheme> schemes, Item item, decimal quantity)
        {
            foreach (var scheme in schemes.OrderByDescending(s => s.Priority))
            {
                if (quantity < scheme.MinQuantity) continue;
                DiscountSchemeLine? line = null;
                var matches = scheme.Scope switch
                {
                    "AllItems" => true,
                    "Category" => CategoriesMatch(scheme.Category, item.Category)
                        || scheme.Lines.Any(l => !l.IsDeleted && CategoriesMatch(l.Category, item.Category)),
                    _ => TryFindItemLine(scheme, item.Id, out line)
                        || scheme.Lines.Any(l => !l.IsDeleted && CategoriesMatch(l.Category, item.Category))
                };
                if (!matches) continue;
                var value = line?.Value ?? scheme.Value;
                return new Match(scheme, scheme.DiscountType, value);
            }

            return null;
        }

        private static bool TryFindItemLine(DiscountScheme scheme, Guid itemId, out DiscountSchemeLine? line)
        {
            line = scheme.Lines.FirstOrDefault(l => !l.IsDeleted && l.ItemId == itemId);
            return line != null;
        }

        private static bool CategoriesMatch(string? left, string? right) =>
            !string.IsNullOrWhiteSpace(left)
            && !string.IsNullOrWhiteSpace(right)
            && string.Equals(left.Trim(), right.Trim(), StringComparison.OrdinalIgnoreCase);

        private static decimal NetRate(decimal listPrice, string type, decimal value)
        {
            if (type == "SpecialPrice" && value > 0) return value;
            if (type == "Percent" && value > 0) return Math.Max(0, Math.Round(listPrice * (1 - value / 100m), 2, MidpointRounding.AwayFromZero));
            if (type == "Amount" && value > 0) return Math.Max(0, listPrice - value);
            return listPrice;
        }

        private sealed record Match(DiscountScheme Scheme, string Type, decimal Value);
    }

    public class SaveDiscountSchemeDto
    {
        public string? SchemeCode { get; set; }
        public string SchemeName { get; set; } = string.Empty;
        public string DiscountType { get; set; } = "Percent";
        public string Scope { get; set; } = "Items";
        public decimal Value { get; set; }
        public int Priority { get; set; } = 10;
        public DateTime ValidFrom { get; set; }
        public DateTime ValidTo { get; set; }
        public decimal MinQuantity { get; set; }
        public decimal MinBillAmount { get; set; }
        public decimal MaxDiscountAmount { get; set; }
        public string Status { get; set; } = "Active";
        public string? Category { get; set; }
        public string? Notes { get; set; }
        public List<SaveDiscountSchemeLineDto>? Lines { get; set; }
    }

    public class SaveDiscountSchemeLineDto
    {
        public Guid? ItemId { get; set; }
        public string? Category { get; set; }
        public decimal? Value { get; set; }
    }
}
