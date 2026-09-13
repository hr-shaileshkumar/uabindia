using System;

namespace UabIndia.Core.Entities
{
    public class TenantModule : BaseEntity
    {
        public string ModuleKey { get; set; } = string.Empty;
        public bool IsEnabled { get; set; } = true;
        public DateTime EnabledAt { get; set; } = DateTime.UtcNow;
        public DateTime? DisabledAt { get; set; }
    }
}
