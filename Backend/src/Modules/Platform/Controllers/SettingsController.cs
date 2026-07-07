using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Policy = "AdminOnly")]
    [Authorize(Policy = "Module:platform")]
    public class SettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public SettingsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("feature-flags")]
        public async Task<IActionResult> GetFeatureFlags()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var data = await _db.FeatureFlags
                .AsNoTracking()
                .Where(f => f.TenantId == tenantId)
                .Select(f => new FeatureFlagDto
                {
                    Id = f.Id,
                    FeatureKey = f.FeatureKey,
                    IsEnabled = f.IsEnabled
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpPost("feature-flags")]
        public async Task<IActionResult> UpsertFeatureFlag([FromBody] UpdateFeatureFlagDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var existing = await _db.FeatureFlags.FirstOrDefaultAsync(f => f.TenantId == tenantId && f.FeatureKey == dto.FeatureKey);
            if (existing == null)
            {
                var flag = new FeatureFlag
                {
                    FeatureKey = dto.FeatureKey,
                    IsEnabled = dto.IsEnabled,
                    TenantId = tenantId
                };
                _db.FeatureFlags.Add(flag);
            }
            else
            {
                existing.IsEnabled = dto.IsEnabled;
            }

            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("tenant-config")]
        public async Task<IActionResult> GetTenantConfig()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            TenantConfig? config;
            try
            {
                config = await _db.TenantConfigs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.TenantId == tenantId);
            }
            catch (System.Exception ex) when (ex is Microsoft.Data.SqlClient.SqlException || ex.Message.Contains("TenantConfigs", System.StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new TenantConfigDto());
            }

            if (config == null)
            {
                return Ok(new TenantConfigDto());
            }

            return Ok(new TenantConfigDto
            {
                ConfigJson = config.ConfigJson,
                UiSchemaJson = config.UiSchemaJson,
                WorkflowJson = config.WorkflowJson,
                BrandingJson = config.BrandingJson,
                Notes = config.Notes
            });
        }

        [HttpPut("tenant-config")]
        public async Task<IActionResult> UpdateTenantConfig([FromBody] UpdateTenantConfigDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            TenantConfig? config;
            try
            {
                config = await _db.TenantConfigs
                    .FirstOrDefaultAsync(c => c.TenantId == tenantId);
            }
            catch (System.Exception ex) when (ex is Microsoft.Data.SqlClient.SqlException || ex.Message.Contains("TenantConfigs", System.StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(503, new { message = "Tenant config table not available. Run migrations and retry." });
            }

            if (config == null)
            {
                config = new TenantConfig
                {
                    TenantId = tenantId
                };
                _db.TenantConfigs.Add(config);
            }

            config.ConfigJson = dto.ConfigJson ?? "{}";
            config.UiSchemaJson = dto.UiSchemaJson ?? "{}";
            config.WorkflowJson = dto.WorkflowJson ?? "{}";
            config.BrandingJson = dto.BrandingJson ?? "{}";
            config.Notes = dto.Notes;

            await _db.SaveChangesAsync();
            return Ok();
        }
    }
}
