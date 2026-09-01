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
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Sales.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Policy = "Module:sales")]
    public class SalesOrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ISalesInvoiceService _salesInvoices;
        private readonly ICommercialOrderService _orders;

        public SalesOrdersController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ISalesInvoiceService salesInvoices,
            ICommercialOrderService orders)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _salesInvoices = salesInvoices;
            _orders = orders;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100;

            var query = _db.SalesOrders.Where(o => o.TenantId == tenantId && !o.IsDeleted);
            var total = await query.CountAsync();
            var orders = await query
                .OrderByDescending(o => o.SODate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return Ok(new { success = true, data = orders, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var order = await _db.SalesOrders
                .AsNoTracking()
                .Where(o => o.Id == id && o.TenantId == tenantId && !o.IsDeleted)
                .Select(o => new
                {
                    o.Id,
                    o.SONumber,
                    o.SODate,
                    o.CustomerId,
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
        public async Task<IActionResult> Create([FromBody] CreateSalesOrderDto dto)
        {
            var order = await _orders.CreateSalesOrderAsync(new CreateSalesOrderCommand(
                dto.SONumber,
                dto.SODate,
                dto.CustomerId,
                dto.ExpectedDeliveryDate,
                dto.TotalAmount,
                dto.DiscountAmount,
                dto.Status,
                dto.Notes,
                DocumentLines.ToCommands(dto.Items)));
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

            try
            {
                DocumentLifecycle.EnsureMutable("Sales order", DocumentLifecycle.IsLockedSalesOrder(order.Status));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }

            if (dto.SODate.HasValue) order.SODate = dto.SODate.Value;
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

            try
            {
                DocumentLifecycle.EnsureMutable("Sales order", DocumentLifecycle.IsLockedSalesOrder(order.Status));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }

            order.IsDeleted = true;
            order.UpdatedAt = DateTime.UtcNow;
            _db.SalesOrders.Update(order);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Sales order deleted successfully" });
        }

        [HttpPost("{id}/convert-to-invoice")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ConvertToInvoice(Guid id)
        {
            try
            {
                var invoice = await _salesInvoices.ConvertOrderAsync(id);
                return Ok(new { success = true, message = "Sales order converted to invoice", data = invoice });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, error = "Sales order not found" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }
    }

    public class CreateSalesOrderDto
    {
        public string SONumber { get; set; } = string.Empty;
        public DateTime SODate { get; set; }
        public Guid CustomerId { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
        public List<DocumentLineDto>? Items { get; set; }
    }

    public class UpdateSalesOrderDto
    {
        public DateTime? SODate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? DiscountAmount { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }
}
