using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    public interface ITimesheetService
    {
        Task<TimesheetEntry> SubmitAsync(Guid id, CancellationToken cancellationToken = default);
        Task<TimesheetEntry> ApproveAsync(Guid id, string approvedBy, CancellationToken cancellationToken = default);
    }

    public interface IAccountingPeriodService
    {
        Task<AccountingPeriod> CloseAsync(int year, int month, Guid? closedBy, string? notes, CancellationToken cancellationToken = default);
        Task<AccountingPeriod> ReopenAsync(int year, int month, CancellationToken cancellationToken = default);
    }

    public interface IPurchaseRequestService
    {
        Task<PurchaseRequest> ApproveAsync(Guid id, Guid approvedBy, CancellationToken cancellationToken = default);
        Task<PurchaseRequest> RejectAsync(Guid id, CancellationToken cancellationToken = default);
        Task<ThreeWayMatchResult> MatchPurchaseOrderAsync(Guid purchaseOrderId, CancellationToken cancellationToken = default);
    }

    public sealed record ThreeWayMatchResult(
        Guid PurchaseOrderId,
        string PoNumber,
        decimal OrderedQuantity,
        decimal ReceivedQuantity,
        decimal BilledAmount,
        decimal PoAmount,
        string Status);

    public interface IApprovalRequestService
    {
        Task CreateAsync(string moduleKey, string entityType, Guid entityId, string? comments, Guid requestedBy, CancellationToken cancellationToken = default);
        Task ApproveAsync(Guid id, Guid performedBy, string? comments, CancellationToken cancellationToken = default);
        Task RejectAsync(Guid id, Guid performedBy, string? comments, CancellationToken cancellationToken = default);
        Task EscalateAsync(Guid id, Guid performedBy, string? reason, CancellationToken cancellationToken = default);
    }

    public interface IBankReconciliationService
    {
        Task<BankReconciliation> CreateAsync(CreateBankReconciliationCommand command, CancellationToken cancellationToken = default);
    }

    public sealed record CreateBankReconciliationCommand(
        Guid AccountId,
        decimal BankBalance,
        decimal BookBalance,
        string? Period,
        string? Status,
        string? Remarks);

    public interface IAppraisalCycleService
    {
        Task<AppraisalCycle> ActivateAsync(Guid id, CancellationToken cancellationToken = default);
    }

    public sealed record AppraisalRatingCommand(
        Guid CompetencyId,
        decimal? SelfScore,
        decimal? ManagerScore,
        string? Comments);

    public interface IAppraisalAssessmentService
    {
        Task<PerformanceAppraisal> SubmitSelfAssessmentAsync(
            Guid appraisalId,
            Guid actorUserId,
            decimal selfAssessmentScore,
            string? comments,
            IReadOnlyList<AppraisalRatingCommand> ratings,
            CancellationToken cancellationToken = default);

        Task<PerformanceAppraisal> SubmitManagerAssessmentAsync(
            Guid appraisalId,
            Guid actorUserId,
            decimal managerAssessmentScore,
            string? comments,
            IReadOnlyList<AppraisalRatingCommand> ratings,
            CancellationToken cancellationToken = default);

        Task<PerformanceAppraisal> ApproveAsync(
            Guid appraisalId,
            Guid approvedBy,
            CancellationToken cancellationToken = default);

        Task<PerformanceAppraisal> RejectAsync(
            Guid appraisalId,
            string? comments,
            CancellationToken cancellationToken = default);
    }

    public sealed record CreateOvertimeApprovalCommand(
        Guid OvertimeRequestId,
        Guid ApproverId,
        string ApproverName,
        string ApproverRole,
        ApprovalStatus Status,
        string? ApprovalNotes,
        string? RejectionReason,
        decimal? ApprovedHours,
        decimal? ApprovedAmount);

    public interface IOvertimeApprovalService
    {
        Task<OvertimeApproval> DecideAsync(CreateOvertimeApprovalCommand command, CancellationToken cancellationToken = default);
    }

    public sealed record CreateOvertimeRequestCommand(
        Guid EmployeeId,
        DateTime OvertimeDate,
        TimeSpan StartTime,
        TimeSpan EndTime,
        int BreakMinutes,
        string Reason,
        string? ProjectCode,
        Guid? ProjectId,
        OvertimeType OvertimeType,
        Guid? ManagerId,
        bool IsPreApproved,
        CompensationType CompensationType,
        decimal OvertimeRate,
        string? EmployeeNotes);

    public interface IOvertimeRequestService
    {
        Task<OvertimeRequest> CreateAsync(CreateOvertimeRequestCommand command, CancellationToken cancellationToken = default);
    }

    public sealed record ApplyForJobCommand(
        Guid JobPostingId,
        string FirstName,
        string LastName,
        string Email,
        string PhoneNumber,
        string? CurrentCompany,
        string? CurrentDesignation,
        int YearsOfExperience,
        string? CoverLetter,
        string? SourceOfRecruit);

    public sealed record JobApplicationResult(Candidate Candidate, JobPosting JobPosting);

    public interface IRecruitmentLifecycleService
    {
        Task<JobPosting> PublishAsync(Guid id, CancellationToken cancellationToken = default);
        Task<JobPosting> CloseAsync(Guid id, CancellationToken cancellationToken = default);
        Task<JobApplicationResult> ApplyAsync(ApplyForJobCommand command, CancellationToken cancellationToken = default);
        Task<CandidateScreening> ScheduleScreeningAsync(Guid candidateId, ScheduleScreeningCommand command, CancellationToken cancellationToken = default);
        Task<CandidateScreening> SubmitScreeningAsync(Guid screeningId, SubmitScreeningCommand command, CancellationToken cancellationToken = default);
        Task<OfferLetter> IssueOfferLetterAsync(IssueOfferLetterCommand command, CancellationToken cancellationToken = default);
        Task<OfferLetter> AcceptOfferLetterAsync(Guid offerLetterId, CancellationToken cancellationToken = default);
        Task<OfferLetter> RejectOfferLetterAsync(Guid offerLetterId, string? rejectionReason, CancellationToken cancellationToken = default);
        Task<Employee> ConvertCandidateToEmployeeAsync(Guid offerLetterId, CancellationToken cancellationToken = default);
        Task<AppointmentLetter> IssueAppointmentLetterAsync(IssueAppointmentLetterCommand command, CancellationToken cancellationToken = default);
    }

    public sealed record IssueOfferLetterCommand(
        Guid CandidateId,
        decimal OfferSalary,
        DateTime JoiningDate,
        DateTime ExpiryDate,
        string? JoiningDesignation,
        string? Department,
        string? ReportingManager,
        string? OfferTerms);

    public sealed record IssueAppointmentLetterCommand(
        Guid EmployeeId,
        DateTime JoiningDate,
        string Designation,
        string Department,
        string? WorkLocation,
        decimal AnnualCtc,
        decimal MonthlyGross,
        int ProbationMonths,
        int NoticePeriodDays,
        string? TermsAndConditions,
        string? SignatoryName,
        string? SignatoryDesignation);

    public sealed record ScheduleScreeningCommand(
        string ScreeningType,
        DateTime ScheduledDate,
        string? Interviewer,
        Guid? InterviewedBy);

    public sealed record SubmitScreeningCommand(
        ScreeningStatus? Status,
        RatingLevel? TechnicalSkillsRating,
        RatingLevel? CommunicationRating,
        RatingLevel? CulturalFitRating,
        decimal? OverallScore,
        string? Comments);
}
