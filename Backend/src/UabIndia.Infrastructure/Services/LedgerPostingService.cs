using System;
using System.Collections.Generic;
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
    public class LedgerPostingService : ILedgerPostingService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;

        public LedgerPostingService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
        }

        public async Task<JournalEntry> PostAsync(
            string journalNumberPrefix,
            DateTime entryDate,
            string description,
            IReadOnlyList<LedgerLine> lines,
            string? referenceType = null,
            Guid? referenceId = null,
            CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            await EnsurePeriodOpenAsync(entryDate, cancellationToken);
            var debit = IndiaStatutoryCalculator.RoundMoney(lines.Sum(l => l.Debit));
            var credit = IndiaStatutoryCalculator.RoundMoney(lines.Sum(l => l.Credit));
            if (!IndiaStatutoryCalculator.AmountsEqual(debit, credit) || debit <= 0)
                throw new InvalidOperationException("Journal is not balanced.");

            var companyId = _tenantAccessor.GetCompanyId();
            var projectId = _tenantAccessor.GetProjectId();

            var journalNumber = await _numbers.NextAsync("JournalEntry", journalNumberPrefix, 5, cancellationToken);
            var entry = new JournalEntry
            {
                TenantId = tenantId,
                CompanyId = companyId,
                ProjectId = projectId,
                JournalNumber = journalNumber,
                EntryDate = entryDate.Kind == DateTimeKind.Unspecified
                    ? DateTime.SpecifyKind(entryDate, DateTimeKind.Utc)
                    : entryDate.ToUniversalTime(),
                EntryType = "Regular",
                Description = description,
                Narration = description,
                TotalDebit = debit,
                TotalCredit = credit,
                Status = "Posted",
                PostedDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var line in lines.Where(l => l.Debit != 0 || l.Credit != 0))
            {
                var account = await EnsureAccountAsync(tenantId, line, companyId, cancellationToken);
                account.CurrentBalance = AccountBalanceMath.Apply(account.AccountType, account.CurrentBalance, line.Debit, line.Credit);
                account.UpdatedAt = DateTime.UtcNow;
                entry.Lines.Add(new JournalEntryLine
                {
                    TenantId = tenantId,
                    AccountId = account.Id,
                    Account = account,
                    DebitAmount = line.Debit,
                    CreditAmount = line.Credit,
                    Description = line.Description ?? description,
                    ReferenceType = referenceType,
                    ReferenceId = referenceId,
                    CreatedAt = DateTime.UtcNow
                });
            }

            _db.JournalEntries.Add(entry);
            await _db.SaveChangesAsync(cancellationToken);
            return entry;
        }

        public async Task<JournalEntry> PostForeignExchangeSettlementAsync(
            ForeignExchangeSettlementCommand command,
            CancellationToken cancellationToken = default)
        {
            var lines = new List<LedgerLine>();
            var settlementInr = IndiaStatutoryCalculator.RoundMoney(command.ForeignAmount * command.SettlementExchangeRate);
            var originalInr = IndiaStatutoryCalculator.RoundMoney(command.ForeignAmount * command.OriginalExchangeRate);

            if (command.SettlementType.Equals("CustomerReceipt", StringComparison.OrdinalIgnoreCase))
            {
                var diff = settlementInr - originalInr;
                if (diff >= 0)
                {
                    lines.Add(new LedgerLine("1110", "Bank Account", "Asset", settlementInr, 0, command.Description));
                    lines.Add(new LedgerLine("1100", "Accounts Receivable", "Asset", 0, originalInr, command.Description));
                    if (diff > 0)
                    {
                        lines.Add(new LedgerLine("4301", "Foreign Exchange Gain", "Revenue", 0, diff, "Forex Gain on Receipt"));
                    }
                }
                else
                {
                    var loss = Math.Abs(diff);
                    lines.Add(new LedgerLine("1110", "Bank Account", "Asset", settlementInr, 0, command.Description));
                    lines.Add(new LedgerLine("5301", "Foreign Exchange Loss", "Expense", loss, 0, "Forex Loss on Receipt"));
                    lines.Add(new LedgerLine("1100", "Accounts Receivable", "Asset", 0, originalInr, command.Description));
                }
            }
            else if (command.SettlementType.Equals("VendorPayment", StringComparison.OrdinalIgnoreCase))
            {
                var diff = originalInr - settlementInr;
                if (diff >= 0)
                {
                    lines.Add(new LedgerLine("2100", "Accounts Payable", "Liability", originalInr, 0, command.Description));
                    lines.Add(new LedgerLine("1110", "Bank Account", "Asset", 0, settlementInr, command.Description));
                    if (diff > 0)
                    {
                        lines.Add(new LedgerLine("4301", "Foreign Exchange Gain", "Revenue", 0, diff, "Forex Gain on Payment"));
                    }
                }
                else
                {
                    var loss = Math.Abs(diff);
                    lines.Add(new LedgerLine("2100", "Accounts Payable", "Liability", originalInr, 0, command.Description));
                    lines.Add(new LedgerLine("5301", "Foreign Exchange Loss", "Expense", loss, 0, "Forex Loss on Payment"));
                    lines.Add(new LedgerLine("1110", "Bank Account", "Asset", 0, settlementInr, command.Description));
                }
            }
            else
            {
                throw new InvalidOperationException($"Unsupported SettlementType: {command.SettlementType}");
            }

            return await PostAsync(
                command.JournalNumberPrefix,
                command.SettlementDate,
                command.Description,
                lines,
                "ForexSettlement",
                null,
                cancellationToken);
        }

        public async Task<JournalEntry> PostLandedCostCapitalizationAsync(
            decimal landedCostAmount,
            string purchaseOrderNumber,
            string description,
            CancellationToken cancellationToken = default)
        {
            var roundedAmount = IndiaStatutoryCalculator.RoundMoney(landedCostAmount);
            var lines = new[]
            {
                new LedgerLine("1400", "Inventory Asset", "Asset", roundedAmount, 0, description),
                new LedgerLine("2105", "Landed Cost Clearing", "Liability", 0, roundedAmount, description)
            };

            return await PostAsync(
                "JE-LCC-",
                DateTime.UtcNow.Date,
                description,
                lines,
                "LandedCost",
                null,
                cancellationToken);
        }

        private async Task EnsurePeriodOpenAsync(DateTime entryDate, CancellationToken cancellationToken)
        {
            var closed = await _db.AccountingPeriods.AnyAsync(
                p => p.Year == entryDate.Year && p.Month == entryDate.Month && p.Status == "Closed" && !p.IsDeleted,
                cancellationToken);
            if (closed)
                throw new InvalidOperationException($"Accounting period {entryDate:yyyy-MM} is closed.");
        }

        private async Task<ChartOfAccount> EnsureAccountAsync(Guid tenantId, LedgerLine line, Guid? companyId, CancellationToken cancellationToken)
        {
            var account = await _db.ChartOfAccounts
                .FirstOrDefaultAsync(a => a.TenantId == tenantId && a.AccountCode == line.AccountCode && !a.IsDeleted, cancellationToken);
            if (account != null) return account;

            var functionalCurrency = "INR";
            if (companyId.HasValue && companyId.Value != Guid.Empty)
            {
                var company = await _db.Companies
                    .FirstOrDefaultAsync(c => c.Id == companyId.Value && c.TenantId == tenantId && !c.IsDeleted, cancellationToken);
                if (company != null && !string.IsNullOrWhiteSpace(company.FunctionalCurrencyCode))
                {
                    functionalCurrency = company.FunctionalCurrencyCode;
                }
            }
            else
            {
                var firstCompany = await _db.Companies
                    .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted, cancellationToken);
                if (firstCompany != null && !string.IsNullOrWhiteSpace(firstCompany.FunctionalCurrencyCode))
                {
                    functionalCurrency = firstCompany.FunctionalCurrencyCode;
                }
            }

            account = new ChartOfAccount
            {
                TenantId = tenantId,
                AccountCode = line.AccountCode,
                AccountName = line.AccountName,
                AccountType = line.AccountType,
                Currency = functionalCurrency,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _db.ChartOfAccounts.Add(account);
            await _db.SaveChangesAsync(cancellationToken);
            return account;
        }
    }
}
