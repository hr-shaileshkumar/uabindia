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
using UabIndia.Infrastructure.Data.Migrations;

namespace UabIndia.Api.Services
{
    /// <summary>
    /// Runs once on startup (all environments).
    /// 1. Ensures the database exists (creates if missing).
    /// 2. Applies all pending EF Core migrations and schema patches.
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

        private const string SeedSchemaVersion = "v2";
        private const int TenantSeedBatchLimit = 50;

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

        private static readonly (string Module, string Action, string Description, string[] Roles)[] DefaultPermissions =
        {
            ("platform",  "access", "Access the Platform / Core admin area",    new[] { "SuperAdmin", "Admin" }),
            ("licensing", "access", "Access Modules & Licensing management",     new[] { "SuperAdmin", "Admin" }),
            ("security",  "access", "Access Security & Identity management",     new[] { "SuperAdmin", "Admin" }),
            ("erp",       "access", "Access the ERP SaaS platform shell",     new[] { "SuperAdmin", "Admin", "HR Manager", "Manager", "Accountant", "Employee" }),
            ("hrms",      "access", "Access HRMS module",           new[] { "SuperAdmin", "Admin", "HR Manager", "Manager", "Employee" }),
            ("payroll",   "access", "Access Payroll module",        new[] { "SuperAdmin", "Admin", "HR Manager", "Accountant" }),
            ("reports",   "access", "Access Reports module",        new[] { "SuperAdmin", "Admin", "HR Manager", "Manager", "Accountant" }),
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
            if (_env.IsEnvironment("Test"))
            {
                _logger.LogDebug("DatabaseInitializationService: skipped in Test environment.");
                return;
            }

            _logger.LogInformation("DatabaseInitializationService: starting (schema version {Version})…", SeedSchemaVersion);
            try
            {
                await InitializeAsync(cancellationToken);
                _logger.LogInformation("DatabaseInitializationService: initialization complete.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DatabaseInitializationService: initialization failed. Application may not work correctly.");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

        private async Task InitializeAsync(CancellationToken ct)
        {
            using var scope = _serviceProvider.CreateScope();
            var db             = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasher         = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
            var tenantAccessor = scope.ServiceProvider.GetRequiredService<ITenantAccessor>();

            // ── Step 1: Apply pending migrations & schema column updates ──────────────
            _logger.LogInformation("Applying database migrations…");
            if (db.Database.IsRelational())
            {
                try
                {
                    await db.Database.MigrateAsync(ct);
                }
                catch (Microsoft.Data.SqlClient.SqlException sqlEx) when (sqlEx.Number == 2714)
                {
                    _logger.LogWarning(sqlEx, "Migration failed because objects already exist. Attempting optional history repair.");
                    await MigrationHistoryRepair.TryRepairPendingMigrationsAsync(db, _logger, ct);
                    await db.Database.MigrateAsync(ct);
                }
            }

            await UabIndia.Infrastructure.Data.Migrations.MigrationBootstrap.EnsureInitialCleanSchemaAsync(
                db, _logger, ct);
            await UabIndia.Infrastructure.Data.Migrations.MigrationBootstrap.EnsureExtendedSchemaAsync(
                db, _logger, ct);
            _logger.LogInformation("Database migrations applied.");

            // ── Step 2: Seed global modules (non-tenant-specific) ────────────────────
            await EnsureGlobalModulesAsync(db, ct);

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

        private async Task EnsurePermissionsAsync(ApplicationDbContext db, Guid tenantId, IEnumerable<Role> tenantRoles, CancellationToken ct)
        {
            var roleByName = tenantRoles.ToDictionary(r => r.Name, StringComparer.OrdinalIgnoreCase);

            var existingPerms = await db.Permissions
                .AsNoTracking()
                .Where(p => p.TenantId == tenantId && !p.IsDeleted)
                .ToListAsync(ct);

            var existingPermKeys = new HashSet<string>(
                existingPerms.Select(p => $"{p.Module}:{p.Action}"),
                StringComparer.OrdinalIgnoreCase);

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

            var allPerms = await db.Permissions
                .AsNoTracking()
                .Where(p => p.TenantId == tenantId && !p.IsDeleted)
                .ToListAsync(ct);

            var permByModuleAction = allPerms.ToDictionary(
                p => $"{p.Module}:{p.Action}",
                StringComparer.OrdinalIgnoreCase);

            var existingRolePerms = new HashSet<string>(
                (await db.RolePermissions
                    .AsNoTracking()
                    .Where(rp => rp.TenantId == tenantId && !rp.IsDeleted)
                    .Select(rp => new { rp.RoleId, rp.PermissionId })
                    .ToListAsync(ct))
                .Select(x => $"{x.RoleId}:{x.PermissionId}"),
                StringComparer.OrdinalIgnoreCase);

            var newRolePerms = new List<RolePermission>();
            foreach (var (module, action, _, roles) in DefaultPermissions)
            {
                var permKey = $"{module}:{action}";
                if (!permByModuleAction.TryGetValue(permKey, out var perm))
                    continue;

                foreach (var roleName in roles)
                {
                    if (!roleByName.TryGetValue(roleName, out var role))
                        continue;

                    var rpKey = $"{role.Id}:{perm.Id}";
                    if (!existingRolePerms.Contains(rpKey))
                    {
                        newRolePerms.Add(new RolePermission
                        {
                            TenantId     = tenantId,
                            RoleId       = role.Id,
                            PermissionId = perm.Id
                        });
                        existingRolePerms.Add(rpKey);
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
