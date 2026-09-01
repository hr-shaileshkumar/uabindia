using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services
{
    public class TenantAccessor : ITenantAccessor
    {
        private System.Guid _tenantId = System.Guid.Empty;
        private string? _tenantSchema;
        private bool _includeDeleted;
        private bool _includeAllTenants;
        private System.Guid? _companyId;
        private System.Guid? _projectId;
        private string? _financialYearKey;
        private System.DateTime? _financialYearStart;
        private System.DateTime? _financialYearEnd;

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

        public void SetOrgScope(
            System.Guid? companyId,
            System.Guid? projectId,
            string? financialYearKey,
            System.DateTime? financialYearStart,
            System.DateTime? financialYearEnd)
        {
            _companyId = companyId;
            _projectId = projectId;
            _financialYearKey = financialYearKey;
            _financialYearStart = financialYearStart;
            _financialYearEnd = financialYearEnd;
        }

        public System.Guid? GetCompanyId() => _companyId;

        public System.Guid? GetProjectId() => _projectId;

        public string? GetFinancialYearKey() => _financialYearKey;

        public System.DateTime? GetFinancialYearStart() => _financialYearStart;

        public System.DateTime? GetFinancialYearEnd() => _financialYearEnd;

        public System.Guid GetCompanyIdOrEmpty() => _companyId ?? System.Guid.Empty;

        public System.Guid GetProjectIdOrEmpty() => _projectId ?? System.Guid.Empty;

        public System.DateTime GetFinancialYearStartOrMin() => _financialYearStart ?? System.DateTime.MinValue;

        public System.DateTime GetFinancialYearEndOrMax() => _financialYearEnd ?? System.DateTime.MaxValue;
    }
}
