using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Security;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class IndianEnterpriseDemoSeederTests
    {
        private static ApplicationDbContext CreateInMemoryDbContext(string dbName, ITenantAccessor tenantAccessor)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            return new ApplicationDbContext(options, tenantAccessor, new DummyEncryptionService());
        }

        private class DummyEncryptionService : IEncryptionService
        {
            public string Encrypt(string plainText) => plainText;
            public string Decrypt(string cipherText) => cipherText;
            public string ComputeHash(string input) => "hash-" + input;
            public string EncryptBlindIndex(string plainText) => "bi-" + plainText;
        }

        [Fact]
        public async Task IndianEnterpriseDemoSeeder_SeedsCompanyCoA_VendorsAndCustomers()
        {
            var tenantId = Guid.NewGuid();
            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(tenantId);

            var db = CreateInMemoryDbContext("DemoSeederTestDb_" + Guid.NewGuid(), tenantAccessor);
            var seeder = new IndianEnterpriseDemoSeeder(db, new DummyEncryptionService(), NullLogger<IndianEnterpriseDemoSeeder>.Instance);

            var result = await seeder.SeedDemoTenantAsync(tenantId);

            Assert.True(result.Success);
            Assert.True(result.CompanyCreated);
            Assert.True(result.AccountsCreated >= 20);
            Assert.Equal(3, result.VendorsCreated);
            Assert.Equal(2, result.CustomersCreated);

            // Verify company exists
            var company = await db.Companies.FirstOrDefaultAsync(c => c.TenantId == tenantId);
            Assert.NotNull(company);
            Assert.Equal("Bharat Technologies & Manufacturing Ltd", company.Name);
            Assert.Equal("27AABCB1234F1Z5", company.TaxId);

            // Verify statutory CoA accounts exist
            var rcmAccount = await db.ChartOfAccounts.FirstOrDefaultAsync(a => a.TenantId == tenantId && a.AccountCode == "1304");
            Assert.NotNull(rcmAccount);
            Assert.Equal("RCM Input CGST", rcmAccount.AccountName);

            var tdsAccount = await db.ChartOfAccounts.FirstOrDefaultAsync(a => a.TenantId == tenantId && a.AccountCode == "2210");
            Assert.NotNull(tdsAccount);
            Assert.Contains("TDS Payable", tdsAccount.AccountName);

            var roundingAccount = await db.ChartOfAccounts.FirstOrDefaultAsync(a => a.TenantId == tenantId && a.AccountCode == "4201");
            Assert.NotNull(roundingAccount);
            Assert.Equal("Rounding Off Reserve (Income)", roundingAccount.AccountName);

            // Verify TDS Vendors
            var vendors = await db.Vendors.Where(v => v.TenantId == tenantId).ToListAsync();
            Assert.Equal(3, vendors.Count);
            Assert.Contains(vendors, v => v.VendorCode == "VEN-001" && v.VendorType == "Contractor");
            Assert.Contains(vendors, v => v.VendorCode == "VEN-002" && v.Notes!.Contains("194J"));

            // Verify B2B Corporate Customers
            var customers = await db.Customers.Where(c => c.TenantId == tenantId).ToListAsync();
            Assert.Equal(2, customers.Count);
            Assert.Contains(customers, c => c.CustomerCode == "CUST-001" && c.CustomerName == "Infosys Technologies Ltd");
        }

        [Fact]
        public async Task IndianEnterpriseDemoSeeder_IsIdempotentOnSubsequentRuns()
        {
            var tenantId = Guid.NewGuid();
            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(tenantId);

            var db = CreateInMemoryDbContext("DemoSeederIdempotencyDb_" + Guid.NewGuid(), tenantAccessor);
            var seeder = new IndianEnterpriseDemoSeeder(db, new DummyEncryptionService(), NullLogger<IndianEnterpriseDemoSeeder>.Instance);

            // First run
            var result1 = await seeder.SeedDemoTenantAsync(tenantId);
            Assert.True(result1.Success);
            var totalAccountsAfterRun1 = await db.ChartOfAccounts.CountAsync(a => a.TenantId == tenantId);
            var totalVendorsAfterRun1 = await db.Vendors.CountAsync(v => v.TenantId == tenantId);

            // Second run (re-seeding same tenant)
            var result2 = await seeder.SeedDemoTenantAsync(tenantId);
            Assert.True(result2.Success);
            Assert.False(result2.CompanyCreated); // Company was already created
            Assert.Equal(0, result2.AccountsCreated); // No duplicate accounts
            Assert.Equal(0, result2.VendorsCreated); // No duplicate vendors
            Assert.Equal(0, result2.CustomersCreated); // No duplicate customers

            var totalAccountsAfterRun2 = await db.ChartOfAccounts.CountAsync(a => a.TenantId == tenantId);
            var totalVendorsAfterRun2 = await db.Vendors.CountAsync(v => v.TenantId == tenantId);

            Assert.Equal(totalAccountsAfterRun1, totalAccountsAfterRun2);
            Assert.Equal(totalVendorsAfterRun1, totalVendorsAfterRun2);
        }
    }
}
