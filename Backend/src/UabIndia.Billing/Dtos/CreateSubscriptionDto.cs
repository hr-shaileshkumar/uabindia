namespace UabIndia.Billing.Dtos;

/// <summary>
/// Payload for creating a new subscription.
/// </summary>
public class CreateSubscriptionDto
{
    public string CustomerId { get; set; } = default!;
    public string PlanId { get; set; } = default!;
    public int? DurationMonths { get; set; } // optional; null means indefinite
}
