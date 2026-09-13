using System;

namespace UabIndia.Core.Entities
{
    public class PurchaseRequest : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string RequestNumber { get; set; } = string.Empty;
        public Guid? RequestedByUserId { get; set; }
        public string RequestedBy { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public Guid? ItemId { get; set; }
        public string ItemDescription { get; set; } = string.Empty;
        public decimal Quantity { get; set; } = 1;
        public string Unit { get; set; } = "Pcs";
        public decimal EstimatedCost { get; set; }
        public DateTime? RequiredDate { get; set; }
        public string Justification { get; set; } = string.Empty;
        public string Status { get; set; } = "Draft";
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public Guid? PurchaseOrderId { get; set; }
        public string? Notes { get; set; }
    }
}
