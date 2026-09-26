using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using UabIndia.Api.Modules.Administration.Controllers;
using UabIndia.Application.Common.Cqrs;
using UabIndia.Application.Common.PageActions;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class PageActionsOrchestrationTests : IDisposable
    {
        private readonly ApplicationDbContext _db;
        private readonly TestTenantAccessor _tenantAccessor;
        private readonly IDispatcher _dispatcher;
        private readonly PageActionsController _controller;
        private readonly Guid _tenantId = Guid.NewGuid();
        private readonly Guid _userId = Guid.NewGuid();

        public PageActionsOrchestrationTests()
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

            var services = new ServiceCollection();
            services.AddSingleton<ITenantAccessor>(_tenantAccessor);
            services.AddSingleton(_db);
            services.AddScoped<IApprovalRequestService, ApprovalRequestService>();
            services.AddScoped<IDispatcher, ApplicationDispatcher>();
            services.AddScoped<ICommandHandler<ExecutePageActionCommand, PageActionResult>, ExecutePageActionCommandHandler>();
            services.AddScoped<IPageActionHandler, WorkflowTriggerPageActionHandler>();
            services.AddScoped<IPageActionHandler, StatusTransitionPageActionHandler>();
            services.AddScoped<IPageActionHandler, CloneRecordPageActionHandler>();

            var serviceProvider = services.BuildServiceProvider();
            _dispatcher = serviceProvider.GetRequiredService<IDispatcher>();

            _controller = new PageActionsController(_dispatcher, _tenantAccessor)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext
                    {
                        User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, _userId.ToString()),
                            new Claim("sub", _userId.ToString())
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
        public async Task WorkflowTrigger_CreatesApprovalRequest_ViaDispatcher()
        {
            // Arrange
            var workflow = new WorkflowDefinition
            {
                TenantId = _tenantId,
                ModuleKey = "procurement",
                Name = "Procurement Flow",
                IsActive = true
            };
            _db.WorkflowDefinitions.Add(workflow);

            var po = new PurchaseOrder
            {
                TenantId = _tenantId,
                PONumber = "PO-WF-001",
                PODate = DateTime.UtcNow,
                TotalAmount = 55000,
                Status = "Draft"
            };
            _db.PurchaseOrders.Add(po);
            await _db.SaveChangesAsync();

            var command = new ExecutePageActionCommand
            {
                PageKey = "procurement.purchase-orders",
                ActionKey = "submit_approval",
                ActionType = "workflowTrigger",
                EntityId = po.Id,
                Parameters = new Dictionary<string, object?>
                {
                    ["moduleKey"] = "procurement",
                    ["entityType"] = "PurchaseOrder",
                    ["comments"] = "Requesting approval for server lease"
                },
                UserId = _userId,
                TenantId = _tenantId
            };

            // Act
            var result = await _dispatcher.SendAsync(command);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("refresh", result.NextAction);

            var createdReq = await _db.ApprovalRequests.SingleOrDefaultAsync(r => r.EntityId == po.Id);
            Assert.NotNull(createdReq);
            Assert.Equal("Pending", createdReq.Status);
            Assert.Equal("Requesting approval for server lease", createdReq.Comments);
        }

        [Fact]
        public async Task StatusTransition_UpdatesEntities_ViaDispatcher()
        {
            // Arrange
            var po1 = new PurchaseOrder
            {
                TenantId = _tenantId,
                PONumber = "PO-BATCH-01",
                Status = "Draft",
                PODate = DateTime.UtcNow
            };
            var po2 = new PurchaseOrder
            {
                TenantId = _tenantId,
                PONumber = "PO-BATCH-02",
                Status = "Draft",
                PODate = DateTime.UtcNow
            };
            _db.PurchaseOrders.AddRange(po1, po2);
            await _db.SaveChangesAsync();

            var command = new ExecutePageActionCommand
            {
                PageKey = "procurement.purchaseorders",
                ActionKey = "set_status_Submitted",
                ActionType = "statusTransition",
                SelectedIds = new List<Guid> { po1.Id, po2.Id },
                UserId = _userId,
                TenantId = _tenantId
            };

            // Act
            var result = await _dispatcher.SendAsync(command);

            // Assert
            Assert.True(result.Success);
            var updated1 = await _db.PurchaseOrders.FindAsync(po1.Id);
            var updated2 = await _db.PurchaseOrders.FindAsync(po2.Id);
            Assert.Equal("Submitted", updated1!.Status);
            Assert.Equal("Submitted", updated2!.Status);
        }

        [Fact]
        public async Task CloneRecord_DuplicatesPurchaseOrderWithCopySuffix()
        {
            // Arrange
            var vendor = new Vendor
            {
                TenantId = _tenantId,
                VendorName = "Tech Distributors",
                VendorCode = "VND-TECH"
            };
            _db.Vendors.Add(vendor);

            var po = new PurchaseOrder
            {
                TenantId = _tenantId,
                PONumber = "PO-ORIG-100",
                PODate = DateTime.UtcNow,
                VendorId = vendor.Id,
                TotalAmount = 25000,
                Status = "Approved",
                Items = new List<PurchaseOrderItem>
                {
                    new PurchaseOrderItem
                    {
                        TenantId = _tenantId,
                        Description = "16GB RAM Sticks",
                        Quantity = 10,
                        UnitPrice = 2500,
                        TotalAmount = 25000
                    }
                }
            };
            _db.PurchaseOrders.Add(po);
            await _db.SaveChangesAsync();

            var command = new ExecutePageActionCommand
            {
                PageKey = "procurement.purchaseorders",
                ActionKey = "clone",
                ActionType = "cloneRecord",
                EntityId = po.Id,
                UserId = _userId,
                TenantId = _tenantId
            };

            // Act
            var result = await _dispatcher.SendAsync(command);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);

            var clonedPo = await _db.PurchaseOrders
                .Include(p => p.Items)
                .SingleOrDefaultAsync(p => p.PONumber == "PO-ORIG-100-COPY");

            Assert.NotNull(clonedPo);
            Assert.Equal("Draft", clonedPo.Status);
            Assert.Equal(25000, clonedPo.TotalAmount);
            Assert.Single(clonedPo.Items);
            Assert.Equal("16GB RAM Sticks", clonedPo.Items.First().Description);
        }

        [Fact]
        public async Task PageActionsController_Execute_ReturnsOkResult()
        {
            // Arrange
            var po = new PurchaseOrder
            {
                TenantId = _tenantId,
                PONumber = "PO-API-001",
                Status = "Draft",
                PODate = DateTime.UtcNow
            };
            _db.PurchaseOrders.Add(po);
            await _db.SaveChangesAsync();

            var dto = new ExecutePageActionDto
            {
                PageKey = "procurement.purchaseorders",
                ActionKey = "set_status_Submitted",
                ActionType = "statusTransition",
                EntityId = po.Id
            };

            // Act
            var actionResult = await _controller.Execute(dto) as OkObjectResult;

            // Assert
            Assert.NotNull(actionResult);
            var pageResult = Assert.IsType<PageActionResult>(actionResult.Value);
            Assert.True(pageResult.Success);

            var updated = await _db.PurchaseOrders.FindAsync(po.Id);
            Assert.Equal("Submitted", updated!.Status);
        }
    }
}
