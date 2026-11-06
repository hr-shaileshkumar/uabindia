using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class B2BPortalService : IB2BPortalService
    {
        private readonly ApplicationDbContext _db;

        public B2BPortalService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<B2BPortalOverviewDto> GetPartnerPortalOverviewAsync(
            Guid tenantId,
            Guid partnerId,
            string partnerType = "Customer",
            CancellationToken ct = default)
        {
            var overview = new B2BPortalOverviewDto
            {
                PartnerId = partnerId,
                PartnerType = partnerType,
                CurrencyCode = "USD"
            };

            if (partnerType.Equals("Customer", StringComparison.OrdinalIgnoreCase))
            {
                var customer = await _db.Customers.IgnoreQueryFilters()
                    .FirstOrDefaultAsync(c => c.Id == partnerId && c.TenantId == tenantId && !c.IsDeleted, ct);

                overview.PartnerName = customer?.CustomerName ?? customer?.CompanyName ?? "Customer Partner";
                overview.CreditLimit = customer?.CreditLimit ?? 0m;

                var invoices = await _db.SalesInvoices.IgnoreQueryFilters()
                    .Where(i => i.CustomerId == partnerId && i.TenantId == tenantId && !i.IsDeleted)
                    .OrderByDescending(i => i.InvoiceDate)
                    .ToListAsync(ct);

                overview.Invoices = invoices.Select(i => new PortalInvoiceSummaryDto
                {
                    InvoiceId = i.Id,
                    InvoiceNumber = i.InvoiceNumber,
                    InvoiceDate = i.InvoiceDate,
                    DueDate = i.DueDate ?? i.InvoiceDate.AddDays(30),
                    TotalAmount = i.TotalAmount,
                    PaidAmount = i.PaidAmount,
                    OutstandingBalance = i.BalanceAmount,
                    Status = i.Status,
                    CurrencyCode = "INR"
                }).ToList();

                overview.Quotations = new List<PortalQuotationSummaryDto>();

                overview.TotalOutstandingBalance = overview.Invoices.Sum(x => x.OutstandingBalance);
                overview.OverdueAmount = overview.Invoices.Where(x => x.Status == "Overdue" || (x.DueDate < DateTime.UtcNow && x.OutstandingBalance > 0)).Sum(x => x.OutstandingBalance);
                overview.UnallocatedCredits = 0m;

                decimal running = 0m;
                overview.LedgerTransactions = invoices.Select(i => new PortalLedgerStatementDto
                {
                    Date = i.InvoiceDate,
                    VoucherType = "Sales Invoice",
                    ReferenceNumber = i.InvoiceNumber,
                    Description = $"Sales Invoice #{i.InvoiceNumber}",
                    Debit = i.TotalAmount,
                    Credit = 0m,
                    RunningBalance = running += i.TotalAmount
                }).ToList();
            }

            return await Task.FromResult(overview);
        }

        public async Task<bool> AcceptQuotationAsync(
            Guid tenantId,
            AcceptQuotationRequest req,
            CancellationToken ct = default)
        {
            var quote = await _db.SalesQuotations.IgnoreQueryFilters()
                .FirstOrDefaultAsync(q => q.Id == req.QuotationId && q.TenantId == tenantId && !q.IsDeleted, ct);

            if (quote != null)
            {
                quote.Status = "Accepted";
                quote.Notes = string.IsNullOrWhiteSpace(quote.Notes)
                    ? $"Accepted by {req.DigitalSignatureName} on {DateTime.UtcNow:u}. Notes: {req.ConfirmationNotes}"
                    : $"{quote.Notes}\nAccepted by {req.DigitalSignatureName}. Notes: {req.ConfirmationNotes}";
                await _db.SaveChangesAsync(ct);
            }

            return true;
        }
    }
}
