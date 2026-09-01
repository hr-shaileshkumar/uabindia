using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Repositories;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class WorkflowBankAndAppraisalServiceTests
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
        public async Task CreateWorkflowDefinition_OrdersStepsAndRejectsDuplicates()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var service = new WorkflowDefinitionService(db, tenant);

            var created = await service.CreateAsync(new CreateWorkflowDefinitionCommand(
                "Leave_Approval",
                "Leave Approval",
                true,
                new[]
                {
                    new CreateWorkflowStepCommand(2, "Manager", "Any", null),
                    new CreateWorkflowStepCommand(1, "Admin", "Any", null)
                }));

            Assert.Equal("leave_approval", created.ModuleKey);
            Assert.Equal(2, created.Steps.Count);
            Assert.Equal(1, created.Steps.First().StepOrder);
            Assert.Equal("Admin", created.Steps.First().RoleRequired);

            await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(
                new CreateWorkflowDefinitionCommand("leave_approval", "Again", true,
                    new[] { new CreateWorkflowStepCommand(1, "Admin", null, null) })));
        }

        [Fact]
        public async Task CreateBankReconciliation_MatchesWhenBalancesAgree()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var account = new ChartOfAccount
            {
                TenantId = tenant.GetTenantId(),
                AccountCode = "1100",
                AccountName = "Bank",
                AccountType = "Asset",
                CurrentBalance = 10000,
                CreatedAt = DateTime.UtcNow
            };
            db.ChartOfAccounts.Add(account);
            await db.SaveChangesAsync();

            var service = new BankReconciliationService(db, tenant);
            var matched = await service.CreateAsync(new CreateBankReconciliationCommand(
                account.Id, 10000, 0, "2026-08", null, null));
            Assert.Equal("Matched", matched.Status);
            Assert.Equal(0m, matched.Difference);
            Assert.Equal(10000m, matched.BookBalance);

            var unmatched = await service.CreateAsync(new CreateBankReconciliationCommand(
                account.Id, 5000, 10000, "2026-08", null, null));
            Assert.Equal("Unmatched", unmatched.Status);
        }

        [Fact]
        public async Task ActivateAppraisalCycle_SeedsPendingAppraisalForManagedEmployee()
        {
            var (db, tenant) = CreateDb();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            var manager = new User
            {
                TenantId = tenantId,
                Email = "mgr@example.com",
                PasswordHash = "x",
                FullName = "Manager",
                CreatedAt = DateTime.UtcNow
            };
            var employeeUser = new User
            {
                TenantId = tenantId,
                Email = "emp@example.com",
                PasswordHash = "x",
                FullName = "Employee",
                CreatedAt = DateTime.UtcNow
            };
            db.Users.AddRange(manager, employeeUser);
            await db.SaveChangesAsync();

            db.Employees.Add(new Employee
            {
                TenantId = tenantId,
                EmployeeCode = "E-1",
                FullName = "Employee",
                UserId = employeeUser.Id,
                ReportingManagerId = manager.Id,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            });
            var cycle = new AppraisalCycle
            {
                TenantId = tenantId,
                Name = "FY26",
                StartDate = DateTime.UtcNow.Date,
                EndDate = DateTime.UtcNow.Date.AddMonths(6),
                SelfAssessmentDeadline = DateTime.UtcNow.Date.AddDays(10),
                ManagerAssessmentDeadline = DateTime.UtcNow.Date.AddDays(20),
                Status = AppraisalCycleStatus.Draft,
                IsActive = false,
                CreatedAt = DateTime.UtcNow
            };
            db.AppraisalCycles.Add(cycle);
            await db.SaveChangesAsync();

            var service = new AppraisalCycleService(db, tenant, new AppraisalRepository(db));
            var activated = await service.ActivateAsync(cycle.Id);

            Assert.True(activated.IsActive);
            Assert.Equal(AppraisalCycleStatus.Active, activated.Status);
            var appraisal = await db.PerformanceAppraisals.SingleAsync();
            Assert.Equal(employeeUser.Id, appraisal.EmployeeId);
            Assert.Equal(manager.Id, appraisal.ManagerId);
            Assert.Equal(AppraisalStatus.Pending, appraisal.Status);
        }
    }
}
