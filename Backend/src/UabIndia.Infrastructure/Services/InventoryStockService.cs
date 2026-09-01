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

        public InventoryStockService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
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

            return await CreateMovementAsync(
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

            var cost = unitCost > 0 ? unitCost : item.PurchasePrice;
            item.CurrentStock -= outQty;
            item.UpdatedAt = DateTime.UtcNow;
            if (warehouseId.HasValue)
                await AdjustWarehouseBalanceAsync(tenantId, itemId, warehouseId.Value, -outQty, cost, cancellationToken);

            return await CreateMovementAsync(
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

            balance.QuantityOnHand += deltaQty;
            if (balance.QuantityOnHand < 0)
                balance.QuantityOnHand = 0;
            balance.QuantityAvailable = balance.QuantityOnHand - balance.QuantityReserved;
            if (deltaQty > 0 && unitPrice > 0)
                balance.AverageUnitCost = unitPrice;
            balance.TotalValue = balance.QuantityOnHand * balance.AverageUnitCost;
            balance.LastUpdated = DateTime.UtcNow;
            balance.UpdatedAt = DateTime.UtcNow;
        }
    }
}
