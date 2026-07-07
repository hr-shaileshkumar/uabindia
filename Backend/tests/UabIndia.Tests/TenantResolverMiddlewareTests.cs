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

        public void Dispose()
        {
            _cache.Dispose();
            _context.Dispose();
        }
    }
}
