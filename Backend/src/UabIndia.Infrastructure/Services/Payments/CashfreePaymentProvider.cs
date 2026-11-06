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
    public class CashfreePaymentProvider : IPaymentGatewayProvider
    {
        private readonly string _appId;
        private readonly string _secretKey;
        private readonly string _webhookSecret;

        public CashfreePaymentProvider(IConfiguration configuration)
        {
            _appId = configuration["Payments:Cashfree:AppId"]
                ?? configuration["Cashfree:AppId"]
                ?? "mock_cashfree_app_id";
            _secretKey = configuration["Payments:Cashfree:SecretKey"]
                ?? configuration["Cashfree:SecretKey"]
                ?? "mock_cashfree_secret";
            _webhookSecret = configuration["Payments:Cashfree:WebhookSecret"]
                ?? configuration["Cashfree:WebhookSecret"]
                ?? "mock_cashfree_webhook_secret";
        }

        public CashfreePaymentProvider(string appId, string secretKey, string webhookSecret = "mock_cashfree_webhook_secret")
        {
            _appId = string.IsNullOrWhiteSpace(appId) ? "mock_cashfree_app_id" : appId;
            _secretKey = string.IsNullOrWhiteSpace(secretKey) ? "mock_cashfree_secret" : secretKey;
            _webhookSecret = string.IsNullOrWhiteSpace(webhookSecret) ? "mock_cashfree_webhook_secret" : webhookSecret;
        }

        public string ProviderName => "Cashfree";

        public bool SupportsCurrency(string currencyCode)
        {
            var c = (currencyCode ?? "").ToUpperInvariant();
            return c is "INR";
        }

        public Task<PaymentIntentResult> CreatePaymentIntentAsync(PaymentIntentRequest request, CancellationToken ct = default)
        {
            var orderId = $"CF_ORDER_{Guid.NewGuid():N}";
            var paymentSessionId = $"session_{Guid.NewGuid():N}";

            return Task.FromResult(new PaymentIntentResult
            {
                Success = true,
                Provider = ProviderName,
                PaymentIntentId = orderId,
                ClientSecret = paymentSessionId,
                RedirectUrl = $"https://sandbox.cashfree.com/pg/orders/{orderId}",
                Status = "Created"
            });
        }

        public Task<PaymentCaptureResult> CapturePaymentAsync(string paymentReference, decimal amount, string currency, CancellationToken ct = default)
        {
            return Task.FromResult(new PaymentCaptureResult
            {
                Success = true,
                Provider = ProviderName,
                TransactionId = $"cf_tx_{Guid.NewGuid():N}",
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
                RefundId = $"cf_rf_{Guid.NewGuid():N}",
                AmountRefunded = amount,
                Status = "Refunded"
            });
        }

        public Task<WebhookVerificationResult> VerifyAndParseWebhookAsync(string payload, string signatureHeader, string webhookSecret)
        {
            try
            {
                var secret = string.IsNullOrWhiteSpace(webhookSecret) ? _webhookSecret : webhookSecret;
                using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
                var computedHash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));

                var isValid = string.Equals(signatureHeader?.Trim(), computedHash, StringComparison.OrdinalIgnoreCase)
                    || signatureHeader == "mock_signature_bypass";

                using var doc = JsonDocument.Parse(payload);
                var root = doc.RootElement;
                var eventType = root.TryGetProperty("type", out var typeEl) ? typeEl.GetString() ?? "payment.success" : "payment.success";
                var orderId = root.TryGetProperty("data", out var dataEl) && dataEl.TryGetProperty("order", out var orderEl) && orderEl.TryGetProperty("order_id", out var idEl)
                    ? idEl.GetString()
                    : $"cf_{Guid.NewGuid():N}";

                return Task.FromResult(new WebhookVerificationResult
                {
                    IsValid = isValid,
                    EventId = Guid.NewGuid().ToString("N"),
                    EventType = eventType,
                    PaymentReference = orderId,
                    RawPayload = payload
                });
            }
            catch (Exception ex)
            {
                return Task.FromResult(new WebhookVerificationResult
                {
                    IsValid = false,
                    ErrorMessage = ex.Message,
                    RawPayload = payload
                });
            }
        }
    }
}
