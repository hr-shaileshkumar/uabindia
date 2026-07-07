using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Sales.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class SalesOrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public SalesOrdersController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
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

            var total = await _db.SalesOrders.CountAsync();
            var orders = await _db.SalesOrders
                .Where(o => o.TenantId == tenantId && !o.IsDeleted)
                .OrderByDescending(o => o.SODate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return Ok(new { data = orders, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var order = await _db.SalesOrders
                .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantId && !o.IsDeleted);
            if (order == null) return NotFound();
            return Ok(order);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateSalesOrderDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var order = new SalesOrder
            {
                SONumber = dto.SONumber,
                SODate = dto.SODate,
                CustomerId = dto.CustomerId,
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

            _db.SalesOrders.Add(order);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Sales order created successfully", order });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSalesOrderDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var order = await _db.SalesOrders
                .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantId && !o.IsDeleted);
            if (order == null) return NotFound();

            if (dto.SODate.HasValue) order.SODate = dto.SODate.Value;
            if (dto.ExpectedDeliveryDate.HasValue) order.ExpectedDeliveryDate = dto.ExpectedDeliveryDate;
            if (dto.TotalAmount.HasValue)
            {
                order.TotalAmount = dto.TotalAmount.Value;
                order.SubTotal = dto.TotalAmount.Value;
            }
            if (!string.IsNullOrWhiteSpace(dto.Status)) order.Status = dto.Status;
            if (dto.Notes != null) order.Notes = dto.Notes;
            order.UpdatedAt = DateTime.UtcNow;

            _db.SalesOrders.Update(order);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Sales order updated successfully", order });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var order = await _db.SalesOrders
                .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantId && !o.IsDeleted);
            if (order == null) return NotFound();

            order.IsDeleted = true;
            order.UpdatedAt = DateTime.UtcNow;
            _db.SalesOrders.Update(order);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Sales order deleted successfully" });
        }
    }

    public class CreateSalesOrderDto
    {
        public string SONumber { get; set; } = string.Empty;
        public DateTime SODate { get; set; }
        public Guid CustomerId { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateSalesOrderDto
    {
        public DateTime? SODate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public decimal? TotalAmount { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }
}
