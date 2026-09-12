using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;
using System.Security.Claims;
using UabIndia.Core.Authorization;

namespace UabIndia.Api.Modules.Projects.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public ProjectsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        // ── Role helpers ──────────────────────────────────────────────────────
        private bool IsSuperAdmin()
        {
            var roleClaims = User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value);
            return RoleCatalog.HasAnyRole(roleClaims, SystemRole.SuperAdmin);
        }

        private bool IsAdmin()
        {
            var roleClaims = User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value);
            return RoleCatalog.HasAnyRole(roleClaims, SystemRole.Admin) || RoleCatalog.HasAnyRole(roleClaims, SystemRole.SuperAdmin);
        }

        private static bool IsTenantSchemaUnavailable(Exception ex)
        {
            var text = ex.ToString();
            return text.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase)
                || text.Contains("Cannot find the object", StringComparison.OrdinalIgnoreCase)
                || text.Contains("Could not find object", StringComparison.OrdinalIgnoreCase)
                || text.Contains("Invalid column name", StringComparison.OrdinalIgnoreCase)
                || text.Contains("column name or number of supplied values", StringComparison.OrdinalIgnoreCase);
        }

        private static ProjectDto MapToDto(UabIndia.Core.Entities.Project p, string? companyName, string? tenantName = null) => new ProjectDto
        {
            Id = p.Id,
            TenantId = p.TenantId,
            CompanyId = p.CompanyId,
            CompanyName = companyName,
            TenantName = tenantName,
            ProjectCode = p.ProjectCode,
            Name = p.Name,
            Description = p.Description,
            ProjectType = p.ProjectType,
            Priority = p.Priority,
            Status = p.Status,
            IsActive = p.IsActive,
            IsDeleted = p.IsDeleted,
            StartDate = p.StartDate,
            EndDate = p.EndDate,
            ActualStartDate = p.ActualStartDate,
            ActualEndDate = p.ActualEndDate,
            Budget = p.Budget,
            ActualCost = p.ActualCost,
            CurrencyCode = p.CurrencyCode,
            ClientName = p.ClientName,
            ContractNumber = p.ContractNumber,
            BillingType = p.BillingType,
            CompletionPercentage = p.CompletionPercentage,
            ProjectManagerId = p.ProjectManagerId,
            Location = p.Location,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
        };

        // ── GET /api/v1/projects ─────────────────────────────────────────────
        // SuperAdmin:   sees ALL tenants, optional includeDeleted=true
        // Admin:        sees own tenant (active only unless includeDeleted=true)
        // Employee:     sees own tenant active projects
        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] Guid? companyId,
            [FromQuery] string? status,
            [FromQuery] bool includeDeleted = false)
        {
            try
            {
                var superAdmin = IsSuperAdmin();
                var tenantId = _tenantAccessor.GetTenantId();

                IQueryable<UabIndia.Core.Entities.Project> projectQuery;
                IQueryable<UabIndia.Core.Entities.Company> companyQuery;
                IQueryable<UabIndia.Core.Entities.Tenant> tenantQuery;

                if (superAdmin)
                {
                    // SuperAdmin: all tenants, all projects (optionally including deleted)
                    projectQuery = _db.Projects.AsNoTracking().IgnoreQueryFilters();
                    companyQuery = _db.Companies.AsNoTracking().IgnoreQueryFilters();
                    tenantQuery  = _db.Tenants.AsNoTracking().IgnoreQueryFilters();
                    if (!includeDeleted)
                        projectQuery = projectQuery.Where(p => !p.IsDeleted);
                }
                else
                {
                    // Tenant-scoped users: only their tenant, only active (non-deleted)
                    projectQuery = _db.Projects.AsNoTracking().Where(p => p.TenantId == tenantId && !p.IsDeleted);
                    companyQuery = _db.Companies.AsNoTracking().Where(c => !c.IsDeleted);
                    tenantQuery  = _db.Tenants.AsNoTracking().Where(t => !t.IsDeleted);
                }

                if (companyId.HasValue)
                    projectQuery = projectQuery.Where(p => p.CompanyId == companyId.Value);
                if (!string.IsNullOrWhiteSpace(status))
                    projectQuery = projectQuery.Where(p => p.Status == status);

                var rows = await (from p in projectQuery
                                  join c in companyQuery on p.CompanyId equals c.Id into pc
                                  from c in pc.DefaultIfEmpty()
                                  join t in tenantQuery on p.TenantId equals t.Id into pt
                                  from t in pt.DefaultIfEmpty()
                                  orderby p.Name
                                  select new
                                  {
                                      p,
                                      CompanyName = c != null ? c.Name : string.Empty,
                                      TenantName  = t != null ? t.Name : string.Empty,
                                  })
                    .ToListAsync();

                var data = rows.Select(r => MapToDto(r.p, r.CompanyName, r.TenantName)).ToList();
                return Ok(new { projects = data });
            }
            catch (Exception ex) when (IsTenantSchemaUnavailable(ex))
            {
                return Ok(new { projects = Array.Empty<ProjectDto>(), warning = "Database schema update pending. Restart the server to apply project columns automatically." });
            }
        }

        // ── GET /api/v1/projects/{id} ────────────────────────────────────────
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id)
        {
            try
            {
                var superAdmin = IsSuperAdmin();
                var tenantId = _tenantAccessor.GetTenantId();

                IQueryable<UabIndia.Core.Entities.Project> projectQuery = superAdmin
                    ? _db.Projects.AsNoTracking().IgnoreQueryFilters().Where(p => p.Id == id)
                    : _db.Projects.AsNoTracking().Where(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);

                var row = await (from p in projectQuery
                                 join c in _db.Companies.AsNoTracking().IgnoreQueryFilters() on p.CompanyId equals c.Id into pc
                                 from c in pc.DefaultIfEmpty()
                                 join t in _db.Tenants.AsNoTracking().IgnoreQueryFilters() on p.TenantId equals t.Id into pt
                                 from t in pt.DefaultIfEmpty()
                                 select new
                                 {
                                     p,
                                     CompanyName = c != null ? c.Name : string.Empty,
                                     TenantName  = t != null ? t.Name : string.Empty,
                                 })
                    .FirstOrDefaultAsync();

                if (row == null) return NotFound();
                return Ok(new { project = MapToDto(row.p, row.CompanyName, row.TenantName) });
            }
            catch (Exception ex) when (IsTenantSchemaUnavailable(ex))
            {
                return NotFound(new { message = "Database schema update pending — restart the server." });
            }
        }

        // ── POST /api/v1/projects ────────────────────────────────────────────
        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateProjectDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Please provide valid project details." });

            var superAdmin = IsSuperAdmin();
            var callerTenantId = _tenantAccessor.GetTenantId();

            // SuperAdmin can create for any tenant by supplying dto.TenantId
            var effectiveTenantId = (superAdmin && dto.TenantId.HasValue && dto.TenantId.Value != Guid.Empty)
                ? dto.TenantId.Value
                : callerTenantId;

            // Validate company — SuperAdmin may reference a company from any tenant
            var companyQuery = superAdmin
                ? _db.Companies.AsNoTracking().IgnoreQueryFilters()
                : _db.Companies.AsNoTracking();

            var companyExists = await companyQuery
                .AnyAsync(c => c.Id == dto.CompanyId && c.TenantId == effectiveTenantId && !c.IsDeleted);
            if (!companyExists)
                return BadRequest(new { message = "Company not found for the specified tenant." });

            var normalizedName = dto.Name.Trim();
            var duplicate = await _db.Projects
                .AsNoTracking()
                .IgnoreQueryFilters()
                .AnyAsync(p => p.TenantId == effectiveTenantId && p.CompanyId == dto.CompanyId && p.Name == normalizedName && !p.IsDeleted);
            if (duplicate)
                return BadRequest(new { message = "A project with the same name already exists for this company." });

            var code = !string.IsNullOrWhiteSpace(dto.ProjectCode)
                ? dto.ProjectCode.Trim().ToUpperInvariant()
                : "PRJ-" + Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();

            var project = new UabIndia.Core.Entities.Project
            {
                TenantId = effectiveTenantId,
                CompanyId = dto.CompanyId,
                ProjectCode = code,
                Name = normalizedName,
                Description = dto.Description,
                ProjectType = dto.ProjectType ?? "Internal",
                Priority = dto.Priority ?? "Medium",
                Status = dto.Status ?? "Planned",
                IsActive = (dto.Status ?? "Planned") == "Active",
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Budget = dto.Budget,
                CurrencyCode = string.IsNullOrWhiteSpace(dto.CurrencyCode) ? "INR" : dto.CurrencyCode,
                ClientName = dto.ClientName,
                ContractNumber = dto.ContractNumber,
                BillingType = dto.BillingType,
                ProjectManagerId = dto.ProjectManagerId,
                Location = dto.Location,
                CreatedAt = DateTime.UtcNow,
            };

            try
            {
                _db.Projects.Add(project);
                await _db.SaveChangesAsync();
            }
            catch (Exception ex) when (IsTenantSchemaUnavailable(ex))
            {
                return StatusCode(503, new { message = "Database schema update pending — restart the server to apply schema changes." });
            }

            var companyName = await _db.Companies
                .AsNoTracking()
                .Where(c => c.Id == dto.CompanyId)
                .Select(c => c.Name)
                .FirstOrDefaultAsync();

            return Ok(new { message = "Project created successfully", project = MapToDto(project, companyName) });
        }

        // ── PUT /api/v1/projects/{id} ────────────────────────────────────────
        [HttpPut("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProjectDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "Please provide valid project details." });

            var superAdmin = IsSuperAdmin();
            var tenantId = _tenantAccessor.GetTenantId();

            var project = superAdmin
                ? await _db.Projects.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted)
                : await _db.Projects.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            if (dto.CompanyId.HasValue)
            {
                var effectiveTenant = superAdmin ? project.TenantId : tenantId;
                var companyExists = await _db.Companies
                    .AsNoTracking()
                    .AnyAsync(c => c.Id == dto.CompanyId.Value && c.TenantId == effectiveTenant && !c.IsDeleted);
                if (!companyExists)
                    return BadRequest(new { message = "Company not found for this tenant." });
                project.CompanyId = dto.CompanyId.Value;
            }

            if (!string.IsNullOrWhiteSpace(dto.Name)) project.Name = dto.Name.Trim();
            if (!string.IsNullOrWhiteSpace(dto.ProjectCode)) project.ProjectCode = dto.ProjectCode.Trim().ToUpperInvariant();
            if (dto.Description != null) project.Description = dto.Description;
            if (!string.IsNullOrWhiteSpace(dto.ProjectType)) project.ProjectType = dto.ProjectType;
            if (!string.IsNullOrWhiteSpace(dto.Priority)) project.Priority = dto.Priority;
            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                project.Status = dto.Status;
                project.IsActive = dto.Status == "Active";
            }
            if (dto.StartDate.HasValue) project.StartDate = dto.StartDate;
            if (dto.EndDate.HasValue) project.EndDate = dto.EndDate;
            if (dto.ActualStartDate.HasValue) project.ActualStartDate = dto.ActualStartDate;
            if (dto.ActualEndDate.HasValue) project.ActualEndDate = dto.ActualEndDate;
            if (dto.Budget.HasValue) project.Budget = dto.Budget;
            if (dto.ActualCost.HasValue) project.ActualCost = dto.ActualCost;
            if (!string.IsNullOrWhiteSpace(dto.CurrencyCode)) project.CurrencyCode = dto.CurrencyCode;
            if (dto.ClientName != null) project.ClientName = dto.ClientName;
            if (dto.ContractNumber != null) project.ContractNumber = dto.ContractNumber;
            if (dto.BillingType != null) project.BillingType = dto.BillingType;
            if (dto.CompletionPercentage.HasValue) project.CompletionPercentage = Math.Clamp(dto.CompletionPercentage.Value, 0, 100);
            if (dto.ProjectManagerId.HasValue) project.ProjectManagerId = dto.ProjectManagerId;
            if (dto.Location != null) project.Location = dto.Location;
            if (dto.UpdatedBy.HasValue) project.UpdatedBy = dto.UpdatedBy;

            project.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Project updated successfully" });
        }

        // ── DELETE /api/v1/projects/{id} ─────────────────────────────────────
        [HttpDelete("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var superAdmin = IsSuperAdmin();
            var tenantId = _tenantAccessor.GetTenantId();

            var project = superAdmin
                ? await _db.Projects.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted)
                : await _db.Projects.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            project.IsDeleted = true;
            project.IsActive = false;
            project.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Project deleted successfully" });
        }

        // ── POST /api/v1/projects/{id}/restore ───────────────────────────────
        // SuperAdmin can restore any deleted project; Admin can restore within tenant
        [HttpPost("{id:guid}/restore")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Restore(Guid id)
        {
            var superAdmin = IsSuperAdmin();
            var tenantId = _tenantAccessor.GetTenantId();

            var project = superAdmin
                ? await _db.Projects.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id && p.IsDeleted)
                : await _db.Projects.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && p.IsDeleted);

            if (project == null)
                return NotFound(new { message = "Deleted project not found." });

            project.IsDeleted = false;
            project.IsActive = project.Status == "Active";
            project.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Project restored successfully" });
        }
    }
}
