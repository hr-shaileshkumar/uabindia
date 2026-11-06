using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using UabIndia.Core.Entities;

namespace UabIndia.Api.Models
{
    #region Shift DTOs

    public class CreateShiftDto
    {
        [Required]
        [StringLength(100)]
        public string ShiftName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string ShiftCode { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }

        [Range(1, 24)]
        public decimal DurationHours { get; set; }

        [Range(0, 60)]
        public int GracePeriodMinutes { get; set; } = 15;

        [Range(0, 120)]
        public int BreakDurationMinutes { get; set; } = 60;

        [Required]
        public ShiftType ShiftType { get; set; }

        [StringLength(200)]
        public string? ApplicableDays { get; set; }

        public bool IsNightShift { get; set; }
        public bool AllowOvernightCrossMidnight { get; set; } = false;
        public int EarlyExitToleranceMinutes { get; set; } = 15;

        // Split Shift Slots
        public TimeSpan? SplitSlot1StartTime { get; set; }
        public TimeSpan? SplitSlot1EndTime { get; set; }
        public TimeSpan? SplitSlot2StartTime { get; set; }
        public TimeSpan? SplitSlot2EndTime { get; set; }

        // Flexi Shift Windows
        public bool IsFlexiShift { get; set; } = false;
        public TimeSpan? CoreStartTime { get; set; }
        public TimeSpan? CoreEndTime { get; set; }
        public TimeSpan? FlexiWindowStart { get; set; }
        public TimeSpan? FlexiWindowEnd { get; set; }

        // 24-Hour & On-Call Emergency
        public bool Is24HourShift { get; set; } = false;
        public int MandatoryRestHoursAfterShift { get; set; } = 24;
        public bool IsOnCallStandby { get; set; } = false;
        public decimal StandbyRateMultiplier { get; set; } = 0.5m;

        // Scoping & Multi-Company / Multi-Project
        public Guid? CountryId { get; set; }
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? OperationalLocationId { get; set; }

        [Range(0, 100)]
        public decimal NightShiftAllowance { get; set; }

        public bool IsActive { get; set; } = true;

        [Range(0, 1000)]
        public int MinEmployeesRequired { get; set; }

        [Range(0, 1000)]
        public int MaxEmployeesAllowed { get; set; }

        public Guid? DepartmentId { get; set; }
    }

    public class UpdateShiftDto
    {
        [Required]
        [StringLength(100)]
        public string ShiftName { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }

        [Range(1, 24)]
        public decimal DurationHours { get; set; }

        [Range(0, 60)]
        public int GracePeriodMinutes { get; set; } = 15;

        [Range(0, 120)]
        public int BreakDurationMinutes { get; set; }

        public bool IsNightShift { get; set; }
        public bool AllowOvernightCrossMidnight { get; set; } = false;
        public int EarlyExitToleranceMinutes { get; set; } = 15;

        // Split Shift Slots
        public TimeSpan? SplitSlot1StartTime { get; set; }
        public TimeSpan? SplitSlot1EndTime { get; set; }
        public TimeSpan? SplitSlot2StartTime { get; set; }
        public TimeSpan? SplitSlot2EndTime { get; set; }

        // Flexi Shift Windows
        public bool IsFlexiShift { get; set; } = false;
        public TimeSpan? CoreStartTime { get; set; }
        public TimeSpan? CoreEndTime { get; set; }
        public TimeSpan? FlexiWindowStart { get; set; }
        public TimeSpan? FlexiWindowEnd { get; set; }

        // 24-Hour & On-Call Emergency
        public bool Is24HourShift { get; set; } = false;
        public int MandatoryRestHoursAfterShift { get; set; } = 24;
        public bool IsOnCallStandby { get; set; } = false;
        public decimal StandbyRateMultiplier { get; set; } = 0.5m;

        // Scoping & Multi-Company / Multi-Project
        public Guid? CountryId { get; set; }
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? OperationalLocationId { get; set; }

        [Range(0, 100)]
        public decimal NightShiftAllowance { get; set; }

        public bool IsActive { get; set; }

        [Range(0, 1000)]
        public int MinEmployeesRequired { get; set; }

        [Range(0, 1000)]
        public int MaxEmployeesAllowed { get; set; }
    }

