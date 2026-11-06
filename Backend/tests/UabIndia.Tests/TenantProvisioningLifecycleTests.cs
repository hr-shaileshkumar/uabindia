using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using UabIndia.Api.Models;
using UabIndia.Api.Services;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class TenantProvisioningLifecycleTests
    {
        private static ApplicationDbContext CreateDbContext(string dbName, TestTenantAccessor tenantAccessor)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(dbName)
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            return new ApplicationDbContext(options, tenantAccessor, new TestEncryptionService());
        }

        private static IConfiguration BuildConfiguration()
        {
            var values = new Dictionary<string, string?>
            {
                ["TenantProvisioning:RoleMappings:DefaultAdminRole"] = "ADMIN",
                ["TenantProvisioning:RoleMappings:AllowedAdminRoles:0"] = "ADMIN",
                ["TenantProvisioning:RoleMappings:DefaultEmployeeRole"] = "EMPLOYEE",
                ["TenantProvisioning:RoleMappings:AllowedEmployeeRoles:0"] = "EMPLOYEE"
            };

            return new ConfigurationBuilder()
                .AddInMemoryCollection(values)
                .Build();
        }

        [Theory]
        [InlineData("active", true)]
        [InlineData("trial", true)]
        [InlineData("inactive", false)]
        [InlineData("suspended", false)]
        public async Task CreateTenantRecord_RespectsRequestedActivationStatus(string status, bool expectedActive)
        {
            var tenantAccessor = new TestTenantAccessor();
            await using var db = CreateDbContext(Guid.NewGuid().ToString(), tenantAccessor);

            var configuration = BuildConfiguration();
            var service = new TenantProvisioningService(
                db,
                configuration,
                new TestEncryptionService(),
                new PasswordHasher<User>(),
                new RoleMappingResolver(configuration),
                NullLogger<TenantProvisioningService>.Instance);

            var dto = new CreateTenantDto
            {
                Name = $"Tenant-{status}",
                Subdomain = $"tenant-{Guid.NewGuid():N}".Substring(0, 20),
                AdminEmail = "admin@test.local",
                AdminName = "Admin Test",
                AdminRole = "ADMIN",
                AdminPassword = "TempPass#123",
                SubscriptionPlan = "Basic",
                Status = status,
                SelectedModules = new[] { "hrms" }
            };

            var tenant = await service.CreateTenantRecordAsync(dto);

            Assert.Equal(expectedActive, tenant.IsActive);
            Assert.False(tenant.IsDeleted);
        }

        [Fact]
        public async Task EnsureDefaultAdmin_RecreatesAdmin_WhenAdminMissing()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            tenantAccessor.SetTenantSchema("tenant_test");

            await using var db = CreateDbContext(Guid.NewGuid().ToString(), tenantAccessor);
            var configuration = BuildConfiguration();
            var service = new TenantProvisioningService(
                db,
                configuration,
                new TestEncryptionService(),
                new PasswordHasher<User>(),
                new RoleMappingResolver(configuration),
                NullLogger<TenantProvisioningService>.Instance);

            var tenant = new Tenant
            {
                Id = tenantId,
                Name = "Lifecycle Tenant",
                Subdomain = "lifecycle",
                IsActive = true,
                ProvisionStatus = TenantProvisioningService.ProvisionStates.Completed,
                CreatedAt = DateTime.UtcNow
            };

            db.Tenants.Add(tenant);
            db.Users.Add(new User
            {
                TenantId = tenantId,
                Email = "legacy@tenant.local",
                PasswordHash = "hash",
                FullName = "Legacy User",
                IsSystemAdmin = false,
                IsActive = true
            });
            await db.SaveChangesAsync();

            await InvokeEnsureDefaultAdminAsync(service, db, tenant, "admin@tenant.local", "Tenant Admin", "ADMIN", "TempPass#123");

            var adminUsers = await db.Users
                .IgnoreQueryFilters()
                .Where(u => u.TenantId == tenantId && !u.IsDeleted && u.Email == "admin@tenant.local")
                .ToListAsync();

            Assert.Single(adminUsers);
            Assert.Equal("admin@tenant.local", adminUsers[0].Email);
            Assert.False(adminUsers[0].IsSystemAdmin);

            var mappedRoleNames = await db.UserRoles
                .IgnoreQueryFilters()
                .Where(ur => ur.TenantId == tenantId && ur.UserId == adminUsers[0].Id && !ur.IsDeleted)
                .Join(
                    db.Roles.IgnoreQueryFilters().Where(r => r.TenantId == tenantId && !r.IsDeleted),
                    ur => ur.RoleId,
                    r => r.Id,
                    (_, role) => role.Name)
                .ToListAsync();

            Assert.Contains(RoleCatalog.AdminRoleName, mappedRoleNames);
        }

        [Fact]
        public async Task EnsureDefaultAdmin_DoesNotCreateDuplicateAdmins_OnRepeatedRuns()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            tenantAccessor.SetTenantSchema("tenant_test");

            await using var db = CreateDbContext(Guid.NewGuid().ToString(), tenantAccessor);
            var configuration = BuildConfiguration();
            var service = new TenantProvisioningService(
                db,
                configuration,
                new TestEncryptionService(),
                new PasswordHasher<User>(),
                new RoleMappingResolver(configuration),
                NullLogger<TenantProvisioningService>.Instance);

            var tenant = new Tenant
            {
                Id = tenantId,
                Name = "Repair Tenant",
                Subdomain = "repair",
                IsActive = true,
                ProvisionStatus = TenantProvisioningService.ProvisionStates.Completed,
                CreatedAt = DateTime.UtcNow
            };

            db.Tenants.Add(tenant);
            await db.SaveChangesAsync();

            await InvokeEnsureDefaultAdminAsync(service, db, tenant, "admin@repair.local", "Repair Admin", "ADMIN", "TempPass#123");
            await InvokeEnsureDefaultAdminAsync(service, db, tenant, "admin@repair.local", "Repair Admin", "ADMIN", "TempPass#123");

            var adminUsers = await db.Users
                .IgnoreQueryFilters()
                .Where(u => u.TenantId == tenantId && !u.IsDeleted && u.Email == "admin@repair.local")
                .ToListAsync();

            Assert.Single(adminUsers);
            Assert.False(adminUsers[0].IsSystemAdmin);

            var activeMappings = await db.UserRoles
                .IgnoreQueryFilters()
                .Where(ur => ur.TenantId == tenantId && ur.UserId == adminUsers[0].Id && !ur.IsDeleted)
                .ToListAsync();

            Assert.Single(activeMappings);
        }

        private static async Task InvokeEnsureDefaultAdminAsync(
            TenantProvisioningService service,
            ApplicationDbContext tenantDb,
            Tenant tenant,
            string? adminEmail,
            string? adminName,
            string? adminRole,
            string? preferredPassword)
        {
            var method = typeof(TenantProvisioningService)
                .GetMethod("EnsureDefaultAdminAsync", BindingFlags.Instance | BindingFlags.NonPublic);

            Assert.NotNull(method);

            var task = (Task?)method!.Invoke(service, new object?[]
            {
                tenantDb,
                tenant,
                adminEmail,
                adminName,
                adminRole,
                preferredPassword,
                "test-correlation"
            });

            Assert.NotNull(task);
            await task!;
        }
    }
}
