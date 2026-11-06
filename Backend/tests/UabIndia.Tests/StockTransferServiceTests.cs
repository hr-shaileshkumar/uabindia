using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests;

public class StockTransferServiceTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly StockTransferService _service;
    private readonly Guid _tenantId = Guid.NewGuid();

    public StockTransferServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Encryption:Key"] = "test-key-32-chars-long-for-transfer!!"
            })
            .Build();

        var encryption = new AesEncryptionService(config);
        var tenantAccessor = new TestTenantAccessor();
        tenantAccessor.SetTenantId(_tenantId);

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new ApplicationDbContext(options, tenantAccessor, encryption);
        _service = new StockTransferService(_db);
    }

    [Fact]
    public async Task CreateAndDispatchTransferAsync_DeductsSourceStockAndSetsInTransit()
    {
        var item = new Item
        {
            TenantId = _tenantId,
            ItemCode = "ITEM-001",
            ItemName = "Industrial Bearing",
            PurchasePrice = 250m,
            IsActive = true
        };
        var warehouseA = new Warehouse
        {
            TenantId = _tenantId,
            WarehouseCode = "WH-MAIN",
            WarehouseName = "Main Central Warehouse",
            IsActive = true
        };
        var warehouseB = new Warehouse
        {
            TenantId = _tenantId,
            WarehouseCode = "WH-REGIONAL",
            WarehouseName = "Regional Logistics Hub",
            IsActive = true
        };

        _db.Items.Add(item);
        _db.Warehouses.AddRange(warehouseA, warehouseB);
        await _db.SaveChangesAsync();

        var balanceA = new StockBalance
        {
            TenantId = _tenantId,
            ItemId = item.Id,
            WarehouseId = warehouseA.Id,
            QuantityOnHand = 100m,
            QuantityAvailable = 100m,
            AverageUnitCost = 250m
        };
        _db.StockBalances.Add(balanceA);
        await _db.SaveChangesAsync();

        var transferReq = new StockTransferRequest
        {
            TenantId = _tenantId,
            FromWarehouseId = warehouseA.Id,
            ToWarehouseId = warehouseB.Id,
            ItemId = item.Id,
            Quantity = 30m,
            Notes = "Inter-warehouse restocking"
        };

        var dispatchResult = await _service.CreateAndDispatchTransferAsync(transferReq);

        Assert.True(dispatchResult.Success);
        Assert.Equal("InTransit", dispatchResult.Status);
        Assert.Equal(30m, dispatchResult.Quantity);

        // Verify source stock deducted
        var updatedBalanceA = await _db.StockBalances.FindAsync(balanceA.Id);
        Assert.Equal(70m, updatedBalanceA!.QuantityOnHand);
        Assert.Equal(70m, updatedBalanceA.QuantityAvailable);

        // Receive transfer at destination warehouse
        var receiveResult = await _service.ReceiveTransferAsync(dispatchResult.MovementId);
        Assert.True(receiveResult.Success);
        Assert.Equal("Completed", receiveResult.Status);

        // Verify destination stock balance created and incremented
        var destBalance = await _db.StockBalances.FirstOrDefaultAsync(b => b.ItemId == item.Id && b.WarehouseId == warehouseB.Id);
        Assert.NotNull(destBalance);
        Assert.Equal(30m, destBalance!.QuantityOnHand);
        Assert.Equal(30m, destBalance.QuantityAvailable);
    }

    public void Dispose() => _db.Dispose();
}
