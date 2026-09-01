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
    [Route("api/v1/salesquotations")]
    [Authorize(Policy = "Module:sales")]
    public class SalesQuotationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentConversionService _conversions;
        private readonly ICommercialOrderService _orders;

        public SalesQuotationsController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentConversionService conversions,
            ICommercialOrderService orders)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _conversions = conversions;
            _orders = orders;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100;

            var query = _db.SalesQuotations.AsNoTracking()
                .Where(q => q.TenantId == tenantId && !q.IsDeleted);

            var total = await query.CountAsync();
            var rows = await query
                .OrderByDescending(q => q.QuotationDate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(q => new
                {
                    q.Id,
                    q.QuotationNumber,
                    q.QuotationDate,
                    q.CustomerId,
                    CustomerName = _db.Customers
                        .Where(c => c.Id == q.CustomerId)
                        .Select(c => c.CustomerName)
                        .FirstOrDefault(),
                    q.ValidUntil,
                    q.SubTotal,
                    q.TaxAmount,
                    q.DiscountAmount,
                    q.ShippingCharges,
                    q.TotalAmount,
                    q.Status,
                    q.Terms,
                    q.Notes,
                    q.CreatedAt,
                    q.UpdatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = rows, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var quotation = await _db.SalesQuotations
                .AsNoTracking()
                .FirstOrDefaultAsync(q => q.Id == id && q.TenantId == tenantId && !q.IsDeleted);

            if (quotation == null)
                return NotFound(new { success = false, error = "Quotation not found" });

            return Ok(new { success = true, data = quotation });
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateSalesQuotationDto dto)
        {
            try
            {
                var quotation = await _orders.CreateSalesQuotationAsync(new CreateSalesQuotationCommand(
                    dto.QuotationNumber,
                    dto.QuotationDate,
                    dto.ValidUntil,
                    dto.CustomerId,
                    dto.SubTotal,
                    dto.TaxAmount,
                    dto.DiscountAmount,
                    dto.ShippingCharges,
                    dto.TotalAmount,
                    dto.Status,
                    dto.Terms,
                    dto.Notes,
                    DocumentLines.ToCommands(dto.Items)));
                return Ok(new { success = true, message = "Quotation created successfully", data = quotation });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSalesQuotationDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var quotation = await _db.SalesQuotations
                .FirstOrDefaultAsync(q => q.Id == id && q.TenantId == tenantId && !q.IsDeleted);

            if (quotation == null)
                return NotFound(new { success = false, error = "Quotation not found" });

            try
            {
                DocumentLifecycle.EnsureMutable("Quotation", DocumentLifecycle.IsLockedQuotation(quotation.Status));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }

            if (dto.QuotationDate.HasValue) quotation.QuotationDate = dto.QuotationDate.Value;
            if (dto.ValidUntil.HasValue) quotation.ValidUntil = dto.ValidUntil.Value;
            if (dto.TotalAmount.HasValue)
            {
                quotation.TotalAmount = dto.TotalAmount.Value;
                if (!dto.SubTotal.HasValue) quotation.SubTotal = dto.TotalAmount.Value;
            }
            if (dto.SubTotal.HasValue) quotation.SubTotal = dto.SubTotal.Value;
            if (dto.TaxAmount.HasValue) quotation.TaxAmount = dto.TaxAmount.Value;
            if (dto.DiscountAmount.HasValue) quotation.DiscountAmount = dto.DiscountAmount.Value;
            if (dto.ShippingCharges.HasValue) quotation.ShippingCharges = dto.ShippingCharges.Value;
            if (!string.IsNullOrWhiteSpace(dto.Status)) quotation.Status = dto.Status;
            if (dto.Terms != null) quotation.Terms = dto.Terms;
            if (dto.Notes != null) quotation.Notes = dto.Notes;
            quotation.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Quotation updated successfully", data = quotation });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var quotation = await _db.SalesQuotations
                .FirstOrDefaultAsync(q => q.Id == id && q.TenantId == tenantId && !q.IsDeleted);

            if (quotation == null)
                return NotFound(new { success = false, error = "Quotation not found" });

            try
            {
                DocumentLifecycle.EnsureMutable("Quotation", DocumentLifecycle.IsLockedQuotation(quotation.Status));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }

            quotation.IsDeleted = true;
            quotation.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Quotation deleted successfully" });
        }

        [HttpPost("{id}/convert-to-order")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ConvertToOrder(Guid id)
        {
            try
            {
                var result = await _conversions.ConvertQuotationToOrderAsync(id);
                return Ok(new
                {
                    success = true,
                    message = result.AlreadyConverted
                        ? "Order already exists for this quotation"
                        : "Quotation converted to sales order",
                    data = result.Order
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

    public class CreateSalesQuotationDto
    {
        public string? QuotationNumber { get; set; }
        public DateTime QuotationDate { get; set; }
        public Guid CustomerId { get; set; }
        public DateTime ValidUntil { get; set; }
        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal ShippingCharges { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Status { get; set; }
        public string? Terms { get; set; }
        public string? Notes { get; set; }
        public List<DocumentLineDto>? Items { get; set; }
    }

    public class UpdateSalesQuotationDto
    {
        public DateTime? QuotationDate { get; set; }
        public DateTime? ValidUntil { get; set; }
        public decimal? SubTotal { get; set; }
        public decimal? TaxAmount { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? ShippingCharges { get; set; }
        public decimal? TotalAmount { get; set; }
        public string? Status { get; set; }
        public string? Terms { get; set; }
        public string? Notes { get; set; }
    }
}
