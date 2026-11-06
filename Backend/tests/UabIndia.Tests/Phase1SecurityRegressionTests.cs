using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using UabIndia.Api.Middleware;
using UabIndia.Api.Modules.Administration.Controllers;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class Phase1SecurityRegressionTests : IDisposable
    {
        private readonly ApplicationDbContext _db;
        private readonly MemoryCache _cache;
        private readonly TestTenantAccessor _tenantAccessor;

        public Phase1SecurityRegressionTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _tenantAccessor = new TestTenantAccessor();
            _db = new ApplicationDbContext(options, _tenantAccessor, new TestEncryptionService());
            _cache = new MemoryCache(new MemoryCacheOptions());
        }

        public void Dispose()
        {
            _db.Dispose();
            _cache.Dispose();
        }

        [Fact]
        public void BillingController_Exposes_Versioned_V1_Route()
        {
            // Verify that BillingController declares [Route("api/v1/billing")]
            // preventing the legacy sunset middleware from returning HTTP 410 Gone.
            var routes = typeof(BillingController)
                .GetCustomAttributes(typeof(RouteAttribute), false)
                .Cast<RouteAttribute>()
                .Select(r => r.Template)
                .ToList();

            Assert.Contains("api/v1/billing", routes);
        }

        [Fact]
        public async Task OrgScopeMiddleware_AdminWithForeignCompanyId_ReturnsForbidden()
        {
            // Arrange: Setup Tenant A (caller) and Tenant B (foreign)
            var tenantA = Guid.NewGuid();
            var tenantB = Guid.NewGuid();
            _tenantAccessor.SetTenantId(tenantA);

            var foreignCompany = new Company
            {
                Id = Guid.NewGuid(),
                TenantId = tenantB,
                Name = "Foreign Subsidiary",
                Code = "FOR-01",
                IsActive = true
            };
            _db.Companies.Add(foreignCompany);
            await _db.SaveChangesAsync();

            var nextCalled = false;
            var middleware = new OrgScopeMiddleware(
                _ =>
                {
                    nextCalled = true;
                    return Task.CompletedTask;
                },
                NullLogger<OrgScopeMiddleware>.Instance);

            var context = new DefaultHttpContext();
            context.Request.Method = "POST";
            context.Request.RouteValues["controller"] = "Employees";
            context.Request.Headers["X-Company-Id"] = foreignCompany.Id.ToString();

            // Caller is an authenticated Admin in Tenant A
            context.User = new ClaimsPrincipal(new ClaimsIdentity(
                new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                    new Claim("tenant_id", tenantA.ToString()),
                    new Claim(ClaimTypes.Role, "Admin")
                },
                "TestAuth"));

            // Act
            await middleware.InvokeAsync(context, _db, _tenantAccessor, _cache);

            // Assert: Admin should NOT be allowed to stamp Tenant B's company
            Assert.False(nextCalled, "Middleware should have blocked execution for foreign company ID");
            Assert.Equal(StatusCodes.Status403Forbidden, context.Response.StatusCode);
        }

        [Fact]
        public async Task OrgScopeMiddleware_AdminWithValidTenantCompany_AllowsExecution()
        {
            // Arrange: Setup Tenant A and its legitimate company
            var tenantA = Guid.NewGuid();
            _tenantAccessor.SetTenantId(tenantA);

            var legitimateCompany = new Company
            {
                Id = Guid.NewGuid(),
                TenantId = tenantA,
                Name = "Legitimate Company",
                Code = "LEG-01",
                IsActive = true
            };
            _db.Companies.Add(legitimateCompany);
            await _db.SaveChangesAsync();

            var nextCalled = false;
            var middleware = new OrgScopeMiddleware(
                _ =>
                {
                    nextCalled = true;
                    return Task.CompletedTask;
                },
                NullLogger<OrgScopeMiddleware>.Instance);

            var context = new DefaultHttpContext();
            context.Request.Method = "POST";
            context.Request.RouteValues["controller"] = "Employees";
            context.Request.Headers["X-Company-Id"] = legitimateCompany.Id.ToString();

            context.User = new ClaimsPrincipal(new ClaimsIdentity(
                new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                    new Claim("tenant_id", tenantA.ToString()),
                    new Claim(ClaimTypes.Role, "Admin")
                },
                "TestAuth"));

            // Act
            await middleware.InvokeAsync(context, _db, _tenantAccessor, _cache);

            // Assert: Legitimate same-tenant company request proceeds
            Assert.True(nextCalled, "Middleware should allow execution for valid same-tenant company ID");
            Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
            Assert.Equal(legitimateCompany.Id, _tenantAccessor.GetCompanyId());
        }

        [Fact]
        public async Task OrgScopeMiddleware_AdminWithForeignProjectId_ReturnsForbidden()
        {
            // Arrange: Setup Tenant A and a project belonging to Tenant B
            var tenantA = Guid.NewGuid();
            var tenantB = Guid.NewGuid();
            _tenantAccessor.SetTenantId(tenantA);

            var companyA = new Company
            {
                Id = Guid.NewGuid(),
                TenantId = tenantA,
                Name = "Tenant A Company",
                Code = "TAC-01",
                IsActive = true
            };
            var foreignProject = new Project
            {
                Id = Guid.NewGuid(),
                TenantId = tenantB,
                CompanyId = Guid.NewGuid(),
                Name = "Foreign Project",
                ProjectCode = "FP-01",
                IsActive = true
            };
            _db.Companies.Add(companyA);
            _db.Projects.Add(foreignProject);
            await _db.SaveChangesAsync();

            var nextCalled = false;
            var middleware = new OrgScopeMiddleware(
                _ =>
                {
                    nextCalled = true;
                    return Task.CompletedTask;
                },
                NullLogger<OrgScopeMiddleware>.Instance);

            var context = new DefaultHttpContext();
            context.Request.Method = "POST";
            context.Request.RouteValues["controller"] = "Employees";
            context.Request.Headers["X-Company-Id"] = companyA.Id.ToString();
            context.Request.Headers["X-Project-Id"] = foreignProject.Id.ToString();

            context.User = new ClaimsPrincipal(new ClaimsIdentity(
                new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                    new Claim("tenant_id", tenantA.ToString()),
                    new Claim(ClaimTypes.Role, "Admin")
                },
                "TestAuth"));

            // Act
            await middleware.InvokeAsync(context, _db, _tenantAccessor, _cache);

            // Assert: Foreign project ID must be rejected
            Assert.False(nextCalled, "Middleware should have blocked execution for foreign project ID");
            Assert.Equal(StatusCodes.Status403Forbidden, context.Response.StatusCode);
        }
    }
}
