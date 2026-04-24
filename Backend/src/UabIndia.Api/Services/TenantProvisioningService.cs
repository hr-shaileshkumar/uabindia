using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
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
        private static readonly string[] DefaultModuleKeys =
        {
            "platform",
            "licensing",
            "security",
            "hrms",
            "payroll",
            "reports",
            "erp"
        };

        private static readonly HashSet<string> CoreEnabledModules = new(StringComparer.OrdinalIgnoreCase)
        {
            "platform",
            "licensing",
            "security"
        };

        private static readonly (string Name, string Description)[] DefaultRoles =
        {
            (RoleCatalog.SuperAdminRoleName, "Tenant super administrator"),
            (RoleCatalog.AdminRoleName, "Company administrator"),
            (RoleCatalog.ManagerRoleName, "Project manager"),
            (RoleCatalog.EmployeeRoleName, "Standard employee")
        };

        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _configuration;
        private readonly IEncryptionService _encryptionService;
        private readonly IPasswordHasher<User> _hasher;
        private readonly ILogger<TenantProvisioningService> _logger;

        public TenantProvisioningService(
            ApplicationDbContext db,
            IConfiguration configuration,
            IEncryptionService encryptionService,
            IPasswordHasher<User> hasher,
            ILogger<TenantProvisioningService> logger)
        {
            _db = db;
            _configuration = configuration;
            _encryptionService = encryptionService;
            _hasher = hasher;
            _logger = logger;
        }

        public async Task<Tenant> CreateTenantAsync(CreateTenantDto dto)
        {
            var subdomain = dto.Subdomain.Trim();
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
                IsActive = true
            };

            _db.Tenants.Add(tenant);
            await _db.SaveChangesAsync();

            await EnsureModuleCatalogAsync();

            var schema = BuildSchemaName(tenant.Subdomain, tenant.Id);
            await EnsureSchemaAsync(schema);

            await SeedTenantAsync(tenant, schema, dto.AdminEmail, dto.AdminPassword);

            return tenant;
        }

        public async Task RenameTenantSchemaAsync(Tenant tenant, string newSubdomain)
        {
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
                        "erp" => "ERP",
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

        private async Task<int> ExecuteScalarAsync(string sql, (string Name, object Value) parameter)
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
                var param = command.CreateParameter();
                param.ParameterName = parameter.Name;
                param.Value = parameter.Value;
                command.Parameters.Add(param);
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

        private async Task SeedTenantAsync(Tenant tenant, string schema, string adminEmail, string adminPassword)
        {
            var tenantAccessor = new TenantAccessor();
            tenantAccessor.SetTenantId(tenant.Id);
            tenantAccessor.SetTenantSchema(schema);

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlServer(_configuration.GetConnectionString("DefaultConnection")
                    ?? "Server=.;Database=UabIndia_HRMS;Trusted_Connection=True;")
                .ReplaceService<IModelCacheKeyFactory, TenantModelCacheKeyFactory>()
                .Options;

            await using var tenantDb = new ApplicationDbContext(options, tenantAccessor, _encryptionService);

            await tenantDb.Database.MigrateAsync();

            var adminRole = await tenantDb.Roles.FirstOrDefaultAsync(r => r.Name == RoleCatalog.AdminRoleName);
            foreach (var role in DefaultRoles)
            {
                var existingRole = await tenantDb.Roles.FirstOrDefaultAsync(r => r.Name == role.Name);
                if (existingRole == null)
                {
                    tenantDb.Roles.Add(new Role { TenantId = tenant.Id, Name = role.Name, Description = role.Description });
                }
            }

            await tenantDb.SaveChangesAsync();

            adminRole = await tenantDb.Roles.FirstOrDefaultAsync(r => r.Name == RoleCatalog.AdminRoleName);
            var superAdminRole = await tenantDb.Roles.FirstOrDefaultAsync(r => r.Name == RoleCatalog.SuperAdminRoleName);

            var adminUser = await tenantDb.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);
            if (adminUser == null)
            {
                adminUser = new User
                {
                    TenantId = tenant.Id,
                    Email = adminEmail,
                    FullName = "Admin User",
                    IsSystemAdmin = true,
                    IsActive = true
                };
                adminUser.PasswordHash = _hasher.HashPassword(adminUser, adminPassword);
                tenantDb.Users.Add(adminUser);
            }

            await tenantDb.SaveChangesAsync();

            if (adminRole != null && adminUser != null)
            {
                var adminUserRole = await tenantDb.UserRoles
                    .FirstOrDefaultAsync(ur => ur.TenantId == tenant.Id && ur.UserId == adminUser.Id && ur.RoleId == adminRole.Id);
                if (adminUserRole == null)
                {
                    tenantDb.UserRoles.Add(new UserRole { TenantId = tenant.Id, UserId = adminUser.Id, RoleId = adminRole.Id });
                }
            }

            if (superAdminRole != null && adminUser != null)
            {
                var superUserRole = await tenantDb.UserRoles
                    .FirstOrDefaultAsync(ur => ur.TenantId == tenant.Id && ur.UserId == adminUser.Id && ur.RoleId == superAdminRole.Id);
                if (superUserRole == null)
                {
                    tenantDb.UserRoles.Add(new UserRole { TenantId = tenant.Id, UserId = adminUser.Id, RoleId = superAdminRole.Id });
                }
            }

            foreach (var key in DefaultModuleKeys)
            {
                var existing = await tenantDb.TenantModules.FirstOrDefaultAsync(tm => tm.ModuleKey == key);
                if (existing == null)
                {
                    tenantDb.TenantModules.Add(new TenantModule
                    {
                        TenantId = tenant.Id,
                        ModuleKey = key,
                        IsEnabled = CoreEnabledModules.Contains(key)
                    });
                }
            }

            var config = await tenantDb.TenantConfigs.FirstOrDefaultAsync(c => c.TenantId == tenant.Id);
            if (config == null)
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

            await tenantDb.SaveChangesAsync();
            _logger.LogInformation("Tenant provisioned: {TenantId} schema={Schema}", tenant.Id, schema);
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
