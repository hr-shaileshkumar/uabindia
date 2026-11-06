using System;
using System.Threading.Tasks;

namespace UabIndia.Core.Services
{
    /// <summary>
    /// Tenant-aware in-memory cache service providing safe isolation for lookup and metadata caching.
    /// Prevents cross-tenant cache contamination using standard keys: tenant:{tenantId}:lookup:{type}
    /// </summary>
    public interface ITenantCacheService
    {
        /// <summary>
        /// Retrieves or sets a tenant-isolated lookup value (e.g. country, state, currency, designation).
        /// Key formatted as: tenant:{tenantId}:lookup:{lookupType}
        /// </summary>
        Task<T?> GetOrSetLookupAsync<T>(
            string lookupType,
            Func<Task<T?>> factory,
            TimeSpan? expiration = null) where T : class;

        /// <summary>
        /// Retrieves or sets a general tenant-isolated cache entry.
        /// Key formatted as: tenant:{tenantId}:{category}:{key}
        /// </summary>
        Task<T?> GetOrSetAsync<T>(
            string category,
            string key,
            Func<Task<T?>> factory,
            TimeSpan? expiration = null) where T : class;

        /// <summary>
        /// Invalidates a specific tenant-scoped lookup type.
        /// </summary>
        void InvalidateLookup(string lookupType);

        /// <summary>
        /// Invalidates all keys within a category for the current tenant.
        /// </summary>
        void InvalidateCategory(string category);

        /// <summary>
        /// Generates the canonical tenant-isolated cache key.
        /// </summary>
        string BuildTenantKey(string category, string key);
    }
}
