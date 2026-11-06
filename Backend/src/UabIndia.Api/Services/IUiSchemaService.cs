using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UabIndia.Api.Models;

namespace UabIndia.Api.Services
{
    public interface IUiSchemaService
    {
        Task<NavigationSchemaDto> GetNavigationSchemaAsync(ISet<string> enabledModuleKeys);
        Task<RouteRulesDto> GetRouteRulesAsync();
        Task<DashboardSchemaDto> GetDashboardSchemaAsync(ISet<string> enabledModuleKeys);
        Task<PageSchemaDto?> GetPageSchemaAsync(string pageKey);
        Task<List<ModuleMetaDto>> GetRichEnabledModulesAsync(Guid tenantId);
        Task<UiShellConfigDto> GetShellConfigAsync(Guid tenantId);
        Task<bool> SaveShellConfigAsync(Guid tenantId, UiShellConfigDto config);
    }
}
