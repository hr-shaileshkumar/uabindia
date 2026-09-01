using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class JournalEntryService : IJournalEntryService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;

        public JournalEntryService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
        }

        public async Task<JournalEntryCreateResult> CreateDraftAsync(
            CreateJournalEntryCommand command,
            CancellationToken cancellationToken = default)
        {
            if (command.Lines == null || command.Lines.Count < 2)
                throw new InvalidOperationException("At least two lines are required.");

            var tenantId = _tenantAccessor.GetTenantId();
            var totalDebit = command.Lines.Sum(l => l.DebitAmount);
            var totalCredit = command.Lines.Sum(l => l.CreditAmount);
            if (!IndiaStatutoryCalculator.AmountsEqual(totalDebit, totalCredit) || totalDebit <= 0)
                throw new InvalidOperationException("Total debits must equal total credits and be greater than zero.");

            await EnsurePeriodOpenAsync(command.EntryDate, cancellationToken);

            var accountIds = command.Lines.Select(l => l.AccountId).Distinct().ToList();
            var accountCount = await _db.ChartOfAccounts.CountAsync(
                a => accountIds.Contains(a.Id) && a.TenantId == tenantId && !a.IsDeleted && !a.IsGroup,
                cancellationToken);
            if (accountCount != accountIds.Count)
                throw new InvalidOperationException("One or more accounts are invalid or are group headers.");

            var journalNumber = await _numbers.NextAsync("JournalEntry", "JE-", 5, cancellationToken);
            var entry = new JournalEntry
            {
                TenantId = tenantId,
                JournalNumber = journalNumber,
                EntryDate = NormalizeUtc(command.EntryDate),
                EntryType = string.IsNullOrWhiteSpace(command.EntryType) ? "Regular" : command.EntryType,
                ReferenceNumber = command.ReferenceNumber,
                Description = command.Description,
                Narration = command.Narration,
                TotalDebit = totalDebit,
                TotalCredit = totalCredit,
                Status = "Draft",
                CreatedAt = DateTime.UtcNow,
                Lines = command.Lines.Select(l => new JournalEntryLine
                {
                    TenantId = tenantId,
                    AccountId = l.AccountId,
                    DebitAmount = l.DebitAmount,
                    CreditAmount = l.CreditAmount,
                    Description = l.Description,
                    CreatedAt = DateTime.UtcNow
                }).ToList()
            };

            _db.JournalEntries.Add(entry);
            await _db.SaveChangesAsync(cancellationToken);
            return new JournalEntryCreateResult(entry.Id, entry.JournalNumber);
        }

        public async Task PostAsync(Guid id, Guid? postedBy, CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var entry = await _db.JournalEntries
                .Include(j => j.Lines)
                .FirstOrDefaultAsync(j => j.Id == id && j.TenantId == tenantId, cancellationToken);

            if (entry == null)
                throw new KeyNotFoundException("Journal entry not found.");

            if (entry.Status != "Draft")
                throw new InvalidOperationException("Only draft entries can be posted.");

            await EnsurePeriodOpenAsync(entry.EntryDate, cancellationToken);

            if (!IndiaStatutoryCalculator.AmountsEqual(entry.TotalDebit, entry.TotalCredit) || entry.TotalDebit <= 0)
                throw new InvalidOperationException("Entry is not balanced.");

            var accountIds = entry.Lines.Select(l => l.AccountId).Distinct().ToList();
            var accounts = await _db.ChartOfAccounts
                .Where(a => accountIds.Contains(a.Id) && a.TenantId == tenantId && !a.IsDeleted)
                .ToDictionaryAsync(a => a.Id, cancellationToken);

            foreach (var line in entry.Lines)
            {
                if (!accounts.TryGetValue(line.AccountId, out var acc) || acc.IsGroup)
                    throw new InvalidOperationException($"Invalid account on line {line.Id}.");

                acc.CurrentBalance = AccountBalanceMath.Apply(acc.AccountType, acc.CurrentBalance, line.DebitAmount, line.CreditAmount);
                acc.UpdatedAt = DateTime.UtcNow;
            }

            entry.Status = "Posted";
            entry.PostedDate = DateTime.UtcNow;
            entry.PostedBy = postedBy is Guid userId && userId != Guid.Empty ? userId : null;
            entry.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteDraftAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var entry = await _db.JournalEntries.FirstOrDefaultAsync(
                j => j.Id == id && j.TenantId == tenantId,
                cancellationToken);

            if (entry == null)
                throw new KeyNotFoundException("Journal entry not found.");

            if (entry.Status != "Draft")
                throw new InvalidOperationException("Only draft entries can be deleted.");

            entry.IsDeleted = true;
            entry.UpdatedAt = DateTime.UtcNow;

            var lines = await _db.JournalEntryLines
                .Where(l => l.JournalEntryId == id && l.TenantId == tenantId)
                .ToListAsync(cancellationToken);
            foreach (var line in lines)
            {
                line.IsDeleted = true;
                line.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(cancellationToken);
        }

        private async Task EnsurePeriodOpenAsync(DateTime entryDate, CancellationToken cancellationToken)
        {
            var closed = await _db.AccountingPeriods.AnyAsync(
                p => p.Year == entryDate.Year && p.Month == entryDate.Month && p.Status == "Closed" && !p.IsDeleted,
                cancellationToken);
            if (closed)
                throw new InvalidOperationException($"Accounting period {entryDate:yyyy-MM} is closed.");
        }

        private static DateTime NormalizeUtc(DateTime value) =>
            value.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
                : value.ToUniversalTime();
    }
}