    public class ShiftDto
    {
        public Guid Id { get; set; }
        public string ShiftName { get; set; } = string.Empty;
        public string ShiftCode { get; set; } = string.Empty;
        public string? Description { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public decimal DurationHours { get; set; }
        public int GracePeriodMinutes { get; set; }
        public int BreakDurationMinutes { get; set; }
        public ShiftType ShiftType { get; set; }
        public string? ApplicableDays { get; set; }
        public bool IsNightShift { get; set; }
        public bool AllowOvernightCrossMidnight { get; set; }
        public int EarlyExitToleranceMinutes { get; set; }
        public TimeSpan? SplitSlot1StartTime { get; set; }
        public TimeSpan? SplitSlot1EndTime { get; set; }
        public TimeSpan? SplitSlot2StartTime { get; set; }
        public TimeSpan? SplitSlot2EndTime { get; set; }
        public bool IsFlexiShift { get; set; }
        public TimeSpan? CoreStartTime { get; set; }
        public TimeSpan? CoreEndTime { get; set; }
        public TimeSpan? FlexiWindowStart { get; set; }
        public TimeSpan? FlexiWindowEnd { get; set; }
        public bool Is24HourShift { get; set; }
        public int MandatoryRestHoursAfterShift { get; set; }
        public bool IsOnCallStandby { get; set; }
        public decimal StandbyRateMultiplier { get; set; }
        public Guid? CountryId { get; set; }
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? OperationalLocationId { get; set; }
        public decimal NightShiftAllowance { get; set; }
        public bool IsActive { get; set; }
        public int MinEmployeesRequired { get; set; }
        public int MaxEmployeesAllowed { get; set; }
        public int CurrentAssignedCount { get; set; }
        public Guid? DepartmentId { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion

    #region Shift Assignment DTOs

    public class CreateShiftAssignmentDto
    {
        [Required]
        public Guid ShiftId { get; set; }

        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        public DateTime EffectiveFrom { get; set; }

        public DateTime? EffectiveTo { get; set; }

        [Required]
        public AssignmentType AssignmentType { get; set; }

        [StringLength(500)]
        public string? AssignmentReason { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public bool IsRotational { get; set; }

        public Guid? RotationId { get; set; }
    }

    public class UpdateShiftAssignmentDto
    {
        public DateTime? EffectiveTo { get; set; }

        [Required]
        public ShiftAssignmentStatus Status { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class ShiftAssignmentDto
    {
        public Guid Id { get; set; }
        public Guid ShiftId { get; set; }
        public string ShiftName { get; set; } = string.Empty;
        public string ShiftCode { get; set; } = string.Empty;
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public AssignmentType AssignmentType { get; set; }
        public string? AssignmentReason { get; set; }
        public ShiftAssignmentStatus Status { get; set; }
        public Guid? ApprovedBy { get; set; }
        public string? ApprovedByName { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public string? Notes { get; set; }
        public bool IsRotational { get; set; }
        public Guid? RotationId { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion

    #region Shift Swap DTOs

    public class CreateShiftSwapDto
    {
        [Required]
        public Guid RequestorEmployeeId { get; set; }

        [Required]
        public Guid RequestorShiftAssignmentId { get; set; }

        [Required]
        public Guid TargetEmployeeId { get; set; }

        [Required]
        public Guid TargetShiftAssignmentId { get; set; }

        [Required]
        public DateTime SwapDate { get; set; }

        [Required]
        [StringLength(500)]
        public string Reason { get; set; } = string.Empty;
    }

    public class UpdateShiftSwapDto
    {
        [Required]
        public ShiftSwapStatus Status { get; set; }

        [StringLength(500)]
        public string? ResponseNotes { get; set; }
    }

    public class ShiftSwapDto
    {
        public Guid Id { get; set; }
        public Guid RequestorEmployeeId { get; set; }
        public string RequestorEmployeeName { get; set; } = string.Empty;
        public Guid RequestorShiftAssignmentId { get; set; }
        public string RequestorShiftName { get; set; } = string.Empty;
        public Guid TargetEmployeeId { get; set; }
        public string TargetEmployeeName { get; set; } = string.Empty;
        public Guid TargetShiftAssignmentId { get; set; }
        public string TargetShiftName { get; set; } = string.Empty;
        public DateTime SwapDate { get; set; }
        public string Reason { get; set; } = string.Empty;
        public ShiftSwapStatus Status { get; set; }
        public DateTime? TargetResponseDate { get; set; }
        public string? TargetResponseNotes { get; set; }
        public Guid? ApprovedBy { get; set; }
        public string? ApprovedByName { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public string? ApprovalNotes { get; set; }
        public DateTime? RejectedDate { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime? ExecutedDate { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion

    #region Shift Rotation DTOs

    public class CreateShiftRotationDto
    {
        [Required]
        [StringLength(100)]
        public string RotationName { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [Range(1, 365)]
        public int RotationCycleDays { get; set; }

        [Required]
        public RotationType RotationType { get; set; }

        [StringLength(2000)]
        public string? RotationPattern { get; set; }

        public Guid? DepartmentId { get; set; }

        public bool IsActive { get; set; } = true;

        public bool AutoAssign { get; set; }
    }

    public class UpdateShiftRotationDto
    {
        [Required]
        [StringLength(100)]
        public string RotationName { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        public DateTime? EndDate { get; set; }

        public bool IsActive { get; set; }

        public bool AutoAssign { get; set; }

        [StringLength(2000)]
        public string? RotationPattern { get; set; }
    }

    public class ShiftRotationDto
    {
        public Guid Id { get; set; }
        public string RotationName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int RotationCycleDays { get; set; }
        public RotationType RotationType { get; set; }
        public string? RotationPattern { get; set; }
        public Guid? DepartmentId { get; set; }
        public bool IsActive { get; set; }
        public bool AutoAssign { get; set; }
        public int AssignedEmployeesCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion

    #region Rotation Schedule DTOs

    public class CreateRotationScheduleDto
    {
        [Required]
        public Guid RotationId { get; set; }

        [Required]
        public Guid ShiftId { get; set; }

        [Required]
        public Guid EmployeeId { get; set; }

        [Range(1, 365)]
        public int DayNumber { get; set; }

        [Required]
        public DateTime ScheduledDate { get; set; }

        [Range(1, 52)]
        public int WeekNumber { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class UpdateRotationScheduleDto
    {
        [Required]
        public ScheduleStatus Status { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class RotationScheduleDto
    {
        public Guid Id { get; set; }
        public Guid RotationId { get; set; }
        public string RotationName { get; set; } = string.Empty;
        public Guid ShiftId { get; set; }
        public string ShiftName { get; set; } = string.Empty;
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int DayNumber { get; set; }
        public DateTime ScheduledDate { get; set; }
        public int WeekNumber { get; set; }
        public ScheduleStatus Status { get; set; }
        public string? Notes { get; set; }
        public bool IsAutoGenerated { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion
}
