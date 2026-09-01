using System;
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
                .FirstOrDefaultAsync(w => w.ModuleKey == moduleKey && w.TenantId == tenantId && w.IsActive, cancellationToken);
            if (workflow == null)
                throw new InvalidOperationException("No active workflow configured for module.");

            _db.ApprovalRequests.Add(new ApprovalRequest
            {
                TenantId = tenantId,
                ModuleKey = moduleKey,
                EntityType = entityType,
                EntityId = entityId,
                WorkflowDefinitionId = workflow.Id,
                CurrentStep = 1,
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

        private async Task DecideAsync(Guid id, Guid performedBy, string? comments, bool approve, CancellationToken cancellationToken)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var request = await _db.ApprovalRequests.FirstOrDefaultAsync(
                r => r.Id == id && r.TenantId == tenantId, cancellationToken);
            if (request == null)
                throw new KeyNotFoundException("Approval request not found.");
            if (request.Status != "Pending")
                throw new InvalidOperationException("Request is not pending.");

            if (approve)
            {
                request.Status = "Approved";
                request.ApprovedBy = performedBy;
                request.ApprovedAt = DateTime.UtcNow;
            }
            else
            {
                request.Status = "Rejected";
                request.RejectedBy = performedBy;
                request.RejectedAt = DateTime.UtcNow;
            }

            request.Comments = comments ?? request.Comments;
            await _db.SaveChangesAsync(cancellationToken);
        }
    }
}
