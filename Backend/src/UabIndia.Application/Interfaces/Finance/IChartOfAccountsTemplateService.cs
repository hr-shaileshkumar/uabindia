using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class CoaTemplateSummary
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string DefaultCurrency { get; set; } = string.Empty;
        public int TotalAccountsCount { get; set; }
    }

    public interface IChartOfAccountsTemplateService
    {
        IReadOnlyList<CoaTemplateSummary> GetAvailableTemplates();
        Task<int> SeedStandardChartOfAccountsAsync(Guid tenantId, Guid? companyId, string standardType, string? defaultCurrency = null, CancellationToken ct = default);
    }
}
