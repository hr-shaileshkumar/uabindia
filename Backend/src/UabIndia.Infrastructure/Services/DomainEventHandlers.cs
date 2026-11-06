using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public record SalesOrderConfirmedEvent(
        Guid EventId,
        Guid TenantId,
        DateTime OccurredAtUtc,
        Guid OrderId,
        string OrderNumber,
        decimal TotalAmount,
        string CustomerName
    ) : IDomainEvent
    {
        public string EventType => "SalesOrderConfirmed";
    }

    public record StockDepletedEvent(
        Guid EventId,
        Guid TenantId,
        DateTime OccurredAtUtc,
        Guid ItemId,
        string ItemCode,
        string ItemName,
        decimal CurrentStock,
        decimal ReorderLevel
    ) : IDomainEvent
    {
        public string EventType => "StockDepleted";
    }

    public record PaymentReceivedEvent(
        Guid EventId,
        Guid TenantId,
        DateTime OccurredAtUtc,
        Guid PaymentId,
        string PaymentReference,
        decimal Amount,
        string PayerName
    ) : IDomainEvent
    {
        public string EventType => "PaymentReceived";
    }

    public class SalesOrderConfirmedHandler : IDomainEventHandler<SalesOrderConfirmedEvent>
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<SalesOrderConfirmedHandler> _logger;

        public SalesOrderConfirmedHandler(ApplicationDbContext db, ILogger<SalesOrderConfirmedHandler> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task HandleAsync(SalesOrderConfirmedEvent domainEvent, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Handling SalesOrderConfirmedEvent for Order {OrderNumber} (Amount: {Amount:C2})",
                domainEvent.OrderNumber, domainEvent.TotalAmount);

            // Record notification to the notification table for operational staff
            var notification = new NotificationMessage
            {
                Id = Guid.NewGuid(),
                TenantId = domainEvent.TenantId,
                Title = $"Sales Order Confirmed: {domainEvent.OrderNumber}",
                Message = $"Sales Order {domainEvent.OrderNumber} for {domainEvent.CustomerName} totaling {domainEvent.TotalAmount:C2} has been confirmed.",
                Type = "Sales",
                CreatedAt = DateTime.UtcNow
            };

            _db.NotificationMessages.Add(notification);
            await _db.SaveChangesAsync(cancellationToken);
        }
    }

    public class StockDepletedHandler : IDomainEventHandler<StockDepletedEvent>
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<StockDepletedHandler> _logger;

        public StockDepletedHandler(ApplicationDbContext db, ILogger<StockDepletedHandler> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task HandleAsync(StockDepletedEvent domainEvent, CancellationToken cancellationToken = default)
        {
            _logger.LogWarning("Low stock alert triggered for item {ItemCode} ({ItemName}). Current stock: {CurrentStock}, Reorder: {ReorderLevel}",
                domainEvent.ItemCode, domainEvent.ItemName, domainEvent.CurrentStock, domainEvent.ReorderLevel);

            var notification = new NotificationMessage
            {
                Id = Guid.NewGuid(),
                TenantId = domainEvent.TenantId,
                Title = $"Low Stock Alert: {domainEvent.ItemCode}",
                Message = $"Item '{domainEvent.ItemName}' ({domainEvent.ItemCode}) is at {domainEvent.CurrentStock} units (Reorder threshold: {domainEvent.ReorderLevel}).",
                Type = "Inventory",
                CreatedAt = DateTime.UtcNow
            };

            _db.NotificationMessages.Add(notification);
            await _db.SaveChangesAsync(cancellationToken);
        }
    }

    public class PaymentReceivedHandler : IDomainEventHandler<PaymentReceivedEvent>
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<PaymentReceivedHandler> _logger;

        public PaymentReceivedHandler(ApplicationDbContext db, ILogger<PaymentReceivedHandler> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task HandleAsync(PaymentReceivedEvent domainEvent, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Payment {Reference} received for {Amount:C2} from {Payer}",
                domainEvent.PaymentReference, domainEvent.Amount, domainEvent.PayerName);

            var notification = new NotificationMessage
            {
                Id = Guid.NewGuid(),
                TenantId = domainEvent.TenantId,
                Title = $"Payment Inward: {domainEvent.PaymentReference}",
                Message = $"Inward payment of {domainEvent.Amount:C2} received from {domainEvent.PayerName}.",
                Type = "Finance",
                CreatedAt = DateTime.UtcNow
            };

            _db.NotificationMessages.Add(notification);
            await _db.SaveChangesAsync(cancellationToken);
        }
    }
}
