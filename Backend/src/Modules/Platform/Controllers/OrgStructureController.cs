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

namespace UabIndia.Api.Modules.Platform.Controllers
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
    }
}
