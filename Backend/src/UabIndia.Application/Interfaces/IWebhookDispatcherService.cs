using System;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public interface IWebhookDispatcherService
    {
        Task DispatchEventAsync(Guid tenantId, string eventType, object payload, CancellationToken ct = default);
    }
}
