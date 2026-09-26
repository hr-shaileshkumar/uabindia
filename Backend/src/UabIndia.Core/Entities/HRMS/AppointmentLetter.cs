using System;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Official employment appointment letter issued upon candidate joining and onboarding.
    /// </summary>
    public class AppointmentLetter : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }

        public string LetterNumber { get; set; } = string.Empty; // e.g. AL-2026-0001
        public Guid EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;

        public Guid? OfferLetterId { get; set; }
        public OfferLetter? OfferLetter { get; set; }

        public Guid? CandidateId { get; set; }
        public Candidate? Candidate { get; set; }

        public DateTime IssueDate { get; set; } = DateTime.UtcNow;
        public DateTime JoiningDate { get; set; }
        public string Designation { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string WorkLocation { get; set; } = "Headquarters";

        public decimal AnnualCtc { get; set; } = 0;
        public decimal MonthlyGross { get; set; } = 0;
        public int ProbationMonths { get; set; } = 6;
        public int NoticePeriodDays { get; set; } = 30;

        public string? TermsAndConditions { get; set; }
        public string SignatoryName { get; set; } = "Human Resources Director";
        public string SignatoryDesignation { get; set; } = "Head of People & Operations";
        public string Status { get; set; } = "Issued"; // Issued, Acknowledged, Superseded
        public DateTime? AcknowledgedDate { get; set; }
    }
}
