using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Procurement.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Route("api/v1/procurement/orders")]
    [Route("api/v1/purchase-orders")]
    [Authorize]
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ICommercialOrderService _orders;

        public PurchaseOrdersController(ApplicationDbContext db, ITenantAccessor tenantAccessor, ICommercialOrderService orders)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _orders = orders;
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
                .AsNoTracking()
                .Where(o => o.Id == id && o.TenantId == tenantId && !o.IsDeleted)
                .Select(o => new
                {
                    o.Id,
                    o.PONumber,
                    o.PODate,
                    o.VendorId,
                    o.ExpectedDeliveryDate,
                    o.Status,
                    o.SubTotal,
                    o.TaxAmount,
                    o.TotalAmount,
                    o.Notes,
                    Items = o.Items.Select(x => new
                    {
                        x.Id,
                        x.ItemId,
                        x.Description,
                        x.Quantity,
                        x.UnitPrice,
                        x.TaxRate,
                        x.TaxAmount,
                        x.TotalAmount
                    }).ToList()
                })
                .FirstOrDefaultAsync();
            if (order == null) return NotFound();
            return Ok(order);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderDto dto)
        {
            var order = await _orders.CreatePurchaseOrderAsync(new CreatePurchaseOrderCommand(
                dto.PONumber,
                dto.PODate,
                dto.VendorId,
                dto.ExpectedDeliveryDate,
                dto.TotalAmount,
                dto.DiscountAmount,
                dto.Status,
                dto.Notes,
                DocumentLines.ToCommands(dto.Items)));
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
            if (dto.DiscountAmount.HasValue) order.DiscountAmount = dto.DiscountAmount.Value;
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
        public decimal DiscountAmount { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
        public List<DocumentLineDto>? Items { get; set; }
    }

    public class UpdatePurchaseOrderDto
    {
        public DateTime? PODate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? DiscountAmount { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }
}
