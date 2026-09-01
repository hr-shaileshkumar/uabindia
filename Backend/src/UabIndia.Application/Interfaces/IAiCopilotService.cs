using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public enum AiOperationMode
    {
        Read = 0,
        Draft = 1,
        Execute = 2
    }

    public class AiToolInvocation
    {
        public string ToolName { get; set; } = string.Empty;
        public AiOperationMode Mode { get; set; } = AiOperationMode.Read;
        public bool RequiresHumanApproval { get; set; }
        public Dictionary<string, object> Parameters { get; set; } = new();
    }

    public class CopilotQueryRequest
    {
        public Guid TenantId { get; set; }
        public string Prompt { get; set; } = string.Empty;
        public string? ModuleScope { get; set; }
        public Guid? RequestedByUserId { get; set; }
    }

    public class CopilotQueryResponse
    {
        public string Answer { get; set; } = string.Empty;
        public string Intent { get; set; } = "GeneralInquiry";
        public string ToolExecuted { get; set; } = "None";
        public AiOperationMode OperationMode { get; set; } = AiOperationMode.Read;
        public bool RequiresHumanApproval { get; set; }
        public List<string> SuggestedActions { get; set; } = new();
        public Dictionary<string, decimal> Metrics { get; set; } = new();
    }

    public class AnomalyAlert
    {
        public string Module { get; set; } = string.Empty;
        public string Severity { get; set; } = "High"; // High, Medium, Low
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Guid? EntityId { get; set; }
        public DateTime DetectedAtUtc { get; set; }
    }

    public interface IAiCopilotService
    {
        Task<CopilotQueryResponse> ExecutePromptAsync(CopilotQueryRequest request, CancellationToken ct = default);
        Task<IReadOnlyList<AnomalyAlert>> DetectAnomaliesAsync(Guid tenantId, CancellationToken ct = default);
    }
}
