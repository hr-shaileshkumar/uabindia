using System;

namespace UabIndia.Core.Entities
{
    public class TenantWebhook : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string TargetUrl { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public string EventsJson { get; set; } = "[\"*\"]"; // e.g. ["invoice.created", "payment.received", "order.completed"]
        public bool IsActive { get; set; } = true;
        public DateTime? LastTriggeredAt { get; set; }
        public int FailureCount { get; set; } = 0;
        public string? LastError { get; set; }
    }

    public class WebhookDeliveryLog : BaseEntity
    {
        public Guid WebhookId { get; set; }
        public string EventType { get; set; } = string.Empty;
        public string TargetUrl { get; set; } = string.Empty;
        public string PayloadJson { get; set; } = "{}";
        public int ResponseStatusCode { get; set; }
        public string? ResponseBody { get; set; }
        public string Status { get; set; } = "Success"; // Success, Failed, Retrying
        public long DurationMs { get; set; }
        public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;
    }
}
