using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Core.Services;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class PolicyEngineService : IPolicyEngine
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ILogger<PolicyEngineService> _logger;

        public PolicyEngineService(ApplicationDbContext db, ITenantAccessor tenantAccessor, ILogger<PolicyEngineService> logger)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _logger = logger;
        }

        public async Task<PolicyDecision> EvaluateAsync(PolicyContext context)
        {
            var tenantId = context.TenantId == Guid.Empty ? _tenantAccessor.GetTenantId() : context.TenantId;

            // Check if user is ERP Owner (Super Admin)
            if (context.UserId.HasValue)
            {
                var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == context.UserId.Value && u.TenantId == tenantId);
                if (user?.IsSystemAdmin == true)
                {
                    return Allow("ERP Owner has full access");
                }
            }

            // Get user's roles
            var userRoles = await _db.UserRoles
                .Where(ur => ur.UserId == context.UserId && ur.TenantId == tenantId && !ur.IsDeleted)
                .Select(ur => ur.RoleId)
                .ToListAsync();

            if (!userRoles.Any())
            {
                return Deny("User has no roles assigned");
            }

            // Get permissions for user's roles
            var permissions = await _db.RolePermissions
                .Where(rp => userRoles.Contains(rp.RoleId) && rp.TenantId == tenantId && !rp.IsDeleted)
                .Join(_db.Permissions,
                    rp => rp.PermissionId,
                    p => p.Id,
                    (rp, p) => p)
                .Where(p => !p.IsDeleted)
                .ToListAsync();

            // Check if any permission matches the resource and action
            var hasPermission = permissions.Any(p =>
                string.Equals(p.Module, context.Resource, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(p.Action, context.Action, StringComparison.OrdinalIgnoreCase));

            if (hasPermission)
            {
                return Allow("Permission granted");
            }

            // Fallback to role-based check for backward compatibility
            var roleNames = await _db.Roles
                .Where(r => userRoles.Contains(r.Id) && r.TenantId == tenantId && !r.IsDeleted)
                .Select(r => r.Name)
                .ToListAsync();

            // Special role checks
            if (RoleCatalog.HasAnyRole(roleNames, SystemRole.SuperAdmin))
            {
                return Allow("Super admin role");
            }

            return Deny("No matching permission found");
        }

        private static PolicyDecision Allow(string reason) => new PolicyDecision { Allowed = true, Reason = reason };

        private static PolicyDecision Deny(string reason) => new PolicyDecision { Allowed = false, Reason = reason };
    }
}
