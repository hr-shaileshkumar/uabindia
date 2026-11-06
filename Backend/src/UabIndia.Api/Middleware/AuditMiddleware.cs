using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using UabIndia.Api.Extensions;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;
using UabIndia.Core.Entities;

namespace UabIndia.Api.Middleware
{
    /// <summary>
    /// Middleware to audit all POST/PUT/DELETE HTTP requests for compliance tracking
    /// Captures userId, tenantId, module, entity, action, request body, and response
    /// </summary>
    public class AuditMiddleware
    {
        private const int MaxCapturedBodyLength = 4000;

        private static readonly HashSet<string> SensitiveJsonKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            "password",
            "newPassword",
            "confirmPassword",
            "token",
            "resetToken",
            "passwordResetToken",
            "refreshToken",
            "access_token",
            "refresh_token",
            "authorization",
            "cookie",
            "secret",
            "apiKey",
            "clientSecret"
        };

        private readonly RequestDelegate _next;
        private readonly ILogger<AuditMiddleware> _logger;

        public AuditMiddleware(RequestDelegate next, ILogger<AuditMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            var method = context.Request.Method;

            // Only audit state-changing operations
            if (method != "POST" && method != "PUT" && method != "DELETE")
            {
                await _next(context);
                return;
            }

            var path = context.Request.Path.ToString();
            if (ShouldSkipAudit(path))
            {
                await _next(context);
                return;
            }

            // Capture request details
            var requestBody = await ReadRequestBodyAsync(context.Request);
            var originalResponseBodyStream = context.Response.Body;

            try
            {
                using var responseBodyStream = new MemoryStream();
                context.Response.Body = responseBodyStream;

                // Execute the request
                await _next(context);

                // Read response
                var responseBody = await ReadResponseBodyAsync(responseBodyStream);

                // Log audit entry if request was successful
                if (context.Response.StatusCode >= 200 && context.Response.StatusCode < 400)
                {
                    await LogAuditAsync(context, db, tenantAccessor, requestBody, responseBody);
                }

                // Copy response back to original stream
                await responseBodyStream.CopyToAsync(originalResponseBodyStream);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AuditMiddleware");
                context.Response.Body = originalResponseBodyStream;
                throw;
            }
        }

        private async Task<string> ReadRequestBodyAsync(HttpRequest request)
        {
            try
            {
                if (request.ContentLength is > MaxCapturedBodyLength)
                {
                    return $"[request body omitted: exceeds {MaxCapturedBodyLength} bytes]";
                }

                if (IsBinaryOrMultipartContent(request.ContentType))
                {
                    return $"[request body omitted: {request.ContentType}]";
                }

                request.EnableBuffering();
                var length = Convert.ToInt32(request.ContentLength ?? 0);
                if (length <= 0)
                {
                    request.Body.Position = 0;
                    return string.Empty;
                }

                var buffer = new byte[length];
                await request.Body.ReadExactlyAsync(buffer.AsMemory(0, buffer.Length));
                var bodyText = Encoding.UTF8.GetString(buffer);
                request.Body.Position = 0; // Reset for next middleware
                return bodyText;
            }
            catch
            {
                return string.Empty;
            }
        }

        private async Task<string> ReadResponseBodyAsync(MemoryStream responseStream)
        {
            try
            {
                responseStream.Position = 0;
                if (responseStream.Length > MaxCapturedBodyLength)
                {
                    responseStream.Position = 0;
                    return $"[response body omitted: exceeds {MaxCapturedBodyLength} bytes]";
                }

                var text = await new StreamReader(responseStream).ReadToEndAsync();
                responseStream.Position = 0; // Reset for copying
                return text;
            }
            catch
            {
                return string.Empty;
            }
        }

        private async Task LogAuditAsync(
            HttpContext context, 
            ApplicationDbContext db, 
            ITenantAccessor tenantAccessor,
            string requestBody,
            string responseBody)
        {
            try
            {
                var performedBy = context.User.GetUserId();
                var tenantId = tenantAccessor.GetTenantId();
                var path = context.Request.Path.ToString();
                var method = context.Request.Method;

                // Extract entity name from path (e.g., /api/v1/employees -> Employees)
                var entityName = ExtractEntityNameFromPath(path);

                // Extract entityId from response if available, fall back to URL path for DELETE
                Guid? entityId = ExtractEntityIdFromResponse(responseBody)
                                 ?? (method == "DELETE" ? ExtractEntityIdFromPath(path) : null);

                var sanitizedRequestBody = SanitizePayload(requestBody, context.Request.ContentType);
                var sanitizedResponseBody = SanitizePayload(responseBody, context.Response.ContentType);

                var auditLog = new AuditLog
                {
                    TenantId = tenantId,
                    EntityName = entityName,
                    EntityId = entityId,
                    Action = MapHttpMethodToAction(method),
                    OldValue = method == "PUT" || method == "DELETE" ? sanitizedRequestBody : null,
                    NewValue = method == "POST" || method == "PUT" ? sanitizedResponseBody : null,
                    PerformedBy = performedBy,
                    PerformedAt = DateTime.UtcNow,
                    Ip = context.Connection.RemoteIpAddress?.ToString()
                };

                if (context.Items.TryGetValue("CompanyId", out var companyObj) && companyObj is Guid companyId)
                    auditLog.CompanyId = companyId;
                if (context.Items.TryGetValue("ProjectId", out var projectObj) && projectObj is Guid projectId)
                    auditLog.ProjectId = projectId;

                db.AuditLogs.Add(auditLog);
                await db.SaveChangesAsync();

                _logger.LogInformation(
                    "Audit: {Method} {Path} by User {UserId} on Tenant {TenantId}",
                    method, path, performedBy?.ToString() ?? "Anonymous", tenantId);
            }
            catch (Exception ex)
            {
                // Don't fail the request if audit logging fails
                _logger.LogError(ex, "Failed to log audit entry for {Method} {Path}", 
                    context.Request.Method, context.Request.Path);
            }
        }

