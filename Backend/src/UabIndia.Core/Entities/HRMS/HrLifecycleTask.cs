using System;

namespace UabIndia.Core.Entities
{
    public class HrLifecycleTask : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public string Kind { get; set; } = "Onboarding"; // Onboarding, Offboarding
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = "HR";
        public string Status { get; set; } = "Pending";
        public DateTime? DueDate { get; set; }
        public DateTime? CompletedAt { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public int SortOrder { get; set; }
        public string? Notes { get; set; }
    }
}
