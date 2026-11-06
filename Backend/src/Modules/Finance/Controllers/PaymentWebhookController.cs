using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/v1/payments/webhooks")]
    [AllowAnonymous]
    public class PaymentWebhookController : ControllerBase
    {
        private readonly IPaymentGatewayFactory _gatewayFactory;
        private readonly ApplicationDbContext _db;

        public PaymentWebhookController(IPaymentGatewayFactory gatewayFactory, ApplicationDbContext db)
        {
            _gatewayFactory = gatewayFactory;
            _db = db;
        }

        [HttpPost("{provider}")]
        public async Task<IActionResult> HandleWebhook(string provider)
        {
            using var reader = new StreamReader(Request.Body, Encoding.UTF8);
            var payload = await reader.ReadToEndAsync();

            var signatureHeader = Request.Headers["Stripe-Signature"].ToString();
            if (string.IsNullOrEmpty(signatureHeader))
            {
                signatureHeader = Request.Headers["X-Razorpay-Signature"].ToString();
            }
            if (string.IsNullOrEmpty(signatureHeader))
            {
                signatureHeader = Request.Headers["Paypal-Transmission-Sig"].ToString();
            }

            var gateway = _gatewayFactory.GetProvider(provider);
            var verification = await gateway.VerifyAndParseWebhookAsync(payload, signatureHeader, string.Empty);

            if (!verification.IsValid)
            {
                return BadRequest(new { success = false, message = verification.ErrorMessage });
            }

            // Replay protection: Check if event ID has already been recorded in Outbox/Payment logs
            var existingEvent = await _db.OutboxMessages.IgnoreQueryFilters()
                .AnyAsync(m => m.EventType == $"webhook:{provider}:{verification.EventId}");

            if (existingEvent)
            {
                // Acknowledge receipt idempotently
                return Ok(new { received = true, idempotent = true });
            }

            // Log event to transactional outbox for asynchronous cross-module dispatch
            _db.OutboxMessages.Add(new OutboxMessage
            {
                EventType = $"webhook:{provider}:{verification.EventId}",
                PayloadJson = payload,
                OccurredAtUtc = DateTime.UtcNow,
                IsProcessed = false
            });

            await _db.SaveChangesAsync();

            return Ok(new { received = true, eventId = verification.EventId, eventType = verification.EventType });
        }
    }
}
