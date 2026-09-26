using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    public enum WidgetType
    {
        Kpi = 1,
        Chart = 2,
        Table = 3,
        Bar = 4,
        Line = 5,
        Pie = 6,
        Area = 7,
        Gauge = 8,
        Progress = 9,
        Calendar = 10,
        Map = 11,
        Timeline = 12,
        Activity = 13,
        Task = 14,
        Approval = 15,
        Notification = 16,
        Heatmap = 17
    }

    /// <summary>
    /// Metadata-driven dashboard instance. Supports tenant-wide defaults,
    /// company-specific views, or personalized user dashboards.
    /// </summary>
    public class DashboardDefinition : BaseEntity
    {
        public string DashboardKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ModuleKey { get; set; } = "general"; // hrms, finance, sales, general
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? OwnerUserId { get; set; }
        public bool IsDefault { get; set; } = false;
        public bool IsShared { get; set; } = true;
        public string LayoutJson { get; set; } = "{}"; // grid settings, responsive breakpoints
        public ICollection<DashboardWidget> Widgets { get; set; } = new List<DashboardWidget>();
    }

    /// <summary>
    /// Catalog of reusable dashboard widgets available for placement.
    /// </summary>
    public class WidgetDefinition : BaseEntity
    {
        public string WidgetKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public WidgetType Type { get; set; } = WidgetType.Kpi;
        public string ModuleKey { get; set; } = "general";
        public string Icon { get; set; } = "Activity";
        public string? DataSourceEndpoint { get; set; }
        public string? QueryConfigJson { get; set; }
        public int DefaultWidth { get; set; } = 3;  // 1 to 12 columns
        public int DefaultHeight { get; set; } = 2; // rows
        public int RefreshIntervalSeconds { get; set; } = 0; // 0 = manual
        public string? RequiredPermission { get; set; }
        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// Association and layout positioning of a widget inside a specific dashboard.
    /// </summary>
    public class DashboardWidget : BaseEntity
    {
        public Guid DashboardDefinitionId { get; set; }
        public DashboardDefinition DashboardDefinition { get; set; } = null!;

        public Guid WidgetDefinitionId { get; set; }
        public WidgetDefinition WidgetDefinition { get; set; } = null!;

        public int GridX { get; set; } = 0;
        public int GridY { get; set; } = 0;
        public int GridWidth { get; set; } = 3;
        public int GridHeight { get; set; } = 2;
        public int SortOrder { get; set; } = 0;
        public string? CustomSettingsJson { get; set; } // custom titles, color accents, filters
        public bool IsVisible { get; set; } = true;
    }
}
