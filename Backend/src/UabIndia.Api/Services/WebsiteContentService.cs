using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Services
{
    public class WebsiteContentService : IWebsiteContentService
    {
        private const string PlatformAudience = "platform";
        private const string TenantAudience = "tenant";

        private sealed record PublicRouteDefinition(
            string Key,
            string Label,
            string Path,
            string? PageType,
            bool AlwaysEnabled,
            params string[] Placements);

        private static readonly HashSet<string> SupportedPageTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "header",
            "home",
            "platform-home",
            "features",
            "industries",
            "pricing",
            "resources",
            "about",
            "contact",
            "book-demo",
            "career",
            "support",
            "privacy",
            "terms",
            "login",
            "forgot-password",
            "reset-password",
            "register",
            "footer",
        };

        private static readonly PublicRouteDefinition[] PlatformRoutes =
        {
            new("platform-home", "Home", "/", "platform-home", true, "primary", "footer"),
            new("products", "Product", "/products", "products", true, "primary", "footer"),
            new("industries", "Industries", "/industries", "industries", true, "primary", "footer"),
            new("pricing", "Pricing", "/pricing", "pricing", true, "primary", "footer"),
            new("resources", "Resources", "/resources", "resources", true, "primary", "footer"),
            new("about", "About", "/about", "about", true, "primary", "footer"),
            new("careers", "Careers", "/careers", "career", true, "primary", "footer"),
            new("contact", "Contact", "/contact", "contact", true, "primary", "footer"),
            new("book-demo", "Request a Demo", "/book-demo", "book-demo", true, "footer"),
            new("support", "Support", "/help-support", "support", false, "primary", "footer"),
            new("privacy", "Privacy", "/privacy", "privacy", true, "footer"),
            new("terms", "Terms", "/terms", "terms", true, "footer"),
            new("login", "Login", "/login", "login", true, "footer"),
            new("forgot-password", "Forgot Password", "/forgot-password", "forgot-password", true),
            new("reset-password", "Reset Password", "/reset-password", "reset-password", true),
            new("register", "Request Access", "/register", "register", true),
        };

        private static readonly PublicRouteDefinition[] TenantRoutes =
        {
            new("tenant-home", "Home", "/company", "home", true, "primary", "footer"),
            new("about", "About", "/about", "about", false, "primary", "footer"),
            new("resources", "Resources", "/resources", "resources", false, "primary", "footer"),
            new("careers", "Careers", "/careers", "career", false, "primary", "footer"),
            new("contact", "Contact", "/contact", "contact", false, "primary", "footer"),
            new("book-demo", "Request a Demo", "/book-demo", "book-demo", true),
            new("support", "Support", "/help-support", "support", false, "primary", "footer"),
            new("privacy", "Privacy", "/privacy", "privacy", true, "footer"),
            new("terms", "Terms", "/terms", "terms", true, "footer"),
            new("login", "Login", "/login", "login", true, "footer"),
            new("forgot-password", "Forgot Password", "/forgot-password", "forgot-password", true),
            new("reset-password", "Reset Password", "/reset-password", "reset-password", true),
            new("register", "Request Access", "/register", "register", true),
        };

        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly InputSanitizer _sanitizer;
        private readonly IConfiguration _configuration;
        private readonly IHostEnvironment _environment;
        private readonly ILogger<WebsiteContentService> _logger;

        public WebsiteContentService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            InputSanitizer sanitizer,
            IConfiguration configuration,
            IHostEnvironment environment,
            ILogger<WebsiteContentService> logger)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _sanitizer = sanitizer;
            _configuration = configuration;
            _environment = environment;
            _logger = logger;
        }

        public bool IsSupportedPageType(string pageType)
        {
            return SupportedPageTypes.Contains(pageType?.Trim() ?? string.Empty);
        }

        public async Task<Tenant?> ResolveCurrentTenantAsync()
        {
            var requestTenantId = _tenantAccessor.GetTenantId();
            if (requestTenantId == Guid.Empty)
            {
                return null;
            }

            return await _db.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == requestTenantId && t.IsActive && !t.IsDeleted);
        }

        public async Task<Tenant?> ResolvePlatformTenantAsync()
        {
            var platformSubdomain = GetPlatformTenantSubdomain();
            var tenant = await _db.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t =>
                    t.IsActive
                    && !t.IsDeleted
                    && t.Subdomain != null
                    && t.Subdomain == platformSubdomain);

            if (tenant == null)
            {
                _logger.LogWarning(
                    "Platform public content tenant was not found for configured subdomain {Subdomain}.",
                    platformSubdomain);
            }

            return tenant;
        }

        public async Task<Tenant?> ResolveTenantForPublicAudienceAsync(string audience)
        {
            var tenant = NormalizeAudience(audience) == PlatformAudience
                ? await ResolvePlatformTenantAsync()
                : await ResolveCurrentTenantAsync();

            if (tenant != null)
            {
                SetTenantAccessContext(tenant);
            }

            return tenant;
        }

        public async Task<PublicCompanyProfileResponse?> GetCompanyProfileAsync(string audience)
        {
            var tenant = await ResolveTenantForPublicAudienceAsync(audience);
            if (tenant == null)
            {
                return null;
            }

            var company = await _db.Companies
                .AsNoTracking()
                .Where(c => c.TenantId == tenant.Id && c.IsActive && !c.IsDeleted)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new PublicCompanyProfileDto
                {
                    Id = c.Id,
                    Name = c.Name ?? string.Empty,
                    LegalName = c.LegalName,
                    WebsiteUrl = c.WebsiteUrl,
                    LogoUrl = c.LogoUrl,
                    Industry = c.Industry,
                    CompanySize = c.CompanySize,
                    Email = c.Email,
                    PhoneNumber = c.PhoneNumber,
                    ContactPersonName = c.ContactPersonName,
                    ContactPersonEmail = c.ContactPersonEmail,
                    ContactPersonPhone = c.ContactPersonPhone,
                    HRPersonName = c.HR_PersonName,
                    HRPersonEmail = c.HR_PersonEmail,
                    City = c.City,
                    State = c.State,
                    Country = c.Country
                })
                .FirstOrDefaultAsync();

            var brandingJson = await TryGetBrandingJsonAsync(tenant.Id);

            return new PublicCompanyProfileResponse
            {
                Tenant = new TenantDto
                {
                    Id = tenant.Id,
                    Name = tenant.Name ?? string.Empty,
                    Subdomain = tenant.Subdomain ?? string.Empty,
                    IsActive = tenant.IsActive
                },
                Company = company,
                BrandingJson = brandingJson
            };
        }

        public async Task<PublicSiteDataResponse?> GetPublicSiteDataAsync(string audience)
        {
            var normalizedAudience = NormalizeAudience(audience);
            var tenant = await ResolveTenantForPublicAudienceAsync(normalizedAudience);

            if (tenant == null && normalizedAudience != PlatformAudience)
            {
                return null;
            }

            var activeTenantCount = await _db.Tenants
                .AsNoTracking()
                .CountAsync(t => t.IsActive && !t.IsDeleted);
            var enabledGlobalModuleCount = await _db.Modules
                .AsNoTracking()
                .CountAsync(m => m.IsEnabled && m.IsActive);

            var activeCompanyCount = await SafeTenantCountAsync(() =>
                _db.Companies.AsNoTracking().CountAsync(c => c.IsActive && !c.IsDeleted));
            var employeeRecordCount = await SafeTenantCountAsync(() =>
                _db.Employees.AsNoTracking().CountAsync(e => !e.IsDeleted));
            var enabledTenantModuleCount = await SafeTenantCountAsync(() =>
                _db.TenantModules.AsNoTracking().CountAsync(tm => tm.IsEnabled && !tm.IsDeleted));
            var publishedPageCount = await SafeTenantCountAsync(() =>
                _db.WebsitePages.AsNoTracking().CountAsync(p => p.IsPublished && !p.IsDeleted));
            var activeJobPostingCount = await SafeTenantCountAsync(() =>
                _db.JobPostings.AsNoTracking().CountAsync(j => j.IsActive && !j.IsDeleted && j.Status == JobStatus.Open));
            var publicContactCount = await SafeTenantCountAsync(() =>
                _db.ContactSubmissions.AsNoTracking().CountAsync(c => !c.IsDeleted));
            var industryCoverage = await GetIndustryCoverageAsync();

            return normalizedAudience == PlatformAudience
                ? BuildPlatformSiteDataResponse(
                    activeTenantCount,
                    enabledGlobalModuleCount,
                    activeCompanyCount,
                    publishedPageCount,
                    activeJobPostingCount,
                    publicContactCount,
                    industryCoverage)
                : BuildTenantSiteDataResponse(
                    enabledTenantModuleCount,
                    activeCompanyCount,
                    employeeRecordCount,
                    publishedPageCount,
                    activeJobPostingCount,
                    publicContactCount,
                    industryCoverage);
        }

        public async Task<PublicWebsitePageResponse?> GetPublicWebsitePageAsync(string pageType, string audience)
        {
            if (!IsSupportedPageType(pageType))
            {
                return null;
            }

            var normalizedPageType = pageType.Trim().ToLowerInvariant();
            var normalizedAudience = NormalizeAudience(audience);
            var tenant = await ResolveTenantForPublicAudienceAsync(normalizedAudience);
            if (tenant == null)
            {
                return normalizedAudience == PlatformAudience
                    ? BuildDefaultPage(normalizedPageType)
                    : null;
            }

            var page = await _db.WebsitePages
                .AsNoTracking()
                .Where(p => p.TenantId == tenant.Id && p.PageType == normalizedPageType && p.IsPublished && !p.IsDeleted)
                .Select(p => new PublicWebsitePageResponse
                {
                    PageType = p.PageType,
                    Title = p.Title,
                    ContentJson = p.ContentJson,
                    IsPublished = p.IsPublished
                })
                .FirstOrDefaultAsync();

            return page ?? BuildDefaultPage(normalizedPageType);
        }

        public async Task<PublicSiteManifestResponse> GetPublicSiteManifestAsync(string audience)
        {
            var normalizedAudience = NormalizeAudience(audience);

            if (normalizedAudience == PlatformAudience)
            {
                var platformTenant = await ResolveTenantForPublicAudienceAsync(PlatformAudience);
                var platformTenantDto = platformTenant == null
                    ? null
                    : new TenantDto
                    {
                        Id = platformTenant.Id,
                        Name = platformTenant.Name ?? string.Empty,
                        Subdomain = platformTenant.Subdomain ?? string.Empty,
                        IsActive = platformTenant.IsActive
                    };
                var platformPageStates = platformTenant == null
                    ? new Dictionary<string, bool>(StringComparer.OrdinalIgnoreCase)
                    : (await _db.WebsitePages
                        .AsNoTracking()
                        .Where(p => p.TenantId == platformTenant.Id && !p.IsDeleted)
                        .Select(p => new { p.PageType, p.IsPublished })
                        .ToListAsync())
                        .GroupBy(p => p.PageType, StringComparer.OrdinalIgnoreCase)
                        .ToDictionary(
                            group => group.Key,
                            group => group.OrderByDescending(item => item.IsPublished).First().IsPublished,
                            StringComparer.OrdinalIgnoreCase);

                return new PublicSiteManifestResponse
                {
                    Audience = PlatformAudience,
                    TenantResolved = platformTenant != null,
                    HomePath = "/",
                    Tenant = platformTenantDto,
                    Pages = BuildManifestPages(PlatformRoutes, platformPageStates)
                };
            }

            var tenant = await ResolveTenantForPublicAudienceAsync(TenantAudience);
            var tenantDto = tenant == null
                ? null
                : new TenantDto
                {
                    Id = tenant.Id,
                    Name = tenant.Name ?? string.Empty,
                    Subdomain = tenant.Subdomain ?? string.Empty,
                    IsActive = tenant.IsActive
                };

            var pageStates = tenant == null
                ? new Dictionary<string, bool>(StringComparer.OrdinalIgnoreCase)
                : (await _db.WebsitePages
                    .AsNoTracking()
                    .Where(p => p.TenantId == tenant.Id && !p.IsDeleted)
                    .Select(p => new { p.PageType, p.IsPublished })
                    .ToListAsync())
                    .GroupBy(p => p.PageType, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(
                        group => group.Key,
                        group => group.OrderByDescending(item => item.IsPublished).First().IsPublished,
                        StringComparer.OrdinalIgnoreCase);

            return new PublicSiteManifestResponse
            {
                Audience = TenantAudience,
                TenantResolved = tenant != null,
                HomePath = "/company",
                Tenant = tenantDto,
                Pages = BuildManifestPages(TenantRoutes, pageStates)
            };
        }

        public async Task<Guid?> SubmitPublicContactAsync(PublicContactRequestDto dto, string source, string audience)
        {
            var tenant = await ResolveTenantForPublicAudienceAsync(audience);
            if (tenant == null)
            {
                return null;
            }

            var submission = new ContactSubmission
            {
                TenantId = tenant.Id,
                Name = _sanitizer.Sanitize(dto.Name) ?? dto.Name,
                Email = _sanitizer.Sanitize(dto.Email) ?? dto.Email,
                PhoneNumber = _sanitizer.Sanitize(dto.PhoneNumber),
                CompanyName = _sanitizer.Sanitize(dto.CompanyName),
                Subject = _sanitizer.Sanitize(dto.Subject),
                Message = _sanitizer.Sanitize(dto.Message) ?? dto.Message,
                Source = source
            };

            _db.ContactSubmissions.Add(submission);
            await _db.SaveChangesAsync();
            return submission.Id;
        }

        public async Task<IReadOnlyList<WebsitePageSummaryDto>> GetManagedPagesAsync(bool includeAllTenants, Guid tenantId)
        {
            var query = _db.WebsitePages
                .AsNoTracking()
                .Where(p => !p.IsDeleted);

            if (!includeAllTenants)
            {
                query = query.Where(p => p.TenantId == tenantId);
            }

            return await (from p in query
                join t in _db.Tenants.AsNoTracking() on p.TenantId equals t.Id
                orderby t.Name, p.PageType
                select new WebsitePageSummaryDto
                {
                    Id = p.Id,
                    PageType = p.PageType,
                    Title = p.Title,
                    ContentJson = p.ContentJson,
                    IsPublished = p.IsPublished,
                    PublishedAt = p.PublishedAt,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    TenantId = p.TenantId,
                    TenantName = t.Name ?? string.Empty
                })
                .ToListAsync();
        }

        public async Task<PublicWebsitePageResponse> GetManagedPageAsync(string pageType, Guid tenantId)
        {
            EnsureSupportedPageType(pageType);

            var normalizedPageType = pageType.Trim().ToLowerInvariant();
            var page = await _db.WebsitePages
                .AsNoTracking()
                .Where(p => p.TenantId == tenantId && p.PageType == normalizedPageType && !p.IsDeleted)
                .Select(p => new PublicWebsitePageResponse
                {
                    PageType = p.PageType,
                    Title = p.Title,
                    ContentJson = p.ContentJson,
                    IsPublished = p.IsPublished
                })
                .FirstOrDefaultAsync();

            return page ?? BuildDefaultPage(normalizedPageType);
        }

        public async Task<WebsitePageSummaryDto> SaveManagedPageAsync(string pageType, UpdateWebsitePageRequest request, Guid tenantId, Guid userId)
        {
            EnsureSupportedPageType(pageType);

            var normalizedPageType = pageType.Trim().ToLowerInvariant();
            var title = string.IsNullOrWhiteSpace(request.Title) ? GetDefaultTitle(normalizedPageType) : request.Title.Trim();
            var contentJson = NormalizeStructuredContentJson(request.ContentJson);

            var page = await _db.WebsitePages
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.PageType == normalizedPageType && !p.IsDeleted);

            if (page == null)
            {
                page = new WebsitePage
                {
                    TenantId = tenantId,
                    PageType = normalizedPageType,
                    Title = title,
                    ContentJson = contentJson,
                    IsPublished = false,
                    CreatedBy = userId
                };
                _db.WebsitePages.Add(page);
            }
            else
            {
                page.Title = title;
                page.ContentJson = contentJson;
                page.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            var tenantName = await _db.Tenants
                .AsNoTracking()
                .Where(t => t.Id == tenantId)
                .Select(t => t.Name ?? string.Empty)
                .FirstOrDefaultAsync() ?? string.Empty;

            return new WebsitePageSummaryDto
            {
                Id = page.Id,
                PageType = page.PageType,
                Title = page.Title,
                ContentJson = page.ContentJson,
                IsPublished = page.IsPublished,
                PublishedAt = page.PublishedAt,
                CreatedAt = page.CreatedAt,
                UpdatedAt = page.UpdatedAt,
                TenantId = page.TenantId,
                TenantName = tenantName
            };
        }

        public async Task<bool> SetPublishStateAsync(string pageType, Guid tenantId, Guid userId, bool isPublished)
        {
            EnsureSupportedPageType(pageType);

            var normalizedPageType = pageType.Trim().ToLowerInvariant();
            var page = await _db.WebsitePages
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.PageType == normalizedPageType && !p.IsDeleted);

            if (page == null)
            {
                return false;
            }

            page.IsPublished = isPublished;
            page.PublishedAt = isPublished ? DateTime.UtcNow : null;
            page.PublishedBy = isPublished ? userId : null;
            page.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return true;
        }

        private async Task<string> TryGetBrandingJsonAsync(Guid tenantId)
        {
            try
            {
                return await _db.TenantConfigs
                    .AsNoTracking()
                    .Where(c => c.TenantId == tenantId)
                    .Select(c => c.BrandingJson)
                    .FirstOrDefaultAsync() ?? "{}";
            }
            catch (Exception ex) when (ex is Microsoft.Data.SqlClient.SqlException || ex.Message.Contains("TenantConfigs", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning(ex, "Falling back to empty branding for tenant {TenantId}", tenantId);
                return "{}";
            }
        }

        private PublicSiteDataResponse BuildPlatformSiteDataResponse(
            int activeTenantCount,
            int enabledGlobalModuleCount,
            int activeCompanyCount,
            int publishedPageCount,
            int activeJobPostingCount,
            int publicContactCount,
            List<PublicSiteCoverageDto> industryCoverage)
        {
            return new PublicSiteDataResponse
            {
                Audience = PlatformAudience,
                GeneratedAtUtc = DateTime.UtcNow,
                HeroMetrics =
                {
                    new PublicSiteMetricDto
                    {
                        Label = "Public site source",
                        Value = "Live API",
                        Helper = "Homepage metrics and CTA flows are served from backend responses instead of hardcoded marketing numbers."
                    },
                    new PublicSiteMetricDto
                    {
                        Label = "Active client workspaces",
                        Value = activeTenantCount.ToString("N0"),
                        Helper = "Counts active tenant workspaces registered in the live platform database."
                    },
                    new PublicSiteMetricDto
                    {
                        Label = "Enabled platform modules",
                        Value = enabledGlobalModuleCount.ToString("N0"),
                        Helper = "Reflects the live module catalog currently enabled for the platform."
                    },
                    new PublicSiteMetricDto
                    {
                        Label = "Published public pages",
                        Value = publishedPageCount.ToString("N0"),
                        Helper = "Only published public website pages are counted in this metric."
                    }
                },
                DashboardMetrics =
                {
                    new PublicSiteMetricDto
                    {
                        Label = "Public enquiries received",
                        Value = publicContactCount.ToString("N0"),
                        Helper = "Tracks live submissions coming through public contact and demo forms."
                    },
                    new PublicSiteMetricDto
                    {
                        Label = "Company records available",
                        Value = activeCompanyCount.ToString("N0"),
                        Helper = "Shows how many company records are currently available in the resolved public workspace."
                    },
                    new PublicSiteMetricDto
                    {
                        Label = "Open career roles",
                        Value = activeJobPostingCount.ToString("N0"),
                        Helper = "Counts job postings that are live and publicly visible right now."
                    },
                    new PublicSiteMetricDto
                    {
                        Label = "Customer proof policy",
                        Value = "Approval based",
                        Helper = "Customer names, logos, and testimonials stay hidden until explicit public approval is captured."
                    }
                },
                SummaryStats =
                {
                    new PublicSiteStatDto { Value = activeTenantCount, Label = "Active client workspaces" },
                    new PublicSiteStatDto { Value = enabledGlobalModuleCount, Label = "Enabled platform modules" },
                    new PublicSiteStatDto { Value = publishedPageCount, Label = "Published public pages" },
                    new PublicSiteStatDto { Value = publicContactCount, Label = "Public enquiries received" }
                },
                IndustryCoverage = industryCoverage,
                SocialProof = BuildSocialProofNotice()
            };
        }

        private PublicSiteDataResponse BuildTenantSiteDataResponse(
            int enabledTenantModuleCount,
            int activeCompanyCount,
            int employeeRecordCount,
            int publishedPageCount,
            int activeJobPostingCount,
            int publicContactCount,
            List<PublicSiteCoverageDto> industryCoverage)
        {
            return new PublicSiteDataResponse
            {
                Audience = TenantAudience,
                GeneratedAtUtc = DateTime.UtcNow,
                HeroMetrics =
                {
                    new PublicSiteMetricDto
                    {
                        Label = "Public site source",
                        Value = "Live API",
                        Helper = "Tenant-facing public pages read published content and counts from the backend."
                    },
                    new PublicSiteMetricDto
                    {
                        Label = "Company records",
                        Value = activeCompanyCount.ToString("N0"),
                        Helper = "Counts active company records currently available in this tenant workspace."
                    },
                    new PublicSiteMetricDto
                    {
                        Label = "Employee records",
                        Value = employeeRecordCount.ToString("N0"),
                        Helper = "Shows live employee records managed inside this tenant workspace."
                    },
                    new PublicSiteMetricDto
                    {
                        Label = "Enabled modules",
                        Value = enabledTenantModuleCount.ToString("N0"),
                        Helper = "Reflects the modules currently enabled for this tenant."
                    }
                },
                DashboardMetrics =
                {
                    new PublicSiteMetricDto
                    {
                        Label = "Published public pages",
                        Value = publishedPageCount.ToString("N0"),
                        Helper = "Only currently published public pages are included here."
                    },
                    new PublicSiteMetricDto
                    {
                        Label = "Open career roles",
                        Value = activeJobPostingCount.ToString("N0"),
                        Helper = "Counts currently active public job postings in this tenant workspace."
                    },
                    new PublicSiteMetricDto
                    {
                        Label = "Public enquiries received",
                        Value = publicContactCount.ToString("N0"),
                        Helper = "Tracks live contact and access-request submissions for this tenant."
                    },
                    new PublicSiteMetricDto
                    {
                        Label = "Customer proof policy",
                        Value = "Approval based",
                        Helper = "Public customer references remain hidden until a dedicated approval model is added."
                    }
                },
                SummaryStats =
                {
                    new PublicSiteStatDto { Value = activeCompanyCount, Label = "Company records" },
                    new PublicSiteStatDto { Value = employeeRecordCount, Label = "Employee records" },
                    new PublicSiteStatDto { Value = enabledTenantModuleCount, Label = "Enabled modules" },
                    new PublicSiteStatDto { Value = publicContactCount, Label = "Public enquiries received" }
                },
                IndustryCoverage = industryCoverage,
                SocialProof = BuildSocialProofNotice()
            };
        }

        private static PublicSiteSocialProofDto BuildSocialProofNotice()
        {
            return new PublicSiteSocialProofDto
            {
                ShowCustomerReferences = false,
                ShowTestimonials = false,
                Note = "Customer names, logos, and testimonials are hidden by default until explicit public-display approval is captured in the data model."
            };
        }

        private async Task<int> SafeTenantCountAsync(Func<Task<int>> countOperation)
        {
            try
            {
                return await countOperation();
            }
            catch (Exception ex) when (IsMissingOrUnprovisionedTenantObject(ex))
            {
                _logger.LogWarning(ex, "Skipping tenant-scoped public metric because the tenant schema is unavailable or incomplete.");
                return 0;
            }
        }

        private async Task<List<PublicSiteCoverageDto>> GetIndustryCoverageAsync()
        {
            try
            {
                var industries = await _db.Companies
                    .AsNoTracking()
                    .Where(c => c.IsActive && !c.IsDeleted && !string.IsNullOrWhiteSpace(c.Industry))
                    .GroupBy(c => c.Industry!.Trim())
                    .Select(group => new
                    {
                        Name = group.Key,
                        Count = group.Count()
                    })
                    .OrderByDescending(item => item.Count)
                    .ThenBy(item => item.Name)
                    .Take(6)
                    .ToListAsync();

                return industries
                    .Select(item => new PublicSiteCoverageDto
                    {
                        Name = item.Name,
                        Sector = item.Count == 1 ? "1 active company record" : $"{item.Count} active company records",
                        Mark = BuildInitials(item.Name),
                        Count = item.Count
                    })
                    .ToList();
            }
            catch (Exception ex) when (IsMissingOrUnprovisionedTenantObject(ex))
            {
                _logger.LogWarning(ex, "Skipping industry coverage for the public site because company data is unavailable.");
                return new List<PublicSiteCoverageDto>();
            }
        }

        private static string BuildInitials(string value)
        {
            var parts = (value ?? string.Empty)
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Take(2)
                .Select(part => char.ToUpperInvariant(part[0]))
                .ToArray();

            if (parts.Length == 0)
            {
                return "NA";
            }

            return new string(parts);
        }

        private static bool IsMissingOrUnprovisionedTenantObject(Exception ex)
        {
            var text = ex.ToString();
            return text.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase)
                || text.Contains("Cannot find the object", StringComparison.OrdinalIgnoreCase)
                || text.Contains("Could not find object", StringComparison.OrdinalIgnoreCase)
                || text.Contains("does not exist", StringComparison.OrdinalIgnoreCase);
        }

        private static PublicWebsitePageResponse BuildDefaultPage(string pageType)
        {
            return new PublicWebsitePageResponse
            {
                PageType = pageType,
                Title = GetDefaultTitle(pageType),
                ContentJson = "{}",
                IsPublished = false
            };
        }

        private static string GetDefaultTitle(string pageType)
        {
            return pageType switch
            {
                "header" => "Header",
                "home" => "Welcome",
                "platform-home" => "Platform Home",
                "features" => "Features",
                "industries" => "Industries",
                "pricing" => "Pricing",
                "resources" => "Resources",
                "about" => "About Us",
                "contact" => "Contact Us",
                "book-demo" => "Request a Demo",
                "career" => "Careers",
                "support" => "Help & Support",
                "privacy" => "Privacy Policy",
                "terms" => "Terms & Conditions",
                "login" => "Login",
                "forgot-password" => "Forgot Password",
                "reset-password" => "Reset Password",
                "register" => "Request Access",
                "footer" => "Footer",
                _ => "Page"
            };
        }

        private static string NormalizeStructuredContentJson(string? contentJson)
        {
            var normalized = string.IsNullOrWhiteSpace(contentJson) ? "{}" : contentJson.Trim();
            if (normalized == "{}")
            {
                return normalized;
            }

            using var document = JsonDocument.Parse(normalized);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                throw new InvalidOperationException("ContentJson must be a JSON object.");
            }

            return normalized;
        }

        private void EnsureSupportedPageType(string pageType)
        {
            if (!IsSupportedPageType(pageType))
            {
                throw new InvalidOperationException($"Unsupported page type '{pageType}'.");
            }
        }

        private static List<PublicSitePageDto> BuildManifestPages(
            IEnumerable<PublicRouteDefinition> routes,
            IReadOnlyDictionary<string, bool> pageStates)
        {
            return routes.Select(route =>
            {
                var isPublished = false;
                var hasRecord = route.PageType != null && pageStates.TryGetValue(route.PageType, out isPublished);
                var isEnabled = route.AlwaysEnabled || (hasRecord && isPublished);
                return new PublicSitePageDto
                {
                    Key = route.Key,
                    Label = route.Label,
                    Path = route.Path,
                    IsEnabled = isEnabled,
                    IsPublished = hasRecord ? isPublished : route.AlwaysEnabled,
                    Placements = route.Placements.ToList()
                };
            }).ToList();
        }

        private void SetTenantAccessContext(Tenant tenant)
        {
            _tenantAccessor.SetTenantId(tenant.Id);
            _tenantAccessor.SetTenantSchema(BuildSchemaName(tenant.Subdomain, tenant.Id));
        }

        private string GetPlatformTenantSubdomain()
        {
            var configuredSubdomain = _configuration["PublicSite:PlatformTenantSubdomain"]
                ?? Environment.GetEnvironmentVariable("PUBLIC_PLATFORM_TENANT_SUBDOMAIN");

            if (!string.IsNullOrWhiteSpace(configuredSubdomain))
            {
                return configuredSubdomain.Trim().ToLowerInvariant();
            }

            return _environment.IsProduction() ? "default" : "api";
        }

        private static string NormalizeAudience(string? audience)
        {
            return string.Equals(audience, PlatformAudience, StringComparison.OrdinalIgnoreCase)
                ? PlatformAudience
                : TenantAudience;
        }

        private static string BuildSchemaName(string? subdomain, Guid tenantId)
        {
            var baseName = !string.IsNullOrWhiteSpace(subdomain)
                ? SanitizeSchemaName(subdomain)
                : tenantId.ToString("N");

            return $"tenant_{baseName}";
        }

        private static string SanitizeSchemaName(string input)
        {
            var span = input.Trim().ToLowerInvariant();
            var buffer = new char[span.Length];
            var idx = 0;
            foreach (var ch in span)
            {
                if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '_')
                {
                    buffer[idx++] = ch;
                }
                else if (ch == '-' || ch == '.')
                {
                    buffer[idx++] = '_';
                }
            }

            return idx == 0 ? "default" : new string(buffer, 0, idx);
        }
    }
}
