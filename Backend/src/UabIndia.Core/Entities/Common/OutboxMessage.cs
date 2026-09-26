using System;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Outbox pattern entity for transactional event publishing across ERP modules.
    /// </summary>
    public class OutboxMessage : BaseEntity
    {
        public string EventType { get; set; } = string.Empty;
        public string PayloadJson { get; set; } = string.Empty;
        public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAtUtc { get; set; }
        public string? Error { get; set; }
        public int RetryCount { get; set; } = 0;
        public DateTime? NextRetryUtc { get; set; }
        public bool IsProcessed { get; set; } = false;
    }
}
