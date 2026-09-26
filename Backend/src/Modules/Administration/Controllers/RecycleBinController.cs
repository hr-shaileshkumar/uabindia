using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/administration/recycle-bin")]
    [Authorize]
    public class RecycleBinController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public RecycleBinController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public class RecycleBinItemDto
        {
            public string Id { get; set; } = string.Empty;
            public string EntityType { get; set; } = string.Empty;
            public string RecordName { get; set; } = string.Empty;
            public string RecordCode { get; set; } = string.Empty;
            public DateTime? DeletedAt { get; set; }
            public string Module { get; set; } = string.Empty;
            public string Status { get; set; } = "Deleted";
        }

        [HttpGet]
        public async Task<IActionResult> GetDeletedRecords([FromQuery] string? entityType = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var list = new List<RecycleBinItemDto>();

            // 1. Employees
            var emps = await _db.Employees.IgnoreQueryFilters()
                .Where(e => e.TenantId == tenantId && e.IsDeleted)
                .OrderByDescending(e => e.UpdatedAt)
                .Take(50)
                .Select(e => new RecycleBinItemDto
                {
                    Id = e.Id.ToString(),
                    EntityType = "Employee",
                    RecordName = e.FullName ?? "Employee",
                    RecordCode = e.EmployeeCode ?? string.Empty,
                    DeletedAt = e.UpdatedAt ?? e.CreatedAt,
                    Module = "HRMS"
                }).ToListAsync();
            list.AddRange(emps);

            // 2. Items
            var items = await _db.Items.IgnoreQueryFilters()
                .Where(i => i.TenantId == tenantId && i.IsDeleted)
                .OrderByDescending(i => i.UpdatedAt)
                .Take(50)
                .Select(i => new RecycleBinItemDto
                {
                    Id = i.Id.ToString(),
                    EntityType = "Item",
                    RecordName = i.ItemName,
                    RecordCode = i.ItemCode,
                    DeletedAt = i.UpdatedAt ?? i.CreatedAt,
                    Module = "Inventory"
                }).ToListAsync();
            list.AddRange(items);

            // 3. Customers
            var custs = await _db.Customers.IgnoreQueryFilters()
                .Where(c => c.TenantId == tenantId && c.IsDeleted)
                .OrderByDescending(c => c.UpdatedAt)
                .Take(50)
                .Select(c => new RecycleBinItemDto
                {
                    Id = c.Id.ToString(),
                    EntityType = "Customer",
                    RecordName = c.CustomerName,
                    RecordCode = c.CustomerCode,
                    DeletedAt = c.UpdatedAt ?? c.CreatedAt,
                    Module = "Sales"
                }).ToListAsync();
            list.AddRange(custs);

            // 4. Vendors
            var vends = await _db.Vendors.IgnoreQueryFilters()
                .Where(v => v.TenantId == tenantId && v.IsDeleted)
                .OrderByDescending(v => v.UpdatedAt)
                .Take(50)
                .Select(v => new RecycleBinItemDto
                {
                    Id = v.Id.ToString(),
                    EntityType = "Vendor",
                    RecordName = v.VendorName,
                    RecordCode = v.VendorCode,
                    DeletedAt = v.UpdatedAt ?? v.CreatedAt,
                    Module = "Procurement"
                }).ToListAsync();
            list.AddRange(vends);

            // 5. Sales Orders
            var sos = await _db.SalesOrders.IgnoreQueryFilters()
                .Where(s => s.TenantId == tenantId && s.IsDeleted)
                .OrderByDescending(s => s.UpdatedAt)
                .Take(50)
                .Select(s => new RecycleBinItemDto
                {
                    Id = s.Id.ToString(),
                    EntityType = "SalesOrder",
                    RecordName = $"Sales Order {s.SONumber}",
                    RecordCode = s.SONumber,
                    DeletedAt = s.UpdatedAt ?? s.CreatedAt,
                    Module = "Sales"
                }).ToListAsync();
            list.AddRange(sos);

            // 6. Purchase Orders
            var pos = await _db.PurchaseOrders.IgnoreQueryFilters()
                .Where(p => p.TenantId == tenantId && p.IsDeleted)
                .OrderByDescending(p => p.UpdatedAt)
                .Take(50)
                .Select(p => new RecycleBinItemDto
                {
                    Id = p.Id.ToString(),
                    EntityType = "PurchaseOrder",
                    RecordName = $"Purchase Order {p.PONumber}",
                    RecordCode = p.PONumber,
                    DeletedAt = p.UpdatedAt ?? p.CreatedAt,
                    Module = "Procurement"
                }).ToListAsync();
            list.AddRange(pos);

            // Filter if requested
            if (!string.IsNullOrWhiteSpace(entityType) && !entityType.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                list = list.Where(x => x.EntityType.Equals(entityType, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            var sorted = list.OrderByDescending(x => x.DeletedAt).ToList();
            return Ok(new
            {
                success = true,
                data = sorted,
                items = sorted,
                total = sorted.Count
            });
        }

        [HttpPost("{entityType}/{id:guid}/restore")]
        public async Task<IActionResult> Restore(string entityType, Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            bool restored = false;

            switch (entityType.ToLowerInvariant())
            {
                case "employee":
                    var emp = await _db.Employees.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId);
                    if (emp != null) { emp.IsDeleted = false; emp.UpdatedAt = DateTime.UtcNow; restored = true; }
                    break;
                case "item":
                    var item = await _db.Items.IgnoreQueryFilters().FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);
                    if (item != null) { item.IsDeleted = false; item.UpdatedAt = DateTime.UtcNow; restored = true; }
                    break;
                case "customer":
                    var cust = await _db.Customers.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
                    if (cust != null) { cust.IsDeleted = false; cust.UpdatedAt = DateTime.UtcNow; restored = true; }
                    break;
                case "vendor":
                    var vend = await _db.Vendors.IgnoreQueryFilters().FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId);
                    if (vend != null) { vend.IsDeleted = false; vend.UpdatedAt = DateTime.UtcNow; restored = true; }
                    break;
                case "salesorder":
                    var so = await _db.SalesOrders.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId);
                    if (so != null) { so.IsDeleted = false; so.UpdatedAt = DateTime.UtcNow; restored = true; }
                    break;
                case "purchaseorder":
                    var po = await _db.PurchaseOrders.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);
                    if (po != null) { po.IsDeleted = false; po.UpdatedAt = DateTime.UtcNow; restored = true; }
                    break;
            }

            if (!restored)
            {
                return NotFound(new { success = false, message = "Record not found in recycle bin." });
            }

            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = $"{entityType} restored successfully." });
        }
    }
}
