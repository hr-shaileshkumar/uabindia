using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/administration/custom-fields")]
    [Route("api/v1/platform/custom-fields")]
    [Authorize]
    public class CustomFieldsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public CustomFieldsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public class CreateCustomFieldDto
        {
            public string EntityName { get; set; } = string.Empty;
            public string FieldKey { get; set; } = string.Empty;
            public string FieldLabel { get; set; } = string.Empty;
            public string FieldType { get; set; } = "text";
            public string? OptionsJson { get; set; }
            public bool IsRequired { get; set; } = false;
            public string? Section { get; set; }
            public int SortOrder { get; set; } = 0;
        }

        public class SaveFieldValueDto
        {
            public Guid RecordId { get; set; }
            public Dictionary<string, string?> FieldValues { get; set; } = new Dictionary<string, string?>();
        }

        [HttpGet("definitions/{entityName}")]
        public async Task<IActionResult> GetDefinitions(string entityName, CancellationToken cancellationToken)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var defs = await _db.EntityFieldDefinitions
                .Where(d => d.TenantId == tenantId && d.EntityName.ToLower() == entityName.ToLower() && d.IsActive && !d.IsDeleted)
                .OrderBy(d => d.SortOrder)
                .ToListAsync(cancellationToken);

            return Ok(defs);
        }

        [HttpPost("definitions")]
        public async Task<IActionResult> CreateDefinition([FromBody] CreateCustomFieldDto dto, CancellationToken cancellationToken)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var key = dto.FieldKey.Trim().ToLower().Replace(" ", "_");
            
            var existing = await _db.EntityFieldDefinitions.FirstOrDefaultAsync(
                d => d.TenantId == tenantId && d.EntityName.ToLower() == dto.EntityName.ToLower() && d.FieldKey == key && !d.IsDeleted,
                cancellationToken);

            if (existing != null)
            {
                return BadRequest(new { message = $"Custom field with key '{key}' already exists for entity '{dto.EntityName}'." });
            }

            var def = new EntityFieldDefinition
            {
                TenantId = tenantId,
                EntityName = dto.EntityName,
                FieldKey = key,
                FieldLabel = dto.FieldLabel,
                FieldType = dto.FieldType,
                OptionsJson = dto.OptionsJson,
                IsRequired = dto.IsRequired,
                Section = dto.Section,
                SortOrder = dto.SortOrder,
                IsActive = true
            };

            _db.EntityFieldDefinitions.Add(def);
            await _db.SaveChangesAsync(cancellationToken);
            return Ok(def);
        }

        [HttpGet("values/{entityName}/{recordId:guid}")]
        public async Task<IActionResult> GetRecordValues(string entityName, Guid recordId, CancellationToken cancellationToken)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var defs = await _db.EntityFieldDefinitions
                .Where(d => d.TenantId == tenantId && d.EntityName.ToLower() == entityName.ToLower() && d.IsActive && !d.IsDeleted)
                .ToListAsync(cancellationToken);

            var defIds = defs.Select(d => d.Id).ToList();
            var values = await _db.EntityFieldValues
                .Where(v => v.TenantId == tenantId && v.RecordId == recordId && defIds.Contains(v.FieldDefinitionId) && !v.IsDeleted)
                .ToListAsync(cancellationToken);

            var resultMap = new Dictionary<string, string?>();
            foreach (var def in defs)
            {
                var val = values.FirstOrDefault(v => v.FieldDefinitionId == def.Id);
                resultMap[def.FieldKey] = val?.Value;
            }

            return Ok(new { entityName, recordId, values = resultMap });
        }

        [HttpPost("values/{entityName}")]
        public async Task<IActionResult> SaveRecordValues(string entityName, [FromBody] SaveFieldValueDto dto, CancellationToken cancellationToken)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var defs = await _db.EntityFieldDefinitions
                .Where(d => d.TenantId == tenantId && d.EntityName.ToLower() == entityName.ToLower() && d.IsActive && !d.IsDeleted)
                .ToListAsync(cancellationToken);

            foreach (var kvp in dto.FieldValues)
            {
                var def = defs.FirstOrDefault(d => d.FieldKey.Equals(kvp.Key, StringComparison.OrdinalIgnoreCase));
                if (def == null) continue;

                var valEntity = await _db.EntityFieldValues.FirstOrDefaultAsync(
                    v => v.TenantId == tenantId && v.RecordId == dto.RecordId && v.FieldDefinitionId == def.Id && !v.IsDeleted,
                    cancellationToken);

                if (valEntity != null)
                {
                    valEntity.Value = kvp.Value;
                    valEntity.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    _db.EntityFieldValues.Add(new EntityFieldValue
                    {
                        TenantId = tenantId,
                        RecordId = dto.RecordId,
                        FieldDefinitionId = def.Id,
                        Value = kvp.Value
                    });
                }
            }

            await _db.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Custom field values saved." });
        }
    }
}
