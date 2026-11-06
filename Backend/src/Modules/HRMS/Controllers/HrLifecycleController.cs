using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/hrms/lifecycle")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class HrLifecycleController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public HrLifecycleController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("tasks")]
        public async Task<IActionResult> List([FromQuery] string kind = "Onboarding", [FromQuery] Guid? employeeId = null)
        {
            var query = _db.HrLifecycleTasks.AsNoTracking().Where(t => t.Kind == kind);
            if (employeeId.HasValue) query = query.Where(t => t.EmployeeId == employeeId.Value);
            var tasks = await query.OrderBy(t => t.SortOrder).ThenBy(t => t.DueDate).ToListAsync();
            var employeeIds = tasks.Select(t => t.EmployeeId).Distinct().ToList();
            var employees = await _db.Employees.AsNoTracking()
                .Where(e => employeeIds.Contains(e.Id))
                .Select(e => new { e.Id, e.FullName, e.EmployeeCode, e.Status, e.DateOfJoining, e.ExitDate, e.DepartmentId })
                .ToListAsync();
            return Ok(new { tasks, employees });
        }

        [HttpPost("tasks/{id:guid}/complete")]
        public async Task<IActionResult> Complete(Guid id)
        {
            var task = await _db.HrLifecycleTasks.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);
            if (task == null) return NotFound();
            task.Status = "Completed";
            task.CompletedAt = DateTime.UtcNow;
            task.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(task);
        }

        [HttpPost("tasks")]
        public async Task<IActionResult> Create([FromBody] HrLifecycleTask dto)
        {
            if (dto.EmployeeId == Guid.Empty || string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { message = "Employee and title are required." });
            dto.TenantId = _tenantAccessor.GetTenantId();
            dto.Id = Guid.NewGuid();
            dto.CreatedAt = DateTime.UtcNow;
            dto.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Pending" : dto.Status;
            dto.Kind = string.IsNullOrWhiteSpace(dto.Kind) ? "Onboarding" : dto.Kind;
            _db.HrLifecycleTasks.Add(dto);
            await _db.SaveChangesAsync();
            return Ok(dto);
        }

        public class InitializeLifecycleRequestDto
        {
            public Guid EmployeeId { get; set; }
            public string LifecycleKind { get; set; } = "Onboarding";
        }

        [HttpPost("initialize")]
        public async Task<IActionResult> Initialize(
            [FromBody] InitializeLifecycleRequestDto req,
            [FromServices] IHrLifecycleService lifecycleService)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty || req.EmployeeId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Valid tenant and employeeId are required." });
            }

            var result = await lifecycleService.InitializeEmployeeLifecycleTasksAsync(
                tenantId,
                req.EmployeeId,
                req.LifecycleKind);

            return Ok(new { success = true, data = result });
        }
    }
}
