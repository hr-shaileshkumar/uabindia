using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    #region JobPosting DTOs

    public class CreateJobPostingDto
    {
        [Required(ErrorMessage = "Job title is required")]
        [StringLength(100, MinimumLength = 3)]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Job description is required")]
        [StringLength(5000, MinimumLength = 20)]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Department is required")]
        [StringLength(50)]
        public string Department { get; set; } = string.Empty;

        [Required(ErrorMessage = "Location is required")]
        [StringLength(100)]
        public string Location { get; set; } = string.Empty;

        [Required(ErrorMessage = "Job level is required")]
        public string Level { get; set; } = string.Empty;

        [Required(ErrorMessage = "Job type is required")]
        public string JobType { get; set; } = string.Empty;

        [Range(0, 9999999, ErrorMessage = "Min salary must be positive")]
        public decimal MinSalary { get; set; }

        [Range(0, 9999999, ErrorMessage = "Max salary must be positive")]
        public decimal MaxSalary { get; set; }

        [StringLength(500)]
        public string? RequiredSkills { get; set; }

        [StringLength(500)]
        public string? NiceToHaveSkills { get; set; }

        [Required(ErrorMessage = "Closing date is required")]
        public DateTime ClosingDate { get; set; }

        public int? NumberOfPositions { get; set; } = 1;

        public Guid? StaffingPlanId { get; set; }
    }

    public class UpdateJobPostingDto
    {
        [StringLength(100, MinimumLength = 3)]
        public string? Title { get; set; }

        [StringLength(5000, MinimumLength = 20)]
        public string? Description { get; set; }

        [StringLength(50)]
        public string? Department { get; set; }

        [StringLength(100)]
        public string? Location { get; set; }

        public string? Level { get; set; }

        [Range(0, 9999999)]
        public decimal? MinSalary { get; set; }

        [Range(0, 9999999)]
        public decimal? MaxSalary { get; set; }

        [StringLength(500)]
        public string? RequiredSkills { get; set; }

        [StringLength(500)]
        public string? NiceToHaveSkills { get; set; }

        public DateTime? ClosingDate { get; set; }

        public string? Status { get; set; }

        public int? NumberOfPositions { get; set; }

        public Guid? StaffingPlanId { get; set; }
    }

    public class JobPostingDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public string JobType { get; set; } = string.Empty;
        public decimal MinSalary { get; set; }
        public decimal MaxSalary { get; set; }
        public string? RequiredSkills { get; set; }
        public string? NiceToHaveSkills { get; set; }
        public DateTime PostedDate { get; set; }
        public DateTime? ClosingDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int ApplicationCount { get; set; }
        public int? NumberOfPositions { get; set; }
        public Guid? StaffingPlanId { get; set; }
        public string? StaffingPlanCode { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion

    #region Candidate DTOs

    public class CreateCandidateDto
    {
        [Required(ErrorMessage = "First name is required")]
        [StringLength(50, MinimumLength = 2)]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [StringLength(50, MinimumLength = 2)]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required")]
        [Phone(ErrorMessage = "Invalid phone format")]
        public string PhoneNumber { get; set; } = string.Empty;

        [StringLength(100)]
        public string? CurrentCompany { get; set; }

        [StringLength(100)]
        public string? CurrentDesignation { get; set; }

        [Range(0, 70, ErrorMessage = "Years of experience must be between 0 and 70")]
        public int YearsOfExperience { get; set; }

        [Required(ErrorMessage = "Job posting ID is required")]
        public Guid JobPostingId { get; set; }

        [StringLength(500)]
        public string? CoverLetter { get; set; }

        [StringLength(100)]
        public string? SourceOfRecruit { get; set; }
    }

    public class UpdateCandidateDto
    {
        [StringLength(50, MinimumLength = 2)]
        public string? FirstName { get; set; }

        [StringLength(50, MinimumLength = 2)]
        public string? LastName { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        [Phone]
        public string? PhoneNumber { get; set; }

        [StringLength(100)]
        public string? CurrentCompany { get; set; }

        [StringLength(100)]
        public string? CurrentDesignation { get; set; }

        [Range(0, 70)]
        public int? YearsOfExperience { get; set; }

        public string? Status { get; set; }

        public string? OverallRating { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class CandidateDto
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string CurrentCompany { get; set; } = string.Empty;
        public string CurrentDesignation { get; set; } = string.Empty;
        public int YearsOfExperience { get; set; }
        public string? Resume { get; set; }
        public string? CoverLetter { get; set; }
        public string Status { get; set; } = string.Empty;
        public string OverallRating { get; set; } = string.Empty;
        public string? SourceOfRecruit { get; set; }
        public string? Notes { get; set; }
        public DateTime AppliedDate { get; set; }
        public DateTime? InterviewDate { get; set; }
        public Guid JobPostingId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
    }

    #endregion

    #region CandidateScreening DTOs

    public class CreateScreeningDto
    {
        [Required(ErrorMessage = "Screening type is required")]
        [StringLength(50)]
        public string ScreeningType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Scheduled date is required")]
        public DateTime ScheduledDate { get; set; }

        [StringLength(100)]
        public string? Interviewer { get; set; }
    }

    public class UpdateScreeningDto
    {
        public string? Status { get; set; }

        public string? TechnicalSkillsRating { get; set; }

        public string? CommunicationRating { get; set; }

        public string? CulturalFitRating { get; set; }

        [Range(0, 100, ErrorMessage = "Overall score must be between 0 and 100")]
        public decimal? OverallScore { get; set; }

        [StringLength(1000)]
        public string? Comments { get; set; }
    }

    public class ScreeningDto
    {
        public Guid Id { get; set; }
        public Guid CandidateId { get; set; }
        public string ScreeningType { get; set; } = string.Empty;
        public DateTime ScheduledDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Interviewer { get; set; }
        public string TechnicalSkillsRating { get; set; } = string.Empty;
        public string CommunicationRating { get; set; } = string.Empty;
        public string CulturalFitRating { get; set; } = string.Empty;
        public decimal OverallScore { get; set; }
        public string? Comments { get; set; }
        public DateTime? CompletedDate { get; set; }
    }

    #endregion

    #region OfferLetter DTOs

    public class CreateOfferLetterDto
    {
        [Required(ErrorMessage = "Candidate ID is required")]
        public Guid CandidateId { get; set; }

        [Range(0, 99999999, ErrorMessage = "Offer salary must be positive")]
        public decimal OfferSalary { get; set; }

        [Required(ErrorMessage = "Expiry date is required")]
        public DateTime ExpiryDate { get; set; }

        public DateTime? JoiningDate { get; set; }

        [StringLength(100)]
        public string? JoiningDesignation { get; set; }

        [StringLength(50)]
        public string? Department { get; set; }

        [StringLength(100)]
        public string? ReportingManager { get; set; }

        public string? OfferTerms { get; set; }
    }

    public class UpdateOfferLetterDto
    {
        public DateTime? ExpiryDate { get; set; }

        public DateTime? JoiningDate { get; set; }

        [StringLength(100)]
        public string? JoiningDesignation { get; set; }

        [StringLength(50)]
        public string? Department { get; set; }

        [StringLength(100)]
        public string? ReportingManager { get; set; }

        public string? OfferTerms { get; set; }

        public string? Status { get; set; }
    }

    public class OfferLetterDto
    {
        public Guid Id { get; set; }
        public Guid JobPostingId { get; set; }
        public Guid CandidateId { get; set; }
        public string CandidateName { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public decimal OfferSalary { get; set; }
        public DateTime OfferDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public DateTime? JoiningDate { get; set; }
        public string? JoiningDesignation { get; set; }
        public string? Department { get; set; }
        public string? ReportingManager { get; set; }
        public string? OfferTerms { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? AcceptedDate { get; set; }
        public DateTime? RejectedDate { get; set; }
        public string? RejectionReason { get; set; }
        public bool IsJoined { get; set; }
        public Guid? EmployeeId { get; set; }
        public string? EmployeeCode { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion

    #region AppointmentLetter DTOs

    public class CreateAppointmentLetterDto
    {
        [Required]
        public Guid EmployeeId { get; set; }

        public DateTime JoiningDate { get; set; } = DateTime.UtcNow;

        [Required]
        public string Designation { get; set; } = string.Empty;

        [Required]
        public string Department { get; set; } = string.Empty;

        public string? WorkLocation { get; set; }

        public decimal AnnualCtc { get; set; }

        public decimal MonthlyGross { get; set; }

        public int ProbationMonths { get; set; } = 6;

        public int NoticePeriodDays { get; set; } = 30;

        public string? TermsAndConditions { get; set; }

        public string? SignatoryName { get; set; }

        public string? SignatoryDesignation { get; set; }
    }

    public class AppointmentLetterDto
    {
        public Guid Id { get; set; }
        public string LetterNumber { get; set; } = string.Empty;
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string EmployeeCode { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public DateTime JoiningDate { get; set; }
        public string Designation { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string WorkLocation { get; set; } = string.Empty;
        public decimal AnnualCtc { get; set; }
        public decimal MonthlyGross { get; set; }
        public int ProbationMonths { get; set; }
        public int NoticePeriodDays { get; set; }
        public string? TermsAndConditions { get; set; }
        public string SignatoryName { get; set; } = string.Empty;
        public string SignatoryDesignation { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    #endregion
}
