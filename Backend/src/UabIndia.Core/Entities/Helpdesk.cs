using System;

namespace UabIndia.Core.Entities
{
    public class HelpdeskTicket : BaseEntity
    {
        public string TicketNumber { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = "General";
        public string Priority { get; set; } = "Low";
        public string Status { get; set; } = "Open";
        public Guid RequesterUserId { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public DateTime? SlaDueAt { get; set; }
        public DateTime? FirstResponseAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }

    public class HelpdeskEscalation : BaseEntity
    {
        public Guid HelpdeskTicketId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public Guid? EscalatedToUserId { get; set; }
        public DateTime EscalatedAt { get; set; } = DateTime.UtcNow;
        public bool SlaBreached { get; set; }
        public string Status { get; set; } = "Open";
    }

    public class HelpdeskFaqArticle : BaseEntity
    {
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
        public string Category { get; set; } = "General";
        public string Status { get; set; } = "Draft";
        public int Views { get; set; }
        public int HelpfulCount { get; set; }
        public int DisplayOrder { get; set; }
    }
}
