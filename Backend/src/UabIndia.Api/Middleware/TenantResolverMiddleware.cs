using System;
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
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;

        public TenantResolverMiddleware(RequestDelegate next, IMemoryCache cache)
        {
            _next = next;
            _cache = cache;
        }

        public async Task Invoke(HttpContext context, ITenantAccessor tenantAccessor, ApplicationDbContext db, Microsoft.Extensions.Hosting.IHostEnvironment env)
        {
            // Allow explicit tenant override via header only for local/dev testing
            if (env.IsDevelopment()
                && context.Request.Headers.TryGetValue("X-Tenant", out var headerTenant)
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
                // In Development allow a default tenant (Guid.Empty) so local testing works without subdomains
                if (env.IsDevelopment())
                {
                    var defaultTenant = await db.Tenants.FirstOrDefaultAsync(t => t.Subdomain == "api")
                        ?? await db.Tenants.FirstOrDefaultAsync();
                    if (defaultTenant != null)
                    {
                        tenantAccessor.SetTenantId(defaultTenant.Id);
                        tenantAccessor.SetTenantSchema(BuildSchemaName(defaultTenant.Subdomain, defaultTenant.Id));
                        await _next(context);
                        return;
                    }
                }

                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Tenant subdomain missing");
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
            if (parts.Length >= 2)
            {
                return parts[0];
            }
            return null;
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
