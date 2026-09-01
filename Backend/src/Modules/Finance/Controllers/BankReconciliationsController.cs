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
}
