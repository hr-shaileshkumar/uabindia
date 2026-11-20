using System;
using System.ComponentModel.DataAnnotations;
using UabIndia.Core.Entities;

namespace UabIndia.Api.Models
{
    public class CreateDisciplinaryCaseDto
    {
        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public DateTime IncidentDate { get; set; } = DateTime.UtcNow;

        public string Severity { get; set; } = "Moderate";
    }

    public class IssueShowCauseNoticeDto
    {
        [Required]
        [StringLength(300)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        public string Allegations { get; set; } = string.Empty;

        public int DaysToRespond { get; set; } = 7;
    }

    public class SubmitExplanationDto
    {
        [Required]
        public string Explanation { get; set; } = string.Empty;
    }

    public class IssueDisciplinaryActionDto
    {
        [Required]
        public string ActionType { get; set; } = "WrittenWarning";

        [Required]
        public string PenaltyDetails { get; set; } = string.Empty;

        public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;

        public DateTime? EndDate { get; set; }

        public decimal? MonetaryFine { get; set; }

        public int? SuspensionDays { get; set; }
    }

    public class DisciplinaryCaseDto
    {
        public Guid Id { get; set; }
        public string CaseNumber { get; set; } = string.Empty;
        public Guid EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public string? EmployeeCode { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime IncidentDate { get; set; }
        public string Severity { get; set; } = "Moderate";
        public string Status { get; set; } = "Draft";
        public string? ReportedByName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public int NoticeCount { get; set; }
        public int ActionCount { get; set; }
    }
}
