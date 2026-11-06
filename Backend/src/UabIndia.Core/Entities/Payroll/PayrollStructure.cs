using System;

namespace UabIndia.Core.Entities
{
    public class PayrollStructure : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsDefault { get; set; } = false;
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
    }
}
