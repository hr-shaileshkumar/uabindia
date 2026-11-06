using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class FeatureFlagDto
    {
        public Guid Id { get; set; }
        public string FeatureKey { get; set; } = string.Empty;
        public bool IsEnabled { get; set; }
    }

    public class UpdateFeatureFlagDto
    {
        [Required]
        public string FeatureKey { get; set; } = string.Empty;
        public bool IsEnabled { get; set; }
    }

    public class TenantConfigDto
    {
        public string ConfigJson { get; set; } = "{}";
        public string UiSchemaJson { get; set; } = "{}";
        public string WorkflowJson { get; set; } = "{}";
        public string BrandingJson { get; set; } = "{}";
        public string? Notes { get; set; }
    }

    public class UpdateTenantConfigDto
    {
        public string ConfigJson { get; set; } = "{}";
        public string UiSchemaJson { get; set; } = "{}";
        public string WorkflowJson { get; set; } = "{}";
        public string BrandingJson { get; set; } = "{}";
        public string? Notes { get; set; }
    }
}
