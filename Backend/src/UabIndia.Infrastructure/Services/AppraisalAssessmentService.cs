using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class AppraisalAssessmentService : IAppraisalAssessmentService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public AppraisalAssessmentService(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public async Task<PerformanceAppraisal> SubmitSelfAssessmentAsync(
            Guid appraisalId,
            Guid actorUserId,
            decimal selfAssessmentScore,
            string? comments,
            IReadOnlyList<AppraisalRatingCommand> ratings,
            CancellationToken cancellationToken = default)
        {
            var appraisal = await LoadTrackedAsync(appraisalId, cancellationToken);
            if (appraisal.EmployeeId != actorUserId)
                throw new UnauthorizedAccessException("You can only assess your own appraisal");
            EnsureNotFinalized(appraisal);

            var cycle = await LoadCycleAsync(appraisal.AppraisalCycleId, cancellationToken);
            if (cycle != null && DateTime.UtcNow > cycle.SelfAssessmentDeadline)
                throw new InvalidOperationException("Self-assessment deadline has passed");

            appraisal.SelfAssessmentScore = selfAssessmentScore;
            appraisal.SelfAssessmentComments = comments;
            appraisal.SelfAssessmentSubmittedAt = DateTime.UtcNow;
            appraisal.Status = AppraisalStatus.SelfSubmitted;
            appraisal.UpdatedAt = DateTime.UtcNow;

            var existingRatings = await _db.AppraisalRatings
                .Where(r => r.AppraisalId == appraisal.Id)
                .ToListAsync(cancellationToken);
            if (existingRatings.Count > 0)
                _db.AppraisalRatings.RemoveRange(existingRatings);

            foreach (var rating in ratings)
            {
                _db.AppraisalRatings.Add(new AppraisalRating
                {
                    TenantId = appraisal.TenantId,
                    AppraisalId = appraisal.Id,
                    CompetencyId = rating.CompetencyId,
                    SelfScore = rating.SelfScore,
                    Comments = rating.Comments
                });
            }

            await _db.SaveChangesAsync(cancellationToken);
            await _db.Entry(appraisal).Collection(a => a.Ratings).LoadAsync(cancellationToken);
            return appraisal;
        }

        public async Task<PerformanceAppraisal> SubmitManagerAssessmentAsync(
            Guid appraisalId,
            Guid actorUserId,
            decimal managerAssessmentScore,
            string? comments,
            IReadOnlyList<AppraisalRatingCommand> ratings,
            CancellationToken cancellationToken = default)
        {
            var appraisal = await LoadTrackedAsync(appraisalId, cancellationToken);
            if (appraisal.ManagerId != actorUserId)
                throw new UnauthorizedAccessException("You can only assess appraisals for your direct reports");
            EnsureNotFinalized(appraisal);

            var cycle = await LoadCycleAsync(appraisal.AppraisalCycleId, cancellationToken);
            if (cycle != null && DateTime.UtcNow > cycle.ManagerAssessmentDeadline)
                throw new InvalidOperationException("Manager assessment deadline has passed");

            appraisal.ManagerAssessmentScore = managerAssessmentScore;
            appraisal.ManagerAssessmentComments = comments;
            appraisal.ManagerAssessmentSubmittedAt = DateTime.UtcNow;
            appraisal.Status = AppraisalStatus.ManagerSubmitted;
            appraisal.UpdatedAt = DateTime.UtcNow;

            foreach (var ratingDto in ratings)
            {
                var rating = appraisal.Ratings.FirstOrDefault(r => r.CompetencyId == ratingDto.CompetencyId);
                if (rating == null)
                {
                    rating = new AppraisalRating
                    {
                        TenantId = appraisal.TenantId,
                        AppraisalId = appraisal.Id,
                        CompetencyId = ratingDto.CompetencyId
                    };
                    appraisal.Ratings.Add(rating);
                }

                if (ratingDto.ManagerScore.HasValue)
                    rating.ManagerScore = ratingDto.ManagerScore;
                if (ratingDto.Comments != null)
                    rating.Comments = ratingDto.Comments;
            }

            await ApplyWeightedOverallRatingAsync(appraisal, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            return appraisal;
        }

        public async Task<PerformanceAppraisal> ApproveAsync(
            Guid appraisalId,
            Guid approvedBy,
            CancellationToken cancellationToken = default)
        {
            var appraisal = await LoadTrackedAsync(appraisalId, cancellationToken);
            appraisal.Status = AppraisalStatus.Approved;
            appraisal.IsFinalized = true;
            appraisal.FinalizedAt = DateTime.UtcNow;
            appraisal.ApprovedBy = approvedBy == Guid.Empty ? null : approvedBy;
            appraisal.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return appraisal;
        }

        public async Task<PerformanceAppraisal> RejectAsync(
            Guid appraisalId,
            string? comments,
            CancellationToken cancellationToken = default)
        {
            var appraisal = await LoadTrackedAsync(appraisalId, cancellationToken);
            appraisal.Status = AppraisalStatus.Rejected;
            appraisal.IsFinalized = false;
            if (!string.IsNullOrEmpty(comments))
                appraisal.ManagerAssessmentComments = comments;
            appraisal.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return appraisal;
        }

        private async Task<PerformanceAppraisal> LoadTrackedAsync(Guid id, CancellationToken cancellationToken)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var appraisal = await _db.PerformanceAppraisals
                .Include(a => a.Ratings)
                .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId && !a.IsDeleted, cancellationToken);
            if (appraisal == null)
                throw new KeyNotFoundException("Appraisal not found");
            return appraisal;
        }

        private async Task<AppraisalCycle?> LoadCycleAsync(Guid cycleId, CancellationToken cancellationToken)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            return await _db.AppraisalCycles.AsNoTracking().FirstOrDefaultAsync(
                c => c.Id == cycleId && c.TenantId == tenantId && !c.IsDeleted, cancellationToken);
        }

        private static void EnsureNotFinalized(PerformanceAppraisal appraisal)
        {
            if (appraisal.IsFinalized)
                throw new InvalidOperationException("Finalized appraisals cannot be assessed");
        }

        private async Task ApplyWeightedOverallRatingAsync(PerformanceAppraisal appraisal, CancellationToken cancellationToken)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var competencyIds = appraisal.Ratings.Select(r => r.CompetencyId).Distinct().ToList();
            var weights = await _db.AppraisalCompetencies
                .Where(c => competencyIds.Contains(c.Id) && c.TenantId == tenantId && !c.IsDeleted)
                .ToDictionaryAsync(c => c.Id, c => c.Weight, cancellationToken);

            decimal overall = 0;
            decimal totalWeight = 0;
            foreach (var rating in appraisal.Ratings)
            {
                if (!rating.ManagerScore.HasValue)
                    continue;

                var weight = weights.TryGetValue(rating.CompetencyId, out var competencyWeight) ? competencyWeight : 1m;
                overall += rating.ManagerScore.Value * weight;
                totalWeight += weight;
            }

            if (totalWeight > 0)
                appraisal.OverallRating = overall / totalWeight;
        }
    }
}
