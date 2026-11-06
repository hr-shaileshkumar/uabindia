using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class WorkflowDefinitionService : IWorkflowDefinitionService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public WorkflowDefinitionService(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public async Task<WorkflowDefinition> CreateAsync(CreateWorkflowDefinitionCommand command, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(command.Key) || string.IsNullOrWhiteSpace(command.Name))
                throw new InvalidOperationException("Workflow key and name are required.");
            if (command.Steps == null || command.Steps.Count == 0)
                throw new InvalidOperationException("At least one workflow step is required.");

            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
                throw new InvalidOperationException("Tenant context missing");

            var definitionKey = command.Key.Trim().ToLowerInvariant();
            var exists = await _db.WorkflowDefinitions.AnyAsync(w => w.ModuleKey == definitionKey, cancellationToken);
            if (exists)
                throw new InvalidOperationException($"Workflow definition '{definitionKey}' already exists.");

            var workflow = new WorkflowDefinition
            {
                TenantId = tenantId,
                ModuleKey = definitionKey,
                Name = command.Name.Trim(),
                IsActive = command.IsActive,
                Steps = command.Steps
                    .OrderBy(step => step.StepOrder ?? int.MaxValue)
                    .ThenBy(step => step.RoleRequired)
                    .Select((step, index) => new WorkflowStep
                    {
                        TenantId = tenantId,
                        StepOrder = step.StepOrder ?? index + 1,
                        RoleRequired = step.RoleRequired?.Trim() ?? string.Empty,
                        ApprovalType = string.IsNullOrWhiteSpace(step.ApprovalType) ? "Any" : step.ApprovalType.Trim(),
                        EscalationDays = step.EscalationDays
                    })
                    .ToList()
            };

            if (workflow.Steps.Any(step => string.IsNullOrWhiteSpace(step.RoleRequired)))
                throw new InvalidOperationException("Every workflow step must include RoleRequired.");

            _db.WorkflowDefinitions.Add(workflow);
            await _db.SaveChangesAsync(cancellationToken);
            return workflow;
        }
    }
}
