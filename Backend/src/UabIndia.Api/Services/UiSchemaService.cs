using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Services
{
    /// <summary>
    /// Parses TenantConfig.UiSchemaJson / WorkflowJson, merges with Module
    /// entity metadata, and filters output by enabled modules and the current
    /// authenticated user's backend permissions.
    /// </summary>
    public class UiSchemaService : IUiSchemaService
    {
        private static readonly JsonSerializerOptions _jsonOpts = new()
        {
            PropertyNameCaseInsensitive = true,
        };

        private readonly ApplicationDbContext _db;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ILogger<UiSchemaService> _logger;

        private sealed record PermissionSnapshot(bool IsSuperAdmin, HashSet<string> GrantedPermissions);

        public UiSchemaService(
            ApplicationDbContext db,
            IHttpContextAccessor httpContextAccessor,
            ITenantAccessor tenantAccessor,
            ILogger<UiSchemaService> logger)
        {
            _db = db;
            _httpContextAccessor = httpContextAccessor;
            _tenantAccessor = tenantAccessor;
            _logger = logger;
        }

        public async Task<NavigationSchemaDto> GetNavigationSchemaAsync(ISet<string> enabledModuleKeys)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var permissionSnapshot = await GetCurrentPermissionSnapshotAsync(tenantId);
            var modules = (await GetRichEnabledModulesAsync(tenantId))
                .Where(module => enabledModuleKeys.Contains(module.Key))
                .OrderBy(module => module.SortOrder)
                .ThenBy(module => module.Key, StringComparer.OrdinalIgnoreCase)
                .ToList();

            var tenantNavGroups = await TryGetTenantNavGroupsAsync(tenantId);
            var pageRolePolicies = await TryGetPageRolePoliciesAsync(tenantId);
            var navModules = new List<NavModuleDto>();

            foreach (var module in modules)
            {
                var groups = tenantNavGroups.TryGetValue(module.Key, out var tenantGroups) && tenantGroups.Count > 0
                    ? tenantGroups
                    : DefaultUiSchemaCatalog.GetNavigationGroups(module.Key);

                var filteredGroups = groups
                    .Select(group => new NavGroupDto
                    {
                        Label = group.Label,
                        SortOrder = group.SortOrder,
                        Items = group.Items
                            .Where(item => HasRequiredPermission(item.RequiredPermissions, permissionSnapshot))
                            .Select(item =>
                            {
                                var allowedRoles = pageRolePolicies.TryGetValue(item.Key, out var roles) && roles.Count > 0
                                    ? roles
                                    : item.AllowedRoles;

                                return new NavItemDto
                                {
                                    Key = item.Key,
                                    Name = item.Name,
                                    Path = item.Path,
                                    Icon = item.Icon,
                                    SortOrder = item.SortOrder,
                                    RequiredPermissions = item.RequiredPermissions,
                                    AllowedRoles = allowedRoles,
                                    AllowedCompanyIds = item.AllowedCompanyIds,
                                    AllowedProjectIds = item.AllowedProjectIds,
                                };
                            })
                            .ToList(),
                    })
                    .Where(group => group.Items.Count > 0)
                    .ToList();

                if (filteredGroups.Count == 0)
                {
                    continue;
                }

                navModules.Add(new NavModuleDto
                {
                    Key = module.Key,
                    DisplayName = string.IsNullOrWhiteSpace(module.DisplayName) ? module.Name : module.DisplayName,
                    Icon = module.Icon,
                    HomeHref = module.BasePath,
                    SortOrder = module.SortOrder,
                    Section = module.CustomSection,
                    Groups = filteredGroups,
                });
            }

            return new NavigationSchemaDto
            {
                SchemaVersion = "1",
                Modules = navModules,
            };
        }

        public async Task<RouteRulesDto> GetRouteRulesAsync()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var permissionSnapshot = await GetCurrentPermissionSnapshotAsync(tenantId);
            var enabledModuleKeys = new HashSet<string>(
                (await GetRichEnabledModulesAsync(tenantId)).Select(module => module.Key),
                StringComparer.OrdinalIgnoreCase);

            var rules = await TryGetTenantRouteRulesAsync(tenantId);
            if (rules.Count == 0)
            {
                rules = DefaultUiSchemaCatalog.GetRouteRules();
            }

            rules = rules
                .Where(rule => enabledModuleKeys.Contains(rule.ModuleKey))
                .Where(rule => HasRequiredPermission(rule.PermissionKeys, permissionSnapshot))
                .GroupBy(rule => rule.PathPattern, StringComparer.OrdinalIgnoreCase)
                .Select(group => group.First())
                .ToList();

            return new RouteRulesDto
            {
                SchemaVersion = "1",
                Rules = rules,
            };
        }

        public async Task<DashboardSchemaDto> GetDashboardSchemaAsync(ISet<string> enabledModuleKeys)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var permissionSnapshot = await GetCurrentPermissionSnapshotAsync(tenantId);

            var schema = await TryGetTenantDashboardSchemaAsync(tenantId);
            if (schema != null)
            {
                foreach (var section in schema.Sections)
                {
                    section.Widgets = section.Widgets
                        .Where(widget => string.IsNullOrWhiteSpace(widget.ModuleKey) || enabledModuleKeys.Contains(widget.ModuleKey))
                        .Where(widget => HasRequiredPermission(widget.RequiredPermissions, permissionSnapshot))
                        .ToList();
                }

                schema.Sections = schema.Sections.Where(section => section.Widgets.Count > 0).ToList();
                return schema;
            }

            var defaultSchema = DefaultUiSchemaCatalog.GetDashboardSchema(enabledModuleKeys);
            foreach (var section in defaultSchema.Sections)
            {
                section.Widgets = section.Widgets
                    .Where(widget => HasRequiredPermission(widget.RequiredPermissions, permissionSnapshot))
                    .ToList();
            }

            defaultSchema.Sections = defaultSchema.Sections.Where(section => section.Widgets.Count > 0).ToList();
            return defaultSchema;
        }

        public async Task<PageSchemaDto?> GetPageSchemaAsync(string pageKey)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var permissionSnapshot = await GetCurrentPermissionSnapshotAsync(tenantId);
            var schema = await TryGetTenantPageSchemaAsync(tenantId, pageKey);
            if (schema == null)
            {
                return null;
            }

            schema.Tabs = schema.Tabs
                .Where(tab => HasRequiredPermission(tab.RequiredPermissions, permissionSnapshot))
                .ToList();
            schema.Actions = schema.Actions
                .Where(action => HasRequiredPermission(action.RequiredPermissions, permissionSnapshot))
                .ToList();

            return schema;
        }

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
                        DisplayName = !string.IsNullOrWhiteSpace(tm.CustomDisplayName) ? tm.CustomDisplayName : (string.IsNullOrWhiteSpace(m.DisplayName) ? m.Name : m.DisplayName),
                        Description = m.Description,
                        Icon = !string.IsNullOrWhiteSpace(tm.CustomIcon) ? tm.CustomIcon : m.Icon,
                        BasePath = m.BasePath,
                        SortOrder = tm.CustomSortOrder ?? m.SortOrder,
                        Version = m.Version,
                        CustomDisplayName = tm.CustomDisplayName,
                        CustomSortOrder = tm.CustomSortOrder,
                        CustomIcon = tm.CustomIcon,
                        CustomSection = tm.CustomSection,
                    })
                .OrderBy(m => m.SortOrder)
                .ThenBy(m => m.Key)
                .ToListAsync();

            return DefaultUiSchemaCatalog.ExpandEnabledModules(result);
        }

        private async Task<PermissionSnapshot> GetCurrentPermissionSnapshotAsync(Guid tenantId)
        {
            var principal = _httpContextAccessor.HttpContext?.User;
            if (principal?.Identity?.IsAuthenticated != true)
            {
                return new PermissionSnapshot(false, new HashSet<string>(StringComparer.OrdinalIgnoreCase));
            }

            var userIdClaim = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? principal.FindFirst("nameidentifier")?.Value
                ?? principal.FindFirst("sub")?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return new PermissionSnapshot(false, new HashSet<string>(StringComparer.OrdinalIgnoreCase));
            }

            var user = await _db.Users
                .AsNoTracking()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(record => record.Id == userId);

            if (user == null)
            {
                return new PermissionSnapshot(false, new HashSet<string>(StringComparer.OrdinalIgnoreCase));
            }

            var effectiveTenantId = user.TenantId == Guid.Empty ? tenantId : user.TenantId;
            var roleRows = await _db.UserRoles
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Where(ur => ur.UserId == userId && ur.TenantId == effectiveTenantId && !ur.IsDeleted)
                .Join(
                    _db.Roles.AsNoTracking().IgnoreQueryFilters(),
                    ur => ur.RoleId,
                    role => role.Id,
                    (_, role) => new { role.Id, role.Name })
                .ToListAsync();

            var isSuperAdmin = user.IsSystemAdmin || RoleCatalog.HasAnyRole(roleRows.Select(role => role.Name), SystemRole.SuperAdmin);
            if (isSuperAdmin)
            {
                return new PermissionSnapshot(true, new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "*" });
            }

            var roleIds = roleRows.Select(role => role.Id).Distinct().ToList();
            if (roleIds.Count == 0)
            {
                return new PermissionSnapshot(false, new HashSet<string>(StringComparer.OrdinalIgnoreCase));
            }

            var permissionPairs = await _db.RolePermissions
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Where(rp => roleIds.Contains(rp.RoleId) && rp.TenantId == effectiveTenantId && !rp.IsDeleted)
                .Join(
                    _db.Permissions.AsNoTracking().IgnoreQueryFilters().Where(permission => !permission.IsDeleted),
                    rp => rp.PermissionId,
                    permission => permission.Id,
                    (_, permission) => new { permission.Module, permission.Action })
                .Distinct()
                .ToListAsync();

            var grantedPermissions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var permission in permissionPairs)
            {
                if (string.IsNullOrWhiteSpace(permission.Module))
                {
                    continue;
                }

                var moduleKey = permission.Module.Trim();
                grantedPermissions.Add($"module:{moduleKey}");
                grantedPermissions.Add($"{moduleKey}.*");

                if (!string.IsNullOrWhiteSpace(permission.Action))
                {
                    var actionKey = permission.Action.Trim();
                    grantedPermissions.Add($"{moduleKey}.{actionKey}");
                    grantedPermissions.Add($"resource:{moduleKey}.{actionKey}");
                }
            }

            return new PermissionSnapshot(false, grantedPermissions);
        }

        private static bool HasRequiredPermission(IReadOnlyCollection<string>? requiredPermissions, PermissionSnapshot permissionSnapshot)
        {
            if (permissionSnapshot.IsSuperAdmin || permissionSnapshot.GrantedPermissions.Contains("*"))
            {
                return true;
            }

            if (requiredPermissions == null || requiredPermissions.Count == 0)
            {
                return true;
            }

            foreach (var key in requiredPermissions)
            {
                var normalized = NormalizePermissionKey(key);
                if (string.IsNullOrWhiteSpace(normalized))
                {
                    continue;
                }

                if (permissionSnapshot.GrantedPermissions.Contains(normalized))
                {
                    return true;
                }

                // Dual alias check between administration and platform
                if (normalized.StartsWith("administration.", StringComparison.OrdinalIgnoreCase))
                {
                    var alt = "platform." + normalized["administration.".Length..];
                    if (permissionSnapshot.GrantedPermissions.Contains(alt)) return true;
                }
                else if (normalized.StartsWith("platform.", StringComparison.OrdinalIgnoreCase))
                {
                    var alt = "administration." + normalized["platform.".Length..];
                    if (permissionSnapshot.GrantedPermissions.Contains(alt)) return true;
                }

                if (normalized.EndsWith(".*", StringComparison.Ordinal))
                {
                    var prefix = normalized[..^2];
                    if (permissionSnapshot.GrantedPermissions.Any(granted => granted.StartsWith($"{prefix}.", StringComparison.OrdinalIgnoreCase)))
                    {
                        return true;
                    }
                }

                var moduleScope = InferModuleScope(normalized);
                if (string.IsNullOrWhiteSpace(moduleScope))
                {
                    continue;
                }

                var altScope = moduleScope.Equals("administration", StringComparison.OrdinalIgnoreCase)
                    ? "platform"
                    : moduleScope.Equals("platform", StringComparison.OrdinalIgnoreCase)
                        ? "administration"
                        : null;

                if (permissionSnapshot.GrantedPermissions.Contains($"module:{moduleScope}") ||
                    permissionSnapshot.GrantedPermissions.Contains($"{moduleScope}.*") ||
                    permissionSnapshot.GrantedPermissions.Contains($"{moduleScope}.access") ||
                    permissionSnapshot.GrantedPermissions.Contains($"{moduleScope}.view") ||
                    permissionSnapshot.GrantedPermissions.Contains($"resource:{moduleScope}.access") ||
                    permissionSnapshot.GrantedPermissions.Contains($"resource:{moduleScope}.view") ||
                    (altScope != null && (
                        permissionSnapshot.GrantedPermissions.Contains($"module:{altScope}") ||
                        permissionSnapshot.GrantedPermissions.Contains($"{altScope}.*") ||
                        permissionSnapshot.GrantedPermissions.Contains($"{altScope}.access") ||
                        permissionSnapshot.GrantedPermissions.Contains($"{altScope}.view") ||
                        permissionSnapshot.GrantedPermissions.Contains($"resource:{altScope}.access") ||
                        permissionSnapshot.GrantedPermissions.Contains($"resource:{altScope}.view"))))
                {
                    return true;
                }
            }

            return false;
        }

        private static string NormalizePermissionKey(string value)
        {
            return (value ?? string.Empty).Trim().ToLowerInvariant();
        }

        private static string? InferModuleScope(string permissionKey)
        {
            if (permissionKey.StartsWith("module:", StringComparison.Ordinal))
            {
                return permissionKey["module:".Length..].Split('.')[0];
            }

            if (permissionKey.StartsWith("resource:", StringComparison.Ordinal))
            {
                return permissionKey["resource:".Length..].Split(new[] { '.', ':' }, 2)[0];
            }

            if (permissionKey.StartsWith("page:", StringComparison.Ordinal) || permissionKey.StartsWith("path:", StringComparison.Ordinal))
            {
                var scope = permissionKey[(permissionKey.IndexOf(':') + 1)..];
                return scope.Split(new[] { '.', ':' }, 2)[0];
            }

            return permissionKey.Split('.')[0];
        }

        private async Task<Dictionary<string, List<NavGroupDto>>> TryGetTenantNavGroupsAsync(Guid tenantId)
        {
            try
            {
                var config = await _db.TenantConfigs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted);

                if (config == null || string.IsNullOrWhiteSpace(config.UiSchemaJson) || config.UiSchemaJson == "{}")
                {
                    return new Dictionary<string, List<NavGroupDto>>();
                }

                using var doc = JsonDocument.Parse(config.UiSchemaJson);
                if (!doc.RootElement.TryGetProperty("navigation", out var nav) ||
                    !nav.TryGetProperty("modules", out var modulesEl))
                {
                    return new Dictionary<string, List<NavGroupDto>>();
                }

                var result = new Dictionary<string, List<NavGroupDto>>(StringComparer.OrdinalIgnoreCase);

                foreach (var moduleEl in modulesEl.EnumerateArray())
                {
                    if (!moduleEl.TryGetProperty("key", out var keyEl))
                    {
                        continue;
                    }

                    var key = keyEl.GetString() ?? string.Empty;
                    if (string.IsNullOrWhiteSpace(key))
                    {
                        continue;
                    }

                    var groups = new List<NavGroupDto>();
                    if (moduleEl.TryGetProperty("groups", out var groupsEl))
                    {
                        var groupSort = 0;
                        foreach (var groupEl in groupsEl.EnumerateArray())
                        {
                            var label = groupEl.TryGetProperty("label", out var labelEl) ? (labelEl.GetString() ?? string.Empty) : string.Empty;
                            var items = new List<NavItemDto>();

                            if (groupEl.TryGetProperty("items", out var itemsEl))
                            {
                                var itemSort = 0;
                                foreach (var itemEl in itemsEl.EnumerateArray())
                                {
                                    items.Add(new NavItemDto
                                    {
                                        Key = itemEl.TryGetProperty("key", out var keyValue) ? (keyValue.GetString() ?? string.Empty) : string.Empty,
                                        Name = itemEl.TryGetProperty("name", out var nameEl) ? (nameEl.GetString() ?? string.Empty) : string.Empty,
                                        Path = itemEl.TryGetProperty("path", out var pathEl) ? (pathEl.GetString() ?? string.Empty) : string.Empty,
                                        Icon = itemEl.TryGetProperty("icon", out var iconEl) ? iconEl.GetString() : null,
                                        SortOrder = itemSort++,
                                        RequiredPermissions = itemEl.TryGetProperty("requiredPermissions", out var permissionsEl)
                                            ? permissionsEl.EnumerateArray().Select(entry => entry.GetString() ?? string.Empty).Where(entry => !string.IsNullOrWhiteSpace(entry)).ToList()
                                            : new List<string>(),
                                    });
                                }
                            }

                            groups.Add(new NavGroupDto
                            {
                                Label = label,
                                SortOrder = groupSort++,
                                Items = items,
                            });
                        }
                    }

                    result[key] = groups;
                }

                return DefaultUiSchemaCatalog.ExpandLegacyTenantNavigation(result);
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
                {
                    return new List<RoutePermissionRuleDto>();
                }

                using var doc = JsonDocument.Parse(config.UiSchemaJson);
                if (!doc.RootElement.TryGetProperty("routeRules", out var rulesEl))
                {
                    return new List<RoutePermissionRuleDto>();
                }

                var rules = new List<RoutePermissionRuleDto>();
                foreach (var ruleEl in rulesEl.EnumerateArray())
                {
                    rules.Add(new RoutePermissionRuleDto
                    {
                        PathPattern = ruleEl.TryGetProperty("pathPattern", out var pathPatternEl) ? (pathPatternEl.GetString() ?? string.Empty) : string.Empty,
                        ModuleKey = ruleEl.TryGetProperty("moduleKey", out var moduleKeyEl) ? (moduleKeyEl.GetString() ?? string.Empty) : string.Empty,
                        PermissionKeys = ruleEl.TryGetProperty("permissionKeys", out var permissionKeysEl)
                            ? permissionKeysEl.EnumerateArray().Select(entry => entry.GetString() ?? string.Empty).Where(entry => !string.IsNullOrWhiteSpace(entry)).ToList()
                            : new List<string>(),
                    });
                }

                return DefaultUiSchemaCatalog.ExpandLegacyRouteRules(rules);
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
                {
                    return null;
                }

                using var doc = JsonDocument.Parse(config.UiSchemaJson);
                if (!doc.RootElement.TryGetProperty("dashboard", out var dashboardEl))
                {
                    return null;
                }

                var schema = JsonSerializer.Deserialize<DashboardSchemaDto>(dashboardEl.GetRawText(), _jsonOpts);
                return schema == null ? null : DefaultUiSchemaCatalog.NormalizeDashboardSchema(schema);
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
                var normalizedKey = pageKey.Trim().ToLowerInvariant();
                var pageDef = await _db.UiPageDefinitions
                    .AsNoTracking()
                    .Include(p => p.Versions.Where(v => v.IsPublished && !v.IsDeleted))
                    .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.PageKey.ToLower() == normalizedKey && !p.IsDeleted);

                if (pageDef != null)
                {
                    var activeVersion = pageDef.Versions.FirstOrDefault(v => v.Version == pageDef.PublishedVersion)
                        ?? pageDef.Versions.OrderByDescending(v => v.Version).FirstOrDefault();

                    if (activeVersion != null && !string.IsNullOrWhiteSpace(activeVersion.SchemaJson))
                    {
                        var schema = JsonSerializer.Deserialize<PageSchemaDto>(activeVersion.SchemaJson, _jsonOpts);
                        if (schema != null)
                        {
                            return schema;
                        }
                    }
                }

                var config = await _db.TenantConfigs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted);

                if (config == null || string.IsNullOrWhiteSpace(config.UiSchemaJson) || config.UiSchemaJson == "{}")
                {
                    return null;
                }

                using var doc = JsonDocument.Parse(config.UiSchemaJson);
                if (!doc.RootElement.TryGetProperty("pages", out var pagesEl) ||
                    !pagesEl.TryGetProperty(pageKey, out var pageEl))
                {
                    return null;
                }

                return JsonSerializer.Deserialize<PageSchemaDto>(pageEl.GetRawText(), _jsonOpts);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse page schema '{PageKey}' for tenant {TenantId}", pageKey, tenantId);
                return null;
            }
        }

        public async Task<UiShellConfigDto> GetShellConfigAsync(Guid tenantId)
        {
            try
            {
                var config = await _db.TenantConfigs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted);

                if (config != null && !string.IsNullOrWhiteSpace(config.UiSchemaJson) && config.UiSchemaJson != "{}")
                {
                    using var doc = JsonDocument.Parse(config.UiSchemaJson);
                    if (doc.RootElement.TryGetProperty("shellConfig", out var shellEl))
                    {
                        var parsed = JsonSerializer.Deserialize<UiShellConfigDto>(shellEl.GetRawText(), _jsonOpts);
                        if (parsed != null)
                        {
                            return parsed;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse custom shellConfig for tenant {TenantId}, returning defaults", tenantId);
            }

            return new UiShellConfigDto();
        }

        public async Task<bool> SaveShellConfigAsync(Guid tenantId, UiShellConfigDto shellConfig)
        {
            try
            {
                var config = await _db.TenantConfigs
                    .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted);

                if (config == null)
                {
                    config = new TenantConfig
                    {
                        TenantId = tenantId,
                        UiSchemaJson = "{}",
                    };
                    _db.TenantConfigs.Add(config);
                }

                var rootDict = new Dictionary<string, object?>();
                if (!string.IsNullOrWhiteSpace(config.UiSchemaJson) && config.UiSchemaJson != "{}")
                {
                    try
                    {
                        rootDict = JsonSerializer.Deserialize<Dictionary<string, object?>>(config.UiSchemaJson) ?? new();
                    }
                    catch
                    {
                        rootDict = new();
                    }
                }

                rootDict["shellConfig"] = shellConfig;
                config.UiSchemaJson = JsonSerializer.Serialize(rootDict, _jsonOpts);
                await _db.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save shellConfig for tenant {TenantId}", tenantId);
                return false;
            }
        }

        private async Task<Dictionary<string, List<string>>> TryGetPageRolePoliciesAsync(Guid tenantId)
        {
            var result = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
            try
            {
                var config = await _db.TenantConfigs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted);

                if (config != null && !string.IsNullOrWhiteSpace(config.UiSchemaJson) && config.UiSchemaJson != "{}")
                {
                    using var doc = JsonDocument.Parse(config.UiSchemaJson);
                    if (doc.RootElement.TryGetProperty("pageRoles", out var pageRolesEl) && pageRolesEl.ValueKind == JsonValueKind.Object)
                    {
                        foreach (var prop in pageRolesEl.EnumerateObject())
                        {
                            if (prop.Value.ValueKind == JsonValueKind.Array)
                            {
                                var roles = prop.Value.EnumerateArray()
                                    .Select(r => r.GetString() ?? string.Empty)
                                    .Where(r => !string.IsNullOrWhiteSpace(r))
                                    .ToList();
                                result[prop.Name] = roles;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load page role policies for tenant {TenantId}", tenantId);
            }
            return result;
        }
    }
}
