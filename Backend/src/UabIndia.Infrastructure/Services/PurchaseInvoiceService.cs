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
    public class PurchaseInvoiceService : IPurchaseInvoiceService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;
        private readonly ILedgerPostingService _ledger;

        public PurchaseInvoiceService(
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

        public async Task<PurchaseInvoice> CreateAsync(CreatePurchaseInvoiceCommand command, CancellationToken cancellationToken = default)
        {
            var lines = DocumentLineCommands.WithQuantity(command.Lines);
            if (command.TotalAmount <= 0 && command.PurchaseOrderId == Guid.Empty && lines.Count == 0)
                throw new InvalidOperationException("Amount, purchase order, or line items are required.");

            PurchaseOrder? po = null;
            if (command.PurchaseOrderId != Guid.Empty)
            {
                po = await _db.PurchaseOrders.Include(p => p.Items)
                    .FirstOrDefaultAsync(p => p.Id == command.PurchaseOrderId && !p.IsDeleted, cancellationToken);
                if (po == null)
                    throw new InvalidOperationException("Purchase order not found.");
            }

            var vendorId = command.VendorId != Guid.Empty ? command.VendorId : po?.VendorId ?? Guid.Empty;
            if (vendorId == Guid.Empty)
                throw new InvalidOperationException("Vendor is required.");

            var tenantId = _tenantAccessor.GetTenantId();
            if (lines.Count == 0 && po?.Items != null)
            {
                lines = po.Items
                    .Where(item => !item.IsDeleted && item.Quantity > 0
                        && (item.ItemId.HasValue || !string.IsNullOrWhiteSpace(item.Description)))
                    .Select(item => new DocumentLineCommand(
                        item.ItemId,
                        item.Description,
                        item.Quantity,
                        item.UnitPrice,
                        item.TaxRate <= 0 ? 18 : item.TaxRate))
                    .ToList();
            }

            decimal taxable;
            decimal taxRate;
            if (lines.Count > 0)
            {
                var summed = DocumentLineCommands.Sum(lines);
                taxable = summed.Taxable;
                taxRate = taxable > 0 ? summed.Tax / taxable * 100m : (command.TaxRate > 0 ? command.TaxRate : 18m);
            }
            else
            {
                taxable = command.SubTotal > 0
                    ? command.SubTotal
                    : po?.SubTotal > 0
                        ? po.SubTotal
                        : po != null && po.TaxAmount > 0
                            ? Math.Max(0, po.TotalAmount - po.TaxAmount)
                            : (command.TotalAmount > 0 ? command.TotalAmount : po?.TotalAmount ?? 0);
                taxRate = command.TaxRate > 0 ? command.TaxRate : 18m;
            }

            var vendor = await _db.Vendors.AsNoTracking().FirstOrDefaultAsync(v => v.Id == vendorId, cancellationToken);
            var companyState = await _db.Companies.AsNoTracking()
                .Where(c => c.TenantId == tenantId && !c.IsDeleted)
                .Select(c => c.State)
                .FirstOrDefaultAsync(cancellationToken);
            var gst = GstCalculator.Calculate(taxable, taxRate, GstCalculator.IsInterState(companyState, vendor?.State));
            var (discount, total) = DocumentLineMath.ApplyBillDiscount(gst.InvoiceTotal, command.DiscountAmount);

            var targetCompanyId = po?.CompanyId ?? _tenantAccessor.GetCompanyId();
            var targetProjectId = po?.ProjectId ?? _tenantAccessor.GetProjectId();

            var invoice = new PurchaseInvoice
            {
                TenantId = tenantId,
                CompanyId = targetCompanyId,
                ProjectId = targetProjectId,
                InvoiceNumber = await _numbers.NextAsync("PurchaseInvoice", "BILL-", 5, targetCompanyId, targetProjectId, null, cancellationToken),
                InvoiceDate = command.InvoiceDate == default ? DateTime.UtcNow.Date : command.InvoiceDate,
                VendorId = vendorId,
                PurchaseOrderId = po?.Id,
                VendorInvoiceNumber = command.VendorInvoiceNumber,
                DueDate = command.DueDate,
                SubTotal = taxable,
                TaxAmount = gst.TotalTax,
                DiscountAmount = discount,
                TotalAmount = total,
                PaidAmount = 0,
                BalanceAmount = total,
                Status = "Unpaid",
                PaymentStatus = "Pending",
                Notes = command.Notes,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var line in lines)
            {
                var lineTaxable = DocumentLineMath.Taxable(line.Quantity, line.UnitPrice);
                var lineTax = DocumentLineMath.LineTax(lineTaxable, line.TaxRate);
                invoice.Items.Add(new PurchaseInvoiceItem
                {
                    TenantId = tenantId,
                    ItemId = line.ItemId,
                    Description = line.Description,
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    TaxRate = line.TaxRate <= 0 ? 18 : line.TaxRate,
                    TaxAmount = lineTax,
                    TotalAmount = lineTaxable + lineTax,
                    CreatedAt = DateTime.UtcNow
                });
            }

            _db.PurchaseInvoices.Add(invoice);

            if (total <= 0)
            {
                await _db.SaveChangesAsync(cancellationToken);
                return invoice;
            }

            await _ledger.PostAsync(
                "JE-BILL-",
                invoice.InvoiceDate,
                $"Vendor bill {invoice.InvoiceNumber}",
                CommercialLedgerLines.PurchaseInvoice(total, taxable, gst, discount),
                "PurchaseInvoice",
                invoice.Id,
                cancellationToken);
            return invoice;
        }
    }
}
