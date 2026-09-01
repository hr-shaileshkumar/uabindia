using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    public sealed record DocumentLineCommand(
        Guid? ItemId,
        string? Description,
        decimal Quantity,
        decimal UnitPrice,
        decimal TaxRate);

    public interface ISalesInvoiceService
    {
        Task<SalesInvoice> CreateAsync(CreateSalesInvoiceCommand command, CancellationToken cancellationToken = default);
        Task<SalesInvoice> ConvertOrderAsync(Guid salesOrderId, CancellationToken cancellationToken = default);
    }

    public sealed record CreateSalesInvoiceCommand(
        Guid CustomerId,
        Guid? SalesOrderId,
        DateTime InvoiceDate,
        DateTime? DueDate,
        string? InvoiceNumber,
        decimal SubTotal,
        decimal TaxAmount,
        decimal DiscountAmount,
        decimal ShippingCharges,
        decimal OtherCharges,
        decimal TotalAmount,
        decimal PaidAmount,
        string? Status,
        string? PaymentStatus,
        string? Notes,
        string? PlaceOfSupply,
        decimal TaxRate,
        IReadOnlyList<DocumentLineCommand> Lines,
        Guid? WarehouseId = null);

    public interface IPurchaseInvoiceService
    {
        Task<PurchaseInvoice> CreateAsync(CreatePurchaseInvoiceCommand command, CancellationToken cancellationToken = default);
    }

    public sealed record CreatePurchaseInvoiceCommand(
        Guid PurchaseOrderId,
        Guid VendorId,
        DateTime InvoiceDate,
        DateTime? DueDate,
        string? VendorInvoiceNumber,
        decimal SubTotal,
        decimal TotalAmount,
        decimal DiscountAmount,
        decimal TaxRate,
        string? Notes,
        IReadOnlyList<DocumentLineCommand> Lines);

    public interface IPaymentService
    {
        Task<Payment> RecordAsync(RecordPaymentCommand command, CancellationToken cancellationToken = default);
    }

    public sealed record RecordPaymentCommand(
        DateTime PaymentDate,
        string? PaymentType,
        string? PartyType,
        Guid? PartyId,
        string? PartyName,
        decimal Amount,
        string? PaymentMode,
        string? ReferenceNumber,
        DateTime? ReferenceDate,
        string? BankName,
        string? InvoiceType,
        Guid? InvoiceId,
        string? InvoiceNumber,
        string? Status,
        string? Remarks);

    public interface ICommercialOrderService
    {
        Task<SalesOrder> CreateSalesOrderAsync(CreateSalesOrderCommand command, CancellationToken cancellationToken = default);
        Task<PurchaseOrder> CreatePurchaseOrderAsync(CreatePurchaseOrderCommand command, CancellationToken cancellationToken = default);
        Task<SalesQuotation> CreateSalesQuotationAsync(CreateSalesQuotationCommand command, CancellationToken cancellationToken = default);
    }

    public sealed record CreateSalesOrderCommand(
        string? SoNumber,
        DateTime SoDate,
        Guid CustomerId,
        DateTime? ExpectedDeliveryDate,
        decimal TotalAmount,
        decimal DiscountAmount,
        string? Status,
        string? Notes,
        IReadOnlyList<DocumentLineCommand> Lines);

    public sealed record CreatePurchaseOrderCommand(
        string? PoNumber,
        DateTime PoDate,
        Guid VendorId,
        DateTime? ExpectedDeliveryDate,
        decimal TotalAmount,
        decimal DiscountAmount,
        string? Status,
        string? Notes,
        IReadOnlyList<DocumentLineCommand> Lines);

    public sealed record CreateSalesQuotationCommand(
        string? QuotationNumber,
        DateTime QuotationDate,
        DateTime ValidUntil,
        Guid CustomerId,
        decimal SubTotal,
        decimal TaxAmount,
        decimal DiscountAmount,
        decimal ShippingCharges,
        decimal TotalAmount,
        string? Status,
        string? Terms,
        string? Notes,
        IReadOnlyList<DocumentLineCommand> Lines);

    public static class DocumentLineCommands
    {
        public static List<DocumentLineCommand> WithItem(IEnumerable<DocumentLineCommand>? lines) =>
            (lines ?? Array.Empty<DocumentLineCommand>())
                .Where(line => line.Quantity > 0 && line.ItemId is Guid id && id != Guid.Empty)
                .ToList();

        public static List<DocumentLineCommand> WithQuantity(IEnumerable<DocumentLineCommand>? lines) =>
            (lines ?? Array.Empty<DocumentLineCommand>())
                .Where(line =>
                    line.Quantity > 0
                    && ((line.ItemId is Guid id && id != Guid.Empty) || !string.IsNullOrWhiteSpace(line.Description)))
                .ToList();

        public static (decimal Taxable, decimal Tax, decimal Total) Sum(IEnumerable<DocumentLineCommand> lines)
        {
            decimal taxable = 0;
            decimal tax = 0;
            foreach (var line in lines)
            {
                var lineTaxable = Core.Services.DocumentLineMath.Taxable(line.Quantity, line.UnitPrice);
                taxable += lineTaxable;
                tax += Core.Services.DocumentLineMath.LineTax(lineTaxable, line.TaxRate);
            }

            return (taxable, tax, taxable + tax);
        }
    }
}
