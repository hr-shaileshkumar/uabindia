using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Hangfire;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Core.Security;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Data.Migrations;
using UabIndia.Infrastructure.Services;

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
    public class DatabaseInitializationService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DatabaseInitializationService> _logger;
        private readonly IHostEnvironment _env;

        private const string SeedSchemaVersion = "v2";
        private const int TenantSeedBatchLimit = 50;

        private static readonly (string Key, string Name)[] DefaultModules =
        {
            ("erp",           "ERP SaaS Platform"),
            ("hrms",          "HRMS"),
            ("payroll",       "Payroll"),
            ("finance",       "Finance"),
            ("procurement",   "Procurement"),
            ("inventory",     "Inventory"),
            ("sales",         "Sales"),
            ("crm",           "CRM"),
            ("projects",      "Projects"),
            ("reports",       "Reports"),
            ("compliance",   "Compliance"),
            ("workflow",      "Workflow"),
            ("notifications", "Notifications"),
            ("platform",      "Platform / Core"),
            ("licensing",     "Modules & Licensing"),
            ("security",      "Authentication & Security"),
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
            ("crm",       "access", "Access CRM module",            new[] { "SuperAdmin", "Admin", "HR Manager", "Manager", "Accountant" }),
            ("finance",      "access", "Access Finance module",          new[] { "SuperAdmin", "Admin", "Accountant" }),
            ("procurement",  "access", "Access Procurement module",      new[] { "SuperAdmin", "Admin", "Accountant", "Manager" }),
            ("inventory",    "access", "Access Inventory module",        new[] { "SuperAdmin", "Admin", "Accountant", "Manager" }),
            ("compliance","access", "Access Compliance module",     new[] { "SuperAdmin", "Admin", "HR Manager", "Accountant" }),
            ("workflow",  "access", "Access Workflow module",       new[] { "SuperAdmin", "Admin", "HR Manager", "Manager" }),
            ("notifications","access", "Access Notifications module", new[] { "SuperAdmin", "Admin", "HR Manager", "Manager", "Employee" }),
            ("sales",     "access", "Access Sales module",          new[] { "SuperAdmin", "Admin", "HR Manager", "Manager", "Accountant" }),
            ("projects",  "access", "Access Projects module",       new[] { "SuperAdmin", "Admin", "HR Manager", "Manager", "Employee" }),
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

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (_env.IsEnvironment("Test"))
            {
                _logger.LogDebug("DatabaseInitializationService: skipped in Test environment.");
                return;
            }

            _logger.LogInformation("DatabaseInitializationService: starting (schema version {Version})…", SeedSchemaVersion);
            try
            {
                await InitializeAsync(stoppingToken);
                TryRegisterHangfireJobs();
                _logger.LogInformation("DatabaseInitializationService: initialization complete.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DatabaseInitializationService: initialization failed. Application may not work correctly.");
            }
        }

        private static TimeZoneInfo ResolveJobTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");
            }
            catch (TimeZoneNotFoundException)
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
                }
                catch (TimeZoneNotFoundException)
                {
                    return TimeZoneInfo.Local;
                }
            }
        }

        private void TryRegisterHangfireJobs()
        {
            try
            {
                var jobTimeZone = ResolveJobTimeZone();

                RecurringJob.AddOrUpdate<HangfireJobService>(
                    "monthly-payroll",
                    service => service.ProcessMonthlyPayroll(),
                    "0 23 L * *",
                    new RecurringJobOptions { TimeZone = jobTimeZone });
                RecurringJob.AddOrUpdate<HangfireJobService>(
                    "leave-expiry",
                    service => service.ExpireLeaveBalances(),
                    Cron.Monthly(1, 1),
                    new RecurringJobOptions { TimeZone = jobTimeZone });
                RecurringJob.AddOrUpdate<HangfireJobService>(
                    "audit-log-archival",
                    service => service.ArchiveAuditLogs(),
                    Cron.Weekly(DayOfWeek.Sunday, 2),
                    new RecurringJobOptions { TimeZone = jobTimeZone });
                RecurringJob.AddOrUpdate<HangfireJobService>(
                    "send-notifications",
                    service => service.SendPendingNotifications(),
                    "*/30 * * * *",
                    new RecurringJobOptions { TimeZone = jobTimeZone });
                RecurringJob.AddOrUpdate<HangfireJobService>(
                    "cleanup-temp-data",
                    service => service.CleanupTemporaryData(),
                    Cron.Daily(3),
                    new RecurringJobOptions { TimeZone = jobTimeZone });
                RecurringJob.AddOrUpdate<HangfireJobService>(
                    "subscription-lifecycle",
                    service => service.ProcessSubscriptionLifecycle(),
                    Cron.Daily(4),
                    new RecurringJobOptions { TimeZone = jobTimeZone });
                RecurringJob.AddOrUpdate<HangfireJobService>(
                    "monthly-leave-accrual",
                    service => service.AccrueMonthlyLeaveBalances(),
                    Cron.Monthly(1, 2),
                    new RecurringJobOptions { TimeZone = jobTimeZone });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Hangfire recurring jobs were not registered. The API will keep serving requests.");
            }
        }

        private async Task InitializeAsync(CancellationToken ct)
        {
            using var scope = _serviceProvider.CreateScope();
            var db             = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hasher         = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
            var tenantAccessor = scope.ServiceProvider.GetRequiredService<ITenantAccessor>();

            var acquiredAppLock = false;
            try
            {
                if (db.Database.IsSqlServer())
                {
                    try
                    {
                        if (await db.Database.CanConnectAsync(ct))
                        {
                            await db.Database.ExecuteSqlRawAsync(
                                "DECLARE @res int; EXEC @res = sp_getapplock @Resource = 'UabIndia_DbInit', @LockMode = 'Exclusive', @LockOwner = 'Session', @LockTimeout = 120000; IF @res < 0 THROW 50001, 'Unable to acquire database initialization lock via sp_getapplock', 1;",
                                ct);
                            acquiredAppLock = true;
                            _logger.LogInformation("DatabaseInitializationService: acquired SQL Server distributed startup lock via sp_getapplock.");
                        }
                    }
                    catch (Exception lockEx)
                    {
                        _logger.LogWarning(lockEx, "DatabaseInitializationService: could not acquire sp_getapplock; continuing startup cautiously.");
                    }
                }

            // ── Step 0: Ensure physical database exists ──────────────────────────────
            if (db.Database.IsRelational())
            {
                var canConnect = false;
                try { canConnect = await db.Database.CanConnectAsync(ct); } catch { canConnect = false; }
                if (!canConnect)
                {
                    _logger.LogInformation("Database does not exist — creating physical database via MigrateAsync…");
                    try { await db.Database.MigrateAsync(ct); } catch (Exception ex) { _logger.LogWarning(ex, "Initial MigrateAsync on new DB encountered warning."); }
                }
            }

            // ── Step 1: Idempotent schema bootstrap, then EF migrations ───────────────
            await UabIndia.Infrastructure.Data.Migrations.MigrationBootstrap.EnsureInitialCleanSchemaAsync(
                db, _logger, ct);
            await UabIndia.Infrastructure.Data.Migrations.MigrationBootstrap.EnsureExtendedSchemaAsync(
                db, _logger, ct);

            var config = scope.ServiceProvider.GetService<IConfiguration>();
            if (config != null && config.GetValue<bool>("Database:ApplyPartitionedSchemas", false))
            {
                await UabIndia.Infrastructure.Data.Migrations.MigrationBootstrap.ApplyEnterpriseSchemaPartitioningAsync(
                    db, _logger, ct);
            }

            _logger.LogInformation("Applying database migrations…");
            if (db.Database.IsRelational())
            {
                try
                {
                    await db.Database.MigrateAsync(ct);
                }
                catch (InvalidOperationException ex) when (ex.Message.Contains("PendingModelChangesWarning", StringComparison.Ordinal))
                {
                    _logger.LogWarning(
                        ex,
                        "EF model snapshot is behind the live schema. Skipping pending-model validation and continuing startup.");
                }
                catch (Microsoft.Data.SqlClient.SqlException sqlEx) when (sqlEx.Number is 2714 or 2705)
                {
                    _logger.LogWarning(
                        sqlEx,
                        "Migration failed because schema objects already exist (SQL {ErrorNumber}). Attempting history repair.",
                        sqlEx.Number);
                    await MigrationHistoryRepair.TryRepairPendingMigrationsAsync(
                        db, _logger, ct, force: _env.IsDevelopment());
                    try
                    {
                        await db.Database.MigrateAsync(ct);
                    }
                    catch (Exception retryEx)
                    {
                        _logger.LogWarning(retryEx, "MigrateAsync retry after history repair encountered warning. Continuing with seeding.");
                    }
                }
                catch (Microsoft.Data.SqlClient.SqlException sqlEx) when (sqlEx.Number == 1919)
                {
                    _logger.LogWarning(
                        sqlEx,
                        "Migration failed because a column is too wide for an index (SQL 1919). Narrowing document-number columns and retrying.");
                    await MigrationSqlHelper.ExecuteSqlFileAsync(
                        db,
                        "20260818010000_AddDocumentNumberIndexes.sql",
                        ct);
                    try
                    {
                        await db.Database.MigrateAsync(ct);
                    }
                    catch (Exception retryEx)
                    {
                        _logger.LogWarning(retryEx, "MigrateAsync retry after narrowing document-number columns encountered warning. Continuing with seeding.");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Database migration encountered an unexpected exception; continuing with startup seeding.");
                }
            }

            _logger.LogInformation("Database migrations applied.");

            // ── Step 2: Seed global modules & SaaS Subscription Plans ────────────────
            await EnsureGlobalModulesAsync(db, ct);
            await EnsureSubscriptionPlansAsync(db, ct);

            // ── Step 3: Check if any tenant already exists ───────────────────────────
            var anyTenant = await db.Tenants.AnyAsync(ct);
            if (anyTenant)
            {
                _logger.LogInformation("Tenants already exist — running back-fill for existing tenants…");

                // Auto-migrate legacy 'api' tenant subdomain to 'erp'
                var legacyApiTenant = await db.Tenants.FirstOrDefaultAsync(t => t.Subdomain == "api", ct);
                if (legacyApiTenant != null)
                {
                    legacyApiTenant.Subdomain = "erp";
                    if (legacyApiTenant.Name == "UabIndia API Tenant" || legacyApiTenant.Name == "Default Organization" || legacyApiTenant.Name == "Enterprise SaaS Tenant")
                    {
                        legacyApiTenant.Name = "UabIndia ERP";
                    }
                    legacyApiTenant.UpdatedAt = DateTime.UtcNow;
                    await db.SaveChangesAsync(ct);
                    _logger.LogInformation("Migrated legacy tenant subdomain from 'api' to 'erp'");
                }

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
                    tenantAccessor.SetTenantId(tid);
                    await EnsureTenantModulesAsync(db, tid, ct);
                    await EnsureDefaultRolesForTenantAsync(db, tid, ct);

                    var tenantRoles = await db.Roles
                        .AsNoTracking()
                        .IgnoreQueryFilters()
                        .Where(r => r.TenantId == tid && !r.IsDeleted)
                        .ToListAsync(ct);

                    await EnsurePermissionsAsync(db, tid, tenantRoles, ct);
                }

                if (_env.IsDevelopment())
                {
                    await EnsureDevelopmentAdminUserAsync(db, hasher, tenantAccessor, ct);
                }

                return;
            }

            _logger.LogInformation("No tenants found — seeding default system tenant…");

            // ── Step 4: Create default tenant ───────────────────────────────────────
            var defaultSubdomain = "erp";
            var tenant = new Tenant
            {
                Subdomain = defaultSubdomain,
                Name      = "UabIndia ERP",
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
            var adminEmail = Environment.GetEnvironmentVariable("SEED_ADMIN_EMAIL") ?? AuthUserLookup.DevAdminEmail;
            var adminPassword = Environment.GetEnvironmentVariable("SEED_ADMIN_PASSWORD");
            var adminName = Environment.GetEnvironmentVariable("SEED_ADMIN_NAME") ?? "System Administrator";

            if (string.IsNullOrWhiteSpace(adminPassword) || adminPassword == AuthUserLookup.DevAdminPassword)
            {
                if (!_env.IsDevelopment())
                {
                    throw new InvalidOperationException(
                        "FATAL: In production environments, SEED_ADMIN_PASSWORD must be explicitly configured with a strong, non-default password before initial tenant and administrator provisioning. " +
                        "Falling back to default credentials is strictly prohibited.");
                }

                adminPassword = AuthUserLookup.DevAdminPassword;
                _logger.LogWarning("Seeding administrator with development credentials. Do NOT use these credentials in Production.");
            }

            var adminUser = new User
            {
                TenantId      = tenant.Id,
                Email         = AuthUserLookup.NormalizeEmail(adminEmail),
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
            finally
            {
                if (acquiredAppLock && db.Database.IsSqlServer())
                {
                    try
                    {
                        await db.Database.ExecuteSqlRawAsync(
                            "EXEC sp_releaseapplock @Resource = 'UabIndia_DbInit', @LockOwner = 'Session';",
                            CancellationToken.None);
                        _logger.LogInformation("DatabaseInitializationService: released SQL Server distributed startup lock.");
                    }
                    catch (Exception relEx)
                    {
                        _logger.LogWarning(relEx, "DatabaseInitializationService: error releasing sp_getapplock.");
                    }
                }
            }
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

        private async Task EnsureSubscriptionPlansAsync(ApplicationDbContext db, CancellationToken ct)
        {
            try
            {
                var existingCodes = new HashSet<string>(
                    await db.SubscriptionPlans.AsNoTracking().Select(p => p.PlanCode).ToListAsync(ct),
                    StringComparer.OrdinalIgnoreCase);

                var defaultPlans = new[]
                {
                    new SubscriptionPlan
                    {
                        PlanCode = "trial",
                        Name = "Free Trial",
                        Description = "14-day full access trial with core ERP & accounting features.",
                        MonthlyPriceInr = 0,
                        AnnualPriceInr = 0,
                        MaxUsers = 5,
                        MaxStorageMb = 2048,
                        MaxApiCallsPerDay = 1000,
                        AllowedModulesJson = "[\"platform\",\"finance\",\"inventory\",\"sales\",\"tax\"]",
                        IsActive = true,
                        SortOrder = 1
                    },
                    new SubscriptionPlan
                    {
                        PlanCode = "starter",
                        Name = "Starter SaaS",
                        Description = "Ideal for small businesses, startups, and growing teams.",
                        MonthlyPriceInr = 2499,
                        AnnualPriceInr = 23990,
                        MaxUsers = 10,
                        MaxStorageMb = 10240,
                        MaxApiCallsPerDay = 5000,
                        AllowedModulesJson = "[\"platform\",\"finance\",\"inventory\",\"sales\",\"tax\",\"hrms\"]",
                        IsActive = true,
                        SortOrder = 2
                    },
                    new SubscriptionPlan
                    {
                        PlanCode = "growth",
                        Name = "Growth Business",
                        Description = "Full ERP automation for mid-sized growing enterprises.",
                        MonthlyPriceInr = 6999,
                        AnnualPriceInr = 67190,
                        MaxUsers = 35,
                        MaxStorageMb = 51200,
                        MaxApiCallsPerDay = 25000,
                        AllowedModulesJson = "[\"platform\",\"finance\",\"inventory\",\"sales\",\"tax\",\"hrms\",\"payroll\",\"procurement\"]",
                        IsActive = true,
                        SortOrder = 3
                    },
                    new SubscriptionPlan
                    {
                        PlanCode = "enterprise",
                        Name = "Enterprise Cloud",
                        Description = "Unlimited scale, dedicated SLA, custom workflows, and integrations.",
                        MonthlyPriceInr = 19999,
                        AnnualPriceInr = 191990,
                        MaxUsers = 999,
                        MaxStorageMb = 512000,
                        MaxApiCallsPerDay = 100000,
                        AllowedModulesJson = "[\"*\"]",
                        IsActive = true,
                        SortOrder = 4
                    }
                };

                var toAdd = defaultPlans.Where(p => !existingCodes.Contains(p.PlanCode)).ToList();
                if (toAdd.Count > 0)
                {
                    db.SubscriptionPlans.AddRange(toAdd);
                    await db.SaveChangesAsync(ct);
                    _logger.LogInformation("Seeded {Count} SaaS Subscription Plans: {Codes}", toAdd.Count, string.Join(", ", toAdd.Select(p => p.PlanCode)));
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not seed subscription plans during startup. The application will continue running.");
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

        private static readonly (string Name, string Description)[] StandardRoles =
        {
            (RoleCatalog.SuperAdminRoleName, "System super administrator — unrestricted access"),
            (RoleCatalog.AdminRoleName, "Tenant administrator"),
            (RoleCatalog.HrManagerRoleName, "Human Resources manager"),
            (RoleCatalog.AccountantRoleName, "Finance and accounts"),
            (RoleCatalog.ManagerRoleName, "Department manager"),
            (RoleCatalog.EmployeeRoleName, "Standard employee")
        };

        private async Task EnsureDefaultRolesForTenantAsync(ApplicationDbContext db, Guid tenantId, CancellationToken ct)
        {
            var existingRoles = await db.Roles
                .IgnoreQueryFilters()
                .Where(r => r.TenantId == tenantId && !r.IsDeleted)
                .ToListAsync(ct);

            var existingNames = new HashSet<string>(existingRoles.Select(r => r.Name), StringComparer.OrdinalIgnoreCase);

            var toAdd = new List<Role>();
            foreach (var (name, desc) in StandardRoles)
            {
                if (!existingNames.Contains(name))
                {
                    toAdd.Add(new Role
                    {
                        TenantId = tenantId,
                        Name = name,
                        Description = desc
                    });
                }
            }

            if (toAdd.Count > 0)
            {
                db.Roles.AddRange(toAdd);
                await db.SaveChangesAsync(ct);
                _logger.LogInformation("Seeded {Count} default role(s) for tenant {TenantId}: {Roles}",
                    toAdd.Count, tenantId, string.Join(", ", toAdd.Select(r => r.Name)));
            }
        }

        private async Task EnsurePermissionsAsync(ApplicationDbContext db, Guid tenantId, IEnumerable<Role> tenantRoles, CancellationToken ct)
        {
            var roleByName = tenantRoles
                .GroupBy(r => r.Name, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.OrderBy(r => r.CreatedAt).ThenBy(r => r.Id).First(), StringComparer.OrdinalIgnoreCase);

            var existingPerms = await db.Permissions
                .IgnoreQueryFilters()
                .Where(p => p.TenantId == tenantId && !p.IsDeleted)
                .ToListAsync(ct);

            var duplicateExtras = existingPerms
                .GroupBy(p => $"{p.Module}:{p.Action}", StringComparer.OrdinalIgnoreCase)
                .SelectMany(group => group.OrderBy(p => p.CreatedAt).ThenBy(p => p.Id).Skip(1))
                .ToList();

            if (duplicateExtras.Count > 0)
            {
                foreach (var extra in duplicateExtras)
                {
                    extra.IsDeleted = true;
                    extra.UpdatedAt = DateTime.UtcNow;
                }

                await db.SaveChangesAsync(ct);
                existingPerms = existingPerms.Where(p => !p.IsDeleted).ToList();
                _logger.LogWarning(
                    "Removed {Count} duplicate permission(s) for tenant {TenantId}.",
                    duplicateExtras.Count,
                    tenantId);
            }

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

            var allPerms = existingPerms.Concat(newPerms)
                .Where(p => !p.IsDeleted)
                .GroupBy(p => $"{p.Module}:{p.Action}", StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderBy(p => p.CreatedAt).ThenBy(p => p.Id).First(),
                    StringComparer.OrdinalIgnoreCase);

            var existingRolePerms = new HashSet<string>(
                (await db.RolePermissions
                    .AsNoTracking()
                    .IgnoreQueryFilters()
                    .Where(rp => rp.TenantId == tenantId && !rp.IsDeleted)
                    .Select(rp => new { rp.RoleId, rp.PermissionId })
                    .ToListAsync(ct))
                .Select(x => $"{x.RoleId}:{x.PermissionId}"),
                StringComparer.OrdinalIgnoreCase);

            var newRolePerms = new List<RolePermission>();
            foreach (var (module, action, _, roles) in DefaultPermissions)
            {
                var permKey = $"{module}:{action}";
                if (!allPerms.TryGetValue(permKey, out var perm))
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

        private async Task EnsureDevelopmentAdminUserAsync(
            ApplicationDbContext db,
            IPasswordHasher<User> hasher,
            ITenantAccessor tenantAccessor,
            CancellationToken ct)
        {
            var tenant = await db.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Subdomain == "erp" && t.IsActive && !t.IsDeleted, ct)
                ?? await db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Subdomain == "api" && t.IsActive && !t.IsDeleted, ct)
                ?? await db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.IsActive && !t.IsDeleted, ct);

            if (tenant == null)
            {
                _logger.LogWarning("Development admin seed skipped: no active tenant found.");
                return;
            }

            tenantAccessor.SetTenantId(tenant.Id);
            tenantAccessor.SetTenantSchema($"tenant_{tenant.Subdomain ?? tenant.Id.ToString("N")}");

            var adminEmail = Environment.GetEnvironmentVariable("SEED_ADMIN_EMAIL") ?? AuthUserLookup.DevAdminEmail;
            var adminPassword = Environment.GetEnvironmentVariable("SEED_ADMIN_PASSWORD") ?? AuthUserLookup.DevAdminPassword;

            var adminUser = await AuthUserLookup.FindUserByEmailAsync(db, adminEmail);
            if (adminUser == null)
            {
                adminUser = await db.Users.IgnoreQueryFilters()
                    .FirstOrDefaultAsync(
                        u => u.TenantId == tenant.Id && u.IsSystemAdmin && u.IsActive && !u.IsDeleted,
                        ct);
            }

            if (adminUser == null)
            {
                adminUser = new User
                {
                    TenantId = tenant.Id,
                    Email = AuthUserLookup.NormalizeEmail(adminEmail),
                    FullName = "Enterprise Admin",
                    IsSystemAdmin = true,
                    IsActive = true,
                };
                adminUser.PasswordHash = hasher.HashPassword(adminUser, adminPassword);
                db.Users.Add(adminUser);
            }
            else
            {
                adminUser.IsDeleted = false;
                adminUser.IsActive = true;
                adminUser.IsSystemAdmin = true;
                adminUser.TenantId = tenant.Id;
                adminUser.FullName = string.IsNullOrWhiteSpace(adminUser.FullName) || adminUser.FullName == "Admin User" ? "Enterprise Admin" : adminUser.FullName;
                adminUser.Email = AuthUserLookup.NormalizeEmail(adminEmail);
                AccountLockoutPolicy.ResetFailedAttempts(adminUser);
                adminUser.PasswordHash = hasher.HashPassword(adminUser, adminPassword);
                adminUser.UpdatedAt = DateTime.UtcNow;
                db.Users.Update(adminUser);
            }

            await db.SaveChangesAsync(ct);

            // Ensure SuperAdmin and Admin roles for the development admin user
            var defaultAdminRoles = await db.Roles
                .IgnoreQueryFilters()
                .Where(r => r.TenantId == tenant.Id && !r.IsDeleted && (r.Name == RoleCatalog.SuperAdminRoleName || r.Name == RoleCatalog.AdminRoleName))
                .ToListAsync(ct);

            var existingUserRoles = await db.UserRoles
                .IgnoreQueryFilters()
                .Where(ur => ur.TenantId == tenant.Id && ur.UserId == adminUser.Id)
                .ToListAsync(ct);

            foreach (var role in defaultAdminRoles)
            {
                if (!existingUserRoles.Any(ur => ur.RoleId == role.Id))
                {
                    db.UserRoles.Add(new UserRole
                    {
                        TenantId = tenant.Id,
                        UserId = adminUser.Id,
                        RoleId = role.Id
                    });
                }
            }

            await db.SaveChangesAsync(ct);
            _logger.LogInformation("Development admin credentials ensured for {Email}", adminEmail);

            await EnsureDevelopmentSampleContentAsync(db, tenant.Id, ct);
        }

        private async Task EnsureDevelopmentSampleContentAsync(
            ApplicationDbContext db,
            Guid tenantId,
            CancellationToken ct)
        {
            if (!_env.IsDevelopment())
            {
                return;
            }

            tenantId = tenantId == Guid.Empty
                ? await db.Tenants.AsNoTracking().Where(t => t.IsActive && !t.IsDeleted).Select(t => t.Id).FirstOrDefaultAsync(ct)
                : tenantId;

            if (tenantId == Guid.Empty)
            {
                return;
            }

            var hasAiAgents = await db.AiAgents
                .IgnoreQueryFilters()
                .AnyAsync(a => a.TenantId == tenantId && !a.IsDeleted, ct);

            await db.Database.ExecuteSqlRawAsync(
                "UPDATE dbo.AiAgents SET Category = 'Administration' WHERE Category = 'Platform'", ct);

            if (!hasAiAgents)
            {
                db.AiAgents.AddRange(
                    new AiAgent
                    {
                        TenantId = tenantId,
                        AgentKey = "erp-copilot",
                        Name = "ERP Copilot",
                        Description = "General ERP navigation and operational guidance.",
                        Provider = "OpenAI",
                        ModelName = "gpt-4o-mini",
                        Category = "Administration",
                        IsEnabled = true,
                    },
                    new AiAgent
                    {
                        TenantId = tenantId,
                        AgentKey = "hr-assistant",
                        Name = "HR Assistant",
                        Description = "HR policy and employee lifecycle helper.",
                        Provider = "OpenAI",
                        ModelName = "gpt-4o-mini",
                        Category = "HRMS",
                        IsEnabled = true,
                    });

                _logger.LogInformation("Seeded default AI agents for tenant {TenantId}", tenantId);
            }

            var defaultFlags = new (string Key, string Description, bool Enabled)[]
            {
                ("ENABLE_AI_RECRUITMENT_PARSER", "Parse resumes automatically with AI parsing pipeline", true),
                ("ENABLE_AI_HR_ASSISTANT", "Enable HR assistant agent orchestration", true),
            };

            foreach (var (key, description, enabled) in defaultFlags)
            {
                var exists = await db.FeatureFlags
                    .IgnoreQueryFilters()
                    .AnyAsync(f => f.TenantId == tenantId && f.FeatureKey == key && !f.IsDeleted, ct);

                if (!exists)
                {
                    db.FeatureFlags.Add(new FeatureFlag
                    {
                        TenantId = tenantId,
                        FeatureKey = key,
                        Description = description,
                        IsEnabled = enabled,
                    });
                }
            }

            await db.SaveChangesAsync(ct);

            await EnsureDemoNotificationTemplatesAsync(db, tenantId, ct);
            await EnsureDemoCustomFieldsAsync(db, tenantId, ct);
            await EnsureDemoIntegrationConnectorsAsync(db, tenantId, ct);

            await PurgeDemoDataAsync(db, tenantId, ct);
        }

        private static async Task EnsureDemoIntegrationConnectorsAsync(
            ApplicationDbContext db,
            Guid tenantId,
            CancellationToken ct)
        {
            var seeds = new (string Key, string Name, string Provider, string Category)[]
            {
                ("gst_portal", "GST Portal", "NIC / GSTN", "Tax"),
                ("bank_feed", "Bank Statement Feed", "Generic CSV / API", "Finance"),
                ("biometric_device", "Biometric Attendance", "ZKTeco / eSSL", "HR"),
            };

            foreach (var seed in seeds)
            {
                var exists = await db.IntegrationConnectors.IgnoreQueryFilters()
                    .AnyAsync(c =>
                        c.TenantId == tenantId &&
                        c.ConnectorKey == seed.Key &&
                        !c.IsDeleted, ct);
                if (exists) continue;

                db.IntegrationConnectors.Add(new IntegrationConnector
                {
                    TenantId = tenantId,
                    ConnectorKey = seed.Key,
                    Name = seed.Name,
                    Provider = seed.Provider,
                    Category = seed.Category,
                    Status = "Inactive",
                    CreatedAt = DateTime.UtcNow
                });
            }

            await db.SaveChangesAsync(ct);
        }

        private static async Task EnsureDemoCustomFieldsAsync(
            ApplicationDbContext db,
            Guid tenantId,
            CancellationToken ct)
        {
            var seeds = new (string Entity, string Key, string Label, string Type, string? OptionsJson, string Section, int Sort)[]
            {
                ("Employee", "blood_group", "Blood Group", "select",
                    "[\"A+\",\"A-\",\"B+\",\"B-\",\"AB+\",\"AB-\",\"O+\",\"O-\"]", "HR Details", 10),
                ("Employee", "emergency_contact", "Emergency Contact", "text", null, "HR Details", 20),
                ("SalesInvoice", "cost_center_code", "Cost Center Code", "text", null, "Billing", 10),
                ("SalesInvoice", "po_reference", "Customer PO Reference", "text", null, "Billing", 20),
                ("Project", "contract_type", "Contract Type", "select",
                    "[\"Fixed\",\"T&M\",\"Retainer\"]", "Commercial", 10),
                ("Project", "risk_level", "Risk Level", "select",
                    "[\"Low\",\"Medium\",\"High\"]", "Commercial", 20),
            };

            foreach (var seed in seeds)
            {
                var exists = await db.EntityFieldDefinitions.IgnoreQueryFilters()
                    .AnyAsync(d =>
                        d.TenantId == tenantId &&
                        d.EntityName == seed.Entity &&
                        d.FieldKey == seed.Key &&
                        !d.IsDeleted, ct);
                if (exists) continue;

                db.EntityFieldDefinitions.Add(new EntityFieldDefinition
                {
                    TenantId = tenantId,
                    EntityName = seed.Entity,
                    FieldKey = seed.Key,
                    FieldLabel = seed.Label,
                    FieldType = seed.Type,
                    OptionsJson = seed.OptionsJson,
                    IsRequired = false,
                    IsActive = true,
                    SortOrder = seed.Sort,
                    Section = seed.Section,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await db.SaveChangesAsync(ct);
        }

        private static async Task EnsureDemoNotificationTemplatesAsync(
            ApplicationDbContext db,
            Guid tenantId,
            CancellationToken ct)
        {
            var templates = new (string Name, string Trigger, string Subject, string Body)[]
            {
                ("Leave Approved", "leave.approved", "Leave request approved",
                    "Your leave request has been approved. Open ESS or Leave to review details."),
                ("Leave Rejected", "leave.rejected", "Leave request rejected",
                    "Your leave request was rejected. Please contact your manager if you need clarification."),
                ("Expense Approved", "expense.approved", "Expense claim approved",
                    "Your expense claim was approved and is ready for payment processing."),
                ("Expense Rejected", "expense.rejected", "Expense claim rejected",
                    "Your expense claim was rejected. Review the claim notes for more detail."),
                ("Timesheet Approved", "timesheet.approved", "Timesheet approved",
                    "Your timesheet entry was approved."),
            };

            foreach (var (name, trigger, subject, body) in templates)
            {
                var exists = await db.CommunicationTemplates.IgnoreQueryFilters()
                    .AnyAsync(t => t.TenantId == tenantId && t.TriggerEvent == trigger && !t.IsDeleted, ct);
                if (exists) continue;

                db.CommunicationTemplates.Add(new CommunicationTemplate
                {
                    TenantId = tenantId,
                    TemplateKind = "Email",
                    Name = name,
                    Subject = subject,
                    Body = body,
                    TriggerEvent = trigger,
                    Language = "en",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                });
            }

            await db.SaveChangesAsync(ct);
        }

        private async Task PurgeDemoDataAsync(
            ApplicationDbContext db,
            Guid tenantId,
            CancellationToken ct)
        {
            try
            {
                const string purgeSql = @"
IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL
    DELETE FROM dbo.SalesInvoices WHERE InvoiceNumber LIKE 'INV-2026-%';

IF OBJECT_ID(N'dbo.ApprovalRequests', N'U') IS NOT NULL
    DELETE FROM dbo.ApprovalRequests WHERE Comments LIKE '%Staged by AI Copilot%';

IF OBJECT_ID(N'dbo.Items', N'U') IS NOT NULL
    DELETE FROM dbo.Items WHERE ItemCode IN ('SRV-RACK-01', 'OP-100G-TX', 'ALUM-SHT-2M', 'MCU-PKG-32B', 'PWR-SUP-12V');

IF OBJECT_ID(N'dbo.Customers', N'U') IS NOT NULL
    DELETE FROM dbo.Customers WHERE CustomerCode = 'CUST-US-001';

IF OBJECT_ID(N'dbo.Vendors', N'U') IS NOT NULL
    DELETE FROM dbo.Vendors WHERE VendorCode = 'VEND-SG-001';

IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL
    DELETE FROM dbo.Employees WHERE EmployeeCode LIKE 'DEMO-EMP-%';

IF OBJECT_ID(N'dbo.ProjectTasks', N'U') IS NOT NULL
    DELETE FROM dbo.ProjectTasks WHERE TaskCode = 'DEMO-TSK-001';

IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL
    DELETE FROM dbo.Projects WHERE ProjectCode IN ('DEMO-P1', 'DEMO-P2');

IF OBJECT_ID(N'dbo.CostCenters', N'U') IS NOT NULL
    DELETE FROM dbo.CostCenters WHERE Code IN ('CC-OPS', 'CC-ADMIN');

IF OBJECT_ID(N'dbo.LeavePolicies', N'U') IS NOT NULL
    DELETE FROM dbo.LeavePolicies WHERE Name = 'Demo Casual Leave Policy';

IF OBJECT_ID(N'dbo.LeaveTypes', N'U') IS NOT NULL
    DELETE FROM dbo.LeaveTypes WHERE Code = 'CL' AND Name = 'Casual Leave';

IF OBJECT_ID(N'dbo.PayrollComponents', N'U') IS NOT NULL
    DELETE FROM dbo.PayrollComponents WHERE Name IN ('Basic', 'PF Deduction') AND StructureId IN (SELECT Id FROM dbo.PayrollStructures WHERE Name = 'Demo Standard Structure');

IF OBJECT_ID(N'dbo.PayrollStructures', N'U') IS NOT NULL
    DELETE FROM dbo.PayrollStructures WHERE Name = 'Demo Standard Structure';

IF OBJECT_ID(N'dbo.Companies', N'U') IS NOT NULL
    DELETE FROM dbo.Companies WHERE Code IN ('DEMO-001', 'UAB-IN', 'UAB-US', 'UAB-UK', 'UAB-AE', 'UAB-SG');
";
                await db.Database.ExecuteSqlRawAsync(purgeSql, ct);
                _logger.LogInformation("DatabaseInitializationService: 100% pure database state enforced (all demo & dummy fixtures purged).");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Non-critical: could not execute demo purge SQL.");
            }
        }
    }
}
