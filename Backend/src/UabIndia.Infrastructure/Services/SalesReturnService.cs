using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class SalesReturnService : ISalesReturnService
    {
        private readonly ApplicationDbContext _db;
        private readonly IDocumentNumberService _numbers;
        private readonly ILedgerPostingService _ledger;
        private readonly IInventoryStockService _stock;

        public SalesReturnService(
            ApplicationDbContext db,
            IDocumentNumberService numbers,
            ILedgerPostingService ledger,
            IInventoryStockService stock)
        {
            _db = db;
            _numbers = numbers;
            _ledger = ledger;
            _stock = stock;
        }

        public async Task<SalesReturn> ProcessAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var row = await _db.SalesReturns.FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted, cancellationToken);
            if (row == null)
                throw new KeyNotFoundException("Sales return not found.");
            if (!string.Equals(row.Status, "Pending", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Only pending returns can be processed.");

            row.Status = "Processed";
            row.CreditNoteNumber = await _numbers.NextAsync("CreditNote", "CN-", 5, cancellationToken);
            var journal = await _ledger.PostAsync(
                "JE-SR-",
                row.ReturnDate,
                $"Sales return {row.ReturnNumber}",
                CommercialLedgerLines.SalesReturn(row.Amount),
                "SalesReturn",
                row.Id,
                cancellationToken);
            row.JournalEntryId = journal.Id;

            var restock = await RestockFromInvoiceAsync(row, cancellationToken);
            if (restock > 0)
            {
                await _ledger.PostAsync(
                    "JE-SRSTK-",
                    row.ReturnDate,
                    $"Stock return {row.ReturnNumber}",
                    CommercialLedgerLines.InventoryRestock(restock),
                    "SalesReturnStock",
                    row.Id,
                    cancellationToken);
            }

            row.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return row;
        }

        private async Task<decimal> RestockFromInvoiceAsync(SalesReturn row, CancellationToken cancellationToken)
        {
            if (!row.SalesInvoiceId.HasValue)
                return 0;

            var invoice = await _db.SalesInvoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == row.SalesInvoiceId.Value && !i.IsDeleted, cancellationToken);
            if (invoice == null)
                return 0;

            var warehouseId = await _db.Warehouses.AsNoTracking()
                .Where(w => w.TenantId == invoice.TenantId && !w.IsDeleted)
                .OrderByDescending(w => w.IsDefault)
                .ThenBy(w => w.CreatedAt)
                .Select(w => (Guid?)w.Id)
                .FirstOrDefaultAsync(cancellationToken);

            decimal cost = 0;
            foreach (var line in invoice.Items.Where(x => !x.IsDeleted && x.Quantity > 0 && x.ItemId.HasValue))
            {
                var item = await _db.Items.FirstOrDefaultAsync(
                    i => i.Id == line.ItemId!.Value && i.TenantId == invoice.TenantId && !i.IsDeleted,
                    cancellationToken);
                if (item == null)
                    continue;
                if (string.Equals(item.ItemType, "Service", StringComparison.OrdinalIgnoreCase))
                    continue;

                var movement = await _stock.StageInboundAsync(
                    item.Id,
                    line.Quantity,
                    item.PurchasePrice,
                    warehouseId,
                    "SalesReturn",
                    row.Id,
                    row.ReturnNumber,
                    $"Restock from return {row.ReturnNumber}",
                    cancellationToken);
                cost += movement.TotalValue;
            }

            return IndiaStatutoryCalculator.RoundMoney(cost);
        }
    }
}
