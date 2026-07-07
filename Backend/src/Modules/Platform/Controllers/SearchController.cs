using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    [ApiController]
    [Route("api/v1/search")]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public SearchController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> Search([FromQuery] string? q = null, [FromQuery] int take = 20)
        {
            var query = (q ?? string.Empty).Trim();
            if (query.Length == 0)
            {
                return Ok(new { results = Array.Empty<SearchResultDto>() });
            }

            take = Math.Clamp(take, 1, 50);
            var normalized = query.ToLowerInvariant();

            var results = new List<SearchResultDto>();

            results.AddRange(PageSuggestions
                .Where(item => item.Matches(normalized))
                .Select(item => new SearchResultDto
                {
                    Title = item.Title,
                    Path = item.Path,
                    Module = item.Module,
                    Category = "page",
                    Icon = item.Icon,
                }));

            var employees = await _db.Employees
                .AsNoTracking()
                .Where(e => (e.FullName != null && e.FullName.ToLower().Contains(normalized))
                    || (e.EmployeeCode != null && e.EmployeeCode.ToLower().Contains(normalized)))
                .OrderBy(e => e.FullName)
                .Select(e => new SearchResultDto
                {
                    Title = e.FullName ?? e.EmployeeCode ?? "Employee",
                    Path = $"/hrms/employees/{e.Id}",
                    Module = "hrms",
                    Category = "module",
                    Icon = "users",
                })
                .Take(take)
                .ToListAsync();
            results.AddRange(employees);

            var companies = await _db.Companies
                .AsNoTracking()
                .Where(c => c.Name.ToLower().Contains(normalized) || (c.Code != null && c.Code.ToLower().Contains(normalized)))
                .OrderBy(c => c.Name)
                .Select(c => new SearchResultDto
                {
                    Title = c.Name,
                    Path = "/platform/companies",
                    Module = "platform",
                    Category = "module",
                    Icon = "building",
                })
                .Take(take)
                .ToListAsync();
            results.AddRange(companies);

            var projects = await _db.Projects
                .AsNoTracking()
                .Where(p => p.Name.ToLower().Contains(normalized) || (p.ProjectCode != null && p.ProjectCode.ToLower().Contains(normalized)))
                .OrderBy(p => p.Name)
                .Select(p => new SearchResultDto
                {
                    Title = p.Name,
                    Path = "/platform/projects",
                    Module = "platform",
                    Category = "module",
                    Icon = "folder",
                })
                .Take(take)
                .ToListAsync();
            results.AddRange(projects);

            var users = await _db.Users
                .AsNoTracking()
                .Where(u => (u.FullName != null && u.FullName.ToLower().Contains(normalized))
                    || (u.Email != null && u.Email.ToLower().Contains(normalized)))
                .OrderBy(u => u.FullName)
                .Select(u => new SearchResultDto
                {
                    Title = u.FullName ?? u.Email ?? "User",
                    Path = "/platform/users",
                    Module = "platform",
                    Category = "module",
                    Icon = "user",
                })
                .Take(take)
                .ToListAsync();
            results.AddRange(users);

            var websitePages = await _db.WebsitePages
                .AsNoTracking()
                .Where(page => page.Title.ToLower().Contains(normalized) || page.PageType.ToLower().Contains(normalized))
                .OrderBy(page => page.Title)
                .Select(page => new SearchResultDto
                {
                    Title = page.Title,
                    Path = "/platform/website/pages",
                    Module = "platform",
                    Category = "page",
                    Icon = "file-text",
                })
                .Take(take)
                .ToListAsync();
            results.AddRange(websitePages);

            return Ok(new { results = results.Take(take).ToList() });
        }

        private static readonly IReadOnlyList<PageSuggestion> PageSuggestions = new[]
        {
            new PageSuggestion("Dashboard", "/dashboard", "administration", "dashboard"),
            new PageSuggestion("HRMS", "/hrms", "hrms", "users"),
            new PageSuggestion("Payroll", "/payroll", "payroll", "payroll"),
            new PageSuggestion("Reports", "/reports", "reports", "bar-chart"),
            new PageSuggestion("Approvals", "/approvals", "administration", "check-circle"),
            new PageSuggestion("Notifications", "/notifications", "administration", "bell"),
            new PageSuggestion("Documents", "/documents", "administration", "file-text"),
            new PageSuggestion("Customers", "/customers", "sales", "users"),
            new PageSuggestion("Vendors", "/vendors", "procurement", "truck"),
            new PageSuggestion("Items", "/items", "inventory", "box"),
            new PageSuggestion("Warehouses", "/warehouses", "inventory", "warehouse"),
            new PageSuggestion("Finance", "/chart-of-accounts", "finance", "calculator"),
            new PageSuggestion("Security", "/security", "security", "shield"),
            new PageSuggestion("Integrations", "/integrations", "integrations", "plug"),
            new PageSuggestion("Helpdesk", "/helpdesk", "helpdesk", "ticket"),
            new PageSuggestion("Platform", "/platform", "platform", "settings"),
            new PageSuggestion("SuperAdmin Dashboard", "/superadmin/dashboard", "platform", "shield"),
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
        public string Path { get; set; } = string.Empty;
        public string Module { get; set; } = string.Empty;
        public string Category { get; set; } = "page";
        public string? Icon { get; set; }
    }
}
