using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Api.Models;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;

namespace UabIndia.Api.Modules.Assets.Controllers
{
    /// <summary>
    /// API controller for Asset Management operations.
    /// Handles fixed assets, allocations, depreciation, and maintenance tracking.
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    [Route("api/[controller]")]
    [Route("api/v1/hrms/assets")]
    [Authorize(Policy = "Module:hrms")]
    public class AssetsController : ControllerBase
    {
        private readonly IAssetRepository _repository;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ILogger<AssetsController> _logger;
        private readonly ICacheService _cacheService;

        public AssetsController(
            IAssetRepository repository,
            ITenantAccessor tenantAccessor,
            ILogger<AssetsController> logger,
            ICacheService cacheService)
        {
            _repository = repository;
            _tenantAccessor = tenantAccessor;
            _logger = logger;
            _cacheService = cacheService;
        }

        #region Fixed Asset Endpoints

        /// <summary>
        /// Get all fixed assets for the tenant.
        /// </summary>
        [HttpGet("assets")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> GetAssets([FromQuery] int skip = 0, [FromQuery] int take = 20)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var cacheKey = $"assets:all:{tenantId}:{skip}:{take}";

                var assets = await _cacheService.GetAsync<IEnumerable<FixedAssetDto>>(cacheKey);
                if (assets == null)
                {
                    var assetEntities = await _repository.GetAllAssetsAsync(tenantId, skip, take);
                    assets = assetEntities.Select(a => MapAssetToDto(a)).ToList();
                    await _cacheService.SetAsync(cacheKey, assets, TimeSpan.FromMinutes(30));
                }

                return Ok(assets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving assets");
                return StatusCode(500, new { message = "Error retrieving assets" });
            }
        }

