using System;

namespace UabIndia.Core.Entities
{
    public enum AllocationFrequency
    {
        Yearly,
        Monthly,
        Quarterly,
        OnJoining
    }

    public class LeavePolicy : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsDefault { get; set; } = false;
        public string Type { get; set; } = string.Empty;
        public decimal EntitlementPerYear { get; set; }
        public bool CarryForwardAllowed { get; set; }
        public decimal? MaxCarryForward { get; set; }
        public AllocationFrequency AllocationFrequency { get; set; } = AllocationFrequency.Yearly;
        public bool EnableProration { get; set; } = true;
        public bool AutoAllocate { get; set; } = false;
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? DepartmentId { get; set; }
        public string Status { get; set; } = "Active";
    }
}
