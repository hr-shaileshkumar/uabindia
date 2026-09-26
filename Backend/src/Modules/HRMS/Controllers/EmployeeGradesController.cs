using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
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
    [Route("api/v1/[controller]")]
    [Route("api/v1/hrms/grades")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class EmployeeGradesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public EmployeeGradesController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private Guid TenantId => _tenantAccessor.GetTenantId();

        private static readonly List<EmployeeGradeRecord> DefaultGrades = new()
        {
            new() { Id = "l1", Code = "L1", Name = "Junior Associate", Band = "Entry Level", MinCtc = 350000, MaxCtc = 600000, Order = 1, IsActive = true, Description = "Entry-level professional, graduate trainees and associates" },
            new() { Id = "l2", Code = "L2", Name = "Associate", Band = "Professional", MinCtc = 600000, MaxCtc = 1000000, Order = 2, IsActive = true, Description = "Core individual contributor with 1-3 years experience" },
            new() { Id = "l3", Code = "L3", Name = "Senior Associate", Band = "Senior Professional", MinCtc = 1000000, MaxCtc = 1600000, Order = 3, IsActive = true, Description = "Experienced specialist, leads small workstreams" },
            new() { Id = "l4", Code = "L4", Name = "Lead / Principal", Band = "Specialist", MinCtc = 1600000, MaxCtc = 2500000, Order = 4, IsActive = true, Description = "Subject matter expert and technical/domain lead" },
            new() { Id = "m1", Code = "M1", Name = "Manager", Band = "Management", MinCtc = 2200000, MaxCtc = 3500000, Order = 5, IsActive = true, Description = "People and project manager with team delivery ownership" },
            new() { Id = "m2", Code = "M2", Name = "Senior Manager", Band = "Senior Management", MinCtc = 3500000, MaxCtc = 5500000, Order = 6, IsActive = true, Description = "Departmental unit leader or major account director" },
            new() { Id = "e1", Code = "E1", Name = "Associate Director / VP", Band = "Executive Leadership", MinCtc = 5500000, MaxCtc = 9000000, Order = 7, IsActive = true, Description = "Strategic function lead and vice president" },
            new() { Id = "e2", Code = "E2", Name = "Senior VP / CXO", Band = "C-Suite Executive", MinCtc = 9000000, MaxCtc = 20000000, Order = 8, IsActive = true, Description = "Executive committee and CXO leadership band" }
        };

        private async Task<(TenantConfig Config, List<EmployeeGradeRecord> Grades)> GetOrCreateGradesAsync()
        {
            var tenantId = TenantId;
            var config = await _db.TenantConfigs.FirstOrDefaultAsync(c => c.TenantId == tenantId);
            if (config == null)
            {
                config = new TenantConfig { TenantId = tenantId, ConfigJson = "{}" };
                _db.TenantConfigs.Add(config);
            }

            var root = new Dictionary<string, object>();
            try
            {
                if (!string.IsNullOrWhiteSpace(config.ConfigJson) && config.ConfigJson != "{}")
                {
                    root = JsonSerializer.Deserialize<Dictionary<string, object>>(config.ConfigJson) ?? new();
                }
            }
            catch { }

            List<EmployeeGradeRecord> grades;
            if (root.TryGetValue("employeeGrades", out var raw) && raw != null)
            {
                var json = raw.ToString() ?? "[]";
                grades = JsonSerializer.Deserialize<List<EmployeeGradeRecord>>(json) ?? new();
            }
            else
            {
                // Seed defaults
                grades = DefaultGrades.Select(g => new EmployeeGradeRecord
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Code = g.Code,
                    Name = g.Name,
                    Band = g.Band,
                    MinCtc = g.MinCtc,
                    MaxCtc = g.MaxCtc,
                    Order = g.Order,
                    IsActive = g.IsActive,
                    Description = g.Description
                }).ToList();

                root["employeeGrades"] = grades;
                config.ConfigJson = JsonSerializer.Serialize(root);
                await _db.SaveChangesAsync();
            }

            return (config, grades);
        }

        private async Task SaveGradesAsync(TenantConfig config, List<EmployeeGradeRecord> grades)
        {
            var root = new Dictionary<string, object>();
            try
            {
                if (!string.IsNullOrWhiteSpace(config.ConfigJson) && config.ConfigJson != "{}")
                {
                    root = JsonSerializer.Deserialize<Dictionary<string, object>>(config.ConfigJson) ?? new();
                }
            }
            catch { }

            root["employeeGrades"] = grades;
            config.ConfigJson = JsonSerializer.Serialize(root);
            await _db.SaveChangesAsync();
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var (_, grades) = await GetOrCreateGradesAsync();
            var ordered = grades.OrderBy(g => g.Order).ThenBy(g => g.Code).ToList();
            return Ok(new { grades = ordered, total = ordered.Count });
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] EmployeeGradeRecord dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Code and Name are required." });

            var (config, grades) = await GetOrCreateGradesAsync();
            var codeUpper = dto.Code.Trim().ToUpperInvariant();

            if (grades.Any(g => g.Code.Equals(codeUpper, StringComparison.OrdinalIgnoreCase)))
                return Conflict(new { message = $"Grade with code '{codeUpper}' already exists." });

            var newGrade = new EmployeeGradeRecord
            {
                Id = Guid.NewGuid().ToString("N"),
                Code = codeUpper,
                Name = dto.Name.Trim(),
                Band = dto.Band?.Trim() ?? "General",
                MinCtc = Math.Max(0, dto.MinCtc),
                MaxCtc = Math.Max(dto.MinCtc, dto.MaxCtc),
                Order = dto.Order > 0 ? dto.Order : grades.Count + 1,
                IsActive = dto.IsActive,
                Description = dto.Description?.Trim()
            };

            grades.Add(newGrade);
            await SaveGradesAsync(config, grades);

            return Ok(newGrade);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(string id, [FromBody] EmployeeGradeRecord dto)
        {
            var (config, grades) = await GetOrCreateGradesAsync();
            var grade = grades.FirstOrDefault(g => g.Id.Equals(id, StringComparison.OrdinalIgnoreCase) || g.Code.Equals(id, StringComparison.OrdinalIgnoreCase));

            if (grade == null)
                return NotFound(new { message = "Employee grade not found." });

            if (!string.IsNullOrWhiteSpace(dto.Name)) grade.Name = dto.Name.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Band)) grade.Band = dto.Band.Trim();
            grade.MinCtc = Math.Max(0, dto.MinCtc);
            grade.MaxCtc = Math.Max(dto.MinCtc, dto.MaxCtc);
            grade.Order = dto.Order;
            grade.IsActive = dto.IsActive;
            grade.Description = dto.Description?.Trim();

            await SaveGradesAsync(config, grades);
            return Ok(grade);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(string id)
        {
            var (config, grades) = await GetOrCreateGradesAsync();
            var grade = grades.FirstOrDefault(g => g.Id.Equals(id, StringComparison.OrdinalIgnoreCase) || g.Code.Equals(id, StringComparison.OrdinalIgnoreCase));

            if (grade == null)
                return NotFound(new { message = "Employee grade not found." });

            grades.Remove(grade);
            await SaveGradesAsync(config, grades);

            return Ok(new { message = "Grade deleted successfully.", id });
        }

        [HttpPost("reset-defaults")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ResetDefaults()
        {
            var tenantId = TenantId;
            var config = await _db.TenantConfigs.FirstOrDefaultAsync(c => c.TenantId == tenantId);
            if (config == null)
            {
                config = new TenantConfig { TenantId = tenantId, ConfigJson = "{}" };
                _db.TenantConfigs.Add(config);
            }

            var grades = DefaultGrades.Select(g => new EmployeeGradeRecord
            {
                Id = Guid.NewGuid().ToString("N"),
                Code = g.Code,
                Name = g.Name,
                Band = g.Band,
                MinCtc = g.MinCtc,
                MaxCtc = g.MaxCtc,
                Order = g.Order,
                IsActive = g.IsActive,
                Description = g.Description
            }).ToList();

            await SaveGradesAsync(config, grades);
            return Ok(new { message = "Standard enterprise grade levels reset.", grades });
        }
    }

    public class EmployeeGradeRecord
    {
        public string Id { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Band { get; set; } = "General";
        public decimal MinCtc { get; set; }
        public decimal MaxCtc { get; set; }
        public int Order { get; set; } = 1;
        public bool IsActive { get; set; } = true;
        public string? Description { get; set; }
    }
}
