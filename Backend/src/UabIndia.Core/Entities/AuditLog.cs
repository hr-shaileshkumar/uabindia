using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Core.Entities
{
    public class AuditLog : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        [MaxLength(100)]
        public string? EntityName { get; set; }
        public Guid? EntityId { get; set; }
        [MaxLength(100)]
        public string? Action { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public Guid? PerformedBy { get; set; }
        [MaxLength(64)]
        public string? Ip { get; set; }
        public DateTime PerformedAt { get; set; } = DateTime.UtcNow;
        [MaxLength(128)]
        public string? PrevHash { get; set; }
        [MaxLength(128)]
        public string? Hash { get; set; }
    }
}
