using System;

namespace UabIndia.Core.Entities
{
    public enum LeaveEncashmentStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2,
        ProcessedInPayroll = 3
    }

    /// <summary>
    /// Represents an in-service or exit leave encashment request by an employee.
    /// Approved encashments deduct from EmployeeLeave balance and generate payroll earnings.
    /// </summary>
    public class LeaveEncashmentRequest : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public Guid LeavePolicyId { get; set; }
        public int Year { get; set; }
        public decimal DaysRequested { get; set; }
        public decimal DailyRate { get; set; }
        public decimal TotalAmount { get; set; }
        public LeaveEncashmentStatus Status { get; set; } = LeaveEncashmentStatus.Pending;
        public string? Reason { get; set; }
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public Guid? PayrollRunId { get; set; }
        public DateTime? ProcessedAt { get; set; }
    }
}
