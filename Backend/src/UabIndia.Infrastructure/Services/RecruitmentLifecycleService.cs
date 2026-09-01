using System;
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

        public RecruitmentLifecycleService(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
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
            await _db.SaveChangesAsync(cancellationToken);
            return screening;
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
