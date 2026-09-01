using System;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    public interface IExpenseClaimService
    {
        Task<ExpenseClaim> ApproveAsync(Guid id, string approvedBy, CancellationToken cancellationToken = default);
        Task<ExpenseClaim> RejectAsync(Guid id, string? reason = null, CancellationToken cancellationToken = default);
        Task<ExpenseClaim> MarkPaidAsync(Guid id, CancellationToken cancellationToken = default);
    }

    public interface ISalesReturnService
    {
        Task<SalesReturn> ProcessAsync(Guid id, CancellationToken cancellationToken = default);
    }

    public interface IPayrollSettlementService
    {
        Task<FnfComputation> ComputeAsync(Guid employeeId, DateTime exitDate, CancellationToken cancellationToken = default);
        Task<PayrollSettlementPostResult> SettleAsync(Guid id, CancellationToken cancellationToken = default);
    }

    public sealed record FnfComputation(
        decimal Gratuity,
        decimal LeaveEncashment,
        decimal OtherDues,
        decimal Recoveries,
        string Remarks);

    public sealed record PayrollSettlementPostResult(Guid SettlementId, Guid? JournalEntryId);
}
