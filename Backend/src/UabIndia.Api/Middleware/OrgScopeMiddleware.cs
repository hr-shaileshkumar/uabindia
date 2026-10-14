using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Middleware
{
    public class OrgScopeMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<OrgScopeMiddleware> _logger;

        /// <summary>
        /// Controllers whose mutating requests must carry X-Company-Id (business flagship writes).
        /// </summary>
        private static readonly HashSet<string> WriteRequireCompanyControllers = new(StringComparer.OrdinalIgnoreCase)
        {
            "Employees", "Customers", "Leads", "SalesOrders", "SalesQuotations", "SalesInvoices",
            "Expenses", "GoodsReceipts", "StockMovements", "JournalEntries", "Payments",
            "PurchaseOrders", "PurchaseRequests", "Vendors", "Items", "Warehouses",
            "BankReconciliations", "Payroll", "Attendance", "Leave", "Documents",
            "Appraisals", "Travel", "Overtime", "Shifts", "Training", "Recruitment"
        };

        public OrgScopeMiddleware(RequestDelegate next, ILogger<OrgScopeMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, ApplicationDbContext db, ITenantAccessor tenantAccessor, IMemoryCache cache)
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

            var skipEmployeeEnforcement =
                string.Equals(controller, "Auth", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(controller, "Public", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(controller, "Tenants", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(controller, "OrgContext", StringComparison.OrdinalIgnoreCase) ||
                (HttpMethods.IsGet(context.Request.Method) &&
                 (string.Equals(controller, "Companies", StringComparison.OrdinalIgnoreCase) ||
                  string.Equals(controller, "Projects", StringComparison.OrdinalIgnoreCase) ||
                  string.Equals(controller, "System", StringComparison.OrdinalIgnoreCase)));

            var roles = principal.Claims
                .Where(c => c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase) || c.Type.EndsWith("role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value)
                .ToArray();

            var isAdmin = RoleCatalog.IsAdminLike(roles);
            var isWrite = HttpMethods.IsPost(context.Request.Method)
                || HttpMethods.IsPut(context.Request.Method)
                || HttpMethods.IsPatch(context.Request.Method)
                || HttpMethods.IsDelete(context.Request.Method);

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

            string? financialYearKey = null;
            DateTime? financialYearStart = null;
            DateTime? financialYearEnd = null;
            if (context.Request.Headers.TryGetValue("X-Financial-Year", out var fyHeader) &&
                !string.IsNullOrWhiteSpace(fyHeader))
            {
                financialYearKey = fyHeader.ToString().Trim();
                if (TryParseFinancialYear(financialYearKey, out var fyStart, out var fyEnd))
                {
                    financialYearStart = fyStart;
                    financialYearEnd = fyEnd;
                }
            }

            if (context.Request.Headers.TryGetValue("X-Financial-Year-Start", out var fyStartHeader) &&
                DateTime.TryParse(fyStartHeader.ToString(), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsedFyStart))
            {
                financialYearStart = parsedFyStart.Date;
            }

            if (context.Request.Headers.TryGetValue("X-Financial-Year-End", out var fyEndHeader) &&
                DateTime.TryParse(fyEndHeader.ToString(), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsedFyEnd))
            {
                financialYearEnd = parsedFyEnd.Date.AddDays(1).AddTicks(-1);
            }

            // Always stamp Items from headers when present (including admins) for audit/controllers.
            if (companyIdHeader.HasValue)
                context.Items["CompanyId"] = companyIdHeader.Value;
            if (projectIdHeader.HasValue)
                context.Items["ProjectId"] = projectIdHeader.Value;
            if (!string.IsNullOrWhiteSpace(financialYearKey))
                context.Items["FinancialYear"] = financialYearKey;

            tenantAccessor.SetOrgScope(companyIdHeader, projectIdHeader, financialYearKey, financialYearStart, financialYearEnd);

            if (skipEmployeeEnforcement)
            {
                await _next(context);
                return;
            }

            var requiresCompanyOnWrite = isWrite && WriteRequireCompanyControllers.Contains(controller);
            if (requiresCompanyOnWrite && !companyIdHeader.HasValue)
            {
                _logger.LogWarning(
                    "Org scope denied: missing X-Company-Id on {Method} {Path} (controller={Controller}, admin={IsAdmin})",
                    context.Request.Method,
                    context.Request.Path,
                    controller,
                    isAdmin);

                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new
                {
                    message = "X-Company-Id is required for this write operation. Select a company in the workspace switcher."
                });
                return;
            }

            if (companyIdHeader.HasValue)
            {
                var activeTenantId = tenantAccessor.GetTenantId();
                if (activeTenantId != Guid.Empty)
                {
                    var companyBelongsToTenant = await db.Companies
                        .IgnoreQueryFilters()
                        .AsNoTracking()
                        .AnyAsync(c => c.Id == companyIdHeader.Value && c.TenantId == activeTenantId && !c.IsDeleted);

                    if (!companyBelongsToTenant)
                    {
                        _logger.LogWarning(
                            "Org scope denied: company {CompanyId} does not belong to active tenant {TenantId} (caller={User})",
                            companyIdHeader.Value,
                            activeTenantId,
                            principal.Identity?.Name);

                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await context.Response.WriteAsJsonAsync(new { message = "Company scope denied: company does not belong to active tenant." });
                        return;
                    }
                }
            }

            if (projectIdHeader.HasValue)
            {
                var activeTenantId = tenantAccessor.GetTenantId();
                if (activeTenantId != Guid.Empty)
                {
                    var projectBelongsToTenant = await db.Projects
                        .IgnoreQueryFilters()
                        .AsNoTracking()
                        .AnyAsync(p => p.Id == projectIdHeader.Value && p.TenantId == activeTenantId && !p.IsDeleted);

                    if (!projectBelongsToTenant)
                    {
                        _logger.LogWarning(
                            "Org scope denied: project {ProjectId} does not belong to active tenant {TenantId} (caller={User})",
                            projectIdHeader.Value,
                            activeTenantId,
                            principal.Identity?.Name);

                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await context.Response.WriteAsJsonAsync(new { message = "Project scope denied: project does not belong to active tenant." });
                        return;
                    }
                }
            }

            if (isAdmin)
            {
                tenantAccessor.SetOrgScope(companyIdHeader, projectIdHeader, financialYearKey, financialYearStart, financialYearEnd);
                await _next(context);
                return;
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

            var cacheKey = $"org-emp:{userId}";
            if (!cache.TryGetValue(cacheKey, out Employee? employee) || employee == null)
            {
                employee = await db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.UserId == userId);
                if (employee != null)
                {
                    cache.Set(cacheKey, employee, new MemoryCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
                    });
                }
            }
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
                    _logger.LogWarning(
                        "Org scope denied: company mismatch user={UserId} header={HeaderCompany} employee={EmployeeCompany}",
                        userId,
                        companyIdHeader,
                        employee.CompanyId);
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
                context.Items["ProjectId"] = effectiveProjectId.Value;
            else
                context.Items.Remove("ProjectId");

            tenantAccessor.SetOrgScope(effectiveCompanyId, effectiveProjectId, financialYearKey, financialYearStart, financialYearEnd);

            await _next(context);
        }

        private static bool TryParseFinancialYear(string key, out DateTime start, out DateTime end)
        {
            start = default;
            end = default;
            if (string.IsNullOrWhiteSpace(key)) return false;

            var trimmed = key.Trim();

            // Format: YYYY (e.g. "2026")
            if (int.TryParse(trimmed, out var singleYear) && singleYear >= 1990 && singleYear <= 2200)
            {
                start = new DateTime(singleYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                end = new DateTime(singleYear, 12, 31, 23, 59, 59, DateTimeKind.Utc);
                return true;
            }

            // Format: YYYY-YYYY or YYYY-YY (e.g. "2025-2026" or "2025-26")
            var parts = trimmed.Split(new[] { '-', '/' }, StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 2 && int.TryParse(parts[0], out var startYear) && startYear >= 1990 && startYear <= 2200)
            {
                var endPart = parts[1];
                int endYear;
                if (endPart.Length == 2 && int.TryParse(endPart, out var endShort))
                {
                    endYear = (startYear / 100) * 100 + endShort;
                }
                else if (int.TryParse(endPart, out var endFull))
                {
                    endYear = endFull;
                }
                else
                {
                    endYear = startYear + 1;
                }

                start = new DateTime(startYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                end = new DateTime(endYear, 12, 31, 23, 59, 59, DateTimeKind.Utc);
                return true;
            }

            return false;
        }
    }
}
