using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace UabIndia.Api.Middleware
{
    public class RequestResponseLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestResponseLoggingMiddleware> _logger;

        public RequestResponseLoggingMiddleware(RequestDelegate next, ILogger<RequestResponseLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            if (!_logger.IsEnabled(LogLevel.Debug))
            {
                await _next(context);
                return;
            }

            try
            {
                // Log request
                context.Request.EnableBuffering();
                var requestBody = "";
                try
                {
                    context.Request.Body.Position = 0;
                    using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
                    requestBody = await reader.ReadToEndAsync();
                    context.Request.Body.Position = 0;
                }
                catch
                {
                    // Ignore errors reading request body
                }
                _logger.LogDebug("Incoming request {Method} {Path} Body: {Body}", context.Request.Method, context.Request.Path, requestBody);

                // Capture response
                var originalBodyStream = context.Response.Body;
                await using var responseBody = new MemoryStream();
                context.Response.Body = responseBody;

                await _next(context);

                // Log response - with error handling for closed streams
                var responseText = "";
                try
                {
                    if (responseBody.CanSeek && responseBody.Length > 0)
                    {
                        responseBody.Seek(0, SeekOrigin.Begin);
                        using var reader = new StreamReader(responseBody, leaveOpen: true);
                        responseText = await reader.ReadToEndAsync();
                        responseBody.Seek(0, SeekOrigin.Begin);
                    }
                }
                catch
                {
                    // Ignore errors reading response body
                }
                _logger.LogDebug("Outgoing response {StatusCode} Body: {Body}", context.Response.StatusCode, responseText);

                // Copy response back to original stream
                try
                {
                    if (responseBody.Length > 0)
                    {
                        await responseBody.CopyToAsync(originalBodyStream);
                    }
                }
                catch
                {
                    // Response already sent, ignore
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in RequestResponseLoggingMiddleware");
                // Don't rethrow - allow response to proceed
            }
        }
    }
}
