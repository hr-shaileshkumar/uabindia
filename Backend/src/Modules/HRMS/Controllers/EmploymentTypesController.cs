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
    [Route("api/v1/hrms/employment-types")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class EmploymentTypesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public EmploymentTypesController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private Guid TenantId => _tenantAccessor.GetTenantId();

        private static readonly List<EmploymentTypeRecord> DefaultEmploymentTypes = new()
        {
            new() { Id = "perm", Code = "FT_PERM", Name = "Full-Time Permanent", Category = "Regular", NoticePeriodDays = 60, BenefitsEligible = true, IsActive = true, Description = "Standard permanent direct-hire employee with full statutory and PF/ESI benefits" },
            new() { Id = "prob", Code = "PROBATION", Name = "Probationary Employee", Category = "Regular", NoticePeriodDays = 30, BenefitsEligible = true, IsActive = true, Description = "New joinee serving mandatory confirmation evaluation probation" },
            new() { Id = "cont", Code = "CONTRACT", Name = "Fixed-Term Contract", Category = "Contractor", NoticePeriodDays = 30, BenefitsEligible = false, IsActive = true, Description = "Time-bound employment agreement for project-specific staffing" },
            new() { Id = "intn", Code = "INTERN", Name = "Graduate Intern / Trainee", Category = "Intern", NoticePeriodDays = 15, BenefitsEligible = false, IsActive = true, Description = "Stipend-based trainee or student internship under apprenticeship terms" },
            new() { Id = "part", Code = "PART_TIME", Name = "Part-Time Employee", Category = "Regular", NoticePeriodDays = 30, BenefitsEligible = true, IsActive = true, Description = "Regular scheduled workforce working prorated shifts/hours" },
            new() { Id = "exec", Code = "EXECUTIVE", Name = "Executive Leadership", Category = "Executive", NoticePeriodDays = 90, BenefitsEligible = true, IsActive = true, Description = "Senior management executive with special contractual covenants" },
            new() { Id = "cons", Code = "CONSULTANT", Name = "Retainer / Consultant", Category = "Consultant", NoticePeriodDays = 15, BenefitsEligible = false, IsActive = true, Description = "Independent professional retainer under vendor/service agreement" }
        };

        private async Task<(TenantConfig Config, List<EmploymentTypeRecord> Items)> GetOrCreateItemsAsync()
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

            List<EmploymentTypeRecord> items;
            if (root.TryGetValue("employmentTypes", out var raw) && raw != null)
            {
                var json = raw.ToString() ?? "[]";
                items = JsonSerializer.Deserialize<List<EmploymentTypeRecord>>(json) ?? new();
            }
            else
            {
                items = DefaultEmploymentTypes.Select(e => new EmploymentTypeRecord
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Code = e.Code,
                    Name = e.Name,
                    Category = e.Category,
                    NoticePeriodDays = e.NoticePeriodDays,
                    BenefitsEligible = e.BenefitsEligible,
                    IsActive = e.IsActive,
                    Description = e.Description
                }).ToList();

                root["employmentTypes"] = items;
                config.ConfigJson = JsonSerializer.Serialize(root);
                await _db.SaveChangesAsync();
            }

            return (config, items);
        }

        private async Task SaveItemsAsync(TenantConfig config, List<EmploymentTypeRecord> items)
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

            root["employmentTypes"] = items;
            config.ConfigJson = JsonSerializer.Serialize(root);
            await _db.SaveChangesAsync();
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var (_, items) = await GetOrCreateItemsAsync();
            var ordered = items.OrderBy(e => e.Category).ThenBy(e => e.Name).ToList();
            return Ok(new { employmentTypes = ordered, total = ordered.Count });
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] EmploymentTypeRecord dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Code and Name are required." });

            var (config, items) = await GetOrCreateItemsAsync();
            var codeUpper = dto.Code.Trim().ToUpperInvariant();

            if (items.Any(e => e.Code.Equals(codeUpper, StringComparison.OrdinalIgnoreCase)))
                return Conflict(new { message = $"Employment type with code '{codeUpper}' already exists." });

            var newItem = new EmploymentTypeRecord
            {
                Id = Guid.NewGuid().ToString("N"),
                Code = codeUpper,
                Name = dto.Name.Trim(),
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "Regular" : dto.Category.Trim(),
                NoticePeriodDays = Math.Max(0, dto.NoticePeriodDays),
                BenefitsEligible = dto.BenefitsEligible,
                IsActive = dto.IsActive,
                Description = dto.Description?.Trim()
            };

            items.Add(newItem);
            await SaveItemsAsync(config, items);

            return Ok(newItem);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(string id, [FromBody] EmploymentTypeRecord dto)
        {
            var (config, items) = await GetOrCreateItemsAsync();
            var item = items.FirstOrDefault(e => e.Id.Equals(id, StringComparison.OrdinalIgnoreCase) || e.Code.Equals(id, StringComparison.OrdinalIgnoreCase));

            if (item == null)
                return NotFound(new { message = "Employment type not found." });

            if (!string.IsNullOrWhiteSpace(dto.Name)) item.Name = dto.Name.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Category)) item.Category = dto.Category.Trim();
            item.NoticePeriodDays = Math.Max(0, dto.NoticePeriodDays);
            item.BenefitsEligible = dto.BenefitsEligible;
            item.IsActive = dto.IsActive;
            item.Description = dto.Description?.Trim();

            await SaveItemsAsync(config, items);
            return Ok(item);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(string id)
        {
            var (config, items) = await GetOrCreateItemsAsync();
            var item = items.FirstOrDefault(e => e.Id.Equals(id, StringComparison.OrdinalIgnoreCase) || e.Code.Equals(id, StringComparison.OrdinalIgnoreCase));

            if (item == null)
                return NotFound(new { message = "Employment type not found." });

            items.Remove(item);
            await SaveItemsAsync(config, items);

            return Ok(new { message = "Employment type deleted successfully.", id });
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

            var items = DefaultEmploymentTypes.Select(e => new EmploymentTypeRecord
            {
                Id = Guid.NewGuid().ToString("N"),
                Code = e.Code,
                Name = e.Name,
                Category = e.Category,
                NoticePeriodDays = e.NoticePeriodDays,
                BenefitsEligible = e.BenefitsEligible,
                IsActive = e.IsActive,
                Description = e.Description
            }).ToList();

            await SaveItemsAsync(config, items);
            return Ok(new { message = "Standard employment types reset.", employmentTypes = items });
        }
    }

    public class EmploymentTypeRecord
    {
        public string Id { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = "Regular";
        public int NoticePeriodDays { get; set; } = 30;
        public bool BenefitsEligible { get; set; } = true;
        public bool IsActive { get; set; } = true;
        public string? Description { get; set; }
    }
}
