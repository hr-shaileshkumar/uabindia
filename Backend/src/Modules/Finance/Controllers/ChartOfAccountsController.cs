using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Application.Interfaces;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace UabIndia.Api.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class ChartOfAccountsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public ChartOfAccountsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? type = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.ChartOfAccounts
                .Where(c => c.TenantId == tenantId && !c.IsDeleted);

            if (!string.IsNullOrEmpty(type))
                query = query.Where(c => c.AccountType == type);

            var accounts = await query
                .OrderBy(c => c.Level)
                .ThenBy(c => c.AccountCode)
                .ToListAsync();
            return Ok(accounts);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var account = await _db.ChartOfAccounts
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);
            if (account == null) return NotFound();
            return Ok(account);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateChartOfAccountDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            
            var account = new ChartOfAccount
            {
                AccountCode = dto.AccountCode,
                AccountName = dto.AccountName,
                AccountType = dto.AccountType,
                SubType = dto.SubType,
                IsGroup = dto.IsGroup,
                OpeningBalance = dto.OpeningBalance,
                CurrentBalance = dto.OpeningBalance,
                IsActive = true,
                Level = 1,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.ChartOfAccounts.Add(account);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Chart of Account created successfully", account });
        }

        [HttpGet("getBalances")]
        public async Task<IActionResult> GetAccountBalances()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var accounts = await _db.ChartOfAccounts
                .Where(c => c.TenantId == tenantId && !c.IsDeleted && !c.IsGroup)
                .Select(c => new { c.Id, c.AccountCode, c.AccountName, c.CurrentBalance })
                .ToListAsync();

            return Ok(accounts);
        }
    }

    public class CreateChartOfAccountDto
    {
        public string AccountCode { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty; // Asset, Liability, Equity, Revenue, Expense
        public string SubType { get; set; } = string.Empty;
        public bool IsGroup { get; set; }
        public decimal OpeningBalance { get; set; }
    }
}
