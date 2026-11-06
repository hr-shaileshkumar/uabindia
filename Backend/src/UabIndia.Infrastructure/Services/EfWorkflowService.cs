using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Application.Models;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    // EF-backed implementation of IWorkflowService. Basic, transactional behavior suitable for production wiring.
    public class EfWorkflowService : IWorkflowService
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<EfWorkflowService> _logger;

        public EfWorkflowService(ApplicationDbContext db, ILogger<EfWorkflowService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<WorkflowInstanceDto> GetInstanceAsync(Guid instanceId)
        {
            var req = await _db.ApprovalRequests
                .Include(a => a.WorkflowDefinition)
                .FirstOrDefaultAsync(a => a.Id == instanceId);

            if (req == null)
            {
                throw new InvalidOperationException("Instance not found");
            }

            return MapToDto(req);
        }

        public async Task<WorkflowInstanceDto> StartInstanceAsync(StartInstanceRequestDto request, Guid initiatedBy)
        {
            // Resolve workflow definition by the request.DefinitionKey (stored in WorkflowDefinition.ModuleKey)
            var workflow = await _db.WorkflowDefinitions
                .Include(w => w.Steps)
                .FirstOrDefaultAsync(w => w.ModuleKey == request.DefinitionKey);

            if (workflow == null)
            {
                throw new InvalidOperationException($"Workflow definition '{request.DefinitionKey}' not found.");
            }

            // Try parse BusinessKey as Guid, otherwise generate one and keep original string in Comments
            Guid entityId;
            var businessKey = request.BusinessKey ?? string.Empty;
            if (!Guid.TryParse(businessKey, out entityId))
            {
                entityId = Guid.NewGuid();
            }

            var approval = new ApprovalRequest
            {
                TenantId = request.TenantId,
                ModuleKey = request.DefinitionKey,
                EntityType = request.Variables != null && request.Variables.TryGetValue("entityType", out var et)
                    ? et?.ToString() ?? string.Empty
                    : string.Empty,
                EntityId = entityId,
                WorkflowDefinitionId = workflow.Id,
                CurrentStep = 1,
                Status = "Pending",
                RequestedBy = initiatedBy,
                RequestedAt = DateTime.UtcNow,
                Comments = businessKey
            };

            _db.ApprovalRequests.Add(approval);
            await _db.SaveChangesAsync();

            return MapToDto(approval);
        }

        public async Task<WorkflowInstanceDto> PerformActionAsync(Guid instanceId, ActionRequestDto actionRequest, Guid performedBy, string? ifMatchRowVersion = null)
        {
            var approval = await _db.ApprovalRequests
                .Include(a => a.WorkflowDefinition)
                .ThenInclude(w => w.Steps)
                .FirstOrDefaultAsync(a => a.Id == instanceId);

            if (approval == null)
                throw new InvalidOperationException("Instance not found");

            // Concurrency: compare provided ifMatch against current UpdatedAt ticks
            var currentVersion = GetVersionToken(approval);
            if (!string.IsNullOrEmpty(ifMatchRowVersion) && !string.Equals(ifMatchRowVersion, currentVersion, StringComparison.Ordinal))
            {
                throw new InvalidOperationException("RowVersion mismatch");
            }

            var action = (actionRequest?.ActionType ?? string.Empty).ToLowerInvariant();

            switch (action)
            {
                case "submit":
                    approval.Status = "InProgress";
                    approval.CurrentStep = Math.Min(approval.CurrentStep + 1, approval.WorkflowDefinition.Steps.Count == 0 ? approval.CurrentStep : approval.WorkflowDefinition.Steps.Count);
                    break;
                case "approve":
                    approval.ApprovedBy = performedBy;
                    approval.ApprovedAt = DateTime.UtcNow;
                    // advance step or complete
                    if (approval.CurrentStep >= approval.WorkflowDefinition.Steps.Count)
                    {
                        approval.Status = "Approved";
                    }
                    else
                    {
                        approval.CurrentStep++;
                        approval.Status = "InProgress";
                    }
                    break;
                case "reject":
                    approval.RejectedBy = performedBy;
                    approval.RejectedAt = DateTime.UtcNow;
                    approval.Status = "Rejected";
                    break;
                case "complete":
                    approval.Status = "Completed";
                    break;
                default:
                    // store notes if provided
                    if (!string.IsNullOrWhiteSpace(actionRequest?.Notes))
                    {
                        approval.Comments = actionRequest.Notes;
                    }
                    break;
            }

            await _db.SaveChangesAsync();
            return MapToDto(approval);
        }

        private static string GetVersionToken(ApprovalRequest approval)
        {
            var ticks = (approval.UpdatedAt ?? approval.RequestedAt).Ticks;
            return Convert.ToBase64String(BitConverter.GetBytes(ticks));
        }

        private static WorkflowInstanceDto MapToDto(ApprovalRequest approval)
        {
            return new WorkflowInstanceDto
            {
                Id = approval.Id,
                DefinitionKey = approval.ModuleKey,
                BusinessKey = approval.Comments ?? approval.EntityId.ToString(),
                TenantId = approval.TenantId,
                Status = approval.Status,
                CurrentStepKey = $"step_{approval.CurrentStep}",
                CreatedBy = approval.RequestedBy == Guid.Empty ? "system" : approval.RequestedBy.ToString(),
                CreatedAt = approval.RequestedAt,
                RowVersion = GetVersionToken(approval)
            };
        }
    }
}
