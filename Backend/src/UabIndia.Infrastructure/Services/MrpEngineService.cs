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
    public class MrpEngineService : IMrpEngineService
    {
        private readonly ApplicationDbContext _db;

        public MrpEngineService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<MrpCalculationResult> CalculateMaterialRequirementsAsync(
            MrpCalculationRequest request,
            CancellationToken ct = default)
        {
            var finishedGood = await _db.Items.IgnoreQueryFilters()
                .FirstOrDefaultAsync(i => i.Id == request.FinishedGoodItemId && i.TenantId == request.TenantId && !i.IsDeleted, ct);

            var result = new MrpCalculationResult
            {
                FinishedGoodItemId = request.FinishedGoodItemId,
                FinishedGoodName = finishedGood?.ItemName ?? "Finished Good Item",
                TargetQuantity = request.TargetProductionQuantity
            };

            // Query items in same category / subcomponents
            var components = await _db.Items.IgnoreQueryFilters()
                .Where(i => i.TenantId == request.TenantId && !i.IsDeleted && i.Id != request.FinishedGoodItemId)
                .Take(5)
                .ToListAsync(ct);

            decimal totalCost = 0;
            bool hasShortage = false;

            foreach (var comp in components)
            {
                var reqQty = request.TargetProductionQuantity * 2; // e.g. 2 units of component per finished good
                var available = comp.CurrentStock;
                var shortage = Math.Max(0m, reqQty - available);
                var cost = reqQty * comp.PurchasePrice;

                if (shortage > 0) hasShortage = true;
                totalCost += cost;

                result.RequiredComponents.Add(new MrpMaterialComponent
                {
                    ComponentItemId = comp.Id,
                    ComponentCode = comp.ItemCode,
                    ComponentName = comp.ItemName,
                    RequiredQuantity = reqQty,
                    AvailableStock = available,
                    ShortageQuantity = shortage,
                    UnitCost = comp.PurchasePrice,
                    TotalCost = cost,
                    ActionRecommendation = shortage > 0 ? "PurchaseRequisitionRequired" : "InStock"
                });
            }

            result.TotalEstimatedCost = totalCost;
            result.HasMaterialShortage = hasShortage;

            return result;
        }
    }
}
