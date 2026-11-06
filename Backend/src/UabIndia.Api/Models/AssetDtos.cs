using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    #region Fixed Asset DTOs

    public class CreateFixedAssetDto
    {
        [Required(ErrorMessage = "Asset name is required")]
        [StringLength(200, ErrorMessage = "Asset name cannot exceed 200 characters")]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Category is required")]
        public string Category { get; set; } = string.Empty;

        [Required(ErrorMessage = "Serial number is required")]
        [StringLength(100, ErrorMessage = "Serial number cannot exceed 100 characters")]
        public string SerialNumber { get; set; } = string.Empty;

        [StringLength(200, ErrorMessage = "Location cannot exceed 200 characters")]
        public string Location { get; set; } = string.Empty;

        [Required(ErrorMessage = "Purchase value is required")]
        [Range(0, double.MaxValue, ErrorMessage = "Purchase value must be positive")]
        public decimal PurchaseValue { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Salvage value cannot be negative")]
        public decimal SalvageValue { get; set; }

        [Required(ErrorMessage = "Purchase date is required")]
        public DateTime PurchaseDate { get; set; }

        [Required(ErrorMessage = "Depreciation start date is required")]
        public DateTime DepreciationStartDate { get; set; }

        [Required(ErrorMessage = "Useful life in years is required")]
        [Range(1, 100, ErrorMessage = "Useful life must be between 1 and 100 years")]
        public int UsefulLifeYears { get; set; }

        [Required(ErrorMessage = "Depreciation method is required")]
        public string DepreciationMethod { get; set; } = string.Empty;

        [Range(0, 100, ErrorMessage = "Depreciation rate must be between 0 and 100")]
        public decimal DepreciationRate { get; set; }

        [StringLength(100, ErrorMessage = "Supplier name cannot exceed 100 characters")]
        public string Supplier { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Warranty info cannot exceed 500 characters")]
        public string WarrantyInfo { get; set; } = string.Empty;

        public DateTime? WarrantyExpiryDate { get; set; }
    }

    public class UpdateFixedAssetDto
    {
        [StringLength(200, ErrorMessage = "Asset name cannot exceed 200 characters")]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string Description { get; set; } = string.Empty;

        [StringLength(200, ErrorMessage = "Location cannot exceed 200 characters")]
        public string Location { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        [Range(0, double.MaxValue, ErrorMessage = "Current value must be positive")]
        public decimal? CurrentValue { get; set; }

        [StringLength(500, ErrorMessage = "Warranty info cannot exceed 500 characters")]
        public string WarrantyInfo { get; set; } = string.Empty;

        public DateTime? WarrantyExpiryDate { get; set; }

        public DateTime? DisposalDate { get; set; }
    }

    public class FixedAssetDto
    {
        public Guid Id { get; set; }
        public string AssetCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public decimal PurchaseValue { get; set; }
        public decimal CurrentValue { get; set; }
        public decimal SalvageValue { get; set; }
        public decimal AccumulatedDepreciation { get; set; }
        public DateTime PurchaseDate { get; set; }
        public DateTime DepreciationStartDate { get; set; }
        public int UsefulLifeYears { get; set; }
        public DateTime? DisposalDate { get; set; }
        public string DepreciationMethod { get; set; } = string.Empty;
        public decimal DepreciationRate { get; set; }
        public Guid? AllocatedToEmployeeId { get; set; }
        public DateTime? AllocationDate { get; set; }
        public string Supplier { get; set; } = string.Empty;
        public string WarrantyInfo { get; set; } = string.Empty;
        public DateTime? WarrantyExpiryDate { get; set; }
        public bool IsUnderWarranty { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion

    #region Asset Allocation DTOs

    public class CreateAssetAllocationDto
    {
        [Required(ErrorMessage = "Asset ID is required")]
        public Guid AssetId { get; set; }

        [Required(ErrorMessage = "Employee ID is required")]
        public Guid EmployeeId { get; set; }

        [Required(ErrorMessage = "Allocation date is required")]
        public DateTime AllocationDate { get; set; }

        [StringLength(500, ErrorMessage = "Purpose cannot exceed 500 characters")]
        public string Purpose { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Allocation notes cannot exceed 1000 characters")]
        public string AllocationNotes { get; set; } = string.Empty;

        [Required(ErrorMessage = "Asset condition is required")]
        public string ConditionOnAllocation { get; set; } = string.Empty;
    }

    public class UpdateAssetAllocationDto
    {
        public DateTime? DeallocationDate { get; set; }

        [StringLength(500, ErrorMessage = "Deallocation reason cannot exceed 500 characters")]
        public string DeallocationReason { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public string ConditionOnDeallocation { get; set; } = string.Empty;

        [Range(0, 100, ErrorMessage = "Condition assessment value must be between 0 and 100")]
        public decimal? ConditionAssessmentValue { get; set; }
    }

    public class AssetAllocationDto
    {
        public Guid Id { get; set; }
        public Guid AssetId { get; set; }
        public Guid EmployeeId { get; set; }
        public DateTime AllocationDate { get; set; }
        public DateTime? DeallocationDate { get; set; }
        public string Purpose { get; set; } = string.Empty;
        public string AllocationNotes { get; set; } = string.Empty;
        public string DeallocationReason { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string ConditionOnAllocation { get; set; } = string.Empty;
        public string ConditionOnDeallocation { get; set; } = string.Empty;
        public decimal? ConditionAssessmentValue { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion

    #region Asset Depreciation DTOs

    public class CreateAssetDepreciationDto
    {
        [Required(ErrorMessage = "Asset ID is required")]
        public Guid AssetId { get; set; }

        [Required(ErrorMessage = "Depreciation period start is required")]
        public DateTime DepreciationPeriodStart { get; set; }

        [Required(ErrorMessage = "Depreciation period end is required")]
        public DateTime DepreciationPeriodEnd { get; set; }

        [Required(ErrorMessage = "Depreciation amount is required")]
        [Range(0, double.MaxValue, ErrorMessage = "Depreciation amount must be positive")]
        public decimal DepreciationAmount { get; set; }

        [Required(ErrorMessage = "Opening value is required")]
        [Range(0, double.MaxValue, ErrorMessage = "Opening value must be positive")]
        public decimal OpeningValue { get; set; }
    }

    public class AssetDepreciationDto
    {
        public Guid Id { get; set; }
        public Guid AssetId { get; set; }
        public DateTime DepreciationPeriodStart { get; set; }
        public DateTime DepreciationPeriodEnd { get; set; }
        public decimal DepreciationAmount { get; set; }
        public decimal OpeningValue { get; set; }
        public decimal ClosingValue { get; set; }
        public decimal DepreciationPercent { get; set; }
        public bool IsPosted { get; set; }
        public DateTime? PostedDate { get; set; }
        public string JournalEntryNumber { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    #endregion

    #region Asset Maintenance DTOs

    public class CreateAssetMaintenanceDto
    {
        [Required(ErrorMessage = "Asset ID is required")]
        public Guid AssetId { get; set; }

        [Required(ErrorMessage = "Maintenance date is required")]
        public DateTime MaintenanceDate { get; set; }

        [Required(ErrorMessage = "Maintenance type is required")]
        public string MaintenanceType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required")]
        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Maintenance cost is required")]
        [Range(0, double.MaxValue, ErrorMessage = "Maintenance cost must be positive")]
        public decimal MaintenanceCost { get; set; }

        [StringLength(100, ErrorMessage = "Vendor name cannot exceed 100 characters")]
        public string VendorName { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Technician name cannot exceed 100 characters")]
        public string TechnicianName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Start date/time is required")]
        public DateTime StartDateTime { get; set; }

        [Required(ErrorMessage = "End date/time is required")]
        public DateTime EndDateTime { get; set; }

        public string MaintenanceFrequency { get; set; } = string.Empty;

        public DateTime? NextMaintenanceDate { get; set; }

        [StringLength(500, ErrorMessage = "Technician notes cannot exceed 500 characters")]
        public string TechnicianNotes { get; set; } = string.Empty;
    }

    public class UpdateAssetMaintenanceDto
    {
        public string Status { get; set; } = string.Empty;

        [Range(0, double.MaxValue, ErrorMessage = "Maintenance cost must be positive")]
        public decimal? MaintenanceCost { get; set; }

        [StringLength(500, ErrorMessage = "Technician notes cannot exceed 500 characters")]
        public string TechnicianNotes { get; set; } = string.Empty;

        public DateTime? NextMaintenanceDate { get; set; }

        public DateTime? EndDateTime { get; set; }
    }

    public class AssetMaintenanceDto
    {
        public Guid Id { get; set; }
        public Guid AssetId { get; set; }
        public DateTime MaintenanceDate { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public string MaintenanceType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal MaintenanceCost { get; set; }
        public string VendorName { get; set; } = string.Empty;
        public string TechnicianName { get; set; } = string.Empty;
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public decimal DurationHours { get; set; }
        public DateTime? NextMaintenanceDate { get; set; }
        public string MaintenanceFrequency { get; set; } = string.Empty;
        public string TechnicianNotes { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    #endregion
}
