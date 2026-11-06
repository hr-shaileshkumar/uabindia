using System;
using System.Threading.Tasks;

namespace UabIndia.Core.Services
{
    /// <summary>
    /// Distributed cache service for tenant-scoped data caching.
    /// </summary>
    public interface ICacheService
    {
        /// <summary>
        /// Gets a value from cache.
        /// </summary>
        Task<T?> GetAsync<T>(string key) where T : class;

        /// <summary>
        /// Sets a value in cache with optional expiration.
        /// </summary>
        Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class;

        /// <summary>
        /// Removes a value from cache.
        /// </summary>
        Task RemoveAsync(string key);

        /// <summary>
        /// Removes all cache entries with a given prefix (tenant-scoped).
        /// </summary>
        Task RemoveByPrefixAsync(string prefix);

        /// <summary>
        /// Gets or sets a value with a factory function.
        /// </summary>
        Task<T?> GetOrSetAsync<T>(string key, Func<Task<T?>> factory, TimeSpan? expiration = null) where T : class;
    }
}
