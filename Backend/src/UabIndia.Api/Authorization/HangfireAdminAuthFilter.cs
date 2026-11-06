using Hangfire.Dashboard;
using UabIndia.Core.Authorization;

namespace UabIndia.Api.Authorization
{
    public class HangfireAdminAuthFilter : IDashboardAuthorizationFilter
    {
        public bool Authorize(DashboardContext context)
        {
            var httpContext = context.GetHttpContext();
            if (!httpContext.User.Identity?.IsAuthenticated == true)
                return false;

            var roles = httpContext.User.Claims
                .Where(c => c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase)
                         || c.Type.EndsWith("role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value);

            return RoleCatalog.IsAdminLike(roles);
        }
    }
}
