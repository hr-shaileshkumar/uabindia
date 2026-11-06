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
    public class SalesInvoiceService : ISalesInvoiceService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;
        private readonly ILedgerPostingService _ledger;
        private readonly IInventoryStockService _stock;

        public SalesInvoiceService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers,
            ILedgerPostingService ledger,
            IInventoryStockService stock)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
            _ledger = ledger;
            _stock = stock;
        }

        public async Task<SalesInvoice> CreateAsync(CreateSalesInvoiceCommand command, CancellationToken cancellationToken = default)
        {
            if (command.CustomerId == Guid.Empty)
                throw new InvalidOperationException("Customer is required");

            var tenantId = _tenantAccessor.GetTenantId();
            var customer = await _db.Customers.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == command.CustomerId && c.TenantId == tenantId && !c.IsDeleted, cancellationToken);
            if (customer == null)
                throw new InvalidOperationException("Customer not found");

            if (command.SalesOrderId.HasValue)
            {
                var orderExists = await _db.SalesOrders
                    .AnyAsync(o => o.Id == command.SalesOrderId.Value && o.TenantId == tenantId && !o.IsDeleted, cancellationToken);
                if (!orderExists)
                    throw new InvalidOperationException("Sales order not found");
            }

            var invoiceDate = command.InvoiceDate == default ? DateTime.UtcNow.Date : command.InvoiceDate;
            var companyState = await CompanyStateAsync(tenantId, cancellationToken);
            var place = command.PlaceOfSupply ?? customer.State;
            var interState = GstCalculator.IsInterState(companyState, place);
            var lines = DocumentLineCommands.WithItem(command.Lines);
            var (taxable, taxRate) = ResolveTaxable(lines, command.SubTotal, command.TotalAmount, command.TaxAmount, command.TaxRate);
            var gst = GstCalculator.Calculate(taxable, taxRate, interState);
            var (discount, total) = DocumentLineMath.ApplyBillDiscount(gst.InvoiceTotal, command.DiscountAmount);
            var paid = command.PaidAmount;
            var status = string.IsNullOrWhiteSpace(command.Status)
                ? (paid <= 0 ? "Unpaid" : paid >= total ? "Paid" : "Partial")
                : command.Status;
            var paymentStatus = string.IsNullOrWhiteSpace(command.PaymentStatus)
                ? (paid <= 0 ? "Pending" : paid >= total ? "Paid" : "Partial")
                : command.PaymentStatus;

            var targetCompanyId = _tenantAccessor.GetCompanyId();
            var targetProjectId = _tenantAccessor.GetProjectId();

            var invoice = new SalesInvoice
            {
                CompanyId = targetCompanyId,
                ProjectId = targetProjectId,
                InvoiceNumber = string.IsNullOrWhiteSpace(command.InvoiceNumber)
                    ? await _numbers.NextAsync("SalesInvoice", "INV-", 5, targetCompanyId, targetProjectId, null, cancellationToken)
                    : command.InvoiceNumber.Trim(),
                InvoiceDate = invoiceDate,
                CustomerId = command.CustomerId,
                SalesOrderId = command.SalesOrderId,
                DueDate = command.DueDate,
                SubTotal = taxable,
                TaxAmount = gst.TotalTax,
                DiscountAmount = discount,
                ShippingCharges = command.ShippingCharges,
                OtherCharges = command.OtherCharges,
                TotalAmount = total,
                PaidAmount = paid,
                BalanceAmount = total - paid,
                Status = status,
                PaymentStatus = paymentStatus,
                Notes = command.Notes,
                PlaceOfSupply = place,
                IsInterState = interState,
                CgstAmount = gst.Cgst,
                SgstAmount = gst.Sgst,
                IgstAmount = gst.Igst,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            AddItems(invoice, lines, tenantId);
            _db.SalesInvoices.Add(invoice);
            await PostSalesAsync(invoice, taxable, gst, discount, total, command.WarehouseId, cancellationToken);
            return invoice;
        }

        public async Task<SalesInvoice> ConvertOrderAsync(Guid salesOrderId, CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var order = await _db.SalesOrders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == salesOrderId && o.TenantId == tenantId && !o.IsDeleted, cancellationToken);
            if (order == null)
                throw new KeyNotFoundException("Sales order not found");
            if (!DocumentLifecycle.CanConvertSalesOrder(order.Status))
                throw new InvalidOperationException($"Sales order in status '{order.Status}' cannot be invoiced.");

            var existing = await _db.SalesInvoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.SalesOrderId == salesOrderId && i.TenantId == tenantId && !i.IsDeleted, cancellationToken);
            if (existing != null)
                return existing;

            var customer = await _db.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.Id == order.CustomerId, cancellationToken);
            var companyState = await CompanyStateAsync(tenantId, cancellationToken);
            var place = customer?.State;
            var interState = GstCalculator.IsInterState(companyState, place);
            var orderLines = order.Items.Where(item => !item.IsDeleted && item.Quantity > 0).ToList();
            var taxable = order.SubTotal > 0
                ? order.SubTotal
                : (orderLines.Count > 0
                    ? orderLines.Sum(item => item.TotalAmount > 0 ? item.TotalAmount : item.Quantity * item.UnitPrice)
                    : Math.Max(0, order.TotalAmount - order.TaxAmount));
            var taxRate = taxable > 0 && order.TaxAmount > 0
                ? order.TaxAmount / taxable * 100m
                : 0m;
            var gst = GstCalculator.Calculate(taxable, taxRate, interState);
            var discount = order.DiscountAmount;
            var total = order.TotalAmount > 0
                ? order.TotalAmount
                : IndiaStatutoryCalculator.RoundMoney(taxable + gst.TotalTax - discount + order.ShippingCharges);

            var targetCompanyId = order.CompanyId ?? _tenantAccessor.GetCompanyId();
            var targetProjectId = order.ProjectId ?? _tenantAccessor.GetProjectId();

            var invoice = new SalesInvoice
            {
                CompanyId = targetCompanyId,
                ProjectId = targetProjectId,
                InvoiceNumber = await _numbers.NextAsync("SalesInvoice", "INV-", 5, targetCompanyId, targetProjectId, null, cancellationToken),
                InvoiceDate = DateTime.UtcNow.Date,
                CustomerId = order.CustomerId,
                SalesOrderId = order.Id,
                DueDate = DateTime.UtcNow.Date.AddDays(30),
                SubTotal = taxable,
                TaxAmount = order.TaxAmount > 0 ? order.TaxAmount : gst.TotalTax,
                DiscountAmount = discount,
                ShippingCharges = order.ShippingCharges,
                OtherCharges = 0,
                TotalAmount = total,
                PaidAmount = 0,
                BalanceAmount = total,
                Status = "Unpaid",
                PaymentStatus = "Pending",
                Notes = $"Converted from sales order {order.SONumber}",
                PlaceOfSupply = place,
                IsInterState = interState,
                CgstAmount = gst.Cgst,
                SgstAmount = gst.Sgst,
                IgstAmount = gst.Igst,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            foreach (var line in orderLines)
            {
                invoice.Items.Add(new SalesInvoiceItem
                {
                    TenantId = tenantId,
                    ItemId = line.ItemId,
                    Description = line.Description,
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    TaxRate = line.TaxRate <= 0 ? 18 : line.TaxRate,
                    TaxAmount = line.TaxAmount,
                    DiscountPercent = line.DiscountPercent,
                    DiscountAmount = line.DiscountAmount,
                    TotalAmount = line.TotalAmount,
                    CreatedAt = DateTime.UtcNow
                });
                line.DeliveredQuantity = line.Quantity;
                line.PendingQuantity = 0;
                line.UpdatedAt = DateTime.UtcNow;
            }

            _db.SalesInvoices.Add(invoice);
            order.Status = "Invoiced";
            order.UpdatedAt = DateTime.UtcNow;
            await PostSalesAsync(invoice, taxable, gst, discount, total, null, cancellationToken);
            return invoice;
        }

        private async Task PostSalesAsync(
            SalesInvoice invoice,
            decimal taxable,
            GstBreakdown gst,
            decimal discount,
            decimal total,
            Guid? warehouseId,
            CancellationToken cancellationToken)
        {
            var cogs = await IssueStockAsync(invoice, warehouseId, cancellationToken);

            if (total <= 0 && cogs <= 0)
            {
                await _db.SaveChangesAsync(cancellationToken);
                return;
            }

            if (total > 0)
            {
                var journal = await _ledger.PostAsync(
                    "JE-INV-",
                    invoice.InvoiceDate,
                    $"Sales invoice {invoice.InvoiceNumber}",
                    CommercialLedgerLines.SalesInvoice(total, taxable, gst, discount),
                    "SalesInvoice",
                    invoice.Id,
                    cancellationToken);
                invoice.JournalEntryId = journal.Id;
            }

            if (cogs > 0)
            {
                await _ledger.PostAsync(
                    "JE-COGS-",
                    invoice.InvoiceDate,
                    $"COGS {invoice.InvoiceNumber}",
                    CommercialLedgerLines.CostOfGoodsSold(cogs),
                    "SalesInvoiceCogs",
                    invoice.Id,
                    cancellationToken);
            }

            await _db.SaveChangesAsync(cancellationToken);
        }

        private async Task<decimal> IssueStockAsync(
            SalesInvoice invoice,
            Guid? warehouseId,
            CancellationToken cancellationToken)
        {
            var stockLines = invoice.Items
                .Where(line => !line.IsDeleted && line.Quantity > 0 && line.ItemId is Guid)
                .ToList();
            if (stockLines.Count == 0)
                return 0;

            var tenantId = invoice.TenantId;
            warehouseId = await ResolveWarehouseAsync(tenantId, warehouseId, cancellationToken);
            decimal cogs = 0;

            foreach (var line in stockLines)
            {
                var itemId = line.ItemId!.Value;
                var item = await _db.Items.FirstOrDefaultAsync(
                    i => i.Id == itemId && i.TenantId == tenantId && !i.IsDeleted,
                    cancellationToken);
                if (item == null)
                    throw new InvalidOperationException("Item not found.");
                if (string.Equals(item.ItemType, "Service", StringComparison.OrdinalIgnoreCase))
                    continue;

                var unitCost = item.PurchasePrice;
                if (warehouseId.HasValue)
                {
                    var balance = await _db.StockBalances.AsNoTracking().FirstOrDefaultAsync(
                        b => b.TenantId == tenantId && b.ItemId == itemId && b.WarehouseId == warehouseId.Value && !b.IsDeleted,
                        cancellationToken);
                    if (balance != null && balance.AverageUnitCost > 0)
                        unitCost = balance.AverageUnitCost;
                }

                var movement = await _stock.StageOutboundAsync(
                    itemId,
                    line.Quantity,
                    unitCost,
                    warehouseId,
                    "SalesInvoice",
                    invoice.Id,
                    invoice.InvoiceNumber,
                    $"Stock issue for invoice {invoice.InvoiceNumber}",
                    cancellationToken);
                cogs += movement.TotalValue;
            }

            return IndiaStatutoryCalculator.RoundMoney(cogs);
        }

        private async Task<Guid?> ResolveWarehouseAsync(
            Guid tenantId,
            Guid? warehouseId,
            CancellationToken cancellationToken)
        {
            if (warehouseId.HasValue)
            {
                var ok = await _db.Warehouses.AnyAsync(
                    w => w.Id == warehouseId.Value && w.TenantId == tenantId && !w.IsDeleted,
                    cancellationToken);
                if (!ok)
                    throw new InvalidOperationException("Warehouse not found.");
                return warehouseId;
            }

            return await _db.Warehouses.AsNoTracking()
                .Where(w => w.TenantId == tenantId && !w.IsDeleted)
                .OrderByDescending(w => w.IsDefault)
                .ThenBy(w => w.CreatedAt)
                .Select(w => (Guid?)w.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        private async Task<string?> CompanyStateAsync(Guid tenantId, CancellationToken cancellationToken) =>
            await _db.Companies.AsNoTracking()
                .Where(c => c.TenantId == tenantId && !c.IsDeleted)
                .Select(c => c.State)
                .FirstOrDefaultAsync(cancellationToken);

        private static (decimal Taxable, decimal TaxRate) ResolveTaxable(
            System.Collections.Generic.List<DocumentLineCommand> lines,
            decimal subTotal,
            decimal totalAmount,
            decimal taxAmount,
            decimal taxRate)
        {
            if (lines.Count > 0)
            {
                var summed = DocumentLineCommands.Sum(lines);
                var rate = summed.Taxable > 0 ? summed.Tax / summed.Taxable * 100m : (taxRate > 0 ? taxRate : 18m);
                return (summed.Taxable, rate);
            }

            return (
                subTotal > 0 ? subTotal : Math.Max(0, totalAmount - taxAmount),
                taxRate > 0 ? taxRate : 18m);
        }

        private static void AddItems(SalesInvoice invoice, System.Collections.Generic.List<DocumentLineCommand> lines, Guid tenantId)
        {
            foreach (var line in lines)
            {
                var taxable = DocumentLineMath.Taxable(line.Quantity, line.UnitPrice);
                var tax = DocumentLineMath.LineTax(taxable, line.TaxRate);
                invoice.Items.Add(new SalesInvoiceItem
                {
                    TenantId = tenantId,
                    ItemId = line.ItemId,
                    Description = line.Description,
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    TaxRate = line.TaxRate <= 0 ? 18 : line.TaxRate,
                    TaxAmount = tax,
                    TotalAmount = taxable + tax,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }
    }
}
