using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;

namespace UabIndia.Api.Middleware
{
    /// <summary>
    /// Centralized data-visibility context for request lifecycle.
    /// SuperAdmin users can see deleted and cross-tenant data by default.
    /// </summary>
    public class DataVisibilityMiddleware
    {
        private readonly RequestDelegate _next;

        public DataVisibilityMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context, ITenantAccessor tenantAccessor)
        {
            var roleClaims = context.User?.Claims?
                .Where(c => c.Type == ClaimTypes.Role || c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value) ?? Enumerable.Empty<string>();

            var isSuperAdmin = RoleCatalog.HasAnyRole(roleClaims, SystemRole.SuperAdmin);

            // Backend authoritative defaults:
            // SuperAdmin -> full visibility (all tenants + deleted records)
            // Others     -> tenant-scoped active records only
            tenantAccessor.SetDataVisibility(
                includeDeleted: isSuperAdmin,
                includeAllTenants: isSuperAdmin);

            await _next(context);
        }
    }
}