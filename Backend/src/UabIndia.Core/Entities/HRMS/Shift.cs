using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Represents a shift definition in the organization
    /// </summary>
    public class Shift : BaseEntity
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

        /// <summary>
        /// Total duration in hours (e.g., 8.0, 9.0)
        /// </summary>
        public decimal DurationHours { get; set; }

        /// <summary>
        /// Grace period in minutes for check-in
        /// </summary>
        public int GracePeriodMinutes { get; set; } = 15;

        /// <summary>
        /// Break duration in minutes
        /// </summary>
        public int BreakDurationMinutes { get; set; } = 60;

        public ShiftType ShiftType { get; set; }

        /// <summary>
        /// Days of week this shift applies (comma-separated: Monday,Tuesday,Wednesday)
        /// </summary>
        [StringLength(200)]
        public string? ApplicableDays { get; set; }

        /// <summary>
        /// Whether this is a night shift (for allowance purposes)
        /// </summary>
        public bool IsNightShift { get; set; }

        /// <summary>
        /// Night shift allowance percentage
        /// </summary>
        public decimal NightShiftAllowance { get; set; }

        /// <summary>
        /// Whether this shift is currently active
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Minimum employees required for this shift
        /// </summary>
        public int MinEmployeesRequired { get; set; }

        /// <summary>
        /// Maximum employees allowed for this shift
        /// </summary>
        public int MaxEmployeesAllowed { get; set; }

        /// <summary>
        /// Department this shift belongs to (null = organization-wide)
        /// </summary>
        public Guid? DepartmentId { get; set; }

        // Navigation properties
        public virtual ICollection<ShiftAssignment> ShiftAssignments { get; set; } = new List<ShiftAssignment>();
        public virtual ICollection<ShiftRotation> ShiftRotations { get; set; } = new List<ShiftRotation>();
    }

    /// <summary>
    /// Represents assignment of an employee to a shift
    /// </summary>
    public class ShiftAssignment : BaseEntity
    {
        [Required]
        public Guid ShiftId { get; set; }

        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        public DateTime EffectiveFrom { get; set; }

        public DateTime? EffectiveTo { get; set; }

        public AssignmentType AssignmentType { get; set; }

        /// <summary>
        /// For temporary assignments, reason for assignment
        /// </summary>
        [StringLength(500)]
        public string? AssignmentReason { get; set; }

        public ShiftAssignmentStatus Status { get; set; }

        /// <summary>
        /// Who approved this assignment
        /// </summary>
        public Guid? ApprovedBy { get; set; }

        public DateTime? ApprovedDate { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        /// <summary>
        /// Whether this assignment is part of rotation
        /// </summary>
        public bool IsRotational { get; set; }

        public Guid? RotationId { get; set; }

        // Navigation properties
        public virtual Shift Shift { get; set; } = null!;
        public virtual ShiftRotation? Rotation { get; set; }
    }

    /// <summary>
    /// Represents a shift swap request between two employees
    /// </summary>
    public class ShiftSwap : BaseEntity
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

        public ShiftSwapStatus Status { get; set; }

        /// <summary>
        /// Target employee's response
        /// </summary>
        public DateTime? TargetResponseDate { get; set; }

        [StringLength(500)]
        public string? TargetResponseNotes { get; set; }

        /// <summary>
        /// Manager's approval
        /// </summary>
        public Guid? ApprovedBy { get; set; }

        public DateTime? ApprovedDate { get; set; }

        [StringLength(500)]
        public string? ApprovalNotes { get; set; }

        public DateTime? RejectedDate { get; set; }

        [StringLength(500)]
        public string? RejectionReason { get; set; }

        /// <summary>
        /// Actual swap execution date
        /// </summary>
        public DateTime? ExecutedDate { get; set; }

        // Navigation properties
        public virtual ShiftAssignment RequestorShiftAssignment { get; set; } = null!;
        public virtual ShiftAssignment TargetShiftAssignment { get; set; } = null!;
    }

    /// <summary>
    /// Represents a shift rotation schedule for rotating shift patterns
    /// </summary>
    public class ShiftRotation : BaseEntity
    {
        [Required]
        [StringLength(100)]
        public string RotationName { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        /// <summary>
        /// Rotation cycle in days (e.g., 7 for weekly, 14 for bi-weekly)
        /// </summary>
        public int RotationCycleDays { get; set; }

        public RotationType RotationType { get; set; }

        /// <summary>
        /// Pattern of shifts (JSON: [{"Day": 1, "ShiftId": "guid"}, ...])
        /// </summary>
        [StringLength(2000)]
        public string? RotationPattern { get; set; }

        /// <summary>
        /// Department this rotation applies to
        /// </summary>
        public Guid? DepartmentId { get; set; }

        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Auto-assign new employees to this rotation
        /// </summary>
        public bool AutoAssign { get; set; }

        // Navigation properties
        public virtual ICollection<ShiftAssignment> Assignments { get; set; } = new List<ShiftAssignment>();
        public virtual ICollection<RotationSchedule> Schedules { get; set; } = new List<RotationSchedule>();
    }

    /// <summary>
    /// Represents individual schedule entries within a rotation
    /// </summary>
    public class RotationSchedule : BaseEntity
    {
        [Required]
        public Guid RotationId { get; set; }

        [Required]
        public Guid ShiftId { get; set; }

        [Required]
        public Guid EmployeeId { get; set; }

        /// <summary>
        /// Day number in the rotation cycle (1-based)
        /// </summary>
        public int DayNumber { get; set; }

        [Required]
        public DateTime ScheduledDate { get; set; }

        /// <summary>
        /// Week number in the rotation (for multi-week rotations)
        /// </summary>
        public int WeekNumber { get; set; }

        public ScheduleStatus Status { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        /// <summary>
        /// Whether this schedule was auto-generated
        /// </summary>
        public bool IsAutoGenerated { get; set; } = true;

        // Navigation properties
        public virtual ShiftRotation Rotation { get; set; } = null!;
        public virtual Shift Shift { get; set; } = null!;
    }

    // Enums
    public enum ShiftType
    {
        Morning,
        Afternoon,
        Evening,
        Night,
        General,
        Flexible,
        Split
    }

    public enum AssignmentType
    {
        Permanent,
        Temporary,
        Rotational,
        OnDemand
    }

    public enum ShiftAssignmentStatus
    {
        Active,
        Inactive,
        Pending,
        Expired,
        Cancelled
    }

    public enum ShiftSwapStatus
    {
        Pending,
        TargetApproved,
        TargetRejected,
        ManagerApproved,
        ManagerRejected,
        Completed,
        Cancelled
    }

    public enum RotationType
    {
        Weekly,
        BiWeekly,
        Monthly,
        Custom
    }

    public enum ScheduleStatus
    {
        Scheduled,
        Confirmed,
        Completed,
        Missed,
        Cancelled,
        Swapped
    }
}
