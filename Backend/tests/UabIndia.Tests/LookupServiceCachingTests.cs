using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Caching.Memory;
using UabIndia.Application.Interfaces;
using UabIndia.Application.Models;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class LookupServiceCachingTests
    {
        private static ApplicationDbContext CreateInMemoryDbContext(string dbName, ITenantAccessor tenantAccessor)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            return new ApplicationDbContext(options, tenantAccessor, new TestEncryptionService());
        }

        [Fact]
        public async Task GetLookupItemsAsync_CachesResult_AndIsolatesAcrossTenants()
        {
            var tenantA = Guid.NewGuid();
            var tenantB = Guid.NewGuid();

            var tenantAccessor = new TestTenantAccessor();
            var memoryCache = new MemoryCache(new MemoryCacheOptions());
            var tenantCache = new TenantMemoryCacheService(memoryCache, tenantAccessor);

            var dbName = Guid.NewGuid().ToString();
            using (var db = CreateInMemoryDbContext(dbName, tenantAccessor))
            {
                // Seed Tenant A departments
                db.Departments.Add(new Department
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantA,
                    Name = "Engineering - Tenant A",
                    Code = "ENG-A",
                    IsActive = true
                });

                // Seed Tenant B departments
                db.Departments.Add(new Department
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantB,
                    Name = "Operations - Tenant B",
                    Code = "OPS-B",
                    IsActive = true
                });

                await db.SaveChangesAsync();
            }

            // Test Tenant A lookup
            using (var db = CreateInMemoryDbContext(dbName, tenantAccessor))
            {
                var service = new LookupService(db, tenantAccessor, tenantCache);

                tenantAccessor.SetTenantId(tenantA);
                var resultA = await service.GetLookupItemsAsync("departments", new LookupQuery());
                Assert.Single(resultA.Items);
                Assert.Equal("Engineering - Tenant A", resultA.Items[0].Name);

                // Test Tenant B lookup
                tenantAccessor.SetTenantId(tenantB);
                var resultB = await service.GetLookupItemsAsync("departments", new LookupQuery());
                Assert.Single(resultB.Items);
                Assert.Equal("Operations - Tenant B", resultB.Items[0].Name);

                // Verify cache hit: add new department to DB directly, but cache should still return 1 cached item
                db.Departments.Add(new Department
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantA,
                    Name = "Finance - Tenant A",
                    Code = "FIN-A",
                    IsActive = true
                });
                await db.SaveChangesAsync();

                tenantAccessor.SetTenantId(tenantA);
                var cachedResultA = await service.GetLookupItemsAsync("departments", new LookupQuery());
                Assert.Single(cachedResultA.Items); // Still cached!
                Assert.Equal("Engineering - Tenant A", cachedResultA.Items[0].Name);

                // Now invalidate lookup cache for Tenant A
                tenantCache.InvalidateCategory("lookup");

                // Now it must fetch the updated 2 items from DB
                var freshResultA = await service.GetLookupItemsAsync("departments", new LookupQuery());
                Assert.Equal(2, freshResultA.Items.Count);
            }
        }
    }
}
