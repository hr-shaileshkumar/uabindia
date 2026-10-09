using System;
using System.Collections.Generic;
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
    public class MovingAverageInventoryValuationTests
    {
        private static (ApplicationDbContext Db, InventoryStockService Stock, LedgerPostingService Ledger, Guid TenantId, Guid ItemId, Guid WarehouseId) CreateSut()
        {
            var tenant = new TestTenantAccessor();
            var tenantId = tenant.GetTenantId();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            var db = new ApplicationDbContext(options, tenant, new TestEncryptionService());
            var numbers = new DocumentNumberService(db, tenant);
            var ledger = new LedgerPostingService(db, tenant, numbers);
            var stock = new InventoryStockService(db, tenant, numbers, ledger);

            var item = new Item
            {
                TenantId = tenantId,
                ItemCode = "VAL-ITEM-01",
                ItemName = "High Grade Raw Material",
                PurchasePrice = 100m,
                CurrentStock = 0m,
                IsActive = true
            };
            var wh = new Warehouse
            {
                TenantId = tenantId,
                WarehouseCode = "WH-VAL-01",
                WarehouseName = "Main Raw Material Warehouse",
                IsActive = true
            };
            db.Items.Add(item);
            db.Warehouses.Add(wh);
            db.SaveChanges();

            return (db, stock, ledger, tenantId, item.Id, wh.Id);
        }

        [Fact]
        public async Task WeightedMovingAverage_CalculatesCorrectBlendedCost_OnMultipleInboundBatches()
        {
            var (db, stock, _, tenantId, itemId, whId) = CreateSut();
            await using var _ = db;

            // Batch 1: Inbound 10 units @ 100 INR = 1,000 INR
            await stock.StageInboundAsync(itemId, 10m, 100m, whId, "PurchaseOrder", Guid.NewGuid(), "PO-001", "Batch 1");

            var balance1 = await db.StockBalances.FirstAsync(b => b.ItemId == itemId && b.WarehouseId == whId);
            Assert.Equal(10m, balance1.QuantityOnHand);
            Assert.Equal(100m, balance1.AverageUnitCost);
            Assert.Equal(1000m, balance1.TotalValue);

            // Batch 2: Inbound 10 units @ 120 INR = 1,200 INR
            // New Total Qty = 20
            // New Total Value = 1,000 + 1,200 = 2,200 INR
            // Weighted Average Unit Cost = 2,200 / 20 = 110 INR!
            await stock.StageInboundAsync(itemId, 10m, 120m, whId, "PurchaseOrder", Guid.NewGuid(), "PO-002", "Batch 2");

            var balance2 = await db.StockBalances.FirstAsync(b => b.ItemId == itemId && b.WarehouseId == whId);
            Assert.Equal(20m, balance2.QuantityOnHand);
            Assert.Equal(110m, balance2.AverageUnitCost);
            Assert.Equal(2200m, balance2.TotalValue);
        }

        [Fact]
        public async Task OutboundIssue_ConsumesStockAtCurrentMovingAverageCost_AndPreservesUnitCost()
        {
            var (db, stock, _, tenantId, itemId, whId) = CreateSut();
            await using var _ = db;

            // Setup: 20 units @ 110 INR average cost = 2,200 INR total value
            await stock.StageInboundAsync(itemId, 10m, 100m, whId, "PO", null, null, null);
            await stock.StageInboundAsync(itemId, 10m, 120m, whId, "PO", null, null, null);

            // Outbound: Issue 5 units for manufacturing/sales
            var movement = await stock.StageOutboundAsync(itemId, 5m, 0m, whId, "SalesOrder", Guid.NewGuid(), "SO-001", "Dispatch");

            Assert.Equal(5m, movement.Quantity);
            Assert.Equal(110m, movement.UnitPrice);
            Assert.Equal(550m, movement.TotalValue);

            var balance = await db.StockBalances.FirstAsync(b => b.ItemId == itemId && b.WarehouseId == whId);
            Assert.Equal(15m, balance.QuantityOnHand);
            Assert.Equal(110m, balance.AverageUnitCost); // Unit cost is preserved!
            Assert.Equal(1650m, balance.TotalValue);     // 15 * 110 = 1,650 INR
        }

        [Fact]
        public async Task AllocateLandedCost_CapitalizesFreightIntoUnitCost_AndPostsJournalEntry()
        {
            var (db, stock, _, tenantId, itemId, whId) = CreateSut();
            await using var _ = db;

            // Setup 15 units in warehouse @ 110 INR = 1,650 INR
            await stock.StageInboundAsync(itemId, 15m, 110m, whId, "PO", null, null, null);

            // Allocate 300 INR freight across the 15 units -> 300 / 15 = 20 INR added to unit cost
            // New Unit Cost = 110 + 20 = 130 INR!
            // New Total Value = 15 * 130 = 1,950 INR!
            var command = new AllocateLandedCostCommand(
                ReferenceNumber: "LC-FREIGHT-01",
                Description: "Air freight clearance charges",
                Allocations: new[]
                {
                    new LandedCostAllocationItem(itemId, whId, 300m)
                },
                PostJournalEntry: true,
                ReferenceId: Guid.NewGuid());

            var result = await stock.AllocateLandedCostAsync(command);

            Assert.Equal(1, result.ItemsUpdated);
            Assert.Equal(300m, result.TotalAllocated);
            Assert.NotNull(result.JournalEntry);
            Assert.Equal(300m, result.JournalEntry.TotalDebit);
            Assert.Equal(300m, result.JournalEntry.TotalCredit);

            var balance = await db.StockBalances.FirstAsync(b => b.ItemId == itemId && b.WarehouseId == whId);
            Assert.Equal(15m, balance.QuantityOnHand);
            Assert.Equal(130m, balance.AverageUnitCost);
            Assert.Equal(1950m, balance.TotalValue);
        }

        [Fact]
        public async Task GetValuationSummary_AggregatesWarehouseAssetValuation()
        {
            var (db, stock, _, tenantId, itemId, whId) = CreateSut();
            await using var _ = db;

            await stock.StageInboundAsync(itemId, 10m, 250m, whId, "PO", null, null, null);

            var summary = await stock.GetValuationSummaryAsync(whId);

            Assert.Equal(1, summary.TotalDistinctItems);
            Assert.Equal(10m, summary.TotalQuantityOnHand);
            Assert.Equal(2500m, summary.TotalValuationAmount);
            Assert.Single(summary.Items);
            Assert.Equal(250m, summary.Items[0].AverageUnitCost);
        }
    }
}
