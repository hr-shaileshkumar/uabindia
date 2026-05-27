using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services
{
    public class TenantAccessor : ITenantAccessor
    {
        private System.Guid _tenantId = System.Guid.Empty;
        private string? _tenantSchema;
        private bool _includeDeleted;
        private bool _includeAllTenants;

        public void SetTenantId(System.Guid tenantId)
        {
            _tenantId = tenantId;
        }

        public System.Guid GetTenantId() => _tenantId;

        public void SetTenantSchema(string? schema)
        {
            _tenantSchema = schema;
        }

        public string? GetTenantSchema() => _tenantSchema;

        public void SetDataVisibility(bool includeDeleted, bool includeAllTenants)
        {
            _includeDeleted = includeDeleted;
            _includeAllTenants = includeAllTenants;
        }

        public bool IncludeDeleted() => _includeDeleted;

        public bool IncludeAllTenants() => _includeAllTenants;
    }
}
