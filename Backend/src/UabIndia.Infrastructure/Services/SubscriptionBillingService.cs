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
    public class SubscriptionBillingService : ISubscriptionBillingService
    {
        private readonly ApplicationDbContext _db;

        public SubscriptionBillingService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<SubscriptionBillingResult> ProcessRecurringBillingCycleAsync(
            Guid tenantId,
            DateTime asOfDate,
            CancellationToken ct = default)
        {
            var result = new SubscriptionBillingResult();

            // Find active customers in tenant
            var customers = await _db.Customers.IgnoreQueryFilters()
                .Where(c => c.TenantId == tenantId && !c.IsDeleted && (c.Status == null || c.Status == "Active"))
                .ToListAsync(ct);

            result.TotalSubscriptionsEvaluated = customers.Count;
            decimal totalBilled = 0;

            foreach (var customer in customers)
            {
                // Generate monthly invoice if no invoice exists for current month
                var startOfMonth = new DateTime(asOfDate.Year, asOfDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                var endOfMonth = startOfMonth.AddMonths(1);

                var existing = await _db.SalesInvoices.IgnoreQueryFilters()
                    .AnyAsync(i => i.TenantId == tenantId && !i.IsDeleted && i.CustomerId == customer.Id &&
                                   i.InvoiceDate >= startOfMonth && i.InvoiceDate < endOfMonth, ct);

                if (existing) continue;

                var invoiceNumber = $"SUB-INV-{asOfDate:yyyyMM}-{customer.CustomerCode ?? Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
                var amount = customer.CreditLimit > 0 ? Math.Min(customer.CreditLimit, 500m) : 250m;
                var dueDate = asOfDate.AddDays(30);

                var invoice = new SalesInvoice
                {
                    TenantId = tenantId,
                    CompanyId = customer.CompanyId,
                    CustomerId = customer.Id,
                    InvoiceNumber = invoiceNumber,
                    InvoiceDate = asOfDate,
                    DueDate = dueDate,
                    Status = "Draft",
                    SubTotal = amount,
                    TaxAmount = 0,
                    TotalAmount = amount,
                    PaidAmount = 0,
                    BalanceAmount = amount,
                    Notes = $"Automated subscription recurring billing cycle for {asOfDate:MMMM yyyy}."
                };

                _db.SalesInvoices.Add(invoice);
                totalBilled += amount;
                result.InvoicesGeneratedCount++;

                result.GeneratedInvoices.Add(new GeneratedInvoiceSummary
                {
                    InvoiceId = invoice.Id,
                    InvoiceNumber = invoiceNumber,
                    CustomerId = customer.Id,
                    CustomerName = customer.CustomerName,
                    Amount = amount,
                    Currency = "USD",
                    DueDate = dueDate
                });
            }

            if (result.InvoicesGeneratedCount > 0)
            {
                await _db.SaveChangesAsync(ct);
            }

            result.TotalAmountBilled = totalBilled;
            return result;
        }
    }
}
