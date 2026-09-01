using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class DemandForecastingService : IDemandForecastingService
    {
        private readonly ApplicationDbContext _db;

        public DemandForecastingService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<DemandForecastSummary> GenerateDemandForecastAsync(
            Guid tenantId,
            Guid? warehouseId = null,
            double serviceLevelZScore = 1.65,
            CancellationToken ct = default)
        {
            var summary = new DemandForecastSummary();

            // Load master catalog items
            var query = _db.Items.IgnoreQueryFilters()
                .Where(i => i.TenantId == tenantId && !i.IsDeleted);

            var items = await query.ToListAsync(ct);
            summary.TotalItemsAnalyzed = items.Count;

            // Load historical sales lines over past 90 days
            var cutoffDate = DateTime.UtcNow.AddDays(-90);
            var historicalSales = await _db.SalesInvoiceItems.IgnoreQueryFilters()
                .Where(si => si.TenantId == tenantId && !si.IsDeleted && si.ItemId.HasValue && si.CreatedAt >= cutoffDate)
                .GroupBy(si => si.ItemId!.Value)
                .Select(g => new
                {
                    ItemId = g.Key,
                    TotalSold90Days = g.Sum(x => x.Quantity),
                    TxCount = g.Count()
                })
                .ToListAsync(ct);

            var salesByItem = historicalSales.ToDictionary(h => h.ItemId, h => h.TotalSold90Days);

            foreach (var item in items)
            {
                salesByItem.TryGetValue(item.Id, out var sold90Days);

                // Baseline daily demand estimation (smoothed)
                decimal dailyDemand = sold90Days > 0 ? sold90Days / 90m : (item.ReorderLevel > 0 ? item.ReorderLevel / 30m : 1.5m);
                int leadTime = 7; // standard supplier lead time in days
                decimal unitCost = item.PurchasePrice > 0 ? item.PurchasePrice : (item.SellingPrice > 0 ? item.SellingPrice * 0.7m : 25m);

                // Statistical Safety Stock: SS = Z * sqrt(L * sigma_d^2) (assuming sigma_d ≈ 30% of daily demand)
                double sigmaD = (double)dailyDemand * 0.35;
                double safetyStockDouble = serviceLevelZScore * Math.Sqrt(leadTime * Math.Pow(sigmaD, 2));
                decimal safetyStock = Math.Max(1m, Math.Round((decimal)safetyStockDouble, 2));

                // Reorder Point = (Daily Demand * Lead Time) + Safety Stock
                decimal reorderPoint = Math.Round((dailyDemand * leadTime) + safetyStock, 2);

                // Economic Order Quantity: EOQ = sqrt((2 * D * S) / H)
                // Assuming annual demand D = dailyDemand * 365, ordering cost S = $50, holding cost H = 20% of unit cost
                double annualDemand = (double)dailyDemand * 365.0;
                double orderCost = 50.0;
                double holdingCost = Math.Max(1.0, (double)unitCost * 0.20);
                double eoqDouble = Math.Sqrt((2.0 * annualDemand * orderCost) / holdingCost);
                decimal eoq = Math.Max(1m, Math.Round((decimal)eoqDouble, 0));

                double daysRemaining = dailyDemand > 0 ? (double)(item.CurrentStock / dailyDemand) : 999.0;

                string riskLevel = "Optimal";
                if (item.CurrentStock <= 0 || daysRemaining < leadTime)
                {
                    riskLevel = "Critical";
                    summary.HighRiskItemsCount++;
                }
                else if (item.CurrentStock <= reorderPoint)
                {
                    riskLevel = "High";
                    summary.HighRiskItemsCount++;
                }
                else if (daysRemaining > 120)
                {
                    riskLevel = "Overstocked";
                }

                decimal proj30 = Math.Round(dailyDemand * 30m, 2);
                decimal proj60 = Math.Round(dailyDemand * 60m, 2);
                decimal proj90 = Math.Round(dailyDemand * 90m, 2);

                summary.TotalInventoryValuation += item.CurrentStock * unitCost;
                summary.Projected30DayDemandValue += proj30 * (item.SellingPrice > 0 ? item.SellingPrice : unitCost * 1.3m);

                summary.Items.Add(new ForecastItemAnalysis
                {
                    ItemId = item.Id,
                    ItemCode = item.ItemCode ?? $"SKU-{item.Id.ToString()[..6]}",
                    ItemName = !string.IsNullOrWhiteSpace(item.ItemName) ? item.ItemName : "Product Item",
                    Category = item.Category ?? "General",
                    CurrentStock = item.CurrentStock,
                    UnitPrice = item.SellingPrice > 0 ? item.SellingPrice : unitCost,
                    AverageDailyDemand = Math.Round(dailyDemand, 2),
                    LeadTimeDays = leadTime,
                    RecommendedSafetyStock = safetyStock,
                    EconomicOrderQuantity = eoq,
                    ReorderPoint = reorderPoint,
                    DaysOfInventoryRemaining = Math.Round(daysRemaining, 1),
                    StockoutRiskLevel = riskLevel,
                    ProjectedDemand30Days = proj30,
                    ProjectedDemand60Days = proj60,
                    ProjectedDemand90Days = proj90
                });
            }

            return summary;
        }
    }
}
