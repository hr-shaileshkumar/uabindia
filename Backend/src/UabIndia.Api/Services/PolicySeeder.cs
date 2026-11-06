using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Services
{
    public class PolicySeeder
    {
        private static readonly string[] DefaultAdminRoles =
        {
            RoleCatalog.AdminRoleName,
            RoleCatalog.SuperAdminRoleName,
        };

        public async Task EnsurePoliciesAsync(ApplicationDbContext db, ITenantAccessor tenantAccessor, ILogger logger)
        {
            var policies = BuildPolicyCatalog();
            List<Tenant> tenants;
            try
            {
                if (!await TenantConfigTableExistsAsync(db))
                {
                    logger.LogWarning("Policy seeding skipped because TenantConfigs table is not available.");
                    return;
                }

                tenants = await db.Tenants.AsNoTracking().ToListAsync();
            }
            catch (Microsoft.Data.SqlClient.SqlException ex)
            {
                logger.LogWarning(ex, "Policy seeding skipped because tenants table is not available.");
                return;
            }

            foreach (var tenant in tenants)
            {
                tenantAccessor.SetTenantId(tenant.Id);
                tenantAccessor.SetTenantSchema(BuildSchemaName(tenant.Subdomain, tenant.Id));

                var config = await db.TenantConfigs.FirstOrDefaultAsync(c => c.TenantId == tenant.Id);
                if (config == null)
                {
                    config = new TenantConfig
                    {
                        TenantId = tenant.Id,
                        ConfigJson = "{}",
                        UiSchemaJson = "{}",
                        WorkflowJson = "{}",
                        BrandingJson = "{}"
                    };
                    db.TenantConfigs.Add(config);
                }

                var updated = MergePolicies(config, policies);
                if (updated)
                {
                    await db.SaveChangesAsync();
                    logger.LogInformation("Policies updated for tenant {TenantId}", tenant.Id);
                }
            }
        }

        private static bool MergePolicies(TenantConfig config, List<PolicyEntry> policies)
        {
            JsonObject root;
            try
            {
                root = JsonNode.Parse(string.IsNullOrWhiteSpace(config.ConfigJson) ? "{}" : config.ConfigJson) as JsonObject
                    ?? new JsonObject();
            }
            catch (JsonException)
            {
                root = new JsonObject();
            }

            var policyArray = root["policies"] as JsonArray ?? new JsonArray();
            var existingKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var node in policyArray)
            {
                if (node is not JsonObject obj) continue;
                var resource = obj["resource"]?.ToString() ?? string.Empty;
                var action = obj["action"]?.ToString() ?? string.Empty;
                if (!string.IsNullOrWhiteSpace(resource) && !string.IsNullOrWhiteSpace(action))
                {
                    existingKeys.Add($"{resource}:{action}");
                }
            }

            var added = false;
            foreach (var policy in policies)
            {
                var key = $"{policy.Resource}:{policy.Action}";
                if (existingKeys.Contains(key)) continue;

                var newPolicy = new JsonObject
                {
                    ["resource"] = policy.Resource,
                    ["action"] = policy.Action,
                    ["roles"] = new JsonArray(policy.Roles.Select(r => (JsonNode)r).ToArray())
                };
                policyArray.Add(newPolicy);
                existingKeys.Add(key);
                added = true;
            }

            if (!root.ContainsKey("policies"))
            {
                root["policies"] = policyArray;
                added = true;
            }

            if (added)
            {
                config.ConfigJson = root.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
            }

            return added;
        }

        private static List<PolicyEntry> BuildPolicyCatalog()
        {
            var entries = new List<PolicyEntry>();
            var controllerTypes = Assembly.GetExecutingAssembly()
                .GetTypes()
                .Where(t => typeof(ControllerBase).IsAssignableFrom(t) && !t.IsAbstract)
                .ToList();

            foreach (var controller in controllerTypes)
            {
                var controllerName = controller.Name.EndsWith("Controller", StringComparison.OrdinalIgnoreCase)
                    ? controller.Name.Substring(0, controller.Name.Length - "Controller".Length)
                    : controller.Name;

                var methods = controller.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly);
                foreach (var method in methods)
                {
                    if (method.GetCustomAttributes(typeof(NonActionAttribute), true).Any())
                        continue;

                    var httpMethods = method.GetCustomAttributes<HttpMethodAttribute>(true).ToList();
                    if (httpMethods.Count == 0) continue;

                    var actionNameAttr = method.GetCustomAttribute<ActionNameAttribute>(true);
                    var actionName = actionNameAttr?.Name ?? method.Name;

                    entries.Add(new PolicyEntry(
                        controllerName.ToLowerInvariant(),
                        actionName.ToLowerInvariant(),
                        DefaultAdminRoles
                    ));
                }
            }

            return entries;
        }

        private static string BuildSchemaName(string? subdomain, Guid tenantId)
        {
            var baseName = !string.IsNullOrWhiteSpace(subdomain)
                ? SanitizeSchemaName(subdomain)
                : tenantId.ToString("N");

            return $"tenant_{baseName}";
        }

        private static string SanitizeSchemaName(string input)
        {
            var span = input.Trim().ToLowerInvariant();
            var buffer = new char[span.Length];
            var idx = 0;
            foreach (var ch in span)
            {
                if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '_')
                {
                    buffer[idx++] = ch;
                }
                else if (ch == '-' || ch == '.')
                {
                    buffer[idx++] = '_';
                }
            }

            if (idx == 0)
            {
                return "default";
            }

            return new string(buffer, 0, idx);
        }

        private static async Task<bool> TenantConfigTableExistsAsync(ApplicationDbContext db)
        {
            // If the provider is not a relational database (e.g. InMemory used in tests),
            // skip relational-specific checks and indicate the table is not present.
            if (!db.Database.IsRelational())
            {
                return false;
            }

            var connection = db.Database.GetDbConnection();
            var shouldClose = connection.State == System.Data.ConnectionState.Closed;
            if (shouldClose)
            {
                await connection.OpenAsync();
            }

            try
            {
                using var command = connection.CreateCommand();
                command.CommandText = "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TenantConfigs' AND TABLE_SCHEMA = 'dbo'";
                var result = await command.ExecuteScalarAsync();
                return result != null;
            }
            finally
            {
                if (shouldClose)
                {
                    await connection.CloseAsync();
                }
            }
        }

        private record PolicyEntry(string Resource, string Action, string[] Roles);
    }
}
