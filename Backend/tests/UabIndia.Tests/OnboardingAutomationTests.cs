using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using UabIndia.Api.Controllers;
using UabIndia.Api.Models;
using UabIndia.Api.Services;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class OnboardingAutomationTests
    {
        private static ApplicationDbContext CreateDbContext(string databaseName, TestTenantAccessor tenantAccessor)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName)
                .Options;

            return new ApplicationDbContext(options, tenantAccessor, new TestEncryptionService());
        }

        private static IConfiguration BuildConfiguration(Dictionary<string, string?>? overrides = null)
        {
            var defaults = new Dictionary<string, string?>
            {
                ["TenantProvisioning:RoleMappings:DefaultAdminRole"] = "ADMIN",
                ["TenantProvisioning:RoleMappings:AllowedAdminRoles:0"] = "ADMIN",
                ["TenantProvisioning:RoleMappings:DefaultEmployeeRole"] = "EMPLOYEE",
                ["TenantProvisioning:RoleMappings:AllowedEmployeeRoles:0"] = "EMPLOYEE",
                ["TenantProvisioning:RoleMappings:AllowedEmployeeRoles:1"] = "INTERN"
            };

            if (overrides != null)
            {
                foreach (var pair in overrides)
                {
                    defaults[pair.Key] = pair.Value;
                }
            }

            return new ConfigurationBuilder()
                .AddInMemoryCollection(defaults)
                .Build();
        }

        [Fact]
        public async Task DuplicateClickPrevention_ReturnsAccepted_WhenRequestTokenAlreadyInProgress()
        {
            var tenantAccessor = new TestTenantAccessor();
            await using var db = CreateDbContext(Guid.NewGuid().ToString(), tenantAccessor);

            var configuration = BuildConfiguration();
            var hasher = new PasswordHasher<User>();
            var resolver = new RoleMappingResolver(configuration);

            var provisioningService = new TenantProvisioningService(
                db,
                configuration,
                new TestEncryptionService(),
                hasher,
                resolver,
                NullLogger<TenantProvisioningService>.Instance);

            var distributedCache = new MemoryDistributedCache(new Microsoft.Extensions.Options.OptionsWrapper<MemoryDistributedCacheOptions>(new MemoryDistributedCacheOptions()));
            const string requestToken = "qa-duplicate-click-token";
            await distributedCache.SetStringAsync($"tenant-provision:{requestToken}", "in_progress");

            var controller = new TenantsController(
                db,
                provisioningService,
                NullLogger<TenantsController>.Instance,
                distributedCache);

            var dto = new CreateTenantDto
            {
                Name = "QA Tenant",
                Subdomain = "qa-tenant",
                AdminEmail = "admin@qa.local",
                AdminName = "QA Admin",
                AdminRole = "ADMIN",
                AdminPassword = "TempPass#123",
                SubscriptionPlan = "Basic",
                Status = "active",
                SelectedModules = new[] { "hrms" },
                TenantProvisionRequestId = requestToken
            };

            var result = await controller.Create(dto);

            var accepted = Assert.IsType<AcceptedResult>(result);
            Assert.NotNull(accepted.Value);
            var payload = accepted.Value!.ToString();
            Assert.Contains("already in progress", payload, StringComparison.OrdinalIgnoreCase);

            var tenantCount = await db.Tenants.IgnoreQueryFilters().CountAsync();
            Assert.Equal(0, tenantCount);
        }

        [Fact]
        public async Task EmployeeLoginCreation_AssignsConfiguredFallbackRole_WhenRequestedRoleNotAllowed()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            tenantAccessor.SetTenantSchema("tenant_test");

            await using var db = CreateDbContext(Guid.NewGuid().ToString(), tenantAccessor);

            var company = new Company
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Name = "Acme QA",
                Code = "ACME",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Companies.Add(company);
            await db.SaveChangesAsync();

            var configuration = BuildConfiguration(new Dictionary<string, string?>
            {
                ["TenantProvisioning:RoleMappings:DefaultEmployeeRole"] = "INTERN",
                ["TenantProvisioning:RoleMappings:AllowedEmployeeRoles:0"] = "EMPLOYEE",
                ["TenantProvisioning:RoleMappings:AllowedEmployeeRoles:1"] = "INTERN"
            });

            var resolver = new RoleMappingResolver(configuration);
            var controller = new EmployeesController(db, tenantAccessor, new PasswordHasher<User>(), resolver);

            var dto = new CreateEmployeeDto
            {
                FullName = "Jane QA",
                CompanyId = company.Id,
                EmployeeCode = "EMP-900",
                Status = "Active",
                CreateLogin = true,
                WorkEmail = "jane.qa@acme.local",
                InitialPassword = "StrongPass#123",
                LoginRole = "POWER_USER"
            };

            var result = await controller.Create(dto);

            Assert.IsType<CreatedAtActionResult>(result);

            var createdUser = await db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.TenantId == tenantId && !u.IsDeleted);
            Assert.NotNull(createdUser);
            Assert.Equal("Jane QA", createdUser!.FullName);

            var assignedRoleName = await db.UserRoles.IgnoreQueryFilters()
                .Where(ur => ur.TenantId == tenantId && ur.UserId == createdUser.Id && !ur.IsDeleted)
                .Join(
                    db.Roles.IgnoreQueryFilters().Where(r => r.TenantId == tenantId && !r.IsDeleted),
                    ur => ur.RoleId,
                    r => r.Id,
                    (ur, role) => role.Name)
                .FirstOrDefaultAsync();

            Assert.Equal("INTERN", assignedRoleName);
        }

        [Fact]
        public async Task CompanyVisibility_List_ReturnsOnlyCurrentTenantCompanies()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantA = Guid.NewGuid();
            var tenantB = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantA);
            tenantAccessor.SetTenantSchema("tenant_test");

            await using var db = CreateDbContext(Guid.NewGuid().ToString(), tenantAccessor);

            tenantAccessor.SetTenantId(tenantA);
            db.Companies.Add(new Company
            {
                Id = Guid.NewGuid(),
                TenantId = tenantA,
                Name = "Tenant A Company",
                Code = "A001",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();

            tenantAccessor.SetTenantId(tenantB);
            db.Companies.Add(new Company
            {
                Id = Guid.NewGuid(),
                TenantId = tenantB,
                Name = "Tenant B Company",
                Code = "B001",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();

            tenantAccessor.SetTenantId(tenantA);

            var controller = new CompaniesController(
                db,
                tenantAccessor,
                new InputSanitizer(),
                new NoOpCacheService());

            var result = await controller.List(page: 1, limit: 50);
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(ok.Value);

            var companiesProperty = ok.Value!.GetType().GetProperty("companies")
                                   ?? ok.Value.GetType().GetProperty("Companies");
            Assert.NotNull(companiesProperty);

            var companies = (companiesProperty!.GetValue(ok.Value) as System.Collections.IEnumerable)
                ?.Cast<object>()
                .Select(c => c.GetType().GetProperty("Name")?.GetValue(c)?.ToString() ?? string.Empty)
                .ToList()
                ?? new List<string>();

            Assert.Contains("Tenant A Company", companies, StringComparer.OrdinalIgnoreCase);
            Assert.DoesNotContain("Tenant B Company", companies, StringComparer.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task MasterTenant_Delete_IsBlocked()
        {
            var tenantAccessor = new TestTenantAccessor();
            await using var db = CreateDbContext(Guid.NewGuid().ToString(), tenantAccessor);

            var masterTenant = new Tenant
            {
                Id = Guid.NewGuid(),
                TenantId = Guid.Empty,
                Subdomain = "master",
                Name = "Master Tenant",
                IsActive = true,
                ProvisionStatus = TenantProvisioningService.ProvisionStates.Completed,
                CreatedAt = DateTime.UtcNow
            };

            db.Tenants.Add(masterTenant);
            await db.SaveChangesAsync();

            var configuration = BuildConfiguration();
            var provisioningService = new TenantProvisioningService(
                db,
                configuration,
                new TestEncryptionService(),
                new PasswordHasher<User>(),
                new RoleMappingResolver(configuration),
                NullLogger<TenantProvisioningService>.Instance);

            var distributedCache = new MemoryDistributedCache(new Microsoft.Extensions.Options.OptionsWrapper<MemoryDistributedCacheOptions>(new MemoryDistributedCacheOptions()));
            var controller = new TenantsController(
                db,
                provisioningService,
                NullLogger<TenantsController>.Instance,
                distributedCache);

            var result = await controller.Delete(masterTenant.Id);

            Assert.IsType<BadRequestObjectResult>(result);

            var reloaded = await db.Tenants.IgnoreQueryFilters().FirstAsync(t => t.Id == masterTenant.Id);
            Assert.False(reloaded.IsDeleted);
        }

        [Fact]
        public async Task RepairTenant_NotFound_Returns404()
        {
            var tenantAccessor = new TestTenantAccessor();
            await using var db = CreateDbContext(Guid.NewGuid().ToString(), tenantAccessor);

            var configuration = BuildConfiguration();
            var provisioningService = new TenantProvisioningService(
                db,
                configuration,
                new TestEncryptionService(),
                new PasswordHasher<User>(),
                new RoleMappingResolver(configuration),
                NullLogger<TenantProvisioningService>.Instance);

            var distributedCache = new MemoryDistributedCache(new Microsoft.Extensions.Options.OptionsWrapper<MemoryDistributedCacheOptions>(new MemoryDistributedCacheOptions()));
            var controller = new TenantsController(
                db,
                provisioningService,
                NullLogger<TenantsController>.Instance,
                distributedCache);

            var result = await controller.Repair(Guid.NewGuid());
            Assert.IsType<NotFoundObjectResult>(result);
        }

        private sealed class NoOpCacheService : ICacheService
        {
            public Task<T?> GetAsync<T>(string key) where T : class => Task.FromResult<T?>(null);

            public Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class => Task.CompletedTask;

            public Task RemoveAsync(string key) => Task.CompletedTask;

            public Task RemoveByPrefixAsync(string prefix) => Task.CompletedTask;

            public Task<T?> GetOrSetAsync<T>(string key, Func<Task<T?>> factory, TimeSpan? expiration = null) where T : class
                => factory();
        }
    }
}
