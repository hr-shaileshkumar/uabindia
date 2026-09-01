using System;
using System.Linq;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Extensions
{
    public static class RateLimitingExtensions
    {
        public static IServiceCollection AddEnterpriseRateLimiting(
            this IServiceCollection services,
            IHostEnvironment env)
        {
            services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                var isDev = env.IsDevelopment();
                var ipPermitLimit = isDev ? 5000 : 100;
                var ipWindow = TimeSpan.FromMinutes(1);
                var tenantTokenLimit = isDev ? 500000 : 10000;
                var tenantReplenishment = isDev ? TimeSpan.FromHours(1) : TimeSpan.FromDays(1);
                var tenantTokensPerPeriod = isDev ? 500000 : 10000;

                // Auth-specific limiter (Strict brute-force prevention)
                options.AddPolicy("auth-login", httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: GetClientIp(httpContext),
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = isDev ? 30 : 5,
                            Window = isDev ? TimeSpan.FromMinutes(5) : TimeSpan.FromMinutes(15),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Forgot-password limiter (3 attempts per 15 min in prod)
                options.AddPolicy("auth-forgot", httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: GetClientIp(httpContext),
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = isDev ? 20 : 3,
                            Window = isDev ? TimeSpan.FromMinutes(5) : TimeSpan.FromMinutes(15),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Reset-password limiter
                options.AddPolicy("auth-reset", httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: GetClientIp(httpContext),
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = isDev ? 20 : 5,
                            Window = isDev ? TimeSpan.FromMinutes(5) : TimeSpan.FromMinutes(15),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Public tenant registration limiter (Anti-spam / Anti-bot)
                options.AddPolicy("public-register", httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: GetClientIp(httpContext),
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = isDev ? 30 : 5,
                            Window = TimeSpan.FromHours(1),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Layer 1: Per-IP rate limiting (DDoS protection)
                options.AddPolicy("ip-limit", httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: GetClientIp(httpContext),
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = ipPermitLimit,
                            Window = ipWindow,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Layer 2: Per-Tenant rate limiting (Fair usage quota)
                options.AddPolicy("tenant-quota", httpContext =>
                {
                    var tenantAccessor = httpContext.RequestServices.GetService<ITenantAccessor>();
                    var tenantId = tenantAccessor?.GetTenantId() ?? Guid.Empty;

                    return RateLimitPartition.GetTokenBucketLimiter(
                        partitionKey: tenantId.ToString(),
                        factory: _ => new TokenBucketRateLimiterOptions
                        {
                            TokenLimit = tenantTokenLimit,
                            ReplenishmentPeriod = tenantReplenishment,
                            TokensPerPeriod = tenantTokensPerPeriod,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        });
                });

                // Default policy: Chained IP + Tenant limiting
                options.GlobalLimiter = PartitionedRateLimiter.CreateChained(
                    PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
                    {
                        var ip = GetClientIp(httpContext);
                        return RateLimitPartition.GetFixedWindowLimiter(
                            partitionKey: ip,
                            factory: _ => new FixedWindowRateLimiterOptions
                            {
                                PermitLimit = ipPermitLimit,
                                Window = ipWindow,
                                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                                QueueLimit = 0
                            });
                    }),
                    PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
                    {
                        var tenantAccessor = httpContext.RequestServices.GetService<ITenantAccessor>();
                        var tenantId = tenantAccessor?.GetTenantId() ?? Guid.Empty;

                        return RateLimitPartition.GetTokenBucketLimiter(
                            partitionKey: tenantId.ToString(),
                            factory: _ => new TokenBucketRateLimiterOptions
                            {
                                TokenLimit = tenantTokenLimit,
                                ReplenishmentPeriod = tenantReplenishment,
                                TokensPerPeriod = tenantTokensPerPeriod,
                                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                                QueueLimit = 0
                            });
                    })
                );
            });

            return services;
        }

        public static string GetClientIp(HttpContext context)
        {
            var cfIp = context.Request.Headers["CF-Connecting-IP"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(cfIp)) return cfIp.Trim();

            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(forwardedFor))
            {
                var firstIp = forwardedFor.Split(',')[0].Trim();
                if (!string.IsNullOrWhiteSpace(firstIp)) return firstIp;
            }

            return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }
    }
}
