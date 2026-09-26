using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Services;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using System.Security.Claims;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Policy = "Module:platform")]
    public class WebsiteController : ControllerBase
    {
        private readonly IWebsiteContentService _websiteContentService;
        private readonly ILogger<WebsiteController> _logger;

        public WebsiteController(
            IWebsiteContentService websiteContentService,
            ILogger<WebsiteController> logger)
        {
            _websiteContentService = websiteContentService;
            _logger = logger;
        }

        [HttpGet("templates")]
        public IActionResult GetTemplates()
        {
            var templates = new[]
            {
                new { id = "tpl-corporate", name = "Enterprise Corporate", category = "Corporate", status = "Active", isDefault = true, previewUrl = "/preview/corporate" },
                new { id = "tpl-manufacturing", name = "Industrial & Manufacturing", category = "Industrial", status = "Active", isDefault = false, previewUrl = "/preview/manufacturing" },
                new { id = "tpl-services", name = "Professional Consulting & Services", category = "Services", status = "Active", isDefault = false, previewUrl = "/preview/services" },
                new { id = "tpl-technology", name = "SaaS & Modern Tech", category = "Technology", status = "Active", isDefault = false, previewUrl = "/preview/technology" }
            };
            return Ok(new { data = templates, items = templates, total = templates.Length });
        }

        [HttpGet("themes")]
        public IActionResult GetThemes()
        {
            var themes = new[]
            {
                new { id = "thm-navy", name = "Royal Navy & Slate", primaryColor = "#1e3a8a", accentColor = "#3b82f6", mode = "Dark/Light", status = "Active", isDefault = true },
                new { id = "thm-emerald", name = "Emerald Forest", primaryColor = "#065f46", accentColor = "#10b981", mode = "Light", status = "Active", isDefault = false },
                new { id = "thm-crimson", name = "Crimson Executive", primaryColor = "#881337", accentColor = "#f43f5e", mode = "Light", status = "Active", isDefault = false },
                new { id = "thm-midnight", name = "Midnight Obsidian", primaryColor = "#0f172a", accentColor = "#6366f1", mode = "Dark", status = "Active", isDefault = false }
            };
            return Ok(new { data = themes, items = themes, total = themes.Length });
        }

        [HttpGet("settings")]
        public IActionResult GetSettings()
        {
            var settings = new
            {
                id = "web-config-main",
                siteTitle = "UAB India Enterprise ERP",
                tagline = "Autonomous Next-Generation Cloud ERP & CRM",
                metaDescription = "Enterprise resource planning, hrms, finance, inventory and procurement for modern enterprises.",
                primaryDomain = "uabindia.com",
                enableSeoIndexing = true,
                contactEmail = "support@uabindia.com",
                contactPhone = "+91 98765 43210",
                copyrightText = $"© {DateTime.UtcNow.Year} UAB India. All rights reserved."
            };
            return Ok(new { data = new[] { settings }, settings });
        }

        [HttpGet("pages")]
        public async Task<IActionResult> GetPages()
        {
            var isSuperAdmin = IsSuperAdmin();
            var tenantId = GetCurrentTenantId();
            var pages = await _websiteContentService.GetManagedPagesAsync(isSuperAdmin, tenantId);

            if (isSuperAdmin)
            {
                var grouped = pages.GroupBy(p => p.TenantName).Select(g => new
                {
                    tenant = g.Key,
                    pages = g.ToList()
                });
                return Ok(new { tenants = grouped });
            }
            else
            {
                return Ok(pages);
            }
        }

        [HttpGet("pages/{pageType}")]
        public async Task<IActionResult> GetPage(string pageType)
        {
            var tenantId = GetCurrentTenantId();
            try
            {
                var page = await _websiteContentService.GetManagedPageAsync(pageType, tenantId);
                return Ok(page);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Rejected website page read for unsupported page type {PageType}", pageType);
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("pages/{pageType}")]
        public async Task<IActionResult> UpdatePage(string pageType, [FromBody] UpdateWebsitePageRequest request)
        {
            var isSuperAdmin = IsSuperAdmin();
            Guid tenantId;

            if (isSuperAdmin)
            {
                if (!request.TenantId.HasValue)
                {
                    return BadRequest(new { message = "TenantId is required for super admin." });
                }
                tenantId = request.TenantId.Value;
            }
            else
            {
                tenantId = GetCurrentTenantId();
            }

            var userId = GetCurrentUserId();

            try
            {
                var page = await _websiteContentService.SaveManagedPageAsync(pageType, request, tenantId, userId);
                return Ok(page);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Rejected website page update for page type {PageType}", pageType);
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("pages/{pageType}/publish")]
        public async Task<IActionResult> PublishPage(string pageType, [FromQuery] Guid? tenantId = null)
        {
            var isSuperAdmin = IsSuperAdmin();
            var actualTenantId = isSuperAdmin && tenantId.HasValue ? tenantId.Value : GetCurrentTenantId();
            var userId = GetCurrentUserId();
            try
            {
                var updated = await _websiteContentService.SetPublishStateAsync(pageType, actualTenantId, userId, true);
                return updated ? Ok() : NotFound();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Rejected publish for unsupported page type {PageType}", pageType);
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("pages/{pageType}/unpublish")]
        public async Task<IActionResult> UnpublishPage(string pageType, [FromQuery] Guid? tenantId = null)
        {
            var isSuperAdmin = IsSuperAdmin();
            var actualTenantId = isSuperAdmin && tenantId.HasValue ? tenantId.Value : GetCurrentTenantId();
            try
            {
                var updated = await _websiteContentService.SetPublishStateAsync(pageType, actualTenantId, GetCurrentUserId(), false);
                return updated ? Ok() : NotFound();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Rejected unpublish for unsupported page type {PageType}", pageType);
                return BadRequest(new { message = ex.Message });
            }
        }

        private Guid GetCurrentTenantId()
        {
            var tenantIdClaim = User.Claims.FirstOrDefault(c => c.Type == "tenant_id");
            return tenantIdClaim != null ? Guid.Parse(tenantIdClaim.Value) : Guid.Empty;
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
            return userIdClaim != null ? Guid.Parse(userIdClaim.Value) : Guid.Empty;
        }

        private bool IsSuperAdmin()
        {
            return User.HasClaim("is_system_admin", "true");
        }

    }
}
