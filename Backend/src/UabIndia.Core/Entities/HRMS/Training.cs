using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Training course entity for training & development module.
    /// </summary>
    public class TrainingCourse : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Instructor { get; set; }
        public Guid? InstructorId { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty; // Beginner, Intermediate, Advanced
        public int DurationHours { get; set; }
        public int Duration { get; set; } // Alias for DurationHours
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int MaxParticipants { get; set; }
        public decimal? Cost { get; set; }
        public string? Location { get; set; }
        public TrainingDeliveryMode DeliveryMode { get; set; }
        public TrainingCourseStatus Status { get; set; }
        public bool IsActive { get; set; }
        public string? Syllabus { get; set; }
        public string? PrerequisiteSkills { get; set; }
        public int CurrentEnrollment { get; set; } = 0;

        // Navigation
        public ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
    }

    /// <summary>
    /// Course enrollment entity - tracks employee participation in courses.
    /// </summary>
    public class CourseEnrollment : BaseEntity
    {
        public Guid CourseId { get; set; }
        public TrainingCourse Course { get; set; } = null!;
        public Guid EmployeeId { get; set; }
        public User Employee { get; set; } = null!;
        public DateTime EnrollmentDate { get; set; }
        public EnrollmentStatus Status { get; set; }
        public DateTime? CompletionDate { get; set; }
        public bool IsCompleted { get; set; }
        public decimal? Score { get; set; }
        public string? Feedback { get; set; }
        public DateTime? CertificateIssuedDate { get; set; }
        public bool HasCertificate { get; set; }
        public string? CertificateId { get; set; }

        // Navigation
        public ICollection<TrainingAssessment> Assessments { get; set; } = new List<TrainingAssessment>();
    }

    /// <summary>
    /// Training assessment - tracks evaluation during/after training.
    /// </summary>
    public class TrainingAssessment : BaseEntity
    {
        public Guid EnrollmentId { get; set; }
        public CourseEnrollment Enrollment { get; set; } = null!;
        public string AssessmentType { get; set; } = string.Empty; // Quiz, Assignment, Final Exam
        public string Title { get; set; } = string.Empty;
        public DateTime AssessmentDate { get; set; }
        public decimal TotalMarks { get; set; }
        public decimal ObtainedMarks { get; set; }
        public decimal PercentageScore { get; set; }
        public AssessmentResult Result { get; set; }
        public string? Comments { get; set; }
        public string? ReviewedBy { get; set; }
        public DateTime? ReviewDate { get; set; }
    }

    /// <summary>
    /// Training completion certificate tracking.
    /// </summary>
    public class TrainingCertificate : BaseEntity
    {
        public Guid EnrollmentId { get; set; }
        public CourseEnrollment Enrollment { get; set; } = null!;
        public string CertificateNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public DateTime IssuedDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public bool IsExpired { get; set; }
        public string? DigitalCertificateUrl { get; set; }
        public decimal FinalScore { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Training request - employee requests training courses.
    /// </summary>
    public class TrainingRequest : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public User Employee { get; set; } = null!;
        public string CourseTitle { get; set; } = string.Empty;
        public string Justification { get; set; } = string.Empty;
        public DateTime RequestDate { get; set; }
        public DateTime? StartDate { get; set; }
        public TrainingRequestStatus Status { get; set; }
        public Guid? ApprovedBy { get; set; }
        public User? ApprovedByUser { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime? RejectionDate { get; set; }
        public decimal? RequestedBudget { get; set; }
        public decimal? ApprovedBudget { get; set; }
        public string? SkillsToAcquire { get; set; }
        
        // Additional properties for API compatibility
        public string? TrainingType { get; set; }
        public string? Description { get; set; }
        public decimal? BudgetAmount { get; set; }
    }

    #region Enums

    public enum TrainingDeliveryMode
    {
        Classroom = 1,
        Online = 2,
        Hybrid = 3,
        SelfPaced = 4,
        Workshop = 5,
        Webinar = 6,
        OnTheJob = 7,
        Conference = 8
    }

    public enum TrainingCourseStatus
    {
        Draft = 1,
        Scheduled = 2,
        InProgress = 3,
        Completed = 4,
        Cancelled = 5,
        OnHold = 6,
        Archived = 7
    }

    public enum EnrollmentStatus
    {
        Pending = 1,
        Approved = 2,
        InProgress = 3,
        Completed = 4,
        Dropped = 5,
        Rejected = 6,
        OnHold = 7
    }

    public enum AssessmentResult
    {
        Pass = 1,
        Fail = 2,
        Pending = 3,
        Incomplete = 4
    }

    public enum TrainingRequestStatus
    {
        Submitted = 1,
        UnderReview = 2,
        Approved = 3,
        Rejected = 4,
        Withdrawn = 5,
        Completed = 6
    }

    #endregion
}
