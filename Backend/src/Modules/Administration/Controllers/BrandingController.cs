using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/branding")]
    [Route("api/branding")]
    public class BrandingController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public BrandingController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("current")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCurrent()
        {
            var tenantId = ResolveTenantId();
            var tenant = (tenantId != Guid.Empty
                ? await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId)
                : null)
                ?? await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Subdomain == "erp")
                ?? await _db.Tenants.AsNoTracking().FirstOrDefaultAsync();

            var config = tenant != null
                ? await _db.TenantConfigs.AsNoTracking().FirstOrDefaultAsync(c => c.TenantId == tenant.Id)
                : null;

            var company = tenant != null
                ? await _db.Companies.AsNoTracking().FirstOrDefaultAsync(c => c.TenantId == tenant.Id && c.IsActive && !c.IsDeleted)
                : null;

            string? logoUrl = company?.LogoUrl;
            string? brandName = company?.Name ?? tenant?.Name ?? "UabIndia ERP";
            string? primaryColor = "#2563eb";
            string? accentColor = "#3b82f6";
            string? supportPhone = company?.ContactPersonPhone ?? company?.PhoneNumber ?? "+91 7903055384";
            string? supportEmail = company?.ContactPersonEmail ?? company?.Email ?? "support@uabindia.in";

            if (config != null && !string.IsNullOrWhiteSpace(config.BrandingJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(config.BrandingJson);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("logoUrl", out var l) && l.GetString() != null) logoUrl = l.GetString();
                    if (root.TryGetProperty("brandName", out var b) && b.GetString() != null) brandName = b.GetString();
                    if (root.TryGetProperty("primaryColor", out var p) && p.GetString() != null) primaryColor = p.GetString();
                    if (root.TryGetProperty("accentColor", out var a) && a.GetString() != null) accentColor = a.GetString();
                    if (root.TryGetProperty("supportPhone", out var sp) && sp.GetString() != null) supportPhone = sp.GetString();
                    if (root.TryGetProperty("supportEmail", out var se) && se.GetString() != null) supportEmail = se.GetString();
                }
                catch { }
            }

            return Ok(new
            {
                tenantId = tenant?.Id.ToString() ?? Guid.Empty.ToString(),
                companyName = tenant?.Name ?? "UabIndia ERP",
                brandName,
                logoUrl = logoUrl ?? "/logo.png",
                primaryColor,
                accentColor,
                supportPhone = supportPhone ?? "+91 7903055384",
                supportEmail = supportEmail ?? "support@uabindia.in",
                brandingJson = config?.BrandingJson ?? "{}"
            });
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetBranding()
        {
            return await GetCurrent();
        }

        [HttpPut]
        [Authorize]
        public async Task<IActionResult> UpdateBranding([FromBody] BrandingUpdateDto dto)
        {
            var tenantId = ResolveTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { message = "Unable to resolve current tenant context." });
            }

            var config = await _db.TenantConfigs.FirstOrDefaultAsync(c => c.TenantId == tenantId);
            if (config == null)
            {
                config = new TenantConfig
                {
                    TenantId = tenantId
                };
                _db.TenantConfigs.Add(config);
            }

            string brandingJsonToSave;
            if (!string.IsNullOrWhiteSpace(dto.BrandingJson) && dto.BrandingJson != "{}")
            {
                brandingJsonToSave = dto.BrandingJson;
            }
            else
            {
                var brandingPayload = new
                {
                    brandName = dto.BrandName?.Trim(),
                    logoUrl = dto.LogoUrl?.Trim(),
                    primaryColor = dto.PrimaryColor?.Trim() ?? "#2563eb",
                    primaryHoverColor = dto.PrimaryColor?.Trim() ?? "#1d4ed8",
                    accentColor = dto.AccentColor?.Trim() ?? "#3b82f6",
                    faviconUrl = dto.FaviconUrl?.Trim(),
                    customDomain = dto.CustomDomain?.Trim(),
                    supportPhone = !string.IsNullOrWhiteSpace(dto.SupportPhone) ? dto.SupportPhone.Trim() : "+91 7903055384",
                    supportEmail = !string.IsNullOrWhiteSpace(dto.SupportEmail) ? dto.SupportEmail.Trim() : "support@uabindia.in"
                };
                brandingJsonToSave = JsonSerializer.Serialize(brandingPayload);
            }

            config.BrandingJson = brandingJsonToSave;
            if (!string.IsNullOrWhiteSpace(dto.CustomDomain))
            {
                config.CustomDomain = dto.CustomDomain.Trim();
            }
            config.UpdatedAt = DateTime.UtcNow;

            // Also update company details if present
            var companyToUpdate = await _db.Companies.FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted);
            if (companyToUpdate != null)
            {
                if (!string.IsNullOrWhiteSpace(dto.LogoUrl)) companyToUpdate.LogoUrl = dto.LogoUrl.Trim();
                if (!string.IsNullOrWhiteSpace(dto.BrandName)) companyToUpdate.Name = dto.BrandName.Trim();
                if (!string.IsNullOrWhiteSpace(dto.SupportPhone))
                {
                    companyToUpdate.PhoneNumber = dto.SupportPhone.Trim();
                    companyToUpdate.ContactPersonPhone = dto.SupportPhone.Trim();
                }
                if (!string.IsNullOrWhiteSpace(dto.SupportEmail))
                {
                    companyToUpdate.Email = dto.SupportEmail.Trim();
                    companyToUpdate.ContactPersonEmail = dto.SupportEmail.Trim();
                }
                companyToUpdate.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Branding, theme and contact info updated successfully.",
                brandingJson = brandingJsonToSave
            });
        }

        private Guid ResolveTenantId()
        {
            var tenantClaim = User?.Claims?.FirstOrDefault(c => c.Type == "tenant_id");
            if (tenantClaim != null && Guid.TryParse(tenantClaim.Value, out var claimTid) && claimTid != Guid.Empty)
            {
                return claimTid;
            }

            return _tenantAccessor.GetTenantId();
        }
    }

    public class BrandingUpdateDto
    {
        public string? BrandName { get; set; }
        public string? LogoUrl { get; set; }
        public string? PrimaryColor { get; set; }
        public string? AccentColor { get; set; }
        public string? FaviconUrl { get; set; }
        public string? CustomDomain { get; set; }
        public string? SupportPhone { get; set; }
        public string? SupportEmail { get; set; }
        public string? BrandingJson { get; set; }
    }
}
