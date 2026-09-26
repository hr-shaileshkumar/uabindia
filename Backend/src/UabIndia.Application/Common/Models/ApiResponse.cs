using System;
using System.Collections.Generic;

namespace UabIndia.Application.Common.Models
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<string> Errors { get; set; } = new();
        public string? CorrelationId { get; set; }
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;

        public static ApiResponse<T> Ok(T data, string message = "Success", string? correlationId = null) =>
            new() { Success = true, Message = message, Data = data, CorrelationId = correlationId };

        public static ApiResponse<T> Fail(string error, string? correlationId = null) =>
            new() { Success = false, Errors = new List<string> { error }, CorrelationId = correlationId };

        public static ApiResponse<T> Fail(List<string> errors, string? correlationId = null) =>
            new() { Success = false, Errors = errors, CorrelationId = correlationId };
    }

    public class PagedResponse<T> : ApiResponse<IReadOnlyList<T>>
    {
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
        public bool HasPreviousPage => PageNumber > 1;
        public bool HasNextPage => PageNumber < TotalPages;

        public static PagedResponse<T> Create(IReadOnlyList<T> items, int totalCount, int pageNumber, int pageSize, string? correlationId = null)
        {
            return new PagedResponse<T>
            {
                Success = true,
                Message = "Success",
                Data = items,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                CorrelationId = correlationId
            };
        }
    }
}
