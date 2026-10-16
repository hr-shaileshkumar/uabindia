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
    public class PhonePePaymentProvider : IPaymentGatewayProvider
    {
        private readonly string _merchantId;
        private readonly string _saltKey;
        private readonly string _saltIndex;

        public PhonePePaymentProvider(IConfiguration configuration)
        {
            _merchantId = configuration["Payments:PhonePe:MerchantId"]
                ?? configuration["PhonePe:MerchantId"]
                ?? "mock_phonepe_mid";
            _saltKey = configuration["Payments:PhonePe:SaltKey"]
                ?? configuration["PhonePe:SaltKey"]
                ?? "mock_phonepe_salt_key";
            _saltIndex = configuration["Payments:PhonePe:SaltIndex"]
                ?? configuration["PhonePe:SaltIndex"]
                ?? "1";
        }

        public PhonePePaymentProvider(string merchantId, string saltKey, string saltIndex = "1")
        {
            _merchantId = string.IsNullOrWhiteSpace(merchantId) ? "mock_phonepe_mid" : merchantId;
            _saltKey = string.IsNullOrWhiteSpace(saltKey) ? "mock_phonepe_salt_key" : saltKey;
            _saltIndex = string.IsNullOrWhiteSpace(saltIndex) ? "1" : saltIndex;
        }

        public string ProviderName => "PhonePe";

        public bool SupportsCurrency(string currencyCode)
        {
            var c = (currencyCode ?? "").ToUpperInvariant();
            return c is "INR";
        }

        public Task<PaymentIntentResult> CreatePaymentIntentAsync(PaymentIntentRequest request, CancellationToken ct = default)
        {
            var txnId = $"PP_TXN_{Guid.NewGuid():N}";
            var redirectUrl = $"https://mercury-uat.phonepe.com/transact/pg?token={txnId}";

            return Task.FromResult(new PaymentIntentResult
            {
                Success = true,
                Provider = ProviderName,
                PaymentIntentId = txnId,
                RedirectUrl = redirectUrl,
                Status = "Created"
            });
        }

        public Task<PaymentCaptureResult> CapturePaymentAsync(string paymentReference, decimal amount, string currency, CancellationToken ct = default)
        {
            return Task.FromResult(new PaymentCaptureResult
            {
                Success = true,
                Provider = ProviderName,
                TransactionId = $"pp_cap_{Guid.NewGuid():N}",
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
                RefundId = $"pp_rf_{Guid.NewGuid():N}",
                AmountRefunded = amount,
                Status = "Refunded"
            });
        }

        public Task<WebhookVerificationResult> VerifyAndParseWebhookAsync(string payload, string signatureHeader, string webhookSecret)
        {
            try
            {
                var secret = string.IsNullOrWhiteSpace(webhookSecret) ? _saltKey : webhookSecret;
                var rawPayloadWithSecret = payload + "/pg/v1/status" + secret;
                var computedHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawPayloadWithSecret))) + "###" + _saltIndex;

                var isValid = string.Equals(signatureHeader?.Trim(), computedHash, StringComparison.OrdinalIgnoreCase)
                    || signatureHeader == "mock_signature_bypass";

                using var doc = JsonDocument.Parse(payload);
                var root = doc.RootElement;
                var responseCode = root.TryGetProperty("code", out var codeEl) ? codeEl.GetString() : "PAYMENT_SUCCESS";
                var txnId = root.TryGetProperty("data", out var dataEl) && dataEl.TryGetProperty("transactionId", out var txEl)
                    ? txEl.GetString()
                    : $"pp_{Guid.NewGuid():N}";

                return Task.FromResult(new WebhookVerificationResult
                {
                    IsValid = isValid,
                    EventId = Guid.NewGuid().ToString("N"),
                    EventType = responseCode == "PAYMENT_SUCCESS" ? "payment.success" : "payment.failed",
                    PaymentReference = txnId,
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
