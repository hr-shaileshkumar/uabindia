using System;

namespace UabIndia.Core.Entities
{
    public enum DataScopeLevel
    {
        Tenant = 1,
        Company = 2,
        Project = 3,
        Region = 4,
        State = 5,
        District = 6,
        Department = 7,
        ReportingHierarchy = 8,
        Self = 9
    }

    public class DataScope : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DataScopeLevel Level { get; set; } = DataScopeLevel.Tenant;
        public string? FilterExpression { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class RoleDataScope : BaseEntity
    {
        public Guid RoleId { get; set; }
        public Role? Role { get; set; }

        public Guid DataScopeId { get; set; }
        public DataScope? DataScope { get; set; }

        /// <summary>Optional module key constraint (e.g. "hrms", "finance")</summary>
        public string? ModuleKey { get; set; }

        /// <summary>Optional entity name constraint (e.g. "Employee", "SalesOrder")</summary>
        public string? EntityName { get; set; }

        /// <summary>Action to which this data scope applies: "View", "Edit", "Delete", "Export", "All"</summary>
        public string Action { get; set; } = "All";
    }
}
