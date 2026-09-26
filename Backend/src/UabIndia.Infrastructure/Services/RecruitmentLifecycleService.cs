using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class RecruitmentLifecycleService : IRecruitmentLifecycleService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService? _numbers;

        public RecruitmentLifecycleService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService? numbers = null)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
        }

        public async Task<JobPosting> PublishAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var posting = await LoadTrackedPostingAsync(id, cancellationToken);
            posting.Status = JobStatus.Open;
            posting.IsActive = true;
            posting.UpdatedAt = DateTime.UtcNow;
            if (posting.PostedDate == default)
                posting.PostedDate = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return posting;
        }

        public async Task<JobPosting> CloseAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var posting = await LoadTrackedPostingAsync(id, cancellationToken);
            posting.Status = JobStatus.Closed;
            posting.IsActive = false;
            posting.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return posting;
        }

        public async Task<JobApplicationResult> ApplyAsync(
            ApplyForJobCommand command,
            CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var posting = await _db.JobPostings.FirstOrDefaultAsync(
                p => p.Id == command.JobPostingId && p.TenantId == tenantId && !p.IsDeleted,
                cancellationToken);
            if (posting == null || !posting.IsActive)
                throw new InvalidOperationException("Job posting is not available");

            var existingCandidate = await _db.Candidates.FirstOrDefaultAsync(
                c => c.Email == command.Email && c.TenantId == tenantId && !c.IsDeleted,
                cancellationToken);
            if (existingCandidate != null)
            {
                var duplicate = await _db.JobApplications.AnyAsync(
                    a => a.CandidateId == existingCandidate.Id
                        && a.JobPostingId == command.JobPostingId
                        && a.TenantId == tenantId
                        && !a.IsDeleted,
                    cancellationToken);
                if (duplicate)
                    throw new InvalidOperationException("You have already applied for this job");
            }

            var now = DateTime.UtcNow;
            var candidate = new Candidate
            {
                TenantId = tenantId,
                FirstName = command.FirstName,
                LastName = command.LastName ?? string.Empty,
                Email = command.Email ?? string.Empty,
                PhoneNumber = command.PhoneNumber ?? string.Empty,
                CurrentCompany = command.CurrentCompany ?? string.Empty,
                CurrentDesignation = command.CurrentDesignation ?? string.Empty,
                YearsOfExperience = command.YearsOfExperience,
                JobPostingId = command.JobPostingId,
                CoverLetter = command.CoverLetter ?? string.Empty,
                SourceOfRecruit = command.SourceOfRecruit ?? string.Empty,
                Status = CandidateStatus.Applied,
                OverallRating = RatingLevel.Average,
                AppliedDate = now
            };

            var application = new JobApplication
            {
                TenantId = tenantId,
                CandidateId = candidate.Id,
                JobPostingId = command.JobPostingId,
                Status = ApplicationStatus.Applied,
                ScreeningRound = 1,
                ApplicationDate = now
            };
            posting.ApplicationCount++;
            posting.UpdatedAt = now;

            _db.Candidates.Add(candidate);
            _db.JobApplications.Add(application);
            await _db.SaveChangesAsync(cancellationToken);
            return new JobApplicationResult(candidate, posting);
        }

        public async Task<CandidateScreening> ScheduleScreeningAsync(
            Guid candidateId,
            ScheduleScreeningCommand command,
            CancellationToken cancellationToken = default)
        {
            if (command.ScheduledDate <= DateTime.UtcNow)
                throw new InvalidOperationException("Scheduled date must be in the future");

            var tenantId = _tenantAccessor.GetTenantId();
            var candidate = await _db.Candidates.FirstOrDefaultAsync(
                c => c.Id == candidateId && c.TenantId == tenantId && !c.IsDeleted, cancellationToken);
            if (candidate == null)
                throw new KeyNotFoundException("Candidate not found");

            var screening = new CandidateScreening
            {
                TenantId = tenantId,
                CandidateId = candidateId,
                ScreeningType = command.ScreeningType,
                ScheduledDate = command.ScheduledDate,
                Status = ScreeningStatus.Scheduled,
                Interviewer = command.Interviewer,
                InterviewedBy = command.InterviewedBy
            };

            candidate.Status = CandidateStatus.InterviewScheduled;
            candidate.InterviewDate = command.ScheduledDate;
            candidate.UpdatedAt = DateTime.UtcNow;
            _db.CandidateScreenings.Add(screening);
            await _db.SaveChangesAsync(cancellationToken);
            return screening;
        }

        public async Task<CandidateScreening> SubmitScreeningAsync(
            Guid screeningId,
            SubmitScreeningCommand command,
            CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var screening = await _db.CandidateScreenings.FirstOrDefaultAsync(
                s => s.Id == screeningId && s.TenantId == tenantId && !s.IsDeleted, cancellationToken);
            if (screening == null)
                throw new KeyNotFoundException("Screening not found");

            if (command.Status.HasValue)
                screening.Status = command.Status.Value;
            if (command.TechnicalSkillsRating.HasValue)
                screening.TechnicalSkillsRating = command.TechnicalSkillsRating.Value;
            if (command.CommunicationRating.HasValue)
                screening.CommunicationRating = command.CommunicationRating.Value;
            if (command.CulturalFitRating.HasValue)
                screening.CulturalFitRating = command.CulturalFitRating.Value;
            if (command.OverallScore.HasValue)
                screening.OverallScore = command.OverallScore.Value;
            if (!string.IsNullOrEmpty(command.Comments))
                screening.Comments = command.Comments;

            if (screening.Status == ScreeningStatus.Completed)
                screening.CompletedDate = DateTime.UtcNow;

            screening.UpdatedAt = DateTime.UtcNow;

            // Update candidate status based on evaluation
            var candidate = await _db.Candidates.FirstOrDefaultAsync(
                c => c.Id == screening.CandidateId && c.TenantId == tenantId && !c.IsDeleted, cancellationToken);
            if (candidate != null)
            {
                if (screening.Status == ScreeningStatus.Completed)
                {
                    candidate.Status = CandidateStatus.InterviewCompleted;
                    if (command.TechnicalSkillsRating.HasValue)
                        candidate.OverallRating = command.TechnicalSkillsRating.Value;
                    if (!string.IsNullOrWhiteSpace(command.Comments))
                        candidate.InterviewFeedback = command.Comments;
                }
                candidate.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(cancellationToken);
            return screening;
        }

        public async Task<OfferLetter> IssueOfferLetterAsync(
            IssueOfferLetterCommand command,
            CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var candidate = await _db.Candidates
                .Include(c => c.JobPosting)
                .FirstOrDefaultAsync(c => c.Id == command.CandidateId && c.TenantId == tenantId && !c.IsDeleted, cancellationToken);
            if (candidate == null)
                throw new KeyNotFoundException("Candidate not found");

            var offer = new OfferLetter
            {
                TenantId = tenantId,
                CandidateId = candidate.Id,
                JobPostingId = candidate.JobPostingId,
                OfferSalary = command.OfferSalary,
                OfferDate = DateTime.UtcNow,
                ExpiryDate = command.ExpiryDate,
                JoiningDate = command.JoiningDate,
                JoiningDesignation = !string.IsNullOrWhiteSpace(command.JoiningDesignation) ? command.JoiningDesignation : candidate.JobPosting?.Title,
                Department = !string.IsNullOrWhiteSpace(command.Department) ? command.Department : candidate.JobPosting?.Department,
                ReportingManager = command.ReportingManager,
                OfferTerms = command.OfferTerms ?? "Standard employment terms and salary structure.",
                Status = OfferStatus.Extended
            };

            candidate.Status = CandidateStatus.OfferExtended;
            candidate.UpdatedAt = DateTime.UtcNow;

            _db.OfferLetters.Add(offer);
            await _db.SaveChangesAsync(cancellationToken);
            return offer;
        }

        public async Task<OfferLetter> AcceptOfferLetterAsync(
            Guid offerLetterId,
            CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var offer = await _db.OfferLetters
                .FirstOrDefaultAsync(o => o.Id == offerLetterId && o.TenantId == tenantId && !o.IsDeleted, cancellationToken);
            if (offer == null)
                throw new KeyNotFoundException("Offer letter not found");

            offer.Status = OfferStatus.Accepted;
            offer.AcceptedDate = DateTime.UtcNow;
            offer.UpdatedAt = DateTime.UtcNow;

            var candidate = await _db.Candidates
                .FirstOrDefaultAsync(c => c.Id == offer.CandidateId && c.TenantId == tenantId && !c.IsDeleted, cancellationToken);
            if (candidate != null)
            {
                candidate.Status = CandidateStatus.OfferAccepted;
                candidate.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(cancellationToken);
            return offer;
        }

        public async Task<OfferLetter> RejectOfferLetterAsync(
            Guid offerLetterId,
            string? rejectionReason,
            CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var offer = await _db.OfferLetters
                .FirstOrDefaultAsync(o => o.Id == offerLetterId && o.TenantId == tenantId && !o.IsDeleted, cancellationToken);
            if (offer == null)
                throw new KeyNotFoundException("Offer letter not found");

            offer.Status = OfferStatus.Rejected;
            offer.RejectedDate = DateTime.UtcNow;
            offer.RejectionReason = rejectionReason;
            offer.UpdatedAt = DateTime.UtcNow;

            var candidate = await _db.Candidates
                .FirstOrDefaultAsync(c => c.Id == offer.CandidateId && c.TenantId == tenantId && !c.IsDeleted, cancellationToken);
            if (candidate != null)
            {
                candidate.Status = CandidateStatus.Rejected;
                candidate.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(cancellationToken);
            return offer;
        }

        public async Task<Employee> ConvertCandidateToEmployeeAsync(
            Guid offerLetterId,
            CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var offer = await _db.OfferLetters
                .Include(o => o.Candidate)
                .Include(o => o.JobPosting)
                .FirstOrDefaultAsync(o => o.Id == offerLetterId && o.TenantId == tenantId && !o.IsDeleted, cancellationToken);
            if (offer == null)
                throw new KeyNotFoundException("Offer letter not found");

            if (offer.IsJoined && offer.EmployeeId.HasValue)
            {
                var existing = await _db.Employees.FirstOrDefaultAsync(e => e.Id == offer.EmployeeId.Value && e.TenantId == tenantId, cancellationToken);
                if (existing != null) return existing;
            }

            var candidate = offer.Candidate;
            if (candidate == null)
                throw new InvalidOperationException("Candidate information missing on offer letter");

            var company = await _db.Companies.FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted, cancellationToken);
            var employeeCode = _numbers != null
                ? await _numbers.NextAsync("Employee", "EMP-", 4, company?.Id, null, null, cancellationToken)
                : $"EMP-{Random.Shared.Next(10000, 99999)}";

            var employee = new Employee
            {
                TenantId = tenantId,
                CompanyId = company?.Id ?? Guid.Empty,
                EmployeeCode = employeeCode,
                FullName = $"{candidate.FirstName} {candidate.LastName}".Trim(),
                WorkEmail = !string.IsNullOrWhiteSpace(candidate.Email) ? candidate.Email : $"{candidate.FirstName.ToLower()}.{candidate.LastName.ToLower()}@uabindia.com",
                PersonalEmail = candidate.Email,
                Phone = candidate.PhoneNumber,
                DateOfJoining = offer.JoiningDate ?? DateTime.UtcNow,
                EmploymentType = "Permanent",
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            _db.Employees.Add(employee);

            offer.IsJoined = true;
            offer.EmployeeId = employee.Id;
            offer.UpdatedAt = DateTime.UtcNow;

            candidate.Status = CandidateStatus.Joined;
            candidate.UpdatedAt = DateTime.UtcNow;

            // Increment Staffing Plan HiredCount if linked
            if (offer.JobPosting?.StaffingPlanId.HasValue == true)
            {
                var plan = await _db.StaffingPlans.FirstOrDefaultAsync(
                    p => p.Id == offer.JobPosting.StaffingPlanId.Value && p.TenantId == tenantId && !p.IsDeleted,
                    cancellationToken);
                if (plan != null)
                {
                    plan.HiredCount++;
                    plan.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _db.SaveChangesAsync(cancellationToken);
            return employee;
        }

        public async Task<AppointmentLetter> IssueAppointmentLetterAsync(
            IssueAppointmentLetterCommand command,
            CancellationToken cancellationToken = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var employee = await _db.Employees
                .FirstOrDefaultAsync(e => e.Id == command.EmployeeId && e.TenantId == tenantId && !e.IsDeleted, cancellationToken);
            if (employee == null)
                throw new KeyNotFoundException("Employee not found");

            var letterNumber = _numbers != null
                ? await _numbers.NextAsync("AppointmentLetter", "AL-", 5)
                : $"AL-{DateTime.UtcNow.Year}-{Random.Shared.Next(1000, 9999)}";
            var appointmentLetter = new AppointmentLetter
            {
                TenantId = tenantId,
                LetterNumber = letterNumber,
                EmployeeId = command.EmployeeId,
                IssueDate = DateTime.UtcNow,
                JoiningDate = command.JoiningDate,
                Designation = command.Designation,
                Department = command.Department,
                WorkLocation = command.WorkLocation ?? "Corporate Headquarters",
                AnnualCtc = command.AnnualCtc,
                MonthlyGross = command.MonthlyGross > 0 ? command.MonthlyGross : Math.Round(command.AnnualCtc / 12m, 2),
                ProbationMonths = command.ProbationMonths > 0 ? command.ProbationMonths : 6,
                NoticePeriodDays = command.NoticePeriodDays > 0 ? command.NoticePeriodDays : 30,
                TermsAndConditions = command.TermsAndConditions ?? "Standard terms of employment as per enterprise service guidelines.",
                SignatoryName = command.SignatoryName ?? "Human Resources Director",
                SignatoryDesignation = command.SignatoryDesignation ?? "Head of People & Operations",
                Status = "Issued",
                CreatedAt = DateTime.UtcNow
            };

            _db.AppointmentLetters.Add(appointmentLetter);
            await _db.SaveChangesAsync(cancellationToken);
            return appointmentLetter;
        }

        private async Task<JobPosting> LoadTrackedPostingAsync(Guid id, CancellationToken cancellationToken)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var posting = await _db.JobPostings.FirstOrDefaultAsync(
                p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted, cancellationToken);
            if (posting == null)
                throw new KeyNotFoundException("Job posting not found");
            return posting;
        }
    }
}
