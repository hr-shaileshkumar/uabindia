using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Api.Controllers;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class WorkflowControllerTests
    {
        [Fact]
        public async Task CreateDefinition_PersistsWorkflowAndStepsForTenant()
        {
            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(Guid.NewGuid());
            await using var db = CreateContext(tenantAccessor);
            var controller = CreateController(db, tenantAccessor, Guid.NewGuid(), "Admin");

            var request = new CreateWorkflowDefinitionDto
            {
                Key = "leave_approval",
                Name = "Leave Approval",
                Steps = new List<CreateWorkflowDefinitionStepDto>
                {
                    new() { RoleRequired = "Manager", StepOrder = 2 },
                    new() { RoleRequired = "Admin", StepOrder = 1 }
                }
            };

            var result = await controller.CreateDefinition(request);

            var created = Assert.IsType<CreatedAtActionResult>(result);
            var payload = Assert.IsType<WorkflowDefinitionResponseDto>(created.Value);
            Assert.Equal("leave_approval", payload.Key);
            Assert.Equal(2, payload.Steps.Count);
            Assert.Collection(payload.Steps,
                step => Assert.Equal(1, step.StepOrder),
                step => Assert.Equal(2, step.StepOrder));

            var workflow = await db.WorkflowDefinitions.Include(w => w.Steps).SingleAsync();
            Assert.Equal(tenantAccessor.GetTenantId(), workflow.TenantId);
            Assert.Equal(2, workflow.Steps.Count);
        }

        [Fact]
        public async Task GetApprovals_MineOnly_ReturnsCurrentUserActionableStep()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            await using var db = CreateContext(tenantAccessor);

            var workflow = new WorkflowDefinition
            {
                TenantId = tenantId,
                ModuleKey = "purchase_approval",
                Name = "Purchase Approval",
                Steps = new List<WorkflowStep>
                {
                    new() { TenantId = tenantId, StepOrder = 1, RoleRequired = "Admin", ApprovalType = "Any" },
                    new() { TenantId = tenantId, StepOrder = 2, RoleRequired = "Manager", ApprovalType = "Any" }
                }
            };
            db.WorkflowDefinitions.Add(workflow);

            var approval = new ApprovalRequest
            {
                TenantId = tenantId,
                ModuleKey = workflow.ModuleKey,
                WorkflowDefinition = workflow,
                WorkflowDefinitionId = workflow.Id,
                EntityType = "PurchaseOrder",
                EntityId = Guid.NewGuid(),
                CurrentStep = 2,
                Status = "InProgress",
                RequestedBy = Guid.NewGuid()
            };
            db.ApprovalRequests.Add(approval);
            await db.SaveChangesAsync();

            var controller = CreateController(db, tenantAccessor, Guid.NewGuid(), "Manager");
            var result = await controller.GetApprovals(approval.Id, mine: true);

            var ok = Assert.IsType<OkObjectResult>(result);
            var payload = Assert.IsType<WorkflowApprovalsResponseDto>(ok.Value);
            Assert.Equal("InProgress", payload.Status);
            Assert.Single(payload.PendingApprovals);
            Assert.True(payload.PendingApprovals[0].CanCurrentUserAct);
            Assert.True(payload.PendingApprovals[0].IsCurrentStep);
            Assert.Equal("Manager", payload.PendingApprovals[0].RoleRequired);
        }

        private static ApplicationDbContext CreateContext(TestTenantAccessor tenantAccessor)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            return new ApplicationDbContext(options, tenantAccessor, new TestEncryptionService());
        }

        private static WorkflowController CreateController(ApplicationDbContext db, TestTenantAccessor tenantAccessor, Guid userId, string role)
        {
            var controller = new WorkflowController(new WorkflowService(), tenantAccessor, db)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext
                    {
                        User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                            new Claim(ClaimTypes.Role, role)
                        }, "TestAuth"))
                    }
                }
            };

            return controller;
        }
    }
}
