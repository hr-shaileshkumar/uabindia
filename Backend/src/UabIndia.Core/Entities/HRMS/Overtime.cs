using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Represents an overtime request submitted by an employee
    /// </summary>
    public class OvertimeRequest : BaseEntity
    {
        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        public DateTime OvertimeDate { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }

        /// <summary>
        /// Total overtime hours (calculated)
        /// </summary>
        public decimal TotalHours { get; set; }

        /// <summary>
        /// Break time in minutes (deducted from total)
        /// </summary>
        public int BreakMinutes { get; set; }

        /// <summary>
        /// Net overtime hours (TotalHours - BreakMinutes)
        /// </summary>
        public decimal NetOvertimeHours { get; set; }

        [Required]
        [StringLength(500)]
        public string Reason { get; set; } = string.Empty;

        [StringLength(200)]
        public string? ProjectCode { get; set; }

        public Guid? ProjectId { get; set; }

        public OvertimeType OvertimeType { get; set; }

        public OvertimeRequestStatus Status { get; set; }

        /// <summary>
        /// Direct manager who needs to approve
        /// </summary>
        public Guid? ManagerId { get; set; }

        /// <summary>
        /// Whether this is a pre-approved overtime
        /// </summary>
        public bool IsPreApproved { get; set; }

        /// <summary>
        /// Compensation type (pay or time-off)
        /// </summary>
        public CompensationType CompensationType { get; set; }

        /// <summary>
        /// Overtime rate multiplier (1.5x, 2.0x, etc.)
        /// </summary>
        public decimal OvertimeRate { get; set; } = 1.5m;

        /// <summary>
        /// Calculated overtime amount
        /// </summary>
        public decimal OvertimeAmount { get; set; }

        [StringLength(500)]
        public string? EmployeeNotes { get; set; }

        /// <summary>
        /// Whether this overtime was actually worked (vs requested)
        /// </summary>
        public bool IsActualWorked { get; set; }

        /// <summary>
        /// Actual worked hours (may differ from requested)
        /// </summary>
        public decimal? ActualWorkedHours { get; set; }

        // Navigation properties
        public virtual ICollection<OvertimeApproval> Approvals { get; set; } = new List<OvertimeApproval>();
        public virtual OvertimeLog? OvertimeLog { get; set; }
    }

    /// <summary>
    /// Represents approval/rejection of an overtime request
    /// </summary>
    public class OvertimeApproval : BaseEntity
    {
        [Required]
        public Guid OvertimeRequestId { get; set; }

        [Required]
        public Guid ApproverId { get; set; }

        [Required]
        [StringLength(100)]
        public string ApproverName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string ApproverRole { get; set; } = string.Empty;

        public ApprovalStatus Status { get; set; }

        public DateTime? ApprovedDate { get; set; }

        public DateTime? RejectedDate { get; set; }

        [StringLength(500)]
        public string? ApprovalNotes { get; set; }

        [StringLength(500)]
        public string? RejectionReason { get; set; }

        /// <summary>
        /// Sequence order for multi-level approvals
        /// </summary>
        public int ApprovalLevel { get; set; }

        /// <summary>
        /// Whether this approval is required or optional
        /// </summary>
        public bool IsRequired { get; set; } = true;

        /// <summary>
        /// Approved hours (may be less than requested)
        /// </summary>
        public decimal? ApprovedHours { get; set; }

        /// <summary>
        /// Approved amount
        /// </summary>
        public decimal? ApprovedAmount { get; set; }

        // Navigation property
        public virtual OvertimeRequest OvertimeRequest { get; set; } = null!;
    }

    /// <summary>
    /// Represents the actual overtime log entry for payroll processing
    /// </summary>
    public class OvertimeLog : BaseEntity
    {
        [Required]
        public Guid OvertimeRequestId { get; set; }

        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        public DateTime OvertimeDate { get; set; }

        [Required]
        public decimal OvertimeHours { get; set; }

        [Required]
        public decimal OvertimeRate { get; set; }

        [Required]
        public decimal OvertimeAmount { get; set; }

        public OvertimeType OvertimeType { get; set; }

        public CompensationType CompensationType { get; set; }

        /// <summary>
        /// Whether this has been processed in payroll
        /// </summary>
        public bool IsProcessedInPayroll { get; set; }

        public Guid? PayrollRunId { get; set; }

        public DateTime? PayrollProcessedDate { get; set; }

        /// <summary>
        /// For time-off compensation, the credited leave hours
        /// </summary>
        public decimal? CompensatoryLeaveHours { get; set; }

        public DateTime? CompensatoryLeaveExpiryDate { get; set; }

        /// <summary>
        /// Whether compensatory leave has been utilized
        /// </summary>
        public bool IsCompensatoryLeaveUtilized { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        [StringLength(200)]
        public string? ProjectCode { get; set; }

        public Guid? ProjectId { get; set; }

        /// <summary>
        /// Payslip line item reference
        /// </summary>
        public Guid? PayslipLineItemId { get; set; }

        // Navigation property
        public virtual OvertimeRequest OvertimeRequest { get; set; } = null!;
    }

    /// <summary>
    /// Tracks overtime compensation records
    /// </summary>
    public class OvertimeCompensation : BaseEntity
    {
        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        public Guid OvertimeLogId { get; set; }

        public CompensationType CompensationType { get; set; }

        /// <summary>
        /// For cash compensation
        /// </summary>
        public decimal? CashAmount { get; set; }

        /// <summary>
        /// For time-off compensation
        /// </summary>
        public decimal? TimeOffHours { get; set; }

        public DateTime? TimeOffExpiryDate { get; set; }

        public bool IsTimeOffUtilized { get; set; }

        public DateTime? TimeOffUtilizedDate { get; set; }

        /// <summary>
        /// Leave request ID if time-off was taken
        /// </summary>
        public Guid? LeaveRequestId { get; set; }

        /// <summary>
        /// Payment reference if cash compensation
        /// </summary>
        [StringLength(100)]
        public string? PaymentReference { get; set; }

        public DateTime? PaymentDate { get; set; }

        public CompensationStatus Status { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        // Navigation property
        public virtual OvertimeLog OvertimeLog { get; set; } = null!;
    }

    // Enums
    public enum OvertimeType
    {
        Regular,           // Normal weekday overtime
        Weekend,           // Weekend overtime (higher rate)
        Holiday,           // Public holiday overtime (highest rate)
        Emergency,         // Emergency overtime
        Planned            // Pre-planned overtime
    }

    public enum OvertimeRequestStatus
    {
        Draft,
        Submitted,
        PendingApproval,
        Approved,
        PartiallyApproved,
        Rejected,
        Cancelled,
        Completed
    }

    public enum ApprovalStatus
    {
        Pending,
        Approved,
        Rejected,
        Cancelled
    }

    public enum CompensationType
    {
        Cash,              // Overtime paid in salary
        TimeOff,           // Compensatory time off
        Both               // Combination of cash and time-off
    }

    public enum CompensationStatus
    {
        Pending,
        Processed,
        Paid,
        Utilized,
        Expired,
        Cancelled
    }
}
