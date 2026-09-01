using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests;

public class AutomatedReorderServiceTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly AutomatedReorderService _service;
    private readonly Guid _tenantId = Guid.NewGuid();

    public AutomatedReorderServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Encryption:Key"] = "test-key-32-chars-long-for-reorder!!"
            })
            .Build();

        var encryption = new AesEncryptionService(config);
        var tenantAccessor = new TestTenantAccessor();
        tenantAccessor.SetTenantId(_tenantId);

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new ApplicationDbContext(options, tenantAccessor, encryption);
        _service = new AutomatedReorderService(_db);
    }

    [Fact]
    public async Task EvaluateAndGeneratePurchaseRequestsAsync_GeneratesPrForLowStockItems()
    {
        var itemLow = new Item
        {
            TenantId = _tenantId,
            ItemCode = "ITEM-LOW",
            ItemName = "Low Stock Motor",
            ItemType = "Stockable",
            CurrentStock = 5m,
            ReorderLevel = 20m,
            ReorderQuantity = 50m,
            PurchasePrice = 120m,
            IsActive = true
        };
        var itemOk = new Item
        {
            TenantId = _tenantId,
            ItemCode = "ITEM-OK",
            ItemName = "Healthy Stock Cable",
            ItemType = "Stockable",
            CurrentStock = 100m,
            ReorderLevel = 20m,
            ReorderQuantity = 50m,
            PurchasePrice = 10m,
            IsActive = true
        };

        _db.Items.AddRange(itemLow, itemOk);
        await _db.SaveChangesAsync();

        var result = await _service.EvaluateAndGeneratePurchaseRequestsAsync(_tenantId);

        Assert.Equal(2, result.ItemsEvaluatedCount);
        Assert.Equal(1, result.LowStockItemsCount);
        Assert.Equal(1, result.PurchaseRequestsGeneratedCount);
        Assert.Equal(50m, result.GeneratedRequests[0].QuantityToOrder);
        Assert.Equal(6000m, result.GeneratedRequests[0].EstimatedCost);

        // Verify purchase request in database
        var pr = await _db.PurchaseRequests.FirstOrDefaultAsync(p => p.ItemId == itemLow.Id);
        Assert.NotNull(pr);
        Assert.Equal("Draft", pr!.Status);
        Assert.Equal(50m, pr.Quantity);
    }

    [Fact]
    public async Task EvaluateAndGeneratePurchaseRequestsAsync_DoesNotDuplicateOpenPurchaseRequests()
    {
        var item = new Item
        {
            TenantId = _tenantId,
            ItemCode = "ITEM-DUP",
            ItemName = "Duplicate Test Part",
            ItemType = "Stockable",
            CurrentStock = 2m,
            ReorderLevel = 10m,
            ReorderQuantity = 30m,
            IsActive = true
        };
        _db.Items.Add(item);
        await _db.SaveChangesAsync();

        // First run generates PR
        var firstRun = await _service.EvaluateAndGeneratePurchaseRequestsAsync(_tenantId);
        Assert.Equal(1, firstRun.PurchaseRequestsGeneratedCount);

        // Second run detects existing open PR and suppresses duplicates
        var secondRun = await _service.EvaluateAndGeneratePurchaseRequestsAsync(_tenantId);
        Assert.Equal(0, secondRun.PurchaseRequestsGeneratedCount);
    }

    public void Dispose() => _db.Dispose();
}
