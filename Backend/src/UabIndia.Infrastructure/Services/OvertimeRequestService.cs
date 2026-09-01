using System;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class OvertimeRequestService : IOvertimeRequestService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public OvertimeRequestService(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public async Task<OvertimeRequest> CreateAsync(
            CreateOvertimeRequestCommand command,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(command.Reason))
                throw new InvalidOperationException("Reason is required");

            var request = new OvertimeRequest
            {
                TenantId = _tenantAccessor.GetTenantId(),
                EmployeeId = command.EmployeeId,
                OvertimeDate = command.OvertimeDate,
                StartTime = command.StartTime,
                EndTime = command.EndTime,
                BreakMinutes = command.BreakMinutes,
                Reason = command.Reason,
                ProjectCode = command.ProjectCode,
                ProjectId = command.ProjectId,
                OvertimeType = command.OvertimeType,
                ManagerId = command.ManagerId,
                IsPreApproved = command.IsPreApproved,
                CompensationType = command.CompensationType,
                OvertimeRate = command.OvertimeRate <= 0 ? 1.5m : command.OvertimeRate,
                EmployeeNotes = command.EmployeeNotes,
                Status = command.IsPreApproved
                    ? OvertimeRequestStatus.Approved
                    : OvertimeRequestStatus.PendingApproval,
                CreatedAt = DateTime.UtcNow
            };

            OvertimeHoursMath.Apply(request);
            _db.OvertimeRequests.Add(request);
            await _db.SaveChangesAsync(cancellationToken);
            return request;
        }
    }
}
