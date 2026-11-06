using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class CommercialOrderAndApprovalServiceTests
    {
        private static (
            ApplicationDbContext Db,
            CommercialOrderService Orders,
            ApprovalRequestService Approvals,
            TestTenantAccessor Tenant) CreateSut()
        {
            var tenant = new TestTenantAccessor();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            var db = new ApplicationDbContext(options, tenant, new TestEncryptionService());
            var numbers = new DocumentNumberService(db, tenant);
            return (
                db,
                new CommercialOrderService(db, tenant, numbers),
                new ApprovalRequestService(db, tenant),
                tenant);
        }

        [Fact]
        public async Task CreateSalesOrder_AppliesLineTaxAndPendingQty()
        {
            var (db, orders, _, tenant) = CreateSut();
            await using var _ = db;
            var customer = new Customer
            {
                TenantId = tenant.GetTenantId(),
                CustomerCode = "C-1",
                CustomerName = "Acme",
                CreatedAt = DateTime.UtcNow
            };
            db.Customers.Add(customer);
            await db.SaveChangesAsync();

            var itemId = Guid.NewGuid();
            var order = await orders.CreateSalesOrderAsync(new CreateSalesOrderCommand(
                null,
                DateTime.UtcNow.Date,
                customer.Id,
                null,
                0,
                0,
                "Draft",
                null,
                new[] { new DocumentLineCommand(itemId, "Widget", 2, 100, 18) }));

            Assert.StartsWith("SO-", order.SONumber);
            Assert.Equal(200m, order.SubTotal);
            Assert.Equal(36m, order.TaxAmount);
            Assert.Equal(236m, order.TotalAmount);
            Assert.Single(order.Items);
            Assert.Equal(2m, order.Items.Single().PendingQuantity);
        }

        [Fact]
        public async Task CreatePurchaseOrder_SetsPendingQuantity()
        {
            var (db, orders, _, tenant) = CreateSut();
            await using var _ = db;
            var vendor = new Vendor
            {
                TenantId = tenant.GetTenantId(),
                VendorCode = "V-1",
                VendorName = "Supplier",
                CreatedAt = DateTime.UtcNow
            };
            db.Vendors.Add(vendor);
            await db.SaveChangesAsync();

            var order = await orders.CreatePurchaseOrderAsync(new CreatePurchaseOrderCommand(
                null,
                DateTime.UtcNow.Date,
                vendor.Id,
                null,
                0,
                0,
                "Draft",
                null,
                new[] { new DocumentLineCommand(Guid.NewGuid(), "Bolt", 10, 5, 18) }));

            Assert.StartsWith("PO-", order.PONumber);
            Assert.Equal(50m, order.SubTotal);
            Assert.Equal(9m, order.TaxAmount);
            Assert.Equal(10m, order.Items.Single().PendingQuantity);
        }

        [Fact]
        public async Task CreateQuotation_RequiresCustomer()
        {
            var (db, orders, _, _) = CreateSut();
            await using var _ = db;
            await Assert.ThrowsAsync<InvalidOperationException>(() => orders.CreateSalesQuotationAsync(
                new CreateSalesQuotationCommand(
                    null,
                    default,
                    default,
                    Guid.NewGuid(),
                    0, 0, 0, 0, 0,
                    null, null, null,
                    Array.Empty<DocumentLineCommand>())));
        }

        [Fact]
        public async Task ApprovalCreateAndApprove_RequiresActiveWorkflow()
        {
            var (db, _, approvals, tenant) = CreateSut();
            await using var _ = db;
            var actor = Guid.NewGuid();
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                approvals.CreateAsync("leave_approval", "LeaveRequest", Guid.NewGuid(), null, actor));

            db.WorkflowDefinitions.Add(new WorkflowDefinition
            {
                TenantId = tenant.GetTenantId(),
                ModuleKey = "leave_approval",
                Name = "Leave",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();

            var entityId = Guid.NewGuid();
            await approvals.CreateAsync("leave_approval", "LeaveRequest", entityId, "please", actor);
            var pending = await db.ApprovalRequests.SingleAsync();
            Assert.Equal("Pending", pending.Status);

            await approvals.ApproveAsync(pending.Id, actor, "ok");
            var stored = await db.ApprovalRequests.SingleAsync();
            Assert.Equal("Approved", stored.Status);
            Assert.Equal(actor, stored.ApprovedBy);
            Assert.Equal("ok", stored.Comments);
        }
    }
}
