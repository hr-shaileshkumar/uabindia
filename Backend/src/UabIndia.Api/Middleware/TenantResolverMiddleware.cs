using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Middleware
{
    public class TenantResolverMiddleware
    {
        private static readonly string[] ReservedHostLabels = { "app", "api", "www" };
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;

        public TenantResolverMiddleware(RequestDelegate next, IMemoryCache cache)
        {
            _next = next;
            _cache = cache;
        }

        public async Task Invoke(HttpContext context, ITenantAccessor tenantAccessor, ApplicationDbContext db, Microsoft.Extensions.Hosting.IHostEnvironment env)
        {
            if (HttpMethods.IsOptions(context.Request.Method) || ShouldAlwaysBypassTenantResolution(context.Request.Path))
            {
                await _next(context);
                return;
            }

            // Accept explicit tenant override via header for shared-host and subdomainless flows.
            if (context.Request.Headers.TryGetValue("X-Tenant", out var headerTenant)
                && !string.IsNullOrWhiteSpace(headerTenant))
            {
                var headerValue = headerTenant.ToString();
                // Accept either a tenant GUID or a subdomain string
                if (Guid.TryParse(headerValue, out var guid))
                {
                    tenantAccessor.SetTenantId(guid);
                        tenantAccessor.SetTenantSchema(BuildSchemaName(null, guid));
                    await _next(context);
                    return;
                }

                // treat header as subdomain and resolve
                var tenantFromHeader = await db.Tenants.FirstOrDefaultAsync(t => t.Subdomain == headerValue);
                if (tenantFromHeader != null)
                {
                    tenantAccessor.SetTenantId(tenantFromHeader.Id);
                    tenantAccessor.SetTenantSchema(BuildSchemaName(tenantFromHeader.Subdomain, tenantFromHeader.Id));
                    await _next(context);
                    return;
                }

                context.Response.StatusCode = 404;
                await context.Response.WriteAsync("Tenant not found");
                return;
            }

            var host = context.Request.Host.Host; // e.g. company.uabtech.in or tenant.localhost
            var subdomain = ExtractSubdomain(host);
            if (string.IsNullOrWhiteSpace(subdomain))
            {
                if (AllowsAnonymousWithoutTenant(context.Request.Path))
                {
                    await _next(context);
                    return;
                }

                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Tenant context missing");
                return;
            }

            var cacheKey = $"tenant_{subdomain}";
            var tenant = await _cache.GetOrCreateAsync(cacheKey, async entry =>
            {
                entry.SlidingExpiration = System.TimeSpan.FromMinutes(30);
                return await db.Tenants.FirstOrDefaultAsync(t => t.Subdomain == subdomain);
            });

            if (tenant == null)
            {
                context.Response.StatusCode = 404;
                await context.Response.WriteAsync("Tenant not found");
                return;
            }

            tenantAccessor.SetTenantId(tenant.Id);
            tenantAccessor.SetTenantSchema(BuildSchemaName(tenant.Subdomain, tenant.Id));
            await _next(context);
        }

        private string? ExtractSubdomain(string host)
        {
            if (string.IsNullOrWhiteSpace(host)) return null;
            var parts = host.Split('.');
            // Accept tenant.localhost (2 parts) for local development AND tenant.example.com (3+ parts)
            if (host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase) && parts.Length >= 2)
            {
                var candidate = parts[0];
                if (!ReservedHostLabels.Contains(candidate, StringComparer.OrdinalIgnoreCase))
                {
                    return candidate;
                }

                return null;
            }

            if (parts.Length >= 3)
            {
                var candidate = parts[0];
                if (!ReservedHostLabels.Contains(candidate, StringComparer.OrdinalIgnoreCase))
                {
                    return candidate;
                }
            }

            return null;
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
                || value.Equals("/api/v1/public/contact", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/recruitment/job-postings/active", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/auth/login", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/tenants/resolve", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/auth/refresh", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/auth/csrf-token", StringComparison.OrdinalIgnoreCase)
                || value.Equals("/api/v1/iam/auth/login", StringComparison.OrdinalIgnoreCase)
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
    }
}
