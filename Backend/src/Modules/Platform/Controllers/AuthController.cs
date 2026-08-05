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
using Microsoft.AspNetCore.Mvc.ModelBinding;
using UabIndia.Infrastructure.Data;
using UabIndia.Core.Entities;
using UabIndia.Core.Authorization;
using UabIndia.Core.Services;
using UabIndia.Api.Models;
using UabIndia.Api.Services;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Route("api/v1/iam/auth")]
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
        private readonly TenantEmailService _tenantEmailService;
        private readonly IEncryptionService _encryption;

        public AuthController(JwtService jwt, RefreshTokenService refresh, UabIndia.Application.Interfaces.IRefreshTokenRepository refreshRepo, UabIndia.Application.Interfaces.ITenantAccessor tenantAccessor, Microsoft.Extensions.Logging.ILogger<AuthController> logger, Microsoft.Extensions.Hosting.IHostEnvironment env, ApplicationDbContext db, IPasswordHasher<User> hasher, TenantEmailService tenantEmailService, IEncryptionService encryption)
        {
            _jwt = jwt;
            _refresh = refresh;
            _refreshRepo = refreshRepo;
            _tenantAccessor = tenantAccessor;
            _logger = logger;
            _env = env;
            _db = db;
            _hasher = hasher;
            _tenantEmailService = tenantEmailService;
            _encryption = encryption;
        }

        [HttpPost("login")]
        [EnableRateLimiting("auth-login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            try
            {
                if (_env.IsDevelopment())
                {
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
                    return ValidationError("Login request is invalid.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while inspecting login request.");
                return StatusCode(StatusCodes.Status500InternalServerError, Error("Server error while processing request.", "server_error"));
            }

            if (req == null)
            {
                return BadRequest(Error("Invalid request body.", "invalid_request"));
            }

            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            {
                return BadRequest(Error("Email and password are required.", "validation_error"));
            }

            if (string.IsNullOrWhiteSpace(req.DeviceId))
            {
                return BadRequest(Error("DeviceId is required.", "validation_error"));
            }

            var requestedTenantId = _tenantAccessor.GetTenantId();

            var rawEmail = req.Email!.Trim();
            var userQuery = _db.Users
                .IgnoreQueryFilters()
                .Where(u => u.Email == rawEmail && u.IsActive && !u.IsDeleted);

            var requiresTenantWorkspace = false;
            if (requestedTenantId != Guid.Empty)
            {
                userQuery = userQuery.Where(u => u.TenantId == requestedTenantId);
            }
            else
            {
                userQuery = userQuery.Where(u => u.IsSystemAdmin);
                requiresTenantWorkspace = await _db.Users
                    .IgnoreQueryFilters()
                    .AnyAsync(u => u.Email == rawEmail && u.IsActive && !u.IsDeleted && !u.IsSystemAdmin);
            }

            var user = await userQuery.FirstOrDefaultAsync();
            if (user == null)
            {
                if (requiresTenantWorkspace)
                {
                    return Unauthorized(Error("Open your company tenant URL to sign in to this workspace.", "tenant_context_required"));
                }

                return Unauthorized(Error("Invalid credentials", "invalid_credentials"));
            }

            var verify = _hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password);
            if (verify == PasswordVerificationResult.Failed) return Unauthorized(Error("Invalid credentials", "invalid_credentials"));

            var userId = user.Id;
            // Always use the user's own tenant, not the request-context tenant
            var tenantId = user.TenantId;
            var roles = await _db.UserRoles
                .IgnoreQueryFilters()
                .Join(_db.Roles.IgnoreQueryFilters(), ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, ur.TenantId, r.Name })
                .Where(x => x.UserId == userId && x.TenantId == tenantId)
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
                return StatusCode(StatusCodes.Status500InternalServerError, Error("Failed to persist refresh token.", "server_error"));
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
            if (!ModelState.IsValid) return ValidationError("Refresh request is invalid.");

            var incomingRefresh = string.IsNullOrWhiteSpace(req.RefreshToken)
                ? Request.Cookies["refresh_token"]
                : req.RefreshToken;

            if (string.IsNullOrWhiteSpace(incomingRefresh)) return BadRequest(Error("Refresh token is required.", "validation_error"));

            var presentedHash = _refresh.HashToken(incomingRefresh);
            // Find the token across all tenants — the token's TenantId is the authoritative source.
            var existing = await _db.RefreshTokens
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(r => r.TokenHash == presentedHash);
            if (existing == null)
            {
                // token doesn't exist
                return Unauthorized(Error("Refresh token is invalid or expired.", "invalid_refresh_token"));
            }

            // Use the tenant stored in the refresh token itself, not the request-context tenant
            var tenantId = existing.TenantId;
            var userId = existing.UserId;

            if (existing.IsRevoked)
            {
                // possible replay: revoke all tokens for user and require re-login
                await _refreshRepo.RevokeAllForUserAsync(tenantId, userId);
                return Unauthorized(Error("Refresh token has been revoked.", "invalid_refresh_token"));
            }

            // enforce device binding
            if (!string.IsNullOrWhiteSpace(req.DeviceId) && !string.Equals(existing.DeviceId, req.DeviceId, StringComparison.Ordinal))
            {
                // device mismatch - revoke this token and deny
                existing.IsRevoked = true;
                existing.RevokedAt = DateTime.UtcNow;
                await _refreshRepo.UpdateRefreshTokenAsync(existing);
                return Unauthorized(Error("Refresh token device mismatch.", "invalid_refresh_token"));
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
                .IgnoreQueryFilters()
                .Join(_db.Roles.IgnoreQueryFilters(), ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, ur.TenantId, r.Name })
                .Where(x => x.UserId == userId && x.TenantId == tenantId)
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
            if (!ModelState.IsValid) return ValidationError("Revoke-all request is invalid.");
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
                return Unauthorized(Error("User context is invalid.", "unauthorized"));
            }

            // IgnoreQueryFilters: user is already authenticated via JWT; find by ID only
            var user = await _db.Users.AsNoTracking().IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return Unauthorized(Error("User was not found.", "unauthorized"));

            var roles = await _db.UserRoles
                .IgnoreQueryFilters()
                .Join(_db.Roles.IgnoreQueryFilters(), ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, ur.TenantId, r.Name })
                .Where(x => x.UserId == userId && x.TenantId == user.TenantId)
                .Select(x => x.Name)
                .ToArrayAsync();

            return Ok(new
            {
                id = user.Id,
                email = user.Email,
                fullName = user.FullName,
                tenantId = user.TenantId,
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
                return Unauthorized(Error("User context is invalid.", "unauthorized"));
            }

            // Check if user is ERP Owner / Super Admin
            // IgnoreQueryFilters: JWT already authenticated; find user across all tenants
            var user = await _db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
            var userTenantId = user?.TenantId ?? tenantId;
            var userRoleNames = await _db.UserRoles
                .IgnoreQueryFilters()
                .Where(ur => ur.UserId == userId && ur.TenantId == userTenantId && !ur.IsDeleted)
                .Join(_db.Roles.IgnoreQueryFilters(),
                    ur => ur.RoleId,
                    r => r.Id,
                    (ur, r) => r.Name)
                .ToListAsync();

            var isSuperAdminByRole = RoleCatalog.HasAnyRole(userRoleNames, SystemRole.SuperAdmin);

            object capabilities = new
            {
                isSuperAdmin = user?.IsSystemAdmin == true || isSuperAdminByRole,
                includeDeletedByDefault = user?.IsSystemAdmin == true || isSuperAdminByRole,
                includeAllTenantsByDefault = user?.IsSystemAdmin == true || isSuperAdminByRole,
                canRestoreDeleted = user?.IsSystemAdmin == true || isSuperAdminByRole,
                canHardDelete = user?.IsSystemAdmin == true || isSuperAdminByRole,
            };

            if (user?.IsSystemAdmin == true || isSuperAdminByRole)
            {
                return Ok(new { mode = "open", permissions = new[] { "*" }, capabilities });
            }

            // Get user's roles (use userTenantId, not request-context tenantId)
            var userRoles = await _db.UserRoles
                .IgnoreQueryFilters()
                .Where(ur => ur.UserId == userId && ur.TenantId == userTenantId && !ur.IsDeleted)
                .Select(ur => ur.RoleId)
                .ToListAsync();

            // Get permissions
            var permissions = await _db.RolePermissions
                .IgnoreQueryFilters()
                .Where(rp => userRoles.Contains(rp.RoleId) && rp.TenantId == userTenantId && !rp.IsDeleted)
                .Join(_db.Permissions.IgnoreQueryFilters(),
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

            return Ok(new { mode = "enforced", permissions = frontendPermissions.Distinct(), capabilities });
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

        [HttpPost("forgot-password")]
        [EnableRateLimiting("auth-forgot")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
        {
            if (!ModelState.IsValid) return ValidationError("Forgot-password request is invalid.");

            // Always return success to prevent email enumeration
            var requestedTenantId = _tenantAccessor.GetTenantId();
            var rawEmailFp = req.Email!.Trim();
            var userQuery = _db.Users
                .IgnoreQueryFilters()
                .Where(u => u.Email == rawEmailFp && u.IsActive && !u.IsDeleted);

            if (requestedTenantId != Guid.Empty)
            {
                userQuery = userQuery.Where(u => u.TenantId == requestedTenantId);
            }

            var user = await userQuery.FirstOrDefaultAsync();

            if (user != null)
            {
                // Generate reset token
                var resetToken = Guid.NewGuid().ToString("N");
                var tokenHash = _refresh.HashToken(resetToken);
                var expires = DateTime.UtcNow.AddHours(1);

                // Store reset token (you might want to create a separate table for this)
                // For now, we'll use a simple approach with user metadata
                user.PasswordResetToken = tokenHash;
                user.PasswordResetExpires = expires;
                await _db.SaveChangesAsync();

                try
                {
                    var resetUrl = BuildResetPasswordUrl(resetToken, requestedTenantId != Guid.Empty ? "tenant" : "platform");
                    await _tenantEmailService.SendPasswordResetEmailAsync(user, resetToken, resetUrl, HttpContext.RequestAborted);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send password reset email for user {UserId}.", user.Id);
                }
            }

            return Ok(new { message = "If an account with this email exists, you will receive password reset instructions." });
        }

        [HttpPost("reset-password")]
        [EnableRateLimiting("auth-reset")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
        {
            if (!ModelState.IsValid) return ValidationError("Reset-password request is invalid.");

            var tokenHash = _refresh.HashToken(req.Token!);

            var user = await _db.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u =>
                    u.PasswordResetToken == tokenHash &&
                    u.PasswordResetExpires > DateTime.UtcNow &&
                    u.IsActive &&
                    !u.IsDeleted);

            if (user == null)
            {
                return BadRequest(Error("Invalid or expired reset token.", "invalid_reset_token"));
            }

            // Hash the new password
            var hashedPassword = _hasher.HashPassword(user, req.NewPassword!);
            user.PasswordHash = hashedPassword;
            user.PasswordResetToken = null;
            user.PasswordResetExpires = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            // Revoke all refresh tokens for security
            await _refreshRepo.RevokeAllForUserAsync(user.TenantId, user.Id);

            return Ok(new { message = "Password has been reset successfully." });
        }

        private IActionResult ValidationError(string message)
        {
            return BadRequest(new ApiErrorResponse
            {
                Message = message,
                Code = "validation_error",
                Errors = ToValidationErrors(ModelState),
                TraceId = HttpContext.TraceIdentifier
            });
        }

        private ApiErrorResponse Error(string message, string code)
        {
            return new ApiErrorResponse
            {
                Message = message,
                Code = code,
                TraceId = HttpContext.TraceIdentifier
            };
        }

        private static IDictionary<string, string[]> ToValidationErrors(ModelStateDictionary modelState)
        {
            return modelState
                .Where(entry => entry.Value is { Errors.Count: > 0 })
                .ToDictionary(
                    entry => entry.Key,
                    entry => entry.Value!.Errors
                        .Select(error => string.IsNullOrWhiteSpace(error.ErrorMessage) ? "Invalid value." : error.ErrorMessage)
                        .ToArray());
        }

        private string BuildResetPasswordUrl(string resetToken, string audience)
        {
            var scheme = Request.Headers["X-Forwarded-Proto"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(scheme))
            {
                scheme = Request.Scheme;
            }

            var rawHost = Request.Headers["X-Forwarded-Host"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(rawHost))
            {
                rawHost = Request.Host.Value;
            }

            if (string.IsNullOrWhiteSpace(rawHost))
            {
                rawHost = "localhost:3000";
            }

            var baseUri = Uri.TryCreate($"{scheme}://{rawHost}", UriKind.Absolute, out var parsedUri)
                ? parsedUri
                : new Uri("http://localhost:3000");
            var path = $"/reset-password?token={Uri.EscapeDataString(resetToken)}&audience={Uri.EscapeDataString(audience)}";
            return new Uri(baseUri, path).ToString();
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

        public class ForgotPasswordRequest
        {
            [Required]
            [EmailAddress]
            [StringLength(255)]
            public string? Email { get; set; }
        }

        public class ResetPasswordRequest
        {
            [Required]
            [StringLength(128, MinimumLength = 8)]
            public string? Token { get; set; }

            [Required]
            [MinLength(8)]
            [MaxLength(100)]
            public string? NewPassword { get; set; }
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
