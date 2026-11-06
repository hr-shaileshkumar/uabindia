using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Application.Models;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    public interface IWorkflowService
    {
        Task<WorkflowInstanceDto> StartInstanceAsync(StartInstanceRequestDto request, Guid initiatedBy);
        Task<WorkflowInstanceDto> GetInstanceAsync(Guid instanceId);
        Task<WorkflowInstanceDto> PerformActionAsync(Guid instanceId, ActionRequestDto actionRequest, Guid performedBy, string? ifMatchRowVersion = null);
    }

    public interface IWorkflowDefinitionService
    {
        Task<WorkflowDefinition> CreateAsync(CreateWorkflowDefinitionCommand command, CancellationToken cancellationToken = default);
    }

    public sealed record CreateWorkflowDefinitionCommand(
        string? Key,
        string? Name,
        bool IsActive,
        IReadOnlyList<CreateWorkflowStepCommand> Steps);

    public sealed record CreateWorkflowStepCommand(
        int? StepOrder,
        string? RoleRequired,
        string? ApprovalType,
        int? EscalationDays);

    public sealed record WorkflowPendingApproval(
        Guid InstanceId,
        string DefinitionKey,
        string Status,
        int CurrentStepOrder,
        IReadOnlyList<WorkflowPendingStep> PendingApprovals);

    public sealed record WorkflowPendingStep(
        int StepOrder,
        string RoleRequired,
        string? ApprovalType,
        int? EscalationDays,
        bool CanCurrentUserAct,
        bool IsCurrentStep);

    public interface IWorkflowApprovalQueryService
    {
        Task<WorkflowPendingApproval> GetPendingAsync(
            Guid instanceId,
            IReadOnlyList<string> roleClaims,
            bool mineOnly,
            CancellationToken cancellationToken = default);
    }
}
