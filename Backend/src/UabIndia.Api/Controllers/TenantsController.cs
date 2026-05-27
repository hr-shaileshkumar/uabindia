using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Services;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Policy = "Module:platform")]
    public class TenantsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly TenantProvisioningService _provisioningService;
        private readonly ILogger<TenantsController> _logger;
        private readonly IDistributedCache _cache;

        public TenantsController(
            ApplicationDbContext db,
            TenantProvisioningService provisioningService,
            ILogger<TenantsController> logger,
            IDistributedCache cache)
        {
            _db = db;
            _provisioningService = provisioningService;
            _logger = logger;
            _cache = cache;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] bool includeDeleted = false)
        {
            var roleClaims = User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value);
            var isSuperAdmin = RoleCatalog.HasAnyRole(roleClaims, SystemRole.SuperAdmin);

            var tenantQuery = _db.Tenants.AsNoTracking().IgnoreQueryFilters().AsQueryable();

            if (!(isSuperAdmin && includeDeleted))
            {
                tenantQuery = tenantQuery.Where(t => !t.IsDeleted);
            }

            var tenants = await tenantQuery
                .OrderBy(t => t.Name)
                .ToListAsync();

            var data = new System.Collections.Generic.List<TenantDto>(tenants.Count);
            foreach (var tenant in tenants)
            {
                data.Add(await _provisioningService.BuildTenantDtoAsync(tenant));
            }

            return Ok(new { tenants = data });
        }

        [AllowAnonymous]
        [HttpGet("resolve")]
        public async Task<IActionResult> Resolve([FromQuery] string subdomain)
        {
            if (string.IsNullOrWhiteSpace(subdomain))
            {
                return BadRequest(new { message = "Subdomain is required." });
            }

            var tenant = await _db.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Subdomain == subdomain && !t.IsDeleted);

            if (tenant == null)
            {
                return NotFound(new { exists = false });
            }

            return Ok(new { exists = true, name = tenant.Name ?? string.Empty, isActive = tenant.IsActive });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTenantDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    message = ExtractModelStateMessage(ModelState)
                });
            }

            try
            {
                var requestToken = string.IsNullOrWhiteSpace(dto.TenantProvisionRequestId)
                    ? null
                    : dto.TenantProvisionRequestId.Trim();

                var idempotencyKey = string.IsNullOrWhiteSpace(requestToken)
                    ? null
                    : $"tenant-provision:{requestToken}";

                if (!string.IsNullOrWhiteSpace(idempotencyKey))
                {
                    var existingState = await _cache.GetStringAsync(idempotencyKey);
                    if (!string.IsNullOrWhiteSpace(existingState))
                    {
                        return Accepted(new
                        {
                            provisioningStatus = existingState,
                            message = "A tenant onboarding request with this token is already in progress or completed."
                        });
                    }

                    await _cache.SetStringAsync(
                        idempotencyKey,
                        "in_progress",
                        new DistributedCacheEntryOptions
                        {
                            AbsoluteExpirationRelativeToNow = System.TimeSpan.FromMinutes(20)
                        });
                }

                var tenant = await _provisioningService.CreateTenantRecordAsync(dto);
                string? jobId = null;

                try
                {
                    jobId = Hangfire.BackgroundJob.Enqueue<TenantProvisioningService>(svc => svc.ProvisionTenantAsync(tenant.Id, dto, null));
                }
                catch (System.Exception ex)
                {
                    _logger.LogWarning(ex, "Hangfire queue unavailable; falling back to inline tenant provisioning for tenant {TenantId}", tenant.Id);

                    try
                    {
                        await _provisioningService.ProvisionTenantAsync(tenant.Id, dto);
                    }
                    catch (System.Exception provisioningEx)
                    {
                        await _provisioningService.RollbackTenantCreationAsync(tenant.Id, provisioningEx.Message);
                        throw;
                    }
                }

                if (!string.IsNullOrWhiteSpace(idempotencyKey))
                {
                    await _cache.SetStringAsync(
                        idempotencyKey,
                        jobId == null ? "completed" : "queued",
                        new DistributedCacheEntryOptions
                        {
                            AbsoluteExpirationRelativeToNow = System.TimeSpan.FromHours(24)
                        });
                }

                return Accepted(new
                {
                    tenantId = tenant.Id,
                    subdomain = tenant.Subdomain,
                    provisioningStatus = jobId == null ? "completed" : "queued",
                    jobId,
                    onboardingCredentials = new
                    {
                        deliveryChannel = "dashboard_popup",
                        adminEmail = dto.AdminEmail?.Trim(),
                        temporaryPassword = dto.SendInviteLink ? null : dto.AdminPassword,
                        requirePasswordReset = true
                    },
                    message = jobId == null
                        ? "Tenant onboarding completed."
                        : "Tenant created and onboarding queued."
                });
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Failed to create tenant");
                return StatusCode(500, new { message = "Tenant provisioning failed.", detail = ex.Message });
            }
        }

        [HttpGet("provisioning/dashboard")]
        public async Task<IActionResult> ProvisioningDashboard()
        {
            var tenants = await _db.Tenants
                .AsNoTracking()
                .Where(t => !t.IsDeleted)
                .OrderByDescending(t => t.CreatedAt)
                .Take(200)
                .ToListAsync();

            var data = new System.Collections.Generic.List<TenantProvisioningService.TenantProvisioningSnapshotDto>(tenants.Count);
            foreach (var tenant in tenants)
            {
                data.Add(await _provisioningService.BuildProvisioningSnapshotAsync(tenant));
            }

            return Ok(new { tenants = data });
        }

        [HttpGet("{id:guid}/health")]
        public async Task<IActionResult> Health(System.Guid id, [FromQuery] bool recover = false)
        {
            var tenant = await _db.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found." });
            }

            var health = await _provisioningService.BuildTenantHealthSnapshotAsync(tenant);

            if (recover
                && health.SchemaExists
                && health.HasAllCoreTables
                && (!health.HasAdminUser || !health.HasAdminRole || !health.HasAdminRoleMapping))
            {
                await _provisioningService.RepairTenantAsync(id, HttpContext?.TraceIdentifier);
                health = await _provisioningService.BuildTenantHealthSnapshotAsync(tenant);
            }

            return Ok(health);
        }

        [HttpGet("{id:guid}/provisioning/logs")]
        public async Task<IActionResult> ProvisioningLogs(Guid id, [FromQuery] int take = 100)
        {
            var tenant = await _db.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found." });
            }

            var logs = await _provisioningService.GetTenantProvisionLogsAsync(id, take);
            return Ok(new
            {
                tenantId = id,
                count = logs.Count,
                logs
            });
        }

        [HttpPost("{id:guid}/repair")]
        public async Task<IActionResult> Repair(Guid id)
        {
            var tenant = await _db.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found." });
            }

            var correlationId = HttpContext?.TraceIdentifier ?? Guid.NewGuid().ToString("N");

            try
            {
                var repaired = await _provisioningService.RepairTenantAsync(id, correlationId);
                return Ok(new
                {
                    tenantId = id,
                    provisioningStatus = repaired.ProvisionStatus,
                    correlationId,
                    health = repaired,
                    message = "Tenant repair completed."
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message, correlationId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Tenant repair failed for tenant {TenantId} with correlation {CorrelationId}", id, correlationId);
                return StatusCode(500, new { message = "Tenant repair failed.", correlationId, detail = ex.Message });
            }
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(System.Guid id, [FromBody] UpdateTenantDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    message = ExtractModelStateMessage(ModelState)
                });
            }

            var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == id);
            if (tenant == null) return NotFound(new { message = "Tenant not found." });

            try
            {
                if (IsMasterTenant(tenant)
                    && !string.IsNullOrWhiteSpace(dto.Subdomain)
                    && !string.Equals(dto.Subdomain.Trim(), tenant.Subdomain, StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { message = "Master tenant schema changes are restricted." });
                }

                if (!string.IsNullOrWhiteSpace(dto.Subdomain)
                    && !string.Equals(dto.Subdomain.Trim(), tenant.Subdomain, System.StringComparison.OrdinalIgnoreCase))
                {
                    await _provisioningService.RenameTenantSchemaAsync(tenant, dto.Subdomain.Trim());
                }

                if (!string.IsNullOrWhiteSpace(dto.Name))
                {
                    tenant.Name = dto.Name.Trim();
                }

                if (dto.IsActive.HasValue)
                {
                    tenant.IsActive = dto.IsActive.Value;
                }

                if (!string.IsNullOrWhiteSpace(dto.Status))
                {
                    tenant.IsActive = dto.Status.Trim().ToLowerInvariant() is "active" or "trial";
                }

                tenant.UpdatedAt = System.DateTime.UtcNow;
                await _db.SaveChangesAsync();

                await _provisioningService.EnsureTenantSchemaReadyForUpdateAsync(tenant, dto);
                await _provisioningService.ApplyTenantUpdateAsync(tenant, dto);
                var payload = await _provisioningService.BuildTenantDtoAsync(tenant);

                return Ok(payload);
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Failed to update tenant");
                return StatusCode(500, new { message = "Tenant update failed.", detail = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(System.Guid id)
        {
            var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == id);
            if (tenant == null) return NotFound(new { message = "Tenant not found." });

            if (IsMasterTenant(tenant))
            {
                return BadRequest(new { message = "Master tenant cannot be deleted." });
            }

            Guid? deletedBy = null;
            var principalUserId = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrWhiteSpace(principalUserId) && Guid.TryParse(principalUserId, out var parsedUserId))
            {
                deletedBy = parsedUserId;
            }

            tenant.IsDeleted = true;
            tenant.IsActive = false;
            tenant.DeletedAt = DateTime.UtcNow;
            tenant.DeletedBy = deletedBy;
            tenant.UpdatedAt = System.DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return NoContent();
        }

        private static string ExtractModelStateMessage(ModelStateDictionary modelState)
        {
            var first = modelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .FirstOrDefault(m => !string.IsNullOrWhiteSpace(m));

            return string.IsNullOrWhiteSpace(first)
                ? "Validation failed. Please check the highlighted fields and try again."
                : first;
        }

        private static bool IsMasterTenant(Tenant tenant)
        {
            return string.Equals(tenant.Subdomain, "master", StringComparison.OrdinalIgnoreCase);
        }
    }
}
