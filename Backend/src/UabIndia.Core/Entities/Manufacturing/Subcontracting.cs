using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    // Indian GST Rule 55 Subcontracting / Job Work Delivery Challan
    public class SubcontractOrder : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string DeliveryChallanNumber { get; set; } = string.Empty; // GST Rule 55 Job Work Challan
        public DateTime ChallanDate { get; set; } = DateTime.UtcNow;
        public Guid VendorId { get; set; } // Job Worker
        public Vendor? Vendor { get; set; }
        public string ProcessDescription { get; set; } = string.Empty; // e.g. "Powder Coating", "Heat Treatment", "Zinc Plating"
        public DateTime ExpectedReturnDate { get; set; } = DateTime.UtcNow.AddDays(180); // Maximum 1 year under GST Section 143
        public decimal TotalRawMaterialValue { get; set; }
        public decimal AgreedServiceRate { get; set; }
        public decimal ServiceTaxAmount { get; set; }
        public decimal TotalServiceAmount { get; set; }
        public string Status { get; set; } = "ChallanIssued"; // ChallanIssued, PartiallyReceived, Completed, OverdueChallan
        public string? Notes { get; set; }

        public ICollection<SubcontractItemIssued> IssuedItems { get; set; } = new List<SubcontractItemIssued>();
        public ICollection<SubcontractItemReceived> ReceivedItems { get; set; } = new List<SubcontractItemReceived>();
    }

    public class SubcontractItemIssued : BaseEntity
    {
        public Guid SubcontractOrderId { get; set; }
        public SubcontractOrder? SubcontractOrder { get; set; }
        public Guid RawMaterialItemId { get; set; }
        public Item? RawMaterialItem { get; set; }
        public decimal Quantity { get; set; }
        public string UnitOfMeasure { get; set; } = "Nos";
        public decimal EstimatedUnitValue { get; set; }
        public decimal TotalValue { get; set; }
        public string? BatchNumber { get; set; }
    }

    public class SubcontractItemReceived : BaseEntity
    {
        public Guid SubcontractOrderId { get; set; }
        public SubcontractOrder? SubcontractOrder { get; set; }
        public Guid ProcessedItemId { get; set; }
        public Item? ProcessedItem { get; set; }
        public decimal ReceivedQuantity { get; set; }
        public decimal ScrapGeneratedQuantity { get; set; }
        public string? JobWorkerBillNumber { get; set; }
        public DateTime ReceiveDate { get; set; } = DateTime.UtcNow;
        public bool QualityPassed { get; set; } = true;
        public string? BatchNumber { get; set; }
    }
}

