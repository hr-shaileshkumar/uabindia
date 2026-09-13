using System;

namespace UabIndia.Core.Entities
{
    public class CrmLead : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string LeadCode { get; set; } = string.Empty;
        public string LeadName { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string Stage { get; set; } = "New";
        public string Status { get; set; } = "Open";
        public decimal Value { get; set; }
        public int Probability { get; set; }
        public DateTime? ExpectedCloseDate { get; set; }
        public string? OwnerName { get; set; }
        public Guid? OwnerUserId { get; set; }
        public string? Source { get; set; }
        public string? Notes { get; set; }
    }
}
