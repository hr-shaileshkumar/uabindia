using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace UabIndia.Identity.Services
{
    public class JwtService
    {
        private readonly IConfiguration _config;
        public JwtService(IConfiguration config) { _config = config; }

        public string GenerateToken(Guid userId, Guid tenantId, string[] roles, TimeSpan expires)
        {
            var keyValue = _config["Jwt:Key"];
            if (string.IsNullOrWhiteSpace(keyValue))
            {
                throw new InvalidOperationException("JWT key is missing.");
            }

            // HMAC-SHA256 requires at least a 256-bit key.
            if (Encoding.UTF8.GetByteCount(keyValue) < 32)
            {
                throw new InvalidOperationException("JWT key must be at least 32 bytes (256 bits) for HMAC-SHA256.");
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyValue));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var baseClaims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim("tenant_id", tenantId.ToString())
            };

            var roleClaims = (roles ?? Array.Empty<string>()).Select(r => new Claim(ClaimTypes.Role, r));
            var claims = baseClaims.Concat(roleClaims);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.Add(expires),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
