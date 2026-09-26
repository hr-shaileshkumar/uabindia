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
    [Route("api/v1/salesinvoices")]
    [Route("api/v1/sales/invoices")]
    [Route("api/v1/sales-invoices")]
    [Authorize(Policy = "Module:sales")]
    public class SalesInvoicesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ISalesInvoiceService _salesInvoices;

        public SalesInvoicesController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ISalesInvoiceService salesInvoices)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _salesInvoices = salesInvoices;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100;

            var query = _db.SalesInvoices.AsNoTracking()
                .Where(i => i.TenantId == tenantId && !i.IsDeleted);

            var total = await query.CountAsync();
            var rows = await query
                .OrderByDescending(i => i.InvoiceDate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(i => new
                {
                    i.Id,
                    i.InvoiceNumber,
                    i.InvoiceDate,
                    i.CustomerId,
                    CustomerName = _db.Customers
                        .Where(c => c.Id == i.CustomerId)
                        .Select(c => c.CustomerName)
                        .FirstOrDefault(),
                    i.SalesOrderId,
                    i.DueDate,
                    i.SubTotal,
                    i.TaxAmount,
                    i.DiscountAmount,
                    i.ShippingCharges,
                    i.OtherCharges,
                    i.TotalAmount,
                    i.PaidAmount,
                    i.BalanceAmount,
                    i.Status,
                    i.PaymentStatus,
                    i.PlaceOfSupply,
                    i.IsInterState,
                    i.CgstAmount,
                    i.SgstAmount,
                    i.IgstAmount,
                    i.Notes,
                    i.CreatedAt,
                    i.UpdatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = rows, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var invoice = await _db.SalesInvoices
                .AsNoTracking()
                .Where(i => i.Id == id && i.TenantId == tenantId && !i.IsDeleted)
                .Select(i => new
                {
                    i.Id,
                    i.InvoiceNumber,
                    i.InvoiceDate,
                    i.CustomerId,
                    CustomerName = _db.Customers
                        .Where(c => c.Id == i.CustomerId)
                        .Select(c => c.CustomerName)
                        .FirstOrDefault(),
                    i.SalesOrderId,
                    i.DueDate,
                    i.SubTotal,
                    i.TaxAmount,
                    i.DiscountAmount,
                    i.ShippingCharges,
                    i.OtherCharges,
                    i.TotalAmount,
                    i.PaidAmount,
                    i.BalanceAmount,
                    i.Status,
                    i.PaymentStatus,
                    i.PlaceOfSupply,
                    i.IsInterState,
                    i.CgstAmount,
                    i.SgstAmount,
                    i.IgstAmount,
                    i.Notes,
                    Items = i.Items.Select(x => new
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

            if (invoice == null)
                return NotFound(new { success = false, error = "Invoice not found" });

            return Ok(new { success = true, data = invoice });
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateSalesInvoiceDto dto)
        {
            try
            {
                var invoice = await _salesInvoices.CreateAsync(new CreateSalesInvoiceCommand(
                    dto.CustomerId,
                    dto.SalesOrderId,
                    dto.InvoiceDate,
                    dto.DueDate,
                    dto.InvoiceNumber,
                    dto.SubTotal,
                    dto.TaxAmount,
                    dto.DiscountAmount,
                    dto.ShippingCharges,
                    dto.OtherCharges,
                    dto.TotalAmount,
                    dto.PaidAmount,
                    dto.Status,
                    dto.PaymentStatus,
                    dto.Notes,
                    dto.PlaceOfSupply,
                    dto.TaxRate,
                    DocumentLines.ToCommands(dto.Items),
                    dto.WarehouseId));
                return Ok(new { success = true, message = "Invoice created successfully", data = invoice });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSalesInvoiceDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var invoice = await _db.SalesInvoices
                .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId && !i.IsDeleted);

            if (invoice == null)
                return NotFound(new { success = false, error = "Invoice not found" });

            var financialChange = dto.InvoiceDate.HasValue
                || dto.DueDate.HasValue
                || dto.TotalAmount.HasValue
                || dto.SubTotal.HasValue
                || dto.TaxAmount.HasValue
                || dto.DiscountAmount.HasValue
                || dto.PaidAmount.HasValue
                || !string.IsNullOrWhiteSpace(dto.Status)
                || !string.IsNullOrWhiteSpace(dto.PaymentStatus);

            try
            {
                DocumentLifecycle.EnsureMutable(
                    "Posted invoice",
                    DocumentLifecycle.IsPostedInvoice(invoice.JournalEntryId) && financialChange);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }

            if (dto.InvoiceDate.HasValue) invoice.InvoiceDate = dto.InvoiceDate.Value;
            if (dto.DueDate.HasValue) invoice.DueDate = dto.DueDate;
            if (dto.TotalAmount.HasValue)
            {
                invoice.TotalAmount = dto.TotalAmount.Value;
                if (!dto.SubTotal.HasValue) invoice.SubTotal = dto.TotalAmount.Value;
            }
            if (dto.SubTotal.HasValue) invoice.SubTotal = dto.SubTotal.Value;
            if (dto.TaxAmount.HasValue) invoice.TaxAmount = dto.TaxAmount.Value;
            if (dto.DiscountAmount.HasValue) invoice.DiscountAmount = dto.DiscountAmount.Value;
            if (dto.PaidAmount.HasValue) invoice.PaidAmount = dto.PaidAmount.Value;
            if (!string.IsNullOrWhiteSpace(dto.Status)) invoice.Status = dto.Status;
            if (!string.IsNullOrWhiteSpace(dto.PaymentStatus)) invoice.PaymentStatus = dto.PaymentStatus;
            if (dto.Notes != null) invoice.Notes = dto.Notes;

            invoice.BalanceAmount = invoice.TotalAmount - invoice.PaidAmount;
            invoice.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Invoice updated successfully", data = invoice });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var invoice = await _db.SalesInvoices
                .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId && !i.IsDeleted);

            if (invoice == null)
                return NotFound(new { success = false, error = "Invoice not found" });

            try
            {
                DocumentLifecycle.EnsureMutable("Posted invoice", DocumentLifecycle.IsPostedInvoice(invoice.JournalEntryId));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }

            invoice.IsDeleted = true;
            invoice.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Invoice deleted successfully" });
        }
    }

    public class CreateSalesInvoiceDto
    {
        public string? InvoiceNumber { get; set; }
        public DateTime InvoiceDate { get; set; }
        public Guid CustomerId { get; set; }
        public Guid? SalesOrderId { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal ShippingCharges { get; set; }
        public decimal OtherCharges { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public string? Status { get; set; }
        public string? PaymentStatus { get; set; }
        public string? Notes { get; set; }
        public string? PlaceOfSupply { get; set; }
        public decimal TaxRate { get; set; } = 18;
        public Guid? WarehouseId { get; set; }
        public List<DocumentLineDto>? Items { get; set; }
    }

    public class UpdateSalesInvoiceDto
    {
        public DateTime? InvoiceDate { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal? SubTotal { get; set; }
        public decimal? TaxAmount { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? PaidAmount { get; set; }
        public string? Status { get; set; }
        public string? PaymentStatus { get; set; }
        public string? Notes { get; set; }
    }
}
