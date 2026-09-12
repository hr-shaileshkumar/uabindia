using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using UabIndia.Api.Models;

namespace UabIndia.Api.Middleware
{
    public class CsrfValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<CsrfValidationMiddleware> _logger;

        private static readonly string[] SafeMethods = { "GET", "HEAD", "OPTIONS" };
        private static readonly string[] ExcludedPaths =
        {
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/csrf-token",
            "/api/v1/iam/auth/login",
            "/api/v1/iam/auth/refresh",
            "/api/v1/iam/auth/csrf-token",
            "/hubs",
            "/health",
            "/health/live",
            "/health/ready"
        };

        public CsrfValidationMiddleware(RequestDelegate next, ILogger<CsrfValidationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            var method = context.Request.Method;
            if (SafeMethods.Contains(method, StringComparer.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            var path = context.Request.Path.Value ?? string.Empty;
            if (ExcludedPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
            {
                await _next(context);
                return;
            }

            // Bearer-authenticated API requests (with Authorization header) are inherently immune to CSRF
            var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var csrfCookie = context.Request.Cookies["csrf_token"];
                var csrfHeader = context.Request.Headers["X-CSRF-Token"].FirstOrDefault();
                if (!string.IsNullOrWhiteSpace(csrfCookie) && !string.IsNullOrWhiteSpace(csrfHeader) && !string.Equals(csrfCookie, csrfHeader, StringComparison.Ordinal))
                {
                    _logger.LogWarning("CSRF validation mismatch for {Path}", path);
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new ApiErrorResponse
                    {
                        Message = "CSRF validation failed.",
                        Code = "csrf_validation_failed",
                        TraceId = context.TraceIdentifier
                    });
                    return;
                }
                await _next(context);
                return;
            }

            // Cookie-based session requests require double-submit CSRF token matching
            var csrfCookieRequired = context.Request.Cookies["csrf_token"];
            var csrfHeaderRequired = context.Request.Headers["X-CSRF-Token"].FirstOrDefault();

            if (string.IsNullOrWhiteSpace(csrfCookieRequired) || string.IsNullOrWhiteSpace(csrfHeaderRequired) || !string.Equals(csrfCookieRequired, csrfHeaderRequired, StringComparison.Ordinal))
            {
                _logger.LogWarning("CSRF validation failed for {Path}", path);
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new ApiErrorResponse
                {
                    Message = "CSRF validation failed.",
                    Code = "csrf_validation_failed",
                    TraceId = context.TraceIdentifier
                });
                return;
            }

            await _next(context);
        }
    }
}
