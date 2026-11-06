using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
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
    /// <summary>
    /// Universal Dynamic Entity CRUD Controller.
    /// Provides zero-hardcoded, metadata-driven REST operations for any business entity in the ERP platform.
    /// Handles automated multi-tenant isolation, soft deletion, string search, sorting, pagination,
    /// and tenant custom field hydration via EntityFieldDefinitions / EntityFieldValues.
    /// </summary>
    [ApiController]
    [Route("api/v1/dynamic-entities/{entityName}")]
    [Route("api/data/{entityName}")]
    [Route("api/v1/data/{entityName}")]
    [Authorize]
    public class DynamicEntitiesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;

        public DynamicEntitiesController(ApplicationDbContext db, ITenantAccessor tenantAccessor, IDocumentNumberService numbers)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
        }

        private static readonly string[] StandardCodePropertyNames = new[]
        {
            "Code", "EmployeeCode", "CustomerCode", "VendorCode",
            "InvoiceNumber", "OrderNumber", "DocumentNumber", "ItemCode",
            "Sku", "WarehouseCode", "DepartmentCode", "ProjectCode",
            "AssetCode", "Number", "ReferenceNumber", "SONumber", "PONumber",
            "GrnNumber", "ClaimNumber", "RequestNumber"
        };

        private static string GetStandardPrefix(string entityName)
        {
            var cleaned = entityName.Trim().ToLowerInvariant();
            if (cleaned.Contains("invoice")) return "INV-";
            if (cleaned.Contains("purchaseorder") || cleaned == "po") return "PO-";
            if (cleaned.Contains("salesorder") || cleaned == "so") return "SO-";
            if (cleaned.Contains("employee")) return "EMP-";
            if (cleaned.Contains("customer")) return "CUST-";
            if (cleaned.Contains("vendor") || cleaned.Contains("supplier")) return "VEND-";
            if (cleaned.Contains("quotation")) return "QTN-";
            if (cleaned.Contains("asset")) return "AST-";
            if (cleaned.Contains("payment")) return "PAY-";
            if (cleaned.Contains("department")) return "DEPT-";
            if (cleaned.Contains("company")) return "COMP-";
            if (cleaned.Contains("item") || cleaned.Contains("sku") || cleaned.Contains("product")) return "ITEM-";
            if (cleaned.Contains("warehouse")) return "WH-";
            if (cleaned.Contains("project")) return "PROJ-";
            if (cleaned.Contains("task")) return "TSK-";
            if (cleaned.Contains("journal")) return "JV-";
            if (cleaned.Contains("receipt")) return "GRN-";
            if (cleaned.Contains("leave")) return "LV-";
            if (cleaned.Contains("tenant")) return "TNT-";
            
            var abbrev = new string(entityName.Where(char.IsLetter).Take(4).ToArray()).ToUpperInvariant();
            return string.IsNullOrWhiteSpace(abbrev) ? "DOC-" : $"{abbrev}-";
        }

        private static readonly Dictionary<string, string> EntityAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            { "ApiKey", "IntegrationApiKey" },
            { "ApiKeys", "IntegrationApiKey" },
            { "Webhook", "TenantWebhook" },
            { "Webhooks", "TenantWebhook" },
            { "IpRestriction", "IpAccessRule" },
            { "IpRestrictions", "IpAccessRule" },
            { "PasswordPolicy", "SecurityPolicy" },
            { "PasswordPolicies", "SecurityPolicy" },
            { "SecuritySession", "UserSession" },
            { "SecuritySessions", "UserSession" },
            { "WorkflowConfig", "Workflow" },
            { "WorkflowConfigs", "Workflow" },
            { "Page", "UiPageDefinition" },
            { "Pages", "UiPageDefinition" },
            { "Pag", "UiPageDefinition" },
            { "EntityBuilder", "EntityFieldDefinition" },
            { "EntityField", "EntityFieldDefinition" },
            { "App", "Module" },
            { "Apps", "Module" },
            { "Setting", "TenantConfig" },
            { "Settings", "TenantConfig" },
            { "ElectronicDataInterchange", "IntegrationConnector" },
            { "Edi", "IntegrationConnector" },
            { "DeveloperCenter", "IntegrationApiKey" },
            { "OrgChart", "Department" },
            { "Approval", "Workflow" },
            { "Approvals", "Workflow" }
        };

        private static bool IsTenantType(Type type) =>
            type == typeof(Tenant) || type.Name.Equals("Tenant", StringComparison.OrdinalIgnoreCase);

        private Microsoft.EntityFrameworkCore.Metadata.IEntityType? ResolveEntityType(string entityName)
        {
            if (string.IsNullOrWhiteSpace(entityName)) return null;

            // 1. Direct case-insensitive match
            var direct = _db.Model.GetEntityTypes()
                .FirstOrDefault(t => t.ClrType.Name.Equals(entityName, StringComparison.OrdinalIgnoreCase));
            if (direct != null) return direct;

            // 2. Remove hyphens/underscores (e.g. "Feature-flag" -> "Featureflag" -> "FeatureFlag")
            var cleaned = entityName.Replace("-", "").Replace("_", "").Trim();
            var byClean = _db.Model.GetEntityTypes()
                .FirstOrDefault(t => t.ClrType.Name.Equals(cleaned, StringComparison.OrdinalIgnoreCase));
            if (byClean != null) return byClean;

            // 3. Check alias mapping
            if (EntityAliases.TryGetValue(cleaned, out var aliasedName) || EntityAliases.TryGetValue(entityName, out aliasedName))
            {
                var byAlias = _db.Model.GetEntityTypes()
                    .FirstOrDefault(t => t.ClrType.Name.Equals(aliasedName, StringComparison.OrdinalIgnoreCase));
                if (byAlias != null) return byAlias;
            }

            // 4. Singular / plural variants
            var singular = cleaned.EndsWith("s", StringComparison.OrdinalIgnoreCase) && cleaned.Length > 2
                ? cleaned.Substring(0, cleaned.Length - 1)
                : cleaned;
            var bySingular = _db.Model.GetEntityTypes()
                .FirstOrDefault(t => t.ClrType.Name.Equals(singular, StringComparison.OrdinalIgnoreCase));
            if (bySingular != null) return bySingular;

            var plural = cleaned + "s";
            var byPlural = _db.Model.GetEntityTypes()
                .FirstOrDefault(t => t.ClrType.Name.Equals(plural, StringComparison.OrdinalIgnoreCase));
            if (byPlural != null) return byPlural;

            return null;
        }

        [HttpGet]
        public async Task<IActionResult> List(
            string entityName,
            [FromQuery] string? search,
            [FromQuery] Guid? companyId,
            [FromQuery] Guid? projectId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            [FromQuery] string? sortBy = null,
            [FromQuery] string? sortDir = "asc",
            CancellationToken ct = default)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 200) pageSize = 25;

            var tenantId = _tenantAccessor.GetTenantId();

            if (!companyId.HasValue && Request.Headers.TryGetValue("X-Company-Id", out var compHeader) && Guid.TryParse(compHeader, out var parsedComp))
            {
                companyId = parsedComp;
            }
            if (!projectId.HasValue && Request.Headers.TryGetValue("X-Project-Id", out var projHeader) && Guid.TryParse(projHeader, out var parsedProj))
            {
                projectId = parsedProj;
            }

            var efEntityType = ResolveEntityType(entityName);

            if (efEntityType == null)
            {
                return Ok(new
                {
                    items = Array.Empty<object>(),
                    totalCount = 0,
                    page,
                    pageSize,
                    totalPages = 0
                });
            }

            var clrType = efEntityType.ClrType;
            var setMethod = typeof(DbContext).GetMethods()
                .First(m => m.Name == "Set" && m.IsGenericMethod && m.GetParameters().Length == 0)
                .MakeGenericMethod(clrType);

            var query = (IQueryable)setMethod.Invoke(_db, null)!;

            System.Collections.IEnumerable rawList;
            int totalCount;

            try
            {
                // 1. Tenant, Company, Project & Soft-Delete Filters via Expressions
                query = ApplyMultiTenantAndActiveFilters(query, efEntityType, tenantId, companyId, projectId);

                // 2. Search filter
                if (!string.IsNullOrWhiteSpace(search))
                {
                    query = ApplySearchFilter(query, efEntityType, search.Trim());
                }

                // 3. Count total records
                var countMethod = typeof(Queryable).GetMethods()
                    .First(m => m.Name == "Count" && m.GetParameters().Length == 1)
                    .MakeGenericMethod(clrType);
                totalCount = (int)countMethod.Invoke(null, new object[] { query })!;

                // 4. Sorting & Pagination
                query = ApplySorting(query, efEntityType, sortBy, sortDir);
                query = ApplyPagination(query, clrType, page, pageSize);

                // 5. Execute query
                var toListAsyncMethod = typeof(EntityFrameworkQueryableExtensions).GetMethods()
                    .First(m => m.Name == "ToListAsync" && m.GetParameters().Length == 2)
                    .MakeGenericMethod(clrType);
                var task = (Task)toListAsyncMethod.Invoke(null, new object[] { query, ct })!;
                await task.ConfigureAwait(false);
                var resultProperty = task.GetType().GetProperty("Result")!;
                rawList = (System.Collections.IEnumerable)resultProperty.GetValue(task)!;
            }
            catch
            {
                return Ok(new
                {
                    items = Array.Empty<object>(),
                    totalCount = 0,
                    page,
                    pageSize,
                    totalPages = 0
                });
            }

            // 6. Hydrate Custom Fields
            var items = new List<Dictionary<string, object?>>();
            try
            {
                var customDefs = await _db.EntityFieldDefinitions
                    .AsNoTracking()
                    .Where(d => d.TenantId == tenantId && d.EntityName.ToLower() == entityName.ToLower() && d.IsActive && !d.IsDeleted)
                    .ToListAsync(ct);

                var recordIds = new List<Guid>();
                var propDict = clrType.GetProperties(BindingFlags.Public | BindingFlags.Instance);

                foreach (var item in rawList)
                {
                    var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                    foreach (var prop in propDict)
                    {
                        if (prop.GetIndexParameters().Length > 0 || !prop.CanRead) continue;
                        try
                        {
                            var val = prop.GetValue(item);
                            var camelName = char.ToLowerInvariant(prop.Name[0]) + prop.Name.Substring(1);
                            dict[camelName] = val;
                        }
                        catch
                        {
                            // Ignore properties that throw on read
                        }
                    }

                    if (dict.TryGetValue("id", out var idObj) && idObj is Guid idGuid)
                    {
                        recordIds.Add(idGuid);
                    }

                    items.Add(dict);
                }

                if (recordIds.Count > 0 && customDefs.Count > 0)
                {
                    var customValues = await _db.EntityFieldValues
                        .AsNoTracking()
                        .Where(v => recordIds.Contains(v.RecordId))
                        .ToListAsync(ct);

                    var defKeyMap = customDefs.ToDictionary(d => d.Id, d => d.FieldKey);
                    foreach (var item in items)
                    {
                        if (item.TryGetValue("id", out var idObj) && idObj is Guid recordId)
                        {
                            var matchingVals = customValues.Where(v => v.RecordId == recordId);
                            foreach (var mv in matchingVals)
                            {
                                if (defKeyMap.TryGetValue(mv.FieldDefinitionId, out var fKey))
                                {
                                    item[fKey] = mv.Value;
                                }
                            }
                        }
                    }
                }
            }
            catch
            {
                // Soft fallback: continue with populated items if custom field hydration fails
            }

            return Ok(new
            {
                items,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string entityName, Guid id, CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var efEntityType = ResolveEntityType(entityName);

            if (efEntityType == null)
            {
                return NotFound(new { message = $"Entity '{entityName}' not found." });
            }

            var clrType = efEntityType.ClrType;
            var findMethod = typeof(DbContext).GetMethods()
                .First(m => m.Name == "FindAsync" && m.GetParameters().Length == 2 && m.GetParameters()[0].ParameterType == typeof(Type))
                .Invoke(_db, new object[] { clrType, new object[] { id } });

            var entityTask = (ValueTask<object?>)findMethod!;
            var entity = await entityTask;

            if (entity == null)
            {
                return NotFound(new { message = $"{entityName} record not found." });
            }

            // Verify tenant ownership
            if (IsTenantType(clrType))
            {
                if (id != tenantId && tenantId != Guid.Empty)
                {
                    return Forbid();
                }
            }
            else
            {
                var efTenantProp = efEntityType.FindProperty("TenantId");
                if (efTenantProp != null)
                {
                    var tenantProp = clrType.GetProperty("TenantId");
                    if (tenantProp != null && tenantProp.GetValue(entity) is Guid recTenant && recTenant != tenantId)
                    {
                        return Forbid();
                    }
                }
            }

            var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (var prop in clrType.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                var camelName = char.ToLowerInvariant(prop.Name[0]) + prop.Name.Substring(1);
                dict[camelName] = prop.GetValue(entity);
            }

            // Hydrate custom fields
            var customDefs = await _db.EntityFieldDefinitions
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && d.EntityName.ToLower() == entityName.ToLower() && d.IsActive && !d.IsDeleted)
                .ToListAsync(ct);

            if (customDefs.Count > 0)
            {
                var customValues = await _db.EntityFieldValues
                    .AsNoTracking()
                    .Where(v => v.RecordId == id)
                    .ToListAsync(ct);

                var defKeyMap = customDefs.ToDictionary(d => d.Id, d => d.FieldKey);
                foreach (var cv in customValues)
                {
                    if (defKeyMap.TryGetValue(cv.FieldDefinitionId, out var key))
                    {
                        dict[key] = cv.Value;
                    }
                }
            }

            return Ok(dict);
        }

        [HttpPost]
        public async Task<IActionResult> Create(string entityName, [FromBody] JsonElement body, CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var efEntityType = ResolveEntityType(entityName);

            if (efEntityType == null)
            {
                return NotFound(new { message = $"Entity '{entityName}' not found." });
            }

            var clrType = efEntityType.ClrType;
            var instance = Activator.CreateInstance(clrType);
            if (instance == null)
            {
                return StatusCode(500, new { message = "Could not initialize entity instance." });
            }

            // Assign standard multi-tenant and audit properties
            var idProp = clrType.GetProperty("Id");
            var recordId = Guid.NewGuid();
            if (idProp != null && idProp.CanWrite) idProp.SetValue(instance, recordId);

            if (!IsTenantType(clrType))
            {
                var efTenantProp = efEntityType.FindProperty("TenantId");
                if (efTenantProp != null)
                {
                    var tenantProp = clrType.GetProperty("TenantId");
                    if (tenantProp != null && tenantProp.CanWrite) tenantProp.SetValue(instance, tenantId);
                }
            }

            var createdProp = clrType.GetProperty("CreatedAt");
            if (createdProp != null && createdProp.CanWrite) createdProp.SetValue(instance, DateTime.UtcNow);

            var isDeletedProp = clrType.GetProperty("IsDeleted");
            if (isDeletedProp != null && isDeletedProp.CanWrite) isDeletedProp.SetValue(instance, false);

            var userId = GetCurrentUserId();
            var createdByProp = clrType.GetProperty("CreatedBy");
            if (createdByProp != null && createdByProp.CanWrite && userId.HasValue)
            {
                createdByProp.SetValue(instance, userId.Value);
            }

            // Populate core fields from JSON
            var customDefs = await _db.EntityFieldDefinitions
                .Where(d => d.TenantId == tenantId && d.EntityName.ToLower() == entityName.ToLower() && d.IsActive && !d.IsDeleted)
                .ToListAsync(ct);

            var customValuesToSave = new List<EntityFieldValue>();

            if (body.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in body.EnumerateObject())
                {
                    var targetProp = clrType.GetProperty(prop.Name, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                    if (targetProp != null && targetProp.CanWrite && targetProp.Name != "Id" && targetProp.Name != "TenantId")
                    {
                        var coercedVal = CoerceJsonValue(prop.Value, targetProp.PropertyType);
                        targetProp.SetValue(instance, coercedVal);
                    }
                    else
                    {
                        // Check if it matches a custom field definition
                        var matchDef = customDefs.FirstOrDefault(d => d.FieldKey.Equals(prop.Name, StringComparison.OrdinalIgnoreCase));
                        if (matchDef != null)
                        {
                            customValuesToSave.Add(new EntityFieldValue
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                FieldDefinitionId = matchDef.Id,
                                RecordId = recordId,
                                Value = prop.Value.ToString()
                            });
                        }
                    }
                }
            }

            // Assign active company / project scope if entity supports it and not provided in payload
            var compProp = clrType.GetProperty("CompanyId");
            if (compProp != null && compProp.CanWrite)
            {
                var existingVal = compProp.GetValue(instance);
                if (existingVal == null || (existingVal is Guid g && g == Guid.Empty))
                {
                    if (Request.Headers.TryGetValue("X-Company-Id", out var ch) && Guid.TryParse(ch, out var cId))
                    {
                        compProp.SetValue(instance, compProp.PropertyType == typeof(Guid?) ? (object)cId : cId);
                    }
                }
            }

            var projProp = clrType.GetProperty("ProjectId");
            if (projProp != null && projProp.CanWrite)
            {
                var existingVal = projProp.GetValue(instance);
                if (existingVal == null || (existingVal is Guid g && g == Guid.Empty))
                {
                    if (Request.Headers.TryGetValue("X-Project-Id", out var ph) && Guid.TryParse(ph, out var pId))
                    {
                        projProp.SetValue(instance, projProp.PropertyType == typeof(Guid?) ? (object)pId : pId);
                    }
                }
            }

            Guid? targetCompanyId = null;
            if (compProp != null)
            {
                var cVal = compProp.GetValue(instance);
                if (cVal is Guid cg && cg != Guid.Empty) targetCompanyId = cg;
            }
            Guid? targetProjectId = null;
            if (projProp != null)
            {
                var pVal = projProp.GetValue(instance);
                if (pVal is Guid pg && pg != Guid.Empty) targetProjectId = pg;
            }

            foreach (var codeName in StandardCodePropertyNames)
            {
                var p = clrType.GetProperty(codeName, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                if (p != null && p.CanWrite && p.PropertyType == typeof(string))
                {
                    var curVal = p.GetValue(instance) as string;
                    if (string.IsNullOrWhiteSpace(curVal))
                    {
                        var prefix = GetStandardPrefix(entityName);
                        var generated = await _numbers.NextAsync(entityName, prefix, 5, targetCompanyId, targetProjectId, null, ct);
                        p.SetValue(instance, generated);
                        break;
                    }
                }
            }

            _db.Add(instance);

            if (customValuesToSave.Count > 0)
            {
                _db.EntityFieldValues.AddRange(customValuesToSave);
            }

            await _db.SaveChangesAsync(ct);

            return CreatedAtAction(nameof(GetById), new { entityName, id = recordId }, new { id = recordId, message = $"{entityName} created successfully." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string entityName, Guid id, [FromBody] JsonElement body, CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var efEntityType = ResolveEntityType(entityName);

            if (efEntityType == null)
            {
                return NotFound(new { message = $"Entity '{entityName}' not found." });
            }

            var clrType = efEntityType.ClrType;
            var entity = await _db.FindAsync(clrType, id);
            if (entity == null)
            {
                return NotFound(new { message = $"{entityName} record not found." });
            }

            if (IsTenantType(clrType))
            {
                if (id != tenantId && tenantId != Guid.Empty)
                {
                    return Forbid();
                }
            }
            else
            {
                var efTenantProp = efEntityType.FindProperty("TenantId");
                if (efTenantProp != null)
                {
                    var tenantProp = clrType.GetProperty("TenantId");
                    if (tenantProp != null && tenantProp.GetValue(entity) is Guid recTenant && recTenant != tenantId)
                    {
                        return Forbid();
                    }
                }
            }

            var updatedProp = clrType.GetProperty("UpdatedAt");
            if (updatedProp != null && updatedProp.CanWrite) updatedProp.SetValue(entity, DateTime.UtcNow);

            var userId = GetCurrentUserId();
            var updatedByProp = clrType.GetProperty("UpdatedBy");
            if (updatedByProp != null && updatedByProp.CanWrite && userId.HasValue)
            {
                updatedByProp.SetValue(entity, userId.Value);
            }

            var customDefs = await _db.EntityFieldDefinitions
                .Where(d => d.TenantId == tenantId && d.EntityName.ToLower() == entityName.ToLower() && d.IsActive && !d.IsDeleted)
                .ToListAsync(ct);

            var existingCustomVals = await _db.EntityFieldValues
                .Where(v => v.RecordId == id)
                .ToListAsync(ct);

            if (body.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in body.EnumerateObject())
                {
                    var targetProp = clrType.GetProperty(prop.Name, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                    if (targetProp != null && targetProp.CanWrite && targetProp.Name != "Id" && targetProp.Name != "TenantId" && targetProp.Name != "CreatedAt")
                    {
                        // Business codes and identifiers are immutable once created
                        if (StandardCodePropertyNames.Contains(targetProp.Name, StringComparer.OrdinalIgnoreCase))
                        {
                            var existingCode = targetProp.GetValue(entity) as string;
                            if (!string.IsNullOrWhiteSpace(existingCode))
                            {
                                continue;
                            }
                        }

                        var coercedVal = CoerceJsonValue(prop.Value, targetProp.PropertyType);
                        targetProp.SetValue(entity, coercedVal);
                    }
                    else
                    {
                        var matchDef = customDefs.FirstOrDefault(d => d.FieldKey.Equals(prop.Name, StringComparison.OrdinalIgnoreCase));
                        if (matchDef != null)
                        {
                            var existingVal = existingCustomVals.FirstOrDefault(v => v.FieldDefinitionId == matchDef.Id);
                            if (existingVal != null)
                            {
                                existingVal.Value = prop.Value.ToString();
                                existingVal.UpdatedAt = DateTime.UtcNow;
                            }
                            else
                            {
                                _db.EntityFieldValues.Add(new EntityFieldValue
                                {
                                    Id = Guid.NewGuid(),
                                    TenantId = tenantId,
                                    FieldDefinitionId = matchDef.Id,
                                    RecordId = id,
                                    Value = prop.Value.ToString()
                                });
                            }
                        }
                    }
                }
            }

            await _db.SaveChangesAsync(ct);
            return Ok(new { id, message = $"{entityName} updated successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string entityName, Guid id, CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var efEntityType = ResolveEntityType(entityName);

            if (efEntityType == null)
            {
                return NotFound(new { message = $"Entity '{entityName}' not found." });
            }

            var clrType = efEntityType.ClrType;
            var entity = await _db.FindAsync(clrType, id);
            if (entity == null)
            {
                return NotFound(new { message = $"{entityName} record not found." });
            }

            if (IsTenantType(clrType))
            {
                if (id != tenantId && tenantId != Guid.Empty)
                {
                    return Forbid();
                }
            }
            else
            {
                var efTenantProp = efEntityType.FindProperty("TenantId");
                if (efTenantProp != null)
                {
                    var tenantProp = clrType.GetProperty("TenantId");
                    if (tenantProp != null && tenantProp.GetValue(entity) is Guid recTenant && recTenant != tenantId)
                    {
                        return Forbid();
                    }
                }
            }

            var isDeletedProp = clrType.GetProperty("IsDeleted");
            if (isDeletedProp != null && isDeletedProp.CanWrite)
            {
                isDeletedProp.SetValue(entity, true);
                var deletedAtProp = clrType.GetProperty("DeletedAt");
                if (deletedAtProp != null && deletedAtProp.CanWrite) deletedAtProp.SetValue(entity, DateTime.UtcNow);
            }
            else
            {
                _db.Remove(entity);
            }

            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        // ─────────────────────────────────────────────────────────────────────
        // Helper Expression Builders
        // ─────────────────────────────────────────────────────────────────────

        private static IQueryable ApplyMultiTenantAndActiveFilters(
            IQueryable query,
            Microsoft.EntityFrameworkCore.Metadata.IEntityType efEntityType,
            Guid tenantId,
            Guid? companyId = null,
            Guid? projectId = null)
        {
            var clrType = efEntityType.ClrType;
            var param = Expression.Parameter(clrType, "e");
            Expression? filterExpr = null;

            // Special handling for Tenant entity: Tenant table has no TenantId column; each tenant can see its own record
            if (IsTenantType(clrType))
            {
                if (tenantId != Guid.Empty)
                {
                    var idProp = clrType.GetProperty("Id");
                    if (idProp != null)
                    {
                        var idAccess = Expression.Property(param, idProp);
                        filterExpr = Expression.Equal(idAccess, Expression.Constant(tenantId));
                    }
                }
            }
            else
            {
                var efTenantProp = efEntityType.FindProperty("TenantId");
                if (efTenantProp != null && !efTenantProp.IsShadowProperty())
                {
                    var tenantProp = clrType.GetProperty("TenantId");
                    if (tenantProp != null)
                    {
                        var tenantAccess = Expression.Property(param, tenantProp);
                        var tenantEquals = Expression.Equal(tenantAccess, Expression.Constant(tenantId));
                        filterExpr = tenantEquals;
                    }
                }
            }

            var efDeletedProp = efEntityType.FindProperty("IsDeleted");
            if (efDeletedProp != null)
            {
                var isDeletedProp = clrType.GetProperty("IsDeleted");
                if (isDeletedProp != null)
                {
                    var deletedAccess = Expression.Property(param, isDeletedProp);
                    var notDeleted = Expression.Equal(deletedAccess, Expression.Constant(false));
                    filterExpr = filterExpr == null ? notDeleted : Expression.AndAlso(filterExpr, notDeleted);
                }
            }

            // Company filter: matches companyId or global records (null CompanyId)
            if (companyId.HasValue && companyId.Value != Guid.Empty && efEntityType.FindProperty("CompanyId") != null)
            {
                var compProp = clrType.GetProperty("CompanyId");
                if (compProp != null)
                {
                    var compAccess = Expression.Property(param, compProp);
                    Expression? compFilter = null;
                    if (compProp.PropertyType == typeof(Guid?))
                    {
                        var hasComp = Expression.Equal(compAccess, Expression.Constant(companyId, typeof(Guid?)));
                        var isNullComp = Expression.Equal(compAccess, Expression.Constant(null, typeof(Guid?)));
                        compFilter = Expression.OrElse(hasComp, isNullComp);
                    }
                    else if (compProp.PropertyType == typeof(Guid))
                    {
                        compFilter = Expression.Equal(compAccess, Expression.Constant(companyId.Value));
                    }

                    if (compFilter != null)
                    {
                        filterExpr = filterExpr == null ? compFilter : Expression.AndAlso(filterExpr, compFilter);
                    }
                }
            }

            // Project filter: matches projectId or global project records
            if (projectId.HasValue && projectId.Value != Guid.Empty && efEntityType.FindProperty("ProjectId") != null)
            {
                var projProp = clrType.GetProperty("ProjectId");
                if (projProp != null)
                {
                    var projAccess = Expression.Property(param, projProp);
                    Expression? projFilter = null;
                    if (projProp.PropertyType == typeof(Guid?))
                    {
                        var hasProj = Expression.Equal(projAccess, Expression.Constant(projectId, typeof(Guid?)));
                        var isNullProj = Expression.Equal(projAccess, Expression.Constant(null, typeof(Guid?)));
                        projFilter = Expression.OrElse(hasProj, isNullProj);
                    }
                    else if (projProp.PropertyType == typeof(Guid))
                    {
                        projFilter = Expression.Equal(projAccess, Expression.Constant(projectId.Value));
                    }

                    if (projFilter != null)
                    {
                        filterExpr = filterExpr == null ? projFilter : Expression.AndAlso(filterExpr, projFilter);
                    }
                }
            }

            if (filterExpr == null) return query;

            var lambda = Expression.Lambda(filterExpr, param);
            var whereMethod = typeof(Queryable).GetMethods()
                .First(m => m.Name == "Where" && m.GetParameters().Length == 2)
                .MakeGenericMethod(clrType);

            return (IQueryable)whereMethod.Invoke(null, new object[] { query, lambda })!;
        }

        private static IQueryable ApplySearchFilter(IQueryable query, Microsoft.EntityFrameworkCore.Metadata.IEntityType efEntityType, string search)
        {
            var clrType = efEntityType.ClrType;
            var param = Expression.Parameter(clrType, "e");
            var stringProps = efEntityType.GetProperties()
                .Where(p => p.ClrType == typeof(string) && p.PropertyInfo != null && !p.Name.Contains("Hash") && !p.Name.Contains("Token") && !p.Name.Contains("Secret"))
                .Select(p => p.PropertyInfo!)
                .Take(5)
                .ToList();

            if (stringProps.Count == 0) return query;

            Expression? combined = null;
            var containsMethod = typeof(string).GetMethod("Contains", new[] { typeof(string) })!;
            var searchConst = Expression.Constant(search);

            foreach (var prop in stringProps)
            {
                var propAccess = Expression.Property(param, prop);
                var notNull = Expression.NotEqual(propAccess, Expression.Constant(null, typeof(string)));
                var callContains = Expression.Call(propAccess, containsMethod, searchConst);
                var check = Expression.AndAlso(notNull, callContains);

                combined = combined == null ? check : Expression.OrElse(combined, check);
            }

            if (combined == null) return query;

            var lambda = Expression.Lambda(combined, param);
            var whereMethod = typeof(Queryable).GetMethods()
                .First(m => m.Name == "Where" && m.GetParameters().Length == 2)
                .MakeGenericMethod(clrType);

            return (IQueryable)whereMethod.Invoke(null, new object[] { query, lambda })!;
        }

        private static IQueryable ApplySorting(IQueryable query, Microsoft.EntityFrameworkCore.Metadata.IEntityType efEntityType, string? sortBy, string? sortDir)
        {
            var clrType = efEntityType.ClrType;
            var sortField = string.IsNullOrWhiteSpace(sortBy) ? "CreatedAt" : sortBy;

            var efProp = efEntityType.FindProperty(sortField);
            if (efProp == null)
            {
                efProp = efEntityType.FindProperty("CreatedAt")
                    ?? efEntityType.FindPrimaryKey()?.Properties.FirstOrDefault()
                    ?? efEntityType.GetProperties().FirstOrDefault();
            }

            if (efProp == null || efProp.PropertyInfo == null) return query;

            var prop = efProp.PropertyInfo;
            var param = Expression.Parameter(clrType, "e");
            var propAccess = Expression.Property(param, prop);
            var lambda = Expression.Lambda(propAccess, param);

            var methodName = (sortDir?.ToLower() == "desc") ? "OrderByDescending" : "OrderBy";
            var sortMethod = typeof(Queryable).GetMethods()
                .First(m => m.Name == methodName && m.GetParameters().Length == 2)
                .MakeGenericMethod(clrType, prop.PropertyType);

            return (IQueryable)sortMethod.Invoke(null, new object[] { query, lambda })!;
        }

        private static IQueryable ApplyPagination(IQueryable query, Type clrType, int page, int pageSize)
        {
            var skipMethod = typeof(Queryable).GetMethods()
                .First(m => m.Name == "Skip" && m.GetParameters().Length == 2)
                .MakeGenericMethod(clrType);
            var takeMethod = typeof(Queryable).GetMethods()
                .First(m => m.Name == "Take" && m.GetParameters().Length == 2)
                .MakeGenericMethod(clrType);

            query = (IQueryable)skipMethod.Invoke(null, new object[] { query, (page - 1) * pageSize })!;
            query = (IQueryable)takeMethod.Invoke(null, new object[] { query, pageSize })!;
            return query;
        }

        private static object? CoerceJsonValue(JsonElement element, Type targetType)
        {
            var underlying = Nullable.GetUnderlyingType(targetType) ?? targetType;

            if (element.ValueKind == JsonValueKind.Null || element.ValueKind == JsonValueKind.Undefined)
            {
                return null;
            }

            if (underlying == typeof(string)) return element.GetString();
            if (underlying == typeof(int)) return element.TryGetInt32(out var i) ? i : 0;
            if (underlying == typeof(long)) return element.TryGetInt64(out var l) ? l : 0L;
            if (underlying == typeof(decimal)) return element.TryGetDecimal(out var d) ? d : 0m;
            if (underlying == typeof(double)) return element.TryGetDouble(out var db) ? db : 0d;
            if (underlying == typeof(bool)) return element.ValueKind == JsonValueKind.True || (element.ValueKind == JsonValueKind.String && bool.TryParse(element.GetString(), out var b) && b);
            if (underlying == typeof(Guid)) return element.TryGetGuid(out var g) ? g : Guid.TryParse(element.GetString(), out var parsedG) ? parsedG : null;
            if (underlying == typeof(DateTime)) return element.TryGetDateTime(out var dt) ? dt : DateTime.TryParse(element.GetString(), out var parsedDt) ? parsedDt : null;
            if (underlying.IsEnum)
            {
                var str = element.GetString();
                if (str != null && Enum.TryParse(underlying, str, true, out var enumVal))
                {
                    return enumVal;
                }
            }

            return null;
        }

        private Guid? GetCurrentUserId()
        {
            var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(sub, out var g) ? g : null;
        }
    }
}
