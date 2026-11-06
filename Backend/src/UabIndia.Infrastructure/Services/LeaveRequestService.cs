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
    public class LeaveRequestService : ILeaveRequestService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly INotificationEmitter _notifications;

        public LeaveRequestService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            INotificationEmitter notifications)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _notifications = notifications;
        }

        public async Task<LeaveRequest> ApproveAsync(
            Guid id,
            Guid? approvedByEmployeeId,
            Guid performedByUserId,
            CancellationToken cancellationToken = default)
        {
            var req = await LoadPendingAsync(id, "approved", cancellationToken);
            var tenantId = _tenantAccessor.GetTenantId();

            req.Status = "Approved";
            req.ApprovedAt = DateTime.UtcNow;
            req.ApprovedBy = approvedByEmployeeId;

            var year = req.FromDate.Year;
            var balance = await _db.EmployeeLeaves.FirstOrDefaultAsync(b =>
                b.TenantId == tenantId && !b.IsDeleted &&
                b.EmployeeId == req.EmployeeId &&
                b.LeavePolicyId == req.LeavePolicyId &&
                b.Year == year, cancellationToken);

            if (balance != null)
            {
                balance.Taken += req.Days;
                balance.Balance = Math.Max(0, balance.Entitled - balance.Taken);
                balance.UpdatedAt = DateTime.UtcNow;
            }

            await SyncLeaveWorkflowAsync(req.Id, tenantId, "approve", performedByUserId, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);

            await _notifications.EmitToEmployeeAsync(
                tenantId,
                req.EmployeeId,
                "Leave",
                "Leave request approved",
                $"Your leave request from {req.FromDate:yyyy-MM-dd} to {req.ToDate:yyyy-MM-dd} ({req.Days} day(s)) was approved.",
                new { entityType = "LeaveRequest", entityId = req.Id, href = "/hrms/leave" },
                "leave.approved",
                cancellationToken: cancellationToken);

            return req;
        }

        public async Task<LeaveRequest> RejectAsync(
            Guid id,
            Guid? rejectedByEmployeeId,
            Guid performedByUserId,
            CancellationToken cancellationToken = default)
        {
            var req = await LoadPendingAsync(id, "rejected", cancellationToken);
            var tenantId = _tenantAccessor.GetTenantId();

            req.Status = "Rejected";
            req.ApprovedAt = DateTime.UtcNow;
            req.ApprovedBy = rejectedByEmployeeId;

            await SyncLeaveWorkflowAsync(req.Id, tenantId, "reject", performedByUserId, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);

            await _notifications.EmitToEmployeeAsync(
                tenantId,
                req.EmployeeId,
                "Leave",
                "Leave request rejected",
                $"Your leave request from {req.FromDate:yyyy-MM-dd} to {req.ToDate:yyyy-MM-dd} was rejected.",
                new { entityType = "LeaveRequest", entityId = req.Id, href = "/hrms/leave" },
                "leave.rejected",
                cancellationToken: cancellationToken);

            return req;
        }

        private async Task<LeaveRequest> LoadPendingAsync(Guid id, string action, CancellationToken cancellationToken)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var req = await _db.LeaveRequests.FirstOrDefaultAsync(
                r => r.Id == id && r.TenantId == tenantId, cancellationToken);
            if (req == null)
                throw new KeyNotFoundException("Leave request not found.");
            if (!string.Equals(req.Status, "Pending", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Only pending leave requests can be {action}.");
            return req;
        }

        private async Task SyncLeaveWorkflowAsync(
            Guid leaveRequestId,
            Guid tenantId,
            string actionType,
            Guid performedBy,
            CancellationToken cancellationToken)
        {
            try
            {
                var approval = await _db.ApprovalRequests
                    .Where(a => a.TenantId == tenantId && !a.IsDeleted &&
                                a.ModuleKey == "leave_approval" &&
                                (a.EntityId == leaveRequestId || a.Comments == leaveRequestId.ToString()) &&
                                (a.Status == "Pending" || a.Status == "InProgress"))
                    .OrderByDescending(a => a.RequestedAt)
                    .FirstOrDefaultAsync(cancellationToken);
                if (approval == null) return;

                if (string.Equals(actionType, "approve", StringComparison.OrdinalIgnoreCase))
                {
                    approval.Status = "Approved";
                    approval.ApprovedBy = performedBy;
                    approval.ApprovedAt = DateTime.UtcNow;
                    approval.CurrentStep = Math.Max(approval.CurrentStep, 1);
                }
                else
                {
                    approval.Status = "Rejected";
                    approval.RejectedBy = performedBy;
                    approval.RejectedAt = DateTime.UtcNow;
                }

                approval.UpdatedAt = DateTime.UtcNow;
            }
            catch
            {
                // Direct leave approval remains authoritative if workflow sync fails
            }
        }
    }
}
