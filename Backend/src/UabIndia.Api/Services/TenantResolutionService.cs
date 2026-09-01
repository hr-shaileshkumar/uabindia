using System;
using System.Linq;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Services
{
    public sealed class TenantResolutionResult
    {
        public Tenant Tenant { get; init; } = null!;
        public string MatchType { get; init; } = "subdomain";
        public string? RequestedHost { get; init; }
        public string? CustomDomain { get; init; }
    }

    public sealed class TenantResolutionService
    {
        private static readonly HashSet<string> ReservedHostLabels = new(StringComparer.OrdinalIgnoreCase)
        {
            "app", "api", "www", "localhost", "127.0.0.1", "::1", "0.0.0.0"
        };
        private readonly ApplicationDbContext _db;
        private readonly IMemoryCache _cache;

        public TenantResolutionService(ApplicationDbContext db, IMemoryCache cache)
        {
            _db = db;
            _cache = cache;
        }

        public async Task<TenantResolutionResult?> ResolveAsync(
            string? subdomain = null,
            string? host = null,
            CancellationToken cancellationToken = default)
        {
            var normalizedHost = NormalizeHost(host);
            if (!string.IsNullOrWhiteSpace(normalizedHost))
            {
                if (!IsNonTenantOrLocalHost(normalizedHost))
                {
                    var customDomainMatch = await ResolveByCustomDomainAsync(normalizedHost, cancellationToken);
                    if (customDomainMatch != null)
                    {
                        return customDomainMatch;
                    }
                }

                subdomain ??= ExtractSubdomain(normalizedHost);
            }

            if (string.IsNullOrWhiteSpace(subdomain))
            {
                return null;
            }

            return await ResolveBySubdomainAsync(subdomain.Trim().ToLowerInvariant(), cancellationToken);
        }

        public static bool IsNonTenantOrLocalHost(string? host)
        {
            if (string.IsNullOrWhiteSpace(host)) return true;
            var normalized = NormalizeHost(host);
            if (ReservedHostLabels.Contains(normalized))
            {
                return true;
            }
            if (normalized.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
            if (System.Net.IPAddress.TryParse(normalized, out _))
            {
                return true;
            }
            return false;
        }

        public static string NormalizeHost(string? value)
        {
            var host = (value ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(host))
            {
                return string.Empty;
            }

            if (host.Contains("://", StringComparison.Ordinal) && Uri.TryCreate(host, UriKind.Absolute, out var absoluteUri))
            {
                host = absoluteUri.Host;
            }
            else
            {
                var separators = new[] { '/', '?', '#' };
                var separatorIndex = host.IndexOfAny(separators);
                if (separatorIndex >= 0)
                {
                    host = host[..separatorIndex];
                }
            }

            host = host.Trim().TrimEnd('.');

            if (host.StartsWith("[", StringComparison.Ordinal))
            {
                var closingBracketIndex = host.IndexOf(']');
                if (closingBracketIndex >= 0)
                {
                    return host[1..closingBracketIndex].ToLowerInvariant();
                }
            }

            var colonIndex = host.LastIndexOf(':');
            if (colonIndex > 0 && host.Count(ch => ch == ':') == 1)
            {
                host = host[..colonIndex];
            }

            return host.ToLowerInvariant();
        }

        public static bool DomainsMatch(string? requestedHost, string? configuredDomain)
        {
            var normalizedRequestedHost = NormalizeHost(requestedHost);
            var normalizedConfiguredDomain = NormalizeHost(configuredDomain);
            if (string.IsNullOrWhiteSpace(normalizedRequestedHost) || string.IsNullOrWhiteSpace(normalizedConfiguredDomain))
            {
                return false;
            }

            return string.Equals(normalizedRequestedHost, normalizedConfiguredDomain, StringComparison.OrdinalIgnoreCase)
                || string.Equals(StripLeadingWww(normalizedRequestedHost), StripLeadingWww(normalizedConfiguredDomain), StringComparison.OrdinalIgnoreCase);
        }

        private async Task<TenantResolutionResult?> ResolveBySubdomainAsync(string subdomain, CancellationToken cancellationToken)
        {
            if (ReservedHostLabels.Contains(subdomain))
            {
                return null;
            }

            var cacheKey = $"tenant:subdomain:{subdomain}";
            if (_cache.TryGetValue(cacheKey, out TenantResolutionResult? cachedResult))
            {
                return cachedResult;
            }

            var tenant = await _db.Tenants
                .IgnoreQueryFilters()
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Subdomain == subdomain && !t.IsDeleted, cancellationToken);

            var result = tenant == null
                ? null
                : new TenantResolutionResult
                {
                    Tenant = tenant,
                    MatchType = "subdomain"
                };

            _cache.Set(cacheKey, result, new MemoryCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromMinutes(result != null ? 30 : 5)
            });

            return result;
        }

        private async Task<TenantResolutionResult?> ResolveByCustomDomainAsync(string normalizedHost, CancellationToken cancellationToken)
        {
            if (IsNonTenantOrLocalHost(normalizedHost))
            {
                return null;
            }

            var cacheKey = $"tenant:host:{normalizedHost}";
            if (_cache.TryGetValue(cacheKey, out TenantResolutionResult? cachedResult))
            {
                return cachedResult;
            }

            var hostWithoutWww = StripLeadingWww(normalizedHost);
            var hostWithWww = normalizedHost.StartsWith("www.", StringComparison.OrdinalIgnoreCase)
                ? normalizedHost
                : $"www.{normalizedHost}";

            var match = await _db.TenantConfigs
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(config =>
                    !config.IsDeleted
                    && config.CustomDomain != null
                    && (config.CustomDomain == normalizedHost
                        || config.CustomDomain == hostWithoutWww
                        || config.CustomDomain == hostWithWww))
                .Join(
                    _db.Tenants.IgnoreQueryFilters().AsNoTracking().Where(tenant => !tenant.IsDeleted),
                    config => config.TenantId,
                    tenant => tenant.Id,
                    (config, tenant) => new { tenant, config.CustomDomain })
                .FirstOrDefaultAsync(cancellationToken);

            var result = match == null
                ? null
                : new TenantResolutionResult
                {
                    Tenant = match.tenant,
                    MatchType = "custom-domain",
                    RequestedHost = normalizedHost,
                    CustomDomain = NormalizeHost(match.CustomDomain)
                };

            _cache.Set(cacheKey, result, new MemoryCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromMinutes(result != null ? 30 : 5)
            });

            return result;
        }

        private static string? ExtractSubdomain(string host)
        {
            if (string.IsNullOrWhiteSpace(host))
            {
                return null;
            }

            var parts = host.Split('.', StringSplitOptions.RemoveEmptyEntries);
            if (host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase) && parts.Length >= 2)
            {
                var candidate = parts[0];
                return ReservedHostLabels.Contains(candidate, StringComparer.OrdinalIgnoreCase) ? null : candidate;
            }

            if (parts.Length < 3)
            {
                return null;
            }

            var subdomain = parts[0];
            return ReservedHostLabels.Contains(subdomain, StringComparer.OrdinalIgnoreCase) ? null : subdomain;
        }

        private static string? ReadCustomDomain(string? configJson)
        {
            if (string.IsNullOrWhiteSpace(configJson))
            {
                return null;
            }

            try
            {
                var root = JsonNode.Parse(configJson) as JsonObject;
                var profile = root?["tenantProfile"] as JsonObject;
                return profile?["customDomain"]?.GetValue<string>();
            }
            catch
            {
                return null;
            }
        }

        private static string StripLeadingWww(string value)
        {
            return value.StartsWith("www.", StringComparison.OrdinalIgnoreCase)
                ? value[4..]
                : value;
        }
    }
}
