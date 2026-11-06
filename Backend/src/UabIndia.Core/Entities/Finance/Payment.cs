using System;

namespace UabIndia.Core.Entities
{
    // Payment (both receivable and payable)
    public class Payment : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string PaymentNumber { get; set; } = string.Empty;
        public DateTime PaymentDate { get; set; }
        public string PaymentType { get; set; } = string.Empty; // Received, Paid
        public string? PartyType { get; set; } // Customer, Vendor, Employee
        public Guid? PartyId { get; set; }
        public string? PartyName { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMode { get; set; } = "Cash"; // Cash, Cheque, BankTransfer, Card, UPI, etc.
        public string? ReferenceNumber { get; set; } // Cheque number, transaction ID
        public DateTime? ReferenceDate { get; set; }
        public string? BankName { get; set; }
        public Guid? BankAccountId { get; set; }
        public string? InvoiceType { get; set; } // SalesInvoice, PurchaseInvoice
        public Guid? InvoiceId { get; set; }
        public string? InvoiceNumber { get; set; }
        public string Status { get; set; } = "Completed"; // Pending, Completed, Cancelled, Bounced
        public string? Remarks { get; set; }
        public Guid? JournalEntryId { get; set; }
        public JournalEntry? JournalEntry { get; set; }
    }
}
