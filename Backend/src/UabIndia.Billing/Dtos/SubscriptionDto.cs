using System;

namespace UabIndia.Billing.Dtos;

/// <summary>
/// Data transfer object representing a subscription.
/// </summary>
public class SubscriptionDto
{
    public Guid Id { get; set; }
    public string CustomerId { get; set; } = default!;
    public string PlanId { get; set; } = default!;
    public string Status { get; set; } = default!;
    public DateTime StartedAt { get; set; }
    public DateTime? EndsAt { get; set; }
}
