using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace UabIndia.Api.Middleware
{
    public class FileUploadValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<FileUploadValidationMiddleware> _logger;

        private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB per file
        private const int MaxFileCount = 5;

        private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "application/pdf",
            "image/png",
            "image/jpeg",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        };

        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".xls", ".xlsx"
        };

        public FileUploadValidationMiddleware(RequestDelegate next, ILogger<FileUploadValidationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            if (!context.Request.HasFormContentType)
            {
                await _next(context);
                return;
            }

            var contentType = context.Request.ContentType ?? string.Empty;
            if (!contentType.StartsWith("multipart/form-data", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            IFormCollection form;
            try
            {
                form = await context.Request.ReadFormAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to read multipart form data.");
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new { error = "invalid_multipart", message = "Invalid multipart form data" });
                return;
            }

            if (form.Files.Count > MaxFileCount)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new { error = "too_many_files", message = $"Maximum {MaxFileCount} files allowed" });
                return;
            }

            foreach (var file in form.Files)
            {
                if (file.Length <= 0 || file.Length > MaxFileSizeBytes)
                {
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    await context.Response.WriteAsJsonAsync(new { error = "invalid_file_size", message = "File size exceeds limit" });
                    return;
                }

                var extension = Path.GetExtension(file.FileName);
                if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
                {
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    await context.Response.WriteAsJsonAsync(new { error = "invalid_file_type", message = "File type not allowed" });
                    return;
                }

                if (!string.IsNullOrWhiteSpace(file.ContentType) && !AllowedContentTypes.Contains(file.ContentType))
                {
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    await context.Response.WriteAsJsonAsync(new { error = "invalid_content_type", message = "Content type not allowed" });
                    return;
                }
            }

            await _next(context);
        }
    }
}
