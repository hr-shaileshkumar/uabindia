using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Transactions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Hangfire.Server;
using UabIndia.Api.Models;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;

namespace UabIndia.Api.Services
{
    public class TenantProvisioningService
    {
        public static class ProvisionStates
        {
            public const string Pending = "Pending";
            public const string Provisioning = "Provisioning";
            public const string Completed = "Completed";
            public const string Failed = "Failed";
            public const string Repairing = "Repairing";
            public const string DeadLetter = "DeadLetter";
        }

        private const int ProvisioningMaxRetries = 3;

        private static readonly string[] RequiredTenantTables =
        {
            "Users",
            "Roles",
            "UserRoles",
            "TenantModules",
            "Companies",
            "Projects",
            "TenantConfigs"
        };

        private static readonly string[] DefaultModuleKeys =
        {
            "platform",
            "licensing",
            "security",
            "hrms",
            "payroll",
            "reports",
            "erp",
            "projects"
        };

        private static readonly HashSet<string> CoreEnabledModules = new(StringComparer.OrdinalIgnoreCase)
        {
            "platform",
            "licensing",
            "security"
        };

        private static readonly (string Name, string Description)[] DefaultRoles =
        {
            (RoleCatalog.AdminRoleName, "Tenant administrator"),
            (RoleCatalog.HrManagerRoleName, "Human Resources manager"),
            (RoleCatalog.AccountantRoleName, "Finance and accounts"),
            (RoleCatalog.ManagerRoleName, "Project manager"),
            (RoleCatalog.EmployeeRoleName, "Standard employee")
        };

        private static readonly string[] LegacyTenantBaselineMigrations =
        {
            "20260127190639_Initial",
            "20260128045923_AddRefreshTokenRotation",
            "20260201161904_AddLeavePolicyRules",
            "20260201170000_AddLeaveEnhancements",
            "20260201180000_AddLeaveTypes",
            "20260205175739_AddContactSubmissions",
            "20260207090000_ExpandEncryptedCompanyFields",
            "20260209190829_AddWorkflowTables_Minimal",
            "20260324190830_InitialCleanSchema"
        };

        private const string InitialCleanSchemaMigrationId = "20260324190830_InitialCleanSchema";

        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _configuration;
        private readonly IEncryptionService _encryptionService;
        private readonly IPasswordHasher<User> _hasher;
        private readonly ILogger<TenantProvisioningService> _logger;
        private readonly RoleMappingResolver _roleMappingResolver;

        public TenantProvisioningService(
            ApplicationDbContext db,
            IConfiguration configuration,
            IEncryptionService encryptionService,
            IPasswordHasher<User> hasher,
            RoleMappingResolver roleMappingResolver,
            ILogger<TenantProvisioningService> logger)
        {
            _db = db;
            _configuration = configuration;
            _encryptionService = encryptionService;
            _hasher = hasher;
            _roleMappingResolver = roleMappingResolver;
            _logger = logger;
        }

