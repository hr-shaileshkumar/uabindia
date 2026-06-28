using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Api.Models;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class ModulesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public ModulesController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("enabled")]
        public async Task<IActionResult> GetEnabledModules()
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var data = await _db.TenantModules
                .AsNoTracking()
                .Where(tm => tm.TenantId == tenantId && tm.IsEnabled && !tm.IsDeleted)
                .Join(_db.Modules.AsNoTracking().Where(m => m.IsEnabled),
                    tm => tm.ModuleKey,
                    m => m.ModuleKey,
                    (tm, m) => new
                    {
                        key = m.ModuleKey,
                        name = m.Name,
                        displayName = string.IsNullOrWhiteSpace(m.DisplayName) ? m.Name : m.DisplayName,
                        icon = m.Icon,
                        description = m.Description,
                        basePath = m.BasePath,
                        isEnabled = tm.IsEnabled,
                        order = m.SortOrder
                    })
                .OrderBy(m => m.order)
                .ThenBy(m => m.key)
                .ToListAsync();

            return Ok(new { modules = data });
        }

        [HttpGet("catalog")]
        [Authorize(Policy = "Module:licensing")]
        public async Task<IActionResult> GetCatalog()
        {
            var data = await _db.Modules
                .AsNoTracking()
                .Where(m => m.IsEnabled)
                .Select(m => new
                {
                    key = m.ModuleKey,
                    name = m.Name,
                    isEnabled = m.IsEnabled,
                    version = m.Version
                })
                .OrderBy(m => m.key)
                .ToListAsync();

            return Ok(new { modules = data });
        }

        [HttpGet("subscriptions")]
        [Authorize(Policy = "Module:licensing")]
        public async Task<IActionResult> GetSubscriptions()
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var data = await _db.TenantModules
                .AsNoTracking()
                .Where(tm => tm.TenantId == tenantId && !tm.IsDeleted)
                .Select(tm => new
                {
                    moduleKey = tm.ModuleKey,
                    isEnabled = tm.IsEnabled
                })
                .OrderBy(tm => tm.moduleKey)
                .ToListAsync();

            return Ok(new { subscriptions = data });
        }

        [HttpPost("subscriptions")]
        [Authorize(Policy = "Module:licensing")]
        public async Task<IActionResult> UpsertSubscriptions([FromBody] UpdateTenantModulesDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();

            var requested = dto.Subscriptions
                .Where(s => !string.IsNullOrWhiteSpace(s.ModuleKey))
                .Select(s => new { key = s.ModuleKey.Trim(), s.IsEnabled })
                .ToList();

            if (requested.Count == 0)
            {
                return BadRequest(new { message = "No module subscriptions provided." });
            }

            var validModules = await _db.Modules
                .AsNoTracking()
                .Where(m => m.IsEnabled)
                .Select(m => m.ModuleKey)
                .ToListAsync();

            var existing = await _db.TenantModules
                .Where(tm => tm.TenantId == tenantId)
                .ToListAsync();

            foreach (var sub in requested)
            {
                if (!validModules.Contains(sub.key, StringComparer.OrdinalIgnoreCase))
                {
                    continue;
                }

                var match = existing.FirstOrDefault(tm => string.Equals(tm.ModuleKey, sub.key, StringComparison.OrdinalIgnoreCase));
                if (match == null)
                {
                    _db.TenantModules.Add(new Core.Entities.TenantModule
                    {
                        TenantId = tenantId,
                        ModuleKey = sub.key,
                        IsEnabled = sub.IsEnabled,
                        EnabledAt = DateTime.UtcNow,
                        DisabledAt = sub.IsEnabled ? null : DateTime.UtcNow
                    });
                }
                else
                {
                    match.IsEnabled = sub.IsEnabled;
                    match.DisabledAt = sub.IsEnabled ? null : DateTime.UtcNow;
                    if (sub.IsEnabled && match.EnabledAt == default)
                    {
                        match.EnabledAt = DateTime.UtcNow;
                    }
                }
            }

            await _db.SaveChangesAsync();

            return Ok();
        }
    }
}
