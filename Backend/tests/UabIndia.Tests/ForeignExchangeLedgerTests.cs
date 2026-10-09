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
    public class ForeignExchangeLedgerTests
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
        public async Task PostForeignExchangeSettlement_CustomerReceipt_WithGain_GeneratesBalancedJournal()
        {
            var (db, ledger, _) = CreateSut();
            await using var _ = db;

            // Invoice was $1,000 @ 82 INR = 82,000 INR
            // Payment received $1,000 @ 84.50 INR = 84,500 INR -> Gain = 2,500 INR
            var command = new ForeignExchangeSettlementCommand(
                JournalNumberPrefix: "JE-FX-",
                SettlementDate: DateTime.UtcNow.Date,
                Description: "Customer payment receipt in USD",
                CurrencyCode: "USD",
                SettlementExchangeRate: 84.50m,
                OriginalExchangeRate: 82.00m,
                ForeignAmount: 1000m,
                SettlementType: "CustomerReceipt");

            var journal = await ledger.PostForeignExchangeSettlementAsync(command);

            Assert.Equal("Posted", journal.Status);
            Assert.Equal(84500m, journal.TotalDebit);
            Assert.Equal(84500m, journal.TotalCredit);
            Assert.Equal(3, journal.Lines.Count);

            var bankLine = journal.Lines.First(l => l.Account.AccountCode == "1110");
            Assert.Equal(84500m, bankLine.DebitAmount);
            Assert.Equal(0m, bankLine.CreditAmount);

            var arLine = journal.Lines.First(l => l.Account.AccountCode == "1100");
            Assert.Equal(0m, arLine.DebitAmount);
            Assert.Equal(82000m, arLine.CreditAmount);

            var gainLine = journal.Lines.First(l => l.Account.AccountCode == "4301");
            Assert.Equal(0m, gainLine.DebitAmount);
            Assert.Equal(2500m, gainLine.CreditAmount);
        }

        [Fact]
        public async Task PostForeignExchangeSettlement_CustomerReceipt_WithLoss_GeneratesBalancedJournal()
        {
            var (db, ledger, _) = CreateSut();
            await using var _ = db;

            // Invoice was $1,000 @ 84 INR = 84,000 INR
            // Payment received $1,000 @ 81.50 INR = 81,500 INR -> Loss = 2,500 INR
            var command = new ForeignExchangeSettlementCommand(
                JournalNumberPrefix: "JE-FX-",
                SettlementDate: DateTime.UtcNow.Date,
                Description: "Customer payment receipt in USD with adverse forex",
                CurrencyCode: "USD",
                SettlementExchangeRate: 81.50m,
                OriginalExchangeRate: 84.00m,
                ForeignAmount: 1000m,
                SettlementType: "CustomerReceipt");

            var journal = await ledger.PostForeignExchangeSettlementAsync(command);

            Assert.Equal(84000m, journal.TotalDebit);
            Assert.Equal(84000m, journal.TotalCredit);
            Assert.Equal(3, journal.Lines.Count);

            var bankLine = journal.Lines.First(l => l.Account.AccountCode == "1110");
            Assert.Equal(81500m, bankLine.DebitAmount);

            var lossLine = journal.Lines.First(l => l.Account.AccountCode == "5301");
            Assert.Equal(2500m, lossLine.DebitAmount);

            var arLine = journal.Lines.First(l => l.Account.AccountCode == "1100");
            Assert.Equal(84000m, arLine.CreditAmount);
        }

        [Fact]
        public async Task PostForeignExchangeSettlement_VendorPayment_WithGain_GeneratesBalancedJournal()
        {
            var (db, ledger, _) = CreateSut();
            await using var _ = db;

            // Bill was €2,000 @ 92 INR = 184,000 INR
            // Payment made €2,000 @ 89 INR = 178,000 INR -> Gain = 6,000 INR
            var command = new ForeignExchangeSettlementCommand(
                JournalNumberPrefix: "JE-FXP-",
                SettlementDate: DateTime.UtcNow.Date,
                Description: "Vendor bill payment in EUR with favorable forex",
                CurrencyCode: "EUR",
                SettlementExchangeRate: 89.00m,
                OriginalExchangeRate: 92.00m,
                ForeignAmount: 2000m,
                SettlementType: "VendorPayment");

            var journal = await ledger.PostForeignExchangeSettlementAsync(command);

            Assert.Equal(184000m, journal.TotalDebit);
            Assert.Equal(184000m, journal.TotalCredit);

            var apLine = journal.Lines.First(l => l.Account.AccountCode == "2100");
            Assert.Equal(184000m, apLine.DebitAmount);

            var bankLine = journal.Lines.First(l => l.Account.AccountCode == "1110");
            Assert.Equal(178000m, bankLine.CreditAmount);

            var gainLine = journal.Lines.First(l => l.Account.AccountCode == "4301");
            Assert.Equal(6000m, gainLine.CreditAmount);
        }

        [Fact]
        public async Task PostLandedCostCapitalization_CreatesBalancedInventoryAssetJournal()
        {
            var (db, ledger, _) = CreateSut();
            await using var _ = db;

            var journal = await ledger.PostLandedCostCapitalizationAsync(
                15000m,
                "PO-IMPORT-2026",
                "Customs duty and sea freight allocation");

            Assert.Equal(15000m, journal.TotalDebit);
            Assert.Equal(15000m, journal.TotalCredit);

            var invLine = journal.Lines.First(l => l.Account.AccountCode == "1400");
            Assert.Equal(15000m, invLine.DebitAmount);

            var clearingLine = journal.Lines.First(l => l.Account.AccountCode == "2105");
            Assert.Equal(15000m, clearingLine.CreditAmount);
        }
    }
}
