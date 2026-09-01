using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers.Platform
{
    [ApiController]
    [Route("api/v1/platform/search")]
    [Authorize]
    public class GlobalSearchController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public GlobalSearchController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public class SearchResultItem
        {
            public string Id { get; set; } = string.Empty;
            public string Category { get; set; } = string.Empty;
            public string Title { get; set; } = string.Empty;
            public string Subtitle { get; set; } = string.Empty;
            public string Path { get; set; } = string.Empty;
            public string Icon { get; set; } = string.Empty;
        }

        [HttpGet]
        public async Task<IActionResult> GlobalSearch([FromQuery] string? q, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
            {
                return Ok(new { results = new List<SearchResultItem>() });
            }

            var query = q.Trim().ToLower();
            var results = new List<SearchResultItem>();

            // 1. Search Customers
            var customers = await _db.Set<Customer>()
                .Where(c => !c.IsDeleted && (c.CustomerName.ToLower().Contains(query) || (c.Email != null && c.Email.ToLower().Contains(query)) || c.CustomerCode.ToLower().Contains(query)))
                .Take(5)
                .Select(c => new SearchResultItem
                {
                    Id = c.Id.ToString(),
                    Category = "Customer",
                    Title = c.CustomerName,
                    Subtitle = $"Code: {c.CustomerCode} · Email: {c.Email ?? "N/A"}",
                    Path = "/crm/customers",
                    Icon = "users"
                })
                .ToListAsync(cancellationToken);
            results.AddRange(customers);

            // 2. Search Vendors
            var vendors = await _db.Set<Vendor>()
                .Where(v => !v.IsDeleted && (v.VendorName.ToLower().Contains(query) || (v.Email != null && v.Email.ToLower().Contains(query)) || v.VendorCode.ToLower().Contains(query)))
                .Take(5)
                .Select(v => new SearchResultItem
                {
                    Id = v.Id.ToString(),
                    Category = "Vendor",
                    Title = v.VendorName,
                    Subtitle = $"Code: {v.VendorCode} · Email: {v.Email ?? "N/A"}",
                    Path = "/vendors",
                    Icon = "building-2"
                })
                .ToListAsync(cancellationToken);
            results.AddRange(vendors);

            // 3. Search Sales Orders
            var salesOrders = await _db.Set<SalesOrder>()
                .Include(s => s.Customer)
                .Where(s => !s.IsDeleted && (s.SONumber.ToLower().Contains(query) || (s.Customer != null && s.Customer.CustomerName.ToLower().Contains(query))))
                .Take(5)
                .Select(s => new SearchResultItem
                {
                    Id = s.Id.ToString(),
                    Category = "Sales Order",
                    Title = s.SONumber,
                    Subtitle = $"Customer: {(s.Customer != null ? s.Customer.CustomerName : "N/A")} · Status: {s.Status}",
                    Path = "/sales-orders",
                    Icon = "file-text"
                })
                .ToListAsync(cancellationToken);
            results.AddRange(salesOrders);

            // 4. Search Employees
            var employees = await _db.Employees
                .Where(e => !e.IsDeleted && (
                    (e.FullName != null && e.FullName.ToLower().Contains(query)) ||
                    (e.EmployeeCode != null && e.EmployeeCode.ToLower().Contains(query)) ||
                    (e.WorkEmail != null && e.WorkEmail.ToLower().Contains(query))
                ))
                .Take(5)
                .Select(e => new SearchResultItem
                {
                    Id = e.Id.ToString(),
                    Category = "Employee",
                    Title = e.FullName ?? e.EmployeeCode ?? "Employee",
                    Subtitle = $"Code: {e.EmployeeCode ?? "N/A"} · Email: {e.WorkEmail ?? "N/A"}",
                    Path = $"/hrms/employees/{e.Id}",
                    Icon = "user-check"
                })
                .ToListAsync(cancellationToken);
            results.AddRange(employees);

            // 5. Search Inventory Items
            var items = await _db.Set<Item>()
                .Where(i => !i.IsDeleted && (i.ItemName.ToLower().Contains(query) || i.ItemCode.ToLower().Contains(query)))
                .Take(5)
                .Select(i => new SearchResultItem
                {
                    Id = i.Id.ToString(),
                    Category = "Inventory Item",
                    Title = i.ItemName,
                    Subtitle = $"Code: {i.ItemCode} · Price: ₹{i.SellingPrice}",
                    Path = "/items",
                    Icon = "package"
                })
                .ToListAsync(cancellationToken);
            results.AddRange(items);

            return Ok(new { results });
        }
    }
}
