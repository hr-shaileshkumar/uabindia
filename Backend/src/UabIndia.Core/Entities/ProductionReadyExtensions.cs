using System;

namespace UabIndia.Core.Entities
{
    public class EmployeeSalaryAssignment : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public Guid? StructureId { get; set; }
        public decimal MonthlyCtc { get; set; }
        public decimal BasicSalary { get; set; }
        public decimal Hra { get; set; }
        public decimal SpecialAllowance { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class PurchaseRequest : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string RequestNumber { get; set; } = string.Empty;
        public Guid? RequestedByUserId { get; set; }
        public string RequestedBy { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public Guid? ItemId { get; set; }
        public string ItemDescription { get; set; } = string.Empty;
        public decimal Quantity { get; set; } = 1;
        public string Unit { get; set; } = "Pcs";
        public decimal EstimatedCost { get; set; }
        public DateTime? RequiredDate { get; set; }
        public string Justification { get; set; } = string.Empty;
        public string Status { get; set; } = "Draft";
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public Guid? PurchaseOrderId { get; set; }
        public string? Notes { get; set; }
    }

    public class HrLifecycleTask : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public string Kind { get; set; } = "Onboarding"; // Onboarding, Offboarding
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = "HR";
        public string Status { get; set; } = "Pending";
        public DateTime? DueDate { get; set; }
        public DateTime? CompletedAt { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public int SortOrder { get; set; }
        public string? Notes { get; set; }
    }

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
