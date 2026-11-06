using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation for Recruitment operations.
    /// </summary>
    public class RecruitmentRepository : IRecruitmentRepository
    {
        private readonly ApplicationDbContext _context;

        public RecruitmentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        #region JobPosting Operations

        public async Task<JobPosting?> GetJobPostingByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.JobPostings
                .AsNoTracking()
                .FirstOrDefaultAsync(jp => jp.Id == id && jp.TenantId == tenantId && !jp.IsDeleted);
        }

        public async Task<IEnumerable<JobPosting>> GetAllJobPostingsAsync(Guid tenantId, int skip = 0, int take = 20)
        {
            return await _context.JobPostings
                .Where(jp => jp.TenantId == tenantId && !jp.IsDeleted)
                .OrderByDescending(jp => jp.PostedDate)
                .Skip(skip)
                .Take(take)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<JobPosting>> GetActiveJobPostingsAsync(Guid tenantId, int skip = 0, int take = 20)
        {
            return await _context.JobPostings
                .Where(jp => jp.TenantId == tenantId && jp.IsActive && !jp.IsDeleted)
                .OrderByDescending(jp => jp.PostedDate)
                .Skip(skip)
                .Take(take)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<JobPosting>> GetJobPostingsByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20)
        {
            if (!Enum.TryParse<JobStatus>(status, ignoreCase: true, out var jobStatus))
                return new List<JobPosting>();

            return await _context.JobPostings
                .Where(jp => jp.TenantId == tenantId && jp.Status == jobStatus && !jp.IsDeleted)
                .OrderByDescending(jp => jp.PostedDate)
                .Skip(skip)
                .Take(take)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<JobPosting>> GetJobPostingsByDepartmentAsync(Guid tenantId, string department, int skip = 0, int take = 20)
        {
            return await _context.JobPostings
                .Where(jp => jp.TenantId == tenantId && jp.Department == department && !jp.IsDeleted)
                .OrderByDescending(jp => jp.PostedDate)
                .Skip(skip)
                .Take(take)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<JobPosting> CreateJobPostingAsync(JobPosting jobPosting)
        {
            jobPosting.PostedDate = DateTime.UtcNow;
            _context.JobPostings.Add(jobPosting);
            await _context.SaveChangesAsync();
            return jobPosting;
        }

        public async Task UpdateJobPostingAsync(JobPosting jobPosting)
        {
            jobPosting.UpdatedAt = DateTime.UtcNow;
            _context.JobPostings.Update(jobPosting);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteJobPostingAsync(Guid id, Guid tenantId)
        {
            var jobPosting = await _context.JobPostings
                .FirstOrDefaultAsync(jp => jp.Id == id && jp.TenantId == tenantId);

            if (jobPosting != null)
            {
                jobPosting.IsDeleted = true;
                jobPosting.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region Candidate Operations

        public async Task<Candidate?> GetCandidateByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.Candidates
                .AsNoTracking()
                .Include(c => c.JobPosting)
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);
        }

        public async Task<IEnumerable<Candidate>> GetCandidatesByJobPostingAsync(Guid jobPostingId, Guid tenantId, int skip = 0, int take = 50)
        {
            return await _context.Candidates
                .Where(c => c.JobPostingId == jobPostingId && c.TenantId == tenantId && !c.IsDeleted)
                .OrderByDescending(c => c.AppliedDate)
                .Skip(skip)
                .Take(take)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<Candidate>> GetCandidatesByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20)
        {
            if (!Enum.TryParse<CandidateStatus>(status, ignoreCase: true, out var candidateStatus))
                return new List<Candidate>();

            return await _context.Candidates
                .Where(c => c.TenantId == tenantId && c.Status == candidateStatus && !c.IsDeleted)
                .OrderByDescending(c => c.AppliedDate)
                .Skip(skip)
                .Take(take)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Candidate?> GetCandidateByEmailAsync(string email, Guid tenantId)
        {
            return await _context.Candidates
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Email == email && c.TenantId == tenantId && !c.IsDeleted);
        }

        public async Task<int> GetApplicationCountByJobPostingAsync(Guid jobPostingId, Guid tenantId)
        {
            return await _context.Candidates
                .Where(c => c.JobPostingId == jobPostingId && c.TenantId == tenantId && !c.IsDeleted)
                .CountAsync();
        }

        public async Task<Candidate> CreateCandidateAsync(Candidate candidate)
        {
            candidate.AppliedDate = DateTime.UtcNow;
            _context.Candidates.Add(candidate);
            await _context.SaveChangesAsync();
            return candidate;
        }

        public async Task UpdateCandidateAsync(Candidate candidate)
        {
            candidate.UpdatedAt = DateTime.UtcNow;
            _context.Candidates.Update(candidate);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteCandidateAsync(Guid id, Guid tenantId)
        {
            var candidate = await _context.Candidates
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

            if (candidate != null)
            {
                candidate.IsDeleted = true;
                candidate.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region Screening Operations

        public async Task<CandidateScreening?> GetScreeningByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.CandidateScreenings
                .AsNoTracking()
                .Include(cs => cs.Candidate)
                .FirstOrDefaultAsync(cs => cs.Id == id && cs.TenantId == tenantId && !cs.IsDeleted);
        }

        public async Task<IEnumerable<CandidateScreening>> GetScreeningsByCandidateAsync(Guid candidateId, Guid tenantId)
        {
            return await _context.CandidateScreenings
                .Where(cs => cs.CandidateId == candidateId && cs.TenantId == tenantId && !cs.IsDeleted)
                .OrderByDescending(cs => cs.ScheduledDate)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<CandidateScreening>> GetScreeningsByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20)
        {
            if (!Enum.TryParse<ScreeningStatus>(status, ignoreCase: true, out var screeningStatus))
                return new List<CandidateScreening>();

            return await _context.CandidateScreenings
                .Where(cs => cs.TenantId == tenantId && cs.Status == screeningStatus && !cs.IsDeleted)
                .OrderByDescending(cs => cs.ScheduledDate)
                .Skip(skip)
                .Take(take)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<CandidateScreening> CreateScreeningAsync(CandidateScreening screening)
        {
            _context.CandidateScreenings.Add(screening);
            await _context.SaveChangesAsync();
            return screening;
        }

        public async Task UpdateScreeningAsync(CandidateScreening screening)
        {
            screening.UpdatedAt = DateTime.UtcNow;
            _context.CandidateScreenings.Update(screening);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteScreeningAsync(Guid id, Guid tenantId)
        {
            var screening = await _context.CandidateScreenings
                .FirstOrDefaultAsync(cs => cs.Id == id && cs.TenantId == tenantId);

            if (screening != null)
            {
                screening.IsDeleted = true;
                screening.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region JobApplication Operations

        public async Task<JobApplication?> GetApplicationByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.JobApplications
                .AsNoTracking()
                .Include(ja => ja.Candidate)
                .Include(ja => ja.JobPosting)
                .FirstOrDefaultAsync(ja => ja.Id == id && ja.TenantId == tenantId && !ja.IsDeleted);
        }

        public async Task<IEnumerable<JobApplication>> GetApplicationsByCandidateAsync(Guid candidateId, Guid tenantId)
        {
            return await _context.JobApplications
                .Where(ja => ja.CandidateId == candidateId && ja.TenantId == tenantId && !ja.IsDeleted)
                .OrderByDescending(ja => ja.ApplicationDate)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<JobApplication>> GetApplicationsByJobPostingAsync(Guid jobPostingId, Guid tenantId, int skip = 0, int take = 50)
        {
            return await _context.JobApplications
                .Where(ja => ja.JobPostingId == jobPostingId && ja.TenantId == tenantId && !ja.IsDeleted)
                .OrderByDescending(ja => ja.ApplicationDate)
                .Skip(skip)
                .Take(take)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<JobApplication>> GetApplicationsByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20)
        {
            if (!Enum.TryParse<ApplicationStatus>(status, ignoreCase: true, out var appStatus))
                return new List<JobApplication>();

            return await _context.JobApplications
                .Where(ja => ja.TenantId == tenantId && ja.Status == appStatus && !ja.IsDeleted)
                .OrderByDescending(ja => ja.ApplicationDate)
                .Skip(skip)
                .Take(take)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<JobApplication?> GetApplicationByCandidateAndJobAsync(Guid candidateId, Guid jobPostingId, Guid tenantId)
        {
            return await _context.JobApplications
                .AsNoTracking()
                .FirstOrDefaultAsync(ja => ja.CandidateId == candidateId && ja.JobPostingId == jobPostingId && ja.TenantId == tenantId && !ja.IsDeleted);
        }

        public async Task<JobApplication> CreateApplicationAsync(JobApplication application)
        {
            application.ApplicationDate = DateTime.UtcNow;
            _context.JobApplications.Add(application);
            await _context.SaveChangesAsync();
            return application;
        }

        public async Task UpdateApplicationAsync(JobApplication application)
        {
            application.UpdatedAt = DateTime.UtcNow;
            _context.JobApplications.Update(application);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteApplicationAsync(Guid id, Guid tenantId)
        {
            var application = await _context.JobApplications
                .FirstOrDefaultAsync(ja => ja.Id == id && ja.TenantId == tenantId);

            if (application != null)
            {
                application.IsDeleted = true;
                application.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region OfferLetter Operations

        public async Task<OfferLetter?> GetOfferLetterByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.OfferLetters
                .AsNoTracking()
                .Include(ol => ol.Candidate)
                .Include(ol => ol.JobPosting)
                .FirstOrDefaultAsync(ol => ol.Id == id && ol.TenantId == tenantId && !ol.IsDeleted);
        }

        public async Task<IEnumerable<OfferLetter>> GetOfferLettersByJobPostingAsync(Guid jobPostingId, Guid tenantId, int skip = 0, int take = 20)
        {
            return await _context.OfferLetters
                .Where(ol => ol.JobPostingId == jobPostingId && ol.TenantId == tenantId && !ol.IsDeleted)
                .OrderByDescending(ol => ol.OfferDate)
                .Skip(skip)
                .Take(take)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<OfferLetter>> GetOfferLettersByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20)
        {
            if (!Enum.TryParse<OfferStatus>(status, ignoreCase: true, out var offerStatus))
                return new List<OfferLetter>();

            return await _context.OfferLetters
                .Where(ol => ol.TenantId == tenantId && ol.Status == offerStatus && !ol.IsDeleted)
                .OrderByDescending(ol => ol.OfferDate)
                .Skip(skip)
                .Take(take)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<OfferLetter>> GetOfferLettersByCandidateAsync(Guid candidateId, Guid tenantId)
        {
            return await _context.OfferLetters
                .Where(ol => ol.CandidateId == candidateId && ol.TenantId == tenantId && !ol.IsDeleted)
                .OrderByDescending(ol => ol.OfferDate)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<OfferLetter>> GetPendingOfferLettersAsync(Guid tenantId, int skip = 0, int take = 20)
        {
            return await _context.OfferLetters
                .Where(ol => ol.TenantId == tenantId && ol.Status == OfferStatus.Pending && ol.ExpiryDate > DateTime.UtcNow && !ol.IsDeleted)
                .OrderByDescending(ol => ol.ExpiryDate)
                .Skip(skip)
                .Take(take)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<OfferLetter?> GetOfferLetterByExpiryDateAsync(Guid candidateId, Guid tenantId)
        {
            return await _context.OfferLetters
                .AsNoTracking()
                .Where(ol => ol.CandidateId == candidateId && ol.TenantId == tenantId && ol.ExpiryDate <= DateTime.UtcNow && !ol.IsDeleted)
                .FirstOrDefaultAsync();
        }

        public async Task<OfferLetter> CreateOfferLetterAsync(OfferLetter offerLetter)
        {
            offerLetter.OfferDate = DateTime.UtcNow;
            _context.OfferLetters.Add(offerLetter);
            await _context.SaveChangesAsync();
            return offerLetter;
        }

        public async Task UpdateOfferLetterAsync(OfferLetter offerLetter)
        {
            offerLetter.UpdatedAt = DateTime.UtcNow;
            _context.OfferLetters.Update(offerLetter);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteOfferLetterAsync(Guid id, Guid tenantId)
        {
            var offerLetter = await _context.OfferLetters
                .FirstOrDefaultAsync(ol => ol.Id == id && ol.TenantId == tenantId);

            if (offerLetter != null)
            {
                offerLetter.IsDeleted = true;
                offerLetter.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region Statistics

        public async Task<int> GetTotalApplicationsCountAsync(Guid jobPostingId, Guid tenantId)
        {
            return await _context.JobApplications
                .Where(ja => ja.JobPostingId == jobPostingId && ja.TenantId == tenantId && !ja.IsDeleted)
                .CountAsync();
        }

        public async Task<int> GetApprovedOffersCountAsync(Guid tenantId)
        {
            return await _context.OfferLetters
                .Where(ol => ol.TenantId == tenantId && (ol.Status == OfferStatus.Accepted || ol.Status == OfferStatus.Completed) && !ol.IsDeleted)
                .CountAsync();
        }

        public async Task<int> GetJoinedEmployeesCountAsync(Guid tenantId)
        {
            return await _context.OfferLetters
                .Where(ol => ol.TenantId == tenantId && ol.IsJoined && !ol.IsDeleted)
                .CountAsync();
        }

        public async Task<Dictionary<string, int>> GetApplicationStatusDistributionAsync(Guid jobPostingId, Guid tenantId)
        {
            var distribution = await _context.JobApplications
                .Where(ja => ja.JobPostingId == jobPostingId && ja.TenantId == tenantId && !ja.IsDeleted)
                .GroupBy(ja => ja.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            return distribution.ToDictionary(d => d.Status, d => d.Count);
        }

        #endregion
    }
}
