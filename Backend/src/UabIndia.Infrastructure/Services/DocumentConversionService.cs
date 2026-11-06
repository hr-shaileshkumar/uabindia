using System;
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
    public class DocumentConversionService : IDocumentConversionService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;

        public DocumentConversionService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
        }

        public async Task<QuotationConversionResult> ConvertQuotationToOrderAsync(Guid quotationId, CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var quotation = await _db.SalesQuotations
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.Id == quotationId && q.TenantId == tenantId && !q.IsDeleted, cancellationToken);
            if (quotation == null)
                throw new KeyNotFoundException("Quotation not found");
            if (!DocumentLifecycle.CanConvertQuotation(quotation.Status))
                throw new InvalidOperationException($"Quotation in status '{quotation.Status}' cannot be converted.");

            var existing = await _db.SalesOrders
                .FirstOrDefaultAsync(o => o.SalesQuotationId == quotationId && o.TenantId == tenantId && !o.IsDeleted, cancellationToken);
            if (existing != null)
                return new QuotationConversionResult(existing, AlreadyConverted: true);

            var order = new SalesOrder
            {
                SONumber = await _numbers.NextAsync("SalesOrder", "SO-", 5, cancellationToken),
                SODate = DateTime.UtcNow.Date,
                CustomerId = quotation.CustomerId,
                SalesQuotationId = quotation.Id,
                SubTotal = quotation.SubTotal,
                TaxAmount = quotation.TaxAmount,
                DiscountAmount = quotation.DiscountAmount,
                ShippingCharges = quotation.ShippingCharges,
                TotalAmount = quotation.TotalAmount,
                Status = "Confirmed",
                Notes = $"Converted from quotation {quotation.QuotationNumber}",
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var line in quotation.Items.Where(i => !i.IsDeleted))
            {
                order.Items.Add(new SalesOrderItem
                {
                    TenantId = tenantId,
                    ItemId = line.ItemId,
                    Description = line.Description,
                    Quantity = line.Quantity,
                    PendingQuantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    TaxRate = line.TaxRate,
                    TaxAmount = line.TaxAmount,
                    DiscountPercent = line.DiscountPercent,
                    DiscountAmount = line.DiscountAmount,
                    TotalAmount = line.TotalAmount,
                    CreatedAt = DateTime.UtcNow
                });
            }

            _db.SalesOrders.Add(order);
            quotation.Status = "Accepted";
            quotation.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return new QuotationConversionResult(order, AlreadyConverted: false);
        }

        public async Task<PurchaseRequestConversion> ConvertPurchaseRequestAsync(Guid requestId, CancellationToken cancellationToken = default)
        {
            var row = await _db.PurchaseRequests.FirstOrDefaultAsync(r => r.Id == requestId && !r.IsDeleted, cancellationToken);
            if (row == null)
                throw new KeyNotFoundException("Purchase request not found.");
            if (string.Equals(row.Status, "Converted", StringComparison.OrdinalIgnoreCase) && row.PurchaseOrderId.HasValue)
            {
                var existingPo = await _db.PurchaseOrders.AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id == row.PurchaseOrderId.Value && !p.IsDeleted, cancellationToken);
                if (existingPo != null)
                    return new PurchaseRequestConversion(row, existingPo.Id, existingPo.PONumber);
            }
            if (row.Status != "Approved")
                throw new InvalidOperationException("Only approved requests can convert to a PO.");

            var vendor = await _db.Vendors.AsNoTracking().OrderBy(v => v.CreatedAt).FirstOrDefaultAsync(cancellationToken);
            if (vendor == null)
                throw new InvalidOperationException("Create a vendor before converting to a purchase order.");

            var po = new PurchaseOrder
            {
                TenantId = row.TenantId,
                PONumber = await _numbers.NextAsync("PurchaseOrder", "PO-", 5, cancellationToken),
                PODate = DateTime.UtcNow.Date,
                VendorId = vendor.Id,
                ExpectedDeliveryDate = row.RequiredDate,
                TotalAmount = row.EstimatedCost,
                Status = "Draft",
                Notes = $"Converted from {row.RequestNumber}: {row.ItemDescription}",
                CreatedAt = DateTime.UtcNow
            };
            _db.PurchaseOrders.Add(po);
            await _db.SaveChangesAsync(cancellationToken);
            row.PurchaseOrderId = po.Id;
            row.Status = "Converted";
            row.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return new PurchaseRequestConversion(row, po.Id, po.PONumber);
        }

        public async Task<LeadConversionResult> ConvertLeadToQuotationAsync(Guid leadId, CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var lead = await _db.CrmLeads
                .FirstOrDefaultAsync(l => l.Id == leadId && l.TenantId == tenantId && !l.IsDeleted, cancellationToken);
            if (lead == null)
                throw new KeyNotFoundException("Lead not found");

            if (string.Equals(lead.Status, "Converted", StringComparison.OrdinalIgnoreCase))
            {
                var existingQuote = await _db.SalesQuotations
                    .OrderByDescending(q => q.CreatedAt)
                    .FirstOrDefaultAsync(q =>
                        q.TenantId == tenantId &&
                        !q.IsDeleted &&
                        q.Notes != null &&
                        q.Notes.Contains($"Converted from lead {lead.LeadCode}"),
                        cancellationToken);
                if (existingQuote != null)
                    return new LeadConversionResult(existingQuote.Id, existingQuote.CustomerId, existingQuote);
            }

            var customerName = !string.IsNullOrWhiteSpace(lead.CompanyName)
                ? lead.CompanyName!.Trim()
                : lead.LeadName.Trim();

            var customer = await _db.Customers
                .FirstOrDefaultAsync(c =>
                    c.TenantId == tenantId && !c.IsDeleted &&
                    (c.CustomerName == customerName ||
                     (!string.IsNullOrWhiteSpace(lead.Email) && c.Email == lead.Email)), cancellationToken);

            if (customer == null)
            {
                customer = new Customer
                {
                    CustomerCode = await _numbers.NextAsync("Customer", "CUST-", 5, cancellationToken),
                    CustomerName = customerName,
                    CustomerType = string.IsNullOrWhiteSpace(lead.CompanyName) ? "Individual" : "Company",
                    CompanyName = lead.CompanyName,
                    Email = lead.Email,
                    PhoneNumber = lead.Phone,
                    Status = "Active",
                    TenantId = tenantId,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Customers.Add(customer);
                await _db.SaveChangesAsync(cancellationToken);
            }

            var amount = lead.Value > 0 ? lead.Value : 0m;
            var quotation = new SalesQuotation
            {
                QuotationNumber = await _numbers.NextAsync("SalesQuotation", "QT-", 5, cancellationToken),
                QuotationDate = DateTime.UtcNow.Date,
                CustomerId = customer.Id,
                ValidUntil = DateTime.UtcNow.Date.AddDays(30),
                SubTotal = amount,
                TaxAmount = 0,
                DiscountAmount = 0,
                ShippingCharges = 0,
                TotalAmount = amount,
                Status = "Draft",
                Notes = $"Converted from lead {lead.LeadCode}: {lead.LeadName}",
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };
            _db.SalesQuotations.Add(quotation);
            lead.Stage = "Won";
            lead.Status = "Converted";
            lead.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return new LeadConversionResult(quotation.Id, customer.Id, quotation);
        }
    }
}
