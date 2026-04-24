using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Core.Services;

namespace UabIndia.Api.Authorization
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = true)]
    public sealed class PolicyCheckAttribute : Attribute, IAsyncActionFilter
    {
        private readonly string _resource;
        private readonly string _action;

        public PolicyCheckAttribute(string resource, string action)
        {
            _resource = resource;
            _action = action;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var policyEngine = context.HttpContext.RequestServices.GetService(typeof(IPolicyEngine)) as IPolicyEngine;
            if (policyEngine == null)
            {
                await next();
                return;
            }

            var user = context.HttpContext.User;
            var roles = user.Claims.Where(c => c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase) || c.Type.EndsWith("role", StringComparison.OrdinalIgnoreCase))
                .Select(c => RoleCatalog.Normalize(c.Value))
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            Guid? userId = null;
            var sub = user.Claims.FirstOrDefault(c => c.Type.EndsWith("/sub", StringComparison.OrdinalIgnoreCase) || c.Type.EndsWith("sub", StringComparison.OrdinalIgnoreCase));
            if (Guid.TryParse(sub?.Value, out var parsedUserId))
            {
                userId = parsedUserId;
            }

            Guid? targetUserId = null;
            if (context.RouteData.Values.TryGetValue("userId", out var userIdValue) && Guid.TryParse(userIdValue?.ToString(), out var routeUserId))
            {
                targetUserId = routeUserId;
            }
            else if (context.RouteData.Values.TryGetValue("employeeId", out var employeeIdValue) && Guid.TryParse(employeeIdValue?.ToString(), out var routeEmployeeId))
            {
                targetUserId = routeEmployeeId;
            }

            var tenantAccessor = context.HttpContext.RequestServices.GetService(typeof(ITenantAccessor)) as ITenantAccessor;
            var tenantId = tenantAccessor?.GetTenantId() ?? Guid.Empty;

            var decision = await policyEngine.EvaluateAsync(new PolicyContext
            {
                TenantId = tenantId,
                Resource = _resource,
                Action = _action,
                UserId = userId,
                TargetUserId = targetUserId,
                Roles = roles
            });

            if (!decision.Allowed)
            {
                context.Result = new ObjectResult(new { message = "Policy denied", reason = decision.Reason })
                {
                    StatusCode = 403
                };
                return;
            }

            await next();
        }
    }
}
