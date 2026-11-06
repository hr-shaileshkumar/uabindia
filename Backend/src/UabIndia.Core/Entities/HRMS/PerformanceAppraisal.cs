using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Represents an appraisal cycle/period for performance reviews.
    /// </summary>
    public class AppraisalCycle : BaseEntity
    {
        /// <summary>
        /// Name of the appraisal cycle (e.g., "FY 2023-24 Mid-year").
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Description of the appraisal cycle.
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Start date of the appraisal period.
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// End date of the appraisal period.
        /// </summary>
        public DateTime EndDate { get; set; }

        /// <summary>
        /// Deadline for employee self-assessment submission.
        /// </summary>
        public DateTime SelfAssessmentDeadline { get; set; }

        /// <summary>
        /// Deadline for manager assessment submission.
        /// </summary>
        public DateTime ManagerAssessmentDeadline { get; set; }

        /// <summary>
        /// Current status of the cycle (Draft, Active, In Review, Finalized, Archived).
        /// </summary>
        public AppraisalCycleStatus Status { get; set; } = AppraisalCycleStatus.Draft;

        /// <summary>
        /// Whether this cycle is the active one.
        /// </summary>
        public bool IsActive { get; set; } = false;

        /// <summary>
        /// Navigation property: Appraisals in this cycle.
        /// </summary>
        public ICollection<PerformanceAppraisal> Appraisals { get; set; } = new List<PerformanceAppraisal>();
    }

    /// <summary>
    /// Represents an individual performance appraisal for an employee.
    /// </summary>
    public class PerformanceAppraisal : BaseEntity
    {
        /// <summary>
        /// ID of the employee being appraised.
        /// </summary>
        public Guid EmployeeId { get; set; }

        /// <summary>
        /// ID of the appraising manager.
        /// </summary>
        public Guid ManagerId { get; set; }

        /// <summary>
        /// ID of the appraisal cycle.
        /// </summary>
        public Guid AppraisalCycleId { get; set; }

        /// <summary>
        /// Employee self-assessment score (1-5).
        /// </summary>
        public decimal? SelfAssessmentScore { get; set; }

        /// <summary>
        /// Employee self-assessment comments.
        /// </summary>
        public string? SelfAssessmentComments { get; set; }

        /// <summary>
        /// Date when employee submitted self-assessment.
        /// </summary>
        public DateTime? SelfAssessmentSubmittedAt { get; set; }

        /// <summary>
        /// Manager's assessment score (1-5).
        /// </summary>
        public decimal? ManagerAssessmentScore { get; set; }

        /// <summary>
        /// Manager's assessment comments.
        /// </summary>
        public string? ManagerAssessmentComments { get; set; }

        /// <summary>
        /// Date when manager submitted assessment.
        /// </summary>
        public DateTime? ManagerAssessmentSubmittedAt { get; set; }

        /// <summary>
        /// Overall appraisal rating after consolidation.
        /// </summary>
        public decimal? OverallRating { get; set; }

        /// <summary>
        /// Final status of the appraisal (Pending, Submitted, Reviewed, Approved, Rejected).
        /// </summary>
        public AppraisalStatus Status { get; set; } = AppraisalStatus.Pending;

        /// <summary>
        /// Whether the appraisal has been finalized and locked.
        /// </summary>
        public bool IsFinalized { get; set; } = false;

        /// <summary>
        /// Date when the appraisal was finalized.
        /// </summary>
        public DateTime? FinalizedAt { get; set; }

        /// <summary>
        /// ID of the user who approved the final appraisal.
        /// </summary>
        public Guid? ApprovedBy { get; set; }

        /// <summary>
        /// Navigation properties.
        /// </summary>
        public AppraisalCycle? AppraisalCycle { get; set; }
        public User? Employee { get; set; }
        public User? Manager { get; set; }
        public ICollection<AppraisalRating> Ratings { get; set; } = new List<AppraisalRating>();
    }

    /// <summary>
    /// Appraisal competency/parameter for evaluation.
    /// </summary>
    public class AppraisalCompetency : BaseEntity
    {
        /// <summary>
        /// Name of the competency (e.g., Leadership, Technical Skills).
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Description of the competency.
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Weight of this competency in overall appraisal (1-100).
        /// </summary>
        public decimal Weight { get; set; } = 1.0m;

        /// <summary>
        /// Category of the competency (Technical, Behavioral, Leadership, etc.).
        /// </summary>
        public string? Category { get; set; }

        /// <summary>
        /// Display order in UI.
        /// </summary>
        public int SortOrder { get; set; } = 0;

        /// <summary>
        /// Whether this competency is active.
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Navigation property: Ratings using this competency.
        /// </summary>
        public ICollection<AppraisalRating> Ratings { get; set; } = new List<AppraisalRating>();
    }

    /// <summary>
    /// Rating for a specific competency/parameter in an appraisal.
    /// </summary>
    public class AppraisalRating : BaseEntity
    {
        /// <summary>
        /// ID of the performance appraisal.
        /// </summary>
        public Guid AppraisalId { get; set; }
        public PerformanceAppraisal? Appraisal { get; set; }

        /// <summary>
        /// ID of the competency/parameter being rated.
        /// </summary>
        public Guid CompetencyId { get; set; }        public AppraisalCompetency? Competency { get; set; }
        /// <summary>
        /// Score given by the employee (self-assessment).
        /// </summary>
        public decimal? SelfScore { get; set; }

        /// <summary>
        /// Score given by the manager.
        /// </summary>
        public decimal? ManagerScore { get; set; }

        /// <summary>
        /// Comments about this competency rating.
        /// </summary>
        public string? Comments { get; set; }
    }

    /// <summary>
    /// Status enum for appraisal cycles.
    /// </summary>
    public enum AppraisalCycleStatus
    {
        Draft = 1,        // Not yet started
        Active = 2,       // Currently accepting appraisals
        InReview = 3,     // Under management review
        Finalized = 4,    // All appraisals finalized
        Archived = 5      // Historical record
    }

    /// <summary>
    /// Status enum for individual appraisals.
    /// </summary>
    public enum AppraisalStatus
    {
        Pending = 1,              // Awaiting submission
        SelfSubmitted = 2,        // Employee has submitted self-assessment
        ManagerSubmitted = 3,     // Manager has submitted assessment
        Reviewed = 4,             // Under review by HR/leadership
        Approved = 5,             // Approved and finalized
        Rejected = 6,             // Rejected and returned for revision
        Archived = 7              // Archived
    }
}
