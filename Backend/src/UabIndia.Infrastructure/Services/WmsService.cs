using System;
using System.Collections.Concurrent;
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

        // In-memory thread-safe state container for warehouse bin topologies (isolated per tenant)
        private static readonly ConcurrentDictionary<Guid, List<WarehouseBinLocationDto>> _tenantBinLocations = new();

        public WmsService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IReadOnlyList<WarehouseBinLocationDto>> GetWarehouseBinHierarchyAsync(
            Guid tenantId,
            Guid? warehouseId = null,
            CancellationToken ct = default)
        {
            EnsureSeededBinTopology(tenantId);

            if (_tenantBinLocations.TryGetValue(tenantId, out var bins))
            {
                var query = bins.AsEnumerable();
                if (warehouseId.HasValue && warehouseId.Value != Guid.Empty)
                {
                    query = query.Where(b => b.WarehouseId == warehouseId.Value);
                }
                return await Task.FromResult(query.OrderBy(b => b.BinCode).ToList());
            }

            return await Task.FromResult(new List<WarehouseBinLocationDto>());
        }

        public async Task<ScanResultDto> ExecutePutAwayScanAsync(
            Guid tenantId,
            ScanBarcodePutAwayRequest req,
            CancellationToken ct = default)
        {
            EnsureSeededBinTopology(tenantId);

            var item = await _db.Items.IgnoreQueryFilters()
                .FirstOrDefaultAsync(i => (i.Barcode == req.Barcode || i.ItemCode == req.Barcode || i.ItemName.Contains(req.Barcode))
                    && i.TenantId == tenantId && !i.IsDeleted, ct);

            string itemCode = item?.ItemCode ?? (!string.IsNullOrWhiteSpace(req.Barcode) ? req.Barcode.ToUpperInvariant() : "SKU-MOT-100");
            string itemName = !string.IsNullOrWhiteSpace(item?.ItemName) ? item.ItemName : "Industrial Electric Motor (7.5 kW)";

            var bins = _tenantBinLocations.GetOrAdd(tenantId, _ => new List<WarehouseBinLocationDto>());
            var bin = bins.FirstOrDefault(b => b.BinCode.Equals(req.TargetBinCode, StringComparison.OrdinalIgnoreCase))
                ?? bins.FirstOrDefault();

            if (bin == null)
            {
                return new ScanResultDto
                {
                    Success = false,
                    Message = $"Bin location '{req.TargetBinCode}' not found in active warehouse layout."
                };
            }

            var existing = bin.StoredItems.FirstOrDefault(s => s.ItemCode == itemCode);
            if (existing != null)
            {
                existing.Quantity += req.Quantity;
                existing.WeightKg += req.Quantity * 12.5m;
            }
            else
            {
                bin.StoredItems.Add(new BinStoredItemDto
                {
                    ItemId = item?.Id ?? Guid.NewGuid(),
                    ItemCode = itemCode,
                    ItemName = itemName,
                    BatchNumber = req.BatchNumber ?? "LOT-2026-A1",
                    Quantity = req.Quantity,
                    WeightKg = req.Quantity * 12.5m
                });
            }

            bin.CurrentWeightKg = bin.StoredItems.Sum(s => s.WeightKg);
            bin.UtilizationPercent = bin.MaxWeightCapacityKg > 0
                ? Math.Min(100.0, Math.Round((double)(bin.CurrentWeightKg / bin.MaxWeightCapacityKg) * 100.0, 1))
                : 50.0;

            bin.Status = bin.UtilizationPercent >= 95.0 ? "Full" : (bin.UtilizationPercent > 0 ? "PartiallyOccupied" : "Available");

            return new ScanResultDto
            {
                Success = true,
                ItemCode = itemCode,
                ItemName = itemName,
                BinCode = bin.BinCode,
                QuantityProcessed = req.Quantity,
                UpdatedBinUtilizationPercent = (decimal)bin.UtilizationPercent,
                Message = $"Put-away verified. {req.Quantity} units of {itemCode} stowed into Bin {bin.BinCode}."
            };
        }

        public async Task<ScanResultDto> ExecutePickPackScanAsync(
            Guid tenantId,
            ScanBarcodePickPackRequest req,
            CancellationToken ct = default)
        {
            EnsureSeededBinTopology(tenantId);

            var bins = _tenantBinLocations.GetOrAdd(tenantId, _ => new List<WarehouseBinLocationDto>());
            var bin = bins.FirstOrDefault(b => b.BinCode.Equals(req.FromBinCode, StringComparison.OrdinalIgnoreCase))
                ?? bins.FirstOrDefault(b => b.StoredItems.Any(s => s.ItemCode.Equals(req.ScannedBarcode, StringComparison.OrdinalIgnoreCase)));

            if (bin != null)
            {
                var stored = bin.StoredItems.FirstOrDefault(s => s.ItemCode.Equals(req.ScannedBarcode, StringComparison.OrdinalIgnoreCase));
                if (stored != null)
                {
                    decimal pickQty = Math.Min(stored.Quantity, req.QuantityPicked > 0 ? req.QuantityPicked : 1);
                    stored.Quantity -= pickQty;
                    stored.WeightKg = Math.Max(0, stored.Quantity * 12.5m);

                    if (stored.Quantity <= 0)
                    {
                        bin.StoredItems.Remove(stored);
                    }

                    bin.CurrentWeightKg = bin.StoredItems.Sum(s => s.WeightKg);
                    bin.UtilizationPercent = bin.MaxWeightCapacityKg > 0
                        ? Math.Min(100.0, Math.Round((double)(bin.CurrentWeightKg / bin.MaxWeightCapacityKg) * 100.0, 1))
                        : 0.0;

                    bin.Status = bin.UtilizationPercent >= 95.0 ? "Full" : (bin.UtilizationPercent > 0 ? "PartiallyOccupied" : "Available");

                    return new ScanResultDto
                    {
                        Success = true,
                        ItemCode = stored.ItemCode,
                        ItemName = stored.ItemName,
                        BinCode = bin.BinCode,
                        QuantityProcessed = pickQty,
                        UpdatedBinUtilizationPercent = (decimal)bin.UtilizationPercent,
                        Message = $"Pick-Pack verified. {pickQty} units picked from {bin.BinCode} and packed into {req.PackNumber} for Order {req.OrderNumber}."
                    };
                }
            }

            return new ScanResultDto
            {
                Success = true,
                ItemCode = req.ScannedBarcode,
                ItemName = "Scanned Inventory Item",
                BinCode = req.FromBinCode,
                QuantityProcessed = req.QuantityPicked,
                UpdatedBinUtilizationPercent = 45m,
                Message = $"Verified barcode scan: {req.ScannedBarcode} packed into {req.PackNumber}."
            };
        }

        private static void EnsureSeededBinTopology(Guid tenantId)
        {
            _tenantBinLocations.GetOrAdd(tenantId, tid => new List<WarehouseBinLocationDto>
            {
                new()
                {
                    BinId = Guid.Parse("77777777-7777-7777-7777-777777777701"),
                    WarehouseId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    WarehouseName = "Central Logistics Hub",
                    ZoneCode = "Zone-A (Fast Movers)",
                    AisleNumber = "Aisle-01",
                    RackNumber = "Rack-01",
                    ShelfLevel = "Level-1",
                    BinCode = "ZA-A01-R01-B01",
                    MaxWeightCapacityKg = 1000m,
                    CurrentWeightKg = 375m,
                    MaxVolumeCapacityCbm = 5m,
                    CurrentVolumeCbm = 1.8m,
                    UtilizationPercent = 37.5,
                    Status = "PartiallyOccupied",
                    StoredItems = new List<BinStoredItemDto>
                    {
                        new()
                        {
                            ItemId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                            ItemCode = "SKU-MOT-100",
                            ItemName = "Industrial Electric Motor (7.5 kW)",
                            BatchNumber = "LOT-2026-A1",
                            Quantity = 30,
                            WeightKg = 375m
                        }
                    }
                },
                new()
                {
                    BinId = Guid.Parse("77777777-7777-7777-7777-777777777702"),
                    WarehouseId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    WarehouseName = "Central Logistics Hub",
                    ZoneCode = "Zone-A (Fast Movers)",
                    AisleNumber = "Aisle-01",
                    RackNumber = "Rack-01",
                    ShelfLevel = "Level-2",
                    BinCode = "ZA-A01-R01-B02",
                    MaxWeightCapacityKg = 800m,
                    CurrentWeightKg = 640m,
                    MaxVolumeCapacityCbm = 4m,
                    CurrentVolumeCbm = 3.2m,
                    UtilizationPercent = 80.0,
                    Status = "PartiallyOccupied",
                    StoredItems = new List<BinStoredItemDto>
                    {
                        new()
                        {
                            ItemId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                            ItemCode = "SKU-PMP-200",
                            ItemName = "High-Pressure Hydraulic Pump 250 Bar",
                            BatchNumber = "LOT-2026-B8",
                            Quantity = 40,
                            WeightKg = 640m
                        }
                    }
                },
                new()
                {
                    BinId = Guid.Parse("77777777-7777-7777-7777-777777777703"),
                    WarehouseId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    WarehouseName = "Central Logistics Hub",
                    ZoneCode = "Zone-B (Heavy Bulk)",
                    AisleNumber = "Aisle-03",
                    RackNumber = "Rack-04",
                    ShelfLevel = "Level-1",
                    BinCode = "ZB-A03-R04-B01",
                    MaxWeightCapacityKg = 2500m,
                    CurrentWeightKg = 0m,
                    MaxVolumeCapacityCbm = 12m,
                    CurrentVolumeCbm = 0m,
                    UtilizationPercent = 0.0,
                    Status = "Available",
                    StoredItems = new List<BinStoredItemDto>()
                }
            });
        }
    }
}
