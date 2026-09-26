using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using UabIndia.Api.Modules.Administration.Controllers;
using UabIndia.Api.Services;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class UiPagesLifecycleTests
    {
        private class DummyEntityMetadataService : IEntityMetadataService
        {
            public Task<List<EntitySummaryDto>> GetDiscoverableEntitiesAsync(CancellationToken ct = default)
                => Task.FromResult(new List<EntitySummaryDto>());

            public Task<List<EntityFieldMetaDto>> GetEntityFieldsAsync(string entityName, CancellationToken ct = default)
                => Task.FromResult(new List<EntityFieldMetaDto>());

            public Task<List<EntityFieldMetaDto>> GetEntityFieldsAsync(string entityName, Guid? companyId, Guid? projectId, CancellationToken ct = default)
                => Task.FromResult(new List<EntityFieldMetaDto>());

            public Task<string> SynthesizePageSchemaJsonAsync(string entityName, string pageKey, Guid? companyId = null, Guid? projectId = null, CancellationToken ct = default)
                => Task.FromResult("{\"pageKey\":\"" + pageKey + "\"}");
        }

        private static ApplicationDbContext CreateInMemoryDbContext(string dbName, ITenantAccessor tenantAccessor)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            return new ApplicationDbContext(options, tenantAccessor, new TestEncryptionService());
        }

        private static UiPagesController CreateController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            var controller = new UiPagesController(db, tenantAccessor, new DummyEntityMetadataService());
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, "Admin")
            }, "TestAuth"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            return controller;
        }

        [Fact]
        public async Task PageLifecycle_Draft_Review_Publish_Rollback_Archive()
        {
            var tenantId = Guid.NewGuid();
            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(tenantId);

            var dbName = Guid.NewGuid().ToString();

            // 1. Create a page with version 1 published and version 2 draft
            using (var db = CreateInMemoryDbContext(dbName, tenantAccessor))
            {
                var page = new UiPageDefinition
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    PageKey = "hrms.contractors",
                    Title = "Contractors Registry",
                    EntityName = "Contractor",
                    ModuleKey = "hrms",
                    Status = "Draft",
                    PublishedVersion = 1,
                    DraftVersion = 2,
                    Versions = new List<UiPageVersion>
                    {
                        new UiPageVersion
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            Version = 1,
                            SchemaJson = "{\"title\":\"Contractors V1\"}",
                            IsPublished = true,
                            PublishedAt = DateTime.UtcNow.AddDays(-1)
                        },
                        new UiPageVersion
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            Version = 2,
                            SchemaJson = "{\"title\":\"Contractors V2\"}",
                            IsPublished = false
                        }
                    }
                };

                db.UiPageDefinitions.Add(page);
                await db.SaveChangesAsync();
            }

            // 2. Submit Version 2 for Review
            using (var db = CreateInMemoryDbContext(dbName, tenantAccessor))
            {
                var controller = CreateController(db, tenantAccessor);
                var reviewResult = await controller.SubmitForReview("hrms.contractors", CancellationToken.None);
                var okReview = Assert.IsType<OkObjectResult>(reviewResult);

                var pageInDb = await db.UiPageDefinitions.FirstAsync(p => p.PageKey == "hrms.contractors");
                Assert.Equal("Review", pageInDb.Status);
            }

            // 3. Publish Version 2
            using (var db = CreateInMemoryDbContext(dbName, tenantAccessor))
            {
                var controller = CreateController(db, tenantAccessor);
                var publishResult = await controller.Publish("hrms.contractors", new UiPagesController.PublishPageDto
                {
                    Version = 2,
                    ChangeSummary = "Approved by Reviewer"
                }, CancellationToken.None);

                Assert.IsType<OkObjectResult>(publishResult);

                var pageInDb = await db.UiPageDefinitions.Include(p => p.Versions).FirstAsync(p => p.PageKey == "hrms.contractors");
                Assert.Equal("Published", pageInDb.Status);
                Assert.Equal(2, pageInDb.PublishedVersion);
                Assert.Null(pageInDb.DraftVersion);

                var v2 = pageInDb.Versions.First(v => v.Version == 2);
                Assert.True(v2.IsPublished);
                Assert.Equal("Approved by Reviewer", v2.ChangeSummary);

                var v1 = pageInDb.Versions.First(v => v.Version == 1);
                Assert.False(v1.IsPublished);
            }

            // 4. Rollback to Version 1
            using (var db = CreateInMemoryDbContext(dbName, tenantAccessor))
            {
                var controller = CreateController(db, tenantAccessor);
                var rollbackResult = await controller.Rollback("hrms.contractors", new UiPagesController.RollbackPageDto
                {
                    TargetVersion = 1
                }, CancellationToken.None);

                Assert.IsType<OkObjectResult>(rollbackResult);

                var pageInDb = await db.UiPageDefinitions.Include(p => p.Versions).FirstAsync(p => p.PageKey == "hrms.contractors");
                Assert.Equal(1, pageInDb.PublishedVersion);
                Assert.Equal("Published", pageInDb.Status);

                var v1 = pageInDb.Versions.First(v => v.Version == 1);
                Assert.True(v1.IsPublished);
            }

            // 5. Archive / Delete Page
            using (var db = CreateInMemoryDbContext(dbName, tenantAccessor))
            {
                var controller = CreateController(db, tenantAccessor);
                var deleteResult = await controller.DeletePage("hrms.contractors", CancellationToken.None);
                Assert.IsType<OkObjectResult>(deleteResult);

                var pageInDb = await db.UiPageDefinitions.IgnoreQueryFilters().FirstAsync(p => p.PageKey == "hrms.contractors");
                Assert.True(pageInDb.IsDeleted);
                Assert.Equal("Archived", pageInDb.Status);
            }
        }
    }
}
