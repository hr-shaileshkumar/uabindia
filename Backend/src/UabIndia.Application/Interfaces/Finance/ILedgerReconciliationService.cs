using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class AccountTrialBalance
    {
        public Guid AccountId { get; set; }
        public string AccountCode { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty;
        public decimal Balance { get; set; }
        public decimal TotalDebit { get; set; }
        public decimal TotalCredit { get; set; }
    }

    public class SubledgerReconciliationItem
    {
        public string SubledgerName { get; set; } = string.Empty;
        public decimal GeneralLedgerBalance { get; set; }
        public decimal SubledgerTotal { get; set; }
        public decimal Variance { get; set; }
        public bool IsReconciled { get; set; }
    }

    public class LedgerReconciliationReport
    {
        public bool IsBalanced { get; set; }
        public decimal TotalDebits { get; set; }
        public decimal TotalCredits { get; set; }
        public decimal TrialBalanceVariance { get; set; }
        public IReadOnlyList<AccountTrialBalance> AccountBalances { get; set; } = new List<AccountTrialBalance>();
        public SubledgerReconciliationItem AccountsReceivable { get; set; } = new();
        public SubledgerReconciliationItem InventoryValuation { get; set; } = new();
    }

    public interface ILedgerReconciliationService
    {
        Task<LedgerReconciliationReport> ReconcileAsync(CancellationToken cancellationToken = default);
    }
}
