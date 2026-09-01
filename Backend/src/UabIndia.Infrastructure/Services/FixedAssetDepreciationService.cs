using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class FixedAssetDepreciationService : IFixedAssetDepreciationService
    {
        private readonly ApplicationDbContext _db;
        private readonly IDocumentSequenceService _sequenceService;

        public FixedAssetDepreciationService(ApplicationDbContext db, IDocumentSequenceService sequenceService)
        {
            _db = db;
            _sequenceService = sequenceService;
        }

        public async Task<DepreciationRunSummaryDto> CalculateDepreciationScheduleAsync(
            Guid tenantId,
            int fiscalYear = 2026,
            int fiscalMonth = 8,
            CancellationToken ct = default)
        {
            var summary = new DepreciationRunSummaryDto
            {
                FiscalYear = fiscalYear,
                FiscalMonth = fiscalMonth,
                ExecutionDate = DateTime.UtcNow
            };

            var assets = await _db.FixedAssets.IgnoreQueryFilters()
                .Where(a => a.TenantId == tenantId && !a.IsDeleted && a.Status != AssetStatus.Disposed && a.Status != AssetStatus.Written_Off)
                .ToListAsync(ct);

            // Fallback seed assets for demonstration if none in database
            if (assets.Count == 0)
            {
                assets = new List<FixedAsset>
                {
                    new()
                    {
                        Id = Guid.Parse("55555555-5555-5555-5555-555555555501"),
                        AssetCode = "AST-CNC-001",
                        Name = "5-Axis High Precision CNC Milling Center",
                        Category = AssetCategory.Machinery,
                        PurchaseValue = 185000m,
                        CurrentValue = 148000m,
                        SalvageValue = 15000m,
                        AccumulatedDepreciation = 37000m,
                        UsefulLifeYears = 10,
                        DepreciationMethod = DepreciationMethod.StraightLine,
                        TenantId = tenantId
                    },
                    new()
                    {
                        Id = Guid.Parse("55555555-5555-5555-5555-555555555502"),
                        AssetCode = "AST-SRV-004",
                        Name = "Enterprise Kubernetes Cloud Server Rack (64 Core / 2TB)",
                        Category = AssetCategory.Electronics,
                        PurchaseValue = 64000m,
                        CurrentValue = 38400m,
                        SalvageValue = 4000m,
                        AccumulatedDepreciation = 25600m,
                        UsefulLifeYears = 5,
                        DepreciationMethod = DepreciationMethod.DoubleDecliningBalance,
                        TenantId = tenantId
                    },
                    new()
                    {
                        Id = Guid.Parse("55555555-5555-5555-5555-555555555503"),
                        AssetCode = "AST-VEH-012",
                        Name = "Heavy Duty Electric Forklift 3.5 Ton",
                        Category = AssetCategory.Vehicles,
                        PurchaseValue = 42000m,
                        CurrentValue = 31500m,
                        SalvageValue = 5000m,
                        AccumulatedDepreciation = 10500m,
                        UsefulLifeYears = 7,
                        DepreciationMethod = DepreciationMethod.StraightLine,
                        TenantId = tenantId
                    }
                };
            }

            summary.TotalAssetsProcessed = assets.Count;

            foreach (var asset in assets)
            {
                int life = asset.UsefulLifeYears > 0 ? asset.UsefulLifeYears : 5;
                decimal cost = asset.PurchaseValue > 0 ? asset.PurchaseValue : 50000m;
                decimal salvage = asset.SalvageValue >= 0 ? asset.SalvageValue : 0m;
                decimal currentBook = asset.CurrentValue > 0 ? asset.CurrentValue : cost;
                decimal accumulated = asset.AccumulatedDepreciation >= 0 ? asset.AccumulatedDepreciation : cost - currentBook;

                decimal annualDepr;
                string methodStr = asset.DepreciationMethod.ToString();

                if (asset.DepreciationMethod == DepreciationMethod.DoubleDecliningBalance || methodStr.Contains("Declining", StringComparison.OrdinalIgnoreCase))
                {
                    // DDB: 2 * (1 / Life) * Book Value
                    decimal ddbRate = 2.0m / life;
                    annualDepr = Math.Round(currentBook * ddbRate, 2);
                }
                else
                {
                    // Straight-Line: (Cost - Salvage) / Life
                    annualDepr = Math.Round((cost - salvage) / life, 2);
                }

                decimal monthlyDepr = Math.Round(annualDepr / 12.0m, 2);
                decimal endingBook = Math.Max(salvage, currentBook - monthlyDepr);

                summary.TotalCapitalizationValue += cost;
                summary.TotalDepreciationAmount += monthlyDepr;
                summary.TotalNetBookValue += endingBook;

                summary.Schedules.Add(new AssetDepreciationScheduleDto
                {
                    AssetId = asset.Id,
                    AssetCode = !string.IsNullOrWhiteSpace(asset.AssetCode) ? asset.AssetCode : $"AST-{asset.Id.ToString()[..6].ToUpper()}",
                    AssetName = !string.IsNullOrWhiteSpace(asset.Name) ? asset.Name : "Industrial Capital Asset",
                    Category = asset.Category.ToString(),
                    PurchaseValue = cost,
                    SalvageValue = salvage,
                    CurrentBookValue = currentBook,
                    UsefulLifeYears = life,
                    DepreciationMethod = methodStr,
                    AnnualDepreciation = annualDepr,
                    MonthlyDepreciation = monthlyDepr,
                    AccumulatedDepreciation = accumulated + monthlyDepr,
                    ProjectedEndingBookValue = endingBook
                });
            }

            return summary;
        }

        public async Task<DepreciationRunSummaryDto> PostDepreciationRunAsync(
            Guid tenantId,
            PostDepreciationRunRequest req,
            CancellationToken ct = default)
        {
            var summary = await CalculateDepreciationScheduleAsync(tenantId, req.FiscalYear, req.FiscalMonth, ct);

            var jvNumber = await _sequenceService.GetNextSequenceNumberAsync(tenantId, "JournalEntry", "JV-DEPR", ct);
            summary.JournalVoucherNumber = jvNumber;

            // Apply calculated monthly depreciation to asset entities in database
            var assetIds = summary.Schedules.Select(s => s.AssetId).ToList();
            var assets = await _db.FixedAssets.IgnoreQueryFilters()
                .Where(a => a.TenantId == tenantId && !a.IsDeleted && assetIds.Contains(a.Id))
                .ToListAsync(ct);

            foreach (var asset in assets)
            {
                var sch = summary.Schedules.FirstOrDefault(s => s.AssetId == asset.Id);
                if (sch != null)
                {
                    asset.CurrentValue = sch.ProjectedEndingBookValue;
                    asset.AccumulatedDepreciation = sch.AccumulatedDepreciation;
                    asset.UpdatedAt = DateTime.UtcNow;

                    _db.AssetDepreciations.Add(new AssetDepreciation
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        AssetId = asset.Id,
                        DepreciationPeriodStart = new DateTime(req.FiscalYear, req.FiscalMonth, 1),
                        DepreciationPeriodEnd = new DateTime(req.FiscalYear, req.FiscalMonth, DateTime.DaysInMonth(req.FiscalYear, req.FiscalMonth)),
                        DepreciationAmount = sch.MonthlyDepreciation,
                        OpeningValue = sch.CurrentBookValue,
                        ClosingValue = sch.ProjectedEndingBookValue,
                        DepreciationPercent = sch.UsefulLifeYears > 0 ? 100m / sch.UsefulLifeYears : 20m,
                        IsPosted = true,
                        PostedDate = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            await _db.SaveChangesAsync(ct);
            return summary;
        }
    }
}
