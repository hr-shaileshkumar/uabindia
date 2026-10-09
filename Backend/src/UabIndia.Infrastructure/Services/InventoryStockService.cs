using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class InventoryStockService : IInventoryStockService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;
        private readonly ILedgerPostingService? _ledger;

        public InventoryStockService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers,
            ILedgerPostingService? ledger = null)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
            _ledger = ledger;
        }

        public async Task<StockMovement> RecordAsync(RecordStockMovementCommand command, CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (command.Quantity == 0)
                throw new InvalidOperationException("Quantity cannot be zero.");

            var item = await _db.Items.FirstOrDefaultAsync(i => i.Id == command.ItemId && i.TenantId == tenantId, cancellationToken);
            if (item == null)
                throw new KeyNotFoundException("Item not found.");

            if (command.WarehouseId.HasValue)
            {
                var warehouse = await _db.Warehouses.FirstOrDefaultAsync(
                    w => w.Id == command.WarehouseId && w.TenantId == tenantId, cancellationToken);
                if (warehouse == null)
                    throw new InvalidOperationException("Warehouse not found.");
            }

            var movementType = string.IsNullOrWhiteSpace(command.MovementType) ? "In" : command.MovementType.Trim();
            if (movementType.Equals("WriteOff", StringComparison.OrdinalIgnoreCase))
                movementType = "Adjustment";

            var qty = command.Quantity;
            var unitPrice = command.UnitPrice >= 0 ? command.UnitPrice : item.PurchasePrice;
            var totalValue = command.TotalValue > 0 ? command.TotalValue : Math.Abs(qty) * unitPrice;
            var remarks = command.Remarks;
            if (!string.IsNullOrWhiteSpace(command.AdjustmentType))
                remarks = string.IsNullOrWhiteSpace(remarks)
                    ? $"AdjustmentType={command.AdjustmentType}"
                    : $"{remarks}; AdjustmentType={command.AdjustmentType}";

            if (movementType.Equals("In", StringComparison.OrdinalIgnoreCase))
            {
                item.CurrentStock += Math.Abs(qty);
                if (command.WarehouseId.HasValue)
                    await AdjustWarehouseBalanceAsync(tenantId, command.ItemId, command.WarehouseId.Value, Math.Abs(qty), unitPrice, cancellationToken);
            }
            else if (movementType.Equals("Out", StringComparison.OrdinalIgnoreCase))
            {
                var outQty = Math.Abs(qty);
                if (item.CurrentStock < outQty)
                    throw new InvalidOperationException("Insufficient stock for this item.");
                item.CurrentStock -= outQty;
                if (command.WarehouseId.HasValue)
                    await AdjustWarehouseBalanceAsync(tenantId, command.ItemId, command.WarehouseId.Value, -outQty, unitPrice, cancellationToken);
            }
            else if (movementType.Equals("Adjustment", StringComparison.OrdinalIgnoreCase))
            {
                item.CurrentStock += qty;
                if (item.CurrentStock < 0)
                    throw new InvalidOperationException("Adjustment would make stock negative.");
                if (command.WarehouseId.HasValue)
                    await AdjustWarehouseBalanceAsync(tenantId, command.ItemId, command.WarehouseId.Value, qty, unitPrice, cancellationToken);
            }
            else if (movementType.Equals("Transfer", StringComparison.OrdinalIgnoreCase))
            {
                if (!command.FromWarehouseId.HasValue || !command.ToWarehouseId.HasValue)
                    throw new InvalidOperationException("Transfer requires fromWarehouseId and toWarehouseId.");
                if (command.FromWarehouseId == command.ToWarehouseId)
                    throw new InvalidOperationException("Source and destination warehouses must differ.");

                var fromWh = await _db.Warehouses.AnyAsync(w => w.Id == command.FromWarehouseId && w.TenantId == tenantId, cancellationToken);
                var toWh = await _db.Warehouses.AnyAsync(w => w.Id == command.ToWarehouseId && w.TenantId == tenantId, cancellationToken);
                if (!fromWh || !toWh)
                    throw new InvalidOperationException("Source or destination warehouse not found.");

                var transferQty = Math.Abs(qty);
                var fromBalance = await _db.StockBalances.FirstOrDefaultAsync(b =>
                    b.TenantId == tenantId && b.ItemId == command.ItemId && b.WarehouseId == command.FromWarehouseId && !b.IsDeleted, cancellationToken);
                if (fromBalance == null || fromBalance.QuantityOnHand < transferQty)
                {
                    if (item.CurrentStock < transferQty)
                        throw new InvalidOperationException("Insufficient stock for transfer.");
                }
                else
                {
                    fromBalance.QuantityOnHand -= transferQty;
                    fromBalance.QuantityAvailable = fromBalance.QuantityOnHand - fromBalance.QuantityReserved;
                    fromBalance.TotalValue = fromBalance.QuantityOnHand * fromBalance.AverageUnitCost;
                    fromBalance.LastUpdated = DateTime.UtcNow;
                    fromBalance.UpdatedAt = DateTime.UtcNow;
                }

                await AdjustWarehouseBalanceAsync(tenantId, command.ItemId, command.ToWarehouseId.Value, transferQty, unitPrice, cancellationToken);
                qty = transferQty;
            }
            else
            {
                throw new InvalidOperationException("MovementType must be In, Out, Adjustment, WriteOff, or Transfer.");
            }

            item.UpdatedAt = DateTime.UtcNow;
            var movement = await CreateMovementAsync(
                tenantId,
                item.Id,
                command.WarehouseId ?? command.ToWarehouseId ?? command.FromWarehouseId,
                qty,
                unitPrice,
                totalValue,
                movementType,
                command.MovementDate,
                command.ReferenceType ?? (movementType.Equals("Transfer", StringComparison.OrdinalIgnoreCase) ? "Transfer" : null),
                command.ReferenceId,
                command.ReferenceNumber,
                remarks,
                command.FromWarehouseId,
                command.ToWarehouseId,
                cancellationToken);

            await _db.SaveChangesAsync(cancellationToken);
            return movement;
        }

        public async Task<StockMovement> StageInboundAsync(
            Guid itemId,
            decimal quantity,
            decimal unitPrice,
            Guid? warehouseId,
            string referenceType,
            Guid? referenceId,
            string? referenceNumber,
            string? remarks,
            CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var item = await _db.Items.FirstOrDefaultAsync(i => i.Id == itemId && i.TenantId == tenantId && !i.IsDeleted, cancellationToken);
            if (item == null)
                throw new InvalidOperationException("Item not found.");

            item.CurrentStock += quantity;
            item.UpdatedAt = DateTime.UtcNow;
            if (warehouseId.HasValue)
                await AdjustWarehouseBalanceAsync(tenantId, itemId, warehouseId.Value, quantity, unitPrice, cancellationToken);

            var movement = await CreateMovementAsync(
                tenantId,
                itemId,
                warehouseId,
                quantity,
                unitPrice,
                quantity * unitPrice,
                "In",
                DateTime.UtcNow.Date,
                referenceType,
                referenceId,
                referenceNumber,
                remarks,
                null,
                null,
                cancellationToken);

            await _db.SaveChangesAsync(cancellationToken);
            return movement;
        }

        public async Task<StockMovement> StageOutboundAsync(
            Guid itemId,
            decimal quantity,
            decimal unitCost,
            Guid? warehouseId,
            string referenceType,
            Guid? referenceId,
            string? referenceNumber,
            string? remarks,
            CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var outQty = Math.Abs(quantity);
            if (outQty <= 0)
                throw new InvalidOperationException("Quantity cannot be zero.");

            var item = await _db.Items.FirstOrDefaultAsync(i => i.Id == itemId && i.TenantId == tenantId && !i.IsDeleted, cancellationToken);
            if (item == null)
                throw new InvalidOperationException("Item not found.");

            if (item.CurrentStock < outQty)
                throw new InvalidOperationException("Insufficient stock for this item.");

            StockBalance? balance = null;
            if (warehouseId.HasValue)
            {
                balance = await _db.StockBalances.FirstOrDefaultAsync(b =>
                    b.TenantId == tenantId && b.ItemId == itemId && b.WarehouseId == warehouseId.Value && !b.IsDeleted, cancellationToken);
            }

            var cost = unitCost > 0 ? unitCost : (balance != null && balance.AverageUnitCost > 0 ? balance.AverageUnitCost : item.PurchasePrice);
            item.CurrentStock -= outQty;
            item.UpdatedAt = DateTime.UtcNow;
            if (warehouseId.HasValue)
                await AdjustWarehouseBalanceAsync(tenantId, itemId, warehouseId.Value, -outQty, cost, cancellationToken);

            var movement = await CreateMovementAsync(
                tenantId,
                itemId,
                warehouseId,
                outQty,
                cost,
                outQty * cost,
                "Out",
                DateTime.UtcNow.Date,
                referenceType,
                referenceId,
                referenceNumber,
                remarks,
                null,
                null,
                cancellationToken);

            await _db.SaveChangesAsync(cancellationToken);
            return movement;
        }

        private async Task<StockMovement> CreateMovementAsync(
            Guid tenantId,
            Guid itemId,
            Guid? warehouseId,
            decimal qty,
            decimal unitPrice,
            decimal totalValue,
            string movementType,
            DateTime movementDate,
            string? referenceType,
            Guid? referenceId,
            string? referenceNumber,
            string? remarks,
            Guid? fromWarehouseId,
            Guid? toWarehouseId,
            CancellationToken cancellationToken)
        {
            var movement = new StockMovement
            {
                TenantId = tenantId,
                MovementNumber = await _numbers.NextAsync("StockMovement", "MV-", 5, cancellationToken),
                MovementDate = movementDate.Kind == DateTimeKind.Unspecified
                    ? DateTime.SpecifyKind(movementDate, DateTimeKind.Utc)
                    : movementDate.Kind == DateTimeKind.Utc
                        ? movementDate
                        : movementDate.ToUniversalTime(),
                MovementType = movementType,
                ItemId = itemId,
                WarehouseId = warehouseId,
                Quantity = qty,
                UnitPrice = unitPrice,
                TotalValue = totalValue,
                ReferenceType = referenceType,
                ReferenceId = referenceId,
                ReferenceNumber = referenceNumber,
                Remarks = remarks,
                FromWarehouseId = fromWarehouseId,
                ToWarehouseId = toWarehouseId,
                CreatedAt = DateTime.UtcNow
            };
            _db.StockMovements.Add(movement);
            return movement;
        }

        private async Task AdjustWarehouseBalanceAsync(
            Guid tenantId,
            Guid itemId,
            Guid warehouseId,
            decimal deltaQty,
            decimal unitPrice,
            CancellationToken cancellationToken)
        {
            var balance = await _db.StockBalances.FirstOrDefaultAsync(b =>
                b.TenantId == tenantId && b.ItemId == itemId && b.WarehouseId == warehouseId && !b.IsDeleted, cancellationToken);

            if (balance == null)
            {
                if (deltaQty < 0)
                    return;

                _db.StockBalances.Add(new StockBalance
                {
                    TenantId = tenantId,
                    ItemId = itemId,
                    WarehouseId = warehouseId,
                    QuantityOnHand = deltaQty,
                    QuantityReserved = 0,
                    QuantityAvailable = deltaQty,
                    AverageUnitCost = unitPrice,
                    TotalValue = deltaQty * unitPrice,
                    LastUpdated = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                });
                return;
            }

            if (deltaQty > 0)
            {
                var newQty = balance.QuantityOnHand + deltaQty;
                var newTotalValue = balance.TotalValue + (deltaQty * unitPrice);
                balance.QuantityOnHand = newQty;
                balance.AverageUnitCost = newQty > 0 ? (newTotalValue / newQty) : unitPrice;
                balance.TotalValue = newTotalValue;
            }
            else
            {
                balance.QuantityOnHand += deltaQty;
                if (balance.QuantityOnHand < 0)
                    balance.QuantityOnHand = 0;
                balance.TotalValue = balance.QuantityOnHand * balance.AverageUnitCost;
            }

            balance.QuantityAvailable = balance.QuantityOnHand - balance.QuantityReserved;
            balance.LastUpdated = DateTime.UtcNow;
            balance.UpdatedAt = DateTime.UtcNow;
        }

        public async Task<LandedCostAllocationResult> AllocateLandedCostAsync(
            AllocateLandedCostCommand command,
            CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            int updatedCount = 0;
            decimal totalAllocated = 0m;

            foreach (var alloc in command.Allocations)
            {
                var balance = await _db.StockBalances.FirstOrDefaultAsync(
                    b => b.TenantId == tenantId && b.ItemId == alloc.ItemId && b.WarehouseId == alloc.WarehouseId && !b.IsDeleted,
                    cancellationToken);

                if (balance != null && balance.QuantityOnHand > 0)
                {
                    balance.TotalValue += alloc.AllocatedAmount;
                    balance.AverageUnitCost = balance.TotalValue / balance.QuantityOnHand;
                    balance.LastUpdated = DateTime.UtcNow;
                    balance.UpdatedAt = DateTime.UtcNow;
                    updatedCount++;
                    totalAllocated += alloc.AllocatedAmount;
                }
            }

            JournalEntry? je = null;
            if (command.PostJournalEntry && _ledger != null && totalAllocated > 0)
            {
                je = await _ledger.PostLandedCostCapitalizationAsync(
                    totalAllocated,
                    command.ReferenceNumber,
                    command.Description,
                    cancellationToken);
            }

            await _db.SaveChangesAsync(cancellationToken);
            return new LandedCostAllocationResult(updatedCount, totalAllocated, je);
        }

        public async Task<InventoryValuationSummary> GetValuationSummaryAsync(
            Guid warehouseId,
            CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var balances = await _db.StockBalances
                .Where(b => b.TenantId == tenantId && b.WarehouseId == warehouseId && !b.IsDeleted && b.QuantityOnHand > 0)
                .ToListAsync(cancellationToken);

            var itemIds = balances.Select(b => b.ItemId).Distinct().ToList();
            var itemsDict = await _db.Items
                .Where(i => itemIds.Contains(i.Id))
                .ToDictionaryAsync(i => i.Id, cancellationToken);

            var items = balances.Select(b =>
            {
                itemsDict.TryGetValue(b.ItemId, out var itm);
                return new InventoryValuationItem(
                    b.ItemId,
                    itm?.ItemCode ?? string.Empty,
                    itm?.ItemName ?? string.Empty,
                    b.QuantityOnHand,
                    b.AverageUnitCost,
                    b.TotalValue);
            }).ToList();

            var distinctCount = items.Select(i => i.ItemId).Distinct().Count();
            var totalQty = items.Sum(i => i.QuantityOnHand);
            var totalVal = items.Sum(i => i.TotalValuation);

            return new InventoryValuationSummary(distinctCount, totalQty, totalVal, items);
        }
    }
}
