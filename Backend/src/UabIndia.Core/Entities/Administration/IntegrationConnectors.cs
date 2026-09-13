using System;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Tenant-scoped third-party connector registry (GST / bank feed / biometric, etc.).
    /// </summary>
    public class IntegrationConnector : BaseEntity
    {
        public string ConnectorKey { get; set; } = string.Empty; // gst_portal, bank_feed, biometric_device
        public string Name { get; set; } = string.Empty;
        public string Provider { get; set; } = string.Empty;
        public string Category { get; set; } = "Integration"; // Tax, Finance, HR
        public string Status { get; set; } = "Inactive"; // Inactive, Configured, Connected, Error
        public string? ConfigJson { get; set; }
        public DateTime? LastTestedAt { get; set; }
        public DateTime? LastSyncAt { get; set; }
        public string? LastError { get; set; }
    }

    public class IntegrationApiKey : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Prefix { get; set; } = string.Empty;
        public string KeyHash { get; set; } = string.Empty;
        public string Scope { get; set; } = "read";
        public string Status { get; set; } = "Active";
        public DateTime? LastUsedAt { get; set; }
        public DateTime? RevokedAt { get; set; }
    }

    public class IntegrationSyncLog : BaseEntity
    {
        public Guid ConnectorId { get; set; }
        public string ConnectorKey { get; set; } = string.Empty;
        public string Direction { get; set; } = "Outbound"; // Inbound, Outbound
        public string Operation { get; set; } = "Sync"; // TestConnection, Sync, Import
        public string Status { get; set; } = "Success"; // Success, Failed, Partial
        public int RecordsProcessed { get; set; }
        public string? Message { get; set; }
        public string? DetailsJson { get; set; }
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
    }
}
