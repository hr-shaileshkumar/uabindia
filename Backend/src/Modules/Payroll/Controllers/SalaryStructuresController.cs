using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Api.Models;

namespace UabIndia.Api.Modules.Payroll.Controllers
{
    /// <summary>
    /// Dedicated controller for Payroll Salary Structures and Components.
    /// Route: api/v1/payroll/structures | api/v1/payroll/components
    /// </summary>
    [ApiController]
    [Authorize]
    [Authorize(Policy = "Module:payroll")]
    public class SalaryStructuresController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public SalaryStructuresController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        // ─── SALARY STRUCTURES ────────────────────────────────────────────────

        /// <summary>GET api/v1/payroll/structures</summary>
        [HttpGet("api/v1/payroll/structures")]
        public async Task<IActionResult> ListStructures([FromQuery] Guid? companyId, [FromQuery] Guid? projectId, CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.PayrollStructures.AsNoTracking().Where(s => s.TenantId == tenantId && !s.IsDeleted);
            if (projectId.HasValue) query = query.Where(s => s.ProjectId == projectId.Value || s.ProjectId == null);
            else if (companyId.HasValue) query = query.Where(s => s.CompanyId == companyId.Value || (s.CompanyId == null && s.ProjectId == null));
            return Ok(await query.OrderByDescending(s => s.IsDefault).ThenByDescending(s => s.EffectiveFrom).ToListAsync(ct));
        }

