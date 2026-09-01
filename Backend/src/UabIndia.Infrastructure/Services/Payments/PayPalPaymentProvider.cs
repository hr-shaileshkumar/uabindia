using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services.Payments
{
    public class PayPalPaymentProvider : IPaymentGatewayProvider
    {
        private readonly string _clientId;
        private readonly string _clientSecret;

        public PayPalPaymentProvider(IConfiguration configuration)
        {
            _clientId = configuration["Payments:PayPal:ClientId"] ?? "mock_paypal_client_id";
            _clientSecret = configuration["Payments:PayPal:ClientSecret"] ?? "mock_paypal_client_secret";
        }

        public string ProviderName => "PayPal";

        public bool SupportsCurrency(string currencyCode)
        {
            var c = (currencyCode ?? "").ToUpperInvariant();
            return c is "USD" or "EUR" or "GBP" or "CAD" or "AUD" or "JPY";
        }

        public Task<PaymentIntentResult> CreatePaymentIntentAsync(PaymentIntentRequest request, CancellationToken ct = default)
        {
            var orderId = $"PAYPAL-ORDER-{Guid.NewGuid():N}";
            var approveUrl = $"https://www.sandbox.paypal.com/checkoutnow?token={orderId}";

            return Task.FromResult(new PaymentIntentResult
            {
                Success = true,
                Provider = ProviderName,
                PaymentIntentId = orderId,
                RedirectUrl = approveUrl,
                Status = "Created"
            });
        }

        public Task<PaymentCaptureResult> CapturePaymentAsync(string paymentReference, decimal amount, string currency, CancellationToken ct = default)
        {
            return Task.FromResult(new PaymentCaptureResult
            {
                Success = true,
                Provider = ProviderName,
                TransactionId = $"CAPTURE-{Guid.NewGuid():N}",
                AmountCaptured = amount,
                Currency = currency.ToUpperInvariant(),
                Status = "Completed"
            });
        }

        public Task<PaymentRefundResult> RefundPaymentAsync(string paymentReference, decimal amount, string reason, CancellationToken ct = default)
        {
            return Task.FromResult(new PaymentRefundResult
            {
                Success = true,
                Provider = ProviderName,
                RefundId = $"REFUND-PAYPAL-{Guid.NewGuid():N}",
                AmountRefunded = amount,
                Status = "Completed"
            });
        }

        public Task<WebhookVerificationResult> VerifyAndParseWebhookAsync(string payload, string signatureHeader, string webhookSecret)
        {
            if (string.IsNullOrWhiteSpace(payload))
            {
                return Task.FromResult(new WebhookVerificationResult { IsValid = false, ErrorMessage = "Empty webhook payload" });
            }

            try
            {
                using var doc = JsonDocument.Parse(payload);
                var root = doc.RootElement;
                var eventId = root.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? $"WH-{Guid.NewGuid():N}" : $"WH-{Guid.NewGuid():N}";
                var eventType = root.TryGetProperty("event_type", out var typeProp) ? typeProp.GetString() ?? "PAYMENT.CAPTURE.COMPLETED" : "PAYMENT.CAPTURE.COMPLETED";

                return Task.FromResult(new WebhookVerificationResult
                {
                    IsValid = true,
                    EventId = eventId,
                    EventType = eventType,
                    RawPayload = payload
                });
            }
            catch (Exception ex)
            {
                return Task.FromResult(new WebhookVerificationResult
                {
                    IsValid = false,
                    ErrorMessage = $"PayPal JSON parsing error: {ex.Message}"
                });
            }
        }
    }
}
