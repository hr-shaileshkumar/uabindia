using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    public class PolicyMaster : BaseEntity
    {
        public string Code { get; set; } = string.Empty; // e.g. "ATT_LATE_COMING", "LEV_CASUAL"
        public string Category { get; set; } = string.Empty; // "HR_CORE", "ATTENDANCE_TIMESHEET", etc.
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsMandatoryAcknowledgment { get; set; } = false;
        public bool IsSystemCritical { get; set; } = false;
        public int Priority { get; set; } = 10;
        public string Status { get; set; } = "Active"; // Active, Draft, Archived

        public virtual ICollection<PolicyVersion> Versions { get; set; } = new List<PolicyVersion>();
    }

    public class PolicyVersion : BaseEntity
    {
        public Guid PolicyId { get; set; }
        public string Version { get; set; } = "1.0";
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public string Status { get; set; } = "Active"; // Active, Draft, Archived
        public string ChangeLogReason { get; set; } = string.Empty;
        public string AuthorName { get; set; } = string.Empty;
        public string? ApprovedByName { get; set; }
        public DateTime? ApprovedAt { get; set; }

        /// <summary>
        /// JSON-serialized applicability scope: CompanyIds, BranchIds, DepartmentIds, EmploymentTypes, Grades
        /// </summary>
        public string ApplicabilityJson { get; set; } = "{}";

        /// <summary>
        /// JSON-serialized dynamic rule config consumed by the engine
        /// </summary>
        public string RuleConfigJson { get; set; } = "{}";

        /// <summary>
        /// JSON-serialized approval workflow matrix and SLA
        /// </summary>
        public string ApprovalWorkflowJson { get; set; } = "{}";

        public virtual PolicyMaster? Policy { get; set; }
    }
}
