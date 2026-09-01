using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class SubscriptionBillingResult
    {
        public int TotalSubscriptionsEvaluated { get; set; }
        public int InvoicesGeneratedCount { get; set; }
        public decimal TotalAmountBilled { get; set; }
        public List<GeneratedInvoiceSummary> GeneratedInvoices { get; set; } = new();
    }

    public class GeneratedInvoiceSummary
    {
        public Guid InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public Guid? CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public DateTime DueDate { get; set; }
    }

    public interface ISubscriptionBillingService
    {
        Task<SubscriptionBillingResult> ProcessRecurringBillingCycleAsync(
            Guid tenantId,
            DateTime asOfDate,
            CancellationToken ct = default);
    }
}
