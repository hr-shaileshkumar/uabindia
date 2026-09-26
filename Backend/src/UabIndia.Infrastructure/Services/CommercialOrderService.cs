using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class CommercialOrderService : ICommercialOrderService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;

        public CommercialOrderService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
        }

        public async Task<SalesOrder> CreateSalesOrderAsync(CreateSalesOrderCommand command, CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var lines = DocumentLineCommands.WithItem(command.Lines);
            var (taxable, tax, discount, total) = Totals(lines, command.TotalAmount, 0m, command.DiscountAmount);

            var targetCompanyId = _tenantAccessor.GetCompanyId();
            var targetProjectId = _tenantAccessor.GetProjectId();

            var order = new SalesOrder
            {
                CompanyId = targetCompanyId,
                ProjectId = targetProjectId,
                SONumber = string.IsNullOrWhiteSpace(command.SoNumber)
                    ? await _numbers.NextAsync("SalesOrder", "SO-", 5, targetCompanyId, targetProjectId, null, cancellationToken)
                    : command.SoNumber.Trim(),
                SODate = command.SoDate == default ? DateTime.UtcNow.Date : command.SoDate,
                CustomerId = command.CustomerId,
                ExpectedDeliveryDate = command.ExpectedDeliveryDate,
                TotalAmount = total,
                Status = command.Status ?? "Draft",
                Notes = command.Notes,
                SubTotal = taxable,
                TaxAmount = tax,
                DiscountAmount = discount,
                ShippingCharges = 0,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var line in lines)
                order.Items.Add(ToSalesOrderItem(tenantId, line));

            _db.SalesOrders.Add(order);
            await _db.SaveChangesAsync(cancellationToken);
            return order;
        }

        public async Task<PurchaseOrder> CreatePurchaseOrderAsync(CreatePurchaseOrderCommand command, CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var lines = DocumentLineCommands.WithItem(command.Lines);
            var (taxable, tax, discount, total) = Totals(lines, command.TotalAmount, 0m, command.DiscountAmount);

            var targetCompanyId = _tenantAccessor.GetCompanyId();
            var targetProjectId = _tenantAccessor.GetProjectId();

            var order = new PurchaseOrder
            {
                CompanyId = targetCompanyId,
                ProjectId = targetProjectId,
                PONumber = string.IsNullOrWhiteSpace(command.PoNumber)
                    ? await _numbers.NextAsync("PurchaseOrder", "PO-", 5, targetCompanyId, targetProjectId, null, cancellationToken)
                    : command.PoNumber,
                PODate = command.PoDate == default ? DateTime.UtcNow.Date : command.PoDate,
                VendorId = command.VendorId,
                ExpectedDeliveryDate = command.ExpectedDeliveryDate,
                TotalAmount = total,
                Status = command.Status ?? "Draft",
                Notes = command.Notes,
                SubTotal = taxable,
                TaxAmount = tax,
                DiscountAmount = discount,
                ShippingCharges = 0,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var line in lines)
            {
                var (rate, lineTax, lineTotal) = LineAmounts(line);
                order.Items.Add(new PurchaseOrderItem
                {
                    TenantId = tenantId,
                    ItemId = line.ItemId,
                    Description = line.Description,
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    TaxRate = rate,
                    TaxAmount = lineTax,
                    TotalAmount = lineTotal,
                    ReceivedQuantity = 0,
                    PendingQuantity = line.Quantity,
                    CreatedAt = DateTime.UtcNow
                });
            }

            _db.PurchaseOrders.Add(order);
            await _db.SaveChangesAsync(cancellationToken);
            return order;
        }

        public async Task<SalesQuotation> CreateSalesQuotationAsync(CreateSalesQuotationCommand command, CancellationToken cancellationToken = default)
        {
            if (command.CustomerId == Guid.Empty)
                throw new InvalidOperationException("Customer is required");

            var tenantId = _tenantAccessor.GetTenantId();
            var customerExists = await _db.Customers
                .AnyAsync(c => c.Id == command.CustomerId && c.TenantId == tenantId && !c.IsDeleted, cancellationToken);
            if (!customerExists)
                throw new InvalidOperationException("Customer not found");

            var quotationDate = command.QuotationDate == default ? DateTime.UtcNow.Date : command.QuotationDate;
            var validUntil = command.ValidUntil == default ? quotationDate.AddDays(30) : command.ValidUntil;
            var lines = DocumentLineCommands.WithItem(command.Lines);
            decimal taxable;
            decimal tax;
            decimal discount;
            decimal total;
            if (lines.Count > 0)
            {
                (taxable, tax, discount, total) = Totals(lines, command.TotalAmount, 0m, command.DiscountAmount);
            }
            else
            {
                taxable = command.SubTotal > 0 ? command.SubTotal : command.TotalAmount;
                tax = command.TaxAmount;
                (discount, total) = DocumentLineMath.ApplyBillDiscount(command.TotalAmount, command.DiscountAmount);
            }

            var targetCompanyId = _tenantAccessor.GetCompanyId();
            var targetProjectId = _tenantAccessor.GetProjectId();

            var quotation = new SalesQuotation
            {
                CompanyId = targetCompanyId,
                ProjectId = targetProjectId,
                QuotationNumber = string.IsNullOrWhiteSpace(command.QuotationNumber)
                    ? await _numbers.NextAsync("SalesQuotation", "QT-", 5, targetCompanyId, targetProjectId, null, cancellationToken)
                    : command.QuotationNumber.Trim(),
                QuotationDate = quotationDate,
                CustomerId = command.CustomerId,
                ValidUntil = validUntil,
                SubTotal = taxable,
                TaxAmount = tax,
                DiscountAmount = discount,
                ShippingCharges = command.ShippingCharges,
                TotalAmount = total,
                Status = string.IsNullOrWhiteSpace(command.Status) ? "Draft" : command.Status,
                Terms = command.Terms,
                Notes = command.Notes,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var line in lines)
            {
                var (rate, lineTax, lineTotal) = LineAmounts(line);
                quotation.Items.Add(new SalesQuotationItem
                {
                    TenantId = tenantId,
                    ItemId = line.ItemId,
                    Description = line.Description,
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    TaxRate = rate,
                    TaxAmount = lineTax,
                    TotalAmount = lineTotal,
                    CreatedAt = DateTime.UtcNow
                });
            }

            _db.SalesQuotations.Add(quotation);
            await _db.SaveChangesAsync(cancellationToken);
            return quotation;
        }

        private static SalesOrderItem ToSalesOrderItem(Guid tenantId, DocumentLineCommand line)
        {
            var (rate, lineTax, lineTotal) = LineAmounts(line);
            return new SalesOrderItem
            {
                TenantId = tenantId,
                ItemId = line.ItemId,
                Description = line.Description,
                Quantity = line.Quantity,
                UnitPrice = line.UnitPrice,
                TaxRate = rate,
                TaxAmount = lineTax,
                TotalAmount = lineTotal,
                DeliveredQuantity = 0,
                PendingQuantity = line.Quantity,
                CreatedAt = DateTime.UtcNow
            };
        }

        private static (decimal Taxable, decimal Tax, decimal Discount, decimal Total) Totals(
            IReadOnlyList<DocumentLineCommand> lines,
            decimal fallbackBill,
            decimal fallbackTax,
            decimal discountRequested)
        {
            var (taxable, tax, bill) = lines.Count > 0
                ? DocumentLineCommands.Sum(lines)
                : (fallbackBill, fallbackTax, fallbackBill);
            var (discount, total) = DocumentLineMath.ApplyBillDiscount(bill, discountRequested);
            return (taxable, tax, discount, total);
        }

        private static (decimal Rate, decimal Tax, decimal Total) LineAmounts(DocumentLineCommand line)
        {
            var rate = line.TaxRate <= 0 ? 18m : line.TaxRate;
            var taxable = DocumentLineMath.Taxable(line.Quantity, line.UnitPrice);
            var tax = DocumentLineMath.LineTax(taxable, rate);
            return (rate, tax, taxable + tax);
        }
    }
}
