using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace UabIndia.Api.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            var tenantId = GetTenantId();

            if (tenantId != Guid.Empty)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"tenant_{tenantId}");
            }

            if (userId != Guid.Empty)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            var tenantId = GetTenantId();

            if (tenantId != Guid.Empty)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"tenant_{tenantId}");
            }

            if (userId != Guid.Empty)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
            }

            await base.OnDisconnectedAsync(exception);
        }

        private Guid GetUserId()
        {
            var user = Context.User;
            var val = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? user?.FindFirst("sub")?.Value
                      ?? user?.FindFirst("nameidentifier")?.Value;
            return Guid.TryParse(val, out var id) ? id : Guid.Empty;
        }

        private Guid GetTenantId()
        {
            var user = Context.User;
            var val = user?.FindFirst("tenant_id")?.Value
                      ?? user?.FindFirst("TenantId")?.Value;
            return Guid.TryParse(val, out var id) ? id : Guid.Empty;
        }
    }
}
