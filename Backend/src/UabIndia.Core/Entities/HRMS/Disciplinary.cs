using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Core.Entities
{
    public enum DisciplinarySeverity
    {
        Minor = 0,
        Moderate = 1,
        Severe = 2,
        Critical = 3
    }

    public enum DisciplinaryStatus
    {
        Draft = 0,
        NoticeIssued = 1,
        ExplanationSubmitted = 2,
        EnquiryInProgress = 3,
        ActionRecommended = 4,
        Closed = 5
    }

    public enum DisciplinaryActionType
    {
        Counselling = 0,
        WrittenWarning = 1,
        Suspension = 2,
        WithholdingIncrement = 3,
        Demotion = 4,
        Termination = 5,
        Exonerated = 6
    }

    /// <summary>
    /// Tracks formal disciplinary cases initiated against an employee under standing orders / code of conduct.
    /// </summary>
    public class DisciplinaryCase : BaseEntity
    {
        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        [StringLength(50)]
        public string CaseNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public DateTime IncidentDate { get; set; }

        public DisciplinarySeverity Severity { get; set; } = DisciplinarySeverity.Moderate;

        public DisciplinaryStatus Status { get; set; } = DisciplinaryStatus.Draft;

        public Guid? ReportedBy { get; set; }

        public string? ReportedByName { get; set; }

        public Guid? CommitteeChairpersonId { get; set; }

        public string? CommitteeFindings { get; set; }

        public DateTime? ClosedAt { get; set; }

        public Guid? ClosedBy { get; set; }

        public virtual ICollection<ShowCauseNotice> Notices { get; set; } = new List<ShowCauseNotice>();

        public virtual ICollection<DisciplinaryAction> Actions { get; set; } = new List<DisciplinaryAction>();
    }

    /// <summary>
    /// Represents a formal Show-Cause Notice issued to the employee detailing allegations and response deadline.
    /// </summary>
    public class ShowCauseNotice : BaseEntity
    {
        [Required]
        public Guid DisciplinaryCaseId { get; set; }

        [Required]
        [StringLength(200)]
        public string NoticeNumber { get; set; } = string.Empty;

        public DateTime NoticeDate { get; set; } = DateTime.UtcNow;

        [Required]
        [StringLength(300)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        public string Allegations { get; set; } = string.Empty;

        public DateTime ExplanationDueDate { get; set; }

        public string? EmployeeExplanation { get; set; }

        public DateTime? ExplanationSubmittedAt { get; set; }

        public Guid? IssuedBy { get; set; }

        public string? IssuedByName { get; set; }
    }

    /// <summary>
    /// Represents the final disciplinary action or penalty order issued following enquiry proceedings.
    /// </summary>
    public class DisciplinaryAction : BaseEntity
    {
        [Required]
        public Guid DisciplinaryCaseId { get; set; }

        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        [StringLength(50)]
        public string OrderNumber { get; set; } = string.Empty;

        public DisciplinaryActionType ActionType { get; set; } = DisciplinaryActionType.WrittenWarning;

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        public DateTime EffectiveDate { get; set; }

        public DateTime? EndDate { get; set; }

        [Required]
        public string PenaltyDetails { get; set; } = string.Empty;

        public decimal? MonetaryFine { get; set; }

        public int? SuspensionDays { get; set; }

        public Guid? DecidedBy { get; set; }

        public string? DecidedByName { get; set; }
    }
}
