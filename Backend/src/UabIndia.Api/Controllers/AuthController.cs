using Microsoft.AspNetCore.Mvc;
using UabIndia.Identity.Services;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System.Text.Json;
using UabIndia.Infrastructure.Data;
using UabIndia.Core.Entities;
using UabIndia.Core.Authorization;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly JwtService _jwt;
        private readonly RefreshTokenService _refresh;
        private readonly UabIndia.Application.Interfaces.IRefreshTokenRepository _refreshRepo;
        private readonly UabIndia.Application.Interfaces.ITenantAccessor _tenantAccessor;
        private readonly Microsoft.Extensions.Logging.ILogger<AuthController> _logger;
        private readonly Microsoft.Extensions.Hosting.IHostEnvironment _env;
        private readonly ApplicationDbContext _db;
        private readonly IPasswordHasher<User> _hasher;

        public AuthController(JwtService jwt, RefreshTokenService refresh, UabIndia.Application.Interfaces.IRefreshTokenRepository refreshRepo, UabIndia.Application.Interfaces.ITenantAccessor tenantAccessor, Microsoft.Extensions.Logging.ILogger<AuthController> logger, Microsoft.Extensions.Hosting.IHostEnvironment env, ApplicationDbContext db, IPasswordHasher<User> hasher)
        {
            _jwt = jwt;
            _refresh = refresh;
            _refreshRepo = refreshRepo;
            _tenantAccessor = tenantAccessor;
            _logger = logger;
            _env = env;
            _db = db;
            _hasher = hasher;
        }

        [HttpPost("login")]
        [EnableRateLimiting("auth-login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            try
            {
                if (_env.IsDevelopment())
                {
                    // Attempt to log the raw request body and bound values for debugging.
                    try
                    {
                        Request.EnableBuffering();
                        Request.Body.Position = 0;
                        using var sr = new StreamReader(Request.Body, leaveOpen: true);
                        var raw = await sr.ReadToEndAsync();
                        Request.Body.Position = 0;
                        _logger.LogDebug("Raw login request body: {Body}", raw);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug(ex, "Failed to read raw request body for debugging.");
                    }

                    _logger.LogDebug("Bound LoginRequest values: Email={Email}, Password=(redacted), DeviceId={DeviceId}", req?.Email, req?.DeviceId);
                    _logger.LogDebug("ModelState IsValid={IsValid}", ModelState.IsValid);
                }

                if (!ModelState.IsValid)
                {
                    // log model state errors for debugging
                    foreach (var kv in ModelState)
                    {
                        if (kv.Value.Errors.Count > 0)
                        {
                            _logger.LogWarning("ModelState error for {Field}: {Errors}", kv.Key, string.Join("; ", kv.Value.Errors.Select(e => e.ErrorMessage)));
                        }
                    }
                    return BadRequest(ModelState);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while inspecting login request.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Server error while processing request." });
            }

            if (req == null)
            {
                return BadRequest(new { message = "Invalid request body." });
            }

            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            {
                return BadRequest(new { message = "Email and password are required." });
            }

            if (string.IsNullOrWhiteSpace(req.DeviceId))
            {
                return BadRequest(new { message = "DeviceId is required." });
            }

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email && u.IsActive && !u.IsDeleted);
            if (user == null) return Unauthorized(new { message = "Invalid credentials" });

            var verify = _hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password);
            if (verify == PasswordVerificationResult.Failed) return Unauthorized(new { message = "Invalid credentials" });

            var userId = user.Id;
            var tenantId = _tenantAccessor.GetTenantId();
            var roles = await _db.UserRoles
                .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
                .Where(x => x.UserId == userId)
                .Select(x => x.Name)
                .ToArrayAsync();

            if (user.IsSystemAdmin)
            {
                var roleSet = new System.Collections.Generic.HashSet<string>(roles, System.StringComparer.OrdinalIgnoreCase)
                {
                    RoleCatalog.SuperAdminRoleName,
                    RoleCatalog.AdminRoleName
                };
                roles = roleSet.ToArray();
            }

            var access = _jwt.GenerateToken(userId, tenantId, roles, TimeSpan.FromMinutes(15));
            var refresh = _refresh.GenerateRefreshToken();
            var hash = _refresh.HashToken(refresh);
            var expires = DateTime.UtcNow.AddDays(30);
            try
            {
                await _refreshRepo.SaveRefreshTokenAsync(tenantId, userId, hash, req.DeviceId, expires);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save refresh token for user {UserId} on device {DeviceId} (tenant {Tenant})", userId, req.DeviceId, tenantId);
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to persist refresh token." });
            }

            SetAuthCookies(access, refresh, expires);

            return Ok(new
            {
                access_token = access,
                refresh_token = refresh,
                expires_in = 900
            });
        }

        [AllowAnonymous]
        [HttpGet("csrf-token")]
        public IActionResult CsrfToken()
        {
            var token = Guid.NewGuid().ToString("N");
            var secure = !_env.IsDevelopment();
            Response.Cookies.Append("csrf_token", token, new CookieOptions
            {
                HttpOnly = false,
                Secure = secure,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddHours(2),
                Path = "/"
            });
            return Ok(new { token });
        }

        [HttpPost("refresh")]
        [EnableRateLimiting("auth-login")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var incomingRefresh = string.IsNullOrWhiteSpace(req.RefreshToken)
                ? Request.Cookies["refresh_token"]
                : req.RefreshToken;

            if (string.IsNullOrWhiteSpace(incomingRefresh)) return BadRequest();

            var tenantId = _tenantAccessor.GetTenantId();
            var presentedHash = _refresh.HashToken(incomingRefresh);
            var existing = await _refreshRepo.GetByHashAsync(tenantId, presentedHash);
            if (existing == null)
            {
                // token doesn't exist
                return Unauthorized();
            }

            var userId = existing.UserId;

            if (existing.IsRevoked)
            {
                // possible replay: revoke all tokens for user and require re-login
                await _refreshRepo.RevokeAllForUserAsync(tenantId, userId);
                return Unauthorized();
            }

            // enforce device binding
            if (!string.IsNullOrWhiteSpace(req.DeviceId) && !string.Equals(existing.DeviceId, req.DeviceId, StringComparison.Ordinal))
            {
                // device mismatch - revoke this token and deny
                existing.IsRevoked = true;
                existing.RevokedAt = DateTime.UtcNow;
                await _refreshRepo.UpdateRefreshTokenAsync(existing);
                return Unauthorized();
            }

            // rotate: mark existing revoked and create new token linked to parent
            existing.IsRevoked = true;
            existing.RevokedAt = DateTime.UtcNow;
            var newRefresh = _refresh.GenerateRefreshToken();
            var newHash = _refresh.HashToken(newRefresh);
            var newExpires = DateTime.UtcNow.AddDays(30);

            // save new token
            var deviceIdToUse = string.IsNullOrWhiteSpace(req.DeviceId)
                ? (existing.DeviceId ?? "unknown")
                : req.DeviceId;

            await _refreshRepo.SaveRefreshTokenAsync(tenantId, userId, newHash, deviceIdToUse, newExpires);

            // link existing -> new (update existing.ReplacedByTokenId after new saved)
            // find the new record by hash to get its Id
            var newRecord = await _refreshRepo.GetByHashAsync(tenantId, userId, newHash);
            if (newRecord != null)
            {
                existing.ReplacedByTokenId = newRecord.Id;
                existing.ParentTokenId = existing.ParentTokenId ?? null;
                await _refreshRepo.UpdateRefreshTokenAsync(existing);
                newRecord.ParentTokenId = existing.Id;
                await _refreshRepo.UpdateRefreshTokenAsync(newRecord);
            }

            var roles = await _db.UserRoles
                .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
                .Where(x => x.UserId == userId)
                .Select(x => x.Name)
                .ToArrayAsync();

            var newAccess = _jwt.GenerateToken(userId, tenantId, roles, TimeSpan.FromMinutes(15));
            SetAuthCookies(newAccess, newRefresh, newExpires);
            return Ok(new
            {
                access_token = newAccess,
                refresh_token = newRefresh,
                expires_in = 900
            });
        }

        [Authorize]
        [HttpPost("revoke-all")]
        public async Task<IActionResult> RevokeAll([FromBody] RevokeAllRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var tenantId = _tenantAccessor.GetTenantId();
            await _refreshRepo.RevokeAllForUserAsync(tenantId, req.UserId);
            return Ok();
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var userIdClaim = User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("nameidentifier")?.Value
                ?? User?.FindFirst("sub")?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId);
            if (user == null) return Unauthorized();

            var roles = await _db.UserRoles
                .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
                .Where(x => x.UserId == userId)
                .Select(x => x.Name)
                .ToArrayAsync();

            return Ok(new
            {
                id = user.Id,
                email = user.Email,
                fullName = user.FullName,
                roles
            });
        }

        [Authorize]
        [HttpGet("permissions")]
        public async Task<IActionResult> Permissions()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var userIdClaim = User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("nameidentifier")?.Value
                ?? User?.FindFirst("sub")?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            // Check if user is ERP Owner / Super Admin
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId);
            var userRoleNames = await _db.UserRoles
                .Where(ur => ur.UserId == userId && ur.TenantId == tenantId && !ur.IsDeleted)
                .Join(_db.Roles,
                    ur => ur.RoleId,
                    r => r.Id,
                    (ur, r) => r.Name)
                .ToListAsync();

            var isSuperAdminByRole = RoleCatalog.HasAnyRole(userRoleNames, SystemRole.SuperAdmin);

            if (user?.IsSystemAdmin == true || isSuperAdminByRole)
            {
                return Ok(new { mode = "enforced", permissions = new[] { "*" } });
            }

            // Get user's roles
            var userRoles = await _db.UserRoles
                .Where(ur => ur.UserId == userId && ur.TenantId == tenantId && !ur.IsDeleted)
                .Select(ur => ur.RoleId)
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

            // Map to frontend expected format
            var frontendPermissions = new List<string>();
            foreach (var perm in permissions)
            {
                var parts = perm.Split(':');
                if (parts.Length == 2)
                {
                    var module = parts[0];
                    var action = parts[1];
                    frontendPermissions.Add($"module:{module}");
                    frontendPermissions.Add($"{module}.*");
                    frontendPermissions.Add($"{module}.{action}");
                    frontendPermissions.Add($"resource:{module}.{action}");
                }
            }

            // Add wildcard for ERP Owner
            if (user?.IsSystemAdmin == true)
            {
                frontendPermissions.Add("*");
            }

            return Ok(new { mode = "enforced", permissions = frontendPermissions.Distinct() });
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var userIdClaim = User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("nameidentifier")?.Value
                ?? User?.FindFirst("sub")?.Value;

            if (!string.IsNullOrWhiteSpace(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
            {
                var refreshToken = Request.Cookies["refresh_token"];
                if (!string.IsNullOrWhiteSpace(refreshToken))
                {
                    var hash = _refresh.HashToken(refreshToken);
                    await _refreshRepo.RevokeRefreshTokenAsync(tenantId, userId, hash);
                }
            }

            Response.Cookies.Delete("access_token");
            Response.Cookies.Delete("refresh_token");
            return Ok();
        }

        public class LoginRequest
        {
            [Required]
            [EmailAddress]
            [StringLength(255)]
            public string? Email { get; set; }

            [Required]
            [MinLength(6)]
            [MaxLength(100)]
            public string? Password { get; set; }

            [Required]
            [StringLength(128, MinimumLength = 3)]
            public string? DeviceId { get; set; }
        }

        public class RefreshRequest
        {
            public string? RefreshToken { get; set; }
            public Guid UserId { get; set; }
            public string? DeviceId { get; set; }
        }

        public class RevokeAllRequest
        {
            [Required]
            public Guid UserId { get; set; }
        }

        private void SetAuthCookies(string accessToken, string refreshToken, DateTime refreshExpires)
        {
            var secure = !_env.IsDevelopment();
            var accessOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = secure,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddMinutes(15),
                Path = "/"
            };

            var refreshOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = secure,
                SameSite = SameSiteMode.Strict,
                Expires = new DateTimeOffset(refreshExpires),
                Path = "/"
            };

            Response.Cookies.Append("access_token", accessToken, accessOptions);
            Response.Cookies.Append("refresh_token", refreshToken, refreshOptions);
        }
    }
}
