using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Common.PageActions;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class WorkflowTriggerPageActionHandler : IPageActionHandler
    {
        private readonly IApprovalRequestService _approvalService;
        private readonly ApplicationDbContext _db;

        public WorkflowTriggerPageActionHandler(IApprovalRequestService approvalService, ApplicationDbContext db)
        {
            _approvalService = approvalService;
            _db = db;
        }

        public bool CanHandle(string actionType, string actionKey) =>
            string.Equals(actionType, "workflowTrigger", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(actionKey, "submit_approval", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(actionKey, "request_approval", StringComparison.OrdinalIgnoreCase);

        public async Task<PageActionResult> ExecuteAsync(ExecutePageActionCommand command, CancellationToken ct = default)
        {
            if (!command.EntityId.HasValue || command.EntityId == Guid.Empty)
                return PageActionResult.Failed("Entity ID is required to submit a workflow approval.");

            var moduleKey = command.Parameters.TryGetValue("moduleKey", out var mod) && mod != null
                ? mod.ToString()!
                : command.PageKey;

            var entityType = command.Parameters.TryGetValue("entityType", out var ent) && ent != null
                ? ent.ToString()!
                : command.PageKey;

            var comments = command.Parameters.TryGetValue("comments", out var comm) ? comm?.ToString() : null;

            await _approvalService.CreateAsync(moduleKey, entityType, command.EntityId.Value, comments, command.UserId, ct);

            return PageActionResult.Succeeded($"Request submitted for approval under module '{moduleKey}'.", nextAction: "refresh");
        }
    }

    public class StatusTransitionPageActionHandler : IPageActionHandler
    {
        private readonly ApplicationDbContext _db;

        public StatusTransitionPageActionHandler(ApplicationDbContext db)
        {
            _db = db;
        }

        public bool CanHandle(string actionType, string actionKey) =>
            string.Equals(actionType, "statusTransition", StringComparison.OrdinalIgnoreCase) ||
            actionKey.StartsWith("set_status_", StringComparison.OrdinalIgnoreCase);

        public async Task<PageActionResult> ExecuteAsync(ExecutePageActionCommand command, CancellationToken ct = default)
        {
            if (!command.EntityId.HasValue && command.SelectedIds.Count == 0)
                return PageActionResult.Failed("At least one entity ID must be targeted for status transition.");

            var targetStatus = command.Parameters.TryGetValue("targetStatus", out var ts) && ts != null
                ? ts.ToString()!
                : command.ActionKey.Replace("set_status_", "", StringComparison.OrdinalIgnoreCase);

            var pageKey = command.PageKey.ToLowerInvariant();
            var targetIds = command.EntityId.HasValue ? new List<Guid> { command.EntityId.Value } : command.SelectedIds;

            int updatedCount = 0;

            if (pageKey.Contains("purchaseorder") || pageKey.Contains("purchase_order"))
            {
                var orders = await _db.PurchaseOrders.Where(p => targetIds.Contains(p.Id)).ToListAsync(ct);
                foreach (var order in orders)
                {
                    order.Status = targetStatus;
                    updatedCount++;
                }
            }
            else if (pageKey.Contains("expense") || pageKey.Contains("expenseclaim"))
            {
                var expenses = await _db.ExpenseClaims.Where(e => targetIds.Contains(e.Id)).ToListAsync(ct);
                foreach (var exp in expenses)
                {
                    exp.Status = targetStatus;
                    updatedCount++;
                }
            }
            else if (pageKey.Contains("leave"))
            {
                var leaves = await _db.LeaveRequests.Where(l => targetIds.Contains(l.Id)).ToListAsync(ct);
                foreach (var leave in leaves)
                {
                    leave.Status = targetStatus;
                    updatedCount++;
                }
            }

            if (updatedCount > 0)
            {
                await _db.SaveChangesAsync(ct);
                return PageActionResult.Succeeded($"Updated status to '{targetStatus}' for {updatedCount} record(s).", nextAction: "refresh");
            }

            return PageActionResult.Succeeded($"Status updated to '{targetStatus}'.", nextAction: "refresh");
        }
    }

    public class CloneRecordPageActionHandler : IPageActionHandler
    {
        private readonly ApplicationDbContext _db;

        public CloneRecordPageActionHandler(ApplicationDbContext db)
        {
            _db = db;
        }

        public bool CanHandle(string actionType, string actionKey) =>
            string.Equals(actionType, "cloneRecord", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(actionKey, "clone", StringComparison.OrdinalIgnoreCase);

        public async Task<PageActionResult> ExecuteAsync(ExecutePageActionCommand command, CancellationToken ct = default)
        {
            if (!command.EntityId.HasValue)
                return PageActionResult.Failed("Entity ID is required to clone a record.");

            var pageKey = command.PageKey.ToLowerInvariant();

            if (pageKey.Contains("purchaseorder") || pageKey.Contains("purchase_order"))
            {
                var original = await _db.PurchaseOrders
                    .Include(p => p.Items)
                    .FirstOrDefaultAsync(p => p.Id == command.EntityId.Value, ct);

                if (original == null) return PageActionResult.Failed("Original record not found.");

                var clone = new Core.Entities.PurchaseOrder
                {
                    TenantId = command.TenantId,
                    CompanyId = original.CompanyId,
                    ProjectId = original.ProjectId,
                    PONumber = $"{original.PONumber}-COPY",
                    PODate = DateTime.UtcNow,
                    VendorId = original.VendorId,
                    VendorReference = original.VendorReference,
                    SubTotal = original.SubTotal,
                    TaxAmount = original.TaxAmount,
                    DiscountAmount = original.DiscountAmount,
                    ShippingCharges = original.ShippingCharges,
                    TotalAmount = original.TotalAmount,
                    Status = "Draft",
                    Notes = $"Cloned from {original.PONumber}"
                };

                foreach (var it in original.Items)
                {
                    clone.Items.Add(new Core.Entities.PurchaseOrderItem
                    {
                        TenantId = command.TenantId,
                        ItemId = it.ItemId,
                        Description = it.Description,
                        Quantity = it.Quantity,
                        UnitPrice = it.UnitPrice,
                        TaxRate = it.TaxRate,
                        TaxAmount = it.TaxAmount,
                        DiscountPercent = it.DiscountPercent,
                        DiscountAmount = it.DiscountAmount,
                        TotalAmount = it.TotalAmount
                    });
                }

                _db.PurchaseOrders.Add(clone);
                await _db.SaveChangesAsync(ct);

                return PageActionResult.Succeeded($"Purchase order cloned as '{clone.PONumber}'.", data: new { id = clone.Id, number = clone.PONumber }, nextAction: "refresh");
            }

            return PageActionResult.Failed($"Cloning is not supported for page key '{command.PageKey}'.");
        }
    }
}
