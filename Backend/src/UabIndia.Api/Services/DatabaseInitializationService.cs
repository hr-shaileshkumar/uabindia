using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Services
{
    /// <summary>
    /// Runs once on startup (all environments).
    /// 1. Ensures the database exists (creates if missing).
    /// 2. Applies all pending EF Core migrations.
    /// 3. Seeds default tenant, roles, modules, permissions and SuperAdmin user if none exist.
    ///
    /// Seeding is fully idempotent: each step checks before inserting.
    /// Schema version constant below controls when re-seed logic upgrades.
    /// </summary>
    public class DatabaseInitializationService : IHostedService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DatabaseInitializationService> _logger;
        private readonly IHostEnvironment _env;

        /// <summary>
        /// Increment this constant to trigger re-seeding of permissions/modules
        /// on next startup (e.g. when new modules are added).
        /// Old permission rows are NOT deleted — only missing ones are inserted.
        /// </summary>
        private const string SeedSchemaVersion = "v2";

        // Maximum number of tenants to back-fill on startup.
        // For larger deployments, run seeding via migration or a dedicated job.
        private const int TenantSeedBatchLimit = 50;

        // Default modules that every tenant gets
        private static readonly (string Key, string Name)[] DefaultModules =
        {
            ("erp",       "ERP SaaS Platform"),
            ("hrms",      "HRMS"),
            ("payroll",   "Payroll"),
            ("reports",   "Reports"),
            ("platform",  "Platform / Core"),
            ("licensing", "Modules & Licensing"),
            ("security",  "Authentication & Security"),
        };

        /// <summary>
        /// Default permission definitions and the roles that receive them.
        /// Key format: Module + Action pair.  Action "access" = gate for ModuleEnabledHandler.
        /// </summary>
        private static readonly (string Module, string Action, string Description, string[] Roles)[] DefaultPermissions =
        {
            // ── Admin-only modules ────────────────────────────────────────────────
            ("platform",  "access", "Access the Platform / Core admin area",    new[] { "SuperAdmin", "Admin" }),
            ("licensing", "access", "Access Modules & Licensing management",     new[] { "SuperAdmin", "Admin" }),
            ("security",  "access", "Access Security & Identity management",     new[] { "SuperAdmin", "Admin" }),

            // ── Business modules — broader access ─────────────────────────────────
            ("erp",     "access", "Access the ERP SaaS platform shell",     new[] { "SuperAdmin", "Admin", "HR Manager", "Manager", "Accountant", "Employee" }),
            ("hrms",    "access", "Access HRMS module",           new[] { "SuperAdmin", "Admin", "HR Manager", "Manager", "Employee" }),
            ("payroll", "access", "Access Payroll module",        new[] { "SuperAdmin", "Admin", "HR Manager", "Accountant" }),
            ("reports", "access", "Access Reports module",        new[] { "SuperAdmin", "Admin", "HR Manager", "Manager", "Accountant" }),
        };

        public DatabaseInitializationService(
            IServiceProvider serviceProvider,
            ILogger<DatabaseInitializationService> logger,
            IHostEnvironment env)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _env = env;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("DatabaseInitializationService: starting (schema version {Version})…", SeedSchemaVersion);
            try
            {
                await InitializeAsync(cancellationToken);
                _logger.LogInformation("DatabaseInitializationService: initialization complete.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DatabaseInitializationService: initialization failed. Application may not work correctly.");
                // Do not throw — let the app start so health checks can report the issue.
            }
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

        private async Task InitializeAsync(CancellationToken ct)
        {
            using var scope = _serviceProvider.CreateScope();
            var db             = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasher         = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
            var tenantAccessor = scope.ServiceProvider.GetRequiredService<ITenantAccessor>();

            // ── Step 1: Apply pending migrations ────────────────────────────────────
            _logger.LogInformation("Applying database migrations…");
            await db.Database.MigrateAsync(ct);
            await UabIndia.Infrastructure.Data.Migrations.MigrationBootstrap.EnsureInitialCleanSchemaAsync(
                db, _logger, ct);
            _logger.LogInformation("Database migrations applied.");

            // ── Step 2: Seed global modules (non-tenant-specific) ────────────────────
            await EnsureGlobalModulesAsync(db, ct);

            // ── Step 1b: Apply raw schema patches (idempotent column additions) ───────
            await EnsureProjectSchemaAsync(db, ct);

            // ── Step 3: Check if any tenant already exists ───────────────────────────
            var anyTenant = await db.Tenants.AnyAsync(ct);
            if (anyTenant)
            {
                _logger.LogInformation("Tenants already exist — running back-fill for existing tenants…");

                var allTenantIds = await db.Tenants
                    .AsNoTracking()
                    .Where(t => t.IsActive && t.Id != Guid.Empty)
                    .Select(t => t.Id)
                    .ToListAsync(ct);

                if (allTenantIds.Count > TenantSeedBatchLimit)
                {
                    _logger.LogWarning(
                        "Tenant count ({Count}) exceeds startup seed limit ({Limit}). " +
                        "Only the most-recently active tenants will be back-filled. " +
                        "Run a dedicated seeding migration for the remaining tenants.",
                        allTenantIds.Count, TenantSeedBatchLimit);
                    allTenantIds = allTenantIds.Take(TenantSeedBatchLimit).ToList();
                }

                foreach (var tid in allTenantIds)
                {
                    await EnsureTenantModulesAsync(db, tid, ct);

                    // Fetch the tenant's roles to back-fill permissions
                    var tenantRoles = await db.Roles
                        .AsNoTracking()
                        .Where(r => r.TenantId == tid && !r.IsDeleted)
                        .ToListAsync(ct);

                    await EnsurePermissionsAsync(db, tid, tenantRoles, ct);
                }
                return;
            }

            _logger.LogInformation("No tenants found — seeding default system tenant…");

            // ── Step 4: Create default tenant ───────────────────────────────────────
            var defaultSubdomain = _env.IsProduction() ? "default" : "api";
            var tenant = new Tenant
            {
                Subdomain = defaultSubdomain,
                Name      = "Default Organization",
                IsActive  = true
            };
            db.Tenants.Add(tenant);
            await db.SaveChangesAsync(ct);

            tenantAccessor.SetTenantId(tenant.Id);
            tenantAccessor.SetTenantSchema($"tenant_{tenant.Subdomain}");

            // ── Step 5: Create default roles ────────────────────────────────────────
            var rolesToSeed = new[]
            {
                new Role { TenantId = tenant.Id, Name = "SuperAdmin",  Description = "System super administrator — unrestricted access" },
                new Role { TenantId = tenant.Id, Name = "Admin",       Description = "Tenant administrator" },
                new Role { TenantId = tenant.Id, Name = "HR Manager",  Description = "Human Resources manager" },
                new Role { TenantId = tenant.Id, Name = "Accountant",  Description = "Finance and accounts" },
                new Role { TenantId = tenant.Id, Name = "Manager",     Description = "Department manager" },
                new Role { TenantId = tenant.Id, Name = "Employee",    Description = "Standard employee" },
            };
            db.Roles.AddRange(rolesToSeed);
            await db.SaveChangesAsync(ct);

            var superAdminRole = rolesToSeed.First(r => r.Name == "SuperAdmin");
            var adminRole      = rolesToSeed.First(r => r.Name == "Admin");

            // ── Step 6: Create default SuperAdmin user ───────────────────────────────
            var adminEmail    = Environment.GetEnvironmentVariable("SEED_ADMIN_EMAIL")    ?? "admin@erp.local";
            var adminPassword = Environment.GetEnvironmentVariable("SEED_ADMIN_PASSWORD") ?? "Admin@123";
            var adminName     = Environment.GetEnvironmentVariable("SEED_ADMIN_NAME")     ?? "System Administrator";

            var adminUser = new User
            {
                TenantId      = tenant.Id,
                Email         = adminEmail,
                FullName      = adminName,
                IsSystemAdmin = true,
                IsActive      = true
            };
            adminUser.PasswordHash = hasher.HashPassword(adminUser, adminPassword);
            db.Users.Add(adminUser);
            await db.SaveChangesAsync(ct);

            db.UserRoles.AddRange(
                new UserRole { TenantId = tenant.Id, UserId = adminUser.Id, RoleId = superAdminRole.Id },
                new UserRole { TenantId = tenant.Id, UserId = adminUser.Id, RoleId = adminRole.Id }
            );
            await db.SaveChangesAsync(ct);

            _logger.LogInformation("SuperAdmin created: {Email}", adminEmail);

            // ── Step 7: Seed modules + permissions for default tenant ─────────────────
            await EnsureTenantModulesAsync(db, tenant.Id, ct);
            await EnsurePermissionsAsync(db, tenant.Id, rolesToSeed, ct);

            _logger.LogInformation("Default seed complete. Tenant: {TenantId}, SuperAdmin: {Email}", tenant.Id, adminEmail);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // Private helpers
        // ─────────────────────────────────────────────────────────────────────────

        /// <summary>
        /// Idempotently adds extended project-management columns to dbo.Projects.
        /// Each column is guarded by IF COL_LENGTH so it is safe to run on every startup.
        /// </summary>
        private async Task EnsureProjectSchemaAsync(ApplicationDbContext db, CancellationToken ct)
        {
            _logger.LogInformation("Ensuring extended project schema columns…");
            try
            {
                var columnAlters = new[]
                {
                    ("ProjectCode",          "IF COL_LENGTH('dbo.Projects','ProjectCode') IS NULL ALTER TABLE dbo.Projects ADD ProjectCode NVARCHAR(50) NOT NULL DEFAULT ''"),
                    ("Description",          "IF COL_LENGTH('dbo.Projects','Description') IS NULL ALTER TABLE dbo.Projects ADD Description NVARCHAR(MAX) NULL"),
                    ("ProjectType",          "IF COL_LENGTH('dbo.Projects','ProjectType') IS NULL ALTER TABLE dbo.Projects ADD ProjectType NVARCHAR(50) NOT NULL DEFAULT 'Internal'"),
                    ("Priority",             "IF COL_LENGTH('dbo.Projects','Priority') IS NULL ALTER TABLE dbo.Projects ADD Priority NVARCHAR(20) NOT NULL DEFAULT 'Medium'"),
                    ("Status",               "IF COL_LENGTH('dbo.Projects','Status') IS NULL ALTER TABLE dbo.Projects ADD Status NVARCHAR(30) NOT NULL DEFAULT 'Planned'"),
                    ("StartDate",            "IF COL_LENGTH('dbo.Projects','StartDate') IS NULL ALTER TABLE dbo.Projects ADD StartDate DATETIME2 NULL"),
                    ("EndDate",              "IF COL_LENGTH('dbo.Projects','EndDate') IS NULL ALTER TABLE dbo.Projects ADD EndDate DATETIME2 NULL"),
                    ("ActualStartDate",      "IF COL_LENGTH('dbo.Projects','ActualStartDate') IS NULL ALTER TABLE dbo.Projects ADD ActualStartDate DATETIME2 NULL"),
                    ("ActualEndDate",        "IF COL_LENGTH('dbo.Projects','ActualEndDate') IS NULL ALTER TABLE dbo.Projects ADD ActualEndDate DATETIME2 NULL"),
                    ("Budget",               "IF COL_LENGTH('dbo.Projects','Budget') IS NULL ALTER TABLE dbo.Projects ADD Budget DECIMAL(18,2) NULL"),
                    ("ActualCost",           "IF COL_LENGTH('dbo.Projects','ActualCost') IS NULL ALTER TABLE dbo.Projects ADD ActualCost DECIMAL(18,2) NULL"),
                    ("CurrencyCode",         "IF COL_LENGTH('dbo.Projects','CurrencyCode') IS NULL ALTER TABLE dbo.Projects ADD CurrencyCode CHAR(3) NOT NULL DEFAULT 'INR'"),
                    ("ClientName",           "IF COL_LENGTH('dbo.Projects','ClientName') IS NULL ALTER TABLE dbo.Projects ADD ClientName NVARCHAR(256) NULL"),
                    ("ContractNumber",       "IF COL_LENGTH('dbo.Projects','ContractNumber') IS NULL ALTER TABLE dbo.Projects ADD ContractNumber NVARCHAR(100) NULL"),
                    ("BillingType",          "IF COL_LENGTH('dbo.Projects','BillingType') IS NULL ALTER TABLE dbo.Projects ADD BillingType NVARCHAR(30) NULL"),
                    ("CompletionPercentage", "IF COL_LENGTH('dbo.Projects','CompletionPercentage') IS NULL ALTER TABLE dbo.Projects ADD CompletionPercentage INT NOT NULL DEFAULT 0"),
                    ("ProjectManagerId",     "IF COL_LENGTH('dbo.Projects','ProjectManagerId') IS NULL ALTER TABLE dbo.Projects ADD ProjectManagerId UNIQUEIDENTIFIER NULL"),
                    ("Location",             "IF COL_LENGTH('dbo.Projects','Location') IS NULL ALTER TABLE dbo.Projects ADD Location NVARCHAR(256) NULL"),
                    ("UpdatedBy",            "IF COL_LENGTH('dbo.Projects','UpdatedBy') IS NULL ALTER TABLE dbo.Projects ADD UpdatedBy UNIQUEIDENTIFIER NULL"),
                };

                foreach (var (col, sql) in columnAlters)
                {
                    try { await db.Database.ExecuteSqlRawAsync(sql, ct); }
                    catch (Exception colEx) { _logger.LogWarning(colEx, "Could not add column {Col} to Projects (may already exist).", col); }
                }

                await db.Database.ExecuteSqlRawAsync(
                    "UPDATE dbo.Projects SET Status = CASE WHEN IsActive = 1 THEN 'Active' ELSE 'Hold' END WHERE Status = 'Planned' AND CreatedAt < SYSUTCDATETIME()", ct);

                await db.Database.ExecuteSqlRawAsync(
                    "UPDATE dbo.Projects SET ProjectCode = 'PRJ-' + UPPER(LEFT(REPLACE(CAST(Id AS NVARCHAR(36)),'-',''),6)) WHERE ProjectCode = ''", ct);

                _logger.LogInformation("Extended project schema columns ensured.");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "EnsureProjectSchemaAsync encountered an error (non-fatal). Projects page may show limited data until schema is updated.");
            }
        }

        /// <summary>Ensures all global (non-tenant) module catalog rows exist.</summary>
        private async Task EnsureGlobalModulesAsync(ApplicationDbContext db, CancellationToken ct)
        {
            var existingKeys = new HashSet<string>(
                await db.Modules.AsNoTracking().Select(m => m.ModuleKey).ToListAsync(ct));

            var toAdd = DefaultModules
                .Where(m => !existingKeys.Contains(m.Key))
                .Select(m => new Module { ModuleKey = m.Key, Name = m.Name, IsEnabled = true, Version = "1.0.0" })
                .ToList();

            if (toAdd.Count > 0)
            {
                db.Modules.AddRange(toAdd);
                await db.SaveChangesAsync(ct);
                _logger.LogInformation("Seeded {Count} global module(s): {Keys}", toAdd.Count, string.Join(", ", toAdd.Select(m => m.ModuleKey)));
            }
        }

        /// <summary>Ensures every default module has a TenantModule row (enabled) for the given tenant.</summary>
        private async Task EnsureTenantModulesAsync(ApplicationDbContext db, Guid tenantId, CancellationToken ct)
        {
            var existingKeys = new HashSet<string>(
                await db.TenantModules.AsNoTracking()
                    .IgnoreQueryFilters()
                    .Where(tm => tm.TenantId == tenantId && !tm.IsDeleted)
                    .Select(tm => tm.ModuleKey)
                    .ToListAsync(ct));

            var toAdd = DefaultModules
                .Where(m => !existingKeys.Contains(m.Key))
                .Select(m => new TenantModule { TenantId = tenantId, ModuleKey = m.Key, IsEnabled = true })
                .ToList();

            if (toAdd.Count > 0)
            {
                db.TenantModules.AddRange(toAdd);
                await db.SaveChangesAsync(ct);
                _logger.LogInformation("Enabled {Count} module(s) for tenant {TenantId}", toAdd.Count, tenantId);
            }
        }

        /// <summary>
        /// Idempotent: seeds Permission rows and RolePermission mappings for a tenant.
        /// Uses (Module + Action) as the natural key for deduplication.
        /// Re-running is safe — only missing rows are inserted.
        /// </summary>
        private async Task EnsurePermissionsAsync(ApplicationDbContext db, Guid tenantId, IEnumerable<Role> tenantRoles, CancellationToken ct)
        {
            var roleByName = tenantRoles.ToDictionary(r => r.Name, StringComparer.OrdinalIgnoreCase);

            // Load existing permissions for this tenant keyed by "Module:Action"
            var existingPerms = await db.Permissions
                .AsNoTracking()
                .Where(p => p.TenantId == tenantId && !p.IsDeleted)
                .ToListAsync(ct);

            var existingPermKeys = new HashSet<string>(
                existingPerms.Select(p => $"{p.Module}:{p.Action}"),
                StringComparer.OrdinalIgnoreCase);

            // ── Insert missing Permission rows ──────────────────────────────────────
            var newPerms = new List<Permission>();
            foreach (var (module, action, description, _) in DefaultPermissions)
            {
                var key = $"{module}:{action}";
                if (!existingPermKeys.Contains(key))
                {
                    newPerms.Add(new Permission
                    {
                        TenantId    = tenantId,
                        Module      = module,
                        Action      = action,
                        Name        = $"{module}.{action}",
                        Description = description
                    });
                }
            }

            if (newPerms.Count > 0)
            {
                db.Permissions.AddRange(newPerms);
                await db.SaveChangesAsync(ct);
                _logger.LogInformation("Seeded {Count} permission(s) for tenant {TenantId}", newPerms.Count, tenantId);
            }

            // Reload full permission list (includes what was just inserted)
            var allPerms = await db.Permissions
                .AsNoTracking()
                .Where(p => p.TenantId == tenantId && !p.IsDeleted)
                .ToListAsync(ct);

            var permByModuleAction = allPerms.ToDictionary(
                p => $"{p.Module}:{p.Action}",
                StringComparer.OrdinalIgnoreCase);

            // Load existing RolePermission pairs keyed by "RoleId:PermissionId"
            var existingRolePerms = new HashSet<string>(
                (await db.RolePermissions
                    .AsNoTracking()
                    .Where(rp => rp.TenantId == tenantId && !rp.IsDeleted)
                    .Select(rp => new { rp.RoleId, rp.PermissionId })
                    .ToListAsync(ct))
                .Select(x => $"{x.RoleId}:{x.PermissionId}"),
                StringComparer.OrdinalIgnoreCase);

            // ── Insert missing RolePermission rows ─────────────────────────────────
            var newRolePerms = new List<RolePermission>();
            foreach (var (module, action, _, roles) in DefaultPermissions)
            {
                var permKey = $"{module}:{action}";
                if (!permByModuleAction.TryGetValue(permKey, out var perm))
                    continue;

                foreach (var roleName in roles)
                {
                    if (!roleByName.TryGetValue(roleName, out var role))
                        continue; // role doesn't exist in this tenant — skip safely

                    var rpKey = $"{role.Id}:{perm.Id}";
                    if (!existingRolePerms.Contains(rpKey))
                    {
                        newRolePerms.Add(new RolePermission
                        {
                            TenantId     = tenantId,
                            RoleId       = role.Id,
                            PermissionId = perm.Id
                        });
                        existingRolePerms.Add(rpKey); // prevent duplicates within this batch
                    }
                }
            }

            if (newRolePerms.Count > 0)
            {
                db.RolePermissions.AddRange(newRolePerms);
                await db.SaveChangesAsync(ct);
                _logger.LogInformation("Seeded {Count} role-permission mapping(s) for tenant {TenantId}", newRolePerms.Count, tenantId);
            }
        }
    }
}
