using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    [ApiController]
    [Route("api/v1/search")]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public SearchController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> Search([FromQuery] string? q = null, [FromQuery] int take = 20)
        {
            var query = (q ?? string.Empty).Trim();
            if (query.Length < 2)
            {
                return Ok(new { results = Array.Empty<SearchResultDto>() });
            }

            take = Math.Clamp(take, 1, 50);
            var perType = Math.Clamp(take / 4, 3, 8);
            var normalized = query.ToLowerInvariant();
            var enabled = await LoadEnabledModulesAsync();
            var results = new List<SearchResultDto>();

            results.AddRange(PageSuggestions
                .Where(item => item.Matches(normalized) && ModuleOn(enabled, item.Module))
                .Select(item => new SearchResultDto
                {
                    Title = item.Title,
                    Subtitle = item.Module,
                    Path = item.Path,
                    Module = item.Module,
                    Category = "page",
                    Icon = item.Icon,
                }));

            if (ModuleOn(enabled, "hrms"))
            {
                var employees = await _db.Employees.AsNoTracking()
                    .Where(e =>
                        (e.FullName != null && e.FullName.ToLower().Contains(normalized)) ||
                        (e.EmployeeCode != null && e.EmployeeCode.ToLower().Contains(normalized)))
                    .OrderBy(e => e.FullName)
                    .Take(perType)
                    .Select(e => new SearchResultDto
                    {
                        Title = e.FullName ?? e.EmployeeCode ?? "Employee",
                        Subtitle = e.EmployeeCode ?? e.Status,
                        Path = $"/hrms/employees/{e.Id}",
                        Module = "hrms",
                        Category = "module",
                        Icon = "users",
                    })
                    .ToListAsync();
                results.AddRange(employees);
            }

            if (ModuleOn(enabled, "platform"))
            {
                var companies = await _db.Companies.AsNoTracking()
                    .Where(c => c.Name.ToLower().Contains(normalized) || (c.Code != null && c.Code.ToLower().Contains(normalized)))
                    .OrderBy(c => c.Name)
                    .Take(perType)
                    .Select(c => new SearchResultDto
                    {
                        Title = c.Name,
                        Subtitle = c.Code,
                        Path = "/platform/companies",
                        Module = "platform",
                        Category = "module",
                        Icon = "building",
                    })
                    .ToListAsync();
                results.AddRange(companies);

                var users = await _db.Users.AsNoTracking()
                    .Where(u =>
                        (u.FullName != null && u.FullName.ToLower().Contains(normalized)) ||
                        (u.Email != null && u.Email.ToLower().Contains(normalized)))
                    .OrderBy(u => u.FullName)
                    .Take(perType)
                    .Select(u => new SearchResultDto
                    {
                        Title = u.FullName ?? u.Email ?? "User",
                        Subtitle = u.Email,
                        Path = "/platform/users",
                        Module = "platform",
                        Category = "module",
                        Icon = "user",
                    })
                    .ToListAsync();
                results.AddRange(users);
            }

            if (ModuleOn(enabled, "projects", "platform"))
            {
                var projects = await _db.Projects.AsNoTracking()
                    .Where(p =>
                        p.Name.ToLower().Contains(normalized) ||
                        (p.ProjectCode != null && p.ProjectCode.ToLower().Contains(normalized)) ||
                        (p.ClientName != null && p.ClientName.ToLower().Contains(normalized)))
                    .OrderBy(p => p.Name)
                    .Take(perType)
                    .Select(p => new SearchResultDto
                    {
                        Title = p.Name,
                        Subtitle = p.ProjectCode ?? p.Status,
                        Path = "/platform/projects",
                        Module = "projects",
                        Category = "module",
                        Icon = "folder",
                    })
                    .ToListAsync();
                results.AddRange(projects);

                var tasks = await _db.ProjectTasks.AsNoTracking()
                    .Where(t =>
                        t.Title.ToLower().Contains(normalized) ||
                        t.TaskCode.ToLower().Contains(normalized) ||
                        (t.AssignedToName != null && t.AssignedToName.ToLower().Contains(normalized)))
                    .OrderBy(t => t.Title)
                    .Take(perType)
                    .Select(t => new SearchResultDto
                    {
                        Title = t.Title,
                        Subtitle = t.TaskCode + " · " + t.Status,
                        Path = "/projects/tasks",
                        Module = "projects",
                        Category = "module",
                        Icon = "clipboard",
                    })
                    .ToListAsync();
                results.AddRange(tasks);

                var timesheets = await _db.TimesheetEntries.AsNoTracking()
                    .Where(t =>
                        t.EmployeeName.ToLower().Contains(normalized) ||
                        (t.Notes != null && t.Notes.ToLower().Contains(normalized)))
                    .OrderByDescending(t => t.WorkDate)
                    .Take(perType)
                    .Select(t => new
                    {
                        t.EmployeeName,
                        t.WorkDate,
                        t.Hours,
                        t.Status
                    })
                    .ToListAsync();
                results.AddRange(timesheets.Select(t => new SearchResultDto
                {
                    Title = $"{t.EmployeeName} · {t.WorkDate:yyyy-MM-dd}",
                    Subtitle = $"{t.Hours:0.##}h · {t.Status}",
                    Path = "/projects/timesheets",
                    Module = "projects",
                    Category = "module",
                    Icon = "clock",
                }));
            }

            if (ModuleOn(enabled, "crm", "sales", "erp"))
            {
                var leads = await _db.CrmLeads.AsNoTracking()
                    .Where(l =>
                        l.LeadName.ToLower().Contains(normalized) ||
                        l.LeadCode.ToLower().Contains(normalized) ||
                        (l.CompanyName != null && l.CompanyName.ToLower().Contains(normalized)) ||
                        (l.Email != null && l.Email.ToLower().Contains(normalized)))
                    .OrderBy(l => l.LeadName)
                    .Take(perType)
                    .Select(l => new SearchResultDto
                    {
                        Title = l.LeadName,
                        Subtitle = l.LeadCode + " · " + l.Stage,
                        Path = "/crm/leads",
                        Module = "crm",
                        Category = "module",
                        Icon = "pipeline",
                    })
                    .ToListAsync();
                results.AddRange(leads);

                var customers = await _db.Customers.AsNoTracking()
                    .Where(c =>
                        c.CustomerName.ToLower().Contains(normalized) ||
                        c.CustomerCode.ToLower().Contains(normalized) ||
                        (c.Email != null && c.Email.ToLower().Contains(normalized)) ||
                        (c.PhoneNumber != null && c.PhoneNumber.ToLower().Contains(normalized)))
                    .OrderBy(c => c.CustomerName)
                    .Take(perType)
                    .Select(c => new SearchResultDto
                    {
                        Title = c.CustomerName,
                        Subtitle = c.CustomerCode,
                        Path = "/crm/customers",
                        Module = "crm",
                        Category = "module",
                        Icon = "users",
                    })
                    .ToListAsync();
                results.AddRange(customers);
            }

            if (ModuleOn(enabled, "sales", "erp"))
            {
                var quotations = await _db.SalesQuotations.AsNoTracking()
                    .Where(sq => sq.QuotationNumber.ToLower().Contains(normalized) ||
                                (sq.Notes != null && sq.Notes.ToLower().Contains(normalized)))
                    .OrderByDescending(sq => sq.QuotationDate)
                    .Take(perType)
                    .Select(sq => new { sq.QuotationNumber, sq.TotalAmount, sq.Status })
                    .ToListAsync();
                results.AddRange(quotations.Select(sq => new SearchResultDto
                {
                    Title = sq.QuotationNumber,
                    Subtitle = $"₹{sq.TotalAmount:N0} · {sq.Status}",
                    Path = "/quotations",
                    Module = "sales",
                    Category = "module",
                    Icon = "file-text",
                }));

                var orders = await _db.SalesOrders.AsNoTracking()
                    .Where(o =>
                        o.SONumber.ToLower().Contains(normalized) ||
                        (o.CustomerPONumber != null && o.CustomerPONumber.ToLower().Contains(normalized)))
                    .OrderByDescending(o => o.SODate)
                    .Take(perType)
                    .Select(o => new { o.SONumber, o.TotalAmount, o.Status })
                    .ToListAsync();
                results.AddRange(orders.Select(o => new SearchResultDto
                {
                    Title = o.SONumber,
                    Subtitle = $"₹{o.TotalAmount:N0} · {o.Status}",
                    Path = "/sales-orders",
                    Module = "sales",
                    Category = "module",
                    Icon = "shopping-bag",
                }));

                var invoices = await _db.SalesInvoices.AsNoTracking()
                    .Where(i => i.InvoiceNumber.ToLower().Contains(normalized) ||
                                (i.Notes != null && i.Notes.ToLower().Contains(normalized)))
                    .OrderByDescending(i => i.InvoiceDate)
                    .Take(perType)
                    .Select(i => new { i.InvoiceNumber, i.BalanceAmount, i.Status })
                    .ToListAsync();
                results.AddRange(invoices.Select(i => new SearchResultDto
                {
                    Title = i.InvoiceNumber,
                    Subtitle = $"₹{i.BalanceAmount:N0} due · {i.Status}",
                    Path = "/invoices",
                    Module = "sales",
                    Category = "module",
                    Icon = "receipt",
                }));
            }

            if (ModuleOn(enabled, "finance", "erp"))
            {
                var expenses = await _db.ExpenseClaims.AsNoTracking()
                    .Where(e =>
                        e.Title.ToLower().Contains(normalized) ||
                        e.ClaimNumber.ToLower().Contains(normalized) ||
                        (e.EmployeeName != null && e.EmployeeName.ToLower().Contains(normalized)))
                    .OrderByDescending(e => e.ExpenseDate)
                    .Take(perType)
                    .Select(e => new { e.Title, e.ClaimNumber, e.Amount, e.Status })
                    .ToListAsync();
                results.AddRange(expenses.Select(e => new SearchResultDto
                {
                    Title = e.Title,
                    Subtitle = $"{e.ClaimNumber} · ₹{e.Amount:N0} · {e.Status}",
                    Path = "/expenses",
                    Module = "finance",
                    Category = "module",
                    Icon = "wallet",
                }));
            }

            if (ModuleOn(enabled, "platform", "erp"))
            {
                var documents = await _db.DocumentRecords.AsNoTracking()
                    .Where(d =>
                        d.FileName.ToLower().Contains(normalized) ||
                        (d.Tags != null && d.Tags.ToLower().Contains(normalized)) ||
                        (d.Description != null && d.Description.ToLower().Contains(normalized)))
                    .OrderByDescending(d => d.CreatedAt)
                    .Take(perType)
                    .Select(d => new SearchResultDto
                    {
                        Title = d.FileName,
                        Subtitle = d.Category ?? d.Module,
                        Path = "/documents",
                        Module = "platform",
                        Category = "module",
                        Icon = "file-text",
                    })
                    .ToListAsync();
                results.AddRange(documents);
            }

            // Prefer record hits slightly over static page suggestions when truncating.
            var ranked = results
                .OrderBy(r => r.Category == "page" ? 1 : 0)
                .ThenBy(r => r.Title)
                .Take(take)
                .ToList();

            return Ok(new { results = ranked, query, take });
        }

        private async Task<HashSet<string>> LoadEnabledModulesAsync()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
                return new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var keys = await _db.TenantModules.AsNoTracking()
                .Where(tm => tm.TenantId == tenantId && tm.IsEnabled && !tm.IsDeleted)
                .Select(tm => tm.ModuleKey)
                .ToListAsync();

            return new HashSet<string>(keys, StringComparer.OrdinalIgnoreCase);
        }

        private static bool ModuleOn(HashSet<string> enabled, params string[] keys)
        {
            // Empty set = no subscriptions loaded (tests / early bootstrap) → allow all.
            if (enabled.Count == 0) return true;
            foreach (var key in keys)
            {
                if (enabled.Contains(key)) return true;
            }

            // Finance / procurement / inventory often ride under erp subscription.
            if (keys.Any(k => k is "finance" or "procurement" or "inventory" or "sales") &&
                enabled.Contains("erp"))
            {
                return true;
            }

            return false;
        }

        private static readonly IReadOnlyList<PageSuggestion> PageSuggestions = new[]
        {
            new PageSuggestion("Dashboard", "/dashboard", "administration", "dashboard"),
            new PageSuggestion("Employees", "/hrms/employees", "hrms", "users"),
            new PageSuggestion("Leave", "/hrms/leave", "hrms", "calendar"),
            new PageSuggestion("Payroll Runs", "/payroll/runs", "payroll", "play-circle"),
            new PageSuggestion("Project Tasks", "/projects/tasks", "projects", "clipboard"),
            new PageSuggestion("Timesheets", "/projects/timesheets", "projects", "clock"),
            new PageSuggestion("Leads", "/crm/leads", "crm", "pipeline"),
            new PageSuggestion("Customers", "/crm/customers", "crm", "users"),
            new PageSuggestion("Quotations", "/quotations", "sales", "file-text"),
            new PageSuggestion("Sales Orders", "/sales-orders", "sales", "shopping-bag"),
            new PageSuggestion("Invoices", "/invoices", "sales", "receipt"),
            new PageSuggestion("Expenses", "/expenses", "finance", "wallet"),
            new PageSuggestion("Approvals", "/approvals", "administration", "check-circle"),
            new PageSuggestion("Notifications", "/notifications", "administration", "bell"),
            new PageSuggestion("Documents", "/documents", "administration", "file-text"),
            new PageSuggestion("Platform", "/platform", "platform", "settings"),
            new PageSuggestion("Cost Centers", "/platform/cost-centers", "platform", "dollar-sign"),
        };

        private sealed record PageSuggestion(string Title, string Path, string Module, string Icon)
        {
            public bool Matches(string query) =>
                Title.ToLowerInvariant().Contains(query) ||
                Path.ToLowerInvariant().Contains(query) ||
                Module.ToLowerInvariant().Contains(query);
        }
    }

    public class SearchResultDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string Path { get; set; } = string.Empty;
        public string Module { get; set; } = string.Empty;
        public string Category { get; set; } = "page";
        public string? Icon { get; set; }
    }
}
