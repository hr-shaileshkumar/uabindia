using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Api.Models;
using UabIndia.Api.Services;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class ModulesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public ModulesController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public class UpdateModuleMappingDto
        {
            public List<ModuleMappingItemDto> Modules { get; set; } = new();
        }

        public class ModuleMappingItemDto
        {
            public string Key { get; set; } = string.Empty;
            public string? CustomDisplayName { get; set; }
            public int? CustomSortOrder { get; set; }
            public string? CustomIcon { get; set; }
            public string? CustomSection { get; set; }
            public bool IsEnabled { get; set; } = true;
        }

        public class UpdateModulePagesDto
        {
            public List<ModulePageMappingItemDto> Pages { get; set; } = new();
        }

        public class ModulePageMappingItemDto
        {
            public Guid? Id { get; set; }
            public string PageKey { get; set; } = string.Empty;
            public string? Title { get; set; }
            public string? ModuleKey { get; set; }
            public string? NavGroup { get; set; }
            public int NavSortOrder { get; set; }
            public bool AddToNavigation { get; set; } = true;
            public string? Icon { get; set; }
            public List<string>? AllowedRoles { get; set; }
        }

        private bool IsSuperAdmin() =>
            User.IsInRole("SuperAdmin") ||
            User.HasClaim("is_system_admin", "true") ||
            User.HasClaim(ClaimTypes.Role, "SuperAdmin");

        private Guid ResolveTargetTenantId(Guid? requestedTenantId)
        {
            if (IsSuperAdmin() && requestedTenantId.HasValue && requestedTenantId.Value != Guid.Empty)
            {
                return requestedTenantId.Value;
            }
            return _tenantAccessor.GetTenantId();
        }

        [HttpGet("enabled")]
        public async Task<IActionResult> GetEnabledModules()
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var data = await _db.TenantModules
                .AsNoTracking()
                .Where(tm => tm.TenantId == tenantId && tm.IsEnabled && !tm.IsDeleted)
                .Join(_db.Modules.AsNoTracking().Where(m => m.IsEnabled),
                    tm => tm.ModuleKey,
                    m => m.ModuleKey,
                    (tm, m) => new
                    {
                        key = m.ModuleKey,
                        name = m.Name,
                        displayName = !string.IsNullOrWhiteSpace(tm.CustomDisplayName) ? tm.CustomDisplayName : (string.IsNullOrWhiteSpace(m.DisplayName) ? m.Name : m.DisplayName),
                        icon = !string.IsNullOrWhiteSpace(tm.CustomIcon) ? tm.CustomIcon : m.Icon,
                        description = m.Description,
                        basePath = m.BasePath,
                        isEnabled = tm.IsEnabled,
                        order = tm.CustomSortOrder ?? m.SortOrder,
                        customDisplayName = tm.CustomDisplayName,
                        customSortOrder = tm.CustomSortOrder,
                        customIcon = tm.CustomIcon,
                        customSection = tm.CustomSection,
                    })
                .OrderBy(m => m.order)
                .ThenBy(m => m.key)
                .ToListAsync();

            var expanded = DefaultUiSchemaCatalog
                .ExpandEnabledModules(data.Select(module => new ModuleMetaDto
                {
                    Key = module.key,
                    Name = module.name,
                    DisplayName = module.displayName,
                    Description = module.description,
                    Icon = module.icon,
                    BasePath = module.basePath,
                    SortOrder = module.order,
                    CustomDisplayName = module.customDisplayName,
                    CustomSortOrder = module.customSortOrder,
                    CustomIcon = module.customIcon,
                    CustomSection = module.customSection,
                }))
                .Select(module => new
                {
                    key = module.Key,
                    name = module.Name,
                    displayName = module.DisplayName,
                    icon = module.Icon,
                    description = module.Description,
                    basePath = module.BasePath,
                    isEnabled = true,
                    order = module.SortOrder,
                    customDisplayName = module.CustomDisplayName,
                    customSortOrder = module.CustomSortOrder,
                    customIcon = module.CustomIcon,
                    customSection = module.CustomSection,
                })
                .ToList();

            return Ok(new { modules = expanded });
        }

        [HttpGet("catalog")]
        [Authorize(Policy = "Module:platform")]
        public async Task<IActionResult> GetCatalog()
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var subscriptionRows = await _db.TenantModules
                .AsNoTracking()
                .Where(tm => tm.TenantId == tenantId && !tm.IsDeleted)
                .Select(tm => new { tm.ModuleKey, tm.IsEnabled })
                .ToListAsync();

            var subscriptions = subscriptionRows
                .GroupBy(tm => tm.ModuleKey, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First().IsEnabled, StringComparer.OrdinalIgnoreCase);

            var data = await _db.Modules
                .AsNoTracking()
                .Where(m => m.IsEnabled)
                .Select(m => new
                {
                    key = m.ModuleKey,
                    name = m.Name,
                    displayName = string.IsNullOrWhiteSpace(m.DisplayName) ? m.Name : m.DisplayName,
                    description = m.Description,
                    basePath = m.BasePath,
                    version = m.Version,
                    sortOrder = m.SortOrder
                })
                .OrderBy(m => m.sortOrder)
                .ThenBy(m => m.key)
                .ToListAsync();

            var modules = data.Select(m => new
            {
                m.key,
                m.name,
                m.displayName,
                m.description,
                m.basePath,
                m.version,
                isEnabled = subscriptions.TryGetValue(m.key, out var enabled) && enabled
            }).ToList();

            return Ok(new { modules });
        }

        [HttpGet("subscriptions")]
        [Authorize(Policy = "Module:platform")]
        public async Task<IActionResult> GetSubscriptions()
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var data = await _db.TenantModules
                .AsNoTracking()
                .Where(tm => tm.TenantId == tenantId && !tm.IsDeleted)
                .Select(tm => new
                {
                    moduleKey = tm.ModuleKey,
                    isEnabled = tm.IsEnabled
                })
                .OrderBy(tm => tm.moduleKey)
                .ToListAsync();

            return Ok(new { subscriptions = data });
        }

        [HttpPost("subscriptions")]
        [Authorize(Policy = "Module:platform")]
        public async Task<IActionResult> UpsertSubscriptions([FromBody] UpdateTenantModulesDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();

            var requested = dto.Subscriptions
                .Where(s => !string.IsNullOrWhiteSpace(s.ModuleKey))
                .Select(s => new { key = s.ModuleKey.Trim(), s.IsEnabled })
                .ToList();

            if (requested.Count == 0)
            {
                return BadRequest(new { message = "No module subscriptions provided." });
            }

            var validModules = await _db.Modules
                .AsNoTracking()
                .Where(m => m.IsEnabled)
                .Select(m => m.ModuleKey)
                .ToListAsync();

            var existing = await _db.TenantModules
                .Where(tm => tm.TenantId == tenantId)
                .ToListAsync();

            foreach (var sub in requested)
            {
                if (!validModules.Contains(sub.key, StringComparer.OrdinalIgnoreCase))
                {
                    continue;
                }

                var match = existing.FirstOrDefault(tm => string.Equals(tm.ModuleKey, sub.key, StringComparison.OrdinalIgnoreCase));
                if (match == null)
                {
                    _db.TenantModules.Add(new Core.Entities.TenantModule
                    {
                        TenantId = tenantId,
                        ModuleKey = sub.key,
                        IsEnabled = sub.IsEnabled,
                        EnabledAt = DateTime.UtcNow,
                        DisabledAt = sub.IsEnabled ? null : DateTime.UtcNow
                    });
                }
                else
                {
                    match.IsEnabled = sub.IsEnabled;
                    match.DisabledAt = sub.IsEnabled ? null : DateTime.UtcNow;
                    if (sub.IsEnabled && match.EnabledAt == default)
                    {
                        match.EnabledAt = DateTime.UtcNow;
                    }
                }
            }

            await _db.SaveChangesAsync();

            return Ok();
        }

        // ─────────────────────────────────────────────────────────────────────
        // Dynamic Module & Page Mapping Endpoints (Tenant Admin & Superadmin)
        // ─────────────────────────────────────────────────────────────────────

        [HttpGet("mapping")]
        public async Task<IActionResult> GetMapping([FromQuery] Guid? tenantId = null, CancellationToken ct = default)
        {
            var isSuperAdmin = IsSuperAdmin();
            var targetTenantId = ResolveTargetTenantId(tenantId);

            // Fetch tenants list if Superadmin
            var tenantsList = isSuperAdmin
                ? await _db.Tenants
                    .AsNoTracking()
                    .Where(t => !t.IsDeleted)
                    .OrderBy(t => t.Name)
                    .Select(t => new { id = t.Id, name = t.Name, subdomain = t.Subdomain })
                    .ToListAsync(ct)
                : null;

            // Fetch current tenant info
            var currentTenant = await _db.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == targetTenantId, ct);

            // Fetch all system modules
            var dbModules = await _db.Modules
                .AsNoTracking()
                .Where(m => m.IsEnabled)
                .OrderBy(m => m.SortOrder)
                .ToListAsync(ct);

            // Fetch tenant customizations from TenantModules
            var tenantModules = await _db.TenantModules
                .AsNoTracking()
                .Where(tm => tm.TenantId == targetTenantId && !tm.IsDeleted)
                .ToListAsync(ct);

            var tenantModuleMap = tenantModules
                .GroupBy(tm => tm.ModuleKey, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            // Expand modules via DefaultUiSchemaCatalog to include derived modules (finance, sales, etc.)
            var baseMetaList = dbModules.Select(m =>
            {
                tenantModuleMap.TryGetValue(m.ModuleKey, out var tm);
                return new ModuleMetaDto
                {
                    Key = m.ModuleKey,
                    Name = m.Name,
                    DisplayName = tm?.CustomDisplayName ?? (string.IsNullOrWhiteSpace(m.DisplayName) ? m.Name : m.DisplayName),
                    Description = m.Description,
                    Icon = tm?.CustomIcon ?? m.Icon,
                    BasePath = m.BasePath,
                    SortOrder = tm?.CustomSortOrder ?? m.SortOrder,
                    CustomDisplayName = tm?.CustomDisplayName,
                    CustomSortOrder = tm?.CustomSortOrder,
                    CustomIcon = tm?.CustomIcon,
                    CustomSection = tm?.CustomSection,
                };
            }).ToList();

            var expandedModules = DefaultUiSchemaCatalog.ExpandEnabledModules(baseMetaList);

            // Fetch all UiPageDefinitions for this tenant
            var pages = await _db.UiPageDefinitions
                .AsNoTracking()
                .Where(p => p.TenantId == targetTenantId && !p.IsDeleted)
                .OrderBy(p => p.NavSortOrder)
                .ThenBy(p => p.Title)
                .Select(p => new
                {
                    p.Id,
                    p.PageKey,
                    p.EntityName,
                    p.Title,
                    p.SubTitle,
                    p.ModuleKey,
                    p.RoutePath,
                    p.Icon,
                    p.NavGroup,
                    p.NavSortOrder,
                    p.AddToNavigation,
                    p.Status
                })
                .ToListAsync(ct);

            var pagesByModule = pages
                .GroupBy(p => p.ModuleKey, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.ToList(), StringComparer.OrdinalIgnoreCase);

            var pageRoles = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
            var tenantConfig = await _db.TenantConfigs.AsNoTracking()
                .FirstOrDefaultAsync(c => c.TenantId == targetTenantId && !c.IsDeleted, ct);
            if (tenantConfig != null && !string.IsNullOrWhiteSpace(tenantConfig.UiSchemaJson) && tenantConfig.UiSchemaJson != "{}")
            {
                try
                {
                    using var doc = JsonDocument.Parse(tenantConfig.UiSchemaJson);
                    if (doc.RootElement.TryGetProperty("pageRoles", out var prEl) && prEl.ValueKind == JsonValueKind.Object)
                    {
                        foreach (var prop in prEl.EnumerateObject())
                        {
                            if (prop.Value.ValueKind == JsonValueKind.Array)
                            {
                                pageRoles[prop.Name] = prop.Value.EnumerateArray()
                                    .Select(x => x.GetString() ?? "")
                                    .Where(x => !string.IsNullOrWhiteSpace(x))
                                    .ToList();
                            }
                        }
                    }
                }
                catch { }
            }

            // Construct rich mapping items
            var mappingModules = expandedModules.Select(m =>
            {
                tenantModuleMap.TryGetValue(m.Key, out var tm);
                pagesByModule.TryGetValue(m.Key, out var modulePages);

                var isEnabled = tm != null ? tm.IsEnabled : true;

                return new
                {
                    key = m.Key,
                    defaultName = m.Name,
                    displayName = m.DisplayName,
                    customDisplayName = tm?.CustomDisplayName,
                    defaultSortOrder = m.SortOrder,
                    sortOrder = tm?.CustomSortOrder ?? m.SortOrder,
                    customSortOrder = tm?.CustomSortOrder,
                    defaultIcon = m.Icon ?? "layers",
                    icon = tm?.CustomIcon ?? m.Icon ?? "layers",
                    customIcon = tm?.CustomIcon,
                    customSection = tm?.CustomSection,
                    basePath = m.BasePath,
                    description = m.Description,
                    isEnabled,
                    pageCount = modulePages?.Count ?? 0,
                    pages = (modulePages ?? new()).Select(p => new
                    {
                        id = p.Id,
                        pageKey = p.PageKey,
                        entityName = p.EntityName,
                        title = p.Title,
                        subTitle = p.SubTitle,
                        moduleKey = p.ModuleKey,
                        routePath = p.RoutePath,
                        icon = p.Icon,
                        navGroup = p.NavGroup,
                        navSortOrder = p.NavSortOrder,
                        addToNavigation = p.AddToNavigation,
                        status = p.Status,
                        allowedRoles = pageRoles.TryGetValue(p.PageKey, out var roles) ? roles : new List<string>()
                    }).ToList()
                };
            })
            .OrderBy(m => m.sortOrder)
            .ThenBy(m => m.key)
            .ToList();

            return Ok(new
            {
                tenantId = targetTenantId,
                tenantName = currentTenant?.Name ?? "Default Organization",
                isSuperAdmin,
                tenants = tenantsList,
                modules = mappingModules
            });
        }

        [HttpPut("mapping")]
        public async Task<IActionResult> UpdateMapping(
            [FromBody] UpdateModuleMappingDto dto,
            [FromQuery] Guid? tenantId = null,
            CancellationToken ct = default)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var targetTenantId = ResolveTargetTenantId(tenantId);

            var existing = await _db.TenantModules
                .Where(tm => tm.TenantId == targetTenantId && !tm.IsDeleted)
                .ToListAsync(ct);

            var existingMap = existing
                .GroupBy(tm => tm.ModuleKey, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            foreach (var item in dto.Modules)
            {
                if (string.IsNullOrWhiteSpace(item.Key)) continue;

                var key = item.Key.Trim();

                if (existingMap.TryGetValue(key, out var record))
                {
                    record.CustomDisplayName = string.IsNullOrWhiteSpace(item.CustomDisplayName) ? null : item.CustomDisplayName.Trim();
                    record.CustomSortOrder = item.CustomSortOrder;
                    record.CustomIcon = string.IsNullOrWhiteSpace(item.CustomIcon) ? null : item.CustomIcon.Trim();
                    record.CustomSection = string.IsNullOrWhiteSpace(item.CustomSection) ? null : item.CustomSection.Trim();
                    record.IsEnabled = item.IsEnabled;
                    record.UpdatedAt = DateTime.UtcNow;
                    if (!item.IsEnabled && record.DisabledAt == null) record.DisabledAt = DateTime.UtcNow;
                    if (item.IsEnabled) record.DisabledAt = null;
                }
                else
                {
                    _db.TenantModules.Add(new TenantModule
                    {
                        TenantId = targetTenantId,
                        ModuleKey = key,
                        CustomDisplayName = string.IsNullOrWhiteSpace(item.CustomDisplayName) ? null : item.CustomDisplayName.Trim(),
                        CustomSortOrder = item.CustomSortOrder,
                        CustomIcon = string.IsNullOrWhiteSpace(item.CustomIcon) ? null : item.CustomIcon.Trim(),
                        CustomSection = string.IsNullOrWhiteSpace(item.CustomSection) ? null : item.CustomSection.Trim(),
                        IsEnabled = item.IsEnabled,
                        EnabledAt = DateTime.UtcNow,
                        DisabledAt = item.IsEnabled ? null : DateTime.UtcNow
                    });
                }
            }

            await _db.SaveChangesAsync(ct);

            return Ok(new { success = true, message = "Module mapping successfully updated." });
        }

        [HttpPut("mapping/{moduleKey}/pages")]
        public async Task<IActionResult> UpdateModulePages(
            [FromRoute] string moduleKey,
            [FromBody] UpdateModulePagesDto dto,
            [FromQuery] Guid? tenantId = null,
            CancellationToken ct = default)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var targetTenantId = ResolveTargetTenantId(tenantId);

            var existingPages = await _db.UiPageDefinitions
                .Where(p => p.TenantId == targetTenantId && !p.IsDeleted)
                .ToListAsync(ct);

            var existingPageMap = existingPages
                .GroupBy(p => p.PageKey, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            foreach (var item in dto.Pages)
            {
                if (string.IsNullOrWhiteSpace(item.PageKey)) continue;

                var pageKey = item.PageKey.Trim();

                if (existingPageMap.TryGetValue(pageKey, out var page))
                {
                    if (!string.IsNullOrWhiteSpace(item.Title)) page.Title = item.Title.Trim();
                    if (!string.IsNullOrWhiteSpace(item.ModuleKey)) page.ModuleKey = item.ModuleKey.Trim().ToLowerInvariant();
                    page.NavGroup = item.NavGroup?.Trim();
                    page.NavSortOrder = item.NavSortOrder;
                    page.AddToNavigation = item.AddToNavigation;
                    if (!string.IsNullOrWhiteSpace(item.Icon)) page.Icon = item.Icon.Trim();
                    page.UpdatedAt = DateTime.UtcNow;
                }
            }

            var hasRoleUpdates = dto.Pages.Any(p => p.AllowedRoles != null);
            if (hasRoleUpdates)
            {
                var config = await _db.TenantConfigs.FirstOrDefaultAsync(c => c.TenantId == targetTenantId && !c.IsDeleted, ct);
                if (config == null)
                {
                    config = new TenantConfig { TenantId = targetTenantId, UiSchemaJson = "{}" };
                    _db.TenantConfigs.Add(config);
                }

                var rootDict = new Dictionary<string, object?>();
                if (!string.IsNullOrWhiteSpace(config.UiSchemaJson) && config.UiSchemaJson != "{}")
                {
                    try { rootDict = JsonSerializer.Deserialize<Dictionary<string, object?>>(config.UiSchemaJson) ?? new(); }
                    catch { rootDict = new(); }
                }

                var currentRoles = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
                if (rootDict.TryGetValue("pageRoles", out var existingRolesObj) && existingRolesObj is JsonElement el && el.ValueKind == JsonValueKind.Object)
                {
                    foreach (var prop in el.EnumerateObject())
                    {
                        if (prop.Value.ValueKind == JsonValueKind.Array)
                        {
                            currentRoles[prop.Name] = prop.Value.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => !string.IsNullOrWhiteSpace(x)).ToList();
                        }
                    }
                }

                foreach (var item in dto.Pages)
                {
                    if (!string.IsNullOrWhiteSpace(item.PageKey) && item.AllowedRoles != null)
                    {
                        currentRoles[item.PageKey.Trim()] = item.AllowedRoles;
                    }
                }

                rootDict["pageRoles"] = currentRoles;
                config.UiSchemaJson = JsonSerializer.Serialize(rootDict);
            }

            await _db.SaveChangesAsync(ct);

            return Ok(new { success = true, message = "Module pages hierarchy successfully updated." });
        }

        [HttpPost("mapping/reset")]
        public async Task<IActionResult> ResetMapping([FromQuery] Guid? tenantId = null, CancellationToken ct = default)
        {
            var targetTenantId = ResolveTargetTenantId(tenantId);

            var existing = await _db.TenantModules
                .Where(tm => tm.TenantId == targetTenantId && !tm.IsDeleted)
                .ToListAsync(ct);

            foreach (var record in existing)
            {
                record.CustomDisplayName = null;
                record.CustomSortOrder = null;
                record.CustomIcon = null;
                record.CustomSection = null;
                record.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(ct);

            return Ok(new { success = true, message = "Module mapping reset to default system configuration." });
        }
    }
}
