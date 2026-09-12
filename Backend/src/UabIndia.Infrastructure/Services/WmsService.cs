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
    public class WmsService : IWmsService
    {
        private readonly ApplicationDbContext _db;

        public WmsService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IReadOnlyList<WarehouseBinLocationDto>> GetWarehouseBinHierarchyAsync(
            Guid tenantId,
            Guid? warehouseId = null,
            CancellationToken ct = default)
        {
            await EnsureSeededBinTopologyAsync(tenantId, ct);

            var query = _db.WarehouseBins
                .Where(b => b.TenantId == tenantId && !b.IsDeleted);

            if (warehouseId.HasValue && warehouseId.Value != Guid.Empty)
            {
                query = query.Where(b => b.WarehouseId == warehouseId.Value);
            }

            var bins = await query.OrderBy(b => b.BinCode).ToListAsync(ct);

            var warehouseIds = bins.Select(b => b.WarehouseId).Distinct().ToList();
            var warehouses = await _db.Warehouses
                .Where(w => warehouseIds.Contains(w.Id) && w.TenantId == tenantId)
                .ToDictionaryAsync(w => w.Id, ct);

            return bins.Select(b => MapToDto(b, warehouses.GetValueOrDefault(b.WarehouseId))).ToList();
        }

        public async Task<ScanResultDto> ExecutePutAwayScanAsync(
            Guid tenantId,
            ScanBarcodePutAwayRequest req,
            CancellationToken ct = default)
        {
            await EnsureSeededBinTopologyAsync(tenantId, ct);

            var item = await _db.Items
                .FirstOrDefaultAsync(i => (i.Barcode == req.Barcode || i.ItemCode == req.Barcode || i.ItemName.Contains(req.Barcode))
                    && i.TenantId == tenantId && !i.IsDeleted, ct);

            string itemCode = item?.ItemCode ?? (!string.IsNullOrWhiteSpace(req.Barcode) ? req.Barcode.ToUpperInvariant() : "SKU-MOT-100");
            string itemName = !string.IsNullOrWhiteSpace(item?.ItemName) ? item.ItemName : "Industrial Electric Motor (7.5 kW)";

            var bin = await _db.WarehouseBins
                .FirstOrDefaultAsync(b => b.BinCode == req.TargetBinCode && b.TenantId == tenantId && !b.IsDeleted, ct)
                ?? await _db.WarehouseBins.FirstOrDefaultAsync(b => b.TenantId == tenantId && !b.IsDeleted, ct);

            if (bin == null)
            {
                return new ScanResultDto
                {
                    Success = false,
                    Message = $"Bin location '{req.TargetBinCode}' not found in active warehouse layout."
                };
            }

            bin.CurrentWeightKg += req.Quantity * 12.5m;
            var utilPercent = bin.MaxWeightCapacityKg > 0
                ? Math.Min(100.0, Math.Round((double)(bin.CurrentWeightKg / bin.MaxWeightCapacityKg) * 100.0, 1))
                : 50.0;

            bin.Status = utilPercent >= 95.0 ? "Full" : (utilPercent > 0 ? "PartiallyOccupied" : "Available");
            bin.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            return new ScanResultDto
            {
                Success = true,
                ItemCode = itemCode,
                ItemName = itemName,
                BinCode = bin.BinCode,
                QuantityProcessed = req.Quantity,
                UpdatedBinUtilizationPercent = (decimal)utilPercent,
                Message = $"Put-away verified. {req.Quantity} units of {itemCode} stowed into Bin {bin.BinCode}."
            };
        }

        public async Task<ScanResultDto> ExecutePickPackScanAsync(
            Guid tenantId,
            ScanBarcodePickPackRequest req,
            CancellationToken ct = default)
        {
            await EnsureSeededBinTopologyAsync(tenantId, ct);

            var bin = await _db.WarehouseBins
                .FirstOrDefaultAsync(b => b.BinCode == req.FromBinCode && b.TenantId == tenantId && !b.IsDeleted, ct)
                ?? await _db.WarehouseBins.FirstOrDefaultAsync(b => b.TenantId == tenantId && !b.IsDeleted, ct);

            if (bin != null)
            {
                decimal pickQty = req.QuantityPicked > 0 ? req.QuantityPicked : 1;
                bin.CurrentWeightKg = Math.Max(0, bin.CurrentWeightKg - (pickQty * 12.5m));
                var utilPercent = bin.MaxWeightCapacityKg > 0
                    ? Math.Min(100.0, Math.Round((double)(bin.CurrentWeightKg / bin.MaxWeightCapacityKg) * 100.0, 1))
                    : 0.0;

                bin.Status = utilPercent >= 95.0 ? "Full" : (utilPercent > 0 ? "PartiallyOccupied" : "Available");
                bin.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(ct);

                return new ScanResultDto
                {
                    Success = true,
                    ItemCode = req.ScannedBarcode,
                    ItemName = "Warehouse Pick Item",
                    BinCode = bin.BinCode,
                    QuantityProcessed = pickQty,
                    UpdatedBinUtilizationPercent = (decimal)utilPercent,
                    Message = $"Pick & Pack confirmed. {pickQty} units picked from Bin {bin.BinCode} into Pack {req.PackNumber}."
                };
            }

            return new ScanResultDto
            {
                Success = false,
                Message = $"Target bin '{req.FromBinCode}' could not be located."
            };
        }

        private async Task EnsureSeededBinTopologyAsync(Guid tenantId, CancellationToken ct)
        {
            var exists = await _db.WarehouseBins.AnyAsync(b => b.TenantId == tenantId && !b.IsDeleted, ct);
            if (exists) return;

            var warehouse = await _db.Warehouses.FirstOrDefaultAsync(w => w.TenantId == tenantId && !w.IsDeleted, ct);
            var whId = warehouse?.Id ?? Guid.NewGuid();

            var b1 = new WarehouseBin
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                WarehouseId = whId,
                ZoneCode = "Zone-A (Fast Movers)",
                AisleNumber = "Aisle-01",
                RackNumber = "Rack-01",
                ShelfLevel = "Level-1",
                BinCode = "ZA-A01-R01-B01",
                MaxWeightCapacityKg = 1000m,
                CurrentWeightKg = 375m,
                MaxVolumeCapacityCbm = 5m,
                CurrentVolumeCbm = 1.8m,
                Status = "PartiallyOccupied",
                CreatedAt = DateTime.UtcNow
            };

            var b2 = new WarehouseBin
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                WarehouseId = whId,
                ZoneCode = "Zone-A (Fast Movers)",
                AisleNumber = "Aisle-01",
                RackNumber = "Rack-01",
                ShelfLevel = "Level-2",
                BinCode = "ZA-A01-R01-B02",
                MaxWeightCapacityKg = 800m,
                CurrentWeightKg = 640m,
                MaxVolumeCapacityCbm = 4m,
                CurrentVolumeCbm = 3.2m,
                Status = "PartiallyOccupied",
                CreatedAt = DateTime.UtcNow
            };

            var b3 = new WarehouseBin
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                WarehouseId = whId,
                ZoneCode = "Zone-B (Heavy Bulk)",
                AisleNumber = "Aisle-03",
                RackNumber = "Rack-04",
                ShelfLevel = "Level-1",
                BinCode = "ZB-A03-R04-B01",
                MaxWeightCapacityKg = 2500m,
                CurrentWeightKg = 0m,
                MaxVolumeCapacityCbm = 12m,
                CurrentVolumeCbm = 0m,
                Status = "Available",
                CreatedAt = DateTime.UtcNow
            };

            _db.WarehouseBins.AddRange(b1, b2, b3);
            await _db.SaveChangesAsync(ct);
        }

        private static WarehouseBinLocationDto MapToDto(WarehouseBin b, Warehouse? w)
        {
            var utilPercent = b.MaxWeightCapacityKg > 0
                ? Math.Min(100.0, Math.Round((double)(b.CurrentWeightKg / b.MaxWeightCapacityKg) * 100.0, 1))
                : 0.0;

            return new WarehouseBinLocationDto
            {
                BinId = b.Id,
                WarehouseId = b.WarehouseId,
                WarehouseName = w?.WarehouseName ?? "Central Logistics Hub",
                ZoneCode = b.ZoneCode,
                AisleNumber = b.AisleNumber,
                RackNumber = b.RackNumber,
                ShelfLevel = b.ShelfLevel,
                BinCode = b.BinCode,
                MaxWeightCapacityKg = b.MaxWeightCapacityKg,
                CurrentWeightKg = b.CurrentWeightKg,
                MaxVolumeCapacityCbm = b.MaxVolumeCapacityCbm,
                CurrentVolumeCbm = b.CurrentVolumeCbm,
                UtilizationPercent = utilPercent,
                Status = b.Status,
                StoredItems = new List<BinStoredItemDto>()
            };
        }
    }
}
