using System;
using System.Linq;
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
    public class LedgerPostingServiceTests
    {
        private static (ApplicationDbContext Db, LedgerPostingService Ledger, TestTenantAccessor Tenant) CreateSut()
        {
            var tenant = new TestTenantAccessor();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            var db = new ApplicationDbContext(options, tenant, new TestEncryptionService());
            var ledger = new LedgerPostingService(db, tenant, new DocumentNumberService(db, tenant));
            return (db, ledger, tenant);
        }

        [Fact]
        public async Task PostAsync_SkipsZeroGstLegs_AndStaysBalanced()
        {
            var (db, ledger, _) = CreateSut();
            await using var _ = db;

            var gst = GstCalculator.Calculate(10000m, 18m, false);
            var journal = await ledger.PostAsync(
                "JE-INV-",
                DateTime.UtcNow.Date,
                "Intra-state invoice",
                new[]
                {
                    new LedgerLine("1100", "Accounts Receivable", "Asset", gst.InvoiceTotal, 0),
                    new LedgerLine("4000", "Sales Revenue", "Revenue", 0, gst.TaxableAmount),
                    new LedgerLine("2201", "CGST Payable", "Liability", 0, gst.Cgst),
                    new LedgerLine("2202", "SGST Payable", "Liability", 0, gst.Sgst),
                    new LedgerLine("2203", "IGST Payable", "Liability", 0, gst.Igst),
                },
                "SalesInvoice",
                Guid.NewGuid());

            Assert.Equal(11800m, journal.TotalDebit);
            Assert.Equal(11800m, journal.TotalCredit);
            Assert.Equal(4, journal.Lines.Count);
            Assert.DoesNotContain(journal.Lines, line => line.DebitAmount == 0 && line.CreditAmount == 0);
            Assert.Equal(0, gst.Igst);
        }

        [Fact]
        public async Task PostAsync_RejectsClosedAccountingPeriod()
        {
            var (db, ledger, tenant) = CreateSut();
            await using var _ = db;

            var date = new DateTime(2026, 8, 17, 0, 0, 0, DateTimeKind.Utc);
            db.AccountingPeriods.Add(new AccountingPeriod
            {
                TenantId = tenant.GetTenantId(),
                Year = 2026,
                Month = 8,
                Status = "Closed",
                ClosedAt = date,
                CreatedAt = date
            });
            await db.SaveChangesAsync();

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                ledger.PostAsync(
                    "JE-AR-",
                    date,
                    "Receipt in closed period",
                    new[]
                    {
                        new LedgerLine("1110", "Bank", "Asset", 100m, 0),
                        new LedgerLine("1100", "Accounts Receivable", "Asset", 0, 100m)
                    },
                    "Payment",
                    Guid.NewGuid()));

            Assert.Contains("closed", ex.Message, StringComparison.OrdinalIgnoreCase);
        }
    }
}
