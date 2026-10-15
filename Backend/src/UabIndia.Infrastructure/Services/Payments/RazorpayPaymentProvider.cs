using System;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services.Payments
{
    public class RazorpayPaymentProvider : IPaymentGatewayProvider
    {
        private readonly string _keyId;
        private readonly string _keySecret;
        private readonly string _webhookSecret;

        public RazorpayPaymentProvider(IConfiguration configuration)
        {
            _keyId = configuration["Payments:Razorpay:KeyId"]
                ?? configuration["Razorpay:KeyId"]
                ?? configuration["Razorpay__KeyId"]
                ?? "rzp_test_mock_id";
            _keySecret = configuration["Payments:Razorpay:KeySecret"]
                ?? configuration["Razorpay:KeySecret"]
                ?? configuration["Razorpay__KeySecret"]
                ?? "mock_rzp_secret";
            _webhookSecret = configuration["Payments:Razorpay:WebhookSecret"]
                ?? configuration["Razorpay:WebhookSecret"]
                ?? configuration["Razorpay__WebhookSecret"]
                ?? "mock_rzp_webhook_secret";
        }

        public string ProviderName => "Razorpay";

        public bool SupportsCurrency(string currencyCode)
        {
            var c = (currencyCode ?? "").ToUpperInvariant();
            return c is "INR";
        }

        public Task<PaymentIntentResult> CreatePaymentIntentAsync(PaymentIntentRequest request, CancellationToken ct = default)
        {
            var orderId = $"order_rzp_{Guid.NewGuid():N}";

            return Task.FromResult(new PaymentIntentResult
            {
                Success = true,
                Provider = ProviderName,
                PaymentIntentId = orderId,
                Status = "Created"
            });
        }

        public Task<PaymentCaptureResult> CapturePaymentAsync(string paymentReference, decimal amount, string currency, CancellationToken ct = default)
        {
            return Task.FromResult(new PaymentCaptureResult
            {
                Success = true,
                Provider = ProviderName,
                TransactionId = $"pay_rzp_{Guid.NewGuid():N}",
                AmountCaptured = amount,
                Currency = currency.ToUpperInvariant(),
                Status = "Captured"
            });
        }

        public Task<PaymentRefundResult> RefundPaymentAsync(string paymentReference, decimal amount, string reason, CancellationToken ct = default)
        {
            return Task.FromResult(new PaymentRefundResult
            {
                Success = true,
                Provider = ProviderName,
                RefundId = $"rfnd_rzp_{Guid.NewGuid():N}",
                AmountRefunded = amount,
                Status = "Processed"
            });
        }

        public Task<WebhookVerificationResult> VerifyAndParseWebhookAsync(string payload, string signatureHeader, string webhookSecret)
        {
            var secret = string.IsNullOrWhiteSpace(webhookSecret) ? _webhookSecret : webhookSecret;

            if (string.IsNullOrWhiteSpace(payload))
            {
                return Task.FromResult(new WebhookVerificationResult { IsValid = false, ErrorMessage = "Empty webhook payload" });
            }

            try
            {
                using var doc = JsonDocument.Parse(payload);
                var root = doc.RootElement;
                var eventType = root.TryGetProperty("event", out var evProp) ? evProp.GetString() ?? "payment.captured" : "payment.captured";
                var eventId = $"evt_rzp_{Guid.NewGuid():N}";

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
                    ErrorMessage = $"Razorpay JSON parsing error: {ex.Message}"
                });
            }
        }
    }
}
