using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Api.Modules.Administration.Controllers;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/travel")]
    [Authorize(Policy = "Module:hrms")]
    public class TravelController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;

        public TravelController(ApplicationDbContext db, ITenantAccessor tenantAccessor, IDocumentNumberService numbers)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
        }

        [HttpGet("requests")]
        public async Task<IActionResult> ListRequests([FromQuery] int page = 1, [FromQuery] int limit = 20, [FromQuery] string? status = null)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 20;
            if (limit > 100) limit = 100;

            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.TravelRequests.AsNoTracking().Where(r => r.TenantId == tenantId);

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(r => r.Status == status);
            }

            var total = await query.CountAsync();
            var requests = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(r => new
                {
                    r.Id,
                    r.RequestNumber,
                    r.EmployeeId,
                    r.EmployeeName,
                    r.Destination,
                    r.Purpose,
                    r.StartDate,
                    r.EndDate,
                    r.EstimatedAmount,
                    r.CurrencyCode,
                    r.Status,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = requests, total, page, limit });
        }

        [HttpPost("requests")]
        public async Task<IActionResult> CreateRequest([FromBody] CreateTravelRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Destination) || string.IsNullOrWhiteSpace(dto.Purpose))
            {
                return BadRequest(new { success = false, error = "Destination and purpose are required." });
            }

            var tenantId = _tenantAccessor.GetTenantId();
            var request = new TravelRequest
            {
                TenantId = tenantId,
                RequestNumber = await _numbers.NextAsync("TravelRequest", "TRV-", 5),
                EmployeeId = dto.EmployeeId,
                EmployeeName = dto.EmployeeName ?? string.Empty,
                Destination = dto.Destination,
                Purpose = dto.Purpose,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                EstimatedAmount = dto.EstimatedAmount,
                CurrencyCode = string.IsNullOrWhiteSpace(dto.CurrencyCode) ? "INR" : dto.CurrencyCode,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Submitted" : dto.Status,
                CreatedAt = DateTime.UtcNow
            };

            _db.TravelRequests.Add(request);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, data = request });
        }

        // ===== TRAVEL & EXPENSE POLICIES (DATABASE DRIVEN) =====

        [HttpGet("policies")]
        public async Task<IActionResult> GetPolicies([FromQuery] Guid? companyId = null, [FromQuery] Guid? projectId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var exists = await _db.TravelExpensePolicies.AnyAsync(p => p.TenantId == tenantId && !p.IsDeleted);
            if (!exists)
            {
                var defaultPol = new TravelExpensePolicy
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    Name = "Standard Domestic Travel & Daily Allowance Policy",
                    Description = "Standard domestic travel policy covering lodging allowances, per diem meals, and vehicle mileage reimbursements.",
                    IsDefault = true,
                    MaxDailyLodgingAllowance = 3500.0m,
                    MaxDailyMealsAllowance = 800.0m,
                    MileageRatePerKmCar = 12.0m,
                    MileageRatePerKmBike = 6.0m,
                    RequiresAdvanceApproval = true,
                    ApprovalThresholdAmount = 5000.0m,
                    MaxAdvancePercentage = 80.0m,
                    ReceiptRequiredAboveAmount = 200.0m,
                    ExpenseSubmissionWindowDays = 15,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                };
                _db.TravelExpensePolicies.Add(defaultPol);
                await _db.SaveChangesAsync();
            }

            var query = _db.TravelExpensePolicies
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
                .Where(d => d.TenantId == tenantId && !d.IsDeleted && d.IsVisible && d.Category == "TRAVEL_EXPENSE")
                .OrderBy(d => d.DisplayOrder)
                .ToListAsync();

            var resolvedFields = PoliciesController.ResolveFieldDefinitions(defs, companyId, projectId);
            var defaultsDict = resolvedFields.ToDictionary(f => (string)f.key, f => (object)f.defaultValue);

            var schema = new
            {
                category = "TRAVEL_EXPENSE",
                policyType = "TravelExpensePolicy",
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
            var policy = await _db.TravelExpensePolicies
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.IsDefault && !p.IsDeleted)
                ?? await _db.TravelExpensePolicies
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.TenantId == tenantId && !p.IsDeleted);

            return policy == null ? NotFound() : Ok(policy);
        }

        [HttpGet("policies/{id:guid}")]
        public async Task<IActionResult> GetPolicyById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.TravelExpensePolicies
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);

            return policy == null ? NotFound() : Ok(policy);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("policies")]
        public async Task<IActionResult> CreatePolicy([FromBody] TravelExpensePolicy model)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            model.Id = Guid.NewGuid();
            model.TenantId = tenantId;
            model.CreatedAt = DateTime.UtcNow;

            if (model.IsDefault)
            {
                var existingDefaults = await _db.TravelExpensePolicies
                    .Where(p => p.TenantId == tenantId && p.IsDefault)
                    .ToListAsync();
                foreach (var ed in existingDefaults) ed.IsDefault = false;
            }

            _db.TravelExpensePolicies.Add(model);
            await _db.SaveChangesAsync();

            return Ok(model);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPut("policies/{id:guid}")]
        public async Task<IActionResult> UpdatePolicy(Guid id, [FromBody] TravelExpensePolicy model)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.TravelExpensePolicies.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);
            if (policy == null) return NotFound();

            policy.Name = model.Name;
            policy.Description = model.Description;
            policy.MaxDailyLodgingAllowance = model.MaxDailyLodgingAllowance;
            policy.MaxDailyMealsAllowance = model.MaxDailyMealsAllowance;
            policy.MileageRatePerKmCar = model.MileageRatePerKmCar;
            policy.MileageRatePerKmBike = model.MileageRatePerKmBike;
            policy.RequiresAdvanceApproval = model.RequiresAdvanceApproval;
            policy.ApprovalThresholdAmount = model.ApprovalThresholdAmount;
            policy.MaxAdvancePercentage = model.MaxAdvancePercentage;
            policy.ReceiptRequiredAboveAmount = model.ReceiptRequiredAboveAmount;
            policy.ExpenseSubmissionWindowDays = model.ExpenseSubmissionWindowDays;
            policy.CompanyId = model.CompanyId;
            policy.ProjectId = model.ProjectId;
            policy.Status = model.Status;
            policy.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(policy);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpDelete("policies/{id:guid}")]
        public async Task<IActionResult> DeletePolicy(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.TravelExpensePolicies.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);
            if (policy == null) return NotFound();

            policy.IsDeleted = true;
            policy.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Travel expense policy deleted from database." });
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("policies/{id:guid}/set-default")]
        public async Task<IActionResult> SetDefaultPolicy(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var target = await _db.TravelExpensePolicies.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);
            if (target == null) return NotFound();

            var all = await _db.TravelExpensePolicies.Where(p => p.TenantId == tenantId && !p.IsDeleted).ToListAsync();
            foreach (var p in all) p.IsDefault = (p.Id == id);

            await _db.SaveChangesAsync();
            return Ok(new { message = "Default travel expense policy updated in database." });
        }
    }

    public class CreateTravelRequestDto
    {
        public Guid EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public string Destination { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal EstimatedAmount { get; set; }
        public string? CurrencyCode { get; set; }
        public string? Status { get; set; }
    }
}
