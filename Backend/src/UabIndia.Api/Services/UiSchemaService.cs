using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Services
{
    /// <summary>
    /// Parses TenantConfig.UiSchemaJson / WorkflowJson, merges with Module
    /// entity metadata, and filters output by enabled modules.
    /// All methods are read-only and tenant-scoped.
    /// </summary>
    public class UiSchemaService : IUiSchemaService
    {
        private static readonly JsonSerializerOptions _jsonOpts = new()
        {
            PropertyNameCaseInsensitive = true,
        };

        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ILogger<UiSchemaService> _logger;

        public UiSchemaService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ILogger<UiSchemaService> logger)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _logger = logger;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Navigation schema
        // ─────────────────────────────────────────────────────────────────────

        public async Task<NavigationSchemaDto> GetNavigationSchemaAsync(ISet<string> enabledModuleKeys)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            // Fetch enabled module entities (rich metadata)
            var modules = await _db.Modules
                .AsNoTracking()
                .Where(m => m.IsEnabled && enabledModuleKeys.Contains(m.ModuleKey))
                .OrderBy(m => m.SortOrder)
                .ThenBy(m => m.ModuleKey)
                .ToListAsync();

            // Try to load tenant-specific nav overrides from UiSchemaJson
            var tenantNavGroups = await TryGetTenantNavGroupsAsync(tenantId);

            var navModules = new List<NavModuleDto>();

            foreach (var module in modules)
            {
                // Use tenant override groups if present, otherwise produce empty groups.
                // The frontend fallback will fill in the hardcoded sidebar items.
                var groups = tenantNavGroups.TryGetValue(module.ModuleKey, out var g) ? g : new List<NavGroupDto>();

                navModules.Add(new NavModuleDto
                {
                    Key = module.ModuleKey,
                    DisplayName = string.IsNullOrWhiteSpace(module.DisplayName) ? module.Name : module.DisplayName,
                    Icon = module.Icon,
                    HomeHref = module.BasePath,
                    SortOrder = module.SortOrder,
                    Groups = groups,
                });
            }

            return new NavigationSchemaDto
            {
                SchemaVersion = "1",
                Modules = navModules,
            };
        }

        // ─────────────────────────────────────────────────────────────────────
        // Route rules schema
        // ─────────────────────────────────────────────────────────────────────

        public async Task<RouteRulesDto> GetRouteRulesAsync()
        {
            var tenantId = _tenantAccessor.GetTenantId();

            // Try to load tenant-specific route rules from UiSchemaJson
            var rules = await TryGetTenantRouteRulesAsync(tenantId);

            return new RouteRulesDto
            {
                SchemaVersion = "1",
                Rules = rules,
            };
        }

        // ─────────────────────────────────────────────────────────────────────
        // Dashboard schema
        // ─────────────────────────────────────────────────────────────────────

        public async Task<DashboardSchemaDto> GetDashboardSchemaAsync(ISet<string> enabledModuleKeys)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            // Try to load tenant-specific dashboard from UiSchemaJson
            var schema = await TryGetTenantDashboardSchemaAsync(tenantId);
            if (schema != null)
            {
                // Filter widgets to those whose module is enabled
                foreach (var section in schema.Sections)
                {
                    section.Widgets = section.Widgets
                        .Where(w => string.IsNullOrEmpty(w.ModuleKey) || enabledModuleKeys.Contains(w.ModuleKey))
                        .ToList();
                }
                return schema;
            }

            // Return empty schema; frontend will use fallback hardcoded dashboard
            return new DashboardSchemaDto { SchemaVersion = "1", Sections = new List<DashboardSectionDto>() };
        }

        // ─────────────────────────────────────────────────────────────────────
        // Page schema
        // ─────────────────────────────────────────────────────────────────────

        public async Task<PageSchemaDto?> GetPageSchemaAsync(string pageKey)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            return await TryGetTenantPageSchemaAsync(tenantId, pageKey);
        }

        // ─────────────────────────────────────────────────────────────────────
        // Enabled modules (rich metadata)
        // ─────────────────────────────────────────────────────────────────────

        public async Task<List<ModuleMetaDto>> GetRichEnabledModulesAsync(Guid tenantId)
        {
            var result = await _db.TenantModules
                .AsNoTracking()
                .Where(tm => tm.TenantId == tenantId && tm.IsEnabled && !tm.IsDeleted)
                .Join(_db.Modules.AsNoTracking().Where(m => m.IsEnabled),
                    tm => tm.ModuleKey,
                    m => m.ModuleKey,
                    (tm, m) => new ModuleMetaDto
                    {
                        Key = m.ModuleKey,
                        Name = m.Name,
                        DisplayName = string.IsNullOrWhiteSpace(m.DisplayName) ? m.Name : m.DisplayName,
                        Description = m.Description,
                        Icon = m.Icon,
                        BasePath = m.BasePath,
                        SortOrder = m.SortOrder,
                        Version = m.Version,
                    })
                .OrderBy(m => m.SortOrder)
                .ThenBy(m => m.Key)
                .ToListAsync();

            return result;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Private helpers: parse UiSchemaJson safely
        // ─────────────────────────────────────────────────────────────────────

        private async Task<Dictionary<string, List<NavGroupDto>>> TryGetTenantNavGroupsAsync(Guid tenantId)
        {
            try
            {
                var config = await _db.TenantConfigs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted);

                if (config == null || string.IsNullOrWhiteSpace(config.UiSchemaJson) || config.UiSchemaJson == "{}")
                    return new Dictionary<string, List<NavGroupDto>>();

                using var doc = JsonDocument.Parse(config.UiSchemaJson);
                if (!doc.RootElement.TryGetProperty("navigation", out var nav))
                    return new Dictionary<string, List<NavGroupDto>>();

                if (!nav.TryGetProperty("modules", out var modulesEl))
                    return new Dictionary<string, List<NavGroupDto>>();

                var result = new Dictionary<string, List<NavGroupDto>>(StringComparer.OrdinalIgnoreCase);

                foreach (var moduleEl in modulesEl.EnumerateArray())
                {
                    if (!moduleEl.TryGetProperty("key", out var keyEl)) continue;
                    var key = keyEl.GetString() ?? "";
                    if (string.IsNullOrEmpty(key)) continue;

                    var groups = new List<NavGroupDto>();

                    if (moduleEl.TryGetProperty("groups", out var groupsEl))
                    {
                        int gSort = 0;
                        foreach (var groupEl in groupsEl.EnumerateArray())
                        {
                            var label = groupEl.TryGetProperty("label", out var lEl) ? (lEl.GetString() ?? "") : "";
                            var items = new List<NavItemDto>();

                            if (groupEl.TryGetProperty("items", out var itemsEl))
                            {
                                int iSort = 0;
                                foreach (var itemEl in itemsEl.EnumerateArray())
                                {
                                    items.Add(new NavItemDto
                                    {
                                        Key = itemEl.TryGetProperty("key", out var kEl) ? (kEl.GetString() ?? "") : "",
                                        Name = itemEl.TryGetProperty("name", out var nEl) ? (nEl.GetString() ?? "") : "",
                                        Path = itemEl.TryGetProperty("path", out var pEl) ? (pEl.GetString() ?? "") : "",
                                        Icon = itemEl.TryGetProperty("icon", out var iEl) ? iEl.GetString() : null,
                                        SortOrder = iSort++,
                                        RequiredPermissions = itemEl.TryGetProperty("requiredPermissions", out var rpEl)
                                            ? rpEl.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => !string.IsNullOrEmpty(x)).ToList()
                                            : new List<string>(),
                                    });
                                }
                            }

                            groups.Add(new NavGroupDto { Label = label, SortOrder = gSort++, Items = items });
                        }
                    }

                    result[key] = groups;
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse tenant navigation schema for tenant {TenantId}", tenantId);
                return new Dictionary<string, List<NavGroupDto>>();
            }
        }

        private async Task<List<RoutePermissionRuleDto>> TryGetTenantRouteRulesAsync(Guid tenantId)
        {
            try
            {
                var config = await _db.TenantConfigs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted);

                if (config == null || string.IsNullOrWhiteSpace(config.UiSchemaJson) || config.UiSchemaJson == "{}")
                    return new List<RoutePermissionRuleDto>();

                using var doc = JsonDocument.Parse(config.UiSchemaJson);
                if (!doc.RootElement.TryGetProperty("routeRules", out var rulesEl))
                    return new List<RoutePermissionRuleDto>();

                var rules = new List<RoutePermissionRuleDto>();
                foreach (var ruleEl in rulesEl.EnumerateArray())
                {
                    rules.Add(new RoutePermissionRuleDto
                    {
                        PathPattern = ruleEl.TryGetProperty("pathPattern", out var ppEl) ? (ppEl.GetString() ?? "") : "",
                        ModuleKey = ruleEl.TryGetProperty("moduleKey", out var mkEl) ? (mkEl.GetString() ?? "") : "",
                        PermissionKeys = ruleEl.TryGetProperty("permissionKeys", out var pkEl)
                            ? pkEl.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => !string.IsNullOrEmpty(x)).ToList()
                            : new List<string>(),
                    });
                }
                return rules;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse tenant route rules for tenant {TenantId}", tenantId);
                return new List<RoutePermissionRuleDto>();
            }
        }

        private async Task<DashboardSchemaDto?> TryGetTenantDashboardSchemaAsync(Guid tenantId)
        {
            try
            {
                var config = await _db.TenantConfigs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted);

                if (config == null || string.IsNullOrWhiteSpace(config.UiSchemaJson) || config.UiSchemaJson == "{}")
                    return null;

                using var doc = JsonDocument.Parse(config.UiSchemaJson);
                if (!doc.RootElement.TryGetProperty("dashboard", out var dashEl))
                    return null;

                return JsonSerializer.Deserialize<DashboardSchemaDto>(dashEl.GetRawText(), _jsonOpts);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse tenant dashboard schema for tenant {TenantId}", tenantId);
                return null;
            }
        }

        private async Task<PageSchemaDto?> TryGetTenantPageSchemaAsync(Guid tenantId, string pageKey)
        {
            try
            {
                var config = await _db.TenantConfigs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted);

                if (config == null || string.IsNullOrWhiteSpace(config.UiSchemaJson) || config.UiSchemaJson == "{}")
                    return null;

                using var doc = JsonDocument.Parse(config.UiSchemaJson);
                if (!doc.RootElement.TryGetProperty("pages", out var pagesEl))
                    return null;

                if (!pagesEl.TryGetProperty(pageKey, out var pageEl))
                    return null;

                return JsonSerializer.Deserialize<PageSchemaDto>(pageEl.GetRawText(), _jsonOpts);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse page schema '{PageKey}' for tenant {TenantId}", pageKey, tenantId);
                return null;
            }
        }
    }
}
