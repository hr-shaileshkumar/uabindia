using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.Extensions.Logging;
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

            // Skip audit for login, health check, and audit-log management endpoints
            // (auditing the audit system itself causes recursive meta-audit entries)
            var path = context.Request.Path.ToString().ToLower();
            if (path.Contains("/auth/login") || path.Contains("/health") || path.Contains("/swagger")
                || path.Contains("/auditlogs"))
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
                request.EnableBuffering();
                var buffer = new byte[Convert.ToInt32(request.ContentLength ?? 0)];
                await request.Body.ReadAsync(buffer, 0, buffer.Length);
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
                var userId = context.User?.FindFirst("sub")?.Value ?? context.User?.FindFirst("userId")?.Value;
                var tenantId = tenantAccessor.GetTenantId();
                var path = context.Request.Path.ToString();
                var method = context.Request.Method;

                // Extract entity name from path (e.g., /api/v1/employees -> Employees)
                var entityName = ExtractEntityNameFromPath(path);

                // Extract entityId from response if available, fall back to URL path for DELETE
                Guid? entityId = ExtractEntityIdFromResponse(responseBody)
                                 ?? (method == "DELETE" ? ExtractEntityIdFromPath(path) : null);

                Guid? performedBy = null;
                if (!string.IsNullOrEmpty(userId) && Guid.TryParse(userId, out var parsedUserId))
                {
                    performedBy = parsedUserId;
                }

                var auditLog = new AuditLog
                {
                    TenantId = tenantId,
                    EntityName = entityName,
                    EntityId = entityId,
                    Action = MapHttpMethodToAction(method),
                    OldValue = method == "PUT" || method == "DELETE" ? requestBody : null,
                    NewValue = method == "POST" || method == "PUT" ? responseBody : null,
                    PerformedBy = performedBy,
                    PerformedAt = DateTime.UtcNow,
                    Ip = context.Connection.RemoteIpAddress?.ToString()
                };

                db.AuditLogs.Add(auditLog);
                await db.SaveChangesAsync();

                _logger.LogInformation(
                    "Audit: {Method} {Path} by User {UserId} on Tenant {TenantId}",
                    method, path, userId ?? "Anonymous", tenantId);
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
                var entity = segments[2]; // Usually api/v1/{controller}
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
    }
}