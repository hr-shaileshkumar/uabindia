using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Authorization
{
    public class ModuleEnabledHandler : AuthorizationHandler<ModuleEnabledRequirement>
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public ModuleEnabledHandler(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, ModuleEnabledRequirement requirement)
        {
            if (string.IsNullOrWhiteSpace(requirement.ModuleKey))
            {
                return;
            }

            // SuperAdmin and SystemAdmin bypass module enablement checks.
            if (context.User.IsInRole("SuperAdmin") || context.User.IsInRole("SystemAdmin"))
            {
                context.Succeed(requirement);
                return;
            }

            var tenantId = _tenantAccessor.GetTenantId();

            var moduleActive = await _db.Modules
                .AsNoTracking()
                .AnyAsync(m => m.ModuleKey == requirement.ModuleKey && m.IsEnabled);

            if (!moduleActive)
            {
                return;
            }

            var tenantEnabled = await _db.TenantModules
                .AsNoTracking()
                .AnyAsync(tm => tm.TenantId == tenantId && tm.ModuleKey == requirement.ModuleKey && tm.IsEnabled && !tm.IsDeleted);

            if (tenantEnabled)
            {
                context.Succeed(requirement);
            }
        }
    }
}
