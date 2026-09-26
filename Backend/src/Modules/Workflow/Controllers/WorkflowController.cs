using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Application.Models;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Workflow.Controllers
{
    [ApiController]
    [Route("api/v1/workflows")]
    [Authorize]
    public class WorkflowController : ControllerBase
    {
        private readonly IWorkflowService _workflowService;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ApplicationDbContext _db;
        private readonly IWorkflowDefinitionService _definitions;
        private readonly IWorkflowApprovalQueryService _approvals;

        public WorkflowController(
            IWorkflowService workflowService,
            ITenantAccessor tenantAccessor,
            ApplicationDbContext db,
            IWorkflowDefinitionService definitions,
            IWorkflowApprovalQueryService approvals)
        {
            _workflowService = workflowService;
            _tenantAccessor = tenantAccessor;
            _db = db;
            _definitions = definitions;
            _approvals = approvals;
        }

        [HttpPost("definitions")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> CreateDefinition([FromBody] CreateWorkflowDefinitionDto request)
        {
            if (request == null)
                return BadRequest(new { message = "Workflow key and name are required." });

            try
            {
                var workflow = await _definitions.CreateAsync(new CreateWorkflowDefinitionCommand(
                    request.Key,
                    request.Name,
                    request.IsActive,
                    (request.Steps ?? new List<CreateWorkflowDefinitionStepDto>()).Select(step => new CreateWorkflowStepCommand(
                        step.StepOrder,
                        step.RoleRequired,
                        step.ApprovalType,
                        step.EscalationDays)).ToList()));
                return CreatedAtAction(nameof(GetDefinition), new { key = workflow.ModuleKey }, MapDefinition(workflow));
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("definitions/sync-defaults")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> SyncDefaultDefinitions([FromQuery] bool allTenants = false)
        {
            var seeder = new UabIndia.Api.Services.WorkflowDefinitionSeeder();
            if (allTenants && User.IsInRole("SuperAdmin"))
            {
                var count = await seeder.SyncAllTenantsWorkflowDefinitionsAsync(_db, _tenantAccessor);
                return Ok(new { success = true, message = "Successfully synced default workflows across all active tenants.", seededCount = count });
            }
            else
            {
                var tenantId = _tenantAccessor.GetTenantId();
                if (tenantId == Guid.Empty)
                    return BadRequest(new { message = "Tenant context missing" });

                var count = await seeder.EnsureWorkflowDefinitionsForTenantAsync(_db, tenantId);
                return Ok(new { success = true, message = "Successfully synced default workflows for tenant.", tenantId, seededCount = count });
            }
        }

        [HttpGet("definitions")]
        public async Task<IActionResult> ListDefinitions()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { message = "Tenant context missing" });
            }

            var workflows = await _db.WorkflowDefinitions
                .Include(w => w.Steps)
                .AsNoTracking()
                .Where(w => w.TenantId == tenantId)
                .OrderBy(w => w.Name)
                .ToListAsync();

            return Ok(new { definitions = workflows.Select(MapDefinition).ToList() });
        }

        [HttpGet("definitions/{key}")]
        public async Task<IActionResult> GetDefinition(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return BadRequest(new { message = "Workflow key is required." });
            }

            var definitionKey = key.Trim().ToLowerInvariant();
            var workflow = await _db.WorkflowDefinitions
                .Include(w => w.Steps)
                .AsNoTracking()
                .FirstOrDefaultAsync(w => w.ModuleKey == definitionKey);

            if (workflow == null)
            {
                return NotFound(new { message = "Workflow definition not found." });
            }

            return Ok(MapDefinition(workflow));
        }

        [HttpPost("instances")]
        public async Task<IActionResult> StartInstance([FromBody] StartInstanceRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.DefinitionKey))
            {
                return BadRequest(new { message = "Definition key is required" });
            }

            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { message = "Tenant context missing" });
            }

            var initiatedBy = GetUserId();
            if (initiatedBy == Guid.Empty)
            {
                return Unauthorized();
            }

            request.TenantId = tenantId;
            request.Variables ??= new System.Collections.Generic.Dictionary<string, object>();

            var instance = await _workflowService.StartInstanceAsync(request, initiatedBy);
            return CreatedAtAction(nameof(GetInstance), new { id = instance.Id }, instance);
        }

        [HttpGet("instances/{id}")]
        public async Task<IActionResult> GetInstance(Guid id)
        {
            try
            {
                var instance = await _workflowService.GetInstanceAsync(id);
                return Ok(instance);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { message = "Instance not found" });
            }
        }

        [HttpPost("instances/{id}/actions")]
        public async Task<IActionResult> PerformAction(Guid id, [FromBody] ActionRequestDto action)
        {
            if (action == null || string.IsNullOrWhiteSpace(action.ActionType))
            {
                return BadRequest(new { message = "Invalid action" });
            }

            var performedBy = GetUserId();
            if (performedBy == Guid.Empty)
            {
                return Unauthorized();
            }

            string? ifMatch = null;
            if (Request.Headers.TryGetValue("If-Match", out var rawHeader))
            {
                ifMatch = rawHeader.FirstOrDefault();
                if (!string.IsNullOrWhiteSpace(ifMatch))
                {
                    ifMatch = ifMatch.Trim();
                    if (ifMatch.StartsWith("\"", StringComparison.Ordinal) && ifMatch.EndsWith("\"", StringComparison.Ordinal) && ifMatch.Length >= 2)
                    {
                        ifMatch = ifMatch.Substring(1, ifMatch.Length - 2);
                    }
                }
            }

            try
            {
                var updated = await _workflowService.PerformActionAsync(id, action, performedBy, ifMatch);
                return Ok(updated);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { message = "Instance not found" });
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(412, new { code = "Concurrency", message = ex.Message });
            }
        }

        [HttpGet("instances/{id}/approvals")]
        public async Task<IActionResult> GetApprovals(Guid id, [FromQuery] bool mine = true)
        {
            try
            {
                var pending = await _approvals.GetPendingAsync(id, GetRoleClaims(), mine);
                return Ok(new WorkflowApprovalsResponseDto
                {
                    InstanceId = pending.InstanceId,
                    DefinitionKey = pending.DefinitionKey,
                    Status = pending.Status,
                    CurrentStepOrder = pending.CurrentStepOrder,
                    PendingApprovals = pending.PendingApprovals.Select(step => new WorkflowApprovalStepDto
                    {
                        StepOrder = step.StepOrder,
                        RoleRequired = step.RoleRequired,
                        ApprovalType = step.ApprovalType ?? string.Empty,
                        EscalationDays = step.EscalationDays,
                        CanCurrentUserAct = step.CanCurrentUserAct,
                        IsCurrentStep = step.IsCurrentStep
                    }).ToList()
                });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Approval instance not found." });
            }
        }

        private Guid GetUserId()
        {
            var userIdClaim = User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("nameidentifier")?.Value
                ?? User?.FindFirst("sub")?.Value;

            return Guid.TryParse(userIdClaim, out var id) ? id : Guid.Empty;
        }

        private List<string> GetRoleClaims()
        {
            return User?.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase) || c.Type.EndsWith("role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .ToList()
                ?? new List<string>();
        }

        private static WorkflowDefinitionResponseDto MapDefinition(WorkflowDefinition workflow)
        {
            return new WorkflowDefinitionResponseDto
            {
                Id = workflow.Id,
                Key = workflow.ModuleKey,
                Name = workflow.Name,
                IsActive = workflow.IsActive,
                Steps = workflow.Steps
                    .OrderBy(step => step.StepOrder)
                    .Select(step => new WorkflowDefinitionStepResponseDto
                    {
                        StepOrder = step.StepOrder,
                        RoleRequired = step.RoleRequired,
                        ApprovalType = step.ApprovalType,
                        EscalationDays = step.EscalationDays
                    })
                    .ToList()
            };
        }
    }

    public class CreateWorkflowDefinitionDto
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public List<CreateWorkflowDefinitionStepDto> Steps { get; set; } = new();
    }

    public class CreateWorkflowDefinitionStepDto
    {
        public int? StepOrder { get; set; }
        public string RoleRequired { get; set; } = string.Empty;
        public string ApprovalType { get; set; } = "Any";
        public int? EscalationDays { get; set; }
    }

    public class WorkflowDefinitionResponseDto
    {
        public Guid Id { get; set; }
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public List<WorkflowDefinitionStepResponseDto> Steps { get; set; } = new();
    }

    public class WorkflowDefinitionStepResponseDto
    {
        public int StepOrder { get; set; }
        public string RoleRequired { get; set; } = string.Empty;
        public string ApprovalType { get; set; } = string.Empty;
        public int? EscalationDays { get; set; }
    }

    public class WorkflowApprovalsResponseDto
    {
        public Guid InstanceId { get; set; }
        public string DefinitionKey { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int CurrentStepOrder { get; set; }
        public List<WorkflowApprovalStepDto> PendingApprovals { get; set; } = new();
    }

    public class WorkflowApprovalStepDto
    {
        public int StepOrder { get; set; }
        public string RoleRequired { get; set; } = string.Empty;
        public string ApprovalType { get; set; } = string.Empty;
        public int? EscalationDays { get; set; }
        public bool CanCurrentUserAct { get; set; }
        public bool IsCurrentStep { get; set; }
    }
}
