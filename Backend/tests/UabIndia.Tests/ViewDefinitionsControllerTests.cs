using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Api.Modules.Administration.Controllers;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class ViewDefinitionsControllerTests
    {
        [Fact]
        public async Task CreateView_PersonalScope_PersistsViewForUser()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            await using var db = CreateContext(tenantAccessor);
            var userId = Guid.NewGuid();
            var controller = CreateController(db, tenantAccessor, userId, "Employee");

            var request = new ViewDefinitionsController.CreateViewDefinitionRequest
            {
                PageKey = "hrms.employees",
                Name = "Active Engineers",
                Scope = "Personal",
                SortKey = "fullName",
                SortDir = "asc",
                Density = "compact",
                IsDefault = true,
                FiltersJson = "{\"department\":\"Engineering\",\"status\":\"Active\"}",
                ColumnsJson = "[{\"key\":\"fullName\",\"visible\":true,\"order\":1}]"
            };

            var result = await controller.CreateView(request, CancellationToken.None);

            var createdResult = Assert.IsType<CreatedResult>(result);
            var dto = Assert.IsType<ViewDefinitionsController.ViewDefinitionDto>(createdResult.Value);
            Assert.Equal("hrms.employees", dto.PageKey);
            Assert.Equal("Active Engineers", dto.Name);
            Assert.Equal("Personal", dto.Scope);
            Assert.Equal(userId, dto.UserId);
            Assert.True(dto.IsDefault);

            var inDb = await db.UiViewDefinitions.FirstOrDefaultAsync(v => v.Name == "Active Engineers");
            Assert.NotNull(inDb);
            Assert.Equal(tenantId, inDb.TenantId);
            Assert.Equal(userId, inDb.UserId);
        }

        [Fact]
        public async Task GetViewsForPage_ReturnsPersonalAndTenantViews()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            await using var db = CreateContext(tenantAccessor);
            var user1 = Guid.NewGuid();
            var user2 = Guid.NewGuid();

            // Seed a personal view for user1, user2, and a tenant view
            db.UiViewDefinitions.AddRange(
                new UiViewDefinition
                {
                    TenantId = tenantId,
                    PageKey = "sales.orders",
                    Name = "User 1 Orders",
                    Scope = "Personal",
                    UserId = user1
                },
                new UiViewDefinition
                {
                    TenantId = tenantId,
                    PageKey = "sales.orders",
                    Name = "User 2 Orders",
                    Scope = "Personal",
                    UserId = user2
                },
                new UiViewDefinition
                {
                    TenantId = tenantId,
                    PageKey = "sales.orders",
                    Name = "All Tenant Orders",
                    Scope = "Tenant"
                }
            );
            await db.SaveChangesAsync();

            var controller = CreateController(db, tenantAccessor, user1, "Sales Representative");
            var result = await controller.GetViewsForPage("sales.orders", CancellationToken.None);

            var okResult = Assert.IsType<OkObjectResult>(result);
            var json = JsonSerializer.Serialize(okResult.Value);
            var doc = JsonDocument.Parse(json);
            var count = doc.RootElement.GetProperty("count").GetInt32();

            // user1 should see User 1 Orders + All Tenant Orders (2 views), but NOT User 2 Orders
            Assert.Equal(2, count);
        }

        [Fact]
        public async Task SetDefaultView_UpdatesIsDefaultCorrectly()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            await using var db = CreateContext(tenantAccessor);
            var userId = Guid.NewGuid();

            var view1 = new UiViewDefinition
            {
                TenantId = tenantId,
                PageKey = "procurement.orders",
                Name = "View 1",
                Scope = "Personal",
                UserId = userId,
                IsDefault = true
            };
            var view2 = new UiViewDefinition
            {
                TenantId = tenantId,
                PageKey = "procurement.orders",
                Name = "View 2",
                Scope = "Personal",
                UserId = userId,
                IsDefault = false
            };
            db.UiViewDefinitions.AddRange(view1, view2);
            await db.SaveChangesAsync();

            var controller = CreateController(db, tenantAccessor, userId, "Buyer");
            var result = await controller.SetDefaultView(view2.Id, CancellationToken.None);

            Assert.IsType<OkObjectResult>(result);

            var updatedView1 = await db.UiViewDefinitions.FindAsync(view1.Id);
            var updatedView2 = await db.UiViewDefinitions.FindAsync(view2.Id);

            Assert.False(updatedView1!.IsDefault);
            Assert.True(updatedView2!.IsDefault);
        }

        [Fact]
        public async Task DeleteView_SoftDeletesView()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            await using var db = CreateContext(tenantAccessor);
            var userId = Guid.NewGuid();

            var view = new UiViewDefinition
            {
                TenantId = tenantId,
                PageKey = "hrms.attendance",
                Name = "Late Punches",
                Scope = "Personal",
                UserId = userId
            };
            db.UiViewDefinitions.Add(view);
            await db.SaveChangesAsync();

            var controller = CreateController(db, tenantAccessor, userId, "Employee");
            var result = await controller.DeleteView(view.Id, CancellationToken.None);

            Assert.IsType<NoContentResult>(result);

            // Directly query ignoring query filter to verify soft-delete
            var inDb = await db.UiViewDefinitions.IgnoreQueryFilters().FirstOrDefaultAsync(v => v.Id == view.Id);
            Assert.NotNull(inDb);
            Assert.True(inDb.IsDeleted);
        }

        private static ApplicationDbContext CreateContext(TestTenantAccessor tenantAccessor)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            return new ApplicationDbContext(options, tenantAccessor, new TestEncryptionService());
        }

        private static ViewDefinitionsController CreateController(ApplicationDbContext db, TestTenantAccessor tenantAccessor, Guid userId, string role)
        {
            var controller = new ViewDefinitionsController(db, tenantAccessor)
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
