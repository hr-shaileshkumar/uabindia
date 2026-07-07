using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class AppraisalsController : ControllerBase
    {
        private readonly IAppraisalRepository _appraisalRepo;
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ICacheService _cache;

        public AppraisalsController(
            IAppraisalRepository appraisalRepo,
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ICacheService cache)
        {
            _appraisalRepo = appraisalRepo;
            _db = db;
            _tenantAccessor = tenantAccessor;
            _cache = cache;
        }

        #region Appraisal Cycle Management

        /// <summary>
        /// Create a new appraisal cycle (HR Admin only).
        /// </summary>
        [HttpPost("cycles")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> CreateAppraisalCycle([FromBody] CreateAppraisalCycleDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (dto.EndDate <= dto.StartDate)
                return BadRequest(new { message = "End date must be after start date" });

            if (dto.SelfAssessmentDeadline > dto.ManagerAssessmentDeadline)
                return BadRequest(new { message = "Manager assessment deadline must be after self-assessment deadline" });

            try
            {
                var cycle = new AppraisalCycle
                {
                    TenantId = tenantId,
                    Name = dto.Name,
                    Description = dto.Description,
                    StartDate = dto.StartDate,
                    EndDate = dto.EndDate,
                    SelfAssessmentDeadline = dto.SelfAssessmentDeadline,
                    ManagerAssessmentDeadline = dto.ManagerAssessmentDeadline,
                    Status = AppraisalCycleStatus.Draft,
                    IsActive = false,
                    CreatedBy = Guid.Parse(userId ?? Guid.Empty.ToString())
                };

                await _appraisalRepo.CreateAppraisalCycleAsync(cycle);

                // Invalidate cache
                await InvalidateCycleCache(tenantId);

                return Ok(new
                {
                    message = "Appraisal cycle created successfully",
                    cycle = MapCycleToDto(cycle)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating appraisal cycle", error = ex.Message });
            }
        }

        /// <summary>
        /// Get all appraisal cycles for the tenant.
        /// </summary>
        [HttpGet("cycles")]
        public async Task<IActionResult> GetAppraisalCycles([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 50) limit = 50;

            var tenantId = _tenantAccessor.GetTenantId();
            var cacheKey = $"appraisal_cycles_{tenantId}_{page}_{limit}";

            var cached = await _cache.GetAsync<object>(cacheKey);
            if (cached != null)
                return Ok(cached);

            try
            {
                var cycles = await _appraisalRepo.GetAppraisalCyclesAsync(tenantId, (page - 1) * limit, limit);
                var total = await _db.AppraisalCycles
                    .Where(c => c.TenantId == tenantId && !c.IsDeleted)
                    .CountAsync();

                var response = new
                {
                    cycles = cycles.Select(MapCycleToDto),
                    total,
                    page,
                    limit
                };

                await _cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(10));

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching appraisal cycles", error = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific appraisal cycle by ID.
        /// </summary>
        [HttpGet("cycles/{id:guid}")]
        public async Task<IActionResult> GetAppraisalCycle(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var cycle = await _appraisalRepo.GetAppraisalCycleByIdAsync(id, tenantId);
                if (cycle == null)
                    return NotFound(new { message = "Appraisal cycle not found" });

                return Ok(new { cycle = MapCycleToDto(cycle) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching appraisal cycle", error = ex.Message });
            }
        }

        /// <summary>
        /// Update an appraisal cycle (HR Admin only).
        /// </summary>
        [HttpPut("cycles/{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateAppraisalCycle(Guid id, [FromBody] UpdateAppraisalCycleDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var cycle = await _appraisalRepo.GetAppraisalCycleByIdAsync(id, tenantId);
                if (cycle == null)
                    return NotFound(new { message = "Appraisal cycle not found" });

                if (!string.IsNullOrEmpty(dto.Name))
                    cycle.Name = dto.Name;
                if (!string.IsNullOrEmpty(dto.Description))
                    cycle.Description = dto.Description;
                if (dto.StartDate.HasValue)
                    cycle.StartDate = dto.StartDate.Value;
                if (dto.EndDate.HasValue)
                    cycle.EndDate = dto.EndDate.Value;
                if (dto.SelfAssessmentDeadline.HasValue)
                    cycle.SelfAssessmentDeadline = dto.SelfAssessmentDeadline.Value;
                if (dto.ManagerAssessmentDeadline.HasValue)
                    cycle.ManagerAssessmentDeadline = dto.ManagerAssessmentDeadline.Value;

                if (!string.IsNullOrEmpty(dto.Status))
                {
                    if (Enum.TryParse<AppraisalCycleStatus>(dto.Status, out var status))
                        cycle.Status = status;
                }

                await _appraisalRepo.UpdateAppraisalCycleAsync(cycle);
                await InvalidateCycleCache(tenantId);

                return Ok(new { message = "Appraisal cycle updated successfully", cycle = MapCycleToDto(cycle) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating appraisal cycle", error = ex.Message });
            }
        }

        /// <summary>
        /// Delete an appraisal cycle (HR Admin only).
        /// </summary>
        [HttpDelete("cycles/{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteAppraisalCycle(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                await _appraisalRepo.DeleteAppraisalCycleAsync(id, tenantId);
                await InvalidateCycleCache(tenantId);

                return Ok(new { message = "Appraisal cycle deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting appraisal cycle", error = ex.Message });
            }
        }

        /// <summary>
        /// Activate an appraisal cycle (only one can be active) (HR Admin only).
        /// </summary>
        [HttpPost("cycles/{id:guid}/activate")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ActivateAppraisalCycle(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var cycle = await _appraisalRepo.GetAppraisalCycleByIdAsync(id, tenantId);
                if (cycle == null)
                    return NotFound(new { message = "Appraisal cycle not found" });

                // Deactivate existing active cycle
                var activeCycle = await _appraisalRepo.GetActiveAppraisalCycleAsync(tenantId);
                if (activeCycle != null)
                {
                    activeCycle.IsActive = false;
                    await _appraisalRepo.UpdateAppraisalCycleAsync(activeCycle);
                }

                // Activate new cycle
                cycle.IsActive = true;
                cycle.Status = AppraisalCycleStatus.Active;
                await _appraisalRepo.UpdateAppraisalCycleAsync(cycle);

                // Create appraisals for all active employees
                await CreateAppriasalsForAllEmployees(cycle);
                await InvalidateCycleCache(tenantId);

                return Ok(new { message = "Appraisal cycle activated successfully", cycle = MapCycleToDto(cycle) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error activating appraisal cycle", error = ex.Message });
            }
        }

        #endregion

        #region Performance Appraisal Management

        /// <summary>
        /// Create a new appraisal (HR/Manager).
        /// </summary>
        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> CreateAppraisal([FromBody] CreatePerformanceAppraisalDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var exists = await _appraisalRepo.AppraisalExistsAsync(dto.EmployeeId, dto.AppraisalCycleId, tenantId);
                if (exists)
                    return BadRequest(new { message = "Appraisal already exists for this employee and cycle" });

                var appraisal = new PerformanceAppraisal
                {
                    TenantId = tenantId,
                    EmployeeId = dto.EmployeeId,
                    ManagerId = dto.ManagerId,
                    AppraisalCycleId = dto.AppraisalCycleId,
                    Status = AppraisalStatus.Pending,
                    SelfAssessmentComments = dto.SelfAssessmentComments,
                    IsFinalized = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _appraisalRepo.CreateAppraisalAsync(appraisal);

                return Ok(new
                {
                    message = "Appraisal created successfully",
                    appraisal = MapAppraisalToDto(appraisal)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating appraisal", error = ex.Message });
            }
        }

        /// <summary>
        /// Update appraisal details (HR/Manager).
        /// </summary>
        [HttpPut("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateAppraisal(Guid id, [FromBody] UpdatePerformanceAppraisalDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var appraisal = await _appraisalRepo.GetAppraisalByIdAsync(id, tenantId);
                if (appraisal == null)
                    return NotFound(new { message = "Appraisal not found" });

                if (!string.IsNullOrEmpty(dto.ManagerAssessmentComments))
                    appraisal.ManagerAssessmentComments = dto.ManagerAssessmentComments;

                if (!string.IsNullOrEmpty(dto.Status) && Enum.TryParse<AppraisalStatus>(dto.Status, ignoreCase: true, out var status))
                    appraisal.Status = status;

                if (dto.IsFinalized.HasValue)
                {
                    appraisal.IsFinalized = dto.IsFinalized.Value;
                    appraisal.FinalizedAt = dto.IsFinalized.Value ? DateTime.UtcNow : null;
                }

                await _appraisalRepo.UpdateAppraisalAsync(appraisal);

                return Ok(new
                {
                    message = "Appraisal updated successfully",
                    appraisal = MapAppraisalToDto(appraisal)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating appraisal", error = ex.Message });
            }
        }

        /// <summary>
        /// Get appraisals for the current user (employee/manager).
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMyAppraisals([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 50) limit = 50;

            var tenantId = _tenantAccessor.GetTenantId();
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userId, out var userGuid))
                return Unauthorized(new { message = "Invalid user ID" });

            try
            {
                // Get appraisals where user is employee or manager
                var appriasalsAsEmployee = await _appraisalRepo.GetAppraisalsByEmployeeAsync(userGuid, tenantId, (page - 1) * limit, limit);
                var appriasalsAsManager = await _appraisalRepo.GetAppraisalsByManagerAsync(userGuid, tenantId, (page - 1) * limit, limit);

                var allAppraisals = appriasalsAsEmployee.Union(appriasalsAsManager).ToList();

                return Ok(new
                {
                    appraisals = allAppraisals.Select(MapAppraisalToDto),
                    total = allAppraisals.Count,
                    page,
                    limit
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching appraisals", error = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific appraisal by ID.
        /// </summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetAppraisal(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var appraisal = await _appraisalRepo.GetAppraisalByIdAsync(id, tenantId);
                if (appraisal == null)
                    return NotFound(new { message = "Appraisal not found" });

                return Ok(new { appraisal = MapAppraisalToDto(appraisal) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching appraisal", error = ex.Message });
            }
        }

        /// <summary>
        /// Get all appraisals for a specific appraisal cycle (HR/Manager).
        /// </summary>
        [HttpGet("cycles/{cycleId:guid}/appraisals")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetAppraisalsByCycle(Guid cycleId, [FromQuery] int page = 1, [FromQuery] int limit = 20)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100;

            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var appraisals = await _appraisalRepo.GetAppraisalsByCycleAsync(cycleId, tenantId, (page - 1) * limit, limit);
                var total = await _db.PerformanceAppraisals
                    .Where(a => a.AppraisalCycleId == cycleId && a.TenantId == tenantId && !a.IsDeleted)
                    .CountAsync();

                return Ok(new
                {
                    appraisals = appraisals.Select(MapAppraisalToDto),
                    total,
                    page,
                    limit
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching cycle appraisals", error = ex.Message });
            }
        }

        /// <summary>
        /// Employee submits self-assessment for an appraisal.
        /// </summary>
        [HttpPost("{id:guid}/self-assess")]
        public async Task<IActionResult> SubmitSelfAssessment(Guid id, [FromBody] SubmitSelfAssessmentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userId, out var userGuid))
                return Unauthorized(new { message = "Invalid user ID" });

            try
            {
                var appraisal = await _appraisalRepo.GetAppraisalByIdAsync(id, tenantId);
                if (appraisal == null)
                    return NotFound(new { message = "Appraisal not found" });

                // Verify user is the employee
                if (appraisal.EmployeeId != userGuid)
                    return Forbid("You can only assess your own appraisal");

                // Verify deadline not passed
                var cycle = await _appraisalRepo.GetAppraisalCycleByIdAsync(appraisal.AppraisalCycleId, tenantId);
                if (cycle != null && DateTime.UtcNow > cycle.SelfAssessmentDeadline)
                    return BadRequest(new { message = "Self-assessment deadline has passed" });

                // Update self assessment
                appraisal.SelfAssessmentScore = dto.SelfAssessmentScore;
                appraisal.SelfAssessmentComments = dto.SelfAssessmentComments;
                appraisal.SelfAssessmentSubmittedAt = DateTime.UtcNow;
                appraisal.Status = AppraisalStatus.SelfSubmitted;

                // Clear existing self-ratings and add new ones
                var existingRatings = await _appraisalRepo.GetRatingsByAppraisalAsync(id);
                foreach (var rating in existingRatings)
                {
                    await _db.AppraisalRatings.Where(r => r.Id == rating.Id).ExecuteDeleteAsync();
                }

                foreach (var ratingDto in dto.Ratings)
                {
                    var rating = new AppraisalRating
                    {
                        AppraisalId = id,
                        CompetencyId = ratingDto.CompetencyId,
                        SelfScore = ratingDto.SelfScore,
                        Comments = ratingDto.Comments,
                        TenantId = tenantId
                    };
                    await _appraisalRepo.CreateRatingAsync(rating);
                }

                await _appraisalRepo.UpdateAppraisalAsync(appraisal);

                return Ok(new { message = "Self-assessment submitted successfully", appraisal = MapAppraisalToDto(appraisal) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error submitting self-assessment", error = ex.Message });
            }
        }

        /// <summary>
        /// Manager submits assessment for an appraisal.
        /// </summary>
        [HttpPost("{id:guid}/assess")]
        public async Task<IActionResult> SubmitManagerAssessment(Guid id, [FromBody] SubmitManagerAssessmentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userId, out var userGuid))
                return Unauthorized(new { message = "Invalid user ID" });

            try
            {
                var appraisal = await _appraisalRepo.GetAppraisalByIdAsync(id, tenantId);
                if (appraisal == null)
                    return NotFound(new { message = "Appraisal not found" });

                // Verify user is the manager
                if (appraisal.ManagerId != userGuid)
                    return Forbid("You can only assess appraisals for your direct reports");

                // Verify deadline not passed
                var cycle = await _appraisalRepo.GetAppraisalCycleByIdAsync(appraisal.AppraisalCycleId, tenantId);
                if (cycle != null && DateTime.UtcNow > cycle.ManagerAssessmentDeadline)
                    return BadRequest(new { message = "Manager assessment deadline has passed" });

                // Update manager assessment
                appraisal.ManagerAssessmentScore = dto.ManagerAssessmentScore;
                appraisal.ManagerAssessmentComments = dto.ManagerAssessmentComments;
                appraisal.ManagerAssessmentSubmittedAt = DateTime.UtcNow;
                appraisal.Status = AppraisalStatus.ManagerSubmitted;

                // Add manager ratings
                foreach (var ratingDto in dto.Ratings)
                {
                    var rating = await _appraisalRepo.GetRatingByIdAsync(ratingDto.CompetencyId);
                    if (rating != null)
                    {
                        rating.ManagerScore = ratingDto.ManagerScore;
                        rating.Comments = ratingDto.Comments;
                        await _appraisalRepo.UpdateRatingAsync(rating);
                    }
                }

                // Calculate overall rating
                var allRatings = await _appraisalRepo.GetRatingsByAppraisalAsync(id);
                var competencies = await _appraisalRepo.GetAllCompetenciesAsync(tenantId);

                decimal overallRating = 0;
                decimal totalWeight = 0;

                foreach (var comp in competencies)
                {
                    var rating = allRatings.FirstOrDefault(r => r.CompetencyId == comp.Id);
                    if (rating?.ManagerScore.HasValue == true)
                    {
                        overallRating += (rating.ManagerScore.Value * comp.Weight);
                        totalWeight += comp.Weight;
                    }
                }

                if (totalWeight > 0)
                    appraisal.OverallRating = overallRating / totalWeight;

                await _appraisalRepo.UpdateAppraisalAsync(appraisal);

                return Ok(new { message = "Manager assessment submitted successfully", appraisal = MapAppraisalToDto(appraisal) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error submitting manager assessment", error = ex.Message });
            }
        }

        /// <summary>
        /// Approve an appraisal (HR Admin only).
        /// </summary>
        [HttpPost("{id:guid}/approve")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ApproveAppraisal(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            try
            {
                var appraisal = await _appraisalRepo.GetAppraisalByIdAsync(id, tenantId);
                if (appraisal == null)
                    return NotFound(new { message = "Appraisal not found" });

                appraisal.Status = AppraisalStatus.Approved;
                appraisal.IsFinalized = true;
                appraisal.FinalizedAt = DateTime.UtcNow;
                appraisal.ApprovedBy = Guid.TryParse(userId, out var userGuid) ? userGuid : (Guid?)null;

                await _appraisalRepo.UpdateAppraisalAsync(appraisal);

                return Ok(new { message = "Appraisal approved successfully", appraisal = MapAppraisalToDto(appraisal) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error approving appraisal", error = ex.Message });
            }
        }

        /// <summary>
        /// Reject an appraisal and return for revision (HR Admin only).
        /// </summary>
        [HttpPost("{id:guid}/reject")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> RejectAppraisal(Guid id, [FromBody] Dictionary<string, string> body)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var appraisal = await _appraisalRepo.GetAppraisalByIdAsync(id, tenantId);
                if (appraisal == null)
                    return NotFound(new { message = "Appraisal not found" });

                appraisal.Status = AppraisalStatus.Rejected;
                string? comments = null;
                body?.TryGetValue("comments", out comments);
                if (!string.IsNullOrEmpty(comments))
                    appraisal.ManagerAssessmentComments = comments;

                await _appraisalRepo.UpdateAppraisalAsync(appraisal);

                return Ok(new { message = "Appraisal rejected successfully", appraisal = MapAppraisalToDto(appraisal) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error rejecting appraisal", error = ex.Message });
            }
        }

        #endregion

        #region Competency Management

        /// <summary>
        /// Create a new appraisal competency (HR Admin only).
        /// </summary>
        [HttpPost("competencies")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> CreateCompetency([FromBody] CreateAppraisalCompetencyDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var competency = new AppraisalCompetency
                {
                    TenantId = tenantId,
                    Name = dto.Name,
                    Description = dto.Description,
                    Weight = dto.Weight,
                    Category = dto.Category,
                    SortOrder = dto.SortOrder,
                    IsActive = true
                };

                await _appraisalRepo.CreateCompetencyAsync(competency);
                await InvalidateCompetencyCache(tenantId);

                return Ok(new { message = "Competency created successfully", competency = MapCompetencyToDto(competency) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating competency", error = ex.Message });
            }
        }

        /// <summary>
        /// Get all active competencies.
        /// </summary>
        [HttpGet("competencies")]
        public async Task<IActionResult> GetCompetencies([FromQuery] int page = 1, [FromQuery] int limit = 50)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100;

            var tenantId = _tenantAccessor.GetTenantId();
            var cacheKey = $"competencies_{tenantId}_{page}_{limit}";

            var cached = await _cache.GetAsync<object>(cacheKey);
            if (cached != null)
                return Ok(cached);

            try
            {
                var competencies = await _appraisalRepo.GetAllCompetenciesAsync(tenantId, (page - 1) * limit, limit);
                var total = await _db.AppraisalCompetencies
                    .Where(c => c.TenantId == tenantId && c.IsActive && !c.IsDeleted)
                    .CountAsync();

                var response = new
                {
                    competencies = competencies.Select(MapCompetencyToDto),
                    total,
                    page,
                    limit
                };

                await _cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(30));

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching competencies", error = ex.Message });
            }
        }

        /// <summary>
        /// Update a competency (HR Admin only).
        /// </summary>
        [HttpPut("competencies/{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateCompetency(Guid id, [FromBody] UpdateAppraisalCompetencyDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                var competency = await _appraisalRepo.GetCompetencyByIdAsync(id, tenantId);
                if (competency == null)
                    return NotFound(new { message = "Competency not found" });

                if (!string.IsNullOrEmpty(dto.Name))
                    competency.Name = dto.Name;
                if (!string.IsNullOrEmpty(dto.Description))
                    competency.Description = dto.Description;
                if (dto.Weight.HasValue)
                    competency.Weight = dto.Weight.Value;
                if (!string.IsNullOrEmpty(dto.Category))
                    competency.Category = dto.Category;
                if (dto.SortOrder.HasValue)
                    competency.SortOrder = dto.SortOrder.Value;
                if (dto.IsActive.HasValue)
                    competency.IsActive = dto.IsActive.Value;

                await _appraisalRepo.UpdateCompetencyAsync(competency);
                await InvalidateCompetencyCache(tenantId);

                return Ok(new { message = "Competency updated successfully", competency = MapCompetencyToDto(competency) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating competency", error = ex.Message });
            }
        }

        /// <summary>
        /// Delete a competency (HR Admin only).
        /// </summary>
        [HttpDelete("competencies/{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteCompetency(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            try
            {
                await _appraisalRepo.DeleteCompetencyAsync(id, tenantId);
                await InvalidateCompetencyCache(tenantId);

                return Ok(new { message = "Competency deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting competency", error = ex.Message });
            }
        }

        #endregion

        #region Helper Methods

        private AppraisalCycleDto MapCycleToDto(AppraisalCycle cycle)
        {
            return new AppraisalCycleDto
            {
                Id = cycle.Id,
                Name = cycle.Name,
                Description = cycle.Description,
                StartDate = cycle.StartDate,
                EndDate = cycle.EndDate,
                SelfAssessmentDeadline = cycle.SelfAssessmentDeadline,
                ManagerAssessmentDeadline = cycle.ManagerAssessmentDeadline,
                Status = cycle.Status.ToString(),
                IsActive = cycle.IsActive,
                CreatedAt = cycle.CreatedAt
            };
        }

        private PerformanceAppraisalDto MapAppraisalToDto(PerformanceAppraisal appraisal)
        {
            return new PerformanceAppraisalDto
            {
                Id = appraisal.Id,
                EmployeeId = appraisal.EmployeeId,
                ManagerId = appraisal.ManagerId,
                AppraisalCycleId = appraisal.AppraisalCycleId,
                SelfAssessmentScore = appraisal.SelfAssessmentScore,
                SelfAssessmentComments = appraisal.SelfAssessmentComments,
                SelfAssessmentSubmittedAt = appraisal.SelfAssessmentSubmittedAt,
                ManagerAssessmentScore = appraisal.ManagerAssessmentScore,
                ManagerAssessmentComments = appraisal.ManagerAssessmentComments,
                ManagerAssessmentSubmittedAt = appraisal.ManagerAssessmentSubmittedAt,
                OverallRating = appraisal.OverallRating,
                Status = appraisal.Status.ToString(),
                IsFinalized = appraisal.IsFinalized,
                FinalizedAt = appraisal.FinalizedAt,
                EmployeeName = appraisal.Employee?.Email,
                ManagerName = appraisal.Manager?.Email,
                Ratings = appraisal.Ratings?.Select(r => new AppraisalRatingDto
                {
                    Id = r.Id,
                    CompetencyId = r.CompetencyId,
                    SelfScore = r.SelfScore,
                    ManagerScore = r.ManagerScore,
                    Comments = r.Comments,
                    CompetencyName = r.Competency?.Name
                }).ToList() ?? new List<AppraisalRatingDto>()
            };
        }

        private AppraisalCompetencyDto MapCompetencyToDto(AppraisalCompetency competency)
        {
            return new AppraisalCompetencyDto
            {
                Id = competency.Id,
                Name = competency.Name,
                Description = competency.Description,
                Weight = competency.Weight,
                Category = competency.Category,
                IsActive = competency.IsActive,
                SortOrder = competency.SortOrder
            };
        }

        private async Task InvalidateCycleCache(Guid tenantId)
        {
            for (int page = 1; page <= 5; page++)
            {
                for (int limit = 10; limit <= 50; limit += 10)
                {
                    await _cache.RemoveAsync($"appraisal_cycles_{tenantId}_{page}_{limit}");
                }
            }
        }

        private async Task InvalidateCompetencyCache(Guid tenantId)
        {
            for (int page = 1; page <= 5; page++)
            {
                for (int limit = 50; limit <= 100; limit += 50)
                {
                    await _cache.RemoveAsync($"competencies_{tenantId}_{page}_{limit}");
                }
            }
        }

        private async Task CreateAppriasalsForAllEmployees(AppraisalCycle cycle)
        {
            var employees = await _db.Employees
                .Where(e => e.TenantId == cycle.TenantId && !e.IsDeleted)
                .ToListAsync();

            var managers = await _db.Users
                .Where(u => u.TenantId == cycle.TenantId && !u.IsDeleted)
                .ToListAsync();

            foreach (var employee in employees)
            {
                // Find employee's manager
                var manager = managers.FirstOrDefault(m => m.Id == employee.ReportingManagerId);
                if (manager == null)
                    continue;

                if (!employee.UserId.HasValue)
                    continue;

                var employeeUserId = employee.UserId.Value;

                // Check if appraisal already exists
                var exists = await _appraisalRepo.AppraisalExistsAsync(employeeUserId, cycle.Id, cycle.TenantId);
                if (exists)
                    continue;

                var appraisal = new PerformanceAppraisal
                {
                    TenantId = cycle.TenantId,
                    EmployeeId = employeeUserId,
                    ManagerId = manager.Id,
                    AppraisalCycleId = cycle.Id,
                    Status = AppraisalStatus.Pending,
                    IsFinalized = false
                };

                await _appraisalRepo.CreateAppraisalAsync(appraisal);
            }
        }

        #endregion
    }
}
