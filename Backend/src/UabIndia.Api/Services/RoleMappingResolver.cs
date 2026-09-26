using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Configuration;
using UabIndia.Core.Authorization;

namespace UabIndia.Api.Services
{
    public sealed class RoleMappingResolver
    {
        private const string SectionPath = "TenantProvisioning:RoleMappings";
        private readonly IConfiguration _configuration;

        public RoleMappingResolver(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string ResolveAdminRole(string? requestedRole)
        {
            var allowed = GetAllowedAdminRoles();
            var fallback = GetDefaultAdminRole();

            if (string.IsNullOrWhiteSpace(requestedRole))
            {
                return fallback;
            }

            var normalizedRequested = RoleCatalog.Normalize(requestedRole);
            var match = allowed.FirstOrDefault(role =>
                string.Equals(RoleCatalog.Normalize(role), normalizedRequested, StringComparison.OrdinalIgnoreCase));

            return string.IsNullOrWhiteSpace(match) ? fallback : match;
        }

        public string ResolveEmployeeRole(string? requestedRole)
        {
            var allowed = GetAllowedEmployeeRoles();
            var fallback = GetDefaultEmployeeRole();

            if (string.IsNullOrWhiteSpace(requestedRole))
            {
                return fallback;
            }

            var normalizedRequested = RoleCatalog.Normalize(requestedRole);
            var match = allowed.FirstOrDefault(role =>
                string.Equals(RoleCatalog.Normalize(role), normalizedRequested, StringComparison.OrdinalIgnoreCase));

            return string.IsNullOrWhiteSpace(match) ? fallback : match;
        }

        public IReadOnlyCollection<string> GetAllowedAdminRoles() =>
            GetConfiguredRoleSet(
                "AllowedAdminRoles",
                new[] { RoleCatalog.AdminRoleName },
                RoleCatalog.AdminRoleName,
                canonicalizeKnownRoles: true);

        public IReadOnlyCollection<string> GetAllowedEmployeeRoles() =>
            GetConfiguredRoleSet(
                "AllowedEmployeeRoles",
                new[] { RoleCatalog.EmployeeRoleName },
                RoleCatalog.EmployeeRoleName);

        public string GetDefaultAdminRole() =>
            ResolveConfiguredDefault(
                key: "DefaultAdminRole",
                allowed: GetAllowedAdminRoles(),
                fallback: RoleCatalog.AdminRoleName);

        public string GetDefaultEmployeeRole() =>
            ResolveConfiguredDefault(
                key: "DefaultEmployeeRole",
                allowed: GetAllowedEmployeeRoles(),
                fallback: RoleCatalog.EmployeeRoleName);

        private IReadOnlyCollection<string> GetConfiguredRoleSet(
            string key,
            IEnumerable<string> fallback,
            string ensureIncluded,
            bool canonicalizeKnownRoles = false)
        {
            var configured = _configuration.GetSection($"{SectionPath}:{key}").Get<string[]>() ?? Array.Empty<string>();

            var values = new List<string>();
            foreach (var value in configured)
            {
                if (string.IsNullOrWhiteSpace(value))
                {
                    continue;
                }

                var normalized = canonicalizeKnownRoles
                    ? CanonicalizeKnownRole(value)
                    : value.Trim();

                if (!values.Any(existing => string.Equals(existing, normalized, StringComparison.OrdinalIgnoreCase)))
                {
                    values.Add(normalized);
                }
            }

            if (values.Count == 0)
            {
                foreach (var value in fallback)
                {
                    var normalized = canonicalizeKnownRoles
                        ? CanonicalizeKnownRole(value)
                        : value.Trim();

                    if (!values.Any(existing => string.Equals(existing, normalized, StringComparison.OrdinalIgnoreCase)))
                    {
                        values.Add(normalized);
                    }
                }
            }

            if (!values.Contains(ensureIncluded, StringComparer.OrdinalIgnoreCase))
            {
                values.Add(ensureIncluded);
            }

            return values;
        }

        private string ResolveConfiguredDefault(string key, IReadOnlyCollection<string> allowed, string fallback)
        {
            var configured = _configuration[$"{SectionPath}:{key}"];
            if (string.IsNullOrWhiteSpace(configured))
            {
                return fallback;
            }

            var normalized = CanonicalizeKnownRole(configured);
            var match = allowed.FirstOrDefault(value =>
                string.Equals(value, normalized, StringComparison.OrdinalIgnoreCase));

            return string.IsNullOrWhiteSpace(match) ? fallback : match;
        }

        private static string CanonicalizeKnownRole(string role)
        {
            var trimmed = role.Trim();
            var parsed = RoleCatalog.Parse(trimmed);
            return parsed == SystemRole.Unknown
                ? trimmed
                : RoleCatalog.ToCanonicalRoleName(parsed);
        }
    }
}
