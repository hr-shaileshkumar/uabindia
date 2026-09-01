using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class CostCenterBudgetDto
    {
        public Guid CostCenterId { get; set; }
        public string CostCenterCode { get; set; } = string.Empty;
        public string CostCenterName { get; set; } = string.Empty;
        public string CostCenterType { get; set; } = "Department";
        public int FiscalYear { get; set; }
        public decimal AllocatedBudget { get; set; }
        public decimal ActualSpent { get; set; }
        public decimal CommittedAmount { get; set; }
        public decimal AvailableBalance { get; set; }
        public double UtilizationPercentage { get; set; }
        public string Status { get; set; } = "WithinBudget"; // WithinBudget, Warning (>80%), OverBudget (>100%)
    }

    public class BudgetVarianceAnalysisDto
    {
        public int FiscalYear { get; set; }
        public decimal TotalAllocatedBudget { get; set; }
        public decimal TotalActualSpent { get; set; }
        public decimal TotalCommitted { get; set; }
        public decimal NetAvailableBalance { get; set; }
        public double OverallUtilizationPercentage { get; set; }
        public List<CostCenterBudgetDto> CostCenters { get; set; } = new();
    }

    public class SaveBudgetAllocationRequest
    {
        public Guid CostCenterId { get; set; }
        public int FiscalYear { get; set; } = 2026;
        public decimal AllocatedBudget { get; set; }
        public string? Notes { get; set; }
    }

    public interface IBudgetingService
    {
        Task<BudgetVarianceAnalysisDto> GetBudgetVarianceAnalysisAsync(
            Guid tenantId,
            int fiscalYear,
            Guid? branchId = null,
            CancellationToken ct = default);

        Task<CostCenterBudgetDto> SaveBudgetAllocationAsync(
            Guid tenantId,
            SaveBudgetAllocationRequest req,
            CancellationToken ct = default);
    }
}
