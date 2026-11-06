using System;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;

namespace UabIndia.Tests.TestUtilities
{
    public sealed class NoOpNotificationEmitter : INotificationEmitter
    {
        public Task EmitInAppAsync(
            Guid tenantId,
            Guid recipientUserId,
            string type,
            string title,
            string message,
            object? metadata = null,
            string? triggerEvent = null,
            Guid? companyId = null,
            Guid? projectId = null,
            CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task EmitToEmployeeAsync(
            Guid tenantId,
            Guid employeeId,
            string type,
            string title,
            string message,
            object? metadata = null,
            string? triggerEvent = null,
            Guid? companyId = null,
            Guid? projectId = null,
            CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
