using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Core.Services;

namespace UabIndia.Api.Middleware
{
    public class PolicyEnforcementMiddleware
    {
        private readonly RequestDelegate _next;

        public PolicyEnforcementMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IPolicyEngine policyEngine, ITenantAccessor tenantAccessor)
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

            var routeValues = context.Request.RouteValues;
            if (!routeValues.TryGetValue("controller", out var controllerObj) || controllerObj == null)
            {
                await _next(context);
                return;
            }

            var controller = controllerObj?.ToString() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(controller))
            {
                await _next(context);
                return;
            }

            if (string.Equals(controller, "Auth", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(controller, "Public", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            var action = routeValues.TryGetValue("action", out var actionObj)
                ? actionObj?.ToString()
                : null;

            action = string.IsNullOrWhiteSpace(action) ? context.Request.Method : action;
            if (string.IsNullOrWhiteSpace(action))
            {
                await _next(context);
                return;
            }

            var roles = principal.Claims
                .Where(c => c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase) || c.Type.EndsWith("role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value)
                .ToList();

            var isAdmin = RoleCatalog.IsAdminLike(roles);

            if (isAdmin)
            {
                await _next(context);
                return;
            }

            Guid? userId = null;
            var sub = principal.Claims.FirstOrDefault(c => c.Type.EndsWith("/sub", StringComparison.OrdinalIgnoreCase) || c.Type.EndsWith("sub", StringComparison.OrdinalIgnoreCase));
            if (Guid.TryParse(sub?.Value, out var parsedUserId))
            {
                userId = parsedUserId;
            }

            var decision = await policyEngine.EvaluateAsync(new PolicyContext
            {
                TenantId = tenantAccessor.GetTenantId(),
                Resource = controller.ToLowerInvariant(),
                Action = action.ToLowerInvariant(),
                UserId = userId,
                Roles = roles
            });

            if (!decision.Allowed)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { message = "Policy denied", reason = decision.Reason });
                return;
            }

            await _next(context);
        }
    }
}
