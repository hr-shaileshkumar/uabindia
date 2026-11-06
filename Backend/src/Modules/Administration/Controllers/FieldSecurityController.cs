using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using UabIndia.Application.Common.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    public class UnmaskFieldRequestDto
    {
        [Required]
        public string EntityName { get; set; } = string.Empty;

        [Required]
        public Guid EntityId { get; set; }

        [Required]
        public string FieldName { get; set; } = string.Empty;

        [Required]
        [MinLength(5, ErrorMessage = "Business justification must be at least 5 characters.")]
        public string Justification { get; set; } = string.Empty;
    }

    public class UnmaskFieldResponseDto
    {
        public string EntityName { get; set; } = string.Empty;
        public Guid EntityId { get; set; }
        public string FieldName { get; set; } = string.Empty;
        public string? UnmaskedValue { get; set; }
        public DateTime UnmaskedAt { get; set; }
        public Guid UnmaskedBy { get; set; }
    }

    [ApiController]
    [Route("api/v1/security")]
    [Authorize]
    public class FieldSecurityController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public FieldSecurityController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpPost("unmask-field")]
        public async Task<IActionResult> UnmaskField([FromBody] UnmaskFieldRequestDto request)
        {
            if (request == null || request.EntityId == Guid.Empty || string.IsNullOrWhiteSpace(request.FieldName))
            {
                return BadRequest(ApiResponse<UnmaskFieldResponseDto>.Fail(
                    "EntityId, EntityName, and FieldName are required.",
                    "INVALID_UNMASK_REQUEST"));
            }

            if (string.IsNullOrWhiteSpace(request.Justification) || request.Justification.Trim().Length < 5)
            {
                return BadRequest(ApiResponse<UnmaskFieldResponseDto>.Fail(
                    "A valid business justification (minimum 5 characters) is required to unmask sensitive fields.",
                    "JUSTIFICATION_REQUIRED",
                    "justification"));
            }

            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized();
            }

            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty && !IsSuperAdmin())
            {
                return BadRequest(ApiResponse<UnmaskFieldResponseDto>.Fail(
                    "Tenant context missing.",
                    "TENANT_REQUIRED"));
            }

            // Check authorization to unmask
            bool isAuthorized = IsSuperAdmin()
                || User.IsInRole("Admin")
                || User.IsInRole("HR Manager")
                || User.IsInRole("Payroll Admin")
                || User.IsInRole("Finance Manager")
                || User.HasClaim("permission", "hrms.employees.sensitive")
                || User.HasClaim("permission", "security.unmask");

            if (!isAuthorized)
            {
                return Forbid();
            }

            // Find entity using EF Core metadata model
            var normalizedEntity = request.EntityName.Trim();
            var efEntityType = _db.Model.GetEntityTypes().FirstOrDefault(t =>
                string.Equals(t.ClrType.Name, normalizedEntity, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(t.GetTableName(), normalizedEntity, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(t.ClrType.Name, normalizedEntity.TrimEnd('s'), StringComparison.OrdinalIgnoreCase));

            if (efEntityType == null)
            {
                return NotFound(ApiResponse<UnmaskFieldResponseDto>.Fail(
                    $"Entity type '{request.EntityName}' not recognized.",
                    "ENTITY_NOT_FOUND"));
            }

            var entity = await _db.FindAsync(efEntityType.ClrType, request.EntityId);
            if (entity == null)
            {
                return NotFound(ApiResponse<UnmaskFieldResponseDto>.Fail(
                    $"Record '{request.EntityId}' not found.",
                    "RECORD_NOT_FOUND"));
            }

            // Verify tenant boundary
            if (!IsSuperAdmin() && entity is BaseEntity baseEntity && baseEntity.TenantId != tenantId)
            {
                return Forbid();
            }

            // Find property
            var prop = efEntityType.FindProperty(request.FieldName)
                       ?? efEntityType.GetProperties().FirstOrDefault(p => string.Equals(p.Name, request.FieldName, StringComparison.OrdinalIgnoreCase));

            if (prop == null)
            {
                return NotFound(ApiResponse<UnmaskFieldResponseDto>.Fail(
                    $"Field '{request.FieldName}' not found on entity '{request.EntityName}'.",
                    "FIELD_NOT_FOUND"));
            }

            var rawValue = _db.Entry(entity).Property(prop.Name).CurrentValue?.ToString();

            // Record immutable audit log
            var audit = new AuditLog
            {
                TenantId = tenantId != Guid.Empty ? tenantId : (entity is BaseEntity b ? b.TenantId : Guid.Empty),
                EntityName = efEntityType.ClrType.Name,
                EntityId = request.EntityId,
                Action = $"FieldUnmask:{prop.Name}",
                OldValue = "Masked",
                NewValue = $"Unmasked: {prop.Name} (Justification: {request.Justification.Trim()})",
                PerformedBy = userId,
                PerformedAt = DateTime.UtcNow,
                Ip = HttpContext?.Connection?.RemoteIpAddress?.ToString()
            };
            _db.AuditLogs.Add(audit);
            await _db.SaveChangesAsync();

            var result = new UnmaskFieldResponseDto
            {
                EntityName = efEntityType.ClrType.Name,
                EntityId = request.EntityId,
                FieldName = prop.Name,
                UnmaskedValue = rawValue,
                UnmaskedAt = DateTime.UtcNow,
                UnmaskedBy = userId
            };

            return Ok(ApiResponse<UnmaskFieldResponseDto>.Ok(result, "Field successfully unmasked. Access has been audited."));
        }

        private bool IsSuperAdmin() => User?.HasClaim("is_system_admin", "true") == true || User?.IsInRole("SuperAdmin") == true;

        private Guid GetUserId()
        {
            var userIdClaim = User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("nameidentifier")?.Value
                ?? User?.FindFirst("sub")?.Value;

            return Guid.TryParse(userIdClaim, out var id) ? id : Guid.Empty;
        }
    }
}
