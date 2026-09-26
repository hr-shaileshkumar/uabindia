using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/hrms/recruitment/staffing-plans")]
    [Route("api/v1/hrms/staffing-plans")]
    [Route("api/v1/staffing-plans")]
    [Authorize]
    public class StaffingPlansController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;

        public StaffingPlansController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? department = null, [FromQuery] int? year = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.StaffingPlans.AsNoTracking()
                .Where(p => p.TenantId == tenantId && !p.IsDeleted);

            if (!string.IsNullOrWhiteSpace(department))
                query = query.Where(p => p.Department == department);

            if (year.HasValue)
                query = query.Where(p => p.FiscalYear == year.Value);

            var plans = await query
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Id,
                    p.PlanCode,
                    p.PlanTitle,
                    p.Department,
                    p.Designation,
                    p.FiscalYear,
                    p.Quarter,
                    p.Budget,
                    p.CurrentHeadcount,
                    p.TargetHeadcount,
                    Vacancies = p.TargetHeadcount > p.CurrentHeadcount ? p.TargetHeadcount - p.CurrentHeadcount : 0,
                    p.HiredCount,
                    RemainingVacancies = Math.Max(0, p.TargetHeadcount - p.CurrentHeadcount - p.HiredCount),
                    p.Status,
                    p.ApprovedDate,
                    p.Remarks,
                    p.CreatedAt,
                    p.UpdatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = plans,
                items = plans,
                total = plans.Count
            });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var plan = await _db.StaffingPlans.AsNoTracking()
                .Where(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted)
                .Select(p => new
                {
                    p.Id,
                    p.PlanCode,
                    p.PlanTitle,
                    p.Department,
                    p.Designation,
                    p.FiscalYear,
                    p.Quarter,
                    p.Budget,
                    p.CurrentHeadcount,
                    p.TargetHeadcount,
                    Vacancies = p.TargetHeadcount > p.CurrentHeadcount ? p.TargetHeadcount - p.CurrentHeadcount : 0,
                    p.HiredCount,
                    RemainingVacancies = Math.Max(0, p.TargetHeadcount - p.CurrentHeadcount - p.HiredCount),
                    p.Status,
                    p.ApprovedDate,
                    p.Remarks,
                    p.CreatedAt,
                    p.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (plan == null)
                return NotFound(new { success = false, message = "Staffing plan not found" });

            return Ok(new { success = true, data = plan });
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateStaffingPlanDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Department))
                return BadRequest(new { success = false, message = "Department is required" });

            if (dto.TargetHeadcount <= 0)
                return BadRequest(new { success = false, message = "Target headcount must be greater than zero" });

            var tenantId = _tenantAccessor.GetTenantId();
            var year = dto.FiscalYear > 0 ? dto.FiscalYear : DateTime.UtcNow.Year;
            var planCode = await _numbers.NextAsync("StaffingPlan", $"SP-{year}-", 3);

            var plan = new StaffingPlan
            {
                TenantId = tenantId,
                PlanCode = planCode,
                PlanTitle = !string.IsNullOrWhiteSpace(dto.PlanTitle) ? dto.PlanTitle : $"{dto.Department} - {dto.Designation} ({year})",
                Department = dto.Department.Trim(),
                Designation = dto.Designation?.Trim() ?? "General",
                FiscalYear = year,
                Quarter = !string.IsNullOrWhiteSpace(dto.Quarter) ? dto.Quarter : "Annual",
                Budget = dto.Budget,
                CurrentHeadcount = Math.Max(0, dto.CurrentHeadcount),
                TargetHeadcount = dto.TargetHeadcount,
                HiredCount = 0,
                Status = "Draft",
                Remarks = dto.Remarks,
                CreatedAt = DateTime.UtcNow
            };

            _db.StaffingPlans.Add(plan);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Staffing plan created successfully",
                data = plan
            });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStaffingPlanDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var plan = await _db.StaffingPlans
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);

            if (plan == null)
                return NotFound(new { success = false, message = "Staffing plan not found" });

            if (!string.IsNullOrWhiteSpace(dto.PlanTitle)) plan.PlanTitle = dto.PlanTitle;
            if (!string.IsNullOrWhiteSpace(dto.Department)) plan.Department = dto.Department;
            if (!string.IsNullOrWhiteSpace(dto.Designation)) plan.Designation = dto.Designation;
            if (dto.Budget.HasValue) plan.Budget = dto.Budget.Value;
            if (dto.CurrentHeadcount.HasValue) plan.CurrentHeadcount = dto.CurrentHeadcount.Value;
            if (dto.TargetHeadcount.HasValue) plan.TargetHeadcount = dto.TargetHeadcount.Value;
            if (!string.IsNullOrWhiteSpace(dto.Quarter)) plan.Quarter = dto.Quarter;
            if (!string.IsNullOrWhiteSpace(dto.Status)) plan.Status = dto.Status;
            if (dto.Remarks != null) plan.Remarks = dto.Remarks;

            plan.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Staffing plan updated successfully",
                data = plan
            });
        }

        [HttpPost("{id:guid}/approve")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Approve(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var plan = await _db.StaffingPlans
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);

            if (plan == null)
                return NotFound(new { success = false, message = "Staffing plan not found" });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            plan.Status = "Approved";
            plan.ApprovedDate = DateTime.UtcNow;
            if (Guid.TryParse(userId, out var userGuid))
                plan.ApprovedBy = userGuid;
            plan.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new
            {
                success = true,
                message = "Staffing plan approved. Openings can now be linked and published.",
                data = plan
            });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var plan = await _db.StaffingPlans
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);

            if (plan == null)
                return NotFound(new { success = false, message = "Staffing plan not found" });

            plan.IsDeleted = true;
            plan.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Staffing plan deleted successfully" });
        }
    }

    public class CreateStaffingPlanDto
    {
        public string? PlanTitle { get; set; }
        public string Department { get; set; } = string.Empty;
        public string? Designation { get; set; }
        public int FiscalYear { get; set; }
        public string? Quarter { get; set; }
        public decimal Budget { get; set; }
        public int CurrentHeadcount { get; set; }
        public int TargetHeadcount { get; set; }
        public string? Remarks { get; set; }
    }

    public class UpdateStaffingPlanDto
    {
        public string? PlanTitle { get; set; }
        public string? Department { get; set; }
        public string? Designation { get; set; }
        public decimal? Budget { get; set; }
        public int? CurrentHeadcount { get; set; }
        public int? TargetHeadcount { get; set; }
        public string? Quarter { get; set; }
        public string? Status { get; set; }
        public string? Remarks { get; set; }
    }
}
