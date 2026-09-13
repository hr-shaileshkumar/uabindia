using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class ConsolidatedBalanceSheetResult
    {
        public DateTime AsOfDate { get; set; }
        public string TargetCurrency { get; set; } = "USD";
        public List<ConsolidatedEntityBalance> EntityContributions { get; set; } = new();
        public decimal TotalConsolidatedAssets { get; set; }
        public decimal TotalConsolidatedLiabilities { get; set; }
        public decimal TotalConsolidatedEquity { get; set; }
        public decimal InterCompanyEliminationsTotal { get; set; }
        public bool IsBalanced => Math.Abs(TotalConsolidatedAssets - (TotalConsolidatedLiabilities + TotalConsolidatedEquity)) < 0.01m;
    }

    public class ConsolidatedIncomeStatementResult
    {
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public string TargetCurrency { get; set; } = "USD";
        public List<ConsolidatedEntityBalance> EntityContributions { get; set; } = new();
        public decimal TotalConsolidatedRevenue { get; set; }
        public decimal TotalConsolidatedExpenses { get; set; }
        public decimal ConsolidatedNetProfit => TotalConsolidatedRevenue - TotalConsolidatedExpenses;
        public decimal InterCompanyEliminationsTotal { get; set; }
    }

    public class ConsolidatedEntityBalance
    {
        public Guid CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string FunctionalCurrency { get; set; } = "USD";
        public decimal ConvertedAssets { get; set; }
        public decimal ConvertedLiabilities { get; set; }
        public decimal ConvertedEquity { get; set; }
        public decimal ConvertedRevenue { get; set; }
        public decimal ConvertedExpenses { get; set; }
    }

    public interface IFinancialConsolidationService
    {
        Task<ConsolidatedBalanceSheetResult> GenerateConsolidatedBalanceSheetAsync(
            Guid tenantId,
            Guid? parentCompanyId,
            DateTime asOfDate,
            string targetCurrency = "USD",
            CancellationToken ct = default);

        Task<ConsolidatedIncomeStatementResult> GenerateConsolidatedIncomeStatementAsync(
            Guid tenantId,
            Guid? parentCompanyId,
            DateTime fromDate,
            DateTime toDate,
            string targetCurrency = "USD",
            CancellationToken ct = default);
    }
}
