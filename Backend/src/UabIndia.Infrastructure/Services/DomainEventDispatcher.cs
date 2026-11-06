using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services
{
    public class DomainEventDispatcher : IDomainEventDispatcher
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DomainEventDispatcher> _logger;
        private static readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

        public DomainEventDispatcher(IServiceProvider serviceProvider, ILogger<DomainEventDispatcher> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public async Task DispatchAsync(string eventType, string payloadJson, Guid tenantId, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(eventType)) return;

            _logger.LogInformation("Dispatching domain event {EventType} for tenant {TenantId}", eventType, tenantId);

            try
            {
                switch (eventType)
                {
                    case "SalesOrderConfirmed":
                    {
                        var evt = JsonSerializer.Deserialize<SalesOrderConfirmedEvent>(payloadJson, _jsonOptions);
                        if (evt != null)
                        {
                            var handler = _serviceProvider.GetService<IDomainEventHandler<SalesOrderConfirmedEvent>>();
                            if (handler != null)
                            {
                                await handler.HandleAsync(evt, cancellationToken);
                            }
                        }
                        break;
                    }
                    case "StockDepleted":
                    {
                        var evt = JsonSerializer.Deserialize<StockDepletedEvent>(payloadJson, _jsonOptions);
                        if (evt != null)
                        {
                            var handler = _serviceProvider.GetService<IDomainEventHandler<StockDepletedEvent>>();
                            if (handler != null)
                            {
                                await handler.HandleAsync(evt, cancellationToken);
                            }
                        }
                        break;
                    }
                    case "PaymentReceived":
                    {
                        var evt = JsonSerializer.Deserialize<PaymentReceivedEvent>(payloadJson, _jsonOptions);
                        if (evt != null)
                        {
                            var handler = _serviceProvider.GetService<IDomainEventHandler<PaymentReceivedEvent>>();
                            if (handler != null)
                            {
                                await handler.HandleAsync(evt, cancellationToken);
                            }
                        }
                        break;
                    }
                    default:
                        _logger.LogDebug("No explicit domain event handler bound for {EventType}. Processed as generic event.", eventType);
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to dispatch domain event {EventType} with payload: {Payload}", eventType, payloadJson);
                throw;
            }
        }
    }
}
