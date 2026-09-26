using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Common.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/dashboards")]
    [Authorize]
    public class DashboardsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public DashboardsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public class CreateDashboardDto
        {
            public string DashboardKey { get; set; } = string.Empty;
            public string Title { get; set; } = string.Empty;
            public string? Description { get; set; }
            public string ModuleKey { get; set; } = "general";
            public Guid? CompanyId { get; set; }
            public Guid? ProjectId { get; set; }
            public bool IsShared { get; set; } = true;
            public string LayoutJson { get; set; } = "{}";
        }

        public class UpdateWidgetLayoutDto
        {
            public Guid DashboardWidgetId { get; set; }
            public int GridX { get; set; }
            public int GridY { get; set; }
            public int GridWidth { get; set; }
            public int GridHeight { get; set; }
            public int SortOrder { get; set; }
        }

        public class AddWidgetDto
        {
            public Guid WidgetDefinitionId { get; set; }
            public int GridX { get; set; } = 0;
            public int GridY { get; set; } = 0;
            public int GridWidth { get; set; } = 3;
            public int GridHeight { get; set; } = 2;
            public string? CustomSettingsJson { get; set; }
        }

        [HttpGet]
        public async Task<IActionResult> ListDashboards([FromQuery] string? moduleKey, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var userId = GetUserId();

            var query = _db.DashboardDefinitions
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && (d.IsShared || d.OwnerUserId == userId));

            if (!string.IsNullOrWhiteSpace(moduleKey))
            {
                query = query.Where(d => d.ModuleKey.ToLower() == moduleKey.ToLower());
            }

            var dashboards = await query
                .OrderByDescending(d => d.IsDefault)
                .ThenBy(d => d.Title)
                .Select(d => new
                {
                    d.Id,
                    d.DashboardKey,
                    d.Title,
                    d.Description,
                    d.ModuleKey,
                    d.IsDefault,
                    d.IsShared,
                    WidgetCount = d.Widgets.Count(w => !w.IsDeleted && w.IsVisible),
                    d.CreatedAt
                })
                .ToListAsync(ct);

            return Ok(ApiResponse<object>.Ok(dashboards));
        }

        [HttpGet("{key}")]
        public async Task<IActionResult> GetDashboard(string key, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var normalizedKey = key.Trim().ToLowerInvariant();

            var dashboard = await _db.DashboardDefinitions
                .Include(d => d.Widgets.Where(w => !w.IsDeleted && w.IsVisible))
                    .ThenInclude(w => w.WidgetDefinition)
                .FirstOrDefaultAsync(d => d.TenantId == tenantId && d.DashboardKey.ToLower() == normalizedKey, ct);

            if (dashboard == null && (normalizedKey == "executive_overview" || normalizedKey == "default"))
            {
                dashboard = await SeedDefaultExecutiveDashboardAsync(tenantId, normalizedKey, ct);
            }

            if (dashboard == null)
            {
                return NotFound(ApiResponse<object>.Fail($"Dashboard with key '{key}' not found."));
            }

            var dto = new
            {
                dashboard.Id,
                dashboard.DashboardKey,
                dashboard.Title,
                dashboard.Description,
                dashboard.ModuleKey,
                dashboard.IsDefault,
                dashboard.IsShared,
                dashboard.LayoutJson,
                Widgets = dashboard.Widgets.Select(w => new
                {
                    DashboardWidgetId = w.Id,
                    WidgetId = w.WidgetDefinitionId,
                    w.WidgetDefinition.WidgetKey,
                    w.WidgetDefinition.Title,
                    w.WidgetDefinition.Subtitle,
                    Type = w.WidgetDefinition.Type.ToString(),
                    w.WidgetDefinition.Icon,
                    w.WidgetDefinition.DataSourceEndpoint,
                    w.WidgetDefinition.RefreshIntervalSeconds,
                    w.GridX,
                    w.GridY,
                    w.GridWidth,
                    w.GridHeight,
                    w.SortOrder,
                    w.CustomSettingsJson
                }).OrderBy(w => w.SortOrder)
            };

            return Ok(ApiResponse<object>.Ok(dto));
        }

        [HttpPost]
        public async Task<IActionResult> CreateDashboard([FromBody] CreateDashboardDto dto, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(dto.DashboardKey) || string.IsNullOrWhiteSpace(dto.Title))
            {
                return BadRequest(ApiResponse<object>.Fail("DashboardKey and Title are required."));
            }

            var tenantId = _tenantAccessor.GetTenantId();
            var userId = GetUserId();
            var key = dto.DashboardKey.Trim().ToLowerInvariant();

            var exists = await _db.DashboardDefinitions
                .AnyAsync(d => d.TenantId == tenantId && d.DashboardKey.ToLower() == key, ct);

            if (exists)
            {
                return BadRequest(ApiResponse<object>.Fail($"Dashboard with key '{key}' already exists."));
            }

            var dashboard = new DashboardDefinition
            {
                TenantId = tenantId,
                DashboardKey = key,
                Title = dto.Title.Trim(),
                Description = dto.Description?.Trim(),
                ModuleKey = dto.ModuleKey.Trim().ToLowerInvariant(),
                CompanyId = dto.CompanyId,
                ProjectId = dto.ProjectId,
                OwnerUserId = userId,
                IsShared = dto.IsShared,
                LayoutJson = dto.LayoutJson
            };

            _db.DashboardDefinitions.Add(dashboard);
            await _db.SaveChangesAsync(ct);

            return CreatedAtAction(nameof(GetDashboard), new { key = dashboard.DashboardKey }, ApiResponse<object>.Ok(new
            {
                dashboard.Id,
                dashboard.DashboardKey,
                dashboard.Title
            }, "Dashboard created successfully."));
        }

        [HttpPut("{id:guid}/layout")]
        public async Task<IActionResult> UpdateLayout(Guid id, [FromBody] List<UpdateWidgetLayoutDto> layoutUpdates, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var dashboard = await _db.DashboardDefinitions
                .Include(d => d.Widgets)
                .FirstOrDefaultAsync(d => d.TenantId == tenantId && d.Id == id, ct);

            if (dashboard == null)
            {
                return NotFound(ApiResponse<object>.Fail("Dashboard not found."));
            }

            foreach (var update in layoutUpdates)
            {
                var widget = dashboard.Widgets.FirstOrDefault(w => w.Id == update.DashboardWidgetId);
                if (widget != null)
                {
                    widget.GridX = update.GridX;
                    widget.GridY = update.GridY;
                    widget.GridWidth = update.GridWidth;
                    widget.GridHeight = update.GridHeight;
                    widget.SortOrder = update.SortOrder;
                }
            }

            await _db.SaveChangesAsync(ct);
            return Ok(ApiResponse<object?>.Ok(null, "Dashboard layout updated successfully."));
        }

        [HttpGet("widgets/catalog")]
        public async Task<IActionResult> GetWidgetCatalog([FromQuery] string? moduleKey, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            await EnsureStandardWidgetCatalogAsync(tenantId, ct);

            var query = _db.WidgetDefinitions
                .AsNoTracking()
                .Where(w => w.TenantId == tenantId && w.IsActive);

            if (!string.IsNullOrWhiteSpace(moduleKey))
            {
                query = query.Where(w => w.ModuleKey.ToLower() == moduleKey.ToLower() || w.ModuleKey == "general");
            }

            var widgets = await query
                .OrderBy(w => w.Title)
                .Select(w => new
                {
                    w.Id,
                    w.WidgetKey,
                    w.Title,
                    w.Subtitle,
                    Type = w.Type.ToString(),
                    w.ModuleKey,
                    w.Icon,
                    w.DefaultWidth,
                    w.DefaultHeight,
                    w.DataSourceEndpoint,
                    w.RefreshIntervalSeconds
                })
                .ToListAsync(ct);

            return Ok(ApiResponse<object>.Ok(widgets));
        }

        [HttpPost("{id:guid}/widgets")]
        public async Task<IActionResult> AddWidget(Guid id, [FromBody] AddWidgetDto dto, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var dashboard = await _db.DashboardDefinitions
                .Include(d => d.Widgets)
                .FirstOrDefaultAsync(d => d.TenantId == tenantId && d.Id == id, ct);

            if (dashboard == null)
            {
                return NotFound(ApiResponse<object>.Fail("Dashboard not found."));
            }

            var widgetDef = await _db.WidgetDefinitions
                .FirstOrDefaultAsync(w => w.TenantId == tenantId && w.Id == dto.WidgetDefinitionId, ct);

            if (widgetDef == null)
            {
                return NotFound(ApiResponse<object>.Fail("Widget definition not found."));
            }

            var widget = new DashboardWidget
            {
                TenantId = tenantId,
                DashboardDefinitionId = dashboard.Id,
                WidgetDefinitionId = widgetDef.Id,
                GridX = dto.GridX,
                GridY = dto.GridY,
                GridWidth = dto.GridWidth > 0 ? dto.GridWidth : widgetDef.DefaultWidth,
                GridHeight = dto.GridHeight > 0 ? dto.GridHeight : widgetDef.DefaultHeight,
                SortOrder = dashboard.Widgets.Count + 1,
                CustomSettingsJson = dto.CustomSettingsJson
            };

            dashboard.Widgets.Add(widget);
            await _db.SaveChangesAsync(ct);

            return Ok(ApiResponse<object>.Ok(new
            {
                DashboardWidgetId = widget.Id,
                widget.WidgetDefinitionId,
                widgetDef.Title
            }, "Widget added to dashboard."));
        }

        [HttpDelete("{id:guid}/widgets/{widgetId:guid}")]
        public async Task<IActionResult> RemoveWidget(Guid id, Guid widgetId, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var widget = await _db.DashboardWidgets
                .FirstOrDefaultAsync(w => w.TenantId == tenantId && w.DashboardDefinitionId == id && w.Id == widgetId, ct);

            if (widget == null)
            {
                return NotFound(ApiResponse<object>.Fail("Widget not found on this dashboard."));
            }

            widget.IsDeleted = true;
            await _db.SaveChangesAsync(ct);

            return Ok(ApiResponse<object?>.Ok(null, "Widget removed from dashboard."));
        }

        private async Task EnsureStandardWidgetCatalogAsync(Guid tenantId, CancellationToken ct)
        {
            var hasWidgets = await _db.WidgetDefinitions.AnyAsync(w => w.TenantId == tenantId, ct);
            if (hasWidgets) return;

            var standardWidgets = new List<WidgetDefinition>
            {
                new() {
                    TenantId = tenantId,
                    WidgetKey = "kpi_revenue",
                    Title = "Gross Invoiced Revenue",
                    Subtitle = "YTD Corporate Total",
                    Type = WidgetType.Kpi,
                    ModuleKey = "finance",
                    Icon = "DollarSign",
                    DataSourceEndpoint = "/reports/executive-dashboard",
                    DefaultWidth = 3,
                    DefaultHeight = 1
                },
                new() {
                    TenantId = tenantId,
                    WidgetKey = "kpi_headcount",
                    Title = "Active Workforce Headcount",
                    Subtitle = "Across All Global Entities",
                    Type = WidgetType.Kpi,
                    ModuleKey = "hrms",
                    Icon = "Users",
                    DataSourceEndpoint = "/reports/executive-dashboard",
                    DefaultWidth = 3,
                    DefaultHeight = 1
                },
                new() {
                    TenantId = tenantId,
                    WidgetKey = "kpi_attendance",
                    Title = "Biometric Attendance Rate",
                    Subtitle = "Live Operations Synchronized",
                    Type = WidgetType.Kpi,
                    ModuleKey = "hrms",
                    Icon = "Clock",
                    DataSourceEndpoint = "/reports/executive-dashboard",
                    DefaultWidth = 3,
                    DefaultHeight = 1
                },
                new() {
                    TenantId = tenantId,
                    WidgetKey = "kpi_approvals",
                    Title = "Pending Approvals Queue",
                    Subtitle = "Requires Executive Action",
                    Type = WidgetType.Kpi,
                    ModuleKey = "general",
                    Icon = "ShieldCheck",
                    DataSourceEndpoint = "/reports/executive-dashboard",
                    DefaultWidth = 3,
                    DefaultHeight = 1
                },
                new() {
                    TenantId = tenantId,
                    WidgetKey = "chart_cashflow",
                    Title = "Revenue Inflow vs Operating Outflow",
                    Subtitle = "Monthly Cash Runway Telemetry",
                    Type = WidgetType.Bar,
                    ModuleKey = "finance",
                    Icon = "TrendingUp",
                    DataSourceEndpoint = "/reports/executive-dashboard",
                    DefaultWidth = 8,
                    DefaultHeight = 3
                },
                new() {
                    TenantId = tenantId,
                    WidgetKey = "chart_spend",
                    Title = "Departmental Spend Distribution",
                    Subtitle = "Current Fiscal Year Budget Allocation",
                    Type = WidgetType.Pie,
                    ModuleKey = "finance",
                    Icon = "PieChart",
                    DataSourceEndpoint = "/reports/executive-dashboard",
                    DefaultWidth = 4,
                    DefaultHeight = 3
                },
                new() {
                    TenantId = tenantId,
                    WidgetKey = "activity_stream",
                    Title = "Live Enterprise Activity Feed",
                    Subtitle = "Cross-Module Audit & System Events",
                    Type = WidgetType.Activity,
                    ModuleKey = "general",
                    Icon = "Activity",
                    DataSourceEndpoint = "/audit/logs",
                    DefaultWidth = 6,
                    DefaultHeight = 3
                },
                new() {
                    TenantId = tenantId,
                    WidgetKey = "quick_actions",
                    Title = "Enterprise Action Shortcuts",
                    Subtitle = "Frequently Executed Business Workflows",
                    Type = WidgetType.Approval,
                    ModuleKey = "general",
                    Icon = "Zap",
                    DataSourceEndpoint = "",
                    DefaultWidth = 6,
                    DefaultHeight = 3
                }
            };

            _db.WidgetDefinitions.AddRange(standardWidgets);
            await _db.SaveChangesAsync(ct);
        }

        private async Task<DashboardDefinition> SeedDefaultExecutiveDashboardAsync(Guid tenantId, string key, CancellationToken ct)
        {
            await EnsureStandardWidgetCatalogAsync(tenantId, ct);

            var catalog = await _db.WidgetDefinitions
                .Where(w => w.TenantId == tenantId && w.IsActive)
                .ToListAsync(ct);

            var dashboard = new DashboardDefinition
            {
                TenantId = tenantId,
                DashboardKey = key,
                Title = "Executive & Operations Command Canvas",
                Description = "Adaptive enterprise analytics, operational metrics, and executive KPIs.",
                ModuleKey = "general",
                IsDefault = true,
                IsShared = true,
                LayoutJson = "{\"columns\":12,\"rowHeight\":120,\"gap\":16}"
            };

            var sort = 1;
            int currentY = 0;
            int currentX = 0;

            foreach (var item in catalog)
            {
                if (currentX + item.DefaultWidth > 12)
                {
                    currentX = 0;
                    currentY += item.DefaultHeight;
                }

                dashboard.Widgets.Add(new DashboardWidget
                {
                    TenantId = tenantId,
                    DashboardDefinition = dashboard,
                    WidgetDefinitionId = item.Id,
                    WidgetDefinition = item,
                    GridX = currentX,
                    GridY = currentY,
                    GridWidth = item.DefaultWidth,
                    GridHeight = item.DefaultHeight,
                    SortOrder = sort++
                });

                currentX += item.DefaultWidth;
            }

            _db.DashboardDefinitions.Add(dashboard);
            await _db.SaveChangesAsync(ct);

            return dashboard;
        }

        private Guid GetUserId()
        {
            var val = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(val, out var id) ? id : Guid.Empty;
        }
    }
}
