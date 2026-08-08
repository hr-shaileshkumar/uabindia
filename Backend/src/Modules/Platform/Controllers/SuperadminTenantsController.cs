using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Services;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    public class ProvisionSuperadminTenantDto
    {
        public string Name { get; set; } = string.Empty;
        public string Subdomain { get; set; } = string.Empty;
        public string AdminEmail { get; set; } = string.Empty;
        public string AdminName { get; set; } = string.Empty;
        public string? AdminPassword { get; set; }
        public string SubscriptionPlan { get; set; } = "Enterprise";
        public string Status { get; set; } = "active";
        public string[] SelectedModules { get; set; } = Array.Empty<string>();
        public string? LogoUrl { get; set; }
        public string? Timezone { get; set; } = "Asia/Kolkata";
        public string? Currency { get; set; } = "INR";
        public string? DateFormat { get; set; } = "DD/MM/YYYY";
        public string? ThemeColor { get; set; } = "#4f46e5";
    }

    public class UpdateTenantStatusDto
    {
        public bool IsActive { get; set; }
        public string? Status { get; set; }
    }

    [ApiController]
    [Route("api/v1/superadmin/tenants")]
    [Authorize(Roles = "SUPERADMIN,SuperAdmin")]
    public class SuperadminTenantsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly TenantProvisioningService _provisioningService;

        public SuperadminTenantsController(ApplicationDbContext db, TenantProvisioningService provisioningService)
        {
            _db = db;
            _provisioningService = provisioningService;
        }

        [HttpGet]
        public async Task<IActionResult> ListTenants(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20,
            [FromQuery] string? search = null,
            [FromQuery] string? status = null)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 20;

            var query = _db.Tenants.AsNoTracking().IgnoreQueryFilters().Where(t => !t.IsDeleted);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower();
                query = query.Where(t => (t.Name != null && t.Name.ToLower().Contains(s)) || (t.Subdomain != null && t.Subdomain.ToLower().Contains(s)));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                if (status.Equals("active", StringComparison.OrdinalIgnoreCase)) query = query.Where(t => t.IsActive);
                else if (status.Equals("suspended", StringComparison.OrdinalIgnoreCase) || status.Equals("inactive", StringComparison.OrdinalIgnoreCase)) query = query.Where(t => !t.IsActive);
            }

            var total = await query.CountAsync();
            var tenants = await query
                .OrderBy(t => t.Name)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            var result = new System.Collections.Generic.List<object>(tenants.Count);
            foreach (var t in tenants)
            {
                var dto = await _provisioningService.BuildTenantDtoAsync(t);
                result.Add(dto);
            }

            return Ok(new { success = true, data = result, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpPost]
        public async Task<IActionResult> CreateTenant([FromBody] ProvisionSuperadminTenantDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Subdomain) || string.IsNullOrWhiteSpace(dto.AdminEmail))
            {
                return BadRequest(new { success = false, error = "Tenant name, subdomain, and admin email are required" });
            }

            var createDto = new CreateTenantDto
            {
                Name = dto.Name,
                Subdomain = dto.Subdomain,
                AdminEmail = dto.AdminEmail,
                AdminName = string.IsNullOrWhiteSpace(dto.AdminName) ? dto.Name + " Admin" : dto.AdminName,
                AdminRole = "Admin",
                AdminPassword = dto.AdminPassword,
                SubscriptionPlan = dto.SubscriptionPlan,
                Status = dto.Status == "suspended" ? "suspended" : "active",
                SelectedModules = dto.SelectedModules != null && dto.SelectedModules.Length > 0 ? dto.SelectedModules : new string[] { "platform", "hrms", "finance", "inventory" },
                LogoUrl = dto.LogoUrl,
                Timezone = dto.Timezone ?? "Asia/Kolkata",
                Currency = dto.Currency ?? "INR",
            };

            var tenantId = Guid.NewGuid();
            await _provisioningService.ProvisionTenantAsync(tenantId, createDto);

            var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == tenantId);
            var resultDto = tenant != null ? await _provisioningService.BuildTenantDtoAsync(tenant) : null;

            return Ok(new { success = true, message = "Tenant provisioned successfully", data = resultDto });
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTenantStatusDto dto)
        {
            var tenant = await _db.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);
            if (tenant == null)
            {
                return NotFound(new { success = false, error = "Tenant not found" });
            }

            tenant.IsActive = dto.IsActive || dto.Status?.ToLower() == "active";
            tenant.ProvisionStatus = tenant.IsActive ? "Active" : "Suspended";
            tenant.UpdatedAt = DateTime.UtcNow;

            _db.Tenants.Update(tenant);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = $"Tenant status updated to {(tenant.IsActive ? "Active" : "Suspended")}", isActive = tenant.IsActive });
        }
    }
}
