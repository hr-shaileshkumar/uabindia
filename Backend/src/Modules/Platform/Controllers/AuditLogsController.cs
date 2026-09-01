using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.Data.SqlClient;
using System.Linq;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Policy = "AdminOnly")]
    [Authorize(Policy = "Module:platform")]
    [DisableRateLimiting] // SuperAdmin-only controller — auth gates are sufficient; skip global IP rate limit
    public class AuditLogsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public AuditLogsController(ApplicationDbContext db)
        {
            _db = db;
        }

        private bool IsSuperAdmin()
        {
            var roleClaims = User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value);
            return RoleCatalog.HasAnyRole(roleClaims, SystemRole.SuperAdmin);
        }

        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 50,
            [FromQuery] string? entity = null,
            [FromQuery] string? action = null,
            [FromQuery] System.Guid? performedBy = null)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 50;
            if (limit > 200) limit = 200;

            var query = IsSuperAdmin()
                ? _db.AuditLogs.AsNoTracking().IgnoreQueryFilters().AsQueryable()
                : _db.AuditLogs.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(entity))
            {
                query = query.Where(a => a.EntityName != null && EF.Functions.Like(a.EntityName, $"%{entity}%"));
            }

            if (!string.IsNullOrWhiteSpace(action))
            {
                query = query.Where(a => a.Action != null && EF.Functions.Like(a.Action, $"%{action}%"));
            }

            if (performedBy.HasValue)
            {
                query = query.Where(a => a.PerformedBy == performedBy.Value);
            }

            var total = await query.CountAsync();

            var data = await query
                .OrderByDescending(a => a.PerformedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    EntityName = a.EntityName ?? string.Empty,
                    EntityId = a.EntityId,
                    Action = a.Action ?? string.Empty,
                    PerformedAt = a.PerformedAt,
                    PerformedBy = a.PerformedBy,
                    Ip = a.Ip
                })
                .ToListAsync();

            return Ok(new { logs = data, total, page, limit });
        }

        [HttpGet("entity/{entityName}/{entityId:guid}")]
        public async Task<IActionResult> GetEntityAuditTimeline(
            [FromRoute] string entityName,
            [FromRoute] Guid entityId,
            [FromQuery] int limit = 100)
        {
            if (string.IsNullOrWhiteSpace(entityName) || entityId == Guid.Empty)
                return BadRequest(new { message = "Valid entityName and entityId are required." });

            var query = _db.AuditLogs
                .AsNoTracking()
                .Where(a => a.EntityId == entityId && a.EntityName != null &&
                            (a.EntityName == entityName || a.EntityName == entityName + "s" || a.EntityName.StartsWith(entityName)))
                .OrderByDescending(a => a.PerformedAt)
                .Take(Math.Clamp(limit, 1, 500));

            var logs = await query
                .Select(a => new
                {
                    id = a.Id,
                    tenantId = a.TenantId,
                    companyId = a.CompanyId,
                    projectId = a.ProjectId,
                    entityName = a.EntityName,
                    entityId = a.EntityId,
                    action = a.Action,
                    oldValue = a.OldValue,
                    newValue = a.NewValue,
                    performedBy = a.PerformedBy,
                    performedAt = a.PerformedAt,
                    ip = a.Ip
                })
                .ToListAsync();

            return Ok(new { entityName, entityId, count = logs.Count, logs });
        }

        [HttpGet("deleted")]
        public async Task<IActionResult> ListDeleted(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 50,
            [FromQuery] string? entity = null,
            [FromQuery] Guid? tenantId = null)
        {
            if (!IsSuperAdmin())
                return Forbid();

            if (page < 1) page = 1;
            if (limit < 1) limit = 50;
            if (limit > 200) limit = 200;

            var query = _db.AuditLogs
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Where(a => a.Action != null && (
                    EF.Functions.Like(a.Action, "%Delete%") ||
                    EF.Functions.Like(a.Action, "%Deleted%") ||
                    EF.Functions.Like(a.Action, "%SoftDelete%")))
                // Exclude audit log entries about the audit system itself (meta-audit loop)
                .Where(a => a.EntityName == null ||
                    (!EF.Functions.Like(a.EntityName, "%Auditlog%") &&
                     !EF.Functions.Like(a.EntityName, "%AuditLog%")));

            if (!string.IsNullOrWhiteSpace(entity))
                query = query.Where(a => a.EntityName != null && EF.Functions.Like(a.EntityName, $"%{entity}%"));

            if (tenantId.HasValue)
                query = query.Where(a => a.TenantId == tenantId.Value);

            var total = await query.CountAsync();

            var logs = await query
                .OrderByDescending(a => a.PerformedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(a => new
                {
                    id = a.Id,
                    tenantId = a.TenantId,
                    entityName = a.EntityName,
                    entityId = a.EntityId,
                    action = a.Action,
                    oldValue = a.OldValue,
                    newValue = a.NewValue,
                    performedAt = a.PerformedAt,
                    performedBy = a.PerformedBy,
                    ip = a.Ip,
                })
                .ToListAsync();

            return Ok(new { logs, total, page, limit });
        }

        [HttpPost("restore")]
        public async Task<IActionResult> Restore([FromBody] RestoreDeletedRequest request)
        {
            if (!IsSuperAdmin())
                return Forbid();

            if (request == null || string.IsNullOrWhiteSpace(request.EntityName) || request.EntityId == Guid.Empty)
                return BadRequest(new { message = "entityName and entityId are required." });

            var entityType = ResolveEntityType(request.EntityName);
            if (entityType == null)
                return BadRequest(new { message = "Unknown entity name." });

            if (!HasSoftDeleteColumn(entityType))
                return BadRequest(new { message = "Entity does not support soft delete restore." });

            var (schema, table) = GetTableName(entityType);
            var fullTable = string.IsNullOrWhiteSpace(schema) ? $"[{table}]" : $"[{schema}].[{table}]";

            var sql = $"UPDATE {fullTable} SET [IsDeleted] = 0, [UpdatedAt] = SYSUTCDATETIME() WHERE [Id] = @id";
            var affected = await _db.Database.ExecuteSqlRawAsync(sql, new SqlParameter("@id", request.EntityId));

            if (affected <= 0)
                return Ok(new { success = false, alreadyGone = true, reason = "already_restored", message = "Record was not found in deleted state. It may have already been restored or never existed." });

            // Remove delete-action audit log entries so the recycle bin row disappears after restore
            await _db.Database.ExecuteSqlRawAsync(
                "DELETE FROM [AuditLogs] WHERE ([EntityId] = @id OR ([TenantId] = @id AND [EntityName] = @entityName)) " +
                "AND ([Action] LIKE '%Delete%' OR [Action] LIKE '%Deleted%' OR [Action] LIKE '%SoftDelete%')",
                new SqlParameter("@id", request.EntityId),
                new SqlParameter("@entityName", request.EntityName));

            return Ok(new { success = true, message = "Record restored successfully.", entity = request.EntityName, id = request.EntityId });
        }

        [HttpDelete("hard-delete")]
        public async Task<IActionResult> HardDelete([FromBody] RestoreDeletedRequest request)
        {
            if (!IsSuperAdmin())
                return Forbid();

            if (request == null || string.IsNullOrWhiteSpace(request.EntityName) || request.EntityId == Guid.Empty)
                return BadRequest(new { message = "entityName and entityId are required." });

            var entityType = ResolveEntityType(request.EntityName);
            if (entityType == null)
                return BadRequest(new { message = "Unknown entity name." });

            // For Tenant entities: cascade-delete all child data first, then delete the tenant row
            bool isTenantEntity = string.Equals(entityType.ClrType.Name, "Tenant", StringComparison.OrdinalIgnoreCase)
                || string.Equals(entityType.GetTableName(), "Tenants", StringComparison.OrdinalIgnoreCase);

            if (isTenantEntity)
            {
                await using var tx = await _db.Database.BeginTransactionAsync();

                var tenantDeleted = await PurgeTenantCascadeAsync(request.EntityId);
                await PurgeAuditLogsForEntityAsync(request.EntityName, request.EntityId);

                await tx.CommitAsync();

                if (!tenantDeleted)
                {
                    return Ok(new { success = false, alreadyGone = true, reason = "already_deleted", message = "Tenant was not found. It may have already been permanently deleted." });
                }

                return Ok(new { success = true, message = "Tenant and all associated data permanently deleted.", entity = request.EntityName, id = request.EntityId });
            }

            var normalizedEntityName = entityType.ClrType.Name;
            await using var entityTx = await _db.Database.BeginTransactionAsync();

            if (string.Equals(normalizedEntityName, "User", StringComparison.OrdinalIgnoreCase))
            {
                await PrepareUserHardDeleteAsync(request.EntityId);
            }
            else if (string.Equals(normalizedEntityName, "Role", StringComparison.OrdinalIgnoreCase))
            {
                await PrepareRoleHardDeleteAsync(request.EntityId);
            }
            else if (string.Equals(normalizedEntityName, "Permission", StringComparison.OrdinalIgnoreCase))
            {
                await PreparePermissionHardDeleteAsync(request.EntityId);
            }

            var (schema, table) = GetTableName(entityType);
            var fullTable = string.IsNullOrWhiteSpace(schema) ? $"[{table}]" : $"[{schema}].[{table}]";

            // Hard-delete the entity row (works whether soft-deleted or active)
            var entitySql = $"DELETE FROM {fullTable} WHERE [Id] = @id";
            int affected;
            try
            {
                affected = await _db.Database.ExecuteSqlRawAsync(entitySql, new SqlParameter("@id", request.EntityId));
            }
            catch (SqlException)
            {
                await entityTx.RollbackAsync();
                return Conflict(new
                {
                    success = false,
                    message = "Record cannot be permanently deleted because related records still reference it. Remove or reassign dependent records, then try again.",
                    entity = request.EntityName,
                    id = request.EntityId,
                });
            }

            if (affected <= 0)
            {
                // Entity row already gone — still purge audit log entries so recycle bin clears
                await PurgeAuditLogsForEntityAsync(request.EntityName, request.EntityId);
                await entityTx.CommitAsync();
                return Ok(new { success = false, alreadyGone = true, reason = "already_deleted", message = "Record was not found. It may have already been permanently deleted." });
            }

            // Purge all audit log entries for this entity so the recycle bin row disappears
            await PurgeAuditLogsForEntityAsync(request.EntityName, request.EntityId);
            await entityTx.CommitAsync();

            return Ok(new { success = true, message = "Record permanently deleted.", entity = request.EntityName, id = request.EntityId });
        }

        private async Task PrepareUserHardDeleteAsync(Guid userId)
        {
            var id = new SqlParameter("@id", userId);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [RefreshTokens] WHERE [UserId] = @id", id);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [UserRoles] WHERE [UserId] = @id", id);
            await _db.Database.ExecuteSqlRawAsync("UPDATE [Candidates] SET [InterviewedByUserId] = NULL WHERE [InterviewedByUserId] = @id", id);
            await _db.Database.ExecuteSqlRawAsync("UPDATE [CandidateScreenings] SET [InterviewedByUserId] = NULL WHERE [InterviewedByUserId] = @id", id);
            await _db.Database.ExecuteSqlRawAsync("UPDATE [JobApplications] SET [RejectedByUserId] = NULL WHERE [RejectedByUserId] = @id", id);
            await _db.Database.ExecuteSqlRawAsync("UPDATE [JobPostings] SET [CreatedByUserId] = NULL WHERE [CreatedByUserId] = @id", id);
            await _db.Database.ExecuteSqlRawAsync("UPDATE [OfferLetters] SET [AcceptedByUserId] = NULL WHERE [AcceptedByUserId] = @id", id);
            await _db.Database.ExecuteSqlRawAsync("UPDATE [OfferLetters] SET [CreatedByUserId] = NULL WHERE [CreatedByUserId] = @id", id);
            await _db.Database.ExecuteSqlRawAsync("UPDATE [TrainingRequests] SET [ApprovedByUserId] = NULL WHERE [ApprovedByUserId] = @id", id);
        }

        private async Task PrepareRoleHardDeleteAsync(Guid roleId)
        {
            var id = new SqlParameter("@id", roleId);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [RolePermissions] WHERE [RoleId] = @id", id);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [UserRoles] WHERE [RoleId] = @id", id);
        }

        private async Task PreparePermissionHardDeleteAsync(Guid permissionId)
        {
            var id = new SqlParameter("@id", permissionId);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [RolePermissions] WHERE [PermissionId] = @id", id);
        }

        /// <summary>
        /// Full cascade hard-delete for a Tenant: removes all tenant-scoped data across every module
        /// table in FK-safe order (leaf tables first), then deletes the Tenant row itself.
        /// All entities inherit BaseEntity which has TenantId, so WHERE TenantId = @tid works everywhere.
        /// </summary>
        private async Task<bool> PurgeTenantCascadeAsync(Guid tenantId)
        {
            var t = new SqlParameter("@tid", tenantId);

            // ── Level 1: deepest leaf tables (have FKs pointing to level-2+ tables) ──────────
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [OvertimeCompensations]  WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [ShiftSwaps]             WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [TrainingAssessments]    WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [TrainingCertificates]   WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [AppraisalRatings]       WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [CandidateScreenings]    WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [JobApplications]        WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [OfferLetters]           WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [ESIBenefits]            WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [PFWithdrawals]          WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [TaxDeclarations]        WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [JournalEntryLines]      WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [Payments]               WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [SalesOrderItems]        WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [SalesInvoiceItems]      WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [SalesQuotationItems]    WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [PurchaseOrderItems]     WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [PurchaseInvoiceItems]   WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [StockMovements]         WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [StockBalances]          WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [AssetAllocations]       WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [AssetDepreciations]     WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [AssetMaintenances]      WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [OvertimeApprovals]      WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [RotationSchedules]      WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [UserRoles]              WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [RolePermissions]        WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [ApprovalRequests]       WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [WorkflowSteps]          WHERE TenantId = @tid", t);

            // ── Level 2 ──────────────────────────────────────────────────────────────────────
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [OvertimeLogs]           WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [ShiftAssignments]       WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [CourseEnrollments]      WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [TrainingRequests]       WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [PerformanceAppraisals]  WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [Candidates]             WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [SalesInvoices]          WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [PurchaseInvoices]       WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [JournalEntries]         WHERE TenantId = @tid", t);
            // ChartOfAccounts is self-referential: clear parent links before deleting rows
            await _db.Database.ExecuteSqlRawAsync("UPDATE [ChartOfAccounts] SET [ParentAccountId] = NULL WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [ChartOfAccounts]        WHERE TenantId = @tid", t);

            // ── Level 3 ──────────────────────────────────────────────────────────────────────
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [OvertimeRequests]       WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [ShiftRotations]         WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [TrainingCourses]        WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [AppraisalCycles]        WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [AppraisalCompetencies]  WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [JobPostings]            WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [SalesOrders]            WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [PurchaseOrders]         WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [EmployeeStateInsurances] WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [ProvidentFunds]         WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [IncomeTaxes]            WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [FixedAssets]            WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [WorkflowDefinitions]    WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [Roles]                  WHERE TenantId = @tid", t);

            // ── Level 4 ──────────────────────────────────────────────────────────────────────
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [Shifts]                 WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [SalesQuotations]        WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [Items]                  WHERE TenantId = @tid", t);

            // ── Level 5: HR module (independent within their own hierarchy) ─────────────────
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [AttendanceCorrections]  WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [AttendanceRecords]      WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [LeaveAllocations]       WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [EmployeeLeaves]         WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [LeaveRequests]          WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [LeavePolicyRules]       WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [LeavePolicies]          WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [LeaveTypes]             WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [Payslips]               WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [PayrollRuns]            WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [PayrollComponents]      WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [PayrollStructures]      WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [StatutorySettings]      WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [Holidays]               WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [ComplianceAudits]       WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [ComplianceReports]      WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [Employees]              WHERE TenantId = @tid", t);

            // ── Level 6: platform entities ───────────────────────────────────────────────────
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [EntityFieldValues]      WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [EntityFieldDefinitions] WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [DocumentRecords]        WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [NotificationMessages]   WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [RefreshTokens]          WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [Warehouses]             WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [Customers]              WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [Vendors]                WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [Users]                  WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [Projects]               WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [Companies]              WHERE TenantId = @tid", t);

            // ── Level 7: tenant config and the tenant row itself ─────────────────────────────
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [TenantModules]          WHERE TenantId = @tid", t);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM [TenantConfigs]          WHERE TenantId = @tid", t);
            var tenantAffected = await _db.Database.ExecuteSqlRawAsync("DELETE FROM [Tenants]               WHERE [Id] = @tid", t);
            return tenantAffected > 0;
        }

        /// <summary>
        /// Deletes all AuditLog rows that reference a given entity.
        /// Matches on EntityId (standard case) or on TenantId+EntityName for tenant-root records
        /// where EntityId was not stored in the log.
        /// </summary>
        private async Task PurgeAuditLogsForEntityAsync(string entityName, Guid entityId)
        {
            await _db.Database.ExecuteSqlRawAsync(
                "DELETE FROM [AuditLogs] WHERE [EntityId] = @id " +
                "OR ([TenantId] = @id AND [EntityName] = @entityName)",
                new SqlParameter("@id", entityId),
                new SqlParameter("@entityName", entityName));
        }

        private IEntityType? ResolveEntityType(string entityName)
        {
            var normalized = entityName.Trim();
            var candidates = _db.Model.GetEntityTypes()
                .Where(e => e.ClrType != null && typeof(BaseEntity).IsAssignableFrom(e.ClrType))
                .ToList();

            return candidates.FirstOrDefault(e =>
                       string.Equals(e.ClrType.Name, normalized, StringComparison.OrdinalIgnoreCase)
                    || string.Equals(e.GetTableName(), normalized, StringComparison.OrdinalIgnoreCase)
                    || string.Equals($"{e.ClrType.Name}s", normalized, StringComparison.OrdinalIgnoreCase))
                ?? candidates.FirstOrDefault(e =>
                    (e.ClrType.Name + "es").Equals(normalized, StringComparison.OrdinalIgnoreCase));
        }

        private static bool HasSoftDeleteColumn(IEntityType entityType)
            => entityType.FindProperty("IsDeleted") != null;

        private static (string? Schema, string Table) GetTableName(IEntityType entityType)
        {
            var table = entityType.GetTableName();
            if (string.IsNullOrWhiteSpace(table))
                throw new InvalidOperationException($"Unable to resolve table name for entity {entityType.Name}.");

            return (entityType.GetSchema(), table);
        }

        public class RestoreDeletedRequest
        {
            public string EntityName { get; set; } = string.Empty;
            public Guid EntityId { get; set; }
        }
    }
}
