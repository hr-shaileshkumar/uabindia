using System;
using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace UabIndia.Api.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        /// <summary>
        /// Resolves the authenticated user's id from JWT claims.
        /// ASP.NET maps JWT "sub" to ClaimTypes.NameIdentifier by default, so callers
        /// must not rely on a raw "sub" claim alone.
        /// </summary>
        public static Guid? GetUserId(this ClaimsPrincipal? principal)
        {
            if (principal?.Identity?.IsAuthenticated != true)
            {
                return null;
            }

            var userIdClaim = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? principal.FindFirst("nameidentifier")?.Value
                ?? principal.FindFirst("sub")?.Value
                ?? principal.FindFirst("userId")?.Value;

            return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
        }
    }
}
