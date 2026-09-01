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
    public class OperationalPostingServiceTests
    {
        private static (
            ApplicationDbContext Db,
            ExpenseClaimService Expenses,
            SalesReturnService Returns,
            PayrollSettlementService Settlements,
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
            return (
                db,
                new ExpenseClaimService(db, ledger, new NoOpNotificationEmitter()),
                new SalesReturnService(db, numbers, ledger, stock),
                new PayrollSettlementService(db, ledger),
                tenant);
        }

        [Fact]
        public async Task MarkPaid_PostsExpenseAndSetsPaid()
        {
            var (db, expenses, _, _, tenant) = CreateSut();
            await using var _ = db;
            var claim = new ExpenseClaim
            {
                TenantId = tenant.GetTenantId(),
                ClaimNumber = "EXP-00001",
                Title = "Travel",
                Amount = 500m,
                Status = "Approved",
                ExpenseDate = DateTime.UtcNow.Date,
                CreatedAt = DateTime.UtcNow
            };
            db.ExpenseClaims.Add(claim);
            await db.SaveChangesAsync();

            var paid = await expenses.MarkPaidAsync(claim.Id);

            Assert.Equal("Paid", paid.Status);
            Assert.NotNull(paid.JournalEntryId);
        }

        [Fact]
        public async Task ProcessSalesReturn_IssuesCreditNoteJournal()
        {
            var (db, _, returns, _, tenant) = CreateSut();
            await using var _ = db;
            var row = new SalesReturn
            {
                TenantId = tenant.GetTenantId(),
                ReturnNumber = "SR-00001",
                CustomerId = Guid.NewGuid(),
                Amount = 250m,
                Reason = "Damaged",
                ReturnDate = DateTime.UtcNow.Date,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };
            db.SalesReturns.Add(row);
            await db.SaveChangesAsync();

            var processed = await returns.ProcessAsync(row.Id);

            Assert.Equal("Processed", processed.Status);
            Assert.StartsWith("CN-", processed.CreditNoteNumber);
            Assert.NotNull(processed.JournalEntryId);
        }

        [Fact]
        public async Task ProcessSalesReturn_RestocksFromInvoice()
        {
            var (db, _, returns, _, tenant) = CreateSut();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            var item = new Item
            {
                TenantId = tenantId,
                ItemCode = "SKU-R",
                ItemName = "Returned hose",
                CurrentStock = 5,
                PurchasePrice = 100,
                CreatedAt = DateTime.UtcNow
            };
            var customer = new Customer
            {
                TenantId = tenantId,
                CustomerCode = "C-R",
                CustomerName = "Return Co",
                CreatedAt = DateTime.UtcNow
            };
            db.Items.Add(item);
            db.Customers.Add(customer);
            await db.SaveChangesAsync();

            var invoice = new SalesInvoice
            {
                TenantId = tenantId,
                InvoiceNumber = "INV-R1",
                InvoiceDate = DateTime.UtcNow.Date,
                CustomerId = customer.Id,
                TotalAmount = 118,
                CreatedAt = DateTime.UtcNow
            };
            invoice.Items.Add(new SalesInvoiceItem
            {
                TenantId = tenantId,
                ItemId = item.Id,
                Quantity = 3,
                UnitPrice = 100,
                TotalAmount = 300,
                CreatedAt = DateTime.UtcNow
            });
            db.SalesInvoices.Add(invoice);
            var row = new SalesReturn
            {
                TenantId = tenantId,
                ReturnNumber = "SR-00002",
                CustomerId = customer.Id,
                SalesInvoiceId = invoice.Id,
                Amount = 354m,
                Reason = "Wrong item",
                ReturnDate = DateTime.UtcNow.Date,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };
            db.SalesReturns.Add(row);
            await db.SaveChangesAsync();

            await returns.ProcessAsync(row.Id);

            var storedItem = await db.Items.SingleAsync(i => i.Id == item.Id);
            Assert.Equal(8m, storedItem.CurrentStock);
            Assert.True(await db.StockMovements.AnyAsync(m => m.ReferenceType == "SalesReturn" && m.ReferenceId == row.Id));
        }

        [Fact]
        public async Task SettleFnf_PostsPayoutWhenPositive()
        {
            var (db, _, _, settlements, tenant) = CreateSut();
            await using var _ = db;
            var row = new PayrollFinalSettlement
            {
                TenantId = tenant.GetTenantId(),
                EmployeeId = Guid.NewGuid(),
                EmployeeName = "Ada",
                ExitDate = DateTime.UtcNow.Date,
                TotalSettlement = 12000m,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };
            db.PayrollFinalSettlements.Add(row);
            await db.SaveChangesAsync();

            var result = await settlements.SettleAsync(row.Id);

            Assert.NotNull(result.JournalEntryId);
            var stored = await db.PayrollFinalSettlements.SingleAsync(s => s.Id == row.Id);
            Assert.Equal("Settled", stored.Status);
        }
    }
}
