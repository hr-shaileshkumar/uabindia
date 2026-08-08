using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using UabIndia.Api.Modules.CRM.Controllers;
using UabIndia.Api.Modules.Platform.Controllers;
using UabIndia.Api.Services;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    /// <summary>
    /// Regression tests for audit remediation phases 5–6 (VF-21, VF-22, VF-23, VF-26, VF-25).
    /// </summary>
    public sealed class AuditFixRegressionTests
    {
        [Fact]
        public async Task AdminSettings_InviteUser_DoesNotSetIsSystemAdmin_ForAdminRole()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            await using var db = CreateContext(tenantAccessor);

            var adminRole = SeedRole(db, tenantId, RoleCatalog.AdminRoleName);
            await db.SaveChangesAsync();

            var controller = new AdminSettingsController(db, tenantAccessor);
            var result = await controller.InviteUser(new InviteUserDto
            {
                Email = "new-admin@tenant.test",
                FullName = "New Admin",
                Role = "Admin",
            });

            var ok = Assert.IsType<OkObjectResult>(result);
            var createdUser = await db.Users.IgnoreQueryFilters()
                .FirstAsync(u => u.Email == "new-admin@tenant.test" && u.TenantId == tenantId);
            Assert.False(createdUser.IsSystemAdmin);

            var roleMapping = await db.UserRoles.IgnoreQueryFilters()
                .FirstOrDefaultAsync(ur => ur.UserId == createdUser.Id && ur.RoleId == adminRole.Id);
            Assert.NotNull(roleMapping);
            Assert.NotNull(ok.Value);
        }

        [Fact]
        public async Task AdminSettings_InviteUser_RejectsSuperAdminRole()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            await using var db = CreateContext(tenantAccessor);

            SeedRole(db, tenantId, RoleCatalog.SuperAdminRoleName);
            await db.SaveChangesAsync();

            var controller = new AdminSettingsController(db, tenantAccessor);
            var result = await controller.InviteUser(new InviteUserDto
            {
                Email = "super@tenant.test",
                FullName = "Super User",
                Role = "SuperAdmin",
            });

            Assert.IsType<BadRequestObjectResult>(result);
            Assert.False(await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == "super@tenant.test"));
        }

        [Fact]
        public async Task CrmCustomers_GetAll_CountMatchesTenantScopedResults()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantA = Guid.NewGuid();
            var tenantB = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantA);
            await using var db = CreateContext(tenantAccessor);

            db.Customers.AddRange(
                new Customer { CustomerCode = "A1", CustomerName = "Tenant A One", Status = "Active" },
                new Customer { CustomerCode = "A2", CustomerName = "Tenant A Two", Status = "Active" });
            await db.SaveChangesAsync();

            var tenantBAccessor = new TestTenantAccessor();
            tenantBAccessor.SetTenantId(tenantB);
            await using (var dbB = CreateContext(tenantBAccessor))
            {
                dbB.Customers.Add(new Customer { CustomerCode = "B1", CustomerName = "Tenant B One", Status = "Active" });
                await dbB.SaveChangesAsync();
            }

            var controller = new CustomersController(db, tenantAccessor);
            var result = await controller.GetAll(page: 1, limit: 10);
            var ok = Assert.IsType<OkObjectResult>(result);
            var json = JsonSerializer.Serialize(ok.Value);
            using var doc = JsonDocument.Parse(json);

            Assert.Equal(2, doc.RootElement.GetProperty("total").GetInt32());
            Assert.Equal(2, doc.RootElement.GetProperty("data").GetArrayLength());
        }

        [Fact]
        public async Task TenantResolution_ResolveByCustomDomain_UsesCustomDomainColumn()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            await using var db = CreateContext(tenantAccessor);
            var cache = new MemoryCache(new MemoryCacheOptions());

            db.Tenants.Add(new Tenant
            {
                Id = tenantId,
                Name = "Custom Domain Tenant",
                Subdomain = "custom-domain-tenant",
                IsActive = true,
            });
            db.TenantConfigs.Add(new TenantConfig
            {
                TenantId = tenantId,
                CustomDomain = "portal.example.com",
                ConfigJson = "{}",
            });
            await db.SaveChangesAsync();

            var service = new TenantResolutionService(db, cache);
            var resolved = await service.ResolveAsync(host: "portal.example.com");

            Assert.NotNull(resolved);
            Assert.Equal("custom-domain", resolved!.MatchType);
            Assert.Equal(tenantId, resolved.Tenant.Id);
        }

        [Fact]
        public async Task Helpdesk_ListTickets_DoesNotLeakCrossTenantUserEmails()
        {
            var tenantA = Guid.NewGuid();
            var tenantB = Guid.NewGuid();
            var foreignUserId = Guid.NewGuid();

            var tenantBAccessor = new TestTenantAccessor();
            tenantBAccessor.SetTenantId(tenantB);
            await using (var dbB = CreateContext(tenantBAccessor))
            {
                dbB.Users.Add(new User
                {
                    Id = foreignUserId,
                    Email = "secret-b@other-tenant.test",
                    PasswordHash = "hash",
                    IsActive = true,
                });
                await dbB.SaveChangesAsync();
            }

            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(tenantA);
            await using var db = CreateContext(tenantAccessor);
            db.HelpdeskTickets.Add(new HelpdeskTicket
            {
                TenantId = tenantA,
                TicketNumber = "TKT-001",
                Subject = "VPN issue",
                Description = "Cannot connect",
                Category = "IT",
                Priority = "High",
                Status = "Open",
                RequesterUserId = foreignUserId,
            });
            await db.SaveChangesAsync();

            var controller = new HelpdeskController(db, tenantAccessor);
            var result = await controller.ListTickets();
            var ok = Assert.IsType<OkObjectResult>(result);
            var json = JsonSerializer.Serialize(ok.Value);

            Assert.DoesNotContain("secret-b@other-tenant.test", json, StringComparison.Ordinal);
            Assert.Contains(foreignUserId.ToString(), json, StringComparison.Ordinal);
        }

        private static Role SeedRole(ApplicationDbContext db, Guid tenantId, string roleName)
        {
            var role = new Role
            {
                TenantId = tenantId,
                Name = roleName,
                Description = $"{roleName} role",
            };
            db.Roles.Add(role);
            return role;
        }

        private static ApplicationDbContext CreateContext(TestTenantAccessor tenantAccessor)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            return new ApplicationDbContext(options, tenantAccessor, new TestEncryptionService());
        }
    }
}
