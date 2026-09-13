using System;

namespace UabIndia.Core.Entities
{
    public class AttendanceCorrection : BaseEntity
    {
        public Guid OriginalAttendanceId { get; set; }
        public DateTime ProposedTimestamp { get; set; }
        public string? Reason { get; set; }
        public string? Status { get; set; }
        public Guid? RequestedBy { get; set; }
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
    }
}
