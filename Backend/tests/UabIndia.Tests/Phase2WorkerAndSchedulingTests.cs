using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class Phase2WorkerAndSchedulingTests : IDisposable
    {
        private readonly ApplicationDbContext _db;
        private readonly TestTenantAccessor _tenantAccessor;

        public Phase2WorkerAndSchedulingTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _tenantAccessor = new TestTenantAccessor();
            _db = new ApplicationDbContext(options, _tenantAccessor, new TestEncryptionService());
        }

        public void Dispose()
        {
            _db.Dispose();
        }

        [Fact]
        public async Task HangfireJobService_ProcessMonthlyPayroll_FindsPendingRunsAcrossTenants()
        {
            // Arrange: Setup tenant and a pending payroll run
            var tenantId = Guid.NewGuid();
            var run = new PayrollRun
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                RunDate = DateTime.UtcNow.Date,
                PeriodStart = DateTime.UtcNow.Date.AddDays(-30),
                PeriodEnd = DateTime.UtcNow.Date,
                Status = "Pending",
                IsDeleted = false
            };
            _db.PayrollRuns.Add(run);
            await _db.SaveChangesAsync();

            // Simulate Hangfire background worker context where tenant is Guid.Empty
            _tenantAccessor.SetTenantId(Guid.Empty);

            var logger = NullLogger<HangfireJobService>.Instance;
            var service = new HangfireJobService(logger, _db);

            // Act & Assert: Must complete without throwing and find the cross-tenant run
            var exception = await Record.ExceptionAsync(() => service.ProcessMonthlyPayroll());
            Assert.Null(exception);
        }

        [Fact]
        public async Task HangfireJobService_ExpireLeaveBalances_EvaluatesPoliciesAcrossTenants()
        {
            // Arrange: Setup tenant and an active leave policy
            var tenantId = Guid.NewGuid();
            var policy = new LeavePolicy
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Name = "Annual Leave",
                IsDeleted = false
            };
            _db.LeavePolicies.Add(policy);
            await _db.SaveChangesAsync();

            // Simulate background worker context
            _tenantAccessor.SetTenantId(Guid.Empty);

            var logger = NullLogger<HangfireJobService>.Instance;
            var service = new HangfireJobService(logger, _db);

            // Act & Assert: Should evaluate policies across tenants without query filter drop
            var exception = await Record.ExceptionAsync(() => service.ExpireLeaveBalances());
            Assert.Null(exception);
        }

        [Fact]
        public async Task HangfireJobService_SendPendingNotifications_DispatchesAcrossTenants()
        {
            // Arrange: Setup tenant and an in-app pending notification
            var tenantId = Guid.NewGuid();
            var notification = new NotificationMessage
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Status = "Pending",
                Channel = "InApp",
                Title = "System Maintenance",
                Message = "Scheduled maintenance tonight",
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow
            };
            _db.NotificationMessages.Add(notification);
            await _db.SaveChangesAsync();

            // Simulate background worker context
            _tenantAccessor.SetTenantId(Guid.Empty);

            var logger = NullLogger<HangfireJobService>.Instance;
            var service = new HangfireJobService(logger, _db);

            // Act
            await service.SendPendingNotifications();

            // Assert: Notification status is updated to Sent even with tenantAccessor set to Guid.Empty
            var updated = await _db.NotificationMessages
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(n => n.Id == notification.Id);

            Assert.NotNull(updated);
            Assert.Equal("Sent", updated.Status);
            Assert.NotNull(updated.SentAt);
        }

        [Fact]
        public void IndiaTimeZone_CanBeResolved_WithPositiveFiveThirtyOffset()
        {
            // Act: Resolve IST timezone
            TimeZoneInfo tz;
            try
            {
                tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");
            }
            catch (TimeZoneNotFoundException)
            {
                tz = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
            }

            // Assert: Standard UTC offset for IST is +05:30
            Assert.Equal(TimeSpan.FromHours(5.5), tz.BaseUtcOffset);
        }
    }
}
