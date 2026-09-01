using System;
using System.Threading.Tasks;
using UabIndia.Billing.Dtos;

namespace UabIndia.Billing.Services;

/// <summary>
/// Placeholder implementation that simulates a Stripe‑like billing provider.
/// Real integration can be added later without changing the contract.
/// </summary>
public class BillingService : IBillingService
{
    public Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto request)
    {
        var invoice = new InvoiceDto
        {
            Id = Guid.NewGuid(),
            CustomerId = request.CustomerId,
            AmountCents = request.AmountCents,
            Currency = request.Currency ?? "USD",
            CreatedAt = DateTime.UtcNow,
            Status = "draft"
        };
        return Task.FromResult(invoice);
    }

    public Task<SubscriptionDto> CreateSubscriptionAsync(CreateSubscriptionDto request)
    {
        var subscription = new SubscriptionDto
        {
            Id = Guid.NewGuid(),
            CustomerId = request.CustomerId,
            PlanId = request.PlanId,
            Status = "active",
            StartedAt = DateTime.UtcNow,
            EndsAt = request.DurationMonths.HasValue
                ? DateTime.UtcNow.AddMonths(request.DurationMonths.Value)
                : (DateTime?)null
        };
        return Task.FromResult(subscription);
    }
}
