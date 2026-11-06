using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    #region AppraisalCycle DTOs

    public class CreateAppraisalCycleDto
    {
        [Required(ErrorMessage = "Cycle name is required")]
        [StringLength(100, MinimumLength = 3)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Start date is required")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "End date is required")]
        public DateTime EndDate { get; set; }

        [Required(ErrorMessage = "Self-assessment deadline is required")]
        public DateTime SelfAssessmentDeadline { get; set; }

        [Required(ErrorMessage = "Manager assessment deadline is required")]
        public DateTime ManagerAssessmentDeadline { get; set; }
    }

    public class UpdateAppraisalCycleDto
    {
        [StringLength(100, MinimumLength = 3)]
        public string? Name { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? SelfAssessmentDeadline { get; set; }
        public DateTime? ManagerAssessmentDeadline { get; set; }

        public string? Status { get; set; }  // Draft, Active, InReview, Finalized, Archived
    }

    public class AppraisalCycleDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime SelfAssessmentDeadline { get; set; }
        public DateTime ManagerAssessmentDeadline { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    #endregion

    #region PerformanceAppraisal DTOs

    public class CreatePerformanceAppraisalDto
    {
        [Required(ErrorMessage = "Employee ID is required")]
        public Guid EmployeeId { get; set; }

        [Required(ErrorMessage = "Manager ID is required")]
        public Guid ManagerId { get; set; }

        [Required(ErrorMessage = "Appraisal cycle ID is required")]
        public Guid AppraisalCycleId { get; set; }

        [StringLength(1000)]
        public string? SelfAssessmentComments { get; set; }

        public List<CreateAppraisalRatingDto> SelfRatings { get; set; } = new();
    }

    public class UpdatePerformanceAppraisalDto
    {
        [StringLength(1000)]
        public string? ManagerAssessmentComments { get; set; }

        public List<CreateAppraisalRatingDto>? ManagerRatings { get; set; }
        public string? Status { get; set; }
        public bool? IsFinalized { get; set; }
    }

    public class SubmitSelfAssessmentDto
    {
        [Required(ErrorMessage = "Score is required")]
        [Range(1, 5, ErrorMessage = "Score must be between 1 and 5")]
        public decimal SelfAssessmentScore { get; set; }

        [StringLength(1000)]
        public string? SelfAssessmentComments { get; set; }

        [Required(ErrorMessage = "At least one rating is required")]
        public List<CreateAppraisalRatingDto> Ratings { get; set; } = new();
    }

    public class SubmitManagerAssessmentDto
    {
        [Required(ErrorMessage = "Score is required")]
        [Range(1, 5, ErrorMessage = "Score must be between 1 and 5")]
        public decimal ManagerAssessmentScore { get; set; }

        [StringLength(1000)]
        public string? ManagerAssessmentComments { get; set; }

        [Required(ErrorMessage = "At least one rating is required")]
        public List<CreateAppraisalRatingDto> Ratings { get; set; } = new();
    }

    public class PerformanceAppraisalDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public Guid ManagerId { get; set; }
        public Guid AppraisalCycleId { get; set; }
        public decimal? SelfAssessmentScore { get; set; }
        public string? SelfAssessmentComments { get; set; }
        public DateTime? SelfAssessmentSubmittedAt { get; set; }
        public decimal? ManagerAssessmentScore { get; set; }
        public string? ManagerAssessmentComments { get; set; }
        public DateTime? ManagerAssessmentSubmittedAt { get; set; }
        public decimal? OverallRating { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsFinalized { get; set; }
        public DateTime? FinalizedAt { get; set; }
        public string? EmployeeName { get; set; }
        public string? ManagerName { get; set; }
        public List<AppraisalRatingDto> Ratings { get; set; } = new();
    }

    #endregion

    #region AppraisalRating DTOs

    public class CreateAppraisalRatingDto
    {
        [Required(ErrorMessage = "Competency ID is required")]
        public Guid CompetencyId { get; set; }

        public decimal? SelfScore { get; set; }
        public decimal? ManagerScore { get; set; }

        [StringLength(500)]
        public string? Comments { get; set; }
    }

    public class AppraisalRatingDto
    {
        public Guid Id { get; set; }
        public Guid CompetencyId { get; set; }
        public decimal? SelfScore { get; set; }
        public decimal? ManagerScore { get; set; }
        public string? Comments { get; set; }
        public string? CompetencyName { get; set; }
    }

    #endregion

    #region AppraisalCompetency DTOs

    public class CreateAppraisalCompetencyDto
    {
        [Required(ErrorMessage = "Competency name is required")]
        [StringLength(100, MinimumLength = 3)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Range(0.1, 100, ErrorMessage = "Weight must be between 0.1 and 100")]
        public decimal Weight { get; set; } = 1.0m;

        [StringLength(50)]
        public string? Category { get; set; }

        public int SortOrder { get; set; } = 0;
    }

    public class UpdateAppraisalCompetencyDto
    {
        [StringLength(100, MinimumLength = 3)]
        public string? Name { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [Range(0.1, 100)]
        public decimal? Weight { get; set; }

        [StringLength(50)]
        public string? Category { get; set; }

        public int? SortOrder { get; set; }
        public bool? IsActive { get; set; }
    }

    public class AppraisalCompetencyDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Weight { get; set; }
        public string? Category { get; set; }
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
    }

    #endregion
}