        /// <summary>GET api/v1/payroll/structures/{id}</summary>
        [HttpGet("api/v1/payroll/structures/{id:guid}")]
        public async Task<IActionResult> GetStructure(Guid id, CancellationToken ct)
        {
            var structure = await _db.PayrollStructures.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, ct);
            return structure == null ? NotFound(new { message = "Structure not found." }) : Ok(structure);
        }

        /// <summary>POST api/v1/payroll/structures</summary>
        [HttpPost("api/v1/payroll/structures")]
        public async Task<IActionResult> CreateStructure([FromBody] CreatePayrollStructureDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var tenantId = _tenantAccessor.GetTenantId();

            if (dto.IsDefault)
            {
                var defaults = await _db.PayrollStructures.Where(s => s.TenantId == tenantId && s.IsDefault && !s.IsDeleted).ToListAsync(ct);
                foreach (var d in defaults) d.IsDefault = false;
            }

            var structure = new PayrollStructure
            {
                TenantId = tenantId,
                Name = dto.Name,
                Description = dto.Description,
                IsDefault = dto.IsDefault,
                CompanyId = dto.CompanyId,
                ProjectId = dto.ProjectId,
                EffectiveFrom = dto.EffectiveFrom,
                EffectiveTo = dto.EffectiveTo,
                CreatedAt = DateTime.UtcNow
            };
            _db.PayrollStructures.Add(structure);
            await _db.SaveChangesAsync(ct);
            return Ok(structure);
        }

        /// <summary>PUT api/v1/payroll/structures/{id}</summary>
        [HttpPut("api/v1/payroll/structures/{id:guid}")]
        public async Task<IActionResult> UpdateStructure(Guid id, [FromBody] UpdatePayrollStructureDto dto, CancellationToken ct)
        {
            var structure = await _db.PayrollStructures.FindAsync(new object[] { id }, ct);
            if (structure == null) return NotFound(new { message = "Structure not found." });
            var tenantId = _tenantAccessor.GetTenantId();

            if (dto.IsDefault && !structure.IsDefault)
            {
                var defaults = await _db.PayrollStructures.Where(s => s.TenantId == tenantId && s.IsDefault && s.Id != id && !s.IsDeleted).ToListAsync(ct);
                foreach (var d in defaults) d.IsDefault = false;
            }

            structure.Name = dto.Name;
            structure.Description = dto.Description;
            structure.IsDefault = dto.IsDefault;
            structure.CompanyId = dto.CompanyId;
            structure.ProjectId = dto.ProjectId;
            structure.EffectiveFrom = dto.EffectiveFrom;
            structure.EffectiveTo = dto.EffectiveTo;
            structure.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(structure);
        }

        /// <summary>DELETE api/v1/payroll/structures/{id}</summary>
        [HttpDelete("api/v1/payroll/structures/{id:guid}")]
        public async Task<IActionResult> DeleteStructure(Guid id, CancellationToken ct)
        {
            var structure = await _db.PayrollStructures.FindAsync(new object[] { id }, ct);
            if (structure == null) return NotFound(new { message = "Structure not found." });
            structure.IsDeleted = true;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Structure deleted." });
        }

        // ─── SALARY COMPONENTS ────────────────────────────────────────────────

        /// <summary>GET api/v1/payroll/components</summary>
        [HttpGet("api/v1/payroll/components")]
        public async Task<IActionResult> ListComponents([FromQuery] Guid? structureId, CancellationToken ct = default)
        {
            var query = _db.PayrollComponents.AsNoTracking();
            if (structureId.HasValue) query = query.Where(c => c.StructureId == structureId.Value);
            return Ok(await query.OrderBy(c => c.Name).ToListAsync(ct));
        }

        /// <summary>GET api/v1/payroll/components/{id}</summary>
        [HttpGet("api/v1/payroll/components/{id:guid}")]
        public async Task<IActionResult> GetComponent(Guid id, CancellationToken ct)
        {
            var component = await _db.PayrollComponents.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);
            return component == null ? NotFound(new { message = "Component not found." }) : Ok(component);
        }

        /// <summary>POST api/v1/payroll/components</summary>
        [HttpPost("api/v1/payroll/components")]
        public async Task<IActionResult> CreateComponent([FromBody] CreatePayrollComponentDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (!await _db.PayrollStructures.AnyAsync(s => s.Id == dto.StructureId, ct))
                return BadRequest(new { message = "Payroll structure not found." });

            var component = new PayrollComponent
            {
                StructureId = dto.StructureId,
                Name = dto.Name,
                Type = dto.Type,
                CalculationType = dto.CalculationType ?? "FixedAmount",
                Amount = dto.Amount,
                Percentage = dto.Percentage,
                Formula = dto.Formula,
                PercentageBase = dto.PercentageBase ?? "Basic",
                IsStatutory = dto.IsStatutory
            };
            _db.PayrollComponents.Add(component);
            await _db.SaveChangesAsync(ct);
            return Ok(component);
        }

        /// <summary>PUT api/v1/payroll/components/{id}</summary>
        [HttpPut("api/v1/payroll/components/{id:guid}")]
        public async Task<IActionResult> UpdateComponent(Guid id, [FromBody] UpdatePayrollComponentDto dto, CancellationToken ct)
        {
            var component = await _db.PayrollComponents.FindAsync(new object[] { id }, ct);
            if (component == null) return NotFound(new { message = "Component not found." });

            component.Name = dto.Name;
            component.Type = dto.Type;
            component.CalculationType = dto.CalculationType ?? "FixedAmount";
            component.Amount = dto.Amount;
            component.Percentage = dto.Percentage;
            component.Formula = dto.Formula;
            component.PercentageBase = dto.PercentageBase ?? "Basic";
            component.IsStatutory = dto.IsStatutory;
            await _db.SaveChangesAsync(ct);
            return Ok(component);
        }

        /// <summary>DELETE api/v1/payroll/components/{id}</summary>
        [HttpDelete("api/v1/payroll/components/{id:guid}")]
        public async Task<IActionResult> DeleteComponent(Guid id, CancellationToken ct)
        {
            var component = await _db.PayrollComponents.FindAsync(new object[] { id }, ct);
            if (component == null) return NotFound(new { message = "Component not found." });
            component.IsDeleted = true;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Component deleted." });
        }
    }
}
