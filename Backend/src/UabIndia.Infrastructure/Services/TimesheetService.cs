using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class TimesheetService : ITimesheetService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly INotificationEmitter _notifications;

        public TimesheetService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            INotificationEmitter notifications)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _notifications = notifications;
        }

        public async Task<TimesheetEntry> SubmitAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var entry = await LoadAsync(id, cancellationToken);
            if (!string.Equals(entry.Status, "Draft", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Only draft entries can be submitted.");

            entry.Status = "Submitted";
            entry.SubmittedAt = DateTime.UtcNow;
            entry.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return entry;
        }

        public async Task<TimesheetEntry> ApproveAsync(Guid id, string approvedBy, CancellationToken cancellationToken = default)
        {
            var entry = await LoadAsync(id, cancellationToken);
            if (!string.Equals(entry.Status, "Submitted", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Only submitted entries can be approved.");

            entry.Status = "Approved";
            entry.ApprovedBy = string.IsNullOrWhiteSpace(approvedBy) ? "admin" : approvedBy;
            entry.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);

            await _notifications.EmitToEmployeeAsync(
                _tenantAccessor.GetTenantId(),
                entry.EmployeeId,
                "Operations",
                "Timesheet approved",
                $"Your timesheet for {entry.WorkDate:yyyy-MM-dd} ({entry.Hours:N2}h) was approved.",
                new { entityType = "TimesheetEntry", entityId = entry.Id, href = "/projects/timesheets" },
                "timesheet.approved",
                companyId: entry.CompanyId,
                projectId: entry.ProjectId,
                cancellationToken: cancellationToken);

            return entry;
        }

        private async Task<TimesheetEntry> LoadAsync(Guid id, CancellationToken cancellationToken)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var entry = await _db.TimesheetEntries.FirstOrDefaultAsync(
                t => t.Id == id && t.TenantId == tenantId && !t.IsDeleted, cancellationToken);
            if (entry == null)
                throw new KeyNotFoundException("Timesheet entry not found");
            return entry;
        }
    }
}
