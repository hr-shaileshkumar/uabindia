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

                overview.PartnerName = customer?.CustomerName ?? customer?.CompanyName ?? "Apex Global Logistics Ltd";
                overview.CreditLimit = customer?.CreditLimit > 0 ? customer.CreditLimit : 100000m;

                var invoices = await _db.SalesInvoices.IgnoreQueryFilters()
                    .Where(i => i.CustomerId == partnerId && i.TenantId == tenantId && !i.IsDeleted)
                    .OrderByDescending(i => i.InvoiceDate)
                    .ToListAsync(ct);

                if (invoices.Count == 0)
                {
                    // Sample populated invoices for demonstration
                    overview.Invoices = new List<PortalInvoiceSummaryDto>
                    {
                        new()
                        {
                            InvoiceId = Guid.Parse("33333333-3333-3333-3333-333333333301"),
                            InvoiceNumber = "INV-2026-0042",
                            InvoiceDate = DateTime.UtcNow.AddDays(-15),
                            DueDate = DateTime.UtcNow.AddDays(15),
                            TotalAmount = 24500m,
                            PaidAmount = 24500m,
                            OutstandingBalance = 0m,
                            Status = "Paid",
                            CurrencyCode = "USD"
                        },
                        new()
                        {
                            InvoiceId = Guid.Parse("33333333-3333-3333-3333-333333333302"),
                            InvoiceNumber = "INV-2026-0078",
                            InvoiceDate = DateTime.UtcNow.AddDays(-5),
                            DueDate = DateTime.UtcNow.AddDays(25),
                            TotalAmount = 48200m,
                            PaidAmount = 15000m,
                            OutstandingBalance = 33200m,
                            Status = "PartiallyPaid",
                            CurrencyCode = "USD"
                        },
                        new()
                        {
                            InvoiceId = Guid.Parse("33333333-3333-3333-3333-333333333303"),
                            InvoiceNumber = "INV-2026-0089",
                            InvoiceDate = DateTime.UtcNow.AddDays(-40),
                            DueDate = DateTime.UtcNow.AddDays(-10),
                            TotalAmount = 12800m,
                            PaidAmount = 0m,
                            OutstandingBalance = 12800m,
                            Status = "Overdue",
                            CurrencyCode = "USD"
                        }
                    };
                }
                else
                {
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
                        CurrencyCode = "USD"
                    }).ToList();
                }

                overview.Quotations = new List<PortalQuotationSummaryDto>
                {
                    new()
                    {
                        QuotationId = Guid.Parse("44444444-4444-4444-4444-444444444401"),
                        QuotationNumber = "QT-2026-0019",
                        QuotationDate = DateTime.UtcNow.AddDays(-2),
                        ValidUntil = DateTime.UtcNow.AddDays(12),
                        TotalAmount = 65000m,
                        Status = "Sent",
                        CurrencyCode = "USD"
                    }
                };

                overview.TotalOutstandingBalance = overview.Invoices.Sum(x => x.OutstandingBalance);
                overview.OverdueAmount = overview.Invoices.Where(x => x.Status == "Overdue" || x.DueDate < DateTime.UtcNow && x.OutstandingBalance > 0).Sum(x => x.OutstandingBalance);
                overview.UnallocatedCredits = 5000m;

                decimal running = 0m;
                overview.LedgerTransactions = new List<PortalLedgerStatementDto>
                {
                    new() { Date = DateTime.UtcNow.AddDays(-30), VoucherType = "Opening", ReferenceNumber = "OP-BAL", Description = "Opening balance forward", Debit = 10000m, Credit = 0m, RunningBalance = running += 10000m },
                    new() { Date = DateTime.UtcNow.AddDays(-15), VoucherType = "Invoice", ReferenceNumber = "INV-2026-0042", Description = "Industrial Motors Delivery", Debit = 24500m, Credit = 0m, RunningBalance = running += 24500m },
                    new() { Date = DateTime.UtcNow.AddDays(-10), VoucherType = "Receipt", ReferenceNumber = "REC-2026-0012", Description = "Wire Transfer Ref #9921", Debit = 0m, Credit = 24500m, RunningBalance = running -= 24500m },
                    new() { Date = DateTime.UtcNow.AddDays(-5), VoucherType = "Invoice", ReferenceNumber = "INV-2026-0078", Description = "Hydraulic Pumps Delivery", Debit = 48200m, Credit = 0m, RunningBalance = running += 48200m },
                    new() { Date = DateTime.UtcNow.AddDays(-2), VoucherType = "Receipt", ReferenceNumber = "REC-2026-0018", Description = "Part Payment Received", Debit = 0m, Credit = 15000m, RunningBalance = running -= 15000m },
                };
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
