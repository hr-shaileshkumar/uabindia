using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Policy = "AdminOnly")]
    [Authorize(Policy = "Module:platform")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IPasswordHasher<User> _hasher;

        public UsersController(ApplicationDbContext db, ITenantAccessor tenantAccessor, IPasswordHasher<User> hasher)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _hasher = hasher;
        }

        private bool IsSuperAdmin()
        {
            var roleClaims = User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value);
            return RoleCatalog.HasAnyRole(roleClaims, SystemRole.SuperAdmin);
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] bool includeDeleted = false)
        {
            var isSuperAdmin = IsSuperAdmin();

            System.Collections.Generic.List<UserDto> data;

            if (isSuperAdmin)
            {
                // SuperAdmin sees ALL users across ALL tenants (including soft-deleted users for full visibility)
                var allUsersQuery = _db.Users
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .AsQueryable();

                if (!includeDeleted)
                {
                    allUsersQuery = allUsersQuery.Where(u => !u.IsDeleted);
                }

                var allUsers = await allUsersQuery.ToListAsync();

                var allRoles = await _db.Roles
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .Where(r => !r.IsDeleted)
                    .ToListAsync();

                var allUserRoles = await _db.UserRoles
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .Where(ur => !ur.IsDeleted)
                    .ToListAsync();

                data = allUsers.Select(u => new UserDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FullName = u.FullName,
                    IsActive = u.IsActive,
                    IsDeleted = u.IsDeleted,
                    TenantId = u.TenantId,
                    Roles = allUserRoles.Where(ur => ur.UserId == u.Id)
                        .Join(allRoles, ur => ur.RoleId, r => r.Id, (_, r) => r.Name)
                        .ToArray()
                }).ToList();
            }
            else
            {
                // Regular admin sees only users in their own tenant
                var tenantId = _tenantAccessor.GetTenantId();
                var usersQuery = includeDeleted
                    ? _db.Users.IgnoreQueryFilters().AsNoTracking().Where(u => u.TenantId == tenantId)
                    : _db.Users.AsNoTracking().Where(u => u.TenantId == tenantId);

                var users = await usersQuery.ToListAsync();

                var roles = await _db.Roles.AsNoTracking().Where(r => r.TenantId == tenantId).ToListAsync();
                var userRoles = await _db.UserRoles
                    .AsNoTracking()
                    .Where(ur => ur.TenantId == tenantId && !ur.IsDeleted)
                    .ToListAsync();

                data = users.Select(u => new UserDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FullName = u.FullName,
                    IsActive = u.IsActive,
                    IsDeleted = u.IsDeleted,
                    Roles = userRoles.Where(ur => ur.UserId == u.Id)
                        .Join(roles, ur => ur.RoleId, r => r.Id, (_, r) => r.Name)
                        .ToArray()
                }).ToList();
            }

            return Ok(data);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // SuperAdmin can create users in any tenant by providing dto.TenantId
            var tenantId = IsSuperAdmin() && dto.TenantId.HasValue && dto.TenantId.Value != Guid.Empty
                ? dto.TenantId.Value
                : _tenantAccessor.GetTenantId();

            // Validate the target tenant exists (when SuperAdmin overrides)
            if (IsSuperAdmin() && dto.TenantId.HasValue && dto.TenantId.Value != Guid.Empty)
            {
                var tenantExists = await _db.Tenants.IgnoreQueryFilters()
                    .AnyAsync(t => t.Id == tenantId && !t.IsDeleted);
                if (!tenantExists)
                    return BadRequest(new { message = "Target tenant not found." });
            }

            var userLimit = await GetTenantUserLimitAsync(tenantId);
            if (userLimit.HasValue)
            {
                var currentUsers = await _db.Users
                    .AsNoTracking()
                    .CountAsync(u => u.TenantId == tenantId && !u.IsDeleted);

                if (currentUsers >= userLimit.Value)
                {
                    return BadRequest(new
                    {
                        message = $"User limit reached for current plan ({userLimit.Value}). Upgrade plan or increase limit to add more users."
                    });
                }
            }

            var exists = await _db.Users.IgnoreQueryFilters()
                .AnyAsync(u => u.TenantId == tenantId && u.Email == dto.Email && !u.IsDeleted);
            if (exists) return BadRequest(new { message = "User already exists." });

            var user = new User
            {
                Email = dto.Email,
                FullName = dto.FullName,
                IsActive = dto.IsActive,
                TenantId = tenantId
            };

            user.PasswordHash = _hasher.HashPassword(user, dto.Password);

            _db.Users.Add(user);

            if (dto.Roles?.Length > 0)
            {
                var roles = await _db.Roles.IgnoreQueryFilters()
                    .Where(r => r.TenantId == tenantId && !r.IsDeleted && dto.Roles.Contains(r.Name))
                    .ToListAsync();
                foreach (var role in roles)
                {
                    _db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id, TenantId = tenantId });
                }
            }

            await _db.SaveChangesAsync();

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                IsActive = user.IsActive,
                TenantId = tenantId,
                Roles = dto.Roles ?? Array.Empty<string>()
            });
        }

        private async Task<int?> GetTenantUserLimitAsync(Guid tenantId)
        {
            var configJson = await _db.TenantConfigs
                .AsNoTracking()
                .Where(c => c.TenantId == tenantId && !c.IsDeleted)
                .Select(c => c.ConfigJson)
                .FirstOrDefaultAsync();

            if (string.IsNullOrWhiteSpace(configJson))
            {
                return null;
            }

            try
            {
                var root = JsonNode.Parse(configJson) as JsonObject;
                var profile = root?["tenantProfile"] as JsonObject;
                if (profile == null)
                {
                    return null;
                }

                var employeeLimitNode = profile["employeeLimit"] ?? profile["EmployeeLimit"];
                var parsed = employeeLimitNode?.GetValue<int?>();
                return parsed.HasValue && parsed.Value > 0 ? parsed.Value : null;
            }
            catch
            {
                return null;
            }
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var isSuperAdmin = IsSuperAdmin();
            var user = await (isSuperAdmin ? _db.Users.IgnoreQueryFilters() : _db.Users)
                .FirstOrDefaultAsync(u => u.Id == id && (isSuperAdmin || u.TenantId == tenantId));
            if (user == null) return NotFound();

            var targetTenantId = user.TenantId;

            if (!string.IsNullOrWhiteSpace(dto.FullName)) user.FullName = dto.FullName;
            if (dto.IsActive.HasValue) user.IsActive = dto.IsActive.Value;
            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                user.PasswordHash = _hasher.HashPassword(user, dto.Password);
            }

            if (dto.Roles != null)
            {
                var existing = _db.UserRoles.Where(ur => ur.TenantId == targetTenantId && ur.UserId == id);
                _db.UserRoles.RemoveRange(existing);
                var roles = await _db.Roles.Where(r => r.TenantId == targetTenantId && dto.Roles.Contains(r.Name)).ToListAsync();
                foreach (var role in roles)
                {
                    _db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id, TenantId = targetTenantId });
                }
            }

            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var isSuperAdmin = IsSuperAdmin();
            var user = await (isSuperAdmin ? _db.Users.IgnoreQueryFilters() : _db.Users)
                .FirstOrDefaultAsync(u => u.Id == id && (isSuperAdmin || u.TenantId == tenantId));
            if (user == null) return NotFound();

            user.IsDeleted = true;
            await _db.SaveChangesAsync();
            return Ok(new { id = id, message = "User deleted successfully." });
        }

        [HttpGet("me/permissions")]
        [Authorize]
        public async Task<IActionResult> GetMyPermissions()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type.EndsWith("/sub"));
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized();
            }

            // Check if user is ERP Owner
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId);
            if (user?.IsSystemAdmin == true)
            {
                return Ok(new
                {
                    roles = new[] { "ERP Owner", "SuperAdmin" },
                    permissions = new[] { "*" } // Full access
                });
            }

            // Get user's roles
            var userRoles = await _db.UserRoles
                .Where(ur => ur.UserId == userId && ur.TenantId == tenantId && !ur.IsDeleted)
                .Select(ur => ur.RoleId)
                .ToListAsync();

            var roles = await _db.Roles
                .Where(r => userRoles.Contains(r.Id) && r.TenantId == tenantId && !r.IsDeleted)
                .Select(r => r.Name)
                .ToListAsync();

            // Get permissions
            var permissions = await _db.RolePermissions
                .Where(rp => userRoles.Contains(rp.RoleId) && rp.TenantId == tenantId && !rp.IsDeleted)
                .Join(_db.Permissions,
                    rp => rp.PermissionId,
                    p => p.Id,
                    (rp, p) => p)
                .Where(p => !p.IsDeleted)
                .Select(p => $"{p.Module}:{p.Action}")
                .Distinct()
                .ToListAsync();

            return Ok(new
            {
                roles = roles,
                permissions = permissions
            });
        }
    }
}
