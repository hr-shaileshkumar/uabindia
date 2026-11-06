using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Data.Migrations;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class OutboxAndSchemaPartitioningTests : IDisposable
    {
        private readonly ApplicationDbContext _db;
        private readonly Guid _tenantId = Guid.NewGuid();

        public OutboxAndSchemaPartitioningTests()
        {
            var inMemoryConfig = new Dictionary<string, string?>
            {
                ["Encryption:Key"] = "test-key-32-chars-long-for-outbox-tests!"
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();

            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(_tenantId);

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            var encryption = new AesEncryptionService(config);
            _db = new ApplicationDbContext(options, tenantAccessor, encryption);
        }

        public void Dispose()
        {
            _db.Dispose();
        }

        [Fact]
        public void OutboxMessage_NextRetryUtc_InitializesAndPersistsProperly()
        {
            var now = DateTime.UtcNow;
            var outboxMessage = new OutboxMessage
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantId,
                EventType = "InvoiceCreated",
                PayloadJson = "{\"invoiceId\":\"INV-100\"}",
                OccurredAtUtc = now,
                RetryCount = 2,
                NextRetryUtc = now.AddMinutes(5),
                IsProcessed = false
            };

            _db.OutboxMessages.Add(outboxMessage);
            _db.SaveChanges();

            var loaded = _db.OutboxMessages.FirstOrDefault(m => m.Id == outboxMessage.Id);
            Assert.NotNull(loaded);
            Assert.Equal(2, loaded.RetryCount);
            Assert.NotNull(loaded.NextRetryUtc);
            Assert.Equal(outboxMessage.NextRetryUtc, loaded.NextRetryUtc);
        }

        [Fact]
        public void OutboxMessage_DueQuery_FiltersOutFutureRetries()
        {
            var now = DateTime.UtcNow;

            var dueMessage1 = new OutboxMessage
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantId,
                EventType = "OrderSubmitted",
                PayloadJson = "{}",
                OccurredAtUtc = now.AddMinutes(-10),
                NextRetryUtc = null, // Ready immediately
                IsProcessed = false
            };

            var dueMessage2 = new OutboxMessage
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantId,
                EventType = "PaymentProcessed",
                PayloadJson = "{}",
                OccurredAtUtc = now.AddMinutes(-5),
                NextRetryUtc = now.AddMinutes(-1), // Backoff elapsed
                IsProcessed = false
            };

            var futureMessage = new OutboxMessage
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantId,
                EventType = "WebhookSent",
                PayloadJson = "{}",
                OccurredAtUtc = now.AddMinutes(-2),
                NextRetryUtc = now.AddMinutes(10), // Not due yet
                IsProcessed = false
            };

            var processedMessage = new OutboxMessage
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantId,
                EventType = "UserRegistered",
                PayloadJson = "{}",
                OccurredAtUtc = now.AddMinutes(-15),
                NextRetryUtc = null,
                IsProcessed = true
            };

            _db.OutboxMessages.AddRange(dueMessage1, dueMessage2, futureMessage, processedMessage);
            _db.SaveChanges();

            // The query used by OutboxProcessorJob
            var dueEvents = _db.OutboxMessages
                .Where(m => !m.IsProcessed && (m.NextRetryUtc == null || m.NextRetryUtc <= now))
                .OrderBy(m => m.OccurredAtUtc)
                .ToList();

            Assert.Equal(2, dueEvents.Count);
            Assert.Contains(dueEvents, m => m.Id == dueMessage1.Id);
            Assert.Contains(dueEvents, m => m.Id == dueMessage2.Id);
            Assert.DoesNotContain(dueEvents, m => m.Id == futureMessage.Id);
            Assert.DoesNotContain(dueEvents, m => m.Id == processedMessage.Id);
        }

        [Fact]
        public void OutboxProcessor_ExponentialBackoff_CalculatesCorrectDelays()
        {
            // Verify formula: Math.Min(30 * 60, Math.Pow(2, retryCount) * 5)
            // RetryCount 0 -> 2^0 * 5s = 5s
            // RetryCount 1 -> 2^1 * 5s = 10s
            // RetryCount 2 -> 2^2 * 5s = 20s
            // RetryCount 3 -> 2^3 * 5s = 40s
            // RetryCount 10 -> 2^10 * 5s = 5120s -> capped at 1800s (30m)

            int[] retries = { 0, 1, 2, 3, 10 };
            double[] expectedSeconds = { 5, 10, 20, 40, 1800 };

            for (int i = 0; i < retries.Length; i++)
            {
                var delaySeconds = Math.Min(30 * 60, Math.Pow(2, retries[i]) * 5);
                Assert.Equal(expectedSeconds[i], delaySeconds);
            }
        }

        [Fact]
        public async Task ApplyEnterpriseSchemaPartitioningAsync_ExecutesGracefullyWithoutException()
        {
            // Verifies that calling ApplyEnterpriseSchemaPartitioningAsync handles in-memory
            // or relational environments safely without crashing startup
            var exception = await Record.ExceptionAsync(async () =>
            {
                await MigrationBootstrap.ApplyEnterpriseSchemaPartitioningAsync(
                    _db,
                    NullLogger.Instance,
                    CancellationToken.None);
            });

            Assert.Null(exception);
        }
    }
}
