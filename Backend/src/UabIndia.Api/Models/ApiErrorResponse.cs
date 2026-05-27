using System.Collections.Generic;

namespace UabIndia.Api.Models
{
    public sealed class ApiErrorResponse
    {
        public bool Success { get; init; } = false;
        public string Message { get; init; } = "Request failed.";
        public string Code { get; init; } = "request_error";
        public IDictionary<string, string[]>? Errors { get; init; }
        public string? TraceId { get; init; }
        public string? CorrelationId { get; init; }
    }
}
