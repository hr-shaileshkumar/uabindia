using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class BankReconciliationService : IBankReconciliationService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public BankReconciliationService(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public async Task<BankReconciliation> CreateAsync(CreateBankReconciliationCommand command, CancellationToken cancellationToken = default)
        {
            if (command.AccountId == Guid.Empty)
                throw new InvalidOperationException("Account is required");

            var tenantId = _tenantAccessor.GetTenantId();
            var account = await _db.ChartOfAccounts.AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == command.AccountId && a.TenantId == tenantId && !a.IsDeleted, cancellationToken);
            if (account == null)
                throw new InvalidOperationException("Account not found");

            var period = string.IsNullOrWhiteSpace(command.Period)
                ? DateTime.UtcNow.ToString("yyyy-MM")
                : command.Period.Trim();

            var bookBalance = command.BookBalance != 0 ? command.BookBalance : account.CurrentBalance;
            var difference = command.BankBalance - bookBalance;
            var status = Math.Abs(difference) < 1m ? "Matched"
                : Math.Abs(difference) < Math.Abs(bookBalance) * 0.05m + 1m ? "Partial"
                : "Unmatched";

            var row = new BankReconciliation
            {
                AccountId = command.AccountId,
                AccountCode = account.AccountCode,
                AccountName = account.AccountName,
                Period = period,
                BookBalance = bookBalance,
                BankBalance = command.BankBalance,
                Difference = difference,
                Status = string.IsNullOrWhiteSpace(command.Status) ? status : command.Status,
                ReconciledAt = DateTime.UtcNow,
                Remarks = command.Remarks,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.BankReconciliations.Add(row);
            await _db.SaveChangesAsync(cancellationToken);
            return row;
        }
    }
}