        public async Task<Tenant> CreateTenantRecordAsync(CreateTenantDto dto)
        {
            var subdomain = dto.Subdomain.Trim().ToLowerInvariant();
            var planPolicy = TenantPlanPolicy.Resolve(dto.SubscriptionPlan);

            dto.SubscriptionPlan = planPolicy.PlanName;
            dto.SelectedModules = TenantPlanPolicy.NormalizeModulesForPlan(dto.SelectedModules, planPolicy);
            dto.EmployeeLimit = dto.EmployeeLimit.HasValue
                ? Math.Min(Math.Max(1, dto.EmployeeLimit.Value), planPolicy.MaxUsers)
                : planPolicy.MaxUsers;
            dto.StorageLimitGb = dto.StorageLimitGb.HasValue
                ? Math.Min(Math.Max(1, dto.StorageLimitGb.Value), planPolicy.MaxStorageGb)
                : planPolicy.MaxStorageGb;

            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                var existing = await _db.Tenants.AsNoTracking()
                    .AnyAsync(t => t.Subdomain == subdomain && !t.IsDeleted);
                if (existing)
                {
                    throw new InvalidOperationException("Tenant subdomain already exists.");
                }

                var tenant = new Tenant
                {
                    Name = dto.Name.Trim(),
                    Subdomain = subdomain,
                    IsActive = ResolveTenantActivationFlag(dto.Status),
                    ProvisionStatus = ProvisionStates.Pending
                };

                _db.Tenants.Add(tenant);
                await _db.SaveChangesAsync();
                await EnsureModuleCatalogAsync();

                await tx.CommitAsync();
                return tenant;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        [Hangfire.Queue("tenant-provisioning")]
        [Hangfire.AutomaticRetry(Attempts = ProvisioningMaxRetries, DelaysInSeconds = new[] { 300, 900, 3600 })]
        public async Task ProvisionTenantAsync(Guid tenantId, CreateTenantDto dto, PerformContext? performContext = null)
        {
            var tenant = await _db.Tenants
                .FirstOrDefaultAsync(t => t.Id == tenantId && !t.IsDeleted);

            if (tenant == null)
            {
                throw new InvalidOperationException($"Tenant '{tenantId}' not found for provisioning.");
            }

            var correlationId = performContext?.BackgroundJob?.Id ?? Guid.NewGuid().ToString("N");

            try
            {
                tenant.ProvisionStatus = ProvisionStates.Provisioning;
                tenant.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                await WriteProvisioningStepLogAsync(
                    tenant.Id,
                    "Provisioning",
                    "Started",
                    null,
                    0,
                    correlationId);

                await WriteProvisioningAuditLogAsync(tenant.Id, "TenantProvisioningStarted", "Provisioning started.");
                var schema = BuildSchemaName(tenant.Subdomain, tenant.Id);
                await PersistProvisioningRecoverySnapshotAsync(
                    tenant.Id,
                    "TenantProvisioningStarted",
                    "in_progress",
                    "Provisioning started.",
                    schema);

                using (var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
                {
                    var schemaCloneWatch = Stopwatch.StartNew();
                    await CloneTemplateSchemaAsync(schema);
                    schemaCloneWatch.Stop();

                    await WriteProvisioningStepLogAsync(
                        tenant.Id,
                        "Schema Clone",
                        "Success",
                        null,
                        schemaCloneWatch.ElapsedMilliseconds,
                        correlationId);

                    await WriteProvisioningAuditLogAsync(tenant.Id, "TemplateSchemaCloned", $"Template schema cloned to '{schema}'.");
                    await PersistProvisioningRecoverySnapshotAsync(
                        tenant.Id,
                        "TemplateSchemaCloned",
                        "in_progress",
                        $"Template schema cloned to '{schema}'.",
                        schema);

                    var schemaAlreadyInitialized = await HasRequiredTenantTablesAsync(schema);

                    await WriteProvisioningStepLogAsync(
                        tenant.Id,
                        "Check Missing Tables",
                        schemaAlreadyInitialized ? "Success" : "Failed",
                        schemaAlreadyInitialized ? null : "Core tables are missing before seeding.",
                        0,
                        correlationId);

                    var seedWatch = Stopwatch.StartNew();
                    await SeedTenantAsync(tenant, schema, dto, skipSchemaInitialization: schemaAlreadyInitialized);
                    seedWatch.Stop();

                    await WriteProvisioningStepLogAsync(
                        tenant.Id,
                        "Seed Roles/Admin/Modules/Config",
                        "Success",
                        null,
                        seedWatch.ElapsedMilliseconds,
                        correlationId);

                    await WriteProvisioningAuditLogAsync(tenant.Id, "TenantSeedCompleted", "Tenant baseline data seeded.");
                    await PersistProvisioningRecoverySnapshotAsync(
                        tenant.Id,
                        "TenantSeedCompleted",
                        "in_progress",
                        "Tenant baseline data seeded.",
                        schema);

                    tenant.IsActive = ResolveTenantActivationFlag(dto.Status);
                    tenant.ProvisionStatus = ProvisionStates.Completed;
                    tenant.UpdatedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync();

                    scope.Complete();
                }

                await WriteProvisioningAuditLogAsync(tenant.Id, "TenantProvisioningCompleted", "Provisioning completed successfully.");
                await WriteProvisioningStepLogAsync(
                    tenant.Id,
                    "Provisioning",
                    "Completed",
                    null,
                    0,
                    correlationId);
                await PersistProvisioningRecoverySnapshotAsync(
                    tenant.Id,
                    "TenantProvisioningCompleted",
                    "completed",
                    "Provisioning completed successfully.",
                    schema);
            }
            catch (Exception ex)
            {
                var failedSchema = BuildSchemaName(tenant.Subdomain, tenant.Id);
                var retryCount = performContext?.GetJobParameter<int>("RetryCount") ?? 0;
                var retriesExhausted = retryCount >= (ProvisioningMaxRetries - 1);

                tenant.IsActive = false;
                tenant.ProvisionStatus = retriesExhausted ? ProvisionStates.DeadLetter : ProvisionStates.Failed;
                tenant.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                await WriteProvisioningStepLogAsync(
                    tenant.Id,
                    retriesExhausted ? "Retry Exhausted" : "Provisioning",
                    "Failed",
                    ex.Message,
                    0,
                    correlationId);

                await WriteProvisioningAuditLogAsync(tenant.Id, "TenantProvisioningFailed", ex.Message);
                await PersistProvisioningRecoverySnapshotAsync(
                    tenant.Id,
                    "TenantProvisioningFailed",
                    retriesExhausted ? "dead_letter" : "failed",
                    ex.Message,
                    failedSchema,
                    ex.ToString());

                if (retriesExhausted)
                {
                    await NotifyProvisioningFailureAsync(tenant, correlationId, ex.Message, isDeadLetter: true);
                }

                throw;
            }
        }

        public async Task RollbackTenantCreationAsync(Guid tenantId, string reason)
        {
            var tenant = await _db.Tenants
                .FirstOrDefaultAsync(t => t.Id == tenantId && !t.IsDeleted);

            if (tenant == null)
            {
                return;
            }

            tenant.IsDeleted = true;
            tenant.IsActive = false;
            tenant.ProvisionStatus = ProvisionStates.Failed;
            tenant.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            await PersistProvisioningRecoverySnapshotAsync(
                tenantId,
                "TenantRollbackCompleted",
                "rolled_back",
                "Tenant create rollback completed.",
                BuildSchemaName(tenant.Subdomain, tenant.Id),
                reason);

            _logger.LogWarning("Tenant creation rolled back for {TenantId}. Reason: {Reason}", tenantId, reason);
        }

        public async Task<TenantProvisioningSnapshotDto> BuildProvisioningSnapshotAsync(Tenant tenant)
        {
            var schema = BuildSchemaName(tenant.Subdomain, tenant.Id);
            var schemaExists = await SchemaExistsAsync(SanitizeSchemaName(schema));
            var hasCoreTables = schemaExists && await HasRequiredTenantTablesAsync(schema);

            var usersCount = 0;
            var hasAdminRoleAssignment = false;
            var governance = await BuildTemplateGovernanceSnapshotAsync();

            if (hasCoreTables)
            {
                try
                {
                    await using var tenantDb = CreateTenantScopedDbContext(tenant.Id, schema);
                    usersCount = await tenantDb.Users
                        .IgnoreQueryFilters()
                        .CountAsync(u => u.TenantId == tenant.Id && !u.IsDeleted);

                    hasAdminRoleAssignment = await tenantDb.UserRoles
                        .IgnoreQueryFilters()
                        .Where(ur => ur.TenantId == tenant.Id && !ur.IsDeleted)
                        .Join(
                            tenantDb.Roles.IgnoreQueryFilters().Where(r => r.TenantId == tenant.Id && !r.IsDeleted),
                            ur => ur.RoleId,
                            r => r.Id,
                            (_, r) => r.Name)
                        .AnyAsync(r => r == RoleCatalog.AdminRoleName);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to read provisioning snapshot for tenant {TenantId}", tenant.Id);
                }
            }

            var status = string.IsNullOrWhiteSpace(tenant.ProvisionStatus)
                ? (tenant.IsDeleted
                    ? "failed"
                    : hasCoreTables && usersCount > 0 && hasAdminRoleAssignment
                        ? "completed"
                        : "pending")
                : tenant.ProvisionStatus;

            return new TenantProvisioningSnapshotDto
            {
                TenantId = tenant.Id,
                TenantName = tenant.Name ?? string.Empty,
                Subdomain = tenant.Subdomain ?? string.Empty,
                Status = status,
                SchemaExists = schemaExists,
                CoreTablesReady = hasCoreTables,
                UsersCount = usersCount,
                AdminRoleAssigned = hasAdminRoleAssignment,
                UpdatedAt = tenant.UpdatedAt
                ,TemplateSchema = governance.TemplateSchema
                ,TemplateVersion = governance.TemplateVersion
                ,TemplateChecksumConfigured = governance.TemplateChecksumConfigured
                ,TemplateChecksumComputed = governance.TemplateChecksumComputed
                ,TemplateChecksumValid = governance.TemplateChecksumValid
            };
        }

        public async Task<TenantHealthSnapshotDto> BuildTenantHealthSnapshotAsync(Tenant tenant)
        {
            var schema = BuildSchemaName(tenant.Subdomain, tenant.Id);
            var safeSchema = SanitizeSchemaName(schema);
            var schemaExists = await SchemaExistsAsync(safeSchema);
            var missingTables = schemaExists
                ? await GetMissingRequiredTablesAsync(safeSchema)
                : RequiredTenantTables.ToArray();

            var usersCount = 0;
            var hasAdminRole = false;
            var hasAdminUser = false;
            var hasAdminRoleMapping = false;
            var adminEmail = string.Empty;
            DateTime? adminLastLoginAt = null;
            var passwordResetPending = false;

            if (schemaExists && missingTables.Length == 0)
            {
                try
                {
                    await using var tenantDb = CreateTenantScopedDbContext(tenant.Id, schema);
                    usersCount = await tenantDb.Users
                        .IgnoreQueryFilters()
                        .CountAsync(u => u.TenantId == tenant.Id && !u.IsDeleted);

                    hasAdminUser = await tenantDb.Users
                        .IgnoreQueryFilters()
                        .AnyAsync(u => u.TenantId == tenant.Id && !u.IsDeleted && u.IsSystemAdmin);

                    var adminUser = await tenantDb.Users
                        .IgnoreQueryFilters()
                        .AsNoTracking()
                        .Where(u => u.TenantId == tenant.Id && !u.IsDeleted)
                        .OrderByDescending(u => u.IsSystemAdmin)
                        .ThenBy(u => u.CreatedAt)
                        .FirstOrDefaultAsync();

                    adminEmail = adminUser?.Email ?? string.Empty;

                    hasAdminRole = await tenantDb.Roles
                        .IgnoreQueryFilters()
                        .AnyAsync(r => r.TenantId == tenant.Id
                                       && !r.IsDeleted
                                       && (r.Name == RoleCatalog.SuperAdminRoleName || r.Name == RoleCatalog.AdminRoleName));

                    if (adminUser != null)
                    {
                        hasAdminRoleMapping = await tenantDb.UserRoles
                            .IgnoreQueryFilters()
                            .Where(ur => ur.TenantId == tenant.Id && ur.UserId == adminUser.Id && !ur.IsDeleted)
                            .Join(
                                tenantDb.Roles.IgnoreQueryFilters().Where(r => r.TenantId == tenant.Id && !r.IsDeleted),
                                ur => ur.RoleId,
                                r => r.Id,
                                (ur, r) => r.Name)
                            .AnyAsync(r => r == RoleCatalog.SuperAdminRoleName || r == RoleCatalog.AdminRoleName);
                    }

                    adminLastLoginAt = await tenantDb.AuditLogs
                        .IgnoreQueryFilters()
                        .AsNoTracking()
                        .Where(a => a.TenantId == tenant.Id
                                    && !a.IsDeleted
                                    && (a.Action == "Login" || a.Action == "LoginSuccess" || a.Action == "UserLogin"))
                        .Select(a => (DateTime?)a.PerformedAt)
                        .OrderByDescending(d => d)
                        .FirstOrDefaultAsync();

                    var config = await tenantDb.TenantConfigs
                        .IgnoreQueryFilters()
                        .AsNoTracking()
                        .FirstOrDefaultAsync(c => c.TenantId == tenant.Id && !c.IsDeleted);

                    var profile = ReadTenantProfileMetadata(config?.ConfigJson);
                    passwordResetPending = profile?.PasswordResetPending ?? false;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to compute tenant health snapshot for tenant {TenantId}", tenant.Id);
                }
            }

            return new TenantHealthSnapshotDto
            {
                TenantId = tenant.Id,
                TenantName = tenant.Name ?? string.Empty,
                Subdomain = tenant.Subdomain ?? string.Empty,
                ProvisionStatus = string.IsNullOrWhiteSpace(tenant.ProvisionStatus) ? ProvisionStates.Pending : (tenant.ProvisionStatus ?? ProvisionStates.Pending),
                SchemaName = safeSchema,
                SchemaExists = schemaExists,
                MissingTables = missingTables,
                HasAllCoreTables = missingTables.Length == 0,
                UsersCount = usersCount,
                HasAdminUser = hasAdminUser,
                HasAdminRole = hasAdminRole,
                HasAdminRoleMapping = hasAdminRoleMapping,
                AdminEmail = adminEmail,
                AdminLastLoginAt = adminLastLoginAt,
                PasswordResetPending = passwordResetPending,
                UpdatedAt = tenant.UpdatedAt
            };
        }

        public async Task<List<TenantProvisionLogEntryDto>> GetTenantProvisionLogsAsync(Guid tenantId, int take = 100)
        {
            var safeTake = Math.Clamp(take, 1, 500);
            var results = new List<TenantProvisionLogEntryDto>(safeTake);

            var connection = _db.Database.GetDbConnection();
            var shouldClose = connection.State != ConnectionState.Open;
            if (shouldClose)
            {
                await _db.Database.OpenConnectionAsync();
            }

            try
            {
                await using var command = connection.CreateCommand();
                command.CommandText = @"
SELECT TOP (@take)
    [Id],
    [TenantId],
    [StepName],
    [Status],
    [ErrorMessage],
    [DurationMs],
    [CreatedAt],
    [CorrelationId]
FROM [dbo].[TenantProvisionLogs]
WHERE [TenantId] = @tenantId
ORDER BY [CreatedAt] DESC;";

                var takeParam = command.CreateParameter();
                takeParam.ParameterName = "@take";
                takeParam.Value = safeTake;
                command.Parameters.Add(takeParam);

                var tenantParam = command.CreateParameter();
                tenantParam.ParameterName = "@tenantId";
                tenantParam.Value = tenantId;
                command.Parameters.Add(tenantParam);

                await using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    results.Add(new TenantProvisionLogEntryDto
                    {
                        Id = reader.GetGuid(0),
                        TenantId = reader.GetGuid(1),
                        StepName = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                        Status = reader.IsDBNull(3) ? string.Empty : reader.GetString(3),
                        ErrorMessage = reader.IsDBNull(4) ? null : reader.GetString(4),
                        DurationMs = reader.IsDBNull(5) ? 0 : reader.GetInt64(5),
                        CreatedAt = reader.GetDateTime(6),
                        CorrelationId = reader.IsDBNull(7) ? string.Empty : reader.GetString(7)
                    });
                }

                return results;
            }
            finally
            {
                if (shouldClose)
                {
                    await _db.Database.CloseConnectionAsync();
                }
            }
        }

        public async Task<TenantHealthSnapshotDto> RepairTenantAsync(Guid tenantId, string? correlationId = null)
        {
            var tenant = await _db.Tenants
                .FirstOrDefaultAsync(t => t.Id == tenantId && !t.IsDeleted);

            if (tenant == null)
            {
                throw new InvalidOperationException("Tenant not found for repair.");
            }

            var effectiveCorrelationId = string.IsNullOrWhiteSpace(correlationId)
                ? Guid.NewGuid().ToString("N")
                : correlationId;

            var schema = BuildSchemaName(tenant.Subdomain, tenant.Id);

            try
            {
                tenant.ProvisionStatus = ProvisionStates.Repairing;
                tenant.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                await WriteProvisioningStepLogAsync(tenant.Id, "Validate Tenant", "Success", null, 0, effectiveCorrelationId);

                var safeSchema = SanitizeSchemaName(schema);
                var schemaExists = await SchemaExistsAsync(safeSchema);
                var missingTables = schemaExists
                    ? await GetMissingRequiredTablesAsync(safeSchema)
                    : RequiredTenantTables.ToArray();

                await WriteProvisioningStepLogAsync(
                    tenant.Id,
                    "Check Missing Tables",
                    missingTables.Length == 0 ? "Success" : "Failed",
                    missingTables.Length == 0 ? null : $"Missing tables: {string.Join(", ", missingTables)}",
                    0,
                    effectiveCorrelationId);

                var tenantSnapshot = await BuildTenantDtoAsync(tenant);
                var repairAdminEmail = string.IsNullOrWhiteSpace(tenantSnapshot.AdminEmail)
                    ? $"admin@{(tenant.Subdomain ?? "tenant").Trim().ToLowerInvariant()}.local"
                    : tenantSnapshot.AdminEmail.Trim();
                var repairAdminName = string.IsNullOrWhiteSpace(tenantSnapshot.AdminName)
                    ? "Tenant Admin"
                    : tenantSnapshot.AdminName.Trim();
                var repairAdminRole = string.IsNullOrWhiteSpace(tenantSnapshot.AdminRole)
                    ? RoleCatalog.AdminRoleName
                    : tenantSnapshot.AdminRole;

                var repairWatch = Stopwatch.StartNew();
                await RepairTenantSchemaAsync(
                    tenant,
                    schema,
                    repairAdminEmail,
                    repairAdminName,
                    repairAdminRole,
                    null,
                    forceReset: !schemaExists || missingTables.Length > 0);
                repairWatch.Stop();

                await WriteProvisioningStepLogAsync(
                    tenant.Id,
                    "Recreate Schema Objects",
                    "Success",
                    null,
                    repairWatch.ElapsedMilliseconds,
                    effectiveCorrelationId);

                await WriteProvisioningStepLogAsync(
                    tenant.Id,
                    "Reseed Roles/Admin/Modules/Config",
                    "Success",
                    null,
                    0,
                    effectiveCorrelationId);

                tenant.ProvisionStatus = ProvisionStates.Completed;
                tenant.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                await WriteProvisioningStepLogAsync(tenant.Id, "Repair", "Completed", null, 0, effectiveCorrelationId);
                await WriteProvisioningAuditLogAsync(tenant.Id, "TenantRepairCompleted", "Tenant repair completed successfully.");

                await PersistTenantRepairMetadataAsync(tenant, schema);

                return await BuildTenantHealthSnapshotAsync(tenant);
            }
            catch (Exception ex)
            {
                tenant.ProvisionStatus = ProvisionStates.Failed;
                tenant.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                await WriteProvisioningStepLogAsync(tenant.Id, "Repair", "Failed", ex.Message, 0, effectiveCorrelationId);
                await WriteProvisioningAuditLogAsync(tenant.Id, "TenantRepairFailed", ex.Message);
                throw;
            }
        }

        public async Task<Tenant> CreateTenantAsync(CreateTenantDto dto)
        {
            var tenant = await CreateTenantRecordAsync(dto);
            await ProvisionTenantAsync(tenant.Id, dto);
            return tenant;
        }

        public async Task<TenantDto> BuildTenantDtoAsync(Tenant tenant)
        {
            var schema = BuildSchemaName(tenant.Subdomain, tenant.Id);
            var status = tenant.IsActive ? "active" : "inactive";
            var subscriptionPlan = "Basic";
            var selectedModules = Array.Empty<string>();
            var adminEmail = string.Empty;
            var adminName = string.Empty;
            var adminRole = string.Empty;
            var usersCount = 0;
            DateTime? lastActivityAt = null;

            var profile = new TenantProfileMetadata
            {
                Timezone = "Asia/Kolkata",
                Currency = "INR",
                Language = "en"
            };

            try
            {
                await using var tenantDb = CreateTenantScopedDbContext(tenant.Id, schema);

                var config = await tenantDb.TenantConfigs
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.TenantId == tenant.Id && !c.IsDeleted);

                if (config != null)
                {
                    profile = ReadTenantProfileMetadata(config.ConfigJson) ?? profile;
                    status = ResolveTenantStatus(profile.Status, tenant.IsActive);
                    subscriptionPlan = string.IsNullOrWhiteSpace(profile.SubscriptionPlan) ? "Basic" : profile.SubscriptionPlan;
                }

                selectedModules = await tenantDb.TenantModules
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .Where(tm => tm.TenantId == tenant.Id && tm.IsEnabled && !tm.IsDeleted)
                    .Select(tm => tm.ModuleKey)
                    .ToArrayAsync();

                usersCount = await tenantDb.Users
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .CountAsync(u => u.TenantId == tenant.Id && !u.IsDeleted);

                lastActivityAt = await tenantDb.AuditLogs
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .Where(a => a.TenantId == tenant.Id && !a.IsDeleted)
                    .Select(a => (DateTime?)a.PerformedAt)
                    .OrderByDescending(d => d)
                    .FirstOrDefaultAsync();

                var adminUser = await tenantDb.Users
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .Where(u => u.TenantId == tenant.Id && !u.IsDeleted)
                    .OrderByDescending(u => u.IsSystemAdmin)
                    .ThenBy(u => u.CreatedAt)
                    .FirstOrDefaultAsync();

                if (adminUser != null)
                {
                    adminEmail = adminUser.Email ?? string.Empty;
                    adminName = adminUser.FullName ?? string.Empty;

                    var roleNames = await tenantDb.UserRoles
                        .IgnoreQueryFilters()
                        .AsNoTracking()
                        .Where(ur => ur.TenantId == tenant.Id && ur.UserId == adminUser.Id && !ur.IsDeleted)
                        .Join(
                            tenantDb.Roles.IgnoreQueryFilters().AsNoTracking().Where(r => r.TenantId == tenant.Id && !r.IsDeleted),
                            ur => ur.RoleId,
                            r => r.Id,
                            (ur, r) => r.Name)
                        .ToListAsync();

                    adminRole = roleNames.FirstOrDefault(r => string.Equals(r, RoleCatalog.SuperAdminRoleName, StringComparison.OrdinalIgnoreCase))
                        ?? roleNames.FirstOrDefault(r => string.Equals(r, RoleCatalog.AdminRoleName, StringComparison.OrdinalIgnoreCase))
                        ?? roleNames.FirstOrDefault()
                        ?? string.Empty;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Unable to enrich tenant payload for tenant {TenantId}", tenant.Id);
            }

            return new TenantDto
            {
                Id = tenant.Id,
                Name = tenant.Name ?? string.Empty,
                Subdomain = tenant.Subdomain ?? string.Empty,
                IsDeleted = tenant.IsDeleted,
                IsActive = tenant.IsActive,
                Status = status,
                ProvisionStatus = string.IsNullOrWhiteSpace(tenant.ProvisionStatus) ? ProvisionStates.Pending : (tenant.ProvisionStatus ?? ProvisionStates.Pending),
                SubscriptionPlan = subscriptionPlan,
                SelectedModules = selectedModules,
                AdminEmail = adminEmail,
                AdminName = adminName,
                AdminRole = adminRole,
                AdminCreated = !string.IsNullOrWhiteSpace(adminEmail),
                PasswordResetPending = profile.PasswordResetPending,
                LastRepairAt = profile.LastRepairAt,
                CreatedAt = tenant.CreatedAt,
                UsersCount = usersCount,
                LastActivityAt = lastActivityAt,
                Address = profile.Address,
                State = profile.State,
                District = profile.District,
                Pincode = profile.Pincode,
                ContactNumber = profile.ContactNumber,
                GstNumber = profile.GstNumber,
                PanNumber = profile.PanNumber,
                LogoUrl = profile.LogoUrl,
                Timezone = string.IsNullOrWhiteSpace(profile.Timezone) ? "Asia/Kolkata" : profile.Timezone,
                Currency = string.IsNullOrWhiteSpace(profile.Currency) ? "INR" : profile.Currency,
                Language = string.IsNullOrWhiteSpace(profile.Language) ? "en" : profile.Language,
                BillingStartDate = profile.BillingStartDate,
                BillingEndDate = profile.BillingEndDate,
                TrialExpiryDate = profile.TrialExpiryDate,
                EmployeeLimit = profile.EmployeeLimit,
                StorageLimitGb = profile.StorageLimitGb,
                SmsCredits = profile.SmsCredits,
                WhatsAppIntegrationEnabled = profile.WhatsAppIntegrationEnabled,
                SmtpHost = profile.SmtpHost,
                SmtpPort = profile.SmtpPort,
                SmtpUsername = profile.SmtpUsername,
                SmtpFromEmail = profile.SmtpFromEmail,
                CustomDomain = profile.CustomDomain,
                WhiteLabelEnabled = profile.WhiteLabelEnabled
            };
        }

        public async Task ApplyTenantUpdateAsync(Tenant tenant, UpdateTenantDto dto, bool schemaRepairAttempted = false)
        {
            var schema = BuildSchemaName(tenant.Subdomain, tenant.Id);
            try
            {
                await using var tenantDb = CreateTenantScopedDbContext(tenant.Id, schema);

                if (!string.IsNullOrWhiteSpace(dto.AdminEmail) || !string.IsNullOrWhiteSpace(dto.AdminName))
                {
                    var normalizedAdminEmail = dto.AdminEmail?.Trim();
                    var normalizedAdminName = dto.AdminName?.Trim();

                    var adminUser = await tenantDb.Users
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(u => u.TenantId == tenant.Id && !u.IsDeleted && u.IsSystemAdmin)
                        ?? await tenantDb.Users
                            .IgnoreQueryFilters()
                            .FirstOrDefaultAsync(u => u.TenantId == tenant.Id && !u.IsDeleted);

                        if (adminUser == null && !string.IsNullOrWhiteSpace(normalizedAdminEmail))
                        {
                            adminUser = new User
                            {
                                TenantId = tenant.Id,
                                Email = normalizedAdminEmail,
                                FullName = string.IsNullOrWhiteSpace(normalizedAdminName) ? "Tenant Admin" : normalizedAdminName,
                                IsSystemAdmin = false,
                                IsActive = true
                            };

                            adminUser.PasswordHash = _hasher.HashPassword(adminUser, BuildTemporaryPassword());
                            tenantDb.Users.Add(adminUser);
                        }
                        else if (adminUser != null)
                    {
                            if (!string.IsNullOrWhiteSpace(normalizedAdminEmail))
                        {
                                adminUser.Email = normalizedAdminEmail;
                        }

                            if (!string.IsNullOrWhiteSpace(normalizedAdminName))
                        {
                                adminUser.FullName = normalizedAdminName;
                        }

                            adminUser.IsActive = true;
                        }

                        if (adminUser != null)
                        {
                            var adminRole = await tenantDb.Roles
                                .IgnoreQueryFilters()
                                .AsNoTracking()
                                .Where(r => r.TenantId == tenant.Id && !r.IsDeleted)
                                .FirstOrDefaultAsync(r =>
                                    r.Name == RoleCatalog.SuperAdminRoleName
                                    || r.Name == RoleCatalog.AdminRoleName);

                            if (adminRole != null)
                            {
                                var hasAdminRole = await tenantDb.UserRoles
                                    .IgnoreQueryFilters()
                                    .AnyAsync(ur =>
                                        ur.TenantId == tenant.Id
                                        && ur.UserId == adminUser.Id
                                        && ur.RoleId == adminRole.Id
                                        && !ur.IsDeleted);

                                if (!hasAdminRole)
                                {
                                    tenantDb.UserRoles.Add(new UserRole
                                    {
                                        TenantId = tenant.Id,
                                        UserId = adminUser.Id,
                                        RoleId = adminRole.Id
                                    });
                                }
                            }
                    }
                }

                if (dto.SelectedModules is { Length: > 0 })
                {
                    var requested = NormalizeModuleKeys(dto.SelectedModules);
                    foreach (var key in DefaultModuleKeys)
                    {
                        var existing = await tenantDb.TenantModules
                            .IgnoreQueryFilters()
                            .FirstOrDefaultAsync(tm => tm.TenantId == tenant.Id && tm.ModuleKey == key);

                        var shouldEnable = CoreEnabledModules.Contains(key) || requested.Contains(key, StringComparer.OrdinalIgnoreCase);
                        if (existing == null)
                        {
                            tenantDb.TenantModules.Add(new TenantModule
                            {
                                TenantId = tenant.Id,
                                ModuleKey = key,
                                IsEnabled = shouldEnable,
                                EnabledAt = DateTime.UtcNow,
                                DisabledAt = shouldEnable ? null : DateTime.UtcNow
                            });
                        }
                        else
                        {
                            existing.IsEnabled = shouldEnable;
                            if (shouldEnable)
                            {
                                existing.EnabledAt = DateTime.UtcNow;
                                existing.DisabledAt = null;
                            }
                            else
                            {
                                existing.DisabledAt = DateTime.UtcNow;
                            }
                        }
                    }
                }

                var metadata = await BuildTenantProfileMetadataAsync(tenantDb, tenant, dto, null);
                await SaveTenantProfileToConfigAsync(tenantDb, tenant.Id, metadata);
                await tenantDb.SaveChangesAsync();
            }
            catch (Exception ex) when (!schemaRepairAttempted && IsRecoverableTenantSchemaException(ex))
            {
                _logger.LogWarning(ex, "Recoverable tenant schema issue detected during update for tenant {TenantId}. Repairing schema and retrying once.", tenant.Id);
                await RepairTenantSchemaAsync(
                    tenant,
                    schema,
                    dto.AdminEmail,
                    dto.AdminName,
                    null,
                    dto.SelectedModules);

                await ApplyTenantUpdateAsync(tenant, dto, schemaRepairAttempted: true);
            }
            catch (Exception ex) when (!schemaRepairAttempted)
            {
                _logger.LogWarning(ex, "Non-recoverable tenant update error detected for tenant {TenantId}. Attempting one forced schema repair before failing.", tenant.Id);

                await RepairTenantSchemaAsync(
                    tenant,
                    schema,
                    dto.AdminEmail,
                    dto.AdminName,
                    null,
                    dto.SelectedModules,
                    forceReset: true);

                await ApplyTenantUpdateAsync(tenant, dto, schemaRepairAttempted: true);
            }
        }

        public async Task EnsureTenantSchemaReadyForUpdateAsync(Tenant tenant, UpdateTenantDto dto)
        {
            var schema = BuildSchemaName(tenant.Subdomain, tenant.Id);
            var hasCoreTables = await HasRequiredTenantTablesAsync(schema);
            if (hasCoreTables)
            {
                return;
            }

            _logger.LogInformation("Tenant {TenantId} schema {Schema} missing core tables. Running recovery before update.", tenant.Id, schema);

            tenant.ProvisionStatus = ProvisionStates.Repairing;
            tenant.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            await RepairTenantSchemaAsync(
                tenant,
                schema,
                dto.AdminEmail,
                dto.AdminName,
                null,
                dto.SelectedModules,
                forceReset: true);

            tenant.ProvisionStatus = ProvisionStates.Completed;
            tenant.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            await WriteProvisioningAuditLogAsync(tenant.Id, "TenantSchemaRecoveredForUpdate", $"Schema '{schema}' recovered before tenant update.");
        }

        public async Task RenameTenantSchemaAsync(Tenant tenant, string newSubdomain)
        {
            if (string.Equals(tenant.Subdomain, "master", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Master tenant schema changes are restricted.");
            }

            var trimmed = newSubdomain.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
            {
                throw new InvalidOperationException("Subdomain is required.");
            }

            var exists = await _db.Tenants.AsNoTracking()
                .AnyAsync(t => t.Id != tenant.Id && t.Subdomain == trimmed && !t.IsDeleted);
            if (exists)
            {
                throw new InvalidOperationException("Tenant subdomain already exists.");
            }

            var oldSchema = BuildSchemaName(tenant.Subdomain, tenant.Id);
            var newSchema = BuildSchemaName(trimmed, tenant.Id);

            if (!string.Equals(oldSchema, newSchema, StringComparison.OrdinalIgnoreCase))
            {
                var safeOld = SanitizeSchemaName(oldSchema);
                var safeNew = SanitizeSchemaName(newSchema);

                if (!await SchemaExistsAsync(safeOld))
                {
                    throw new InvalidOperationException("Current tenant schema not found.");
                }

                if (await SchemaHasTablesAsync(safeNew))
                {
                    throw new InvalidOperationException("Target schema already contains objects.");
                }

                await EnsureSchemaAsync(safeNew);
                await TransferSchemaTablesAsync(safeOld, safeNew);
            }

            tenant.Subdomain = trimmed;
        }

        private async Task EnsureModuleCatalogAsync()
        {
            var existingKeys = await _db.Modules.AsNoTracking()
                .Select(m => m.ModuleKey)
                .ToListAsync();

            var missing = DefaultModuleKeys
                .Where(k => !existingKeys.Contains(k, StringComparer.OrdinalIgnoreCase))
                .ToList();

            if (missing.Count == 0)
            {
                return;
            }

            var now = DateTime.UtcNow;
            foreach (var key in missing)
            {
                _db.Modules.Add(new Module
                {
                    ModuleKey = key,
                    Name = key.ToUpperInvariant(),
                    DisplayName = key switch
                    {
                        "platform" => "Platform / Core",
                        "licensing" => "Modules & Licensing",
                        "security" => "Authentication & Security",
                        "hrms" => "HRMS",
                        "payroll" => "Payroll",
                        "reports" => "Reports",
                        "erp" => "ERP SaaS Platform",
                        _ => key
                    },
                    ModuleType = key switch
                    {
                        "platform" => "platform",
                        "licensing" => "licensing",
                        "security" => "security",
                        _ => "business"
                    },
                    IsEnabled = true,
                    IsActive = true,
                    SortOrder = 0,
                    Version = "1.0.0",
                    CreatedAt = now
                });
            }

            await _db.SaveChangesAsync();
        }

        private async Task EnsureSchemaAsync(string schema)
        {
            var safeSchema = SanitizeSchemaName(schema);
            var sql = $"IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = '{safeSchema}') EXEC('CREATE SCHEMA [{safeSchema}]');";
            await _db.Database.ExecuteSqlRawAsync(sql);
        }

        private async Task<bool> SchemaExistsAsync(string schema)
        {
            const string sql = "SELECT COUNT(1) FROM sys.schemas WHERE name = @schema";
            var count = await ExecuteScalarAsync(sql, ("@schema", schema));
            return count > 0;
        }

        private async Task<bool> SchemaHasTablesAsync(string schema)
        {
            const string sql = "SELECT COUNT(1) FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = @schema";
            var count = await ExecuteScalarAsync(sql, ("@schema", schema));
            return count > 0;
        }

        private async Task TransferSchemaTablesAsync(string oldSchema, string newSchema)
        {
            var sql = $@"
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql = @sql + N'ALTER SCHEMA [{newSchema}] TRANSFER [' + s.name + '].[' + t.name + '];'
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = N'{oldSchema}';
EXEC sp_executesql @sql;";

            await _db.Database.ExecuteSqlRawAsync(sql);
        }

        private async Task<int> ExecuteScalarAsync(string sql, params (string Name, object Value)[] parameters)
        {
            var connection = _db.Database.GetDbConnection();
            var shouldClose = connection.State != ConnectionState.Open;
            if (shouldClose)
            {
                await _db.Database.OpenConnectionAsync();
            }

            try
            {
                await using var command = connection.CreateCommand();
                command.CommandText = sql;
                foreach (var parameter in parameters)
                {
                    var param = command.CreateParameter();
                    param.ParameterName = parameter.Name;
                    param.Value = parameter.Value;
                    command.Parameters.Add(param);
                }
                var result = await command.ExecuteScalarAsync();
                return result == null ? 0 : Convert.ToInt32(result);
            }
            finally
            {
                if (shouldClose)
                {
                    await _db.Database.CloseConnectionAsync();
                }
            }
        }

        private async Task SeedTenantAsync(
            Tenant tenant,
            string schema,
            CreateTenantDto dto,
            bool skipSchemaInitialization = false,
            bool schemaRepairAttempted = false)
        {
            try
            {
                await using var tenantDb = CreateTenantScopedDbContext(tenant.Id, schema);
                await DropTenantSchemaSynonymsAsync(SanitizeSchemaName(schema));

                if (!skipSchemaInitialization)
                {
                    await CloneTemplateSchemaAsync(schema);
                }
                else
                {
                    _logger.LogInformation(
                        "Skipping schema migration for tenant {TenantId} in schema {Schema}; using existing initialized schema.",
                        tenant.Id,
                        schema);
                }

                var effectivePassword = string.IsNullOrWhiteSpace(dto.AdminPassword)
                    ? BuildTemporaryPassword()
                    : dto.AdminPassword.Trim();

                var tenantRoles = await tenantDb.Roles
                    .IgnoreQueryFilters()
                    .Where(r => r.TenantId == tenant.Id)
                    .ToListAsync();

                foreach (var role in DefaultRoles)
                {
                    var normalizedRoleName = RoleCatalog.Normalize(role.Name);
                    var existingRole = tenantRoles.FirstOrDefault(r =>
                        string.Equals(RoleCatalog.Normalize(r.Name), normalizedRoleName, StringComparison.OrdinalIgnoreCase));

                    if (existingRole == null)
                    {
                        var createdRole = new Role { TenantId = tenant.Id, Name = role.Name, Description = role.Description };
                        tenantDb.Roles.Add(createdRole);
                        tenantRoles.Add(createdRole);
                    }
                    else if (!string.Equals(existingRole.Name, role.Name, StringComparison.Ordinal))
                    {
                        existingRole.Name = role.Name;
                        existingRole.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await tenantDb.SaveChangesAsync();

                var adminResult = await EnsureDefaultAdminAsync(
                    tenantDb,
                    tenant,
                    dto.AdminEmail,
                    dto.AdminName,
                    dto.AdminRole,
                    effectivePassword,
                    null);

                await PersistAdminSecurityStateAsync(
                    tenantDb,
                    tenant,
                    adminResult.EffectiveAdminEmail,
                    adminResult.EffectiveAdminRole,
                    passwordResetPending: true,
                    credentialDeliveryPending: true);

                var requestedModules = NormalizeModuleKeys(dto.SelectedModules);
                foreach (var key in DefaultModuleKeys)
                {
                    var existing = await tenantDb.TenantModules.FirstOrDefaultAsync(tm => tm.ModuleKey == key);
                    if (existing == null)
                    {
                        tenantDb.TenantModules.Add(new TenantModule
                        {
                            TenantId = tenant.Id,
                            ModuleKey = key,
                            IsEnabled = CoreEnabledModules.Contains(key) || requestedModules.Contains(key, StringComparer.OrdinalIgnoreCase)
                        });
                    }
                    else
                    {
                        existing.IsEnabled = CoreEnabledModules.Contains(key) || requestedModules.Contains(key, StringComparer.OrdinalIgnoreCase);
                        existing.DisabledAt = existing.IsEnabled ? null : DateTime.UtcNow;
                    }
                }

                var metadata = await BuildTenantProfileMetadataAsync(tenantDb, tenant, null, dto);
                await SaveTenantProfileToConfigAsync(tenantDb, tenant.Id, metadata);

                await EnsureDefaultCompanyAsync(
                    tenantDb,
                    tenant,
                    dto.Name,
                    dto.AdminEmail,
                    dto.ContactNumber,
                    dto.Address,
                    dto.State);

                await tenantDb.SaveChangesAsync();
                _logger.LogInformation("Tenant provisioned: {TenantId} schema={Schema}", tenant.Id, schema);
            }
            catch (Exception ex) when (!schemaRepairAttempted && IsRecoverableTenantSchemaException(ex))
            {
                _logger.LogWarning(ex, "Recoverable tenant schema issue detected while provisioning tenant {TenantId} in schema {Schema}. Repairing schema and retrying once.", tenant.Id, schema);
                await RepairTenantSchemaAsync(
                    tenant,
                    schema,
                    dto.AdminEmail,
                    dto.AdminName,
                    dto.AdminRole,
                    dto.SelectedModules,
                    forceReset: true);
                await SeedTenantAsync(
                    tenant,
                    schema,
                    dto,
                    skipSchemaInitialization: true,
                    schemaRepairAttempted: true);
            }
        }

        private async Task RepairTenantSchemaAsync(
            Tenant tenant,
            string schema,
            string? adminEmail,
            string? adminName,
            string? adminRole,
            IEnumerable<string>? selectedModules,
            bool forceReset = false)
        {
            var needsReset = forceReset || !await HasRequiredTenantTablesAsync(schema);

            if (needsReset)
            {
                await ResetSchemaAsync(schema);
            }
            else
            {
                await EnsureSchemaAsync(schema);
            }

            await using var tenantDb = CreateTenantScopedDbContext(tenant.Id, schema);
            await DropTenantSchemaSynonymsAsync(SanitizeSchemaName(schema));

            if (!await HasRequiredTenantTablesAsync(schema))
            {
                await CloneTemplateSchemaAsync(schema);
            }

            await EnsureTenantBaselineDataAsync(tenantDb, tenant, adminEmail, adminName, adminRole, selectedModules);
            await tenantDb.SaveChangesAsync();
        }

        private async Task CloneTemplateSchemaAsync(string targetSchema)
        {
            var safeTarget = SanitizeSchemaName(targetSchema);
            var configuredTemplate = _configuration["TenantProvisioning:TemplateSchema"];
            var safeTemplate = string.IsNullOrWhiteSpace(configuredTemplate)
                ? "dbo"
                : SanitizeSchemaName(configuredTemplate);

            var governance = await BuildTemplateGovernanceSnapshotAsync();
            var enforceChecksum = bool.TryParse(_configuration["TenantProvisioning:TemplateGovernance:EnforceChecksum"], out var parsedEnforce)
                && parsedEnforce;

            if (enforceChecksum && !governance.TemplateChecksumValid)
            {
                throw new InvalidOperationException(
                    $"Template governance validation failed for schema '{safeTemplate}'. " +
                    $"Configured checksum '{governance.TemplateChecksumConfigured}' does not match computed checksum '{governance.TemplateChecksumComputed}'.");
            }

            if (!await SchemaExistsAsync(safeTemplate))
            {
                throw new InvalidOperationException($"Template schema '{safeTemplate}' not found. Configure TenantProvisioning:TemplateSchema correctly.");
            }

            await EnsureSchemaAsync(safeTarget);

            var cloneSql = $@"
DECLARE @template sysname = N'{safeTemplate}';
DECLARE @target sysname = N'{safeTarget}';
DECLARE @sql nvarchar(max) = N'';

SELECT @sql = @sql +
N'IF NOT EXISTS (
      SELECT 1
      FROM sys.tables tt
      JOIN sys.schemas ts ON ts.schema_id = tt.schema_id
      WHERE ts.name = N''' + @target + N''' AND tt.name = N''' + t.name + N'''
  )
  BEGIN
      SELECT TOP (0) * INTO [' + @target + N'].[' + t.name + N'] FROM [' + @template + N'].[' + t.name + N'];
  END;'
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = @template;

IF LEN(@sql) > 0
BEGIN
    EXEC sp_executesql @sql;
END";

            await _db.Database.ExecuteSqlRawAsync(cloneSql);

            if (!await HasRequiredTenantTablesAsync(safeTarget))
            {
                throw new InvalidOperationException($"Template clone did not produce required tenant tables in schema '{safeTarget}'.");
            }
        }

        private async Task EnsureTenantMigrationBaselineAsync(string schema)
        {
            var safeSchema = SanitizeSchemaName(schema);
            var productVersion = typeof(DbContext).Assembly.GetName().Version?.ToString(3) ?? "8.0.0";
            await DropTenantSchemaSynonymsAsync(safeSchema);

            const string nonHistoryTablesSql = @"
SELECT COUNT(1)
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = @schema
  AND t.name <> '__EFMigrationsHistory';";

            var nonHistoryTableCount = await ExecuteScalarAsync(nonHistoryTablesSql, ("@schema", safeSchema));

            var createHistoryTableSql = $@"
IF NOT EXISTS (
    SELECT 1
    FROM sys.tables t
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE t.name = '__EFMigrationsHistory' AND s.name = '{safeSchema}'
)
BEGIN
    EXEC(N'CREATE TABLE [{safeSchema}].[__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    )');
END";

            await _db.Database.ExecuteSqlRawAsync(createHistoryTableSql);

            if (nonHistoryTableCount == 0)
            {
                var clearHistorySql = $@"
DELETE FROM [{safeSchema}].[__EFMigrationsHistory];";

                await _db.Database.ExecuteSqlRawAsync(clearHistorySql);

                _logger.LogInformation(
                    "Schema {Schema} has no tenant tables. Skipping legacy migration history backfill so EF migrations can run from scratch.",
                    safeSchema);

                return;
            }

            var migrationsToSeed = LegacyTenantBaselineMigrations.AsEnumerable();

            foreach (var migrationId in migrationsToSeed)
            {
                var insertSql = $@"
IF NOT EXISTS (
    SELECT 1 FROM [{safeSchema}].[__EFMigrationsHistory] WHERE [MigrationId] = '{migrationId}'
)
BEGIN
    INSERT INTO [{safeSchema}].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('{migrationId}', '{productVersion}');
END";

                await _db.Database.ExecuteSqlRawAsync(insertSql);
            }

            await EnsureNotificationAndDocumentTablesAsync(safeSchema);
            await EnsureNotificationAndDocumentIndexesAsync(safeSchema);

            await ReconcileMigrationHistoryIfTablesExistAsync(
                safeSchema,
                "20260411183016_AddNotificationAndDocumentRecords",
                productVersion,
                "DocumentRecords",
                "NotificationMessages");

            await ReconcileMigrationHistoryIfTablesExistAsync(
                safeSchema,
                InitialCleanSchemaMigrationId,
                productVersion,
                "AppraisalCompetencies",
                "Roles",
                "Users");

            await ReconcileIndexMigrationHistoryIfIndexesExistAsync(
                safeSchema,
                "20260413090720_AddNotificationAndDocumentIndexes",
                productVersion,
                "IX_NotificationMessages_Tenant_Recipient_Status",
                "IX_DocumentRecords_Tenant_Company_Project",
                "IX_DocumentRecords_Tenant_Module_Category");
        }

        private async Task EnsureNotificationAndDocumentTablesAsync(string schema)
        {
            var sql = $@"
IF NOT EXISTS (
    SELECT 1 FROM sys.tables t
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = '{schema}' AND t.name = 'DocumentRecords'
)
BEGIN
    EXEC(N'CREATE TABLE [{schema}].[DocumentRecords] (
        [Id] uniqueidentifier NOT NULL,
        [UploadedByUserId] uniqueidentifier NOT NULL,
        [CompanyId] uniqueidentifier NULL,
        [ProjectId] uniqueidentifier NULL,
        [EmployeeId] uniqueidentifier NULL,
        [Module] nvarchar(max) NOT NULL,
        [Category] nvarchar(max) NOT NULL,
        [FileName] nvarchar(max) NOT NULL,
        [ContentType] nvarchar(max) NOT NULL,
        [FileSizeBytes] bigint NOT NULL,
        [StoragePath] nvarchar(max) NOT NULL,
        [Tags] nvarchar(max) NULL,
        [Description] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_DocumentRecords] PRIMARY KEY ([Id])
    )');
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.tables t
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = '{schema}' AND t.name = 'NotificationMessages'
)
BEGIN
    EXEC(N'CREATE TABLE [{schema}].[NotificationMessages] (
        [Id] uniqueidentifier NOT NULL,
        [RecipientUserId] uniqueidentifier NOT NULL,
        [CompanyId] uniqueidentifier NULL,
        [ProjectId] uniqueidentifier NULL,
        [Channel] nvarchar(max) NOT NULL,
        [Type] nvarchar(max) NOT NULL,
        [Title] nvarchar(max) NOT NULL,
        [Message] nvarchar(max) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [IsRead] bit NOT NULL,
        [SentAt] datetime2 NULL,
        [ReadAt] datetime2 NULL,
        [MetadataJson] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_NotificationMessages] PRIMARY KEY ([Id])
    )');
END;";

            await _db.Database.ExecuteSqlRawAsync(sql);
        }

