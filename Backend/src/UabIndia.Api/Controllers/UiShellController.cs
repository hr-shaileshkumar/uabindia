using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Services;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Controllers
{
    /// <summary>
    /// Serves the metadata-driven UI shell contracts:
    ///   GET /api/v1/ui-shell/navigation
    ///   GET /api/v1/ui-shell/route-rules
    ///   GET /api/v1/ui-shell/dashboard
    ///   GET /api/v1/ui-shell/page-schema/{pageKey}
    /// All endpoints require an authenticated session; they respect the caller's
    /// enabled modules and permissions automatically through UiSchemaService.
    /// </summary>
    [ApiController]
    [Route("api/v1/ui-shell")]
    [Authorize]
    public class UiShellController : ControllerBase
    {
        private static readonly HashSet<string> FrozenModuleKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            "erp", "hrms", "payroll", "reports", "platform", "licensing", "security"
        };

        private readonly IUiSchemaService _schemaService;
        private readonly ITenantAccessor _tenantAccessor;

        public UiShellController(IUiSchemaService schemaService, ITenantAccessor tenantAccessor)
        {
            _schemaService = schemaService;
            _tenantAccessor = tenantAccessor;
        }

        // ─────────────────────────────────────────────────────────────────────
        // GET /api/v1/ui-shell/navigation
        // Returns module metadata + per-module navigation groups/items for the
        // caller's enabled modules. Empty groups = frontend uses fallback config.
        // ─────────────────────────────────────────────────────────────────────
        [HttpGet("navigation")]
        public async Task<IActionResult> GetNavigation()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var richModules = await _schemaService.GetRichEnabledModulesAsync(tenantId);

            var enabledKeys = new HashSet<string>(
                richModules.Select(m => m.Key).Where(k => FrozenModuleKeys.Contains(k)),
                StringComparer.OrdinalIgnoreCase);

            var schema = await _schemaService.GetNavigationSchemaAsync(enabledKeys);

            return Ok(schema);
        }

        // ─────────────────────────────────────────────────────────────────────
        // GET /api/v1/ui-shell/route-rules
        // Returns per-route permission rules stored in UiSchemaJson.
        // Empty list = frontend uses fallback ROUTE_PERMISSION_MATRIX.
        // ─────────────────────────────────────────────────────────────────────
        [HttpGet("route-rules")]
        public async Task<IActionResult> GetRouteRules()
        {
            var rules = await _schemaService.GetRouteRulesAsync();
            return Ok(rules);
        }

        // ─────────────────────────────────────────────────────────────────────
        // GET /api/v1/ui-shell/dashboard
        // Returns dashboard widget/section definitions from UiSchemaJson.
        // Empty sections = frontend uses fallback hardcoded dashboard.
        // ─────────────────────────────────────────────────────────────────────
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var richModules = await _schemaService.GetRichEnabledModulesAsync(tenantId);
            var enabledKeys = new HashSet<string>(
                richModules.Select(m => m.Key).Where(k => FrozenModuleKeys.Contains(k)),
                StringComparer.OrdinalIgnoreCase);

            var schema = await _schemaService.GetDashboardSchemaAsync(enabledKeys);
            return Ok(schema);
        }

        // ─────────────────────────────────────────────────────────────────────
        // GET /api/v1/ui-shell/page-schema/{pageKey}
        // Returns the page schema for a given page key (e.g. "erp.customers").
        // Returns 404 when no schema exists; frontend renders fallback component.
        // ─────────────────────────────────────────────────────────────────────
        [HttpGet("page-schema/{pageKey}")]
        public async Task<IActionResult> GetPageSchema([FromRoute] string pageKey)
        {
            if (string.IsNullOrWhiteSpace(pageKey) || pageKey.Length > 200)
                return BadRequest(new { error = "Invalid pageKey." });

            var schema = await _schemaService.GetPageSchemaAsync(pageKey);
            if (schema == null)
                return NotFound(new { pageKey, hasSchema = false });

            return Ok(schema);
        }
    }
}
