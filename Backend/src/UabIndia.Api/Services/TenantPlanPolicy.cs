using System;
using System.Collections.Generic;
using System.Linq;

namespace UabIndia.Api.Services
{
    public sealed class TenantPlanPolicy
    {
        public string PlanName { get; init; } = "Basic";
        public int MaxUsers { get; init; }
        public int MaxStorageGb { get; init; }
        public string[] AllowedBusinessModules { get; init; } = Array.Empty<string>();

        public static TenantPlanPolicy Resolve(string? planName)
        {
            var normalized = NormalizePlanKey(planName);
            if (Policies.TryGetValue(normalized, out var policy))
            {
                return policy;
            }

            return Policies["basic"];
        }

        public static string NormalizePlanKey(string? planName)
        {
            if (string.IsNullOrWhiteSpace(planName))
            {
                return "basic";
            }

            return planName.Trim().ToLowerInvariant();
        }

        public static string[] NormalizeModulesForPlan(IEnumerable<string>? requestedModules, TenantPlanPolicy plan)
        {
            if (requestedModules == null)
            {
                return plan.AllowedBusinessModules;
            }

            var requested = requestedModules
                .Where(m => !string.IsNullOrWhiteSpace(m))
                .Select(m => m.Trim().ToLowerInvariant())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            var filtered = requested
                .Where(m => plan.AllowedBusinessModules.Contains(m, StringComparer.OrdinalIgnoreCase))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            return filtered.Length > 0 ? filtered : plan.AllowedBusinessModules;
        }

        private static readonly Dictionary<string, TenantPlanPolicy> Policies = new(StringComparer.OrdinalIgnoreCase)
        {
            ["basic"] = new TenantPlanPolicy
            {
                PlanName = "Basic",
                MaxUsers = 10,
                MaxStorageGb = 25,
                AllowedBusinessModules = new[] { "hrms" }
            },
            ["premium"] = new TenantPlanPolicy
            {
                PlanName = "Premium",
                MaxUsers = 100,
                MaxStorageGb = 200,
                AllowedBusinessModules = new[] { "hrms", "payroll", "reports" }
            },
            ["enterprise"] = new TenantPlanPolicy
            {
                PlanName = "Enterprise",
                MaxUsers = 1000,
                MaxStorageGb = 1000,
                AllowedBusinessModules = new[] { "hrms", "payroll", "reports", "erp" }
            }
        };
    }
}