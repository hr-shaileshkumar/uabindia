using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class NotificationEmitterService : INotificationEmitter
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private readonly ApplicationDbContext _db;
        private readonly ILogger<NotificationEmitterService> _logger;
        private readonly IRealtimeNotifier? _realtimeNotifier;

        public NotificationEmitterService(
            ApplicationDbContext db,
            ILogger<NotificationEmitterService> logger,
            IRealtimeNotifier? realtimeNotifier = null)
        {
            _db = db;
            _logger = logger;
            _realtimeNotifier = realtimeNotifier;
        }

        public async Task EmitInAppAsync(
            Guid tenantId,
            Guid recipientUserId,
            string type,
            string title,
            string message,
            object? metadata = null,
            string? triggerEvent = null,
            Guid? companyId = null,
            Guid? projectId = null,
            CancellationToken cancellationToken = default)
        {
            if (tenantId == Guid.Empty || recipientUserId == Guid.Empty)
                return;
            if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(message))
                return;

            try
            {
                var entity = new NotificationMessage
                {
                    TenantId = tenantId,
                    RecipientUserId = recipientUserId,
                    CompanyId = companyId,
                    ProjectId = projectId,
                    Channel = "InApp",
                    Type = string.IsNullOrWhiteSpace(type) ? "General" : type.Trim(),
                    Title = title.Trim(),
                    Message = message.Trim(),
                    Status = "Sent",
                    SentAt = DateTime.UtcNow,
                    IsRead = false,
                    MetadataJson = metadata == null ? null : JsonSerializer.Serialize(metadata, JsonOptions),
                    CreatedAt = DateTime.UtcNow
                };

                _db.NotificationMessages.Add(entity);
                await _db.SaveChangesAsync(cancellationToken);

                // Broadcast real-time push event
                if (_realtimeNotifier != null)
                {
                    await _realtimeNotifier.BroadcastToUserAsync(recipientUserId, entity.Type, entity.Title, entity.Message, metadata, cancellationToken);
                }

                if (!string.IsNullOrWhiteSpace(triggerEvent))
                    await LogEmailStubAsync(tenantId, recipientUserId, triggerEvent.Trim(), title, message, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to emit in-app notification to user {UserId} in tenant {TenantId}",
                    recipientUserId, tenantId);
            }
        }

        public async Task EmitToEmployeeAsync(
            Guid tenantId,
            Guid employeeId,
            string type,
            string title,
            string message,
            object? metadata = null,
            string? triggerEvent = null,
            Guid? companyId = null,
            Guid? projectId = null,
            CancellationToken cancellationToken = default)
        {
            if (tenantId == Guid.Empty || employeeId == Guid.Empty)
                return;

            try
            {
                var userId = await _db.Employees.AsNoTracking()
                    .Where(e => e.TenantId == tenantId && e.Id == employeeId && !e.IsDeleted && e.UserId != null)
                    .Select(e => e.UserId)
                    .FirstOrDefaultAsync(cancellationToken);

                if (!userId.HasValue || userId.Value == Guid.Empty)
                {
                    _logger.LogDebug(
                        "Skip notification for employee {EmployeeId}: no linked UserId",
                        employeeId);
                    return;
                }

                await EmitInAppAsync(
                    tenantId,
                    userId.Value,
                    type,
                    title,
                    message,
                    metadata,
                    triggerEvent,
                    companyId,
                    projectId,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to emit notification for employee {EmployeeId} in tenant {TenantId}",
                    employeeId, tenantId);
            }
        }

        private async Task LogEmailStubAsync(
            Guid tenantId,
            Guid recipientUserId,
            string triggerEvent,
            string fallbackTitle,
            string fallbackMessage,
            CancellationToken cancellationToken)
        {
            try
            {
                var template = await _db.CommunicationTemplates.AsNoTracking()
                    .Where(t =>
                        t.TenantId == tenantId &&
                        !t.IsDeleted &&
                        t.TemplateKind == "Email" &&
                        t.TriggerEvent == triggerEvent &&
                        (t.Status == "Active" || t.Status == "Published" || string.IsNullOrEmpty(t.Status)))
                    .OrderByDescending(t => t.UpdatedAt ?? t.CreatedAt)
                    .FirstOrDefaultAsync(cancellationToken);

                var userEmail = await _db.Users.AsNoTracking()
                    .Where(u => u.Id == recipientUserId && u.TenantId == tenantId && !u.IsDeleted)
                    .Select(u => u.Email)
                    .FirstOrDefaultAsync(cancellationToken);

                var subject = template?.Subject ?? fallbackTitle;
                var body = template?.Body ?? fallbackMessage;

                _logger.LogInformation(
                    "Email stub [{Trigger}] to {Email}: {Subject} — {Body}",
                    triggerEvent,
                    string.IsNullOrWhiteSpace(userEmail) ? recipientUserId.ToString() : userEmail,
                    subject,
                    body.Length > 200 ? body[..200] + "…" : body);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Email stub logging failed for trigger {Trigger}", triggerEvent);
            }
        }
    }
}
