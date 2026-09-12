using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Application.Interfaces;
using System;
using System.Linq;
using System.Threading;
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
        private readonly IChartOfAccountsTemplateService _templateService;

        public ChartOfAccountsController(
            ApplicationDbContext db, 
            ITenantAccessor tenantAccessor,
            IChartOfAccountsTemplateService templateService)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _templateService = templateService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? type = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.ChartOfAccounts
                .Where(c => c.TenantId == tenantId && !c.IsDeleted);

            if (!string.IsNullOrWhiteSpace(type) && type != "ALL")
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

        [HttpGet("templates")]
        public IActionResult GetTemplates()
        {
            var templates = _templateService.GetAvailableTemplates();
            return Ok(templates);
        }

        [HttpPost("seed-standard")]
        public async Task<IActionResult> SeedStandard([FromBody] SeedStandardCoaDto dto, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var standard = string.IsNullOrWhiteSpace(dto.StandardType) ? "IND_AS" : dto.StandardType.Trim().ToUpperInvariant();
            var seededCount = await _templateService.SeedStandardChartOfAccountsAsync(
                tenantId, 
                dto.CompanyId, 
                standard, 
                dto.DefaultCurrency, 
                ct);

            return Ok(new
            {
                message = $"Successfully seeded {seededCount} standard chart of accounts under {standard}.",
                seededCount
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateChartOfAccountDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            if (string.IsNullOrWhiteSpace(dto.AccountCode))
                return BadRequest(new { message = "Account Code is required." });

            if (string.IsNullOrWhiteSpace(dto.AccountName))
                return BadRequest(new { message = "Account Name is required." });

            var codeExists = await _db.ChartOfAccounts
                .AnyAsync(c => c.TenantId == tenantId && !c.IsDeleted && c.AccountCode.ToLower() == dto.AccountCode.Trim().ToLower());

            if (codeExists)
                return BadRequest(new { message = $"Account code '{dto.AccountCode}' is already in use." });

            var level = 1;
            if (dto.ParentAccountId.HasValue && dto.ParentAccountId != Guid.Empty)
            {
                var parent = await _db.ChartOfAccounts
                    .FirstOrDefaultAsync(c => c.Id == dto.ParentAccountId && c.TenantId == tenantId && !c.IsDeleted);
                if (parent != null)
                {
                    level = parent.Level + 1;
                }
            }

            var account = new ChartOfAccount
            {
                TenantId = tenantId,
                AccountCode = dto.AccountCode.Trim().ToUpperInvariant(),
                AccountName = dto.AccountName.Trim(),
                AccountType = dto.AccountType?.Trim() ?? "Asset",
                SubType = dto.SubType?.Trim() ?? string.Empty,
                ParentAccountId = dto.ParentAccountId == Guid.Empty ? null : dto.ParentAccountId,
                Description = dto.Description?.Trim(),
                IsGroup = dto.IsGroup,
                OpeningBalance = dto.OpeningBalance,
                CurrentBalance = dto.OpeningBalance,
                Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "INR" : dto.Currency.Trim().ToUpperInvariant(),
                IsActive = dto.IsActive,
                Level = level,
                CreatedAt = DateTime.UtcNow
            };

            _db.ChartOfAccounts.Add(account);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Chart of Account created successfully", account });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateChartOfAccountDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var account = await _db.ChartOfAccounts
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);

            if (account == null)
                return NotFound(new { message = "Chart of account not found." });

            if (string.IsNullOrWhiteSpace(dto.AccountCode))
                return BadRequest(new { message = "Account Code is required." });

            if (string.IsNullOrWhiteSpace(dto.AccountName))
                return BadRequest(new { message = "Account Name is required." });

            if (dto.ParentAccountId.HasValue && dto.ParentAccountId == id)
                return BadRequest(new { message = "An account cannot be its own parent." });

            var codeExists = await _db.ChartOfAccounts
                .AnyAsync(c => c.TenantId == tenantId && !c.IsDeleted && c.Id != id && c.AccountCode.ToLower() == dto.AccountCode.Trim().ToLower());

            if (codeExists)
                return BadRequest(new { message = $"Account code '{dto.AccountCode}' is already in use by another account." });

            var level = 1;
            if (dto.ParentAccountId.HasValue && dto.ParentAccountId != Guid.Empty)
            {
                var parent = await _db.ChartOfAccounts
                    .FirstOrDefaultAsync(c => c.Id == dto.ParentAccountId && c.TenantId == tenantId && !c.IsDeleted);
                if (parent != null)
                {
                    level = parent.Level + 1;
                }
            }

            account.AccountCode = dto.AccountCode.Trim().ToUpperInvariant();
            account.AccountName = dto.AccountName.Trim();
            account.AccountType = dto.AccountType?.Trim() ?? account.AccountType;
            account.SubType = dto.SubType?.Trim() ?? string.Empty;
            account.ParentAccountId = dto.ParentAccountId == Guid.Empty ? null : dto.ParentAccountId;
            account.Description = dto.Description?.Trim();
            account.IsGroup = dto.IsGroup;
            account.Currency = string.IsNullOrWhiteSpace(dto.Currency) ? account.Currency : dto.Currency.Trim().ToUpperInvariant();
            account.IsActive = dto.IsActive;
            account.Level = level;
            account.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Chart of Account updated successfully", account });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var account = await _db.ChartOfAccounts
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);

            if (account == null)
                return NotFound(new { message = "Chart of account not found." });

            // Check for sub-accounts
            var hasChildren = await _db.ChartOfAccounts
                .AnyAsync(c => c.TenantId == tenantId && !c.IsDeleted && c.ParentAccountId == id);

            if (hasChildren)
                return BadRequest(new { message = "Cannot delete this group account because child accounts exist under it. Reassign or delete sub-accounts first." });

            // Check if journal entry lines reference this account
            var hasJournalEntries = await _db.JournalEntryLines
                .AnyAsync(j => j.AccountId == id);

            if (hasJournalEntries)
                return BadRequest(new { message = "Cannot delete this account because transaction journal entries are posted against it. You can mark it as Inactive instead." });

            account.IsDeleted = true;
            account.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Chart of Account deleted successfully." });
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
        public Guid? ParentAccountId { get; set; }
        public string? Description { get; set; }
        public bool IsGroup { get; set; }
        public decimal OpeningBalance { get; set; }
        public string Currency { get; set; } = "INR";
        public bool IsActive { get; set; } = true;
    }

    public class UpdateChartOfAccountDto
    {
        public string AccountCode { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty;
        public string SubType { get; set; } = string.Empty;
        public Guid? ParentAccountId { get; set; }
        public string? Description { get; set; }
        public bool IsGroup { get; set; }
        public string Currency { get; set; } = "INR";
        public bool IsActive { get; set; } = true;
    }

    public class SeedStandardCoaDto
    {
        public string StandardType { get; set; } = "IND_AS";
        public string? DefaultCurrency { get; set; }
        public Guid? CompanyId { get; set; }
    }
}
