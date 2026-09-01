using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    // ===== PAYROLL STRUCTURE DTOs =====
    
    public class CreatePayrollStructureDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
    }

    public class UpdatePayrollStructureDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
    }

    // ===== PAYROLL COMPONENT DTOs =====

    public class CreatePayrollComponentDto
    {
        [Required]
        public Guid StructureId { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public string Type { get; set; } = "Earning"; // Earning or Deduction
        public decimal? Amount { get; set; }
        public decimal? Percentage { get; set; }
        public bool IsStatutory { get; set; }
    }

    public class UpdatePayrollComponentDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public string Type { get; set; } = "Earning";
        public decimal? Amount { get; set; }
        public decimal? Percentage { get; set; }
        public bool IsStatutory { get; set; }
    }

    // ===== PAYROLL RUN DTOs =====

    public class PayrollRunDto
    {
        public Guid Id { get; set; }
        public Guid? CompanyId { get; set; }
        public DateTime RunDate { get; set; }
        public string Status { get; set; } = "Draft";
    }

    public class CreatePayrollRunDto
    {
        public Guid? CompanyId { get; set; }
        [Required]
        public DateTime RunDate { get; set; }
    }

    // ===== PAYSLIP DTOs =====

    public class PayslipDto
    {
        public Guid Id { get; set; }
        public Guid PayrollRunId { get; set; }
        public Guid EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public decimal Gross { get; set; }
        public decimal Net { get; set; }
        public decimal GrossPay => Gross;
        public decimal NetPay => Net;
        public decimal TotalDeductions { get; set; }
        public decimal Basic { get; set; }
        public decimal LopDays { get; set; }
        public decimal PayableDays { get; set; }
        public decimal PfEmployee { get; set; }
        public decimal EsiEmployee { get; set; }
        public decimal ProfessionalTax { get; set; }
        public decimal Tds { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public string Status { get; set; } = "Generated";
        public string? Details { get; set; }
        public System.Collections.Generic.List<PayslipLineDto> Lines { get; set; } = new();
    }

    public class PayslipLineDto
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = "Earning";
        public decimal Amount { get; set; }
        public bool IsStatutory { get; set; }
    }

    public class CreatePayslipDto
    {
        [Required]
        public Guid PayrollRunId { get; set; }
        [Required]
        public Guid EmployeeId { get; set; }
        [Required]
        public decimal Gross { get; set; }
        [Required]
        public decimal Net { get; set; }
        public string? Details { get; set; }
    }

    public class UpsertPayrollTaxDeclarationDto
    {
        [Required]
        public Guid EmployeeId { get; set; }
        [Required]
        public int FinancialYear { get; set; }
        public string Regime { get; set; } = "Old";
        public decimal Section80C_Total { get; set; }
        public decimal Section80D_Total { get; set; }
        public decimal Section80G_Donation { get; set; }
        public decimal RentPaid { get; set; }
        public bool ProofSubmitted { get; set; }
    }

    public class CreatePayrollReimbursementDto
    {
        public Guid? EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        [Required]
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = "General";
        [Required]
        public decimal Amount { get; set; }
        public DateTime? Date { get; set; }
        public string? Description { get; set; }
    }

    public class UpsertPayrollSettlementDto
    {
        [Required]
        public Guid EmployeeId { get; set; }
        [Required]
        public DateTime ExitDate { get; set; }
        public decimal Gratuity { get; set; }
        public decimal LeaveEncashment { get; set; }
        public decimal OtherDues { get; set; }
        public decimal Recoveries { get; set; }
        public string? Remarks { get; set; }
    }

    public class CreatePayrollLoanDto
    {
        [Required]
        public Guid EmployeeId { get; set; }
        [Required]
        public string LoanType { get; set; } = "Personal Loan";
        [Required]
        public decimal PrincipalAmount { get; set; }
        public decimal InterestRate { get; set; }
        [Required]
        public decimal EmiAmount { get; set; }
        public int TotalInstallments { get; set; } = 12;
        [Required]
        public DateTime DisbursementDate { get; set; }
        public string? Purpose { get; set; }
    }

    public class CreatePayrollBonusDto
    {
        [Required]
        public Guid EmployeeId { get; set; }
        [Required]
        public string BonusType { get; set; } = "Performance Bonus";
        [Required]
        public decimal Amount { get; set; }
        [Required]
        public string PaymentMonth { get; set; } = string.Empty;
        public string? Remarks { get; set; }
    }

    public class CreatePayrollArrearDto
    {
        [Required]
        public Guid EmployeeId { get; set; }
        [Required]
        public string Period { get; set; } = string.Empty;
        [Required]
        public decimal Amount { get; set; }
        public string Reason { get; set; } = "Other";
    }
}
