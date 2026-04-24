using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UabIndia.Core.Authorization;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Middleware
{
    public class OrgScopeMiddleware
    {
        private readonly RequestDelegate _next;

        public OrgScopeMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ApplicationDbContext db)
        {
            var endpoint = context.GetEndpoint();
            if (endpoint?.Metadata.GetMetadata<IAllowAnonymous>() != null)
            {
                await _next(context);
                return;
            }

            var principal = context.User;
            if (principal?.Identity?.IsAuthenticated != true)
            {
                await _next(context);
                return;
            }

            var controller = context.Request.RouteValues.TryGetValue("controller", out var controllerObj)
                ? controllerObj?.ToString() ?? string.Empty
                : string.Empty;

            if (string.IsNullOrWhiteSpace(controller))
            {
                await _next(context);
                return;
            }

            if (string.Equals(controller, "Auth", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(controller, "Public", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(controller, "Tenants", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            if (HttpMethods.IsGet(context.Request.Method) &&
                (string.Equals(controller, "Companies", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(controller, "Projects", StringComparison.OrdinalIgnoreCase)))
            {
                await _next(context);
                return;
            }

            var roles = principal.Claims
                .Where(c => c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase) || c.Type.EndsWith("role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value)
                .ToArray();

            var isAdmin = RoleCatalog.IsAdminLike(roles);

            if (isAdmin)
            {
                await _next(context);
                return;
            }

            Guid? companyIdHeader = null;
            if (context.Request.Headers.TryGetValue("X-Company-Id", out var companyHeader) &&
                !string.IsNullOrWhiteSpace(companyHeader))
            {
                if (!Guid.TryParse(companyHeader.ToString(), out var parsedCompany))
                {
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    await context.Response.WriteAsJsonAsync(new { message = "Invalid X-Company-Id header" });
                    return;
                }

                companyIdHeader = parsedCompany;
            }

            Guid? projectIdHeader = null;
            if (context.Request.Headers.TryGetValue("X-Project-Id", out var projectHeader) &&
                !string.IsNullOrWhiteSpace(projectHeader))
            {
                if (!Guid.TryParse(projectHeader.ToString(), out var parsedProject))
                {
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    await context.Response.WriteAsJsonAsync(new { message = "Invalid X-Project-Id header" });
                    return;
                }

                projectIdHeader = parsedProject;
            }

            var userIdClaim = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? principal.FindFirst("nameidentifier")?.Value
                ?? principal.FindFirst("sub")?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }

            var employee = await db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.UserId == userId);
            if (employee == null)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { message = "No employee scope assigned" });
                return;
            }

            var effectiveCompanyId = employee.CompanyId;
            if (companyIdHeader.HasValue)
            {
                if (employee.CompanyId != companyIdHeader.Value)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new { message = "Company scope denied" });
                    return;
                }

                effectiveCompanyId = companyIdHeader.Value;
            }

            if (effectiveCompanyId == Guid.Empty)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new { message = "Company scope unavailable" });
                return;
            }

            Guid? effectiveProjectId = employee.ProjectId;
            if (projectIdHeader.HasValue)
            {
                if (employee.ProjectId.HasValue && employee.ProjectId.Value != projectIdHeader.Value)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new { message = "Project scope denied" });
                    return;
                }

                effectiveProjectId = projectIdHeader.Value;
            }

            context.Items["CompanyId"] = effectiveCompanyId;
            if (effectiveProjectId.HasValue)
            {
                context.Items["ProjectId"] = effectiveProjectId.Value;
            }
            else
            {
                context.Items.Remove("ProjectId");
            }

            await _next(context);
        }
    }
}
