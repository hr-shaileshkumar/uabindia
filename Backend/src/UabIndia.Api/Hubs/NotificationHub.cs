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
            var companyId = GetClaimGuid("company_id") ?? GetClaimGuid("CompanyId");
            var projectId = GetClaimGuid("project_id") ?? GetClaimGuid("ProjectId");

            if (tenantId != Guid.Empty)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"tenant_{tenantId}");
            }

            if (companyId.HasValue && companyId.Value != Guid.Empty)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"company_{companyId.Value}");
            }

            if (projectId.HasValue && projectId.Value != Guid.Empty)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"project_{projectId.Value}");
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
            var companyId = GetClaimGuid("company_id") ?? GetClaimGuid("CompanyId");
            var projectId = GetClaimGuid("project_id") ?? GetClaimGuid("ProjectId");

            if (tenantId != Guid.Empty)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"tenant_{tenantId}");
            }

            if (companyId.HasValue && companyId.Value != Guid.Empty)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"company_{companyId.Value}");
            }

            if (projectId.HasValue && projectId.Value != Guid.Empty)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"project_{projectId.Value}");
            }

            if (userId != Guid.Empty)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinScopeGroup(string scopeType, string scopeId)
        {
            if (string.IsNullOrWhiteSpace(scopeType) || string.IsNullOrWhiteSpace(scopeId)) return;
            var tenantId = GetTenantId();
            var groupName = $"tenant_{tenantId}_{scopeType.ToLowerInvariant()}_{scopeId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }

        public async Task LeaveScopeGroup(string scopeType, string scopeId)
        {
            if (string.IsNullOrWhiteSpace(scopeType) || string.IsNullOrWhiteSpace(scopeId)) return;
            var tenantId = GetTenantId();
            var groupName = $"tenant_{tenantId}_{scopeType.ToLowerInvariant()}_{scopeId}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }

        public async Task SubscribeToJobProgress(string jobId)
        {
            if (!string.IsNullOrWhiteSpace(jobId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"job_{jobId}");
            }
        }

        public async Task UnsubscribeFromJobProgress(string jobId)
        {
            if (!string.IsNullOrWhiteSpace(jobId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"job_{jobId}");
            }
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

        private Guid? GetClaimGuid(string claimType)
        {
            var val = Context.User?.FindFirst(claimType)?.Value;
            return Guid.TryParse(val, out var id) ? id : null;
        }
    }
}
