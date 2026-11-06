using System;

namespace UabIndia.Core.Entities
{
    public enum LeavePeriod
    {
        FullDay,
        FirstHalf,
        SecondHalf
    }

    public class LeaveRequest : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public Guid LeavePolicyId { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public decimal Days { get; set; }
        public LeavePeriod Period { get; set; } = LeavePeriod.FullDay;
        public string Status { get; set; } = "Pending";
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? Reason { get; set; }
    }
}
