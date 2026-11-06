using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    public class WorkflowDefinition : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string ModuleKey { get; set; } = string.Empty; // hrms, finance, procurement, etc.
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public ICollection<WorkflowStep> Steps { get; set; } = new List<WorkflowStep>();
    }

    public class WorkflowStep : BaseEntity
    {
        public Guid WorkflowDefinitionId { get; set; }
        public WorkflowDefinition WorkflowDefinition { get; set; } = null!;
        public int StepOrder { get; set; }
        public string RoleRequired { get; set; } = string.Empty; // Admin, Manager, etc.
        public string ApprovalType { get; set; } = "Any"; // Any/All
        public int? EscalationDays { get; set; }
    }

    public class ApprovalRequest : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string ModuleKey { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty; // e.g., PurchaseOrder
        public Guid EntityId { get; set; }
        public Guid WorkflowDefinitionId { get; set; }
        public WorkflowDefinition WorkflowDefinition { get; set; } = null!;
        public int CurrentStep { get; set; } = 1;
        public string Status { get; set; } = "Pending"; // Pending/Approved/Rejected
        public Guid RequestedBy { get; set; }
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public Guid? RejectedBy { get; set; }
        public DateTime? RejectedAt { get; set; }
        public string? Comments { get; set; }
    }
}
