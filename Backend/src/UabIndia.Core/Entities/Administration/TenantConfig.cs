using System;

namespace UabIndia.Core.Entities
{
    public class TenantConfig : BaseEntity
    {
        public string ConfigJson { get; set; } = "{}";
        public string UiSchemaJson { get; set; } = "{}";
        public string WorkflowJson { get; set; } = "{}";
        public string BrandingJson { get; set; } = "{}";
        public string? CustomDomain { get; set; }
        public string? Notes { get; set; }
    }
}