        private async Task EnsureNotificationAndDocumentIndexesAsync(string schema)
        {
            var sql = $@"
IF EXISTS (
    SELECT 1
    FROM sys.columns c
    JOIN sys.tables t ON c.object_id = t.object_id
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    WHERE s.name = '{schema}' AND t.name = 'NotificationMessages' AND c.name = 'Status'
      AND ty.name = 'nvarchar' AND c.max_length = -1
)
BEGIN
    EXEC(N'ALTER TABLE [{schema}].[NotificationMessages] ALTER COLUMN [Status] nvarchar(450) NOT NULL;');
END;

IF EXISTS (
    SELECT 1
    FROM sys.columns c
    JOIN sys.tables t ON c.object_id = t.object_id
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    WHERE s.name = '{schema}' AND t.name = 'DocumentRecords' AND c.name = 'Module'
      AND ty.name = 'nvarchar' AND c.max_length = -1
)
BEGIN
    EXEC(N'ALTER TABLE [{schema}].[DocumentRecords] ALTER COLUMN [Module] nvarchar(450) NOT NULL;');
END;

IF EXISTS (
    SELECT 1
    FROM sys.columns c
    JOIN sys.tables t ON c.object_id = t.object_id
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    WHERE s.name = '{schema}' AND t.name = 'DocumentRecords' AND c.name = 'Category'
      AND ty.name = 'nvarchar' AND c.max_length = -1
)
BEGIN
    EXEC(N'ALTER TABLE [{schema}].[DocumentRecords] ALTER COLUMN [Category] nvarchar(450) NOT NULL;');
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes i
    JOIN sys.tables t ON i.object_id = t.object_id
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = '{schema}' AND t.name = 'NotificationMessages' AND i.name = 'IX_NotificationMessages_Tenant_Recipient_Status'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_NotificationMessages_Tenant_Recipient_Status]
          ON [{schema}].[NotificationMessages] ([TenantId], [RecipientUserId], [Status], [IsRead], [CreatedAt] DESC);');
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes i
    JOIN sys.tables t ON i.object_id = t.object_id
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = '{schema}' AND t.name = 'DocumentRecords' AND i.name = 'IX_DocumentRecords_Tenant_Company_Project'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_DocumentRecords_Tenant_Company_Project]
          ON [{schema}].[DocumentRecords] ([TenantId], [CompanyId], [ProjectId], [CreatedAt] DESC);');
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes i
    JOIN sys.tables t ON i.object_id = t.object_id
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = '{schema}' AND t.name = 'DocumentRecords' AND i.name = 'IX_DocumentRecords_Tenant_Module_Category'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_DocumentRecords_Tenant_Module_Category]
          ON [{schema}].[DocumentRecords] ([TenantId], [Module], [Category], [CreatedAt] DESC);');
