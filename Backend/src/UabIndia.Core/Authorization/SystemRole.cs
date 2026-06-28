using System;
using System.Collections.Generic;
using System.Linq;

namespace UabIndia.Core.Authorization
{
    public enum SystemRole
    {
        Unknown = 0,
        Employee = 1,
        Manager = 2,
        Admin = 3,
        SuperAdmin = 4
    }

    public static class RoleCatalog
    {
        public const string SuperAdminRoleName = "SuperAdmin";
        public const string AdminRoleName = "Admin";
        public const string ManagerRoleName = "MANAGER";
        public const string EmployeeRoleName = "EMPLOYEE";

        private static readonly IReadOnlyDictionary<string, SystemRole> AliasToRole =
            new Dictionary<string, SystemRole>(StringComparer.OrdinalIgnoreCase)
            {
                ["employee"] = SystemRole.Employee,
                ["staff"] = SystemRole.Employee,
                ["ess"] = SystemRole.Employee,
                ["client"] = SystemRole.Employee,
                ["customer"] = SystemRole.Employee,
                ["vendor"] = SystemRole.Employee,
                ["supportagent"] = SystemRole.Employee,
                ["helpdeskagent"] = SystemRole.Employee,

                ["manager"] = SystemRole.Manager,
                ["reportingmanager"] = SystemRole.Manager,
                ["projectmanager"] = SystemRole.Manager,
                ["supervisor"] = SystemRole.Manager,
                ["lead"] = SystemRole.Manager,

                ["admin"] = SystemRole.Admin,
                ["administrator"] = SystemRole.Admin,
                ["tenantadmin"] = SystemRole.Admin,
                ["companyadmin"] = SystemRole.Admin,
                ["businessowner"] = SystemRole.Admin,
                ["tenantowner"] = SystemRole.Admin,
                ["companyowner"] = SystemRole.Admin,
                ["hr"] = SystemRole.Admin,
                ["finance"] = SystemRole.Admin,
                ["auditor"] = SystemRole.Admin,

                ["superadmin"] = SystemRole.SuperAdmin,
                ["systemadmin"] = SystemRole.SuperAdmin,
                ["platformowner"] = SystemRole.SuperAdmin,
                ["softwareowner"] = SystemRole.SuperAdmin,
            };

        public static string ToCanonicalRoleName(SystemRole role)
        {
            return role switch
            {
                SystemRole.SuperAdmin => SuperAdminRoleName,
                SystemRole.Admin => AdminRoleName,
                SystemRole.Manager => ManagerRoleName,
                SystemRole.Employee => EmployeeRoleName,
                _ => string.Empty,
            };
        }

        public static string Normalize(string? role)
        {
            return (role ?? string.Empty)
                .Trim()
                .Replace(" ", string.Empty, StringComparison.OrdinalIgnoreCase)
                .Replace("_", string.Empty, StringComparison.OrdinalIgnoreCase)
                .Replace("-", string.Empty, StringComparison.OrdinalIgnoreCase)
                .ToLowerInvariant();
        }

        public static SystemRole Parse(string? role)
        {
            var normalized = Normalize(role);
            return AliasToRole.TryGetValue(normalized, out var parsed)
                ? parsed
                : SystemRole.Unknown;
        }

        public static bool IsInRole(string? role, SystemRole expectedRole)
        {
            return Parse(role) == expectedRole;
        }

        public static bool HasAnyRole(IEnumerable<string>? roleNames, params SystemRole[] expectedRoles)
        {
            if (roleNames == null || expectedRoles == null || expectedRoles.Length == 0)
            {
                return false;
            }

            var allowed = expectedRoles.ToHashSet();
            return roleNames.Any(roleName => allowed.Contains(Parse(roleName)));
        }

        public static bool IsAdminLike(IEnumerable<string>? roleNames)
        {
            return HasAnyRole(roleNames, SystemRole.Admin, SystemRole.SuperAdmin);
        }

        public static bool IsManagerLike(IEnumerable<string>? roleNames)
        {
            return HasAnyRole(roleNames, SystemRole.Manager);
        }
    }
}
