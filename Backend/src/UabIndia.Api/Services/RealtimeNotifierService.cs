using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using UabIndia.Api.Hubs;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Services
{
    public class RealtimeNotifierService : IRealtimeNotifier
    {
        private readonly IHubContext<NotificationHub> _hub;

        public RealtimeNotifierService(IHubContext<NotificationHub> hub)
        {
            _hub = hub;
        }

        public async Task BroadcastToUserAsync(
            Guid userId,
            string type,
            string title,
            string message,
            object? metadata = null,
            CancellationToken cancellationToken = default)
        {
            await _hub.Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", new
            {
                type,
                title,
                message,
                createdAt = DateTime.UtcNow,
                metadata
            }, cancellationToken);
        }

        public async Task BroadcastToTenantAsync(
            Guid tenantId,
            string type,
            string title,
            string message,
            object? metadata = null,
            CancellationToken cancellationToken = default)
        {
            await _hub.Clients.Group($"tenant_{tenantId}").SendAsync("ReceiveNotification", new
            {
                type,
                title,
                message,
                createdAt = DateTime.UtcNow,
                metadata
            }, cancellationToken);
        }
    }
}
