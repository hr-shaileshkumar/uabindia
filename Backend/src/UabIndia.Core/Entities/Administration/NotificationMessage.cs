using System;

namespace UabIndia.Core.Entities
{
    public class NotificationMessage : BaseEntity
    {
        public Guid RecipientUserId { get; set; }
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string Channel { get; set; } = "InApp"; // InApp, Email, SMS
        public string Type { get; set; } = "General"; // Leave, Payroll, Operations
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Sent, Failed
        public bool IsRead { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime? ReadAt { get; set; }
        public string? MetadataJson { get; set; }
    }
}
