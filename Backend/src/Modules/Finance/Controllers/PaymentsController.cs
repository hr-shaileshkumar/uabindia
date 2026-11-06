using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IPaymentService _payments;

        public PaymentsController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IPaymentService payments)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _payments = payments;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 20, [FromQuery] string? paymentType = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (page < 1) page = 1;
            if (limit < 1) limit = 20;
            if (limit > 100) limit = 100;

            var query = _db.Payments.AsNoTracking().Where(p => p.TenantId == tenantId);
            if (!string.IsNullOrWhiteSpace(paymentType))
                query = query.Where(p => p.PaymentType == paymentType);

            var total = await query.CountAsync();
            var data = await query
                .OrderByDescending(p => p.PaymentDate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return Ok(new { data, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var payment = await _db.Payments.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);
            if (payment == null) return NotFound();
            return Ok(payment);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreatePaymentDto dto)
        {
            try
            {
                var payment = await _payments.RecordAsync(new RecordPaymentCommand(
                    dto.PaymentDate,
                    dto.PaymentType,
                    dto.PartyType,
                    dto.PartyId,
                    dto.PartyName,
                    dto.Amount,
                    dto.PaymentMode,
                    dto.ReferenceNumber,
                    dto.ReferenceDate,
                    dto.BankName,
                    dto.InvoiceType,
                    dto.InvoiceId,
                    dto.InvoiceNumber,
                    dto.Status,
                    dto.Remarks));
                return Ok(new { message = "Payment recorded and posted to GL.", payment });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var payment = await _db.Payments.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);
            if (payment == null) return NotFound();

            payment.IsDeleted = true;
            payment.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Payment removed." });
        }
    }

    public class CreatePaymentDto
    {
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow.Date;
        public string? PaymentType { get; set; }
        public string? PartyType { get; set; }
        public Guid? PartyId { get; set; }
        public string? PartyName { get; set; }
        public decimal Amount { get; set; }
        public string? PaymentMode { get; set; }
        public string? ReferenceNumber { get; set; }
        public DateTime? ReferenceDate { get; set; }
        public string? BankName { get; set; }
        public string? InvoiceType { get; set; }
        public Guid? InvoiceId { get; set; }
        public string? InvoiceNumber { get; set; }
        public string? Status { get; set; }
        public string? Remarks { get; set; }
    }
}
