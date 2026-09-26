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
    /// Dedicated controller for Employee Bonuses.
    /// Route: api/v1/payroll/bonuses
    /// </summary>
    [ApiController]
    [Route("api/v1/payroll/bonuses")]
    [Authorize]
    [Authorize(Policy = "Module:payroll")]
    public class PayrollBonusController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IPayrollEmployeeFinanceService _employeeFinance;

        public PayrollBonusController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IPayrollEmployeeFinanceService employeeFinance)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _employeeFinance = employeeFinance;
        }

        /// <summary>GET api/v1/payroll/bonuses — list all bonuses</summary>
        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] Guid? employeeId,
            [FromQuery] string? status,
            [FromQuery] int? year,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.PayrollBonuses.AsNoTracking().Where(b => b.TenantId == tenantId && !b.IsDeleted);
            if (employeeId.HasValue) query = query.Where(b => b.EmployeeId == employeeId.Value);
            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(b => b.Status == status);
            if (year.HasValue) query = query.Where(b => b.PaymentMonth.Contains(year.Value.ToString()));

            var total = await query.CountAsync(ct);
            var items = await query.OrderByDescending(b => b.PaymentMonth).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
            return Ok(new { total, page, pageSize, items });
        }

        /// <summary>GET api/v1/payroll/bonuses/{id}</summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var bonus = await _db.PayrollBonuses.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id && b.TenantId == tenantId && !b.IsDeleted, ct);
            return bonus == null ? NotFound(new { message = "Bonus not found." }) : Ok(bonus);
        }

        /// <summary>POST api/v1/payroll/bonuses — create a bonus for an employee</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePayrollBonusDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var employee = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == dto.EmployeeId && !e.IsDeleted, ct);
            if (employee == null) return BadRequest(new { message = "Employee not found." });

            var bonus = new PayrollBonus
            {
                TenantId = _tenantAccessor.GetTenantId(),
                EmployeeId = employee.Id,
                EmployeeName = employee.FullName ?? employee.EmployeeCode ?? "Employee",
                EmployeeCode = employee.EmployeeCode ?? string.Empty,
                BonusType = dto.BonusType,
                Amount = dto.Amount,
                PaymentMonth = dto.PaymentMonth,
                Remarks = dto.Remarks,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };
            _db.PayrollBonuses.Add(bonus);
            await _db.SaveChangesAsync(ct);
            return Ok(bonus);
        }

        /// <summary>PUT api/v1/payroll/bonuses/{id} — update a pending bonus</summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreatePayrollBonusDto dto, CancellationToken ct)
        {
            var bonus = await _db.PayrollBonuses.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct);
            if (bonus == null) return NotFound(new { message = "Bonus not found." });
            if (bonus.Status == "Paid") return BadRequest(new { message = "Cannot update a paid bonus." });

            bonus.BonusType = dto.BonusType;
            bonus.Amount = dto.Amount;
            bonus.PaymentMonth = dto.PaymentMonth;
            bonus.Remarks = dto.Remarks;
            bonus.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(bonus);
        }

        /// <summary>POST api/v1/payroll/bonuses/{id}/approve — approve a bonus</summary>
        [HttpPost("{id:guid}/approve")]
        public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
        {
            try { await _employeeFinance.ApproveBonusAsync(id); return Ok(new { message = "Bonus approved." }); }
            catch (KeyNotFoundException) { return NotFound(new { message = "Bonus not found." }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        /// <summary>POST api/v1/payroll/bonuses/{id}/pay — mark a bonus as paid</summary>
        [HttpPost("{id:guid}/pay")]
        public async Task<IActionResult> Pay(Guid id, CancellationToken ct)
        {
            try { await _employeeFinance.PayBonusAsync(id); return Ok(new { message = "Bonus marked as paid and posted to GL." }); }
            catch (KeyNotFoundException) { return NotFound(new { message = "Bonus not found." }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        /// <summary>DELETE api/v1/payroll/bonuses/{id} — soft delete a pending bonus</summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            var bonus = await _db.PayrollBonuses.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct);
            if (bonus == null) return NotFound(new { message = "Bonus not found." });
            if (bonus.Status == "Paid") return BadRequest(new { message = "Cannot delete a paid bonus." });
            bonus.IsDeleted = true;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Bonus deleted." });
        }
    }
}
