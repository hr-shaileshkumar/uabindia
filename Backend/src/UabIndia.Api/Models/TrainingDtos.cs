using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    #region TrainingCourse DTOs

    public class CreateTrainingCourseDto
    {
        [Required(ErrorMessage = "Course title is required")]
        [StringLength(200, MinimumLength = 5)]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Course description is required")]
        [StringLength(2000, MinimumLength = 20)]
        public string Description { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Instructor { get; set; }
        
        public Guid? InstructorId { get; set; }

        [Required(ErrorMessage = "Category is required")]
        [StringLength(50)]
        public string Category { get; set; } = string.Empty;

        [Required(ErrorMessage = "Level is required")]
        [StringLength(20)]
        public string Level { get; set; } = string.Empty;

        [Range(1, 1000, ErrorMessage = "Duration must be between 1 and 1000 hours")]
        public int DurationHours { get; set; }

        [Required(ErrorMessage = "Start date is required")]
        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [Range(1, 1000, ErrorMessage = "Max participants must be between 1 and 1000")]
        public int MaxParticipants { get; set; }

        [Range(0, 999999, ErrorMessage = "Cost must be positive")]
        public decimal? Cost { get; set; }

        [StringLength(200)]
        public string? Location { get; set; }

        [Required(ErrorMessage = "Delivery mode is required")]
        public string DeliveryMode { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Syllabus { get; set; }

        [StringLength(500)]
        public string? PrerequisiteSkills { get; set; }
    }

    public class UpdateTrainingCourseDto
    {
        [StringLength(200, MinimumLength = 5)]
        public string? Title { get; set; }

        [StringLength(2000, MinimumLength = 20)]
        public string? Description { get; set; }

        [StringLength(100)]
        public string? Instructor { get; set; }

        [StringLength(50)]
        public string? Category { get; set; }

        [StringLength(20)]
        public string? Level { get; set; }

        [Range(1, 1000)]
        public int? DurationHours { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [Range(1, 1000)]
        public int? MaxParticipants { get; set; }

        public decimal? Cost { get; set; }

        [StringLength(200)]
        public string? Location { get; set; }

        public string? DeliveryMode { get; set; }

        public string? Status { get; set; }

        public bool? IsActive { get; set; }
    }

    public class TrainingCourseDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty; // Alias for Title
        public string Description { get; set; } = string.Empty;
        public string? Instructor { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public int DurationHours { get; set; }
        public int Duration { get; set; } // Alias for DurationHours
        public Guid? InstructorId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int MaxParticipants { get; set; }
        public decimal? Cost { get; set; }
        public string? Location { get; set; }
        public string DeliveryMode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int CurrentEnrollment { get; set; }
        public int SeatsAvailable { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion

    #region CourseEnrollment DTOs

    public class EnrollCourseDto
    {
        [Required(ErrorMessage = "Course ID is required")]
        public Guid CourseId { get; set; }
        
        [Required(ErrorMessage = "Employee ID is required")]
        public Guid EmployeeId { get; set; }
    }

    public class UpdateEnrollmentDto
    {
        public string? Status { get; set; }

        public bool? IsCompleted { get; set; }

        [Range(0, 100, ErrorMessage = "Score must be between 0 and 100")]
        public decimal? Score { get; set; }

        [StringLength(500)]
        public string? Feedback { get; set; }

        public bool? HasCertificate { get; set; }
        
        public DateTime? CompletionDate { get; set; }
    }

    public class CourseEnrollmentDto
    {
        public Guid Id { get; set; }
        public Guid CourseId { get; set; }
        public Guid EmployeeId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime EnrollmentDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CompletionDate { get; set; }
        public bool IsCompleted { get; set; }
        public decimal? Score { get; set; }
        public string? Feedback { get; set; }
        public bool HasCertificate { get; set; }
        public string? CertificateId { get; set; }
        public DateTime? CertificateIssuedDate { get; set; }
        public List<TrainingAssessmentDto> Assessments { get; set; } = new();
    }

    #endregion

    #region TrainingAssessment DTOs

    public class CreateAssessmentDto
    {
        [Required(ErrorMessage = "Enrollment ID is required")]
        public Guid EnrollmentId { get; set; }

        [Required(ErrorMessage = "Assessment type is required")]
        [StringLength(50)]
        public string AssessmentType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Assessment title is required")]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [Range(0.1, 10000, ErrorMessage = "Total marks must be positive")]
        public decimal TotalMarks { get; set; }

        [Range(0, 10000, ErrorMessage = "Obtained marks must be non-negative")]
        public decimal ObtainedMarks { get; set; }

        [Range(0, 100)]
        public decimal? PercentageScore { get; set; }

        [StringLength(500)]
        public string? Comments { get; set; }
    }

    public class UpdateAssessmentDto
    {
        [Range(0, 10000)]
        public decimal? ObtainedMarks { get; set; }

        [Range(0, 100)]
        public decimal? PercentageScore { get; set; }

        public string? Result { get; set; }

        [StringLength(500)]
        public string? Comments { get; set; }

        [StringLength(100)]
        public string? ReviewedBy { get; set; }
    }

    public class TrainingAssessmentDto
    {
        public Guid Id { get; set; }
        public Guid EnrollmentId { get; set; }
        public string AssessmentType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public DateTime AssessmentDate { get; set; }
        public decimal TotalMarks { get; set; }
        public decimal ObtainedMarks { get; set; }
        public decimal PercentageScore { get; set; }
        public string Result { get; set; } = string.Empty;
        public string? Comments { get; set; }
        public string? ReviewedBy { get; set; }
        public DateTime? ReviewDate { get; set; }
        public decimal? Score { get; set; } // Alias for PercentageScore compatibility
    }

    #endregion

    #region TrainingCertificate DTOs

    public class CreateTrainingCertificateDto
    {
        [Required(ErrorMessage = "Enrollment ID is required")]
        public Guid EnrollmentId { get; set; }

        [Required(ErrorMessage = "Certificate number is required")]
        [StringLength(100)]
        public string CertificateNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Title is required")]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Issued date is required")]
        public DateTime IssuedDate { get; set; }

        public DateTime? ExpiryDate { get; set; }

        [StringLength(500)]
        public string? DigitalCertificateUrl { get; set; }

        [Range(0, 100)]
        public decimal FinalScore { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class TrainingCertificateDto
    {
        public Guid Id { get; set; }
        public Guid EnrollmentId { get; set; }
        public string CertificateNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public DateTime IssuedDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public bool IsExpired { get; set; }
        public string? DigitalCertificateUrl { get; set; }
        public decimal FinalScore { get; set; }
        public string? Notes { get; set; }
    }

    #endregion

    #region TrainingRequest DTOs

    public class CreateTrainingRequestDto
    {
        [Required(ErrorMessage = "Employee ID is required")]
        public Guid EmployeeId { get; set; }

        [Required(ErrorMessage = "Course title is required")]
        [StringLength(200)]
        public string CourseTitle { get; set; } = string.Empty;

        public string? TrainingType { get; set; }

        public string? Description { get; set; }

        [Required(ErrorMessage = "Justification is required")]
        [StringLength(1000, MinimumLength = 20)]
        public string Justification { get; set; } = string.Empty;

        public DateTime? StartDate { get; set; }

        [Range(0, 999999, ErrorMessage = "Budget must be positive")]
        public decimal? RequestedBudget { get; set; }
        
        [Range(0, 999999)]
        public decimal? BudgetAmount { get; set; }

        [StringLength(500)]
        public string? SkillsToAcquire { get; set; }
    }

    public class UpdateTrainingRequestDto
    {
        public string? Status { get; set; }

        [Range(0, 999999)]
        public decimal? ApprovedBudget { get; set; }

        [StringLength(500)]
        public string? RejectionReason { get; set; }
    }

    public class TrainingRequestDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string CourseTitle { get; set; } = string.Empty;
        public string TrainingType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Justification { get; set; } = string.Empty;
        public DateTime RequestDate { get; set; }
        public DateTime RequestedDate { get; set; }
        public DateTime? StartDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal? RequestedBudget { get; set; }
        public decimal? ApprovedBudget { get; set; }
        public decimal? BudgetAmount { get; set; }
        public string? RejectionReason { get; set; }
        public string? SkillsToAcquire { get; set; }
    }

    #endregion
}
