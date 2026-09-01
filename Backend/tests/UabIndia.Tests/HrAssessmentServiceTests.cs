using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class HrAssessmentServiceTests
    {
        private static (ApplicationDbContext Db, TestTenantAccessor Tenant) CreateDb()
        {
            var tenant = new TestTenantAccessor();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return (new ApplicationDbContext(options, tenant, new TestEncryptionService()), tenant);
        }

        [Fact]
        public async Task SubmitSelfAssessment_ReplacesRatingsAndSetsSelfSubmitted()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var (appraisal, employeeId, _) = await SeedAppraisalAsync(db, tenant.GetTenantId());
            var competencyId = Guid.NewGuid();
            db.AppraisalRatings.Add(new AppraisalRating
            {
                TenantId = tenant.GetTenantId(),
                AppraisalId = appraisal.Id,
                CompetencyId = Guid.NewGuid(),
                SelfScore = 1,
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
            db.ChangeTracker.Clear();

            var service = new AppraisalAssessmentService(db, tenant);
            var result = await service.SubmitSelfAssessmentAsync(
                appraisal.Id,
                employeeId,
                4,
                "Strong year",
                new[] { new AppraisalRatingCommand(competencyId, 4, null, "Tech") });

            Assert.Equal(AppraisalStatus.SelfSubmitted, result.Status);
            Assert.Equal(4m, result.SelfAssessmentScore);
            Assert.Equal("Strong year", result.SelfAssessmentComments);
            Assert.Single(result.Ratings);
            Assert.Equal(competencyId, result.Ratings.First().CompetencyId);
            Assert.Equal(4m, result.Ratings.First().SelfScore);
        }

        [Fact]
        public async Task SubmitSelfAssessment_RejectsOtherEmployee()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var (appraisal, _, _) = await SeedAppraisalAsync(db, tenant.GetTenantId());
            var service = new AppraisalAssessmentService(db, tenant);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                service.SubmitSelfAssessmentAsync(
                    appraisal.Id,
                    Guid.NewGuid(),
                    3,
                    null,
                    Array.Empty<AppraisalRatingCommand>()));
        }

        [Fact]
        public async Task SubmitManagerAssessment_ComputesWeightedOverallRating()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            var (appraisal, _, managerId) = await SeedAppraisalAsync(db, tenantId);
            var leadership = new AppraisalCompetency
            {
                TenantId = tenantId,
                Name = "Leadership",
                Weight = 2,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            var technical = new AppraisalCompetency
            {
                TenantId = tenantId,
                Name = "Technical",
                Weight = 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.AppraisalCompetencies.AddRange(leadership, technical);
            db.AppraisalRatings.AddRange(
                new AppraisalRating
                {
                    TenantId = tenantId,
                    AppraisalId = appraisal.Id,
                    CompetencyId = leadership.Id,
                    SelfScore = 4,
                    CreatedAt = DateTime.UtcNow
                },
                new AppraisalRating
                {
                    TenantId = tenantId,
                    AppraisalId = appraisal.Id,
                    CompetencyId = technical.Id,
                    SelfScore = 3,
                    CreatedAt = DateTime.UtcNow
                });
            await db.SaveChangesAsync();
            db.ChangeTracker.Clear();

            var service = new AppraisalAssessmentService(db, tenant);
            var result = await service.SubmitManagerAssessmentAsync(
                appraisal.Id,
                managerId,
                4,
                "Ready for next role",
                new[]
                {
                    new AppraisalRatingCommand(leadership.Id, null, 4, null),
                    new AppraisalRatingCommand(technical.Id, null, 5, null)
                });

            Assert.Equal(AppraisalStatus.ManagerSubmitted, result.Status);
            Assert.Equal(13m / 3m, result.OverallRating);
            Assert.Equal(4m, result.Ratings.Single(r => r.CompetencyId == leadership.Id).ManagerScore);
            Assert.Equal(5m, result.Ratings.Single(r => r.CompetencyId == technical.Id).ManagerScore);
        }

        [Fact]
        public async Task ApproveAppraisal_FinalizesRecord()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var (appraisal, _, _) = await SeedAppraisalAsync(db, tenant.GetTenantId());
            var approver = Guid.NewGuid();
            var service = new AppraisalAssessmentService(db, tenant);

            var result = await service.ApproveAsync(appraisal.Id, approver);

            Assert.Equal(AppraisalStatus.Approved, result.Status);
            Assert.True(result.IsFinalized);
            Assert.Equal(approver, result.ApprovedBy);
            Assert.NotNull(result.FinalizedAt);
        }

        [Fact]
        public async Task RejectAppraisal_StoresComments()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var (appraisal, _, _) = await SeedAppraisalAsync(db, tenant.GetTenantId());
            var service = new AppraisalAssessmentService(db, tenant);

            var result = await service.RejectAsync(appraisal.Id, "Need more evidence");

            Assert.Equal(AppraisalStatus.Rejected, result.Status);
            Assert.False(result.IsFinalized);
            Assert.Equal("Need more evidence", result.ManagerAssessmentComments);
        }

        [Fact]
        public async Task DecideOvertimeApproval_UsesProvidedApproverAndApprovesRequest()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            var request = new OvertimeRequest
            {
                TenantId = tenantId,
                EmployeeId = Guid.NewGuid(),
                OvertimeDate = DateTime.UtcNow.Date,
                StartTime = TimeSpan.FromHours(18),
                EndTime = TimeSpan.FromHours(21),
                TotalHours = 3,
                NetOvertimeHours = 3,
                Reason = "Month close",
                Status = OvertimeRequestStatus.PendingApproval,
                CreatedAt = DateTime.UtcNow
            };
            db.OvertimeRequests.Add(request);
            await db.SaveChangesAsync();
            db.ChangeTracker.Clear();

            var approverId = Guid.NewGuid();
            var service = new OvertimeApprovalService(db, tenant);
            var approval = await service.DecideAsync(new CreateOvertimeApprovalCommand(
                request.Id,
                approverId,
                "Priya Sharma",
                "HR",
                ApprovalStatus.Approved,
                "OK",
                null,
                3,
                1500));

            Assert.Equal(approverId, approval.ApproverId);
            Assert.Equal("Priya Sharma", approval.ApproverName);
            Assert.Equal("HR", approval.ApproverRole);
            Assert.Equal(ApprovalStatus.Approved, approval.Status);
            Assert.NotNull(approval.ApprovedDate);

            var stored = await db.OvertimeRequests.SingleAsync();
            Assert.Equal(OvertimeRequestStatus.Approved, stored.Status);
        }

        [Fact]
        public async Task DecideOvertimeApproval_RejectsMissingRequest()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var service = new OvertimeApprovalService(db, tenant);

            await Assert.ThrowsAsync<KeyNotFoundException>(() => service.DecideAsync(new CreateOvertimeApprovalCommand(
                Guid.NewGuid(),
                Guid.NewGuid(),
                "Manager",
                "Manager",
                ApprovalStatus.Approved,
                null,
                null,
                null,
                null)));
        }

        private static async Task<(PerformanceAppraisal Appraisal, Guid EmployeeId, Guid ManagerId)> SeedAppraisalAsync(
            ApplicationDbContext db,
            Guid tenantId)
        {
            var employeeId = Guid.NewGuid();
            var managerId = Guid.NewGuid();
            var cycle = new AppraisalCycle
            {
                TenantId = tenantId,
                Name = "FY26",
                StartDate = DateTime.UtcNow.Date.AddMonths(-1),
                EndDate = DateTime.UtcNow.Date.AddMonths(1),
                SelfAssessmentDeadline = DateTime.UtcNow.AddDays(7),
                ManagerAssessmentDeadline = DateTime.UtcNow.AddDays(14),
                Status = AppraisalCycleStatus.Active,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.AppraisalCycles.Add(cycle);
            var appraisal = new PerformanceAppraisal
            {
                TenantId = tenantId,
                EmployeeId = employeeId,
                ManagerId = managerId,
                AppraisalCycleId = cycle.Id,
                Status = AppraisalStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            db.PerformanceAppraisals.Add(appraisal);
            await db.SaveChangesAsync();
            db.ChangeTracker.Clear();
            return (appraisal, employeeId, managerId);
        }
    }
}
