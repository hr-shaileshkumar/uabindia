using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;
        private readonly ILedgerPostingService _ledger;

        public PaymentService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers,
            ILedgerPostingService ledger)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
            _ledger = ledger;
        }

        public async Task<Payment> RecordAsync(RecordPaymentCommand command, CancellationToken cancellationToken = default)
        {
            if (command.Amount <= 0)
                throw new InvalidOperationException("Amount must be positive.");

            var tenantId = _tenantAccessor.GetTenantId();
            var paymentType = string.IsNullOrWhiteSpace(command.PaymentType) ? "Paid" : command.PaymentType.Trim();
            var paymentDate = command.PaymentDate.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(command.PaymentDate, DateTimeKind.Utc)
                : command.PaymentDate.ToUniversalTime();

            var payment = new Payment
            {
                TenantId = tenantId,
                PaymentNumber = await _numbers.NextAsync("Payment", "PAY-", 5, cancellationToken),
                PaymentDate = paymentDate,
                PaymentType = paymentType,
                PartyType = command.PartyType,
                PartyId = command.PartyId,
                PartyName = command.PartyName,
                Amount = command.Amount,
                PaymentMode = string.IsNullOrWhiteSpace(command.PaymentMode) ? "BankTransfer" : command.PaymentMode,
                ReferenceNumber = command.ReferenceNumber,
                ReferenceDate = command.ReferenceDate,
                BankName = command.BankName,
                InvoiceType = command.InvoiceType,
                InvoiceId = command.InvoiceId,
                InvoiceNumber = command.InvoiceNumber,
                Status = string.IsNullOrWhiteSpace(command.Status) ? "Completed" : command.Status,
                Remarks = command.Remarks,
                CreatedAt = DateTime.UtcNow
            };

            if (command.InvoiceId.HasValue)
                await ApplyInvoicePaymentAsync(command.InvoiceType, command.InvoiceId.Value, command.Amount, cancellationToken);

            _db.Payments.Add(payment);

            var received = paymentType.Equals("Received", StringComparison.OrdinalIgnoreCase);
            var journal = await _ledger.PostAsync(
                received ? "JE-AR-" : "JE-AP-",
                paymentDate,
                $"{paymentType} {payment.PaymentNumber}",
                CommercialLedgerLines.Payment(received, command.Amount),
                "Payment",
                payment.Id,
                cancellationToken);
            payment.JournalEntryId = journal.Id;
            await _db.SaveChangesAsync(cancellationToken);
            return payment;
        }

        private async Task ApplyInvoicePaymentAsync(string? invoiceType, Guid invoiceId, decimal amount, CancellationToken cancellationToken)
        {
            if (string.Equals(invoiceType, "PurchaseInvoice", StringComparison.OrdinalIgnoreCase))
            {
                var bill = await _db.PurchaseInvoices.FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted, cancellationToken);
                if (bill == null) return;
                bill.PaidAmount += amount;
                bill.BalanceAmount = Math.Max(0, bill.TotalAmount - bill.PaidAmount);
                bill.Status = bill.BalanceAmount <= 0 ? "Paid" : "Partial";
                bill.PaymentStatus = bill.Status;
                bill.UpdatedAt = DateTime.UtcNow;
                return;
            }

            var invoice = await _db.SalesInvoices.FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted, cancellationToken);
            if (invoice == null) return;
            invoice.PaidAmount += amount;
            invoice.BalanceAmount = Math.Max(0, invoice.TotalAmount - invoice.PaidAmount);
            invoice.Status = invoice.BalanceAmount <= 0 ? "Paid" : "Partial";
            invoice.PaymentStatus = invoice.Status;
            invoice.UpdatedAt = DateTime.UtcNow;
        }
    }
}
