using System;

namespace UabIndia.Core.Entities
{
    public class AuditLog : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string? EntityName { get; set; }
        public Guid? EntityId { get; set; }
        public string? Action { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public Guid? PerformedBy { get; set; }
        public string? Ip { get; set; }
        public DateTime PerformedAt { get; set; } = DateTime.UtcNow;
        public string? PrevHash { get; set; }
        public string? Hash { get; set; }
    }
}
