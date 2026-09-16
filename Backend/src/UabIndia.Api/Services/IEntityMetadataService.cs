using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Api.Services
{
    public class EntitySummaryDto
    {
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Table { get; set; } = string.Empty;
        public string ApiEndpoint { get; set; } = string.Empty;
        public string Icon { get; set; } = "Layers";
        public string KeyField { get; set; } = "id";
    }

    public class EntityFieldMetaDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Type { get; set; } = "text"; // text | number | currency | date | datetime | boolean | select | lookup | status | badge
        public bool IsRequired { get; set; }
        public bool IsReadOnly { get; set; }
        public bool IsCustom { get; set; }
        public string Section { get; set; } = "General";
        public int SortOrder { get; set; }
        public string? Placeholder { get; set; }
        public string? DefaultValue { get; set; }
        public int? MaxLength { get; set; }
        public string? DependsOn { get; set; }
        public string? FilterParam { get; set; }
        public string? ValidationPattern { get; set; }
        public string? ValidationMessage { get; set; }
        public List<SelectOptionDto>? Options { get; set; }
        public string? LookupEndpoint { get; set; }
        public string? LookupValueKey { get; set; } = "id";
        public string? LookupLabelKey { get; set; } = "name";
    }

    public class SelectOptionDto
    {
        public string Value { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
    }

    public interface IEntityMetadataService
    {
        /// <summary>
        /// Gets all business entities that can be modeled into dynamic ERP pages.
        /// </summary>
        Task<List<EntitySummaryDto>> GetDiscoverableEntitiesAsync(CancellationToken ct = default);

        /// <summary>
        /// Discovers all available fields (core schema + tenant custom fields) for a specified entity.
        /// </summary>
        Task<List<EntityFieldMetaDto>> GetEntityFieldsAsync(string entityName, CancellationToken ct = default);

        /// <summary>
        /// Discovers all available fields for an entity scoped optionally by company and project.
        /// </summary>
        Task<List<EntityFieldMetaDto>> GetEntityFieldsAsync(string entityName, Guid? companyId, Guid? projectId, CancellationToken ct = default);

        /// <summary>
        /// Synthesizes a complete turnkey DynamicPageSchema directly from the Database / EF Core Model Metadata.
        /// Zero frontend hardcoding needed.
        /// </summary>
        Task<string> SynthesizePageSchemaJsonAsync(string entityName, string pageKey, Guid? companyId = null, Guid? projectId = null, CancellationToken ct = default);
    }
}
