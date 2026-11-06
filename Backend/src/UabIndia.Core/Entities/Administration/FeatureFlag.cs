using System;

namespace UabIndia.Core.Entities
{
    public class FeatureFlag : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string FeatureKey { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsEnabled { get; set; }
    }
}
