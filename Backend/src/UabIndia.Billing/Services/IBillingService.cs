using System.Threading.Tasks;
using UabIndia.Billing.Dtos;

namespace UabIndia.Billing.Services;

/// <summary>
/// Service contract for billing operations.
/// </summary>
public interface IBillingService
{
    Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto request);
    Task<SubscriptionDto> CreateSubscriptionAsync(CreateSubscriptionDto request);
}
