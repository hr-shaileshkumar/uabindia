using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    // Sales Quotation
    public class SalesQuotation : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string QuotationNumber { get; set; } = string.Empty;
        public DateTime QuotationDate { get; set; }
        public Guid CustomerId { get; set; }
        public Customer Customer { get; set; } = null!;
        public DateTime ValidUntil { get; set; }
        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal ShippingCharges { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, Sent, Accepted, Rejected, Expired
        public string? Terms { get; set; }
        public string? Notes { get; set; }
        public ICollection<SalesQuotationItem> Items { get; set; } = new List<SalesQuotationItem>();
    }

    public class SalesQuotationItem : BaseEntity
    {
        public Guid SalesQuotationId { get; set; }
        public SalesQuotation SalesQuotation { get; set; } = null!;
        public Guid? ItemId { get; set; }
        public Item? Item { get; set; }
        public string? Description { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TaxRate { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountPercent { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }
    }

    // Sales Orders
    public class SalesOrder : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string SONumber { get; set; } = string.Empty;
        public DateTime SODate { get; set; }
        public Guid CustomerId { get; set; }
        public Customer Customer { get; set; } = null!;
        public Guid? SalesQuotationId { get; set; }
        public SalesQuotation? SalesQuotation { get; set; }
        public string? CustomerPONumber { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal ShippingCharges { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, Confirmed, Partial, Completed, Cancelled
        public string? ShippingAddress { get; set; }
        public string? BillingAddress { get; set; }
        public string? Terms { get; set; }
        public string? Notes { get; set; }
        public ICollection<SalesOrderItem> Items { get; set; } = new List<SalesOrderItem>();
    }

    public class SalesOrderItem : BaseEntity
    {
        public Guid SalesOrderId { get; set; }
        public SalesOrder SalesOrder { get; set; } = null!;
        public Guid? ItemId { get; set; }
        public Item? Item { get; set; }
        public string? Description { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TaxRate { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountPercent { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DeliveredQuantity { get; set; }
        public decimal PendingQuantity { get; set; }
    }

    // Sales Invoice
    public class SalesInvoice : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public Guid CustomerId { get; set; }
        public Customer Customer { get; set; } = null!;
        public Guid? SalesOrderId { get; set; }
        public SalesOrder? SalesOrder { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal ShippingCharges { get; set; }
        public decimal OtherCharges { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal BalanceAmount { get; set; }
        public string Status { get; set; } = "Unpaid"; // Unpaid, Partial, Paid, Cancelled
        public string PaymentStatus { get; set; } = "Pending"; // Pending, Partial, Paid, Overdue
        public string? Notes { get; set; }
        public string? PlaceOfSupply { get; set; }
        public bool IsInterState { get; set; }
        public decimal CgstAmount { get; set; }
        public decimal SgstAmount { get; set; }
        public decimal IgstAmount { get; set; }
        public Guid? JournalEntryId { get; set; }
        public ICollection<SalesInvoiceItem> Items { get; set; } = new List<SalesInvoiceItem>();
    }

    public class SalesInvoiceItem : BaseEntity
    {
        public Guid SalesInvoiceId { get; set; }
        public SalesInvoice SalesInvoice { get; set; } = null!;
        public Guid? ItemId { get; set; }
        public Item? Item { get; set; }
        public string? Description { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TaxRate { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountPercent { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }
    }
}
