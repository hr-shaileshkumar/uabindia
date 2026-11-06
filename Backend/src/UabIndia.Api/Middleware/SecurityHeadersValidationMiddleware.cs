using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace UabIndia.Api.Middleware
{
    /// <summary>
    /// Security headers validation middleware
    /// Ensures all critical security headers are present in responses
    /// </summary>
    public class SecurityHeadersValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SecurityHeadersValidationMiddleware> _logger;

        private static readonly Dictionary<string, string> RequiredHeaders = new()
        {
            { "X-Content-Type-Options", "nosniff" },
            { "X-Frame-Options", "DENY" },
            { "X-XSS-Protection", "1; mode=block" },
            { "Referrer-Policy", "strict-origin-when-cross-origin" },
            { "Content-Security-Policy", "" } // Just check presence, not value
        };

        public SecurityHeadersValidationMiddleware(RequestDelegate next, ILogger<SecurityHeadersValidationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Execute the request
            await _next(context);

            // Validate security headers in development mode only
            if (context.RequestServices.GetService(typeof(Microsoft.Extensions.Hosting.IHostEnvironment)) is Microsoft.Extensions.Hosting.IHostEnvironment env
                && env.IsDevelopment())
            {
                ValidateSecurityHeaders(context);
            }
        }

        private void ValidateSecurityHeaders(HttpContext context)
        {
            var missingHeaders = new List<string>();

            foreach (var header in RequiredHeaders)
            {
                if (!context.Response.Headers.ContainsKey(header.Key))
                {
                    missingHeaders.Add(header.Key);
                }
                else if (!string.IsNullOrEmpty(header.Value))
                {
                    var actualValue = context.Response.Headers[header.Key].ToString();
                    if (actualValue != header.Value)
                    {
                        _logger.LogWarning(
                            "Security header mismatch: {HeaderName}. Expected: {Expected}, Actual: {Actual}",
                            header.Key, header.Value, actualValue);
                    }
                }
            }

            if (missingHeaders.Any())
            {
                _logger.LogWarning(
                    "Missing critical security headers on {Path}: {Headers}",
                    context.Request.Path,
                    string.Join(", ", missingHeaders));
            }
        }
    }
}
