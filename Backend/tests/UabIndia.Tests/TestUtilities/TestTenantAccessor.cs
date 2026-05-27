using System;
using UabIndia.Application.Interfaces;

namespace UabIndia.Tests.TestUtilities
{
    public class TestTenantAccessor : ITenantAccessor
    {
        private Guid _tenantId = Guid.NewGuid();
        private string? _schema = "tenant_test";
        private bool _includeDeleted;
        private bool _includeAllTenants;

        public Guid GetTenantId() => _tenantId;

        public string? GetTenantSchema() => _schema;

        public void SetTenantId(Guid id) => _tenantId = id;

        public void SetTenantSchema(string? schema) => _schema = schema;

        public void SetDataVisibility(bool includeDeleted, bool includeAllTenants)
        {
            _includeDeleted = includeDeleted;
            _includeAllTenants = includeAllTenants;
        }

        public bool IncludeDeleted() => _includeDeleted;

        public bool IncludeAllTenants() => _includeAllTenants;
    }
}
