using System;
using System.Collections.Generic;
using System.Linq;
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

namespace UabIndia.Tests.Security
{
    public class TenantIsolationMetadataTests
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

        private static UiPagesController CreateController(ApplicationDbContext db, ITenantAccessor tenantAccessor, string role = "Admin")
        {
            var controller = new UiPagesController(db, tenantAccessor, new DummyEntityMetadataService());
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, role)
            }, "TestAuth"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            return controller;
        }

        [Fact]
        public async Task TenantIsolation_StrictlySeparates_PageDefinitions_BetweenTenants()
        {
            var tenantA = Guid.NewGuid();
            var tenantB = Guid.NewGuid();
            var dbName = Guid.NewGuid().ToString();

            var accessorA = new TestTenantAccessor();
            accessorA.SetTenantId(tenantA);

            var accessorB = new TestTenantAccessor();
            accessorB.SetTenantId(tenantB);

            const string customPageKey = "custom.tenant-a-audit-workflow";
            const string tenantATitle = "Tenant A Confidential Audit";

            // 1. Tenant A creates and publishes a custom proprietary page definition
            using (var dbA = CreateInMemoryDbContext(dbName, accessorA))
            {
                var controllerA = CreateController(dbA, accessorA);
                var createResult = await controllerA.CreatePage(new UiPagesController.CreatePageDefinitionDto
                {
                    PageKey = customPageKey,
                    EntityName = "AuditLog",
                    Title = tenantATitle,
                    ModuleKey = "administration",
                    InitialSchemaJson = "{\"title\":\"Tenant A Confidential Audit\"}"
                }, CancellationToken.None);

                Assert.IsType<CreatedAtActionResult>(createResult);
            }

            // 2. Tenant B queries all page definitions: Tenant A's custom page must NOT appear
            using (var dbB = CreateInMemoryDbContext(dbName, accessorB))
            {
                var controllerB = CreateController(dbB, accessorB);
                var listResult = await controllerB.ListPages(null, CancellationToken.None);
                var okResult = Assert.IsType<OkObjectResult>(listResult);

                var pages = okResult.Value as System.Collections.IEnumerable;
                Assert.NotNull(pages);

                bool containsTenantAPage = false;
                foreach (var item in pages)
                {
                    var pageKeyProp = item.GetType().GetProperty("PageKey")?.GetValue(item)?.ToString();
                    if (string.Equals(pageKeyProp, customPageKey, StringComparison.OrdinalIgnoreCase))
                    {
                        containsTenantAPage = true;
                        break;
                    }
                }
                Assert.False(containsTenantAPage, "Tenant B must not see Tenant A's proprietary page definition in page list.");
            }

            // 3. Tenant B queries the page by key: receives synthetic fallback with Guid.Empty (never Tenant A's record)
            using (var dbB = CreateInMemoryDbContext(dbName, accessorB))
            {
                var controllerB = CreateController(dbB, accessorB);
                var getResult = await controllerB.GetPage(customPageKey, draft: false, version: null, companyId: null, projectId: null, ct: CancellationToken.None);
                var okResult = Assert.IsType<OkObjectResult>(getResult);

                var idProp = okResult.Value?.GetType().GetProperty("Id")?.GetValue(okResult.Value);
                Assert.Equal(Guid.Empty, idProp);

                var titleProp = okResult.Value?.GetType().GetProperty("Title")?.GetValue(okResult.Value)?.ToString();
                Assert.NotEqual(tenantATitle, titleProp);
            }

            // 4. Tenant B attempts to save a draft or mutate Tenant A's page key: returns NotFound
            using (var dbB = CreateInMemoryDbContext(dbName, accessorB))
            {
                var controllerB = CreateController(dbB, accessorB);
                var saveDraftResult = await controllerB.SaveDraft(customPageKey, new UiPagesController.SavePageSchemaDraftDto
                {
                    Title = "Malicious Override Attempt",
                    SchemaJson = "{\"title\":\"Hacked\"}"
                }, CancellationToken.None);

                Assert.IsType<NotFoundObjectResult>(saveDraftResult);
            }

            // 5. Tenant B attempts to delete Tenant A's page key: returns NotFound
            using (var dbB = CreateInMemoryDbContext(dbName, accessorB))
            {
                var controllerB = CreateController(dbB, accessorB);
                var deleteResult = await controllerB.DeletePage(customPageKey, CancellationToken.None);
                Assert.True(deleteResult is NotFoundResult || deleteResult is NotFoundObjectResult);
            }

            // 6. Tenant A fetches its own page: confirms untouched integrity with real persistent Guid ID
            using (var dbA = CreateInMemoryDbContext(dbName, accessorA))
            {
                var controllerA = CreateController(dbA, accessorA);
                var getResultA = await controllerA.GetPage(customPageKey, draft: false, version: null, companyId: null, projectId: null, ct: CancellationToken.None);
                var okResultA = Assert.IsType<OkObjectResult>(getResultA);
                Assert.NotNull(okResultA.Value);

                var idPropA = okResultA.Value?.GetType().GetProperty("Id")?.GetValue(okResultA.Value);
                Assert.NotEqual(Guid.Empty, idPropA);

                var titlePropA = okResultA.Value?.GetType().GetProperty("Title")?.GetValue(okResultA.Value)?.ToString();
                Assert.Equal(tenantATitle, titlePropA);
            }
        }
    }
}
