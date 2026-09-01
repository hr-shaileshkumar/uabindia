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
    [Route("api/v1/project-tasks")]
    [Authorize(Policy = "Module:projects")]
    public class ProjectTasksController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;

        public ProjectTasksController(ApplicationDbContext db, ITenantAccessor tenantAccessor, IDocumentNumberService numbers)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 50,
            [FromQuery] Guid? projectId = null,
            [FromQuery] string? status = null)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 50;
            if (limit > 100) limit = 100;

            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.ProjectTasks.AsNoTracking()
                .Where(t => t.TenantId == tenantId && !t.IsDeleted);

            if (projectId.HasValue)
                query = query.Where(t => t.ProjectId == projectId.Value);
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(t => t.Status == status);

            var total = await query.CountAsync();
            var rows = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(t => new
                {
                    t.Id,
                    t.CompanyId,
                    t.ProjectId,
                    t.TaskCode,
                    t.Title,
                    t.Description,
                    t.Status,
                    t.AssignedToEmployeeId,
                    t.AssignedToName,
                    t.CostCenterId,
                    t.DueDate,
                    t.EstimatedHours,
                    t.Priority,
                    t.CreatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = rows, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateProjectTaskDto dto)
        {
            if (dto.ProjectId == Guid.Empty || string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { success = false, error = "Project and title are required." });

            var tenantId = _tenantAccessor.GetTenantId();
            var project = await _db.Projects.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == dto.ProjectId && p.TenantId == tenantId && !p.IsDeleted);
            if (project == null)
                return BadRequest(new { success = false, error = "Project not found." });

            if (dto.CostCenterId.HasValue)
            {
                var ccOk = await _db.CostCenters.AnyAsync(c =>
                    c.Id == dto.CostCenterId.Value && c.TenantId == tenantId && !c.IsDeleted);
                if (!ccOk)
                    return BadRequest(new { success = false, error = "Cost centre not found." });
            }

            string? assigneeName = dto.AssignedToName;
            if (dto.AssignedToEmployeeId.HasValue)
            {
                var emp = await _db.Employees.AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == dto.AssignedToEmployeeId.Value && e.TenantId == tenantId && !e.IsDeleted);
                if (emp == null)
                    return BadRequest(new { success = false, error = "Assignee employee not found." });
                assigneeName ??= emp.FullName;
            }

            var task = new ProjectTask
            {
                TenantId = tenantId,
                CompanyId = dto.CompanyId != Guid.Empty ? dto.CompanyId : project.CompanyId,
                ProjectId = project.Id,
                TaskCode = string.IsNullOrWhiteSpace(dto.TaskCode)
                    ? await _numbers.NextAsync("ProjectTask", "TSK-", 5)
                    : dto.TaskCode.Trim(),
                Title = dto.Title.Trim(),
                Description = dto.Description,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Open" : dto.Status.Trim(),
                AssignedToEmployeeId = dto.AssignedToEmployeeId,
                AssignedToName = assigneeName,
                CostCenterId = dto.CostCenterId,
                DueDate = dto.DueDate,
                EstimatedHours = dto.EstimatedHours,
                Priority = dto.Priority is >= 1 and <= 3 ? dto.Priority : 2,
                CreatedAt = DateTime.UtcNow
            };

            _db.ProjectTasks.Add(task);
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Task created", data = task });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProjectTaskDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var task = await _db.ProjectTasks
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && !t.IsDeleted);
            if (task == null)
                return NotFound(new { success = false, error = "Task not found" });

            if (!string.IsNullOrWhiteSpace(dto.Title)) task.Title = dto.Title.Trim();
            if (dto.Description != null) task.Description = dto.Description;
            if (!string.IsNullOrWhiteSpace(dto.Status)) task.Status = dto.Status.Trim();
            if (dto.AssignedToEmployeeId.HasValue) task.AssignedToEmployeeId = dto.AssignedToEmployeeId;
            if (dto.AssignedToName != null) task.AssignedToName = dto.AssignedToName;
            if (dto.CostCenterId.HasValue) task.CostCenterId = dto.CostCenterId;
            if (dto.DueDate.HasValue) task.DueDate = dto.DueDate;
            if (dto.EstimatedHours.HasValue) task.EstimatedHours = dto.EstimatedHours;
            if (dto.Priority.HasValue && dto.Priority is >= 1 and <= 3) task.Priority = dto.Priority.Value;
            task.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Task updated", data = task });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var task = await _db.ProjectTasks
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && !t.IsDeleted);
            if (task == null)
                return NotFound(new { success = false, error = "Task not found" });

            task.IsDeleted = true;
            task.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Task deleted" });
        }
    }

    public class CreateProjectTaskDto
    {
        public Guid CompanyId { get; set; }
        public Guid ProjectId { get; set; }
        public string? TaskCode { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Status { get; set; }
        public Guid? AssignedToEmployeeId { get; set; }
        public string? AssignedToName { get; set; }
        public Guid? CostCenterId { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal? EstimatedHours { get; set; }
        public int Priority { get; set; } = 2;
    }

    public class UpdateProjectTaskDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        public Guid? AssignedToEmployeeId { get; set; }
        public string? AssignedToName { get; set; }
        public Guid? CostCenterId { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal? EstimatedHours { get; set; }
        public int? Priority { get; set; }
    }
}
