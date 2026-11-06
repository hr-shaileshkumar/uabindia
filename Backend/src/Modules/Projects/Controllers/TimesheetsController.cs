using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Projects.Controllers
{
    [ApiController]
    [Route("api/v1/timesheets")]
    [Authorize(Policy = "Module:projects")]
    public class TimesheetsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ITimesheetService _timesheets;

        public TimesheetsController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ITimesheetService timesheets)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _timesheets = timesheets;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 50,
            [FromQuery] Guid? projectId = null,
            [FromQuery] Guid? employeeId = null,
            [FromQuery] string? status = null)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 50;
            if (limit > 100) limit = 100;

            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.TimesheetEntries.AsNoTracking()
                .Where(t => t.TenantId == tenantId && !t.IsDeleted);

            if (projectId.HasValue)
                query = query.Where(t => t.ProjectId == projectId.Value);
            if (employeeId.HasValue)
                query = query.Where(t => t.EmployeeId == employeeId.Value);
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(t => t.Status == status);

            var total = await query.CountAsync();
            var rows = await query
                .OrderByDescending(t => t.WorkDate)
                .ThenByDescending(t => t.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(t => new
                {
                    t.Id,
                    t.CompanyId,
                    t.EmployeeId,
                    t.EmployeeName,
                    t.ProjectId,
                    t.ProjectTaskId,
                    t.CostCenterId,
                    t.WorkDate,
                    t.Hours,
                    t.Notes,
                    t.Status,
                    t.ApprovedBy,
                    t.SubmittedAt,
                    t.CreatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = rows, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTimesheetEntryDto dto)
        {
            if (dto.ProjectId == Guid.Empty || dto.EmployeeId == Guid.Empty || dto.Hours <= 0)
                return BadRequest(new { success = false, error = "Employee, project, and positive hours are required." });

            var tenantId = _tenantAccessor.GetTenantId();
            var project = await _db.Projects.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == dto.ProjectId && p.TenantId == tenantId && !p.IsDeleted);
            if (project == null)
                return BadRequest(new { success = false, error = "Project not found." });

            var employee = await _db.Employees.AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == dto.EmployeeId && e.TenantId == tenantId && !e.IsDeleted);
            if (employee == null)
                return BadRequest(new { success = false, error = "Employee not found." });

            if (dto.ProjectTaskId.HasValue)
            {
                var taskOk = await _db.ProjectTasks.AnyAsync(t =>
                    t.Id == dto.ProjectTaskId.Value && t.TenantId == tenantId && !t.IsDeleted && t.ProjectId == dto.ProjectId);
                if (!taskOk)
                    return BadRequest(new { success = false, error = "Task not found for this project." });
            }

            if (dto.CostCenterId.HasValue)
            {
                var ccOk = await _db.CostCenters.AnyAsync(c =>
                    c.Id == dto.CostCenterId.Value && c.TenantId == tenantId && !c.IsDeleted);
                if (!ccOk)
                    return BadRequest(new { success = false, error = "Cost centre not found." });
            }

            var status = string.IsNullOrWhiteSpace(dto.Status) ? "Submitted" : dto.Status.Trim();
            var entry = new TimesheetEntry
            {
                TenantId = tenantId,
                CompanyId = dto.CompanyId != Guid.Empty ? dto.CompanyId : project.CompanyId,
                EmployeeId = employee.Id,
                EmployeeName = string.IsNullOrWhiteSpace(dto.EmployeeName) ? (employee.FullName ?? employee.EmployeeCode ?? "") : dto.EmployeeName,
                ProjectId = project.Id,
                ProjectTaskId = dto.ProjectTaskId,
                CostCenterId = dto.CostCenterId,
                WorkDate = dto.WorkDate == default ? DateTime.UtcNow.Date : dto.WorkDate.Date,
                Hours = dto.Hours,
                Notes = dto.Notes,
                Status = status,
                SubmittedAt = status is "Submitted" or "Approved" ? DateTime.UtcNow : null,
                CreatedAt = DateTime.UtcNow
            };

            _db.TimesheetEntries.Add(entry);
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Timesheet entry created", data = entry });
        }

        [HttpPost("{id}/submit")]
        public async Task<IActionResult> Submit(Guid id)
        {
            try
            {
                var entry = await _timesheets.SubmitAsync(id);
                return Ok(new { success = true, message = "Timesheet submitted", data = entry });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, error = "Timesheet entry not found" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPost("{id}/approve")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Approve(Guid id)
        {
            try
            {
                var actor = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? User.Identity?.Name
                    ?? "admin";
                var entry = await _timesheets.ApproveAsync(id, actor);
                return Ok(new { success = true, message = "Timesheet approved", data = entry });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, error = "Timesheet entry not found" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var entry = await _db.TimesheetEntries
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && !t.IsDeleted);
            if (entry == null)
                return NotFound(new { success = false, error = "Timesheet entry not found" });

            entry.IsDeleted = true;
            entry.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Timesheet entry deleted" });
        }
    }

    public class CreateTimesheetEntryDto
    {
        public Guid CompanyId { get; set; }
        public Guid EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public Guid ProjectId { get; set; }
        public Guid? ProjectTaskId { get; set; }
        public Guid? CostCenterId { get; set; }
        public DateTime WorkDate { get; set; }
        public decimal Hours { get; set; }
        public string? Notes { get; set; }
        public string? Status { get; set; }
    }
}
