using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Enumeration for asset status lifecycle.
    /// </summary>
    public enum AssetStatus
    {
        New,
        InUse,
        UnderMaintenance,
        Idle,
        Disposed,
        Written_Off
    }

    /// <summary>
    /// Enumeration for asset categories.
    /// </summary>
    public enum AssetCategory
    {
        Furniture,
        Electronics,
        Machinery,
        Vehicles,
        Building,
        Software,
        Equipment,
        Other
    }

    /// <summary>
    /// Enumeration for depreciation methods.
    /// </summary>
    public enum DepreciationMethod
    {
        StraightLine,
        AcceleratedDepreciation,
        UnitOfProduction,
        DoubleDecliningBalance
    }

    /// <summary>
    /// Enumeration for maintenance request status.
    /// </summary>
    public enum MaintenanceStatus
    {
        Pending,
        InProgress,
        Completed,
        Deferred,
        Cancelled
    }

    /// <summary>
    /// Fixed Asset entity representing company assets.
    /// </summary>
    public class FixedAsset : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string AssetCode { get; set; } = string.Empty; // Unique asset code
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public AssetCategory Category { get; set; }
        public AssetStatus Status { get; set; }
        public string SerialNumber { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        
        // Financial Properties
        public decimal PurchaseValue { get; set; }
        public decimal CurrentValue { get; set; }
        public decimal SalvageValue { get; set; }
        public decimal AccumulatedDepreciation { get; set; }
        
        // Dates
        public DateTime PurchaseDate { get; set; }
        public DateTime DepreciationStartDate { get; set; }
        public int UsefulLifeYears { get; set; }
        public DateTime? DisposalDate { get; set; }
        
        // Depreciation
        public DepreciationMethod DepreciationMethod { get; set; }
        public decimal DepreciationRate { get; set; }
        
        // Assignment
        public Guid? AllocatedToEmployeeId { get; set; }
        public DateTime? AllocationDate { get; set; }
        public DateTime? DeallocationDate { get; set; }
        
        // Metadata
        public string Supplier { get; set; } = string.Empty;
        public string WarrantyInfo { get; set; } = string.Empty;
        public DateTime? WarrantyExpiryDate { get; set; }
        public bool IsUnderWarranty { get; set; }
        
        // Relationships
        public ICollection<AssetAllocation> Allocations { get; set; } = new List<AssetAllocation>();
        public ICollection<AssetDepreciation> DepreciationRecords { get; set; } = new List<AssetDepreciation>();
        public ICollection<AssetMaintenance> MaintenanceRecords { get; set; } = new List<AssetMaintenance>();
    }

    /// <summary>
    /// Asset Allocation tracking which employee is using which asset.
    /// </summary>
    public class AssetAllocation : BaseEntity
    {
        public Guid AssetId { get; set; }
        public Guid EmployeeId { get; set; }
        public DateTime AllocationDate { get; set; }
        public DateTime? DeallocationDate { get; set; }
        
        // Allocation Details
        public string Purpose { get; set; } = string.Empty;
        public string AllocationNotes { get; set; } = string.Empty;
        public string DeallocationReason { get; set; } = string.Empty;
        
        // Status
        public string Status { get; set; } = string.Empty; // Active, Returned, Lost, Damaged
        
        // Condition Tracking
        public string ConditionOnAllocation { get; set; } = string.Empty; // Good, Fair, Poor, Damaged
        public string ConditionOnDeallocation { get; set; } = string.Empty; // Good, Fair, Poor, Damaged
        public decimal? ConditionAssessmentValue { get; set; } // Percentage of original value
        
        // Relationships
        public FixedAsset Asset { get; set; } = null!;
    }

    /// <summary>
    /// Asset Depreciation tracking depreciation over time.
    /// </summary>
    public class AssetDepreciation : BaseEntity
    {
        public Guid AssetId { get; set; }
        public DateTime DepreciationPeriodStart { get; set; }
        public DateTime DepreciationPeriodEnd { get; set; }
        
        // Depreciation Calculation
        public decimal DepreciationAmount { get; set; }
        public decimal OpeningValue { get; set; }
        public decimal ClosingValue { get; set; }
        public decimal DepreciationPercent { get; set; }
        
        // Status
        public bool IsPosted { get; set; }
        public DateTime? PostedDate { get; set; }
        
        // Reference
        public string JournalEntryNumber { get; set; } = string.Empty;
        
        // Relationships
        public FixedAsset Asset { get; set; } = null!;
    }

    /// <summary>
    /// Asset Maintenance tracking maintenance history and preventive maintenance.
    /// </summary>
    public class AssetMaintenance : BaseEntity
    {
        public Guid AssetId { get; set; }
        public DateTime MaintenanceDate { get; set; }
        public DateTime? ScheduledDate { get; set; }
        
        // Maintenance Details
        public string MaintenanceType { get; set; } = string.Empty; // Preventive, Corrective, Emergency
        public string Description { get; set; } = string.Empty;
        public MaintenanceStatus Status { get; set; }
        
        // Cost Tracking
        public decimal MaintenanceCost { get; set; }
        public string VendorName { get; set; } = string.Empty;
        public string VendorContact { get; set; } = string.Empty;
        
        // Technician
        public string TechnicianName { get; set; } = string.Empty;
        public string TechnicianNotes { get; set; } = string.Empty;
        
        // Duration
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public decimal DurationHours { get; set; }
        
        // Next Maintenance
        public DateTime? NextMaintenanceDate { get; set; }
        public string MaintenanceFrequency { get; set; } = string.Empty; // Monthly, Quarterly, Yearly, Custom
        
        // Relationships
        public FixedAsset Asset { get; set; } = null!;
    }
}
