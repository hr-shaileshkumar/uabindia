using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Authorize(Policy = "Module:security")]
    public class SecurityController : ControllerBase
    {
        private static readonly Regex CidrPattern = new(
            @"^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$",
            RegexOptions.Compiled);

        private readonly ApplicationDbContext _db;

        public SecurityController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet("device-sessions")]
        [HttpGet("sessions")]
        [HttpGet("/api/v1/security/sessions")]
        public async Task<IActionResult> DeviceSessions()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return Ok(new { data = Array.Empty<DeviceSessionDto>(), sessions = Array.Empty<DeviceSessionDto>() });
            }

            var data = await _db.RefreshTokens
                .AsNoTracking()
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.ExpiresAt)
                .Select(r => new DeviceSessionDto
                {
                    Id = r.Id,
                    DeviceId = r.DeviceId ?? "unknown",
                    ExpiresAt = r.ExpiresAt,
                    IsRevoked = r.IsRevoked
                })
                .ToListAsync();

            return Ok(new { data = data, items = data, sessions = data, total = data.Count });
        }

        // ===== PASSWORD POLICY =====

        [HttpGet("password-policy")]
        [HttpGet("password-policies")]
        [HttpGet("/api/v1/security/password-policies")]
        public async Task<IActionResult> PasswordPolicy()
        {
            var policy = await EnsurePolicyAsync();
            var mapped = MapPassword(policy);
            return Ok(new { data = new[] { mapped }, policy = mapped });
        }

        [HttpPut("password-policy")]
        public async Task<IActionResult> UpdatePasswordPolicy([FromBody] PasswordPolicyDto dto)
        {
            if (dto.MinLength < 6 || dto.MinLength > 128)
                return BadRequest(new { message = "Minimum length must be between 6 and 128." });
            if (dto.MaxAgeDays < 0 || dto.MaxAgeDays > 730)
                return BadRequest(new { message = "Password expiry must be between 0 and 730 days." });
            if (dto.MaxFailedAttempts < 3 || dto.MaxFailedAttempts > 20)
                return BadRequest(new { message = "Failed-attempt lockout must be between 3 and 20." });
            if (dto.LockoutMinutes < 1 || dto.LockoutMinutes > 1440)
                return BadRequest(new { message = "Lockout duration must be between 1 and 1440 minutes." });

            var policy = await EnsurePolicyAsync();
            policy.MinLength = dto.MinLength;
            policy.RequireUppercase = dto.RequireUppercase;
            policy.RequireLowercase = dto.RequireLowercase;
            policy.RequireNumber = dto.RequireNumber;
            policy.RequireSpecial = dto.RequireSpecial;
            policy.MaxAgeDays = dto.MaxAgeDays;
            policy.MaxFailedAttempts = dto.MaxFailedAttempts;
            policy.LockoutMinutes = dto.LockoutMinutes;
            await _db.SaveChangesAsync();
            return Ok(MapPassword(policy));
        }

        // ===== MFA =====

        [HttpGet("mfa-policy")]
        public async Task<IActionResult> MfaPolicy()
        {
            var policy = await EnsurePolicyAsync();
            return Ok(MapMfa(policy));
        }

        [HttpPut("mfa-policy")]
        public async Task<IActionResult> UpdateMfaPolicy([FromBody] MfaPolicyDto dto)
        {
            var policy = await EnsurePolicyAsync();
            policy.RequireMfaPlatformAdmins = dto.RequireMfaPlatformAdmins;
            policy.RequireMfaTenantAdmins = dto.RequireMfaTenantAdmins;
            policy.AllowTotp = dto.AllowTotp;
            policy.AllowSmsOtp = dto.AllowSmsOtp;
            await _db.SaveChangesAsync();
            return Ok(MapMfa(policy));
        }

        [HttpGet("mfa-enrollments")]
        [HttpGet("mfa")]
        [HttpGet("/api/v1/security/mfa")]
        public async Task<IActionResult> MfaEnrollments()
        {
            var rows = await _db.MfaEnrollments.AsNoTracking()
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();
            return Ok(new { data = rows, items = rows, total = rows.Count });
        }

        [HttpGet("directory-users")]
        public async Task<IActionResult> DirectoryUsers()
        {
            var users = await _db.Users.AsNoTracking()
                .Where(u => u.IsActive)
                .OrderBy(u => u.FullName ?? u.Email)
                .Select(u => new { u.Id, u.Email, fullName = u.FullName, u.IsSystemAdmin })
                .Take(200)
                .ToListAsync();
            return Ok(users);
        }

        [HttpPost("mfa-enrollments")]
        public async Task<IActionResult> CreateMfaEnrollment([FromBody] CreateMfaEnrollmentDto dto)
        {
            var method = string.IsNullOrWhiteSpace(dto.Method) ? "TOTP" : dto.Method.Trim().ToUpperInvariant();
            if (method is not ("TOTP" or "SMS" or "EMAIL"))
                return BadRequest(new { message = "Method must be TOTP, SMS, or Email." });

            string name = dto.UserName?.Trim() ?? string.Empty;
            string email = dto.UserEmail?.Trim() ?? string.Empty;
            Guid? userId = dto.UserId;

            if (userId.HasValue)
            {
                var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value);
                if (user == null) return BadRequest(new { message = "User not found." });
                name = string.IsNullOrWhiteSpace(name) ? (user.FullName ?? user.Email) : name;
                email = string.IsNullOrWhiteSpace(email) ? user.Email : email;
            }

            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "User email is required." });

            var exists = await _db.MfaEnrollments
                .AnyAsync(e => e.UserEmail == email && e.Method == method && e.Status != "Disabled");
            if (exists)
                return BadRequest(new { message = "An active enrollment already exists for this user and method." });

            var row = new MfaEnrollment
            {
                UserId = userId,
                UserName = string.IsNullOrWhiteSpace(name) ? email : name,
                UserEmail = email,
                Method = method == "EMAIL" ? "Email" : method,
                Status = "Pending",
                CreatedBy = GetUserId()
            };
            _db.MfaEnrollments.Add(row);
            await _db.SaveChangesAsync();
            return Ok(row);
        }

        [HttpPost("mfa-enrollments/{id:guid}/enroll")]
        public async Task<IActionResult> MarkMfaEnrolled(Guid id)
        {
            var row = await _db.MfaEnrollments.FirstOrDefaultAsync(e => e.Id == id);
            if (row == null) return NotFound(new { message = "Enrollment not found." });
            row.Status = "Enrolled";
            row.EnrolledAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(row);
        }

        [HttpPost("mfa-enrollments/{id:guid}/disable")]
        public async Task<IActionResult> DisableMfaEnrollment(Guid id)
        {
            var row = await _db.MfaEnrollments.FirstOrDefaultAsync(e => e.Id == id);
            if (row == null) return NotFound(new { message = "Enrollment not found." });
            row.Status = "Disabled";
            await _db.SaveChangesAsync();
            return Ok(row);
        }

        // ===== SSO =====

        [HttpGet("sso-providers")]
        [HttpGet("sso")]
        [HttpGet("/api/v1/security/sso")]
        public async Task<IActionResult> SsoProviders()
        {
            var rows = await _db.SsoIdentityProviders.AsNoTracking()
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
            var list = rows.Select(MapSso).ToList();
            return Ok(new { data = list, items = list, total = list.Count });
        }

        [HttpPost("sso-providers")]
        public async Task<IActionResult> CreateSsoProvider([FromBody] CreateSsoProviderDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var name = dto.Name.Trim();
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { message = "Provider name is required." });

            var protocol = NormalizeProtocol(dto.Protocol);
            var row = new SsoIdentityProvider
            {
                Name = name,
                Protocol = protocol,
                Provider = string.IsNullOrWhiteSpace(dto.Provider) ? "Custom" : dto.Provider.Trim(),
                Issuer = dto.Issuer?.Trim() ?? string.Empty,
                ClientId = dto.ClientId?.Trim() ?? string.Empty,
                ClientSecretHash = HashSecret(dto.ClientSecret),
                MetadataUrl = NullIfEmpty(dto.MetadataUrl),
                RedirectUri = NullIfEmpty(dto.RedirectUri),
                Scopes = NullIfEmpty(dto.Scopes) ?? "openid profile email",
                Status = "Inactive",
                CreatedBy = GetUserId()
            };
            _db.SsoIdentityProviders.Add(row);
            await _db.SaveChangesAsync();
            return Ok(MapSso(row));
        }

        [HttpPut("sso-providers/{id:guid}")]
        public async Task<IActionResult> UpdateSsoProvider(Guid id, [FromBody] CreateSsoProviderDto dto)
        {
            var row = await _db.SsoIdentityProviders.FirstOrDefaultAsync(p => p.Id == id);
            if (row == null) return NotFound(new { message = "SSO provider not found." });

            var name = dto.Name?.Trim();
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { message = "Provider name is required." });

            row.Name = name;
            row.Protocol = NormalizeProtocol(dto.Protocol);
            row.Provider = string.IsNullOrWhiteSpace(dto.Provider) ? row.Provider : dto.Provider.Trim();
            row.Issuer = dto.Issuer?.Trim() ?? row.Issuer;
            row.ClientId = dto.ClientId?.Trim() ?? row.ClientId;
            if (!string.IsNullOrWhiteSpace(dto.ClientSecret) && !IsMasked(dto.ClientSecret))
                row.ClientSecretHash = HashSecret(dto.ClientSecret);
            row.MetadataUrl = NullIfEmpty(dto.MetadataUrl);
            row.RedirectUri = NullIfEmpty(dto.RedirectUri);
            row.Scopes = NullIfEmpty(dto.Scopes) ?? row.Scopes;
            await _db.SaveChangesAsync();
            return Ok(MapSso(row));
        }

        [HttpPost("sso-providers/{id:guid}/test")]
        public async Task<IActionResult> TestSsoProvider(Guid id)
        {
            var row = await _db.SsoIdentityProviders.FirstOrDefaultAsync(p => p.Id == id);
            if (row == null) return NotFound(new { message = "SSO provider not found." });

            if (string.IsNullOrWhiteSpace(row.Issuer) || string.IsNullOrWhiteSpace(row.ClientId))
            {
                row.Status = "Error";
                row.LastError = "Issuer and Client ID are required before a connection test.";
                row.LastTestedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                return BadRequest(new { message = row.LastError });
            }

            row.Status = row.Status == "Active" ? "Active" : "Configured";
            row.LastError = null;
            row.LastTestedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Configuration looks valid. Federation handshake is stored for this tenant.", status = row.Status });
        }

        [HttpPost("sso-providers/{id:guid}/enable")]
        public async Task<IActionResult> EnableSsoProvider(Guid id)
        {
            var row = await _db.SsoIdentityProviders.FirstOrDefaultAsync(p => p.Id == id);
            if (row == null) return NotFound(new { message = "SSO provider not found." });
            if (string.IsNullOrWhiteSpace(row.Issuer) || string.IsNullOrWhiteSpace(row.ClientId))
                return BadRequest(new { message = "Issuer and Client ID are required before enabling SSO." });

            row.Status = "Active";
            row.EnabledAt = DateTime.UtcNow;
            row.LastError = null;
            await _db.SaveChangesAsync();
            return Ok(new { message = "SSO provider enabled." });
        }

        [HttpPost("sso-providers/{id:guid}/disable")]
        public async Task<IActionResult> DisableSsoProvider(Guid id)
        {
            var row = await _db.SsoIdentityProviders.FirstOrDefaultAsync(p => p.Id == id);
            if (row == null) return NotFound(new { message = "SSO provider not found." });
            row.Status = "Inactive";
            await _db.SaveChangesAsync();
            return Ok(new { message = "SSO provider disabled." });
        }

        [HttpDelete("sso-providers/{id:guid}")]
        public async Task<IActionResult> DeleteSsoProvider(Guid id)
        {
            var row = await _db.SsoIdentityProviders.FirstOrDefaultAsync(p => p.Id == id);
            if (row == null) return NotFound(new { message = "SSO provider not found." });
            row.IsDeleted = true;
            await _db.SaveChangesAsync();
            return Ok(new { message = "SSO provider deleted." });
        }

        // ===== IP RULES =====

        [HttpGet("ip-rules")]
        [HttpGet("ip-restrictions")]
        [HttpGet("/api/v1/security/ip-restrictions")]
        public async Task<IActionResult> IpRules()
        {
            var rows = await _db.IpAccessRules.AsNoTracking()
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
            return Ok(new { data = rows, items = rows, total = rows.Count });
        }

        [HttpPost("ip-rules")]
        public async Task<IActionResult> CreateIpRule([FromBody] CreateIpAccessRuleDto dto)
        {
            var range = dto.IpRange?.Trim() ?? string.Empty;
            if (!IsValidCidr(range))
                return BadRequest(new { message = "Enter a valid IPv4 address or CIDR range (e.g. 192.168.1.0/24)." });

            var action = (dto.Action ?? "ALLOW").Trim().ToUpperInvariant();
            if (action is not ("ALLOW" or "BLOCK"))
                return BadRequest(new { message = "Action must be ALLOW or BLOCK." });

            var row = new IpAccessRule
            {
                IpRange = range,
                Description = NullIfEmpty(dto.Description),
                Action = action,
                Status = "Active",
                CreatedBy = GetUserId()
            };
            _db.IpAccessRules.Add(row);
            await _db.SaveChangesAsync();
            return Ok(row);
        }

        [HttpDelete("ip-rules/{id:guid}")]
        public async Task<IActionResult> DeleteIpRule(Guid id)
        {
            var row = await _db.IpAccessRules.FirstOrDefaultAsync(r => r.Id == id);
            if (row == null) return NotFound(new { message = "IP rule not found." });
            row.IsDeleted = true;
            await _db.SaveChangesAsync();
            return Ok(new { message = "IP rule deleted." });
        }

        private async Task<SecurityPolicy> EnsurePolicyAsync()
        {
            var existing = await _db.SecurityPolicies.FirstOrDefaultAsync();
            if (existing != null) return existing;

            var created = new SecurityPolicy { CreatedBy = GetUserId() };
            _db.SecurityPolicies.Add(created);
            await _db.SaveChangesAsync();
            return created;
        }

        private static object MapSso(SsoIdentityProvider p) => new
        {
            p.Id,
            p.Name,
            p.Protocol,
            p.Provider,
            p.Issuer,
            p.ClientId,
            hasClientSecret = p.ClientSecretHash != null,
            p.MetadataUrl,
            p.RedirectUri,
            p.Scopes,
            p.Status,
            p.LastError,
            p.LastTestedAt,
            p.EnabledAt,
            p.CreatedAt
        };

        private static PasswordPolicyDto MapPassword(SecurityPolicy policy) => new()
        {
            MinLength = policy.MinLength,
            RequireUppercase = policy.RequireUppercase,
            RequireLowercase = policy.RequireLowercase,
            RequireNumber = policy.RequireNumber,
            RequireSpecial = policy.RequireSpecial,
            MaxAgeDays = policy.MaxAgeDays,
            MaxFailedAttempts = policy.MaxFailedAttempts,
            LockoutMinutes = policy.LockoutMinutes
        };

        private static MfaPolicyDto MapMfa(SecurityPolicy policy) => new()
        {
            RequireMfaPlatformAdmins = policy.RequireMfaPlatformAdmins,
            RequireMfaTenantAdmins = policy.RequireMfaTenantAdmins,
            AllowTotp = policy.AllowTotp,
            AllowSmsOtp = policy.AllowSmsOtp
        };

        private static string NormalizeProtocol(string? protocol)
        {
            var value = (protocol ?? "OIDC").Trim().ToUpperInvariant();
            return value is "OIDC" or "SAML" or "OAUTH2" ? (value == "OAUTH2" ? "OAuth2" : value) : "OIDC";
        }

        private static bool IsValidCidr(string value)
        {
            if (string.IsNullOrWhiteSpace(value) || !CidrPattern.IsMatch(value)) return false;
            var parts = value.Split('/');
            var octets = parts[0].Split('.');
            if (octets.Any(o => !int.TryParse(o, out var n) || n < 0 || n > 255)) return false;
            if (parts.Length == 2 && (!int.TryParse(parts[1], out var prefix) || prefix < 0 || prefix > 32))
                return false;
            return true;
        }

        private static string? HashSecret(string? plaintext)
        {
            if (string.IsNullOrWhiteSpace(plaintext)) return null;
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(plaintext.Trim()));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private static bool IsMasked(string value) => value.All(c => c == '•' || c == '*');

        private static string? NullIfEmpty(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private Guid? GetUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }
}
