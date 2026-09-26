using System;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Represents a persisted Saved View for an ERP page / data grid.
    /// Supports Personal (User-scoped), Role-scoped, and Tenant-wide defaults.
    /// </summary>
    public class UiViewDefinition : BaseEntity
    {
        /// <summary>Canonical page key e.g. "hrms.employees", "sales.orders"</summary>
        public string PageKey { get; set; } = string.Empty;

        /// <summary>User-friendly name of the saved view</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>View scope: "Personal" | "Role" | "Tenant"</summary>
        public string Scope { get; set; } = "Personal";

        /// <summary>Optional target role when Scope == "Role" (e.g. "HR Manager", "Payroll Admin")</summary>
        public string? TargetRole { get; set; }

        /// <summary>User ID who owns this view when Scope == "Personal"</summary>
        public Guid? UserId { get; set; }

        /// <summary>JSON serialized filter criteria</summary>
        public string FiltersJson { get; set; } = "{}";

        /// <summary>JSON serialized column settings (visibility, order, width, pinned)</summary>
        public string ColumnsJson { get; set; } = "[]";

        /// <summary>Default column sort key</summary>
        public string? SortKey { get; set; }

        /// <summary>Sort direction: "asc" | "desc"</summary>
        public string SortDir { get; set; } = "asc";

        /// <summary>Optional grouping column key</summary>
        public string? GroupBy { get; set; }

        /// <summary>Display density: "compact" | "normal" | "comfortable"</summary>
        public string Density { get; set; } = "normal";

        /// <summary>Whether this view is the default view within its scope</summary>
        public bool IsDefault { get; set; } = false;
    }
}
