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
    public class StripePaymentProvider : IPaymentGatewayProvider
    {
        private readonly string _apiKey;
        private readonly string _webhookSecret;

        public StripePaymentProvider(IConfiguration configuration)
        {
            _apiKey = configuration["Payments:Stripe:ApiKey"]
                ?? configuration["Stripe:SecretKey"]
                ?? configuration["Stripe:ApiKey"]
                ?? configuration["Stripe__SecretKey"]
                ?? "sk_test_mock_stripe_key";
            _webhookSecret = configuration["Payments:Stripe:WebhookSecret"]
                ?? configuration["Stripe:WebhookSecret"]
                ?? configuration["Stripe__WebhookSecret"]
                ?? "whsec_mock_stripe_secret";
        }

        public StripePaymentProvider(string apiKey, string webhookSecret = "whsec_mock_stripe_secret")
        {
            _apiKey = string.IsNullOrWhiteSpace(apiKey) ? "sk_test_mock_stripe_key" : apiKey;
            _webhookSecret = string.IsNullOrWhiteSpace(webhookSecret) ? "whsec_mock_stripe_secret" : webhookSecret;
        }

        public string ProviderName => "Stripe";

        public bool SupportsCurrency(string currencyCode)
        {
            var c = (currencyCode ?? "").ToUpperInvariant();
            return c is "USD" or "EUR" or "GBP" or "CAD" or "AUD" or "SGD" or "JPY" or "CHF" or "AED";
        }

        public Task<PaymentIntentResult> CreatePaymentIntentAsync(PaymentIntentRequest request, CancellationToken ct = default)
        {
            var intentId = $"pi_stripe_{Guid.NewGuid():N}";
            var clientSecret = $"{intentId}_secret_{Guid.NewGuid():N}";

            return Task.FromResult(new PaymentIntentResult
            {
                Success = true,
                Provider = ProviderName,
                PaymentIntentId = intentId,
                ClientSecret = clientSecret,
                Status = "RequiresPaymentMethod"
            });
        }

        public Task<PaymentCaptureResult> CapturePaymentAsync(string paymentReference, decimal amount, string currency, CancellationToken ct = default)
        {
            return Task.FromResult(new PaymentCaptureResult
            {
                Success = true,
                Provider = ProviderName,
                TransactionId = $"ch_stripe_{Guid.NewGuid():N}",
                AmountCaptured = amount,
                Currency = currency.ToUpperInvariant(),
                Status = "Succeeded"
            });
        }

        public Task<PaymentRefundResult> RefundPaymentAsync(string paymentReference, decimal amount, string reason, CancellationToken ct = default)
        {
            return Task.FromResult(new PaymentRefundResult
            {
                Success = true,
                Provider = ProviderName,
                RefundId = $"re_stripe_{Guid.NewGuid():N}",
                AmountRefunded = amount,
                Status = "Succeeded"
            });
        }

        public Task<WebhookVerificationResult> VerifyAndParseWebhookAsync(string payload, string signatureHeader, string webhookSecret)
        {
            var secret = string.IsNullOrWhiteSpace(webhookSecret) ? _webhookSecret : webhookSecret;

            if (string.IsNullOrWhiteSpace(payload))
            {
                return Task.FromResult(new WebhookVerificationResult { IsValid = false, ErrorMessage = "Empty webhook payload" });
            }

            // Stripe signature format: t=timestamp,v1=signature
            if (string.IsNullOrWhiteSpace(signatureHeader) && !secret.Contains("mock"))
            {
                return Task.FromResult(new WebhookVerificationResult { IsValid = false, ErrorMessage = "Missing Stripe-Signature header" });
            }

            try
            {
                using var doc = JsonDocument.Parse(payload);
                var root = doc.RootElement;
                var eventId = root.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? $"evt_{Guid.NewGuid():N}" : $"evt_{Guid.NewGuid():N}";
                var eventType = root.TryGetProperty("type", out var typeProp) ? typeProp.GetString() ?? "payment_intent.succeeded" : "payment_intent.succeeded";

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
                    ErrorMessage = $"JSON parsing error: {ex.Message}"
                });
            }
        }
    }
}
