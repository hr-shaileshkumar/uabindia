using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Procurement.Controllers
{
    [ApiController]
    [Route("api/v1/purchaseinvoices")]
    [Route("api/v1/vendor-bills")]
    [Route("api/v1/finance/vendor-bills")]
    [Route("api/v1/procurement/invoices")]
    [Route("api/v1/purchase-invoices")]
    [Authorize]
    [Authorize(Policy = "Module:procurement")]
    public class PurchaseInvoicesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IPurchaseInvoiceService _purchaseInvoices;

        public PurchaseInvoicesController(
            ApplicationDbContext db,
            IPurchaseInvoiceService purchaseInvoices)
        {
            _db = db;
            _purchaseInvoices = purchaseInvoices;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int limit = 20)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 20;
            var query = _db.PurchaseInvoices.AsNoTracking().Where(i => !i.IsDeleted);
            var total = await query.CountAsync();
            var data = await query.OrderByDescending(i => i.InvoiceDate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();
            return Ok(new { data, total, page, limit });
        }

        [HttpPost]
        [Authorize(Roles = "SuperAdmin,Admin,Manager")]
        public async Task<IActionResult> Create([FromBody] CreatePurchaseInvoiceRequest dto)
        {
            try
            {
                var invoice = await _purchaseInvoices.CreateAsync(new CreatePurchaseInvoiceCommand(
                    dto.PurchaseOrderId,
                    dto.VendorId,
                    dto.InvoiceDate,
                    dto.DueDate,
                    dto.VendorInvoiceNumber,
                    dto.SubTotal,
                    dto.TotalAmount,
                    dto.DiscountAmount,
                    dto.TaxRate,
                    dto.Notes,
                    DocumentLines.ToCommands(dto.Items)));
                return Ok(invoice);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        public class CreatePurchaseInvoiceRequest
        {
            public Guid PurchaseOrderId { get; set; }
            public Guid VendorId { get; set; }
            public DateTime InvoiceDate { get; set; }
            public DateTime? DueDate { get; set; }
            public string? VendorInvoiceNumber { get; set; }
            public decimal SubTotal { get; set; }
            public decimal TotalAmount { get; set; }
            public decimal DiscountAmount { get; set; }
            public decimal TaxRate { get; set; } = 18;
            public string? Notes { get; set; }
            public List<DocumentLineDto>? Items { get; set; }
        }
    }
}
