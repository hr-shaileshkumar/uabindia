using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    /// <summary>
    /// Projection APIs that aggregate screening data across all candidates.
    /// These are read-model endpoints — they do not own data, they project it.
    /// </summary>
    [ApiController]
    [Route("api/v1/screenings")]
    [Authorize]
    public class ScreeningsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public ScreeningsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        /// <summary>
        /// Screening Schedule — all upcoming and past interviews across all job postings.
        /// Supports filters: status, date range, search by candidate name.
        /// </summary>
        [HttpGet("schedule")]
        public async Task<IActionResult> GetSchedule(
            [FromQuery] string? status,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20)
        {
            if (page < 1) page = 1;
            if (limit < 1 || limit > 100) limit = 20;

            var tenantId = _tenantAccessor.GetTenantId();

            var query =
                from s in _db.CandidateScreenings.Where(s => s.TenantId == tenantId && !s.IsDeleted)
                join c in _db.Candidates.Where(c => c.TenantId == tenantId && !c.IsDeleted)
                    on s.CandidateId equals c.Id
                join jp in _db.JobPostings.Where(jp => jp.TenantId == tenantId && !jp.IsDeleted)
                    on c.JobPostingId equals jp.Id
                select new { Screening = s, Candidate = c, Job = jp };

            // Filters
            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.ToLower();
                query = query.Where(x =>
                    (x.Candidate.FirstName + " " + x.Candidate.LastName).ToLower().Contains(q) ||
                    x.Candidate.Email.ToLower().Contains(q) ||
                    x.Job.Title.ToLower().Contains(q));
            }

            if (!string.IsNullOrWhiteSpace(status) &&
                Enum.TryParse<ScreeningStatus>(status, ignoreCase: true, out var parsedStatus))
            {
                query = query.Where(x => x.Screening.Status == parsedStatus);
            }

            if (fromDate.HasValue)
                query = query.Where(x => x.Screening.ScheduledDate >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(x => x.Screening.ScheduledDate <= toDate.Value);

            var total = await query.CountAsync();

            var rows = await query
                .OrderBy(x => x.Screening.ScheduledDate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(x => new
                {
                    screeningId     = x.Screening.Id,
                    candidateId     = x.Candidate.Id,
                    candidateName   = x.Candidate.FirstName + " " + x.Candidate.LastName,
                    candidateEmail  = x.Candidate.Email,
                    jobTitle        = x.Job.Title,
                    department      = x.Job.Department,
                    screeningType   = x.Screening.ScreeningType,
                    scheduledDate   = x.Screening.ScheduledDate,
                    interviewer     = x.Screening.Interviewer,
                    status          = x.Screening.Status.ToString(),
                    overallScore    = x.Screening.OverallScore,
                    completedDate   = x.Screening.CompletedDate,
                })
                .ToListAsync();

            return Ok(new { schedule = rows, total, page, limit });
        }

        /// <summary>
        /// Screening Results — completed screenings with scores/feedback.
        /// Supports filters: result category (pass/fail via score threshold), date range, search.
        /// </summary>
        [HttpGet("results")]
        public async Task<IActionResult> GetResults(
            [FromQuery] string? result,      // pass | fail
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20)
        {
            if (page < 1) page = 1;
            if (limit < 1 || limit > 100) limit = 20;

            var tenantId = _tenantAccessor.GetTenantId();

            var query =
                from s in _db.CandidateScreenings.Where(s => s.TenantId == tenantId && !s.IsDeleted && s.Status == ScreeningStatus.Completed)
                join c in _db.Candidates.Where(c => c.TenantId == tenantId && !c.IsDeleted)
                    on s.CandidateId equals c.Id
                join jp in _db.JobPostings.Where(jp => jp.TenantId == tenantId && !jp.IsDeleted)
                    on c.JobPostingId equals jp.Id
                select new { Screening = s, Candidate = c, Job = jp };

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.ToLower();
                query = query.Where(x =>
                    (x.Candidate.FirstName + " " + x.Candidate.LastName).ToLower().Contains(q) ||
                    x.Candidate.Email.ToLower().Contains(q) ||
                    x.Job.Title.ToLower().Contains(q));
            }

            if (fromDate.HasValue)
                query = query.Where(x => x.Screening.CompletedDate >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(x => x.Screening.CompletedDate <= toDate.Value);

            // Pass threshold = 60
            if (result == "pass")
                query = query.Where(x => x.Screening.OverallScore >= 60);
            else if (result == "fail")
                query = query.Where(x => x.Screening.OverallScore < 60);

            var total = await query.CountAsync();

            var rows = await query
                .OrderByDescending(x => x.Screening.CompletedDate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(x => new
                {
                    screeningId           = x.Screening.Id,
                    candidateId           = x.Candidate.Id,
                    candidateName         = x.Candidate.FirstName + " " + x.Candidate.LastName,
                    candidateEmail        = x.Candidate.Email,
                    jobTitle              = x.Job.Title,
                    department            = x.Job.Department,
                    screeningType         = x.Screening.ScreeningType,
                    overallScore          = x.Screening.OverallScore,
                    result                = x.Screening.OverallScore >= 60 ? "Pass" : "Fail",
                    technicalRating       = x.Screening.TechnicalSkillsRating.ToString(),
                    communicationRating   = x.Screening.CommunicationRating.ToString(),
                    culturalFitRating     = x.Screening.CulturalFitRating.ToString(),
                    comments              = x.Screening.Comments,
                    interviewer           = x.Screening.Interviewer,
                    completedDate         = x.Screening.CompletedDate,
                    candidateStatus       = x.Candidate.Status.ToString(),
                })
                .ToListAsync();

            return Ok(new { results = rows, total, page, limit });
        }
    }
}
