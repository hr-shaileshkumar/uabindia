using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Services;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/recruitment")]
    [Route("api/v1/hrms/recruitment")]
    [Authorize]
    public class RecruitmentController : ControllerBase
    {
        private readonly IRecruitmentRepository _recruitmentRepo;
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ICacheService _cache;
        private readonly IWebsiteContentService _websiteContentService;
        private readonly IRecruitmentLifecycleService _lifecycle;

        public RecruitmentController(
            IRecruitmentRepository recruitmentRepo,
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ICacheService cache,
            IWebsiteContentService websiteContentService,
            IRecruitmentLifecycleService lifecycle)
        {
            _recruitmentRepo = recruitmentRepo;
            _db = db;
            _tenantAccessor = tenantAccessor;
            _cache = cache;
            _websiteContentService = websiteContentService;
            _lifecycle = lifecycle;
        }

        #region Job Posting Endpoints

        /// <summary>
        /// Create a new job posting (HR Admin only).
        /// </summary>
        [HttpPost("job-postings")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> CreateJobPosting([FromBody] CreateJobPostingDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (dto.MaxSalary < dto.MinSalary)
                return BadRequest(new { message = "Max salary cannot be less than min salary" });

            if (dto.ClosingDate <= DateTime.UtcNow)
                return BadRequest(new { message = "Closing date must be in the future" });

            try
            {
                var jobPosting = new JobPosting
                {
                    TenantId = tenantId,
                    Title = dto.Title,
                    Description = dto.Description,
                    Department = dto.Department,
                    Location = dto.Location,
                    Level = Enum.TryParse<JobLevel>(dto.Level, ignoreCase: true, out var level) ? level : JobLevel.MidLevel,
                    JobType = Enum.TryParse<JobType>(dto.JobType, ignoreCase: true, out var jobType) ? jobType : JobType.FullTime,
                    MinSalary = dto.MinSalary,
                    MaxSalary = dto.MaxSalary,
                    RequiredSkills = dto.RequiredSkills,
                    NiceToHaveSkills = dto.NiceToHaveSkills,
                    ClosingDate = dto.ClosingDate,
                    Status = JobStatus.Draft,
                    IsActive = false,
                    CreatedBy = Guid.TryParse(userId, out var userGuid) ? userGuid : (Guid?)null,
                    NumberOfPositions = dto.NumberOfPositions ?? 1,
                    StaffingPlanId = dto.StaffingPlanId
                };

                if (dto.StaffingPlanId.HasValue)
                {
                    var plan = await _db.StaffingPlans.FirstOrDefaultAsync(p => p.Id == dto.StaffingPlanId.Value && p.TenantId == tenantId && !p.IsDeleted);
                    if (plan != null && string.IsNullOrWhiteSpace(jobPosting.Department))
                        jobPosting.Department = plan.Department;
                }

                await _recruitmentRepo.CreateJobPostingAsync(jobPosting);
                await InvalidateJobPostingCache(tenantId);

                return Ok(new
                {
                    message = "Job posting created successfully",
                    jobPosting = MapJobPostingToDto(jobPosting)
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error creating job posting" });
            }
        }

        /// <summary>
        /// Get all job postings for the tenant.
        /// </summary>
        [HttpGet("job-postings")]
        [HttpGet("postings")]
        [HttpGet("")]
        public async Task<IActionResult> GetJobPostings([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 50) limit = 50;

            var tenantId = _tenantAccessor.GetTenantId();
            var cacheKey = $"job_postings_{tenantId}_{page}_{limit}";

            var cached = await _cache.GetAsync<object>(cacheKey);
            if (cached != null)
                return Ok(cached);

            try
            {
                var jobPostings = await _recruitmentRepo.GetAllJobPostingsAsync(tenantId, (page - 1) * limit, limit);
                var total = await _db.JobPostings
                    .Where(jp => jp.TenantId == tenantId && !jp.IsDeleted)
                    .CountAsync();

                var list = jobPostings.Select(MapJobPostingToDto).ToList();
                var response = new
                {
                    data = list,
                    items = list,
                    jobPostings = list,
                    total,
                    page,
                    limit
                };

                await _cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(10));

                return Ok(response);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error fetching job postings" });
            }
        }

        /// <summary>
        /// Get active job postings (for public listings).
        /// </summary>
        [HttpGet("job-postings/active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveJobPostings([FromQuery] int page = 1, [FromQuery] int limit = 10, [FromQuery] string? audience = null)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 50) limit = 50;

            var normalizedAudience = string.Equals(audience, "platform", StringComparison.OrdinalIgnoreCase)
                ? "platform"
                : "tenant";
            var tenant = await _websiteContentService.ResolveTenantForPublicAudienceAsync(normalizedAudience);
            if (tenant == null)
            {
                return Ok(new
                {
                    jobPostings = Array.Empty<JobPostingDto>(),
                    total = 0,
                    page,
                    limit
                });
            }

            var tenantId = tenant.Id;
            var cacheKey = $"active_job_postings_{normalizedAudience}_{tenantId}_{page}_{limit}";

            var cached = await _cache.GetAsync<object>(cacheKey);
            if (cached != null)
                return Ok(cached);

            try
            {
                var jobPostings = await _recruitmentRepo.GetActiveJobPostingsAsync(tenantId, (page - 1) * limit, limit);
                var total = await _db.JobPostings
                    .Where(jp => jp.TenantId == tenantId && jp.IsActive && !jp.IsDeleted)
                    .CountAsync();

                var response = new
                {
                    jobPostings = jobPostings.Select(MapJobPostingToDto),
                    total,
                    page,
                    limit
                };

                await _cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(15));

                return Ok(response);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error fetching job postings" });
            }
        }

        /// <summary>
        /// Get a specific job posting.
        /// </summary>
        [HttpGet("job-postings/{id:guid}")]
        public async Task<IActionResult> GetJobPosting(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var jobPosting = await _recruitmentRepo.GetJobPostingByIdAsync(id, tenantId);
                if (jobPosting == null)
                    return NotFound(new { message = "Job posting not found" });

                return Ok(new { jobPosting = MapJobPostingToDto(jobPosting) });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error fetching job posting" });
            }
        }

        /// <summary>
        /// Update a job posting (HR Admin only).
        /// </summary>
        [HttpPut("job-postings/{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateJobPosting(Guid id, [FromBody] UpdateJobPostingDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var jobPosting = await _recruitmentRepo.GetJobPostingByIdAsync(id, tenantId);
                if (jobPosting == null)
                    return NotFound(new { message = "Job posting not found" });

                if (!string.IsNullOrEmpty(dto.Title))
                    jobPosting.Title = dto.Title;
                if (!string.IsNullOrEmpty(dto.Description))
                    jobPosting.Description = dto.Description;
                if (!string.IsNullOrEmpty(dto.Department))
                    jobPosting.Department = dto.Department;
                if (!string.IsNullOrEmpty(dto.Location))
                    jobPosting.Location = dto.Location;
                if (dto.MinSalary.HasValue)
                    jobPosting.MinSalary = dto.MinSalary.Value;
                if (dto.MaxSalary.HasValue)
                    jobPosting.MaxSalary = dto.MaxSalary.Value;
                if (!string.IsNullOrEmpty(dto.RequiredSkills))
                    jobPosting.RequiredSkills = dto.RequiredSkills;
                if (!string.IsNullOrEmpty(dto.NiceToHaveSkills))
                    jobPosting.NiceToHaveSkills = dto.NiceToHaveSkills;
                if (dto.ClosingDate.HasValue)
                    jobPosting.ClosingDate = dto.ClosingDate.Value;
                if (!string.IsNullOrEmpty(dto.Status))
                {
                    if (Enum.TryParse<JobStatus>(dto.Status, ignoreCase: true, out var status))
                        jobPosting.Status = status;
                }
                if (dto.NumberOfPositions.HasValue)
                    jobPosting.NumberOfPositions = dto.NumberOfPositions.Value;
                if (dto.StaffingPlanId.HasValue)
                    jobPosting.StaffingPlanId = dto.StaffingPlanId.Value;

                await _recruitmentRepo.UpdateJobPostingAsync(jobPosting);
                await InvalidateJobPostingCache(tenantId);

                return Ok(new { message = "Job posting updated successfully", jobPosting = MapJobPostingToDto(jobPosting) });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error updating job posting" });
            }
        }

        /// <summary>
        /// Publish a job posting (change status to Open and set IsActive) (HR Admin only).
        /// </summary>
        [HttpPost("job-postings/{id:guid}/publish")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> PublishJobPosting(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var jobPosting = await _lifecycle.PublishAsync(id);
                await InvalidateJobPostingCache(tenantId);
                return Ok(new { message = "Job posting published successfully", jobPosting = MapJobPostingToDto(jobPosting) });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Job posting not found" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error publishing job posting" });
            }
        }

        /// <summary>
        /// Close a job posting (change status to Closed) (HR Admin only).
        /// </summary>
        [HttpPost("job-postings/{id:guid}/close")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> CloseJobPosting(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var jobPosting = await _lifecycle.CloseAsync(id);
                await InvalidateJobPostingCache(tenantId);
                return Ok(new { message = "Job posting closed successfully", jobPosting = MapJobPostingToDto(jobPosting) });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Job posting not found" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error closing job posting" });
            }
        }

        /// <summary>
        /// Delete a job posting (HR Admin only).
        /// </summary>
        [HttpDelete("job-postings/{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteJobPosting(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                await _recruitmentRepo.DeleteJobPostingAsync(id, tenantId);
                await InvalidateJobPostingCache(tenantId);

                return Ok(new { message = "Job posting deleted successfully" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error deleting job posting" });
            }
        }

        #endregion

        #region Candidate Endpoints

        /// <summary>
        /// Apply for a job (submit candidate application).
        /// </summary>
        [HttpPost("apply")]
        [AllowAnonymous]
        public async Task<IActionResult> ApplyForJob([FromBody] CreateCandidateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var result = await _lifecycle.ApplyAsync(new ApplyForJobCommand(
                    dto.JobPostingId,
                    dto.FirstName,
                    dto.LastName,
                    dto.Email,
                    dto.PhoneNumber,
                    dto.CurrentCompany,
                    dto.CurrentDesignation,
                    dto.YearsOfExperience,
                    dto.CoverLetter,
                    dto.SourceOfRecruit));

                return Ok(new
                {
                    message = "Application submitted successfully",
                    candidate = MapCandidateToDto(result.Candidate, result.JobPosting)
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error submitting application" });
            }
        }

        /// <summary>
        /// Get candidates for a job posting (HR/Recruiter).
        /// </summary>
        [HttpGet("job-postings/{jobPostingId:guid}/candidates")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetCandidatesByJobPosting(Guid jobPostingId, [FromQuery] int page = 1, [FromQuery] int limit = 20)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 50) limit = 50;

            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var candidates = await _recruitmentRepo.GetCandidatesByJobPostingAsync(jobPostingId, tenantId, (page - 1) * limit, limit);
                var total = await _recruitmentRepo.GetApplicationCountByJobPostingAsync(jobPostingId, tenantId);

                var jobPosting = await _recruitmentRepo.GetJobPostingByIdAsync(jobPostingId, tenantId);
                if (jobPosting == null)
                    return NotFound(new { message = "Job posting not found" });

                return Ok(new
                {
                    candidates = candidates.Select(c => MapCandidateToDto(c, jobPosting)),
                    total,
                    page,
                    limit
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error fetching candidates" });
            }
        }

        /// <summary>
        /// Get a specific candidate.
        /// </summary>
        [HttpGet("candidates/{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetCandidate(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var candidate = await _recruitmentRepo.GetCandidateByIdAsync(id, tenantId);
                if (candidate == null)
                    return NotFound(new { message = "Candidate not found" });

                return Ok(new { candidate = MapCandidateToDto(candidate, candidate.JobPosting) });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error fetching candidate" });
            }
        }

        /// <summary>
        /// Update candidate details (HR/Recruiter).
        /// </summary>
        [HttpPut("candidates/{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateCandidate(Guid id, [FromBody] UpdateCandidateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var candidate = await _recruitmentRepo.GetCandidateByIdAsync(id, tenantId);
                if (candidate == null)
                    return NotFound(new { message = "Candidate not found" });

                if (!string.IsNullOrEmpty(dto.FirstName))
                    candidate.FirstName = dto.FirstName;
                if (!string.IsNullOrEmpty(dto.LastName))
                    candidate.LastName = dto.LastName;
                if (!string.IsNullOrEmpty(dto.Email))
                    candidate.Email = dto.Email;
                if (!string.IsNullOrEmpty(dto.PhoneNumber))
                    candidate.PhoneNumber = dto.PhoneNumber;
                if (!string.IsNullOrEmpty(dto.CurrentCompany))
                    candidate.CurrentCompany = dto.CurrentCompany;
                if (!string.IsNullOrEmpty(dto.CurrentDesignation))
                    candidate.CurrentDesignation = dto.CurrentDesignation;
                if (dto.YearsOfExperience.HasValue)
                    candidate.YearsOfExperience = dto.YearsOfExperience.Value;
                if (!string.IsNullOrEmpty(dto.Status))
                {
                    if (Enum.TryParse<CandidateStatus>(dto.Status, ignoreCase: true, out var status))
                        candidate.Status = status;
                }
                if (!string.IsNullOrEmpty(dto.OverallRating))
                {
                    if (Enum.TryParse<RatingLevel>(dto.OverallRating, ignoreCase: true, out var rating))
                        candidate.OverallRating = rating;
                }
                if (!string.IsNullOrEmpty(dto.Notes))
                    candidate.Notes = dto.Notes;

                await _recruitmentRepo.UpdateCandidateAsync(candidate);

                return Ok(new { message = "Candidate updated successfully", candidate = MapCandidateToDto(candidate, candidate.JobPosting) });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error updating candidate" });
            }
        }

        #endregion

        #region Screening Endpoints

        /// <summary>
        /// Schedule a screening interview (HR/Recruiter).
        /// </summary>
        [HttpPost("candidates/{candidateId:guid}/screenings")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ScheduleScreening(Guid candidateId, [FromBody] CreateScreeningDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Guid.TryParse(userId, out var userGuid);

            try
            {
                var screening = await _lifecycle.ScheduleScreeningAsync(
                    candidateId,
                    new ScheduleScreeningCommand(
                        dto.ScreeningType,
                        dto.ScheduledDate,
                        dto.Interviewer,
                        userGuid == Guid.Empty ? null : userGuid));

                return Ok(new
                {
                    message = "Screening scheduled successfully",
                    screening = MapScreeningToDto(screening)
                });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Candidate not found" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error scheduling screening" });
            }
        }

        /// <summary>
        /// Submit screening results (HR/Recruiter).
        /// </summary>
        [HttpPost("screenings/{screeningId:guid}/submit")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> SubmitScreeningResults(Guid screeningId, [FromBody] UpdateScreeningDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var screening = await _lifecycle.SubmitScreeningAsync(
                    screeningId,
                    new SubmitScreeningCommand(
                        TryParseEnum<ScreeningStatus>(dto.Status),
                        TryParseEnum<RatingLevel>(dto.TechnicalSkillsRating),
                        TryParseEnum<RatingLevel>(dto.CommunicationRating),
                        TryParseEnum<RatingLevel>(dto.CulturalFitRating),
                        dto.OverallScore,
                        dto.Comments));

                return Ok(new
                {
                    message = "Screening results submitted successfully",
                    screening = MapScreeningToDto(screening)
                });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Screening not found" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error submitting screening results" });
            }
        }

        #endregion

        #region Applications & Candidates

        [HttpGet("applications")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetAllApplications([FromQuery] int page = 1, [FromQuery] int limit = 50, [FromQuery] Guid? jobPostingId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.JobApplications.AsNoTracking()
                .Include(a => a.Candidate)
                .Include(a => a.JobPosting)
                .Where(a => a.TenantId == tenantId && !a.IsDeleted);

            if (jobPostingId.HasValue)
                query = query.Where(a => a.JobPostingId == jobPostingId.Value);

            var total = await query.CountAsync();
            var rows = await query
                .OrderByDescending(a => a.ApplicationDate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(a => new
                {
                    a.Id,
                    a.CandidateId,
                    CandidateName = $"{a.Candidate.FirstName} {a.Candidate.LastName}",
                    a.Candidate.Email,
                    a.Candidate.PhoneNumber,
                    a.Candidate.CurrentCompany,
                    a.Candidate.CurrentDesignation,
                    a.Candidate.YearsOfExperience,
                    a.Candidate.Resume,
                    a.Candidate.CoverLetter,
                    a.JobPostingId,
                    JobTitle = a.JobPosting.Title,
                    Department = a.JobPosting.Department,
                    Status = a.Status.ToString(),
                    CandidateStatus = a.Candidate.Status.ToString(),
                    OverallRating = a.Candidate.OverallRating.ToString(),
                    a.ScreeningRound,
                    a.ApplicationDate,
                    a.Candidate.InterviewDate
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = rows,
                items = rows,
                total,
                page,
                limit
            });
        }

        [HttpGet("candidates")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetAllCandidates([FromQuery] int page = 1, [FromQuery] int limit = 50, [FromQuery] string? search = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.Candidates.AsNoTracking()
                .Include(c => c.JobPosting)
                .Where(c => c.TenantId == tenantId && !c.IsDeleted);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                query = query.Where(c => c.FirstName.ToLower().Contains(q) || c.LastName.ToLower().Contains(q) || c.Email.ToLower().Contains(q) || c.PhoneNumber.Contains(q));
            }

            var total = await query.CountAsync();
            var candidates = await query
                .OrderByDescending(c => c.AppliedDate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(c => new
                {
                    c.Id,
                    c.FirstName,
                    c.LastName,
                    FullName = $"{c.FirstName} {c.LastName}",
                    c.Email,
                    c.PhoneNumber,
                    c.CurrentCompany,
                    c.CurrentDesignation,
                    c.YearsOfExperience,
                    c.Resume,
                    c.CoverLetter,
                    Status = c.Status.ToString(),
                    OverallRating = c.OverallRating.ToString(),
                    c.SourceOfRecruit,
                    c.Notes,
                    c.AppliedDate,
                    c.InterviewDate,
                    c.InterviewFeedback,
                    c.JobPostingId,
                    JobTitle = c.JobPosting != null ? c.JobPosting.Title : "General"
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = candidates,
                items = candidates,
                total,
                page,
                limit
            });
        }

        #endregion

        #region Offer Letter Endpoints

        [HttpGet("offer-letters")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetAllOfferLetters([FromQuery] int page = 1, [FromQuery] int limit = 50)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.OfferLetters.AsNoTracking()
                .Include(o => o.Candidate)
                .Include(o => o.JobPosting)
                .Include(o => o.Employee)
                .Where(o => o.TenantId == tenantId && !o.IsDeleted);

            var total = await query.CountAsync();
            var offers = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(o => new
                {
                    o.Id,
                    o.CandidateId,
                    CandidateName = o.Candidate != null ? $"{o.Candidate.FirstName} {o.Candidate.LastName}" : "Unknown",
                    CandidateEmail = o.Candidate != null ? o.Candidate.Email : string.Empty,
                    CandidatePhone = o.Candidate != null ? o.Candidate.PhoneNumber : string.Empty,
                    o.JobPostingId,
                    JobTitle = o.JobPosting != null ? o.JobPosting.Title : "Unknown",
                    o.Department,
                    o.JoiningDesignation,
                    o.OfferSalary,
                    AnnualCtc = o.OfferSalary,
                    MonthlyGross = Math.Round(o.OfferSalary / 12m, 2),
                    o.OfferDate,
                    o.ExpiryDate,
                    o.JoiningDate,
                    o.ReportingManager,
                    o.OfferTerms,
                    Status = o.Status.ToString(),
                    o.AcceptedDate,
                    o.RejectedDate,
                    o.RejectionReason,
                    o.IsJoined,
                    o.EmployeeId,
                    EmployeeCode = o.Employee != null ? o.Employee.EmployeeCode : null,
                    o.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = offers,
                items = offers,
                total,
                page,
                limit
            });
        }

        [HttpPost("candidates/{candidateId:guid}/offer-letters")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> IssueOfferLetter(Guid candidateId, [FromBody] CreateOfferLetterDto dto)
        {
            try
            {
                var offer = await _lifecycle.IssueOfferLetterAsync(new IssueOfferLetterCommand(
                    candidateId,
                    dto.OfferSalary,
                    dto.JoiningDate ?? DateTime.UtcNow.AddDays(15),
                    dto.ExpiryDate,
                    dto.JoiningDesignation,
                    dto.Department,
                    dto.ReportingManager,
                    dto.OfferTerms));

                return Ok(new
                {
                    success = true,
                    message = "Formal offer letter issued successfully.",
                    data = offer
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("offer-letters/{id:guid}/accept")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> AcceptOfferLetter(Guid id)
        {
            try
            {
                var offer = await _lifecycle.AcceptOfferLetterAsync(id);
                return Ok(new
                {
                    success = true,
                    message = "Candidate offer marked as accepted.",
                    data = offer
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("offer-letters/{id:guid}/reject")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> RejectOfferLetter(Guid id, [FromBody] RejectOfferDto? dto)
        {
            try
            {
                var offer = await _lifecycle.RejectOfferLetterAsync(id, dto?.Reason);
                return Ok(new
                {
                    success = true,
                    message = "Offer letter marked as rejected.",
                    data = offer
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("offer-letters/{id:guid}/convert-to-employee")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ConvertOfferToEmployee(Guid id)
        {
            try
            {
                var employee = await _lifecycle.ConvertCandidateToEmployeeAsync(id);
                return Ok(new
                {
                    success = true,
                    message = $"Candidate successfully onboarded as Employee ({employee.EmployeeCode})!",
                    data = new
                    {
                        employee.Id,
                        employee.EmployeeCode,
                        employee.FullName,
                        employee.WorkEmail,
                        employee.DateOfJoining,
                        employee.Status
                    }
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        #endregion

        #region Appointment Letter Endpoints

        [HttpGet("appointment-letters")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetAllAppointmentLetters([FromQuery] int page = 1, [FromQuery] int limit = 50)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.AppointmentLetters.AsNoTracking()
                .Include(a => a.Employee)
                .Where(a => a.TenantId == tenantId && !a.IsDeleted);

            var total = await query.CountAsync();
            var letters = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(a => new
                {
                    a.Id,
                    a.LetterNumber,
                    a.EmployeeId,
                    EmployeeName = a.Employee != null ? a.Employee.FullName : "Unknown",
                    EmployeeCode = a.Employee != null ? a.Employee.EmployeeCode : string.Empty,
                    EmployeeEmail = a.Employee != null ? a.Employee.WorkEmail : string.Empty,
                    EmployeePhone = a.Employee != null ? a.Employee.Phone : string.Empty,
                    a.IssueDate,
                    a.JoiningDate,
                    a.Designation,
                    a.Department,
                    a.WorkLocation,
                    a.AnnualCtc,
                    a.MonthlyGross,
                    a.ProbationMonths,
                    a.NoticePeriodDays,
                    a.TermsAndConditions,
                    a.SignatoryName,
                    a.SignatoryDesignation,
                    a.Status,
                    a.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = letters,
                items = letters,
                total,
                page,
                limit
            });
        }

        [HttpGet("appointment-letters/{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetAppointmentLetterById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var letter = await _db.AppointmentLetters.AsNoTracking()
                .Include(a => a.Employee)
                .Where(a => a.Id == id && a.TenantId == tenantId && !a.IsDeleted)
                .Select(a => new
                {
                    a.Id,
                    a.LetterNumber,
                    a.EmployeeId,
                    EmployeeName = a.Employee != null ? a.Employee.FullName : "Unknown",
                    EmployeeCode = a.Employee != null ? a.Employee.EmployeeCode : string.Empty,
                    EmployeeEmail = a.Employee != null ? a.Employee.WorkEmail : string.Empty,
                    EmployeePhone = a.Employee != null ? a.Employee.Phone : string.Empty,
                    a.IssueDate,
                    a.JoiningDate,
                    a.Designation,
                    a.Department,
                    a.WorkLocation,
                    a.AnnualCtc,
                    a.MonthlyGross,
                    a.ProbationMonths,
                    a.NoticePeriodDays,
                    a.TermsAndConditions,
                    a.SignatoryName,
                    a.SignatoryDesignation,
                    a.Status,
                    a.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (letter == null)
                return NotFound(new { success = false, message = "Appointment letter not found" });

            return Ok(new { success = true, data = letter });
        }

        [HttpPost("appointment-letters")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> IssueAppointmentLetter([FromBody] CreateAppointmentLetterDto dto)
        {
            if (dto.EmployeeId == Guid.Empty)
                return BadRequest(new { success = false, message = "Employee ID is required." });

            try
            {
                var letter = await _lifecycle.IssueAppointmentLetterAsync(new IssueAppointmentLetterCommand(
                    dto.EmployeeId,
                    dto.JoiningDate,
                    dto.Designation,
                    dto.Department,
                    dto.WorkLocation,
                    dto.AnnualCtc,
                    dto.MonthlyGross,
                    dto.ProbationMonths,
                    dto.NoticePeriodDays,
                    dto.TermsAndConditions,
                    dto.SignatoryName,
                    dto.SignatoryDesignation));

                return Ok(new
                {
                    success = true,
                    message = $"Official Appointment Letter ({letter.LetterNumber}) issued successfully.",
                    data = letter
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        #endregion

        #region Helper Methods

        private static TEnum? TryParseEnum<TEnum>(string? value) where TEnum : struct, Enum
        {
            return Enum.TryParse(value, ignoreCase: true, out TEnum parsed) ? parsed : null;
        }

        private JobPostingDto MapJobPostingToDto(JobPosting jobPosting)
        {
            return new JobPostingDto
            {
                Id = jobPosting.Id,
                Title = jobPosting.Title,
                Description = jobPosting.Description,
                Department = jobPosting.Department,
                Location = jobPosting.Location,
                Level = jobPosting.Level.ToString(),
                JobType = jobPosting.JobType.ToString(),
                MinSalary = jobPosting.MinSalary,
                MaxSalary = jobPosting.MaxSalary,
                RequiredSkills = jobPosting.RequiredSkills,
                NiceToHaveSkills = jobPosting.NiceToHaveSkills,
                PostedDate = jobPosting.PostedDate,
                ClosingDate = jobPosting.ClosingDate,
                Status = jobPosting.Status.ToString(),
                IsActive = jobPosting.IsActive,
                ApplicationCount = jobPosting.ApplicationCount,
                NumberOfPositions = jobPosting.NumberOfPositions,
                StaffingPlanId = jobPosting.StaffingPlanId,
                StaffingPlanCode = jobPosting.StaffingPlan?.PlanCode,
                CreatedAt = jobPosting.CreatedAt
            };
        }

        private CandidateDto MapCandidateToDto(Candidate candidate, JobPosting? jobPosting = null)
        {
            return new CandidateDto
            {
                Id = candidate.Id,
                FirstName = candidate.FirstName,
                LastName = candidate.LastName,
                Email = candidate.Email,
                PhoneNumber = candidate.PhoneNumber,
                CurrentCompany = candidate.CurrentCompany,
                CurrentDesignation = candidate.CurrentDesignation,
                YearsOfExperience = candidate.YearsOfExperience,
                Resume = candidate.Resume,
                CoverLetter = candidate.CoverLetter,
                Status = candidate.Status.ToString(),
                OverallRating = candidate.OverallRating.ToString(),
                SourceOfRecruit = candidate.SourceOfRecruit,
                Notes = candidate.Notes,
                AppliedDate = candidate.AppliedDate,
                InterviewDate = candidate.InterviewDate,
                JobPostingId = candidate.JobPostingId,
                JobTitle = jobPosting?.Title ?? "Unknown"
            };
        }

        private ScreeningDto MapScreeningToDto(CandidateScreening screening)
        {
            return new ScreeningDto
            {
                Id = screening.Id,
                CandidateId = screening.CandidateId,
                ScreeningType = screening.ScreeningType,
                ScheduledDate = screening.ScheduledDate,
                Status = screening.Status.ToString(),
                Interviewer = screening.Interviewer,
                TechnicalSkillsRating = screening.TechnicalSkillsRating.ToString(),
                CommunicationRating = screening.CommunicationRating.ToString(),
                CulturalFitRating = screening.CulturalFitRating.ToString(),
                OverallScore = screening.OverallScore,
                Comments = screening.Comments,
                CompletedDate = screening.CompletedDate
            };
        }

        private async Task InvalidateJobPostingCache(Guid tenantId)
        {
            for (int page = 1; page <= 5; page++)
            {
                for (int limit = 10; limit <= 50; limit += 10)
                {
                    await _cache.RemoveAsync($"job_postings_{tenantId}_{page}_{limit}");
                    await _cache.RemoveAsync($"active_job_postings_{tenantId}_{page}_{limit}");
                }
            }
        }

        #endregion
    }

    public class RejectOfferDto
    {
        public string? Reason { get; set; }
    }
}
