using System;
using System.Collections.Generic;

namespace UabIndia.Application.Common.Models
{
    /// <summary>
    /// Structured field-level and code-level error details for metadata forms.
    /// </summary>
    public class ApiError
    {
        public string Code { get; set; } = "ERROR";
        public string Message { get; set; } = string.Empty;
        public string? Field { get; set; }

        public ApiError() { }

        public ApiError(string message, string code = "ERROR", string? field = null)
        {
            Message = message;
            Code = code;
            Field = field;
        }
    }

    /// <summary>
    /// Standardized enterprise pagination envelope.
    /// </summary>
    public class PaginationMetadata
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public int TotalRecords { get; set; } = 0;
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalRecords / PageSize) : 0;
        public bool HasNext => Page < TotalPages;
        public bool HasPrevious => Page > 1;

        public PaginationMetadata() { }

        public PaginationMetadata(int page, int pageSize, int totalRecords)
        {
            Page = page;
            PageSize = pageSize;
            TotalRecords = totalRecords;
        }
    }

    /// <summary>
    /// Core enterprise API response envelope.
    /// </summary>
    public class ApiResponse<T>
    {
        public bool Success { get; set; } = true;
        public string? Message { get; set; }
        public T? Data { get; set; }
        public PaginationMetadata? Pagination { get; set; }
        public List<string> Errors { get; set; } = new();
        public List<ApiError> StructuredErrors { get; set; } = new();
        public string? CorrelationId { get; set; }
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;

        public static ApiResponse<T> Ok(T data, string? message = "Success", string? correlationId = null) =>
            new() { Success = true, Message = message, Data = data, CorrelationId = correlationId };

        public static ApiResponse<T> Ok(T data, PaginationMetadata pagination, string? message = "Success", string? correlationId = null) =>
            new() { Success = true, Message = message, Data = data, Pagination = pagination, CorrelationId = correlationId };

        public static ApiResponse<T> Fail(string error, string? code = "ERROR", string? field = null, string? correlationId = null)
        {
            var res = new ApiResponse<T> { Success = false, CorrelationId = correlationId };
            res.Errors.Add(error);
            res.StructuredErrors.Add(new ApiError(error, code ?? "ERROR", field));
            return res;
        }

        public static ApiResponse<T> Fail(List<string> errors, string? correlationId = null)
        {
            var res = new ApiResponse<T> { Success = false, Errors = errors, CorrelationId = correlationId };
            foreach (var err in errors)
            {
                res.StructuredErrors.Add(new ApiError(err));
            }
            return res;
        }

        public static ApiResponse<T> Fail(List<ApiError> structuredErrors, string? message = "Validation failed", string? correlationId = null)
        {
            var res = new ApiResponse<T> { Success = false, Message = message, StructuredErrors = structuredErrors, CorrelationId = correlationId };
            foreach (var se in structuredErrors)
            {
                res.Errors.Add(se.Message);
            }
            return res;
        }
    }

    public class PagedResponse<T> : ApiResponse<IReadOnlyList<T>>
    {
        public int PageNumber => Pagination?.Page ?? 1;
        public int PageSize => Pagination?.PageSize ?? 25;
        public int TotalCount => Pagination?.TotalRecords ?? 0;
        public int TotalPages => Pagination?.TotalPages ?? 0;
        public bool HasPreviousPage => Pagination?.HasPrevious ?? false;
        public bool HasNextPage => Pagination?.HasNext ?? false;

        public static PagedResponse<T> Create(IReadOnlyList<T> items, int totalCount, int pageNumber, int pageSize, string? correlationId = null)
        {
            return new PagedResponse<T>
            {
                Success = true,
                Message = "Success",
                Data = items,
                Pagination = new PaginationMetadata(pageNumber, pageSize, totalCount),
                CorrelationId = correlationId
            };
        }
    }
}
