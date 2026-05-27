using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public PaymentsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
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
            var tenantId = _tenantAccessor.GetTenantId();
            if (dto.Amount <= 0)
                return BadRequest(new { message = "Amount must be positive." });

            var paymentNumber = $"PAY-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(10000, 99999)}";

            var payment = new Payment
            {
                TenantId = tenantId,
                PaymentNumber = paymentNumber,
                PaymentDate = dto.PaymentDate.Kind == DateTimeKind.Unspecified
                    ? DateTime.SpecifyKind(dto.PaymentDate, DateTimeKind.Utc)
                    : dto.PaymentDate.ToUniversalTime(),
                PaymentType = string.IsNullOrWhiteSpace(dto.PaymentType) ? "Paid" : dto.PaymentType,
                PartyType = dto.PartyType,
                PartyId = dto.PartyId,
                PartyName = dto.PartyName,
                Amount = dto.Amount,
                PaymentMode = string.IsNullOrWhiteSpace(dto.PaymentMode) ? "BankTransfer" : dto.PaymentMode,
                ReferenceNumber = dto.ReferenceNumber,
                ReferenceDate = dto.ReferenceDate,
                BankName = dto.BankName,
                InvoiceType = dto.InvoiceType,
                InvoiceId = dto.InvoiceId,
                InvoiceNumber = dto.InvoiceNumber,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Completed" : dto.Status,
                Remarks = dto.Remarks,
                CreatedAt = DateTime.UtcNow
            };

            _db.Payments.Add(payment);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Payment recorded.", payment });
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
