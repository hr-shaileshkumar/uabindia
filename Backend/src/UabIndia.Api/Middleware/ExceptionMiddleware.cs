using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Sentry;
using UabIndia.Api.Models;

namespace UabIndia.Api.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _environment;

        public ExceptionMiddleware(
            RequestDelegate next,
            ILogger<ExceptionMiddleware> logger,
            IHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (System.Exception ex)
            {
                var (statusCode, title, code) = MapException(ex);
                _logger.LogError(ex, "Unhandled exception mapped to HTTP {StatusCode}", statusCode);

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

                var exposeDetail = _environment.IsDevelopment();
                context.Response.StatusCode = statusCode;
                context.Response.ContentType = "application/problem+json";
                await context.Response.WriteAsJsonAsync(new ApiErrorResponse
                {
                    Type = statusCode switch
                    {
                        StatusCodes.Status400BadRequest => "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                        StatusCodes.Status401Unauthorized => "https://tools.ietf.org/html/rfc7235#section-3.1",
                        StatusCodes.Status403Forbidden => "https://tools.ietf.org/html/rfc7231#section-6.5.3",
                        StatusCodes.Status404NotFound => "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                        _ => "https://tools.ietf.org/html/rfc7231#section-6.6.1"
                    },
                    Title = title,
                    Status = statusCode,
                    Detail = exposeDetail ? ex.Message : "An unexpected error occurred.",
                    Instance = context.Request.Path,
                    Message = title,
                    Code = code,
                    TraceId = traceId,
                    CorrelationId = correlationId
                });
            }
        }

        private static (int StatusCode, string Title, string Code) MapException(System.Exception ex)
        {
            return ex switch
            {
                ArgumentNullException => (StatusCodes.Status400BadRequest, "The request was invalid.", "bad_request"),
                ArgumentException => (StatusCodes.Status400BadRequest, "The request was invalid.", "bad_request"),
                UnauthorizedAccessException => (StatusCodes.Status403Forbidden, "Access to the requested resource is forbidden.", "forbidden"),
                KeyNotFoundException => (StatusCodes.Status404NotFound, "The requested resource was not found.", "not_found"),
                InvalidOperationException => (StatusCodes.Status409Conflict, "The request could not be completed due to a conflict.", "conflict"),
                _ => (StatusCodes.Status500InternalServerError, "An unhandled server error occurred.", "server_error")
            };
        }
    }
}
