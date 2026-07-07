using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Procurement.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public PurchaseOrdersController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100;

            var total = await _db.PurchaseOrders.CountAsync();
            var orders = await _db.PurchaseOrders
                .Where(o => o.TenantId == tenantId && !o.IsDeleted)
                .OrderByDescending(o => o.PODate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return Ok(new { data = orders, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var order = await _db.PurchaseOrders
                .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantId && !o.IsDeleted);
            if (order == null) return NotFound();
            return Ok(order);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var order = new PurchaseOrder
            {
                PONumber = dto.PONumber,
                PODate = dto.PODate,
                VendorId = dto.VendorId,
                ExpectedDeliveryDate = dto.ExpectedDeliveryDate,
                TotalAmount = dto.TotalAmount,
                Status = dto.Status ?? "Draft",
                Notes = dto.Notes,
                SubTotal = dto.TotalAmount,
                TaxAmount = 0,
                DiscountAmount = 0,
                ShippingCharges = 0,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.PurchaseOrders.Add(order);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Purchase order created successfully", order });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePurchaseOrderDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var order = await _db.PurchaseOrders
                .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantId && !o.IsDeleted);
            if (order == null) return NotFound();

            if (dto.PODate.HasValue) order.PODate = dto.PODate.Value;
            if (dto.ExpectedDeliveryDate.HasValue) order.ExpectedDeliveryDate = dto.ExpectedDeliveryDate;
            if (dto.TotalAmount.HasValue)
            {
                order.TotalAmount = dto.TotalAmount.Value;
                order.SubTotal = dto.TotalAmount.Value;
            }
            if (!string.IsNullOrWhiteSpace(dto.Status)) order.Status = dto.Status;
            if (dto.Notes != null) order.Notes = dto.Notes;
            order.UpdatedAt = DateTime.UtcNow;

            _db.PurchaseOrders.Update(order);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Purchase order updated successfully", order });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var order = await _db.PurchaseOrders
                .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantId && !o.IsDeleted);
            if (order == null) return NotFound();

            order.IsDeleted = true;
            order.UpdatedAt = DateTime.UtcNow;
            _db.PurchaseOrders.Update(order);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Purchase order deleted successfully" });
        }
    }

    public class CreatePurchaseOrderDto
    {
        public string PONumber { get; set; } = string.Empty;
        public DateTime PODate { get; set; }
        public Guid VendorId { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdatePurchaseOrderDto
    {
        public DateTime? PODate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public decimal? TotalAmount { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }
}
