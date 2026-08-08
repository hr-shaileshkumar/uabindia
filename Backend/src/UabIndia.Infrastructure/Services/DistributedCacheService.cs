using Microsoft.Extensions.Caching.Distributed;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using UabIndia.Core.Services;

namespace UabIndia.Infrastructure.Services
{
    /// <summary>
    /// Distributed cache service implementation using Redis or in-memory fallback.
    /// </summary>
    public class DistributedCacheService : ICacheService
    {
        private static readonly ConcurrentDictionary<string, byte> TrackedKeys = new(StringComparer.Ordinal);

        private readonly IDistributedCache _cache;

        public DistributedCacheService(IDistributedCache cache)
        {
            _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        }

        /// <summary>
        /// Gets a value from cache.
        /// </summary>
        public async Task<T?> GetAsync<T>(string key) where T : class
        {
            if (string.IsNullOrWhiteSpace(key))
                return null;

            try
            {
                var value = await _cache.GetStringAsync(key);
                if (string.IsNullOrEmpty(value))
                    return null;

                return JsonSerializer.Deserialize<T>(value);
            }
            catch
            {
                // Log cache read error but don't fail request
                return null;
            }
        }

        /// <summary>
        /// Sets a value in cache with optional expiration.
        /// </summary>
        public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class
        {
            if (string.IsNullOrWhiteSpace(key) || value == null)
                return;

            try
            {
                var json = JsonSerializer.Serialize(value);
                var options = new DistributedCacheEntryOptions();
                
                if (expiration.HasValue)
                    options.AbsoluteExpirationRelativeToNow = expiration;
                else
                    options.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10); // Default 10 min

                await _cache.SetStringAsync(key, json, options);
                TrackedKeys.TryAdd(key, 0);
            }
            catch
            {
                // Log cache write error but don't fail request
            }
        }

        /// <summary>
        /// Removes a value from cache.
        /// </summary>
        public async Task RemoveAsync(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
                return;

            try
            {
                await _cache.RemoveAsync(key);
                TrackedKeys.TryRemove(key, out _);
            }
            catch
            {
                // Log cache remove error but don't fail request
            }
        }

        /// <summary>
        /// Removes all cache entries with a given prefix.
        /// </summary>
        public async Task RemoveByPrefixAsync(string prefix)
        {
            if (string.IsNullOrWhiteSpace(prefix))
                return;

            try
            {
                var keysToRemove = TrackedKeys.Keys
                    .Where(key => key.StartsWith(prefix, StringComparison.Ordinal))
                    .ToList();

                foreach (var key in keysToRemove)
                {
                    await RemoveAsync(key);
                }
            }
            catch
            {
                // Log cache prefix remove error but don't fail request
            }
        }

        /// <summary>
        /// Gets or sets a value with a factory function (cache-aside pattern).
        /// </summary>
        public async Task<T?> GetOrSetAsync<T>(string key, Func<Task<T?>> factory, TimeSpan? expiration = null) where T : class
        {
            if (string.IsNullOrWhiteSpace(key))
                return await factory();

            try
            {
                // Try to get from cache
                var cached = await GetAsync<T>(key);
                if (cached != null)
                    return cached;

                // Cache miss, call factory
                var value = await factory();
                if (value != null)
                    await SetAsync(key, value, expiration);

                return value;
            }
            catch
            {
                // Cache error, fall back to factory
                return await factory();
            }
        }
    }
}
