using System;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public interface INotificationEmitter
    {
        /// <summary>
        /// Creates an in-app notification for a user. No-ops if recipient is empty.
        /// Optionally logs an email stub when a CommunicationTemplate matches triggerEvent.
        /// </summary>
        Task EmitInAppAsync(
            Guid tenantId,
            Guid recipientUserId,
            string type,
            string title,
            string message,
            object? metadata = null,
            string? triggerEvent = null,
            Guid? companyId = null,
            Guid? projectId = null,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Resolves Employee.UserId and emits; no-ops when employee has no linked user.
        /// </summary>
        Task EmitToEmployeeAsync(
            Guid tenantId,
            Guid employeeId,
            string type,
            string title,
            string message,
            object? metadata = null,
            string? triggerEvent = null,
            Guid? companyId = null,
            Guid? projectId = null,
            CancellationToken cancellationToken = default);
    }
}
