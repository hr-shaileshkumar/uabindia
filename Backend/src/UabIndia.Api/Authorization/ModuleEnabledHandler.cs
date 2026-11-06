using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Authorization
{
    public class ModuleEnabledHandler : AuthorizationHandler<ModuleEnabledRequirement>
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IMemoryCache _cache;

        public ModuleEnabledHandler(ApplicationDbContext db, ITenantAccessor tenantAccessor, IMemoryCache cache)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _cache = cache;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, ModuleEnabledRequirement requirement)
        {
            if (string.IsNullOrWhiteSpace(requirement.ModuleKey))
            {
                return;
            }

            var roleClaims = context.User.Claims
                .Where(c => c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase) || c.Type.EndsWith("role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value)
                .ToList();

            if (context.User.HasClaim("is_system_admin", "true") ||
                string.Equals(context.User.FindFirst("is_system_admin")?.Value, "true", StringComparison.OrdinalIgnoreCase) ||
                RoleCatalog.HasAnyRole(roleClaims, SystemRole.SuperAdmin))
            {
                context.Succeed(requirement);
                return;
            }

            var tenantId = _tenantAccessor.GetTenantId();

            var globalKey = $"module:global:{requirement.ModuleKey}";
            var moduleActive = await _cache.GetOrCreateAsync(globalKey, async entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromMinutes(5);
                return await _db.Modules
                    .AsNoTracking()
                    .AnyAsync(m => m.ModuleKey == requirement.ModuleKey && m.IsEnabled);
            });

            if (!moduleActive)
            {
                return;
            }

            var tenantKey = $"module:tenant:{tenantId}:{requirement.ModuleKey}";
            var tenantEnabled = await _cache.GetOrCreateAsync(tenantKey, async entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromMinutes(5);
                return await _db.TenantModules
                    .AsNoTracking()
                    .AnyAsync(tm => tm.TenantId == tenantId && tm.ModuleKey == requirement.ModuleKey && tm.IsEnabled && !tm.IsDeleted);
            });

            if (tenantEnabled)
            {
                context.Succeed(requirement);
            }
        }
    }
}
