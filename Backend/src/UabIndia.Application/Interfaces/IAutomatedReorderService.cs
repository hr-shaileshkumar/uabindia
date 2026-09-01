using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class ReorderEvaluationResult
    {
        public int ItemsEvaluatedCount { get; set; }
        public int LowStockItemsCount { get; set; }
        public int PurchaseRequestsGeneratedCount { get; set; }
        public List<ReorderPurchaseRequestSummary> GeneratedRequests { get; set; } = new();
    }

    public class ReorderPurchaseRequestSummary
    {
        public Guid PurchaseRequestId { get; set; }
        public string RequestNumber { get; set; } = string.Empty;
        public Guid ItemId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public decimal CurrentStock { get; set; }
        public decimal ReorderLevel { get; set; }
        public decimal QuantityToOrder { get; set; }
        public decimal EstimatedCost { get; set; }
    }

    public interface IAutomatedReorderService
    {
        Task<ReorderEvaluationResult> EvaluateAndGeneratePurchaseRequestsAsync(
            Guid tenantId,
            Guid? warehouseId = null,
            CancellationToken ct = default);
    }
}
