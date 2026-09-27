using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Api.Modules.Workflow.Controllers;
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

        [Fact]
        public async Task GetApprovals_MineFalse_ReturnsRemainingSteps()
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
                CurrentStep = 1,
                Status = "InProgress",
                RequestedBy = Guid.NewGuid()
            };
            db.ApprovalRequests.Add(approval);
            await db.SaveChangesAsync();

            var controller = CreateController(db, tenantAccessor, Guid.NewGuid(), "Admin");
            var result = await controller.GetApprovals(approval.Id, mine: false);

            var ok = Assert.IsType<OkObjectResult>(result);
            var payload = Assert.IsType<WorkflowApprovalsResponseDto>(ok.Value);
            Assert.Equal(2, payload.PendingApprovals.Count);
            Assert.True(payload.PendingApprovals[0].IsCurrentStep);
            Assert.False(payload.PendingApprovals[1].IsCurrentStep);
        }

        [Fact]
        public async Task TransitionRecord_ValidRequest_UpdatesRecordStatus_And_CreatesAuditLog()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            await using var db = CreateContext(tenantAccessor);

            var po = new PurchaseOrder
            {
                TenantId = tenantId,
                PONumber = "PO-2026-0001",
                Status = "Draft",
                PODate = DateTime.UtcNow
            };
            db.PurchaseOrders.Add(po);
            await db.SaveChangesAsync();

            var userId = Guid.NewGuid();
            var controller = CreateController(db, tenantAccessor, userId, "Admin");

            var request = new UabIndia.Api.Models.WorkflowTransitionRequestDto
            {
                EntityType = "PurchaseOrder",
                EntityId = po.Id,
                Action = "submit",
                FromState = "Draft",
                ToState = "Submitted",
                Remarks = "Submitting for approval"
            };

            var actionResult = await controller.TransitionRecord(request);
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<UabIndia.Application.Common.Models.ApiResponse<UabIndia.Api.Models.WorkflowTransitionResultDto>>(okResult.Value);

            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.Equal("Submitted", response.Data.ToState);
            Assert.Equal(po.Id, response.Data.EntityId);

            // Verify entity updated in DB
            var updatedPo = await db.PurchaseOrders.FindAsync(po.Id);
            Assert.NotNull(updatedPo);
            Assert.Equal("Submitted", updatedPo.Status);

            // Verify audit log created
            var auditLog = await db.AuditLogs.FirstOrDefaultAsync(a => a.EntityId == po.Id && a.Action != null && a.Action.Contains("WorkflowTransition"));
            Assert.NotNull(auditLog);
            Assert.Equal(tenantId, auditLog!.TenantId);
            Assert.Equal("Draft", auditLog.OldValue);
            Assert.Contains("Submitted", auditLog.NewValue);
        }

        [Fact]
        public async Task TransitionRecord_MissingRequiredFields_ReturnsBadRequest()
        {
            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(Guid.NewGuid());
            await using var db = CreateContext(tenantAccessor);
            var controller = CreateController(db, tenantAccessor, Guid.NewGuid(), "Admin");

            var request = new UabIndia.Api.Models.WorkflowTransitionRequestDto
            {
                EntityType = "PurchaseOrder",
                EntityId = Guid.Empty, // Missing entity ID
                Action = "",
                ToState = ""
            };

            var actionResult = await controller.TransitionRecord(request);
            var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult);
            var response = Assert.IsType<UabIndia.Application.Common.Models.ApiResponse<UabIndia.Api.Models.WorkflowTransitionResultDto>>(badRequest.Value);

            Assert.False(response.Success);
            Assert.Equal("INVALID_TRANSITION_REQUEST", response.StructuredErrors[0].Code);
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
            var controller = new WorkflowController(
                new WorkflowService(),
                tenantAccessor,
                db,
                new WorkflowDefinitionService(db, tenantAccessor),
                new WorkflowApprovalQueryService(db, tenantAccessor))
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
