using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using UabIndia.Api.Models;
using UabIndia.Api.Modules.Workflow.Controllers;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class WorkflowApprovalsEngineTests : IDisposable
    {
        private readonly ApplicationDbContext _db;
        private readonly TestTenantAccessor _tenantAccessor;
        private readonly ApprovalRequestService _approvalService;
        private readonly ApprovalsController _controller;
        private readonly Guid _tenantId = Guid.NewGuid();
        private readonly Guid _adminUserId = Guid.NewGuid();

        public WorkflowApprovalsEngineTests()
        {
            var inMemoryConfig = new Dictionary<string, string?>
            {
                ["Encryption:Key"] = "test-key-32-chars-long-for-abac-tests!!!"
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();

            _tenantAccessor = new TestTenantAccessor();
            _tenantAccessor.SetTenantId(_tenantId);

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            var encryption = new AesEncryptionService(config);
            _db = new ApplicationDbContext(options, _tenantAccessor, encryption);
            _approvalService = new ApprovalRequestService(_db, _tenantAccessor);

            _controller = new ApprovalsController(_db, _tenantAccessor, _approvalService)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext
                    {
                        User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, _adminUserId.ToString()),
                            new Claim("sub", _adminUserId.ToString())
                        }, "mock"))
                    }
                }
            };
        }

        public void Dispose()
        {
            _db.Dispose();
        }

        [Fact]
        public async Task MultiTierWorkflow_ProgressesSteps_BeforeFinalApproval()
        {
            // Arrange: 2-tier workflow (Manager step 1, Finance step 2)
            var workflow = new WorkflowDefinition
            {
                TenantId = _tenantId,
                ModuleKey = "procurement",
                Name = "Purchase Order Two-Tier",
                IsActive = true,
                Steps = new List<WorkflowStep>
                {
                    new WorkflowStep { StepOrder = 1, RoleRequired = "Manager" },
                    new WorkflowStep { StepOrder = 2, RoleRequired = "Finance" }
                }
            };
            _db.WorkflowDefinitions.Add(workflow);

            var vendor = new Vendor
            {
                TenantId = _tenantId,
                VendorName = "Apex Supplies",
                VendorCode = "VND-APEX"
            };
            _db.Vendors.Add(vendor);

            var po = new PurchaseOrder
            {
                TenantId = _tenantId,
                PONumber = "PO-2026-999",
                PODate = DateTime.UtcNow,
                VendorId = vendor.Id,
                TotalAmount = 75000,
                Status = "Draft"
            };
            _db.PurchaseOrders.Add(po);
            await _db.SaveChangesAsync();

            // Act 1: Create approval request
            var requesterId = Guid.NewGuid();
            await _approvalService.CreateAsync("procurement", "PurchaseOrder", po.Id, "Urgent office hardware", requesterId);

            var req = await _db.ApprovalRequests.SingleAsync(r => r.EntityId == po.Id);
            Assert.Equal("Pending", req.Status);
            Assert.Equal(1, req.CurrentStep);

            // Act 2: Approve step 1 (Should advance to step 2, remaining Pending)
            var managerId = Guid.NewGuid();
            await _approvalService.ApproveAsync(req.Id, managerId, "Approved by Manager");

            var afterStep1 = await _db.ApprovalRequests.FindAsync(req.Id);
            Assert.NotNull(afterStep1);
            Assert.Equal("Pending", afterStep1.Status);
            Assert.Equal(2, afterStep1.CurrentStep);

            // Act 3: Approve step 2 (Final step, should mark Approved and sync PurchaseOrder)
            var financeId = Guid.NewGuid();
            await _approvalService.ApproveAsync(req.Id, financeId, "Approved by Finance Controller");

            var afterFinal = await _db.ApprovalRequests.FindAsync(req.Id);
            Assert.NotNull(afterFinal);
            Assert.Equal("Approved", afterFinal.Status);
            Assert.Equal(financeId, afterFinal.ApprovedBy);

            var updatedPo = await _db.PurchaseOrders.FindAsync(po.Id);
            Assert.NotNull(updatedPo);
            Assert.Equal("Approved", updatedPo.Status);
            Assert.Equal(financeId, updatedPo.ApprovedBy);
        }

        [Fact]
        public async Task Rejection_HaltsWorkflow_AndSyncsUnderlyingEntity()
        {
            var workflow = new WorkflowDefinition
            {
                TenantId = _tenantId,
                ModuleKey = "procurement",
                Name = "Purchase Order Workflow",
                IsActive = true
            };
            _db.WorkflowDefinitions.Add(workflow);

            var po = new PurchaseOrder
            {
                TenantId = _tenantId,
                PONumber = "PO-REJECT-01",
                PODate = DateTime.UtcNow,
                TotalAmount = 50000,
                Status = "Draft"
            };
            _db.PurchaseOrders.Add(po);
            await _db.SaveChangesAsync();

            await _approvalService.CreateAsync("procurement", "PurchaseOrder", po.Id, "Needs review", Guid.NewGuid());
            var req = await _db.ApprovalRequests.SingleAsync(r => r.EntityId == po.Id);

            var rejectorId = Guid.NewGuid();
            await _approvalService.RejectAsync(req.Id, rejectorId, "Over budget limit");

            var afterReject = await _db.ApprovalRequests.FindAsync(req.Id);
            Assert.NotNull(afterReject);
            Assert.Equal("Rejected", afterReject.Status);
            Assert.Equal(rejectorId, afterReject.RejectedBy);

            var updatedPo = await _db.PurchaseOrders.FindAsync(po.Id);
            Assert.NotNull(updatedPo);
            Assert.Equal("Cancelled", updatedPo.Status);
        }

        [Fact]
        public async Task ApprovalsController_List_EnrichesEntitiesAndSupportsStatusAll()
        {
            var workflow = new WorkflowDefinition
            {
                TenantId = _tenantId,
                ModuleKey = "procurement",
                Name = "PO Workflow",
                IsActive = true,
                Steps = new List<WorkflowStep>
                {
                    new WorkflowStep { StepOrder = 1 },
                    new WorkflowStep { StepOrder = 2 },
                    new WorkflowStep { StepOrder = 3 }
                }
            };
            _db.WorkflowDefinitions.Add(workflow);

            var empUserId = Guid.NewGuid();
            var employee = new Employee
            {
                TenantId = _tenantId,
                FullName = "Aditi Sharma",
                UserId = empUserId
            };
            _db.Employees.Add(employee);

            var po = new PurchaseOrder
            {
                TenantId = _tenantId,
                PONumber = "PO-2026-ENRICH",
                PODate = DateTime.UtcNow,
                TotalAmount = 150000,
                Status = "Draft"
            };
            _db.PurchaseOrders.Add(po);
            await _db.SaveChangesAsync();

            await _approvalService.CreateAsync("procurement", "PurchaseOrder", po.Id, "Production Server Cluster", empUserId);

            // Act 1: Query with status = "Pending"
            var pendingResult = await _controller.List("Pending") as OkObjectResult;
            Assert.NotNull(pendingResult);
            var pendingList = Assert.IsAssignableFrom<List<ApprovalRequestDto>>(pendingResult.Value);
            Assert.Single(pendingList);

            var item = pendingList[0];
            Assert.Equal("Aditi Sharma", item.RequesterName);
            Assert.Equal("PO #PO-2026-ENRICH", item.Title);
            Assert.Equal(150000, item.Amount);
            Assert.Equal("Procurement", item.Department);
            Assert.Equal("Urgent", item.Urgency);
            Assert.Equal(3, item.TotalSteps);

            // Act 2: Query with status = "ALL"
            var allResult = await _controller.List("ALL") as OkObjectResult;
            Assert.NotNull(allResult);
            var allList = Assert.IsAssignableFrom<List<ApprovalRequestDto>>(allResult.Value);
            Assert.Single(allList);
        }

        [Fact]
        public async Task ApprovalsController_BulkApprove_ApprovesMultipleRequests()
        {
            var workflow = new WorkflowDefinition
            {
                TenantId = _tenantId,
                ModuleKey = "finance",
                Name = "Finance Flow",
                IsActive = true
            };
            _db.WorkflowDefinitions.Add(workflow);

            var claim1 = new ExpenseClaim
            {
                TenantId = _tenantId,
                ClaimNumber = "EXP-01",
                Amount = 1200,
                Title = "Taxi ride"
            };
            var claim2 = new ExpenseClaim
            {
                TenantId = _tenantId,
                ClaimNumber = "EXP-02",
                Amount = 3500,
                Title = "Client dinner"
            };
            _db.ExpenseClaims.AddRange(claim1, claim2);
            await _db.SaveChangesAsync();

            var user = Guid.NewGuid();
            await _approvalService.CreateAsync("finance", "ExpenseClaim", claim1.Id, "Claim 1", user);
            await _approvalService.CreateAsync("finance", "ExpenseClaim", claim2.Id, "Claim 2", user);

            var req1 = await _db.ApprovalRequests.SingleAsync(r => r.EntityId == claim1.Id);
            var req2 = await _db.ApprovalRequests.SingleAsync(r => r.EntityId == claim2.Id);

            var bulkDto = new BulkApprovalRequestDto
            {
                RequestIds = new List<Guid> { req1.Id, req2.Id },
                Comments = "Batch signoff"
            };

            var actionResult = await _controller.BulkApprove(bulkDto) as OkObjectResult;
            Assert.NotNull(actionResult);

            var after1 = await _db.ApprovalRequests.FindAsync(req1.Id);
            var after2 = await _db.ApprovalRequests.FindAsync(req2.Id);
            Assert.Equal("Approved", after1!.Status);
            Assert.Equal("Approved", after2!.Status);
        }

        [Fact]
        public async Task ApprovalsController_Escalate_AdvancesStep()
        {
            var workflow = new WorkflowDefinition
            {
                TenantId = _tenantId,
                ModuleKey = "procurement",
                Name = "Tier Flow",
                IsActive = true,
                Steps = new List<WorkflowStep>
                {
                    new WorkflowStep { StepOrder = 1 },
                    new WorkflowStep { StepOrder = 2 }
                }
            };
            _db.WorkflowDefinitions.Add(workflow);
            await _db.SaveChangesAsync();

            var entityId = Guid.NewGuid();
            await _approvalService.CreateAsync("procurement", "PurchaseOrder", entityId, "Waiting too long", Guid.NewGuid());
            var req = await _db.ApprovalRequests.SingleAsync(r => r.EntityId == entityId);

            var escalateDto = new EscalateApprovalDto { Reason = "Manager on leave, escalating to HOD" };
            var actionResult = await _controller.Escalate(req.Id, escalateDto) as OkObjectResult;
            Assert.NotNull(actionResult);

            var updated = await _db.ApprovalRequests.FindAsync(req.Id);
            Assert.NotNull(updated);
            Assert.Equal(2, updated.CurrentStep);
            Assert.Contains("Manager on leave", updated.Comments);
        }
    }
}
