using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Services
{
    /// <summary>
    /// Background service that processes transactional outbox events asynchronously,
    /// ensuring event-driven workflow guarantees across ERP modules.
    /// </summary>
    public class OutboxProcessorJob : BackgroundService
    {
        private const int MaxRetries = 5;
        private const int BatchSize = 50;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<OutboxProcessorJob> _logger;

        public OutboxProcessorJob(IServiceProvider serviceProvider, ILogger<OutboxProcessorJob> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("OutboxProcessorJob background service started.");

            // Allow DatabaseInitializationService a moment to ensure database tables on startup
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessOutboxBatchAsync(stoppingToken);
                }
                catch (Microsoft.Data.SqlClient.SqlException sqlEx) when (sqlEx.Number == 208)
                {
                    _logger.LogDebug("OutboxMessages table not yet available; will retry in next cycle.");
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing outbox events batch.");
                }

                // Poll every 3 seconds
                await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);
            }

            _logger.LogInformation("OutboxProcessorJob background service stopped.");
        }

        private async Task ProcessOutboxBatchAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var dispatcher = scope.ServiceProvider.GetService<IDomainEventDispatcher>();

            var now = DateTime.UtcNow;
            var pendingEvents = await db.OutboxMessages
                .Where(m => !m.IsProcessed && m.RetryCount < MaxRetries)
                .OrderBy(m => m.OccurredAtUtc)
                .Take(BatchSize)
                .ToListAsync(cancellationToken);

            if (!pendingEvents.Any()) return;

            foreach (var evt in pendingEvents)
            {
                try
                {
                    _logger.LogInformation("Processing domain outbox event {EventType} (ID: {Id})", evt.EventType, evt.Id);

                    if (dispatcher != null && !string.IsNullOrWhiteSpace(evt.PayloadJson))
                    {
                        await dispatcher.DispatchAsync(evt.EventType, evt.PayloadJson, evt.TenantId, cancellationToken);
                    }

                    // Mark successfully processed
                    evt.IsProcessed = true;
                    evt.ProcessedAtUtc = DateTime.UtcNow;
                    evt.Error = null;
                }
                catch (Exception ex)
                {
                    evt.RetryCount++;
                    if (evt.RetryCount >= MaxRetries)
                    {
                        evt.Error = $"[DEAD_LETTER_EXHAUSTED] Max {MaxRetries} retries reached. Reason: {ex.Message}";
                        _logger.LogCritical(ex, "Outbox event {EventType} (ID: {Id}) moved to dead-letter state after {Retries} attempts.", evt.EventType, evt.Id, evt.RetryCount);
                    }
                    else
                    {
                        evt.Error = $"[Attempt {evt.RetryCount}/{MaxRetries}] {ex.Message}";
                        _logger.LogWarning(ex, "Failed attempt {Attempt} for outbox event {EventType} (ID: {Id}). Will retry.", evt.RetryCount, evt.EventType, evt.Id);
                    }
                }
            }

            await db.SaveChangesAsync(cancellationToken);
        }
    }
}

