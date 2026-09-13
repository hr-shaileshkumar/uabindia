using System;

namespace UabIndia.Core.Entities
{
    public class BusinessIdSequence
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public string EntityName { get; set; } = string.Empty;
        public string? Prefix { get; set; }
        public int Padding { get; set; } = 6;
        public long CurrentValue { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
