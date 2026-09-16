using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/org")]
    [Authorize]
    [Authorize(Policy = "Module:platform")]
    public class OrgStructureController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public OrgStructureController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private Guid TenantId => _tenantAccessor.GetTenantId();

        private async Task<IActionResult?> EnsureCompanyInTenantAsync(Guid companyId)
        {
            if (companyId == Guid.Empty)
            {
                return BadRequest(new { message = "companyId is required." });
            }

            var exists = await _db.Companies.AsNoTracking()
                .AnyAsync(c => c.Id == companyId && c.TenantId == TenantId && !c.IsDeleted);

            return exists ? null : NotFound(new { message = "Company not found in tenant scope." });
        }

        // ── Departments ─────────────────────────────────────────────────────

        [HttpGet("departments")]
        public async Task<IActionResult> ListDepartments([FromQuery] Guid? companyId)
        {
            var query = _db.Departments.AsNoTracking().Where(d => d.TenantId == TenantId);
            if (companyId.HasValue) query = query.Where(d => d.CompanyId == companyId.Value);

            var rows = (await query.OrderBy(d => d.Name).ToListAsync()).Select(MapDepartment).ToList();
            return Ok(new { departments = rows, total = rows.Count });
        }

        [HttpPost("departments")]
        public async Task<IActionResult> CreateDepartment([FromBody] UpsertDepartmentRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var companyError = await EnsureCompanyInTenantAsync(request.CompanyId);
            if (companyError != null) return companyError;

            var entity = new Department
            {
                TenantId = TenantId,
                CompanyId = request.CompanyId,
                Name = request.Name.Trim(),
                Code = request.Code.Trim().ToUpperInvariant(),
                Description = request.Description?.Trim(),
                IsActive = request.IsActive,
                ParentDepartmentId = request.ParentDepartmentId,
                HeadEmployeeName = request.HeadEmployeeName?.Trim(),
            };

            _db.Departments.Add(entity);
            await _db.SaveChangesAsync();
            return Ok(new { department = MapDepartment(entity) });
        }

        [HttpPut("departments/{id:guid}")]
        public async Task<IActionResult> UpdateDepartment(Guid id, [FromBody] UpsertDepartmentRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var entity = await _db.Departments.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();

            entity.CompanyId = request.CompanyId;
            entity.Name = request.Name.Trim();
            entity.Code = request.Code.Trim().ToUpperInvariant();
            entity.Description = request.Description?.Trim();
            entity.IsActive = request.IsActive;
            entity.ParentDepartmentId = request.ParentDepartmentId;
            entity.HeadEmployeeName = request.HeadEmployeeName?.Trim();
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { department = MapDepartment(entity) });
        }

        [HttpDelete("departments/{id:guid}")]
        public async Task<IActionResult> DeleteDepartment(Guid id)
        {
            var entity = await _db.Departments.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Department deleted." });
        }

        // ── Designations ────────────────────────────────────────────────────

        [HttpGet("designations")]
        public async Task<IActionResult> ListDesignations([FromQuery] Guid? companyId)
        {
            var query = _db.Designations.AsNoTracking().Where(d => d.TenantId == TenantId);
            if (companyId.HasValue) query = query.Where(d => d.CompanyId == companyId.Value);

            var rows = (await query.OrderBy(d => d.Name).ToListAsync()).Select(MapDesignation).ToList();
            return Ok(new { designations = rows, total = rows.Count });
        }

        [HttpPost("designations")]
        public async Task<IActionResult> CreateDesignation([FromBody] UpsertDesignationRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var companyError = await EnsureCompanyInTenantAsync(request.CompanyId);
            if (companyError != null) return companyError;

            var entity = new Designation
            {
                TenantId = TenantId,
                CompanyId = request.CompanyId,
                Name = request.Name.Trim(),
                Code = request.Code.Trim().ToUpperInvariant(),
                Description = request.Description?.Trim(),
                IsActive = request.IsActive,
                Grade = request.Grade?.Trim(),
                Level = request.Level?.Trim(),
            };

            _db.Designations.Add(entity);
            await _db.SaveChangesAsync();
            return Ok(new { designation = MapDesignation(entity) });
        }

        [HttpPut("designations/{id:guid}")]
        public async Task<IActionResult> UpdateDesignation(Guid id, [FromBody] UpsertDesignationRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var entity = await _db.Designations.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();

            entity.CompanyId = request.CompanyId;
            entity.Name = request.Name.Trim();
            entity.Code = request.Code.Trim().ToUpperInvariant();
            entity.Description = request.Description?.Trim();
            entity.IsActive = request.IsActive;
            entity.Grade = request.Grade?.Trim();
            entity.Level = request.Level?.Trim();
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { designation = MapDesignation(entity) });
        }

        [HttpDelete("designations/{id:guid}")]
        public async Task<IActionResult> DeleteDesignation(Guid id)
        {
            var entity = await _db.Designations.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Designation deleted." });
        }

        // ── Branches ────────────────────────────────────────────────────────

        [HttpGet("branches")]
        public async Task<IActionResult> ListBranches([FromQuery] Guid? companyId)
        {
            var query = _db.Branches.AsNoTracking().Where(d => d.TenantId == TenantId);
            if (companyId.HasValue) query = query.Where(d => d.CompanyId == companyId.Value);

            var rows = (await query.OrderBy(d => d.Name).ToListAsync()).Select(MapBranch).ToList();
            return Ok(new { branches = rows, total = rows.Count });
        }

        [HttpPost("branches")]
        public async Task<IActionResult> CreateBranch([FromBody] UpsertBranchRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var companyError = await EnsureCompanyInTenantAsync(request.CompanyId);
            if (companyError != null) return companyError;

            var entity = new Branch
            {
                TenantId = TenantId,
                CompanyId = request.CompanyId,
                Name = request.Name.Trim(),
                Code = request.Code.Trim().ToUpperInvariant(),
                Description = request.Description?.Trim(),
                IsActive = request.IsActive,
                City = request.City?.Trim(),
                State = request.State?.Trim(),
                Gstin = request.Gstin?.Trim(),
                IsWarehouse = request.IsWarehouse,
            };

            _db.Branches.Add(entity);
            await _db.SaveChangesAsync();
            return Ok(new { branch = MapBranch(entity) });
        }

        [HttpPut("branches/{id:guid}")]
        public async Task<IActionResult> UpdateBranch(Guid id, [FromBody] UpsertBranchRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var entity = await _db.Branches.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();

            entity.CompanyId = request.CompanyId;
            entity.Name = request.Name.Trim();
            entity.Code = request.Code.Trim().ToUpperInvariant();
            entity.Description = request.Description?.Trim();
            entity.IsActive = request.IsActive;
            entity.City = request.City?.Trim();
            entity.State = request.State?.Trim();
            entity.Gstin = request.Gstin?.Trim();
            entity.IsWarehouse = request.IsWarehouse;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { branch = MapBranch(entity) });
        }

        [HttpDelete("branches/{id:guid}")]
        public async Task<IActionResult> DeleteBranch(Guid id)
        {
            var entity = await _db.Branches.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Branch deleted." });
        }

        // ── Cost Centers ────────────────────────────────────────────────────

        [HttpGet("cost-centers")]
        public async Task<IActionResult> ListCostCenters([FromQuery] Guid? companyId)
        {
            var query = _db.CostCenters.AsNoTracking().Where(d => d.TenantId == TenantId);
            if (companyId.HasValue) query = query.Where(d => d.CompanyId == companyId.Value);

            var rows = (await query.OrderBy(d => d.Name).ToListAsync()).Select(MapCostCenter).ToList();
            return Ok(new { costCenters = rows, total = rows.Count });
        }

        [HttpPost("cost-centers")]
        public async Task<IActionResult> CreateCostCenter([FromBody] UpsertCostCenterRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var companyError = await EnsureCompanyInTenantAsync(request.CompanyId);
            if (companyError != null) return companyError;

            var entity = new CostCenter
            {
                TenantId = TenantId,
                CompanyId = request.CompanyId,
                Name = request.Name.Trim(),
                Code = request.Code.Trim().ToUpperInvariant(),
                Description = request.Description?.Trim(),
                IsActive = request.IsActive,
                CostCenterType = request.CostCenterType?.Trim(),
            };

            _db.CostCenters.Add(entity);
            await _db.SaveChangesAsync();
            return Ok(new { costCenter = MapCostCenter(entity) });
        }

        [HttpPut("cost-centers/{id:guid}")]
        public async Task<IActionResult> UpdateCostCenter(Guid id, [FromBody] UpsertCostCenterRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var entity = await _db.CostCenters.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();

            entity.CompanyId = request.CompanyId;
            entity.Name = request.Name.Trim();
            entity.Code = request.Code.Trim().ToUpperInvariant();
            entity.Description = request.Description?.Trim();
            entity.IsActive = request.IsActive;
            entity.CostCenterType = request.CostCenterType?.Trim();
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { costCenter = MapCostCenter(entity) });
        }

        [HttpDelete("cost-centers/{id:guid}")]
        public async Task<IActionResult> DeleteCostCenter(Guid id)
        {
            var entity = await _db.CostCenters.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Cost center deleted." });
        }

        // ── Business Units ──────────────────────────────────────────────────

        [HttpGet("business-units")]
        public async Task<IActionResult> ListBusinessUnits([FromQuery] Guid? companyId)
        {
            var query = _db.BusinessUnits.AsNoTracking().Where(d => d.TenantId == TenantId);
            if (companyId.HasValue) query = query.Where(d => d.CompanyId == companyId.Value);

            var rows = (await query.OrderBy(d => d.Name).ToListAsync()).Select(MapBusinessUnit).ToList();
            return Ok(new { businessUnits = rows, total = rows.Count });
        }

        [HttpPost("business-units")]
        public async Task<IActionResult> CreateBusinessUnit([FromBody] UpsertBusinessUnitRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var companyError = await EnsureCompanyInTenantAsync(request.CompanyId);
            if (companyError != null) return companyError;

            var entity = new BusinessUnit
            {
                TenantId = TenantId,
                CompanyId = request.CompanyId,
                Name = request.Name.Trim(),
                Code = request.Code.Trim().ToUpperInvariant(),
                Description = request.Description?.Trim(),
                IsActive = request.IsActive,
                ParentBusinessUnitId = request.ParentBusinessUnitId,
            };

            _db.BusinessUnits.Add(entity);
            await _db.SaveChangesAsync();
            return Ok(new { businessUnit = MapBusinessUnit(entity) });
        }

        [HttpPut("business-units/{id:guid}")]
        public async Task<IActionResult> UpdateBusinessUnit(Guid id, [FromBody] UpsertBusinessUnitRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var entity = await _db.BusinessUnits.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();

            entity.CompanyId = request.CompanyId;
            entity.Name = request.Name.Trim();
            entity.Code = request.Code.Trim().ToUpperInvariant();
            entity.Description = request.Description?.Trim();
            entity.IsActive = request.IsActive;
            entity.ParentBusinessUnitId = request.ParentBusinessUnitId;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { businessUnit = MapBusinessUnit(entity) });
        }

        [HttpDelete("business-units/{id:guid}")]
        public async Task<IActionResult> DeleteBusinessUnit(Guid id)
        {
            var entity = await _db.BusinessUnits.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Business unit deleted." });
        }

        // ── Business Zones ──────────────────────────────────────────────────

        [HttpGet("zones")]
        public async Task<IActionResult> ListZones([FromQuery] Guid? companyId)
        {
            var query = _db.BusinessZones.AsNoTracking().Where(d => d.TenantId == TenantId);
            if (companyId.HasValue) query = query.Where(d => d.CompanyId == companyId.Value);

            var rows = (await query.OrderBy(d => d.Name).ToListAsync()).Select(MapZone).ToList();
            return Ok(new { zones = rows, total = rows.Count });
        }

        [HttpPost("zones")]
        public async Task<IActionResult> CreateZone([FromBody] UpsertBusinessZoneRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var companyError = await EnsureCompanyInTenantAsync(request.CompanyId);
            if (companyError != null) return companyError;

            var entity = new BusinessZone
            {
                TenantId = TenantId,
                CompanyId = request.CompanyId,
                Name = request.Name.Trim(),
                Code = request.Code.Trim().ToUpperInvariant(),
                Description = request.Description?.Trim(),
                IsActive = request.IsActive,
                HeadEmployeeId = request.HeadEmployeeId,
                HeadEmployeeName = request.HeadEmployeeName?.Trim(),
            };

            _db.BusinessZones.Add(entity);
            await _db.SaveChangesAsync();
            return Ok(new { zone = MapZone(entity) });
        }

        [HttpPut("zones/{id:guid}")]
        public async Task<IActionResult> UpdateZone(Guid id, [FromBody] UpsertBusinessZoneRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var entity = await _db.BusinessZones.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();

            entity.CompanyId = request.CompanyId;
            entity.Name = request.Name.Trim();
            entity.Code = request.Code.Trim().ToUpperInvariant();
            entity.Description = request.Description?.Trim();
            entity.IsActive = request.IsActive;
            entity.HeadEmployeeId = request.HeadEmployeeId;
            entity.HeadEmployeeName = request.HeadEmployeeName?.Trim();
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { zone = MapZone(entity) });
        }

        [HttpDelete("zones/{id:guid}")]
        public async Task<IActionResult> DeleteZone(Guid id)
        {
            var entity = await _db.BusinessZones.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Zone deleted." });
        }

        // ── Business Regions ────────────────────────────────────────────────

        [HttpGet("regions")]
        public async Task<IActionResult> ListRegions([FromQuery] Guid? companyId, [FromQuery] Guid? zoneId)
        {
            var query = _db.BusinessRegions.AsNoTracking().Where(d => d.TenantId == TenantId);
            if (companyId.HasValue) query = query.Where(d => d.CompanyId == companyId.Value);
            if (zoneId.HasValue) query = query.Where(d => d.ZoneId == zoneId.Value);

            var rows = await query.OrderBy(d => d.Name).ToListAsync();
            var zoneIds = rows.Select(r => r.ZoneId).Distinct().ToList();
            var zoneDict = await _db.BusinessZones.Where(z => zoneIds.Contains(z.Id)).ToDictionaryAsync(z => z.Id, z => z.Name);

            var mapped = rows.Select(r => MapRegion(r, zoneDict.TryGetValue(r.ZoneId, out var zn) ? zn : null)).ToList();
            return Ok(new { regions = mapped, total = mapped.Count });
        }

        [HttpPost("regions")]
        public async Task<IActionResult> CreateRegion([FromBody] UpsertBusinessRegionRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var companyError = await EnsureCompanyInTenantAsync(request.CompanyId);
            if (companyError != null) return companyError;

            var entity = new BusinessRegion
            {
                TenantId = TenantId,
                CompanyId = request.CompanyId,
                ZoneId = request.ZoneId,
                Name = request.Name.Trim(),
                Code = request.Code.Trim().ToUpperInvariant(),
                Description = request.Description?.Trim(),
                IsActive = request.IsActive,
                HeadEmployeeId = request.HeadEmployeeId,
                HeadEmployeeName = request.HeadEmployeeName?.Trim(),
            };

            _db.BusinessRegions.Add(entity);
            await _db.SaveChangesAsync();
            return Ok(new { region = MapRegion(entity, null) });
        }

        [HttpPut("regions/{id:guid}")]
        public async Task<IActionResult> UpdateRegion(Guid id, [FromBody] UpsertBusinessRegionRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var entity = await _db.BusinessRegions.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();

            entity.CompanyId = request.CompanyId;
            entity.ZoneId = request.ZoneId;
            entity.Name = request.Name.Trim();
            entity.Code = request.Code.Trim().ToUpperInvariant();
            entity.Description = request.Description?.Trim();
            entity.IsActive = request.IsActive;
            entity.HeadEmployeeId = request.HeadEmployeeId;
            entity.HeadEmployeeName = request.HeadEmployeeName?.Trim();
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { region = MapRegion(entity, null) });
        }

        [HttpDelete("regions/{id:guid}")]
        public async Task<IActionResult> DeleteRegion(Guid id)
        {
            var entity = await _db.BusinessRegions.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Region deleted." });
        }

        // ── Business Clusters ───────────────────────────────────────────────

        [HttpGet("clusters")]
        public async Task<IActionResult> ListClusters([FromQuery] Guid? companyId, [FromQuery] Guid? regionId)
        {
            var query = _db.BusinessClusters.AsNoTracking().Where(d => d.TenantId == TenantId);
            if (companyId.HasValue) query = query.Where(d => d.CompanyId == companyId.Value);
            if (regionId.HasValue) query = query.Where(d => d.RegionId == regionId.Value);

            var rows = await query.OrderBy(d => d.Name).ToListAsync();
            var regionIds = rows.Select(r => r.RegionId).Distinct().ToList();
            var regionDict = await _db.BusinessRegions.Where(z => regionIds.Contains(z.Id)).ToDictionaryAsync(z => z.Id, z => z.Name);

            var mapped = rows.Select(r => MapCluster(r, regionDict.TryGetValue(r.RegionId, out var rn) ? rn : null)).ToList();
            return Ok(new { clusters = mapped, total = mapped.Count });
        }

        [HttpPost("clusters")]
        public async Task<IActionResult> CreateCluster([FromBody] UpsertBusinessClusterRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var companyError = await EnsureCompanyInTenantAsync(request.CompanyId);
            if (companyError != null) return companyError;

            var entity = new BusinessCluster
            {
                TenantId = TenantId,
                CompanyId = request.CompanyId,
                RegionId = request.RegionId,
                Name = request.Name.Trim(),
                Code = request.Code.Trim().ToUpperInvariant(),
                Description = request.Description?.Trim(),
                IsActive = request.IsActive,
                HeadEmployeeId = request.HeadEmployeeId,
                HeadEmployeeName = request.HeadEmployeeName?.Trim(),
            };

            _db.BusinessClusters.Add(entity);
            await _db.SaveChangesAsync();
            return Ok(new { cluster = MapCluster(entity, null) });
        }

        [HttpPut("clusters/{id:guid}")]
        public async Task<IActionResult> UpdateCluster(Guid id, [FromBody] UpsertBusinessClusterRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var entity = await _db.BusinessClusters.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();

            entity.CompanyId = request.CompanyId;
            entity.RegionId = request.RegionId;
            entity.Name = request.Name.Trim();
            entity.Code = request.Code.Trim().ToUpperInvariant();
            entity.Description = request.Description?.Trim();
            entity.IsActive = request.IsActive;
            entity.HeadEmployeeId = request.HeadEmployeeId;
            entity.HeadEmployeeName = request.HeadEmployeeName?.Trim();
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { cluster = MapCluster(entity, null) });
        }

        [HttpDelete("clusters/{id:guid}")]
        public async Task<IActionResult> DeleteCluster(Guid id)
        {
            var entity = await _db.BusinessClusters.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Cluster deleted." });
        }

        // ── Operational Locations ───────────────────────────────────────────

        [HttpGet("operational-locations")]
        public async Task<IActionResult> ListOperationalLocations([FromQuery] Guid? companyId, [FromQuery] Guid? districtId)
        {
            var query = _db.OperationalLocations.AsNoTracking().Where(d => d.TenantId == TenantId);
            if (companyId.HasValue) query = query.Where(d => d.CompanyId == companyId.Value);
            if (districtId.HasValue) query = query.Where(d => d.DistrictId == districtId.Value);

            var rows = await query.OrderBy(d => d.Name).ToListAsync();
            var districtIds = rows.Where(r => r.DistrictId.HasValue).Select(r => r.DistrictId!.Value).Distinct().ToList();
            var districtDict = await _db.GeoDistricts.Where(d => districtIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.Name);

            var clusterIds = rows.Where(r => r.BusinessClusterId.HasValue).Select(r => r.BusinessClusterId!.Value).Distinct().ToList();
            var clusterDict = await _db.BusinessClusters.Where(c => clusterIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, c => c.Name);

            var mapped = rows.Select(r => MapOperationalLocation(
                r,
                r.DistrictId.HasValue && districtDict.TryGetValue(r.DistrictId.Value, out var dn) ? dn : null,
                r.BusinessClusterId.HasValue && clusterDict.TryGetValue(r.BusinessClusterId.Value, out var cn) ? cn : null
            )).ToList();

            return Ok(new { operationalLocations = mapped, total = mapped.Count });
        }

        [HttpPost("operational-locations")]
        public async Task<IActionResult> CreateOperationalLocation([FromBody] UpsertOperationalLocationRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var companyError = await EnsureCompanyInTenantAsync(request.CompanyId);
            if (companyError != null) return companyError;

            var entity = new OperationalLocation
            {
                TenantId = TenantId,
                CompanyId = request.CompanyId,
                Name = request.Name.Trim(),
                Code = request.Code.Trim().ToUpperInvariant(),
                Description = request.Description?.Trim(),
                IsActive = request.IsActive,
                Type = request.Type,
                DistrictId = request.DistrictId,
                CityId = request.CityId,
                Address = request.Address?.Trim(),
                PostalCode = request.PostalCode?.Trim(),
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                GeofenceRadiusMeters = request.GeofenceRadiusMeters > 0 ? request.GeofenceRadiusMeters : 150,
                BusinessClusterId = request.BusinessClusterId,
                ContactPersonName = request.ContactPersonName?.Trim(),
                ContactPhone = request.ContactPhone?.Trim(),
            };

            _db.OperationalLocations.Add(entity);
            await _db.SaveChangesAsync();
            return Ok(new { operationalLocation = MapOperationalLocation(entity, null, null) });
        }

        [HttpPut("operational-locations/{id:guid}")]
        public async Task<IActionResult> UpdateOperationalLocation(Guid id, [FromBody] UpsertOperationalLocationRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var entity = await _db.OperationalLocations.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();

            entity.CompanyId = request.CompanyId;
            entity.Name = request.Name.Trim();
            entity.Code = request.Code.Trim().ToUpperInvariant();
            entity.Description = request.Description?.Trim();
            entity.IsActive = request.IsActive;
            entity.Type = request.Type;
            entity.DistrictId = request.DistrictId;
            entity.CityId = request.CityId;
            entity.Address = request.Address?.Trim();
            entity.PostalCode = request.PostalCode?.Trim();
            entity.Latitude = request.Latitude;
            entity.Longitude = request.Longitude;
            entity.GeofenceRadiusMeters = request.GeofenceRadiusMeters > 0 ? request.GeofenceRadiusMeters : 150;
            entity.BusinessClusterId = request.BusinessClusterId;
            entity.ContactPersonName = request.ContactPersonName?.Trim();
            entity.ContactPhone = request.ContactPhone?.Trim();
            entity.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { operationalLocation = MapOperationalLocation(entity, null, null) });
        }

        [HttpDelete("operational-locations/{id:guid}")]
        public async Task<IActionResult> DeleteOperationalLocation(Guid id)
        {
            var entity = await _db.OperationalLocations.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Operational location deleted." });
        }

        // ── Posting Units (Fixed Desks / MVU Mobile Units) ──────────────────

        [HttpGet("posting-units")]
        public async Task<IActionResult> ListPostingUnits([FromQuery] Guid? companyId, [FromQuery] Guid? parentLocationId)
        {
            var query = _db.PostingUnits.AsNoTracking().Where(d => d.TenantId == TenantId);
            if (companyId.HasValue) query = query.Where(d => d.CompanyId == companyId.Value);
            if (parentLocationId.HasValue) query = query.Where(d => d.ParentLocationId == parentLocationId.Value);

            var rows = await query.OrderBy(d => d.Name).ToListAsync();
            var parentIds = rows.Where(r => r.ParentLocationId.HasValue).Select(r => r.ParentLocationId!.Value).Distinct().ToList();
            var parentDict = await _db.OperationalLocations.Where(l => parentIds.Contains(l.Id)).ToDictionaryAsync(l => l.Id, l => l.Name);

            var mapped = rows.Select(r => MapPostingUnit(
                r,
                r.ParentLocationId.HasValue && parentDict.TryGetValue(r.ParentLocationId.Value, out var pn) ? pn : null
            )).ToList();

            return Ok(new { postingUnits = mapped, total = mapped.Count });
        }

        [HttpPost("posting-units")]
        public async Task<IActionResult> CreatePostingUnit([FromBody] UpsertPostingUnitRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var companyError = await EnsureCompanyInTenantAsync(request.CompanyId);
            if (companyError != null) return companyError;

            var entity = new PostingUnit
            {
                TenantId = TenantId,
                CompanyId = request.CompanyId,
                Name = request.Name.Trim(),
                Code = request.Code.Trim().ToUpperInvariant(),
                Description = request.Description?.Trim(),
                IsActive = request.IsActive,
                TargetType = request.TargetType,
                ParentLocationId = request.ParentLocationId,
                VehicleRegistrationNumber = request.VehicleRegistrationNumber?.Trim(),
                ImeiOrGpsDeviceId = request.ImeiOrGpsDeviceId?.Trim(),
                ChasisOrAssetNumber = request.ChasisOrAssetNumber?.Trim(),
                OperationalRoute = request.OperationalRoute?.Trim(),
            };

            _db.PostingUnits.Add(entity);
            await _db.SaveChangesAsync();
            return Ok(new { postingUnit = MapPostingUnit(entity, null) });
        }

        [HttpPut("posting-units/{id:guid}")]
        public async Task<IActionResult> UpdatePostingUnit(Guid id, [FromBody] UpsertPostingUnitRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var entity = await _db.PostingUnits.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();

            entity.CompanyId = request.CompanyId;
            entity.Name = request.Name.Trim();
            entity.Code = request.Code.Trim().ToUpperInvariant();
            entity.Description = request.Description?.Trim();
            entity.IsActive = request.IsActive;
            entity.TargetType = request.TargetType;
            entity.ParentLocationId = request.ParentLocationId;
            entity.VehicleRegistrationNumber = request.VehicleRegistrationNumber?.Trim();
            entity.ImeiOrGpsDeviceId = request.ImeiOrGpsDeviceId?.Trim();
            entity.ChasisOrAssetNumber = request.ChasisOrAssetNumber?.Trim();
            entity.OperationalRoute = request.OperationalRoute?.Trim();
            entity.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { postingUnit = MapPostingUnit(entity, null) });
        }

        [HttpDelete("posting-units/{id:guid}")]
        public async Task<IActionResult> DeletePostingUnit(Guid id)
        {
            var entity = await _db.PostingUnits.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Posting unit deleted." });
        }

        private static DepartmentDto MapDepartment(Department d) => new()
        {
            Id = d.Id,
            TenantId = d.TenantId,
            CompanyId = d.CompanyId,
            Name = d.Name,
            Code = d.Code,
            Description = d.Description,
            IsActive = d.IsActive,
            ParentDepartmentId = d.ParentDepartmentId,
            HeadEmployeeName = d.HeadEmployeeName,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt,
        };

        private static DesignationDto MapDesignation(Designation d) => new()
        {
            Id = d.Id,
            TenantId = d.TenantId,
            CompanyId = d.CompanyId,
            Name = d.Name,
            Code = d.Code,
            Description = d.Description,
            IsActive = d.IsActive,
            Grade = d.Grade,
            Level = d.Level,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt,
        };

        private static BranchDto MapBranch(Branch d) => new()
        {
            Id = d.Id,
            TenantId = d.TenantId,
            CompanyId = d.CompanyId,
            Name = d.Name,
            Code = d.Code,
            Description = d.Description,
            IsActive = d.IsActive,
            City = d.City,
            State = d.State,
            Gstin = d.Gstin,
            IsWarehouse = d.IsWarehouse,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt,
        };

        private static CostCenterDto MapCostCenter(CostCenter d) => new()
        {
            Id = d.Id,
            TenantId = d.TenantId,
            CompanyId = d.CompanyId,
            Name = d.Name,
            Code = d.Code,
            Description = d.Description,
            IsActive = d.IsActive,
            CostCenterType = d.CostCenterType,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt,
        };

        private static BusinessUnitDto MapBusinessUnit(BusinessUnit d) => new()
        {
            Id = d.Id,
            TenantId = d.TenantId,
            CompanyId = d.CompanyId,
            Name = d.Name,
            Code = d.Code,
            Description = d.Description,
            IsActive = d.IsActive,
            ParentBusinessUnitId = d.ParentBusinessUnitId,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt,
        };

        private static BusinessZoneDto MapZone(BusinessZone z) => new()
        {
            Id = z.Id,
            TenantId = z.TenantId,
            CompanyId = z.CompanyId,
            Name = z.Name,
            Code = z.Code,
            Description = z.Description,
            IsActive = z.IsActive,
            HeadEmployeeId = z.HeadEmployeeId,
            HeadEmployeeName = z.HeadEmployeeName,
            CreatedAt = z.CreatedAt,
            UpdatedAt = z.UpdatedAt,
        };

        private static BusinessRegionDto MapRegion(BusinessRegion r, string? zoneName) => new()
        {
            Id = r.Id,
            TenantId = r.TenantId,
            CompanyId = r.CompanyId,
            ZoneId = r.ZoneId,
            ZoneName = zoneName,
            Name = r.Name,
            Code = r.Code,
            Description = r.Description,
            IsActive = r.IsActive,
            HeadEmployeeId = r.HeadEmployeeId,
            HeadEmployeeName = r.HeadEmployeeName,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt,
        };

        private static BusinessClusterDto MapCluster(BusinessCluster c, string? regionName) => new()
        {
            Id = c.Id,
            TenantId = c.TenantId,
            CompanyId = c.CompanyId,
            RegionId = c.RegionId,
            RegionName = regionName,
            Name = c.Name,
            Code = c.Code,
            Description = c.Description,
            IsActive = c.IsActive,
            HeadEmployeeId = c.HeadEmployeeId,
            HeadEmployeeName = c.HeadEmployeeName,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
        };

        private static OperationalLocationDto MapOperationalLocation(OperationalLocation l, string? districtName, string? clusterName) => new()
        {
            Id = l.Id,
            TenantId = l.TenantId,
            CompanyId = l.CompanyId,
            Name = l.Name,
            Code = l.Code,
            Description = l.Description,
            IsActive = l.IsActive,
            Type = l.Type,
            DistrictId = l.DistrictId,
            DistrictName = districtName,
            CityId = l.CityId,
            Address = l.Address,
            PostalCode = l.PostalCode,
            Latitude = l.Latitude,
            Longitude = l.Longitude,
            GeofenceRadiusMeters = l.GeofenceRadiusMeters,
            BusinessClusterId = l.BusinessClusterId,
            BusinessClusterName = clusterName,
            ContactPersonName = l.ContactPersonName,
            ContactPhone = l.ContactPhone,
            CreatedAt = l.CreatedAt,
            UpdatedAt = l.UpdatedAt,
        };

        private static PostingUnitDto MapPostingUnit(PostingUnit p, string? parentLocationName) => new()
        {
            Id = p.Id,
            TenantId = p.TenantId,
            CompanyId = p.CompanyId,
            Name = p.Name,
            Code = p.Code,
            Description = p.Description,
            IsActive = p.IsActive,
            TargetType = p.TargetType,
            ParentLocationId = p.ParentLocationId,
            ParentLocationName = parentLocationName,
            VehicleRegistrationNumber = p.VehicleRegistrationNumber,
            ImeiOrGpsDeviceId = p.ImeiOrGpsDeviceId,
            ChasisOrAssetNumber = p.ChasisOrAssetNumber,
            OperationalRoute = p.OperationalRoute,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
        };
    }
}

