using System;

namespace UabIndia.Core.Entities
{
    public class Module
    {
        public string ModuleKey { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ModuleType { get; set; } = "business"; // business, platform, licensing, security
        public string? Icon { get; set; }
        public string? BasePath { get; set; }
        public bool IsEnabled { get; set; } = true;
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }
        public string Version { get; set; } = "0001";
        public string? LicensedTo { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
