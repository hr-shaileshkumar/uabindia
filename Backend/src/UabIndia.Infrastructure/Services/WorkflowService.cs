using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Application.Models;

namespace UabIndia.Infrastructure.Services
{
    // Simple in-memory implementation useful for local testing and prototypes.
    public class WorkflowService : IWorkflowService
    {
        private readonly ConcurrentDictionary<Guid, WorkflowInstanceDto> _instances = new();

        public Task<WorkflowInstanceDto> GetInstanceAsync(Guid instanceId)
        {
            _instances.TryGetValue(instanceId, out var instance);
            if (instance == null)
            {
                throw new InvalidOperationException("Instance not found");
            }

            return Task.FromResult(instance);
        }

        public Task<WorkflowInstanceDto> StartInstanceAsync(StartInstanceRequestDto request, Guid initiatedBy)
        {
            var id = Guid.NewGuid();
            // Try to pick a reasonable start step for common examples
            var startStep = request.DefinitionKey switch
            {
                "leave_approval" => "apply",
                "payroll_approval" => "submit_run",
                "purchase_approval" => "create_request",
                _ => "start"
            };

            var instance = new WorkflowInstanceDto
            {
                Id = id,
                DefinitionKey = request.DefinitionKey,
                BusinessKey = request.BusinessKey,
                TenantId = request.TenantId,
                Status = "Pending",
                CurrentStepKey = startStep,
                CreatedBy = initiatedBy == Guid.Empty ? "system" : initiatedBy.ToString(),
                CreatedAt = DateTime.UtcNow,
                RowVersion = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            };

            _instances[id] = instance;
            return Task.FromResult(instance);
        }

        public Task<WorkflowInstanceDto> PerformActionAsync(Guid instanceId, ActionRequestDto actionRequest, Guid performedBy, string? ifMatchRowVersion = null)
        {
            if (!_instances.TryGetValue(instanceId, out var instance))
                throw new InvalidOperationException("Instance not found");

            // Concurrency check
            if (!string.IsNullOrEmpty(ifMatchRowVersion) && !string.Equals(ifMatchRowVersion, instance.RowVersion, StringComparison.Ordinal))
            {
                throw new InvalidOperationException("RowVersion mismatch");
            }

            // Basic state transitions (demo only)
            var previousStep = instance.CurrentStepKey;
            switch (actionRequest.ActionType?.ToLowerInvariant())
            {
                case "submit":
                    instance.Status = "InProgress";
                    instance.CurrentStepKey = previousStep switch
                    {
                        "apply" => "manager_approval",
                        "submit_run" => "finance_approval",
                        "create_request" => "manager_approval",
                        _ => "in_progress"
                    };
                    break;
                case "approve":
                    // naive next-step mapping for examples
                    instance.CurrentStepKey = (instance.CurrentStepKey) switch
                    {
                        "manager_approval" => instance.DefinitionKey == "leave_approval" ? "hr_approval" : "procurement_approval",
                        "finance_approval" => instance.DefinitionKey == "payroll_approval" ? "post_processing" : "create_po",
                        "procurement_approval" => "finance_approval",
                        "hr_approval" => "payroll_notify",
                        "exec_approval" => "post_processing",
                        _ => "completed"
                    };
                    instance.Status = instance.CurrentStepKey == "completed" ? "Completed" : "InProgress";
                    break;
                case "reject":
                    instance.Status = "Rejected";
                    instance.CurrentStepKey = "completed";
                    break;
                case "complete":
                    instance.Status = "Completed";
                    instance.CurrentStepKey = "completed";
                    break;
                default:
                    // no-op: update notes
                    break;
            }

            // update rowversion
            instance.RowVersion = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
            _instances[instanceId] = instance;
            return Task.FromResult(instance);
        }
    }
}
