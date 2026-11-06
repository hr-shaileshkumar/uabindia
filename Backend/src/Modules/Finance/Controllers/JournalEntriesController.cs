using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Route("api/v1/finance/journal-entries")]
    [Route("api/v1/journal-entries")]
    [Authorize]
    public class JournalEntriesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IJournalEntryService _journalEntries;

        public JournalEntriesController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IJournalEntryService journalEntries)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _journalEntries = journalEntries;
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
            try
            {
                var created = await _journalEntries.CreateDraftAsync(new CreateJournalEntryCommand(
                    dto.EntryDate,
                    dto.EntryType,
                    dto.ReferenceNumber,
                    dto.Description,
                    dto.Narration,
                    (dto.Lines ?? new List<CreateJournalLineDto>()).Select(l =>
                        new CreateJournalLineCommand(l.AccountId, l.DebitAmount, l.CreditAmount, l.Description)).ToList()));

                return Ok(new { message = "Journal entry created as draft.", id = created.Id, journalNumber = created.JournalNumber });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id:guid}/post")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Post(Guid id)
        {
            try
            {
                var userId = GetUserId();
                await _journalEntries.PostAsync(id, userId == Guid.Empty ? null : userId);
                return Ok(new { message = "Journal entry posted.", id });
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteDraft(Guid id)
        {
            try
            {
                await _journalEntries.DeleteDraftAsync(id);
                return Ok(new { message = "Draft journal entry removed." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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
