using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    public class WorkOrder : BaseEntity
    {
        public string WorkOrderNumber { get; set; } = string.Empty;
        public Guid ItemId { get; set; }
        public decimal TargetQuantity { get; set; } = 1;
        public decimal ProducedQuantity { get; set; } = 0;
        public decimal ScrappedQuantity { get; set; } = 0;
        public string Status { get; set; } = "Draft"; // Draft, Released, InProgress, QualityInspection, Completed, QualityRejected
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(7);
        public bool QualityInspectionPassed { get; set; } = false;
        public string? QualityNotes { get; set; }

        public ICollection<WorkOrderOperation> Operations { get; set; } = new List<WorkOrderOperation>();
    }

    public class WorkOrderOperation : BaseEntity
    {
        public Guid WorkOrderId { get; set; }
        public int Sequence { get; set; } = 10;
        public string OperationName { get; set; } = string.Empty;
        public string WorkstationName { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, InProgress, Completed
        public decimal PlannedHours { get; set; } = 1;
        public decimal ActualHours { get; set; } = 0;
        public string? OperatorName { get; set; }
        public DateTime? CompletedAt { get; set; }

        public WorkOrder? WorkOrder { get; set; }
    }

    public class BillOfMaterial : BaseEntity
    {
        public Guid ParentItemId { get; set; }
        public string BomCode { get; set; } = string.Empty;
        public string BomName { get; set; } = string.Empty;
        public string Revision { get; set; } = "1.0";
        public bool IsActive { get; set; } = true;

        public ICollection<BomItem> Items { get; set; } = new List<BomItem>();
    }

    public class BomItem : BaseEntity
    {
        public Guid BomId { get; set; }
        public Guid ComponentItemId { get; set; }
        public decimal Quantity { get; set; } = 1;
        public string UnitOfMeasure { get; set; } = "Nos";
        public decimal ScrapFactor { get; set; } = 0;

        public BillOfMaterial? Bom { get; set; }
    }

    public class FleetVehicle : BaseEntity
    {
        public string VehicleNumber { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; } = DateTime.UtcNow.Year;
        public string? Vin { get; set; }
        public Guid? AssetId { get; set; }
        public string Status { get; set; } = "Active"; // Active, InMaintenance, Decommissioned, Dispatched
        public string FuelType { get; set; } = "Diesel"; // Diesel, Petrol, Electric, CNG, Hybrid
        public decimal CurrentOdometer { get; set; } = 0;
        public Guid? AssignedDriverId { get; set; }
        public string? AssignedDriverName { get; set; }
        public DateTime? InsuranceExpiryDate { get; set; }
        public DateTime? NextServiceDate { get; set; }

        public ICollection<FleetMaintenance> Maintenances { get; set; } = new List<FleetMaintenance>();
        public ICollection<FleetFuelLog> FuelLogs { get; set; } = new List<FleetFuelLog>();
    }

    public class FleetMaintenance : BaseEntity
    {
        public Guid VehicleId { get; set; }
        public DateTime ServiceDate { get; set; } = DateTime.UtcNow;
        public string ServiceType { get; set; } = "Routine"; // Routine, Major, Breakdown, Tire, Brake, Battery
        public decimal Odometer { get; set; } = 0;
        public decimal Cost { get; set; } = 0;
        public string? VendorName { get; set; }
        public string? Notes { get; set; }
        public string Status { get; set; } = "Completed"; // Scheduled, InProgress, Completed

        public FleetVehicle? Vehicle { get; set; }
    }

    public class FleetFuelLog : BaseEntity
    {
        public Guid VehicleId { get; set; }
        public DateTime LogDate { get; set; } = DateTime.UtcNow;
        public decimal Odometer { get; set; } = 0;
        public decimal Liters { get; set; } = 0;
        public decimal TotalCost { get; set; } = 0;
        public string? FuelStation { get; set; }
        public string? ReceiptNumber { get; set; }

        public FleetVehicle? Vehicle { get; set; }
    }
}
