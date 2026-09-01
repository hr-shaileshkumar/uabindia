using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class PurchaseRequestService : IPurchaseRequestService
    {
        private readonly ApplicationDbContext _db;

        public PurchaseRequestService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<PurchaseRequest> ApproveAsync(Guid id, Guid approvedBy, CancellationToken cancellationToken = default)
        {
            var row = await LoadAsync(id, cancellationToken);
            row.Status = "Approved";
            row.ApprovedBy = approvedBy;
            row.ApprovedAt = DateTime.UtcNow;
            row.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return row;
        }

        public async Task<PurchaseRequest> RejectAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var row = await LoadAsync(id, cancellationToken);
            row.Status = "Rejected";
            row.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return row;
        }

        public async Task<ThreeWayMatchResult> MatchPurchaseOrderAsync(Guid purchaseOrderId, CancellationToken cancellationToken = default)
        {
            var po = await _db.PurchaseOrders.AsNoTracking().Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.Id == purchaseOrderId && !p.IsDeleted, cancellationToken);
            if (po == null)
                throw new KeyNotFoundException("Purchase order not found.");

            var grnQty = await _db.GoodsReceiptNotes.AsNoTracking()
                .Where(g => g.PurchaseOrderId == purchaseOrderId && !g.IsDeleted)
                .SumAsync(g => (decimal?)g.TotalItems, cancellationToken) ?? 0;
            var billedAmount = await _db.PurchaseInvoices.AsNoTracking()
                .Where(i => i.PurchaseOrderId == purchaseOrderId && !i.IsDeleted)
                .SumAsync(i => (decimal?)i.TotalAmount, cancellationToken) ?? 0;
            var ordered = po.Items.Sum(i => i.Quantity);
            var matched = ordered > 0 && grnQty >= ordered && billedAmount > 0;

            return new ThreeWayMatchResult(
                purchaseOrderId,
                po.PONumber,
                ordered,
                grnQty,
                billedAmount,
                po.TotalAmount,
                matched ? "Matched" : "Variance");
        }

        private async Task<PurchaseRequest> LoadAsync(Guid id, CancellationToken cancellationToken)
        {
            var row = await _db.PurchaseRequests.FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted, cancellationToken);
            if (row == null)
                throw new KeyNotFoundException("Purchase request not found.");
            return row;
        }
    }
}
