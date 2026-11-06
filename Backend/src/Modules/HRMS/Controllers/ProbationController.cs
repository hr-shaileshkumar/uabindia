using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Api.Modules.Administration.Controllers;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/hrms/probation")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class ProbationController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public ProbationController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        // ===== CONFIRMATION & PROBATION POLICIES (DATABASE DRIVEN) =====

        [HttpGet("policies")]
        public async Task<IActionResult> GetPolicies([FromQuery] Guid? companyId = null, [FromQuery] Guid? projectId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var exists = await _db.ProbationPolicies.AnyAsync(p => p.TenantId == tenantId && !p.IsDeleted);
            if (!exists)
            {
                var defaultPol = new ProbationPolicy
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    Name = "Standard Statutory Confirmation & Probation Policy",
                    Description = "Statutory 3-month probation policy with 15-day notice period during probation, 60-day notice on confirmation, and mandatory manager review.",
                    IsDefault = true,
                    DefaultProbationMonths = 3,
                    MaxExtensionMonths = 3,
                    NoticePeriodDaysProbation = 15,
                    NoticePeriodDaysConfirmed = 60,
                    EvaluationReminderDaysBeforeEnd = 15,
                    RequiresManagerReview = true,
                    RequiresHodApproval = true,
                    AutoConfirmationAllowed = false,
                    MinimumReviewScoreForConfirmation = 70,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                };
                _db.ProbationPolicies.Add(defaultPol);
                await _db.SaveChangesAsync();
            }

            var query = _db.ProbationPolicies
                .AsNoTracking()
                .Where(p => p.TenantId == tenantId && !p.IsDeleted);

            if (projectId.HasValue)
            {
                query = query.Where(p => p.ProjectId == projectId.Value || p.ProjectId == null);
            }
            else if (companyId.HasValue)
            {
                query = query.Where(p => p.CompanyId == companyId.Value || (p.CompanyId == null && p.ProjectId == null));
            }

            var policies = await query
                .OrderByDescending(p => p.IsDefault)
                .ThenBy(p => p.Name)
                .ToListAsync();

            return Ok(policies);
        }

        [HttpGet("policies/schema")]
        public async Task<IActionResult> GetPolicySchema([FromQuery] Guid? companyId = null, [FromQuery] Guid? projectId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            await PoliciesController.EnsurePolicyRuleDefinitionsSeededAsync(_db, tenantId);

            var defs = await _db.PolicyRuleDefinitions
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && !d.IsDeleted && d.IsVisible && d.Category == "HR_CORE")
                .OrderBy(d => d.DisplayOrder)
                .ToListAsync();

            var resolvedFields = PoliciesController.ResolveFieldDefinitions(defs, companyId, projectId);
            var defaultsDict = resolvedFields.ToDictionary(f => (string)f.key, f => (object)f.defaultValue);

            var schema = new
            {
                category = "HR_CORE",
                policyType = "ProbationPolicy",
                scope = new { companyId, projectId },
                defaults = defaultsDict,
                fieldDefinitions = resolvedFields
            };

            return Ok(schema);
        }

        [HttpGet("policies/default")]
        public async Task<IActionResult> GetDefaultPolicy()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.ProbationPolicies
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.IsDefault && !p.IsDeleted)
                ?? await _db.ProbationPolicies
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.TenantId == tenantId && !p.IsDeleted);

            return policy == null ? NotFound() : Ok(policy);
        }

        [HttpGet("policies/{id:guid}")]
        public async Task<IActionResult> GetPolicyById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.ProbationPolicies
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Id == id && !p.IsDeleted);

            return policy == null ? NotFound() : Ok(policy);
        }

        [HttpPost("policies")]
        public async Task<IActionResult> CreatePolicy([FromBody] CreateProbationPolicyDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Policy name is required." });

            var tenantId = _tenantAccessor.GetTenantId();

            if (dto.IsDefault)
            {
                var currentDefaults = await _db.ProbationPolicies
                    .Where(p => p.TenantId == tenantId && p.IsDefault)
                    .ToListAsync();
                foreach (var cd in currentDefaults) cd.IsDefault = false;
            }

            var entity = new ProbationPolicy
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                IsDefault = dto.IsDefault,
                DefaultProbationMonths = dto.DefaultProbationMonths > 0 ? dto.DefaultProbationMonths : 3,
                MaxExtensionMonths = dto.MaxExtensionMonths >= 0 ? dto.MaxExtensionMonths : 3,
                NoticePeriodDaysProbation = dto.NoticePeriodDaysProbation >= 0 ? dto.NoticePeriodDaysProbation : 15,
                NoticePeriodDaysConfirmed = dto.NoticePeriodDaysConfirmed >= 0 ? dto.NoticePeriodDaysConfirmed : 60,
                EvaluationReminderDaysBeforeEnd = dto.EvaluationReminderDaysBeforeEnd >= 0 ? dto.EvaluationReminderDaysBeforeEnd : 15,
                RequiresManagerReview = dto.RequiresManagerReview,
                RequiresHodApproval = dto.RequiresHodApproval,
                AutoConfirmationAllowed = dto.AutoConfirmationAllowed,
                MinimumReviewScoreForConfirmation = dto.MinimumReviewScoreForConfirmation >= 0 ? dto.MinimumReviewScoreForConfirmation : 70,
                CompanyId = dto.CompanyId,
                ProjectId = dto.ProjectId,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status,
                CreatedAt = DateTime.UtcNow
            };

            _db.ProbationPolicies.Add(entity);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, data = entity });
        }

        [HttpPut("policies/{id:guid}")]
        public async Task<IActionResult> UpdatePolicy(Guid id, [FromBody] UpdateProbationPolicyDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.ProbationPolicies.FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Id == id && !p.IsDeleted);
            if (policy == null) return NotFound();

            if (dto.IsDefault && !policy.IsDefault)
            {
                var currentDefaults = await _db.ProbationPolicies
                    .Where(p => p.TenantId == tenantId && p.IsDefault && p.Id != id)
                    .ToListAsync();
                foreach (var cd in currentDefaults) cd.IsDefault = false;
            }

            if (!string.IsNullOrWhiteSpace(dto.Name)) policy.Name = dto.Name.Trim();
            if (dto.Description != null) policy.Description = dto.Description.Trim();
            policy.IsDefault = dto.IsDefault;
            if (dto.DefaultProbationMonths.HasValue && dto.DefaultProbationMonths.Value > 0)
                policy.DefaultProbationMonths = dto.DefaultProbationMonths.Value;
            if (dto.MaxExtensionMonths.HasValue && dto.MaxExtensionMonths.Value >= 0)
                policy.MaxExtensionMonths = dto.MaxExtensionMonths.Value;
            if (dto.NoticePeriodDaysProbation.HasValue && dto.NoticePeriodDaysProbation.Value >= 0)
                policy.NoticePeriodDaysProbation = dto.NoticePeriodDaysProbation.Value;
            if (dto.NoticePeriodDaysConfirmed.HasValue && dto.NoticePeriodDaysConfirmed.Value >= 0)
                policy.NoticePeriodDaysConfirmed = dto.NoticePeriodDaysConfirmed.Value;
            if (dto.EvaluationReminderDaysBeforeEnd.HasValue && dto.EvaluationReminderDaysBeforeEnd.Value >= 0)
                policy.EvaluationReminderDaysBeforeEnd = dto.EvaluationReminderDaysBeforeEnd.Value;
            if (dto.RequiresManagerReview.HasValue)
                policy.RequiresManagerReview = dto.RequiresManagerReview.Value;
            if (dto.RequiresHodApproval.HasValue)
                policy.RequiresHodApproval = dto.RequiresHodApproval.Value;
            if (dto.AutoConfirmationAllowed.HasValue)
                policy.AutoConfirmationAllowed = dto.AutoConfirmationAllowed.Value;
            if (dto.MinimumReviewScoreForConfirmation.HasValue && dto.MinimumReviewScoreForConfirmation.Value >= 0)
                policy.MinimumReviewScoreForConfirmation = dto.MinimumReviewScoreForConfirmation.Value;
            if (dto.CompanyId.HasValue) policy.CompanyId = dto.CompanyId;
            if (dto.ProjectId.HasValue) policy.ProjectId = dto.ProjectId;
            if (!string.IsNullOrWhiteSpace(dto.Status)) policy.Status = dto.Status;
            policy.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { success = true, data = policy });
        }

        [HttpDelete("policies/{id:guid}")]
        public async Task<IActionResult> DeletePolicy(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.ProbationPolicies.FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Id == id && !p.IsDeleted);
            if (policy == null) return NotFound();

            if (policy.IsDefault)
                return BadRequest(new { message = "Cannot delete the default probation policy. Set another policy as default first." });

            policy.IsDeleted = true;
            policy.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { success = true });
        }

        [HttpPost("policies/{id:guid}/set-default")]
        public async Task<IActionResult> SetDefaultPolicy(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var target = await _db.ProbationPolicies.FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Id == id && !p.IsDeleted);
            if (target == null) return NotFound();

            var currentDefaults = await _db.ProbationPolicies
                .Where(p => p.TenantId == tenantId && p.IsDefault)
                .ToListAsync();

            foreach (var cd in currentDefaults)
            {
                cd.IsDefault = false;
                cd.UpdatedAt = DateTime.UtcNow;
            }

            target.IsDefault = true;
            target.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { success = true, data = target });
        }
    }

    public class CreateProbationPolicyDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsDefault { get; set; } = false;
        public int DefaultProbationMonths { get; set; } = 3;
        public int MaxExtensionMonths { get; set; } = 3;
        public int NoticePeriodDaysProbation { get; set; } = 15;
        public int NoticePeriodDaysConfirmed { get; set; } = 60;
        public int EvaluationReminderDaysBeforeEnd { get; set; } = 15;
        public bool RequiresManagerReview { get; set; } = true;
        public bool RequiresHodApproval { get; set; } = true;
        public bool AutoConfirmationAllowed { get; set; } = false;
        public int MinimumReviewScoreForConfirmation { get; set; } = 70;
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string Status { get; set; } = "Active";
    }

    public class UpdateProbationPolicyDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool IsDefault { get; set; }
        public int? DefaultProbationMonths { get; set; }
        public int? MaxExtensionMonths { get; set; }
        public int? NoticePeriodDaysProbation { get; set; }
        public int? NoticePeriodDaysConfirmed { get; set; }
        public int? EvaluationReminderDaysBeforeEnd { get; set; }
        public bool? RequiresManagerReview { get; set; }
        public bool? RequiresHodApproval { get; set; }
        public bool? AutoConfirmationAllowed { get; set; }
        public int? MinimumReviewScoreForConfirmation { get; set; }
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string? Status { get; set; }
    }
}
