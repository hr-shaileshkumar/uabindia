using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class OvertimeApprovalService : IOvertimeApprovalService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public OvertimeApprovalService(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public async Task<OvertimeApproval> DecideAsync(
            CreateOvertimeApprovalCommand command,
            CancellationToken cancellationToken = default)
        {
            if (command.ApproverId == Guid.Empty)
                throw new UnauthorizedAccessException("Invalid approver");

            var tenantId = _tenantAccessor.GetTenantId();
            var request = await _db.OvertimeRequests.FirstOrDefaultAsync(
                r => r.Id == command.OvertimeRequestId && r.TenantId == tenantId && !r.IsDeleted,
                cancellationToken);
            if (request == null)
                throw new KeyNotFoundException("Overtime request not found");

            var now = DateTime.UtcNow;
            var approval = new OvertimeApproval
            {
                TenantId = tenantId,
                OvertimeRequestId = request.Id,
                ApproverId = command.ApproverId,
                ApproverName = string.IsNullOrWhiteSpace(command.ApproverName) ? "Manager" : command.ApproverName,
                ApproverRole = string.IsNullOrWhiteSpace(command.ApproverRole) ? "Manager" : command.ApproverRole,
                Status = command.Status,
                ApprovalNotes = command.ApprovalNotes,
                RejectionReason = command.RejectionReason,
                ApprovedHours = command.ApprovedHours,
                ApprovedAmount = command.ApprovedAmount,
                ApprovalLevel = 1,
                IsRequired = true,
                CreatedAt = now
            };

            if (command.Status == ApprovalStatus.Approved)
            {
                approval.ApprovedDate = now;
                request.Status = OvertimeRequestStatus.Approved;
            }
            else if (command.Status == ApprovalStatus.Rejected)
            {
                approval.RejectedDate = now;
                request.Status = OvertimeRequestStatus.Rejected;
            }

            request.UpdatedAt = now;
            _db.OvertimeApprovals.Add(approval);
            await _db.SaveChangesAsync(cancellationToken);
            return approval;
        }
    }
}
