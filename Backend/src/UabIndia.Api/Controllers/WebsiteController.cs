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

namespace UabIndia.Api.Controllers
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
            var roleClaims = User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value);
            return RoleCatalog.HasAnyRole(roleClaims, SystemRole.SuperAdmin);
        }

    }
}
