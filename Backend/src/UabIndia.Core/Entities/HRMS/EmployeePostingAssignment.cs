using System;

namespace UabIndia.Core.Entities
{
    public class EmployeePostingAssignment : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public Guid? ProjectId { get; set; }

        // 1. Business Management Hierarchy
        public Guid? BusinessClusterId { get; set; }

        // 2. Physical Facility / Base Camp
        public Guid? OperationalLocationId { get; set; }

        // 3. Exact Posting Unit / Van / Desk
        public Guid? PostingUnitId { get; set; }

        // 4. Administrative Geography (Statutory State PT & Local Compliance)
        public Guid? StateId { get; set; }
        public Guid? DistrictId { get; set; }

        // Effective Dating / Temporal History
        public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;
        public DateTime? EffectiveTo { get; set; }
        public bool IsPrimary { get; set; } = true;
        public string AssignmentType { get; set; } = "Permanent"; // Permanent, Deputation, Transfer, Temporary
        public string Status { get; set; } = "Active"; // Active, Expired, Revoked
        public string? Remarks { get; set; }
    }
}
