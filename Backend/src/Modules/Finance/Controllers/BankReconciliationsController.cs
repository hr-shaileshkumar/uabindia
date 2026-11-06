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
    [Route("api/v1/bank-reconciliations")]
    [Route("api/v1/finance/bank-reconciliation")]
    [Route("api/v1/finance/bank-reconciliations")]
    [Authorize(Policy = "Module:finance")]
    public class BankReconciliationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IBankReconciliationService _reconciliations;

        public BankReconciliationsController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IBankReconciliationService reconciliations)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _reconciliations = reconciliations;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 50)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (page < 1) page = 1;
            if (limit < 1) limit = 50;
            if (limit > 100) limit = 100;

            var query = _db.BankReconciliations.AsNoTracking()
                .Where(r => r.TenantId == tenantId && !r.IsDeleted);

            var total = await query.CountAsync();
            var data = await query
                .OrderByDescending(r => r.ReconciledAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(r => new
                {
                    r.Id,
                    r.AccountId,
                    r.AccountCode,
                    r.AccountName,
                    r.Period,
                    r.BookBalance,
                    r.BankBalance,
                    r.Difference,
                    r.Status,
                    LastReconciled = r.ReconciledAt,
                    r.Remarks,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var row = await _db.BankReconciliations.AsNoTracking()
                .Where(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted)
                .Select(r => new
                {
                    r.Id,
                    r.CompanyId,
                    r.AccountId,
                    r.AccountCode,
                    r.AccountName,
                    r.Period,
                    r.BookBalance,
                    r.BankBalance,
                    r.Difference,
                    r.Status,
                    LastReconciled = r.ReconciledAt,
                    r.Remarks,
                    r.CreatedAt,
                    r.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (row == null)
                return NotFound(new { success = false, error = "Bank reconciliation record not found" });

            return Ok(new { success = true, data = row });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateBankReconciliationDto dto)
        {
            try
            {
                var row = await _reconciliations.CreateAsync(new CreateBankReconciliationCommand(
                    dto.AccountId,
                    dto.BankBalance,
                    dto.BookBalance,
                    dto.Period,
                    dto.Status,
                    dto.Remarks));
                return Ok(new { success = true, message = "Bank reconciliation saved", data = row });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBankReconciliationDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var row = await _db.BankReconciliations
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted);

            if (row == null)
                return NotFound(new { success = false, error = "Bank reconciliation record not found" });

            if (dto.AccountId.HasValue && dto.AccountId.Value != Guid.Empty && dto.AccountId.Value != row.AccountId)
            {
                var account = await _db.ChartOfAccounts.AsNoTracking()
                    .FirstOrDefaultAsync(a => a.Id == dto.AccountId.Value && a.TenantId == tenantId && !a.IsDeleted);
                if (account != null)
                {
                    row.AccountId = account.Id;
                    row.AccountCode = account.AccountCode;
                    row.AccountName = account.AccountName;
                }
            }

            if (dto.BankBalance.HasValue) row.BankBalance = dto.BankBalance.Value;
            if (dto.BookBalance.HasValue) row.BookBalance = dto.BookBalance.Value;
            if (!string.IsNullOrWhiteSpace(dto.Period)) row.Period = dto.Period.Trim();
            if (dto.Remarks != null) row.Remarks = dto.Remarks;

            row.Difference = row.BankBalance - row.BookBalance;
            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                row.Status = dto.Status.Trim();
            }
            else
            {
                row.Status = Math.Abs(row.Difference) < 1m ? "Matched"
                    : Math.Abs(row.Difference) < Math.Abs(row.BookBalance) * 0.05m + 1m ? "Partial"
                    : "Unmatched";
            }

            row.ReconciledAt = DateTime.UtcNow;
            row.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Bank reconciliation updated successfully", data = row });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var row = await _db.BankReconciliations
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted);
            if (row == null)
                return NotFound(new { success = false, error = "Reconciliation not found" });

            row.IsDeleted = true;
            row.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Reconciliation deleted" });
        }
    }

    public class CreateBankReconciliationDto
    {
        public Guid AccountId { get; set; }
        public decimal BankBalance { get; set; }
        public decimal BookBalance { get; set; }
        public string? Period { get; set; }
        public string? Status { get; set; }
        public string? Remarks { get; set; }
    }

    public class UpdateBankReconciliationDto
    {
        public Guid? AccountId { get; set; }
        public decimal? BankBalance { get; set; }
        public decimal? BookBalance { get; set; }
        public string? Period { get; set; }
        public string? Status { get; set; }
        public string? Remarks { get; set; }
    }
}
