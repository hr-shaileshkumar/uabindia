using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Authorize(Policy = "Module:platform")]
    public class RolesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public RolesController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var data = await _db.Roles
                .AsNoTracking()
                .Where(r => r.TenantId == tenantId && !r.IsDeleted)
                .Select(r => new RoleDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Description = r.Description
                })
                .OrderBy(r => r.Name)
                .ToListAsync();

            return Ok(new { roles = data });
        }

        // GET /api/v1/roles/{roleId}/permissions
        [HttpGet("{roleId:guid}/permissions")]
        public async Task<IActionResult> GetRolePermissions(Guid roleId)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var roleExists = await _db.Roles
                .AsNoTracking()
                .AnyAsync(r => r.Id == roleId && r.TenantId == tenantId && !r.IsDeleted);

            if (!roleExists)
            {
                return NotFound(new { message = "Role not found." });
            }

            var permissions = await _db.RolePermissions
                .AsNoTracking()
                .Where(rp => rp.RoleId == roleId && rp.TenantId == tenantId && !rp.IsDeleted)
                .Join(
                    _db.Permissions.AsNoTracking().Where(p => p.TenantId == tenantId && !p.IsDeleted),
                    rp => rp.PermissionId,
                    p => p.Id,
                    (rp, p) => new
                    {
                        permissionId = p.Id,
                        permissionName = p.Name,
                        module = p.Module,
                        action = p.Action,
                        description = p.Description
                    }
                )
                .OrderBy(p => p.module)
                .ThenBy(p => p.action)
                .ToListAsync();

            return Ok(new { permissions });
        }

        // PUT /api/v1/roles/{roleId}/permissions
        [HttpPut("{roleId:guid}/permissions")]
        public async Task<IActionResult> UpdateRolePermissions(Guid roleId, [FromBody] UpdateRolePermissionsDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var roleExists = await _db.Roles
                .AsNoTracking()
                .AnyAsync(r => r.Id == roleId && r.TenantId == tenantId && !r.IsDeleted);

            if (!roleExists)
            {
                return NotFound(new { message = "Role not found." });
            }

            var incomingIds = (dto.PermissionIds ?? Array.Empty<Guid>())
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToArray();

            var validPermissionIds = await _db.Permissions
                .AsNoTracking()
                .Where(p => p.TenantId == tenantId && !p.IsDeleted && incomingIds.Contains(p.Id))
                .Select(p => p.Id)
                .ToListAsync();

            var validSet = new HashSet<Guid>(validPermissionIds);

            var rolePermissions = await _db.RolePermissions
                .Where(rp => rp.RoleId == roleId && rp.TenantId == tenantId)
                .ToListAsync();

            var now = DateTime.UtcNow;
            var granted = 0;
            var revoked = 0;

            foreach (var existing in rolePermissions.Where(rp => !rp.IsDeleted).ToList())
            {
                if (!validSet.Contains(existing.PermissionId))
                {
                    existing.IsDeleted = true;
                    existing.UpdatedAt = now;
                    revoked++;
                }
            }

            foreach (var permissionId in validSet)
            {
                var existing = rolePermissions.FirstOrDefault(rp => rp.PermissionId == permissionId);
                if (existing == null)
                {
                    _db.RolePermissions.Add(new UabIndia.Core.Entities.RolePermission
                    {
                        TenantId = tenantId,
                        RoleId = roleId,
                        PermissionId = permissionId,
                    });
                    granted++;
                    continue;
                }

                if (existing.IsDeleted)
                {
                    existing.IsDeleted = false;
                    existing.UpdatedAt = now;
                    granted++;
                }
            }

            await _db.SaveChangesAsync();

            var assigned = rolePermissions.Count(rp => !rp.IsDeleted && validSet.Contains(rp.PermissionId));
            var newlyAssigned = await _db.RolePermissions
                .AsNoTracking()
                .Where(rp => rp.RoleId == roleId && rp.TenantId == tenantId && !rp.IsDeleted)
                .CountAsync();

            return Ok(new
            {
                roleId,
                granted,
                revoked,
                assigned = Math.Max(assigned, newlyAssigned)
            });
        }
    }

    public class UpdateRolePermissionsDto
    {
        public Guid[] PermissionIds { get; set; } = Array.Empty<Guid>();
    }
}
