using System;
using System.Collections.Generic;

namespace UabIndia.Application.Models
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Message { get; set; }
        public List<ErrorDetail> Errors { get; set; } = new();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public static ApiResponse<T> Ok(T data, string? message = null)
        {
            return new ApiResponse<T>
            {
                Success = true,
                Data = data,
                Message = message
            };
        }

        public static ApiResponse<T> Fail(string message, List<ErrorDetail>? errors = null)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Data = default,
                Message = message,
                Errors = errors ?? new List<ErrorDetail>()
            };
        }
    }

    public class PagedResponse<T> : ApiResponse<List<T>>
    {
        public PaginationMeta Meta { get; set; } = new();

        public static PagedResponse<T> Create(List<T> data, int totalCount, int page, int pageSize, string? message = null)
        {
            return new PagedResponse<T>
            {
                Success = true,
                Data = data,
                Message = message,
                Meta = new PaginationMeta
                {
                    Page = page,
                    PageSize = pageSize,
                    Total = totalCount,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)Math.Max(1, pageSize))
                }
            };
        }
    }

    public class PaginationMeta
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public int Total { get; set; }
        public int TotalPages { get; set; }
    }

    public class ErrorDetail
    {
        public string? Field { get; set; }
        public string? Code { get; set; }
        public string? Message { get; set; }
    }

    public class PagedQueryDto
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? SearchTerm { get; set; }
        public string? SortBy { get; set; }
        public bool SortDescending { get; set; }
        public Dictionary<string, string>? Filters { get; set; }
    }
}
