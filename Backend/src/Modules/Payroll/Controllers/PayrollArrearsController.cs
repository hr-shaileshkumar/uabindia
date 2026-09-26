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
    /// Dedicated controller for Salary Arrears: create, list, approve, process.
    /// Route: api/v1/payroll/arrears
    /// </summary>
    [ApiController]
    [Route("api/v1/payroll/arrears")]
    [Authorize]
    [Authorize(Policy = "Module:payroll")]
    public class PayrollArrearsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IPayrollEmployeeFinanceService _employeeFinance;

        public PayrollArrearsController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IPayrollEmployeeFinanceService employeeFinance)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _employeeFinance = employeeFinance;
        }

        /// <summary>GET api/v1/payroll/arrears</summary>
        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] Guid? employeeId,
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.PayrollArrears.AsNoTracking().Where(a => a.TenantId == tenantId && !a.IsDeleted);
            if (employeeId.HasValue) query = query.Where(a => a.EmployeeId == employeeId.Value);
            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(a => a.Status == status);

            var total = await query.CountAsync(ct);
            var items = await query.OrderByDescending(a => a.Period).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
            return Ok(new { total, page, pageSize, items });
        }

        /// <summary>GET api/v1/payroll/arrears/{id}</summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var arrear = await _db.PayrollArrears.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId && !a.IsDeleted, ct);
            return arrear == null ? NotFound(new { message = "Arrears entry not found." }) : Ok(arrear);
        }

        /// <summary>POST api/v1/payroll/arrears — create an arrears entry</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePayrollArrearDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var employee = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == dto.EmployeeId && !e.IsDeleted, ct);
            if (employee == null) return BadRequest(new { message = "Employee not found." });

            var arrear = new PayrollArrear
            {
                TenantId = _tenantAccessor.GetTenantId(),
                EmployeeId = employee.Id,
                EmployeeName = employee.FullName ?? employee.EmployeeCode ?? "Employee",
                EmployeeCode = employee.EmployeeCode ?? string.Empty,
                Period = dto.Period,
                Amount = dto.Amount,
                Reason = dto.Reason,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };
            _db.PayrollArrears.Add(arrear);
            await _db.SaveChangesAsync(ct);
            return Ok(arrear);
        }

        /// <summary>PUT api/v1/payroll/arrears/{id} — update pending arrear</summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreatePayrollArrearDto dto, CancellationToken ct)
        {
            var arrear = await _db.PayrollArrears.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted, ct);
            if (arrear == null) return NotFound(new { message = "Arrears entry not found." });
            if (arrear.Status != "Pending") return BadRequest(new { message = "Only pending arrears can be updated." });

            arrear.Period = dto.Period;
            arrear.Amount = dto.Amount;
            arrear.Reason = dto.Reason;
            arrear.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(arrear);
        }

        /// <summary>POST api/v1/payroll/arrears/{id}/approve</summary>
        [HttpPost("{id:guid}/approve")]
        public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
        {
            try { await _employeeFinance.ApproveArrearAsync(id); return Ok(new { message = "Arrear approved." }); }
            catch (KeyNotFoundException) { return NotFound(new { message = "Arrears entry not found." }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        /// <summary>POST api/v1/payroll/arrears/{id}/process — process arrear in next payroll run</summary>
        [HttpPost("{id:guid}/process")]
        public async Task<IActionResult> Process(Guid id, CancellationToken ct)
        {
            try { await _employeeFinance.ProcessArrearAsync(id); return Ok(new { message = "Arrear processed." }); }
            catch (KeyNotFoundException) { return NotFound(new { message = "Arrears entry not found." }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        /// <summary>DELETE api/v1/payroll/arrears/{id}</summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            var arrear = await _db.PayrollArrears.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted, ct);
            if (arrear == null) return NotFound(new { message = "Arrears entry not found." });
            if (arrear.Status != "Pending") return BadRequest(new { message = "Only pending arrears can be deleted." });
            arrear.IsDeleted = true;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Arrear deleted." });
        }
    }
}
