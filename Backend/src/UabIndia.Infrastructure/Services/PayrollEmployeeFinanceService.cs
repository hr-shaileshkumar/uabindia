using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class PayrollEmployeeFinanceService : IPayrollEmployeeFinanceService
    {
        private readonly ApplicationDbContext _db;

        public PayrollEmployeeFinanceService(ApplicationDbContext db)
        {
            _db = db;
        }

        public Task ApproveLoanAsync(Guid id, CancellationToken cancellationToken = default) =>
            SetLoanStatusAsync(id, "Approved", cancellationToken);

        public Task ActivateLoanAsync(Guid id, CancellationToken cancellationToken = default) =>
            SetLoanStatusAsync(id, "Active", cancellationToken);

        public async Task<PayrollLoan> RecordEmiAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var row = await LoadLoanAsync(id, cancellationToken);
            if (row.Status != "Active")
                throw new InvalidOperationException("Only active loans can record EMI.");

            row.InstallmentsPaid += 1;
            row.OutstandingAmount = Math.Max(0, row.OutstandingAmount - row.EmiAmount);
            if (row.OutstandingAmount == 0 || row.InstallmentsPaid >= row.TotalInstallments)
            {
                row.Status = "Closed";
                row.OutstandingAmount = 0;
                row.ClosedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(cancellationToken);
            return row;
        }

        public async Task CloseLoanAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var row = await LoadLoanAsync(id, cancellationToken);
            row.Status = "Closed";
            row.OutstandingAmount = 0;
            row.ClosedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }

        public Task ApproveBonusAsync(Guid id, CancellationToken cancellationToken = default) =>
            SetBonusStatusAsync(id, "Approved", cancellationToken);

        public async Task PayBonusAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var row = await LoadBonusAsync(id, cancellationToken);
            row.Status = "Paid";
            row.PaidAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }

        public Task RejectBonusAsync(Guid id, CancellationToken cancellationToken = default) =>
            SetBonusStatusAsync(id, "Rejected", cancellationToken);

        public Task ApproveArrearAsync(Guid id, CancellationToken cancellationToken = default) =>
            SetArrearStatusAsync(id, "Approved", cancellationToken);

        public async Task ProcessArrearAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var row = await LoadArrearAsync(id, cancellationToken);
            row.Status = "Processed";
            row.ProcessedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }

        private async Task SetLoanStatusAsync(Guid id, string status, CancellationToken cancellationToken)
        {
            var row = await LoadLoanAsync(id, cancellationToken);
            row.Status = status;
            await _db.SaveChangesAsync(cancellationToken);
        }

        private async Task SetBonusStatusAsync(Guid id, string status, CancellationToken cancellationToken)
        {
            var row = await LoadBonusAsync(id, cancellationToken);
            row.Status = status;
            await _db.SaveChangesAsync(cancellationToken);
        }

        private async Task SetArrearStatusAsync(Guid id, string status, CancellationToken cancellationToken)
        {
            var row = await LoadArrearAsync(id, cancellationToken);
            row.Status = status;
            await _db.SaveChangesAsync(cancellationToken);
        }

        private async Task<PayrollLoan> LoadLoanAsync(Guid id, CancellationToken cancellationToken)
        {
            var row = await _db.PayrollLoans.FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
            if (row == null)
                throw new KeyNotFoundException("Loan not found.");
            return row;
        }

        private async Task<PayrollBonus> LoadBonusAsync(Guid id, CancellationToken cancellationToken)
        {
            var row = await _db.PayrollBonuses.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
            if (row == null)
                throw new KeyNotFoundException("Bonus not found.");
            return row;
        }

        private async Task<PayrollArrear> LoadArrearAsync(Guid id, CancellationToken cancellationToken)
        {
            var row = await _db.PayrollArrears.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
            if (row == null)
                throw new KeyNotFoundException("Arrears entry not found.");
            return row;
        }
    }
}
