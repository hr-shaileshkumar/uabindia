using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using UabIndia.Application.Interfaces;
using UabIndia.Api.Services;
using UabIndia.Core.Authorization;

namespace UabIndia.Api.Middleware
{
    public class TenantResolverMiddleware
    {
        private static readonly string[] ReservedInfrastructureTenantLabels = { "app", "api", "www" };
        private readonly RequestDelegate _next;

        public TenantResolverMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context, ITenantAccessor tenantAccessor, TenantResolutionService tenantResolutionService)
        {
            if (HttpMethods.IsOptions(context.Request.Method) || ShouldAlwaysBypassTenantResolution(context.Request.Path))
            {
                await _next(context);
                return;
            }

            // Tenant asserted by the validated access token. Once a caller is authenticated this
            // claim is the only authority for tenant scope: request-supplied hints (X-Tenant header,
            // Host header) may confirm it but must never widen it to a different tenant.
            var authenticatedTenantId = GetAuthenticatedTenantId(context);
            var isSuperAdmin = IsSuperAdmin(context);

            // Accept explicit tenant override via header for shared-host and subdomainless flows.
            if (context.Request.Headers.TryGetValue("X-Tenant", out var headerTenant)
                && !string.IsNullOrWhiteSpace(headerTenant)
                && !IsReservedInfrastructureTenantLabel(headerTenant.ToString()))
            {
                var headerValue = headerTenant.ToString();
                Guid requestedTenantId;
                string? requestedSubdomain = null;

                // Accept either a tenant GUID or a subdomain string
                if (Guid.TryParse(headerValue, out var guid))
                {
                    requestedTenantId = guid;
                }
                else
                {
                    var headerResolution = headerValue.Contains('.', StringComparison.Ordinal)
                        ? await tenantResolutionService.ResolveAsync(host: headerValue, cancellationToken: context.RequestAborted)
                        : await tenantResolutionService.ResolveAsync(subdomain: headerValue, cancellationToken: context.RequestAborted);

                    if (headerResolution == null)
                    {
                        context.Response.StatusCode = 404;
                        await context.Response.WriteAsync("Tenant not found");
                        return;
                    }

                    requestedTenantId = headerResolution.Tenant.Id;
                    requestedSubdomain = headerResolution.Tenant.Subdomain;
                }

                if (!IsTenantScopeAllowed(authenticatedTenantId, requestedTenantId, isSuperAdmin))
                {
                    await WriteTenantScopeDeniedAsync(context);
                    return;
                }

                tenantAccessor.SetTenantId(requestedTenantId);
                tenantAccessor.SetTenantSchema(BuildSchemaName(requestedSubdomain, requestedTenantId));
                await _next(context);
                return;
            }

            var host = context.Request.Headers["X-Forwarded-Host"].FirstOrDefault() ?? context.Request.Host.Host;
            var resolution = await tenantResolutionService.ResolveAsync(host: host, cancellationToken: context.RequestAborted);
            if (resolution == null)
            {
                if (TrySetTenantContextFromAuthenticatedUser(context, tenantAccessor, ShouldSkipTenantSchemaForAuthenticatedRequest(context.Request.Path)))
                {
                    await _next(context);
                    return;
                }

                if (AllowsAnonymousWithoutTenant(context.Request.Path))
                {
                    await _next(context);
                    return;
                }

                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Tenant context missing");
                return;
            }

            if (!IsTenantScopeAllowed(authenticatedTenantId, resolution.Tenant.Id, isSuperAdmin))
            {
                await WriteTenantScopeDeniedAsync(context);
                return;
            }

            tenantAccessor.SetTenantId(resolution.Tenant.Id);
            tenantAccessor.SetTenantSchema(BuildSchemaName(resolution.Tenant.Subdomain, resolution.Tenant.Id));
            await _next(context);
        }

        /// <summary>
        /// A resolved tenant is only usable when it matches the authenticated caller's tenant claim.
        /// Anonymous requests are unconstrained because login and public flows resolve tenant from
        /// the host or header before any token exists. SuperAdmin is exempt because platform
        /// administration legitimately spans tenants.
        /// </summary>
        private static bool IsTenantScopeAllowed(Guid? authenticatedTenantId, Guid requestedTenantId, bool isSuperAdmin)
        {
            if (isSuperAdmin)
            {
                return true;
            }

            if (authenticatedTenantId is null)
            {
                return true;
            }

            return authenticatedTenantId.Value == requestedTenantId;
        }

