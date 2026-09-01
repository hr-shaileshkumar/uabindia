using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class WorkflowApprovalQueryService : IWorkflowApprovalQueryService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public WorkflowApprovalQueryService(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public async Task<WorkflowPendingApproval> GetPendingAsync(
            Guid instanceId,
            IReadOnlyList<string> roleClaims,
            bool mineOnly,
            CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var approval = await _db.ApprovalRequests
                .Include(a => a.WorkflowDefinition)
                .ThenInclude(w => w.Steps)
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == instanceId && a.TenantId == tenantId && !a.IsDeleted, cancellationToken);

            if (approval?.WorkflowDefinition == null)
                throw new KeyNotFoundException("Approval instance not found.");

            var orderedSteps = approval.WorkflowDefinition.Steps
                .OrderBy(step => step.StepOrder)
                .ToList();
            var currentStep = orderedSteps.FirstOrDefault(step => step.StepOrder == approval.CurrentStep);
            var actorRole = roleClaims.FirstOrDefault();
            var adminLike = RoleCatalog.IsAdminLike(roleClaims);
            var terminal = IsTerminalStatus(approval.Status);

            var pendingSteps = orderedSteps
                .Where(step => step.StepOrder >= approval.CurrentStep && !terminal)
                .Select(step => new WorkflowPendingStep(
                    step.StepOrder,
                    step.RoleRequired,
                    step.ApprovalType,
                    step.EscalationDays,
                    adminLike || RoleCatalog.Parse(step.RoleRequired) == RoleCatalog.Parse(actorRole),
                    currentStep?.Id == step.Id))
                .ToList();

            if (mineOnly)
            {
                pendingSteps = pendingSteps
                    .Where(step => step.CanCurrentUserAct && step.IsCurrentStep)
                    .ToList();
            }

            return new WorkflowPendingApproval(
                approval.Id,
                approval.ModuleKey,
                approval.Status,
                approval.CurrentStep,
                pendingSteps);
        }

        private static bool IsTerminalStatus(string? status)
        {
            return string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase)
                || string.Equals(status, "Rejected", StringComparison.OrdinalIgnoreCase)
                || string.Equals(status, "Completed", StringComparison.OrdinalIgnoreCase);
        }
    }
}
