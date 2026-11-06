using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class OvertimeAndRecruitmentServiceTests
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
        public async Task CreateOvertimeRequest_ComputesHoursAndSetsPendingApproval()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var service = new OvertimeRequestService(db, tenant);

            var created = await service.CreateAsync(new CreateOvertimeRequestCommand(
                Guid.NewGuid(),
                DateTime.UtcNow.Date,
                TimeSpan.FromHours(18),
                TimeSpan.FromHours(21),
                30,
                "Month close",
                null,
                null,
                OvertimeType.Regular,
                null,
                false,
                CompensationType.Cash,
                1.5m,
                null));

            Assert.Equal(3m, created.TotalHours);
            Assert.Equal(2.5m, created.NetOvertimeHours);
            Assert.Equal(OvertimeRequestStatus.PendingApproval, created.Status);
        }

        [Fact]
        public async Task CreateOvertimeRequest_WrapsOvernightShift()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var service = new OvertimeRequestService(db, tenant);

            var created = await service.CreateAsync(new CreateOvertimeRequestCommand(
                Guid.NewGuid(),
                DateTime.UtcNow.Date,
                TimeSpan.FromHours(22),
                TimeSpan.FromHours(2),
                0,
                "Night cover",
                null,
                null,
                OvertimeType.Weekend,
                null,
                false,
                CompensationType.Cash,
                2m,
                null));

            Assert.Equal(4m, created.TotalHours);
            Assert.Equal(4m, created.NetOvertimeHours);
        }

        [Fact]
        public async Task CreateOvertimeRequest_PreApprovedBecomesApproved()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var service = new OvertimeRequestService(db, tenant);

            var created = await service.CreateAsync(new CreateOvertimeRequestCommand(
                Guid.NewGuid(),
                DateTime.UtcNow.Date,
                TimeSpan.FromHours(18),
                TimeSpan.FromHours(20),
                0,
                "Pre-approved OT",
                null,
                null,
                OvertimeType.Planned,
                null,
                true,
                CompensationType.Cash,
                1.5m,
                null));

            Assert.Equal(OvertimeRequestStatus.Approved, created.Status);
        }

        [Fact]
        public void OvertimeHoursMath_RejectsBreakLongerThanShift()
        {
            Assert.Throws<InvalidOperationException>(() =>
                OvertimeHoursMath.Calculate(TimeSpan.FromHours(18), TimeSpan.FromHours(19), 120));
        }

        [Fact]
        public async Task PublishAndCloseJobPosting_TogglesStatusAndActiveFlag()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var posting = await SeedPostingAsync(db, tenant.GetTenantId(), active: false, status: JobStatus.Draft);
            var service = new RecruitmentLifecycleService(db, tenant);

            var published = await service.PublishAsync(posting.Id);
            Assert.Equal(JobStatus.Open, published.Status);
            Assert.True(published.IsActive);

            db.ChangeTracker.Clear();
            var closed = await service.CloseAsync(posting.Id);
            Assert.Equal(JobStatus.Closed, closed.Status);
            Assert.False(closed.IsActive);
        }

        [Fact]
        public async Task ApplyForJob_CreatesCandidateAndIncrementsCount()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var posting = await SeedPostingAsync(db, tenant.GetTenantId(), active: true, status: JobStatus.Open);
            var service = new RecruitmentLifecycleService(db, tenant);

            var result = await service.ApplyAsync(new ApplyForJobCommand(
                posting.Id,
                "Asha",
                "Nair",
                "asha@example.com",
                "9999999999",
                "Acme",
                "Engineer",
                4,
                "Cover",
                "Referral"));

            Assert.Equal(CandidateStatus.Applied, result.Candidate.Status);
            Assert.Equal(1, result.JobPosting.ApplicationCount);
            Assert.Equal(1, await db.JobApplications.CountAsync());
        }

        [Fact]
        public async Task ApplyForJob_RejectsInactivePostingAndDuplicates()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var inactive = await SeedPostingAsync(db, tenant.GetTenantId(), active: false, status: JobStatus.Draft);
            var open = await SeedPostingAsync(db, tenant.GetTenantId(), active: true, status: JobStatus.Open);
            var service = new RecruitmentLifecycleService(db, tenant);

            await Assert.ThrowsAsync<InvalidOperationException>(() => service.ApplyAsync(new ApplyForJobCommand(
                inactive.Id, "A", "B", "dup@example.com", "1", null, null, 0, null, null)));

            await service.ApplyAsync(new ApplyForJobCommand(
                open.Id, "A", "B", "dup@example.com", "1", null, null, 0, null, null));
            db.ChangeTracker.Clear();

            var duplicate = await Assert.ThrowsAsync<InvalidOperationException>(() => service.ApplyAsync(new ApplyForJobCommand(
                open.Id, "A", "B", "dup@example.com", "1", null, null, 0, null, null)));
            Assert.Equal("You have already applied for this job", duplicate.Message);
        }

        [Fact]
        public async Task ScheduleScreening_SetsInterviewScheduled()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var posting = await SeedPostingAsync(db, tenant.GetTenantId(), active: true, status: JobStatus.Open);
            var candidate = new Candidate
            {
                TenantId = tenant.GetTenantId(),
                FirstName = "Ravi",
                LastName = "Shah",
                Email = "ravi@example.com",
                PhoneNumber = "8888888888",
                JobPostingId = posting.Id,
                Status = CandidateStatus.Applied,
                AppliedDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            db.Candidates.Add(candidate);
            await db.SaveChangesAsync();
            db.ChangeTracker.Clear();

            var service = new RecruitmentLifecycleService(db, tenant);
            var screening = await service.ScheduleScreeningAsync(
                candidate.Id,
                new ScheduleScreeningCommand("Technical", DateTime.UtcNow.AddDays(2), "Anika", Guid.NewGuid()));

            Assert.Equal(ScreeningStatus.Scheduled, screening.Status);
            var stored = await db.Candidates.SingleAsync();
            Assert.Equal(CandidateStatus.InterviewScheduled, stored.Status);
            Assert.Equal(screening.ScheduledDate, stored.InterviewDate);
        }

        [Fact]
        public async Task ScheduleScreening_RejectsPastDate()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var posting = await SeedPostingAsync(db, tenant.GetTenantId(), active: true, status: JobStatus.Open);
            var candidate = new Candidate
            {
                TenantId = tenant.GetTenantId(),
                FirstName = "Ravi",
                LastName = "Shah",
                Email = "ravi@example.com",
                PhoneNumber = "8888888888",
                JobPostingId = posting.Id,
                Status = CandidateStatus.Applied,
                AppliedDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            db.Candidates.Add(candidate);
            await db.SaveChangesAsync();

            var service = new RecruitmentLifecycleService(db, tenant);
            await Assert.ThrowsAsync<InvalidOperationException>(() => service.ScheduleScreeningAsync(
                candidate.Id,
                new ScheduleScreeningCommand("Phone", DateTime.UtcNow.AddMinutes(-5), null, null)));
        }

        [Fact]
        public async Task SubmitScreening_CompletesAndStoresRatings()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var posting = await SeedPostingAsync(db, tenant.GetTenantId(), active: true, status: JobStatus.Open);
            var candidate = new Candidate
            {
                TenantId = tenant.GetTenantId(),
                FirstName = "Ravi",
                LastName = "Shah",
                Email = "ravi@example.com",
                PhoneNumber = "8888888888",
                JobPostingId = posting.Id,
                Status = CandidateStatus.InterviewScheduled,
                AppliedDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            db.Candidates.Add(candidate);
            var screening = new CandidateScreening
            {
                TenantId = tenant.GetTenantId(),
                CandidateId = candidate.Id,
                ScreeningType = "Technical",
                ScheduledDate = DateTime.UtcNow.AddDays(1),
                Status = ScreeningStatus.Scheduled,
                CreatedAt = DateTime.UtcNow
            };
            db.CandidateScreenings.Add(screening);
            await db.SaveChangesAsync();
            db.ChangeTracker.Clear();

            var service = new RecruitmentLifecycleService(db, tenant);
            var submitted = await service.SubmitScreeningAsync(screening.Id, new SubmitScreeningCommand(
                ScreeningStatus.Completed,
                RatingLevel.Good,
                RatingLevel.Excellent,
                RatingLevel.Average,
                82,
                "Hire"));

            Assert.Equal(ScreeningStatus.Completed, submitted.Status);
            Assert.Equal(RatingLevel.Good, submitted.TechnicalSkillsRating);
            Assert.Equal(82m, submitted.OverallScore);
            Assert.Equal("Hire", submitted.Comments);
            Assert.NotNull(submitted.CompletedDate);
        }

        private static async Task<JobPosting> SeedPostingAsync(
            ApplicationDbContext db,
            Guid tenantId,
            bool active,
            JobStatus status)
        {
            var posting = new JobPosting
            {
                TenantId = tenantId,
                Title = "Engineer",
                Description = "Backend engineer for ERP platform work",
                Department = "Engineering",
                Location = "Bengaluru",
                Level = JobLevel.MidLevel,
                JobType = JobType.FullTime,
                Status = status,
                IsActive = active,
                PostedDate = DateTime.UtcNow,
                ClosingDate = DateTime.UtcNow.AddDays(14),
                CreatedAt = DateTime.UtcNow
            };
            db.JobPostings.Add(posting);
            await db.SaveChangesAsync();
            db.ChangeTracker.Clear();
            return posting;
        }
    }
}
