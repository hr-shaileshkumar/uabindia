using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace UabIndia.Api.Middleware
{
    public class CorrelationIdMiddleware
    {
        private const string CorrelationHeader = "X-Correlation-Id";
        private readonly RequestDelegate _next;
        private readonly ILogger<CorrelationIdMiddleware> _logger;

        public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            var correlationId = context.Request.Headers[CorrelationHeader].ToString();
            if (string.IsNullOrWhiteSpace(correlationId))
            {
                correlationId = Guid.NewGuid().ToString("N");
            }

            context.Items[CorrelationHeader] = correlationId;
            context.Response.Headers[CorrelationHeader] = correlationId;

            using (_logger.BeginScope(new System.Collections.Generic.Dictionary<string, object>
            {
                [CorrelationHeader] = correlationId
            }))
            {
                await _next(context);
            }
        }
    }
}
