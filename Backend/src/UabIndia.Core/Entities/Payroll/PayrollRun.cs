using System;

namespace UabIndia.Core.Entities
{
    public class PayrollRun : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public DateTime RunDate { get; set; }
        public DateTime? PeriodStart { get; set; }
        public DateTime? PeriodEnd { get; set; }
        public string Status { get; set; } = "Draft";
        public Guid? JournalEntryId { get; set; }
        public int PayslipCount { get; set; }
        public decimal TotalGross { get; set; }
        public decimal TotalNet { get; set; }
    }
}
