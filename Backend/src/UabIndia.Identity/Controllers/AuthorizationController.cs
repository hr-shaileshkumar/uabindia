using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using UabIndia.Identity.Configuration;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Identity.Controllers
{
    [ApiController]
    public class AuthorizationController : ControllerBase
    {
        private readonly IOpenIddictApplicationManager _applicationManager;
        private readonly IOpenIddictAuthorizationManager _authorizationManager;
        private readonly IOpenIddictScopeManager _scopeManager;
        private readonly ApplicationDbContext _db;

        public AuthorizationController(
            IOpenIddictApplicationManager applicationManager,
            IOpenIddictAuthorizationManager authorizationManager,
            IOpenIddictScopeManager scopeManager,
            ApplicationDbContext db)
        {
            _applicationManager = applicationManager;
            _authorizationManager = authorizationManager;
            _scopeManager = scopeManager;
            _db = db;
        }

        [AllowAnonymous]
        [HttpGet("~/connect/authorize")]
        [HttpPost("~/connect/authorize")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> Authorize()
        {
            var request = HttpContext.GetOpenIddictServerRequest() ??
                throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

            // 1. Check if user is already signed into the central SSO session
            var result = await HttpContext.AuthenticateAsync(UabIndiaOpenIddictServerExtensions.CentralCookieScheme);
            if (!result.Succeeded || result.Principal?.Identity?.IsAuthenticated != true)
            {
                // Redirect user to the central login UI, preserving the full return URL
                var returnUrl = Request.PathBase + Request.Path + Request.QueryString;
                return Redirect($"/auth/login?returnUrl={Uri.EscapeDataString(returnUrl)}");
            }

            // 2. Extract UserId from existing session cookie
            var userIdClaim = result.Principal.FindFirst(ClaimTypes.NameIdentifier) ??
                              result.Principal.FindFirst(OpenIddictConstants.Claims.Subject);

            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Forbid(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }

            // 3. Verify user in database
            var user = await _db.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted && u.IsActive);

            if (user == null)
            {
                return Forbid(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }

            // 4. Fetch user roles
            var roles = await _db.UserRoles
                .IgnoreQueryFilters()
                .Where(ur => ur.UserId == userId && !ur.IsDeleted)
                .Join(_db.Roles.IgnoreQueryFilters(), ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                .ToListAsync();

            // 5. Create ClaimsIdentity for OpenIddict
            var identity = new ClaimsIdentity(
                authenticationType: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                nameType: OpenIddictConstants.Claims.Name,
                roleType: OpenIddictConstants.Claims.Role);

            // Add standard claims
            identity.AddClaim(new Claim(OpenIddictConstants.Claims.Subject, user.Id.ToString())
                .SetDestinations(OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken));

            identity.AddClaim(new Claim(OpenIddictConstants.Claims.Email, user.Email ?? string.Empty)
                .SetDestinations(OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken));

            identity.AddClaim(new Claim(OpenIddictConstants.Claims.Name, user.FullName ?? user.Email ?? "User")
                .SetDestinations(OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken));

            identity.AddClaim(new Claim("tenant_id", user.TenantId.ToString())
                .SetDestinations(OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken));

            if (user.IsSystemAdmin)
            {
                identity.AddClaim(new Claim("is_system_admin", "true")
                    .SetDestinations(OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken));
            }

            // Add roles
            foreach (var role in roles)
            {
                identity.AddClaim(new Claim(OpenIddictConstants.Claims.Role, role)
                    .SetDestinations(OpenIddictConstants.Destinations.AccessToken, OpenIddictConstants.Destinations.IdentityToken));
            }

            var principal = new ClaimsPrincipal(identity);
            principal.SetScopes(request.GetScopes());
            principal.SetResources(new[] { "uabindia-api" });

            return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        [AllowAnonymous]
        [HttpPost("~/connect/token")]
        [IgnoreAntiforgeryToken]
        [Produces("application/json")]
        public async Task<IActionResult> Exchange()
        {
            var request = HttpContext.GetOpenIddictServerRequest() ??
                throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

            if (request.IsAuthorizationCodeGrantType() || request.IsRefreshTokenGrantType())
            {
                var result = await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
                var userIdString = result.Principal?.GetClaim(OpenIddictConstants.Claims.Subject);

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                {
                    return Forbid(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
                }

                var user = await _db.Users
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted && u.IsActive);

                if (user == null)
                {
                    return Forbid(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
                }

                // Refresh the claims principal
                return SignIn(result.Principal!, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }

            throw new InvalidOperationException("The specified grant type is not supported.");
        }

        [Authorize(AuthenticationSchemes = OpenIddictServerAspNetCoreDefaults.AuthenticationScheme)]
        [HttpGet("~/connect/userinfo")]
        [HttpPost("~/connect/userinfo")]
        [Produces("application/json")]
        public async Task<IActionResult> Userinfo()
        {
            var userIdString = User.GetClaim(OpenIddictConstants.Claims.Subject);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return Challenge(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }

            var user = await _db.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted && u.IsActive);

            if (user == null)
            {
                return Challenge(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }

            var roles = await _db.UserRoles
                .IgnoreQueryFilters()
                .Where(ur => ur.UserId == userId && !ur.IsDeleted)
                .Join(_db.Roles.IgnoreQueryFilters(), ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                .ToListAsync();

            var claims = new Dictionary<string, object>(StringComparer.Ordinal)
            {
                [OpenIddictConstants.Claims.Subject] = user.Id.ToString(),
                [OpenIddictConstants.Claims.Email] = user.Email ?? string.Empty,
                [OpenIddictConstants.Claims.Name] = user.FullName ?? user.Email ?? "User",
                ["tenant_id"] = user.TenantId.ToString(),
                ["is_system_admin"] = user.IsSystemAdmin,
                [OpenIddictConstants.Claims.Role] = roles
            };

            return Ok(claims);
        }

        [AllowAnonymous]
        [HttpGet("~/connect/logout")]
        [HttpPost("~/connect/logout")]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> Logout()
        {
            // Clear Central SSO Cookie
            await HttpContext.SignOutAsync(UabIndiaOpenIddictServerExtensions.CentralCookieScheme);

            // Signal OpenIddict to complete end session
            return SignOut(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }
    }
}
