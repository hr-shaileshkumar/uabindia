using System;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public interface IRealtimeNotifier
    {
        Task BroadcastToUserAsync(
            Guid userId,
            string type,
            string title,
            string message,
            object? metadata = null,
            CancellationToken cancellationToken = default);

        Task BroadcastToTenantAsync(
            Guid tenantId,
            string type,
            string title,
            string message,
            object? metadata = null,
            CancellationToken cancellationToken = default);
    }
}
