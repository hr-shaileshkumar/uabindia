using System;

namespace UabIndia.Core.Entities
{
    public class LeaveAllocation : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public Guid LeavePolicyId { get; set; }
        public int Year { get; set; }
        public decimal AllocatedDays { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public string AllocationReason { get; set; } = string.Empty;
        public bool IsProrated { get; set; }
        public decimal? CarryForwardDays { get; set; }
    }
}
