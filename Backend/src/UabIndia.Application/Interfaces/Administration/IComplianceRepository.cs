using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    /// <summary>
    /// Repository interface for Compliance module - PF, ESI, IT, PT management
    /// Includes 60+ methods organized across 8 categories
    /// </summary>
    public interface IComplianceRepository
    {
        // ==================== PROVIDENT FUND OPERATIONS (12 Methods) ====================
        #region Provident Fund Operations

        Task<ProvidentFund?> GetProvidentFundByIdAsync(Guid id);
        Task<ProvidentFund?> GetProvidentFundByEmployeeAsync(Guid employeeId);
        Task<List<ProvidentFund>> GetAllProvidentFundsAsync(int pageNumber = 1, int pageSize = 10);
        Task<List<ProvidentFund>> GetProvidentFundsByFinancialYearAsync(int financialYear);
        Task<List<ProvidentFund>> GetProvidentFundsByDepartmentAsync(Guid departmentId);
        Task<List<ProvidentFund>> GetProvidentFundsByStatusAsync(string status);
        Task<decimal> GetTotalPFBalanceByDepartmentAsync(Guid departmentId);
        Task<decimal> GetTotalPFBalanceByCompanyAsync();
        Task<ProvidentFund> CreateProvidentFundAsync(ProvidentFund pf);
        Task<ProvidentFund> UpdateProvidentFundAsync(ProvidentFund pf);
        Task<bool> DeleteProvidentFundAsync(Guid id);
        Task<List<ProvidentFund>> GetPFClosuresAsync(int financialYear);

        #endregion

        // ==================== PF WITHDRAWAL OPERATIONS (12 Methods) ====================
        #region PF Withdrawal Operations

        Task<PFWithdrawal?> GetPFWithdrawalByIdAsync(Guid id);
        Task<List<PFWithdrawal>> GetPFWithdrawalsByEmployeeAsync(Guid employeeId);
        Task<List<PFWithdrawal>> GetAllPFWithdrawalsAsync(int pageNumber = 1, int pageSize = 10);
        Task<List<PFWithdrawal>> GetPFWithdrawalsByStatusAsync(string status);
        Task<List<PFWithdrawal>> GetPendingPFWithdrawalsAsync();
        Task<List<PFWithdrawal>> GetPFWithdrawalsByTypeAsync(string withdrawalType);
        Task<List<PFWithdrawal>> GetPFWithdrawalsByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<decimal> GetTotalWithdrawalByEmployeeAsync(Guid employeeId);
        Task<PFWithdrawal> CreatePFWithdrawalAsync(PFWithdrawal withdrawal);
        Task<PFWithdrawal> UpdatePFWithdrawalAsync(PFWithdrawal withdrawal);
        Task<bool> DeletePFWithdrawalAsync(Guid id);
        Task<List<PFWithdrawal>> GetUnprocessedWithdrawalsAsync();

        #endregion

        // ==================== ESI OPERATIONS (11 Methods) ====================
        #region ESI Operations

        Task<EmployeeStateInsurance?> GetESIByIdAsync(Guid id);
        Task<EmployeeStateInsurance?> GetESIByEmployeeAsync(Guid employeeId);
        Task<List<EmployeeStateInsurance>> GetAllESIAsync(int pageNumber = 1, int pageSize = 10);
        Task<List<EmployeeStateInsurance>> GetESIByStateAsync(string stateCode);
        Task<List<EmployeeStateInsurance>> GetESIByStatusAsync(string status);
        Task<List<EmployeeStateInsurance>> GetEligibleESIEmployeesAsync();
        Task<List<EmployeeStateInsurance>> GetESIByDateRangeAsync(int monthYear);
        Task<decimal> GetTotalESIContributionAsync(int monthYear);
        Task<EmployeeStateInsurance> CreateESIAsync(EmployeeStateInsurance esi);
        Task<EmployeeStateInsurance> UpdateESIAsync(EmployeeStateInsurance esi);
        Task<bool> DeleteESIAsync(Guid id);

        #endregion

        // ==================== INCOME TAX OPERATIONS (13 Methods) ====================
        #region Income Tax Operations

        Task<IncomeTax?> GetIncomeTaxByIdAsync(Guid id);
        Task<IncomeTax?> GetIncomeTaxByEmployeeAsync(Guid employeeId);
        Task<List<IncomeTax>> GetAllIncomeTaxAsync(int pageNumber = 1, int pageSize = 10);
        Task<List<IncomeTax>> GetIncomeTaxByFinancialYearAsync(int financialYear);
        Task<List<IncomeTax>> GetIncomeTaxByRegimeAsync(string regime);
        Task<List<IncomeTax>> GetIncomeTaxByStatusAsync(string status);
        Task<decimal> CalculateTaxableIncomeAsync(Guid employeeId);
        Task<decimal> CalculateTaxLiabilityAsync(Guid employeeId, string regime);
        Task<decimal> GetTotalTDSDeductedAsync(Guid employeeId);
        Task<decimal> GetTaxRefundableAsync(Guid employeeId);
        Task<IncomeTax> CreateIncomeTaxAsync(IncomeTax incomeTax);
        Task<IncomeTax> UpdateIncomeTaxAsync(IncomeTax incomeTax);
        Task<bool> DeleteIncomeTaxAsync(Guid id);

        #endregion

        // ==================== PROFESSIONAL TAX OPERATIONS (11 Methods) ====================
        #region Professional Tax Operations

        Task<ProfessionalTax?> GetPTByIdAsync(Guid id);
        Task<ProfessionalTax?> GetPTByEmployeeAsync(Guid employeeId);
        Task<List<ProfessionalTax>> GetAllPTAsync(int pageNumber = 1, int pageSize = 10);
        Task<List<ProfessionalTax>> GetPTByStateAsync(string stateCode);
        Task<List<ProfessionalTax>> GetPTByFinancialYearAsync(int financialYear);
        Task<List<ProfessionalTax>> GetPTByStatusAsync(string status);
        Task<decimal> GetTotalPTDeductionAsync(string stateCode, int monthYear);
        Task<List<ProfessionalTax>> GetPTExemptEmployeesAsync();
        Task<ProfessionalTax> CreatePTAsync(ProfessionalTax pt);
        Task<ProfessionalTax> UpdatePTAsync(ProfessionalTax pt);
        Task<bool> DeletePTAsync(Guid id);

        #endregion

        // ==================== TAX DECLARATION OPERATIONS (10 Methods) ====================
        #region Tax Declaration Operations

        Task<TaxDeclaration?> GetTaxDeclarationByIdAsync(Guid id);
        Task<TaxDeclaration?> GetTaxDeclarationByEmployeeAsync(Guid employeeId, int financialYear);
        Task<List<TaxDeclaration>> GetAllTaxDeclarationsAsync(int pageNumber = 1, int pageSize = 10);
        Task<List<TaxDeclaration>> GetTaxDeclarationsByFinancialYearAsync(int financialYear);
        Task<List<TaxDeclaration>> GetPendingProofSubmissionsAsync();
        Task<List<TaxDeclaration>> GetTaxDeclarationsByStatusAsync(string status);
        Task<decimal> GetTotal80CDeductionAsync(Guid employeeId);
        Task<decimal> GetTotalDeductionsAsync(Guid employeeId);
        Task<TaxDeclaration> CreateTaxDeclarationAsync(TaxDeclaration declaration);
        Task<TaxDeclaration> UpdateTaxDeclarationAsync(TaxDeclaration declaration);

        #endregion

        // ==================== COMPLIANCE REPORT OPERATIONS (10 Methods) ====================
        #region Compliance Report Operations

        Task<ComplianceReport?> GetComplianceReportByIdAsync(Guid id);
        Task<List<ComplianceReport>> GetAllComplianceReportsAsync(int pageNumber = 1, int pageSize = 10);
        Task<List<ComplianceReport>> GetComplianceReportsByTypeAsync(string reportType);
        Task<List<ComplianceReport>> GetComplianceReportsByFinancialYearAsync(int financialYear);
        Task<List<ComplianceReport>> GetComplianceReportsByMonthAsync(int monthYear);
        Task<List<ComplianceReport>> GetComplianceReportsByStatusAsync(string status);
        Task<List<ComplianceReport>> GetPendingSubmissionReportsAsync();
        Task<ComplianceReport?> GetLatestReportByTypeAsync(string reportType);
        Task<ComplianceReport> CreateComplianceReportAsync(ComplianceReport report);
        Task<ComplianceReport> UpdateComplianceReportAsync(ComplianceReport report);

        #endregion

        // ==================== COMPLIANCE AUDIT OPERATIONS (10 Methods) ====================
        #region Compliance Audit Operations

        Task<ComplianceAudit?> GetComplianceAuditByIdAsync(Guid id);
        Task<List<ComplianceAudit>> GetAllComplianceAuditsAsync(int pageNumber = 1, int pageSize = 10);
        Task<List<ComplianceAudit>> GetComplianceAuditsByTypeAsync(string auditType);
        Task<List<ComplianceAudit>> GetComplianceAuditsByFinancialYearAsync(int financialYear);
        Task<List<ComplianceAudit>> GetComplianceAuditsByStatusAsync(string status);
        Task<List<ComplianceAudit>> GetInProgressAuditsAsync();
        Task<List<ComplianceAudit>> GetCompletedAuditsAsync();
        Task<int> GetTotalDiscrepanciesByTypeAsync(string auditType);
        Task<ComplianceAudit> CreateComplianceAuditAsync(ComplianceAudit audit);
        Task<ComplianceAudit> UpdateComplianceAuditAsync(ComplianceAudit audit);

        #endregion

        // ==================== STATUTORY SETTINGS OPERATIONS (8 Methods) ====================
        #region Statutory Settings Operations

        Task<StatutorySettings?> GetSettingByKeyAsync(string settingKey);
        Task<List<StatutorySettings>> GetAllActiveSettingsAsync();
        Task<List<StatutorySettings>> GetSettingsByFinancialYearAsync(int financialYear);
        Task<decimal> GetPFCeilingAsync(int financialYear);
        Task<decimal> GetESICeilingAsync(int financialYear);
        Task<List<StatutorySettings>> GetTaxSlabsByYearAsync(int financialYear);
        Task<StatutorySettings> CreateStatutorySettingAsync(StatutorySettings setting);
        Task<StatutorySettings> UpdateStatutorySettingAsync(StatutorySettings setting);

        #endregion

        // ==================== COMPLIANCE STATISTICS (6 Methods) ====================
        #region Compliance Statistics

        Task<int> GetTotalPFEmployeesAsync();
        Task<int> GetTotalESIEligibleEmployeesAsync();
        Task<decimal> GetTotalComplianceDeductionsAsync(Guid employeeId, int monthYear);
        Task<decimal> GetMonthlyComplianceOutflowAsync(int monthYear);
        Task<Dictionary<string, decimal>> GetComplianceBreakdownByTypeAsync(int monthYear);
        Task<List<string>> GetNonCompliantEmployeesAsync(int financialYear);

        #endregion
    }
}
