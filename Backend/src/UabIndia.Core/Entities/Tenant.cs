using System;

namespace UabIndia.Core.Entities
{
    public class Tenant : BaseEntity
    {
        public string? Subdomain { get; set; }
        public string? Name { get; set; }
        public bool IsActive { get; set; } = true;
        public string ProvisionStatus { get; set; } = "Pending";
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }
        public string? FeatureFlags { get; set; }
    }
}
