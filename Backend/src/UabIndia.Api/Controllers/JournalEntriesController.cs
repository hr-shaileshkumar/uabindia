using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class JournalEntriesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public JournalEntriesController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 20, [FromQuery] string? status = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (page < 1) page = 1;
            if (limit < 1) limit = 20;
            if (limit > 100) limit = 100;

            var query = _db.JournalEntries.AsNoTracking().Where(j => j.TenantId == tenantId);
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(j => j.Status == status);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(j => j.EntryDate)
                .ThenByDescending(j => j.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(j => new JournalEntrySummaryDto
                {
                    Id = j.Id,
                    JournalNumber = j.JournalNumber,
                    EntryDate = j.EntryDate,
                    EntryType = j.EntryType,
                    Status = j.Status,
                    TotalDebit = j.TotalDebit,
                    TotalCredit = j.TotalCredit,
                    Description = j.Description
                })
                .ToListAsync();

            return Ok(new { data = items, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var entry = await _db.JournalEntries
                .AsNoTracking()
                .Include(j => j.Lines)
                .ThenInclude(l => l.Account)
                .FirstOrDefaultAsync(j => j.Id == id && j.TenantId == tenantId);

            if (entry == null) return NotFound();

            var dto = new JournalEntryDetailDto
            {
                Id = entry.Id,
                JournalNumber = entry.JournalNumber,
                EntryDate = entry.EntryDate,
                EntryType = entry.EntryType,
                ReferenceNumber = entry.ReferenceNumber,
                Description = entry.Description,
                Narration = entry.Narration,
                Status = entry.Status,
                TotalDebit = entry.TotalDebit,
                TotalCredit = entry.TotalCredit,
                PostedDate = entry.PostedDate,
                Lines = entry.Lines.Select(l => new JournalEntryLineDto
                {
                    Id = l.Id,
                    AccountId = l.AccountId,
                    AccountCode = l.Account?.AccountCode ?? "",
                    AccountName = l.Account?.AccountName ?? "",
                    DebitAmount = l.DebitAmount,
                    CreditAmount = l.CreditAmount,
                    Description = l.Description
                }).ToList()
            };

            return Ok(dto);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateJournalEntryDto dto)
        {
            if (dto.Lines == null || dto.Lines.Count < 2)
                return BadRequest(new { message = "At least two lines are required." });

            var tenantId = _tenantAccessor.GetTenantId();
            var totalDebit = dto.Lines.Sum(l => l.DebitAmount);
            var totalCredit = dto.Lines.Sum(l => l.CreditAmount);
            if (totalDebit != totalCredit || totalDebit <= 0)
                return BadRequest(new { message = "Total debits must equal total credits and be greater than zero." });

            var accountIds = dto.Lines.Select(l => l.AccountId).Distinct().ToList();
            var accounts = await _db.ChartOfAccounts
                .Where(a => accountIds.Contains(a.Id) && a.TenantId == tenantId && !a.IsDeleted && !a.IsGroup)
                .ToListAsync();
            if (accounts.Count != accountIds.Count)
                return BadRequest(new { message = "One or more accounts are invalid or are group headers." });

            var journalNumber = $"JE-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(10000, 99999)}";

            var entry = new JournalEntry
            {
                TenantId = tenantId,
                JournalNumber = journalNumber,
                EntryDate = dto.EntryDate.Kind == DateTimeKind.Unspecified
                    ? DateTime.SpecifyKind(dto.EntryDate, DateTimeKind.Utc)
                    : dto.EntryDate.ToUniversalTime(),
                EntryType = string.IsNullOrWhiteSpace(dto.EntryType) ? "Regular" : dto.EntryType,
                ReferenceNumber = dto.ReferenceNumber,
                Description = dto.Description,
                Narration = dto.Narration,
                TotalDebit = totalDebit,
                TotalCredit = totalCredit,
                Status = "Draft",
                CreatedAt = DateTime.UtcNow,
                Lines = dto.Lines.Select(l => new JournalEntryLine
                {
                    TenantId = tenantId,
                    AccountId = l.AccountId,
                    DebitAmount = l.DebitAmount,
                    CreditAmount = l.CreditAmount,
                    Description = l.Description,
                    CreatedAt = DateTime.UtcNow
                }).ToList()
            };

            _db.JournalEntries.Add(entry);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Journal entry created as draft.", id = entry.Id, journalNumber = entry.JournalNumber });
        }

        [HttpPost("{id:guid}/post")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Post(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            await using var trx = await _db.Database.BeginTransactionAsync();

            var entry = await _db.JournalEntries
                .Include(j => j.Lines)
                .FirstOrDefaultAsync(j => j.Id == id && j.TenantId == tenantId);

            if (entry == null)
            {
                await trx.RollbackAsync();
                return NotFound();
            }

            if (entry.Status != "Draft")
            {
                await trx.RollbackAsync();
                return BadRequest(new { message = "Only draft entries can be posted." });
            }

            if (entry.TotalDebit != entry.TotalCredit || entry.TotalDebit <= 0)
            {
                await trx.RollbackAsync();
                return BadRequest(new { message = "Entry is not balanced." });
            }

            var accountIds = entry.Lines.Select(l => l.AccountId).Distinct().ToList();
            var accounts = await _db.ChartOfAccounts
                .Where(a => accountIds.Contains(a.Id) && a.TenantId == tenantId && !a.IsDeleted)
                .ToDictionaryAsync(a => a.Id);

            foreach (var line in entry.Lines)
            {
                if (!accounts.TryGetValue(line.AccountId, out var acc) || acc.IsGroup)
                {
                    await trx.RollbackAsync();
                    return BadRequest(new { message = $"Invalid account on line {line.Id}." });
                }

                acc.CurrentBalance += line.DebitAmount - line.CreditAmount;
                acc.UpdatedAt = DateTime.UtcNow;
            }

            var userId = GetUserId();
            entry.Status = "Posted";
            entry.PostedDate = DateTime.UtcNow;
            entry.PostedBy = userId == Guid.Empty ? null : userId;
            entry.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            await trx.CommitAsync();
            return Ok(new { message = "Journal entry posted.", id = entry.Id });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteDraft(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var entry = await _db.JournalEntries.FirstOrDefaultAsync(j => j.Id == id && j.TenantId == tenantId);
            if (entry == null) return NotFound();
            if (entry.Status != "Draft")
                return BadRequest(new { message = "Only draft entries can be deleted." });

            entry.IsDeleted = true;
            entry.UpdatedAt = DateTime.UtcNow;
            var lines = await _db.JournalEntryLines.Where(l => l.JournalEntryId == id && l.TenantId == tenantId).ToListAsync();
            foreach (var line in lines)
            {
                line.IsDeleted = true;
                line.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return Ok(new { message = "Draft journal entry removed." });
        }

        private Guid GetUserId()
        {
            var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(sub, out var g) ? g : Guid.Empty;
        }
    }

    public class JournalEntrySummaryDto
    {
        public Guid Id { get; set; }
        public string JournalNumber { get; set; } = "";
        public DateTime EntryDate { get; set; }
        public string EntryType { get; set; } = "";
        public string Status { get; set; } = "";
        public decimal TotalDebit { get; set; }
        public decimal TotalCredit { get; set; }
        public string? Description { get; set; }
    }

    public class JournalEntryDetailDto
    {
        public Guid Id { get; set; }
        public string JournalNumber { get; set; } = "";
        public DateTime EntryDate { get; set; }
        public string EntryType { get; set; } = "";
        public string? ReferenceNumber { get; set; }
        public string? Description { get; set; }
        public string? Narration { get; set; }
        public string Status { get; set; } = "";
        public decimal TotalDebit { get; set; }
        public decimal TotalCredit { get; set; }
        public DateTime? PostedDate { get; set; }
        public List<JournalEntryLineDto> Lines { get; set; } = new();
    }

    public class JournalEntryLineDto
    {
        public Guid Id { get; set; }
        public Guid AccountId { get; set; }
        public string AccountCode { get; set; } = "";
        public string AccountName { get; set; } = "";
        public decimal DebitAmount { get; set; }
        public decimal CreditAmount { get; set; }
        public string? Description { get; set; }
    }

    public class CreateJournalEntryDto
    {
        public DateTime EntryDate { get; set; } = DateTime.UtcNow.Date;
        public string? EntryType { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Description { get; set; }
        public string? Narration { get; set; }
        public List<CreateJournalLineDto> Lines { get; set; } = new();
    }

    public class CreateJournalLineDto
    {
        public Guid AccountId { get; set; }
        public decimal DebitAmount { get; set; }
        public decimal CreditAmount { get; set; }
        public string? Description { get; set; }
    }
}
