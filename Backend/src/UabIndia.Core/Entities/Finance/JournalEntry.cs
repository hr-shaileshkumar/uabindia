using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    public class JournalEntry : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string JournalNumber { get; set; } = string.Empty;
        public DateTime EntryDate { get; set; }
        public string EntryType { get; set; } = string.Empty; // Opening, Regular, Closing, Adjusting
        public string? ReferenceNumber { get; set; }
        public string? Description { get; set; }
        public decimal TotalDebit { get; set; }
        public decimal TotalCredit { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, Posted, Cancelled
        public DateTime? PostedDate { get; set; }
        public Guid? PostedBy { get; set; }
        public string? Narration { get; set; }
        public bool IsReconciled { get; set; }
        public string? AttachmentUrl { get; set; }
        public ICollection<JournalEntryLine> Lines { get; set; } = new List<JournalEntryLine>();
    }

    public class JournalEntryLine : BaseEntity
    {
        public Guid JournalEntryId { get; set; }
        public JournalEntry JournalEntry { get; set; } = null!;
        public Guid AccountId { get; set; }
        public ChartOfAccount Account { get; set; } = null!;
        public decimal DebitAmount { get; set; }
        public decimal CreditAmount { get; set; }
        public string? Description { get; set; }
        public string? ReferenceType { get; set; } // Invoice, Payment, PurchaseOrder, etc.
        public Guid? ReferenceId { get; set; }
    }
}
