using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class HrOperationalServiceTests
    {
        private static (
            ApplicationDbContext Db,
            LeaveRequestService Leave,
            ExpenseClaimService Expenses,
            PayrollEmployeeFinanceService Finance,
            TestTenantAccessor Tenant) CreateSut()
        {
            var tenant = new TestTenantAccessor();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            var db = new ApplicationDbContext(options, tenant, new TestEncryptionService());
            var numbers = new DocumentNumberService(db, tenant);
            var ledger = new LedgerPostingService(db, tenant, numbers);
            var notifications = new NoOpNotificationEmitter();
            return (
                db,
                new LeaveRequestService(db, tenant, notifications),
                new ExpenseClaimService(db, ledger, notifications),
                new PayrollEmployeeFinanceService(db),
                tenant);
        }

        [Fact]
        public async Task ApproveLeave_IncrementsTakenAndReducesBalance()
        {
            var (db, leave, _, _, tenant) = CreateSut();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            var employeeId = Guid.NewGuid();
            var policyId = Guid.NewGuid();
            db.EmployeeLeaves.Add(new EmployeeLeave
            {
                TenantId = tenantId,
                EmployeeId = employeeId,
                LeavePolicyId = policyId,
                Year = DateTime.UtcNow.Year,
                Entitled = 12,
                Taken = 2,
                Balance = 10,
                CreatedAt = DateTime.UtcNow
            });
            var request = new LeaveRequest
            {
                TenantId = tenantId,
                EmployeeId = employeeId,
                LeavePolicyId = policyId,
                FromDate = new DateTime(DateTime.UtcNow.Year, 8, 1),
                ToDate = new DateTime(DateTime.UtcNow.Year, 8, 2),
                Days = 2,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };
            db.LeaveRequests.Add(request);
            await db.SaveChangesAsync();

            var approved = await leave.ApproveAsync(request.Id, Guid.NewGuid(), Guid.NewGuid());

            Assert.Equal("Approved", approved.Status);
            var balance = await db.EmployeeLeaves.SingleAsync();
            Assert.Equal(4m, balance.Taken);
            Assert.Equal(8m, balance.Balance);
        }

        [Fact]
        public async Task ApproveLeave_ThrowsWhenNotPending()
        {
            var (db, leave, _, _, tenant) = CreateSut();
            await using var _ = db;
            var request = new LeaveRequest
            {
                TenantId = tenant.GetTenantId(),
                EmployeeId = Guid.NewGuid(),
                LeavePolicyId = Guid.NewGuid(),
                FromDate = DateTime.UtcNow.Date,
                ToDate = DateTime.UtcNow.Date,
                Days = 1,
                Status = "Approved",
                CreatedAt = DateTime.UtcNow
            };
            db.LeaveRequests.Add(request);
            await db.SaveChangesAsync();

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                leave.ApproveAsync(request.Id, null, Guid.Empty));
        }

        [Fact]
        public async Task ApproveExpense_RequiresSubmitted()
        {
            var (db, _, expenses, _, tenant) = CreateSut();
            await using var _ = db;
            var claim = new ExpenseClaim
            {
                TenantId = tenant.GetTenantId(),
                ClaimNumber = "EXP-00001",
                Title = "Hotel",
                Amount = 1200,
                Status = "Submitted",
                ExpenseDate = DateTime.UtcNow.Date,
                CreatedAt = DateTime.UtcNow
            };
            db.ExpenseClaims.Add(claim);
            await db.SaveChangesAsync();

            var approved = await expenses.ApproveAsync(claim.Id, "hr");
            Assert.Equal("Approved", approved.Status);
            Assert.Equal("hr", approved.ApprovedBy);
        }

        [Fact]
        public async Task RecordEmi_ClosesLoanWhenPaidOff()
        {
            var (db, _, _, finance, tenant) = CreateSut();
            await using var _ = db;
            var loan = new PayrollLoan
            {
                TenantId = tenant.GetTenantId(),
                EmployeeId = Guid.NewGuid(),
                EmployeeName = "Ada",
                PrincipalAmount = 1000,
                OutstandingAmount = 200,
                EmiAmount = 200,
                TotalInstallments = 5,
                InstallmentsPaid = 4,
                Status = "Active",
                DisbursementDate = DateTime.UtcNow.Date,
                CreatedAt = DateTime.UtcNow
            };
            db.PayrollLoans.Add(loan);
            await db.SaveChangesAsync();

            var result = await finance.RecordEmiAsync(loan.Id);

            Assert.Equal("Closed", result.Status);
            Assert.Equal(0m, result.OutstandingAmount);
            Assert.Equal(5, result.InstallmentsPaid);
            Assert.NotNull(result.ClosedAt);
        }

        [Fact]
        public async Task RecordEmi_ThrowsWhenLoanNotActive()
        {
            var (db, _, _, finance, tenant) = CreateSut();
            await using var _ = db;
            var loan = new PayrollLoan
            {
                TenantId = tenant.GetTenantId(),
                EmployeeId = Guid.NewGuid(),
                PrincipalAmount = 500,
                OutstandingAmount = 500,
                EmiAmount = 100,
                Status = "Pending",
                DisbursementDate = DateTime.UtcNow.Date,
                CreatedAt = DateTime.UtcNow
            };
            db.PayrollLoans.Add(loan);
            await db.SaveChangesAsync();

            await Assert.ThrowsAsync<InvalidOperationException>(() => finance.RecordEmiAsync(loan.Id));
        }
    }
}
