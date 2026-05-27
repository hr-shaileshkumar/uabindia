using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
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
        private readonly ApplicationDbContext _db;
        private readonly ILogger<WebsiteController> _logger;

        public WebsiteController(
            ApplicationDbContext db,
            ILogger<WebsiteController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet("pages")]
        public async Task<IActionResult> GetPages()
        {
            var isSuperAdmin = IsSuperAdmin();
            var query = _db.WebsitePages
                .Where(p => !p.IsDeleted);

            if (!isSuperAdmin)
            {
                var tenantId = GetCurrentTenantId();
                query = query.Where(p => p.TenantId == tenantId);
            }

            var pages = await (from p in query
                join t in _db.Tenants on p.TenantId equals t.Id
                orderby t.Name, p.PageType
                select new
                {
                    p.Id,
                    p.PageType,
                    p.Title,
                    p.ContentJson,
                    p.IsPublished,
                    p.PublishedAt,
                    p.CreatedAt,
                    p.UpdatedAt,
                    p.TenantId,
                    TenantName = t.Name
                })
                .ToListAsync();

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
            var isSuperAdmin = IsSuperAdmin();
            var query = _db.WebsitePages
                .Where(p => p.PageType == pageType && !p.IsDeleted);

            if (!isSuperAdmin)
            {
                var tenantId = GetCurrentTenantId();
                query = query.Where(p => p.TenantId == tenantId);
            }

            var page = await query.FirstOrDefaultAsync();

            if (page == null)
            {
                // Return default empty page
                return Ok(new
                {
                    PageType = pageType,
                    Title = GetDefaultTitle(pageType),
                    ContentJson = "{}",
                    IsPublished = false
                });
            }

            return Ok(new
            {
                page.Id,
                page.PageType,
                page.Title,
                page.ContentJson,
                page.IsPublished,
                page.PublishedAt,
                page.CreatedAt,
                page.UpdatedAt
            });
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

            var page = await _db.WebsitePages
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.PageType == pageType && !p.IsDeleted);

            if (page == null)
            {
                page = new WebsitePage
                {
                    TenantId = tenantId,
                    PageType = pageType,
                    Title = request.Title ?? GetDefaultTitle(pageType),
                    ContentJson = request.ContentJson ?? "{}",
                    IsPublished = false,
                    CreatedBy = userId
                };
                _db.WebsitePages.Add(page);
            }
            else
            {
                page.Title = request.Title ?? page.Title;
                page.ContentJson = request.ContentJson ?? page.ContentJson;
                page.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                page.Id,
                page.PageType,
                page.Title,
                page.ContentJson,
                page.IsPublished
            });
        }

        [HttpPost("pages/{pageType}/publish")]
        public async Task<IActionResult> PublishPage(string pageType, [FromQuery] Guid? tenantId = null)
        {
            var isSuperAdmin = IsSuperAdmin();
            var actualTenantId = isSuperAdmin && tenantId.HasValue ? tenantId.Value : GetCurrentTenantId();
            var userId = GetCurrentUserId();

            var page = await _db.WebsitePages
                .FirstOrDefaultAsync(p => p.TenantId == actualTenantId && p.PageType == pageType && !p.IsDeleted);

            if (page == null)
                return NotFound();

            page.IsPublished = true;
            page.PublishedAt = DateTime.UtcNow;
            page.PublishedBy = userId;
            page.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok();
        }

        [HttpPost("pages/{pageType}/unpublish")]
        public async Task<IActionResult> UnpublishPage(string pageType, [FromQuery] Guid? tenantId = null)
        {
            var isSuperAdmin = IsSuperAdmin();
            var actualTenantId = isSuperAdmin && tenantId.HasValue ? tenantId.Value : GetCurrentTenantId();

            var page = await _db.WebsitePages
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.PageType == pageType && !p.IsDeleted);

            if (page == null)
                return NotFound();

            page.IsPublished = false;
            page.PublishedAt = null;
            page.PublishedBy = null;
            page.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok();
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

        private string GetDefaultTitle(string pageType)
        {
            return pageType switch
            {
                "home" => "Welcome",
                "header" => "Header",
                "about" => "About Us",
                "contact" => "Contact Us",
                "career" => "Careers",
                "login" => "Login",
                "footer" => "Footer",
                _ => "Page"
            };
        }
    }

    public class UpdateWebsitePageRequest
    {
        public string? Title { get; set; }
        public string? ContentJson { get; set; }
        public Guid? TenantId { get; set; }
    }
}
