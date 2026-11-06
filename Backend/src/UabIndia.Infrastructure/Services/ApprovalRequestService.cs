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
    public class ApprovalRequestService : IApprovalRequestService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public ApprovalRequestService(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public async Task CreateAsync(
            string moduleKey,
            string entityType,
            Guid entityId,
            string? comments,
            Guid requestedBy,
            CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var workflow = await _db.WorkflowDefinitions
                .Include(w => w.Steps)
                .FirstOrDefaultAsync(w => w.ModuleKey == moduleKey && w.TenantId == tenantId && w.IsActive, cancellationToken);
            if (workflow == null)
                throw new InvalidOperationException("No active workflow configured for module.");

            var initialStep = workflow.Steps?.OrderBy(s => s.StepOrder).FirstOrDefault()?.StepOrder ?? 1;

            _db.ApprovalRequests.Add(new ApprovalRequest
            {
                TenantId = tenantId,
                ModuleKey = moduleKey,
                EntityType = entityType,
                EntityId = entityId,
                WorkflowDefinitionId = workflow.Id,
                CurrentStep = initialStep,
                Status = "Pending",
                RequestedBy = requestedBy,
                RequestedAt = DateTime.UtcNow,
                Comments = comments
            });
            await _db.SaveChangesAsync(cancellationToken);
        }

        public Task ApproveAsync(Guid id, Guid performedBy, string? comments, CancellationToken cancellationToken = default) =>
            DecideAsync(id, performedBy, comments, approve: true, cancellationToken);

        public Task RejectAsync(Guid id, Guid performedBy, string? comments, CancellationToken cancellationToken = default) =>
            DecideAsync(id, performedBy, comments, approve: false, cancellationToken);

        public async Task EscalateAsync(Guid id, Guid performedBy, string? reason, CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var request = await _db.ApprovalRequests
                .Include(r => r.WorkflowDefinition)
                    .ThenInclude(w => w.Steps)
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId, cancellationToken);

            if (request == null)
                throw new KeyNotFoundException("Approval request not found.");
            if (!string.Equals(request.Status, "Pending", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Only pending requests can be escalated.");

            var note = $"[Escalated by {performedBy} at {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC" +
                       (string.IsNullOrWhiteSpace(reason) ? "]" : $": {reason}]");

            // Look for a higher tier step in the workflow
            var nextStep = request.WorkflowDefinition?.Steps?
                .Where(s => s.StepOrder > request.CurrentStep)
                .OrderBy(s => s.StepOrder)
                .FirstOrDefault();

            if (nextStep != null)
            {
                request.CurrentStep = nextStep.StepOrder;
            }

            request.Comments = string.IsNullOrWhiteSpace(request.Comments)
                ? note
                : $"{request.Comments}\n{note}";

            await _db.SaveChangesAsync(cancellationToken);
        }

        private async Task DecideAsync(Guid id, Guid performedBy, string? comments, bool approve, CancellationToken cancellationToken)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var request = await _db.ApprovalRequests
                .Include(r => r.WorkflowDefinition)
                    .ThenInclude(w => w.Steps)
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId, cancellationToken);

            if (request == null)
                throw new KeyNotFoundException("Approval request not found.");
            if (!string.Equals(request.Status, "Pending", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Request is not pending.");

            request.Comments = comments ?? request.Comments;

            if (approve)
            {
                // Multi-tier progression check
                var nextStep = request.WorkflowDefinition?.Steps?
                    .Where(s => s.StepOrder > request.CurrentStep)
                    .OrderBy(s => s.StepOrder)
                    .FirstOrDefault();

                if (nextStep != null)
                {
                    // Advance to next step, remain Pending
                    request.CurrentStep = nextStep.StepOrder;
                }
                else
                {
                    // Final step approved
                    request.Status = "Approved";
                    request.ApprovedBy = performedBy;
                    request.ApprovedAt = DateTime.UtcNow;

                    // Synchronize underlying domain entity
                    await SyncUnderlyingEntityStatusAsync(request, "Approved", performedBy, cancellationToken);
                }
            }
            else
            {
                // Rejection halts workflow immediately
                request.Status = "Rejected";
                request.RejectedBy = performedBy;
                request.RejectedAt = DateTime.UtcNow;

                // Synchronize underlying domain entity
                await SyncUnderlyingEntityStatusAsync(request, "Rejected", performedBy, cancellationToken);
            }

            await _db.SaveChangesAsync(cancellationToken);
        }

        private async Task SyncUnderlyingEntityStatusAsync(ApprovalRequest request, string status, Guid performedBy, CancellationToken ct)
        {
            var entityType = request.EntityType?.Trim();
            if (string.Equals(entityType, "PurchaseOrder", StringComparison.OrdinalIgnoreCase))
            {
                var po = await _db.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == request.EntityId && p.TenantId == request.TenantId, ct);
                if (po != null)
                {
                    if (status == "Approved")
                    {
                        po.Status = "Approved";
                        po.ApprovedBy = performedBy;
                        po.ApprovedDate = DateTime.UtcNow;
                    }
                    else if (status == "Rejected")
                    {
                        po.Status = "Cancelled";
                    }
                }
            }
            else if (string.Equals(entityType, "ExpenseClaim", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(entityType, "Expense", StringComparison.OrdinalIgnoreCase))
            {
                var claim = await _db.ExpenseClaims.FirstOrDefaultAsync(e => e.Id == request.EntityId && e.TenantId == request.TenantId, ct);
                if (claim != null)
                {
                    if (status == "Approved")
                    {
                        claim.Status = "Approved";
                        claim.ApprovedBy = performedBy.ToString();
                    }
                    else if (status == "Rejected")
                    {
                        claim.Status = "Rejected";
                    }
                }
            }
            else if (string.Equals(entityType, "LeaveRequest", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(entityType, "Leave", StringComparison.OrdinalIgnoreCase))
            {
                var leave = await _db.LeaveRequests.FirstOrDefaultAsync(l => l.Id == request.EntityId && l.TenantId == request.TenantId, ct);
                if (leave != null)
                {
                    if (status == "Approved")
                    {
                        leave.Status = "Approved";
                        leave.ApprovedBy = performedBy;
                        leave.ApprovedAt = DateTime.UtcNow;
                    }
                    else if (status == "Rejected")
                    {
                        leave.Status = "Rejected";
                    }
                }
            }
        }
    }
}
