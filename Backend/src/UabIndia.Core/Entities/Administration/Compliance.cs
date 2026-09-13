using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Provident Fund (PF) entity for tracking employee and employer contributions
    /// Includes calculation of PF (8.33%), EPS (1.67%), withdrawal management
    /// </summary>
    public class ProvidentFund : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public Guid DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;

        // PF Details
        public string PFAccountNumber { get; set; } = string.Empty;
        public DateTime EffectiveFrom { get; set; }
        public decimal BasicSalary { get; set; }
        public decimal DA { get; set; }
        public decimal PFWages { get; set; } // Basic + DA

        // Contribution Calculation (12% split: 8.33% PF + 1.67% EPS + 0.33% Admin)
        public decimal EmployeeContribution { get; set; } // 12% of PFWages
        public decimal EmployerContributionPF { get; set; } // 8.33% of PFWages
        public decimal EmployerContributionEPS { get; set; } // Capped at ₹1,250/month for salary >15000
        public decimal AdminCharges { get; set; } // 0.33% up to certain limit
        public decimal TotalContribution { get; set; } // EE + ER contributions
        public decimal InterestEarned { get; set; } // Annual interest
        public decimal TotalBalance { get; set; } // Accumulated balance

        // Month-Year tracking
        public int FinancialYear { get; set; } // FY as 2025-26
        public int MonthYear { get; set; } // YYYYMM format

        // Status
        public PFStatus Status { get; set; } = PFStatus.Active;
        public DateTime ClosureDate { get; set; }

        // Navigation
        public virtual ICollection<PFWithdrawal> Withdrawals { get; set; } = new List<PFWithdrawal>();
    }

    /// <summary>
    /// Employee State Insurance (ESI) entity for tracking ESI contributions
    /// Includes eligibility check (salary < 21000 threshold), 0.75% EE + 3.25% ER
    /// </summary>
    public class EmployeeStateInsurance : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public Guid DepartmentId { get; set; }

        // ESI Details
        public string ESINumber { get; set; } = string.Empty;
        public string StateCode { get; set; } = string.Empty;
        public string StateName { get; set; } = string.Empty;
        public DateTime EffectiveFrom { get; set; }
        public DateTime? ESICoverageEndDate { get; set; }

        // Eligibility & Wages
        public bool IsESIEligible { get; set; } // Based on salary < 21,000
        public decimal MonthlySalary { get; set; }
        public decimal ESIWages { get; set; } // Capped at ₹21,000

        // Contribution Calculation (0.75% EE + 3.25% ER)
        public decimal EmployeeContribution { get; set; } // 0.75% of ESI Wages
        public decimal EmployerContribution { get; set; } // 3.25% of ESI Wages
        public decimal TotalContribution { get; set; } // EE + ER

        // Month-Year tracking
        public int FinancialYear { get; set; }
        public int MonthYear { get; set; }

        // Coverage & Status
        public DateTime ContributionMonth { get; set; }
        public int ContributionDays { get; set; } // No. of days coverage
        public ESIStatus Status { get; set; } = ESIStatus.Active;

        // Navigation
        public virtual ICollection<ESIBenefit> Benefits { get; set; } = new List<ESIBenefit>();
    }

    /// <summary>
    /// Income Tax (IT) entity for tax calculations using old vs new regime
    /// Includes slab-based calculations, TDS deduction, Form 16 support
    /// </summary>
    public class IncomeTax : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string PAN { get; set; } = string.Empty;
        public Guid DepartmentId { get; set; }

        // Regime Selection
        public TaxRegime TaxRegime { get; set; } = TaxRegime.NewRegime; // FY 2024-25 onwards default New
        public bool OptedOldRegime { get; set; } // Can choose Old Regime if eligible

        // Gross Salary Components
        public decimal BasicSalary { get; set; }
        public decimal DA { get; set; }
        public decimal HRA { get; set; }
        public decimal SpecialAllowance { get; set; }
        public decimal OtherAllowance { get; set; }
        public decimal GrossSalary { get; set; }

        // Deductions
        public decimal StandardDeduction { get; set; } // ₹50,000 (New Regime), calculated (Old Regime)
        public decimal TaxableIncome { get; set; } // Gross - Deductions

        // Tax Calculation
        public decimal TaxCalculated { get; set; } // Based on slabs
        public decimal RebateUnder87A { get; set; } // If eligible
        public decimal TaxAfterRebate { get; set; }
        public decimal SurCharge { get; set; } // If income > threshold
        public decimal HealthEducationCess { get; set; } // 4% on tax + surcharge
        public decimal TotalTaxLiability { get; set; }

        // TDS & Advance Tax
        public decimal TDSDeducted { get; set; } // Cumulative
        public decimal AdvanceTaxPaid { get; set; } // Cumulative
        public decimal TotalPaymentsMade { get; set; }
        public decimal TaxRefundable { get; set; } // If payments > liability

        // Month-Year tracking
        public int FinancialYear { get; set; } // FY as 2025-26
        public int AssessmentYear { get; set; } // AY as 2026-27

        // Status
        public ITStatus Status { get; set; } = ITStatus.Calculated;
        public DateTime CalculatedDate { get; set; }

        // Navigation
        public virtual ICollection<TaxDeclaration> Declarations { get; set; } = new List<TaxDeclaration>();
    }

    /// <summary>
    /// Professional Tax (PT) entity for state-wise PT deductions
    /// Includes state configuration, monthly deduction, exemptions
    /// </summary>
    public class ProfessionalTax : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public Guid DepartmentId { get; set; }

        // State & PT Details
        public string StateCode { get; set; } = string.Empty;
        public string StateName { get; set; } = string.Empty;
        public string PTRegistrationNumber { get; set; } = string.Empty;
        public DateTime EffectiveFrom { get; set; }

        // Salary for PT Calculation
        public decimal MonthlySalary { get; set; } // Varies by state
        public decimal PTDeduction { get; set; } // Varies by state and salary range

        // Month-Year tracking
        public int FinancialYear { get; set; }
        public int MonthYear { get; set; }

        // Status
        public PTStatus Status { get; set; } = PTStatus.Active;
        public bool IsPTExempt { get; set; } // Some states/salaries exempt
    }

    /// <summary>
    /// Tax Declaration entity for deductions and exemptions
    /// Includes Section 80C (LIC, ELSS, EPF), 80D (Health Insurance), 80G (Donation)
    /// </summary>
    public class TaxDeclaration : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public Guid IncomeTaxId { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public Guid DepartmentId { get; set; }

        // Declaration Period
        public int FinancialYear { get; set; }
        public DateTime DeclarationDate { get; set; }
        public bool IsRevised { get; set; }

        // Section 80C Deductions (Up to ₹1,50,000)
        public decimal Section80CLIFPremium { get; set; }
        public decimal Section80CELSSInvestment { get; set; }
        public decimal Section80CFDDeposit { get; set; }
        public decimal Section80C_Total { get; set; }

        // Section 80D Deductions (Health Insurance)
        public decimal Section80D_SelfFamily { get; set; } // Up to ₹25,000
        public decimal Section80D_Parents { get; set; } // Up to ₹25,000
        public decimal Section80D_Total { get; set; }

        // Section 80G Deductions (Donation to charitable institutions)
        public decimal Section80G_Donation { get; set; } // 50% or 100% of amount
        public decimal Section80G_DeductionClaimed { get; set; }

        // Section 80E & Others
        public decimal Section80E_InterestOnEducationLoan { get; set; }
        public decimal OtherDeductions { get; set; }

        // Total Deductions (under old regime)
        public decimal TotalDeductionsUnderOldRegime { get; set; }

        // HRA Exemption
        public decimal HRAClaim { get; set; }
        public decimal RentPaid { get; set; }
        public bool IsHRAApplied { get; set; }

        // Proof Status
        public DeclarationStatus Status { get; set; } = DeclarationStatus.Declared;
        public DateTime ProofSubmissionDeadline { get; set; }
        public bool ProofSubmitted { get; set; }
        public DateTime? ProofSubmittedDate { get; set; }
        public string ProofDocuments { get; set; } = string.Empty; // JSON: ['LIC', 'Health Insurance', 'Donation Receipt']

        // Navigation
        public virtual IncomeTax IncomeTax { get; set; } = null!;
    }

    /// <summary>
    /// PF Withdrawal request entity for tracking withdrawal applications and approvals
    /// Supports multiple withdrawal scenarios (Retirement, Resignation, Medical, Housing)
    /// </summary>
    public class PFWithdrawal : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public Guid PFId { get; set; }
        public string EmployeeNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;

        // Withdrawal Details
        public PFWithdrawalType WithdrawalType { get; set; } // Retirement, Resignation, Medical, Housing, Partial
        public decimal WithdrawalAmount { get; set; }
        public decimal PFBalance { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime ApplicationDate { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public DateTime? RejectedDate { get; set; }
        public DateTime? ProcessedDate { get; set; }

        // Approval
        public Guid? ApproverId { get; set; }
        public string ApproverName { get; set; } = string.Empty;
        public WithdrawalStatus Status { get; set; } = WithdrawalStatus.Pending;
        public string RejectionReason { get; set; } = string.Empty;

        // Processing
        public string BankAccountNumber { get; set; } = string.Empty;
        public string BankIFSC { get; set; } = string.Empty;
        public string TransactionReference { get; set; } = string.Empty;
        public decimal TDSOnWithdrawal { get; set; } // 20% for premature withdrawal

        // Navigation
        public virtual ProvidentFund ProvidentFund { get; set; } = null!;
    }

    /// <summary>
    /// ESI Benefit entity for tracking claims and benefits under ESI coverage
    /// </summary>
    public class ESIBenefit : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public Guid ESIId { get; set; }
        public string BenefitType { get; set; } = string.Empty; // Sickness, Disability, Medical, Hospitalization, Funeral
        public DateTime BenefitStartDate { get; set; }
        public DateTime BenefitEndDate { get; set; }
        public decimal BenefitAmount { get; set; }
        public BenefitStatus Status { get; set; } = BenefitStatus.Active;
    }

    /// <summary>
    /// Statutory Settings entity for system-wide compliance configuration
    /// Includes PF ceiling, ESI ceiling, IT slabs, PT slabs by state
    /// </summary>
    public class StatutorySettings : BaseEntity
    {
        public string SettingKey { get; set; } = string.Empty; // "PF_CEILING", "IT_SLAB_FY2025", "PT_SLAB_MH", etc.
        public string SettingValue { get; set; } = string.Empty; // JSON value for slabs/rates
        public int FinancialYear { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public bool IsActive { get; set; } = true;

        // Examples:
        // PF_CEILING = ₹15,000 (monthly ceiling for PF contribution)
        // ESI_CEILING = ₹21,000 (monthly ceiling for ESI coverage)
        // IT_SLAB_FY2025 = [{"from":0,"to":300000,"rate":0},{"from":300000,"to":700000,"rate":0.05}...]
        // PT_SLAB_MH = [{"from":0,"to":7500,"rate":0},{"from":7500,"to":15000,"rate":150}...]
    }

    /// <summary>
    /// Compliance Report entity for generating statutory reports
    /// Includes PF ECR, ESI Challan, TDS Challan, Form 16
    /// </summary>
    public class ComplianceReport : BaseEntity
    {
        public string ReportType { get; set; } = string.Empty; // PF_ECR, ESI_CHALLAN, TDS_CHALLAN, FORM16, FORM24Q
        public int FinancialYear { get; set; }
        public int MonthYear { get; set; } // YYYYMM for monthly reports
        public DateTime GeneratedDate { get; set; }

        // Report Metadata
        public int TotalEmployees { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal EmployeeContribution { get; set; }
        public decimal EmployerContribution { get; set; }

        // For PF ECR (Employee Contribution Register)
        public string PFDtrCode { get; set; } = string.Empty;
        public string PFEstablishmentId { get; set; } = string.Empty;

        // For ESI Challan
        public string ESIRegistrationNumber { get; set; } = string.Empty;

        // For TDS Challan (Quarterly - Jan, Apr, Jul, Oct)
        public int TDSQuarter { get; set; }
        public string TDSCategory { get; set; } = string.Empty; // Salary, Interest, Rent, etc.

        // For Form 16
        public Guid? EmployeeId { get; set; } // Null for bulk reports
        public string CertificateNumber { get; set; } = string.Empty;
        public string DeductorPAN { get; set; } = string.Empty;

        // Report Status
        public ComplianceReportStatus Status { get; set; } = ComplianceReportStatus.Generated;
        public DateTime SubmissionDeadline { get; set; }
        public DateTime? SubmittedDate { get; set; }
        public string ReferenceNumber { get; set; } = string.Empty; // Government portal reference
        public string FileLocation { get; set; } = string.Empty; // Path to generated file
    }

    /// <summary>
    /// Compliance Audit entity for tracking compliance verification and corrections
    /// </summary>
    public class ComplianceAudit : BaseEntity
    {
        public string AuditType { get; set; } = string.Empty; // PF_AUDIT, ESI_AUDIT, IT_AUDIT, PT_AUDIT
        public int FinancialYear { get; set; }
        public DateTime AuditDate { get; set; }
        public Guid AuditedByUserId { get; set; }
        public string AuditedByName { get; set; } = string.Empty;

        // Audit Details
        public int TotalRecordsChecked { get; set; }
        public int DiscrepanciesFound { get; set; }
        public int CorrectionsMade { get; set; }
        public string AuditFindings { get; set; } = string.Empty; // JSON: detailed findings
        public AuditStatus Status { get; set; } = AuditStatus.InProgress;
        public string Remarks { get; set; } = string.Empty;

        // Timeline
        public DateTime StartDate { get; set; }
        public DateTime? CompletionDate { get; set; }
    }

    // ==================== ENUMS ====================

    public enum PFStatus
    {
        Active = 1,
        Inactive = 2,
        Closed = 3,
        Suspended = 4,
        Frozen = 5
    }

    public enum ESIStatus
    {
        Active = 1,
        Inactive = 2,
        Ceased = 3,
        Exempted = 4,
        OnHold = 5
    }

    public enum ITStatus
    {
        NotCalculated = 1,
        Calculated = 2,
        Verified = 3,
        Assessed = 4,
        Refunded = 5,
        Adjusted = 6
    }

    public enum PTStatus
    {
        Active = 1,
        Inactive = 2,
        Exempt = 3,
        Closed = 4
    }

    public enum TaxRegime
    {
        OldRegime = 1,
        NewRegime = 2
    }

    public enum DeclarationStatus
    {
        Declared = 1,
        ProofPending = 2,
        ProofSubmitted = 3,
        Verified = 4,
        Rejected = 5,
        Revised = 6
    }

    public enum PFWithdrawalType
    {
        Retirement = 1,
        Resignation = 2,
        MedicalEmergency = 3,
        HousingLoan = 4,
        Education = 5,
        Partial = 6,
        Loan = 7
    }

    public enum WithdrawalStatus
    {
        Pending = 1,
        Approved = 2,
        Rejected = 3,
        Processing = 4,
        Completed = 5,
        OnHold = 6,
        Cancelled = 7
    }

    public enum BenefitStatus
    {
        Active = 1,
        Inactive = 2,
        Claimed = 3,
        Approved = 4,
        Rejected = 5,
        Expired = 6
    }

    public enum ComplianceReportStatus
    {
        Generated = 1,
        Pending = 2,
        Submitted = 3,
        Acknowledged = 4,
        Failed = 5,
        Resubmission = 6
    }

    public enum AuditStatus
    {
        InProgress = 1,
        Completed = 2,
        PartiallyCompleted = 3,
        Failed = 4,
        OnHold = 5
    }
}
