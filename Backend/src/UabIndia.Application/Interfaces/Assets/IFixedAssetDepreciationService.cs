using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class AssetDepreciationScheduleDto
    {
        public Guid AssetId { get; set; }
        public string AssetCode { get; set; } = string.Empty;
        public string AssetName { get; set; } = string.Empty;
        public string Category { get; set; } = "Machinery";
        public decimal PurchaseValue { get; set; }
        public decimal SalvageValue { get; set; }
        public decimal CurrentBookValue { get; set; }
        public int UsefulLifeYears { get; set; } = 5;
        public string DepreciationMethod { get; set; } = "StraightLine"; // StraightLine, WrittenDownValue, DoubleDecliningBalance, MACRS
        public decimal AnnualDepreciation { get; set; }
        public decimal MonthlyDepreciation { get; set; }
        public decimal AccumulatedDepreciation { get; set; }
        public decimal ProjectedEndingBookValue { get; set; }
    }

    public class DepreciationRunSummaryDto
    {
        public int FiscalYear { get; set; }
        public int FiscalMonth { get; set; }
        public int TotalAssetsProcessed { get; set; }
        public decimal TotalDepreciationAmount { get; set; }
        public decimal TotalCapitalizationValue { get; set; }
        public decimal TotalNetBookValue { get; set; }
        public string? JournalVoucherNumber { get; set; }
        public DateTime ExecutionDate { get; set; }
        public List<AssetDepreciationScheduleDto> Schedules { get; set; } = new();
    }

    public class PostDepreciationRunRequest
    {
        public int FiscalYear { get; set; } = 2026;
        public int FiscalMonth { get; set; } = 8;
        public string? DepreciationMethodOverride { get; set; }
        public string? Notes { get; set; }
    }

    public interface IFixedAssetDepreciationService
    {
        Task<DepreciationRunSummaryDto> CalculateDepreciationScheduleAsync(
            Guid tenantId,
            int fiscalYear = 2026,
            int fiscalMonth = 8,
            CancellationToken ct = default);

        Task<DepreciationRunSummaryDto> PostDepreciationRunAsync(
            Guid tenantId,
            PostDepreciationRunRequest req,
            CancellationToken ct = default);
    }
}
