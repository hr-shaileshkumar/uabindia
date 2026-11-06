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
                Title = "Executive & Operations Command Dashboard",
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

        [HttpGet("executive-dashboard")]
        [HttpGet("/api/v1/reports/executive-dashboard")]
        public async Task<IActionResult> ExecutiveDashboard()
        {
            var today = DateTime.UtcNow.Date;
            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;

            // HR & Global Workforce Telemetry
            var totalEmployees = await _db.Employees.CountAsync(e => !e.IsDeleted);
            var activeEmployees = await _db.Employees.CountAsync(e => !e.IsDeleted && e.Status == "Active");
            var todayAttendance = await _db.AttendanceRecords.CountAsync(a => a.Timestamp.Date == today);
            var attendanceRate = totalEmployees > 0 ? Math.Round((double)todayAttendance / totalEmployees * 100, 1) : 0;
            var pendingLeaves = await _db.LeaveRequests.CountAsync(lr => lr.Status == "Pending");
            var pendingExpenses = await _db.ExpenseClaims.CountAsync(ec => ec.Status == "Pending");

            // SCM & Procurement Telemetry
            var totalPOs = await _db.PurchaseOrders.CountAsync();
            var openPOs = await _db.PurchaseOrders.CountAsync(po => po.Status == "Open" || po.Status == "Pending" || po.Status == "Approved");
            var totalBills = await _db.PurchaseInvoices.CountAsync();
            var pendingBills = await _db.PurchaseInvoices.CountAsync(b => b.Status == "Draft" || b.Status == "PendingApproval" || b.Status == "Submitted");
            var totalBillValue = await _db.PurchaseInvoices.SumAsync(b => (decimal?)b.TotalAmount) ?? 0;
            var pendingGrns = await _db.GoodsReceiptNotes.CountAsync(g => g.Status == "Pending" || g.Status == "Draft");

            // Payroll & Financials
            var monthlyPayrollRuns = await _db.PayrollRuns.CountAsync(pr => pr.RunDate.Month == currentMonth && pr.RunDate.Year == currentYear);
            var totalDisbursed = await _db.Payslips.SumAsync(p => (decimal?)p.Net) ?? 0;
            var totalAssets = await _db.FixedAssets.CountAsync(a => !a.IsDeleted);

            // Department Workforce Distribution (Direct from DB)
            var departments = await (from e in _db.Employees.AsNoTracking().Where(e => !e.IsDeleted)
                                     join d in _db.Departments.AsNoTracking() on e.DepartmentId equals d.Id into deptJoin
                                     from d in deptJoin.DefaultIfEmpty()
                                     group e by (d != null ? d.Name : "Core Operations") into g
                                     select new
                                     {
                                         name = g.Key,
                                         count = g.Count(),
                                         percentage = totalEmployees > 0 ? (int)Math.Round((double)g.Count() / totalEmployees * 100) : 0,
                                         color = "bg-blue-600"
                                     })
                                     .OrderByDescending(x => x.count)
                                     .Take(5)
                                     .ToListAsync();

            if (!departments.Any())
            {
                departments.Add(new { name = "Core Operations", count = Math.Max(1, totalEmployees), percentage = 100, color = "bg-blue-600" });
            }

            // 6-Month Real Cashflow Runway (Direct from DB)
            var cashflow = new List<object>();
            var monthNames = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
            for (int i = 5; i >= 0; i--)
            {
                var dt = DateTime.UtcNow.AddMonths(-i);
                var m = dt.Month;
                var y = dt.Year;
                var mName = monthNames[m - 1];

                var monthlySales = await _db.SalesInvoices
                    .Where(s => s.InvoiceDate.Month == m && s.InvoiceDate.Year == y)
                    .SumAsync(s => (decimal?)s.TotalAmount) ?? 0;

                var monthlyPurchases = await _db.PurchaseInvoices
                    .Where(p => p.InvoiceDate.Month == m && p.InvoiceDate.Year == y)
                    .SumAsync(p => (decimal?)p.TotalAmount) ?? 0;

                var monthlyPayroll = await _db.Payslips
                    .Where(p => p.CreatedAt.Month == m && p.CreatedAt.Year == y)
                    .SumAsync(p => (decimal?)p.Net) ?? 0;

                var inflow = monthlySales;
                var outflow = monthlyPurchases + monthlyPayroll;

                cashflow.Add(new
                {
                    month = mName,
                    inflow = (double)inflow,
                    outflow = (double)outflow
                });
            }

            // Spend Category Distribution (Direct from DB)
            var totalPayrollSpend = await _db.Payslips.SumAsync(p => (decimal?)p.Net) ?? 0;
            var totalProcureSpend = await _db.PurchaseInvoices.SumAsync(p => (decimal?)p.TotalAmount) ?? 0;
            var totalExpenseClaims = await _db.ExpenseClaims.Where(e => e.Status == "Approved").SumAsync(e => (decimal?)e.Amount) ?? 0;
            var totalFixedAssetVal = await _db.FixedAssets.Where(f => !f.IsDeleted).SumAsync(f => (decimal?)f.PurchaseValue) ?? 0;
            var grandSpend = totalPayrollSpend + totalProcureSpend + totalExpenseClaims + totalFixedAssetVal;

            var spendDistribution = new[]
            {
                new { name = "Personnel & Payroll", value = grandSpend > 0 ? (int)Math.Round((double)totalPayrollSpend / (double)grandSpend * 100) : 0, color = "#6366f1" },
                new { name = "Direct Procurement (SCM)", value = grandSpend > 0 ? (int)Math.Round((double)totalProcureSpend / (double)grandSpend * 100) : 0, color = "#0ea5e9" },
                new { name = "Operating Expenses & Fleet", value = grandSpend > 0 ? (int)Math.Round((double)totalExpenseClaims / (double)grandSpend * 100) : 0, color = "#10b981" },
                new { name = "Fixed Assets & Capital", value = grandSpend > 0 ? (int)Math.Round((double)totalFixedAssetVal / (double)grandSpend * 100) : 0, color = "#f59e0b" }
            };

            // Regional Operations Hub Telemetry (Derived from Tenant Registered Companies & Projects)
            var realCompanies = await _db.Companies
                .AsNoTracking()
                .Where(c => !c.IsDeleted)
                .Select(c => new
                {
                    name = c.LegalName ?? c.Name,
                    code = c.Code ?? "CO",
                    city = c.City ?? "Headquarters",
                    state = c.State ?? "India",
                    companyId = c.Id
                })
                .ToListAsync();

            var regions = new List<object>();
            if (realCompanies.Any())
            {
                foreach (var c in realCompanies)
                {
                    var empCount = await _db.Employees.CountAsync(e => !e.IsDeleted && e.CompanyId == c.companyId);
                    var projCount = await _db.Projects.CountAsync(p => !p.IsDeleted && p.CompanyId == c.companyId);
                    regions.Add(new
                    {
                        name = c.name,
                        code = c.code,
                        employees = empCount,
                        activeProjects = projCount,
                        status = "Active",
                        city = c.city,
                        state = c.state,
                        lat = 20.5937,
                        lng = 78.9629
                    });
                }
            }
            else
            {
                var totalProj = await _db.Projects.CountAsync(p => !p.IsDeleted);
                regions.Add(new
                {
                    name = "Corporate Headquarters",
                    code = "HQ",
                    employees = totalEmployees,
                    activeProjects = totalProj,
                    status = "Active",
                    city = "Registered Office",
                    state = "India",
                    lat = 20.5937,
                    lng = 78.9629
                });
            }

            // Financial Runway & Multi-Quarter Trends (Direct from Invoices)
            var nowYear = DateTime.UtcNow.Year;
            var q1Sales = await _db.SalesInvoices.Where(s => s.InvoiceDate.Year == nowYear && s.InvoiceDate.Month <= 3).SumAsync(s => (decimal?)s.TotalAmount) ?? 0;
            var q1Spend = await _db.PurchaseInvoices.Where(p => p.InvoiceDate.Year == nowYear && p.InvoiceDate.Month <= 3).SumAsync(p => (decimal?)p.TotalAmount) ?? 0;
            var q2Sales = await _db.SalesInvoices.Where(s => s.InvoiceDate.Year == nowYear && s.InvoiceDate.Month >= 4 && s.InvoiceDate.Month <= 6).SumAsync(s => (decimal?)s.TotalAmount) ?? 0;
            var q2Spend = await _db.PurchaseInvoices.Where(p => p.InvoiceDate.Year == nowYear && p.InvoiceDate.Month >= 4 && p.InvoiceDate.Month <= 6).SumAsync(p => (decimal?)p.TotalAmount) ?? 0;
            var q3Sales = await _db.SalesInvoices.Where(s => s.InvoiceDate.Year == nowYear && s.InvoiceDate.Month >= 7 && s.InvoiceDate.Month <= 9).SumAsync(s => (decimal?)s.TotalAmount) ?? 0;
            var q3Spend = await _db.PurchaseInvoices.Where(p => p.InvoiceDate.Year == nowYear && p.InvoiceDate.Month >= 7 && p.InvoiceDate.Month <= 9).SumAsync(p => (decimal?)p.TotalAmount) ?? 0;
            var q4Sales = await _db.SalesInvoices.Where(s => s.InvoiceDate.Year == nowYear && s.InvoiceDate.Month >= 10).SumAsync(s => (decimal?)s.TotalAmount) ?? 0;
            var q4Spend = await _db.PurchaseInvoices.Where(p => p.InvoiceDate.Year == nowYear && p.InvoiceDate.Month >= 10).SumAsync(p => (decimal?)p.TotalAmount) ?? 0;

            var financialTrends = new[]
            {
                new { quarter = "Q1", revenue = (double)q1Sales, spend = (double)q1Spend, payroll = (double)totalDisbursed * 0.25, margin = (double)(q1Sales - q1Spend) },
                new { quarter = "Q2", revenue = (double)q2Sales, spend = (double)q2Spend, payroll = (double)totalDisbursed * 0.25, margin = (double)(q2Sales - q2Spend) },
                new { quarter = "Q3", revenue = (double)q3Sales, spend = (double)q3Spend, payroll = (double)totalDisbursed * 0.25, margin = (double)(q3Sales - q3Spend) },
                new { quarter = "Q4", revenue = (double)q4Sales, spend = (double)q4Spend, payroll = (double)totalDisbursed * 0.25, margin = (double)(q4Sales - q4Spend) }
            };

            return Ok(new
            {
                summary = new
                {
                    totalEmployees,
                    activeEmployees,
                    todayAttendance,
                    attendanceRate,
                    totalPOs,
                    openPOs,
                    totalBills,
                    pendingBills,
                    totalBillValue,
                    pendingGrns,
                    monthlyPayrollRuns,
                    totalDisbursed,
                    totalAssets,
                    pendingApprovals = pendingLeaves + pendingExpenses + pendingBills
                },
                departments,
                cashflow,
                spendDistribution,
                regions,
                financialTrends,
                timestamp = DateTime.UtcNow
            });
        }

        private Guid GetUserId()
        {
            var val = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(val, out var id) ? id : Guid.Empty;
        }
    }
}
