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
using UabIndia.Core.Security;
using UabIndia.Core.Services;
using UabIndia.Api.Models;
using UabIndia.Api.Services;

namespace UabIndia.Api.Modules.Administration.Controllers
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

        [AllowAnonymous]
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

            var rawEmail = req.Email!;
            var requestedTenantId = _tenantAccessor.GetTenantId();

            var requiresTenantWorkspace = await AuthUserLookup.RequiresTenantWorkspaceAsync(_db, rawEmail, requestedTenantId, _encryption);
            var user = await AuthUserLookup.FindActiveUserForLoginAsync(_db, rawEmail, requestedTenantId, _encryption);
            if (user == null)
            {
                if (requiresTenantWorkspace)
                {
                    return Unauthorized(Error("Open your company tenant URL to sign in to this workspace.", "tenant_context_required"));
                }

                return Unauthorized(Error("Invalid credentials", "invalid_credentials"));
            }

            var utcNow = DateTime.UtcNow;
            var securityPolicy = await _db.SecurityPolicies
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.TenantId == user.TenantId && !p.IsDeleted);
            var maxAttempts = securityPolicy is { MaxFailedAttempts: > 0 }
                ? securityPolicy.MaxFailedAttempts
                : AccountLockoutPolicy.DefaultMaxFailedAttempts;
            var lockoutDuration = securityPolicy is { LockoutMinutes: > 0 }
                ? TimeSpan.FromMinutes(securityPolicy.LockoutMinutes)
                : AccountLockoutPolicy.DefaultLockoutDuration;

            if (AccountLockoutPolicy.IsLockedOut(user, utcNow))
            {
                _logger.LogWarning("Login blocked for locked-out user {UserId}", user.Id);
                return StatusCode(StatusCodes.Status423Locked, Error(
                    "Account is temporarily locked due to too many failed sign-in attempts. Try again later.",
                    "account_locked"));
            }

            var verify = _hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password);
            if (verify == PasswordVerificationResult.Failed)
            {
                AccountLockoutPolicy.RegisterFailedAttempt(
                    user,
                    maxAttempts,
                    lockoutDuration,
                    utcNow);
                user.UpdatedAt = utcNow;
                await _db.SaveChangesAsync();
                return Unauthorized(Error("Invalid credentials", "invalid_credentials"));
            }

            if (user.AccessFailedCount > 0 || user.LockoutEnd.HasValue)
            {
                AccountLockoutPolicy.ResetFailedAttempts(user);
                user.UpdatedAt = utcNow;
                await _db.SaveChangesAsync();
            }

            var userId = user.Id;
            // Always use the user's own tenant, not the request-context tenant
            var tenantId = user.TenantId;
            _tenantAccessor.SetTenantId(tenantId);
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

        [AllowAnonymous]
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
                // RFC 6819 Token Reuse Detection: immediately revoke all descendant tokens and all active sessions for this user
                _logger.LogWarning("SecurityAlert: Refresh token reuse detected for User {UserId}, Tenant {TenantId}. Revoking entire token family.", userId, tenantId);
                await _refreshRepo.RevokeFamilyAsync(tenantId, userId, existing.Id);
                await _refreshRepo.RevokeAllForUserAsync(tenantId, userId);
                return Unauthorized(Error("Refresh token reuse detected. All sessions invalidated for security.", "token_reuse_detected"));
            }

            if (existing.ExpiresAt <= DateTime.UtcNow)
            {
                existing.IsRevoked = true;
                existing.RevokedAt = DateTime.UtcNow;
                await _refreshRepo.UpdateRefreshTokenAsync(existing);
                return Unauthorized(Error("Refresh token has expired.", "expired_refresh_token"));
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

            // rotate: mark existing revoked and create new child token linked to parent atomically
            existing.IsRevoked = true;
            existing.RevokedAt = DateTime.UtcNow;
            var newRefresh = _refresh.GenerateRefreshToken();
            var newHash = _refresh.HashToken(newRefresh);
            var newExpires = DateTime.UtcNow.AddDays(30);

            var deviceIdToUse = string.IsNullOrWhiteSpace(req.DeviceId)
                ? (existing.DeviceId ?? "unknown")
                : req.DeviceId;

            var newRecord = await _refreshRepo.SaveRefreshTokenWithFamilyAsync(tenantId, userId, newHash, deviceIdToUse, newExpires, existing.Id);
            existing.ReplacedByTokenId = newRecord.Id;
            await _refreshRepo.UpdateRefreshTokenAsync(existing);

            var user = await _db.Users.AsNoTracking().IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
            var roles = await _db.UserRoles
                .IgnoreQueryFilters()
                .Join(_db.Roles.IgnoreQueryFilters(), ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, ur.TenantId, r.Name })
                .Where(x => x.UserId == userId && x.TenantId == tenantId)
                .Select(x => x.Name)
                .ToArrayAsync();

            if (user != null && user.IsSystemAdmin)
            {
                var roleSet = new System.Collections.Generic.HashSet<string>(roles, System.StringComparer.OrdinalIgnoreCase)
                {
                    RoleCatalog.SuperAdminRoleName,
                    RoleCatalog.AdminRoleName
                };
                roles = roleSet.ToArray();
            }

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

            var callerIdClaim = User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("nameidentifier")?.Value
                ?? User?.FindFirst("sub")?.Value;
            if (string.IsNullOrWhiteSpace(callerIdClaim) || !Guid.TryParse(callerIdClaim, out var callerId))
            {
                return Unauthorized(Error("User context is invalid.", "unauthorized"));
            }

            // Revoking sessions for a different user is an administrative action. Without this the
            // caller-supplied UserId would let any authenticated user sign out anyone in the tenant.
            var targetUserId = req.UserId == Guid.Empty ? callerId : req.UserId;
            if (targetUserId != callerId)
            {
                var roleNames = User?.Claims
                    .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role
                        || c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase))
                    .Select(c => c.Value) ?? Enumerable.Empty<string>();

                if (!RoleCatalog.IsAdminLike(roleNames))
                {
                    return StatusCode(
                        StatusCodes.Status403Forbidden,
                        Error("Cannot revoke sessions for another user.", "forbidden"));
                }
            }

            await _refreshRepo.RevokeAllForUserAsync(tenantId, targetUserId);
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

            if (user.IsSystemAdmin)
            {
                var roleSet = new System.Collections.Generic.HashSet<string>(roles, System.StringComparer.OrdinalIgnoreCase)
                {
                    RoleCatalog.SuperAdminRoleName,
                    RoleCatalog.AdminRoleName
                };
                roles = roleSet.ToArray();
            }

            var employeeId = await _db.Employees.AsNoTracking()
                .IgnoreQueryFilters()
                .Where(e => e.UserId == user.Id && e.TenantId == user.TenantId && !e.IsDeleted)
                .Select(e => (Guid?)e.Id)
                .FirstOrDefaultAsync();

            var tenant = await _db.Tenants.AsNoTracking().IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == user.TenantId);

            return Ok(new
            {
                id = user.Id,
                email = user.Email,
                fullName = user.FullName,
                tenantId = user.TenantId,
                tenantName = tenant?.Name ?? string.Empty,
                tenantSubdomain = tenant?.Subdomain ?? string.Empty,
                isSystemAdmin = user.IsSystemAdmin,
                employeeId,
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

        [AllowAnonymous]
        [HttpPost("forgot-password")]
        [EnableRateLimiting("auth-forgot")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
        {
            if (!ModelState.IsValid) return ValidationError("Forgot-password request is invalid.");

            // Always return success to prevent email enumeration
            var requestedTenantId = _tenantAccessor.GetTenantId();
            var rawEmailFp = req.Email!;
            var user = await AuthUserLookup.FindUserByEmailAsync(_db, rawEmailFp, _encryption);

            if (user != null && requestedTenantId != Guid.Empty && user.TenantId != requestedTenantId && !user.IsSystemAdmin)
            {
                user = null;
            }

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

        [AllowAnonymous]
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

            var resetPolicy = await _db.SecurityPolicies
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.TenantId == user.TenantId && !p.IsDeleted);
            var complexityError = PasswordComplexity.Validate(req.NewPassword!, resetPolicy);
            if (complexityError != null)
            {
                return BadRequest(Error(complexityError, "password_policy"));
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
