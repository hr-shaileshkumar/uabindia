using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    // Purchase Orders
    public class PurchaseOrder : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string PONumber { get; set; } = string.Empty;
        public DateTime PODate { get; set; }
        public Guid VendorId { get; set; }
        public Vendor Vendor { get; set; } = null!;
        public string? VendorReference { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal ShippingCharges { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, Submitted, Approved, Partial, Received, Cancelled
        public string? ShippingAddress { get; set; }
        public string? BillingAddress { get; set; }
        public string? Terms { get; set; }
        public string? Notes { get; set; }
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
    }

    public class PurchaseOrderItem : BaseEntity
    {
        public Guid PurchaseOrderId { get; set; }
        public PurchaseOrder PurchaseOrder { get; set; } = null!;
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
        public decimal ReceivedQuantity { get; set; }
        public decimal PendingQuantity { get; set; }
    }

    // Purchase Invoice
    public class PurchaseInvoice : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public Guid VendorId { get; set; }
        public Vendor Vendor { get; set; } = null!;
        public Guid? PurchaseOrderId { get; set; }
        public PurchaseOrder? PurchaseOrder { get; set; }
        public string? VendorInvoiceNumber { get; set; }
        public DateTime? VendorInvoiceDate { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal OtherCharges { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal BalanceAmount { get; set; }
        public string Status { get; set; } = "Unpaid"; // Unpaid, Partial, Paid, Cancelled
        public string PaymentStatus { get; set; } = "Pending"; // Pending, Partial, Paid, Overdue
        public string? Notes { get; set; }
        public ICollection<PurchaseInvoiceItem> Items { get; set; } = new List<PurchaseInvoiceItem>();
    }

    public class PurchaseInvoiceItem : BaseEntity
    {
        public Guid PurchaseInvoiceId { get; set; }
        public PurchaseInvoice PurchaseInvoice { get; set; } = null!;
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
