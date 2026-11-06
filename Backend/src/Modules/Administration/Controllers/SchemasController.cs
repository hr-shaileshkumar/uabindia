using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    /// <summary>
    /// Serves /api/v1/schemas and /api/schemas endpoints for dynamic forms and tables.
    /// Handles database persistence, versions, and graceful default fallbacks.
    /// </summary>
    [ApiController]
    [Route("api/schemas")]
    [Route("api/v1/schemas")]
    public class SchemasController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ILogger<SchemasController> _logger;

        public SchemasController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ILogger<SchemasController> logger)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _logger = logger;
        }

        private Guid TenantId => _tenantAccessor.GetTenantId();

        [HttpGet("{schemaId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSchema(string schemaId, [FromQuery] string? tenantId = null, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(schemaId))
            {
                return BadRequest(new { message = "SchemaId is required." });
            }

            var cleanId = schemaId.Trim();
            try
            {
                var query = _db.UiPageDefinitions.AsNoTracking()
                    .Include(p => p.Versions.Where(v => !v.IsDeleted))
                    .Where(p => !p.IsDeleted);

                var targetTenant = TenantId != Guid.Empty ? TenantId : (Guid.TryParse(tenantId, out var g) ? g : Guid.Empty);
                if (targetTenant != Guid.Empty)
                {
                    query = query.Where(p => p.TenantId == targetTenant);
                }

                var page = await query.FirstOrDefaultAsync(p =>
                    p.PageKey == cleanId ||
                    p.PageKey.ToLower() == cleanId.ToLower() ||
                    p.PageKey.EndsWith("." + cleanId.ToLower()),
                    ct);

                if (page == null)
                {
                    // Return 200 with null schemaJson so frontend falls back to default schemas without console 404
                    return Ok(new
                    {
                        schemaId = cleanId,
                        schemaJson = (string?)null,
                        version = 1,
                        isCustom = false
                    });
                }

                var activeVersion = page.Versions
                    .Where(v => v.IsPublished)
                    .OrderByDescending(v => v.Version)
                    .FirstOrDefault()
                    ?? page.Versions.OrderByDescending(v => v.Version).FirstOrDefault();

                return Ok(new
                {
                    schemaId = page.PageKey,
                    schemaJson = activeVersion?.SchemaJson,
                    version = activeVersion?.Version ?? 1,
                    publishedAt = activeVersion?.PublishedAt ?? page.UpdatedAt,
                    updatedAt = activeVersion?.UpdatedAt ?? page.UpdatedAt,
                    isCustom = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch schema {SchemaId}", cleanId);
                return Ok(new
                {
                    schemaId = cleanId,
                    schemaJson = (string?)null,
                    version = 1,
                    isCustom = false
                });
            }
        }

        public class SaveSchemaPayload
        {
            public string? SchemaJson { get; set; }
            public string? EntityType { get; set; }
        }

        [HttpPost("{schemaId}")]
        public async Task<IActionResult> SaveSchema(string schemaId, [FromBody] SaveSchemaPayload payload, [FromQuery] string? tenantId = null, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(schemaId) || payload == null || string.IsNullOrWhiteSpace(payload.SchemaJson))
            {
                return BadRequest(new { message = "Invalid schema payload." });
            }

            var cleanId = schemaId.Trim();
            var targetTenant = TenantId != Guid.Empty ? TenantId : (Guid.TryParse(tenantId, out var g) ? g : Guid.Empty);

            try
            {
                var page = await _db.UiPageDefinitions
                    .Include(p => p.Versions)
                    .FirstOrDefaultAsync(p =>
                        (targetTenant == Guid.Empty || p.TenantId == targetTenant) &&
                        (p.PageKey == cleanId || p.PageKey.ToLower() == cleanId.ToLower()),
                        ct);

                if (page == null)
                {
                    page = new UiPageDefinition
                    {
                        Id = Guid.NewGuid(),
                        TenantId = targetTenant,
                        PageKey = cleanId,
                        EntityName = payload.EntityType ?? cleanId.Replace("_form", "").Replace("_directory", ""),
                        Title = cleanId.Replace("_", " "),
                        ModuleKey = "hrms",
                        ViewType = "table",
                        Status = "Published",
                        PublishedVersion = 1,
                        DraftVersion = 1,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _db.UiPageDefinitions.Add(page);
                }

                var nextVersion = (page.Versions != null && page.Versions.Count > 0)
                    ? page.Versions.Max(v => v.Version) + 1
                    : 1;

                var versionObj = new UiPageVersion
                {
                    Id = Guid.NewGuid(),
                    TenantId = targetTenant,
                    PageDefinitionId = page.Id,
                    Version = nextVersion,
                    SchemaJson = payload.SchemaJson,
                    ChangeSummary = "Saved via Form Studio / Schemas API",
                    IsPublished = true,
                    PublishedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                page.Versions ??= new List<UiPageVersion>();
                page.Versions.Add(versionObj);
                page.PublishedVersion = nextVersion;
                page.UpdatedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync(ct);

                return Ok(new
                {
                    success = true,
                    schemaId = page.PageKey,
                    version = nextVersion,
                    publishedAt = versionObj.PublishedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save schema {SchemaId}", cleanId);
                return StatusCode(500, new { message = "Failed to save schema", error = ex.Message });
            }
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllSchemas([FromQuery] string? tenantId = null, CancellationToken ct = default)
        {
            try
            {
                var targetTenant = TenantId != Guid.Empty ? TenantId : (Guid.TryParse(tenantId, out var g) ? g : Guid.Empty);
                var query = _db.UiPageDefinitions.AsNoTracking()
                    .Include(p => p.Versions.Where(v => v.IsPublished))
                    .Where(p => !p.IsDeleted);

                if (targetTenant != Guid.Empty)
                {
                    query = query.Where(p => p.TenantId == targetTenant);
                }

                var list = await query.Select(p => new
                {
                    schemaId = p.PageKey,
                    entityType = p.EntityName,
                    title = p.Title,
                    version = p.PublishedVersion ?? 1,
                    updatedAt = p.UpdatedAt
                }).ToListAsync(ct);

                return Ok(list);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to list schemas");
                return Ok(Array.Empty<object>());
            }
        }
    }
}
