using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class PaymentIntentRequest
    {
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public string? CustomerEmail { get; set; }
        public string? CustomerName { get; set; }
        public Guid? InvoiceId { get; set; }
        public string? InvoiceNumber { get; set; }
        public string? Description { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
    }

    public class PaymentIntentResult
    {
        public bool Success { get; set; }
        public string Provider { get; set; } = string.Empty;
        public string PaymentIntentId { get; set; } = string.Empty;
        public string? ClientSecret { get; set; }
        public string? RedirectUrl { get; set; }
        public string Status { get; set; } = "Pending";
        public string? ErrorMessage { get; set; }
    }

    public class PaymentCaptureResult
    {
        public bool Success { get; set; }
        public string Provider { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public decimal AmountCaptured { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string Status { get; set; } = "Captured";
        public string? ErrorMessage { get; set; }
    }

    public class PaymentRefundResult
    {
        public bool Success { get; set; }
        public string Provider { get; set; } = string.Empty;
        public string RefundId { get; set; } = string.Empty;
        public decimal AmountRefunded { get; set; }
        public string Status { get; set; } = "Refunded";
        public string? ErrorMessage { get; set; }
    }

    public class WebhookVerificationResult
    {
        public bool IsValid { get; set; }
        public string EventId { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string? PaymentReference { get; set; }
        public decimal? Amount { get; set; }
        public string? Currency { get; set; }
        public string? RawPayload { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public interface IPaymentGatewayProvider
    {
        string ProviderName { get; }
        bool SupportsCurrency(string currencyCode);
        Task<PaymentIntentResult> CreatePaymentIntentAsync(PaymentIntentRequest request, CancellationToken ct = default);
        Task<PaymentCaptureResult> CapturePaymentAsync(string paymentReference, decimal amount, string currency, CancellationToken ct = default);
        Task<PaymentRefundResult> RefundPaymentAsync(string paymentReference, decimal amount, string reason, CancellationToken ct = default);
        Task<WebhookVerificationResult> VerifyAndParseWebhookAsync(string payload, string signatureHeader, string webhookSecret);
    }

    public interface IPaymentGatewayFactory
    {
        IPaymentGatewayProvider GetProvider(string providerName, Guid? tenantId = null);
        IPaymentGatewayProvider GetProviderForCurrency(string currencyCode, Guid? tenantId = null);
        IReadOnlyList<string> GetSupportedProviders();
    }
}
