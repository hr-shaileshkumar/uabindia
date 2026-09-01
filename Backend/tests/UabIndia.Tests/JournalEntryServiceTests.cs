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
    public class JournalEntryServiceTests
    {
        private static (ApplicationDbContext Db, JournalEntryService Service, TestTenantAccessor Tenant) CreateSut()
        {
            var tenant = new TestTenantAccessor();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            var db = new ApplicationDbContext(options, tenant, new TestEncryptionService());
            var service = new JournalEntryService(db, tenant, new DocumentNumberService(db, tenant));
            return (db, service, tenant);
        }

        [Fact]
        public async Task CreateDraftAsync_PersistsBalancedDraft()
        {
            var (db, service, tenant) = CreateSut();
            await using var _ = db;
            var (cash, revenue) = await SeedPostableAccounts(db, tenant.GetTenantId());

            var created = await service.CreateDraftAsync(new CreateJournalEntryCommand(
                DateTime.UtcNow.Date,
                "Regular",
                "REF-1",
                "Sales accrual",
                "Month close",
                new[]
                {
                    new CreateJournalLineCommand(cash.Id, 1000m, 0, "Debit cash"),
                    new CreateJournalLineCommand(revenue.Id, 0, 1000m, "Credit revenue")
                }));

            var stored = await db.JournalEntries.Include(j => j.Lines).SingleAsync(j => j.Id == created.Id);
            Assert.Equal("Draft", stored.Status);
            Assert.StartsWith("JE-", created.JournalNumber);
            Assert.Equal(1000m, stored.TotalDebit);
            Assert.Equal(2, stored.Lines.Count);
        }

        [Fact]
        public async Task PostAsync_AppliesAccountBalances()
        {
            var (db, service, tenant) = CreateSut();
            await using var _ = db;
            var (cash, revenue) = await SeedPostableAccounts(db, tenant.GetTenantId());
            var created = await service.CreateDraftAsync(new CreateJournalEntryCommand(
                DateTime.UtcNow.Date,
                null,
                null,
                "Posting test",
                null,
                new[]
                {
                    new CreateJournalLineCommand(cash.Id, 250m, 0, null),
                    new CreateJournalLineCommand(revenue.Id, 0, 250m, null)
                }));

            await service.PostAsync(created.Id, Guid.NewGuid());

            var cashAfter = await db.ChartOfAccounts.SingleAsync(a => a.Id == cash.Id);
            var revenueAfter = await db.ChartOfAccounts.SingleAsync(a => a.Id == revenue.Id);
            var posted = await db.JournalEntries.SingleAsync(j => j.Id == created.Id);
            Assert.Equal("Posted", posted.Status);
            Assert.Equal(250m, cashAfter.CurrentBalance);
            Assert.Equal(250m, revenueAfter.CurrentBalance);
        }

        [Fact]
        public async Task CreateDraftAsync_RejectsUnbalancedLines()
        {
            var (db, service, tenant) = CreateSut();
            await using var _ = db;
            var (cash, revenue) = await SeedPostableAccounts(db, tenant.GetTenantId());

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                service.CreateDraftAsync(new CreateJournalEntryCommand(
                    DateTime.UtcNow.Date,
                    null,
                    null,
                    "Bad draft",
                    null,
                    new[]
                    {
                        new CreateJournalLineCommand(cash.Id, 100m, 0, null),
                        new CreateJournalLineCommand(revenue.Id, 0, 90m, null)
                    })));
        }

        [Fact]
        public async Task LedgerPostingService_AutoCreatesAccountWithCompanyFunctionalCurrency()
        {
            var (db, _, tenant) = CreateSut();
            await using var _ = db;
            var company = new Company
            {
                TenantId = tenant.GetTenantId(),
                Name = "US Operations LLC",
                CountryCode = "USA",
                FunctionalCurrencyCode = "USD"
            };
            db.Companies.Add(company);
            await db.SaveChangesAsync();

            tenant.SetOrgScope(company.Id, null, null, null, null);

            var ledgerService = new LedgerPostingService(db, tenant, new DocumentNumberService(db, tenant));

            var entry = await ledgerService.PostAsync(
                "GL-",
                DateTime.UtcNow,
                "Office equipment purchase",
                new[]
                {
                    new LedgerLine("1500", "Office Equipment", "Asset", 1200m, 0m),
                    new LedgerLine("1010", "Bank USD", "Asset", 0m, 1200m)
                });

            var createdAccount = await db.ChartOfAccounts.FirstAsync(a => a.AccountCode == "1500" && a.TenantId == tenant.GetTenantId());
            Assert.Equal("USD", createdAccount.Currency);
            Assert.Equal(company.Id, entry.CompanyId);
            Assert.Equal("Posted", entry.Status);
        }

        private static async Task<(ChartOfAccount Cash, ChartOfAccount Revenue)> SeedPostableAccounts(
            ApplicationDbContext db,
            Guid tenantId)
        {
            var cash = new ChartOfAccount
            {
                TenantId = tenantId,
                AccountCode = "1100",
                AccountName = "Cash",
                AccountType = "Asset",
                IsGroup = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            var revenue = new ChartOfAccount
            {
                TenantId = tenantId,
                AccountCode = "4000",
                AccountName = "Sales",
                AccountType = "Revenue",
                IsGroup = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.ChartOfAccounts.AddRange(cash, revenue);
            await db.SaveChangesAsync();
            return (cash, revenue);
        }
    }
}
