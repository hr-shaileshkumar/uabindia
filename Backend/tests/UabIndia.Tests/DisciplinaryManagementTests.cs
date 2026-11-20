using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Api.Models;
using UabIndia.Api.Modules.HRMS.Controllers;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class DisciplinaryManagementTests
    {
        private static ApplicationDbContext CreateContext(TestTenantAccessor tenantAccessor)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            return new ApplicationDbContext(options, tenantAccessor, new TestEncryptionService());
        }

        private static DisciplinaryController CreateController(
            ApplicationDbContext db,
            TestTenantAccessor tenantAccessor,
            Guid userId,
            string role = "HR Manager")
        {
            var controller = new DisciplinaryController(db, tenantAccessor);
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Name, "HR Officer"),
                new Claim(ClaimTypes.Role, role)
            }, "TestAuth"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            return controller;
        }

        [Fact]
        public async Task CreateCase_And_IssueShowCauseNotice_And_SubmitExplanation_CompletesWorkflow()
        {
            // Arrange
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);

            await using var db = CreateContext(tenantAccessor);
            var hrUserId = Guid.NewGuid();
            var controller = CreateController(db, tenantAccessor, hrUserId);

            var empId = Guid.NewGuid();
            db.Employees.Add(new Employee
            {
                Id = empId,
                TenantId = tenantId,
                FullName = "Ramesh Kumar",
                EmployeeCode = "EMP-0492",
                IsDeleted = false
            });
            await db.SaveChangesAsync();

            // 1. Create Disciplinary Case
            var createDto = new CreateDisciplinaryCaseDto
            {
                EmployeeId = empId,
                Title = "Unauthorized Absence and Negligence",
                Description = "Failed to report for mandatory safety briefing and left shift unattended.",
                IncidentDate = DateTime.UtcNow.AddDays(-2),
                Severity = "Severe"
            };

            var createRes = await controller.CreateCase(createDto);
            var okRes = Assert.IsType<OkObjectResult>(createRes);
            var caseJson = JsonSerializer.Serialize(okRes.Value);
            using var caseDoc = JsonDocument.Parse(caseJson);
            var caseId = caseDoc.RootElement.TryGetProperty("id", out var idProp)
                ? idProp.GetGuid()
                : caseDoc.RootElement.GetProperty("Id").GetGuid();

            Assert.NotEqual(Guid.Empty, caseId);

            // Verify case created in Draft status
            var savedCase = await db.DisciplinaryCases.FindAsync(caseId);
            Assert.NotNull(savedCase);
            Assert.Equal(DisciplinaryStatus.Draft, savedCase.Status);
            Assert.Equal(DisciplinarySeverity.Severe, savedCase.Severity);

            // 2. Issue Show-Cause Notice
            var noticeDto = new IssueShowCauseNoticeDto
            {
                Subject = "Show Cause Notice: Gross Insubordination and Safety Negligence",
                Allegations = "You remained absent during high-risk furnace operations on shift B.",
                DaysToRespond = 7
            };

            var noticeRes = await controller.IssueShowCauseNotice(caseId, noticeDto);
            var okNotice = Assert.IsType<OkObjectResult>(noticeRes);
            var noticeJson = JsonSerializer.Serialize(okNotice.Value);
            using var noticeDoc = JsonDocument.Parse(noticeJson);
            var noticeId = noticeDoc.RootElement.TryGetProperty("id", out var nIdProp)
                ? nIdProp.GetGuid()
                : noticeDoc.RootElement.GetProperty("Id").GetGuid();

            // Verify status transitioned to NoticeIssued
            var noticeCase = await db.DisciplinaryCases.Include(c => c.Notices).FirstOrDefaultAsync(c => c.Id == caseId);
            Assert.NotNull(noticeCase);
            Assert.Equal(DisciplinaryStatus.NoticeIssued, noticeCase.Status);
            Assert.Single(noticeCase.Notices);

            // 3. Submit Employee Explanation
            var explDto = new SubmitExplanationDto
            {
                Explanation = "I had to attend to an urgent family medical emergency and could not inform in time."
            };

            var explRes = await controller.SubmitExplanation(noticeId, explDto);
            Assert.IsType<OkObjectResult>(explRes);

            // Verify status transitioned to ExplanationSubmitted
            var explCase = await db.DisciplinaryCases.FindAsync(caseId);
            Assert.NotNull(explCase);
            Assert.Equal(DisciplinaryStatus.ExplanationSubmitted, explCase.Status);

            // 4. Issue Disciplinary Action (Written Warning) and close case
            var actionDto = new IssueDisciplinaryActionDto
            {
                ActionType = "WrittenWarning",
                PenaltyDetails = "First formal written warning under Rule 14. Placed under 30-day performance review.",
                EffectiveDate = DateTime.UtcNow
            };

            var actionRes = await controller.IssueDisciplinaryAction(caseId, actionDto);
            Assert.IsType<OkObjectResult>(actionRes);

            var closedCase = await db.DisciplinaryCases.Include(c => c.Actions).FirstOrDefaultAsync(c => c.Id == caseId);
            Assert.NotNull(closedCase);
            Assert.Equal(DisciplinaryStatus.Closed, closedCase.Status);
            Assert.NotNull(closedCase.ClosedAt);
            Assert.Single(closedCase.Actions);
            Assert.Equal(DisciplinaryActionType.WrittenWarning, closedCase.Actions.First().ActionType);
        }

        [Fact]
        public async Task DisciplinaryCases_EnforceTenantIsolation()
        {
            // Arrange: Tenant A and Tenant B
            var tenantA = Guid.NewGuid();
            var tenantB = Guid.NewGuid();

            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(tenantA);

            await using var db = CreateContext(tenantAccessor);
            var controllerA = CreateController(db, tenantAccessor, Guid.NewGuid());

            // Add case in Tenant A
            var caseA = new DisciplinaryCase
            {
                Id = Guid.NewGuid(),
                TenantId = tenantA,
                EmployeeId = Guid.NewGuid(),
                CaseNumber = "DISC-A-001",
                Title = "Tenant A Breach",
                Description = "Breach in Tenant A",
                IncidentDate = DateTime.UtcNow,
                Status = DisciplinaryStatus.Draft,
                IsDeleted = false
            };
            db.DisciplinaryCases.Add(caseA);
            await db.SaveChangesAsync();

            // Act from Tenant B
            tenantAccessor.SetTenantId(tenantB);
            var controllerB = CreateController(db, tenantAccessor, Guid.NewGuid());

            var result = await controllerB.GetCaseById(caseA.Id);

            // Assert: Cannot access Tenant A case from Tenant B
            Assert.IsType<NotFoundObjectResult>(result);
        }
    }
}
