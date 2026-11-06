using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class ExpiringBatchAlert
    {
        public Guid ItemId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string BatchNumber { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public DateTime ExpiryDate { get; set; }
        public int DaysUntilExpiry { get; set; }
        public string RiskLevel { get; set; } = "Warning"; // Critical (<= 7 days), Warning (<= 30 days), Expired (< 0 days)
    }

    public interface IBatchTrackingService
    {
        Task<IReadOnlyList<ExpiringBatchAlert>> GetExpiringBatchesAsync(
            Guid tenantId,
            int daysThreshold = 30,
            CancellationToken ct = default);
    }
}
