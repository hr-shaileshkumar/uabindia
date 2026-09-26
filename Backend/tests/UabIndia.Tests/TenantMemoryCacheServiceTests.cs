using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class TenantMemoryCacheServiceTests
    {
        private readonly IMemoryCache _memoryCache;
        private readonly TestTenantAccessor _tenantAccessor;
        private readonly TenantMemoryCacheService _cacheService;

        public TenantMemoryCacheServiceTests()
        {
            _memoryCache = new MemoryCache(new MemoryCacheOptions());
            _tenantAccessor = new TestTenantAccessor();
            _cacheService = new TenantMemoryCacheService(_memoryCache, _tenantAccessor);
        }

        [Fact]
        public void BuildTenantKey_WithTenantId_FormatsCanonicalKey()
        {
            var tenantId = Guid.NewGuid();
            _tenantAccessor.SetTenantId(tenantId);

            var key = _cacheService.BuildTenantKey("lookup", "designation");

            Assert.Equal($"tenant:{tenantId:D}:lookup:designation", key);
        }

        [Fact]
        public void BuildTenantKey_WithEmptyTenantId_FormatsGlobalKey()
        {
            _tenantAccessor.SetTenantId(Guid.Empty);

            var key = _cacheService.BuildTenantKey("lookup", "country");

            Assert.Equal("tenant:global:lookup:country", key);
        }

        [Fact]
        public async Task GetOrSetLookupAsync_EnforcesTenantIsolation()
        {
            var tenantA = Guid.NewGuid();
            var tenantB = Guid.NewGuid();

            // Tenant A queries designation lookup
            _tenantAccessor.SetTenantId(tenantA);
            var resultA = await _cacheService.GetOrSetLookupAsync("designation", () => Task.FromResult<string?>("Architect - Tenant A"));

            // Tenant B queries designation lookup
            _tenantAccessor.SetTenantId(tenantB);
            var resultB = await _cacheService.GetOrSetLookupAsync("designation", () => Task.FromResult<string?>("Engineer - Tenant B"));

            Assert.Equal("Architect - Tenant A", resultA);
            Assert.Equal("Engineer - Tenant B", resultB);
            Assert.NotEqual(resultA, resultB);
        }

        [Fact]
        public async Task InvalidateLookup_PurgesOnlyCurrentTenantData()
        {
            var tenantA = Guid.NewGuid();
            var tenantB = Guid.NewGuid();

            // Seed both
            _tenantAccessor.SetTenantId(tenantA);
            await _cacheService.GetOrSetLookupAsync("designation", () => Task.FromResult<string?>("Tenant A Value"));

            _tenantAccessor.SetTenantId(tenantB);
            await _cacheService.GetOrSetLookupAsync("designation", () => Task.FromResult<string?>("Tenant B Value"));

            // Invalidate Tenant A only
            _tenantAccessor.SetTenantId(tenantA);
            _cacheService.InvalidateLookup("designation");

            // Verify Tenant A refetches while Tenant B is still cached
            var fetchCountA = 0;
            var fetchCountB = 0;

            _tenantAccessor.SetTenantId(tenantA);
            var reloadedA = await _cacheService.GetOrSetLookupAsync("designation", () =>
            {
                fetchCountA++;
                return Task.FromResult<string?>("Tenant A New Value");
            });

            _tenantAccessor.SetTenantId(tenantB);
            var reloadedB = await _cacheService.GetOrSetLookupAsync("designation", () =>
            {
                fetchCountB++;
                return Task.FromResult<string?>("Tenant B New Value");
            });

            Assert.Equal("Tenant A New Value", reloadedA);
            Assert.Equal(1, fetchCountA);

            Assert.Equal("Tenant B Value", reloadedB);
            Assert.Equal(0, fetchCountB); // Kept from cache
        }
    }
}
