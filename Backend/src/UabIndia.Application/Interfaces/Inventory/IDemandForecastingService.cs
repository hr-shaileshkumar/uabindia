using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class ForecastItemAnalysis
    {
        public Guid ItemId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal CurrentStock { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal AverageDailyDemand { get; set; }
        public int LeadTimeDays { get; set; } = 7;
        public decimal RecommendedSafetyStock { get; set; }
        public decimal EconomicOrderQuantity { get; set; }
        public decimal ReorderPoint { get; set; }
        public double DaysOfInventoryRemaining { get; set; }
        public string StockoutRiskLevel { get; set; } = "Optimal"; // Critical, High, Optimal, Overstocked
        public decimal ProjectedDemand30Days { get; set; }
        public decimal ProjectedDemand60Days { get; set; }
        public decimal ProjectedDemand90Days { get; set; }
    }

    public class DemandForecastSummary
    {
        public int TotalItemsAnalyzed { get; set; }
        public int HighRiskItemsCount { get; set; }
        public decimal TotalInventoryValuation { get; set; }
        public decimal Projected30DayDemandValue { get; set; }
        public List<ForecastItemAnalysis> Items { get; set; } = new();
    }

    public interface IDemandForecastingService
    {
        Task<DemandForecastSummary> GenerateDemandForecastAsync(
            Guid tenantId,
            Guid? warehouseId = null,
            double serviceLevelZScore = 1.65, // 95% service level
            CancellationToken ct = default);
    }
}
