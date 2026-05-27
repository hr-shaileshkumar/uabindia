using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    /// <summary>
    /// Manages the permission catalog (tenant-scoped).
    /// SuperAdmin / Admin can list, create, and delete permissions.
    /// POST/DELETE are intentionally separated from read so future scoping is easy.
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Authorize(Policy = "Module:platform")]
    public class PermissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public PermissionsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private bool IsSuperAdmin()
        {
            var roleClaims = User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value);
            return RoleCatalog.HasAnyRole(roleClaims, SystemRole.SuperAdmin);
        }

        // GET /api/v1/permissions
        [HttpGet]
        public async Task<IActionResult> List()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var isSuperAdmin = IsSuperAdmin();

            var perms = await _db.Permissions
                .AsNoTracking()
                .Where(p => !p.IsDeleted && (isSuperAdmin || p.TenantId == tenantId))
                .OrderBy(p => p.Module).ThenBy(p => p.Action)
                .Select(p => new PermissionDto
                {
                    Id          = p.Id,
                    Name        = p.Name,
                    Description = p.Description,
                    Module      = p.Module,
                    Action      = p.Action,
                })
                .ToListAsync();

            return Ok(new { permissions = perms });
        }

        // POST /api/v1/permissions
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePermissionDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Module) || string.IsNullOrWhiteSpace(dto.Action))
                return BadRequest(new { message = "Module and Action are required." });

            // Prevent duplicates
            var tenantId = _tenantAccessor.GetTenantId();
            var exists = await _db.Permissions.AnyAsync(
                p => p.TenantId == tenantId && p.Module == dto.Module && p.Action == dto.Action && !p.IsDeleted);
            if (exists)
                return Conflict(new { message = $"Permission for {dto.Module}.{dto.Action} already exists." });

            var perm = new UabIndia.Core.Entities.Permission
            {
                TenantId    = tenantId,
                Module      = dto.Module.Trim().ToLowerInvariant(),
                Action      = dto.Action.Trim().ToLowerInvariant(),
                Name        = dto.Name?.Trim() ?? $"{dto.Module}.{dto.Action}",
                Description = dto.Description?.Trim(),
            };
            _db.Permissions.Add(perm);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(List), new PermissionDto
            {
                Id          = perm.Id,
                Name        = perm.Name,
                Description = perm.Description,
                Module      = perm.Module,
                Action      = perm.Action,
            });
        }

        // DELETE /api/v1/permissions/{id}
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var isSuperAdmin = IsSuperAdmin();
            var perm = await _db.Permissions.FirstOrDefaultAsync(
                p => p.Id == id && (isSuperAdmin || p.TenantId == tenantId) && !p.IsDeleted);

            if (perm is null) return NotFound(new { message = "Permission not found." });

            // Soft-delete permission and its role mappings together
            perm.IsDeleted = true;
            var rolePerms = await _db.RolePermissions
                .Where(rp => rp.PermissionId == id && rp.TenantId == perm.TenantId && !rp.IsDeleted)
                .ToListAsync();
            foreach (var rp in rolePerms) rp.IsDeleted = true;

            await _db.SaveChangesAsync();
            return NoContent();
        }
    }

    // ── Request DTOs (local, not in CoreDtos since they're thin) ─────────────
    public class CreatePermissionDto
    {
        public string Module { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Description { get; set; }
    }

    public class PermissionDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Module { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
    }
}
