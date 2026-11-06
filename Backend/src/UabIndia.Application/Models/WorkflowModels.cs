using System;
using System.Collections.Generic;

namespace UabIndia.Application.Models
{
    public class WorkflowInstanceDto
    {
        public Guid Id { get; set; }
        public string DefinitionKey { get; set; } = string.Empty;
        public string BusinessKey { get; set; } = string.Empty;
        public Guid TenantId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string CurrentStepKey { get; set; } = string.Empty;
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string RowVersion { get; set; } = string.Empty;
    }

    public class StartInstanceRequestDto
    {
        public string DefinitionKey { get; set; } = string.Empty;
        public string BusinessKey { get; set; } = string.Empty;
        public Guid TenantId { get; set; }
        public Dictionary<string, object> Variables { get; set; } = new();
    }

    public class ActionRequestDto
    {
        public string ActionType { get; set; } = string.Empty;
        public string StepKey { get; set; } = string.Empty;
        public string Decision { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public string ClientActionId { get; set; } = string.Empty;
        public Dictionary<string, object> Data { get; set; } = new();
    }
}
