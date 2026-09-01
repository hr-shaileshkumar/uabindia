using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class StockTransferRequest
    {
        public Guid TenantId { get; set; }
        public Guid? CompanyId { get; set; }
        public Guid FromWarehouseId { get; set; }
        public Guid ToWarehouseId { get; set; }
        public Guid ItemId { get; set; }
        public decimal Quantity { get; set; }
        public string? Notes { get; set; }
    }

    public class StockTransferResult
    {
        public bool Success { get; set; }
        public Guid MovementId { get; set; }
        public string TransferNumber { get; set; } = string.Empty;
        public string FromWarehouseName { get; set; } = string.Empty;
        public string ToWarehouseName { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Status { get; set; } = "InTransit";
        public string? ErrorMessage { get; set; }
    }

    public class StockTransferSummary
    {
        public Guid MovementId { get; set; }
        public string TransferNumber { get; set; } = string.Empty;
        public Guid FromWarehouseId { get; set; }
        public string FromWarehouseName { get; set; } = string.Empty;
        public Guid ToWarehouseId { get; set; }
        public string ToWarehouseName { get; set; } = string.Empty;
        public Guid ItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime TransferDate { get; set; }
    }

    public interface IStockTransferService
    {
        Task<StockTransferResult> CreateAndDispatchTransferAsync(StockTransferRequest request, CancellationToken ct = default);
        Task<StockTransferResult> ReceiveTransferAsync(Guid movementId, decimal? receivedQuantity = null, CancellationToken ct = default);
        Task<IReadOnlyList<StockTransferSummary>> GetTransfersAsync(Guid tenantId, Guid? warehouseId = null, string? status = null, CancellationToken ct = default);
    }
}
