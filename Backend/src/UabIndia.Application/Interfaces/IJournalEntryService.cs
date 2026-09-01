using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public interface IJournalEntryService
    {
        Task<JournalEntryCreateResult> CreateDraftAsync(
            CreateJournalEntryCommand command,
            CancellationToken cancellationToken = default);

        Task PostAsync(Guid id, Guid? postedBy, CancellationToken cancellationToken = default);

        Task DeleteDraftAsync(Guid id, CancellationToken cancellationToken = default);
    }

    public sealed record CreateJournalEntryCommand(
        DateTime EntryDate,
        string? EntryType,
        string? ReferenceNumber,
        string? Description,
        string? Narration,
        IReadOnlyList<CreateJournalLineCommand> Lines);

    public sealed record CreateJournalLineCommand(
        Guid AccountId,
        decimal DebitAmount,
        decimal CreditAmount,
        string? Description);

    public sealed record JournalEntryCreateResult(Guid Id, string JournalNumber);
}
