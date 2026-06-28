using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Services;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/public")]
    [AllowAnonymous]
    public class PublicController : ControllerBase
    {
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IWebsiteContentService _websiteContentService;

        public PublicController(
            ITenantAccessor tenantAccessor,
            IWebsiteContentService websiteContentService)
        {
            _tenantAccessor = tenantAccessor;
            _websiteContentService = websiteContentService;
        }

        [HttpGet("company-profile")]
        public async Task<IActionResult> GetCompanyProfile([FromQuery] string? audience = null)
        {
            var normalizedAudience = string.Equals(audience, "platform", StringComparison.OrdinalIgnoreCase)
                ? "platform"
                : "tenant";
            var response = await _websiteContentService.GetCompanyProfileAsync(normalizedAudience);
            if (response == null)
            {
                return NotFound(new { message = "Tenant not resolved" });
            }

            return Ok(response);
        }

        [HttpGet("site-data")]
        public async Task<IActionResult> GetSiteData([FromQuery] string? audience = null)
        {
            var normalizedAudience = string.Equals(audience, "platform", StringComparison.OrdinalIgnoreCase)
                ? "platform"
                : "tenant";
            var response = await _websiteContentService.GetPublicSiteDataAsync(normalizedAudience);
            if (response == null)
            {
                return NotFound(new { message = "Tenant not resolved" });
            }

            return Ok(response);
        }

        [HttpGet("website-pages/{pageType}")]
        public async Task<IActionResult> GetWebsitePage(string pageType, [FromQuery] string? audience = null)
        {
            var normalizedAudience = string.Equals(audience, "platform", StringComparison.OrdinalIgnoreCase)
                ? "platform"
                : "tenant";
            var page = await _websiteContentService.GetPublicWebsitePageAsync(pageType, normalizedAudience);
            if (page == null)
            {
                return NotFound(new { message = "Tenant not resolved or page type is unsupported" });
            }

            return Ok(page);
        }

        [HttpGet("site-manifest")]
        public async Task<IActionResult> GetSiteManifest([FromQuery] string? audience = null)
        {
            var manifest = await _websiteContentService.GetPublicSiteManifestAsync(audience ?? "tenant");
            return Ok(manifest);
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
    }
}
