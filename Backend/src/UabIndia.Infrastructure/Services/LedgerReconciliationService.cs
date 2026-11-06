using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class LedgerReconciliationService : ILedgerReconciliationService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public LedgerReconciliationService(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public async Task<LedgerReconciliationReport> ReconcileAsync(CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            // 1. Calculate General Ledger trial balance totals
            var journalLines = await _db.JournalEntryLines
                .Where(l => l.TenantId == tenantId && !l.IsDeleted)
                .ToListAsync(cancellationToken);

            var totalDebits = IndiaStatutoryCalculator.RoundMoney(journalLines.Sum(l => l.DebitAmount));
            var totalCredits = IndiaStatutoryCalculator.RoundMoney(journalLines.Sum(l => l.CreditAmount));
            var trialBalanceVariance = IndiaStatutoryCalculator.RoundMoney(Math.Abs(totalDebits - totalCredits));
            var isBalanced = IndiaStatutoryCalculator.AmountsEqual(totalDebits, totalCredits) && trialBalanceVariance == 0m;

            // 2. Chart of Accounts balances
            var accounts = await _db.ChartOfAccounts
                .Where(a => a.TenantId == tenantId && !a.IsDeleted)
                .OrderBy(a => a.AccountCode)
                .ToListAsync(cancellationToken);

            var accountBalances = accounts.Select(a =>
            {
                var acctLines = journalLines.Where(l => l.AccountId == a.Id).ToList();
                return new AccountTrialBalance
                {
                    AccountId = a.Id,
                    AccountCode = a.AccountCode,
                    AccountName = a.AccountName,
                    AccountType = a.AccountType,
                    Balance = a.CurrentBalance,
                    TotalDebit = IndiaStatutoryCalculator.RoundMoney(acctLines.Sum(l => l.DebitAmount)),
                    TotalCredit = IndiaStatutoryCalculator.RoundMoney(acctLines.Sum(l => l.CreditAmount))
                };
            }).ToList();

            // 3. Accounts Receivable Subledger Reconciliation
            var arAccount = accounts.FirstOrDefault(a =>
                a.AccountCode == "1100" ||
                a.AccountName.Contains("Receivable", StringComparison.OrdinalIgnoreCase));

            var arGlBalance = arAccount != null ? IndiaStatutoryCalculator.RoundMoney(arAccount.CurrentBalance) : 0m;

            var arSubledgerTotal = await _db.SalesInvoices
                .Where(i => i.TenantId == tenantId && !i.IsDeleted && i.Status != "Cancelled")
                .SumAsync(i => (decimal?)(i.TotalAmount - i.PaidAmount), cancellationToken) ?? 0m;
            arSubledgerTotal = IndiaStatutoryCalculator.RoundMoney(arSubledgerTotal);

            var arVariance = IndiaStatutoryCalculator.RoundMoney(Math.Abs(arGlBalance - arSubledgerTotal));

            var arReconciliation = new SubledgerReconciliationItem
            {
                SubledgerName = "Accounts Receivable",
                GeneralLedgerBalance = arGlBalance,
                SubledgerTotal = arSubledgerTotal,
                Variance = arVariance,
                IsReconciled = IndiaStatutoryCalculator.AmountsEqual(arVariance, 0m)
            };

            // 4. Inventory Valuation Subledger Reconciliation
            var invAccount = accounts.FirstOrDefault(a =>
                a.AccountCode == "1400" ||
                a.AccountName.Contains("Inventory", StringComparison.OrdinalIgnoreCase) ||
                a.AccountName.Contains("Stock", StringComparison.OrdinalIgnoreCase));

            var invGlBalance = invAccount != null ? IndiaStatutoryCalculator.RoundMoney(invAccount.CurrentBalance) : 0m;

            var invSubledgerTotal = await _db.StockBalances
                .Where(s => s.TenantId == tenantId && !s.IsDeleted)
                .SumAsync(s => (decimal?)s.TotalValue, cancellationToken) ?? 0m;
            invSubledgerTotal = IndiaStatutoryCalculator.RoundMoney(invSubledgerTotal);

            var invVariance = IndiaStatutoryCalculator.RoundMoney(Math.Abs(invGlBalance - invSubledgerTotal));

            var invReconciliation = new SubledgerReconciliationItem
            {
                SubledgerName = "Inventory Valuation",
                GeneralLedgerBalance = invGlBalance,
                SubledgerTotal = invSubledgerTotal,
                Variance = invVariance,
                IsReconciled = IndiaStatutoryCalculator.AmountsEqual(invVariance, 0m)
            };

            return new LedgerReconciliationReport
            {
                IsBalanced = isBalanced,
                TotalDebits = totalDebits,
                TotalCredits = totalCredits,
                TrialBalanceVariance = trialBalanceVariance,
                AccountBalances = accountBalances,
                AccountsReceivable = arReconciliation,
                InventoryValuation = invReconciliation
            };
        }
    }
}
