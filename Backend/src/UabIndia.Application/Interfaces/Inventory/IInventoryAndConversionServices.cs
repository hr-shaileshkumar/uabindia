using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    public interface IInventoryStockService
    {
        Task<StockMovement> RecordAsync(RecordStockMovementCommand command, CancellationToken cancellationToken = default);

        Task<StockMovement> StageInboundAsync(
            Guid itemId,
            decimal quantity,
            decimal unitPrice,
            Guid? warehouseId,
            string referenceType,
            Guid? referenceId,
            string? referenceNumber,
            string? remarks,
            CancellationToken cancellationToken = default);

        Task<StockMovement> StageOutboundAsync(
            Guid itemId,
            decimal quantity,
            decimal unitCost,
            Guid? warehouseId,
            string referenceType,
            Guid? referenceId,
            string? referenceNumber,
            string? remarks,
            CancellationToken cancellationToken = default);
    }

    public sealed record RecordStockMovementCommand(
        DateTime MovementDate,
        string? MovementType,
        Guid ItemId,
        Guid? WarehouseId,
        decimal Quantity,
        decimal UnitPrice,
        decimal TotalValue,
        string? ReferenceType,
        Guid? ReferenceId,
        string? ReferenceNumber,
        string? Remarks,
        string? AdjustmentType,
        Guid? FromWarehouseId,
        Guid? ToWarehouseId);

    public interface IGoodsReceiptService
    {
        Task<GrnAcceptResult> AcceptAsync(Guid id, Guid? warehouseId, CancellationToken cancellationToken = default);
    }

    public sealed record GrnAcceptResult(GoodsReceiptNote Grn, IReadOnlyList<GrnStockPosted> Movements, bool AlreadyAccepted = false);

    public sealed record GrnStockPosted(string MovementNumber, Guid? ItemId, decimal Quantity, decimal UnitPrice);

    public interface IDocumentConversionService
    {
        Task<QuotationConversionResult> ConvertQuotationToOrderAsync(Guid quotationId, CancellationToken cancellationToken = default);
        Task<PurchaseRequestConversion> ConvertPurchaseRequestAsync(Guid requestId, CancellationToken cancellationToken = default);
        Task<LeadConversionResult> ConvertLeadToQuotationAsync(Guid leadId, CancellationToken cancellationToken = default);
    }

    public sealed record QuotationConversionResult(SalesOrder Order, bool AlreadyConverted);

    public sealed record PurchaseRequestConversion(PurchaseRequest Request, Guid PurchaseOrderId, string PoNumber);

    public sealed record LeadConversionResult(Guid QuotationId, Guid CustomerId, SalesQuotation Quotation);
}
