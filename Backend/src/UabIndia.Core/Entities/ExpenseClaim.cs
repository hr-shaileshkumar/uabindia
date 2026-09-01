using System;

namespace UabIndia.Core.Entities
{
    public class ExpenseClaim : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public string ClaimNumber { get; set; } = string.Empty;
        public Guid? EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Category { get; set; } = "General";
        public decimal Amount { get; set; }
        public string CurrencyCode { get; set; } = "INR";
        public DateTime ExpenseDate { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, Submitted, Approved, Rejected, Paid
        public string? ReceiptUrl { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public Guid? CostCenterId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? JournalEntryId { get; set; }
    }
}
