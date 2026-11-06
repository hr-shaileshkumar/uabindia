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
    public class AppraisalCycleService : IAppraisalCycleService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IAppraisalRepository _appraisals;

        public AppraisalCycleService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IAppraisalRepository appraisals)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _appraisals = appraisals;
        }

        public async Task<AppraisalCycle> ActivateAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var cycle = await _db.AppraisalCycles.FirstOrDefaultAsync(
                c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted, cancellationToken);
            if (cycle == null)
                throw new KeyNotFoundException("Appraisal cycle not found");

            var activeCycle = await _db.AppraisalCycles.FirstOrDefaultAsync(
                c => c.TenantId == tenantId && c.IsActive && !c.IsDeleted && c.Id != cycle.Id, cancellationToken);
            if (activeCycle != null)
                activeCycle.IsActive = false;

            cycle.IsActive = true;
            cycle.Status = AppraisalCycleStatus.Active;
            cycle.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            await SeedAppraisalsAsync(cycle, cancellationToken);
            return cycle;
        }

        private async Task SeedAppraisalsAsync(AppraisalCycle cycle, CancellationToken cancellationToken)
        {
            var employees = await _db.Employees
                .Where(e => e.TenantId == cycle.TenantId && !e.IsDeleted)
                .ToListAsync(cancellationToken);

            var managers = await _db.Users
                .Where(u => u.TenantId == cycle.TenantId && !u.IsDeleted)
                .ToListAsync(cancellationToken);

            foreach (var employee in employees)
            {
                var manager = managers.FirstOrDefault(m => m.Id == employee.ReportingManagerId);
                if (manager == null || !employee.UserId.HasValue)
                    continue;

                var employeeUserId = employee.UserId.Value;
                if (await _appraisals.AppraisalExistsAsync(employeeUserId, cycle.Id, cycle.TenantId))
                    continue;

                await _appraisals.CreateAppraisalAsync(new PerformanceAppraisal
                {
                    TenantId = cycle.TenantId,
                    EmployeeId = employeeUserId,
                    ManagerId = manager.Id,
                    AppraisalCycleId = cycle.Id,
                    Status = AppraisalStatus.Pending,
                    IsFinalized = false
                });
            }
        }
    }
}
