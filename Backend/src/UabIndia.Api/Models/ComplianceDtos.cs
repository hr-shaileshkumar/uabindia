using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    // ==================== PROVIDENT FUND DTOs ====================

    public class CreateProvidentFundDto
    {
        [Required(ErrorMessage = "Employee ID is required")]
        public Guid EmployeeId { get; set; }

        [Required]
        [StringLength(20)]
        public string EmployeeNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string EmployeeName { get; set; } = string.Empty;

        [Required]
        public Guid DepartmentId { get; set; }

        [Required]
        [StringLength(50)]
        public string PFAccountNumber { get; set; } = string.Empty;

        [Required]
        public DateTime EffectiveFrom { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal BasicSalary { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal DA { get; set; }
    }

    public class UpdateProvidentFundDto
    {
        [Range(0, double.MaxValue)]
        public decimal BasicSalary { get; set; }

        [Range(0, double.MaxValue)]
        public decimal DA { get; set; }

        [Range(0, double.MaxValue)]
        public decimal InterestEarned { get; set; }
    }

    public class ProvidentFundDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string PFAccountNumber { get; set; } = string.Empty;
        public decimal BasicSalary { get; set; }
        public decimal DA { get; set; }
        public decimal PFWages { get; set; }
        public decimal EmployeeContribution { get; set; }
        public decimal EmployerContributionPF { get; set; }
        public decimal EmployerContributionEPS { get; set; }
        public decimal TotalBalance { get; set; }
        public int FinancialYear { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    // ==================== PF WITHDRAWAL DTOs ====================

    public class CreatePFWithdrawalDto
    {
        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        public Guid PFId { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal WithdrawalAmount { get; set; }

        [Required]
        public string WithdrawalType { get; set; } = string.Empty; // Retirement, Resignation, Medical, Housing, Partial

        [StringLength(500)]
        public string Reason { get; set; } = string.Empty;

        [StringLength(20)]
        public string BankAccountNumber { get; set; } = string.Empty;

        [StringLength(20)]
        public string BankIFSC { get; set; } = string.Empty;
    }

    public class UpdatePFWithdrawalDto
    {
        public string Status { get; set; } = string.Empty; // Approved, Rejected, Processing

        [StringLength(500)]
        public string RejectionReason { get; set; } = string.Empty;

        [StringLength(50)]
        public string TransactionReference { get; set; } = string.Empty;

        [Range(0, double.MaxValue)]
        public decimal TDSOnWithdrawal { get; set; }
    }

    public class PFWithdrawalDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public decimal WithdrawalAmount { get; set; }
        public decimal PFBalance { get; set; }
        public string WithdrawalType { get; set; } = string.Empty;
        public DateTime ApplicationDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal TDSOnWithdrawal { get; set; }
        public DateTime? ProcessedDate { get; set; }
    }

    // ==================== EMPLOYEE STATE INSURANCE (ESI) DTOs ====================

    public class CreateEmployeeStateInsuranceDto
    {
        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        [StringLength(20)]
        public string EmployeeNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string EmployeeName { get; set; } = string.Empty;

        [Required]
        public Guid DepartmentId { get; set; }

        [Required]
        [StringLength(50)]
        public string ESINumber { get; set; } = string.Empty;

        [Required]
        [StringLength(3)]
        public string StateCode { get; set; } = string.Empty;

        [Required]
        public DateTime EffectiveFrom { get; set; }

        [Required]
        [Range(0, 25000)]
        public decimal MonthlySalary { get; set; }
    }

    public class UpdateEmployeeStateInsuranceDto
    {
        [Range(0, 25000)]
        public decimal MonthlySalary { get; set; }

        public bool IsESIEligible { get; set; }

        public DateTime? ESICoverageEndDate { get; set; }
    }

    public class EmployeeStateInsuranceDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string ESINumber { get; set; } = string.Empty;
        public string StateName { get; set; } = string.Empty;
        public bool IsESIEligible { get; set; }
        public decimal MonthlySalary { get; set; }
        public decimal EmployeeContribution { get; set; }
        public decimal EmployerContribution { get; set; }
        public decimal TotalContribution { get; set; }
        public int ContributionDays { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    // ==================== INCOME TAX (IT) DTOs ====================

    public class CreateIncomeTaxDto
    {
        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        [StringLength(20)]
        public string EmployeeNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string EmployeeName { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string PAN { get; set; } = string.Empty;

        [Required]
        public Guid DepartmentId { get; set; }

        [Required]
        public string TaxRegime { get; set; } = string.Empty; // OldRegime, NewRegime

        [Required]
        [Range(0, double.MaxValue)]
        public decimal BasicSalary { get; set; }

        [Range(0, double.MaxValue)]
        public decimal DA { get; set; }

        [Range(0, double.MaxValue)]
        public decimal HRA { get; set; }
    }

    public class UpdateIncomeTaxDto
    {
        [Range(0, double.MaxValue)]
        public decimal BasicSalary { get; set; }

        [Range(0, double.MaxValue)]
        public decimal DA { get; set; }

        [Range(0, double.MaxValue)]
        public decimal HRA { get; set; }

        [Range(0, double.MaxValue)]
        public decimal SpecialAllowance { get; set; }

        public string TaxRegime { get; set; } = string.Empty;
    }

    public class IncomeTaxDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string PAN { get; set; } = string.Empty;
        public string TaxRegime { get; set; } = string.Empty;
        public decimal GrossSalary { get; set; }
        public decimal StandardDeduction { get; set; }
        public decimal TaxableIncome { get; set; }
        public decimal TotalTaxLiability { get; set; }
        public decimal TDSDeducted { get; set; }
        public decimal TaxRefundable { get; set; }
        public int FinancialYear { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class IncomeTaxCalculationDto
    {
        public Guid EmployeeId { get; set; }
        public decimal GrossSalary { get; set; }
        public decimal TaxableIncome { get; set; }
        public decimal TaxCalculated { get; set; }
        public decimal RebateUnder87A { get; set; }
        public decimal TotalTaxLiability { get; set; }
        public List<TaxSlabDto> ApplicableSlabs { get; set; } = new();
    }

    public class TaxSlabDto
    {
        public decimal From { get; set; }
        public decimal To { get; set; }
        public decimal Rate { get; set; }
        public decimal Tax { get; set; }
    }

    // ==================== PROFESSIONAL TAX (PT) DTOs ====================

    public class CreateProfessionalTaxDto
    {
        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        [StringLength(20)]
        public string EmployeeNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string EmployeeName { get; set; } = string.Empty;

        [Required]
        public Guid DepartmentId { get; set; }

        [Required]
        [StringLength(3)]
        public string StateCode { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal MonthlySalary { get; set; }
    }

    public class UpdateProfessionalTaxDto
    {
        [Range(0, double.MaxValue)]
        public decimal MonthlySalary { get; set; }

        public bool IsPTExempt { get; set; }
    }

    public class ProfessionalTaxDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string StateName { get; set; } = string.Empty;
        public decimal MonthlySalary { get; set; }
        public decimal PTDeduction { get; set; }
        public int FinancialYear { get; set; }
        public bool IsPTExempt { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    // ==================== TAX DECLARATION DTOs ====================

    public class CreateTaxDeclarationDto
    {
        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        public int FinancialYear { get; set; }

        [Range(0, 150000)]
        public decimal Section80C_Total { get; set; }

        [Range(0, 50000)]
        public decimal Section80D_Total { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Section80G_Donation { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Section80E_InterestOnEducationLoan { get; set; }

        [Range(0, double.MaxValue)]
        public decimal RentPaid { get; set; }

        [StringLength(500)]
        public string ProofDocuments { get; set; } = string.Empty; // JSON list
    }

    public class UpdateTaxDeclarationDto
    {
        [Range(0, 150000)]
        public decimal Section80C_Total { get; set; }

        [Range(0, 50000)]
        public decimal Section80D_Total { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Section80G_Donation { get; set; }

        public bool ProofSubmitted { get; set; }

        [StringLength(500)]
        public string ProofDocuments { get; set; } = string.Empty;
    }

    public class TaxDeclarationDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int FinancialYear { get; set; }
        public DateTime DeclarationDate { get; set; }
        public decimal Section80C_Total { get; set; }
        public decimal Section80D_Total { get; set; }
        public decimal Section80G_Donation { get; set; }
        public decimal TotalDeductionsUnderOldRegime { get; set; }
        public decimal HRAClaim { get; set; }
        public bool ProofSubmitted { get; set; }
        public DateTime? ProofSubmittedDate { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    // ==================== STATUTORY SETTINGS DTOs ====================

    public class CreateStatutorySettingsDto
    {
        [Required]
        [StringLength(100)]
        public string SettingKey { get; set; } = string.Empty;

        [Required]
        public string SettingValue { get; set; } = string.Empty;

        [Required]
        public int FinancialYear { get; set; }

        [StringLength(250)]
        public string Description { get; set; } = string.Empty;

        public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;

        public DateTime? EffectiveTo { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class UpdateStatutorySettingsDto
    {
        [Required]
        public string SettingValue { get; set; } = string.Empty;

        [StringLength(250)]
        public string Description { get; set; } = string.Empty;

        public DateTime? EffectiveTo { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class StatutorySettingsDto
    {
        public Guid Id { get; set; }
        public string SettingKey { get; set; } = string.Empty;
        public string SettingValue { get; set; } = string.Empty;
        public int FinancialYear { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public bool IsActive { get; set; }
    }

    // ==================== COMPLIANCE REPORT DTOs ====================

    public class CreateComplianceReportDto
    {
        [Required]
        [StringLength(50)]
        public string ReportType { get; set; } = string.Empty; // PF_ECR, ESI_CHALLAN, TDS_CHALLAN, FORM16, FORM24Q

        [Required]
        public int FinancialYear { get; set; }

        [Required]
        public int MonthYear { get; set; }

        [StringLength(50)]
        public string PFDtrCode { get; set; } = string.Empty;

        [StringLength(50)]
        public string ESIRegistrationNumber { get; set; } = string.Empty;

        [StringLength(50)]
        public string DeductorPAN { get; set; } = string.Empty;

        public Guid? EmployeeId { get; set; } // For individual Form 16
    }

    public class ComplianceReportDto
    {
        public Guid Id { get; set; }
        public string ReportType { get; set; } = string.Empty;
        public int FinancialYear { get; set; }
        public int MonthYear { get; set; }
        public DateTime GeneratedDate { get; set; }
        public int TotalEmployees { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal EmployeeContribution { get; set; }
        public decimal EmployerContribution { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? SubmittedDate { get; set; }
        public string ReferenceNumber { get; set; } = string.Empty;
        public string FileLocation { get; set; } = string.Empty;
    }

    public class PFECRReportDto
    {
        public string PFDtrCode { get; set; } = string.Empty;
        public string EstablishmentName { get; set; } = string.Empty;
        public int MonthYear { get; set; }
        public int TotalEmployees { get; set; }
        public decimal TotalEmployeeContribution { get; set; }
        public decimal TotalEmployerContribution { get; set; }
        public List<PFECRLineItemDto> LineItems { get; set; } = new();
    }

    public class PFECRLineItemDto
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string MemberId { get; set; } = string.Empty;
        public decimal Wages { get; set; }
        public decimal EmployeeContribution { get; set; }
        public decimal EmployerContributionPF { get; set; }
        public decimal EmployerContributionEPS { get; set; }
    }

    public class ESIChallanReportDto
    {
        public string ESIRegistrationNumber { get; set; } = string.Empty;
        public int MonthYear { get; set; }
        public decimal TotalEmployeeContribution { get; set; }
        public decimal TotalEmployerContribution { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime ChallanDueDate { get; set; }
        public List<ESIChallanLineItemDto> LineItems { get; set; } = new();
    }

    public class ESIChallanLineItemDto
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public decimal ESIWages { get; set; }
        public decimal EmployeeContribution { get; set; }
        public decimal EmployerContribution { get; set; }
    }

    public class Form16Dto
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeePAN { get; set; } = string.Empty;
        public string CertificateNumber { get; set; } = string.Empty;
        public int FinancialYear { get; set; }
        public string DeductorName { get; set; } = string.Empty;
        public string DeductorPAN { get; set; } = string.Empty;
        public decimal SalaryIncomeGross { get; set; }
        public decimal StandardDeduction { get; set; }
        public decimal TaxableIncome { get; set; }
        public decimal TotalTaxDeducted { get; set; }
        public decimal EducationCess { get; set; }
        public DateTime GeneratedDate { get; set; }
    }

    // ==================== COMPLIANCE AUDIT DTOs ====================

    public class CreateComplianceAuditDto
    {
        [Required]
        [StringLength(50)]
        public string AuditType { get; set; } = string.Empty; // PF_AUDIT, ESI_AUDIT, IT_AUDIT, PT_AUDIT

        [Required]
        public int FinancialYear { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int TotalRecordsChecked { get; set; }

        [StringLength(1000)]
        public string AuditFindings { get; set; } = string.Empty;
    }

    public class UpdateComplianceAuditDto
    {
        [Range(0, int.MaxValue)]
        public int DiscrepanciesFound { get; set; }

        [Range(0, int.MaxValue)]
        public int CorrectionsMade { get; set; }

        public string Status { get; set; } = string.Empty; // InProgress, Completed, PartiallyCompleted

        [StringLength(500)]
        public string Remarks { get; set; } = string.Empty;
    }

    public class ComplianceAuditDto
    {
        public Guid Id { get; set; }
        public string AuditType { get; set; } = string.Empty;
        public int FinancialYear { get; set; }
        public DateTime AuditDate { get; set; }
        public string AuditedByName { get; set; } = string.Empty;
        public int TotalRecordsChecked { get; set; }
        public int DiscrepanciesFound { get; set; }
        public int CorrectionsMade { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CompletionDate { get; set; }
    }

    // ==================== STATUTORY SETTINGS DTOs ====================

    public class StatutorySettingDto
    {
        public Guid Id { get; set; }
        public string SettingKey { get; set; } = string.Empty;
        public string SettingValue { get; set; } = string.Empty;
        public int FinancialYear { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime EffectiveFrom { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpdateStatutorySettingDto
    {
        [Required]
        [StringLength(500)]
        public string SettingValue { get; set; } = string.Empty;

        [Required]
        public DateTime EffectiveFrom { get; set; }

        public bool IsActive { get; set; }
    }
}
