using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/hrms/disciplinary")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class DisciplinaryController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public DisciplinaryController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("cases")]
        public async Task<IActionResult> GetCases(
            [FromQuery] Guid? employeeId = null,
            [FromQuery] string? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.DisciplinaryCases.AsNoTracking().Where(c => c.TenantId == tenantId && !c.IsDeleted);

            if (employeeId.HasValue) query = query.Where(c => c.EmployeeId == employeeId.Value);

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<DisciplinaryStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(c => c.Status == parsedStatus);
            }

            var total = await query.CountAsync(ct);
            var cases = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(c => c.Notices)
                .Include(c => c.Actions)
                .ToListAsync(ct);

            var empIds = cases.Select(c => c.EmployeeId).Distinct().ToList();
            var employees = await _db.Employees.AsNoTracking()
                .Where(e => empIds.Contains(e.Id) && e.TenantId == tenantId)
                .ToDictionaryAsync(e => e.Id, e => new { e.FullName, e.EmployeeCode }, ct);

            var result = cases.Select(c =>
            {
                employees.TryGetValue(c.EmployeeId, out var emp);
                return new DisciplinaryCaseDto
                {
                    Id = c.Id,
                    CaseNumber = c.CaseNumber,
                    EmployeeId = c.EmployeeId,
                    EmployeeName = emp?.FullName ?? "Unknown",
                    EmployeeCode = emp?.EmployeeCode ?? "—",
                    Title = c.Title,
                    Description = c.Description,
                    IncidentDate = c.IncidentDate,
                    Severity = c.Severity.ToString(),
                    Status = c.Status.ToString(),
                    ReportedByName = c.ReportedByName,
                    CreatedAt = c.CreatedAt,
                    ClosedAt = c.ClosedAt,
                    NoticeCount = c.Notices.Count,
                    ActionCount = c.Actions.Count
                };
            }).ToList();

            return Ok(new { total, page, pageSize, items = result });
        }

        [HttpGet("cases/{id:guid}")]
        public async Task<IActionResult> GetCaseById(Guid id, CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var c = await _db.DisciplinaryCases.AsNoTracking()
                .Where(x => x.Id == id && x.TenantId == tenantId && !x.IsDeleted)
                .Include(x => x.Notices.Where(n => !n.IsDeleted))
                .Include(x => x.Actions.Where(a => !a.IsDeleted))
                .FirstOrDefaultAsync(ct);

            if (c == null) return NotFound(new { message = "Disciplinary case not found." });

            var emp = await _db.Employees.AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == c.EmployeeId && e.TenantId == tenantId, ct);

            return Ok(new
            {
                caseDetails = c,
                employee = new { id = emp?.Id, name = emp?.FullName, code = emp?.EmployeeCode, designation = emp?.DesignationId }
            });
        }

        [HttpPost("cases")]
        [Authorize(Roles = "SuperAdmin,Admin,HR Manager,HR")]
        public async Task<IActionResult> CreateCase([FromBody] CreateDisciplinaryCaseDto dto, CancellationToken ct = default)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var empExists = await _db.Employees.AnyAsync(e => e.Id == dto.EmployeeId && e.TenantId == tenantId && !e.IsDeleted, ct);
            if (!empExists) return BadRequest(new { message = "Invalid employee." });

            var year = DateTime.UtcNow.Year;
            var caseCount = await _db.DisciplinaryCases.CountAsync(c => c.TenantId == tenantId && c.CreatedAt.Year == year, ct) + 1;
            var caseNumber = $"DISC-{year}-{caseCount:D3}";

            Enum.TryParse<DisciplinarySeverity>(dto.Severity, true, out var severity);

            var discCase = new DisciplinaryCase
            {
                TenantId = tenantId,
                EmployeeId = dto.EmployeeId,
                CaseNumber = caseNumber,
                Title = dto.Title,
                Description = dto.Description,
                IncidentDate = dto.IncidentDate,
                Severity = severity,
                Status = DisciplinaryStatus.Draft,
                ReportedByName = User.Identity?.Name ?? "HR Administrator",
                CreatedAt = DateTime.UtcNow
            };

            _db.DisciplinaryCases.Add(discCase);
            await _db.SaveChangesAsync(ct);

            return Ok(new { message = "Disciplinary case registered.", discCase.Id, discCase.CaseNumber });
        }

        [HttpPost("cases/{id:guid}/show-cause")]
        [Authorize(Roles = "SuperAdmin,Admin,HR Manager,HR")]
        public async Task<IActionResult> IssueShowCauseNotice(Guid id, [FromBody] IssueShowCauseNoticeDto dto, CancellationToken ct = default)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var discCase = await _db.DisciplinaryCases.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted, ct);
            if (discCase == null) return NotFound(new { message = "Disciplinary case not found." });

            var noticeCount = await _db.ShowCauseNotices.CountAsync(n => n.DisciplinaryCaseId == id, ct) + 1;
            var noticeNumber = $"{discCase.CaseNumber}-SCN-{noticeCount:D2}";
            var days = dto.DaysToRespond > 0 ? dto.DaysToRespond : 7;

            var notice = new ShowCauseNotice
            {
                TenantId = tenantId,
                DisciplinaryCaseId = id,
                NoticeNumber = noticeNumber,
                NoticeDate = DateTime.UtcNow,
                Subject = dto.Subject,
                Allegations = dto.Allegations,
                ExplanationDueDate = DateTime.UtcNow.Date.AddDays(days),
                IssuedByName = User.Identity?.Name ?? "HR Authority",
                CreatedAt = DateTime.UtcNow
            };

            discCase.Status = DisciplinaryStatus.NoticeIssued;
            discCase.UpdatedAt = DateTime.UtcNow;

            _db.ShowCauseNotices.Add(notice);
            await _db.SaveChangesAsync(ct);

            return Ok(new { message = "Show-cause notice issued successfully.", notice.Id, notice.NoticeNumber, notice.ExplanationDueDate });
        }

        [HttpPost("notices/{noticeId:guid}/explanation")]
        public async Task<IActionResult> SubmitExplanation(Guid noticeId, [FromBody] SubmitExplanationDto dto, CancellationToken ct = default)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var notice = await _db.ShowCauseNotices.FirstOrDefaultAsync(n => n.Id == noticeId && n.TenantId == tenantId && !n.IsDeleted, ct);
            if (notice == null) return NotFound(new { message = "Show-cause notice not found." });

            notice.EmployeeExplanation = dto.Explanation;
            notice.ExplanationSubmittedAt = DateTime.UtcNow;
            notice.UpdatedAt = DateTime.UtcNow;

            var discCase = await _db.DisciplinaryCases.FirstOrDefaultAsync(c => c.Id == notice.DisciplinaryCaseId && c.TenantId == tenantId, ct);
            if (discCase != null)
            {
                discCase.Status = DisciplinaryStatus.ExplanationSubmitted;
                discCase.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Explanation recorded successfully.", notice.Id, notice.ExplanationSubmittedAt });
        }

        [HttpPost("cases/{id:guid}/action")]
        [Authorize(Roles = "SuperAdmin,Admin,HR Manager")]
        public async Task<IActionResult> IssueDisciplinaryAction(Guid id, [FromBody] IssueDisciplinaryActionDto dto, CancellationToken ct = default)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var discCase = await _db.DisciplinaryCases.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted, ct);
            if (discCase == null) return NotFound(new { message = "Disciplinary case not found." });

            Enum.TryParse<DisciplinaryActionType>(dto.ActionType, true, out var actionType);

            var orderNumber = $"{discCase.CaseNumber}-ORD";
            var action = new DisciplinaryAction
            {
                TenantId = tenantId,
                DisciplinaryCaseId = id,
                EmployeeId = discCase.EmployeeId,
                OrderNumber = orderNumber,
                ActionType = actionType,
                OrderDate = DateTime.UtcNow,
                EffectiveDate = dto.EffectiveDate,
                EndDate = dto.EndDate,
                PenaltyDetails = dto.PenaltyDetails,
                MonetaryFine = dto.MonetaryFine,
                SuspensionDays = dto.SuspensionDays,
                DecidedByName = User.Identity?.Name ?? "Disciplinary Authority",
                CreatedAt = DateTime.UtcNow
            };

            discCase.Status = DisciplinaryStatus.Closed;
            discCase.ClosedAt = DateTime.UtcNow;
            discCase.UpdatedAt = DateTime.UtcNow;

            _db.DisciplinaryActions.Add(action);
            await _db.SaveChangesAsync(ct);

            return Ok(new { message = "Disciplinary order recorded and case closed.", action.Id, action.OrderNumber, actionType = action.ActionType.ToString() });
        }
    }
}
