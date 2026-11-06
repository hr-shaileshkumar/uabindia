using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;
using UabIndia.Application.Models;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/lookup")]
    [Authorize]
    public class LookupController : ControllerBase
    {
        private readonly ILookupService _lookupService;

        public LookupController(ILookupService lookupService)
        {
            _lookupService = lookupService;
        }

        /// <summary>
        /// Retrieves reference items by type (departments, designations, branches, companies, employees, roles, items, etc.)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetLookup(
            [FromQuery] string type,
            [FromQuery] string? search,
            [FromQuery] Guid? companyId,
            [FromQuery] Guid? parentId,
            [FromQuery] int limit = 100,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(type))
            {
                return BadRequest(new { message = "Parameter 'type' is required." });
            }

            var query = new LookupQuery
            {
                Search = search,
                CompanyId = companyId,
                ParentId = parentId,
                Limit = limit
            };

            var result = await _lookupService.GetLookupItemsAsync(type, query, ct);
            return Ok(result);
        }

        /// <summary>
        /// Batch retrieval for pre-loading all select options for complex forms in 1 round-trip.
        /// e.g. /api/v1/lookup/batch?types=departments,designations,branches,employment-types
        /// </summary>
        [HttpGet("batch")]
        public async Task<IActionResult> GetBatch(
            [FromQuery] string types,
            [FromQuery] Guid? companyId,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(types))
            {
                return BadRequest(new { message = "Parameter 'types' is required (comma-separated list of types)." });
            }

            var typeList = types.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var result = await _lookupService.GetBatchLookupsAsync(typeList, companyId, ct);
            return Ok(new { lookups = result });
        }
    }
}
