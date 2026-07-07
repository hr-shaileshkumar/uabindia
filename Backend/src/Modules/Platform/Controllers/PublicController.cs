using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Services;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    [ApiController]
    [Route("api/v1/public")]
    [AllowAnonymous]
    public class PublicController : ControllerBase
    {
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IWebsiteContentService _websiteContentService;
        private readonly ILogger<PublicController> _logger;

        public PublicController(
            ITenantAccessor tenantAccessor,
            IWebsiteContentService websiteContentService,
            ILogger<PublicController> logger)
        {
            _tenantAccessor = tenantAccessor;
            _websiteContentService = websiteContentService;
            _logger = logger;
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
                    return NotFound(new { message = "Tenant not resolved" });
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
                    return NotFound(new { message = "Tenant not resolved" });
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
                    return NotFound(new { message = "Tenant not resolved or page type is unsupported" });
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
}
