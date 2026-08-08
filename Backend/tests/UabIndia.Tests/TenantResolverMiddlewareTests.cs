using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using UabIndia.Api.Middleware;
using UabIndia.Api.Services;
using UabIndia.Infrastructure.Data;
using UabIndia.Tests.TestUtilities;

namespace UabIndia.Tests
{
    public class TenantResolverMiddlewareTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly MemoryCache _cache;

        public TenantResolverMiddlewareTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options, new TestTenantAccessor(), new TestEncryptionService());
            _cache = new MemoryCache(new MemoryCacheOptions());
        }

        [Fact]
        public async Task Invoke_UsesAuthenticatedTenantClaim_WhenHostResolutionFails()
        {
            var tenantId = Guid.NewGuid();
            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(Guid.Empty);
            tenantAccessor.SetTenantSchema(null);
            var nextCalled = false;
            var middleware = new TenantResolverMiddleware(_ =>
            {
                nextCalled = true;
                return Task.CompletedTask;
            });
            var tenantResolutionService = new TenantResolutionService(_context, _cache);
            var context = new DefaultHttpContext();
            context.Request.Path = "/api/v1/auth/me";
            context.Request.Host = new HostString("localhost");
            context.User = new ClaimsPrincipal(
                new ClaimsIdentity(
                    new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                        new Claim("tenant_id", tenantId.ToString()),
                    },
                    "TestAuth"));

            await middleware.Invoke(context, tenantAccessor, tenantResolutionService);

            Assert.True(nextCalled);
            Assert.Equal(tenantId, tenantAccessor.GetTenantId());
            Assert.Equal($"tenant_{tenantId:N}", tenantAccessor.GetTenantSchema());
        }

        [Fact]
        public async Task Invoke_ReturnsBadRequest_WhenProtectedRequestHasNoTenantContext()
        {
            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(Guid.Empty);
            tenantAccessor.SetTenantSchema(null);
            var middleware = new TenantResolverMiddleware(_ => Task.CompletedTask);
            var tenantResolutionService = new TenantResolutionService(_context, _cache);
            var context = new DefaultHttpContext();
            context.Request.Path = "/api/v1/auth/me";
            context.Request.Host = new HostString("localhost");

            await middleware.Invoke(context, tenantAccessor, tenantResolutionService);

            Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
            Assert.Equal(Guid.Empty, tenantAccessor.GetTenantId());
        }

        [Fact]
        public async Task Invoke_ReturnsForbidden_WhenHeaderTenantGuidDiffersFromAuthenticatedClaim()
        {
            var callerTenantId = Guid.NewGuid();
            var victimTenantId = Guid.NewGuid();
            var sentinelTenantId = Guid.NewGuid();

            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(sentinelTenantId);
            var nextCalled = false;
            var middleware = new TenantResolverMiddleware(_ =>
            {
                nextCalled = true;
                return Task.CompletedTask;
            });
            var context = BuildContext("/api/v1/employees", authenticatedTenantId: callerTenantId);
            context.Request.Headers["X-Tenant"] = victimTenantId.ToString();

            await middleware.Invoke(context, tenantAccessor, new TenantResolutionService(_context, _cache));

            Assert.Equal(StatusCodes.Status403Forbidden, context.Response.StatusCode);
            Assert.False(nextCalled);
            Assert.Equal(sentinelTenantId, tenantAccessor.GetTenantId());
        }

        [Fact]
        public async Task Invoke_AllowsHeaderTenant_WhenGuidMatchesAuthenticatedClaim()
        {
            var tenantId = Guid.NewGuid();
            var tenantAccessor = new TestTenantAccessor();
            var nextCalled = false;
            var middleware = new TenantResolverMiddleware(_ =>
            {
                nextCalled = true;
                return Task.CompletedTask;
            });
            var context = BuildContext("/api/v1/employees", authenticatedTenantId: tenantId);
            context.Request.Headers["X-Tenant"] = tenantId.ToString();

            await middleware.Invoke(context, tenantAccessor, new TenantResolutionService(_context, _cache));

            Assert.True(nextCalled);
            Assert.Equal(tenantId, tenantAccessor.GetTenantId());
        }

        [Fact]
        public async Task Invoke_AllowsCrossTenantHeader_WhenCallerIsSuperAdmin()
        {
            var callerTenantId = Guid.NewGuid();
            var otherTenantId = Guid.NewGuid();
            var tenantAccessor = new TestTenantAccessor();
            var nextCalled = false;
            var middleware = new TenantResolverMiddleware(_ =>
            {
                nextCalled = true;
                return Task.CompletedTask;
            });
            var context = BuildContext("/api/v1/employees", authenticatedTenantId: callerTenantId, roles: new[] { "SuperAdmin" });
            context.Request.Headers["X-Tenant"] = otherTenantId.ToString();

            await middleware.Invoke(context, tenantAccessor, new TenantResolutionService(_context, _cache));

            Assert.True(nextCalled);
            Assert.Equal(otherTenantId, tenantAccessor.GetTenantId());
        }

        [Fact]
        public async Task Invoke_AllowsHeaderTenant_WhenRequestIsAnonymous()
        {
            // Pre-authentication flows (login on a tenant subdomain) must keep working.
            var tenantId = Guid.NewGuid();
            var tenantAccessor = new TestTenantAccessor();
            var nextCalled = false;
            var middleware = new TenantResolverMiddleware(_ =>
            {
                nextCalled = true;
                return Task.CompletedTask;
            });
            var context = BuildContext("/api/v1/auth/login", authenticatedTenantId: null);
            context.Request.Headers["X-Tenant"] = tenantId.ToString();

            await middleware.Invoke(context, tenantAccessor, new TenantResolutionService(_context, _cache));

            Assert.True(nextCalled);
            Assert.Equal(tenantId, tenantAccessor.GetTenantId());
        }

        [Fact]
        public async Task Invoke_ReturnsForbidden_WhenHeaderSubdomainResolvesToDifferentTenant()
        {
            var victimTenantId = await SeedTenantAsync("victimco");
            var callerTenantId = Guid.NewGuid();
            var sentinelTenantId = Guid.NewGuid();

            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(sentinelTenantId);
            var nextCalled = false;
            var middleware = new TenantResolverMiddleware(_ =>
            {
                nextCalled = true;
                return Task.CompletedTask;
            });
            var context = BuildContext("/api/v1/employees", authenticatedTenantId: callerTenantId);
            context.Request.Headers["X-Tenant"] = "victimco";

            await middleware.Invoke(context, tenantAccessor, new TenantResolutionService(_context, _cache));

            Assert.NotEqual(callerTenantId, victimTenantId);
            Assert.Equal(StatusCodes.Status403Forbidden, context.Response.StatusCode);
            Assert.False(nextCalled);
            Assert.Equal(sentinelTenantId, tenantAccessor.GetTenantId());
        }

        [Fact]
        public async Task Invoke_ReturnsForbidden_WhenHostResolvesToDifferentTenant()
        {
            var victimTenantId = await SeedTenantAsync("victimhost");
            var callerTenantId = Guid.NewGuid();
            var sentinelTenantId = Guid.NewGuid();

            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(sentinelTenantId);
            var nextCalled = false;
            var middleware = new TenantResolverMiddleware(_ =>
            {
                nextCalled = true;
                return Task.CompletedTask;
            });
            var context = BuildContext("/api/v1/employees", authenticatedTenantId: callerTenantId);
            context.Request.Host = new HostString("victimhost.uabindia.com");

            await middleware.Invoke(context, tenantAccessor, new TenantResolutionService(_context, _cache));

            Assert.NotEqual(callerTenantId, victimTenantId);
            Assert.Equal(StatusCodes.Status403Forbidden, context.Response.StatusCode);
            Assert.False(nextCalled);
            Assert.Equal(sentinelTenantId, tenantAccessor.GetTenantId());
        }

        private async Task<Guid> SeedTenantAsync(string subdomain)
        {
            var tenant = new UabIndia.Core.Entities.Tenant
            {
                Id = Guid.NewGuid(),
                Name = subdomain,
                Subdomain = subdomain,
                IsActive = true
            };
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();
            return tenant.Id;
        }

        private static DefaultHttpContext BuildContext(string path, Guid? authenticatedTenantId, string[]? roles = null)
        {
            var context = new DefaultHttpContext();
            context.Request.Path = path;
            context.Request.Host = new HostString("localhost");

            if (authenticatedTenantId is null)
            {
                return context;
            }

            var claims = new System.Collections.Generic.List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim("tenant_id", authenticatedTenantId.Value.ToString())
            };
            foreach (var role in roles ?? Array.Empty<string>())
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
            return context;
        }

        public void Dispose()
        {
            _cache.Dispose();
            _context.Dispose();
        }
    }
}
