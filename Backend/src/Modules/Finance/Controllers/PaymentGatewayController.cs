using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/v1/payments")]
    [Authorize]
    public class PaymentGatewayController : ControllerBase
    {
        private readonly IPaymentGatewayFactory _gatewayFactory;
        private readonly ISubscriptionBillingService _billingService;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IWebhookDispatcherService? _webhooks;

        public PaymentGatewayController(
            IPaymentGatewayFactory gatewayFactory,
            ISubscriptionBillingService billingService,
            ITenantAccessor tenantAccessor,
            IWebhookDispatcherService? webhooks = null)
        {
            _gatewayFactory = gatewayFactory;
            _billingService = billingService;
            _tenantAccessor = tenantAccessor;
            _webhooks = webhooks;
        }

        [HttpGet("gateways")]
        public IActionResult GetSupportedGateways()
        {
            var gateways = _gatewayFactory.GetSupportedProviders();
            return Ok(new { success = true, data = gateways });
        }

        public class CreateIntentApiRequest
        {
            public decimal Amount { get; set; }
            public string Currency { get; set; } = "USD";
            public string? Provider { get; set; }
            public string? CustomerEmail { get; set; }
            public string? CustomerName { get; set; }
            public Guid? InvoiceId { get; set; }
            public string? InvoiceNumber { get; set; }
            public string? Description { get; set; }
        }

        [HttpPost("intent")]
        public async Task<IActionResult> CreatePaymentIntent([FromBody] CreateIntentApiRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var provider = !string.IsNullOrWhiteSpace(req.Provider)
                ? _gatewayFactory.GetProvider(req.Provider, tenantId)
                : _gatewayFactory.GetProviderForCurrency(req.Currency, tenantId);

            var intentReq = new PaymentIntentRequest
            {
                Amount = req.Amount,
                Currency = req.Currency,
                CustomerEmail = req.CustomerEmail,
                CustomerName = req.CustomerName,
                InvoiceId = req.InvoiceId,
                InvoiceNumber = req.InvoiceNumber,
                Description = req.Description
            };

            var result = await provider.CreatePaymentIntentAsync(intentReq);
            return Ok(new { success = result.Success, data = result });
        }

        public class CapturePaymentApiRequest
        {
            public string PaymentReference { get; set; } = string.Empty;
            public decimal Amount { get; set; }
            public string Currency { get; set; } = "USD";
            public string? Provider { get; set; }
        }

        [HttpPost("capture")]
        public async Task<IActionResult> CapturePayment([FromBody] CapturePaymentApiRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var provider = !string.IsNullOrWhiteSpace(req.Provider)
                ? _gatewayFactory.GetProvider(req.Provider, tenantId)
                : _gatewayFactory.GetProviderForCurrency(req.Currency, tenantId);

            var result = await provider.CapturePaymentAsync(req.PaymentReference, req.Amount, req.Currency);

            if (result.Success && _webhooks != null && tenantId != Guid.Empty)
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _webhooks.DispatchEventAsync(tenantId, "payment.captured", new
                        {
                            provider = result.Provider,
                            transactionId = result.TransactionId,
                            amount = result.AmountCaptured,
                            currency = result.Currency,
                            paymentReference = req.PaymentReference,
                            capturedAt = DateTime.UtcNow
                        }, System.Threading.CancellationToken.None);
                    }
                    catch { }
                });
            }

            return Ok(new { success = result.Success, data = result });
        }

        public class RefundPaymentApiRequest
        {
            public string PaymentReference { get; set; } = string.Empty;
            public decimal Amount { get; set; }
            public string Reason { get; set; } = "Requested by customer";
            public string? Provider { get; set; }
        }

        [HttpPost("refund")]
        public async Task<IActionResult> RefundPayment([FromBody] RefundPaymentApiRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var provider = _gatewayFactory.GetProvider(req.Provider ?? "Stripe", tenantId);
            var result = await provider.RefundPaymentAsync(req.PaymentReference, req.Amount, req.Reason);
            return Ok(new { success = result.Success, data = result });
        }

        [HttpPost("billing/run-cycle")]
        public async Task<IActionResult> RunSubscriptionBillingCycle([FromQuery] DateTime? asOfDate = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var result = await _billingService.ProcessRecurringBillingCycleAsync(
                tenantId,
                asOfDate ?? DateTime.UtcNow);

            return Ok(new { success = true, data = result });
        }
    }
}
