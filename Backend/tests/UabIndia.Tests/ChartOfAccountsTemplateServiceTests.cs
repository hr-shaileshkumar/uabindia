using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests;

public class ChartOfAccountsTemplateServiceTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly ChartOfAccountsTemplateService _service;
    private readonly Guid _tenantId = Guid.NewGuid();

    public ChartOfAccountsTemplateServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Encryption:Key"] = "test-key-32-chars-long-for-coa-test!!"
            })
            .Build();

        var encryption = new AesEncryptionService(config);
        var tenantAccessor = new TestTenantAccessor();
        tenantAccessor.SetTenantId(_tenantId);
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new ApplicationDbContext(options, tenantAccessor, encryption);
        _service = new ChartOfAccountsTemplateService(_db);
    }

    [Fact]
    public void GetAvailableTemplates_ReturnsSupportedStandards()
    {
        var templates = _service.GetAvailableTemplates();

        Assert.NotEmpty(templates);
        Assert.Contains(templates, t => t.Code == "IFRS");
        Assert.Contains(templates, t => t.Code == "US_GAAP");
        Assert.Contains(templates, t => t.Code == "IND_AS");
        Assert.Contains(templates, t => t.Code == "UK_GAAP");
    }

    [Fact]
    public async Task SeedStandardChartOfAccountsAsync_SeedsIfrsAccountsWithHierarchy()
    {
        var seeded = await _service.SeedStandardChartOfAccountsAsync(_tenantId, null, "IFRS", "USD");

        Assert.True(seeded > 20);

        var accounts = await _db.ChartOfAccounts.IgnoreQueryFilters()
            .Where(a => a.TenantId == _tenantId)
            .ToListAsync();

        Assert.Equal(seeded, accounts.Count);
        Assert.Contains(accounts, a => a.AccountCode == "1000" && a.IsGroup);
        Assert.Contains(accounts, a => a.AccountCode == "1110" && !a.IsGroup && a.ParentAccountId != null);
    }

    [Fact]
    public async Task SeedStandardChartOfAccountsAsync_IsIdempotent()
    {
        var firstSeed = await _service.SeedStandardChartOfAccountsAsync(_tenantId, null, "US_GAAP", "USD");
        Assert.True(firstSeed > 0);

        // Second seed attempt should create 0 additional duplicate records
        var secondSeed = await _service.SeedStandardChartOfAccountsAsync(_tenantId, null, "US_GAAP", "USD");
        Assert.Equal(0, secondSeed);
    }

    public void Dispose() => _db.Dispose();
}
