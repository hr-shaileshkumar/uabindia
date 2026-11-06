using System;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    public interface ILeaveRequestService
    {
        Task<LeaveRequest> ApproveAsync(Guid id, Guid? approvedByEmployeeId, Guid performedByUserId, CancellationToken cancellationToken = default);
        Task<LeaveRequest> RejectAsync(Guid id, Guid? rejectedByEmployeeId, Guid performedByUserId, CancellationToken cancellationToken = default);
    }

    public interface IPayrollEmployeeFinanceService
    {
        Task ApproveLoanAsync(Guid id, CancellationToken cancellationToken = default);
        Task ActivateLoanAsync(Guid id, CancellationToken cancellationToken = default);
        Task<PayrollLoan> RecordEmiAsync(Guid id, CancellationToken cancellationToken = default);
        Task CloseLoanAsync(Guid id, CancellationToken cancellationToken = default);

        Task ApproveBonusAsync(Guid id, CancellationToken cancellationToken = default);
        Task PayBonusAsync(Guid id, CancellationToken cancellationToken = default);
        Task RejectBonusAsync(Guid id, CancellationToken cancellationToken = default);

        Task ApproveArrearAsync(Guid id, CancellationToken cancellationToken = default);
        Task ProcessArrearAsync(Guid id, CancellationToken cancellationToken = default);
    }
}
