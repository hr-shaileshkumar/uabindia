using System;

namespace UabIndia.Core.Entities
{
    public class ProjectTask : BaseEntity
    {
        public Guid CompanyId { get; set; }
        public Guid ProjectId { get; set; }
        public string TaskCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = "Open"; // Open, InProgress, Done, Cancelled
        public Guid? AssignedToEmployeeId { get; set; }
        public string? AssignedToName { get; set; }
        public Guid? CostCenterId { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal? EstimatedHours { get; set; }
        public int Priority { get; set; } = 2; // 1 high, 2 medium, 3 low
    }

    public class TimesheetEntry : BaseEntity
    {
        public Guid CompanyId { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public Guid ProjectId { get; set; }
        public Guid? ProjectTaskId { get; set; }
        public Guid? CostCenterId { get; set; }
        public DateTime WorkDate { get; set; }
        public decimal Hours { get; set; }
        public string? Notes { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, Submitted, Approved, Rejected
        public string? ApprovedBy { get; set; }
        public DateTime? SubmittedAt { get; set; }
    }
}
