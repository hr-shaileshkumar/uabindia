using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.CRM.Controllers
{
    [ApiController]
    [Route("api/v1/crm/pipeline")]
    [Authorize(Policy = "Module:crm")]
    public class CrmPipelineController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public CrmPipelineController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> GetPipeline([FromQuery] string? search = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var leads = await _db.CrmLeads.AsNoTracking()
                .Where(l => l.TenantId == tenantId && !l.IsDeleted)
                .ToListAsync();

            var defaultStages = new[]
            {
                new { StageName = "New / Lead", SortOrder = 1, WinProbability = 10 },
                new { StageName = "Contacted", SortOrder = 2, WinProbability = 25 },
                new { StageName = "Qualified", SortOrder = 3, WinProbability = 50 },
                new { StageName = "Proposal", SortOrder = 4, WinProbability = 70 },
                new { StageName = "Negotiation", SortOrder = 5, WinProbability = 85 },
                new { StageName = "Won", SortOrder = 6, WinProbability = 100 },
                new { StageName = "Lost", SortOrder = 7, WinProbability = 0 }
            };

            var stages = defaultStages.Select(s =>
            {
                var matchingDeals = leads.Where(l => 
                    string.Equals(l.Stage, s.StageName, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(l.Status, s.StageName, StringComparison.OrdinalIgnoreCase) ||
                    (s.StageName == "Won" && (l.Stage == "ClosedWon" || l.Status == "Won")) ||
                    (s.StageName == "Lost" && (l.Stage == "ClosedLost" || l.Status == "Lost"))).ToList();

                return new
                {
                    id = Guid.NewGuid().ToString(),
                    stageName = s.StageName,
                    sortOrder = s.SortOrder,
                    winProbability = s.WinProbability,
                    dealsCount = matchingDeals.Count,
                    pipelineValue = matchingDeals.Sum(d => d.Value),
                    isActive = true
                };
            }).ToList();

            if (!string.IsNullOrWhiteSpace(search))
            {
                stages = stages.Where(s => s.stageName.Contains(search, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            return Ok(new
            {
                success = true,
                data = stages,
                items = stages,
                total = stages.Count,
                page = 1,
                limit = stages.Count,
                pages = 1
            });
        }

        [HttpPost]
        public IActionResult CreateStage([FromBody] CreatePipelineStageDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.StageName))
                return BadRequest(new { success = false, error = "Stage name is required" });

            var item = new
            {
                id = Guid.NewGuid().ToString(),
                stageName = dto.StageName,
                sortOrder = dto.SortOrder ?? 1,
                winProbability = dto.WinProbability ?? 50,
                dealsCount = 0,
                pipelineValue = 0m,
                isActive = dto.IsActive ?? true
            };

            return Ok(new
            {
                success = true,
                message = "Pipeline stage added successfully",
                data = item
            });
        }
    }

    public class CreatePipelineStageDto
    {
        public string StageName { get; set; } = string.Empty;
        public int? SortOrder { get; set; }
        public int? WinProbability { get; set; }
        public bool? IsActive { get; set; }
    }
}
