using System;
using System.ComponentModel.DataAnnotations;
using UabIndia.Core.Entities;

namespace UabIndia.Api.Models
{
    #region Overtime Request DTOs

    public class CreateOvertimeRequestDto
    {
        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        public DateTime OvertimeDate { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }

        [Range(0, 480)]
        public int BreakMinutes { get; set; }

        [Required]
        [StringLength(500)]
        public string Reason { get; set; } = string.Empty;

        [StringLength(200)]
        public string? ProjectCode { get; set; }

        public Guid? ProjectId { get; set; }

        [Required]
        public OvertimeType OvertimeType { get; set; }

        public Guid? ManagerId { get; set; }

        public bool IsPreApproved { get; set; }

        [Required]
        public CompensationType CompensationType { get; set; }

        [Range(1.0, 3.0)]
        public decimal OvertimeRate { get; set; } = 1.5m;

        [StringLength(500)]
        public string? EmployeeNotes { get; set; }
    }

    public class UpdateOvertimeRequestDto
    {
        [Required]
        public DateTime OvertimeDate { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }

        [Range(0, 480)]
        public int BreakMinutes { get; set; }

        [Required]
        [StringLength(500)]
        public string Reason { get; set; } = string.Empty;

        public Guid? ProjectId { get; set; }

        [Required]
        public CompensationType CompensationType { get; set; }

        [StringLength(500)]
        public string? EmployeeNotes { get; set; }
    }

    public class OvertimeRequestDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime OvertimeDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public decimal TotalHours { get; set; }
        public int BreakMinutes { get; set; }
        public decimal NetOvertimeHours { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? ProjectCode { get; set; }
        public Guid? ProjectId { get; set; }
        public OvertimeType OvertimeType { get; set; }
        public OvertimeRequestStatus Status { get; set; }
        public Guid? ManagerId { get; set; }
        public string? ManagerName { get; set; }
        public bool IsPreApproved { get; set; }
        public CompensationType CompensationType { get; set; }
        public decimal OvertimeRate { get; set; }
        public decimal OvertimeAmount { get; set; }
        public string? EmployeeNotes { get; set; }
        public bool IsActualWorked { get; set; }
        public decimal? ActualWorkedHours { get; set; }
        public int ApprovalCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion

    #region Overtime Approval DTOs

    public class CreateOvertimeApprovalDto
    {
        [Required]
        public Guid OvertimeRequestId { get; set; }

        [Required]
        public ApprovalStatus Status { get; set; }

        [StringLength(500)]
        public string? ApprovalNotes { get; set; }

        [StringLength(500)]
        public string? RejectionReason { get; set; }

        [Range(0, 24)]
        public decimal? ApprovedHours { get; set; }

        public decimal? ApprovedAmount { get; set; }
    }

    public class OvertimeApprovalDto
    {
        public Guid Id { get; set; }
        public Guid OvertimeRequestId { get; set; }
        public Guid ApproverId { get; set; }
        public string ApproverName { get; set; } = string.Empty;
        public string ApproverRole { get; set; } = string.Empty;
        public ApprovalStatus Status { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public DateTime? RejectedDate { get; set; }
        public string? ApprovalNotes { get; set; }
        public string? RejectionReason { get; set; }
        public int ApprovalLevel { get; set; }
        public bool IsRequired { get; set; }
        public decimal? ApprovedHours { get; set; }
        public decimal? ApprovedAmount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion

    #region Overtime Log DTOs

    public class CreateOvertimeLogDto
    {
        [Required]
        public Guid OvertimeRequestId { get; set; }

        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        public DateTime OvertimeDate { get; set; }

        [Required]
        [Range(0.1, 24)]
        public decimal OvertimeHours { get; set; }

        [Required]
        [Range(1.0, 3.0)]
        public decimal OvertimeRate { get; set; }

        [Required]
        public OvertimeType OvertimeType { get; set; }

        [Required]
        public CompensationType CompensationType { get; set; }

        public decimal? CompensatoryLeaveHours { get; set; }

        public DateTime? CompensatoryLeaveExpiryDate { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public Guid? ProjectId { get; set; }
    }

    public class UpdateOvertimeLogDto
    {
        public bool IsProcessedInPayroll { get; set; }

        public Guid? PayrollRunId { get; set; }

        public bool IsCompensatoryLeaveUtilized { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class OvertimeLogDto
    {
        public Guid Id { get; set; }
        public Guid OvertimeRequestId { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime OvertimeDate { get; set; }
        public decimal OvertimeHours { get; set; }
        public decimal OvertimeRate { get; set; }
        public decimal OvertimeAmount { get; set; }
        public OvertimeType OvertimeType { get; set; }
        public CompensationType CompensationType { get; set; }
        public bool IsProcessedInPayroll { get; set; }
        public Guid? PayrollRunId { get; set; }
        public DateTime? PayrollProcessedDate { get; set; }
        public decimal? CompensatoryLeaveHours { get; set; }
        public DateTime? CompensatoryLeaveExpiryDate { get; set; }
        public bool IsCompensatoryLeaveUtilized { get; set; }
        public string? Notes { get; set; }
        public string? ProjectCode { get; set; }
        public Guid? ProjectId { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion

    #region Overtime Compensation DTOs

    public class CreateOvertimeCompensationDto
    {
        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        public Guid OvertimeLogId { get; set; }

        [Required]
        public CompensationType CompensationType { get; set; }

        public decimal? CashAmount { get; set; }

        [Range(0.1, 24)]
        public decimal? TimeOffHours { get; set; }

        public DateTime? TimeOffExpiryDate { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class UpdateOvertimeCompensationDto
    {
        [Required]
        public CompensationStatus Status { get; set; }

        public bool IsTimeOffUtilized { get; set; }

        public DateTime? TimeOffUtilizedDate { get; set; }

        public Guid? LeaveRequestId { get; set; }

        [StringLength(100)]
        public string? PaymentReference { get; set; }

        public DateTime? PaymentDate { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class OvertimeCompensationDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public Guid OvertimeLogId { get; set; }
        public CompensationType CompensationType { get; set; }
        public decimal? CashAmount { get; set; }
        public decimal? TimeOffHours { get; set; }
        public DateTime? TimeOffExpiryDate { get; set; }
        public bool IsTimeOffUtilized { get; set; }
        public DateTime? TimeOffUtilizedDate { get; set; }
        public Guid? LeaveRequestId { get; set; }
        public string? PaymentReference { get; set; }
        public DateTime? PaymentDate { get; set; }
        public CompensationStatus Status { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion
}