END;";

            await _db.Database.ExecuteSqlRawAsync(sql);
        }

        private async Task ReconcileMigrationHistoryIfTablesExistAsync(
            string schema,
            string migrationId,
            string productVersion,
            params string[] requiredTables)
        {
            if (requiredTables.Length == 0)
            {
                return;
            }

            var requiredClauses = string.Join(
                "\n   AND ",
                requiredTables.Select(t =>
                    $"EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = '{schema}' AND t.name = '{t}')"));

            var sql = $@"
IF NOT EXISTS (
    SELECT 1 FROM [{schema}].[__EFMigrationsHistory] WHERE [MigrationId] = '{migrationId}'
)
   AND {requiredClauses}
BEGIN
    INSERT INTO [{schema}].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('{migrationId}', '{productVersion}');
END";

            await _db.Database.ExecuteSqlRawAsync(sql);
        }

        private async Task ReconcileIndexMigrationHistoryIfIndexesExistAsync(
            string schema,
            string migrationId,
            string productVersion,
            params string[] requiredIndexes)
        {
            if (requiredIndexes.Length == 0)
            {
                return;
            }

            var requiredClauses = string.Join(
                "\n   AND ",
                requiredIndexes.Select(i =>
                    $"EXISTS (SELECT 1 FROM sys.indexes ix JOIN sys.tables t ON ix.object_id = t.object_id JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = '{schema}' AND ix.name = '{i}')"));

            var sql = $@"
IF NOT EXISTS (
    SELECT 1 FROM [{schema}].[__EFMigrationsHistory] WHERE [MigrationId] = '{migrationId}'
)
   AND {requiredClauses}
BEGIN
    INSERT INTO [{schema}].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('{migrationId}', '{productVersion}');
END";

            await _db.Database.ExecuteSqlRawAsync(sql);
        }

        private async Task<bool> HasRequiredTenantTablesAsync(string schema)
        {
            var sql = $@"
SELECT COUNT(DISTINCT t.name)
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = @schema
    AND t.name IN ({string.Join(",", RequiredTenantTables.Select(t => $"'{t}'"))});";

            var tableCount = await ExecuteScalarAsync(sql, ("@schema", SanitizeSchemaName(schema)));
            return tableCount >= RequiredTenantTables.Length;
        }

        private async Task<string[]> GetMissingRequiredTablesAsync(string schema)
        {
            const string sql = @"
SELECT t.name
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = @schema;";

            var existing = await ExecuteStringListAsync(sql, ("@schema", schema));
            var existingSet = new HashSet<string>(existing, StringComparer.OrdinalIgnoreCase);

            return RequiredTenantTables
                .Where(t => !existingSet.Contains(t))
                .OrderBy(t => t)
                .ToArray();
        }

        private async Task<bool> IsTenantSchemaInitializedAsync(string schema, string? latestMigrationId)
        {
            var safeSchema = SanitizeSchemaName(schema);
            var hasCoreTables = await HasRequiredTenantTablesAsync(safeSchema);
            if (!hasCoreTables)
            {
                return false;
            }

            if (string.IsNullOrWhiteSpace(latestMigrationId))
            {
                return true;
            }

            return await HasTenantMigrationRecordedAsync(safeSchema, latestMigrationId);
        }

        private async Task<bool> HasTenantMigrationRecordedAsync(string schema, string migrationId)
        {
            const string sql = @"
SELECT COUNT(1)
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = @schema
  AND t.name = '__EFMigrationsHistory';";

            var hasHistoryTable = await ExecuteScalarAsync(sql, ("@schema", schema)) > 0;
            if (!hasHistoryTable)
            {
                return false;
            }

            var historySql = $@"
SELECT COUNT(1)
FROM [{schema}].[__EFMigrationsHistory]
WHERE [MigrationId] = @migrationId;";

            return await ExecuteScalarAsync(historySql, ("@migrationId", migrationId)) > 0;
        }

        private async Task WriteProvisioningAuditLogAsync(Guid tenantId, string action, string detail)
        {
            try
            {
                var tenant = await _db.Tenants
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == tenantId && !t.IsDeleted);

                if (tenant == null || string.IsNullOrWhiteSpace(tenant.Subdomain))
                {
                    return;
                }

                var schema = BuildSchemaName(tenant.Subdomain, tenant.Id);
                if (!await HasRequiredTenantTablesAsync(schema))
                {
                    return;
                }

                await using var tenantDb = CreateTenantScopedDbContext(tenantId, schema);
                tenantDb.AuditLogs.Add(new AuditLog
                {
                    TenantId = tenantId,
                    EntityName = "TenantProvisioning",
                    Action = action,
                    PerformedAt = DateTime.UtcNow,
                    Ip = detail
                });
                await tenantDb.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to write provisioning audit log for tenant {TenantId}", tenantId);
            }
        }

        private async Task WriteProvisioningStepLogAsync(
            Guid tenantId,
            string stepName,
            string status,
            string? errorMessage,
            long durationMs,
            string correlationId)
        {
            try
            {
                await _db.Database.ExecuteSqlRawAsync(
                    @"INSERT INTO [dbo].[TenantProvisionLogs]
                      ([Id], [TenantId], [StepName], [Status], [ErrorMessage], [DurationMs], [CreatedAt], [CorrelationId])
                      VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6}, {7})",
                    Guid.NewGuid(),
                    tenantId,
                    stepName,
                    status,
                    string.IsNullOrWhiteSpace(errorMessage) ? DBNull.Value : errorMessage,
                    durationMs,
                    DateTime.UtcNow,
                    correlationId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to write tenant provision step log for tenant {TenantId}, step {StepName}", tenantId, stepName);
            }
        }

        private async Task NotifyProvisioningFailureAsync(Tenant tenant, string correlationId, string errorMessage, bool isDeadLetter)
        {
            try
            {
                var schema = BuildSchemaName(tenant.Subdomain, tenant.Id);
                if (!await HasRequiredTenantTablesAsync(schema))
                {
                    return;
                }

                await using var tenantDb = CreateTenantScopedDbContext(tenant.Id, schema);

                var adminUserIds = await tenantDb.Users
                    .IgnoreQueryFilters()
                    .Where(u => u.TenantId == tenant.Id && !u.IsDeleted && u.IsActive)
                    .Join(
                        tenantDb.UserRoles.IgnoreQueryFilters().Where(ur => ur.TenantId == tenant.Id && !ur.IsDeleted),
                        u => u.Id,
                        ur => ur.UserId,
                        (u, ur) => new { u.Id, ur.RoleId })
                    .Join(
                        tenantDb.Roles.IgnoreQueryFilters().Where(r => r.TenantId == tenant.Id && !r.IsDeleted),
                        ur => ur.RoleId,
                        r => r.Id,
                        (ur, r) => new { ur.Id, r.Name })
                    .Where(x => x.Name == RoleCatalog.SuperAdminRoleName || x.Name == RoleCatalog.AdminRoleName)
                    .Select(x => x.Id)
                    .Distinct()
                    .ToListAsync();

                if (adminUserIds.Count == 0)
                {
                    return;
                }

                var title = isDeadLetter
                    ? "Tenant provisioning moved to dead-letter"
                    : "Tenant provisioning failed";
                var message = isDeadLetter
                    ? $"Provisioning retries exhausted for tenant '{tenant.Name}'. Manual repair is required."
                    : $"Provisioning failed for tenant '{tenant.Name}'.";

                foreach (var adminUserId in adminUserIds)
                {
                    tenantDb.NotificationMessages.Add(new NotificationMessage
                    {
                        TenantId = tenant.Id,
                        RecipientUserId = adminUserId,
                        Channel = "InApp",
                        Type = "Operations",
                        Title = title,
                        Message = message,
                        Status = "Pending",
                        MetadataJson = JsonSerializer.Serialize(new
                        {
                            tenantId = tenant.Id,
                            correlationId,
                            errorMessage,
                            repairEndpoint = $"/api/v1/tenants/{tenant.Id}/repair"
                        })
                    });
                }

                await tenantDb.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to dispatch tenant provisioning failure alert for tenant {TenantId}", tenant.Id);
            }
        }

        private async Task DropTenantSchemaSynonymsAsync(string schema)
        {
            var sql = $@"
IF EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'{schema}')
BEGIN
    DECLARE @dropSql nvarchar(max) = N'';

    SELECT @dropSql = @dropSql + N'DROP SYNONYM [' + s.name + N'].[' + syn.name + N'];'
    FROM sys.synonyms syn
    JOIN sys.schemas s ON s.schema_id = syn.schema_id
    WHERE s.name = N'{schema}';

    IF LEN(@dropSql) > 0
    BEGIN
        EXEC sp_executesql @dropSql;
    END
