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
    /// Dedicated controller for Employee Income Tax Declarations (IT Dec / Form 12BB).
    /// Route: api/v1/payroll/tax-declarations
    /// </summary>
    [ApiController]
    [Route("api/v1/payroll/tax-declarations")]
    [Route("api/v1/hrms/payroll/tax-declarations")]
    [Authorize]
    [Authorize(Policy = "Module:payroll")]
    public class TaxDeclarationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public TaxDeclarationsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        /// <summary>GET api/v1/payroll/tax-declarations — list all IT declarations</summary>
        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] Guid? employeeId,
            [FromQuery] int? financialYear,
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.TaxDeclarations.AsNoTracking().Where(t => t.TenantId == tenantId && !t.IsDeleted);
            if (employeeId.HasValue) query = query.Where(t => t.EmployeeId == employeeId.Value);
            if (financialYear.HasValue) query = query.Where(t => t.FinancialYear == financialYear.Value);
            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(t => t.Status.ToString() == status);

            var total = await query.CountAsync(ct);
            var items = await query.OrderByDescending(t => t.FinancialYear).ThenBy(t => t.EmployeeName)
                .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
            return Ok(new { total, page, pageSize, items });
        }

        /// <summary>GET api/v1/payroll/tax-declarations/me — current employee's own declarations</summary>
        [HttpGet("me")]
        public async Task<IActionResult> Mine(CancellationToken ct)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();
            var employeeId = await _db.Employees.AsNoTracking()
                .Where(e => e.UserId == userId && !e.IsDeleted).Select(e => e.Id).FirstOrDefaultAsync(ct);
            if (employeeId == Guid.Empty) return NotFound(new { message = "No employee record found." });

            var items = await _db.TaxDeclarations.AsNoTracking()
                .Where(t => t.EmployeeId == employeeId && !t.IsDeleted)
                .OrderByDescending(t => t.FinancialYear).ToListAsync(ct);
            return Ok(items);
        }

        /// <summary>GET api/v1/payroll/tax-declarations/{id}</summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var record = await _db.TaxDeclarations.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && !t.IsDeleted, ct);
            return record == null ? NotFound(new { message = "Declaration not found." }) : Ok(record);
        }

        /// <summary>POST api/v1/payroll/tax-declarations — submit IT declaration (employee self-service)</summary>
        [HttpPost]
        public async Task<IActionResult> Submit([FromBody] UpsertPayrollTaxDeclarationDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var employee = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == dto.EmployeeId && !e.IsDeleted, ct);
            if (employee == null) return BadRequest(new { message = "Employee not found." });

            var existing = await _db.TaxDeclarations.FirstOrDefaultAsync(t => t.EmployeeId == dto.EmployeeId && t.FinancialYear == dto.FinancialYear && !t.IsDeleted, ct);
            if (existing != null) return BadRequest(new { message = $"Declaration for FY {dto.FinancialYear} already exists. Use PUT to update." });

            var decl = new TaxDeclaration
            {
                TenantId = _tenantAccessor.GetTenantId(),
                EmployeeId = employee.Id,
                EmployeeName = employee.FullName ?? employee.EmployeeCode ?? "Employee",
                EmployeeNumber = employee.EmployeeCode ?? string.Empty,
                DepartmentId = employee.DepartmentId ?? Guid.Empty,
                FinancialYear = dto.FinancialYear,
                DeclarationDate = DateTime.UtcNow,
                Section80C_Total = dto.Section80C_Total,
                Section80D_Total = dto.Section80D_Total,
                Section80G_Donation = dto.Section80G_Donation,
                RentPaid = dto.RentPaid,
                ProofSubmitted = dto.ProofSubmitted,
                Status = dto.ProofSubmitted ? DeclarationStatus.ProofSubmitted : DeclarationStatus.Declared
            };
            _db.TaxDeclarations.Add(decl);
            await _db.SaveChangesAsync(ct);
            return Ok(decl);
        }

        /// <summary>PUT api/v1/payroll/tax-declarations/{id} — update an existing declaration</summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpsertPayrollTaxDeclarationDto dto, CancellationToken ct)
        {
            var record = await _db.TaxDeclarations.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
            if (record == null) return NotFound(new { message = "Declaration not found." });
            if (record.Status == DeclarationStatus.Verified) return BadRequest(new { message = "Cannot update a verified declaration." });

            record.Section80C_Total = dto.Section80C_Total;
            record.Section80D_Total = dto.Section80D_Total;
            record.Section80G_Donation = dto.Section80G_Donation;
            record.RentPaid = dto.RentPaid;
            record.ProofSubmitted = dto.ProofSubmitted;
            record.Status = dto.ProofSubmitted ? DeclarationStatus.ProofSubmitted : DeclarationStatus.Declared;
            record.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(record);
        }

        /// <summary>POST api/v1/payroll/tax-declarations/{id}/approve — HR approves the declaration</summary>
        [HttpPost("{id:guid}/approve")]
        public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
        {
            var record = await _db.TaxDeclarations.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
            if (record == null) return NotFound(new { message = "Declaration not found." });
            record.Status = DeclarationStatus.Verified;
            record.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Declaration approved." });
        }

        /// <summary>POST api/v1/payroll/tax-declarations/{id}/finalize — lock declaration for the financial year</summary>
        [HttpPost("{id:guid}/finalize")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Finalize(Guid id, CancellationToken ct)
        {
            var record = await _db.TaxDeclarations.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
            if (record == null) return NotFound(new { message = "Declaration not found." });
            record.Status = DeclarationStatus.Verified;
            record.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Declaration finalized. No further changes allowed." });
        }

        /// <summary>GET api/v1/payroll/tax-declarations/summary — FY-level tax summary across all employees</summary>
        [HttpGet("summary")]
        public async Task<IActionResult> Summary([FromQuery] int financialYear, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var items = await _db.TaxDeclarations.AsNoTracking()
                .Where(t => t.TenantId == tenantId && t.FinancialYear == financialYear && !t.IsDeleted)
                .Select(t => new { t.EmployeeId, t.EmployeeName, t.EmployeeNumber, t.Section80C_Total, t.Section80D_Total, t.Section80G_Donation, t.RentPaid, t.Status })
                .ToListAsync(ct);

            return Ok(new
            {
                financialYear,
                totalEmployees = items.Count,
                verifiedCount = items.Count(x => x.Status == DeclarationStatus.Verified),
                pendingCount = items.Count(x => x.Status != DeclarationStatus.Verified),
                total80C = items.Sum(x => x.Section80C_Total),
                total80D = items.Sum(x => x.Section80D_Total),
                items
            });
        }

        private Guid GetUserId()
        {
            var raw = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value;
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }
    }
}
