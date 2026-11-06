using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests;

public class FinancialConsolidationServiceTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly FinancialConsolidationService _service;
    private readonly Guid _tenantId = Guid.NewGuid();

    public FinancialConsolidationServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Encryption:Key"] = "test-key-32-chars-long-for-consolidation!!"
            })
            .Build();

        var encryption = new AesEncryptionService(config);
        var tenantAccessor = new TestTenantAccessor();
        tenantAccessor.SetTenantId(_tenantId);
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new ApplicationDbContext(options, tenantAccessor, encryption);
        var currencyService = new CurrencyExchangeService();
        _service = new FinancialConsolidationService(_db, currencyService);
    }

    [Fact]
    public async Task GenerateConsolidatedBalanceSheetAsync_AggregatesAndConvertsEntityBalances()
    {
        // Entity 1: US Parent (USD)
        var parentCompany = new Company
        {
            TenantId = _tenantId,
            Name = "Global Holdings Inc",
            FunctionalCurrencyCode = "USD",
            IsActive = true
        };
        // Entity 2: India Subsidiary (INR)
        var subCompany = new Company
        {
            TenantId = _tenantId,
            ParentCompanyId = parentCompany.Id,
            Name = "India Operations Pvt Ltd",
            FunctionalCurrencyCode = "INR",
            IsActive = true
        };

        _db.Companies.AddRange(parentCompany, subCompany);

        // Add accounts
        _db.ChartOfAccounts.AddRange(
            new ChartOfAccount { TenantId = _tenantId, AccountCode = "1001", AccountType = "Asset", CurrentBalance = 10000m, IsActive = true },
            new ChartOfAccount { TenantId = _tenantId, AccountCode = "2001", AccountType = "Liability", CurrentBalance = 4000m, IsActive = true },
            new ChartOfAccount { TenantId = _tenantId, AccountCode = "3001", AccountType = "Equity", CurrentBalance = 6000m, IsActive = true }
        );

        await _db.SaveChangesAsync();

        var result = await _service.GenerateConsolidatedBalanceSheetAsync(_tenantId, null, DateTime.UtcNow, "USD");

        Assert.NotNull(result);
        Assert.Equal("USD", result.TargetCurrency);
        Assert.Equal(2, result.EntityContributions.Count);
        Assert.True(result.TotalConsolidatedAssets > 0);
    }

    public void Dispose() => _db.Dispose();
}