        /// <summary>
        /// Get a specific fixed asset by ID.
        /// </summary>
        [HttpGet("assets/{id:guid}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> GetAssetById(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var cacheKey = $"asset:{id}:{tenantId}";

                var assetDto = await _cacheService.GetAsync<FixedAssetDto>(cacheKey);
                if (assetDto == null)
                {
                    var asset = await _repository.GetAssetByIdAsync(id, tenantId);
                    if (asset == null)
                        return NotFound();

                    assetDto = MapAssetToDto(asset);
                    await _cacheService.SetAsync(cacheKey, assetDto, TimeSpan.FromMinutes(60));
                }

                return Ok(assetDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving asset");
                return StatusCode(500, new { message = "Error retrieving asset" });
            }
        }

        /// <summary>
        /// Get assets by category.
        /// </summary>
        [HttpGet("assets/category/{category}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> GetAssetsByCategory(string category, [FromQuery] int skip = 0, [FromQuery] int take = 20)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var assets = await _repository.GetAssetsByCategoryAsync(tenantId, category, skip, take);

                var dtos = assets.Select(a => MapAssetToDto(a)).ToList();
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving assets by category");
                return StatusCode(500, new { message = "Error retrieving assets by category" });
            }
        }

        /// <summary>
        /// Create a new fixed asset.
        /// </summary>
        [HttpPost("assets")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> CreateAsset([FromBody] CreateFixedAssetDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var asset = new FixedAsset
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    Name = dto.Name,
                    Description = dto.Description,
                    Category = Enum.Parse<AssetCategory>(dto.Category),
                    SerialNumber = dto.SerialNumber,
                    Location = dto.Location,
                    PurchaseValue = dto.PurchaseValue,
                    SalvageValue = dto.SalvageValue,
                    PurchaseDate = dto.PurchaseDate,
                    DepreciationStartDate = dto.DepreciationStartDate,
                    UsefulLifeYears = dto.UsefulLifeYears,
                    DepreciationMethod = Enum.Parse<DepreciationMethod>(dto.DepreciationMethod),
                    DepreciationRate = dto.DepreciationRate,
                    Supplier = dto.Supplier,
                    WarrantyInfo = dto.WarrantyInfo,
                    WarrantyExpiryDate = dto.WarrantyExpiryDate,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _repository.CreateAssetAsync(asset);
                await _cacheService.RemoveByPrefixAsync($"assets:all:{tenantId}:");

                return CreatedAtAction(nameof(GetAssetById), new { id = created.Id }, MapAssetToDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating asset");
                return StatusCode(500, new { message = "Error creating asset" });
            }
        }

        /// <summary>
        /// Update a fixed asset.
        /// </summary>
        [HttpPut("assets/{id:guid}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> UpdateAsset(Guid id, [FromBody] UpdateFixedAssetDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var asset = await _repository.GetAssetByIdAsync(id, tenantId);
                if (asset == null)
                    return NotFound();

                asset.Name = dto.Name ?? asset.Name;
                asset.Description = dto.Description ?? asset.Description;
                asset.Location = dto.Location ?? asset.Location;
                if (dto.Status != null)
                    asset.Status = Enum.Parse<AssetStatus>(dto.Status);
                if (dto.CurrentValue.HasValue)
                    asset.CurrentValue = dto.CurrentValue.Value;
                asset.WarrantyInfo = dto.WarrantyInfo ?? asset.WarrantyInfo;
                asset.WarrantyExpiryDate = dto.WarrantyExpiryDate ?? asset.WarrantyExpiryDate;
                if (dto.DisposalDate.HasValue)
                    asset.DisposalDate = dto.DisposalDate;
                asset.UpdatedAt = DateTime.UtcNow;

                await _repository.UpdateAssetAsync(asset);
                await _cacheService.RemoveAsync($"asset:{id}:{tenantId}");
                await _cacheService.RemoveByPrefixAsync($"assets:all:{tenantId}:");

                return Ok(new { message = "Asset updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating asset");
                return StatusCode(500, new { message = "Error updating asset" });
            }
        }

        /// <summary>
        /// Delete a fixed asset.
        /// </summary>
        [HttpDelete("assets/{id:guid}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> DeleteAsset(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                await _repository.DeleteAssetAsync(id, tenantId);

                await _cacheService.RemoveAsync($"asset:{id}:{tenantId}");
                await _cacheService.RemoveByPrefixAsync($"assets:all:{tenantId}:");

                return Ok(new { message = "Asset deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting asset");
                return StatusCode(500, new { message = "Error deleting asset" });
            }
        }

        #endregion

        #region Asset Allocation Endpoints

        /// <summary>
        /// Get allocations for an asset.
        /// </summary>
        [HttpGet("allocations/asset/{assetId:guid}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> GetAllocationsByAsset(Guid assetId)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var allocations = await _repository.GetAllocationsByAssetAsync(assetId, tenantId);

                var dtos = allocations.Select(a => MapAllocationToDto(a)).ToList();
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving allocations");
                return StatusCode(500, new { message = "Error retrieving allocations" });
            }
        }

        /// <summary>
        /// Get allocations for an employee.
        /// </summary>
        [HttpGet("allocations/employee/{employeeId:guid}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<IActionResult> GetAllocationsByEmployee(Guid employeeId)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var allocations = await _repository.GetAllocationsByEmployeeAsync(employeeId, tenantId);

                var dtos = allocations.Select(a => MapAllocationToDto(a)).ToList();
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving employee allocations");
                return StatusCode(500, new { message = "Error retrieving employee allocations" });
            }
        }

        /// <summary>
        /// Allocate an asset to an employee.
        /// </summary>
        [HttpPost("allocations")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> AllocateAsset([FromBody] CreateAssetAllocationDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var allocation = new AssetAllocation
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    AssetId = dto.AssetId,
                    EmployeeId = dto.EmployeeId,
                    AllocationDate = dto.AllocationDate,
                    Purpose = dto.Purpose,
                    AllocationNotes = dto.AllocationNotes,
                    ConditionOnAllocation = dto.ConditionOnAllocation,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _repository.CreateAllocationAsync(allocation);
                return CreatedAtAction(nameof(GetAllocationById), new { id = created.Id }, MapAllocationToDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error allocating asset");
                return StatusCode(500, new { message = "Error allocating asset" });
            }
        }

        /// <summary>
        /// Get allocation by ID.
        /// </summary>
        [HttpGet("allocations/{id:guid}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<IActionResult> GetAllocationById(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var allocation = await _repository.GetAllocationByIdAsync(id, tenantId);
                if (allocation == null)
                    return NotFound();

                return Ok(MapAllocationToDto(allocation));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving allocation");
                return StatusCode(500, new { message = "Error retrieving allocation" });
            }
        }

        /// <summary>
        /// Update allocation (e.g., deallocate or update condition).
        /// </summary>
        [HttpPut("allocations/{id:guid}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> UpdateAllocation(Guid id, [FromBody] UpdateAssetAllocationDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var allocation = await _repository.GetAllocationByIdAsync(id, tenantId);
                if (allocation == null)
                    return NotFound();

                if (dto.DeallocationDate.HasValue)
                    allocation.DeallocationDate = dto.DeallocationDate;
                allocation.DeallocationReason = dto.DeallocationReason ?? allocation.DeallocationReason;
                allocation.Status = dto.Status ?? allocation.Status;
                allocation.ConditionOnDeallocation = dto.ConditionOnDeallocation ?? allocation.ConditionOnDeallocation;
                if (dto.ConditionAssessmentValue.HasValue)
                    allocation.ConditionAssessmentValue = dto.ConditionAssessmentValue;
                allocation.UpdatedAt = DateTime.UtcNow;

                await _repository.UpdateAllocationAsync(allocation);
                return Ok(new { message = "Allocation updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating allocation");
                return StatusCode(500, new { message = "Error updating allocation" });
            }
        }

        #endregion

        #region Asset Maintenance Endpoints

        /// <summary>
        /// Get maintenance records for an asset.
        /// </summary>
        [HttpGet("maintenance/asset/{assetId:guid}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> GetMaintenanceByAsset(Guid assetId)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var records = await _repository.GetMaintenanceByAssetAsync(assetId, tenantId);

                var dtos = records.Select(m => MapMaintenanceToDto(m)).ToList();
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving maintenance records");
                return StatusCode(500, new { message = "Error retrieving maintenance records" });
            }
        }

        /// <summary>
        /// Get pending maintenance records.
        /// </summary>
        [HttpGet("maintenance/pending")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> GetPendingMaintenance()
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var records = await _repository.GetPendingMaintenanceAsync(tenantId);

                var dtos = records.Select(m => MapMaintenanceToDto(m)).ToList();
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending maintenance");
                return StatusCode(500, new { message = "Error retrieving pending maintenance" });
            }
        }

        /// <summary>
        /// Create a maintenance record.
        /// </summary>
        [HttpPost("maintenance")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> CreateMaintenance([FromBody] CreateAssetMaintenanceDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var maintenance = new AssetMaintenance
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    AssetId = dto.AssetId,
                    MaintenanceDate = dto.MaintenanceDate,
                    ScheduledDate = dto.MaintenanceDate,
                    MaintenanceType = dto.MaintenanceType,
                    Description = dto.Description,
                    MaintenanceCost = dto.MaintenanceCost,
                    VendorName = dto.VendorName,
                    TechnicianName = dto.TechnicianName,
                    StartDateTime = dto.StartDateTime,
                    EndDateTime = dto.EndDateTime,
                    MaintenanceFrequency = dto.MaintenanceFrequency,
                    NextMaintenanceDate = dto.NextMaintenanceDate,
                    TechnicianNotes = dto.TechnicianNotes,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _repository.CreateMaintenanceAsync(maintenance);
                return CreatedAtAction(nameof(GetMaintenanceById), new { id = created.Id }, MapMaintenanceToDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating maintenance record");
                return StatusCode(500, new { message = "Error creating maintenance record" });
            }
        }

        /// <summary>
        /// Get maintenance record by ID.
        /// </summary>
        [HttpGet("maintenance/{id:guid}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> GetMaintenanceById(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var maintenance = await _repository.GetMaintenanceByIdAsync(id, tenantId);
                if (maintenance == null)
                    return NotFound();

                return Ok(MapMaintenanceToDto(maintenance));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving maintenance record");
                return StatusCode(500, new { message = "Error retrieving maintenance record" });
            }
        }

        /// <summary>
        /// Update a maintenance record.
        /// </summary>
        [HttpPut("maintenance/{id:guid}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> UpdateMaintenance(Guid id, [FromBody] UpdateAssetMaintenanceDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var maintenance = await _repository.GetMaintenanceByIdAsync(id, tenantId);
                if (maintenance == null)
                    return NotFound();

                if (dto.Status != null)
                    maintenance.Status = Enum.Parse<MaintenanceStatus>(dto.Status);
                if (dto.MaintenanceCost.HasValue)
                    maintenance.MaintenanceCost = dto.MaintenanceCost.Value;
                maintenance.TechnicianNotes = dto.TechnicianNotes ?? maintenance.TechnicianNotes;
                maintenance.NextMaintenanceDate = dto.NextMaintenanceDate ?? maintenance.NextMaintenanceDate;
                if (dto.EndDateTime.HasValue)
                    maintenance.EndDateTime = dto.EndDateTime.Value;
                maintenance.UpdatedAt = DateTime.UtcNow;

                await _repository.UpdateMaintenanceAsync(maintenance);
                return Ok(new { message = "Maintenance record updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating maintenance record");
                return StatusCode(500, new { message = "Error updating maintenance record" });
            }
        }

        #endregion

        #region Helper Methods

        private FixedAssetDto MapAssetToDto(FixedAsset asset)
        {
            return new FixedAssetDto
            {
                Id = asset.Id,
                AssetCode = asset.AssetCode,
                Name = asset.Name,
                Description = asset.Description,
                Category = asset.Category.ToString(),
                Status = asset.Status.ToString(),
                SerialNumber = asset.SerialNumber,
                Location = asset.Location,
                PurchaseValue = asset.PurchaseValue,
                CurrentValue = asset.CurrentValue,
                SalvageValue = asset.SalvageValue,
                AccumulatedDepreciation = asset.AccumulatedDepreciation,
                PurchaseDate = asset.PurchaseDate,
                DepreciationStartDate = asset.DepreciationStartDate,
                UsefulLifeYears = asset.UsefulLifeYears,
                DisposalDate = asset.DisposalDate,
                DepreciationMethod = asset.DepreciationMethod.ToString(),
                DepreciationRate = asset.DepreciationRate,
                AllocatedToEmployeeId = asset.AllocatedToEmployeeId,
                AllocationDate = asset.AllocationDate,
                Supplier = asset.Supplier,
                WarrantyInfo = asset.WarrantyInfo,
                WarrantyExpiryDate = asset.WarrantyExpiryDate,
                IsUnderWarranty = asset.IsUnderWarranty,
                CreatedAt = asset.CreatedAt
            };
        }

        private AssetAllocationDto MapAllocationToDto(AssetAllocation allocation)
        {
            return new AssetAllocationDto
            {
                Id = allocation.Id,
                AssetId = allocation.AssetId,
                EmployeeId = allocation.EmployeeId,
                AllocationDate = allocation.AllocationDate,
                DeallocationDate = allocation.DeallocationDate,
                Purpose = allocation.Purpose,
                AllocationNotes = allocation.AllocationNotes,
                DeallocationReason = allocation.DeallocationReason,
                Status = allocation.Status,
                ConditionOnAllocation = allocation.ConditionOnAllocation,
                ConditionOnDeallocation = allocation.ConditionOnDeallocation,
                ConditionAssessmentValue = allocation.ConditionAssessmentValue,
                CreatedAt = allocation.CreatedAt
            };
        }

        private AssetMaintenanceDto MapMaintenanceToDto(AssetMaintenance maintenance)
        {
            return new AssetMaintenanceDto
            {
                Id = maintenance.Id,
                AssetId = maintenance.AssetId,
                MaintenanceDate = maintenance.MaintenanceDate,
                ScheduledDate = maintenance.ScheduledDate,
                MaintenanceType = maintenance.MaintenanceType,
                Description = maintenance.Description,
                Status = maintenance.Status.ToString(),
                MaintenanceCost = maintenance.MaintenanceCost,
                VendorName = maintenance.VendorName,
                TechnicianName = maintenance.TechnicianName,
                StartDateTime = maintenance.StartDateTime,
                EndDateTime = maintenance.EndDateTime,
                DurationHours = maintenance.DurationHours,
                NextMaintenanceDate = maintenance.NextMaintenanceDate,
                MaintenanceFrequency = maintenance.MaintenanceFrequency,
                TechnicianNotes = maintenance.TechnicianNotes,
                CreatedAt = maintenance.CreatedAt
            };
        }

        #endregion
    }
}
