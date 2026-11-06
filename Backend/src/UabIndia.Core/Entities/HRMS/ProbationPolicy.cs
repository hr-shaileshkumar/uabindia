using System;

namespace UabIndia.Core.Entities
{
    public class ProbationPolicy : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsDefault { get; set; } = false;
        
        /// <summary>
        /// Standard duration of probation in months (e.g. 3 or 6 months).
        /// </summary>
        public int DefaultProbationMonths { get; set; } = 3;

        /// <summary>
        /// Maximum permissible extension period in months (e.g. 3 months).
        /// </summary>
        public int MaxExtensionMonths { get; set; } = 3;

        /// <summary>
        /// Notice period required during probation period in days (e.g. 15 or 30 days).
        /// </summary>
        public int NoticePeriodDaysProbation { get; set; } = 15;

        /// <summary>
        /// Notice period required after permanent confirmation in days (e.g. 60 or 90 days).
        /// </summary>
        public int NoticePeriodDaysConfirmed { get; set; } = 60;

        /// <summary>
        /// Days prior to probation end date when HR and Manager are alerted for review.
        /// </summary>
        public int EvaluationReminderDaysBeforeEnd { get; set; } = 15;

        /// <summary>
        /// Whether formal line manager review is mandatory for confirmation.
        /// </summary>
        public bool RequiresManagerReview { get; set; } = true;

        /// <summary>
        /// Whether Head of Department (HOD) approval is required.
        /// </summary>
        public bool RequiresHodApproval { get; set; } = true;

        /// <summary>
        /// If false, employee remains in Pending Confirmation until explicit HR/Management sign-off.
        /// </summary>
        public bool AutoConfirmationAllowed { get; set; } = false;

        /// <summary>
        /// Minimum performance score (0-100) required for confirmation without extension.
        /// </summary>
        public int MinimumReviewScoreForConfirmation { get; set; } = 70;

        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string Status { get; set; } = "Active"; // Active, Draft, Archived
    }
}
