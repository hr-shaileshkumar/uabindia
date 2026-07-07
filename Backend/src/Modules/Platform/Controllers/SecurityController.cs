using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Authorize(Policy = "Module:security")]
    public class SecurityController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public SecurityController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet("device-sessions")]
        public async Task<IActionResult> DeviceSessions()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return Ok(new { sessions = Array.Empty<DeviceSessionDto>() });
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

            return Ok(new { sessions = data });
        }

        [HttpGet("password-policy")]
        public IActionResult PasswordPolicy()
        {
            // Placeholder policy until configurable settings are implemented
            var policy = new PasswordPolicyDto
            {
                MinLength = 8,
                RequireUppercase = true,
                RequireLowercase = true,
                RequireNumber = true,
                RequireSpecial = false,
                MaxAgeDays = 90
            };

            return Ok(policy);
        }
    }
}
