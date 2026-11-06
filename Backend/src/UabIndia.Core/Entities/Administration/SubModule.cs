using System;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Represents an architectural SubModule grouping pages within an enterprise Module.
    /// Example: ModuleKey = "hrms", SubModuleKey = "hrms.attendance" (Attendance & Shifts)
    /// </summary>
    public class SubModule : BaseEntity
    {
        public string SubModuleKey { get; set; } = string.Empty;
        public string ModuleKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public string? Description { get; set; }
        public string? Icon { get; set; } = "layers";
        public string? BasePath { get; set; }
        public int SortOrder { get; set; } = 100;
        public bool IsEnabled { get; set; } = true;
    }
}

