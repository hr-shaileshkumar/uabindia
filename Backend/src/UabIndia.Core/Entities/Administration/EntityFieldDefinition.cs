using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Defines a custom field schema for any entity type within a tenant.
    /// e.g., EntityName = "Employee", FieldName = "BloodGroup", FieldType = "text"
    /// </summary>
    public class EntityFieldDefinition : BaseEntity
    {
        /// <summary>Target entity name e.g. "Employee", "Customer", "Vendor"</summary>
        public string EntityName { get; set; } = string.Empty;

        /// <summary>Machine-readable field key e.g. "blood_group"</summary>
        public string FieldKey { get; set; } = string.Empty;

        /// <summary>Display label shown in UI</summary>
        public string FieldLabel { get; set; } = string.Empty;

        /// <summary>text | number | date | boolean | select | multiselect | textarea</summary>
        public string FieldType { get; set; } = "text";

        /// <summary>JSON array of options for select/multiselect fields e.g. ["A+","A-","B+"]</summary>
        public string? OptionsJson { get; set; }

        public bool IsRequired { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;

        /// <summary>Optional section/group label in the UI</summary>
        public string? Section { get; set; }

        public ICollection<EntityFieldValue> Values { get; set; } = new List<EntityFieldValue>();
    }

    /// <summary>
    /// Stores the actual value of a custom field for a specific record.
    /// </summary>
    public class EntityFieldValue : BaseEntity
    {
        public Guid FieldDefinitionId { get; set; }
        public EntityFieldDefinition FieldDefinition { get; set; } = null!;

        /// <summary>ID of the record this value belongs to (e.g. Employee.Id)</summary>
        public Guid RecordId { get; set; }

        /// <summary>Stored as string regardless of type; frontend/backend coerce as needed</summary>
        public string? Value { get; set; }
    }
}
