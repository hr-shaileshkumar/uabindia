using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Application.Interfaces;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace UabIndia.Api.Modules.Inventory.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class ItemsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;

        public ItemsController(ApplicationDbContext db, ITenantAccessor tenantAccessor, IDocumentNumberService numbers)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100;
            var total = await _db.Items.CountAsync();
            var items = await _db.Items
                .Where(i => i.TenantId == tenantId)
                .OrderBy(i => i.ItemName)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return Ok(new { success = true, data = items, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var item = await _db.Items
                .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateItemDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var item = new Item
            {
                ItemCode = string.IsNullOrWhiteSpace(dto.ItemCode)
                    ? await _numbers.NextAsync("Item", "ITM-", 5)
                    : dto.ItemCode.Trim(),
                ItemName = dto.ItemName,
                ItemType = dto.ItemType ?? "Stockable",
                Category = dto.Category,
                Description = dto.Description,
                UnitOfMeasure = dto.UnitOfMeasure ?? "Pcs",
                HSNCode = dto.HSNCode,
                PurchasePrice = dto.PurchasePrice,
                SellingPrice = dto.SellingPrice,
                MRP = dto.MRP,
                MinStockLevel = dto.MinStockLevel,
                MaxStockLevel = dto.MaxStockLevel,
                ReorderLevel = dto.ReorderLevel,
                ReorderQuantity = dto.ReorderQuantity,
                TaxRate = dto.TaxRate ?? 18,
                IsActive = true,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Items.Add(item);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Item created successfully", item });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateItemDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var item = await _db.Items
                .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId && !i.IsDeleted);
            if (item == null) return NotFound();

            if (dto.ItemName != null) item.ItemName = dto.ItemName;
            if (dto.SellingPrice.HasValue) item.SellingPrice = dto.SellingPrice.Value;
            if (dto.MinStockLevel.HasValue) item.MinStockLevel = dto.MinStockLevel.Value;
            item.UpdatedAt = DateTime.UtcNow;

            _db.Items.Update(item);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Item updated successfully", item });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var item = await _db.Items
                .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId && !i.IsDeleted);
            if (item == null) return NotFound();

            item.IsDeleted = true;
            item.UpdatedAt = DateTime.UtcNow;
            _db.Items.Update(item);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Item deleted successfully" });
        }
    }

    public class CreateItemDto
    {
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string? ItemType { get; set; }
        public string? Category { get; set; }
        public string? Description { get; set; }
        public string? UnitOfMeasure { get; set; }
        public string? HSNCode { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal SellingPrice { get; set; }
        public decimal MRP { get; set; }
        public decimal MinStockLevel { get; set; }
        public decimal MaxStockLevel { get; set; }
        public decimal ReorderLevel { get; set; }
        public decimal ReorderQuantity { get; set; }
        public decimal? TaxRate { get; set; }
    }

    public class UpdateItemDto
    {
        public string? ItemName { get; set; }
        public decimal? SellingPrice { get; set; }
        public decimal? MinStockLevel { get; set; }
    }
}
