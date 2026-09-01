using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Api.Models;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    /// <summary>
    /// API controller for Training &amp; Development operations.
    /// Handles courses, enrollments, assessments, certificates, and training requests.
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    [Route("api/[controller]")]
    [Authorize(Policy = "Module:hrms")]
    public class TrainingController : ControllerBase
    {
        private readonly ITrainingRepository _repository;
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ILogger<TrainingController> _logger;
        private readonly ICacheService _cacheService;

        public TrainingController(
            ITrainingRepository repository,
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ILogger<TrainingController> logger,
            ICacheService cacheService)
        {
            _repository = repository;
            _db = db;
            _tenantAccessor = tenantAccessor;
            _logger = logger;
            _cacheService = cacheService;
        }

        #region TrainingCourse Endpoints

        /// <summary>
        /// Get all training courses for the tenant.
        /// </summary>
        [HttpGet("courses")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<IActionResult> GetCourses([FromQuery] int skip = 0, [FromQuery] int take = 20)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var cacheKey = $"courses:all:{tenantId}:{skip}:{take}";

                var courses = await _cacheService.GetAsync<IEnumerable<TrainingCourseDto>>(cacheKey);
                if (courses == null)
                {
                    var courseEntities = await _repository.GetAllCoursesAsync(tenantId, skip, take);
                    courses = courseEntities.Select(c => new TrainingCourseDto
                    {
                        Id = c.Id,
                        Title = c.Title,
                        Name = c.Title,
                        Description = c.Description,
                        Category = c.Category,
                        DeliveryMode = c.DeliveryMode.ToString(),
                        Status = c.Status.ToString(),
                        StartDate = c.StartDate,
                        EndDate = c.EndDate,
                        MaxParticipants = c.MaxParticipants,
                        CurrentEnrollment = c.CurrentEnrollment,
                        Cost = c.Cost,
                        DurationHours = c.DurationHours,
                        Duration = c.DurationHours,
                        Instructor = c.Instructor,
                        InstructorId = c.InstructorId,
                        CreatedAt = c.CreatedAt
                    }).ToList();

                    await _cacheService.SetAsync(cacheKey, courses, TimeSpan.FromMinutes(30));
                }

                return Ok(courses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving courses");
                return StatusCode(500, new { message = "Error retrieving courses" });
            }
        }

        /// <summary>
        /// Get a specific training course by ID.
        /// </summary>
        [HttpGet("courses/{id:guid}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<IActionResult> GetCourseById(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var cacheKey = $"course:{id}:{tenantId}";

                var courseDto = await _cacheService.GetAsync<TrainingCourseDto>(cacheKey);
                if (courseDto == null)
                {
                    var course = await _repository.GetCourseByIdAsync(id, tenantId);
                    if (course == null)
                        return NotFound();

                    courseDto = new TrainingCourseDto
                    {
                        Id = course.Id,
                        Title = course.Title,
                        Name = course.Title,
                        Description = course.Description,
                        Category = course.Category,
                        DeliveryMode = course.DeliveryMode.ToString(),
                        Status = course.Status.ToString(),
                        StartDate = course.StartDate,
                        EndDate = course.EndDate,
                        MaxParticipants = course.MaxParticipants,
                        CurrentEnrollment = course.CurrentEnrollment,
                        Cost = course.Cost,
                        DurationHours = course.DurationHours,
                        Duration = course.DurationHours,
                        Instructor = course.Instructor,
                        InstructorId = course.InstructorId,
                        CreatedAt = course.CreatedAt
                    };

                    await _cacheService.SetAsync(cacheKey, courseDto, TimeSpan.FromMinutes(60));
                }

                return Ok(courseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving course");
                return StatusCode(500, new { message = "Error retrieving course" });
            }
        }

        /// <summary>
        /// Get active training courses.
        /// </summary>
        [HttpGet("courses/active/list")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<IActionResult> GetActiveCourses([FromQuery] int skip = 0, [FromQuery] int take = 20)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var courses = await _repository.GetActiveCoursesAsync(tenantId, skip, take);

                var dtos = courses.Select(c => new TrainingCourseDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Name = c.Title,
                    Category = c.Category,
                    DeliveryMode = c.DeliveryMode.ToString(),
                    Status = c.Status.ToString(),
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    CurrentEnrollment = c.CurrentEnrollment,
                    MaxParticipants = c.MaxParticipants
                }).ToList();

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active courses");
                return StatusCode(500, new { message = "Error retrieving active courses" });
            }
        }

        /// <summary>
        /// Create a new training course.
        /// </summary>
        [HttpPost("courses")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> CreateCourse([FromBody] CreateTrainingCourseDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var course = new TrainingCourse
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    Title = dto.Title,
                    Description = dto.Description,
                    Category = dto.Category,
                    Level = dto.Level,
                    DeliveryMode = Enum.Parse<TrainingDeliveryMode>(dto.DeliveryMode),
                    Status = TrainingCourseStatus.Draft,
                    StartDate = dto.StartDate,
                    EndDate = dto.EndDate,
                    MaxParticipants = dto.MaxParticipants,
                    CurrentEnrollment = 0,
                    Cost = dto.Cost,
                    DurationHours = dto.DurationHours,
                    Duration = dto.DurationHours,
                    Instructor = dto.Instructor,
                    InstructorId = dto.InstructorId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _repository.CreateCourseAsync(course);

                // Invalidate cache
                await _cacheService.RemoveByPrefixAsync($"courses:all:{tenantId}:");

                return CreatedAtAction(nameof(GetCourseById), new { id = created.Id }, new { id = created.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating course");
                return StatusCode(500, new { message = "Error creating course" });
            }
        }

        /// <summary>
        /// Update an existing training course.
        /// </summary>
        [HttpPut("courses/{id:guid}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> UpdateCourse(Guid id, [FromBody] UpdateTrainingCourseDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var course = await _repository.GetCourseByIdAsync(id, tenantId);
                if (course == null)
                    return NotFound();

                if (!string.IsNullOrEmpty(dto.Title))
                    course.Title = dto.Title;
                if (!string.IsNullOrEmpty(dto.Description))
                    course.Description = dto.Description;
                if (!string.IsNullOrEmpty(dto.Status))
                    course.Status = Enum.Parse<TrainingCourseStatus>(dto.Status);
                if (dto.EndDate.HasValue)
                    course.EndDate = dto.EndDate;
                if (dto.DeliveryMode != null)
                    course.DeliveryMode = Enum.Parse<TrainingDeliveryMode>(dto.DeliveryMode);
                if (dto.DurationHours.HasValue)
                    course.DurationHours = dto.DurationHours.Value;
                course.UpdatedAt = DateTime.UtcNow;

                await _repository.UpdateCourseAsync(course);

                // Invalidate cache
                await _cacheService.RemoveAsync($"course:{id}:{tenantId}");
                await _cacheService.RemoveByPrefixAsync($"courses:all:{tenantId}:");

                return Ok(new { message = "Course updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating course");
                return StatusCode(500, new { message = "Error updating course" });
            }
        }

        /// <summary>
        /// Delete a training course.
        /// </summary>
        [HttpDelete("courses/{id:guid}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> DeleteCourse(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                await _repository.DeleteCourseAsync(id, tenantId);

                // Invalidate cache
                await _cacheService.RemoveAsync($"course:{id}:{tenantId}");
                await _cacheService.RemoveByPrefixAsync($"courses:all:{tenantId}:");

                return Ok(new { message = "Course deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting course");
                return StatusCode(500, new { message = "Error deleting course" });
            }
        }

        #endregion

        #region CourseEnrollment Endpoints

        /// <summary>
        /// Get enrollments for a specific course.
        /// </summary>
        [HttpGet("enrollments/course/{courseId:guid}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> GetEnrollmentsByCourse(Guid courseId, [FromQuery] int skip = 0, [FromQuery] int take = 50)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var enrollments = await _repository.GetEnrollmentsByCourseAsync(courseId, tenantId, skip, take);

                var dtos = enrollments.Select(e => new CourseEnrollmentDto
                {
                    Id = e.Id,
                    CourseId = e.CourseId,
                    EmployeeId = e.EmployeeId,
                    Status = e.Status.ToString(),
                    EnrollmentDate = e.EnrollmentDate,
                    CompletionDate = e.CompletionDate,
                    Score = e.Score
                }).ToList();

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving enrollments");
                return StatusCode(500, new { message = "Error retrieving enrollments" });
            }
        }

        /// <summary>
        /// Get enrollments for a specific employee.
        /// </summary>
        [HttpGet("enrollments/employee/{employeeId:guid}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<IActionResult> GetEnrollmentsByEmployee(Guid employeeId, [FromQuery] int skip = 0, [FromQuery] int take = 20)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var enrollments = await _repository.GetEnrollmentsByEmployeeAsync(employeeId, tenantId, skip, take);

                var dtos = enrollments.Select(e => new CourseEnrollmentDto
                {
                    Id = e.Id,
                    CourseId = e.CourseId,
                    EmployeeId = e.EmployeeId,
                    Status = e.Status.ToString(),
                    EnrollmentDate = e.EnrollmentDate,
                    CompletionDate = e.CompletionDate,
                    Score = e.Score
                }).ToList();

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving employee enrollments");
                return StatusCode(500, new { message = "Error retrieving employee enrollments" });
            }
        }

        /// <summary>
        /// Enroll an employee in a course.
        /// </summary>
        [HttpPost("enrollments")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> EnrollCourse([FromBody] EnrollCourseDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();

                // Check if already enrolled
                var existing = await _repository.GetEnrollmentByCourseAndEmployeeAsync(dto.CourseId, dto.EmployeeId, tenantId);
                if (existing != null)
                    return BadRequest(new { message = "Employee already enrolled in this course" });

                var enrollment = new CourseEnrollment
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    CourseId = dto.CourseId,
                    EmployeeId = dto.EmployeeId,
                    Status = EnrollmentStatus.Pending,
                    EnrollmentDate = DateTime.UtcNow,
                    IsCompleted = false,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _repository.CreateEnrollmentAsync(enrollment);
                return CreatedAtAction(nameof(GetEnrollmentById), new { id = created.Id }, new { id = created.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enrolling employee");
                return StatusCode(500, new { message = "Error enrolling employee" });
            }
        }

        /// <summary>
        /// Get enrollment by ID.
        /// </summary>
        [HttpGet("enrollments/{id:guid}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<IActionResult> GetEnrollmentById(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var enrollment = await _repository.GetEnrollmentByIdAsync(id, tenantId);
                if (enrollment == null)
                    return NotFound();

                var dto = new CourseEnrollmentDto
                {
                    Id = enrollment.Id,
                    CourseId = enrollment.CourseId,
                    EmployeeId = enrollment.EmployeeId,
                    CourseName = enrollment.Course?.Title ?? string.Empty,
                    EmployeeName = enrollment.Employee?.FullName ?? string.Empty,
                    Status = enrollment.Status.ToString(),
                    EnrollmentDate = enrollment.EnrollmentDate,
                    CompletionDate = enrollment.CompletionDate,
                    IsCompleted = enrollment.IsCompleted,
                    Score = enrollment.Score,
                    Feedback = enrollment.Feedback,
                    HasCertificate = enrollment.HasCertificate,
                    CertificateId = enrollment.CertificateId,
                    CertificateIssuedDate = enrollment.CertificateIssuedDate
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving enrollment");
                return StatusCode(500, new { message = "Error retrieving enrollment" });
            }
        }

        /// <summary>
        /// Update enrollment status.
        /// </summary>
        [HttpPut("enrollments/{id:guid}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> UpdateEnrollment(Guid id, [FromBody] UpdateEnrollmentDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var enrollment = await _repository.GetEnrollmentByIdAsync(id, tenantId);
                if (enrollment == null)
                    return NotFound();

                if (!string.IsNullOrEmpty(dto.Status))
                    enrollment.Status = Enum.Parse<EnrollmentStatus>(dto.Status);
                if (dto.Score.HasValue)
                    enrollment.Score = dto.Score;
                if (dto.CompletionDate.HasValue)
                    enrollment.CompletionDate = dto.CompletionDate;
                if (dto.IsCompleted.HasValue)
                    enrollment.IsCompleted = dto.IsCompleted.Value;
                enrollment.UpdatedAt = DateTime.UtcNow;

                await _repository.UpdateEnrollmentAsync(enrollment);
                return Ok(new { message = "Enrollment updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating enrollment");
                return StatusCode(500, new { message = "Error updating enrollment" });
            }
        }

        #endregion

        #region TrainingAssessment Endpoints

        /// <summary>
        /// List all training assessments across enrollments (paginated projection).
        /// </summary>
        [HttpGet("assessments")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> GetAssessments(
            [FromQuery] string? result,
            [FromQuery] string? assessmentType,
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20)
        {
            if (page < 1) page = 1;
            if (limit < 1 || limit > 100) limit = 20;

            var tenantId = _tenantAccessor.GetTenantId();

            var query =
                from assessment in _db.TrainingAssessments.Where(a => a.TenantId == tenantId && !a.IsDeleted)
                join enrollment in _db.CourseEnrollments.Where(e => e.TenantId == tenantId && !e.IsDeleted)
                    on assessment.EnrollmentId equals enrollment.Id
                join course in _db.TrainingCourses.Where(c => c.TenantId == tenantId && !c.IsDeleted)
                    on enrollment.CourseId equals course.Id
                select new { assessment, enrollment, course };

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.ToLower();
                query = query.Where(x =>
                    x.assessment.Title.ToLower().Contains(q) ||
                    x.course.Title.ToLower().Contains(q) ||
                    x.course.Category.ToLower().Contains(q));
            }

            if (!string.IsNullOrWhiteSpace(assessmentType))
            {
                query = query.Where(x => x.assessment.AssessmentType == assessmentType);
            }

            if (string.Equals(result, "pass", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(x => x.assessment.Result == AssessmentResult.Pass);
            }
            else if (string.Equals(result, "fail", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(x => x.assessment.Result == AssessmentResult.Fail);
            }

            var total = await query.CountAsync();

            var assessments = await query
                .OrderByDescending(x => x.assessment.AssessmentDate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(x => new
                {
                    id = x.assessment.Id,
                    enrollmentId = x.assessment.EnrollmentId,
                    courseTitle = x.course.Title,
                    courseCategory = x.course.Category,
                    title = x.assessment.Title,
                    assessmentType = x.assessment.AssessmentType,
                    assessmentDate = x.assessment.AssessmentDate,
                    totalMarks = x.assessment.TotalMarks,
                    obtainedMarks = x.assessment.ObtainedMarks,
                    percentageScore = x.assessment.PercentageScore,
                    result = x.assessment.Result.ToString(),
                    comments = x.assessment.Comments,
                    reviewedBy = x.assessment.ReviewedBy,
                    reviewDate = x.assessment.ReviewDate
                })
                .ToListAsync();

            return Ok(new { assessments, total, page, limit });
        }

        /// <summary>
        /// Get assessments for an enrollment.
        /// </summary>
        [HttpGet("assessments/enrollment/{enrollmentId:guid}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> GetAssessmentsByEnrollment(Guid enrollmentId)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var assessments = await _repository.GetAssessmentsByEnrollmentAsync(enrollmentId, tenantId);

                var dtos = assessments.Select(a => new TrainingAssessmentDto
                {
                    Id = a.Id,
                    EnrollmentId = a.EnrollmentId,
                    AssessmentType = a.AssessmentType,
                    Title = a.Title,
                    AssessmentDate = a.AssessmentDate,
                    TotalMarks = a.TotalMarks,
                    ObtainedMarks = a.ObtainedMarks,
                    PercentageScore = a.PercentageScore,
                    Score = a.PercentageScore,
                    Result = a.Result.ToString(),
                    Comments = a.Comments,
                    ReviewedBy = a.ReviewedBy,
                    ReviewDate = a.ReviewDate
                }).ToList();

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving assessments");
                return StatusCode(500, new { message = "Error retrieving assessments" });
            }
        }

        /// <summary>
        /// Create a new assessment.
        /// </summary>
        [HttpPost("assessments")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> CreateAssessment([FromBody] CreateAssessmentDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var assessment = new TrainingAssessment
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    EnrollmentId = dto.EnrollmentId,
                    AssessmentType = dto.AssessmentType,
                    Title = dto.Title,
                    AssessmentDate = DateTime.UtcNow,
                    TotalMarks = dto.TotalMarks,
                    ObtainedMarks = dto.ObtainedMarks,
                    PercentageScore = (dto.ObtainedMarks / dto.TotalMarks) * 100,
                    Result = ((dto.ObtainedMarks / dto.TotalMarks) * 100) >= 60 ? AssessmentResult.Pass : AssessmentResult.Fail,
                    Comments = dto.Comments,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _repository.CreateAssessmentAsync(assessment);
                return CreatedAtAction(nameof(GetAssessmentById), new { id = created.Id }, new { id = created.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating assessment");
                return StatusCode(500, new { message = "Error creating assessment" });
            }
        }

        /// <summary>
        /// Get assessment by ID.
        /// </summary>
        [HttpGet("assessments/{id:guid}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> GetAssessmentById(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var assessment = await _repository.GetAssessmentByIdAsync(id, tenantId);
                if (assessment == null)
                    return NotFound();

                var dto = new TrainingAssessmentDto
                {
                    Id = assessment.Id,
                    EnrollmentId = assessment.EnrollmentId,
                    AssessmentType = assessment.AssessmentType,
                    Title = assessment.Title,
                    AssessmentDate = assessment.AssessmentDate,
                    TotalMarks = assessment.TotalMarks,
                    ObtainedMarks = assessment.ObtainedMarks,
                    PercentageScore = assessment.PercentageScore,
                    Score = assessment.PercentageScore,
                    Result = assessment.Result.ToString(),
                    Comments = assessment.Comments,
                    ReviewedBy = assessment.ReviewedBy,
                    ReviewDate = assessment.ReviewDate
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving assessment");
                return StatusCode(500, new { message = "Error retrieving assessment" });
            }
        }

        /// <summary>
        /// Update an assessment.
        /// </summary>
        [HttpPut("assessments/{id:guid}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<IActionResult> UpdateAssessment(Guid id, [FromBody] UpdateAssessmentDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var assessment = await _repository.GetAssessmentByIdAsync(id, tenantId);
                if (assessment == null)
                    return NotFound();

                if (dto.ObtainedMarks.HasValue)
                    assessment.ObtainedMarks = dto.ObtainedMarks.Value;
                assessment.PercentageScore = (assessment.ObtainedMarks / assessment.TotalMarks) * 100;
                assessment.Result = assessment.PercentageScore >= 60 ? AssessmentResult.Pass : AssessmentResult.Fail;
                if (!string.IsNullOrEmpty(dto.Comments))
                    assessment.Comments = dto.Comments;
                if (!string.IsNullOrEmpty(dto.ReviewedBy))
                    assessment.ReviewedBy = dto.ReviewedBy;
                assessment.UpdatedAt = DateTime.UtcNow;

                await _repository.UpdateAssessmentAsync(assessment);
                return Ok(new { message = "Assessment updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating assessment");
                return StatusCode(500, new { message = "Error updating assessment" });
            }
        }

        #endregion

        #region TrainingCertificate Endpoints

        /// <summary>
        /// List all training certificates across enrollments (paginated projection).
        /// </summary>
        [HttpGet("certificates")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<IActionResult> GetCertificates(
            [FromQuery] bool? expired,
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20)
        {
            if (page < 1) page = 1;
            if (limit < 1 || limit > 100) limit = 20;

            var tenantId = _tenantAccessor.GetTenantId();
            var utcNow = DateTime.UtcNow;

            var query =
                from certificate in _db.TrainingCertificates.Where(c => c.TenantId == tenantId && !c.IsDeleted)
                join enrollment in _db.CourseEnrollments.Where(e => e.TenantId == tenantId && !e.IsDeleted)
                    on certificate.EnrollmentId equals enrollment.Id
                join course in _db.TrainingCourses.Where(c => c.TenantId == tenantId && !c.IsDeleted)
                    on enrollment.CourseId equals course.Id
                select new { certificate, course };

            if (expired.HasValue)
            {
                query = expired.Value
                    ? query.Where(x => x.certificate.IsExpired || (x.certificate.ExpiryDate != null && x.certificate.ExpiryDate < utcNow))
                    : query.Where(x => !x.certificate.IsExpired && (x.certificate.ExpiryDate == null || x.certificate.ExpiryDate >= utcNow));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.ToLower();
                query = query.Where(x =>
                    x.certificate.CertificateNumber.ToLower().Contains(q) ||
                    x.certificate.Title.ToLower().Contains(q) ||
                    x.course.Title.ToLower().Contains(q) ||
                    x.course.Category.ToLower().Contains(q));
            }

            var total = await query.CountAsync();

            var certificates = await query
                .OrderByDescending(x => x.certificate.IssuedDate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(x => new
                {
                    id = x.certificate.Id,
                    enrollmentId = x.certificate.EnrollmentId,
                    courseTitle = x.course.Title,
                    courseCategory = x.course.Category,
                    certificateNumber = x.certificate.CertificateNumber,
                    title = x.certificate.Title,
                    issuedDate = x.certificate.IssuedDate,
                    expiryDate = x.certificate.ExpiryDate,
                    isExpired = x.certificate.IsExpired || (x.certificate.ExpiryDate != null && x.certificate.ExpiryDate < utcNow),
                    finalScore = x.certificate.FinalScore,
                    digitalCertificateUrl = x.certificate.DigitalCertificateUrl,
                    notes = x.certificate.Notes
                })
                .ToListAsync();

            return Ok(new { certificates, total, page, limit });
        }

        /// <summary>
        /// Get certificates for an employee.
        /// </summary>
        [HttpGet("certificates/employee/{employeeId:guid}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<IActionResult> GetCertificatesByEmployee(Guid employeeId)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var certificates = await _repository.GetCertificatesByEmployeeAsync(employeeId, tenantId);

                var dtos = certificates.Select(c => new TrainingCertificateDto
                {
                    Id = c.Id,
                    EnrollmentId = c.EnrollmentId,
                    CertificateNumber = c.CertificateNumber,
                    Title = c.Title,
                    IssuedDate = c.IssuedDate,
                    ExpiryDate = c.ExpiryDate,
                    IsExpired = c.IsExpired,
                    DigitalCertificateUrl = c.DigitalCertificateUrl,
                    FinalScore = c.FinalScore,
                    Notes = c.Notes
                }).ToList();

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving certificates");
                return StatusCode(500, new { message = "Error retrieving certificates" });
            }
        }

        /// <summary>
        /// Get certificate by ID.
        /// </summary>
        [HttpGet("certificates/{id:guid}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<IActionResult> GetCertificateById(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var certificate = await _repository.GetCertificateByIdAsync(id, tenantId);
                if (certificate == null)
                    return NotFound();

                var dto = new TrainingCertificateDto
                {
                    Id = certificate.Id,
                    EnrollmentId = certificate.EnrollmentId,
                    CertificateNumber = certificate.CertificateNumber,
                    Title = certificate.Title,
                    IssuedDate = certificate.IssuedDate,
                    ExpiryDate = certificate.ExpiryDate,
                    IsExpired = certificate.IsExpired,
                    DigitalCertificateUrl = certificate.DigitalCertificateUrl,
                    FinalScore = certificate.FinalScore,
                    Notes = certificate.Notes
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving certificate");
                return StatusCode(500, new { message = "Error retrieving certificate" });
            }
        }

        /// <summary>
        /// Create a training certificate.
        /// </summary>
        [HttpPost("certificates")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> CreateCertificate([FromBody] CreateTrainingCertificateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var enrollment = await _repository.GetEnrollmentByIdAsync(dto.EnrollmentId, tenantId);
                if (enrollment == null)
                    return BadRequest(new { message = "Enrollment not found" });

                var certificate = new TrainingCertificate
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    EnrollmentId = dto.EnrollmentId,
                    CertificateNumber = dto.CertificateNumber,
                    Title = dto.Title,
                    IssuedDate = dto.IssuedDate,
                    ExpiryDate = dto.ExpiryDate,
                    IsExpired = dto.ExpiryDate.HasValue && dto.ExpiryDate.Value.Date < DateTime.UtcNow.Date,
                    DigitalCertificateUrl = dto.DigitalCertificateUrl,
                    FinalScore = dto.FinalScore,
                    Notes = dto.Notes,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _repository.CreateCertificateAsync(certificate);

                return CreatedAtAction(nameof(GetCertificateById), new { id = created.Id }, new { id = created.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating certificate");
                return StatusCode(500, new { message = "Error creating certificate" });
            }
        }

        #endregion

        #region TrainingRequest Endpoints

        /// <summary>
        /// Get training requests for an employee.
        /// </summary>
        [HttpGet("requests/employee/{employeeId:guid}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<IActionResult> GetRequestsByEmployee(Guid employeeId)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var requests = await _repository.GetRequestsByEmployeeAsync(employeeId, tenantId);

                var dtos = requests.Select(r => new TrainingRequestDto
                {
                    Id = r.Id,
                    EmployeeId = r.EmployeeId,
                    TrainingType = r.TrainingType ?? string.Empty,
                    Description = r.Description ?? string.Empty,
                    Status = r.Status.ToString(),
                    RequestedDate = r.CreatedAt,
                    BudgetAmount = r.BudgetAmount
                }).ToList();

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving requests");
                return StatusCode(500, new { message = "Error retrieving requests" });
            }
        }

        /// <summary>
        /// Create a new training request.
        /// </summary>
        [HttpPost("requests")]
        [Authorize(Roles = "Admin,HR,Employee")]
        public async Task<IActionResult> CreateRequest([FromBody] CreateTrainingRequestDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var request = new TrainingRequest
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    EmployeeId = dto.EmployeeId,
                    TrainingType = dto.TrainingType,
                    Description = dto.Description,
                    Status = TrainingRequestStatus.Submitted,
                    BudgetAmount = dto.BudgetAmount,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _repository.CreateRequestAsync(request);
                return CreatedAtAction(nameof(GetRequestById), new { id = created.Id }, new { id = created.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating request");
                return StatusCode(500, new { message = "Error creating request" });
            }
        }

        /// <summary>
        /// Get training request by ID.
        /// </summary>
        [HttpGet("requests/{id:guid}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<IActionResult> GetRequestById(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var request = await _repository.GetRequestByIdAsync(id, tenantId);
                if (request == null)
                    return NotFound();

                var dto = new TrainingRequestDto
                {
                    Id = request.Id,
                    EmployeeId = request.EmployeeId,
                    TrainingType = request.TrainingType ?? string.Empty,
                    Description = request.Description ?? string.Empty,
                    Status = request.Status.ToString(),
                    RequestedDate = request.CreatedAt,
                    BudgetAmount = request.BudgetAmount
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving request");
                return StatusCode(500, new { message = "Error retrieving request" });
            }
        }

        #endregion
    }
}
