using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Represents a dynamic, metadata-driven UI page registered in the platform.
    /// Manages page identity, entity association, navigation placement, and version history.
    /// </summary>
    public class UiPageDefinition : BaseEntity
    {
        /// <summary>Unique canonical page key, e.g. "hrms.employees" or "sales.customers"</summary>
        public string PageKey { get; set; } = string.Empty;

        /// <summary>Target underlying entity e.g. "Employee", "Department", "SalesOrder"</summary>
        public string EntityName { get; set; } = string.Empty;

        /// <summary>Display title of the page</summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>Subtitle or help text shown in header</summary>
        public string? SubTitle { get; set; }

        /// <summary>Module grouping e.g. "hrms", "finance", "administration"</summary>
        public string ModuleKey { get; set; } = string.Empty;

        /// <summary>Default view type: "table" | "cards" | "split" | "kanban"</summary>
        public string ViewType { get; set; } = "table";

        /// <summary>Frontend route path e.g. "/hrms/employees"</summary>
        public string RoutePath { get; set; } = string.Empty;

        /// <summary>Lucide icon key e.g. "Users", "Briefcase", "Building2"</summary>
        public string Icon { get; set; } = "Layers";

        /// <summary>Lifecycle status: "Draft" | "Published" | "Archived"</summary>
        public string Status { get; set; } = "Draft";

        /// <summary>Version number currently published and served live</summary>
        public int? PublishedVersion { get; set; }

        /// <summary>Active working draft version number, if any</summary>
        public int? DraftVersion { get; set; }

        /// <summary>Whether this page automatically mounts into dynamic navigation menu</summary>
        public bool AddToNavigation { get; set; } = true;

        /// <summary>Menu group label e.g. "Core HR", "Talent Acquisition", "Settings"</summary>
        public string? NavGroup { get; set; }

        /// <summary>Sort order in navigation menu</summary>
        public int NavSortOrder { get; set; } = 0;

        /// <summary>Primary permission required to view this page</summary>
        public string? RequiredPermission { get; set; }

        /// <summary>Optional Company scope. When set, this schema overrides tenant default for this company.</summary>
        public Guid? CompanyId { get; set; }

        /// <summary>Optional Project scope. When set, this schema overrides for this project.</summary>
        public Guid? ProjectId { get; set; }

        /// <summary>History of schemas and configurations created for this page</summary>
        public ICollection<UiPageVersion> Versions { get; set; } = new List<UiPageVersion>();
    }

    /// <summary>
    /// Represents an immutable version snapshot of a page schema.
    /// Contains the complete layout, columns, filters, form fields, actions, and validation.
    /// </summary>
    public class UiPageVersion : BaseEntity
    {
        public Guid PageDefinitionId { get; set; }
        public UiPageDefinition PageDefinition { get; set; } = null!;

        /// <summary>Sequential version number: 1, 2, 3...</summary>
        public int Version { get; set; } = 1;

        /// <summary>
        /// Complete JSON serialization of the page schema:
        /// table columns, form sections & fields, filters, actions, KPI metrics, and permissions.
        /// </summary>
        public string SchemaJson { get; set; } = "{}";

        /// <summary>Change summary note explaining what was configured in this version</summary>
        public string? ChangeSummary { get; set; }

        /// <summary>Whether this version is the currently published live version</summary>
        public bool IsPublished { get; set; } = false;

        public DateTime? PublishedAt { get; set; }
        public Guid? PublishedBy { get; set; }
    }
}
