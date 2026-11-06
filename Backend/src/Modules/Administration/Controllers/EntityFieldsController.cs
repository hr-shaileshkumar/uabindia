using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/entity-fields")]
    [Route("api/v1/administration/entity-fields")]
    [Authorize]
    public class EntityFieldsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public EntityFieldsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private void WriteAudit(Guid tenantId, string action, string entityName, Guid entityId, string? detail = null)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _db.AuditLogs.Add(new AuditLog
            {
                TenantId    = tenantId,
                EntityName  = "EntityFieldDefinition:" + entityName,
                EntityId    = entityId,
                Action      = action,
                NewValue    = detail,
                PerformedBy = Guid.TryParse(userIdClaim, out var uid) ? uid : null,
                Ip          = HttpContext.Connection.RemoteIpAddress?.ToString(),
                PerformedAt = DateTime.UtcNow,
            });
        }

        // ──────────────────────────────────────────────────────────────
        // SCHEMA (definitions)
        // ──────────────────────────────────────────────────────────────

        /// <summary>Get all field definitions for an entity type.</summary>
        [HttpGet("definitions/{entityName}")]
        public async Task<IActionResult> GetDefinitions(string entityName)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var defs = await _db.EntityFieldDefinitions
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && d.EntityName == entityName && !d.IsDeleted)
                .OrderBy(d => d.SortOrder).ThenBy(d => d.FieldLabel)
                .Select(d => new FieldDefinitionDto
                {
                    Id = d.Id,
                    EntityName = d.EntityName,
                    FieldKey = d.FieldKey,
                    FieldLabel = d.FieldLabel,
                    FieldType = d.FieldType,
                    Options = d.OptionsJson != null
                        ? JsonSerializer.Deserialize<List<string>>(d.OptionsJson, (JsonSerializerOptions?)null)
                        : null,
                    IsRequired = d.IsRequired,
                    IsActive = d.IsActive,
                    SortOrder = d.SortOrder,
                    Section = d.Section,
                })
                .ToListAsync();

            return Ok(new
            {
                items = defs,
                records = defs,
                definitions = defs,
                total = defs.Count,
                totalCount = defs.Count
            });
        }

        /// <summary>Get all entity types that have definitions in this tenant (for Schema Manager).</summary>
        [HttpGet("definitions")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> GetAllDefinitions()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var defs = await _db.EntityFieldDefinitions
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && !d.IsDeleted)
                .OrderBy(d => d.EntityName).ThenBy(d => d.SortOrder)
                .Select(d => new FieldDefinitionDto
                {
                    Id = d.Id,
                    EntityName = d.EntityName,
                    FieldKey = d.FieldKey,
                    FieldLabel = d.FieldLabel,
                    FieldType = d.FieldType,
                    Options = d.OptionsJson != null
                        ? JsonSerializer.Deserialize<List<string>>(d.OptionsJson, (JsonSerializerOptions?)null)
                        : null,
                    IsRequired = d.IsRequired,
                    IsActive = d.IsActive,
                    SortOrder = d.SortOrder,
                    Section = d.Section,
                })
                .ToListAsync();

            return Ok(new
            {
                items = defs,
                records = defs,
                definitions = defs,
                total = defs.Count,
                totalCount = defs.Count
            });
        }

        /// <summary>Create a new field definition (SuperAdmin/Admin only).</summary>
        [HttpPost("definitions")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> CreateDefinition([FromBody] CreateFieldDefinitionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();

            // Check for duplicate key within entity
            var exists = await _db.EntityFieldDefinitions.AnyAsync(d =>
                d.TenantId == tenantId &&
                d.EntityName == dto.EntityName &&
                d.FieldKey == dto.FieldKey &&
                !d.IsDeleted);

            if (exists)
                return Conflict(new { message = $"Field '{dto.FieldKey}' already exists for entity '{dto.EntityName}'." });

            var def = new EntityFieldDefinition
            {
                TenantId = tenantId,
                EntityName = dto.EntityName.Trim(),
                FieldKey = dto.FieldKey.Trim().ToLower().Replace(" ", "_"),
                FieldLabel = dto.FieldLabel.Trim(),
                FieldType = dto.FieldType,
                OptionsJson = dto.Options != null ? JsonSerializer.Serialize(dto.Options) : null,
                IsRequired = dto.IsRequired,
                IsActive = true,
                SortOrder = dto.SortOrder,
                Section = dto.Section?.Trim(),
            };

            _db.EntityFieldDefinitions.Add(def);
            WriteAudit(tenantId, "CREATE_FIELD_DEF", def.EntityName, def.Id, $"{def.FieldLabel} ({def.FieldType})");
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDefinitions), new { entityName = def.EntityName }, new FieldDefinitionDto
            {
                Id = def.Id,
                EntityName = def.EntityName,
                FieldKey = def.FieldKey,
                FieldLabel = def.FieldLabel,
                FieldType = def.FieldType,
                Options = dto.Options,
                IsRequired = def.IsRequired,
                IsActive = def.IsActive,
                SortOrder = def.SortOrder,
                Section = def.Section,
            });
        }

        /// <summary>Update an existing field definition.</summary>
        [HttpPut("definitions/{id}")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> UpdateDefinition(Guid id, [FromBody] UpdateFieldDefinitionDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var def = await _db.EntityFieldDefinitions.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId && !d.IsDeleted);
            if (def == null) return NotFound();

            if (dto.FieldLabel != null) def.FieldLabel = dto.FieldLabel.Trim();
            if (dto.FieldType != null) def.FieldType = dto.FieldType;
            if (dto.Options != null) def.OptionsJson = JsonSerializer.Serialize(dto.Options);
            if (dto.IsRequired.HasValue) def.IsRequired = dto.IsRequired.Value;
            if (dto.IsActive.HasValue) def.IsActive = dto.IsActive.Value;
            if (dto.SortOrder.HasValue) def.SortOrder = dto.SortOrder.Value;
            if (dto.Section != null) def.Section = dto.Section.Trim();
            def.UpdatedAt = DateTime.UtcNow;
            WriteAudit(tenantId, "UPDATE_FIELD_DEF", def.EntityName, def.Id, $"{def.FieldLabel} ({def.FieldType})");

            await _db.SaveChangesAsync();
            return Ok(new { id = def.Id, message = "Updated successfully." });
        }

        /// <summary>Delete (soft-delete) a field definition.</summary>
        [HttpDelete("definitions/{id}")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> DeleteDefinition(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var def = await _db.EntityFieldDefinitions.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId && !d.IsDeleted);
            if (def == null) return NotFound();

            def.IsDeleted = true;
            def.UpdatedAt = DateTime.UtcNow;
            WriteAudit(tenantId, "DELETE_FIELD_DEF", def.EntityName, def.Id, def.FieldLabel);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // ──────────────────────────────────────────────────────────────
        // VALUES (per-record field data)
        // ──────────────────────────────────────────────────────────────

        /// <summary>Get all custom field values for a specific record.</summary>
        [HttpGet("values/{entityName}/{recordId}")]
        public async Task<IActionResult> GetValues(string entityName, Guid recordId)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            // Fetch schema + values in one go using LEFT JOIN semantics
            var defs = await _db.EntityFieldDefinitions
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && d.EntityName == entityName && d.IsActive && !d.IsDeleted)
                .OrderBy(d => d.SortOrder)
                .ToListAsync();

            var values = await _db.EntityFieldValues
                .AsNoTracking()
                .Where(v => v.TenantId == tenantId && v.RecordId == recordId && !v.IsDeleted)
                .ToListAsync();

            var valueMap = values.ToDictionary(v => v.FieldDefinitionId);

            var result = defs.Select(d => new FieldValueDto
            {
                FieldDefinitionId = d.Id,
                FieldKey = d.FieldKey,
                FieldLabel = d.FieldLabel,
                FieldType = d.FieldType,
                Options = d.OptionsJson != null
                    ? JsonSerializer.Deserialize<List<string>>(d.OptionsJson, (JsonSerializerOptions?)null)
                    : null,
                IsRequired = d.IsRequired,
                Section = d.Section,
                Value = valueMap.TryGetValue(d.Id, out var fv) ? fv.Value : null,
                ValueId = valueMap.TryGetValue(d.Id, out var fv2) ? fv2.Id : null,
            }).ToList();

            return Ok(new { values = result });
        }

        /// <summary>Upsert custom field values for a record (bulk save).</summary>
        [HttpPost("values/{entityName}/{recordId}")]
        public async Task<IActionResult> SaveValues(string entityName, Guid recordId, [FromBody] SaveFieldValuesDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            // Validate field definition ids belong to this entity + tenant
            var defIds = dto.Values.Select(v => v.FieldDefinitionId).ToHashSet();
            var validDefs = await _db.EntityFieldDefinitions
                .Where(d => defIds.Contains(d.Id) && d.TenantId == tenantId && d.EntityName == entityName && !d.IsDeleted)
                .ToDictionaryAsync(d => d.Id);

            // Enforce required fields — collect all required active defs for this entity, check values provided
            var allActiveDefs = await _db.EntityFieldDefinitions
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && d.EntityName == entityName && d.IsRequired && d.IsActive && !d.IsDeleted)
                .ToListAsync();

            var valueMap = dto.Values.ToDictionary(v => v.FieldDefinitionId);
            var missingRequired = allActiveDefs
                .Where(d => !valueMap.TryGetValue(d.Id, out var val) || string.IsNullOrWhiteSpace(val.Value))
                .Select(d => d.FieldLabel)
                .ToList();

            if (missingRequired.Count > 0)
                return BadRequest(new { message = "Required custom fields are missing.", missingFields = missingRequired });

            var existingValues = await _db.EntityFieldValues
                .Where(v => v.TenantId == tenantId && v.RecordId == recordId && defIds.Contains(v.FieldDefinitionId) && !v.IsDeleted)
                .ToDictionaryAsync(v => v.FieldDefinitionId);

            foreach (var input in dto.Values)
            {
                if (!validDefs.ContainsKey(input.FieldDefinitionId)) continue;

                if (existingValues.TryGetValue(input.FieldDefinitionId, out var existing))
                {
                    existing.Value = input.Value;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    _db.EntityFieldValues.Add(new EntityFieldValue
                    {
                        TenantId = tenantId,
                        FieldDefinitionId = input.FieldDefinitionId,
                        RecordId = recordId,
                        Value = input.Value,
                    });
                }
            }

            await _db.SaveChangesAsync();
            return Ok(new { message = "Saved successfully." });
        }
    }

    // ──────────────────────── DTOs ────────────────────────

    public class FieldDefinitionDto
    {
        public Guid Id { get; set; }
        public string EntityName { get; set; } = string.Empty;
        public string FieldKey { get; set; } = string.Empty;
        public string FieldLabel { get; set; } = string.Empty;
        public string FieldType { get; set; } = "text";
        public List<string>? Options { get; set; }
        public bool IsRequired { get; set; }
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
        public string? Section { get; set; }
    }

    public class CreateFieldDefinitionDto
    {
        [Required] public string EntityName { get; set; } = string.Empty;
        [Required] public string FieldKey { get; set; } = string.Empty;
        [Required] public string FieldLabel { get; set; } = string.Empty;
        public string FieldType { get; set; } = "text";
        public List<string>? Options { get; set; }
        public bool IsRequired { get; set; }
        public int SortOrder { get; set; }
        public string? Section { get; set; }
    }

    public class UpdateFieldDefinitionDto
    {
        public string? FieldLabel { get; set; }
        public string? FieldType { get; set; }
        public List<string>? Options { get; set; }
        public bool? IsRequired { get; set; }
        public bool? IsActive { get; set; }
        public int? SortOrder { get; set; }
        public string? Section { get; set; }
    }

    public class FieldValueDto
    {
        public Guid FieldDefinitionId { get; set; }
        public Guid? ValueId { get; set; }
        public string FieldKey { get; set; } = string.Empty;
        public string FieldLabel { get; set; } = string.Empty;
        public string FieldType { get; set; } = "text";
        public List<string>? Options { get; set; }
        public bool IsRequired { get; set; }
        public string? Section { get; set; }
        public string? Value { get; set; }
    }

    public class SaveFieldValuesDto
    {
        [Required] public List<FieldValueInput> Values { get; set; } = new();
    }

    public class FieldValueInput
    {
        [Required] public Guid FieldDefinitionId { get; set; }
        public string? Value { get; set; }
    }
}
