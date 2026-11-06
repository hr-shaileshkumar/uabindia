using System;

namespace UabIndia.Core.Entities
{
    public class EmployeeHierarchyTransfer : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public Guid? CurrentManagerId { get; set; }
        public Guid? ProposedManagerId { get; set; }
        public Guid? CurrentDepartmentId { get; set; }
        public Guid? ProposedDepartmentId { get; set; }
        public string TransferType { get; set; } = "Promotion"; // Promotion, DepartmentTransfer, ManagerReassignment
        public string Reason { get; set; } = string.Empty;
        public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;

        public string OldManagerSignOffStatus { get; set; } = "Pending"; // Pending, Approved, Rejected, NotApplicable
        public string NewManagerSignOffStatus { get; set; } = "Pending"; // Pending, Approved, Rejected
        public string HrbpSignOffStatus { get; set; } = "Pending";       // Pending, Approved, Rejected
        public string OverallStatus { get; set; } = "Pending";           // Pending, Approved, Rejected, Effective

        public string? SignOffNotes { get; set; }
    }
}
