using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Departmental manpower planning and requisition entity.
    /// Tracks budgeted headcounts, current strength, vacancies, and hiring status.
    /// </summary>
    public class StaffingPlan : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }

        public string PlanCode { get; set; } = string.Empty; // e.g. SP-2026-001
        public string PlanTitle { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Designation { get; set; } = string.Empty;
        public int FiscalYear { get; set; } = DateTime.UtcNow.Year;
        public string Quarter { get; set; } = "Annual"; // Q1, Q2, Q3, Q4, Annual

        public decimal Budget { get; set; } = 0; // Allocated annual budget for this role/department
        public int CurrentHeadcount { get; set; } = 0;
        public int TargetHeadcount { get; set; } = 1;
        public int Vacancies => Math.Max(0, TargetHeadcount - CurrentHeadcount);
        public int HiredCount { get; set; } = 0;

        public string Status { get; set; } = "Draft"; // Draft, Submitted, Approved, Active, Closed
        public DateTime? ApprovedDate { get; set; }
        public Guid? ApprovedBy { get; set; }
        public string? Remarks { get; set; }

        // Navigation
        public ICollection<JobPosting> JobPostings { get; set; } = new List<JobPosting>();
    }
}
