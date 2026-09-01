using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class GoodsReceiptService : IGoodsReceiptService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IInventoryStockService _stock;

        public GoodsReceiptService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IInventoryStockService stock)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _stock = stock;
        }

        public async Task<GrnAcceptResult> AcceptAsync(Guid id, Guid? warehouseId, CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var grn = await _db.GoodsReceiptNotes
                .FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId && !g.IsDeleted, cancellationToken);
            if (grn == null)
                throw new KeyNotFoundException("GRN not found");

            if (string.Equals(grn.Status, "Accepted", StringComparison.OrdinalIgnoreCase))
                return new GrnAcceptResult(grn, Array.Empty<GrnStockPosted>(), AlreadyAccepted: true);

            if (string.Equals(grn.Status, "Rejected", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Rejected GRNs cannot be accepted.");

            if (!grn.PurchaseOrderId.HasValue)
                throw new InvalidOperationException("GRN must be linked to a purchase order to post stock.");

            var po = await _db.PurchaseOrders
                .Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.Id == grn.PurchaseOrderId.Value && p.TenantId == tenantId && !p.IsDeleted, cancellationToken);
            if (po == null)
                throw new InvalidOperationException("Linked purchase order not found.");

            if (!warehouseId.HasValue)
            {
                warehouseId = await _db.Warehouses.AsNoTracking()
                    .Where(w => w.TenantId == tenantId && !w.IsDeleted)
                    .OrderBy(w => w.CreatedAt)
                    .Select(w => (Guid?)w.Id)
                    .FirstOrDefaultAsync(cancellationToken);
            }
            else
            {
                var whOk = await _db.Warehouses.AnyAsync(w =>
                    w.Id == warehouseId.Value && w.TenantId == tenantId && !w.IsDeleted, cancellationToken);
                if (!whOk)
                    throw new InvalidOperationException("Warehouse not found.");
            }

            var posted = new List<GrnStockPosted>();
            foreach (var line in po.Items.Where(i => !i.IsDeleted && i.Quantity > 0))
            {
                var pending = line.PendingQuantity > 0
                    ? line.PendingQuantity
                    : Math.Max(0, line.Quantity - line.ReceivedQuantity);
                if (pending <= 0) continue;
                if (line.ItemId is not Guid catalogItemId) continue;

                var item = await _db.Items.FirstOrDefaultAsync(i =>
                    i.Id == catalogItemId && i.TenantId == tenantId && !i.IsDeleted, cancellationToken);
                if (item == null) continue;

                var unitPrice = line.UnitPrice > 0 ? line.UnitPrice : item.PurchasePrice;
                var movement = await _stock.StageInboundAsync(
                    catalogItemId,
                    pending,
                    unitPrice,
                    warehouseId,
                    "GRN",
                    grn.Id,
                    grn.GrnNumber,
                    $"GRN accept for PO {po.PONumber}",
                    cancellationToken);

                line.ReceivedQuantity += pending;
                line.PendingQuantity = Math.Max(0, line.Quantity - line.ReceivedQuantity);
                line.UpdatedAt = DateTime.UtcNow;
                posted.Add(new GrnStockPosted(movement.MovementNumber, line.ItemId, pending, movement.UnitPrice));
            }

            grn.Status = "Accepted";
            grn.UpdatedAt = DateTime.UtcNow;
            po.Status = "Received";
            po.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return new GrnAcceptResult(grn, posted);
        }
    }
}
