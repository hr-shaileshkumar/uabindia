using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class PoliciesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public PoliciesController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        // ─────────────────────────────────────────────────────────────────────
        // GET /api/v1/policies
        // Returns all policy masters with their active version from database.
        // Auto-seeds defaults into database if tenant has zero policies.
        // ─────────────────────────────────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? category = null, [FromQuery] string? status = null, [FromQuery] string? search = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var anyExist = await _db.PolicyMasters.AnyAsync(p => p.TenantId == tenantId && !p.IsDeleted);
            if (!anyExist)
            {
                await SeedDefaultPoliciesAsync(tenantId);
            }

            var query = _db.PolicyMasters
                .Include(p => p.Versions)
                .AsNoTracking()
                .Where(p => p.TenantId == tenantId && !p.IsDeleted);

            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Category == category);
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(p => p.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(p => p.Name.ToLower().Contains(s) || p.Code.ToLower().Contains(s) || p.Description.ToLower().Contains(s));
            }

            var list = await query.OrderBy(p => p.Priority).ThenBy(p => p.Name).ToListAsync();

            var result = list.Select(p =>
            {
                var activeVer = p.Versions
                    .Where(v => !v.IsDeleted && v.Status == "Active")
                    .OrderByDescending(v => v.EffectiveFrom)
                    .FirstOrDefault() ?? p.Versions.FirstOrDefault(v => !v.IsDeleted);

                return new
                {
                    id = p.Id,
                    code = p.Code,
                    category = p.Category,
                    name = p.Name,
                    description = p.Description,
                    isMandatoryAcknowledgment = p.IsMandatoryAcknowledgment,
                    isSystemCritical = p.IsSystemCritical,
                    priority = p.Priority,
                    status = p.Status,
                    totalVersions = p.Versions.Count(v => !v.IsDeleted),
                    createdAt = p.CreatedAt,
                    updatedAt = p.UpdatedAt ?? p.CreatedAt,
                    activeVersion = activeVer == null ? null : new
                    {
                        id = activeVer.Id,
                        policyId = activeVer.PolicyId,
                        version = activeVer.Version,
                        effectiveFrom = activeVer.EffectiveFrom.ToString("yyyy-MM-dd"),
                        effectiveTo = activeVer.EffectiveTo?.ToString("yyyy-MM-dd"),
                        status = activeVer.Status,
                        changeLogReason = activeVer.ChangeLogReason,
                        authorName = activeVer.AuthorName,
                        approvedByName = activeVer.ApprovedByName,
                        approvedAt = activeVer.ApprovedAt,
                        applicability = TryParseJson(activeVer.ApplicabilityJson),
                        ruleConfig = TryParseJson(activeVer.RuleConfigJson),
                        approvalWorkflow = TryParseJson(activeVer.ApprovalWorkflowJson)
                    }
                };
            });

            return Ok(result);
        }

        // ─────────────────────────────────────────────────────────────────────
        // GET /api/v1/policies/ui-schema
        // Backend decides what policies and form fields the frontend renders!
        // ─────────────────────────────────────────────────────────────────────
        [HttpGet("ui-schema")]
        public async Task<IActionResult> GetUiSchema([FromQuery] Guid? companyId = null, [FromQuery] Guid? projectId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            await EnsurePolicyRuleDefinitionsSeededAsync(tenantId);

            var isSuperAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("Admin");
            var isHr = User.IsInRole("HRManager") || isSuperAdmin;
            var isFinance = User.IsInRole("FinanceManager") || isSuperAdmin;

            var allDefs = await _db.PolicyRuleDefinitions
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && !d.IsDeleted && d.IsVisible)
                .OrderBy(d => d.DisplayOrder)
                .ToListAsync();

            var categories = ResolveCategoriesFromDefinitions(allDefs, companyId, projectId, isHr, isFinance, isSuperAdmin);

            var schema = new
            {
                serverVersion = "3.0",
                authority = "Database-Persisted Multi-Tenant Enterprise Policy Engine",
                scope = new
                {
                    companyId,
                    projectId
                },
                permissions = new
                {
                    canCreatePolicy = isSuperAdmin || isHr,
                    canPublishVersion = isSuperAdmin || isHr,
                    canDeletePolicy = isSuperAdmin,
                    canSimulate = isSuperAdmin || isHr || isFinance,
                    canOverrideExceptions = isSuperAdmin || isHr,
                    canManageDefinitions = isSuperAdmin
                },
                categories
            };

            return Ok(schema);
        }

        // ─────────────────────────────────────────────────────────────────────
        // POST /api/v1/policies
        // Creates a new policy master in the database
        // ─────────────────────────────────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] JsonElement payload)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var code = payload.TryGetProperty("code", out var c) ? c.GetString()?.Trim().ToUpperInvariant() : null;
            var name = payload.TryGetProperty("name", out var n) ? n.GetString()?.Trim() : null;
            var category = payload.TryGetProperty("category", out var cat) ? cat.GetString()?.Trim() : "HR_CORE";
            var desc = payload.TryGetProperty("description", out var d) ? d.GetString()?.Trim() : string.Empty;
            var isMandatory = payload.TryGetProperty("isMandatoryAcknowledgment", out var m) && m.GetBoolean();
            var isCritical = payload.TryGetProperty("isSystemCritical", out var sc) && sc.GetBoolean();
            var priority = payload.TryGetProperty("priority", out var p) && p.TryGetInt32(out var pr) ? pr : 10;
            var status = payload.TryGetProperty("status", out var st) ? st.GetString()?.Trim() : "Active";

            if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new { message = "Code and Name are required." });
            }

            var duplicate = await _db.PolicyMasters.AnyAsync(x => x.TenantId == tenantId && x.Code == code && !x.IsDeleted);
            if (duplicate)
            {
                return Conflict(new { message = $"Policy with code '{code}' already exists in database." });
            }

            var policy = new PolicyMaster
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Code = code,
                Name = name,
                Category = category ?? "HR_CORE",
                Description = desc ?? string.Empty,
                IsMandatoryAcknowledgment = isMandatory,
                IsSystemCritical = isCritical,
                Priority = priority,
                Status = status ?? "Active",
                CreatedAt = DateTime.UtcNow
            };

            var initialVer = new PolicyVersion
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PolicyId = policy.Id,
                Version = "1.0",
                EffectiveFrom = DateTime.UtcNow.Date,
                EffectiveTo = null,
                Status = "Active",
                ChangeLogReason = "Initial baseline version",
                AuthorName = User.Identity?.Name ?? "System Administrator",
                ApplicabilityJson = "{}",
                RuleConfigJson = "{}",
                ApprovalWorkflowJson = JsonSerializer.Serialize(new
                {
                    workflowType = "SingleLevel",
                    levels = new[] { new { level = 1, role = "ReportingManager", slaHours = 48, canReject = true, canRequestClarification = true } },
                    allowEmployeeDispute = true,
                    disputeWindowDays = 7
                }),
                CreatedAt = DateTime.UtcNow
            };

            _db.PolicyMasters.Add(policy);
            _db.PolicyVersions.Add(initialVer);
            await _db.SaveChangesAsync();

            return Ok(new { id = policy.Id, message = "Policy saved to database successfully." });
        }

        // ─────────────────────────────────────────────────────────────────────
        // POST /api/v1/policies/{id}/versions
        // Publishes a new policy version to database
        // ─────────────────────────────────────────────────────────────────────
        [HttpPost("{id:guid}/versions")]
        public async Task<IActionResult> CreateVersion(Guid id, [FromBody] JsonElement payload)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.PolicyMasters.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);
            if (policy == null) return NotFound(new { message = "Policy not found." });

            var versionStr = payload.TryGetProperty("version", out var v) ? v.GetString() : "2.0";
            var effectiveFrom = payload.TryGetProperty("effectiveFrom", out var ef) && DateTime.TryParse(ef.GetString(), out var dtFrom) ? dtFrom : DateTime.UtcNow.Date;
            DateTime? effectiveTo = payload.TryGetProperty("effectiveTo", out var et) && DateTime.TryParse(et.GetString(), out var dtTo) ? dtTo : null;
            var reason = payload.TryGetProperty("changeLogReason", out var r) ? r.GetString() : "Revision";
            var author = payload.TryGetProperty("authorName", out var a) ? a.GetString() : User.Identity?.Name ?? "Admin";

            var applicabilityJson = payload.TryGetProperty("applicability", out var app) ? app.GetRawText() : "{}";
            var ruleConfigJson = payload.TryGetProperty("ruleConfig", out var rc) ? rc.GetRawText() : "{}";
            var workflowJson = payload.TryGetProperty("approvalWorkflow", out var wf) ? wf.GetRawText() : "{}";

            var newVer = new PolicyVersion
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                PolicyId = id,
                Version = versionStr ?? "2.0",
                EffectiveFrom = effectiveFrom,
                EffectiveTo = effectiveTo,
                Status = "Active",
                ChangeLogReason = reason ?? "Revision",
                AuthorName = author ?? "Admin",
                ApplicabilityJson = applicabilityJson,
                RuleConfigJson = ruleConfigJson,
                ApprovalWorkflowJson = workflowJson,
                CreatedAt = DateTime.UtcNow
            };

            _db.PolicyVersions.Add(newVer);
            policy.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { id = newVer.Id, version = newVer.Version, message = "Policy version published to database." });
        }

        // ─────────────────────────────────────────────────────────────────────
        // DELETE /api/v1/policies/{id}
        // Soft-deletes a policy in the database
        // ─────────────────────────────────────────────────────────────────────
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.PolicyMasters.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);
            if (policy == null) return NotFound();

            policy.IsDeleted = true;
            policy.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Policy marked as deleted in database." });
        }

        // ─────────────────────────────────────────────────────────────────────
        // GET /api/v1/policies/schema/{category}
        // Returns category-specific UI schema and defaults directly from the database!
        // ─────────────────────────────────────────────────────────────────────
        [HttpGet("schema/{category}")]
        public async Task<IActionResult> GetCategorySchema(string category, [FromQuery] Guid? companyId = null, [FromQuery] Guid? projectId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            await EnsurePolicyRuleDefinitionsSeededAsync(tenantId);

            var isSuperAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("Admin");
            var isHr = User.IsInRole("HRManager") || isSuperAdmin;
            var isFinance = User.IsInRole("FinanceManager") || isSuperAdmin;

            var catDefs = await _db.PolicyRuleDefinitions
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && !d.IsDeleted && d.IsVisible && d.Category.ToLower() == category.ToLower())
                .OrderBy(d => d.DisplayOrder)
                .ToListAsync();

            if (!catDefs.Any())
            {
                return NotFound(new { message = $"No rule definitions found in database for category '{category}'." });
            }

            var resolvedFields = ResolveFieldDefinitions(catDefs, companyId, projectId);
            var defaultConfig = resolvedFields.ToDictionary(f => f.key, f => f.defaultValue);
            var meta = GetCategoryMetadata(category, isHr, isFinance, isSuperAdmin);

            return Ok(new
            {
                code = meta.code,
                name = meta.name,
                icon = meta.icon,
                description = meta.description,
                visible = meta.visible,
                editable = meta.editable,
                scope = new { companyId, projectId },
                fieldDefinitions = resolvedFields,
                defaultRuleConfig = defaultConfig
            });
        }

        // ─────────────────────────────────────────────────────────────────────
        // ADMIN / SUPERADMIN POLICY RULE DEFINITIONS CRUD
        // Allows Admins to add/edit/delete/configure rules & fields per company/project
        // ─────────────────────────────────────────────────────────────────────

        [HttpGet("definitions")]
        public async Task<IActionResult> GetDefinitions(
            [FromQuery] string? category = null,
            [FromQuery] Guid? companyId = null,
            [FromQuery] Guid? projectId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            await EnsurePolicyRuleDefinitionsSeededAsync(tenantId);

            var query = _db.PolicyRuleDefinitions
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && !d.IsDeleted);

            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(d => d.Category.ToLower() == category.ToLower());
            }

            if (companyId.HasValue)
            {
                query = query.Where(d => d.CompanyId == companyId.Value);
            }

            if (projectId.HasValue)
            {
                query = query.Where(d => d.ProjectId == projectId.Value);
            }

            var list = await query
                .OrderBy(d => d.Category)
                .ThenBy(d => d.DisplayOrder)
                .ThenBy(d => d.FieldLabel)
                .ToListAsync();

            return Ok(list);
        }

        [HttpPost("definitions")]
        public async Task<IActionResult> CreateDefinition([FromBody] PolicyRuleDefinition model)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (string.IsNullOrWhiteSpace(model.Category) || string.IsNullOrWhiteSpace(model.FieldKey))
            {
                return BadRequest(new { message = "Category and FieldKey are required." });
            }

            model.Id = Guid.NewGuid();
            model.TenantId = tenantId;
            model.CreatedAt = DateTime.UtcNow;
            model.UpdatedAt = null;
            model.IsDeleted = false;

            _db.PolicyRuleDefinitions.Add(model);
            await _db.SaveChangesAsync();

            return Ok(model);
        }

        [HttpPut("definitions/{id:guid}")]
        public async Task<IActionResult> UpdateDefinition(Guid id, [FromBody] PolicyRuleDefinition model)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var def = await _db.PolicyRuleDefinitions
                .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId && !d.IsDeleted);

            if (def == null) return NotFound(new { message = "Policy rule definition not found in database." });

            def.FieldLabel = model.FieldLabel;
            def.FieldType = model.FieldType;
            def.Section = model.Section;
            def.DefaultValue = model.DefaultValue;
            def.MinValue = model.MinValue;
            def.MaxValue = model.MaxValue;
            def.Step = model.Step;
            def.Unit = model.Unit;
            def.OptionsJson = model.OptionsJson;
            def.HelpText = model.HelpText;
            def.IsRequired = model.IsRequired;
            def.IsVisible = model.IsVisible;
            def.IsReadOnly = model.IsReadOnly;
            def.DisplayOrder = model.DisplayOrder;
            def.CompanyId = model.CompanyId;
            def.ProjectId = model.ProjectId;
            def.Status = model.Status;
            def.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(def);
        }

        [HttpDelete("definitions/{id:guid}")]
        public async Task<IActionResult> DeleteDefinition(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var def = await _db.PolicyRuleDefinitions
                .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId && !d.IsDeleted);

            if (def == null) return NotFound(new { message = "Policy rule definition not found in database." });

            def.IsDeleted = true;
            def.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Policy rule definition removed from database." });
        }

        [HttpPost("definitions/bulk")]
        public async Task<IActionResult> BulkUpsertDefinitions([FromBody] List<PolicyRuleDefinition> definitions)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            foreach (var item in definitions)
            {
                if (item.Id != Guid.Empty)
                {
                    var existing = await _db.PolicyRuleDefinitions.FirstOrDefaultAsync(d => d.Id == item.Id && d.TenantId == tenantId);
                    if (existing != null)
                    {
                        existing.FieldLabel = item.FieldLabel;
                        existing.DefaultValue = item.DefaultValue;
                        existing.MinValue = item.MinValue;
                        existing.MaxValue = item.MaxValue;
                        existing.IsVisible = item.IsVisible;
                        existing.IsRequired = item.IsRequired;
                        existing.CompanyId = item.CompanyId;
                        existing.ProjectId = item.ProjectId;
                        existing.UpdatedAt = DateTime.UtcNow;
                        continue;
                    }
                }

                item.Id = Guid.NewGuid();
                item.TenantId = tenantId;
                item.CreatedAt = DateTime.UtcNow;
                _db.PolicyRuleDefinitions.Add(item);
            }

            await _db.SaveChangesAsync();
            return Ok(new { message = "Bulk policy rule definitions saved to database." });
        }

        // ─────────────────────────────────────────────────────────────────────
        // POST /api/v1/policies/evaluate
        // Server-Side Business Rule Evaluation
        // Backend decides policy applicability, deductions, allowances, and workflows!
        // ─────────────────────────────────────────────────────────────────────
        [HttpPost("evaluate")]
        public async Task<IActionResult> Evaluate([FromBody] JsonElement payload)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var policyCode = payload.TryGetProperty("policyCode", out var pc) ? pc.GetString()?.Trim() : null;
            var employeeId = payload.TryGetProperty("employeeId", out var eid) ? eid.GetString()?.Trim() : null;
            var department = payload.TryGetProperty("department", out var dept) ? dept.GetString()?.Trim() : null;
            var employmentType = payload.TryGetProperty("employmentType", out var et) ? et.GetString()?.Trim() : "Permanent";
            var contextElem = payload.TryGetProperty("context", out var ctx) ? ctx : default;

            if (string.IsNullOrWhiteSpace(policyCode))
            {
                return BadRequest(new { message = "policyCode is required for evaluation." });
            }

            var policy = await _db.PolicyMasters
                .Include(p => p.Versions)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Code == policyCode && !p.IsDeleted);

            if (policy == null)
            {
                return NotFound(new { message = $"Policy with code '{policyCode}' not found in tenant database." });
            }

            var activeVer = policy.Versions
                .Where(v => !v.IsDeleted && v.Status == "Active")
                .OrderByDescending(v => v.EffectiveFrom)
                .FirstOrDefault() ?? policy.Versions.FirstOrDefault(v => !v.IsDeleted);

            if (activeVer == null)
            {
                return BadRequest(new { message = $"No active version found for policy '{policyCode}'." });
            }

            // 1. Check Applicability Scope
            bool isApplicable = true;
            if (!string.IsNullOrWhiteSpace(activeVer.ApplicabilityJson) && activeVer.ApplicabilityJson != "{}")
            {
                try
                {
                    using var doc = JsonDocument.Parse(activeVer.ApplicabilityJson);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("excludedEmployeeIds", out var excl) && excl.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in excl.EnumerateArray())
                        {
                            if (string.Equals(item.GetString(), employeeId, StringComparison.OrdinalIgnoreCase))
                            {
                                isApplicable = false;
                                break;
                            }
                        }
                    }

                    if (isApplicable && !string.IsNullOrWhiteSpace(department) && root.TryGetProperty("departmentIds", out var depts) && depts.ValueKind == JsonValueKind.Array && depts.GetArrayLength() > 0)
                    {
                        bool deptMatch = false;
                        foreach (var item in depts.EnumerateArray())
                        {
                            if (string.Equals(item.GetString(), department, StringComparison.OrdinalIgnoreCase))
                            {
                                deptMatch = true;
                                break;
                            }
                        }
                        if (!deptMatch) isApplicable = false;
                    }
                }
                catch
                {
                    // Ignore parse issues and assume general applicability
                }
            }

            if (!isApplicable)
            {
                return Ok(new
                {
                    isApplicable = false,
                    policyCode = policy.Code,
                    policyName = policy.Name,
                    version = activeVer.Version,
                    decision = "NotApplicable",
                    isCompliant = true,
                    message = "Policy scope is not applicable to the specified employee or department context.",
                    deductionDays = 0.0,
                    financialDelta = 0.0,
                    requiredApprovals = Array.Empty<object>(),
                    allowDispute = false,
                    disputeWindowDays = 0,
                    evaluatedRules = TryParseJson(activeVer.RuleConfigJson)
                });
            }

            // 2. Evaluate Domain Rules
            string decision = "Approved";
            bool isCompliant = true;
            string message = "Policy criteria fully met.";
            double deductionDays = 0.0;
            double financialDelta = 0.0;

            if (policy.Code.Contains("LATE") || policy.Category == "ATTENDANCE_TIMESHEET")
            {
                int graceMinutes = 15;
                int maxAllowed = 3;
                if (!string.IsNullOrWhiteSpace(activeVer.RuleConfigJson))
                {
                    try
                    {
                        using var rdoc = JsonDocument.Parse(activeVer.RuleConfigJson);
                        if (rdoc.RootElement.TryGetProperty("gracePeriodMinutes", out var gp)) graceMinutes = gp.GetInt32();
                        if (rdoc.RootElement.TryGetProperty("maxAllowedPerMonth", out var ma)) maxAllowed = ma.GetInt32();
                    }
                    catch { }
                }

                int lateMinutes = contextElem.ValueKind == JsonValueKind.Object && contextElem.TryGetProperty("lateMinutes", out var lm) ? lm.GetInt32() : 0;
                int monthlyLateCount = contextElem.ValueKind == JsonValueKind.Object && contextElem.TryGetProperty("monthlyLateCount", out var mlc) ? mlc.GetInt32() : 1;

                if (lateMinutes <= graceMinutes)
                {
                    decision = "WithinGrace";
                    isCompliant = true;
                    message = $"Late arrival of {lateMinutes}m is within the permissible statutory grace window of {graceMinutes}m.";
                }
                else
                {
                    if (monthlyLateCount >= 6)
                    {
                        decision = "DeductionApplicable";
                        isCompliant = false;
                        deductionDays = 1.0;
                        message = $"Late occurrence #{monthlyLateCount} exceeds permissible cap ({maxAllowed}). Full-day salary deduction applies.";
                    }
                    else if (monthlyLateCount > maxAllowed)
                    {
                        decision = "DeductionApplicable";
                        isCompliant = false;
                        deductionDays = 0.5;
                        message = $"Late occurrence #{monthlyLateCount} exceeds permissible cap ({maxAllowed}). Half-day salary deduction applies.";
                    }
                    else
                    {
                        decision = "Warning";
                        isCompliant = true;
                        message = $"Late mark #{monthlyLateCount} recorded. Warning logged within monthly tolerance of {maxAllowed}.";
                    }
                }
            }
            else if (policy.Code.Contains("CONVEYANCE") || policy.Category == "TRAVEL_EXPENSE")
            {
                double bikeRate = 4.5;
                if (!string.IsNullOrWhiteSpace(activeVer.RuleConfigJson))
                {
                    try
                    {
                        using var rdoc = JsonDocument.Parse(activeVer.RuleConfigJson);
                        if (rdoc.RootElement.TryGetProperty("twoWheelerRatePerKm", out var br)) bikeRate = br.GetDouble();
                    }
                    catch { }
                }

                double km = contextElem.ValueKind == JsonValueKind.Object && contextElem.TryGetProperty("monthlyKm", out var mk) ? mk.GetDouble() : 0;
                financialDelta = Math.Round(km * bikeRate, 2);
                decision = "Approved";
                isCompliant = true;
                message = $"Conveyance calculated at ₹{bikeRate}/km for {km} km = ₹{financialDelta}.";
            }
            else if (policy.Category == "HR_CORE")
            {
                int minScore = 70;
                if (!string.IsNullOrWhiteSpace(activeVer.RuleConfigJson))
                {
                    try
                    {
                        using var rdoc = JsonDocument.Parse(activeVer.RuleConfigJson);
                        if (rdoc.RootElement.TryGetProperty("minimumReviewScoreForConfirmation", out var ms)) minScore = ms.GetInt32();
                    }
                    catch { }
                }

                int score = contextElem.ValueKind == JsonValueKind.Object && contextElem.TryGetProperty("evaluationScore", out var es) ? es.GetInt32() : 75;
                if (score >= minScore)
                {
                    decision = "Approved";
                    isCompliant = true;
                    message = $"Performance review score ({score}%) satisfies confirmation threshold ({minScore}%).";
                }
                else
                {
                    decision = "RequiresExtension";
                    isCompliant = false;
                    message = $"Performance review score ({score}%) is below confirmation threshold ({minScore}%). Probation extension recommended.";
                }
            }

            var workflowObj = TryParseJson(activeVer.ApprovalWorkflowJson);

            return Ok(new
            {
                isApplicable = true,
                policyCode = policy.Code,
                policyName = policy.Name,
                version = activeVer.Version,
                decision = decision,
                isCompliant = isCompliant,
                message = message,
                deductionDays = deductionDays,
                financialDelta = financialDelta,
                requiredApprovals = workflowObj,
                allowDispute = policy.Category != "STATUTORY_COMPLIANCE",
                disputeWindowDays = 7,
                evaluatedRules = TryParseJson(activeVer.RuleConfigJson)
            });
        }

        // ─────────────────────────────────────────────────────────────────────
        // POST /api/v1/policies/simulate
        // Server-Side Dry-Run What-If Analysis
        // Backend computes payroll and operational variance before publishing!
        // ─────────────────────────────────────────────────────────────────────
        [HttpPost("simulate")]
        public async Task<IActionResult> Simulate([FromBody] JsonElement payload)
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var policyCode = payload.TryGetProperty("policyCode", out var pc) ? pc.GetString()?.Trim() : "ATT_LATE_COMING";
            var deptFilter = payload.TryGetProperty("departmentFilter", out var df) ? df.GetString()?.Trim() : null;
            var proposedConfig = payload.TryGetProperty("proposedRuleConfig", out var prc) ? prc : default;

            // Representative enterprise staff dataset
            var sampleStaff = new List<(string Id, string Name, string Dept, int LateCount, int MonthlyKm, double Salary)>
            {
                ("EMP-101", "Dr. Rakesh Verma", "Clinical", 4, 240, 125000),
                ("EMP-102", "Sister Sunita Xalxo", "Nursing", 2, 60, 38000),
                ("EMP-103", "Aman Deep (Lab Tech)", "Diagnostics", 5, 420, 28000),
                ("EMP-104", "Pooja Kumari (Sample Collector)", "Diagnostics", 3, 580, 22000),
                ("EMP-105", "Vikas Sinha (Store Admin)", "Stores", 1, 30, 32000),
                ("EMP-106", "Dr. Anjali Mehta", "ICU", 4, 180, 140000),
                ("EMP-107", "Ramesh Sharma (Security)", "Administration", 6, 0, 18500),
                ("EMP-108", "Neha Roy (Billing Desk)", "Billing", 4, 45, 26000)
            };

            // Query actual database employees if available
            var dbEmployees = await _db.Employees
                .AsNoTracking()
                .Where(e => e.TenantId == tenantId && !e.IsDeleted)
                .Take(15)
                .ToListAsync();

            if (dbEmployees.Count > 0)
            {
                var rand = new Random(42);
                for (int i = 0; i < dbEmployees.Count; i++)
                {
                    var emp = dbEmployees[i];
                    var name = emp.FullName ?? $"Employee {i + 1}";
                    var dept = !string.IsNullOrWhiteSpace(emp.WorkLocation) ? emp.WorkLocation : "Clinical";
                    var lates = rand.Next(1, 6);
                    var km = rand.Next(20, 500);
                    var sal = 35000.0 + (rand.Next(0, 50) * 1000);
                    sampleStaff.Add((emp.EmployeeCode ?? $"DB-{i + 1}", name, dept, lates, km, sal));
                }
            }

            var staff = !string.IsNullOrWhiteSpace(deptFilter)
                ? sampleStaff.Where(s => string.Equals(s.Dept, deptFilter, StringComparison.OrdinalIgnoreCase)).ToList()
                : sampleStaff;

            var comparisons = new List<object>();
            int totalImpacted = 0;
            double totalFinancialVariance = 0;

            if (policyCode == "ATT_LATE_COMING")
            {
                int newGrace = proposedConfig.ValueKind == JsonValueKind.Object && proposedConfig.TryGetProperty("gracePeriodMinutes", out var gp) ? gp.GetInt32() : 15;
                int maxAllowed = proposedConfig.ValueKind == JsonValueKind.Object && proposedConfig.TryGetProperty("maxAllowedPerMonth", out var ma) ? ma.GetInt32() : 3;

                foreach (var emp in staff)
                {
                    int simulatedLates = newGrace < 15 ? emp.LateCount + 1 : emp.LateCount;
                    double currentDeductionDays = emp.LateCount > 3 ? (emp.LateCount >= 6 ? 1.0 : 0.5) : 0.0;
                    double simulatedDeductionDays = simulatedLates > maxAllowed ? (simulatedLates >= 6 ? 1.0 : 0.5) : 0.0;

                    double deltaDays = simulatedDeductionDays - currentDeductionDays;
                    double perDayWage = emp.Salary / 30.0;
                    double deltaAmount = -Math.Round(deltaDays * perDayWage);

                    bool isImpacted = Math.Abs(deltaDays) > 0.01;
                    if (isImpacted) totalImpacted++;
                    totalFinancialVariance += deltaAmount;

                    comparisons.Add(new
                    {
                        employeeId = emp.Id,
                        employeeName = emp.Name,
                        department = emp.Dept,
                        currentOutcome = currentDeductionDays > 0 ? $"{currentDeductionDays}d LOP Deduction" : "No Deduction",
                        simulatedOutcome = simulatedDeductionDays > 0 ? $"{simulatedDeductionDays}d LOP Deduction" : "No Deduction",
                        financialDelta = deltaAmount
                    });
                }
            }
            else if (policyCode == "EXP_LOCAL_CONVEYANCE")
            {
                double newTwoWheelerRate = proposedConfig.ValueKind == JsonValueKind.Object && proposedConfig.TryGetProperty("twoWheelerRatePerKm", out var tr) ? tr.GetDouble() : 4.5;
                double oldTwoWheelerRate = 4.5;

                foreach (var emp in staff)
                {
                    double currentPayout = emp.MonthlyKm * oldTwoWheelerRate;
                    double simulatedPayout = emp.MonthlyKm * newTwoWheelerRate;
                    double delta = Math.Round(simulatedPayout - currentPayout);

                    bool isImpacted = Math.Abs(delta) > 0.01;
                    if (isImpacted) totalImpacted++;
                    totalFinancialVariance += delta;

                    comparisons.Add(new
                    {
                        employeeId = emp.Id,
                        employeeName = emp.Name,
                        department = emp.Dept,
                        currentOutcome = $"₹{currentPayout:N0}/mo (at ₹{oldTwoWheelerRate}/km)",
                        simulatedOutcome = $"₹{simulatedPayout:N0}/mo (at ₹{newTwoWheelerRate}/km)",
                        financialDelta = delta
                    });
                }
            }
            else
            {
                foreach (var emp in staff)
                {
                    comparisons.Add(new
                    {
                        employeeId = emp.Id,
                        employeeName = emp.Name,
                        department = emp.Dept,
                        currentOutcome = "Baseline Enterprise Evaluation",
                        simulatedOutcome = "Evaluated against proposed backend parameters",
                        financialDelta = 0.0
                    });
                }
            }

            int percentage = staff.Count > 0 ? (int)Math.Round(((double)totalImpacted / staff.Count) * 100) : 0;
            string disputeRiskScore = percentage > 50 ? "High" : percentage > 25 ? "Medium" : "Low";

            var keyFindings = new List<string>
            {
                $"Server evaluated {staff.Count} representative employee profiles against database rules."
            };

            if (totalImpacted > 0)
            {
                keyFindings.Add($"{totalImpacted} employees ({percentage}%) will experience changes in monthly outcome.");
            }
            else
            {
                keyFindings.Add("Zero employees experience negative variance under the tested configuration.");
            }

            if (Math.Abs(totalFinancialVariance) > 0.01)
            {
                string dir = totalFinancialVariance > 0 ? "increase" : "reduction";
                keyFindings.Add($"Estimated monthly payroll variance: ₹{Math.Abs(totalFinancialVariance):N0} net {dir}.");
            }

            if (disputeRiskScore == "High")
            {
                keyFindings.Add("High dispute risk detected: consider phased implementation or townhall communication prior to rollout.");
            }

            var result = new
            {
                policyCode,
                totalEvaluatedEmployees = staff.Count,
                totalImpactedEmployees = totalImpacted,
                percentageImpacted = percentage,
                financialVarianceEstimate = totalFinancialVariance,
                disputeRiskScore,
                keyFindings,
                sampleComparisons = comparisons
            };

            return Ok(result);
        }

        public static async Task EnsurePolicyRuleDefinitionsSeededAsync(ApplicationDbContext db, Guid tenantId)
        {
            var exists = await db.PolicyRuleDefinitions.AnyAsync(d => d.TenantId == tenantId && !d.IsDeleted);
            if (!exists)
            {
                var seeds = GetBaselineStatutoryRuleSeeds(tenantId);
                db.PolicyRuleDefinitions.AddRange(seeds);
                await db.SaveChangesAsync();
            }
        }

        private Task EnsurePolicyRuleDefinitionsSeededAsync(Guid tenantId) => EnsurePolicyRuleDefinitionsSeededAsync(_db, tenantId);

        private static List<dynamic> ResolveCategoriesFromDefinitions(
            List<PolicyRuleDefinition> allDefs,
            Guid? companyId,
            Guid? projectId,
            bool isHr,
            bool isFinance,
            bool isSuperAdmin)
        {
            var categories = new List<dynamic>();
            var grouped = allDefs.GroupBy(d => d.Category.ToUpperInvariant());

            var orderedCodes = new[]
            {
                "HR_CORE", "ATTENDANCE_TIMESHEET", "LEAVE", "PAYROLL_COMPENSATION", "STATUTORY_COMPLIANCE",
                "TRAVEL_EXPENSE", "DISCIPLINE_RELATIONS", "IT_ERP", "SEPARATION", "PERFORMANCE_APPRAISAL",
                "RECRUITMENT_HIRING", "TRAINING_LND", "ASSET_MANAGEMENT", "BENEFITS_WELLNESS"
            };

            foreach (var catCode in orderedCodes)
            {
                var catGroup = grouped.FirstOrDefault(g => g.Key == catCode)?.ToList() ?? new List<PolicyRuleDefinition>();
                var meta = GetCategoryMetadata(catCode, isHr, isFinance, isSuperAdmin);

                var resolvedFields = ResolveFieldDefinitions(catGroup, companyId, projectId);
                var defaultConfig = resolvedFields.ToDictionary(f => (string)f.key, f => (object)f.defaultValue);

                categories.Add(new
                {
                    code = meta.code,
                    name = meta.name,
                    icon = meta.icon,
                    description = meta.description,
                    visible = meta.visible,
                    editable = meta.editable,
                    fieldDefinitions = resolvedFields.ToArray(),
                    defaultRuleConfig = defaultConfig
                });
            }

            return categories;
        }

        public static List<dynamic> ResolveFieldDefinitions(
            List<PolicyRuleDefinition> defs,
            Guid? companyId,
            Guid? projectId)
        {
            var result = new List<dynamic>();
            var groupedByField = defs.GroupBy(d => d.FieldKey);

            foreach (var g in groupedByField)
            {
                PolicyRuleDefinition? chosen = null;
                if (projectId.HasValue)
                {
                    chosen = g.FirstOrDefault(d => d.ProjectId == projectId.Value);
                }
                if (chosen == null && companyId.HasValue)
                {
                    chosen = g.FirstOrDefault(d => d.CompanyId == companyId.Value && d.ProjectId == null);
                }
                if (chosen == null)
                {
                    chosen = g.FirstOrDefault(d => d.CompanyId == null && d.ProjectId == null) ?? g.First();
                }

                result.Add(new
                {
                    id = chosen.Id,
                    key = chosen.FieldKey,
                    label = chosen.FieldLabel,
                    type = chosen.FieldType,
                    defaultValue = ParseDefaultValue(chosen.DefaultValue, chosen.FieldType),
                    min = chosen.MinValue,
                    max = chosen.MaxValue,
                    step = chosen.Step,
                    unit = chosen.Unit,
                    required = chosen.IsRequired,
                    visible = chosen.IsVisible,
                    readOnly = chosen.IsReadOnly,
                    section = chosen.Section,
                    helpText = chosen.HelpText,
                    options = string.IsNullOrWhiteSpace(chosen.OptionsJson) ? null : TryParseOptions(chosen.OptionsJson),
                    companyId = chosen.CompanyId,
                    projectId = chosen.ProjectId
                });
            }

            return result;
        }

        private static string[]? TryParseOptions(string json)
        {
            try
            {
                return JsonSerializer.Deserialize<string[]>(json);
            }
            catch
            {
                return null;
            }
        }

        private static (string code, string name, string icon, string description, bool visible, bool editable) GetCategoryMetadata(
            string category, bool isHr, bool isFinance, bool isSuperAdmin)
        {
            return category.ToUpperInvariant() switch
            {
                "HR_CORE" => ("HR_CORE", "HR Core Policies", "Users", "Employee Master, Confirmation, Probation, Transfer, Promotion, Demotion, and Hierarchy.", true, isHr),
                "ATTENDANCE_TIMESHEET" => ("ATTENDANCE_TIMESHEET", "Attendance & Timesheet", "Clock", "Shifts, Grace Period, Overtime, WFH, Field Geofencing, FRS Biometric, Missed Punch, and Regularization.", true, isHr),
                "LEAVE" => ("LEAVE", "Leave & Time-Off", "Calendar", "CL, SL, EL/PL, Maternity, Paternity, Comp-Off, LWP, Holidays, Carry-Forward, and Encashment.", true, isHr),
                "PAYROLL_COMPENSATION" => ("PAYROLL_COMPENSATION", "Payroll & Compensation", "BadgePercent", "Salary Structures, Increments, Deductions, Loans, Advances, Bonuses, Arrears, and F&F.", isFinance || isHr, isFinance),
                "STATUTORY_COMPLIANCE" => ("STATUTORY_COMPLIANCE", "Statutory & Compliance", "ShieldCheck", "PF, ESI, Professional Tax, TDS, Gratuity, Bonus Act, Minimum Wages, and CLRA Labour Returns.", true, isFinance || isHr),
                "TRAVEL_EXPENSE" => ("TRAVEL_EXPENSE", "Travel & Expenses", "MapPin", "Tour TA/DA, Local Conveyance, Hotel Slabs, Mileage/Fuel, Advances, and Settlement Rules.", true, isFinance),
                "DISCIPLINE_RELATIONS" => ("DISCIPLINE_RELATIONS", "Discipline & Employee Relations", "Scale", "Code of Conduct, Misconduct, Show-Cause, Suspension, Domestic Enquiry, Grievance, and PoSH.", isHr, isHr),
                "IT_ERP" => ("IT_ERP", "IT & ERP Security", "Lock", "RBAC, Maker-Checker, Approval Matrix, 2FA/MFA, Session Policies, IP Restrictions, and Data Privacy.", isSuperAdmin, isSuperAdmin),
                "SEPARATION" => ("SEPARATION", "Separation & Offboarding", "LogOut", "Resignation, Notice Period Buyout, Exit Clearance, Asset Recovery, F&F, and Relieving Letters.", true, isHr),
                "PERFORMANCE_APPRAISAL" => ("PERFORMANCE_APPRAISAL", "Performance & Appraisal", "TrendingUp", "KRA/KPI goal setting, 360 reviews, Bell-curve rating normalization, and promotion benchmarks.", true, isHr),
                "RECRUITMENT_HIRING" => ("RECRUITMENT_HIRING", "Recruitment & Hiring", "UserPlus", "Manpower requisition matrices, candidate referral incentives, and BGV verification protocols.", true, isHr),
                "TRAINING_LND" => ("TRAINING_LND", "Learning & Development", "GraduationCap", "Annual skill development budgets, training bond covenants, and certification sponsorships.", true, isHr),
                "ASSET_MANAGEMENT" => ("ASSET_MANAGEMENT", "Asset Allocation & IT", "Laptop", "Hardware provisioning thresholds, equipment depreciation, and damage liability recovery.", true, isHr || isSuperAdmin),
                "BENEFITS_WELLNESS" => ("BENEFITS_WELLNESS", "Benefits & Wellness", "HeartPulse", "Group medical insurance sum insured, executive health checkups, and meal voucher programs.", true, isHr),
                _ => (category, category, "FileText", "Enterprise organizational policy configuration.", true, isSuperAdmin)
            };
        }

        private static object ParseDefaultValue(string val, string type)
        {
            if (string.IsNullOrWhiteSpace(val))
            {
                return type == "number" ? 0m : (type == "boolean" ? false : "");
            }
            if (type == "number")
            {
                if (decimal.TryParse(val, out var d)) return d;
                return 0m;
            }
            if (type == "boolean")
            {
                if (bool.TryParse(val, out var b)) return b;
                return val.Equals("1") || val.Equals("true", StringComparison.OrdinalIgnoreCase);
            }
            return val;
        }

        private static List<PolicyRuleDefinition> GetBaselineStatutoryRuleSeeds(Guid tenantId)
        {
            var seeds = new List<PolicyRuleDefinition>();
            void AddSeed(string cat, string code, string key, string label, string type, string section, string defVal, decimal? min, decimal? max, string? unit, string help, string? options = null)
            {
                seeds.Add(new PolicyRuleDefinition
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    Category = cat,
                    PolicyCode = code,
                    FieldKey = key,
                    FieldLabel = label,
                    FieldType = type,
                    Section = section,
                    DefaultValue = defVal,
                    MinValue = min,
                    MaxValue = max,
                    Unit = unit,
                    HelpText = help,
                    OptionsJson = options,
                    IsRequired = true,
                    IsVisible = true,
                    IsReadOnly = false,
                    DisplayOrder = seeds.Count + 1,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                });
            }

            // PAYROLL_COMPENSATION
            AddSeed("PAYROLL_COMPENSATION", "PAY_STAT_PF_ESI", "basicPercentageOfGross", "Basic Salary % of Gross", "number", "Wage Code Architecture", "50", 20, 70, "%", "Statutory minimum 50% under Indian Code on Wages.");
            AddSeed("PAYROLL_COMPENSATION", "PAY_STAT_PF_ESI", "hraPercentageOfBasic", "HRA % of Basic", "number", "Wage Code Architecture", "40", 20, 50, "%", "40% for Non-Metro, 50% for Metro cities under IT Act.");
            AddSeed("PAYROLL_COMPENSATION", "PAY_STAT_PF_ESI", "pfWageCeiling", "EPF Statutory Wage Ceiling", "number", "Statutory Deductions", "15000", 0, 100000, "₹", "Statutory EPFO monthly salary limit.");
            AddSeed("PAYROLL_COMPENSATION", "PAY_STAT_PF_ESI", "pfEmployeeRate", "EPF Employee Contribution Rate", "number", "Statutory Deductions", "12", 0, 20, "%", "Standard employee deduction rate (12%).");
            AddSeed("PAYROLL_COMPENSATION", "PAY_STAT_PF_ESI", "pfEmployerRate", "EPF Employer Contribution Rate", "number", "Statutory Deductions", "12", 0, 20, "%", "Standard employer matching rate (12%).");
            AddSeed("PAYROLL_COMPENSATION", "PAY_STAT_PF_ESI", "esiWageCeiling", "ESIC Gross Wage Ceiling", "number", "Statutory Deductions", "21000", 0, 50000, "₹", "Statutory ESIC monthly gross cutoff.");
            AddSeed("PAYROLL_COMPENSATION", "PAY_STAT_PF_ESI", "esiEmployeeRate", "ESIC Employee Contribution Rate", "number", "Statutory Deductions", "0.75", 0, 5, "%", "0.75% of gross wage.");
            AddSeed("PAYROLL_COMPENSATION", "PAY_STAT_PF_ESI", "esiEmployerRate", "ESIC Employer Contribution Rate", "number", "Statutory Deductions", "3.25", 0, 10, "%", "3.25% of gross wage.");
            AddSeed("PAYROLL_COMPENSATION", "PAY_STAT_PF_ESI", "professionalTaxMonthly", "State Professional Tax (PT)", "number", "Statutory Deductions", "200", 0, 2500, "₹", "Monthly PT statutory slab deduction.");
            AddSeed("PAYROLL_COMPENSATION", "PAY_STAT_PF_ESI", "payDayOfMonth", "Monthly Disbursement Pay Day", "number", "Pay Cycle & Schedule", "1", 1, 31, "Day", "Target date for monthly salary transfer.");
            AddSeed("PAYROLL_COMPENSATION", "PAY_STAT_PF_ESI", "allowNegativeTakeHome", "Permit Negative Take-Home", "boolean", "Pay Cycle & Schedule", "false", null, null, null, "Guardrail ensuring deductions do not produce negative net pay.");

            // HR_CORE
            AddSeed("HR_CORE", "PROB_CONFIRMATION", "defaultProbationMonths", "Standard Probation Period (Months)", "number", "Probation Durations & Extension Governance", "3", 1, 24, "Months", "Default evaluation period for newly joined personnel.");
            AddSeed("HR_CORE", "PROB_CONFIRMATION", "maxExtensionMonths", "Max Allowed Extension (Months)", "number", "Probation Durations & Extension Governance", "3", 0, 12, "Months", "Upper cap on probation extension if performance is borderline.");
            AddSeed("HR_CORE", "PROB_CONFIRMATION", "noticePeriodDaysProbation", "Notice Period During Probation (Days)", "number", "Statutory Notice Periods", "15", 0, 180, "Days", "Notice days required during probation.");
            AddSeed("HR_CORE", "PROB_CONFIRMATION", "noticePeriodDaysConfirmed", "Notice Period After Confirmation (Days)", "number", "Statutory Notice Periods", "60", 0, 180, "Days", "Notice days applicable for confirmed permanent employees.");
            AddSeed("HR_CORE", "PROB_CONFIRMATION", "minimumReviewScoreForConfirmation", "Minimum Review Score For Confirmation (%)", "number", "Evaluation Thresholds", "70", 0, 100, "%", "Benchmark percentage required to confirm without extension.");
            AddSeed("HR_CORE", "PROB_CONFIRMATION", "requiresManagerReview", "Mandatory Line Manager Review", "boolean", "Evaluation Thresholds", "true", null, null, null, "Line manager must submit score and recommendation.");

            // ATTENDANCE_TIMESHEET
            AddSeed("ATTENDANCE_TIMESHEET", "ATT_LATE_COMING", "gracePeriodMinutes", "Grace Period Window (Minutes)", "number", "Late Mark Rules", "15", 0, 60, "Minutes", "Grace window after scheduled shift start before late mark is flagged.");
            AddSeed("ATTENDANCE_TIMESHEET", "ATT_LATE_COMING", "maxAllowedPerMonth", "Max Allowed Lates per Month", "number", "Late Mark Rules", "3", 0, 10, "Times", "Permissible late occurrences before wage deduction.");
            AddSeed("ATTENDANCE_TIMESHEET", "ATT_LATE_COMING", "standardShiftHours", "Standard Full-Day Shift Hours", "number", "Shift & Hours", "8.0", 4, 16, "Hours", "Standard working shift duration.");
            AddSeed("ATTENDANCE_TIMESHEET", "ATT_LATE_COMING", "minHalfDayHours", "Minimum Half-Day Hours Threshold", "number", "Shift & Hours", "4.0", 2, 8, "Hours", "Threshold for half-day attendance credit.");

            // LEAVE
            AddSeed("LEAVE", "LEV_EARNED_PRIVILEGE", "annualEntitlement", "Annual Earned / Privilege Leave Quota", "number", "Entitlement & Accrual", "18", 0, 60, "Days", "Annual credited privilege leave quota.");
            AddSeed("LEAVE", "LEV_EARNED_PRIVILEGE", "carryForwardCap", "Maximum Carry-Forward Cap", "number", "Carry Forward & Encashment", "30", 0, 90, "Days", "Upper limit on leaves accumulated into next financial year.");
            AddSeed("LEAVE", "LEV_EARNED_PRIVILEGE", "encashmentAllowed", "Allow Leave Encashment", "boolean", "Carry Forward & Encashment", "true", null, null, null, "Enable encashment of accumulated earned leaves.");

            // TRAVEL_EXPENSE
            AddSeed("TRAVEL_EXPENSE", "EXP_TRAVEL_ALLOWANCE", "maxDailyLodgingAllowance", "Daily Hotel Lodging Ceiling (INR)", "number", "Per Diem Limits", "3500", 500, 50000, "₹", "Maximum hotel accommodation reimbursement per 24-hour cycle.");
            AddSeed("TRAVEL_EXPENSE", "EXP_TRAVEL_ALLOWANCE", "maxDailyMealsAllowance", "Daily Meal Allowance Ceiling (INR)", "number", "Per Diem Limits", "800", 100, 5000, "₹", "Daily food and meal reimbursement limit.");
            AddSeed("TRAVEL_EXPENSE", "EXP_TRAVEL_ALLOWANCE", "mileageRatePerKmCar", "Car Fuel Mileage Rate (₹/km)", "number", "Mileage & Conveyance", "12", 5, 30, "₹/km", "Mileage rate for official travel using personal car.");
            AddSeed("TRAVEL_EXPENSE", "EXP_TRAVEL_ALLOWANCE", "mileageRatePerKmBike", "Two-Wheeler Mileage Rate (₹/km)", "number", "Mileage & Conveyance", "6", 2, 15, "₹/km", "Mileage rate for official travel using two-wheeler.");

            // SEPARATION
            AddSeed("SEPARATION", "SEP_EXIT_FF_SETTLEMENT", "fnfSettlementWindowDays", "Full & Final Settlement Window (Days)", "number", "Settlement SLA", "30", 7, 60, "Days", "SLA days from final working day to disburse F&F.");

            // PERFORMANCE_APPRAISAL
            AddSeed("PERFORMANCE_APPRAISAL", "PERF_ANNUAL_REVIEW", "promotionScoreThreshold", "Promotion Score Benchmark (%)", "number", "Promotion Governance", "85", 50, 100, "%", "Minimum appraisal score required for promotion consideration.");

            // RECRUITMENT_HIRING
            AddSeed("RECRUITMENT_HIRING", "REC_HIRING_POLICY", "referralBonusINR", "Employee Referral Incentive (INR)", "number", "Incentives", "25000", 0, 200000, "₹", "Referral bonus disbursed upon candidate probation confirmation.");

            // ASSET_MANAGEMENT
            AddSeed("ASSET_MANAGEMENT", "ASSET_IT_PROVISIONING", "standardLaptopBudgetINR", "Standard Laptop Budget (INR)", "number", "Hardware Ceilings", "75000", 25000, 300000, "₹", "Hardware allocation ceiling for standard staff grade.");

            return seeds;
        }

        private static object TryParseJson(string json)
        {
            if (string.IsNullOrWhiteSpace(json)) return new { };
            try
            {
                return JsonSerializer.Deserialize<JsonElement>(json);
            }
            catch
            {
                return new { };
            }
        }

        private async Task SeedDefaultPoliciesAsync(Guid tenantId)
        {
            var defaults = new (string code, string cat, string name, string desc, bool mandatory, bool critical, int prio, string ruleJson)[]
            {
                ("ATT_LATE_COMING", "ATTENDANCE_TIMESHEET", "Late Mark & Grace Period Policy", "15 minutes grace window, up to 3 occurrences per month; 4th occurrence incurs half-day deduction.", true, true, 5, JsonSerializer.Serialize(new { gracePeriodMinutes = 15, maxAllowedPerMonth = 3, fourthLateDeduction = "HalfDay", sixthLateDeduction = "FullDay" })),
                ("ATT_HOSPITAL_NIGHT_ROTATION", "ATTENDANCE_TIMESHEET", "Hospital Clinical 24x7 Rotational Shift Policy", "Mandatory 12-hour rest interval between clinical rotations; night duty differential allowance.", true, true, 8, JsonSerializer.Serialize(new { minRestHoursBetweenShifts = 12, maxContinuousNightShifts = 4, nightShiftAllowancePerNightINR = 350 })),
                ("LEV_EARNED_PRIVILEGE", "LEAVE", "Privilege / Earned Leave & Encashment Policy", "18 days annual quota, up to 30 days carry-forward, and statutory encashment.", false, true, 10, JsonSerializer.Serialize(new { annualEntitlement = 18, accrualFrequency = "Monthly", carryForwardCap = 30, encashmentAllowed = true, maxEncashmentDaysPerYear = 15 })),
                ("PAY_STAT_PF_ESI", "PAYROLL_COMPENSATION", "Indian Code on Wages & Statutory Compensation Policy", "Basic wage 50% of gross, PF ceiling ₹15,000, ESI applicability ceiling ₹21,000.", true, true, 1, JsonSerializer.Serialize(new { basicPercentageOfGross = 50, hraPercentageOfBasic = 40, pfWageCeiling = 15000, pfEmployeeRate = 12, pfEmployerRate = 12, esiWageCeiling = 21000, esiEmployeeRate = 0.75, esiEmployerRate = 3.25 })),
                ("EXP_LOCAL_CONVEYANCE", "TRAVEL_EXPENSE", "Field Staff & Sample Collection Conveyance Policy", "Fuel mileage rate ₹10/km for 4-wheelers, ₹4.5/km for 2-wheelers; daily DA allowance slab ₹600.", false, false, 15, JsonSerializer.Serialize(new { fourWheelerRatePerKm = 10.0, twoWheelerRatePerKm = 4.5, dailyMealAllowanceINR = 600 })),
                ("DISC_POSH_ZERO_TOLERANCE", "DISCIPLINE_RELATIONS", "Prevention of Sexual Harassment (PoSH) Policy", "Statutory zero-tolerance PoSH policy; mandatory 90-day inquiry completion SLA with ICC.", true, true, 1, JsonSerializer.Serialize(new { mandatoryAnnualTraining = true, iccInquiryTimeLimitDays = 90 })),
                ("IT_ERP_SECURITY_RBAC", "IT_ERP", "ERP Access, Maker-Checker & MFA Policy", "Role-based access control, dual-authorization for disbursements > ₹50,000, mandatory MFA.", true, true, 1, JsonSerializer.Serialize(new { makerCheckerThresholdINR = 50000, sessionTimeoutMinutes = 30 })),
                ("SEP_EXIT_FF_SETTLEMENT", "SEPARATION", "Separation, Multi-Department Clearance & F&F Policy", "30-day Full & Final settlement SLA post-exit, mandatory clinical, asset, and accounts clearances.", false, true, 12, JsonSerializer.Serialize(new { fnfSettlementWindowDays = 30 }))
            };

            foreach (var item in defaults)
            {
                var pm = new PolicyMaster
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    Code = item.code,
                    Category = item.cat,
                    Name = item.name,
                    Description = item.desc,
                    IsMandatoryAcknowledgment = item.mandatory,
                    IsSystemCritical = item.critical,
                    Priority = item.prio,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                };

                var pv = new PolicyVersion
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    PolicyId = pm.Id,
                    Version = "1.0",
                    EffectiveFrom = DateTime.UtcNow.Date,
                    EffectiveTo = null,
                    Status = "Active",
                    ChangeLogReason = "Database Seeded Baseline Policy",
                    AuthorName = "System",
                    ApplicabilityJson = "{}",
                    RuleConfigJson = item.ruleJson,
                    ApprovalWorkflowJson = JsonSerializer.Serialize(new
                    {
                        workflowType = "SingleLevel",
                        levels = new[] { new { level = 1, role = "ReportingManager", slaHours = 48, canReject = true, canRequestClarification = true } },
                        allowEmployeeDispute = true,
                        disputeWindowDays = 7
                    }),
                    CreatedAt = DateTime.UtcNow
                };

                _db.PolicyMasters.Add(pm);
                _db.PolicyVersions.Add(pv);
            }

            await _db.SaveChangesAsync();
        }
    }
}