        private string ExtractEntityNameFromPath(string path)
        {
            // Extract entity from path like /api/v1/employees/123 -> Employees
            var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length >= 3)
            {
                var entitySegmentIndex = segments.Length >= 4 &&
                    string.Equals(segments[2], "iam", StringComparison.OrdinalIgnoreCase)
                    ? 3
                    : 2;

                var entity = segments[entitySegmentIndex];
                return char.ToUpper(entity[0]) + entity.Substring(1); // Capitalize
            }
            return "Unknown";
        }

        private Guid? ExtractEntityIdFromPath(string path)
        {
            // For DELETE /api/v1/users/{guid}, extract the GUID from the last URL segment
            try
            {
                var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
                for (int i = segments.Length - 1; i >= 0; i--)
                {
                    if (Guid.TryParse(segments[i], out var guid))
                        return guid;
                }
            }
            catch { }
            return null;
        }

        private Guid? ExtractEntityIdFromResponse(string responseBody)
        {
            try
            {
                if (string.IsNullOrEmpty(responseBody))
                    return null;

                using var doc = JsonDocument.Parse(responseBody);
                if (doc.RootElement.TryGetProperty("id", out var idElement))
                {
                    if (idElement.TryGetGuid(out var guid))
                        return guid;
                }
            }
            catch
            {
                // Ignore parsing errors
            }
            return null;
        }

        private string MapHttpMethodToAction(string method)
        {
            return method switch
            {
                "POST" => "Added",
                "PUT" => "Modified",
                "DELETE" => "Deleted",
                _ => method
            };
        }

        private static bool ShouldSkipAudit(string path)
        {
            var normalizedPath = path.ToLowerInvariant();

            return normalizedPath.Contains("/health")
                || normalizedPath.Contains("/swagger")
                || normalizedPath.Contains("/auditlogs")
                || normalizedPath.Contains("/auth/")
                || normalizedPath.Contains("/iam/auth/");
        }

        private static bool IsBinaryOrMultipartContent(string? contentType)
        {
            if (string.IsNullOrWhiteSpace(contentType))
            {
                return false;
            }

            return contentType.Contains("multipart/form-data", StringComparison.OrdinalIgnoreCase)
                || contentType.Contains("application/octet-stream", StringComparison.OrdinalIgnoreCase)
                || contentType.Contains("image/", StringComparison.OrdinalIgnoreCase)
                || contentType.Contains("video/", StringComparison.OrdinalIgnoreCase)
                || contentType.Contains("audio/", StringComparison.OrdinalIgnoreCase);
        }

        private static string? SanitizePayload(string? payload, string? contentType)
        {
            if (string.IsNullOrWhiteSpace(payload))
            {
                return null;
            }

            if (payload.StartsWith("[request body omitted:", StringComparison.Ordinal) ||
                payload.StartsWith("[response body omitted:", StringComparison.Ordinal))
            {
                return payload;
            }

            if (IsBinaryOrMultipartContent(contentType))
            {
                return $"[payload omitted: {contentType}]";
            }

            var trimmedPayload = payload.Length > MaxCapturedBodyLength
                ? payload[..MaxCapturedBodyLength]
                : payload;

            try
            {
                using var document = JsonDocument.Parse(trimmedPayload);
                var sanitized = SanitizeElement(document.RootElement);
                return JsonSerializer.Serialize(sanitized);
            }
            catch
            {
                return trimmedPayload;
            }
        }

        private static object? SanitizeElement(JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.Object => SanitizeObject(element),
                JsonValueKind.Array => SanitizeArray(element),
                JsonValueKind.String => element.GetString(),
                JsonValueKind.Number => element.TryGetInt64(out var longValue)
                    ? longValue
                    : element.TryGetDecimal(out var decimalValue)
                        ? decimalValue
                        : element.GetRawText(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Null => null,
                _ => element.GetRawText()
            };
        }

        private static Dictionary<string, object?> SanitizeObject(JsonElement element)
        {
            var result = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (var property in element.EnumerateObject())
            {
                result[property.Name] = SensitiveJsonKeys.Contains(property.Name)
                    ? "[redacted]"
                    : SanitizeElement(property.Value);
            }

            return result;
        }

        private static List<object?> SanitizeArray(JsonElement element)
        {
            var result = new List<object?>();
            foreach (var item in element.EnumerateArray())
            {
                result.Add(SanitizeElement(item));
            }

            return result;
        }
    }
}
