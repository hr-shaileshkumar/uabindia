using System;
using System.Collections.Generic;
using UabIndia.Core.Entities;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Job posting entity for recruitment module.
    /// </summary>
    public class JobPosting : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public JobLevel Level { get; set; }
        public JobType JobType { get; set; }
        public decimal MinSalary { get; set; }
        public decimal MaxSalary { get; set; }
        public string? RequiredSkills { get; set; }
        public string? NiceToHaveSkills { get; set; }
        public DateTime PostedDate { get; set; }
        public DateTime? ClosingDate { get; set; }
        public JobStatus Status { get; set; }
        public bool IsActive { get; set; }
        public User? CreatedByUser { get; set; }
        public int? NumberOfPositions { get; set; }
        public int ApplicationCount { get; set; } = 0;

        // Navigation
        public ICollection<Candidate> Candidates { get; set; } = new List<Candidate>();
        public ICollection<OfferLetter> OfferLetters { get; set; } = new List<OfferLetter>();
    }

    /// <summary>
    /// Candidate entity for recruitment module.
    /// </summary>
    public class Candidate : BaseEntity
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string CurrentCompany { get; set; } = string.Empty;
        public string CurrentDesignation { get; set; } = string.Empty;
        public int YearsOfExperience { get; set; }
        public string? Resume { get; set; } // File path or URL
        public string? CoverLetter { get; set; }
        public CandidateStatus Status { get; set; }
        public RatingLevel OverallRating { get; set; }
        public string? SourceOfRecruit { get; set; } // LinkedIn, Referral, Job Portal, etc.
        public string? Notes { get; set; }
        public DateTime AppliedDate { get; set; }
        public DateTime? InterviewDate { get; set; }
        public string? InterviewFeedback { get; set; }
        public Guid? InterviewedBy { get; set; }
        public User? InterviewedByUser { get; set; }

        // Navigation
        public Guid JobPostingId { get; set; }
        public JobPosting JobPosting { get; set; } = null!;
        public ICollection<CandidateScreening> Screenings { get; set; } = new List<CandidateScreening>();
    }

    /// <summary>
    /// Candidate screening/interview details.
    /// </summary>
    public class CandidateScreening : BaseEntity
    {
        public Guid CandidateId { get; set; }
        public Candidate Candidate { get; set; } = null!;
        public string ScreeningType { get; set; } = string.Empty; // Phone, Video, In-Person, Technical
        public DateTime ScheduledDate { get; set; }
        public ScreeningStatus Status { get; set; }
        public string? Interviewer { get; set; }
        public Guid? InterviewedBy { get; set; }
        public User? InterviewedByUser { get; set; }
        public RatingLevel TechnicalSkillsRating { get; set; }
        public RatingLevel CommunicationRating { get; set; }
        public RatingLevel CulturalFitRating { get; set; }
        public decimal OverallScore { get; set; } // 0-100
        public string? Comments { get; set; }
        public DateTime? CompletedDate { get; set; }
    }

    /// <summary>
    /// Job application/interview process.
    /// </summary>
    public class JobApplication : BaseEntity
    {
        public Guid CandidateId { get; set; }
        public Candidate Candidate { get; set; } = null!;
        public Guid JobPostingId { get; set; }
        public JobPosting JobPosting { get; set; } = null!;
        public ApplicationStatus Status { get; set; }
        public DateTime ApplicationDate { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime? RejectionDate { get; set; }
        public Guid? RejectedBy { get; set; }
        public User? RejectedByUser { get; set; }
        public int ScreeningRound { get; set; } = 1; // 1, 2, 3, etc.
    }

    /// <summary>
    /// Offer letter for selected candidates.
    /// </summary>
    public class OfferLetter : BaseEntity
    {
        public Guid JobPostingId { get; set; }
        public JobPosting JobPosting { get; set; } = null!;
        public Guid CandidateId { get; set; }
        public Candidate Candidate { get; set; } = null!;
        public decimal OfferSalary { get; set; }
        public DateTime OfferDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public DateTime? JoiningDate { get; set; }
        public string? JoiningDesignation { get; set; }
        public string? Department { get; set; }
        public string? ReportingManager { get; set; }
        public OfferStatus Status { get; set; }
        public DateTime? AcceptedDate { get; set; }
        public DateTime? RejectedDate { get; set; }
        public string? RejectionReason { get; set; }
        public bool IsJoined { get; set; }
        public User? CreatedByUser { get; set; }
        public Guid? AcceptedBy { get; set; } // Candidate user ID if joined
        public User? AcceptedByUser { get; set; }
    }

    #region Enums

    public enum JobStatus
    {
        Draft = 1,
        Open = 2,
        OnHold = 3,
        Closed = 4,
        Cancelled = 5,
        Filled = 6
    }

    public enum JobLevel
    {
        EntryLevel = 1,
        Junior = 2,
        MidLevel = 3,
        Senior = 4,
        Lead = 5,
        Manager = 6,
        SeniorManager = 7,
        Director = 8,
        Executive = 9
    }

    public enum JobType
    {
        FullTime = 1,
        PartTime = 2,
        Contract = 3,
        Temporary = 4,
        Internship = 5,
        Freelance = 6
    }

    public enum CandidateStatus
    {
        Applied = 1,
        ScreeningInProgress = 2,
        InterviewInvited = 3,
        InterviewScheduled = 4,
        InterviewCompleted = 5,
        RoundTwo = 6,
        FinalRound = 7,
        OfferExtended = 8,
        OfferAccepted = 9,
        Joined = 10,
        Rejected = 11,
        WithdrawnByCandidate = 12
    }

    public enum ScreeningStatus
    {
        Scheduled = 1,
        Completed = 2,
        NoShow = 3,
        Rescheduled = 4,
        Cancelled = 5
    }

    public enum ApplicationStatus
    {
        Applied = 1,
        ScreeningRound1 = 2,
        ScreeningRound2 = 3,
        ScreeningRound3 = 4,
        FinalRound = 5,
        OfferExtended = 6,
        OfferAccepted = 7,
        Rejected = 8,
        WithdrawnByCandidate = 9
    }

    public enum OfferStatus
    {
        Extended = 1,
        Accepted = 2,
        Rejected = 3,
        Expired = 4,
        Pending = 5,
        Completed = 6
    }

    public enum RatingLevel
    {
        Poor = 1,
        Fair = 2,
        Average = 3,
        Good = 4,
        Excellent = 5
    }

    #endregion
}
