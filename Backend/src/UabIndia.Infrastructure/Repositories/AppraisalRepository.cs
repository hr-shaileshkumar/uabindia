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
    /// Repository implementation for Performance Appraisal operations.
    /// </summary>
    public class AppraisalRepository : IAppraisalRepository
    {
        private readonly ApplicationDbContext _db;

        public AppraisalRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        #region AppraisalCycle Operations

        public async Task<AppraisalCycle?> GetAppraisalCycleByIdAsync(Guid id, Guid tenantId)
        {
            return await _db.AppraisalCycles
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);
        }

        public async Task<IEnumerable<AppraisalCycle>> GetAppraisalCyclesAsync(Guid tenantId, int skip = 0, int take = 50)
        {
            return await _db.AppraisalCycles
                .Where(c => c.TenantId == tenantId && !c.IsDeleted)
                .OrderByDescending(c => c.StartDate)
                .Skip(skip)
                .Take(take)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<AppraisalCycle> CreateAppraisalCycleAsync(AppraisalCycle cycle)
        {
            _db.AppraisalCycles.Add(cycle);
            await _db.SaveChangesAsync();
            return cycle;
        }

        public async Task UpdateAppraisalCycleAsync(AppraisalCycle cycle)
        {
            cycle.UpdatedAt = DateTime.UtcNow;
            _db.AppraisalCycles.Update(cycle);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAppraisalCycleAsync(Guid id, Guid tenantId)
        {
            var cycle = await GetAppraisalCycleByIdAsync(id, tenantId);
            if (cycle != null)
            {
                cycle.IsDeleted = true;
                cycle.UpdatedAt = DateTime.UtcNow;
                _db.AppraisalCycles.Update(cycle);
                await _db.SaveChangesAsync();
            }
        }

        public async Task<AppraisalCycle?> GetActiveAppraisalCycleAsync(Guid tenantId)
        {
            return await _db.AppraisalCycles
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.IsActive && !c.IsDeleted);
        }

        #endregion

        #region PerformanceAppraisal Operations

        public async Task<PerformanceAppraisal?> GetAppraisalByIdAsync(Guid id, Guid tenantId)
        {
            return await _db.PerformanceAppraisals
                .Include(p => p.Ratings)
                .ThenInclude(r => r.Competency)
                .Include(p => p.Employee)
                .Include(p => p.Manager)
                .Include(p => p.AppraisalCycle)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);
        }

        public async Task<IEnumerable<PerformanceAppraisal>> GetAppraisalsByEmployeeAsync(Guid employeeId, Guid tenantId, int skip = 0, int take = 20)
        {
            return await _db.PerformanceAppraisals
                .Where(p => p.EmployeeId == employeeId && p.TenantId == tenantId && !p.IsDeleted)
                .OrderByDescending(p => p.CreatedAt)
                .Skip(skip)
                .Take(take)
                .Include(p => p.AppraisalCycle)
                .Include(p => p.Manager)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<PerformanceAppraisal>> GetAppraisalsByManagerAsync(Guid managerId, Guid tenantId, int skip = 0, int take = 20)
        {
            return await _db.PerformanceAppraisals
                .Where(p => p.ManagerId == managerId && p.TenantId == tenantId && !p.IsDeleted)
                .OrderByDescending(p => p.CreatedAt)
                .Skip(skip)
                .Take(take)
                .Include(p => p.Employee)
                .Include(p => p.AppraisalCycle)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<PerformanceAppraisal>> GetAppraisalsByCycleAsync(Guid cycleId, Guid tenantId, int skip = 0, int take = 50)
        {
            return await _db.PerformanceAppraisals
                .Where(p => p.AppraisalCycleId == cycleId && p.TenantId == tenantId && !p.IsDeleted)
                .OrderBy(p => p.Status)
                .ThenBy(p => p.CreatedAt)
                .Skip(skip)
                .Take(take)
                .Include(p => p.Employee)
                .Include(p => p.Manager)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<PerformanceAppraisal> CreateAppraisalAsync(PerformanceAppraisal appraisal)
        {
            _db.PerformanceAppraisals.Add(appraisal);
            await _db.SaveChangesAsync();
            return appraisal;
        }

        public async Task UpdateAppraisalAsync(PerformanceAppraisal appraisal)
        {
            appraisal.UpdatedAt = DateTime.UtcNow;
            _db.PerformanceAppraisals.Update(appraisal);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAppraisalAsync(Guid id, Guid tenantId)
        {
            var appraisal = await GetAppraisalByIdAsync(id, tenantId);
            if (appraisal != null)
            {
                appraisal.IsDeleted = true;
                appraisal.UpdatedAt = DateTime.UtcNow;
                _db.PerformanceAppraisals.Update(appraisal);
                await _db.SaveChangesAsync();
            }
        }

        public async Task<bool> AppraisalExistsAsync(Guid employeeId, Guid cycleId, Guid tenantId)
        {
            return await _db.PerformanceAppraisals
                .AnyAsync(p => p.EmployeeId == employeeId && p.AppraisalCycleId == cycleId 
                    && p.TenantId == tenantId && !p.IsDeleted);
        }

        #endregion

        #region AppraisalCompetency Operations

        public async Task<AppraisalCompetency?> GetCompetencyByIdAsync(Guid id, Guid tenantId)
        {
            return await _db.AppraisalCompetencies
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);
        }

        public async Task<IEnumerable<AppraisalCompetency>> GetAllCompetenciesAsync(Guid tenantId, int skip = 0, int take = 100)
        {
            return await _db.AppraisalCompetencies
                .Where(c => c.TenantId == tenantId && c.IsActive && !c.IsDeleted)
                .OrderBy(c => c.SortOrder)
                .Skip(skip)
                .Take(take)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<AppraisalCompetency> CreateCompetencyAsync(AppraisalCompetency competency)
        {
            _db.AppraisalCompetencies.Add(competency);
            await _db.SaveChangesAsync();
            return competency;
        }

        public async Task UpdateCompetencyAsync(AppraisalCompetency competency)
        {
            competency.UpdatedAt = DateTime.UtcNow;
            _db.AppraisalCompetencies.Update(competency);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteCompetencyAsync(Guid id, Guid tenantId)
        {
            var competency = await GetCompetencyByIdAsync(id, tenantId);
            if (competency != null)
            {
                competency.IsDeleted = true;
                competency.UpdatedAt = DateTime.UtcNow;
                _db.AppraisalCompetencies.Update(competency);
                await _db.SaveChangesAsync();
            }
        }

        #endregion

        #region AppraisalRating Operations

        public async Task<IEnumerable<AppraisalRating>> GetRatingsByAppraisalAsync(Guid appraisalId)
        {
            return await _db.AppraisalRatings
                .Where(r => r.AppraisalId == appraisalId && !r.IsDeleted)
                .Include(r => r.Competency)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<AppraisalRating?> GetRatingByIdAsync(Guid id)
        {
            return await _db.AppraisalRatings
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);
        }

        public async Task CreateRatingAsync(AppraisalRating rating)
        {
            _db.AppraisalRatings.Add(rating);
            await _db.SaveChangesAsync();
        }

        public async Task UpdateRatingAsync(AppraisalRating rating)
        {
            rating.UpdatedAt = DateTime.UtcNow;
            _db.AppraisalRatings.Update(rating);
            await _db.SaveChangesAsync();
        }

        #endregion
    }
}
