using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class ExpenseClaimService : IExpenseClaimService
    {
        private readonly ApplicationDbContext _db;
        private readonly ILedgerPostingService _ledger;
        private readonly INotificationEmitter _notifications;

        public ExpenseClaimService(
            ApplicationDbContext db,
            ILedgerPostingService ledger,
            INotificationEmitter notifications)
        {
            _db = db;
            _ledger = ledger;
            _notifications = notifications;
        }

        public async Task<ExpenseClaim> ApproveAsync(Guid id, string approvedBy, CancellationToken cancellationToken = default)
        {
            var claim = await LoadSubmittedAsync(id, "approved", cancellationToken);
            claim.Status = "Approved";
            claim.ApprovedBy = string.IsNullOrWhiteSpace(approvedBy) ? "admin" : approvedBy;
            claim.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            await NotifyAsync(claim, approved: true, reason: null, cancellationToken);
            return claim;
        }

        public async Task<ExpenseClaim> RejectAsync(Guid id, string? reason = null, CancellationToken cancellationToken = default)
        {
            var claim = await LoadSubmittedAsync(id, "rejected", cancellationToken);
            claim.Status = "Rejected";
            if (!string.IsNullOrWhiteSpace(reason))
            {
                claim.Description = string.IsNullOrWhiteSpace(claim.Description)
                    ? $"Rejected: {reason}"
                    : $"{claim.Description}\nRejected: {reason}";
            }
            claim.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            await NotifyAsync(claim, approved: false, reason, cancellationToken);
            return claim;
        }

        public async Task<ExpenseClaim> MarkPaidAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var claim = await _db.ExpenseClaims.FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken);
            if (claim == null)
                throw new KeyNotFoundException("Expense claim not found.");
            if (!string.Equals(claim.Status, "Approved", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Only approved claims can be marked paid.");

            if (claim.JournalEntryId == null && claim.Amount > 0)
            {
                var payrollReimb = claim.ClaimNumber.StartsWith("REIM", StringComparison.OrdinalIgnoreCase);
                var journal = await _ledger.PostAsync(
                    "JE-EXP-",
                    claim.ExpenseDate == default ? DateTime.UtcNow.Date : claim.ExpenseDate,
                    payrollReimb ? $"Reimbursement {claim.ClaimNumber}" : $"Expense {claim.ClaimNumber}",
                    CommercialLedgerLines.ExpensePayment(
                        claim.Amount,
                        claim.Title,
                        payrollReimb ? "Reimbursement payment" : "Expense payment"),
                    "ExpenseClaim",
                    claim.Id,
                    cancellationToken);
                claim.JournalEntryId = journal.Id;
            }

            claim.Status = "Paid";
            claim.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return claim;
        }

        private async Task<ExpenseClaim> LoadSubmittedAsync(Guid id, string action, CancellationToken cancellationToken)
        {
            var claim = await _db.ExpenseClaims.FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken);
            if (claim == null)
                throw new KeyNotFoundException("Expense claim not found.");
            if (!string.Equals(claim.Status, "Submitted", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Only submitted claims can be {action}.");
            return claim;
        }

        private async Task NotifyAsync(ExpenseClaim claim, bool approved, string? reason, CancellationToken cancellationToken)
        {
            if (!claim.EmployeeId.HasValue) return;

            var isReim = claim.ClaimNumber.StartsWith("REIM", StringComparison.OrdinalIgnoreCase);
            var href = isReim ? "/payroll" : "/expenses";
            var title = approved
                ? (isReim ? "Reimbursement approved" : "Expense claim approved")
                : (isReim ? "Reimbursement rejected" : "Expense claim rejected");
            var message = approved
                ? $"Your {(isReim ? "reimbursement" : "expense")} '{claim.Title}' for ₹{claim.Amount:N0} was approved."
                : $"Your {(isReim ? "reimbursement" : "expense")} '{claim.Title}' for ₹{claim.Amount:N0} was rejected.";
            var trigger = approved
                ? (isReim ? "reimbursement.approved" : "expense.approved")
                : (isReim ? "reimbursement.rejected" : "expense.rejected");

            await _notifications.EmitToEmployeeAsync(
                claim.TenantId,
                claim.EmployeeId.Value,
                "Operations",
                title,
                message,
                new { entityType = "ExpenseClaim", entityId = claim.Id, href, reason },
                trigger,
                projectId: claim.ProjectId,
                cancellationToken: cancellationToken);
        }
    }
}
