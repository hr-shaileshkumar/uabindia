namespace UabIndia.Application.Interfaces
{
    public interface ITenantAccessor
    {
        void SetTenantId(System.Guid tenantId);
        System.Guid GetTenantId();
        void SetTenantSchema(string? schema);
        string? GetTenantSchema();
        void SetDataVisibility(bool includeDeleted, bool includeAllTenants);
        bool IncludeDeleted();
        bool IncludeAllTenants();

        void SetOrgScope(
            System.Guid? companyId,
            System.Guid? projectId,
            string? financialYearKey,
            System.DateTime? financialYearStart,
            System.DateTime? financialYearEnd)
        {
        }

        System.Guid? GetCompanyId() => null;
        System.Guid? GetProjectId() => null;
        string? GetFinancialYearKey() => null;
        System.DateTime? GetFinancialYearStart() => null;
        System.DateTime? GetFinancialYearEnd() => null;

        /// <summary>Empty means no company filter. Safe for EF query filters (never throws on null).</summary>
        System.Guid GetCompanyIdOrEmpty() => GetCompanyId() ?? System.Guid.Empty;

        /// <summary>Empty means no project filter. Safe for EF query filters (never throws on null).</summary>
        System.Guid GetProjectIdOrEmpty() => GetProjectId() ?? System.Guid.Empty;

        /// <summary>MinValue means no financial-year start bound.</summary>
        System.DateTime GetFinancialYearStartOrMin() => GetFinancialYearStart() ?? System.DateTime.MinValue;

        /// <summary>MaxValue means no financial-year end bound.</summary>
        System.DateTime GetFinancialYearEndOrMax() => GetFinancialYearEnd() ?? System.DateTime.MaxValue;
    }
}
