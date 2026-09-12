using System;

namespace UabIndia.Core.Entities
{
    public class SalesReturn : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string ReturnNumber { get; set; } = string.Empty;
        public Guid CustomerId { get; set; }
        public Guid? SalesInvoiceId { get; set; }
        public string? OriginalOrderRef { get; set; }
        public decimal Amount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime ReturnDate { get; set; }
        public string Status { get; set; } = "Pending";
        public string? CreditNoteNumber { get; set; }
        public Guid? JournalEntryId { get; set; }
    }
}
