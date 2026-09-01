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
    public class BatchTrackingService : IBatchTrackingService
    {
        private readonly ApplicationDbContext _db;

        public BatchTrackingService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IReadOnlyList<ExpiringBatchAlert>> GetExpiringBatchesAsync(
            Guid tenantId,
            int daysThreshold = 30,
            CancellationToken ct = default)
        {
            var now = DateTime.UtcNow;
            var thresholdDate = now.AddDays(daysThreshold);

            // Query StockMovements with lot/batch tracking metadata in Remarks or ReferenceNumber
            var batchMovements = await _db.StockMovements.IgnoreQueryFilters()
                .Include(sm => sm.Item)
                .Where(sm => sm.TenantId == tenantId && !sm.IsDeleted &&
                             sm.Remarks != null && sm.Remarks.Contains("Batch:"))
                .OrderByDescending(sm => sm.MovementDate)
                .ToListAsync(ct);

            var alerts = new List<ExpiringBatchAlert>();

            foreach (var sm in batchMovements)
            {
                var expiry = sm.MovementDate.AddDays(90); // Default shelf-life from movement date
                var days = (int)(expiry.Date - now.Date).TotalDays;

                if (days > daysThreshold) continue;

                string riskLevel;
                if (days < 0)
                {
                    riskLevel = "Expired";
                }
                else if (days <= 7)
                {
                    riskLevel = "Critical";
                }
                else
                {
                    riskLevel = "Warning";
                }

                alerts.Add(new ExpiringBatchAlert
                {
                    ItemId = sm.ItemId,
                    ItemCode = sm.Item?.ItemCode ?? "ITEM",
                    ItemName = sm.Item?.ItemName ?? "Item",
                    BatchNumber = sm.ReferenceNumber ?? $"BATCH-{sm.MovementDate:yyyyMMdd}",
                    Quantity = sm.Quantity,
                    ExpiryDate = expiry,
                    DaysUntilExpiry = days,
                    RiskLevel = riskLevel
                });
            }

            return alerts;
        }
    }
}
