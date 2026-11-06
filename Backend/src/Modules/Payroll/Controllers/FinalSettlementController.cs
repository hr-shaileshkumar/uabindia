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
    /// Dedicated controller for Final Settlements (F&amp;F): compute, create, settle, export.
    /// Route: api/v1/payroll/settlements
    /// </summary>
    [ApiController]
    [Route("api/v1/payroll/settlements")]
    [Authorize]
    [Authorize(Policy = "Module:payroll")]
    public class FinalSettlementController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IPayrollSettlementService _settlements;

        public FinalSettlementController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IPayrollSettlementService settlements)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _settlements = settlements;
        }

        /// <summary>GET api/v1/payroll/settlements</summary>
        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] string? status,
            [FromQuery] Guid? employeeId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.PayrollFinalSettlements.AsNoTracking().Where(s => s.TenantId == tenantId && !s.IsDeleted);
            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(s => s.Status == status);
            if (employeeId.HasValue) query = query.Where(s => s.EmployeeId == employeeId.Value);

            var total = await query.CountAsync(ct);
            var items = await query.OrderByDescending(s => s.ExitDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
            return Ok(new { total, page, pageSize, items });
        }

        /// <summary>GET api/v1/payroll/settlements/{id}</summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var settlement = await _db.PayrollFinalSettlements.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId && !s.IsDeleted, ct);
            return settlement == null ? NotFound(new { message = "Settlement not found." }) : Ok(settlement);
        }

        /// <summary>POST api/v1/payroll/settlements/compute — preview F&amp;F calculation without saving</summary>
        [HttpPost("compute")]
        public async Task<IActionResult> Compute([FromBody] UpsertPayrollSettlementDto dto, CancellationToken ct)
        {
            try { return Ok(await _settlements.ComputeAsync(dto.EmployeeId, dto.ExitDate)); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        /// <summary>POST api/v1/payroll/settlements — initiate a full &amp; final settlement</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UpsertPayrollSettlementDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var employee = await _db.Employees.FirstOrDefaultAsync(e => e.Id == dto.EmployeeId && !e.IsDeleted, ct);
            if (employee == null) return BadRequest(new { message = "Employee not found." });

            var computed = await _settlements.ComputeAsync(employee.Id, dto.ExitDate);
            var gratuity = dto.Gratuity > 0 ? dto.Gratuity : computed.Gratuity;
            var leave = dto.LeaveEncashment > 0 ? dto.LeaveEncashment : computed.LeaveEncashment;
            var other = dto.OtherDues > 0 ? dto.OtherDues : computed.OtherDues;
            var recoveries = dto.Recoveries > 0 ? dto.Recoveries : computed.Recoveries;

            var row = new PayrollFinalSettlement
            {
                TenantId = _tenantAccessor.GetTenantId(),
                EmployeeId = employee.Id,
                EmployeeName = employee.FullName ?? employee.EmployeeCode ?? "Employee",
                ExitDate = dto.ExitDate,
                Gratuity = gratuity,
                LeaveEncashment = leave,
                OtherDues = other,
                Recoveries = recoveries,
                TotalSettlement = gratuity + leave + other - recoveries,
                Status = "Pending",
                Remarks = dto.Remarks ?? computed.Remarks,
                CreatedAt = DateTime.UtcNow
            };

            employee.Status = "Terminated";
            employee.ExitDate ??= dto.ExitDate;
            _db.PayrollFinalSettlements.Add(row);
            await _db.SaveChangesAsync(ct);
            return Ok(row);
        }

        /// <summary>PUT api/v1/payroll/settlements/{id} — update settlement amounts before settling</summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpsertPayrollSettlementDto dto, CancellationToken ct)
        {
            var row = await _db.PayrollFinalSettlements.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, ct);
            if (row == null) return NotFound(new { message = "Settlement not found." });
            if (row.Status == "Settled") return BadRequest(new { message = "Cannot update a settled F&F." });

            row.ExitDate = dto.ExitDate;
            row.Gratuity = dto.Gratuity;
            row.LeaveEncashment = dto.LeaveEncashment;
            row.OtherDues = dto.OtherDues;
            row.Recoveries = dto.Recoveries;
            row.TotalSettlement = dto.Gratuity + dto.LeaveEncashment + dto.OtherDues - dto.Recoveries;
            row.Remarks = dto.Remarks;
            row.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(row);
        }

        /// <summary>POST api/v1/payroll/settlements/{id}/settle — post settlement to GL and finalize</summary>
        [HttpPost("{id:guid}/settle")]
        public async Task<IActionResult> Settle(Guid id, CancellationToken ct)
        {
            try
            {
                var result = await _settlements.SettleAsync(id);
                return Ok(new { message = "Settlement posted to GL.", journalEntryId = result.JournalEntryId });
            }
            catch (KeyNotFoundException) { return NotFound(new { message = "Settlement not found." }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        /// <summary>DELETE api/v1/payroll/settlements/{id} — soft delete pending settlement</summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            var row = await _db.PayrollFinalSettlements.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, ct);
            if (row == null) return NotFound(new { message = "Settlement not found." });
            if (row.Status == "Settled") return BadRequest(new { message = "Cannot delete a settled F&F." });
            row.IsDeleted = true;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Settlement deleted." });
        }
    }
}
