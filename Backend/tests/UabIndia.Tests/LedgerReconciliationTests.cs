using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class LedgerReconciliationTests
    {
        private static (ApplicationDbContext Db, LedgerPostingService Ledger, LedgerReconciliationService Reconciliation, Guid TenantId) CreateSut()
        {
            var tenant = new TestTenantAccessor();
            var tenantId = tenant.GetTenantId();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            var db = new ApplicationDbContext(options, tenant, new TestEncryptionService());
            var numbers = new DocumentNumberService(db, tenant);
            var ledger = new LedgerPostingService(db, tenant, numbers);
            var reconciliation = new LedgerReconciliationService(db, tenant);
            return (db, ledger, reconciliation, tenantId);
        }

        [Fact]
        public async Task ReconcileAsync_WithBalancedPostings_ReportsZeroTrialBalanceVariance()
        {
            var (db, ledger, reconciliation, tenantId) = CreateSut();
            await using var _ = db;

            // Post balanced sales invoice: 10,000 AR vs 10,000 Sales Revenue
            await ledger.PostAsync(
                "JE-SALES-",
                DateTime.UtcNow.Date,
                "Sales Invoice Posting",
                new[]
                {
                    new LedgerLine("1100", "Accounts Receivable", "Asset", 10000m, 0),
                    new LedgerLine("4000", "Sales Revenue", "Revenue", 0, 10000m)
                });

            // Post inventory capitalization: 5,000 Inventory Asset vs 5,000 AP
            await ledger.PostAsync(
                "JE-INV-",
                DateTime.UtcNow.Date,
                "Inventory Receipt",
                new[]
                {
                    new LedgerLine("1400", "Inventory Asset", "Asset", 5000m, 0),
                    new LedgerLine("2100", "Accounts Payable", "Liability", 0, 5000m)
                });

            var report = await reconciliation.ReconcileAsync();

            Assert.True(report.IsBalanced);
            Assert.Equal(15000m, report.TotalDebits);
            Assert.Equal(15000m, report.TotalCredits);
            Assert.Equal(0m, report.TrialBalanceVariance);
            Assert.Equal(4, report.AccountBalances.Count);
        }

        [Fact]
        public async Task ReconcileAsync_SubledgerMatching_ReconcilesArAndInventorySubledgers()
        {
            var (db, ledger, reconciliation, tenantId) = CreateSut();
            await using var _ = db;

            // 1. Post General Ledger entry for Sales Invoice: AR 10,000
            var invoiceId = Guid.NewGuid();
            await ledger.PostAsync(
                "JE-INV-",
                DateTime.UtcNow.Date,
                "Sales Invoice",
                new[]
                {
                    new LedgerLine("1100", "Accounts Receivable", "Asset", 10000m, 0),
                    new LedgerLine("4000", "Sales Revenue", "Revenue", 0, 10000m)
                },
                "SalesInvoice",
                invoiceId);

            // 2. Add matching SalesInvoice entity in subledger: Total 10,000, Paid 0
            db.SalesInvoices.Add(new SalesInvoice
            {
                Id = invoiceId,
                TenantId = tenantId,
                InvoiceNumber = "INV-001",
                InvoiceDate = DateTime.UtcNow.Date,
                TotalAmount = 10000m,
                PaidAmount = 0m,
                Status = "Posted",
                CreatedAt = DateTime.UtcNow
            });

            // 3. Post Inventory Asset GL entry: 4,500
            await ledger.PostAsync(
                "JE-STK-",
                DateTime.UtcNow.Date,
                "Stock Receipt",
                new[]
                {
                    new LedgerLine("1400", "Inventory Asset", "Asset", 4500m, 0),
                    new LedgerLine("2100", "Accounts Payable", "Liability", 0, 4500m)
                });

            // 4. Add matching StockBalance entity in subledger: 4,500
            var itemId = Guid.NewGuid();
            var whId = Guid.NewGuid();
            db.StockBalances.Add(new StockBalance
            {
                TenantId = tenantId,
                ItemId = itemId,
                WarehouseId = whId,
                QuantityOnHand = 45m,
                AverageUnitCost = 100m,
                TotalValue = 4500m,
                CreatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();

            var report = await reconciliation.ReconcileAsync();

            Assert.True(report.IsBalanced);
            Assert.True(report.AccountsReceivable.IsReconciled);
            Assert.Equal(10000m, report.AccountsReceivable.GeneralLedgerBalance);
            Assert.Equal(10000m, report.AccountsReceivable.SubledgerTotal);
            Assert.Equal(0m, report.AccountsReceivable.Variance);

            Assert.True(report.InventoryValuation.IsReconciled);
            Assert.Equal(4500m, report.InventoryValuation.GeneralLedgerBalance);
            Assert.Equal(4500m, report.InventoryValuation.SubledgerTotal);
            Assert.Equal(0m, report.InventoryValuation.Variance);
        }
    }
}
