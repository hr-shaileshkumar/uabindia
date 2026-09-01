using System;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public interface IDomainEvent
    {
        Guid EventId { get; }
        Guid TenantId { get; }
        DateTime OccurredAtUtc { get; }
        string EventType { get; }
    }

    public interface IDomainEventHandler<in TEvent> where TEvent : IDomainEvent
    {
        Task HandleAsync(TEvent domainEvent, CancellationToken cancellationToken = default);
    }

    public interface IDomainEventDispatcher
    {
        Task DispatchAsync(string eventType, string payloadJson, Guid tenantId, CancellationToken cancellationToken = default);
    }
}
