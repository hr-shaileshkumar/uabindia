using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;

namespace UabIndia.Infrastructure.Services
{
    /// <summary>
    /// Thread-safe in-memory cache implementing tenant-isolated caching boundaries.
    /// Eliminates cross-tenant cache contamination using standard keys: tenant:{tenantId}:lookup:{type}.
    /// </summary>
    public class TenantMemoryCacheService : ITenantCacheService
    {
        private static readonly ConcurrentDictionary<string, byte> KeyRegistry = new(StringComparer.OrdinalIgnoreCase);

        private readonly IMemoryCache _memoryCache;
        private readonly ITenantAccessor _tenantAccessor;

        public TenantMemoryCacheService(IMemoryCache memoryCache, ITenantAccessor tenantAccessor)
        {
            _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
            _tenantAccessor = tenantAccessor ?? throw new ArgumentNullException(nameof(tenantAccessor));
        }

        public string BuildTenantKey(string category, string key)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var tenantSlug = (tenantId == Guid.Empty) ? "global" : tenantId.ToString("D");
            var cleanCat = (category ?? "default").Trim().ToLowerInvariant();
            var cleanKey = (key ?? string.Empty).Trim().ToLowerInvariant();

            return $"tenant:{tenantSlug}:{cleanCat}:{cleanKey}";
        }

        public async Task<T?> GetOrSetLookupAsync<T>(
            string lookupType,
            Func<Task<T?>> factory,
            TimeSpan? expiration = null) where T : class
        {
            // Lookup tables (countries, states, currencies, designations) have a long default TTL (30 min)
            var ttl = expiration ?? TimeSpan.FromMinutes(30);
            return await GetOrSetAsync("lookup", lookupType, factory, ttl);
        }

        public async Task<T?> GetOrSetAsync<T>(
            string category,
            string key,
            Func<Task<T?>> factory,
            TimeSpan? expiration = null) where T : class
        {
            if (string.IsNullOrWhiteSpace(key))
                return await factory();

            var fullKey = BuildTenantKey(category, key);

            if (_memoryCache.TryGetValue(fullKey, out T? cachedValue) && cachedValue != null)
            {
                return cachedValue;
            }

            var freshValue = await factory();
            if (freshValue != null)
            {
                var cacheOptions = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromMinutes(10),
                    SlidingExpiration = TimeSpan.FromMinutes(3)
                };

                // Track key in registry so category/lookup invalidation can purge it
                cacheOptions.RegisterPostEvictionCallback((evictedKey, _, _, _) =>
                {
                    KeyRegistry.TryRemove(evictedKey.ToString() ?? string.Empty, out _);
                });

                _memoryCache.Set(fullKey, freshValue, cacheOptions);
                KeyRegistry.TryAdd(fullKey, 0);
            }

            return freshValue;
        }

        public void InvalidateLookup(string lookupType)
        {
            var fullKey = BuildTenantKey("lookup", lookupType);
            _memoryCache.Remove(fullKey);
            KeyRegistry.TryRemove(fullKey, out _);
        }

        public void InvalidateCategory(string category)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var tenantSlug = (tenantId == Guid.Empty) ? "global" : tenantId.ToString("D");
            var prefix = $"tenant:{tenantSlug}:{(category ?? "").Trim().ToLowerInvariant()}:";

            var matchingKeys = KeyRegistry.Keys
                .Where(k => k.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                .ToList();

            foreach (var key in matchingKeys)
            {
                _memoryCache.Remove(key);
                KeyRegistry.TryRemove(key, out _);
            }
        }
    }
}
