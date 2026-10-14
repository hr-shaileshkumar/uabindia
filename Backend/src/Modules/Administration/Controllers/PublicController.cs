using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Services;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Identity.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/public")]
    [AllowAnonymous]
    public class PublicController : ControllerBase
    {
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IWebsiteContentService _websiteContentService;
        private readonly ILogger<PublicController> _logger;
        private readonly ApplicationDbContext _db;
        private readonly IPasswordHasher<User> _hasher;
        private readonly JwtService _jwt;
        private readonly IEncryptionService _encryption;

        public PublicController(
            ITenantAccessor tenantAccessor,
            IWebsiteContentService websiteContentService,
            ILogger<PublicController> logger,
            ApplicationDbContext db,
            IPasswordHasher<User> hasher,
            JwtService jwt,
            IEncryptionService encryption)
        {
            _tenantAccessor = tenantAccessor;
            _websiteContentService = websiteContentService;
            _logger = logger;
            _db = db;
            _hasher = hasher;
            _jwt = jwt;
            _encryption = encryption;
        }

        [HttpGet("check-subdomain")]
        public async Task<IActionResult> CheckSubdomain([FromQuery] string? subdomain)
        {
            if (string.IsNullOrWhiteSpace(subdomain))
                return BadRequest(new { available = false, message = "Subdomain is required." });

            var slug = Regex.Replace(subdomain.Trim().ToLowerInvariant(), @"[^a-z0-9-]", "");
            if (slug.Length < 3)
                return Ok(new { available = false, message = "Subdomain must be at least 3 characters." });

            var reserved = new[] { "app", "api", "admin", "superadmin", "platform", "portal", "uabindia", "support", "billing" };
            if (reserved.Contains(slug))
                return Ok(new { available = false, message = "This subdomain is reserved." });

            var exists = await _db.Tenants.AsNoTracking().IgnoreQueryFilters()
                .AnyAsync(t => t.Subdomain == slug && t.DeletedAt == null);

            return Ok(new { available = !exists, slug });
        }

        [HttpPost("register-tenant")]
        [EnableRateLimiting("public-register")]
        public async Task<IActionResult> RegisterTenant([FromBody] SelfServeRegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CompanyName) || string.IsNullOrWhiteSpace(dto.AdminEmail) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { success = false, message = "Company Name, Email, and Password are required." });

            var slug = string.IsNullOrWhiteSpace(dto.Subdomain)
                ? Regex.Replace(dto.CompanyName.Trim().ToLowerInvariant(), @"[^a-z0-9-]", "")
                : Regex.Replace(dto.Subdomain.Trim().ToLowerInvariant(), @"[^a-z0-9-]", "");

            if (slug.Length < 3)
                slug = $"{slug}-erp";

            var tenantExists = await _db.Tenants.AsNoTracking().IgnoreQueryFilters()
                .AnyAsync(t => t.Subdomain == slug && t.DeletedAt == null);

            if (tenantExists)
                return BadRequest(new { success = false, message = $"Subdomain '{slug}' is already taken. Please choose another." });

            var normalizedAdminEmail = dto.AdminEmail.Trim().ToLowerInvariant();
            var adminEmailHash = _encryption.ComputeHash(normalizedAdminEmail);

            var emailExists = await _db.Users.AsNoTracking().IgnoreQueryFilters()
                .AnyAsync(u => u.EmailHash == adminEmailHash && !u.IsDeleted);

            if (emailExists)
                return BadRequest(new { success = false, message = "An account with this email address already exists." });

            // 1. Create Tenant
            var tenant = new Tenant
            {
                Name = dto.CompanyName.Trim(),
                Subdomain = slug,
                IsActive = true,
                ProvisionStatus = "Completed"
            };
            _db.Tenants.Add(tenant);
            await _db.SaveChangesAsync();

            // 2. Create Default Company
            var company = new Company
            {
                TenantId = tenant.Id,
                Name = dto.CompanyName.Trim(),
                LegalName = dto.CompanyName.Trim(),
                Industry = string.IsNullOrWhiteSpace(dto.Industry) ? "Technology & Services" : dto.Industry.Trim(),
                Country = "India",
                Email = dto.AdminEmail.Trim(),
                PhoneNumber = dto.PhoneNumber?.Trim(),
                IsActive = true
            };
            _db.Companies.Add(company);

            // 3. Create Admin Role & User
            var adminRole = new Role
            {
                TenantId = tenant.Id,
                Name = RoleCatalog.AdminRoleName,
                Description = "Tenant administrator with full company permissions."
            };
            _db.Roles.Add(adminRole);

            var user = new User
            {
                TenantId = tenant.Id,
                CompanyId = company.Id,
                Email = normalizedAdminEmail,
                EmailHash = adminEmailHash,
                FullName = string.IsNullOrWhiteSpace(dto.AdminName) ? "Admin" : dto.AdminName.Trim(),
                IsActive = true,
                IsSystemAdmin = false
            };
            user.PasswordHash = _hasher.HashPassword(user, dto.Password);
            _db.Users.Add(user);

            var userRole = new UserRole
            {
                TenantId = tenant.Id,
                UserId = user.Id,
                RoleId = adminRole.Id
            };
            _db.UserRoles.Add(userRole);

            // 4. Provision Free Trial Subscription
            var sub = new TenantSubscription
            {
                TenantId = tenant.Id,
                PlanCode = "trial",
                Status = "Active",
                BillingCycle = "Monthly",
                Amount = 0,
                Currency = "INR",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(14),
                TrialEndsAt = DateTime.UtcNow.AddDays(14),
                GatewayProvider = "Manual"
            };
            _db.TenantSubscriptions.Add(sub);

            // 5. Seed Core Chart of Accounts for Indian SME Accounting
            var coaDefaults = new (string Code, string Name, string Type, string SubType)[]
            {
                ("1000", "Cash in Hand", "Asset", "Current Asset"),
                ("1010", "Main Operating Bank Account", "Asset", "Current Asset"),
                ("1200", "Accounts Receivable (Trade Debtors)", "Asset", "Current Asset"),
                ("1400", "Finished Goods Inventory", "Asset", "Current Asset"),
                ("2000", "Accounts Payable (Trade Creditors)", "Liability", "Current Liability"),
                ("2100", "GST Output Tax Payable", "Liability", "Current Liability"),
                ("3000", "Shareholder Capital / Equity", "Equity", "Equity"),
                ("4000", "Sales Revenue (Goods & Services)", "Revenue", "Operating Revenue"),
                ("5000", "Cost of Goods Sold (COGS)", "Expense", "Direct Cost"),
                ("6000", "Salaries & Payroll Expense", "Expense", "Operating Expense"),
                ("6100", "Rent, Utilities & Office Expense", "Expense", "Operating Expense")
            };

            foreach (var (code, name, type, subType) in coaDefaults)
            {
                _db.ChartOfAccounts.Add(new ChartOfAccount
                {
                    TenantId = tenant.Id,
                    AccountCode = code,
                    AccountName = name,
                    AccountType = type,
                    SubType = subType,
                    IsActive = true
                });
            }

            // 5b. Seed Default Tenant Modules & SuperAdmin Role Permissions
            var defaultModuleKeys = new[]
            {
                "security", "sales", "compliance", "erp", "projects", "payroll",
                "procurement", "reports", "licensing", "notifications", "crm",
                "hrms", "workflow", "finance", "inventory", "platform"
            };

            foreach (var modKey in defaultModuleKeys)
            {
                _db.TenantModules.Add(new TenantModule
                {
                    TenantId = tenant.Id,
                    ModuleKey = modKey,
                    IsEnabled = true,
                    EnabledAt = DateTime.UtcNow
                });
            }

            var allPermissions = await _db.Permissions.AsNoTracking().Where(p => !p.IsDeleted).ToListAsync();
            foreach (var perm in allPermissions)
            {
                _db.RolePermissions.Add(new RolePermission
                {
                    TenantId = tenant.Id,
                    RoleId = adminRole.Id,
                    PermissionId = perm.Id
                });
            }

            await _db.SaveChangesAsync();

            // 6. Generate Token & Session Cookies
            var token = _jwt.GenerateToken(user.Id, tenant.Id, new[] { RoleCatalog.AdminRoleName }, TimeSpan.FromDays(7), isSystemAdmin: false);

            Response.Cookies.Append("access_token", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(7),
                Path = "/"
            });

            return Ok(new
            {
                success = true,
                message = "Workspace created successfully! Redirecting to setup...",
                token,
                tenant = new
                {
                    id = tenant.Id,
                    name = tenant.Name,
                    subdomain = tenant.Subdomain
                },
                user = new
                {
                    id = user.Id,
                    email = user.Email,
                    fullName = user.FullName
                }
            });
        }

        [HttpGet("company-profile")]
        public async Task<IActionResult> GetCompanyProfile([FromQuery] string? audience = null)
        {
            var normalizedAudience = string.Equals(audience, "platform", StringComparison.OrdinalIgnoreCase)
                ? "platform"
                : "tenant";

            try
            {
                var response = await _websiteContentService.GetCompanyProfileAsync(normalizedAudience);
                if (response == null)
                {
                    return Ok(new PublicCompanyProfileResponse
                    {
                        BrandingJson = "{}"
                    });
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falling back to empty public company profile for audience {Audience}.", normalizedAudience);
                return Ok(new PublicCompanyProfileResponse
                {
                    BrandingJson = "{}"
                });
            }
        }

        [HttpGet("site-data")]
        public async Task<IActionResult> GetSiteData([FromQuery] string? audience = null)
        {
            var normalizedAudience = string.Equals(audience, "platform", StringComparison.OrdinalIgnoreCase)
                ? "platform"
                : "tenant";

            try
            {
                var response = await _websiteContentService.GetPublicSiteDataAsync(normalizedAudience);
                if (response == null)
                {
                    return Ok(BuildFallbackSiteData(normalizedAudience));
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falling back to default public site data for audience {Audience}.", normalizedAudience);
                return Ok(BuildFallbackSiteData(normalizedAudience));
            }
        }

        [HttpGet("website-pages/{pageType}")]
        public async Task<IActionResult> GetWebsitePage(string pageType, [FromQuery] string? audience = null)
        {
            var normalizedAudience = string.Equals(audience, "platform", StringComparison.OrdinalIgnoreCase)
                ? "platform"
                : "tenant";

            try
            {
                var page = await _websiteContentService.GetPublicWebsitePageAsync(pageType, normalizedAudience);
                if (page == null)
                {
                    return Ok(new PublicWebsitePageResponse
                    {
                        PageType = pageType,
                        Title = pageType,
                        ContentJson = "{}",
                        IsPublished = false
                    });
                }

                return Ok(page);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falling back to default public page for page type {PageType} and audience {Audience}.", pageType, normalizedAudience);
                return Ok(new PublicWebsitePageResponse
                {
                    PageType = pageType,
                    Title = pageType,
                    ContentJson = "{}",
                    IsPublished = false
                });
            }
        }

        [HttpGet("site-manifest")]
        public async Task<IActionResult> GetSiteManifest([FromQuery] string? audience = null)
        {
            var normalizedAudience = string.Equals(audience, "platform", StringComparison.OrdinalIgnoreCase)
                ? "platform"
                : "tenant";

            try
            {
                var manifest = await _websiteContentService.GetPublicSiteManifestAsync(normalizedAudience);
                return Ok(manifest);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falling back to default public site manifest for audience {Audience}.", normalizedAudience);
                return Ok(BuildFallbackManifest(normalizedAudience));
            }
        }

        [HttpGet("modules")]
        public async Task<IActionResult> GetPublicModules()
        {
            try
            {
                var modules = await _db.Modules.AsNoTracking()
                    .Where(m => m.IsEnabled && m.IsActive)
                    .OrderBy(m => m.SortOrder)
                    .Select(m => new
                    {
                        slug = m.ModuleKey,
                        title = !string.IsNullOrEmpty(m.DisplayName) ? m.DisplayName : m.Name,
                        category = m.ModuleType == "business" ? "Operations" : m.ModuleType,
                        icon = m.Icon ?? "Boxes",
                        summary = m.Description ?? string.Empty
                    })
                    .ToListAsync();

                return Ok(modules);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load public modules from database.");
                return Ok(Array.Empty<object>());
            }
        }

        [HttpPost("contact")]
        public async Task<IActionResult> SubmitContact(
            [FromBody] PublicContactRequestDto dto,
            [FromQuery] string? audience = null,
            [FromQuery] string? context = null)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var normalizedAudience = string.Equals(audience, "platform", StringComparison.OrdinalIgnoreCase)
                ? "platform"
                : "tenant";
            var requestTenantId = _tenantAccessor.GetTenantId();
            var normalizedContext = string.Equals(context, "request-access", StringComparison.OrdinalIgnoreCase)
                ? "request-access"
                : "contact";
            var source = normalizedAudience == "platform" || requestTenantId == Guid.Empty
                ? "public-platform"
                : "public";
            if (!string.Equals(normalizedContext, "contact", StringComparison.Ordinal))
            {
                source = $"{source}:{normalizedContext}";
            }

            var submissionId = await _websiteContentService.SubmitPublicContactAsync(
                dto,
                source,
                normalizedAudience);
            if (!submissionId.HasValue)
            {
                return NotFound(new { message = "Tenant not resolved" });
            }

            return Ok(new { message = "Thanks for reaching out", id = submissionId.Value });
        }

        private static PublicSiteManifestResponse BuildFallbackManifest(string audience)
        {
            var isPlatform = string.Equals(audience, "platform", StringComparison.OrdinalIgnoreCase);
            return new PublicSiteManifestResponse
            {
                Audience = isPlatform ? "platform" : "tenant",
                TenantResolved = false,
                HomePath = isPlatform ? "/" : "/company",
                Pages = isPlatform
                    ? new List<PublicSitePageDto>
                    {
                        new() { Key = "platform-home", Label = "Home", Path = "/", IsEnabled = true, IsPublished = true, Placements = new List<string> { "primary", "footer" } },
                        new() { Key = "login", Label = "Login", Path = "/login", IsEnabled = true, IsPublished = true, Placements = new List<string> { "footer" } },
                    }
                    : new List<PublicSitePageDto>
                    {
                        new() { Key = "tenant-home", Label = "Home", Path = "/company", IsEnabled = true, IsPublished = true, Placements = new List<string> { "primary", "footer" } },
                        new() { Key = "login", Label = "Login", Path = "/login", IsEnabled = true, IsPublished = true, Placements = new List<string> { "footer" } },
                        new() { Key = "forgot-password", Label = "Forgot Password", Path = "/forgot-password", IsEnabled = true, IsPublished = true, Placements = new List<string>() },
                        new() { Key = "reset-password", Label = "Reset Password", Path = "/reset-password", IsEnabled = true, IsPublished = true, Placements = new List<string>() },
                        new() { Key = "register", Label = "Request Access", Path = "/register", IsEnabled = true, IsPublished = true, Placements = new List<string>() },
                    }
            };
        }

        private static PublicSiteDataResponse BuildFallbackSiteData(string audience)
        {
            return new PublicSiteDataResponse
            {
                Audience = string.Equals(audience, "platform", StringComparison.OrdinalIgnoreCase) ? "platform" : "tenant",
                GeneratedAtUtc = DateTime.UtcNow,
                SocialProof = new PublicSiteSocialProofDto
                {
                    ShowCustomerReferences = false,
                    ShowTestimonials = false,
                    Note = "Public site metrics are temporarily unavailable."
                }
            };
        }
    }

    public class SelfServeRegisterDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string? Subdomain { get; set; }
        public string? AdminName { get; set; }
        public string AdminEmail { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public string? PhoneNumber { get; set; }
    }
}
