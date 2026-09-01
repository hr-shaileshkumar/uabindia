using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/v1/expenses")]
    [Authorize(Policy = "Module:finance")]
    public class ExpensesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;
        private readonly IExpenseClaimService _expenses;

        public ExpensesController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers,
            IExpenseClaimService expenses)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
            _expenses = expenses;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 50, [FromQuery] string? status = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (page < 1) page = 1;
            if (limit < 1) limit = 50;
            if (limit > 100) limit = 100;

            var query = _db.ExpenseClaims.AsNoTracking()
                .Where(e => e.TenantId == tenantId && !e.IsDeleted);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(e => e.Status == status);

            var total = await query.CountAsync();
            var rows = await query
                .OrderByDescending(e => e.ExpenseDate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(e => new
                {
                    e.Id,
                    e.ClaimNumber,
                    e.EmployeeId,
                    e.EmployeeName,
                    e.Title,
                    e.Description,
                    e.Category,
                    e.Amount,
                    Currency = e.CurrencyCode,
                    Date = e.ExpenseDate,
                    e.Status,
                    e.ReceiptUrl,
                    e.ApprovedBy,
                    e.SubmittedAt,
                    e.CostCenterId,
                    e.ProjectId,
                    e.CreatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = rows, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateExpenseClaimDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { success = false, error = "Title is required" });
            if (dto.Amount <= 0)
                return BadRequest(new { success = false, error = "Amount must be greater than zero" });

            var tenantId = _tenantAccessor.GetTenantId();

            if (dto.EmployeeId.HasValue)
            {
                var employee = await _db.Employees.AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == dto.EmployeeId.Value && e.TenantId == tenantId && !e.IsDeleted);
                if (employee == null)
                    return BadRequest(new { success = false, error = "Employee not found" });
                dto.EmployeeName = employee.FullName ?? employee.EmployeeCode ?? dto.EmployeeName;
            }

            var status = string.IsNullOrWhiteSpace(dto.Status) ? "Submitted" : dto.Status;
            var claim = new ExpenseClaim
            {
                ClaimNumber = string.IsNullOrWhiteSpace(dto.ClaimNumber)
                    ? await _numbers.NextAsync("ExpenseClaim", "EXP-", 5)
                    : dto.ClaimNumber.Trim(),
                EmployeeId = dto.EmployeeId,
                EmployeeName = dto.EmployeeName?.Trim() ?? string.Empty,
                Title = dto.Title.Trim(),
                Description = dto.Description,
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category,
                Amount = dto.Amount,
                CurrencyCode = string.IsNullOrWhiteSpace(dto.Currency) ? "INR" : dto.Currency,
                ExpenseDate = dto.Date == default ? DateTime.UtcNow.Date : dto.Date,
                Status = status,
                ReceiptUrl = dto.ReceiptUrl,
                CostCenterId = dto.CostCenterId,
                ProjectId = dto.ProjectId,
                SubmittedAt = status is "Submitted" or "Approved" or "Paid" ? DateTime.UtcNow : null,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.ExpenseClaims.Add(claim);
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Expense claim created", data = claim });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateExpenseClaimDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var claim = await _db.ExpenseClaims
                .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId && !e.IsDeleted);
            if (claim == null)
                return NotFound(new { success = false, error = "Expense claim not found" });

            if (dto.Title != null) claim.Title = dto.Title;
            if (dto.Description != null) claim.Description = dto.Description;
            if (dto.Category != null) claim.Category = dto.Category;
            if (dto.Amount.HasValue) claim.Amount = dto.Amount.Value;
            if (dto.Date.HasValue) claim.ExpenseDate = dto.Date.Value;
            if (dto.Status != null)
            {
                claim.Status = dto.Status;
                if (dto.Status == "Submitted" && claim.SubmittedAt == null)
                    claim.SubmittedAt = DateTime.UtcNow;
            }
            if (dto.ApprovedBy != null) claim.ApprovedBy = dto.ApprovedBy;
            if (dto.ReceiptUrl != null) claim.ReceiptUrl = dto.ReceiptUrl;
            if (dto.CostCenterId.HasValue) claim.CostCenterId = dto.CostCenterId;
            if (dto.ProjectId.HasValue) claim.ProjectId = dto.ProjectId;
            claim.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Expense claim updated", data = claim });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var claim = await _db.ExpenseClaims
                .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId && !e.IsDeleted);
            if (claim == null)
                return NotFound(new { success = false, error = "Expense claim not found" });

            claim.IsDeleted = true;
            claim.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Expense claim deleted" });
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
                var claim = await _expenses.ApproveAsync(id, actor);
                return Ok(new { success = true, message = "Expense claim approved", data = claim });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, error = "Expense claim not found" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPost("{id}/reject")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Reject(Guid id, [FromBody] RejectExpenseDto? dto = null)
        {
            try
            {
                var claim = await _expenses.RejectAsync(id, dto?.Reason);
                return Ok(new { success = true, message = "Expense claim rejected", data = claim });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, error = "Expense claim not found" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPost("{id}/mark-paid")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> MarkPaid(Guid id)
        {
            try
            {
                var claim = await _expenses.MarkPaidAsync(id);
                return Ok(new { success = true, message = "Expense claim marked paid and posted to GL", data = claim });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, error = "Expense claim not found" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }
    }

    public class CreateExpenseClaimDto
    {
        public string? ClaimNumber { get; set; }
        public Guid? EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Category { get; set; }
        public decimal Amount { get; set; }
        public string? Currency { get; set; }
        public DateTime Date { get; set; }
        public string? Status { get; set; }
        public string? ReceiptUrl { get; set; }
        public Guid? CostCenterId { get; set; }
        public Guid? ProjectId { get; set; }
    }

    public class UpdateExpenseClaimDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Category { get; set; }
        public decimal? Amount { get; set; }
        public DateTime? Date { get; set; }
        public string? Status { get; set; }
        public string? ApprovedBy { get; set; }
        public string? ReceiptUrl { get; set; }
        public Guid? CostCenterId { get; set; }
        public Guid? ProjectId { get; set; }
    }

    public class RejectExpenseDto
    {
        public string? Reason { get; set; }
    }
}
