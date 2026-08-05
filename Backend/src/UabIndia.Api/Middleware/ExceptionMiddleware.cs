using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Sentry;
using UabIndia.Api.Models;

namespace UabIndia.Api.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception");
                
                // Capture error in Sentry with context
                var traceId = context.TraceIdentifier ?? string.Empty;
                var correlationId = context.Items["X-Correlation-Id"]?.ToString() ?? string.Empty;
                
                SentrySdk.ConfigureScope(scope =>
                {
                    if (!string.IsNullOrWhiteSpace(traceId))
                        scope.SetTag("trace_id", traceId);
                    if (!string.IsNullOrWhiteSpace(correlationId))
                        scope.SetTag("correlation_id", correlationId);
                    scope.SetExtra("request_path", context.Request.Path);
                    scope.SetExtra("request_method", context.Request.Method);
                });
                
                SentrySdk.CaptureException(ex);
                
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/problem+json";
                await context.Response.WriteAsJsonAsync(new ApiErrorResponse
                {
                    Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                    Title = "An unhandled server error occurred.",
                    Status = 500,
                    Detail = ex.Message,
                    Instance = context.Request.Path,
                    Message = "An error occurred.",
                    Code = "server_error",
                    TraceId = traceId,
                    CorrelationId = correlationId
                });
            }
        }
    }
}
