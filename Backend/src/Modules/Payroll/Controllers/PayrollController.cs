using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Modules.Administration.Controllers;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Payroll.Controllers
{
    /// <summary>
    /// Payroll Master Controller:
    /// Manages payroll policies, expense reimbursements, and employee directory helpers.
    /// Dedicated sub-controllers handle Runs, Payslips, Structures, Compliance, Tax, Settlements, Loans, Bonuses, and Arrears.
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Authorize(Policy = "Module:payroll")]
    public class PayrollController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;
        private readonly IExpenseClaimService _expenseClaims;

        public PayrollController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers,
            IExpenseClaimService expenseClaims)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
            _expenseClaims = expenseClaims;
        }

        // ===== EMPLOYEE PICKER =====

        [HttpGet("employees")]
        public async Task<IActionResult> GetEmployees()
        {
            var employees = await _db.Employees.AsNoTracking()
                .OrderBy(e => e.FullName)
                .Take(300)
                .Select(e => new { e.Id, e.FullName, e.EmployeeCode, e.Status })
                .ToListAsync();

            return Ok(new { employees });
        }

        // ===== REIMBURSEMENTS (ExpenseClaims) =====

        [HttpGet("reimbursements")]
        public async Task<IActionResult> GetReimbursements([FromQuery] string? status)
        {
            var query = _db.ExpenseClaims.AsNoTracking();
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(e => e.Status == status);

            var rows = await query
                .OrderByDescending(e => e.ExpenseDate)
                .Take(200)
                .Select(e => new
                {
                    e.Id,
                    e.ClaimNumber,
                    e.EmployeeId,
                    employeeName = e.EmployeeName,
                    category = e.Category,
                    title = e.Title,
                    amount = e.Amount,
                    submittedDate = e.SubmittedAt ?? e.ExpenseDate,
                    e.Status
                })
                .ToListAsync();

            return Ok(rows);
        }

        [HttpPost("reimbursements")]
        public async Task<IActionResult> CreateReimbursement([FromBody] CreatePayrollReimbursementDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (dto.Amount <= 0) return BadRequest(new { message = "Amount must be greater than zero." });

            string employeeName = dto.EmployeeName?.Trim() ?? string.Empty;
            if (dto.EmployeeId.HasValue)
            {
                var employee = await ResolveEmployeeAsync(dto.EmployeeId.Value);
                if (employee == null) return BadRequest(new { message = "Employee not found." });
                employeeName = employee.FullName ?? employee.EmployeeCode ?? employeeName;
            }

            var claim = new ExpenseClaim
            {
                TenantId = _tenantAccessor.GetTenantId(),
                ClaimNumber = await _numbers.NextAsync("PayrollReimbursement", "REIM-", 5),
                EmployeeId = dto.EmployeeId,
                EmployeeName = employeeName,
                Title = dto.Title.Trim(),
                Description = dto.Description,
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim(),
                Amount = dto.Amount,
                ExpenseDate = dto.Date ?? DateTime.UtcNow.Date,
                Status = "Submitted",
                SubmittedAt = DateTime.UtcNow
            };

            _db.ExpenseClaims.Add(claim);
            await _db.SaveChangesAsync();
            return Ok(claim);
        }

        [HttpPost("reimbursements/{id:guid}/approve")]
        public async Task<IActionResult> ApproveReimbursement(Guid id)
        {
            try
            {
                await _expenseClaims.ApproveAsync(id, User.Identity?.Name ?? "payroll");
                return Ok(new { message = "Reimbursement approved." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Reimbursement not found." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("reimbursements/{id:guid}/reject")]
        public async Task<IActionResult> RejectReimbursement(Guid id)
        {
            try
            {
                await _expenseClaims.RejectAsync(id);
                return Ok(new { message = "Reimbursement rejected." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Reimbursement not found." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("reimbursements/{id:guid}/mark-paid")]
        public async Task<IActionResult> MarkReimbursementPaid(Guid id)
        {
            try
            {
                await _expenseClaims.MarkPaidAsync(id);
                return Ok(new { message = "Reimbursement marked paid and posted to GL." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Reimbursement not found." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private async Task<Employee?> ResolveEmployeeAsync(Guid id) =>
            await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id);

        private async Task<Guid> ResolveCurrentEmployeeIdAsync()
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Guid.Empty;
            return await _db.Employees.AsNoTracking()
                .Where(e => e.UserId == userId && !e.IsDeleted)
                .Select(e => e.Id)
                .FirstOrDefaultAsync();
        }

        private Guid GetUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }

        private static string Csv(string? value)
        {
            var text = (value ?? string.Empty).Replace("\"", "\"\"");
            return text.Contains(',') || text.Contains('"') || text.Contains('\n') ? $"\"{text}\"" : text;
        }

        // ===== PAYROLL POLICIES (DATABASE DRIVEN) =====

        [HttpGet("policies/schema")]
        public async Task<IActionResult> GetPolicySchema([FromQuery] Guid? companyId = null, [FromQuery] Guid? projectId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            await PoliciesController.EnsurePolicyRuleDefinitionsSeededAsync(_db, tenantId);

            var defs = await _db.PolicyRuleDefinitions
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && !d.IsDeleted && d.IsVisible && d.Category == "PAYROLL_COMPENSATION")
                .OrderBy(d => d.DisplayOrder)
                .ToListAsync();

            var resolvedFields = PoliciesController.ResolveFieldDefinitions(defs, companyId, projectId);
            var defaultsDict = resolvedFields.ToDictionary(f => (string)f.key, f => (object)f.defaultValue);

            var schema = new
            {
                category = "PAYROLL_COMPENSATION",
                policyType = "PayrollPolicy",
                scope = new { companyId, projectId },
                defaults = defaultsDict,
                fieldDefinitions = resolvedFields
            };

            return Ok(schema);
        }

        [HttpGet("policies")]
        public async Task<IActionResult> GetPolicies([FromQuery] Guid? companyId = null, [FromQuery] Guid? projectId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var exists = await _db.PayrollPolicies.AnyAsync(p => p.TenantId == tenantId && !p.IsDeleted);
            if (!exists)
            {
                var defaultPol = new PayrollPolicy
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    Name = "Standard Statutory Payroll Policy (India)",
                    Description = "Standard statutory compensation policy compliant with Indian PF, ESI, and Tax regulations.",
                    IsDefault = true,
                    PayCycle = "CalendarMonth",
                    BasicPercentageOfGross = 50.0m,
                    HraPercentageOfBasic = 40.0m,
                    PfCalculationBasis = "StatutoryWageCeiling",
                    PfWageCeiling = 15000.0m,
                    PfEmployeeRate = 12.0m,
                    PfEmployerRate = 12.0m,
                    IsEsiEnabled = true,
                    EsiWageCeiling = 21000.0m,
                    EsiEmployeeRate = 0.75m,
                    EsiEmployerRate = 3.25m,
                    ProfessionalTaxMonthly = 200.0m,
                    PayDayOfMonth = 1,
                    AllowNegativeTakeHome = false,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                };
                _db.PayrollPolicies.Add(defaultPol);
                await _db.SaveChangesAsync();
            }

            var query = _db.PayrollPolicies
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

        [HttpGet("policies/default")]
        public async Task<IActionResult> GetDefaultPolicy()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.PayrollPolicies
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.IsDefault && !p.IsDeleted)
                ?? await _db.PayrollPolicies
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.TenantId == tenantId && !p.IsDeleted);

            return policy == null ? NotFound() : Ok(policy);
        }

        [HttpGet("policies/{id:guid}")]
        public async Task<IActionResult> GetPolicyById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.PayrollPolicies
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);

            return policy == null ? NotFound() : Ok(policy);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("policies")]
        public async Task<IActionResult> CreatePolicy([FromBody] PayrollPolicy model)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            model.Id = Guid.NewGuid();
            model.TenantId = tenantId;
            model.CreatedAt = DateTime.UtcNow;

            if (model.IsDefault)
            {
                var existingDefaults = await _db.PayrollPolicies
                    .Where(p => p.TenantId == tenantId && p.IsDefault)
                    .ToListAsync();
                foreach (var ed in existingDefaults) ed.IsDefault = false;
            }

            _db.PayrollPolicies.Add(model);
            await _db.SaveChangesAsync();

            return Ok(model);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPut("policies/{id:guid}")]
        public async Task<IActionResult> UpdatePolicy(Guid id, [FromBody] PayrollPolicy model)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.PayrollPolicies.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);
            if (policy == null) return NotFound();

            policy.Name = model.Name;
            policy.Description = model.Description;
            policy.PayCycle = model.PayCycle;
            policy.BasicPercentageOfGross = model.BasicPercentageOfGross;
            policy.HraPercentageOfBasic = model.HraPercentageOfBasic;
            policy.PfCalculationBasis = model.PfCalculationBasis;
            policy.PfWageCeiling = model.PfWageCeiling;
            policy.PfEmployeeRate = model.PfEmployeeRate;
            policy.PfEmployerRate = model.PfEmployerRate;
            policy.IsEsiEnabled = model.IsEsiEnabled;
            policy.EsiWageCeiling = model.EsiWageCeiling;
            policy.EsiEmployeeRate = model.EsiEmployeeRate;
            policy.EsiEmployerRate = model.EsiEmployerRate;
            policy.ProfessionalTaxMonthly = model.ProfessionalTaxMonthly;
            policy.PayDayOfMonth = model.PayDayOfMonth;
            policy.AllowNegativeTakeHome = model.AllowNegativeTakeHome;
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
            var policy = await _db.PayrollPolicies.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);
            if (policy == null) return NotFound();

            policy.IsDeleted = true;
            policy.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Payroll policy deleted from database." });
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("policies/{id:guid}/set-default")]
        public async Task<IActionResult> SetDefaultPolicy(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var target = await _db.PayrollPolicies.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);
            if (target == null) return NotFound();

            var all = await _db.PayrollPolicies.Where(p => p.TenantId == tenantId && !p.IsDeleted).ToListAsync();
            foreach (var p in all) p.IsDefault = (p.Id == id);

            await _db.SaveChangesAsync();
            return Ok(new { message = "Default payroll policy updated in database." });
        }
    }
}