END";

            await _db.Database.ExecuteSqlRawAsync(sql);
        }

        private async Task EnsureTenantBaselineDataAsync(
            ApplicationDbContext tenantDb,
            Tenant tenant,
            string? adminEmail,
            string? adminName,
            string? adminRole,
            IEnumerable<string>? selectedModules)
        {
            var tenantRoles = await tenantDb.Roles
                .IgnoreQueryFilters()
                .Where(r => r.TenantId == tenant.Id)
                .ToListAsync();

            foreach (var role in DefaultRoles)
            {
                var normalizedRoleName = RoleCatalog.Normalize(role.Name);
                var existingRole = tenantRoles.FirstOrDefault(r =>
                    string.Equals(RoleCatalog.Normalize(r.Name), normalizedRoleName, StringComparison.OrdinalIgnoreCase));

                if (existingRole == null)
                {
                    var createdRole = new Role
                    {
                        TenantId = tenant.Id,
                        Name = role.Name,
                        Description = role.Description
                    };

                    tenantDb.Roles.Add(createdRole);
                    tenantRoles.Add(createdRole);
                }
                else
                {
                    if (existingRole.IsDeleted)
                    {
                        existingRole.IsDeleted = false;
                        existingRole.UpdatedAt = DateTime.UtcNow;
                    }

                    if (string.IsNullOrWhiteSpace(existingRole.Description))
                    {
                        existingRole.Description = role.Description;
                    }

                    if (!string.Equals(existingRole.Name, role.Name, StringComparison.Ordinal))
                    {
                        existingRole.Name = role.Name;
                        existingRole.UpdatedAt = DateTime.UtcNow;
                    }
                }
            }

            var requestedModules = NormalizeModuleKeys(selectedModules);
            foreach (var key in DefaultModuleKeys)
            {
                var existing = await tenantDb.TenantModules
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(tm => tm.TenantId == tenant.Id && tm.ModuleKey == key);

                var shouldEnable = CoreEnabledModules.Contains(key) || requestedModules.Contains(key, StringComparer.OrdinalIgnoreCase);

                if (existing == null)
                {
                    tenantDb.TenantModules.Add(new TenantModule
                    {
                        TenantId = tenant.Id,
                        ModuleKey = key,
                        IsEnabled = shouldEnable,
                        EnabledAt = DateTime.UtcNow,
                        DisabledAt = shouldEnable ? null : DateTime.UtcNow
                    });
                }
            }

            var fallbackCorrelationId = Guid.NewGuid().ToString("N");
            var adminResult = await EnsureDefaultAdminAsync(
                tenantDb,
                tenant,
                adminEmail,
                adminName,
                adminRole,
                null,
                fallbackCorrelationId);

            await PersistAdminSecurityStateAsync(
                tenantDb,
                tenant,
                adminResult.EffectiveAdminEmail,
                adminResult.EffectiveAdminRole,
                passwordResetPending: true,
                credentialDeliveryPending: adminResult.UsedFallbackEmail);

            var existingConfig = await tenantDb.TenantConfigs
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.TenantId == tenant.Id && !c.IsDeleted);

            if (existingConfig == null)
            {
                tenantDb.TenantConfigs.Add(new TenantConfig
                {
                    TenantId = tenant.Id,
                    ConfigJson = "{}",
                    UiSchemaJson = "{}",
                    WorkflowJson = "{}",
                    BrandingJson = "{}"
                });
            }

            await EnsureDefaultCompanyAsync(
                tenantDb,
                tenant,
                tenant.Name,
                adminEmail,
                null,
                null,
                null);
        }

        private async Task<AdminEnsureResult> EnsureDefaultAdminAsync(
            ApplicationDbContext tenantDb,
            Tenant tenant,
            string? adminEmail,
            string? adminName,
            string? adminRole,
            string? preferredPassword,
            string? correlationId)
        {
            var usedFallbackEmail = string.IsNullOrWhiteSpace(adminEmail);
            var normalizedEmail = usedFallbackEmail
                ? $"admin@{(tenant.Subdomain ?? "tenant").Trim().ToLowerInvariant()}.local"
                : adminEmail!.Trim();
            var normalizedName = string.IsNullOrWhiteSpace(adminName) ? "Tenant Admin" : adminName.Trim();
            var selectedAdminRoleName = ResolveAdminRoleName(adminRole);

            if (usedFallbackEmail)
            {
                var effectiveCorrelationId = string.IsNullOrWhiteSpace(correlationId)
                    ? Guid.NewGuid().ToString("N")
                    : correlationId;

                await WriteProvisioningStepLogAsync(
                    tenant.Id,
                    "Admin Identity",
                    "Warning",
                    "Admin email missing in request metadata. Fallback admin email generated; credentials must be shared explicitly.",
                    0,
                    effectiveCorrelationId);
            }

            var normalizedSelectedRole = RoleCatalog.Normalize(selectedAdminRoleName);
            var selectedRole = (await tenantDb.Roles
                    .IgnoreQueryFilters()
                    .Where(r => r.TenantId == tenant.Id)
                    .ToListAsync())
                .FirstOrDefault(r =>
                    string.Equals(RoleCatalog.Normalize(r.Name), normalizedSelectedRole, StringComparison.OrdinalIgnoreCase));

            if (selectedRole == null)
            {
                var roleDescription = DefaultRoles
                    .FirstOrDefault(r => string.Equals(r.Name, selectedAdminRoleName, StringComparison.OrdinalIgnoreCase))
                    .Description;

                selectedRole = new Role
                {
                    TenantId = tenant.Id,
                    Name = selectedAdminRoleName,
                    Description = string.IsNullOrWhiteSpace(roleDescription) ? "Tenant administrator" : roleDescription
                };

                tenantDb.Roles.Add(selectedRole);
                await tenantDb.SaveChangesAsync();
            }
            else
            {
                if (selectedRole.IsDeleted)
                {
                    selectedRole.IsDeleted = false;
                    selectedRole.UpdatedAt = DateTime.UtcNow;
                }

                if (!string.Equals(selectedRole.Name, selectedAdminRoleName, StringComparison.Ordinal))
                {
                    selectedRole.Name = selectedAdminRoleName;
                    selectedRole.UpdatedAt = DateTime.UtcNow;
                }

                if (string.IsNullOrWhiteSpace(selectedRole.Description))
                {
                    var roleDescription = DefaultRoles
                        .FirstOrDefault(r => string.Equals(r.Name, selectedAdminRoleName, StringComparison.OrdinalIgnoreCase))
                        .Description;
                    selectedRole.Description = string.IsNullOrWhiteSpace(roleDescription) ? "Tenant administrator" : roleDescription;
                }
            }

            var users = await tenantDb.Users
                .IgnoreQueryFilters()
                .Where(u => u.TenantId == tenant.Id && !u.IsDeleted)
                .OrderByDescending(u => u.IsSystemAdmin)
                .ThenBy(u => u.CreatedAt)
                .ToListAsync();

            var adminUser = users.FirstOrDefault(u => u.IsSystemAdmin) ?? users.FirstOrDefault();
            var generatedPassword = string.IsNullOrWhiteSpace(preferredPassword)
                ? BuildTemporaryPassword()
                : preferredPassword.Trim();

            bool isTargetSystemAdmin = string.Equals(normalizedEmail, AuthUserLookup.DevAdminEmail, StringComparison.OrdinalIgnoreCase)
                || (adminUser != null && adminUser.IsSystemAdmin);

            if (adminUser == null)
            {
                adminUser = new User
                {
                    TenantId = tenant.Id,
                    Email = normalizedEmail,
                    FullName = normalizedName,
                    IsSystemAdmin = isTargetSystemAdmin,
                    IsActive = true,
                    PasswordHash = _hasher.HashPassword(new User { Email = normalizedEmail }, generatedPassword)
                };
                tenantDb.Users.Add(adminUser);
            }
            else
            {
                adminUser.Email = normalizedEmail;
                adminUser.FullName = normalizedName;
                adminUser.IsSystemAdmin = isTargetSystemAdmin;
                adminUser.IsActive = true;
            }

            foreach (var otherUser in users.Where(u => adminUser == null || u.Id != adminUser.Id))
            {
                if (otherUser.IsSystemAdmin && !string.Equals(otherUser.Email, AuthUserLookup.DevAdminEmail, StringComparison.OrdinalIgnoreCase))
                {
                    otherUser.IsSystemAdmin = false;
                    otherUser.UpdatedAt = DateTime.UtcNow;
                }
            }

            await tenantDb.SaveChangesAsync();

            var existingMappings = await tenantDb.UserRoles
                .IgnoreQueryFilters()
                .Where(ur => ur.TenantId == tenant.Id && ur.UserId == adminUser.Id)
                .ToListAsync();

            foreach (var mapping in existingMappings.Where(m => !m.IsDeleted))
            {
                mapping.IsDeleted = true;
                mapping.UpdatedAt = DateTime.UtcNow;
            }

            tenantDb.UserRoles.Add(new UserRole
            {
                TenantId = tenant.Id,
                UserId = adminUser.Id,
                RoleId = selectedRole.Id
            });

            await tenantDb.SaveChangesAsync();

            _logger.LogInformation("Admin user ensured for tenant {TenantId} with email {Email}", tenant.Id, normalizedEmail);

            return new AdminEnsureResult
            {
                EffectiveAdminEmail = normalizedEmail,
                EffectiveAdminRole = selectedAdminRoleName,
                UsedFallbackEmail = usedFallbackEmail,
                GeneratedPassword = string.IsNullOrWhiteSpace(preferredPassword) ? generatedPassword : null
            };
        }

        private async Task PersistAdminSecurityStateAsync(
            ApplicationDbContext tenantDb,
            Tenant tenant,
            string adminEmail,
            string adminRole,
            bool passwordResetPending,
            bool credentialDeliveryPending)
        {
            var config = await tenantDb.TenantConfigs
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.TenantId == tenant.Id && !c.IsDeleted);

            var profile = ReadTenantProfileMetadata(config?.ConfigJson) ?? new TenantProfileMetadata
            {
                Timezone = "Asia/Kolkata",
                Currency = "INR",
                Language = "en"
            };

            profile.DefaultAdminEmail = adminEmail;
            profile.DefaultAdminRole = adminRole;
            profile.PasswordResetPending = passwordResetPending;
            profile.CredentialDeliveryPending = credentialDeliveryPending;

            await SaveTenantProfileToConfigAsync(tenantDb, tenant.Id, profile);
        }

        private async Task PersistTenantRepairMetadataAsync(Tenant tenant, string schema)
        {
            try
            {
                await using var tenantDb = CreateTenantScopedDbContext(tenant.Id, schema);
                var config = await tenantDb.TenantConfigs
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(c => c.TenantId == tenant.Id && !c.IsDeleted);

                var profile = ReadTenantProfileMetadata(config?.ConfigJson) ?? new TenantProfileMetadata
                {
                    Timezone = "Asia/Kolkata",
                    Currency = "INR",
                    Language = "en"
                };

                profile.LastRepairAt = DateTime.UtcNow;
                await SaveTenantProfileToConfigAsync(tenantDb, tenant.Id, profile);
                await tenantDb.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Unable to persist last repair metadata for tenant {TenantId}", tenant.Id);
            }
        }

        private async Task EnsureDefaultCompanyAsync(
            ApplicationDbContext tenantDb,
            Tenant tenant,
            string? companyName,
            string? contactEmail,
            string? contactPhone,
            string? registrationAddress,
            string? state)
        {
            var hasCompany = await tenantDb.Companies
                .IgnoreQueryFilters()
                .AnyAsync(c => c.TenantId == tenant.Id && !c.IsDeleted);

            if (hasCompany)
            {
                return;
            }

            var normalizedName = string.IsNullOrWhiteSpace(companyName)
                ? $"{tenant.Subdomain?.ToUpperInvariant() ?? "TENANT"} Company"
                : companyName.Trim();

            var codeBase = new string(normalizedName
                .Where(char.IsLetterOrDigit)
                .ToArray())
                .ToUpperInvariant();

            if (string.IsNullOrWhiteSpace(codeBase))
            {
                codeBase = "COMP";
            }

            if (codeBase.Length > 8)
            {
                codeBase = codeBase[..8];
            }

            var codeSuffix = tenant.Id.ToString("N")[..4].ToUpperInvariant();
            var companyCode = $"{codeBase}-{codeSuffix}";

            tenantDb.Companies.Add(new Company
            {
                TenantId = tenant.Id,
                Name = normalizedName,
                LegalName = normalizedName,
                Code = companyCode,
                Email = string.IsNullOrWhiteSpace(contactEmail) ? null : contactEmail.Trim(),
                PhoneNumber = string.IsNullOrWhiteSpace(contactPhone) ? null : contactPhone.Trim(),
                RegistrationAddress = string.IsNullOrWhiteSpace(registrationAddress) ? null : registrationAddress.Trim(),
                State = string.IsNullOrWhiteSpace(state) ? null : state.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        private async Task ResetSchemaAsync(string schema)
        {
            var safeSchema = SanitizeSchemaName(schema);
            var sql = $@"
DECLARE @schema sysname = N'{safeSchema}';

IF EXISTS (SELECT 1 FROM sys.schemas WHERE name = @schema)
BEGIN
    DECLARE @dropSql NVARCHAR(MAX) = N'';

    SELECT @dropSql = @dropSql +
        N'ALTER TABLE [' + OBJECT_SCHEMA_NAME(parent_object_id) + N'].[' + OBJECT_NAME(parent_object_id) + N'] DROP CONSTRAINT [' + name + N'];'
    FROM sys.foreign_keys
    WHERE schema_name(schema_id) = @schema;

    IF LEN(@dropSql) > 0 EXEC sp_executesql @dropSql;

    SET @dropSql = N'';
    SELECT @dropSql = @dropSql + N'DROP VIEW [' + s.name + N'].[' + v.name + N'];'
    FROM sys.views v
    JOIN sys.schemas s ON s.schema_id = v.schema_id
    WHERE s.name = @schema;

    IF LEN(@dropSql) > 0 EXEC sp_executesql @dropSql;

    SET @dropSql = N'';
    SELECT @dropSql = @dropSql + N'DROP TABLE [' + s.name + N'].[' + t.name + N'];'
    FROM sys.tables t
    JOIN sys.schemas s ON s.schema_id = t.schema_id
    WHERE s.name = @schema;

    IF LEN(@dropSql) > 0 EXEC sp_executesql @dropSql;

    SET @dropSql = N'';
    SELECT @dropSql = @dropSql + N'DROP SYNONYM [' + s.name + N'].[' + syn.name + N'];'
    FROM sys.synonyms syn
    JOIN sys.schemas s ON s.schema_id = syn.schema_id
    WHERE s.name = @schema;

    IF LEN(@dropSql) > 0 EXEC sp_executesql @dropSql;

    EXEC(N'DROP SCHEMA [' + @schema + N']');
END

EXEC(N'CREATE SCHEMA [' + @schema + N']');";

            await _db.Database.ExecuteSqlRawAsync(sql);
        }

        private static bool IsMissingTenantTableException(Exception ex, string tableName)
        {
            var message = ex.ToString();
            return message.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase)
                && message.Contains($".{tableName}", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsRecoverableTenantSchemaException(Exception ex)
        {
            var message = ex.ToString();
            if (message.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (message.Contains("There is already an object named", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (message.Contains("index or statistics with name", StringComparison.OrdinalIgnoreCase)
                && message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return false;
        }

        private ApplicationDbContext CreateTenantScopedDbContext(Guid tenantId, string schema)
        {
            var tenantAccessor = new TenantAccessor();
            tenantAccessor.SetTenantId(tenantId);
            tenantAccessor.SetTenantSchema(schema);

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlServer(
                    _configuration.GetConnectionString("DefaultConnection")
                    ?? "Server=.;Database=UabIndia_HRMS;Trusted_Connection=True;",
                    sql => sql.MigrationsHistoryTable("__EFMigrationsHistory", schema)
                )
                .ReplaceService<IModelCacheKeyFactory, TenantModelCacheKeyFactory>()
                .Options;

            return new ApplicationDbContext(options, tenantAccessor, _encryptionService);
        }

        private static string[] NormalizeModuleKeys(IEnumerable<string>? modules)
        {
            if (modules == null)
            {
                return Array.Empty<string>();
            }

            return modules
                .Where(m => !string.IsNullOrWhiteSpace(m))
                .Select(m => m.Trim().ToLowerInvariant())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }

        private static string ResolveTenantStatus(string? status, bool isActive)
        {
            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalized = status.Trim().ToLowerInvariant();
                if (normalized is "active" or "inactive" or "suspended" or "trial")
                {
                    return normalized;
                }
            }

            return isActive ? "active" : "inactive";
        }

        private string ResolveAdminRoleName(string? adminRole)
        {
            return _roleMappingResolver.ResolveAdminRole(adminRole);
        }

        private static bool ResolveTenantActivationFlag(string? status)
        {
            var normalized = ResolveTenantStatus(status, true);
            return normalized is "active" or "trial";
        }

        private static string BuildTemporaryPassword()
        {
            return $"Tmp@{Guid.NewGuid():N}"[..18];
        }

        private async Task<TenantProfileMetadata> BuildTenantProfileMetadataAsync(
            ApplicationDbContext tenantDb,
            Tenant tenant,
            UpdateTenantDto? update,
            CreateTenantDto? create)
        {
            var config = await tenantDb.TenantConfigs
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.TenantId == tenant.Id && !c.IsDeleted);

            var existing = ReadTenantProfileMetadata(config?.ConfigJson) ?? new TenantProfileMetadata
            {
                Timezone = "Asia/Kolkata",
                Currency = "INR",
                Language = "en"
            };

            if (create != null)
            {
                existing.Status = ResolveTenantStatus(create.Status, tenant.IsActive);
                existing.SubscriptionPlan = string.IsNullOrWhiteSpace(create.SubscriptionPlan) ? "Basic" : create.SubscriptionPlan.Trim();
                existing.Address = create.Address;
                existing.State = create.State;
                existing.District = create.District;
                existing.Pincode = create.Pincode;
                existing.ContactNumber = create.ContactNumber;
                existing.GstNumber = create.GstNumber;
                existing.PanNumber = create.PanNumber;
                existing.LogoUrl = create.LogoUrl;
                existing.Timezone = string.IsNullOrWhiteSpace(create.Timezone) ? "Asia/Kolkata" : create.Timezone.Trim();
                existing.Currency = string.IsNullOrWhiteSpace(create.Currency) ? "INR" : create.Currency.Trim().ToUpperInvariant();
                existing.Language = string.IsNullOrWhiteSpace(create.Language) ? "en" : create.Language.Trim();
                existing.BillingStartDate = create.BillingStartDate;
                existing.BillingEndDate = create.BillingEndDate;
                existing.TrialExpiryDate = create.TrialExpiryDate;
                existing.EmployeeLimit = create.EmployeeLimit;
                existing.StorageLimitGb = create.StorageLimitGb;
                existing.SmsCredits = create.SmsCredits;
                existing.WhatsAppIntegrationEnabled = create.WhatsAppIntegrationEnabled;
                existing.SmtpHost = NormalizeOptionalText(create.SmtpHost);
                existing.SmtpPort = create.SmtpPort;
                existing.SmtpUsername = NormalizeOptionalText(create.SmtpUsername);
                existing.SmtpPasswordEncrypted = EncryptOptionalSecret(create.SmtpPassword);
                existing.SmtpFromEmail = NormalizeOptionalText(create.SmtpFromEmail);
                existing.CustomDomain = NormalizeOptionalHost(create.CustomDomain);
                existing.WhiteLabelEnabled = create.WhiteLabelEnabled;
                existing.InviteFlowEnabled = create.SendInviteLink;
            }

            if (update != null)
            {
                if (!string.IsNullOrWhiteSpace(update.Status)) existing.Status = ResolveTenantStatus(update.Status, tenant.IsActive);
                if (!string.IsNullOrWhiteSpace(update.SubscriptionPlan)) existing.SubscriptionPlan = update.SubscriptionPlan.Trim();
                if (update.Address != null) existing.Address = update.Address;
                if (update.State != null) existing.State = update.State;
                if (update.District != null) existing.District = update.District;
                if (update.Pincode != null) existing.Pincode = update.Pincode;
                if (update.ContactNumber != null) existing.ContactNumber = update.ContactNumber;
                if (update.GstNumber != null) existing.GstNumber = update.GstNumber;
                if (update.PanNumber != null) existing.PanNumber = update.PanNumber;
                if (update.LogoUrl != null) existing.LogoUrl = update.LogoUrl;
                if (!string.IsNullOrWhiteSpace(update.Timezone)) existing.Timezone = update.Timezone.Trim();
                if (!string.IsNullOrWhiteSpace(update.Currency)) existing.Currency = update.Currency.Trim().ToUpperInvariant();
                if (!string.IsNullOrWhiteSpace(update.Language)) existing.Language = update.Language.Trim();
                if (update.BillingStartDate.HasValue) existing.BillingStartDate = update.BillingStartDate;
                if (update.BillingEndDate.HasValue) existing.BillingEndDate = update.BillingEndDate;
                if (update.TrialExpiryDate.HasValue) existing.TrialExpiryDate = update.TrialExpiryDate;
                if (update.EmployeeLimit.HasValue) existing.EmployeeLimit = update.EmployeeLimit;
                if (update.StorageLimitGb.HasValue) existing.StorageLimitGb = update.StorageLimitGb;
                if (update.SmsCredits.HasValue) existing.SmsCredits = update.SmsCredits;
                if (update.WhatsAppIntegrationEnabled.HasValue) existing.WhatsAppIntegrationEnabled = update.WhatsAppIntegrationEnabled.Value;
                if (update.SmtpHost != null) existing.SmtpHost = NormalizeOptionalText(update.SmtpHost);
                if (update.SmtpPort.HasValue) existing.SmtpPort = update.SmtpPort;
                if (update.SmtpUsername != null) existing.SmtpUsername = NormalizeOptionalText(update.SmtpUsername);
                if (update.SmtpPassword != null) existing.SmtpPasswordEncrypted = EncryptOptionalSecret(update.SmtpPassword);
                if (update.SmtpFromEmail != null) existing.SmtpFromEmail = NormalizeOptionalText(update.SmtpFromEmail);
                if (update.CustomDomain != null) existing.CustomDomain = NormalizeOptionalHost(update.CustomDomain);
                if (update.WhiteLabelEnabled.HasValue) existing.WhiteLabelEnabled = update.WhiteLabelEnabled.Value;
            }

            return existing;
        }

        private static TenantProfileMetadata? ReadTenantProfileMetadata(string? configJson)
        {
            try
            {
                var root = JsonNode.Parse(string.IsNullOrWhiteSpace(configJson) ? "{}" : configJson) as JsonObject;
                var node = root?["tenantProfile"];
                return node == null ? null : node.Deserialize<TenantProfileMetadata>();
            }
            catch
            {
                return null;
            }
        }

        private static async Task SaveTenantProfileToConfigAsync(ApplicationDbContext tenantDb, Guid tenantId, TenantProfileMetadata profile)
        {
            var config = await tenantDb.TenantConfigs
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted);

            JsonObject root;
            try
            {
                root = JsonNode.Parse(string.IsNullOrWhiteSpace(config?.ConfigJson) ? "{}" : config!.ConfigJson) as JsonObject
                    ?? new JsonObject();
            }
            catch
            {
                root = new JsonObject();
            }

            root["tenantProfile"] = JsonSerializer.SerializeToNode(profile, new JsonSerializerOptions
            {
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            });

            if (config == null)
            {
                config = new TenantConfig
                {
                    TenantId = tenantId,
                    ConfigJson = root.ToJsonString(),
                    UiSchemaJson = "{}",
                    WorkflowJson = "{}",
                    BrandingJson = "{}"
                };
                tenantDb.TenantConfigs.Add(config);
            }
            else
            {
                config.ConfigJson = root.ToJsonString();
            }

            config.CustomDomain = TenantResolutionService.NormalizeHost(profile.CustomDomain);
            if (string.IsNullOrWhiteSpace(config.CustomDomain))
            {
                config.CustomDomain = null;
            }
        }

        private string? EncryptOptionalSecret(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return _encryptionService.Encrypt(value);
        }

        private static string? NormalizeOptionalText(string? value)
        {
            var normalized = value?.Trim();
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        private static string? NormalizeOptionalHost(string? value)
        {
            var normalized = TenantResolutionService.NormalizeHost(value);
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        private sealed class TenantProfileMetadata
        {
            public string? Status { get; set; }
            public string? SubscriptionPlan { get; set; }
            public string? Address { get; set; }
            public string? State { get; set; }
            public string? District { get; set; }
            public string? Pincode { get; set; }
            public string? ContactNumber { get; set; }
            public string? GstNumber { get; set; }
            public string? PanNumber { get; set; }
            public string? LogoUrl { get; set; }
            public string? Timezone { get; set; }
            public string? Currency { get; set; }
            public string? Language { get; set; }
            public DateTime? BillingStartDate { get; set; }
            public DateTime? BillingEndDate { get; set; }
            public DateTime? TrialExpiryDate { get; set; }
            public int? EmployeeLimit { get; set; }
            public int? StorageLimitGb { get; set; }
            public int? SmsCredits { get; set; }
            public bool WhatsAppIntegrationEnabled { get; set; }
            public string? SmtpHost { get; set; }
            public int? SmtpPort { get; set; }
            public string? SmtpUsername { get; set; }
            public string? SmtpPasswordEncrypted { get; set; }
            public string? SmtpFromEmail { get; set; }
            public string? CustomDomain { get; set; }
            public bool WhiteLabelEnabled { get; set; }
            public bool InviteFlowEnabled { get; set; }
            public string? DefaultAdminEmail { get; set; }
            public string? DefaultAdminRole { get; set; }
            public bool PasswordResetPending { get; set; }
            public bool CredentialDeliveryPending { get; set; }
            public DateTime? LastRepairAt { get; set; }
        }

        private sealed class AdminEnsureResult
        {
            public string EffectiveAdminEmail { get; set; } = string.Empty;
            public string EffectiveAdminRole { get; set; } = string.Empty;
            public bool UsedFallbackEmail { get; set; }
            public string? GeneratedPassword { get; set; }
        }

        public sealed class TenantProvisioningSnapshotDto
        {
            public Guid TenantId { get; set; }
            public string TenantName { get; set; } = string.Empty;
            public string Subdomain { get; set; } = string.Empty;
            public string Status { get; set; } = "pending";
            public bool SchemaExists { get; set; }
            public bool CoreTablesReady { get; set; }
            public int UsersCount { get; set; }
            public bool AdminRoleAssigned { get; set; }
            public DateTime? UpdatedAt { get; set; }
            public string TemplateSchema { get; set; } = string.Empty;
            public string TemplateVersion { get; set; } = string.Empty;
            public string TemplateChecksumConfigured { get; set; } = string.Empty;
            public string TemplateChecksumComputed { get; set; } = string.Empty;
            public bool TemplateChecksumValid { get; set; }
        }

        public sealed class TenantHealthSnapshotDto
        {
            public Guid TenantId { get; set; }
            public string TenantName { get; set; } = string.Empty;
            public string Subdomain { get; set; } = string.Empty;
            public string ProvisionStatus { get; set; } = ProvisionStates.Pending;
            public string SchemaName { get; set; } = string.Empty;
            public bool SchemaExists { get; set; }
            public bool HasAllCoreTables { get; set; }
            public string[] MissingTables { get; set; } = Array.Empty<string>();
            public int UsersCount { get; set; }
            public bool HasAdminUser { get; set; }
            public bool HasAdminRole { get; set; }
            public bool HasAdminRoleMapping { get; set; }
            public string AdminEmail { get; set; } = string.Empty;
            public DateTime? AdminLastLoginAt { get; set; }
            public bool PasswordResetPending { get; set; }
            public DateTime? UpdatedAt { get; set; }
        }

        public sealed class TenantProvisionLogEntryDto
        {
            public Guid Id { get; set; }
            public Guid TenantId { get; set; }
            public string StepName { get; set; } = string.Empty;
            public string Status { get; set; } = string.Empty;
            public string? ErrorMessage { get; set; }
            public long DurationMs { get; set; }
            public DateTime CreatedAt { get; set; }
            public string CorrelationId { get; set; } = string.Empty;
        }

        private sealed class TemplateGovernanceSnapshot
        {
            public string TemplateSchema { get; set; } = string.Empty;
            public string TemplateVersion { get; set; } = string.Empty;
            public string TemplateChecksumConfigured { get; set; } = string.Empty;
            public string TemplateChecksumComputed { get; set; } = string.Empty;
            public bool TemplateChecksumValid { get; set; }
        }

        private async Task<TemplateGovernanceSnapshot> BuildTemplateGovernanceSnapshotAsync()
        {
            var templateSchema = SanitizeSchemaName(_configuration["TenantProvisioning:TemplateSchema"] ?? "dbo");
            var templateVersion = _configuration["TenantProvisioning:TemplateGovernance:TemplateVersion"] ?? "unversioned";
            var configuredChecksum = _configuration["TenantProvisioning:TemplateGovernance:TemplateChecksum"] ?? string.Empty;
            var computedChecksum = await ComputeTemplateSchemaChecksumAsync(templateSchema);

            var checksumValid = string.IsNullOrWhiteSpace(configuredChecksum)
                || string.Equals(configuredChecksum.Trim(), computedChecksum, StringComparison.OrdinalIgnoreCase);

            return new TemplateGovernanceSnapshot
            {
                TemplateSchema = templateSchema,
                TemplateVersion = templateVersion,
                TemplateChecksumConfigured = configuredChecksum,
                TemplateChecksumComputed = computedChecksum,
                TemplateChecksumValid = checksumValid
            };
        }

        private async Task<string> ComputeTemplateSchemaChecksumAsync(string schema)
        {
            const string hashSql = @"
SELECT CONVERT(varchar(64), HASHBYTES('SHA2_256',
    CAST(COALESCE(STRING_AGG(
        CAST(CONCAT(t.name, ':', c.name, ':', ty.name, ':', c.max_length, ':', c.is_nullable) AS nvarchar(max)),
        '|'
    ) WITHIN GROUP (ORDER BY t.name, c.column_id), @schema) AS nvarchar(max))
), 2)
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
JOIN sys.columns c ON c.object_id = t.object_id
JOIN sys.types ty ON ty.user_type_id = c.user_type_id
WHERE s.name = @schema;";

            var hash = await ExecuteScalarStringAsync(hashSql, ("@schema", schema));
            if (!string.IsNullOrWhiteSpace(hash))
            {
                return hash;
            }

            const string signatureSql = @"
SELECT STRING_AGG(
    CAST(CONCAT(t.name, ':', c.name, ':', ty.name, ':', c.max_length, ':', c.is_nullable) AS nvarchar(max)),
    '|'
) WITHIN GROUP (ORDER BY t.name, c.column_id)
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
JOIN sys.columns c ON c.object_id = t.object_id
JOIN sys.types ty ON ty.user_type_id = c.user_type_id
WHERE s.name = @schema;";

            var signature = await ExecuteScalarStringAsync(signatureSql, ("@schema", schema));
            var payload = string.IsNullOrWhiteSpace(signature) ? schema : signature;

            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
            return Convert.ToHexString(bytes);
        }

        private async Task<string?> ExecuteScalarStringAsync(string sql, params (string Name, object Value)[] parameters)
        {
            var connection = _db.Database.GetDbConnection();
            var shouldClose = connection.State != ConnectionState.Open;
            if (shouldClose)
            {
                await _db.Database.OpenConnectionAsync();
            }

            try
            {
                await using var command = connection.CreateCommand();
                command.CommandText = sql;
                foreach (var parameter in parameters)
                {
                    var param = command.CreateParameter();
                    param.ParameterName = parameter.Name;
                    param.Value = parameter.Value;
                    command.Parameters.Add(param);
                }

                var result = await command.ExecuteScalarAsync();
                return result?.ToString();
            }
            finally
            {
                if (shouldClose)
                {
                    await _db.Database.CloseConnectionAsync();
                }
            }
        }

        private async Task<List<string>> ExecuteStringListAsync(string sql, params (string Name, object Value)[] parameters)
        {
            var connection = _db.Database.GetDbConnection();
            var shouldClose = connection.State != ConnectionState.Open;
            if (shouldClose)
            {
                await _db.Database.OpenConnectionAsync();
            }

            try
            {
                await using var command = connection.CreateCommand();
                command.CommandText = sql;
                foreach (var parameter in parameters)
                {
                    var param = command.CreateParameter();
                    param.ParameterName = parameter.Name;
                    param.Value = parameter.Value;
                    command.Parameters.Add(param);
                }

                var results = new List<string>();
                await using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    if (!reader.IsDBNull(0))
                    {
                        results.Add(reader.GetString(0));
                    }
                }

                return results;
            }
            finally
            {
                if (shouldClose)
                {
                    await _db.Database.CloseConnectionAsync();
                }
            }
        }

        private async Task PersistProvisioningRecoverySnapshotAsync(
            Guid tenantId,
            string action,
            string provisioningState,
            string detail,
            string? schema,
            string? recoveryReason = null)
        {
            try
            {
                var effectiveSchema = string.IsNullOrWhiteSpace(schema)
                    ? BuildSchemaName(tenantId.ToString("N"), tenantId)
                    : schema;

                var governance = await BuildTemplateGovernanceSnapshotAsync();
                var schemaSnapshot = await BuildSchemaSnapshotAsync(effectiveSchema);

                var existingConfig = await _db.TenantConfigs
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted);

                JsonObject root;
                try
                {
                    root = JsonNode.Parse(string.IsNullOrWhiteSpace(existingConfig?.ConfigJson) ? "{}" : existingConfig!.ConfigJson) as JsonObject
                        ?? new JsonObject();
                }
                catch
                {
                    root = new JsonObject();
                }

                var recovery = root["provisioningRecovery"] as JsonObject ?? new JsonObject();
                recovery["state"] = provisioningState;
                recovery["lastAction"] = action;
                recovery["lastDetail"] = detail;
                recovery["lastUpdatedAtUtc"] = DateTime.UtcNow;
                recovery["schema"] = SanitizeSchemaName(effectiveSchema);
                recovery["templateVersion"] = governance.TemplateVersion;
                recovery["templateChecksumConfigured"] = governance.TemplateChecksumConfigured;
                recovery["templateChecksumComputed"] = governance.TemplateChecksumComputed;
                recovery["templateChecksumValid"] = governance.TemplateChecksumValid;
                recovery["schemaSnapshot"] = schemaSnapshot;

                var recoveryLogs = recovery["recoveryLogs"] as JsonArray ?? new JsonArray();
                recoveryLogs.Add(new JsonObject
                {
                    ["timestampUtc"] = DateTime.UtcNow,
                    ["action"] = action,
                    ["state"] = provisioningState,
                    ["detail"] = detail,
                    ["reason"] = string.IsNullOrWhiteSpace(recoveryReason) ? null : recoveryReason
                });

                while (recoveryLogs.Count > 25)
                {
                    recoveryLogs.RemoveAt(0);
                }

                recovery["recoveryLogs"] = recoveryLogs;
                root["provisioningRecovery"] = recovery;
                var configJson = root.ToJsonString();

                if (existingConfig == null)
                {
                    await _db.Database.ExecuteSqlRawAsync(
                        @"INSERT INTO [dbo].[TenantConfigs] ([Id], [TenantId], [BusinessId], [ConfigJson], [UiSchemaJson], [WorkflowJson], [BrandingJson], [CreatedAt], [UpdatedAt], [CreatedBy], [IsDeleted])
                          VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10})",
                        Guid.NewGuid(),
                        tenantId,
                                                DBNull.Value,
                        configJson,
                        "{}",
                        "{}",
                        "{}",
                        DateTime.UtcNow,
                        DateTime.UtcNow,
                                                DBNull.Value,
                        false);
                }
                else
                {
                    await _db.Database.ExecuteSqlRawAsync(
                        "UPDATE [dbo].[TenantConfigs] SET [ConfigJson] = {0}, [UpdatedAt] = {1} WHERE [Id] = {2}",
                        configJson,
                        DateTime.UtcNow,
                        existingConfig.Id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to persist provisioning recovery snapshot for tenant {TenantId}", tenantId);
            }
        }

        private async Task<JsonObject> BuildSchemaSnapshotAsync(string schema)
        {
            var safeSchema = SanitizeSchemaName(schema);

            const string tableCountSql = @"
SELECT COUNT(1)
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = @schema;";

            const string tableListSql = @"
SELECT STRING_AGG(CAST(t.name AS nvarchar(max)), ',') WITHIN GROUP (ORDER BY t.name)
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = @schema;";

            var tableCount = await ExecuteScalarAsync(tableCountSql, ("@schema", safeSchema));
            var tableList = await ExecuteScalarStringAsync(tableListSql, ("@schema", safeSchema));

            var tables = new JsonArray();
            if (!string.IsNullOrWhiteSpace(tableList))
            {
                foreach (var table in tableList.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    tables.Add(table);
                }
            }

            return new JsonObject
            {
                ["schema"] = safeSchema,
                ["tableCount"] = tableCount,
                ["tables"] = tables
            };
        }

        private static string BuildSchemaName(string? subdomain, Guid tenantId)
        {
            var baseName = !string.IsNullOrWhiteSpace(subdomain)
                ? SanitizeSchemaName(subdomain)
                : tenantId.ToString("N");

            return $"tenant_{baseName}";
        }

        private static string SanitizeSchemaName(string input)
        {
            var span = input.Trim().ToLowerInvariant();
            var buffer = new char[span.Length];
            var idx = 0;
            foreach (var ch in span)
            {
                if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '_')
                {
                    buffer[idx++] = ch;
                }
                else if (ch == '-' || ch == '.')
                {
                    buffer[idx++] = '_';
                }
            }

            if (idx == 0)
            {
                return "default";
            }

            return new string(buffer, 0, idx);
        }
    }
}
