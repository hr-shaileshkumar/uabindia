using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    public interface IOvertimeRepository
    {
        #region Overtime Request Operations

        Task<OvertimeRequest?> GetOvertimeRequestByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<OvertimeRequest>> GetAllOvertimeRequestsAsync(Guid tenantId, int skip = 0, int take = 50);
        Task<IEnumerable<OvertimeRequest>> GetOvertimeRequestsByEmployeeAsync(Guid employeeId, Guid tenantId);
        Task<IEnumerable<OvertimeRequest>> GetOvertimeRequestsByManagerAsync(Guid managerId, Guid tenantId);
        Task<IEnumerable<OvertimeRequest>> GetOvertimeRequestsByStatusAsync(OvertimeRequestStatus status, Guid tenantId);
        Task<IEnumerable<OvertimeRequest>> GetOvertimeRequestsByDateRangeAsync(DateTime startDate, DateTime endDate, Guid tenantId);
        Task<IEnumerable<OvertimeRequest>> GetPendingOvertimeRequestsAsync(Guid tenantId);
        Task<OvertimeRequest> CreateOvertimeRequestAsync(OvertimeRequest request);
        Task<OvertimeRequest> UpdateOvertimeRequestAsync(OvertimeRequest request);
        Task DeleteOvertimeRequestAsync(Guid id, Guid tenantId);

        #endregion

        #region Overtime Approval Operations

        Task<OvertimeApproval?> GetOvertimeApprovalByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<OvertimeApproval>> GetApprovalsByRequestAsync(Guid requestId, Guid tenantId);
        Task<IEnumerable<OvertimeApproval>> GetApprovalsByApproverAsync(Guid approverId, Guid tenantId);
        Task<IEnumerable<OvertimeApproval>> GetPendingApprovalsAsync(Guid approverId, Guid tenantId);
        Task<OvertimeApproval> CreateOvertimeApprovalAsync(OvertimeApproval approval);
        Task<OvertimeApproval> UpdateOvertimeApprovalAsync(OvertimeApproval approval);
        Task DeleteOvertimeApprovalAsync(Guid id, Guid tenantId);

        #endregion

        #region Overtime Log Operations

        Task<OvertimeLog?> GetOvertimeLogByIdAsync(Guid id, Guid tenantId);
        Task<OvertimeLog?> GetOvertimeLogByRequestIdAsync(Guid requestId, Guid tenantId);
        Task<IEnumerable<OvertimeLog>> GetAllOvertimeLogsAsync(Guid tenantId, int skip = 0, int take = 50);
        Task<IEnumerable<OvertimeLog>> GetOvertimeLogsByEmployeeAsync(Guid employeeId, Guid tenantId);
        Task<IEnumerable<OvertimeLog>> GetOvertimeLogsByDateRangeAsync(DateTime startDate, DateTime endDate, Guid tenantId);
        Task<IEnumerable<OvertimeLog>> GetUnprocessedOvertimeLogsAsync(Guid tenantId);
        Task<IEnumerable<OvertimeLog>> GetOvertimeLogsByPayrollRunAsync(Guid payrollRunId, Guid tenantId);
        Task<OvertimeLog> CreateOvertimeLogAsync(OvertimeLog log);
        Task<OvertimeLog> UpdateOvertimeLogAsync(OvertimeLog log);
        Task DeleteOvertimeLogAsync(Guid id, Guid tenantId);

        #endregion

        #region Overtime Compensation Operations

        Task<OvertimeCompensation?> GetOvertimeCompensationByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<OvertimeCompensation>> GetAllOvertimeCompensationsAsync(Guid tenantId, int skip = 0, int take = 50);
        Task<IEnumerable<OvertimeCompensation>> GetCompensationsByEmployeeAsync(Guid employeeId, Guid tenantId);
        Task<IEnumerable<OvertimeCompensation>> GetCompensationsByStatusAsync(CompensationStatus status, Guid tenantId);
        Task<IEnumerable<OvertimeCompensation>> GetUnpaidCompensationsAsync(Guid tenantId);
        Task<IEnumerable<OvertimeCompensation>> GetUnusedTimeOffCompensationsAsync(Guid employeeId, Guid tenantId);
        Task<OvertimeCompensation> CreateOvertimeCompensationAsync(OvertimeCompensation compensation);
        Task<OvertimeCompensation> UpdateOvertimeCompensationAsync(OvertimeCompensation compensation);
        Task DeleteOvertimeCompensationAsync(Guid id, Guid tenantId);

        #endregion

        #region Statistics

        Task<decimal> GetTotalOvertimeHoursAsync(Guid employeeId, DateTime startDate, DateTime endDate, Guid tenantId);
        Task<decimal> GetTotalOvertimeAmountAsync(Guid employeeId, DateTime startDate, DateTime endDate, Guid tenantId);
        Task<int> GetPendingRequestsCountAsync(Guid tenantId);
        Task<Dictionary<OvertimeType, decimal>> GetOvertimeHoursByTypeAsync(DateTime startDate, DateTime endDate, Guid tenantId);
        Task<Dictionary<string, decimal>> GetOvertimeByEmployeeAsync(DateTime startDate, DateTime endDate, Guid tenantId);

        #endregion
    }
}
