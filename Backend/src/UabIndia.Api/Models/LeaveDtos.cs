using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class CreateLeaveTypeDto
    {
        [Required]
        public string Code { get; set; } = string.Empty;
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; } = 0;
    }

    public class LeaveTypeDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public int DisplayOrder { get; set; }
    }

    public class CreateLeavePolicyDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsDefault { get; set; } = false;
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? DepartmentId { get; set; }
        [Required]
        public string Type { get; set; } = string.Empty;
        [Required]
        public decimal EntitlementPerYear { get; set; }
        public bool CarryForwardAllowed { get; set; }
        public decimal? MaxCarryForward { get; set; }
        public string AllocationFrequency { get; set; } = "Yearly";
        public bool EnableProration { get; set; } = true;
        public bool AutoAllocate { get; set; } = false;
        public string Status { get; set; } = "Active";
    }

    public class LeavePolicyDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsDefault { get; set; } = false;
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? DepartmentId { get; set; }
        public string Type { get; set; } = string.Empty;
        public decimal EntitlementPerYear { get; set; }
        public bool CarryForwardAllowed { get; set; }
        public decimal? MaxCarryForward { get; set; }
        public string AllocationFrequency { get; set; } = "Yearly";
        public bool EnableProration { get; set; } = true;
        public bool AutoAllocate { get; set; } = false;
        public string Status { get; set; } = "Active";
    }

    public class CreateLeaveRequestDto
    {
        [Required]
        public Guid EmployeeId { get; set; }
        [Required]
        public Guid LeavePolicyId { get; set; }
        [Required]
        public DateTime FromDate { get; set; }
        [Required]
        public DateTime ToDate { get; set; }
        [Required]
        public decimal Days { get; set; }
        public string Period { get; set; } = "FullDay";
        public string? Reason { get; set; }
    }

    public class LeaveRequestDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public Guid LeavePolicyId { get; set; }
        public string? LeavePolicyName { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public decimal Days { get; set; }
        public string Period { get; set; } = "FullDay";
        public string Status { get; set; } = "Pending";
        public Guid? ApprovedBy { get; set; }
        public string? ApprovedByName { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? Reason { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateLeavePolicyRuleDto
    {
        [Required]
        public string ApplicableGender { get; set; } = "All";
        [Required]
        public string EmploymentType { get; set; } = "All";
        public bool Encashable { get; set; }
        public bool CarryForwardAllowed { get; set; }
        public decimal? MaxCarryForward { get; set; }
    }

    public class LeavePolicyRuleDto
    {
        public Guid Id { get; set; }
        public Guid LeavePolicyId { get; set; }
        public string ApplicableGender { get; set; } = "All";
        public string EmploymentType { get; set; } = "All";
        public bool Encashable { get; set; }
        public bool CarryForwardAllowed { get; set; }
        public decimal? MaxCarryForward { get; set; }
    }

    public class LeaveBalanceDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public Guid LeavePolicyId { get; set; }
        public int Year { get; set; }
        public decimal Entitled { get; set; }
        public decimal Taken { get; set; }
        public decimal Balance { get; set; }
    }

    public class CreateHolidayDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public DateTime Date { get; set; }
        public string Type { get; set; } = "Public";
        public bool IsOptional { get; set; }
        public string? Description { get; set; }
    }

    public class HolidayDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Type { get; set; } = "Public";
        public bool IsOptional { get; set; }
        public string? Description { get; set; }
    }

    public class CreateLeaveAllocationDto
    {
        [Required]
        public Guid EmployeeId { get; set; }
        [Required]
        public Guid LeavePolicyId { get; set; }
        [Required]
        public int Year { get; set; }
        [Required]
        public decimal AllocatedDays { get; set; }
        [Required]
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public string AllocationReason { get; set; } = "Annual Allocation";
        public bool IsProrated { get; set; } = false;
        public decimal? CarryForwardDays { get; set; }
    }

    public class LeaveAllocationDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public Guid LeavePolicyId { get; set; }
        public int Year { get; set; }
        public decimal AllocatedDays { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public string AllocationReason { get; set; } = string.Empty;
        public bool IsProrated { get; set; }
        public decimal? CarryForwardDays { get; set; }
    }
}
