using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class OperationalLifecycleServiceTests
    {
        private static (
            ApplicationDbContext Db,
            TimesheetService Timesheets,
            AccountingPeriodService Periods,
            PurchaseRequestService Requests,
            TestTenantAccessor Tenant) CreateSut()
        {
            var tenant = new TestTenantAccessor();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            var db = new ApplicationDbContext(options, tenant, new TestEncryptionService());
            return (
                db,
                new TimesheetService(db, tenant, new NoOpNotificationEmitter()),
                new AccountingPeriodService(db, tenant),
                new PurchaseRequestService(db),
                tenant);
        }

        [Fact]
        public async Task SubmitTimesheet_RequiresDraft()
        {
            var (db, timesheets, _, _, tenant) = CreateSut();
            await using var _ = db;
            var draft = new TimesheetEntry
            {
                TenantId = tenant.GetTenantId(),
                EmployeeId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                WorkDate = DateTime.UtcNow.Date,
                Hours = 8,
                Status = "Draft",
                CreatedAt = DateTime.UtcNow
            };
            db.TimesheetEntries.Add(draft);
            await db.SaveChangesAsync();

            var submitted = await timesheets.SubmitAsync(draft.Id);
            Assert.Equal("Submitted", submitted.Status);
            Assert.NotNull(submitted.SubmittedAt);

            await Assert.ThrowsAsync<InvalidOperationException>(() => timesheets.SubmitAsync(draft.Id));
        }

        [Fact]
        public async Task ApproveTimesheet_RequiresSubmitted()
        {
            var (db, timesheets, _, _, tenant) = CreateSut();
            await using var _ = db;
            var entry = new TimesheetEntry
            {
                TenantId = tenant.GetTenantId(),
                EmployeeId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                WorkDate = DateTime.UtcNow.Date,
                Hours = 4.5m,
                Status = "Submitted",
                SubmittedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            db.TimesheetEntries.Add(entry);
            await db.SaveChangesAsync();

            var approved = await timesheets.ApproveAsync(entry.Id, "manager");
            Assert.Equal("Approved", approved.Status);
            Assert.Equal("manager", approved.ApprovedBy);
        }

        [Fact]
        public async Task ClosePeriod_CreatesClosedRow()
        {
            var (db, _, periods, _, _) = CreateSut();
            await using var _ = db;
            var closer = Guid.NewGuid();

            var closed = await periods.CloseAsync(2026, 8, closer, "month end");
            Assert.Equal("Closed", closed.Status);
            Assert.Equal(closer, closed.ClosedBy);
            Assert.Equal("month end", closed.Notes);

            var reopened = await periods.ReopenAsync(2026, 8);
            Assert.Equal("Open", reopened.Status);
            Assert.Null(reopened.ClosedAt);
        }

        [Fact]
        public async Task ClosePeriod_RejectsInvalidMonth()
        {
            var (db, _, periods, _, _) = CreateSut();
            await using var _ = db;
            await Assert.ThrowsAsync<InvalidOperationException>(() => periods.CloseAsync(2026, 13, null, null));
        }

        [Fact]
        public async Task ApprovePurchaseRequest_ThenMatchShowsVariance()
        {
            var (db, _, _, requests, tenant) = CreateSut();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            var pr = new PurchaseRequest
            {
                TenantId = tenantId,
                RequestNumber = "PR-00001",
                ItemDescription = "Laptops",
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };
            db.PurchaseRequests.Add(pr);
            var vendor = new Vendor
            {
                TenantId = tenantId,
                VendorCode = "V-1",
                VendorName = "Hardware",
                CreatedAt = DateTime.UtcNow
            };
            db.Vendors.Add(vendor);
            await db.SaveChangesAsync();

            var approved = await requests.ApproveAsync(pr.Id, Guid.NewGuid());
            Assert.Equal("Approved", approved.Status);
            Assert.NotNull(approved.ApprovedAt);

            var po = new PurchaseOrder
            {
                TenantId = tenantId,
                PONumber = "PO-00001",
                PODate = DateTime.UtcNow.Date,
                VendorId = vendor.Id,
                TotalAmount = 100,
                Status = "Draft",
                CreatedAt = DateTime.UtcNow
            };
            po.Items.Add(new PurchaseOrderItem
            {
                TenantId = tenantId,
                Quantity = 10,
                UnitPrice = 10,
                TotalAmount = 100,
                CreatedAt = DateTime.UtcNow
            });
            db.PurchaseOrders.Add(po);
            await db.SaveChangesAsync();

            var match = await requests.MatchPurchaseOrderAsync(po.Id);
            Assert.Equal("Variance", match.Status);
            Assert.Equal(10m, match.OrderedQuantity);
            Assert.Equal(0m, match.ReceivedQuantity);
        }
    }
}
