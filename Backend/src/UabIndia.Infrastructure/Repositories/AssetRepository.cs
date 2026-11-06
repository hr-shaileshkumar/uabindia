using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation for Asset Management operations.
    /// </summary>
    public class AssetRepository : IAssetRepository
    {
        private readonly ApplicationDbContext _context;

        public AssetRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        #region Fixed Asset Operations

        public async Task<FixedAsset?> GetAssetByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.FixedAssets
                .AsNoTracking()
                .Where(a => a.Id == id && a.TenantId == tenantId && !a.IsDeleted)
                .Include(a => a.Allocations)
                .Include(a => a.DepreciationRecords)
                .Include(a => a.MaintenanceRecords)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<FixedAsset>> GetAllAssetsAsync(Guid tenantId, int skip = 0, int take = 20)
        {
            return await _context.FixedAssets
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && !a.IsDeleted)
                .OrderByDescending(a => a.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<IEnumerable<FixedAsset>> GetAssetsByCategoryAsync(Guid tenantId, string category, int skip = 0, int take = 20)
        {
            return await _context.FixedAssets
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && 
                           !a.IsDeleted && 
                           a.Category.ToString() == category)
                .OrderByDescending(a => a.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<IEnumerable<FixedAsset>> GetAssetsByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20)
        {
            return await _context.FixedAssets
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && 
                           !a.IsDeleted && 
                           a.Status.ToString() == status)
                .OrderByDescending(a => a.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<IEnumerable<FixedAsset>> GetAllocatedAssetsAsync(Guid tenantId, int skip = 0, int take = 20)
        {
            return await _context.FixedAssets
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && 
                           !a.IsDeleted && 
                           a.AllocatedToEmployeeId.HasValue)
                .OrderByDescending(a => a.AllocationDate)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<IEnumerable<FixedAsset>> GetAssetsRequiringMaintenanceAsync(Guid tenantId)
        {
            var now = DateTime.UtcNow;
            return await _context.FixedAssets
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && 
                           !a.IsDeleted &&
                           (a.Status == AssetStatus.InUse || a.Status == AssetStatus.Idle) &&
                           a.MaintenanceRecords.Any(m => m.NextMaintenanceDate <= now && !m.IsDeleted))
                .ToListAsync();
        }

        public async Task<FixedAsset?> GetAssetByCodeAsync(string assetCode, Guid tenantId)
        {
            return await _context.FixedAssets
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AssetCode == assetCode && 
                                         a.TenantId == tenantId && 
                                         !a.IsDeleted);
        }

        public async Task<FixedAsset?> GetAssetBySerialAsync(string serialNumber, Guid tenantId)
        {
            return await _context.FixedAssets
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.SerialNumber == serialNumber && 
                                         a.TenantId == tenantId && 
                                         !a.IsDeleted);
        }

        public async Task<FixedAsset> CreateAssetAsync(FixedAsset asset)
        {
            asset.AssetCode = await GenerateAssetCodeAsync(asset.TenantId);
            asset.Status = AssetStatus.New;
            asset.CurrentValue = asset.PurchaseValue;
            
            _context.FixedAssets.Add(asset);
            await _context.SaveChangesAsync();
            return asset;
        }

        public async Task UpdateAssetAsync(FixedAsset asset)
        {
            _context.FixedAssets.Update(asset);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAssetAsync(Guid id, Guid tenantId)
        {
            var asset = await _context.FixedAssets
                .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId);
            
            if (asset != null)
            {
                asset.IsDeleted = true;

                _context.FixedAssets.Update(asset);
                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region Asset Allocation Operations

        public async Task<AssetAllocation?> GetAllocationByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.AssetAllocations
                .AsNoTracking()
                .Where(a => a.Id == id && a.TenantId == tenantId && !a.IsDeleted)
                .Include(a => a.Asset)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<AssetAllocation>> GetAllocationsByAssetAsync(Guid assetId, Guid tenantId)
        {
            return await _context.AssetAllocations
                .AsNoTracking()
                .Where(a => a.AssetId == assetId && 
                           a.TenantId == tenantId && 
                           !a.IsDeleted)
                .OrderByDescending(a => a.AllocationDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<AssetAllocation>> GetAllocationsByEmployeeAsync(Guid employeeId, Guid tenantId)
        {
            return await _context.AssetAllocations
                .AsNoTracking()
                .Where(a => a.EmployeeId == employeeId && 
                           a.TenantId == tenantId && 
                           !a.IsDeleted)
                .Include(a => a.Asset)
                .OrderByDescending(a => a.AllocationDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<AssetAllocation>> GetActiveAllocationsAsync(Guid tenantId, int skip = 0, int take = 50)
        {
            return await _context.AssetAllocations
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && 
                           !a.IsDeleted && 
                           a.DeallocationDate == null &&
                           a.Status == "Active")
                .Include(a => a.Asset)
                .OrderByDescending(a => a.AllocationDate)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<AssetAllocation?> GetCurrentAllocationAsync(Guid assetId, Guid tenantId)
        {
            return await _context.AssetAllocations
                .AsNoTracking()
                .Where(a => a.AssetId == assetId && 
                           a.TenantId == tenantId && 
                           !a.IsDeleted && 
                           a.DeallocationDate == null)
                .OrderByDescending(a => a.AllocationDate)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<AssetAllocation>> GetAllocationsByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20)
        {
            return await _context.AssetAllocations
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && 
                           !a.IsDeleted && 
                           a.Status == status)
                .Include(a => a.Asset)
                .OrderByDescending(a => a.AllocationDate)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<AssetAllocation> CreateAllocationAsync(AssetAllocation allocation)
        {
            allocation.Status = "Active";
            
            // Update asset allocation info
            var asset = await _context.FixedAssets.FindAsync(allocation.AssetId);
            if (asset != null)
            {
                asset.AllocatedToEmployeeId = allocation.EmployeeId;
                asset.AllocationDate = allocation.AllocationDate;
                asset.Status = AssetStatus.InUse;
                _context.FixedAssets.Update(asset);
            }

            _context.AssetAllocations.Add(allocation);
            await _context.SaveChangesAsync();
            return allocation;
        }

        public async Task UpdateAllocationAsync(AssetAllocation allocation)
        {
            _context.AssetAllocations.Update(allocation);
            
            // If deallocating, update asset
            if (allocation.DeallocationDate.HasValue && allocation.Status != "Active")
            {
                var asset = await _context.FixedAssets.FindAsync(allocation.AssetId);
                if (asset != null)
                {
                    asset.AllocatedToEmployeeId = null;
                    asset.DeallocationDate = allocation.DeallocationDate;
                    asset.Status = AssetStatus.Idle;
                    _context.FixedAssets.Update(asset);
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task DeleteAllocationAsync(Guid id, Guid tenantId)
        {
            var allocation = await _context.AssetAllocations
                .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId);
            
            if (allocation != null)
            {
                allocation.IsDeleted = true;

                _context.AssetAllocations.Update(allocation);
                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region Asset Depreciation Operations

        public async Task<AssetDepreciation?> GetDepreciationByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.AssetDepreciations
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId && !d.IsDeleted);
        }

        public async Task<IEnumerable<AssetDepreciation>> GetDepreciationsByAssetAsync(Guid assetId, Guid tenantId)
        {
            return await _context.AssetDepreciations
                .AsNoTracking()
                .Where(d => d.AssetId == assetId && 
                           d.TenantId == tenantId && 
                           !d.IsDeleted)
                .OrderBy(d => d.DepreciationPeriodStart)
                .ToListAsync();
        }

        public async Task<IEnumerable<AssetDepreciation>> GetUnpostedDepreciationsAsync(Guid tenantId)
        {
            return await _context.AssetDepreciations
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && 
                           !d.IsDeleted && 
                           !d.IsPosted)
                .OrderBy(d => d.DepreciationPeriodStart)
                .ToListAsync();
        }

        public async Task<IEnumerable<AssetDepreciation>> GetDepreciationsByPeriodAsync(Guid tenantId, DateTime startDate, DateTime endDate)
        {
            return await _context.AssetDepreciations
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && 
                           !d.IsDeleted && 
                           d.DepreciationPeriodStart >= startDate && 
                           d.DepreciationPeriodEnd <= endDate)
                .OrderBy(d => d.DepreciationPeriodStart)
                .ToListAsync();
        }

        public async Task<decimal> GetAccumulatedDepreciationAsync(Guid assetId, Guid tenantId)
        {
            return await _context.AssetDepreciations
                .Where(d => d.AssetId == assetId && 
                           d.TenantId == tenantId && 
                           !d.IsDeleted)
                .SumAsync(d => d.DepreciationAmount);
        }

        public async Task<AssetDepreciation> CreateDepreciationAsync(AssetDepreciation depreciation)
        {
            depreciation.ClosingValue = depreciation.OpeningValue - depreciation.DepreciationAmount;
            if (depreciation.OpeningValue > 0)
            {
                depreciation.DepreciationPercent = (depreciation.DepreciationAmount / depreciation.OpeningValue) * 100;
            }

            _context.AssetDepreciations.Add(depreciation);
            await _context.SaveChangesAsync();
            return depreciation;
        }

        public async Task UpdateDepreciationAsync(AssetDepreciation depreciation)
        {
            _context.AssetDepreciations.Update(depreciation);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<AssetDepreciation>> GetDepreciationForPostingAsync(Guid tenantId)
        {
            return await _context.AssetDepreciations
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && 
                           !d.IsDeleted && 
                           !d.IsPosted)
                .OrderBy(d => d.DepreciationPeriodStart)
                .ToListAsync();
        }

        #endregion

        #region Asset Maintenance Operations

        public async Task<AssetMaintenance?> GetMaintenanceByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.AssetMaintenances
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId && !m.IsDeleted);
        }

        public async Task<IEnumerable<AssetMaintenance>> GetMaintenanceByAssetAsync(Guid assetId, Guid tenantId)
        {
            return await _context.AssetMaintenances
                .AsNoTracking()
                .Where(m => m.AssetId == assetId && 
                           m.TenantId == tenantId && 
                           !m.IsDeleted)
                .OrderByDescending(m => m.MaintenanceDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<AssetMaintenance>> GetMaintenanceByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20)
        {
            return await _context.AssetMaintenances
                .AsNoTracking()
                .Where(m => m.TenantId == tenantId && 
                           !m.IsDeleted && 
                           m.Status.ToString() == status)
                .OrderByDescending(m => m.MaintenanceDate)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<IEnumerable<AssetMaintenance>> GetPendingMaintenanceAsync(Guid tenantId)
        {
            return await _context.AssetMaintenances
                .AsNoTracking()
                .Where(m => m.TenantId == tenantId && 
                           !m.IsDeleted && 
                           (m.Status == MaintenanceStatus.Pending || 
                            m.Status == MaintenanceStatus.InProgress))
                .OrderBy(m => m.ScheduledDate ?? m.MaintenanceDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<AssetMaintenance>> GetMaintenanceHistoryAsync(Guid assetId, Guid tenantId, int take = 10)
        {
            return await _context.AssetMaintenances
                .AsNoTracking()
                .Where(m => m.AssetId == assetId && 
                           m.TenantId == tenantId && 
                           !m.IsDeleted)
                .OrderByDescending(m => m.MaintenanceDate)
                .Take(take)
                .ToListAsync();
        }

        public async Task<IEnumerable<AssetMaintenance>> GetMaintenanceByPeriodAsync(Guid tenantId, DateTime startDate, DateTime endDate)
        {
            return await _context.AssetMaintenances
                .AsNoTracking()
                .Where(m => m.TenantId == tenantId && 
                           !m.IsDeleted && 
                           m.MaintenanceDate >= startDate && 
                           m.MaintenanceDate <= endDate)
                .OrderByDescending(m => m.MaintenanceDate)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalMaintenanceCostAsync(Guid assetId, Guid tenantId)
        {
            return await _context.AssetMaintenances
                .Where(m => m.AssetId == assetId && 
                           m.TenantId == tenantId && 
                           !m.IsDeleted)
                .SumAsync(m => m.MaintenanceCost);
        }

        public async Task<AssetMaintenance> CreateMaintenanceAsync(AssetMaintenance maintenance)
        {
            maintenance.Status = MaintenanceStatus.Pending;
            maintenance.DurationHours = (decimal)(maintenance.EndDateTime - maintenance.StartDateTime).TotalHours;
            
            _context.AssetMaintenances.Add(maintenance);
            await _context.SaveChangesAsync();
            return maintenance;
        }

        public async Task UpdateMaintenanceAsync(AssetMaintenance maintenance)
        {
            if (maintenance.EndDateTime > maintenance.StartDateTime)
            {
                maintenance.DurationHours = (decimal)(maintenance.EndDateTime - maintenance.StartDateTime).TotalHours;
            }

            _context.AssetMaintenances.Update(maintenance);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteMaintenanceAsync(Guid id, Guid tenantId)
        {
            var maintenance = await _context.AssetMaintenances
                .FirstOrDefaultAsync(m => m.Id == id && m.TenantId == tenantId);
            
            if (maintenance != null)
            {
                maintenance.IsDeleted = true;

                _context.AssetMaintenances.Update(maintenance);
                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region Statistics & Reports

        public async Task<int> GetTotalAssetsAsync(Guid tenantId)
        {
            return await _context.FixedAssets
                .CountAsync(a => a.TenantId == tenantId && !a.IsDeleted);
        }

        public async Task<int> GetAssetsCountByStatusAsync(Guid tenantId, string status)
        {
            return await _context.FixedAssets
                .CountAsync(a => a.TenantId == tenantId && 
                                !a.IsDeleted && 
                                a.Status.ToString() == status);
        }

        public async Task<decimal> GetTotalAssetValueAsync(Guid tenantId)
        {
            return await _context.FixedAssets
                .Where(a => a.TenantId == tenantId && !a.IsDeleted)
                .SumAsync(a => a.CurrentValue);
        }

        public async Task<decimal> GetDepreciationExpenseAsync(Guid tenantId, DateTime month)
        {
            var startDate = new DateTime(month.Year, month.Month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            return await _context.AssetDepreciations
                .Where(d => d.TenantId == tenantId && 
                           !d.IsDeleted && 
                           d.DepreciationPeriodStart.Month == month.Month && 
                           d.DepreciationPeriodStart.Year == month.Year)
                .SumAsync(d => d.DepreciationAmount);
        }

        public async Task<Dictionary<string, int>> GetAssetsCountByCategoryAsync(Guid tenantId)
        {
            var result = await _context.FixedAssets
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && !a.IsDeleted)
                .GroupBy(a => a.Category.ToString())
                .Select(g => new { Category = g.Key, Count = g.Count() })
                .ToListAsync();

            return result.ToDictionary(x => x.Category, x => x.Count);
        }

        public async Task<Dictionary<string, decimal>> GetAssetValueByCategoryAsync(Guid tenantId)
        {
            var result = await _context.FixedAssets
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && !a.IsDeleted)
                .GroupBy(a => a.Category.ToString())
                .Select(g => new { Category = g.Key, Value = g.Sum(a => a.CurrentValue) })
                .ToListAsync();

            return result.ToDictionary(x => x.Category, x => x.Value);
        }

        public async Task<int> GetEmployeeAssignedAssetsCountAsync(Guid employeeId, Guid tenantId)
        {
            return await _context.AssetAllocations
                .CountAsync(a => a.EmployeeId == employeeId && 
                                a.TenantId == tenantId && 
                                !a.IsDeleted && 
                                a.DeallocationDate == null);
        }

        public async Task<decimal> GetMaintenanceCostAsync(Guid assetId, Guid tenantId, DateTime? fromDate = null, DateTime? toDate = null)
        {
            var query = _context.AssetMaintenances
                .Where(m => m.AssetId == assetId && 
                           m.TenantId == tenantId && 
                           !m.IsDeleted);

            if (fromDate.HasValue)
                query = query.Where(m => m.MaintenanceDate >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(m => m.MaintenanceDate <= toDate.Value);

            return await query.SumAsync(m => m.MaintenanceCost);
        }

        #endregion

        #region Helper Methods

        private async Task<string> GenerateAssetCodeAsync(Guid tenantId)
        {
            var count = await _context.FixedAssets
                .CountAsync(a => a.TenantId == tenantId && !a.IsDeleted);

            return $"AST-{DateTime.UtcNow:yyyyMM}-{(count + 1):D4}";
        }

        #endregion
    }
}
