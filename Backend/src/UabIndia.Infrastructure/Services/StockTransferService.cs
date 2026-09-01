using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class StockTransferService : IStockTransferService
    {
        private readonly ApplicationDbContext _db;

        public StockTransferService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<StockTransferResult> CreateAndDispatchTransferAsync(StockTransferRequest request, CancellationToken ct = default)
        {
            if (request.Quantity <= 0)
            {
                return new StockTransferResult { Success = false, ErrorMessage = "Transfer quantity must be greater than zero." };
            }

            if (request.FromWarehouseId == request.ToWarehouseId)
            {
                return new StockTransferResult { Success = false, ErrorMessage = "Source and destination warehouses cannot be the same." };
            }

            var item = await _db.Items.IgnoreQueryFilters()
                .FirstOrDefaultAsync(i => i.Id == request.ItemId && i.TenantId == request.TenantId && !i.IsDeleted, ct);

            if (item == null)
            {
                return new StockTransferResult { Success = false, ErrorMessage = "Item not found." };
            }

            var fromWarehouse = await _db.Warehouses.IgnoreQueryFilters()
                .FirstOrDefaultAsync(w => w.Id == request.FromWarehouseId && w.TenantId == request.TenantId && !w.IsDeleted, ct);

            var toWarehouse = await _db.Warehouses.IgnoreQueryFilters()
                .FirstOrDefaultAsync(w => w.Id == request.ToWarehouseId && w.TenantId == request.TenantId && !w.IsDeleted, ct);

            if (fromWarehouse == null || toWarehouse == null)
            {
                return new StockTransferResult { Success = false, ErrorMessage = "One or both warehouses do not exist." };
            }

            // Find source stock balance
            var sourceBalance = await _db.StockBalances.IgnoreQueryFilters()
                .FirstOrDefaultAsync(sb => sb.ItemId == request.ItemId && sb.WarehouseId == request.FromWarehouseId && sb.TenantId == request.TenantId && !sb.IsDeleted, ct);

            if (sourceBalance == null || sourceBalance.QuantityAvailable < request.Quantity)
            {
                return new StockTransferResult
                {
                    Success = false,
                    ErrorMessage = $"Insufficient stock at {fromWarehouse.WarehouseName}. Available: {sourceBalance?.QuantityAvailable ?? 0}, Requested: {request.Quantity}"
                };
            }

            // Deduct stock from source warehouse
            sourceBalance.QuantityOnHand -= request.Quantity;
            sourceBalance.QuantityAvailable -= request.Quantity;
            sourceBalance.TotalValue = sourceBalance.QuantityOnHand * sourceBalance.AverageUnitCost;
            sourceBalance.LastUpdated = DateTime.UtcNow;

            // Generate transfer number
            var transferNumber = $"ST-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}"[..20].ToUpperInvariant();

            var movement = new StockMovement
            {
                TenantId = request.TenantId,
                CompanyId = request.CompanyId ?? item.CompanyId,
                MovementNumber = transferNumber,
                MovementDate = DateTime.UtcNow,
                MovementType = "Transfer",
                ItemId = request.ItemId,
                WarehouseId = request.FromWarehouseId,
                FromWarehouseId = request.FromWarehouseId,
                ToWarehouseId = request.ToWarehouseId,
                Quantity = request.Quantity,
                UnitPrice = item.PurchasePrice,
                TotalValue = request.Quantity * item.PurchasePrice,
                ReferenceType = "Transfer",
                ReferenceNumber = transferNumber,
                Remarks = string.IsNullOrWhiteSpace(request.Notes) ? $"Transfer from {fromWarehouse.WarehouseName} to {toWarehouse.WarehouseName}" : request.Notes
            };

            _db.StockMovements.Add(movement);
            await _db.SaveChangesAsync(ct);

            return new StockTransferResult
            {
                Success = true,
                MovementId = movement.Id,
                TransferNumber = transferNumber,
                FromWarehouseName = fromWarehouse.WarehouseName,
                ToWarehouseName = toWarehouse.WarehouseName,
                ItemName = item.ItemName,
                Quantity = request.Quantity,
                Status = "InTransit"
            };
        }

        public async Task<StockTransferResult> ReceiveTransferAsync(Guid movementId, decimal? receivedQuantity = null, CancellationToken ct = default)
        {
            var movement = await _db.StockMovements.IgnoreQueryFilters()
                .Include(m => m.Item)
                .Include(m => m.Warehouse)
                .FirstOrDefaultAsync(m => m.Id == movementId && !m.IsDeleted, ct);

            if (movement == null)
            {
                return new StockTransferResult { Success = false, ErrorMessage = "Transfer movement not found." };
            }

            if (!movement.ToWarehouseId.HasValue)
            {
                return new StockTransferResult { Success = false, ErrorMessage = "Stock movement is not a valid warehouse transfer." };
            }

            var qtyToReceive = receivedQuantity.HasValue && receivedQuantity.Value > 0 ? receivedQuantity.Value : movement.Quantity;
            var destWarehouseId = movement.ToWarehouseId.Value;

            var toWarehouse = await _db.Warehouses.IgnoreQueryFilters()
                .FirstOrDefaultAsync(w => w.Id == destWarehouseId && !w.IsDeleted, ct);

            var destBalance = await _db.StockBalances.IgnoreQueryFilters()
                .FirstOrDefaultAsync(sb => sb.ItemId == movement.ItemId && sb.WarehouseId == destWarehouseId && sb.TenantId == movement.TenantId && !sb.IsDeleted, ct);

            if (destBalance == null)
            {
                destBalance = new StockBalance
                {
                    TenantId = movement.TenantId,
                    CompanyId = movement.CompanyId,
                    ItemId = movement.ItemId,
                    WarehouseId = destWarehouseId,
                    QuantityOnHand = qtyToReceive,
                    QuantityAvailable = qtyToReceive,
                    QuantityReserved = 0,
                    AverageUnitCost = movement.UnitPrice,
                    TotalValue = qtyToReceive * movement.UnitPrice,
                    LastUpdated = DateTime.UtcNow
                };
                _db.StockBalances.Add(destBalance);
            }
            else
            {
                destBalance.QuantityOnHand += qtyToReceive;
                destBalance.QuantityAvailable += qtyToReceive;
                destBalance.TotalValue = destBalance.QuantityOnHand * destBalance.AverageUnitCost;
                destBalance.LastUpdated = DateTime.UtcNow;
            }

            movement.Remarks += $" | Received at {toWarehouse?.WarehouseName ?? "Destination"} on {DateTime.UtcNow:yyyy-MM-dd HH:mm}";
            await _db.SaveChangesAsync(ct);

            return new StockTransferResult
            {
                Success = true,
                MovementId = movement.Id,
                TransferNumber = movement.MovementNumber,
                FromWarehouseName = movement.Warehouse?.WarehouseName ?? "Source Warehouse",
                ToWarehouseName = toWarehouse?.WarehouseName ?? "Destination Warehouse",
                ItemName = movement.Item?.ItemName ?? "Item",
                Quantity = qtyToReceive,
                Status = "Completed"
            };
        }

        public async Task<IReadOnlyList<StockTransferSummary>> GetTransfersAsync(Guid tenantId, Guid? warehouseId = null, string? status = null, CancellationToken ct = default)
        {
            var query = _db.StockMovements.IgnoreQueryFilters()
                .Include(m => m.Item)
                .Include(m => m.Warehouse)
                .Where(m => m.TenantId == tenantId && !m.IsDeleted && m.MovementType == "Transfer");

            if (warehouseId.HasValue && warehouseId.Value != Guid.Empty)
            {
                query = query.Where(m => m.FromWarehouseId == warehouseId.Value || m.ToWarehouseId == warehouseId.Value);
            }

            var movements = await query.OrderByDescending(m => m.MovementDate).Take(100).ToListAsync(ct);
            var toWarehouseIds = movements.Where(m => m.ToWarehouseId.HasValue).Select(m => m.ToWarehouseId!.Value).Distinct().ToList();
            var toWarehouses = await _db.Warehouses.IgnoreQueryFilters()
                .Where(w => toWarehouseIds.Contains(w.Id))
                .ToDictionaryAsync(w => w.Id, w => w.WarehouseName, ct);

            return movements.Select(m => new StockTransferSummary
            {
                MovementId = m.Id,
                TransferNumber = m.MovementNumber,
                FromWarehouseId = m.FromWarehouseId ?? Guid.Empty,
                FromWarehouseName = m.Warehouse?.WarehouseName ?? "Source",
                ToWarehouseId = m.ToWarehouseId ?? Guid.Empty,
                ToWarehouseName = m.ToWarehouseId.HasValue && toWarehouses.TryGetValue(m.ToWarehouseId.Value, out var twName) ? twName : "Destination",
                ItemId = m.ItemId,
                ItemName = m.Item?.ItemName ?? "Item",
                Quantity = m.Quantity,
                Status = m.Remarks != null && m.Remarks.Contains("Received") ? "Completed" : "InTransit",
                TransferDate = m.MovementDate
            }).ToList();
        }
    }
}
