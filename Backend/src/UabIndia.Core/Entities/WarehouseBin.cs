using System;

namespace UabIndia.Core.Entities
{
    public class WarehouseBin : BaseEntity
    {
        public Guid WarehouseId { get; set; }
        public string BinCode { get; set; } = string.Empty; // e.g. "ZA-A01-R02-B04"
        public string ZoneCode { get; set; } = "Zone-A";
        public string AisleNumber { get; set; } = "Aisle-01";
        public string RackNumber { get; set; } = "Rack-01";
        public string ShelfLevel { get; set; } = "Level-1";
        public decimal MaxWeightCapacityKg { get; set; } = 1000m;
        public decimal CurrentWeightKg { get; set; } = 0;
        public decimal MaxVolumeCapacityCbm { get; set; } = 5m;
        public decimal CurrentVolumeCbm { get; set; } = 0;
        public string Status { get; set; } = "Available"; // Available, PartiallyOccupied, Full, Blocked
    }
}
