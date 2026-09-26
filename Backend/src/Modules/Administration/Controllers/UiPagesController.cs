using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Api.Services;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/ui-pages")]
    [Route("api/metadata")]
    [Route("api/v1/metadata")]
    [Authorize]
    public class UiPagesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IEntityMetadataService _entityMetadata;

        public UiPagesController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IEntityMetadataService entityMetadata)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _entityMetadata = entityMetadata;
        }

        public class CreatePageDefinitionDto
        {
            public string PageKey { get; set; } = string.Empty;
            public string EntityName { get; set; } = string.Empty;
            public string Title { get; set; } = string.Empty;
            public string? SubTitle { get; set; }
            public string ModuleKey { get; set; } = string.Empty;
            public string ViewType { get; set; } = "table";
            public string RoutePath { get; set; } = string.Empty;
            public string Icon { get; set; } = "Layers";
            public bool AddToNavigation { get; set; } = true;
            public string? NavGroup { get; set; }
            public int NavSortOrder { get; set; } = 0;
            public string? RequiredPermission { get; set; }
            public string? InitialSchemaJson { get; set; }
        }

        public class SavePageSchemaDraftDto
        {
            public string? Title { get; set; }
            public string? SubTitle { get; set; }
            public string? RoutePath { get; set; }
            public string? Icon { get; set; }
            public string? NavGroup { get; set; }
            public int? NavSortOrder { get; set; }
            public string? RequiredPermission { get; set; }
            public string SchemaJson { get; set; } = "{}";
            public string? ChangeSummary { get; set; }
        }

        public class PublishPageDto
        {
            public int? Version { get; set; }
            public string? ChangeSummary { get; set; }
        }

        public class RollbackPageDto
        {
            public int TargetVersion { get; set; }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 1. Entity Discovery Endpoints
        // ─────────────────────────────────────────────────────────────────────

        [HttpGet("entities")]
        public async Task<IActionResult> GetEntities(CancellationToken ct)
        {
            var list = await _entityMetadata.GetDiscoverableEntitiesAsync(ct);
            return Ok(list);
        }

        [HttpGet("entities/{entityName}/fields")]
        public async Task<IActionResult> GetEntityFields(string entityName, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(entityName))
            {
                return BadRequest(new { message = "Entity name is required." });
            }

            var fields = await _entityMetadata.GetEntityFieldsAsync(entityName, ct);
            return Ok(fields);
        }

        // ─────────────────────────────────────────────────────────────────────
        // 2. Page Definitions CRUD
        // ─────────────────────────────────────────────────────────────────────

        [HttpGet]
        public async Task<IActionResult> ListPages([FromQuery] string? moduleKey, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            try
            {
                var query = _db.UiPageDefinitions
                    .AsNoTracking()
                    .Where(p => p.TenantId == tenantId && !p.IsDeleted);

                if (!string.IsNullOrWhiteSpace(moduleKey))
                {
                    query = query.Where(p => p.ModuleKey.ToLower() == moduleKey.ToLower());
                }

                var pages = await query
                    .OrderBy(p => p.ModuleKey)
                    .ThenBy(p => p.NavSortOrder)
                    .ThenBy(p => p.Title)
                    .Select(p => new
                    {
                        p.Id,
                        p.PageKey,
                        p.EntityName,
                        p.Title,
                        p.SubTitle,
                        p.ModuleKey,
                        p.ViewType,
                        p.RoutePath,
                        p.Icon,
                        p.Status,
                        p.PublishedVersion,
                        p.DraftVersion,
                        p.AddToNavigation,
                        p.NavGroup,
                        p.NavSortOrder,
                        p.RequiredPermission,
                        p.CreatedAt,
                        p.UpdatedAt,
                        VersionCount = p.Versions.Count(v => !v.IsDeleted)
                    })
                    .ToListAsync(ct);

                // If empty, auto-seed default demo pages (e.g. Employee Master)
                if (pages.Count == 0)
                {
                    await EnsureDefaultPagesSeededAsync(tenantId, ct);
                    return await ListPages(moduleKey, ct);
                }

                return Ok(pages);
            }
            catch
            {
                return Ok(Array.Empty<object>());
            }
        }

        [HttpGet("modules")]
        public IActionResult GetModules()
        {
            var modules = new[]
            {
                new { key = "hrms", name = "HRMS & Workforce", icon = "Users", description = "Workforce management, attendance, leave, and employee profiles" },
                new { key = "payroll", name = "Payroll & Compensation", icon = "Calculator", description = "Salary calculations, payslips, deductions, and tax declarations" },
                new { key = "administration", name = "Administration & Platform", icon = "Building2", description = "Company structure, tenant settings, access control, and master registers" },
                new { key = "finance", name = "Finance & General Ledger", icon = "Receipt", description = "Chart of accounts, invoices, expenses, and banking transactions" },
                new { key = "sales", name = "Sales & Invoicing", icon = "ShoppingCart", description = "Customer master, sales orders, quotes, and accounts receivable" },
                new { key = "procurement", name = "Procurement & Vendors", icon = "Truck", description = "Purchase orders, vendor master, receiving, and accounts payable" },
                new { key = "projects", name = "Projects & Operations", icon = "Briefcase", description = "Project delivery, milestones, resource planning, and timesheets" },
                new { key = "assets", name = "Asset Management", icon = "Cpu", description = "Fixed asset register, depreciation schedules, and maintenance tracking" }
            };
            return Ok(modules);
        }

        [HttpGet("pages/{pageKey}")]
        [HttpGet("{pageKey}")]
        public async Task<IActionResult> GetPage(
            string pageKey,
            [FromQuery] bool draft = false,
            [FromQuery] int? version = null,
            [FromQuery] Guid? companyId = null,
            [FromQuery] Guid? projectId = null,
            CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var key = pageKey.Trim().ToLowerInvariant();

            // Canonical key aliases for standard ERP Master pages
            if (key == "employee-master" || key == "employee" || key == "employees") key = "hrms.employees";
            else if (key == "department-master" || key == "department" || key == "departments") key = "administration.departments";
            else if (key == "designation-master" || key == "designation" || key == "designations") key = "administration.designations";
            else if (key == "company-master" || key == "company" || key == "companies") key = "administration.companies";
            else if (key == "branch-master" || key == "branch" || key == "branches") key = "administration.branches";
            else if (key == "user-master" || key == "user" || key == "users") key = "administration.users";
            else if (key == "role-master" || key == "role" || key == "roles") key = "administration.roles";
            else if (key == "vendor-bills" || key == "vendorbill" || key == "vendorbills" || key == "finance.vendor-bills") key = "procurement.vendor-bills";
            else if (key == "inventory.warehouse-management" || key == "warehouse-management" || key == "wms") key = "inventory.wms";
            else if (key == "procurement.goods-receipt-notes" || key == "goods-receipt-notes") key = "procurement.grn";
            else if (key == "sales.customers") key = "crm.customers";

            UiPageDefinition? page = null;
            try
            {
                // 1. Resolve scoped schema: (Company + Project) -> Company -> Tenant Default
                var query = _db.UiPageDefinitions
                    .AsNoTracking()
                    .Include(p => p.Versions.Where(v => !v.IsDeleted))
                    .Where(p => p.TenantId == tenantId && p.PageKey.ToLower() == key && !p.IsDeleted);

                if (companyId.HasValue && projectId.HasValue)
                {
                    page = await query.FirstOrDefaultAsync(p => p.CompanyId == companyId.Value && p.ProjectId == projectId.Value, ct);
                }
                if (page == null && companyId.HasValue)
                {
                    page = await query.FirstOrDefaultAsync(p => p.CompanyId == companyId.Value && p.ProjectId == null, ct);
                }
                if (page == null)
                {
                    page = await query.FirstOrDefaultAsync(p => p.CompanyId == null && p.ProjectId == null, ct);
                }
            }
            catch
            {
                // Graceful fallback to on-the-fly synthesis
                page = null;
            }

            // 2. If no manual page exists, synthesize schema on the fly directly from EF Core Database Metadata!
            if (page == null)
            {
                var discoverable = await _entityMetadata.GetDiscoverableEntitiesAsync(ct);
                var matched = discoverable.FirstOrDefault(e =>
                    key.EndsWith(e.Name.ToLowerInvariant()) ||
                    key.EndsWith(e.Name.ToLowerInvariant() + "s") ||
                    key.Contains(e.Name.ToLowerInvariant()));

                var entityName = matched?.Name ?? InferEntityNameFromKey(key);
                var synthesizedJson = await _entityMetadata.SynthesizePageSchemaJsonAsync(entityName, key, companyId, projectId, ct);

                return Ok(new
                {
                    Id = Guid.Empty,
                    PageKey = key,
                    EntityName = entityName,
                    Title = matched?.DisplayName ?? entityName,
                    SubTitle = matched?.Description ?? $"Auto-synthesized dynamic registry for {entityName}",
                    ModuleKey = key.Contains('.') ? key.Split('.')[0] : "platform",
                    ViewType = "table",
                    RoutePath = $"/{key.Replace('.', '/')}",
                    Icon = matched?.Icon ?? "Layers",
                    Status = "Published",
                    PublishedVersion = 1,
                    DraftVersion = (int?)null,
                    AddToNavigation = true,
                    NavGroup = matched?.Category ?? "System Masters",
                    NavSortOrder = 99,
                    RequiredPermission = $"{entityName.ToLowerInvariant()}.view",
                    ActiveVersion = 1,
                    Version = 1,
                    version = 1,
                    status = "published",
                    SchemaJson = synthesizedJson,
                    IsSynthesized = true,
                    IsCustom = false,
                    IsDefaultSeed = false,
                    Versions = Array.Empty<object>()
                });
            }

            // Determine which version to serve
            UiPageVersion? selectedVersion = null;

            if (version.HasValue)
            {
                selectedVersion = page.Versions.FirstOrDefault(v => v.Version == version.Value);
            }
            else if (draft && page.DraftVersion.HasValue)
            {
                selectedVersion = page.Versions.FirstOrDefault(v => v.Version == page.DraftVersion.Value);
            }
            else if (page.PublishedVersion.HasValue)
            {
                selectedVersion = page.Versions.FirstOrDefault(v => v.Version == page.PublishedVersion.Value && v.IsPublished);
            }

            // Fallback to latest version
            selectedVersion ??= page.Versions.OrderByDescending(v => v.Version).FirstOrDefault();

            var isCustomPage = page.Versions.Any(v => v.ChangeSummary != null && !v.ChangeSummary.StartsWith("Default system schema") && !v.ChangeSummary.StartsWith("Auto-seeded"));

            return Ok(new
            {
                page.Id,
                page.PageKey,
                page.EntityName,
                page.Title,
                page.SubTitle,
                page.ModuleKey,
                page.ViewType,
                page.RoutePath,
                page.Icon,
                page.Status,
                page.PublishedVersion,
                page.DraftVersion,
                page.AddToNavigation,
                page.NavGroup,
                page.NavSortOrder,
                page.RequiredPermission,
                ActiveVersion = selectedVersion?.Version,
                Version = selectedVersion?.Version ?? 1,
                version = selectedVersion?.Version ?? 1,
                status = page.Status.ToLowerInvariant(),
                SchemaJson = selectedVersion?.SchemaJson ?? "{}",
                IsSynthesized = false,
                IsCustom = isCustomPage,
                IsDefaultSeed = !isCustomPage,
                Versions = page.Versions.OrderByDescending(v => v.Version).Select(v => new
                {
                    v.Id,
                    v.Version,
                    v.ChangeSummary,
                    v.IsPublished,
                    v.PublishedAt,
                    v.CreatedAt
                })
            });
        }

        private static string InferEntityNameFromKey(string key)
        {
            var raw = key.Contains('.') ? key.Split('.').Last() : key;
            var segments = raw.Split(new[] { '-', '_' }, StringSplitOptions.RemoveEmptyEntries);
            var sb = new System.Text.StringBuilder();

            for (int i = 0; i < segments.Length; i++)
            {
                var word = segments[i];
                if (i == segments.Length - 1)
                {
                    if (word.EndsWith("ies", StringComparison.OrdinalIgnoreCase) && word.Length > 3)
                        word = word.Substring(0, word.Length - 3) + "y";
                    else if (word.EndsWith("ges", StringComparison.OrdinalIgnoreCase) ||
                             word.EndsWith("ces", StringComparison.OrdinalIgnoreCase) ||
                             word.EndsWith("tes", StringComparison.OrdinalIgnoreCase) ||
                             word.EndsWith("des", StringComparison.OrdinalIgnoreCase) ||
                             word.EndsWith("nes", StringComparison.OrdinalIgnoreCase) ||
                             word.EndsWith("res", StringComparison.OrdinalIgnoreCase) ||
                             word.EndsWith("mes", StringComparison.OrdinalIgnoreCase) ||
                             word.EndsWith("ves", StringComparison.OrdinalIgnoreCase))
                        word = word.Substring(0, word.Length - 1);
                    else if ((word.EndsWith("ches", StringComparison.OrdinalIgnoreCase) ||
                              word.EndsWith("shes", StringComparison.OrdinalIgnoreCase) ||
                              word.EndsWith("xes", StringComparison.OrdinalIgnoreCase)) && word.Length > 4)
                        word = word.Substring(0, word.Length - 2);
                    else if (word.EndsWith("s", StringComparison.OrdinalIgnoreCase) && !word.EndsWith("ss", StringComparison.OrdinalIgnoreCase) && word.Length > 2)
                        word = word.Substring(0, word.Length - 1);
                }

                if (!string.IsNullOrEmpty(word))
                {
                    sb.Append(char.ToUpperInvariant(word[0]));
                    if (word.Length > 1) sb.Append(word.Substring(1));
                }
            }

            return sb.Length == 0 ? "Record" : sb.ToString();
        }

        [HttpPost]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> CreatePage([FromBody] CreatePageDefinitionDto dto, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(dto.PageKey) || string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.EntityName))
            {
                return BadRequest(new { message = "PageKey, Title, and EntityName are required." });
            }

            var tenantId = _tenantAccessor.GetTenantId();
            var key = dto.PageKey.Trim().ToLowerInvariant();

            var exists = await _db.UiPageDefinitions
                .AnyAsync(p => p.TenantId == tenantId && p.PageKey.ToLower() == key && !p.IsDeleted, ct);

            if (exists)
            {
                return BadRequest(new { message = $"A page with key '{key}' already exists." });
            }

            var page = new UiPageDefinition
            {
                TenantId = tenantId,
                PageKey = key,
                EntityName = dto.EntityName.Trim(),
                Title = dto.Title.Trim(),
                SubTitle = dto.SubTitle?.Trim(),
                ModuleKey = string.IsNullOrWhiteSpace(dto.ModuleKey) ? "platform" : dto.ModuleKey.Trim().ToLowerInvariant(),
                ViewType = dto.ViewType ?? "table",
                RoutePath = dto.RoutePath?.Trim() ?? $"/{dto.ModuleKey}/{key}",
                Icon = string.IsNullOrWhiteSpace(dto.Icon) ? "Layers" : dto.Icon.Trim(),
                Status = "Draft",
                DraftVersion = 1,
                AddToNavigation = dto.AddToNavigation,
                NavGroup = dto.NavGroup?.Trim(),
                NavSortOrder = dto.NavSortOrder,
                RequiredPermission = dto.RequiredPermission?.Trim(),
                CreatedAt = DateTime.UtcNow,
            };

            var initialVersion = new UiPageVersion
            {
                TenantId = tenantId,
                PageDefinition = page,
                Version = 1,
                SchemaJson = string.IsNullOrWhiteSpace(dto.InitialSchemaJson) ? "{}" : dto.InitialSchemaJson,
                ChangeSummary = "Initial draft creation",
                IsPublished = false,
                CreatedAt = DateTime.UtcNow
            };

            page.Versions.Add(initialVersion);
            _db.UiPageDefinitions.Add(page);
            await _db.SaveChangesAsync(ct);

            return CreatedAtAction(nameof(GetPage), new { pageKey = page.PageKey }, new
            {
                page.Id,
                page.PageKey,
                page.Title,
                page.EntityName,
                page.Status,
                ActiveVersion = 1
            });
        }

        [HttpPut("{pageKey}")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> SaveDraft(string pageKey, [FromBody] SavePageSchemaDraftDto dto, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var key = pageKey.Trim().ToLowerInvariant();

            var page = await _db.UiPageDefinitions
                .Include(p => p.Versions)
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.PageKey.ToLower() == key && !p.IsDeleted, ct);

            if (page == null)
            {
                return NotFound(new { message = $"Page '{pageKey}' not found." });
            }

            // Update page header info if supplied
            if (!string.IsNullOrWhiteSpace(dto.Title)) page.Title = dto.Title.Trim();
            if (dto.SubTitle != null) page.SubTitle = dto.SubTitle.Trim();
            if (!string.IsNullOrWhiteSpace(dto.RoutePath)) page.RoutePath = dto.RoutePath.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Icon)) page.Icon = dto.Icon.Trim();
            if (dto.NavGroup != null) page.NavGroup = dto.NavGroup.Trim();
            if (dto.NavSortOrder.HasValue) page.NavSortOrder = dto.NavSortOrder.Value;
            if (dto.RequiredPermission != null) page.RequiredPermission = dto.RequiredPermission.Trim();
            page.UpdatedAt = DateTime.UtcNow;

            // Check if active draft version exists
            var nextVersionNum = page.Versions.Count > 0 ? page.Versions.Max(v => v.Version) + 1 : 1;
            var currentDraft = page.DraftVersion.HasValue
                ? page.Versions.FirstOrDefault(v => v.Version == page.DraftVersion.Value && !v.IsPublished)
                : null;

            if (currentDraft != null)
            {
                // Update existing draft
                currentDraft.SchemaJson = dto.SchemaJson;
                currentDraft.ChangeSummary = dto.ChangeSummary ?? currentDraft.ChangeSummary;
                currentDraft.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new draft version
                var newDraft = new UiPageVersion
                {
                    TenantId = tenantId,
                    PageDefinitionId = page.Id,
                    Version = nextVersionNum,
                    SchemaJson = dto.SchemaJson,
                    ChangeSummary = dto.ChangeSummary ?? "Working draft",
                    IsPublished = false,
                    CreatedAt = DateTime.UtcNow
                };
                page.Versions.Add(newDraft);
                page.DraftVersion = nextVersionNum;
            }

            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Draft saved successfully.", draftVersion = page.DraftVersion });
        }

        [HttpPost("{pageKey}/review")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> SubmitForReview(string pageKey, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var key = pageKey.Trim().ToLowerInvariant();

            var page = await _db.UiPageDefinitions
                .Include(p => p.Versions)
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.PageKey.ToLower() == key && !p.IsDeleted, ct);

            if (page == null)
            {
                return NotFound(new { message = $"Page '{pageKey}' not found." });
            }

            page.Status = "Review";
            page.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);
            return Ok(new
            {
                message = $"Page '{page.Title}' submitted for review.",
                status = page.Status,
                draftVersion = page.DraftVersion
            });
        }

        [HttpPost("{pageKey}/publish")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> Publish(string pageKey, [FromBody] PublishPageDto? dto, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var key = pageKey.Trim().ToLowerInvariant();

            var page = await _db.UiPageDefinitions
                .Include(p => p.Versions)
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.PageKey.ToLower() == key && !p.IsDeleted, ct);

            if (page == null)
            {
                return NotFound(new { message = $"Page '{pageKey}' not found." });
            }

            var targetVersionNum = dto?.Version ?? page.DraftVersion ?? page.Versions.Max(v => v.Version);
            var versionToPublish = page.Versions.FirstOrDefault(v => v.Version == targetVersionNum);

            if (versionToPublish == null)
            {
                return BadRequest(new { message = $"Version {targetVersionNum} does not exist." });
            }

            // Validate schema json
            try
            {
                using var doc = JsonDocument.Parse(versionToPublish.SchemaJson);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Schema JSON is invalid.", error = ex.Message });
            }

            // Unpublish previous versions
            foreach (var v in page.Versions)
            {
                v.IsPublished = false;
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userId = Guid.TryParse(userIdClaim, out var parsedUid) ? parsedUid : (Guid?)null;

            versionToPublish.IsPublished = true;
            versionToPublish.PublishedAt = DateTime.UtcNow;
            versionToPublish.PublishedBy = userId;
            if (!string.IsNullOrWhiteSpace(dto?.ChangeSummary))
            {
                versionToPublish.ChangeSummary = dto.ChangeSummary.Trim();
            }

            page.Status = "Published";
            page.PublishedVersion = versionToPublish.Version;
            page.DraftVersion = null;
            page.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);
            return Ok(new
            {
                message = $"Page '{page.Title}' published successfully at Version {versionToPublish.Version}.",
                publishedVersion = versionToPublish.Version,
                routePath = page.RoutePath
            });
        }

        [HttpPost("{pageKey}/rollback")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> Rollback(string pageKey, [FromBody] RollbackPageDto dto, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var key = pageKey.Trim().ToLowerInvariant();

            var page = await _db.UiPageDefinitions
                .Include(p => p.Versions)
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.PageKey.ToLower() == key && !p.IsDeleted, ct);

            if (page == null) return NotFound();

            var target = page.Versions.FirstOrDefault(v => v.Version == dto.TargetVersion);
            if (target == null)
            {
                return BadRequest(new { message = $"Version {dto.TargetVersion} does not exist." });
            }

            foreach (var v in page.Versions)
            {
                v.IsPublished = false;
            }

            target.IsPublished = true;
            target.PublishedAt = DateTime.UtcNow;

            page.PublishedVersion = target.Version;
            page.Status = "Published";
            page.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);
            return Ok(new { message = $"Rolled back to Version {target.Version}.", publishedVersion = target.Version });
        }

        [HttpDelete("{pageKey}")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> DeletePage(string pageKey, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var key = pageKey.Trim().ToLowerInvariant();

            var page = await _db.UiPageDefinitions
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.PageKey.ToLower() == key && !p.IsDeleted, ct);

            if (page == null) return NotFound();

            page.IsDeleted = true;
            page.Status = "Archived";
            page.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            return Ok(new { message = $"Page '{page.Title}' archived.", status = "Archived" });
        }

        [HttpPost("sync-catalog")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> SyncCatalog([FromQuery] bool allTenants = false, CancellationToken ct = default)
        {
            var seeder = new PageSchemaSeeder();
            if (allTenants && User.IsInRole("SuperAdmin"))
            {
                var count = await seeder.SyncAllTenantsCatalogAsync(_db, _tenantAccessor);
                return Ok(new { success = true, message = "Successfully synced metadata catalog across all active tenants.", seededCount = count });
            }
            else
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var count = await seeder.EnsurePageSchemasForTenantAsync(_db, tenantId);
                return Ok(new { success = true, message = "Successfully synced metadata catalog for tenant.", tenantId, seededCount = count });
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 3. Default Page Seeding
        // ─────────────────────────────────────────────────────────────────────

        private async Task EnsureDefaultPagesSeededAsync(Guid tenantId, CancellationToken ct)
        {
            var seeder = new PageSchemaSeeder();
            await seeder.EnsurePageSchemasForTenantAsync(_db, tenantId);

            await SeedEmployeeMasterAsync(tenantId, ct);
            await SeedShiftsAsync(tenantId, ct);
            await SeedLeaveAsync(tenantId, ct);
            await SeedDepartmentsAsync(tenantId, ct);
            await SeedDesignationsAsync(tenantId, ct);
            await SeedCustomersAsync(tenantId, ct);
            await SeedVendorsAsync(tenantId, ct);
            await SeedItemsAsync(tenantId, ct);
            await SeedUsersAsync(tenantId, ct);
        }

        private async Task SeedPageHelperAsync(
            Guid tenantId,
            string pageKey,
            string entityName,
            string title,
            string subTitle,
            string moduleKey,
            string routePath,
            string icon,
            string navGroup,
            int navSortOrder,
            string requiredPermission,
            string schemaJson,
            CancellationToken ct)
        {
            var exists = await _db.UiPageDefinitions
                .AnyAsync(p => p.TenantId == tenantId && p.PageKey == pageKey && !p.IsDeleted, ct);

            if (exists) return;

            var page = new UiPageDefinition
            {
                TenantId = tenantId,
                PageKey = pageKey,
                EntityName = entityName,
                Title = title,
                SubTitle = subTitle,
                ModuleKey = moduleKey,
                ViewType = "table",
                RoutePath = routePath,
                Icon = icon,
                Status = "Published",
                PublishedVersion = 1,
                AddToNavigation = true,
                NavGroup = navGroup,
                NavSortOrder = navSortOrder,
                RequiredPermission = requiredPermission,
                CreatedAt = DateTime.UtcNow
            };

            var version = new UiPageVersion
            {
                TenantId = tenantId,
                PageDefinition = page,
                Version = 1,
                SchemaJson = schemaJson,
                ChangeSummary = $"Default system schema for {title}",
                IsPublished = true,
                PublishedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            page.Versions.Add(version);
            _db.UiPageDefinitions.Add(page);
            await _db.SaveChangesAsync(ct);
        }

        private async Task SeedEmployeeMasterAsync(Guid tenantId, CancellationToken ct)
        {
            var schemaJson = """
            {
              "schemaVersion": "1",
              "pageKey": "hrms.employees",
              "title": "Employee Master",
              "subTitle": "Complete workforce records, contract status, and organizational deployment.",
              "entityName": "Employee",
              "viewType": "table",
              "apiEndpoint": "/api/v1/hrms/employees",
              "kpiMetrics": [
                { "label": "Total Workforce", "tone": "info", "icon": "Users", "subtext": "Registered personnel" },
                { "label": "Active Personnel", "tone": "positive", "icon": "CheckCircle2", "subtext": "Active payroll" },
                { "label": "On Leave / Notice", "tone": "warning", "icon": "Clock", "subtext": "Temporary absence" }
              ],
              "columns": [
                { "key": "employeeCode", "label": "Emp Code", "dataType": "string", "sortable": true, "sortOrder": 1, "width": "120px" },
                { "key": "fullName", "label": "Employee Name", "dataType": "string", "sortable": true, "sortOrder": 2, "width": "220px" },
                { "key": "workEmail", "label": "Work Email", "dataType": "string", "sortable": false, "sortOrder": 3, "width": "200px" },
                { "key": "phone", "label": "Phone", "dataType": "string", "sortable": false, "sortOrder": 4, "width": "140px" },
                { "key": "departmentName", "label": "Department", "dataType": "string", "sortable": true, "filterable": true, "sortOrder": 5, "width": "150px" },
                { "key": "designationName", "label": "Designation", "dataType": "string", "sortable": true, "sortOrder": 6, "width": "160px" },
                { "key": "employmentType", "label": "Type", "dataType": "badge", "sortable": true, "filterable": true, "sortOrder": 7, "width": "130px" },
                { "key": "status", "label": "Status", "dataType": "badge", "sortable": true, "filterable": true, "sortOrder": 8, "width": "120px" },
                { "key": "dateOfJoining", "label": "Joining Date", "dataType": "date", "sortable": true, "sortOrder": 9, "width": "130px" }
              ],
              "filters": [
                { "key": "search", "label": "Search Employee", "filterType": "text", "placeholder": "Search code, name, email, department…" },
                {
                  "key": "status",
                  "label": "Status",
                  "filterType": "select",
                  "options": [
                    { "value": "all", "label": "All Statuses" },
                    { "value": "Active", "label": "Active" },
                    { "value": "OnLeave", "label": "On Leave" },
                    { "value": "Inactive", "label": "Inactive" },
                    { "value": "Terminated", "label": "Terminated" }
                  ]
                },
                {
                  "key": "employmentType",
                  "label": "Employment Type",
                  "filterType": "select",
                  "options": [
                    { "value": "all", "label": "All Types" },
                    { "value": "Permanent", "label": "Permanent" },
                    { "value": "Contract", "label": "Contract" },
                    { "value": "Intern", "label": "Intern" },
                    { "value": "Probationary", "label": "Probationary" }
                  ]
                }
              ],
              "form": {
                "sections": [
                  {
                    "title": "Personal Information",
                    "description": "Identity, contacts, and basic demographic attributes.",
                    "fields": [
                      { "key": "fullName", "label": "Full Name", "fieldType": "text", "required": true, "placeholder": "First and Last Name" },
                      { "key": "employeeCode", "label": "Employee Code", "fieldType": "text", "required": true, "placeholder": "EMP-XXXX" },
                      { "key": "workEmail", "label": "Work Email", "fieldType": "email", "required": true, "placeholder": "employee@uabindia.com" },
                      { "key": "phone", "label": "Phone Number", "fieldType": "phone", "required": false, "placeholder": "+91 9876543210" },
                      {
                        "key": "gender",
                        "label": "Gender",
                        "fieldType": "select",
                        "required": false,
                        "options": [
                          { "value": "Male", "label": "Male" },
                          { "value": "Female", "label": "Female" },
                          { "value": "Other", "label": "Other" }
                        ]
                      },
                      { "key": "dateOfBirth", "label": "Date of Birth", "fieldType": "date", "required": false }
                    ]
                  },
                  {
                    "title": "Employment & Deployment",
                    "description": "Corporate department, job role, and location placement.",
                    "fields": [
                      {
                        "key": "status",
                        "label": "Employment Status",
                        "fieldType": "select",
                        "required": true,
                        "defaultValue": "Active",
                        "options": [
                          { "value": "Active", "label": "Active" },
                          { "value": "OnLeave", "label": "On Leave" },
                          { "value": "Inactive", "label": "Inactive" },
                          { "value": "Terminated", "label": "Terminated" }
                        ]
                      },
                      {
                        "key": "employmentType",
                        "label": "Employment Type",
                        "fieldType": "select",
                        "required": true,
                        "defaultValue": "Permanent",
                        "options": [
                          { "value": "Permanent", "label": "Permanent" },
                          { "value": "Contract", "label": "Contract" },
                          { "value": "Intern", "label": "Intern" },
                          { "value": "Probationary", "label": "Probationary" }
                        ]
                      },
                      {
                        "key": "departmentId",
                        "label": "Department",
                        "fieldType": "lookup",
                        "required": false,
                        "optionsEndpoint": "/api/v1/org/departments",
                        "lookupValueKey": "id",
                        "lookupLabelKey": "name"
                      },
                      {
                        "key": "designationId",
                        "label": "Designation",
                        "fieldType": "lookup",
                        "required": false,
                        "optionsEndpoint": "/api/v1/org/designations",
                        "lookupValueKey": "id",
                        "lookupLabelKey": "name"
                      },
                      { "key": "dateOfJoining", "label": "Date of Joining", "fieldType": "date", "required": true },
                      { "key": "workLocation", "label": "Work Location", "fieldType": "text", "required": false, "placeholder": "e.g. Headquarters" }
                    ]
                  },
                  {
                    "title": "Statutory & Banking",
                    "description": "Payroll compliance, bank remittance, and tax ID credentials.",
                    "fields": [
                      { "key": "monthlyCtc", "label": "Monthly CTC (Gross)", "fieldType": "currency", "required": false, "placeholder": "₹ Gross Monthly" },
                      { "key": "basicSalary", "label": "Basic Salary", "fieldType": "currency", "required": false, "placeholder": "₹ Basic Monthly" },
                      { "key": "pan", "label": "PAN Card", "fieldType": "text", "required": false, "placeholder": "ABCDE1234F" },
                      { "key": "uan", "label": "UAN Number", "fieldType": "text", "required": false },
                      { "key": "bankName", "label": "Bank Name", "fieldType": "text", "required": false },
                      { "key": "bankAccountNumber", "label": "Account Number", "fieldType": "text", "required": false },
                      { "key": "bankIfsc", "label": "IFSC Code", "fieldType": "text", "required": false }
                    ]
                  }
                ]
              },
              "actions": [
                { "key": "create", "label": "New Employee", "actionType": "button", "variant": "primary", "requiredPermission": "employee.create" },
                { "key": "edit", "label": "Edit", "actionType": "button", "variant": "secondary", "requiredPermission": "employee.edit" },
                { "key": "delete", "label": "Delete", "actionType": "button", "variant": "danger", "requiredPermission": "employee.delete" },
                { "key": "export", "label": "Export CSV", "actionType": "button", "variant": "secondary", "requiredPermission": "employee.view" }
              ]
            }
            """;

            await SeedPageHelperAsync(tenantId, "hrms.employees", "Employee", "Employee Master",
                "Complete workforce records, contract status, and organizational deployment.",
                "hrms", "/hrms/employees", "Users", "Core HR", 1, "employee.view", schemaJson, ct);
        }

        private async Task SeedShiftsAsync(Guid tenantId, CancellationToken ct)
        {
            var schemaJson = """
            {
              "schemaVersion": "1",
              "pageKey": "hrms.shifts",
              "title": "Shift Rosters & Rules",
              "subTitle": "Manage work timing schedules, grace intervals, night shifts, and attendance thresholds.",
              "entityName": "Shift",
              "viewType": "table",
              "apiEndpoint": "/api/v1/hrms/shifts",
              "kpiMetrics": [
                { "label": "Active Rosters", "tone": "info", "icon": "Clock", "subtext": "Configured shift profiles" },
                { "label": "Default Shift", "tone": "positive", "icon": "CheckCircle2", "subtext": "Auto-assigned shift" }
              ],
              "columns": [
                { "key": "code", "label": "Shift Code", "dataType": "string", "sortable": true, "sortOrder": 1, "width": "120px" },
                { "key": "name", "label": "Shift Name", "dataType": "string", "sortable": true, "sortOrder": 2, "width": "220px" },
                { "key": "startTime", "label": "Start Time", "dataType": "string", "sortable": true, "sortOrder": 3, "width": "130px" },
                { "key": "endTime", "label": "End Time", "dataType": "string", "sortable": true, "sortOrder": 4, "width": "130px" },
                { "key": "graceMinutes", "label": "Grace (Mins)", "dataType": "number", "sortable": true, "sortOrder": 5, "width": "120px" },
                { "key": "halfDayMinutes", "label": "Half-Day (Mins)", "dataType": "number", "sortable": true, "sortOrder": 6, "width": "140px" },
                { "key": "isNightShift", "label": "Night Shift", "dataType": "boolean", "sortable": true, "sortOrder": 7, "width": "120px" },
                { "key": "status", "label": "Status", "dataType": "badge", "sortable": true, "sortOrder": 8, "width": "120px" }
              ],
              "filters": [
                { "key": "search", "label": "Search Shifts", "filterType": "text", "placeholder": "Search shift name, code…" },
                {
                  "key": "status",
                  "label": "Status",
                  "filterType": "select",
                  "options": [
                    { "value": "all", "label": "All Statuses" },
                    { "value": "Active", "label": "Active" },
                    { "value": "Inactive", "label": "Inactive" }
                  ]
                }
              ],
              "form": {
                "sections": [
                  {
                    "title": "Shift Timing & Rules",
                    "description": "Define working hours, punch tolerances, and half-day thresholds.",
                    "fields": [
                      { "key": "code", "label": "Shift Code", "fieldType": "text", "required": true, "placeholder": "SH-GEN" },
                      { "key": "name", "label": "Shift Name", "fieldType": "text", "required": true, "placeholder": "General Morning Shift" },
                      { "key": "startTime", "label": "Start Time", "fieldType": "text", "required": true, "placeholder": "09:00" },
                      { "key": "endTime", "label": "End Time", "fieldType": "text", "required": true, "placeholder": "18:00" },
                      { "key": "graceMinutes", "label": "Grace Time (Minutes)", "fieldType": "number", "required": false, "defaultValue": 15 },
                      { "key": "halfDayMinutes", "label": "Half Day Threshold (Minutes)", "fieldType": "number", "required": false, "defaultValue": 240 },
                      { "key": "isNightShift", "label": "Night Shift", "fieldType": "boolean", "required": false, "defaultValue": false },
                      { "key": "isDefault", "label": "Default Company Shift", "fieldType": "boolean", "required": false, "defaultValue": false },
                      {
                        "key": "status",
                        "label": "Status",
                        "fieldType": "select",
                        "required": true,
                        "defaultValue": "Active",
                        "options": [
                          { "value": "Active", "label": "Active" },
                          { "value": "Inactive", "label": "Inactive" }
                        ]
                      }
                    ]
                  }
                ]
              },
              "actions": [
                { "key": "create", "label": "New Shift", "actionType": "button", "variant": "primary", "requiredPermission": "shift.create" },
                { "key": "edit", "label": "Edit", "actionType": "button", "variant": "secondary", "requiredPermission": "shift.edit" },
                { "key": "delete", "label": "Delete", "actionType": "button", "variant": "danger", "requiredPermission": "shift.delete" },
                { "key": "export", "label": "Export CSV", "actionType": "button", "variant": "secondary", "requiredPermission": "shift.view" }
              ]
            }
            """;

            await SeedPageHelperAsync(tenantId, "hrms.shifts", "Shift", "Shift Rosters & Rules",
                "Manage work timing schedules, grace intervals, night shifts, and attendance thresholds.",
                "hrms", "/hrms/shifts", "Clock", "Core HR", 2, "shift.view", schemaJson, ct);
        }

        private async Task SeedLeaveAsync(Guid tenantId, CancellationToken ct)
        {
            var schemaJson = """
            {
              "schemaVersion": "1",
              "pageKey": "hrms.leave",
              "title": "Leave Applications & Balances",
              "subTitle": "Review leave requests, statutory entitlements, and approval workflows.",
              "entityName": "Leave",
              "viewType": "table",
              "apiEndpoint": "/api/v1/hrms/leave",
              "kpiMetrics": [
                { "label": "Applications", "tone": "info", "icon": "Calendar", "subtext": "Submitted leave requests" },
                { "label": "Pending Approval", "tone": "warning", "icon": "Clock", "subtext": "Awaiting manager review" }
              ],
              "columns": [
                { "key": "employeeCode", "label": "Emp Code", "dataType": "string", "sortable": true, "sortOrder": 1, "width": "120px" },
                { "key": "leaveType", "label": "Leave Type", "dataType": "badge", "sortable": true, "sortOrder": 2, "width": "140px" },
                { "key": "startDate", "label": "Start Date", "dataType": "date", "sortable": true, "sortOrder": 3, "width": "130px" },
                { "key": "endDate", "label": "End Date", "dataType": "date", "sortable": true, "sortOrder": 4, "width": "130px" },
                { "key": "daysRequested", "label": "Days", "dataType": "number", "sortable": true, "sortOrder": 5, "width": "100px" },
                { "key": "reason", "label": "Reason", "dataType": "string", "sortable": false, "sortOrder": 6, "width": "240px" },
                { "key": "status", "label": "Status", "dataType": "badge", "sortable": true, "sortOrder": 7, "width": "130px" }
              ],
              "filters": [
                { "key": "search", "label": "Search Requests", "filterType": "text", "placeholder": "Search employee code, reason…" },
                {
                  "key": "status",
                  "label": "Status",
                  "filterType": "select",
                  "options": [
                    { "value": "all", "label": "All Statuses" },
                    { "value": "Pending", "label": "Pending" },
                    { "value": "Approved", "label": "Approved" },
                    { "value": "Rejected", "label": "Rejected" },
                    { "value": "Cancelled", "label": "Cancelled" }
                  ]
                }
              ],
              "form": {
                "sections": [
                  {
                    "title": "Leave Application",
                    "description": "Enter leave duration, type, and justification.",
                    "fields": [
                      { "key": "employeeCode", "label": "Employee Code", "fieldType": "text", "required": true, "placeholder": "EMP-XXXX" },
                      {
                        "key": "leaveType",
                        "label": "Leave Type",
                        "fieldType": "select",
                        "required": true,
                        "defaultValue": "Casual",
                        "options": [
                          { "value": "Casual", "label": "Casual Leave" },
                          { "value": "Sick", "label": "Sick Leave" },
                          { "value": "Earned", "label": "Earned / Privilege Leave" },
                          { "value": "Maternity", "label": "Maternity Leave" },
                          { "value": "Paternity", "label": "Paternity Leave" },
                          { "value": "CompOff", "label": "Compensatory Off" }
                        ]
                      },
                      { "key": "startDate", "label": "Start Date", "fieldType": "date", "required": true },
                      { "key": "endDate", "label": "End Date", "fieldType": "date", "required": true },
                      { "key": "daysRequested", "label": "Days Count", "fieldType": "number", "required": true, "defaultValue": 1 },
                      { "key": "reason", "label": "Reason / Justification", "fieldType": "textarea", "required": true, "placeholder": "Reason for leave..." }
                    ]
                  }
                ]
              },
              "actions": [
                { "key": "create", "label": "Apply Leave", "actionType": "button", "variant": "primary", "requiredPermission": "leave.create" },
                { "key": "edit", "label": "Review", "actionType": "button", "variant": "secondary", "requiredPermission": "leave.edit" },
                { "key": "delete", "label": "Cancel", "actionType": "button", "variant": "danger", "requiredPermission": "leave.delete" },
                { "key": "export", "label": "Export CSV", "actionType": "button", "variant": "secondary", "requiredPermission": "leave.view" }
              ]
            }
            """;

            await SeedPageHelperAsync(tenantId, "hrms.leave", "Leave", "Leave Applications & Balances",
                "Review leave requests, statutory entitlements, and approval workflows.",
                "hrms", "/hrms/leave", "Calendar", "Core HR", 3, "leave.view", schemaJson, ct);
        }

        private async Task SeedDepartmentsAsync(Guid tenantId, CancellationToken ct)
        {
            var schemaJson = """
            {
              "schemaVersion": "1",
              "pageKey": "administration.departments",
              "title": "Department Master",
              "subTitle": "Configure organizational departments, cost allocation units, and reporting hierarchies.",
              "entityName": "Department",
              "viewType": "table",
              "apiEndpoint": "/api/v1/org/departments",
              "kpiMetrics": [
                { "label": "Total Departments", "tone": "info", "icon": "Building2", "subtext": "Operational units" }
              ],
              "columns": [
                { "key": "code", "label": "Dept Code", "dataType": "string", "sortable": true, "sortOrder": 1, "width": "120px" },
                { "key": "name", "label": "Department Name", "dataType": "string", "sortable": true, "sortOrder": 2, "width": "240px" },
                { "key": "parentDepartmentName", "label": "Parent Dept", "dataType": "string", "sortable": false, "sortOrder": 3, "width": "180px" },
                { "key": "isActive", "label": "Active", "dataType": "boolean", "sortable": true, "sortOrder": 4, "width": "100px" }
              ],
              "filters": [
                { "key": "search", "label": "Search Departments", "filterType": "text", "placeholder": "Search name, code…" }
              ],
              "form": {
                "sections": [
                  {
                    "title": "Department Details",
                    "description": "Department identity, hierarchy, and corporate alignment.",
                    "fields": [
                      { "key": "code", "label": "Department Code", "fieldType": "text", "required": true, "placeholder": "DEP-OPS" },
                      { "key": "name", "label": "Department Name", "fieldType": "text", "required": true, "placeholder": "Operations & Logistics" },
                      {
                        "key": "parentDepartmentId",
                        "label": "Parent Department",
                        "fieldType": "lookup",
                        "required": false,
                        "optionsEndpoint": "/api/v1/org/departments",
                        "lookupValueKey": "id",
                        "lookupLabelKey": "name"
                      },
                      { "key": "isActive", "label": "Active Status", "fieldType": "boolean", "required": false, "defaultValue": true }
                    ]
                  }
                ]
              },
              "actions": [
                { "key": "create", "label": "New Department", "actionType": "button", "variant": "primary", "requiredPermission": "department.create" },
                { "key": "edit", "label": "Edit", "actionType": "button", "variant": "secondary", "requiredPermission": "department.edit" },
                { "key": "delete", "label": "Delete", "actionType": "button", "variant": "danger", "requiredPermission": "department.delete" },
                { "key": "export", "label": "Export CSV", "actionType": "button", "variant": "secondary", "requiredPermission": "department.view" }
              ]
            }
            """;

            await SeedPageHelperAsync(tenantId, "administration.departments", "Department", "Department Master",
                "Configure organizational departments, cost allocation units, and reporting hierarchies.",
                "administration", "/administration/departments", "Building2", "Organization Architecture", 1, "department.view", schemaJson, ct);
        }

        private async Task SeedDesignationsAsync(Guid tenantId, CancellationToken ct)
        {
            var schemaJson = """
            {
              "schemaVersion": "1",
              "pageKey": "administration.designations",
              "title": "Designation & Job Grade Registry",
              "subTitle": "Manage corporate job titles, grade hierarchies, and organizational compensation bands.",
              "entityName": "Designation",
              "viewType": "table",
              "apiEndpoint": "/api/v1/org/designations",
              "kpiMetrics": [
                { "label": "Job Titles", "tone": "info", "icon": "Award", "subtext": "Registered job grades" }
              ],
              "columns": [
                { "key": "code", "label": "Designation Code", "dataType": "string", "sortable": true, "sortOrder": 1, "width": "130px" },
                { "key": "name", "label": "Job Title", "dataType": "string", "sortable": true, "sortOrder": 2, "width": "240px" },
                { "key": "grade", "label": "Job Grade", "dataType": "badge", "sortable": true, "sortOrder": 3, "width": "120px" },
                { "key": "level", "label": "Level", "dataType": "number", "sortable": true, "sortOrder": 4, "width": "100px" },
                { "key": "isActive", "label": "Active", "dataType": "boolean", "sortable": true, "sortOrder": 5, "width": "100px" }
              ],
              "filters": [
                { "key": "search", "label": "Search Designations", "filterType": "text", "placeholder": "Search title, code, grade…" }
              ],
              "form": {
                "sections": [
                  {
                    "title": "Job Role Definition",
                    "description": "Standardized title, compensation grade, and seniority ranking.",
                    "fields": [
                      { "key": "code", "label": "Designation Code", "fieldType": "text", "required": true, "placeholder": "DES-SR-ENG" },
                      { "key": "name", "label": "Designation Title", "fieldType": "text", "required": true, "placeholder": "Senior Software Architect" },
                      { "key": "grade", "label": "Pay / Job Grade", "fieldType": "text", "required": false, "placeholder": "L5 / Band C" },
                      { "key": "level", "label": "Hierarchy Level", "fieldType": "number", "required": false, "defaultValue": 1 },
                      { "key": "isActive", "label": "Active Status", "fieldType": "boolean", "required": false, "defaultValue": true }
                    ]
                  }
                ]
              },
              "actions": [
                { "key": "create", "label": "New Designation", "actionType": "button", "variant": "primary", "requiredPermission": "designation.create" },
                { "key": "edit", "label": "Edit", "actionType": "button", "variant": "secondary", "requiredPermission": "designation.edit" },
                { "key": "delete", "label": "Delete", "actionType": "button", "variant": "danger", "requiredPermission": "designation.delete" },
                { "key": "export", "label": "Export CSV", "actionType": "button", "variant": "secondary", "requiredPermission": "designation.view" }
              ]
            }
            """;

            await SeedPageHelperAsync(tenantId, "administration.designations", "Designation", "Designation & Job Grade Registry",
                "Manage corporate job titles, grade hierarchies, and organizational compensation bands.",
                "administration", "/administration/designations", "Award", "Organization Architecture", 2, "designation.view", schemaJson, ct);
        }

        private async Task SeedCustomersAsync(Guid tenantId, CancellationToken ct)
        {
            var schemaJson = """
            {
              "schemaVersion": "1",
              "pageKey": "crm.customers",
              "title": "Customer Master Ledger",
              "subTitle": "Enterprise client registry, GST statutory details, credit terms, and billing contacts.",
              "entityName": "Customer",
              "viewType": "table",
              "apiEndpoint": "/api/v1/crm/customers",
              "kpiMetrics": [
                { "label": "Total Accounts", "tone": "info", "icon": "Building2", "subtext": "Registered corporate clients" },
                { "label": "Active Billing", "tone": "positive", "icon": "CheckCircle2", "subtext": "Active credit lines" }
              ],
              "columns": [
                { "key": "code", "label": "Customer Code", "dataType": "string", "sortable": true, "sortOrder": 1, "width": "130px" },
                { "key": "companyName", "label": "Company Name", "dataType": "string", "sortable": true, "sortOrder": 2, "width": "240px" },
                { "key": "contactPerson", "label": "Contact Person", "dataType": "string", "sortable": false, "sortOrder": 3, "width": "180px" },
                { "key": "email", "label": "Email", "dataType": "string", "sortable": false, "sortOrder": 4, "width": "200px" },
                { "key": "phone", "label": "Phone", "dataType": "string", "sortable": false, "sortOrder": 5, "width": "140px" },
                { "key": "gstNumber", "label": "GSTIN", "dataType": "string", "sortable": false, "sortOrder": 6, "width": "160px" },
                { "key": "creditLimit", "label": "Credit Limit", "dataType": "currency", "sortable": true, "sortOrder": 7, "width": "140px" },
                { "key": "status", "label": "Status", "dataType": "badge", "sortable": true, "sortOrder": 8, "width": "120px" }
              ],
              "filters": [
                { "key": "search", "label": "Search Customers", "filterType": "text", "placeholder": "Search customer name, code, GSTIN…" },
                {
                  "key": "status",
                  "label": "Status",
                  "filterType": "select",
                  "options": [
                    { "value": "all", "label": "All Statuses" },
                    { "value": "Active", "label": "Active" },
                    { "value": "Inactive", "label": "Inactive" },
                    { "value": "Hold", "label": "On Hold" }
                  ]
                }
              ],
              "form": {
                "sections": [
                  {
                    "title": "Entity Information",
                    "description": "Legal entity name, trade name, and key contact coordinates.",
                    "fields": [
                      { "key": "code", "label": "Customer Code", "fieldType": "text", "required": true, "placeholder": "CUST-XXXX" },
                      { "key": "companyName", "label": "Corporate Name", "fieldType": "text", "required": true, "placeholder": "Acme Global Solutions Pvt Ltd" },
                      { "key": "contactPerson", "label": "Primary Contact", "fieldType": "text", "required": false, "placeholder": "Full Name" },
                      { "key": "email", "label": "Billing Email", "fieldType": "email", "required": true, "placeholder": "billing@acmeglobal.com" },
                      { "key": "phone", "label": "Phone Number", "fieldType": "phone", "required": false, "placeholder": "+91 9876543210" }
                    ]
                  },
                  {
                    "title": "Statutory & Credit Terms",
                    "description": "Indian tax compliance, payment cycles, and exposure threshold.",
                    "fields": [
                      { "key": "gstNumber", "label": "GSTIN Identification", "fieldType": "text", "required": false, "placeholder": "27AAAAA0000A1Z5" },
                      { "key": "panNumber", "label": "Permanent Account Number (PAN)", "fieldType": "text", "required": false, "placeholder": "AAAAA0000A" },
                      { "key": "creditLimit", "label": "Credit Limit (₹)", "fieldType": "currency", "required": false, "defaultValue": 100000 },
                      { "key": "paymentTermsDays", "label": "Payment Terms (Days)", "fieldType": "number", "required": false, "defaultValue": 30 },
                      {
                        "key": "status",
                        "label": "Account Status",
                        "fieldType": "select",
                        "required": true,
                        "defaultValue": "Active",
                        "options": [
                          { "value": "Active", "label": "Active" },
                          { "value": "Inactive", "label": "Inactive" },
                          { "value": "Hold", "label": "On Credit Hold" }
                        ]
                      }
                    ]
                  }
                ]
              },
              "actions": [
                { "key": "create", "label": "New Customer", "actionType": "button", "variant": "primary", "requiredPermission": "customer.create" },
                { "key": "edit", "label": "Edit", "actionType": "button", "variant": "secondary", "requiredPermission": "customer.edit" },
                { "key": "delete", "label": "Delete", "actionType": "button", "variant": "danger", "requiredPermission": "customer.delete" },
                { "key": "export", "label": "Export CSV", "actionType": "button", "variant": "secondary", "requiredPermission": "customer.view" }
              ]
            }
            """;

            await SeedPageHelperAsync(tenantId, "crm.customers", "Customer", "Customer Master Ledger",
                "Enterprise client registry, GST statutory details, credit terms, and billing contacts.",
                "crm", "/crm/customers", "UserCheck", "Sales & CRM", 1, "customer.view", schemaJson, ct);
        }

        private async Task SeedVendorsAsync(Guid tenantId, CancellationToken ct)
        {
            var schemaJson = """
            {
              "schemaVersion": "1",
              "pageKey": "procurement.vendors",
              "title": "Supplier & Vendor Directory",
              "subTitle": "Procurement suppliers, compliance verification, GST credentials, and vendor ratings.",
              "entityName": "Vendor",
              "viewType": "table",
              "apiEndpoint": "/api/v1/vendors",
              "kpiMetrics": [
                { "label": "Active Suppliers", "tone": "info", "icon": "Truck", "subtext": "Approved procurement partners" },
                { "label": "Verified GSTIN", "tone": "positive", "icon": "CheckCircle2", "subtext": "Statutory compliant" }
              ],
              "columns": [
                { "key": "code", "label": "Vendor Code", "dataType": "string", "sortable": true, "sortOrder": 1, "width": "130px" },
                { "key": "companyName", "label": "Vendor Name", "dataType": "string", "sortable": true, "sortOrder": 2, "width": "240px" },
                { "key": "contactPerson", "label": "Contact Person", "dataType": "string", "sortable": false, "sortOrder": 3, "width": "180px" },
                { "key": "email", "label": "Email", "dataType": "string", "sortable": false, "sortOrder": 4, "width": "200px" },
                { "key": "phone", "label": "Phone", "dataType": "string", "sortable": false, "sortOrder": 5, "width": "140px" },
                { "key": "gstNumber", "label": "GSTIN", "dataType": "string", "sortable": false, "sortOrder": 6, "width": "160px" },
                { "key": "vendorCategory", "label": "Category", "dataType": "badge", "sortable": true, "sortOrder": 7, "width": "140px" },
                { "key": "rating", "label": "Rating", "dataType": "number", "sortable": true, "sortOrder": 8, "width": "100px" },
                { "key": "status", "label": "Status", "dataType": "badge", "sortable": true, "sortOrder": 9, "width": "120px" }
              ],
              "filters": [
                { "key": "search", "label": "Search Vendors", "filterType": "text", "placeholder": "Search supplier name, code, GSTIN…" },
                {
                  "key": "status",
                  "label": "Status",
                  "filterType": "select",
                  "options": [
                    { "value": "all", "label": "All Statuses" },
                    { "value": "Active", "label": "Active" },
                    { "value": "Inactive", "label": "Inactive" },
                    { "value": "Blacklisted", "label": "Blacklisted" }
                  ]
                }
              ],
              "form": {
                "sections": [
                  {
                    "title": "Vendor Profile",
                    "description": "Supplier business identity, classification, and primary liaison.",
                    "fields": [
                      { "key": "code", "label": "Vendor Code", "fieldType": "text", "required": true, "placeholder": "VEN-XXXX" },
                      { "key": "companyName", "label": "Supplier / Business Name", "fieldType": "text", "required": true, "placeholder": "Industrial Tech Supplies" },
                      { "key": "contactPerson", "label": "Contact Person", "fieldType": "text", "required": false, "placeholder": "Representative Name" },
                      { "key": "email", "label": "Procurement Email", "fieldType": "email", "required": true, "placeholder": "sales@vendor.com" },
                      { "key": "phone", "label": "Phone Number", "fieldType": "phone", "required": false, "placeholder": "+91 9876543210" },
                      {
                        "key": "vendorCategory",
                        "label": "Vendor Category",
                        "fieldType": "select",
                        "required": false,
                        "defaultValue": "RawMaterials",
                        "options": [
                          { "value": "RawMaterials", "label": "Raw Materials" },
                          { "value": "Services", "label": "Services & Subcontracting" },
                          { "value": "Hardware", "label": "Capital Goods & Machinery" },
                          { "value": "Logistics", "label": "Freight & Transport" }
                        ]
                      }
                    ]
                  },
                  {
                    "title": "Statutory & Quality Compliance",
                    "description": "GST credentials, PAN identity, and performance score.",
                    "fields": [
                      { "key": "gstNumber", "label": "GSTIN Identification", "fieldType": "text", "required": false, "placeholder": "07AAAAA0000A1Z5" },
                      { "key": "panNumber", "label": "PAN Identification", "fieldType": "text", "required": false, "placeholder": "AAAAA0000A" },
                      { "key": "rating", "label": "Vendor Quality Rating (1-5)", "fieldType": "number", "required": false, "defaultValue": 5 },
                      {
                        "key": "status",
                        "label": "Account Status",
                        "fieldType": "select",
                        "required": true,
                        "defaultValue": "Active",
                        "options": [
                          { "value": "Active", "label": "Active" },
                          { "value": "Inactive", "label": "Inactive" },
                          { "value": "Blacklisted", "label": "Blacklisted" }
                        ]
                      }
                    ]
                  }
                ]
              },
              "actions": [
                { "key": "create", "label": "New Vendor", "actionType": "button", "variant": "primary", "requiredPermission": "vendor.create" },
                { "key": "edit", "label": "Edit", "actionType": "button", "variant": "secondary", "requiredPermission": "vendor.edit" },
                { "key": "delete", "label": "Delete", "actionType": "button", "variant": "danger", "requiredPermission": "vendor.delete" },
                { "key": "export", "label": "Export CSV", "actionType": "button", "variant": "secondary", "requiredPermission": "vendor.view" }
              ]
            }
            """;

            await SeedPageHelperAsync(tenantId, "procurement.vendors", "Vendor", "Supplier & Vendor Directory",
                "Procurement suppliers, compliance verification, GST credentials, and vendor ratings.",
                "procurement", "/procurement/vendors", "Truck", "Procurement", 1, "vendor.view", schemaJson, ct);
        }

        private async Task SeedItemsAsync(Guid tenantId, CancellationToken ct)
        {
            var schemaJson = """
            {
              "schemaVersion": "1",
              "pageKey": "inventory.items",
              "title": "Item Master & Catalog",
              "subTitle": "SKU catalog, pricing tiers, reorder triggers, HSN codes, and valuation profiles.",
              "entityName": "Item",
              "viewType": "table",
              "apiEndpoint": "/api/v1/items",
              "kpiMetrics": [
                { "label": "Registered SKUs", "tone": "info", "icon": "Box", "subtext": "Active catalog items" },
                { "label": "Reorder Triggers", "tone": "warning", "icon": "AlertTriangle", "subtext": "Items near threshold" }
              ],
              "columns": [
                { "key": "code", "label": "Item Code", "dataType": "string", "sortable": true, "sortOrder": 1, "width": "120px" },
                { "key": "name", "label": "Item Name", "dataType": "string", "sortable": true, "sortOrder": 2, "width": "220px" },
                { "key": "sku", "label": "SKU", "dataType": "string", "sortable": true, "sortOrder": 3, "width": "130px" },
                { "key": "category", "label": "Category", "dataType": "badge", "sortable": true, "sortOrder": 4, "width": "130px" },
                { "key": "unitOfMeasure", "label": "UOM", "dataType": "string", "sortable": false, "sortOrder": 5, "width": "90px" },
                { "key": "costPrice", "label": "Cost Price", "dataType": "currency", "sortable": true, "sortOrder": 6, "width": "120px" },
                { "key": "sellingPrice", "label": "Selling Price", "dataType": "currency", "sortable": true, "sortOrder": 7, "width": "130px" },
                { "key": "reorderLevel", "label": "Reorder Qty", "dataType": "number", "sortable": true, "sortOrder": 8, "width": "120px" },
                { "key": "isActive", "label": "Active", "dataType": "boolean", "sortable": true, "sortOrder": 9, "width": "90px" }
              ],
              "filters": [
                { "key": "search", "label": "Search Catalog", "filterType": "text", "placeholder": "Search item name, SKU, code…" }
              ],
              "form": {
                "sections": [
                  {
                    "title": "Item Specifications",
                    "description": "Product code, nomenclature, SKU barcode, and grouping.",
                    "fields": [
                      { "key": "code", "label": "Item Code", "fieldType": "text", "required": true, "placeholder": "ITM-XXXX" },
                      { "key": "name", "label": "Item Nomenclature", "fieldType": "text", "required": true, "placeholder": "Stainless Steel Fasteners 10mm" },
                      { "key": "sku", "label": "Stock Keeping Unit (SKU)", "fieldType": "text", "required": true, "placeholder": "SKU-SSF-10" },
                      { "key": "category", "label": "Inventory Category", "fieldType": "text", "required": false, "placeholder": "Hardware / Fasteners" },
                      { "key": "unitOfMeasure", "label": "Unit of Measure (UOM)", "fieldType": "text", "required": true, "placeholder": "NOS / KG / LTR" }
                    ]
                  },
                  {
                    "title": "Pricing & Reorder Thresholds",
                    "description": "Standard cost valuation, sale price, and automated replenishment trigger.",
                    "fields": [
                      { "key": "costPrice", "label": "Standard Cost (₹)", "fieldType": "currency", "required": false, "defaultValue": 0 },
                      { "key": "sellingPrice", "label": "Sale Price (₹)", "fieldType": "currency", "required": false, "defaultValue": 0 },
                      { "key": "reorderLevel", "label": "Reorder Warning Level", "fieldType": "number", "required": false, "defaultValue": 20 },
                      { "key": "hsnCode", "label": "HSN Statutory Code", "fieldType": "text", "required": false, "placeholder": "7318" },
                      { "key": "isActive", "label": "Active Catalog Item", "fieldType": "boolean", "required": false, "defaultValue": true }
                    ]
                  }
                ]
              },
              "actions": [
                { "key": "create", "label": "New Item", "actionType": "button", "variant": "primary", "requiredPermission": "item.create" },
                { "key": "edit", "label": "Edit", "actionType": "button", "variant": "secondary", "requiredPermission": "item.edit" },
                { "key": "delete", "label": "Delete", "actionType": "button", "variant": "danger", "requiredPermission": "item.delete" },
                { "key": "export", "label": "Export CSV", "actionType": "button", "variant": "secondary", "requiredPermission": "item.view" }
              ]
            }
            """;

            await SeedPageHelperAsync(tenantId, "inventory.items", "Item", "Item Master & Catalog",
                "SKU catalog, pricing tiers, reorder triggers, HSN codes, and valuation profiles.",
                "inventory", "/inventory/items", "Box", "Inventory", 1, "item.view", schemaJson, ct);
        }

        private async Task SeedUsersAsync(Guid tenantId, CancellationToken ct)
        {
            var schemaJson = """
            {
              "schemaVersion": "1",
              "pageKey": "administration.users",
              "title": "User Directory",
              "subTitle": "Manage user accounts, roles, access permissions, and corporate authentication status.",
              "entityName": "User",
              "viewType": "table",
              "apiEndpoint": "/api/v1/admin/users",
              "kpiMetrics": [
                { "label": "Total Users", "tone": "info", "icon": "Users", "subtext": "Registered platform accounts" },
                { "label": "Active Users", "tone": "positive", "icon": "CheckCircle2", "subtext": "Operational accounts" }
              ],
              "columns": [
                { "key": "fullName", "label": "Full Name", "dataType": "string", "sortable": true, "sortOrder": 1, "width": "220px" },
                { "key": "email", "label": "Email Address", "dataType": "string", "sortable": true, "sortOrder": 2, "width": "240px" },
                { "key": "roles", "label": "Assigned Roles", "dataType": "badge", "sortable": false, "sortOrder": 3, "width": "180px" },
                { "key": "isActive", "label": "Account Status", "dataType": "boolean", "sortable": true, "sortOrder": 4, "width": "120px" }
              ],
              "filters": [
                { "key": "search", "label": "Search Users", "filterType": "text", "placeholder": "Search name, email, or role…" },
                {
                  "key": "isActive",
                  "label": "Status",
                  "filterType": "select",
                  "options": [
                    { "value": "all", "label": "All Statuses" },
                    { "value": "true", "label": "Active Only" },
                    { "value": "false", "label": "Inactive Only" }
                  ]
                }
              ],
              "form": {
                "sections": [
                  {
                    "title": "User Profile",
                    "description": "User identity and authentication coordinates.",
                    "fields": [
                      { "key": "fullName", "label": "Full Name", "fieldType": "text", "required": true, "placeholder": "First and Last Name" },
                      { "key": "email", "label": "Email Address", "fieldType": "email", "required": true, "placeholder": "user@uabindia.com" },
                      { "key": "phoneNumber", "label": "Phone Number", "fieldType": "phone", "required": false },
                      { "key": "isActive", "label": "Account Active", "fieldType": "boolean", "required": false, "defaultValue": true }
                    ]
                  }
                ]
              },
              "actions": [
                { "key": "create", "label": "Add User", "actionType": "button", "variant": "primary", "requiredPermission": "users.create" },
                { "key": "edit", "label": "Edit", "actionType": "button", "variant": "secondary", "requiredPermission": "users.edit" },
                { "key": "delete", "label": "Delete", "actionType": "button", "variant": "danger", "requiredPermission": "users.delete" },
                { "key": "export", "label": "Export CSV", "actionType": "button", "variant": "secondary", "requiredPermission": "users.view" }
              ]
            }
            """;

            await SeedPageHelperAsync(tenantId, "administration.users", "User", "User Directory",
                "Manage user accounts, roles, access permissions, and corporate authentication status.",
                "administration", "/administration/users", "Users", "Identity & Access", 1, "users.view", schemaJson, ct);
        }
    }
}
