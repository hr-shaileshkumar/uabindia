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
    [Route("api/v1/[controller]")]
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
                    NumberOfPositions = dto.NumberOfPositions ?? 1
                };

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

                var response = new
                {
                    jobPostings = jobPostings.Select(MapJobPostingToDto),
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
}
