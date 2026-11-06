using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    public class TenantAdminSettingsDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string? GSTNumber { get; set; }
        public string? PANNumber { get; set; }
        public string? LogoUrl { get; set; }
        public string Currency { get; set; } = "INR";
        public string Timezone { get; set; } = "Asia/Kolkata";
        public string DateFormat { get; set; } = "DD/MM/YYYY";
        public string ThemeColor { get; set; } = "#4f46e5";
        public string FiscalYearStart { get; set; } = "04-01";
        public string? Address { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; } = "India";
        public string? PostalCode { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
    }

    public class InviteUserDto
    {
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = "User"; // Admin, Manager, User
        public string? Department { get; set; }
    }

    [ApiController]
    [Route("api/v1/admin")]
    [Route("api/v1/administration")]
    [Authorize(Policy = "AdminOnly")]
    [Authorize(Policy = "Module:platform")]
    public class AdminSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public AdminSettingsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId && !t.IsDeleted);
            var config = await _db.TenantConfigs.FirstOrDefaultAsync(c => c.TenantId == tenantId);
            var company = await _db.Companies.FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted);

            var settings = new TenantAdminSettingsDto
            {
                CompanyName = company?.Name ?? tenant?.Name ?? "My Organization",
                GSTNumber = company?.TaxId,
                PANNumber = company?.TaxId,
                LogoUrl = company?.LogoUrl,
                Address = company?.RegistrationAddress ?? company?.OperationalAddress,
                State = company?.State,
                Country = company?.Country ?? "India",
                PostalCode = company?.PostalCode,
                Phone = company?.PhoneNumber,
                Email = company?.Email,
            };

            if (config != null && !string.IsNullOrWhiteSpace(config.BrandingJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(config.BrandingJson);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("currency", out var c)) settings.Currency = c.GetString() ?? "INR";
                    if (root.TryGetProperty("timezone", out var tz)) settings.Timezone = tz.GetString() ?? "Asia/Kolkata";
                    if (root.TryGetProperty("dateFormat", out var df)) settings.DateFormat = df.GetString() ?? "DD/MM/YYYY";
                    if (root.TryGetProperty("themeColor", out var tc)) settings.ThemeColor = tc.GetString() ?? "#4f46e5";
                    if (root.TryGetProperty("fiscalYearStart", out var fy)) settings.FiscalYearStart = fy.GetString() ?? "04-01";
                    if (root.TryGetProperty("logoUrl", out var lu) && string.IsNullOrWhiteSpace(settings.LogoUrl)) settings.LogoUrl = lu.GetString();
                }
                catch
                {
                    // Fallback to default settings
                }
            }

            return Ok(new { success = true, data = settings });
        }

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] TenantAdminSettingsDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId && !t.IsDeleted);
            var company = await _db.Companies.FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted);
            var config = await _db.TenantConfigs.FirstOrDefaultAsync(c => c.TenantId == tenantId);

            if (company != null && !string.IsNullOrWhiteSpace(dto.CompanyName))
            {
                company.Name = dto.CompanyName;
                company.TaxId = dto.GSTNumber ?? dto.PANNumber;
                company.LogoUrl = dto.LogoUrl;
                company.RegistrationAddress = dto.Address;
                company.State = dto.State;
                company.Country = dto.Country ?? "India";
                company.PostalCode = dto.PostalCode;
                company.PhoneNumber = dto.Phone;
                company.Email = dto.Email;
                company.UpdatedAt = DateTime.UtcNow;
                _db.Companies.Update(company);
            }

            if (tenant != null && !string.IsNullOrWhiteSpace(dto.CompanyName))
            {
                tenant.Name = dto.CompanyName;
                tenant.UpdatedAt = DateTime.UtcNow;
                _db.Tenants.Update(tenant);
            }

            if (config == null)
            {
                config = new TenantConfig { TenantId = tenantId };
                _db.TenantConfigs.Add(config);
            }

            var brandingObj = new
            {
                currency = dto.Currency,
                timezone = dto.Timezone,
                dateFormat = dto.DateFormat,
                themeColor = dto.ThemeColor,
                fiscalYearStart = dto.FiscalYearStart,
                logoUrl = dto.LogoUrl
            };
            config.BrandingJson = JsonSerializer.Serialize(brandingObj);
            config.UpdatedAt = DateTime.UtcNow;
            _db.TenantConfigs.Update(config);

            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Tenant settings updated successfully", data = dto });
        }

        [HttpPost("users/invite")]
        public async Task<IActionResult> InviteUser([FromBody] InviteUserDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { success = false, error = "Email is required for invitation" });
            }

            var tenantId = _tenantAccessor.GetTenantId();
            var existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower() && u.TenantId == tenantId && !u.IsDeleted);

            if (existingUser != null)
            {
                return BadRequest(new { success = false, error = "User already exists in this organization" });
            }

            var systemRole = RoleCatalog.Parse(dto.Role);
            if (systemRole == SystemRole.Unknown)
            {
                return BadRequest(new { success = false, error = "Invalid role. Allowed roles: Employee, Manager, Admin." });
            }

            if (systemRole == SystemRole.SuperAdmin)
            {
                return BadRequest(new { success = false, error = "SuperAdmin cannot be assigned via invitation." });
            }

            var canonicalRoleName = RoleCatalog.ToCanonicalRoleName(systemRole);
            var role = await _db.Roles
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(r => r.TenantId == tenantId && !r.IsDeleted && r.Name == canonicalRoleName);

            if (role == null)
            {
                return BadRequest(new { success = false, error = $"Role '{canonicalRoleName}' is not configured for this organization." });
            }

            var user = new User
            {
                Email = dto.Email,
                FullName = string.IsNullOrWhiteSpace(dto.FullName) ? dto.Email.Split('@')[0] : dto.FullName,
                IsSystemAdmin = false,
                TenantId = tenantId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            _db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id, TenantId = tenantId });
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"User invitation sent to {dto.Email}",
                data = new { user.Id, user.Email, user.FullName, user.IsActive, role = canonicalRoleName }
            });
        }
    }
}
