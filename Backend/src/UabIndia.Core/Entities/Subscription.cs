using System;

namespace UabIndia.Core.Entities
{
    public class SubscriptionPlan : BaseEntity
    {
        public string PlanCode { get; set; } = string.Empty; // trial, starter, growth, enterprise
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal MonthlyPriceInr { get; set; }
        public decimal AnnualPriceInr { get; set; }
        public int MaxUsers { get; set; } = 5;
        public int MaxStorageMb { get; set; } = 5120; // 5 GB
        public int MaxApiCallsPerDay { get; set; } = 10000;
        public string AllowedModulesJson { get; set; } = "[]"; // JSON array of module keys
        public bool IsCustomPricing { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
    }

    public class TenantSubscription : BaseEntity
    {
        public Guid? PlanId { get; set; }
        public string PlanCode { get; set; } = "trial";
        public string Status { get; set; } = "Active"; // Active, PastDue, Cancelled, Expired, Trialing
        public string BillingCycle { get; set; } = "Monthly"; // Monthly, Annual
        public decimal Amount { get; set; } = 0;
        public string Currency { get; set; } = "INR";
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime? EndDate { get; set; }
        public DateTime? TrialEndsAt { get; set; }
        public DateTime? NextBillingDate { get; set; }
        public string? GatewayProvider { get; set; } // Razorpay, Stripe, Manual
        public string? GatewaySubscriptionId { get; set; }
        public string? GatewayCustomerId { get; set; }
        public string? LastPaymentStatus { get; set; }
        public DateTime? LastPaymentDate { get; set; }
        public bool AutoRenew { get; set; } = true;
    }
}
