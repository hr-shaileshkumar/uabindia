using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class TrialBalanceRowDto
    {
        public Guid AccountId { get; set; }
        public string AccountCode { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty; // Asset, Liability, Equity, Revenue, Expense
        public decimal OpeningBalance { get; set; }
        public decimal DebitMovement { get; set; }
        public decimal CreditMovement { get; set; }
        public decimal ClosingBalance { get; set; }
    }

    public class ProfitAndLossReportDto
    {
        public string Period { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalCostOfGoodsSold { get; set; }
        public decimal GrossProfit { get; set; }
        public decimal OperatingExpenses { get; set; }
        public decimal Ebitda { get; set; }
        public decimal NetProfit { get; set; }
        public List<AccountSummaryRow> RevenueBreakdown { get; set; } = new();
        public List<AccountSummaryRow> CogsBreakdown { get; set; } = new();
        public List<AccountSummaryRow> ExpenseBreakdown { get; set; } = new();
    }

    public class BalanceSheetReportDto
    {
        public DateTime AsOfDate { get; set; }
        public decimal TotalCurrentAssets { get; set; }
        public decimal TotalNonCurrentAssets { get; set; }
        public decimal TotalAssets { get; set; }
        public decimal TotalCurrentLiabilities { get; set; }
        public decimal TotalNonCurrentLiabilities { get; set; }
        public decimal TotalLiabilities { get; set; }
        public decimal RetainedEarnings { get; set; }
        public decimal TotalEquity { get; set; }
        public decimal TotalLiabilitiesAndEquity { get; set; }
        public List<AccountSummaryRow> AssetsList { get; set; } = new();
        public List<AccountSummaryRow> LiabilitiesList { get; set; } = new();
        public List<AccountSummaryRow> EquityList { get; set; } = new();
    }

    public class CashFlowReportDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal NetCashFromOperatingActivities { get; set; }
        public decimal NetCashFromInvestingActivities { get; set; }
        public decimal NetCashFromFinancingActivities { get; set; }
        public decimal NetChangeInCash { get; set; }
        public decimal OpeningCashBalance { get; set; }
        public decimal ClosingCashBalance { get; set; }
    }

    public class AccountSummaryRow
    {
        public Guid AccountId { get; set; }
        public string AccountCode { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    public interface IFinancialStatementService
    {
        Task<List<TrialBalanceRowDto>> GetTrialBalanceAsync(Guid tenantId, DateTime? asOfDate);
        Task<ProfitAndLossReportDto> GetProfitAndLossAsync(Guid tenantId, DateTime startDate, DateTime endDate);
        Task<BalanceSheetReportDto> GetBalanceSheetAsync(Guid tenantId, DateTime asOfDate);
        Task<CashFlowReportDto> GetCashFlowAsync(Guid tenantId, DateTime startDate, DateTime endDate);
    }
}
