using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class MrpCalculationRequest
    {
        public Guid TenantId { get; set; }
        public Guid FinishedGoodItemId { get; set; }
        public decimal TargetProductionQuantity { get; set; }
        public DateTime RequiredByDate { get; set; }
    }

    public class MrpCalculationResult
    {
        public Guid FinishedGoodItemId { get; set; }
        public string FinishedGoodName { get; set; } = string.Empty;
        public decimal TargetQuantity { get; set; }
        public decimal TotalEstimatedCost { get; set; }
        public bool HasMaterialShortage { get; set; }
        public List<MrpMaterialComponent> RequiredComponents { get; set; } = new();
    }

    public class MrpMaterialComponent
    {
        public Guid ComponentItemId { get; set; }
        public string ComponentCode { get; set; } = string.Empty;
        public string ComponentName { get; set; } = string.Empty;
        public decimal RequiredQuantity { get; set; }
        public decimal AvailableStock { get; set; }
        public decimal ShortageQuantity { get; set; }
        public decimal UnitCost { get; set; }
        public decimal TotalCost { get; set; }
        public string ActionRecommendation { get; set; } = "InStock"; // InStock, PurchaseRequisitionRequired
    }

    public interface IMrpEngineService
    {
        Task<MrpCalculationResult> CalculateMaterialRequirementsAsync(
            MrpCalculationRequest request,
            CancellationToken ct = default);
    }
}
