using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class BinStoredItemDto
    {
        public Guid ItemId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string BatchNumber { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal WeightKg { get; set; }
    }

    public class WarehouseBinLocationDto
    {
        public Guid BinId { get; set; }
        public Guid WarehouseId { get; set; }
        public string WarehouseName { get; set; } = string.Empty;
        public string ZoneCode { get; set; } = "Zone-A";
        public string AisleNumber { get; set; } = "Aisle-01";
        public string RackNumber { get; set; } = "Rack-01";
        public string ShelfLevel { get; set; } = "Level-1";
        public string BinCode { get; set; } = string.Empty; // e.g. "ZA-A01-R02-B04"
        public decimal MaxWeightCapacityKg { get; set; } = 1000m;
        public decimal CurrentWeightKg { get; set; }
        public decimal MaxVolumeCapacityCbm { get; set; } = 5m;
        public decimal CurrentVolumeCbm { get; set; }
        public double UtilizationPercent { get; set; }
        public string Status { get; set; } = "Available"; // Available, PartiallyOccupied, Full, Blocked
        public List<BinStoredItemDto> StoredItems { get; set; } = new();
    }

    public class ScanBarcodePutAwayRequest
    {
        public string Barcode { get; set; } = string.Empty;
        public Guid? WarehouseId { get; set; }
        public string TargetBinCode { get; set; } = string.Empty;
        public decimal Quantity { get; set; } = 1;
        public string? BatchNumber { get; set; }
        public string OperatorName { get; set; } = "Warehouse Operative";
    }

    public class ScanBarcodePickPackRequest
    {
        public string OrderNumber { get; set; } = string.Empty;
        public string ScannedBarcode { get; set; } = string.Empty;
        public string FromBinCode { get; set; } = string.Empty;
        public decimal QuantityPicked { get; set; } = 1;
        public string PackNumber { get; set; } = "BOX-01";
    }

    public class ScanResultDto
    {
        public bool Success { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string BinCode { get; set; } = string.Empty;
        public decimal QuantityProcessed { get; set; }
        public decimal UpdatedBinUtilizationPercent { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public interface IWmsService
    {
        Task<IReadOnlyList<WarehouseBinLocationDto>> GetWarehouseBinHierarchyAsync(
            Guid tenantId,
            Guid? warehouseId = null,
            CancellationToken ct = default);

        Task<ScanResultDto> ExecutePutAwayScanAsync(
            Guid tenantId,
            ScanBarcodePutAwayRequest req,
            CancellationToken ct = default);

        Task<ScanResultDto> ExecutePickPackScanAsync(
            Guid tenantId,
            ScanBarcodePickPackRequest req,
            CancellationToken ct = default);
    }
}
