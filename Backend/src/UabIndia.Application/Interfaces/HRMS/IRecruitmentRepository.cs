using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    /// <summary>
    /// Repository interface for Recruitment operations.
    /// </summary>
    public interface IRecruitmentRepository
    {
        #region JobPosting Operations

        Task<JobPosting?> GetJobPostingByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<JobPosting>> GetAllJobPostingsAsync(Guid tenantId, int skip = 0, int take = 20);
        Task<IEnumerable<JobPosting>> GetActiveJobPostingsAsync(Guid tenantId, int skip = 0, int take = 20);
        Task<IEnumerable<JobPosting>> GetJobPostingsByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20);
        Task<IEnumerable<JobPosting>> GetJobPostingsByDepartmentAsync(Guid tenantId, string department, int skip = 0, int take = 20);
        Task<JobPosting> CreateJobPostingAsync(JobPosting jobPosting);
        Task UpdateJobPostingAsync(JobPosting jobPosting);
        Task DeleteJobPostingAsync(Guid id, Guid tenantId);

        #endregion

        #region Candidate Operations

        Task<Candidate?> GetCandidateByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<Candidate>> GetCandidatesByJobPostingAsync(Guid jobPostingId, Guid tenantId, int skip = 0, int take = 50);
        Task<IEnumerable<Candidate>> GetCandidatesByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20);
        Task<Candidate?> GetCandidateByEmailAsync(string email, Guid tenantId);
        Task<int> GetApplicationCountByJobPostingAsync(Guid jobPostingId, Guid tenantId);
        Task<Candidate> CreateCandidateAsync(Candidate candidate);
        Task UpdateCandidateAsync(Candidate candidate);
        Task DeleteCandidateAsync(Guid id, Guid tenantId);

        #endregion

        #region Screening Operations

        Task<CandidateScreening?> GetScreeningByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<CandidateScreening>> GetScreeningsByCandidateAsync(Guid candidateId, Guid tenantId);
        Task<IEnumerable<CandidateScreening>> GetScreeningsByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20);
        Task<CandidateScreening> CreateScreeningAsync(CandidateScreening screening);
        Task UpdateScreeningAsync(CandidateScreening screening);
        Task DeleteScreeningAsync(Guid id, Guid tenantId);

        #endregion

        #region JobApplication Operations

        Task<JobApplication?> GetApplicationByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<JobApplication>> GetApplicationsByCandidateAsync(Guid candidateId, Guid tenantId);
        Task<IEnumerable<JobApplication>> GetApplicationsByJobPostingAsync(Guid jobPostingId, Guid tenantId, int skip = 0, int take = 50);
        Task<IEnumerable<JobApplication>> GetApplicationsByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20);
        Task<JobApplication?> GetApplicationByCandidateAndJobAsync(Guid candidateId, Guid jobPostingId, Guid tenantId);
        Task<JobApplication> CreateApplicationAsync(JobApplication application);
        Task UpdateApplicationAsync(JobApplication application);
        Task DeleteApplicationAsync(Guid id, Guid tenantId);

        #endregion

        #region OfferLetter Operations

        Task<OfferLetter?> GetOfferLetterByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<OfferLetter>> GetOfferLettersByJobPostingAsync(Guid jobPostingId, Guid tenantId, int skip = 0, int take = 20);
        Task<IEnumerable<OfferLetter>> GetOfferLettersByStatusAsync(Guid tenantId, string status, int skip = 0, int take = 20);
        Task<IEnumerable<OfferLetter>> GetOfferLettersByCandidateAsync(Guid candidateId, Guid tenantId);
        Task<IEnumerable<OfferLetter>> GetPendingOfferLettersAsync(Guid tenantId, int skip = 0, int take = 20);
        Task<OfferLetter?> GetOfferLetterByExpiryDateAsync(Guid candidateId, Guid tenantId);
        Task<OfferLetter> CreateOfferLetterAsync(OfferLetter offerLetter);
        Task UpdateOfferLetterAsync(OfferLetter offerLetter);
        Task DeleteOfferLetterAsync(Guid id, Guid tenantId);

        #endregion

        #region Statistics

        Task<int> GetTotalApplicationsCountAsync(Guid jobPostingId, Guid tenantId);
        Task<int> GetApprovedOffersCountAsync(Guid tenantId);
        Task<int> GetJoinedEmployeesCountAsync(Guid tenantId);
        Task<Dictionary<string, int>> GetApplicationStatusDistributionAsync(Guid jobPostingId, Guid tenantId);

        #endregion
    }
}
