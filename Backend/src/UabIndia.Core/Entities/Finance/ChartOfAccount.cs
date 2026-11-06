using System;

namespace UabIndia.Core.Entities
{
    public class ChartOfAccount : BaseEntity
    {
        public string AccountCode { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty; // Asset, Liability, Equity, Revenue, Expense
        public string SubType { get; set; } = string.Empty; // Current Asset, Fixed Asset, etc.
        public Guid? ParentAccountId { get; set; }
        public ChartOfAccount? ParentAccount { get; set; }
        public string? Description { get; set; }
        public decimal OpeningBalance { get; set; }
        public decimal CurrentBalance { get; set; }
        public string Currency { get; set; } = "INR";
        public bool IsGroup { get; set; } // Group account or ledger account
        public bool IsActive { get; set; } = true;
        public int Level { get; set; } // Hierarchy level
    }
}
