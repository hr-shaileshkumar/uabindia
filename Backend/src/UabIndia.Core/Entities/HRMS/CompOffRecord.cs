using System;

namespace UabIndia.Core.Entities
{
    public enum CompOffStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2,
        Availed = 3,
        Expired = 4
    }

    /// <summary>
    /// Represents a compensatory off credit earned by an employee for working on a weekend or public holiday.
    /// Subject to statutory validity periods (typically 30-90 days).
    /// </summary>
    public class CompOffRecord : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public DateTime WorkedDate { get; set; }
        public decimal DaysGranted { get; set; } = 1.0m;
        public decimal DaysRemaining { get; set; } = 1.0m;
        public DateTime ExpiryDate { get; set; }
        public CompOffStatus Status { get; set; } = CompOffStatus.Pending;
        public string? Reason { get; set; }
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public Guid? AvailedInLeaveRequestId { get; set; }
    }
}
