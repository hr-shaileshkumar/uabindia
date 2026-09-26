using System;

namespace UabIndia.Core.Entities
{
    public class TenantModule : BaseEntity
    {
        public string ModuleKey { get; set; } = string.Empty;
        public string? CustomDisplayName { get; set; }
        public int? CustomSortOrder { get; set; }
        public string? CustomIcon { get; set; }
        public string? CustomSection { get; set; }
        public bool IsEnabled { get; set; } = true;
        public DateTime EnabledAt { get; set; } = DateTime.UtcNow;
        public DateTime? DisabledAt { get; set; }
    }
}
