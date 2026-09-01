using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    public interface IDocumentNumberService
    {
        Task<string> NextAsync(string entityName, string prefix, int padding = 5, CancellationToken cancellationToken = default);
    }

    public interface ILedgerPostingService
    {
        Task<JournalEntry> PostAsync(
            string journalNumberPrefix,
            DateTime entryDate,
            string description,
            IReadOnlyList<LedgerLine> lines,
            string? referenceType = null,
            Guid? referenceId = null,
            CancellationToken cancellationToken = default);
    }

    public sealed record LedgerLine(string AccountCode, string AccountName, string AccountType, decimal Debit, decimal Credit, string? Description = null);

    public interface IPayrollEngine
    {
        Task<PayrollEngineResult> CompleteRunAsync(Guid payrollRunId, CancellationToken cancellationToken = default);
    }

    public sealed record PayrollEngineResult(
        Guid RunId,
        int PayslipsGenerated,
        int StatutoryRecordsGenerated,
        Guid? JournalEntryId,
        decimal TotalGross,
        decimal TotalNet,
        string Message);
}
