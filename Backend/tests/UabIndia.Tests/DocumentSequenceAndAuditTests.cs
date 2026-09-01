using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class DocumentSequenceAndAuditTests : IDisposable
    {
        private readonly ApplicationDbContext _db;
        private readonly TestTenantAccessor _tenantAccessor;
        private readonly Guid _tenantId = Guid.NewGuid();

        public DocumentSequenceAndAuditTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: $"DocSeqAuditTests_{Guid.NewGuid()}")
                .Options;

            _tenantAccessor = new TestTenantAccessor();
            _tenantAccessor.SetTenantId(_tenantId);
            var encryptionService = new TestEncryptionService();
            _db = new ApplicationDbContext(options, _tenantAccessor, encryptionService);
        }

        [Fact]
        public async Task DocumentSequenceService_GeneratesSequentialNumbersPerDocumentType()
        {
            var service = new DocumentSequenceService(_db, NullLogger<DocumentSequenceService>.Instance);

            var inv1 = await service.GetNextSequenceNumberAsync(_tenantId, "SalesInvoice");
            var inv2 = await service.GetNextSequenceNumberAsync(_tenantId, "SalesInvoice");
            var po1 = await service.GetNextSequenceNumberAsync(_tenantId, "PurchaseOrder");

            var year = DateTime.UtcNow.Year;
            Assert.Equal($"INV-{year}-00001", inv1);
            Assert.Equal($"INV-{year}-00002", inv2);
            Assert.Equal($"PO-{year}-00001", po1);
        }

        [Fact]
        public async Task DomainEventDispatcher_RoutesSalesOrderConfirmedEventToHandler()
        {
            var services = new ServiceCollection();
            services.AddScoped(_ => _db);
            services.AddScoped<IDomainEventHandler<SalesOrderConfirmedEvent>, SalesOrderConfirmedHandler>();
            services.AddScoped<ILogger<SalesOrderConfirmedHandler>>(_ => NullLogger<SalesOrderConfirmedHandler>.Instance);
            var serviceProvider = services.BuildServiceProvider();

            var dispatcher = new DomainEventDispatcher(serviceProvider, NullLogger<DomainEventDispatcher>.Instance);

            var payload = JsonSerializer.Serialize(new SalesOrderConfirmedEvent(
                Guid.NewGuid(),
                _tenantId,
                DateTime.UtcNow,
                Guid.NewGuid(),
                "SO-2026-00101",
                45000m,
                "Acme Global Industries"
            ));

            await dispatcher.DispatchAsync("SalesOrderConfirmed", payload, _tenantId);

            var notification = await _db.NotificationMessages.FirstOrDefaultAsync(n => n.TenantId == _tenantId);
            Assert.NotNull(notification);
            Assert.Contains("SO-2026-00101", notification.Title);
            Assert.Contains("45,000", notification.Message);
        }

        [Fact]
        public async Task ApplicationDbContext_CapturesFieldLevelAuditLogsOnEntityModifications()
        {
            var item = new Item
            {
                TenantId = _tenantId,
                ItemCode = "AUDIT-ITM-01",
                ItemName = "Original Component Name",
                SellingPrice = 100m,
                CurrentStock = 50m
            };

            _db.Items.Add(item);
            await _db.SaveChangesAsync();

            // Clear created audit log check
            var addAudit = await _db.AuditLogs.FirstOrDefaultAsync(a => a.EntityId == item.Id && a.Action == "Added");
            Assert.NotNull(addAudit);
            Assert.NotNull(addAudit.NewValue);
            Assert.Contains("AUDIT-ITM-01", addAudit.NewValue);

            // Now modify properties
            item.ItemName = "Updated Premium Component";
            item.SellingPrice = 150m;
            await _db.SaveChangesAsync();

            var modAudit = await _db.AuditLogs.FirstOrDefaultAsync(a => a.EntityId == item.Id && a.Action == "Modified");
            Assert.NotNull(modAudit);
            Assert.NotNull(modAudit.OldValue);
            Assert.NotNull(modAudit.NewValue);
            Assert.Contains("Original Component Name", modAudit.OldValue);
            Assert.Contains("Updated Premium Component", modAudit.NewValue);
        }

        public void Dispose() => _db.Dispose();
    }
}
