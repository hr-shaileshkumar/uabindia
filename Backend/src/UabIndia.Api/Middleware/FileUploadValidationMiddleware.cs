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

        private static readonly Dictionary<string, List<byte[]>> FileSignatures = new(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = new() { new byte[] { 0x25, 0x50, 0x44, 0x46 } }, // %PDF-
            [".png"] = new() { new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A } },
            [".jpeg"] = new() { new byte[] { 0xFF, 0xD8, 0xFF } },
            [".jpg"] = new() { new byte[] { 0xFF, 0xD8, 0xFF } },
            [".doc"] = new() { new byte[] { 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 } },
            [".xls"] = new() { new byte[] { 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 } },
            [".docx"] = new() { new byte[] { 0x50, 0x4B, 0x03, 0x04 } }, // PK.. (ZIP archive)
            [".xlsx"] = new() { new byte[] { 0x50, 0x4B, 0x03, 0x04 } }  // PK.. (ZIP archive)
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

                if (!await IsValidFileSignatureAsync(file, extension))
                {
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    await context.Response.WriteAsJsonAsync(new { error = "invalid_file_signature", message = "File header signature does not match expected format" });
                    return;
                }
            }

            await _next(context);
        }

        private static async Task<bool> IsValidFileSignatureAsync(IFormFile file, string extension)
        {
            if (!FileSignatures.TryGetValue(extension, out var signatures))
            {
                return false;
            }

            var maxHeaderLength = signatures.Max(s => s.Length);
            var header = new byte[maxHeaderLength];

            using var stream = file.OpenReadStream();
            var bytesRead = await stream.ReadAsync(header.AsMemory(0, maxHeaderLength));
            if (bytesRead <= 0)
            {
                return false;
            }

            return signatures.Any(sig => bytesRead >= sig.Length && header.Take(sig.Length).SequenceEqual(sig));
        }
    }
}
