using System;

namespace UabIndia.Core.Entities
{
    public class BankReconciliation : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid AccountId { get; set; }
        public string AccountCode { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string Period { get; set; } = string.Empty; // yyyy-MM
        public decimal BookBalance { get; set; }
        public decimal BankBalance { get; set; }
        public decimal Difference { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Matched, Unmatched, Partial
        public DateTime ReconciledAt { get; set; }
        public string? Remarks { get; set; }
    }
}
