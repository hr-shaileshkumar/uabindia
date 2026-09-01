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
    public class CommercialDocumentServiceTests
    {
        private static (
            ApplicationDbContext Db,
            SalesInvoiceService Sales,
            PaymentService Payments,
            TestTenantAccessor Tenant) CreateSut()
        {
            var tenant = new TestTenantAccessor();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            var db = new ApplicationDbContext(options, tenant, new TestEncryptionService());
            var numbers = new DocumentNumberService(db, tenant);
            var ledger = new LedgerPostingService(db, tenant, numbers);
            var stock = new InventoryStockService(db, tenant, numbers);
            return (db, new SalesInvoiceService(db, tenant, numbers, ledger, stock), new PaymentService(db, tenant, numbers, ledger), tenant);
        }

        [Fact]
        public async Task CreateSalesInvoice_PostsGstSplitAndAr()
        {
            var (db, sales, _, tenant) = CreateSut();
            await using var _ = db;
            var customer = new Customer
            {
                TenantId = tenant.GetTenantId(),
                CustomerCode = "C-1",
                CustomerName = "Acme",
                State = "KA",
                CreatedAt = DateTime.UtcNow
            };
            db.Customers.Add(customer);
            await db.SaveChangesAsync();

            var invoice = await sales.CreateAsync(new CreateSalesInvoiceCommand(
                customer.Id,
                null,
                DateTime.UtcNow.Date,
                null,
                null,
                10000m,
                0,
                0,
                0,
                0,
                11800m,
                0,
                null,
                null,
                "Test invoice",
                "KA",
                18m,
                Array.Empty<DocumentLineCommand>()));

            Assert.Equal(10000m, invoice.SubTotal);
            Assert.Equal(1800m, invoice.TaxAmount);
            Assert.Equal(11800m, invoice.TotalAmount);
            Assert.False(invoice.IsInterState);
            Assert.NotNull(invoice.JournalEntryId);
            var journal = await db.JournalEntries.Include(j => j.Lines).SingleAsync(j => j.Id == invoice.JournalEntryId);
            Assert.Equal("Posted", journal.Status);
            Assert.Equal(11800m, journal.TotalDebit);
        }

        [Fact]
        public async Task RecordPayment_SettlesSalesInvoiceBalance()
        {
            var (db, sales, payments, tenant) = CreateSut();
            await using var _ = db;
            var customer = new Customer
            {
                TenantId = tenant.GetTenantId(),
                CustomerCode = "C-2",
                CustomerName = "Beta",
                CreatedAt = DateTime.UtcNow
            };
            db.Customers.Add(customer);
            await db.SaveChangesAsync();

            var invoice = await sales.CreateAsync(new CreateSalesInvoiceCommand(
                customer.Id,
                null,
                DateTime.UtcNow.Date,
                null,
                null,
                1000m,
                0,
                0,
                0,
                0,
                1180m,
                0,
                null,
                null,
                null,
                null,
                18m,
                Array.Empty<DocumentLineCommand>()));

            var payment = await payments.RecordAsync(new RecordPaymentCommand(
                DateTime.UtcNow.Date,
                "Received",
                "Customer",
                customer.Id,
                customer.CustomerName,
                invoice.TotalAmount,
                "UPI",
                null,
                null,
                null,
                "SalesInvoice",
                invoice.Id,
                invoice.InvoiceNumber,
                null,
                null));

            var updated = await db.SalesInvoices.SingleAsync(i => i.Id == invoice.Id);
            Assert.Equal("Paid", updated.Status);
            Assert.Equal(0m, updated.BalanceAmount);
            Assert.NotNull(payment.JournalEntryId);
        }

        [Fact]
        public async Task CreateSalesInvoice_WithStockableLine_IssuesStockAndCogs()
        {
            var (db, sales, _, tenant) = CreateSut();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            var customer = new Customer
            {
                TenantId = tenantId,
                CustomerCode = "C-3",
                CustomerName = "Gamma",
                State = "KA",
                CreatedAt = DateTime.UtcNow
            };
            var item = new Item
            {
                TenantId = tenantId,
                ItemCode = "SKU-10",
                ItemName = "Hose",
                ItemType = "Stockable",
                CurrentStock = 40,
                PurchasePrice = 500,
                SellingPrice = 900,
                CreatedAt = DateTime.UtcNow
            };
            db.Customers.Add(customer);
            db.Items.Add(item);
            await db.SaveChangesAsync();

            var invoice = await sales.CreateAsync(new CreateSalesInvoiceCommand(
                customer.Id,
                null,
                DateTime.UtcNow.Date,
                null,
                null,
                9000m,
                1620m,
                0,
                0,
                0,
                10620m,
                0,
                null,
                null,
                null,
                "KA",
                18m,
                new[] { new DocumentLineCommand(item.Id, "Hose", 10, 900, 18m) }));

            var storedItem = await db.Items.SingleAsync(i => i.Id == item.Id);
            Assert.Equal(30m, storedItem.CurrentStock);
            var movement = await db.StockMovements.SingleAsync(m => m.ReferenceId == invoice.Id);
            Assert.Equal("Out", movement.MovementType);
            Assert.Equal(10m, movement.Quantity);
            Assert.Equal("SalesInvoice", movement.ReferenceType);
            var cogs = await db.JournalEntries.SingleAsync(j => j.Description == $"COGS {invoice.InvoiceNumber}");
            Assert.Equal(5000m, cogs.TotalDebit);
            Assert.Equal("Posted", cogs.Status);
        }

        [Fact]
        public async Task CreateSalesInvoice_ServiceLine_DoesNotMoveStock()
        {
            var (db, sales, _, tenant) = CreateSut();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            var customer = new Customer
            {
                TenantId = tenantId,
                CustomerCode = "C-4",
                CustomerName = "Delta",
                CreatedAt = DateTime.UtcNow
            };
            var item = new Item
            {
                TenantId = tenantId,
                ItemCode = "SVC-1",
                ItemName = "Install",
                ItemType = "Service",
                CurrentStock = 0,
                PurchasePrice = 0,
                SellingPrice = 2000,
                CreatedAt = DateTime.UtcNow
            };
            db.Customers.Add(customer);
            db.Items.Add(item);
            await db.SaveChangesAsync();

            var invoice = await sales.CreateAsync(new CreateSalesInvoiceCommand(
                customer.Id,
                null,
                DateTime.UtcNow.Date,
                null,
                null,
                2000m,
                360m,
                0,
                0,
                0,
                2360m,
                0,
                null,
                null,
                null,
                null,
                18m,
                new[] { new DocumentLineCommand(item.Id, "Install", 1, 2000, 18m) }));

            var storedItem = await db.Items.SingleAsync(i => i.Id == item.Id);
            Assert.Equal(0m, storedItem.CurrentStock);
            Assert.False(await db.StockMovements.AnyAsync(m => m.ReferenceId == invoice.Id));
            Assert.False(await db.JournalEntries.AnyAsync(j => j.Description == $"COGS {invoice.InvoiceNumber}"));
        }

        [Fact]
        public async Task CreateSalesInvoice_ThrowsWhenStockInsufficient()
        {
            var (db, sales, _, tenant) = CreateSut();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            var customer = new Customer
            {
                TenantId = tenantId,
                CustomerCode = "C-5",
                CustomerName = "Epsilon",
                CreatedAt = DateTime.UtcNow
            };
            var item = new Item
            {
                TenantId = tenantId,
                ItemCode = "SKU-11",
                ItemName = "Clamp",
                CurrentStock = 2,
                PurchasePrice = 45,
                CreatedAt = DateTime.UtcNow
            };
            db.Customers.Add(customer);
            db.Items.Add(item);
            await db.SaveChangesAsync();

            await Assert.ThrowsAsync<InvalidOperationException>(() => sales.CreateAsync(new CreateSalesInvoiceCommand(
                customer.Id,
                null,
                DateTime.UtcNow.Date,
                null,
                null,
                3600m,
                648m,
                0,
                0,
                0,
                4248m,
                0,
                null,
                null,
                null,
                null,
                18m,
                new[] { new DocumentLineCommand(item.Id, "Clamp", 80, 45, 18m) })));

            Assert.Equal(2m, (await db.Items.SingleAsync(i => i.Id == item.Id)).CurrentStock);
            Assert.DoesNotContain(
                db.ChangeTracker.Entries<SalesInvoice>(),
                e => e.State == EntityState.Unchanged);
        }

        [Fact]
        public async Task ConvertOrder_LocksHeaderTotalAndLinePrices()
        {
            var (db, sales, _, tenant) = CreateSut();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            var customer = new Customer
            {
                TenantId = tenantId,
                CustomerCode = "C-LOCK",
                CustomerName = "Lock Co",
                CreatedAt = DateTime.UtcNow
            };
            db.Customers.Add(customer);
            await db.SaveChangesAsync();

            var order = new SalesOrder
            {
                TenantId = tenantId,
                SONumber = "SO-LOCK",
                SODate = DateTime.UtcNow.Date,
                CustomerId = customer.Id,
                SubTotal = 80,
                TaxAmount = 14.40m,
                DiscountAmount = 0,
                TotalAmount = 94.40m,
                Status = "Confirmed",
                CreatedAt = DateTime.UtcNow
            };
            order.Items.Add(new SalesOrderItem
            {
                TenantId = tenantId,
                Description = "Fixed price line",
                Quantity = 2,
                UnitPrice = 50,
                TaxAmount = 14.40m,
                DiscountAmount = 20,
                TotalAmount = 80,
                CreatedAt = DateTime.UtcNow
            });
            db.SalesOrders.Add(order);
            await db.SaveChangesAsync();

            var invoice = await sales.ConvertOrderAsync(order.Id);
            var again = await sales.ConvertOrderAsync(order.Id);

            Assert.Equal(invoice.Id, again.Id);
            Assert.Equal(94.40m, invoice.TotalAmount);
            Assert.Equal(80m, invoice.SubTotal);
            Assert.Equal(14.40m, invoice.TaxAmount);
            Assert.Equal(50m, invoice.Items.Single().UnitPrice);
            Assert.Equal(80m, invoice.Items.Single().TotalAmount);
            Assert.Equal(20m, invoice.Items.Single().DiscountAmount);
            var storedOrder = await db.SalesOrders.Include(o => o.Items).SingleAsync(o => o.Id == order.Id);
            Assert.Equal("Invoiced", storedOrder.Status);
            Assert.Equal(2m, storedOrder.Items.Single().DeliveredQuantity);
            Assert.Equal(0m, storedOrder.Items.Single().PendingQuantity);
        }

        [Fact]
        public async Task ConvertOrder_ThrowsWhenCancelled()
        {
            var (db, sales, _, tenant) = CreateSut();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            var customer = new Customer
            {
                TenantId = tenantId,
                CustomerCode = "C-CAN",
                CustomerName = "Cancel Co",
                CreatedAt = DateTime.UtcNow
            };
            db.Customers.Add(customer);
            await db.SaveChangesAsync();
            db.SalesOrders.Add(new SalesOrder
            {
                TenantId = tenantId,
                SONumber = "SO-CAN",
                SODate = DateTime.UtcNow.Date,
                CustomerId = customer.Id,
                TotalAmount = 10,
                Status = "Cancelled",
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
            var orderId = await db.SalesOrders.Select(o => o.Id).SingleAsync();

            await Assert.ThrowsAsync<InvalidOperationException>(() => sales.ConvertOrderAsync(orderId));
        }
    }
}
