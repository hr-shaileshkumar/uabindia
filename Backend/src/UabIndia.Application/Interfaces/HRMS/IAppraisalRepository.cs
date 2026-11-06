using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    /// <summary>
    /// Repository interface for Performance Appraisal operations.
    /// </summary>
    public interface IAppraisalRepository
    {
        // AppraisalCycle operations
        Task<AppraisalCycle?> GetAppraisalCycleByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<AppraisalCycle>> GetAppraisalCyclesAsync(Guid tenantId, int skip = 0, int take = 50);
        Task<AppraisalCycle> CreateAppraisalCycleAsync(AppraisalCycle cycle);
        Task UpdateAppraisalCycleAsync(AppraisalCycle cycle);
        Task DeleteAppraisalCycleAsync(Guid id, Guid tenantId);
        Task<AppraisalCycle?> GetActiveAppraisalCycleAsync(Guid tenantId);

        // PerformanceAppraisal operations
        Task<PerformanceAppraisal?> GetAppraisalByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<PerformanceAppraisal>> GetAppraisalsByEmployeeAsync(Guid employeeId, Guid tenantId, int skip = 0, int take = 20);
        Task<IEnumerable<PerformanceAppraisal>> GetAppraisalsByManagerAsync(Guid managerId, Guid tenantId, int skip = 0, int take = 20);
        Task<IEnumerable<PerformanceAppraisal>> GetAppraisalsByCycleAsync(Guid cycleId, Guid tenantId, int skip = 0, int take = 50);
        Task<PerformanceAppraisal> CreateAppraisalAsync(PerformanceAppraisal appraisal);
        Task UpdateAppraisalAsync(PerformanceAppraisal appraisal);
        Task DeleteAppraisalAsync(Guid id, Guid tenantId);
        Task<bool> AppraisalExistsAsync(Guid employeeId, Guid cycleId, Guid tenantId);

        // AppraisalCompetency operations
        Task<AppraisalCompetency?> GetCompetencyByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<AppraisalCompetency>> GetAllCompetenciesAsync(Guid tenantId, int skip = 0, int take = 100);
        Task<AppraisalCompetency> CreateCompetencyAsync(AppraisalCompetency competency);
        Task UpdateCompetencyAsync(AppraisalCompetency competency);
        Task DeleteCompetencyAsync(Guid id, Guid tenantId);

        // AppraisalRating operations
        Task<IEnumerable<AppraisalRating>> GetRatingsByAppraisalAsync(Guid appraisalId);
        Task<AppraisalRating?> GetRatingByIdAsync(Guid id);
        Task CreateRatingAsync(AppraisalRating rating);
        Task UpdateRatingAsync(AppraisalRating rating);
    }
}
