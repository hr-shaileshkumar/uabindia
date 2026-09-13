using System;

namespace UabIndia.Core.Entities
{
    public class PayrollLoan : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeCode { get; set; } = string.Empty;
        public string LoanType { get; set; } = "Personal Loan";
        public decimal PrincipalAmount { get; set; }
        public decimal OutstandingAmount { get; set; }
        public decimal EmiAmount { get; set; }
        public decimal InterestRate { get; set; }
        public DateTime DisbursementDate { get; set; }
        public int TotalInstallments { get; set; } = 12;
        public int InstallmentsPaid { get; set; }
        public string? Purpose { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime? ClosedAt { get; set; }
    }

    public class PayrollBonus : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeCode { get; set; } = string.Empty;
        public string BonusType { get; set; } = "Performance Bonus";
        public decimal Amount { get; set; }
        public string PaymentMonth { get; set; } = string.Empty;
        public string? Remarks { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime? PaidAt { get; set; }
    }

    public class PayrollArrear : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeCode { get; set; } = string.Empty;
        public string Period { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Reason { get; set; } = "Other";
        public string Status { get; set; } = "Pending";
        public DateTime? ProcessedAt { get; set; }
    }
}
