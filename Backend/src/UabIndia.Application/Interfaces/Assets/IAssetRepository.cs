using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    /// <summary>
    /// Repository interface for Asset Management operations.
    /// </summary>
    public interface IAssetRepository
    {
        #region Fixed Asset Operations

        Task<FixedAsset?> GetAssetByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<FixedAsset>> GetAllAssetsAsync(Guid tenantId, int skip = 0, int take = 20);
        Task<IEnumerable<FixedAsset>> GetAssetsByCategoryAsync(Guid tenantId, string category, int skip = 0, int take = 20);
        Task<IEnumerable<FixedAsset>> GetAssetsByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20);
        Task<IEnumerable<FixedAsset>> GetAllocatedAssetsAsync(Guid tenantId, int skip = 0, int take = 20);
        Task<IEnumerable<FixedAsset>> GetAssetsRequiringMaintenanceAsync(Guid tenantId);
        Task<FixedAsset?> GetAssetByCodeAsync(string assetCode, Guid tenantId);
        Task<FixedAsset?> GetAssetBySerialAsync(string serialNumber, Guid tenantId);
        Task<FixedAsset> CreateAssetAsync(FixedAsset asset);
        Task UpdateAssetAsync(FixedAsset asset);
        Task DeleteAssetAsync(Guid id, Guid tenantId);

        #endregion

        #region Asset Allocation Operations

        Task<AssetAllocation?> GetAllocationByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<AssetAllocation>> GetAllocationsByAssetAsync(Guid assetId, Guid tenantId);
        Task<IEnumerable<AssetAllocation>> GetAllocationsByEmployeeAsync(Guid employeeId, Guid tenantId);
        Task<IEnumerable<AssetAllocation>> GetActiveAllocationsAsync(Guid tenantId, int skip = 0, int take = 50);
        Task<AssetAllocation?> GetCurrentAllocationAsync(Guid assetId, Guid tenantId);
        Task<IEnumerable<AssetAllocation>> GetAllocationsByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20);
        Task<AssetAllocation> CreateAllocationAsync(AssetAllocation allocation);
        Task UpdateAllocationAsync(AssetAllocation allocation);
        Task DeleteAllocationAsync(Guid id, Guid tenantId);

        #endregion

        #region Asset Depreciation Operations

        Task<AssetDepreciation?> GetDepreciationByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<AssetDepreciation>> GetDepreciationsByAssetAsync(Guid assetId, Guid tenantId);
        Task<IEnumerable<AssetDepreciation>> GetUnpostedDepreciationsAsync(Guid tenantId);
        Task<IEnumerable<AssetDepreciation>> GetDepreciationsByPeriodAsync(Guid tenantId, DateTime startDate, DateTime endDate);
        Task<decimal> GetAccumulatedDepreciationAsync(Guid assetId, Guid tenantId);
        Task<AssetDepreciation> CreateDepreciationAsync(AssetDepreciation depreciation);
        Task UpdateDepreciationAsync(AssetDepreciation depreciation);
        Task<IEnumerable<AssetDepreciation>> GetDepreciationForPostingAsync(Guid tenantId);

        #endregion

        #region Asset Maintenance Operations

        Task<AssetMaintenance?> GetMaintenanceByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<AssetMaintenance>> GetMaintenanceByAssetAsync(Guid assetId, Guid tenantId);
        Task<IEnumerable<AssetMaintenance>> GetMaintenanceByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20);
        Task<IEnumerable<AssetMaintenance>> GetPendingMaintenanceAsync(Guid tenantId);
        Task<IEnumerable<AssetMaintenance>> GetMaintenanceHistoryAsync(Guid assetId, Guid tenantId, int take = 10);
        Task<IEnumerable<AssetMaintenance>> GetMaintenanceByPeriodAsync(Guid tenantId, DateTime startDate, DateTime endDate);
        Task<decimal> GetTotalMaintenanceCostAsync(Guid assetId, Guid tenantId);
        Task<AssetMaintenance> CreateMaintenanceAsync(AssetMaintenance maintenance);
        Task UpdateMaintenanceAsync(AssetMaintenance maintenance);
        Task DeleteMaintenanceAsync(Guid id, Guid tenantId);

        #endregion

        #region Statistics & Reports

        Task<int> GetTotalAssetsAsync(Guid tenantId);
        Task<int> GetAssetsCountByStatusAsync(Guid tenantId, string status);
        Task<decimal> GetTotalAssetValueAsync(Guid tenantId);
        Task<decimal> GetDepreciationExpenseAsync(Guid tenantId, DateTime month);
        Task<Dictionary<string, int>> GetAssetsCountByCategoryAsync(Guid tenantId);
        Task<Dictionary<string, decimal>> GetAssetValueByCategoryAsync(Guid tenantId);
        Task<int> GetEmployeeAssignedAssetsCountAsync(Guid employeeId, Guid tenantId);
        Task<decimal> GetMaintenanceCostAsync(Guid assetId, Guid tenantId, DateTime? fromDate = null, DateTime? toDate = null);

        #endregion
    }
}
