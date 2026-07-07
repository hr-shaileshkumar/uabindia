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

        public RecruitmentController(
            IRecruitmentRepository recruitmentRepo,
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ICacheService cache,
            IWebsiteContentService websiteContentService)
        {
            _recruitmentRepo = recruitmentRepo;
            _db = db;
            _tenantAccessor = tenantAccessor;
            _cache = cache;
            _websiteContentService = websiteContentService;
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating job posting", error = ex.Message });
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching job postings", error = ex.Message });
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching job postings", error = ex.Message });
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching job posting", error = ex.Message });
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating job posting", error = ex.Message });
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
                var jobPosting = await _recruitmentRepo.GetJobPostingByIdAsync(id, tenantId);
                if (jobPosting == null)
                    return NotFound(new { message = "Job posting not found" });

                jobPosting.Status = JobStatus.Open;
                jobPosting.IsActive = true;

                await _recruitmentRepo.UpdateJobPostingAsync(jobPosting);
                await InvalidateJobPostingCache(tenantId);

                return Ok(new { message = "Job posting published successfully", jobPosting = MapJobPostingToDto(jobPosting) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error publishing job posting", error = ex.Message });
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
                var jobPosting = await _recruitmentRepo.GetJobPostingByIdAsync(id, tenantId);
                if (jobPosting == null)
                    return NotFound(new { message = "Job posting not found" });

                jobPosting.Status = JobStatus.Closed;
                jobPosting.IsActive = false;

                await _recruitmentRepo.UpdateJobPostingAsync(jobPosting);
                await InvalidateJobPostingCache(tenantId);

                return Ok(new { message = "Job posting closed successfully", jobPosting = MapJobPostingToDto(jobPosting) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error closing job posting", error = ex.Message });
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting job posting", error = ex.Message });
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

            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                // Check if job posting exists and is active
                var jobPosting = await _recruitmentRepo.GetJobPostingByIdAsync(dto.JobPostingId, tenantId);
                if (jobPosting == null || !jobPosting.IsActive)
                    return BadRequest(new { message = "Job posting is not available" });

                // Check if candidate already applied
                var existingCandidate = await _recruitmentRepo.GetCandidateByEmailAsync(dto.Email, tenantId);
                if (existingCandidate != null)
                {
                    var existingApp = await _recruitmentRepo.GetApplicationByCandidateAndJobAsync(existingCandidate.Id, dto.JobPostingId, tenantId);
                    if (existingApp != null)
                        return BadRequest(new { message = "You have already applied for this job" });
                }

                var candidate = new Candidate
                {
                    TenantId = tenantId,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName ?? string.Empty,
                    Email = dto.Email ?? string.Empty,
                    PhoneNumber = dto.PhoneNumber ?? string.Empty,
                    CurrentCompany = dto.CurrentCompany ?? string.Empty,
                    CurrentDesignation = dto.CurrentDesignation ?? string.Empty,
                    YearsOfExperience = dto.YearsOfExperience,
                    JobPostingId = dto.JobPostingId,
                    CoverLetter = dto.CoverLetter ?? string.Empty,
                    SourceOfRecruit = dto.SourceOfRecruit ?? string.Empty,
                    Status = CandidateStatus.Applied,
                    OverallRating = RatingLevel.Average
                };

                await _recruitmentRepo.CreateCandidateAsync(candidate);

                // Create application record
                var application = new JobApplication
                {
                    TenantId = tenantId,
                    CandidateId = candidate.Id,
                    JobPostingId = dto.JobPostingId,
                    Status = ApplicationStatus.Applied,
                    ScreeningRound = 1
                };

                await _recruitmentRepo.CreateApplicationAsync(application);

                // Update job posting application count
                jobPosting.ApplicationCount++;
                await _recruitmentRepo.UpdateJobPostingAsync(jobPosting);

                return Ok(new
                {
                    message = "Application submitted successfully",
                    candidate = MapCandidateToDto(candidate, jobPosting)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error submitting application", error = ex.Message });
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching candidates", error = ex.Message });
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching candidate", error = ex.Message });
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating candidate", error = ex.Message });
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

            var tenantId = _tenantAccessor.GetTenantId();
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (dto.ScheduledDate <= DateTime.UtcNow)
                return BadRequest(new { message = "Scheduled date must be in the future" });

            try
            {
                var candidate = await _recruitmentRepo.GetCandidateByIdAsync(candidateId, tenantId);
                if (candidate == null)
                    return NotFound(new { message = "Candidate not found" });

                var screening = new CandidateScreening
                {
                    TenantId = tenantId,
                    CandidateId = candidateId,
                    ScreeningType = dto.ScreeningType,
                    ScheduledDate = dto.ScheduledDate,
                    Status = ScreeningStatus.Scheduled,
                    Interviewer = dto.Interviewer,
                    InterviewedBy = Guid.TryParse(userId, out var userGuid) ? userGuid : (Guid?)null
                };

                await _recruitmentRepo.CreateScreeningAsync(screening);

                // Update candidate status
                candidate.Status = CandidateStatus.InterviewScheduled;
                candidate.InterviewDate = dto.ScheduledDate;
                await _recruitmentRepo.UpdateCandidateAsync(candidate);

                return Ok(new
                {
                    message = "Screening scheduled successfully",
                    screening = MapScreeningToDto(screening)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error scheduling screening", error = ex.Message });
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

            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var screening = await _recruitmentRepo.GetScreeningByIdAsync(screeningId, tenantId);
                if (screening == null)
                    return NotFound(new { message = "Screening not found" });

                if (!string.IsNullOrEmpty(dto.Status))
                {
                    if (Enum.TryParse<ScreeningStatus>(dto.Status, ignoreCase: true, out var status))
                        screening.Status = status;
                }

                if (!string.IsNullOrEmpty(dto.TechnicalSkillsRating))
                {
                    if (Enum.TryParse<RatingLevel>(dto.TechnicalSkillsRating, ignoreCase: true, out var rating))
                        screening.TechnicalSkillsRating = rating;
                }

                if (!string.IsNullOrEmpty(dto.CommunicationRating))
                {
                    if (Enum.TryParse<RatingLevel>(dto.CommunicationRating, ignoreCase: true, out var rating))
                        screening.CommunicationRating = rating;
                }

                if (!string.IsNullOrEmpty(dto.CulturalFitRating))
                {
                    if (Enum.TryParse<RatingLevel>(dto.CulturalFitRating, ignoreCase: true, out var rating))
                        screening.CulturalFitRating = rating;
                }

                if (dto.OverallScore.HasValue)
                    screening.OverallScore = dto.OverallScore.Value;

                if (!string.IsNullOrEmpty(dto.Comments))
                    screening.Comments = dto.Comments;

                if (screening.Status == ScreeningStatus.Completed)
                    screening.CompletedDate = DateTime.UtcNow;

                await _recruitmentRepo.UpdateScreeningAsync(screening);

                return Ok(new
                {
                    message = "Screening results submitted successfully",
                    screening = MapScreeningToDto(screening)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error submitting screening results", error = ex.Message });
            }
        }

        #endregion

        #region Helper Methods

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
