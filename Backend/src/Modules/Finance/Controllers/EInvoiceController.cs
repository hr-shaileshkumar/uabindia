using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/v1/finance/einvoice")]
    [Authorize]
    public class EInvoiceController : ControllerBase
    {
        private readonly IEInvoiceService _eInvoiceService;
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public EInvoiceController(
            IEInvoiceService eInvoiceService,
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor)
        {
            _eInvoiceService = eInvoiceService;
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpPost("generate/{invoiceId:guid}")]
        public async Task<IActionResult> GenerateEInvoice(Guid invoiceId)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var invoice = await _db.SalesInvoices.IgnoreQueryFilters()
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == invoiceId && i.TenantId == tenantId && !i.IsDeleted);

            if (invoice == null)
            {
                return NotFound(new { success = false, message = "Sales invoice not found." });
            }

            var result = await _eInvoiceService.GenerateEInvoiceAsync(invoice, tenantId);
            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.ErrorMessage });
            }

            await _db.SaveChangesAsync();

            return Ok(new { success = true, data = result });
        }

        [HttpPost("eway-bill")]
        public async Task<IActionResult> GenerateEWayBill([FromBody] EWayBillRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var result = await _eInvoiceService.GenerateEWayBillAsync(req, tenantId);
            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.ErrorMessage });
            }

            return Ok(new { success = true, data = result });
        }

        public class PeppolApiRequest
        {
            public Guid InvoiceId { get; set; }
            public string SupplierVat { get; set; } = "DE123456789";
            public string CustomerVat { get; set; } = "FR987654321";
        }

        [HttpPost("generate-peppol")]
        public async Task<IActionResult> GeneratePeppol([FromBody] PeppolApiRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var invoice = await _db.SalesInvoices.IgnoreQueryFilters()
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == req.InvoiceId && i.TenantId == tenantId && !i.IsDeleted);

            if (invoice == null)
            {
                return NotFound(new { success = false, message = "Sales invoice not found." });
            }

            var xml = _eInvoiceService.GeneratePeppolBis3Xml(invoice, req.SupplierVat, req.CustomerVat);
            return Ok(new { success = true, ublXml = xml });
        }

        public class ZatcaApiRequest
        {
            public string SellerName { get; set; } = string.Empty;
            public string VatNumber { get; set; } = string.Empty;
            public decimal TotalAmount { get; set; }
            public decimal VatAmount { get; set; }
        }

        [HttpPost("generate-zatca")]
        public IActionResult GenerateZatca([FromBody] ZatcaApiRequest req)
        {
            var qr = _eInvoiceService.GenerateZatcaPhase2Qr(
                req.SellerName,
                req.VatNumber,
                DateTime.UtcNow,
                req.TotalAmount,
                req.VatAmount);

            return Ok(new { success = true, zatcaQrBase64 = qr });
        }

        public class ComputeIrnApiRequest
        {
            public string SupplierGstin { get; set; } = string.Empty;
            public string DocType { get; set; } = "INV";
            public string DocNumber { get; set; } = string.Empty;
            public int FinancialYear { get; set; } = 2026;
        }

        [HttpPost("compute-irn")]
        public IActionResult ComputeIrn([FromBody] ComputeIrnApiRequest req)
        {
            var irn = _eInvoiceService.ComputeIrn(req.SupplierGstin, req.DocType, req.DocNumber, req.FinancialYear);
            return Ok(new { success = true, irn });
        }
    }
}
