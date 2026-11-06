using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;

namespace UabIndia.Api.Middleware
{
    public class SystemMetricsMiddleware
    {
        private readonly RequestDelegate _next;

        public SystemMetricsMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ISystemMetrics metrics, ITenantAccessor? tenantAccessor)
        {
            var sw = Stopwatch.StartNew();

            try
            {
                await _next(context);
            }
            finally
            {
                sw.Stop();

                var path = context.Request.Path.Value ?? "/";
                if (path.StartsWith("/api", StringComparison.OrdinalIgnoreCase))
                {
                    var tenantId = tenantAccessor?.GetTenantId().ToString();
                    if (string.IsNullOrWhiteSpace(tenantId) || tenantId == Guid.Empty.ToString())
                    {
                        tenantId = context.Request.Headers["X-Tenant"].ToString();
                    }

                    metrics.RecordTenantRequest(
                        tenantId: string.IsNullOrWhiteSpace(tenantId) ? "public" : tenantId,
                        method: context.Request.Method,
                        route: path,
                        statusCode: context.Response.StatusCode,
                        durationMs: sw.Elapsed.TotalMilliseconds);
                }
            }
        }
    }

    // Backward compatibility alias
    public class PlatformMetricsMiddleware : SystemMetricsMiddleware
    {
        public PlatformMetricsMiddleware(RequestDelegate next) : base(next) { }
    }
}
