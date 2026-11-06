using System;

namespace UabIndia.Core.Entities
{
    public class AccountingPeriod : BaseEntity
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string Status { get; set; } = "Open";
        public DateTime? ClosedAt { get; set; }
        public Guid? ClosedBy { get; set; }
        public string? Notes { get; set; }
    }
}
