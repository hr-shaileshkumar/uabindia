using System;

namespace UabIndia.Core.Entities
{
    public class GoodsReceiptNote : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string GrnNumber { get; set; } = string.Empty;
        public Guid? PurchaseOrderId { get; set; }
        public string? PoNumber { get; set; }
        public Guid VendorId { get; set; }
        public string? VendorName { get; set; }
        public DateTime ReceivedDate { get; set; }
        public int TotalItems { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "PendingQC"; // PendingQC, Accepted, PartialAccepted, Rejected
        public string? Remarks { get; set; }
    }
}
