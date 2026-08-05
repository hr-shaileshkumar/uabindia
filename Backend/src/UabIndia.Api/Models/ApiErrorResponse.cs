using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace UabIndia.Api.Models
{
    /// <summary>
    /// Uniform API Error Response implementing RFC 7807 Problem Details for HTTP APIs.
    /// </summary>
    public sealed class ApiErrorResponse
    {
        public bool Success { get; init; } = false;

        [JsonPropertyName("type")]
        public string Type { get; init; } = "https://tools.ietf.org/html/rfc7231#section-6.6.1";

        [JsonPropertyName("title")]
        public string Title { get; init; } = "An error occurred while processing your request.";

        [JsonPropertyName("status")]
        public int Status { get; init; } = 500;

        [JsonPropertyName("detail")]
        public string Detail { get; init; } = "Request failed.";

        [JsonPropertyName("instance")]
        public string? Instance { get; init; }

        public string Message { get; init; } = "Request failed.";
        public string Code { get; init; } = "request_error";
        public IDictionary<string, string[]>? Errors { get; init; }
        public string? TraceId { get; init; }
        public string? CorrelationId { get; init; }
    }
}

