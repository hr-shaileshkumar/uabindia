using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Repositories
{
    public class OvertimeRepository : IOvertimeRepository
    {
        private readonly ApplicationDbContext _context;

        public OvertimeRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        #region Overtime Request Operations

        public async Task<OvertimeRequest?> GetOvertimeRequestByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.OvertimeRequests
                .Include(or => or.Approvals)
                .Include(or => or.OvertimeLog)
                .AsNoTracking()
                .FirstOrDefaultAsync(or => or.Id == id && or.TenantId == tenantId && !or.IsDeleted);
        }

        public async Task<IEnumerable<OvertimeRequest>> GetAllOvertimeRequestsAsync(Guid tenantId, int skip = 0, int take = 50)
        {
            return await _context.OvertimeRequests
                .AsNoTracking()
                .Where(or => or.TenantId == tenantId && !or.IsDeleted)
                .OrderByDescending(or => or.OvertimeDate)
                .Skip(skip)
                .Take(Math.Clamp(take, 1, 100))
                .ToListAsync();
        }

        public async Task<IEnumerable<OvertimeRequest>> GetOvertimeRequestsByEmployeeAsync(Guid employeeId, Guid tenantId)
        {
            return await _context.OvertimeRequests
                .Include(or => or.Approvals)
                .AsNoTracking()
                .Where(or => or.EmployeeId == employeeId && or.TenantId == tenantId && !or.IsDeleted)
                .OrderByDescending(or => or.OvertimeDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<OvertimeRequest>> GetOvertimeRequestsByManagerAsync(Guid managerId, Guid tenantId)
        {
            return await _context.OvertimeRequests
                .AsNoTracking()
                .Where(or => or.ManagerId == managerId && or.TenantId == tenantId && !or.IsDeleted)
                .OrderByDescending(or => or.OvertimeDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<OvertimeRequest>> GetOvertimeRequestsByStatusAsync(OvertimeRequestStatus status, Guid tenantId)
        {
            return await _context.OvertimeRequests
                .AsNoTracking()
                .Where(or => or.Status == status && or.TenantId == tenantId && !or.IsDeleted)
                .OrderByDescending(or => or.OvertimeDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<OvertimeRequest>> GetOvertimeRequestsByDateRangeAsync(DateTime startDate, DateTime endDate, Guid tenantId)
        {
            return await _context.OvertimeRequests
                .AsNoTracking()
                .Where(or => or.OvertimeDate >= startDate 
                    && or.OvertimeDate <= endDate 
                    && or.TenantId == tenantId 
                    && !or.IsDeleted)
                .OrderBy(or => or.OvertimeDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<OvertimeRequest>> GetPendingOvertimeRequestsAsync(Guid tenantId)
        {
            return await _context.OvertimeRequests
                .AsNoTracking()
                .Where(or => or.Status == OvertimeRequestStatus.PendingApproval 
                    && or.TenantId == tenantId 
                    && !or.IsDeleted)
                .OrderBy(or => or.OvertimeDate)
                .ToListAsync();
        }

        public async Task<OvertimeRequest> CreateOvertimeRequestAsync(OvertimeRequest request)
        {
            OvertimeHoursMath.Apply(request);

            if (request.Status == OvertimeRequestStatus.Draft)
            {
                request.Status = request.IsPreApproved
                    ? OvertimeRequestStatus.Approved
                    : OvertimeRequestStatus.PendingApproval;
            }

            _context.OvertimeRequests.Add(request);
            await _context.SaveChangesAsync();
            return request;
        }

        public async Task<OvertimeRequest> UpdateOvertimeRequestAsync(OvertimeRequest request)
        {
            OvertimeHoursMath.Apply(request);

            _context.OvertimeRequests.Update(request);
            await _context.SaveChangesAsync();
            return request;
        }

        public async Task DeleteOvertimeRequestAsync(Guid id, Guid tenantId)
        {
            var request = await _context.OvertimeRequests
                .FirstOrDefaultAsync(or => or.Id == id && or.TenantId == tenantId && !or.IsDeleted);

            if (request != null)
            {
                request.IsDeleted = true;

                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region Overtime Approval Operations

        public async Task<OvertimeApproval?> GetOvertimeApprovalByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.OvertimeApprovals
                .Include(oa => oa.OvertimeRequest)
                .AsNoTracking()
                .FirstOrDefaultAsync(oa => oa.Id == id && oa.TenantId == tenantId && !oa.IsDeleted);
        }

        public async Task<IEnumerable<OvertimeApproval>> GetApprovalsByRequestAsync(Guid requestId, Guid tenantId)
        {
            return await _context.OvertimeApprovals
                .AsNoTracking()
                .Where(oa => oa.OvertimeRequestId == requestId && oa.TenantId == tenantId && !oa.IsDeleted)
                .OrderBy(oa => oa.ApprovalLevel)
                .ToListAsync();
        }

        public async Task<IEnumerable<OvertimeApproval>> GetApprovalsByApproverAsync(Guid approverId, Guid tenantId)
        {
            return await _context.OvertimeApprovals
                .Include(oa => oa.OvertimeRequest)
                .AsNoTracking()
                .Where(oa => oa.ApproverId == approverId && oa.TenantId == tenantId && !oa.IsDeleted)
                .OrderByDescending(oa => oa.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<OvertimeApproval>> GetPendingApprovalsAsync(Guid approverId, Guid tenantId)
        {
            return await _context.OvertimeApprovals
                .Include(oa => oa.OvertimeRequest)
                .AsNoTracking()
                .Where(oa => oa.ApproverId == approverId 
                    && oa.Status == ApprovalStatus.Pending 
                    && oa.TenantId == tenantId 
                    && !oa.IsDeleted)
                .OrderBy(oa => oa.OvertimeRequest.OvertimeDate)
                .ToListAsync();
        }

        public async Task<OvertimeApproval> CreateOvertimeApprovalAsync(OvertimeApproval approval)
        {
            _context.OvertimeApprovals.Add(approval);
            await _context.SaveChangesAsync();
            return approval;
        }

        public async Task<OvertimeApproval> UpdateOvertimeApprovalAsync(OvertimeApproval approval)
        {
            // Set approval/rejection dates
            if (approval.Status == ApprovalStatus.Approved && !approval.ApprovedDate.HasValue)
            {
                approval.ApprovedDate = DateTime.UtcNow;
            }
            else if (approval.Status == ApprovalStatus.Rejected && !approval.RejectedDate.HasValue)
            {
                approval.RejectedDate = DateTime.UtcNow;
            }

            _context.OvertimeApprovals.Update(approval);
            await _context.SaveChangesAsync();
            return approval;
        }

        public async Task DeleteOvertimeApprovalAsync(Guid id, Guid tenantId)
        {
            var approval = await _context.OvertimeApprovals
                .FirstOrDefaultAsync(oa => oa.Id == id && oa.TenantId == tenantId && !oa.IsDeleted);

            if (approval != null)
            {
                approval.IsDeleted = true;

                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region Overtime Log Operations

        public async Task<OvertimeLog?> GetOvertimeLogByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.OvertimeLogs
                .Include(ol => ol.OvertimeRequest)
                .AsNoTracking()
                .FirstOrDefaultAsync(ol => ol.Id == id && ol.TenantId == tenantId && !ol.IsDeleted);
        }

        public async Task<OvertimeLog?> GetOvertimeLogByRequestIdAsync(Guid requestId, Guid tenantId)
        {
            return await _context.OvertimeLogs
                .AsNoTracking()
                .FirstOrDefaultAsync(ol => ol.OvertimeRequestId == requestId && ol.TenantId == tenantId && !ol.IsDeleted);
        }

        public async Task<IEnumerable<OvertimeLog>> GetAllOvertimeLogsAsync(Guid tenantId, int skip = 0, int take = 50)
        {
            return await _context.OvertimeLogs
                .AsNoTracking()
                .Where(ol => ol.TenantId == tenantId && !ol.IsDeleted)
                .OrderByDescending(ol => ol.OvertimeDate)
                .Skip(skip)
                .Take(Math.Clamp(take, 1, 100))
                .ToListAsync();
        }

        public async Task<IEnumerable<OvertimeLog>> GetOvertimeLogsByEmployeeAsync(Guid employeeId, Guid tenantId)
        {
            return await _context.OvertimeLogs
                .AsNoTracking()
                .Where(ol => ol.EmployeeId == employeeId && ol.TenantId == tenantId && !ol.IsDeleted)
                .OrderByDescending(ol => ol.OvertimeDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<OvertimeLog>> GetOvertimeLogsByDateRangeAsync(DateTime startDate, DateTime endDate, Guid tenantId)
        {
            return await _context.OvertimeLogs
                .AsNoTracking()
                .Where(ol => ol.OvertimeDate >= startDate 
                    && ol.OvertimeDate <= endDate 
                    && ol.TenantId == tenantId 
                    && !ol.IsDeleted)
                .OrderBy(ol => ol.OvertimeDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<OvertimeLog>> GetUnprocessedOvertimeLogsAsync(Guid tenantId)
        {
            return await _context.OvertimeLogs
                .AsNoTracking()
                .Where(ol => !ol.IsProcessedInPayroll && ol.TenantId == tenantId && !ol.IsDeleted)
                .OrderBy(ol => ol.OvertimeDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<OvertimeLog>> GetOvertimeLogsByPayrollRunAsync(Guid payrollRunId, Guid tenantId)
        {
            return await _context.OvertimeLogs
                .AsNoTracking()
                .Where(ol => ol.PayrollRunId == payrollRunId && ol.TenantId == tenantId && !ol.IsDeleted)
                .OrderBy(ol => ol.EmployeeId)
                .ToListAsync();
        }

        public async Task<OvertimeLog> CreateOvertimeLogAsync(OvertimeLog log)
        {
            // Calculate overtime amount
            log.OvertimeAmount = log.OvertimeHours * log.OvertimeRate;

            _context.OvertimeLogs.Add(log);
            await _context.SaveChangesAsync();
            return log;
        }

        public async Task<OvertimeLog> UpdateOvertimeLogAsync(OvertimeLog log)
        {
            // Recalculate amount if hours or rate changed
            log.OvertimeAmount = log.OvertimeHours * log.OvertimeRate;

            if (log.IsProcessedInPayroll && !log.PayrollProcessedDate.HasValue)
            {
                log.PayrollProcessedDate = DateTime.UtcNow;
            }

            _context.OvertimeLogs.Update(log);
            await _context.SaveChangesAsync();
            return log;
        }

        public async Task DeleteOvertimeLogAsync(Guid id, Guid tenantId)
        {
            var log = await _context.OvertimeLogs
                .FirstOrDefaultAsync(ol => ol.Id == id && ol.TenantId == tenantId && !ol.IsDeleted);

            if (log != null)
            {
                log.IsDeleted = true;

                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region Overtime Compensation Operations

        public async Task<OvertimeCompensation?> GetOvertimeCompensationByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.OvertimeCompensations
                .Include(oc => oc.OvertimeLog)
                .AsNoTracking()
                .FirstOrDefaultAsync(oc => oc.Id == id && oc.TenantId == tenantId && !oc.IsDeleted);
        }

        public async Task<IEnumerable<OvertimeCompensation>> GetAllOvertimeCompensationsAsync(Guid tenantId, int skip = 0, int take = 50)
        {
            return await _context.OvertimeCompensations
                .AsNoTracking()
                .Where(oc => oc.TenantId == tenantId && !oc.IsDeleted)
                .OrderByDescending(oc => oc.CreatedAt)
                .Skip(skip)
                .Take(Math.Clamp(take, 1, 100))
                .ToListAsync();
        }

        public async Task<IEnumerable<OvertimeCompensation>> GetCompensationsByEmployeeAsync(Guid employeeId, Guid tenantId)
        {
            return await _context.OvertimeCompensations
                .Include(oc => oc.OvertimeLog)
                .AsNoTracking()
                .Where(oc => oc.EmployeeId == employeeId && oc.TenantId == tenantId && !oc.IsDeleted)
                .OrderByDescending(oc => oc.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<OvertimeCompensation>> GetCompensationsByStatusAsync(CompensationStatus status, Guid tenantId)
        {
            return await _context.OvertimeCompensations
                .AsNoTracking()
                .Where(oc => oc.Status == status && oc.TenantId == tenantId && !oc.IsDeleted)
                .OrderBy(oc => oc.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<OvertimeCompensation>> GetUnpaidCompensationsAsync(Guid tenantId)
        {
            return await _context.OvertimeCompensations
                .AsNoTracking()
                .Where(oc => oc.Status == CompensationStatus.Pending 
                    && oc.CompensationType != CompensationType.TimeOff
                    && oc.TenantId == tenantId 
                    && !oc.IsDeleted)
                .OrderBy(oc => oc.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<OvertimeCompensation>> GetUnusedTimeOffCompensationsAsync(Guid employeeId, Guid tenantId)
        {
            var now = DateTime.UtcNow;
            return await _context.OvertimeCompensations
                .AsNoTracking()
                .Where(oc => oc.EmployeeId == employeeId
                    && !oc.IsTimeOffUtilized
                    && (oc.TimeOffExpiryDate == null || oc.TimeOffExpiryDate > now)
                    && oc.TenantId == tenantId 
                    && !oc.IsDeleted)
                .OrderBy(oc => oc.TimeOffExpiryDate)
                .ToListAsync();
        }

        public async Task<OvertimeCompensation> CreateOvertimeCompensationAsync(OvertimeCompensation compensation)
        {
            _context.OvertimeCompensations.Add(compensation);
            await _context.SaveChangesAsync();
            return compensation;
        }

        public async Task<OvertimeCompensation> UpdateOvertimeCompensationAsync(OvertimeCompensation compensation)
        {
            _context.OvertimeCompensations.Update(compensation);
            await _context.SaveChangesAsync();
            return compensation;
        }

        public async Task DeleteOvertimeCompensationAsync(Guid id, Guid tenantId)
        {
            var compensation = await _context.OvertimeCompensations
                .FirstOrDefaultAsync(oc => oc.Id == id && oc.TenantId == tenantId && !oc.IsDeleted);

            if (compensation != null)
            {
                compensation.IsDeleted = true;

                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region Statistics

        public async Task<decimal> GetTotalOvertimeHoursAsync(Guid employeeId, DateTime startDate, DateTime endDate, Guid tenantId)
        {
            return await _context.OvertimeLogs
                .AsNoTracking()
                .Where(ol => ol.EmployeeId == employeeId
                    && ol.OvertimeDate >= startDate
                    && ol.OvertimeDate <= endDate
                    && ol.TenantId == tenantId
                    && !ol.IsDeleted)
                .SumAsync(ol => ol.OvertimeHours);
        }

        public async Task<decimal> GetTotalOvertimeAmountAsync(Guid employeeId, DateTime startDate, DateTime endDate, Guid tenantId)
        {
            return await _context.OvertimeLogs
                .AsNoTracking()
                .Where(ol => ol.EmployeeId == employeeId
                    && ol.OvertimeDate >= startDate
                    && ol.OvertimeDate <= endDate
                    && ol.TenantId == tenantId
                    && !ol.IsDeleted)
                .SumAsync(ol => ol.OvertimeAmount);
        }

        public async Task<int> GetPendingRequestsCountAsync(Guid tenantId)
        {
            return await _context.OvertimeRequests
                .AsNoTracking()
                .CountAsync(or => or.Status == OvertimeRequestStatus.PendingApproval 
                    && or.TenantId == tenantId 
                    && !or.IsDeleted);
        }

        public async Task<Dictionary<OvertimeType, decimal>> GetOvertimeHoursByTypeAsync(DateTime startDate, DateTime endDate, Guid tenantId)
        {
            var logs = await _context.OvertimeLogs
                .AsNoTracking()
                .Where(ol => ol.OvertimeDate >= startDate
                    && ol.OvertimeDate <= endDate
                    && ol.TenantId == tenantId
                    && !ol.IsDeleted)
                .ToListAsync();

            return logs
                .GroupBy(ol => ol.OvertimeType)
                .ToDictionary(g => g.Key, g => g.Sum(ol => ol.OvertimeHours));
        }

        public async Task<Dictionary<string, decimal>> GetOvertimeByEmployeeAsync(DateTime startDate, DateTime endDate, Guid tenantId)
        {
            var logs = await _context.OvertimeLogs
                .AsNoTracking()
                .Where(ol => ol.OvertimeDate >= startDate
                    && ol.OvertimeDate <= endDate
                    && ol.TenantId == tenantId
                    && !ol.IsDeleted)
                .ToListAsync();

            return logs
                .GroupBy(ol => ol.EmployeeId)
                .ToDictionary(
                    g => g.Key.ToString(), 
                    g => g.Sum(ol => ol.OvertimeHours)
                );
        }

        #endregion
    }
}
