using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
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

        private static readonly (string Name, string Description)[] StandardDefaultRoles = new[]
        {
            ("SuperAdmin", "System super administrator — unrestricted access"),
            ("Admin", "Tenant administrator"),
            ("Manager", "Department and operations manager"),
            ("Employee", "Standard organization employee"),
            ("HR Manager", "Human Resources and recruitment manager"),
            ("Accountant", "Finance, accounts and billing manager")
        };

        private async Task EnsureStandardRolesForTenantAsync(Guid tenantId)
        {
            if (tenantId == Guid.Empty) return;

            var existingRoles = await _db.Roles
                .IgnoreQueryFilters()
                .Where(r => r.TenantId == tenantId)
                .ToListAsync();

            var toAdd = new System.Collections.Generic.List<Role>();
            foreach (var (name, desc) in StandardDefaultRoles)
            {
                var match = existingRoles.FirstOrDefault(r =>
                    string.Equals(r.Name, name, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(RoleCatalog.Normalize(r.Name), RoleCatalog.Normalize(name), StringComparison.OrdinalIgnoreCase));

                if (match == null)
                {
                    toAdd.Add(new Role
                    {
                        TenantId = tenantId,
                        Name = name,
                        Description = desc
                    });
                }
                else if (match.IsDeleted)
                {
                    match.IsDeleted = false;
                    match.UpdatedAt = DateTime.UtcNow;
                }
            }

            if (toAdd.Count > 0)
            {
                _db.Roles.AddRange(toAdd);
                await _db.SaveChangesAsync();
            }
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] Guid? tenantId = null)
        {
            var targetTenantId = tenantId.GetValueOrDefault();
            if (targetTenantId == Guid.Empty)
            {
                targetTenantId = _tenantAccessor.GetTenantId();
            }

            if (targetTenantId == Guid.Empty)
            {
                var claimTenant = User.FindFirst("tenant_id")?.Value;
                if (!string.IsNullOrWhiteSpace(claimTenant) && Guid.TryParse(claimTenant, out var parsedClaimTenant))
                {
                    targetTenantId = parsedClaimTenant;
                }
            }

            if (targetTenantId == Guid.Empty)
            {
                targetTenantId = await _db.Tenants
                    .IgnoreQueryFilters()
                    .Where(t => t.IsActive && !t.IsDeleted)
                    .Select(t => t.Id)
                    .FirstOrDefaultAsync();
            }

            var rawRoles = await _db.Roles
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(r => r.TenantId == targetTenantId && !r.IsDeleted)
                .Select(r => new RoleDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Description = r.Description
                })
                .ToListAsync();

            if (rawRoles.Count < StandardDefaultRoles.Length && targetTenantId != Guid.Empty)
            {
                await EnsureStandardRolesForTenantAsync(targetTenantId);
                rawRoles = await _db.Roles
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .Where(r => r.TenantId == targetTenantId && !r.IsDeleted)
                    .Select(r => new RoleDto
                    {
                        Id = r.Id,
                        Name = r.Name,
                        Description = r.Description
                    })
                    .ToListAsync();
            }

            var data = rawRoles
                .GroupBy(r => RoleCatalog.Normalize(r.Name))
                .Select(group =>
                {
                    var canonical = group.FirstOrDefault(r =>
                    {
                        var parsed = RoleCatalog.Parse(r.Name);
                        return parsed != SystemRole.Unknown
                               && string.Equals(r.Name, RoleCatalog.ToCanonicalRoleName(parsed), StringComparison.Ordinal);
                    });

                    return canonical ?? group.OrderBy(r => r.Name, StringComparer.OrdinalIgnoreCase).First();
                })
                .OrderBy(r => r.Name)
                .ToList();

            return Ok(new { roles = data });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRoleDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var tenantId = _tenantAccessor.GetTenantId();
            var incomingName = dto.Name?.Trim() ?? string.Empty;
            var normalizedIncomingName = RoleCatalog.Normalize(incomingName);
            if (string.IsNullOrWhiteSpace(normalizedIncomingName))
            {
                return BadRequest(new { message = "Role name is required." });
            }

            var tenantRoles = await _db.Roles
                .IgnoreQueryFilters()
                .Where(r => r.TenantId == tenantId)
                .ToListAsync();

            var existing = tenantRoles.FirstOrDefault(r =>
                string.Equals(RoleCatalog.Normalize(r.Name), normalizedIncomingName, StringComparison.OrdinalIgnoreCase));

            if (existing != null)
            {
                if (!existing.IsDeleted)
                {
                    return BadRequest(new { message = "Role already exists." });
                }

                existing.IsDeleted = false;
                existing.Name = incomingName;
                existing.Description = string.IsNullOrWhiteSpace(dto.Description) ? existing.Description : dto.Description.Trim();
                existing.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    role = new RoleDto
                    {
                        Id = existing.Id,
                        Name = existing.Name,
                        Description = existing.Description
                    },
                    restored = true
                });
            }

            var role = new Role
            {
                TenantId = tenantId,
                Name = incomingName,
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim()
            };

            _db.Roles.Add(role);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                role = new RoleDto
                {
                    Id = role.Id,
                    Name = role.Name,
                    Description = role.Description
                },
                restored = false
            });
        }

        [HttpPut("{roleId:guid}")]
        public async Task<IActionResult> Update(Guid roleId, [FromBody] UpdateRoleDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var tenantId = _tenantAccessor.GetTenantId();
            var role = await _db.Roles
                .FirstOrDefaultAsync(r => r.Id == roleId && r.TenantId == tenantId && !r.IsDeleted);

            if (role == null)
            {
                return NotFound(new { message = "Role not found." });
            }

            var isSystemRole = RoleCatalog.Parse(role.Name) != SystemRole.Unknown;

            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                var incomingName = dto.Name.Trim();
                var normalizedIncomingName = RoleCatalog.Normalize(incomingName);

                if (string.IsNullOrWhiteSpace(normalizedIncomingName))
                {
                    return BadRequest(new { message = "Role name is required." });
                }

                if (isSystemRole && !string.Equals(role.Name, incomingName, StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { message = "System roles cannot be renamed." });
                }

                var tenantRoles = await _db.Roles
                    .IgnoreQueryFilters()
                    .Where(r => r.TenantId == tenantId)
                    .ToListAsync();

                var duplicateExists = tenantRoles.Any(r =>
                    r.Id != roleId
                    && !r.IsDeleted
                    && string.Equals(RoleCatalog.Normalize(r.Name), normalizedIncomingName, StringComparison.OrdinalIgnoreCase));

                if (duplicateExists)
                {
                    return BadRequest(new { message = "Role already exists." });
                }

                role.Name = incomingName;
            }

            role.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
            role.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                role = new RoleDto
                {
                    Id = role.Id,
                    Name = role.Name,
                    Description = role.Description
                }
            });
        }

        [HttpDelete("{roleId:guid}")]
        public async Task<IActionResult> Delete(Guid roleId)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var role = await _db.Roles
                .FirstOrDefaultAsync(r => r.Id == roleId && r.TenantId == tenantId && !r.IsDeleted);

            if (role == null)
            {
                return NotFound(new { message = "Role not found." });
            }

            var parsedSystemRole = RoleCatalog.Parse(role.Name);
            if (parsedSystemRole != SystemRole.Unknown)
            {
                var canonicalName = RoleCatalog.ToCanonicalRoleName(parsedSystemRole);
                var isCanonicalRecord = string.Equals(role.Name, canonicalName, StringComparison.Ordinal);

                if (isCanonicalRecord)
                {
                    return BadRequest(new { message = "System roles cannot be deleted." });
                }

                var canonicalRoleExists = await _db.Roles.AnyAsync(r =>
                    r.TenantId == tenantId
                    && !r.IsDeleted
                    && r.Id != role.Id
                    && string.Equals(r.Name, canonicalName, StringComparison.OrdinalIgnoreCase));

                if (!canonicalRoleExists)
                {
                    return BadRequest(new { message = "System roles cannot be deleted." });
                }
            }

            var hasAssignedUsers = await _db.UserRoles
                .AnyAsync(ur => ur.RoleId == roleId && ur.TenantId == tenantId && !ur.IsDeleted);

            if (hasAssignedUsers)
            {
                return BadRequest(new { message = "Role is assigned to users. Remove role assignments before deleting it." });
            }

            var now = DateTime.UtcNow;
            role.IsDeleted = true;
            role.UpdatedAt = now;

            var rolePermissions = await _db.RolePermissions
                .Where(rp => rp.RoleId == roleId && rp.TenantId == tenantId && !rp.IsDeleted)
                .ToListAsync();

            foreach (var rolePermission in rolePermissions)
            {
                rolePermission.IsDeleted = true;
                rolePermission.UpdatedAt = now;
            }

            await _db.SaveChangesAsync();

            return Ok(new { deleted = true, roleId });
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

    public class CreateRoleDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.StringLength(250)]
        public string? Description { get; set; }
    }

    public class UpdateRoleDto
    {
        [System.ComponentModel.DataAnnotations.StringLength(100)]
        public string? Name { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(250)]
        public string? Description { get; set; }
    }
}
