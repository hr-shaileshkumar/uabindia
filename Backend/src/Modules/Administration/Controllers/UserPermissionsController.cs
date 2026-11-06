using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/permissions")]
    [Authorize]
    [Authorize(Policy = "Module:platform")]
    public class UserPermissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public UserPermissionsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private Guid TenantId => _tenantAccessor.GetTenantId();

        // ── 1. Comprehensive System Permission Catalog (Auto-Discovery Tree) ───

        [HttpGet("catalog")]
        public IActionResult GetPermissionCatalog()
        {
            var standardCrud = new List<PermissionActionCatalogItem>
            {
                new() { Key = "view", Label = "View", Description = "Can view records and reports" },
                new() { Key = "create", Label = "Create", Description = "Can add new records" },
                new() { Key = "edit", Label = "Edit", Description = "Can update existing records" },
                new() { Key = "delete", Label = "Delete", Description = "Can remove or archive records" },
                new() { Key = "export", Label = "Export", Description = "Can download Excel / CSV reports" },
            };

            var approverActions = new List<PermissionActionCatalogItem>(standardCrud)
            {
                new() { Key = "approve", Label = "Approve", Description = "Can approve / sign off requests" }
            };

            var catalog = new List<ModuleCatalogItem>
            {
                new()
                {
                    Key = "hrms",
                    Title = "HRMS & People",
                    Icon = "users",
                    Description = "Human resource management, attendance, leave, and payroll operations.",
                    Pages = new()
                    {
                        new() { Key = "employees", Title = "Employees Directory", Route = "/hrms/employees", SubGroup = "Workforce", Actions = approverActions },
                        new() { Key = "attendance", Title = "Attendance & Web Check-in", Route = "/hrms/attendance", SubGroup = "Time & Attendance", Actions = approverActions },
                        new() { Key = "leaves", Title = "Leave Requests & Policies", Route = "/hrms/leaves", SubGroup = "Time & Attendance", Actions = approverActions },
                        new() { Key = "shifts", Title = "Shift Scheduling & Roster", Route = "/hrms/shifts", SubGroup = "Time & Attendance", Actions = standardCrud },
                        new() { Key = "overtime", Title = "Overtime Management", Route = "/hrms/overtime", SubGroup = "Time & Attendance", Actions = approverActions },
                        new() { Key = "payroll", Title = "Payroll Processing & Payslips", Route = "/hrms/payroll", SubGroup = "Compensation", Actions = approverActions },
                        new() { Key = "training", Title = "Training & Certifications", Route = "/hrms/training", SubGroup = "Talent", Actions = standardCrud },
                        new() { Key = "performance", Title = "Performance Appraisals", Route = "/hrms/performance", SubGroup = "Talent", Actions = approverActions },
                    }
                },
                new()
                {
                    Key = "administration",
                    Title = "Administration & Platform",
                    Icon = "shield",
                    Description = "Tenant configuration, legal entities, geography, hierarchy, and access controls.",
                    Pages = new()
                    {
                        new() { Key = "companies", Title = "Companies & Legal Entities", Route = "/administration/companies", SubGroup = "Organization", Actions = standardCrud },
                        new() { Key = "geography-hierarchy", Title = "Geography, Zones & MVUs", Route = "/administration/geography-hierarchy", SubGroup = "Organization", Actions = standardCrud },
                        new() { Key = "branches", Title = "Branches & Warehouses", Route = "/administration/branches", SubGroup = "Organization", Actions = standardCrud },
                        new() { Key = "business-units", Title = "Business Units", Route = "/administration/business-units", SubGroup = "Organization", Actions = standardCrud },
                        new() { Key = "departments", Title = "Departments", Route = "/administration/departments", SubGroup = "Organization", Actions = standardCrud },
                        new() { Key = "designations", Title = "Designations & Bands", Route = "/administration/designations", SubGroup = "Organization", Actions = standardCrud },
                        new() { Key = "cost-centers", Title = "Cost Centers", Route = "/administration/cost-centers", SubGroup = "Organization", Actions = standardCrud },
                        new() { Key = "users", Title = "User Accounts", Route = "/administration/users", SubGroup = "Access Control", Actions = standardCrud },
                        new() { Key = "roles", Title = "Roles & Policies", Route = "/administration/roles", SubGroup = "Access Control", Actions = standardCrud },
                        new() { Key = "permissions", Title = "User Permissions Matrix", Route = "/administration/permissions", SubGroup = "Access Control", Actions = approverActions },
                        new() { Key = "audit-logs", Title = "Audit Logs & Security", Route = "/administration/audit-logs", SubGroup = "Compliance", Actions = standardCrud },
                    }
                },
                new()
                {
                    Key = "finance",
                    Title = "Finance & Accounting",
                    Icon = "dollar-sign",
                    Description = "General ledger, receivables, payables, invoicing, and bank reconciliation.",
                    Pages = new()
                    {
                        new() { Key = "invoices", Title = "Customer Invoices", Route = "/finance/invoices", SubGroup = "Billing", Actions = approverActions },
                        new() { Key = "expenses", Title = "Expenses & Claims", Route = "/finance/expenses", SubGroup = "Spending", Actions = approverActions },
                        new() { Key = "general-ledger", Title = "General Ledger & Journal", Route = "/finance/general-ledger", SubGroup = "Accounting", Actions = standardCrud },
                        new() { Key = "bank-reconciliation", Title = "Bank Reconciliation", Route = "/finance/bank-reconciliation", SubGroup = "Treasury", Actions = approverActions },
                        new() { Key = "reports", Title = "Financial Statements", Route = "/finance/reports", SubGroup = "Reporting", Actions = standardCrud },
                    }
                },
                new()
                {
                    Key = "crm",
                    Title = "CRM & Sales",
                    Icon = "briefcase",
                    Description = "Lead pipeline, opportunity tracking, customer management, and sales orders.",
                    Pages = new()
                    {
                        new() { Key = "leads", Title = "Leads Management", Route = "/crm/leads", SubGroup = "Sales Pipeline", Actions = standardCrud },
                        new() { Key = "opportunities", Title = "Opportunities", Route = "/crm/opportunities", SubGroup = "Sales Pipeline", Actions = approverActions },
                        new() { Key = "customers", Title = "Customers Directory", Route = "/crm/customers", SubGroup = "Accounts", Actions = standardCrud },
                        new() { Key = "sales-orders", Title = "Sales Orders", Route = "/crm/orders", SubGroup = "Orders", Actions = approverActions },
                    }
                },
                new()
                {
                    Key = "procurement",
                    Title = "Procurement & SCM",
                    Icon = "shopping-cart",
                    Description = "Supplier management, purchase requisitions, POs, and goods receipts.",
                    Pages = new()
                    {
                        new() { Key = "purchase-requests", Title = "Purchase Requisitions", Route = "/procurement/purchase-requests", SubGroup = "Purchasing", Actions = approverActions },
                        new() { Key = "purchase-orders", Title = "Purchase Orders", Route = "/procurement/purchase-orders", SubGroup = "Purchasing", Actions = approverActions },
                        new() { Key = "suppliers", Title = "Suppliers & Vendors", Route = "/procurement/suppliers", SubGroup = "Vendor Portal", Actions = standardCrud },
                        new() { Key = "grn", Title = "Goods Receipt Notes (GRN)", Route = "/procurement/grn", SubGroup = "Receiving", Actions = approverActions },
                    }
                },
                new()
                {
                    Key = "inventory",
                    Title = "Inventory & WMS",
                    Icon = "package",
                    Description = "Item master, stock movements, multiple warehouses, and bin management.",
                    Pages = new()
                    {
                        new() { Key = "items", Title = "Item Catalog & Stock", Route = "/inventory/items", SubGroup = "Stock Master", Actions = standardCrud },
                        new() { Key = "stock-adjustments", Title = "Stock Adjustments", Route = "/inventory/stock-adjustments", SubGroup = "Operations", Actions = approverActions },
                        new() { Key = "transfers", Title = "Inter-Warehouse Transfers", Route = "/inventory/transfers", SubGroup = "Operations", Actions = approverActions },
                    }
                },
                new()
                {
                    Key = "fleet",
                    Title = "Fleet & MVU Operations",
                    Icon = "truck",
                    Description = "Mobile veterinary vehicles, GPS trackers, fuel logs, and fleet maintenance.",
                    Pages = new()
                    {
                        new() { Key = "vehicles", Title = "Vehicles & MVUs", Route = "/fleet/vehicles", SubGroup = "Fleet Master", Actions = standardCrud },
                        new() { Key = "fuel-logs", Title = "Fuel & Mileage Logs", Route = "/fleet/fuel-logs", SubGroup = "Operations", Actions = approverActions },
                        new() { Key = "maintenance", Title = "Vehicle Maintenance", Route = "/fleet/maintenance", SubGroup = "Service", Actions = approverActions },
                    }
                },
                new()
                {
                    Key = "field-service",
                    Title = "Field Service & Dispatch",
                    Icon = "map-pin",
                    Description = "On-site dispatch tickets, field veterinary doctors, and live tracking.",
                    Pages = new()
                    {
                        new() { Key = "tickets", Title = "Service Tickets", Route = "/field-service/tickets", SubGroup = "Field Work", Actions = approverActions },
                        new() { Key = "technicians", Title = "Technicians & Doctors", Route = "/field-service/technicians", SubGroup = "Field Work", Actions = standardCrud },
                        new() { Key = "radar", Title = "Live Dispatch Radar", Route = "/field-service/radar", SubGroup = "Tracking", Actions = standardCrud },
                    }
                },
                new()
                {
                    Key = "compliance",
                    Title = "Statutory & Compliance",
                    Icon = "file-text",
                    Description = "Provident Fund, ESI, Professional Tax (PT), and labor statutory compliance.",
                    Pages = new()
                    {
                        new() { Key = "pf", Title = "Provident Fund (PF)", Route = "/compliance/pf", SubGroup = "Social Security", Actions = approverActions },
                        new() { Key = "esi", Title = "ESI Benefits & Submissions", Route = "/compliance/esi", SubGroup = "Social Security", Actions = approverActions },
                        new() { Key = "professional-tax", Title = "Professional Tax (PT)", Route = "/compliance/pt", SubGroup = "State Compliance", Actions = approverActions },
                        new() { Key = "reports", Title = "Statutory Filings", Route = "/compliance/reports", SubGroup = "Auditing", Actions = standardCrud },
                    }
                }
            };

            return Ok(new { catalog, totalModules = catalog.Count });
        }

        // ── 2. Get Permissions for Specific User ──────────────────────────────

        [HttpGet("users/{userId:guid}")]
        public async Task<IActionResult> GetUserPermissions(Guid userId)
        {
            var user = await _db.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == TenantId && !u.IsDeleted);

            if (user == null)
                return NotFound(new { message = "User not found in current tenant scope." });

            var perms = await _db.UserPermissions.AsNoTracking()
                .Where(p => p.UserId == userId && p.TenantId == TenantId && !p.IsDeleted && p.IsGranted)
                .Select(p => new UserPermissionItemDto
                {
                    Module = p.Module,
                    PageKey = p.PageKey,
                    Action = p.Action,
                    IsGranted = p.IsGranted
                })
                .ToListAsync();

            return Ok(new UserPermissionsResponse
            {
                UserId = user.Id,
                FullName = user.FullName ?? user.Email,
                Email = user.Email,
                Role = user.IsSystemAdmin ? "SystemAdmin" : "User",
                Permissions = perms
            });
        }

        // ── 3. Batch Save Permissions for Specific User ───────────────────────

        [HttpPost("users/{userId:guid}/batch")]
        public async Task<IActionResult> SaveUserPermissions(Guid userId, [FromBody] SaveUserPermissionsRequest request)
        {
            if (userId == Guid.Empty || userId != request.UserId)
                return BadRequest(new { message = "UserId mismatch in path and body." });

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == TenantId && !u.IsDeleted);
            if (user == null)
                return NotFound(new { message = "User not found in tenant scope." });

            // Remove existing user permissions in this tenant scope
            var existing = await _db.UserPermissions
                .Where(p => p.UserId == userId && p.TenantId == TenantId)
                .ToListAsync();

            _db.UserPermissions.RemoveRange(existing);

            // Add clean list of granted permissions
            var newEntities = request.Permissions
                .Select(p => new UserPermission
                {
                    TenantId = TenantId,
                    CompanyId = user.CompanyId,
                    UserId = userId,
                    Module = p.Module.Trim().ToLowerInvariant(),
                    PageKey = p.PageKey.Trim().ToLowerInvariant(),
                    Action = p.Action.Trim().ToLowerInvariant(),
                    IsGranted = true,
                    CreatedAt = DateTime.UtcNow
                })
                .ToList();

            _db.UserPermissions.AddRange(newEntities);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                count = newEntities.Count,
                message = $"Successfully updated {newEntities.Count} permission(s) for user {user.Email}."
            });
        }
    }
}