        private static async Task WriteTenantScopeDeniedAsync(HttpContext context)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new
            {
                message = "Tenant scope denied.",
                code = "tenant_scope_denied"
            });
        }

        private static Guid? GetAuthenticatedTenantId(HttpContext context)
        {
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                return null;
            }

            var tenantClaim = context.User.FindFirst("tenant_id")?.Value
                ?? context.User.FindFirst("tenantId")?.Value;

            return Guid.TryParse(tenantClaim, out var tenantId) && tenantId != Guid.Empty
                ? tenantId
                : null;
        }

        private static bool IsSuperAdmin(HttpContext context)
        {
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                return false;
            }

            var roleClaims = context.User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value);

            return RoleCatalog.HasAnyRole(roleClaims, SystemRole.SuperAdmin);
        }

        private static bool TrySetTenantContextFromAuthenticatedUser(HttpContext context, ITenantAccessor tenantAccessor, bool skipTenantSchema)
        {
            var tenantId = GetAuthenticatedTenantId(context);
            if (tenantId is null)
            {
                return false;
            }

            tenantAccessor.SetTenantId(tenantId.Value);
            tenantAccessor.SetTenantSchema(skipTenantSchema ? null : BuildSchemaName(null, tenantId.Value));
            return true;
        }

        private static bool ShouldSkipTenantSchemaForAuthenticatedRequest(PathString path)
        {
            var value = path.Value ?? string.Empty;
            if (string.IsNullOrWhiteSpace(value))
            {
                return false;
            }

            return value.Equals("/api/v1/auth/login", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/auth/forgot-password", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/auth/reset-password", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/auth/refresh", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/auth/csrf-token", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/iam/auth/login", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/iam/auth/forgot-password", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/iam/auth/reset-password", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/iam/auth/refresh", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/iam/auth/csrf-token", StringComparison.OrdinalIgnoreCase);
        }

        private static bool ShouldAlwaysBypassTenantResolution(PathString path)
        {
            var value = path.Value ?? string.Empty;
            if (string.IsNullOrWhiteSpace(value))
            {
                return true;
            }

            if (value == "/" || value == "/login" || value.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) || value.StartsWith("/hangfire", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (value.Equals("/health", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/health/live", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/health/ready", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return false;
        }

        private static bool AllowsAnonymousWithoutTenant(PathString path)
        {
            var value = path.Value ?? string.Empty;
            if (string.IsNullOrWhiteSpace(value))
            {
                return false;
            }

            return value.Equals("/api/v1/public/site-manifest", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/public/company-profile", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/public/site-data", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/public/contact", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/recruitment/job-postings/active", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/auth/login", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/auth/forgot-password", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/auth/reset-password", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/tenants/resolve", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/auth/refresh", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/auth/csrf-token", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/iam/auth/login", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/iam/auth/forgot-password", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/iam/auth/reset-password", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/iam/auth/refresh", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/iam/auth/csrf-token", StringComparison.OrdinalIgnoreCase)
                || value.StartsWith("/api/v1/public/website-pages/", StringComparison.OrdinalIgnoreCase);
        }

        private static string BuildSchemaName(string? subdomain, Guid tenantId)
        {
            var baseName = !string.IsNullOrWhiteSpace(subdomain)
                ? SanitizeSchemaName(subdomain)
                : tenantId.ToString("N");

            return $"tenant_{baseName}";
        }

        private static string SanitizeSchemaName(string input)
        {
            var span = input.Trim().ToLowerInvariant();
            var buffer = new char[span.Length];
            var idx = 0;
            foreach (var ch in span)
            {
                if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '_')
                {
                    buffer[idx++] = ch;
                }
                else if (ch == '-' || ch == '.')
                {
                    buffer[idx++] = '_';
                }
            }

            if (idx == 0)
            {
                return "default";
            }

            return new string(buffer, 0, idx);
        }

        private static bool IsReservedInfrastructureTenantLabel(string value)
        {
            return ReservedInfrastructureTenantLabels.Contains(
                value.Trim(),
                StringComparer.OrdinalIgnoreCase);
        }
    }
}
