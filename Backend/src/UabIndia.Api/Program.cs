using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using FluentValidation;
using FluentValidation.AspNetCore;
using Hangfire;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Sentry.AspNetCore;
using UabIndia.Api.Authorization;
using UabIndia.Api.Extensions;
using UabIndia.Api.Hubs;
using UabIndia.Api.Middleware;
using UabIndia.Api.Services;
using UabIndia.Api.Validators;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Core.Security;
using UabIndia.Core.Services;
using Serilog;
using UabIndia.Billing.Services;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Data.Migrations;
using UabIndia.Infrastructure.Services;
using UabIndia.Api.Swagger;

var builder = WebApplication.CreateBuilder(args);
LoadDotEnvConfiguration(builder.Configuration, builder.Environment.ContentRootPath);

var explicitEnvironment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
    ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT");
var preserveTestHost = builder.Environment.IsEnvironment("Test");
if (!preserveTestHost)
{
    if (string.IsNullOrWhiteSpace(explicitEnvironment))
    {
        explicitEnvironment = Environments.Development;
    }

    builder.Environment.EnvironmentName = explicitEnvironment;
    builder.Configuration.AddJsonFile($"appsettings.{explicitEnvironment}.json", optional: true, reloadOnChange: true);
}

var env = builder.Environment;
var configuration = builder.Configuration;

// Application Insights for production telemetry
if (!env.IsDevelopment())
{
    var aiConnectionString = configuration["ApplicationInsights:ConnectionString"];
    if (!string.IsNullOrEmpty(aiConnectionString))
    {
        builder.Services.AddApplicationInsightsTelemetry(options =>
        {
            options.ConnectionString = aiConnectionString;
            options.EnableAdaptiveSampling = true;
            options.EnableQuickPulseMetricStream = true;
        });
    }
}

// Register module registry
builder.Services.AddSingleton<UabIndia.Api.Modules.IModuleRegistry, UabIndia.Api.Modules.ModuleRegistry>();

// Load modules configuration file
builder.Configuration.AddJsonFile("modules.json", optional: true, reloadOnChange: true);

// Sentry for error tracking
var sentryDsn = configuration["Sentry:Dsn"];
if (!string.IsNullOrEmpty(sentryDsn))
{
    builder.WebHost.UseSentry();
    builder.Services.Configure<SentryAspNetCoreOptions>(options =>
    {
        options.Dsn = sentryDsn;
        options.Environment = env.EnvironmentName;
        options.TracesSampleRate = env.IsDevelopment() ? 1.0 : 0.1;
        options.Debug = env.IsDevelopment();
        options.MaxBreadcrumbs = 200;
        options.AttachStacktrace = true;
        options.IsGlobalModeEnabled = false;
    });
}

// Logging Configuration
builder.Host.UseSerilog((ctx, lc) => lc
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.FromLogContext()
    .Enrich.With(new RedactPIIEnricher())
    .WriteTo.Console()
    .WriteTo.File("logs/log-.json", rollingInterval: RollingInterval.Day)
    .WriteTo.Seq(Environment.GetEnvironmentVariable("SeqUrl") ?? "http://localhost:5341"));
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Information);
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.Information);
builder.Logging.AddFilter("Hangfire.Processing", LogLevel.Warning);
builder.Logging.AddFilter("Hangfire.SqlServer", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft.AspNetCore.HttpsPolicy", LogLevel.Error);

if (env.IsDevelopment())
{
    builder.Logging.AddFilter("UabIndia.Api", LogLevel.Information);
    builder.Logging.AddFilter("UabIndia.Identity", LogLevel.Information);
    builder.Logging.AddFilter("UabIndia.Infrastructure", LogLevel.Information);
    builder.Logging.AddFilter("UabIndia.Application", LogLevel.Information);
}

// High-Concurrency Kestrel Limits
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxConcurrentConnections = 200000;
    options.Limits.MaxConcurrentUpgradedConnections = 50000;
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(15);
});

// Response Compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});

// MVC & Validation
builder.Services.AddControllers().AddApplicationPart(typeof(Program).Assembly);
builder.Services.AddHttpContextAccessor();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateTenantDtoValidator>();

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10 MB
    options.ValueLengthLimit = 1024 * 1024; // 1 MB
    options.MultipartHeadersLengthLimit = 32 * 1024; // 32 KB
});

// Ensure physical database exists on SQL server before EF Core and Hangfire boot
var defaultConnStr = configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrEmpty(defaultConnStr))
{
    UabIndia.Infrastructure.Data.Migrations.MigrationBootstrap.EnsureDatabaseExistsAsync(defaultConnStr).GetAwaiter().GetResult();
}

// Modular Enterprise Services Extensions
builder.Services.AddEnterprisePersistence(configuration, env);
builder.Services.AddEnterpriseCaching(configuration);
builder.Services.AddEnterpriseSecurityAndCors(configuration, env);
builder.Services.AddEnterpriseRateLimiting(env);
builder.Services.AddEnterpriseBackgroundJobs(configuration, env);
builder.Services.AddEnterpriseBusinessServices(configuration);
builder.Services.AddScoped<IBillingService, BillingService>();
builder.Services.AddScoped<IQueryAnalyzer, QueryAnalyzer>();
builder.Services.AddScoped<IAuditLog, AuditLogService>();
builder.Services.AddSingleton<SystemMetrics>();
builder.Services.AddSingleton<ISystemMetrics>(sp => sp.GetRequiredService<SystemMetrics>());
builder.Services.AddSingleton<IPlatformMetrics>(sp => sp.GetRequiredService<SystemMetrics>());
builder.Services.AddScoped<IIndianEnterpriseDemoSeeder, IndianEnterpriseDemoSeeder>();
builder.Services.AddSignalR();

// Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>(name: "database", tags: new[] { "db", "sql" })
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy(), tags: new[] { "api" });

builder.Services.AddEnterpriseSwagger();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseResponseCompression();
app.UseCors("Strict");
app.UseMiddleware<SystemMetricsMiddleware>();

// Legacy /api/* deprecation schedule
var legacyApiSunsetDate = new DateTime(2026, 6, 30, 0, 0, 0, DateTimeKind.Utc);
var legacyApiNonProdSunsetDate = legacyApiSunsetDate.AddDays(-30);

app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api") && !context.Request.Path.StartsWithSegments("/api/v1"))
    {
        var enforceDate = app.Environment.IsProduction() ? legacyApiSunsetDate : legacyApiNonProdSunsetDate;
        context.Response.Headers["Deprecation"] = "true";
        context.Response.Headers["Sunset"] = legacyApiSunsetDate.ToString("yyyy-MM-dd");

        if (DateTime.UtcNow.Date >= enforceDate.Date)
        {
            context.Response.StatusCode = StatusCodes.Status410Gone;
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Legacy API removed",
                message = "The /api/* routes are deprecated. Use /api/v1/* instead.",
                sunsetDate = legacyApiSunsetDate.ToString("yyyy-MM-dd")
            });
            return;
        }
    }

    await next();
});

app.UseMiddleware<CorrelationIdMiddleware>();

    // Content Security Policy (CSP) & Security Headers with nonce
    app.Use(async (context, next) =>
    {
        // Generate a nonce for this request
        var nonceBytes = System.Security.Cryptography.RandomNumberGenerator.GetBytes(16);
        var nonce = Convert.ToBase64String(nonceBytes);
        var csp = $"default-src 'self'; " +
                  $"script-src 'self' 'nonce-{nonce}' https://cdn.jsdelivr.net; " +
                  $"style-src 'self' https://fonts.googleapis.com; " +
                  $"img-src 'self' data: https:; " +
                  $"font-src 'self' https://fonts.gstatic.com; " +
                  $"connect-src 'self'; " +
                  $"frame-ancestors 'none'; " +
                  $"base-uri 'self'; " +
                  $"form-action 'self'";
        context.Response.Headers.Append("Content-Security-Policy", csp);
        context.Response.Headers.Append("X-Content-Nonce", nonce);
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        context.Response.Headers.Append("X-Frame-Options", "DENY");
        context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
        context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
        await next();
    });

// Origin Header Validation (CSRF Protection)
app.Use(async (context, next) =>
{
    var method = context.Request.Method;
    var isStateChanging = method == "POST" || method == "PUT" || method == "DELETE" || method == "PATCH";

    if (isStateChanging)
    {
        var allowedOrigins = SecurityAndCorsExtensions.GetAllowedCorsOrigins(builder.Configuration);
        var legacyAllowedOrigin = builder.Configuration["CORS:AllowedOrigin"];

        var origin = context.Request.Headers["Origin"].ToString();
        var referer = context.Request.Headers["Referer"].ToString();

        if (string.IsNullOrWhiteSpace(origin) && string.IsNullOrWhiteSpace(referer))
        {
            if (!app.Environment.IsDevelopment())
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { error = "Invalid origin", message = "Origin or Referer header is required for state-changing requests." });
                return;
            }

            await next();
            return;
        }

        var isValidOrigin = !string.IsNullOrEmpty(origin) &&
                           (allowedOrigins.Any(allowed => string.Equals(allowed, origin, StringComparison.OrdinalIgnoreCase)) ||
                            (!string.IsNullOrWhiteSpace(legacyAllowedOrigin) && string.Equals(origin, legacyAllowedOrigin, StringComparison.OrdinalIgnoreCase)) ||
                            (app.Environment.IsDevelopment() && SecurityAndCorsExtensions.IsAllowedDevelopmentOrigin(origin)));

        var isValidReferer = string.IsNullOrEmpty(origin) && !string.IsNullOrEmpty(referer) &&
                            (allowedOrigins.Any(allowed => referer.StartsWith(allowed, StringComparison.OrdinalIgnoreCase)) ||
                             (!string.IsNullOrWhiteSpace(legacyAllowedOrigin) && referer.StartsWith(legacyAllowedOrigin, StringComparison.OrdinalIgnoreCase)) ||
                             (app.Environment.IsDevelopment() && SecurityAndCorsExtensions.IsAllowedDevelopmentOrigin(referer)));

        if (!isValidOrigin && !isValidReferer)
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new { error = "Invalid origin", message = "Request origin is not allowed" });
            return;
        }
    }

    await next();
});

app.UseMiddleware<CsrfValidationMiddleware>();
app.UseMiddleware<FileUploadValidationMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseMiddleware<RequestResponseLoggingMiddleware>();
}

app.UseRateLimiter();
app.UseMiddleware<ExceptionMiddleware>();
app.UseAuthentication();
app.UseMiddleware<TenantResolverMiddleware>();
app.UseAuthorization();
app.UseMiddleware<DataVisibilityMiddleware>();
app.UseMiddleware<PolicyEnforcementMiddleware>();
app.UseMiddleware<OrgScopeMiddleware>();
app.UseMiddleware<AuditMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseEnterpriseSwagger(app.Environment);
}

// Development Seed Routine
if (app.Environment.IsDevelopment())
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
        var tenantAccessor = scope.ServiceProvider.GetRequiredService<ITenantAccessor>();
        if (db.Database.IsRelational())
        {
            db.Database.SetCommandTimeout(180);
        }

        await MigrationBootstrap.EnsureInitialCleanSchemaAsync(db, app.Logger);
        await MigrationBootstrap.EnsureExtendedSchemaAsync(db, app.Logger);

        if (args.Contains("--migrate-schemas") || configuration.GetValue<bool>("Database:ApplyPartitionedSchemas", false))
        {
            await MigrationBootstrap.ApplyEnterpriseSchemaPartitioningAsync(db, app.Logger);
        }

        var tenant = db.Tenants.FirstOrDefault(t => t.Subdomain == "erp")
            ?? db.Tenants.FirstOrDefault(t => t.Subdomain == "api")
            ?? db.Tenants.FirstOrDefault();
        if (tenant == null)
        {
            tenant = new Tenant { Subdomain = "erp", Name = "UabIndia ERP", IsActive = true };
            db.Tenants.Add(tenant);
            db.SaveChanges();
        }

        tenantAccessor.SetTenantId(tenant.Id);
        tenantAccessor.SetTenantSchema($"tenant_{tenant.Subdomain ?? tenant.Id.ToString("N")}");

        var tenantRoles = db.Roles.Where(r => r.TenantId == tenant.Id).ToList();
        var adminRole = tenantRoles.FirstOrDefault(r => RoleCatalog.Parse(r.Name) == SystemRole.Admin);
        var superAdminRole = tenantRoles.FirstOrDefault(r => RoleCatalog.Parse(r.Name) == SystemRole.SuperAdmin);

        if (adminRole == null)
        {
            adminRole = new Role { TenantId = tenant.Id, Name = RoleCatalog.AdminRoleName, Description = "System Administrator" };
            db.Roles.Add(adminRole);
            db.SaveChanges();
        }

        if (superAdminRole == null)
        {
            superAdminRole = new Role { TenantId = tenant.Id, Name = RoleCatalog.SuperAdminRoleName, Description = "Tenant super administrator" };
            db.Roles.Add(superAdminRole);
            db.SaveChanges();
        }

        var adminUser = await AuthUserLookup.FindUserByEmailAsync(db, AuthUserLookup.DevAdminEmail);
        if (adminUser == null)
        {
            adminUser = db.Users.IgnoreQueryFilters().FirstOrDefault(u => u.TenantId == tenant.Id && u.IsSystemAdmin && u.IsActive && !u.IsDeleted);
        }

        if (adminUser == null)
        {
            adminUser = new User
            {
                TenantId = tenant.Id,
                Email = AuthUserLookup.DevAdminEmail,
                FullName = "Enterprise Admin",
                IsSystemAdmin = true,
                IsActive = true
            };
            adminUser.PasswordHash = hasher.HashPassword(adminUser, AuthUserLookup.DevAdminPassword);
            db.Users.Add(adminUser);
            db.SaveChanges();
        }
        else
        {
            adminUser.IsDeleted = false;
            adminUser.IsActive = true;
            adminUser.IsSystemAdmin = true;
            adminUser.TenantId = tenant.Id;
            adminUser.Email = AuthUserLookup.DevAdminEmail;
            AccountLockoutPolicy.ResetFailedAttempts(adminUser);
            adminUser.PasswordHash = hasher.HashPassword(adminUser, AuthUserLookup.DevAdminPassword);
            adminUser.UpdatedAt = DateTime.UtcNow;
            db.Users.Update(adminUser);
            db.SaveChanges();
        }

        var adminUserRole = db.UserRoles.IgnoreQueryFilters().FirstOrDefault(ur => ur.TenantId == tenant.Id && ur.UserId == adminUser.Id && ur.RoleId == adminRole.Id);
        if (adminUserRole == null)
        {
            db.UserRoles.Add(new UserRole { TenantId = tenant.Id, UserId = adminUser.Id, RoleId = adminRole.Id });
            db.SaveChanges();
        }

        // Seed Core Modules
        var coreModules = new[] { "erp", "hrms", "payroll", "reports", "platform", "licensing", "security", "crm", "sales", "finance", "inventory", "procurement" };
        foreach (var modKey in coreModules)
        {
            var mod = db.Modules.FirstOrDefault(m => m.ModuleKey == modKey);
            if (mod == null)
            {
                db.Modules.Add(new Module { ModuleKey = modKey, Name = modKey.ToUpperInvariant(), IsEnabled = true, Version = "1.0.0" });
                db.SaveChanges();
            }

            var tMod = db.TenantModules.FirstOrDefault(tm => tm.TenantId == tenant.Id && tm.ModuleKey == modKey);
            if (tMod == null)
            {
                db.TenantModules.Add(new TenantModule { TenantId = tenant.Id, ModuleKey = modKey, IsEnabled = true });
                db.SaveChanges();
            }
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Development seed skipped so the API can still start.");
    }
}

// Policy Seeding
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var tenantAccessor = scope.ServiceProvider.GetRequiredService<ITenantAccessor>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("PolicySeeder");
    var seeder = new PolicySeeder();
    try
    {
        await seeder.EnsurePoliciesAsync(db, tenantAccessor, logger);
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Policy seeding skipped so the API can still start.");
    }
}

// Page Schema Seeding (Phase 1A — seeds DynamicPage schemas for all stub pages)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var tenantAccessor = scope.ServiceProvider.GetRequiredService<ITenantAccessor>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("PageSchemaSeeder");
    var pageSeeder = new PageSchemaSeeder();
    try
    {
        await pageSeeder.EnsurePageSchemasAsync(db, tenantAccessor, logger);
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Page schema seeding skipped so the API can still start.");
    }

    var wfLogger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("WorkflowDefinitionSeeder");
    var wfSeeder = new WorkflowDefinitionSeeder();
    try
    {
        await wfSeeder.EnsureWorkflowDefinitionsAsync(db, tenantAccessor, wfLogger);
    }
    catch (Exception ex)
    {
        wfLogger.LogWarning(ex, "Workflow definition seeding skipped so the API can still start.");
    }
}

// Health Check Endpoints
var healthCheckOptions = new HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = System.Text.Json.JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                description = e.Value.Description,
                duration = e.Value.Duration.TotalMilliseconds
            }),
            totalDuration = report.TotalDuration.TotalMilliseconds
        });
        await context.Response.WriteAsync(result);
    }
};

app.MapHealthChecks("/health", healthCheckOptions).AllowAnonymous();
app.MapHealthChecks("/api/v1/health", healthCheckOptions).AllowAnonymous();

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("api")
}).AllowAnonymous();
app.MapHealthChecks("/api/v1/health/live", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("api")
}).AllowAnonymous();

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("db")
}).AllowAnonymous();
app.MapHealthChecks("/api/v1/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("db")
}).AllowAnonymous();

if (!app.Environment.IsEnvironment("Test"))
{
    try
    {
        app.UseHangfireDashboard("/hangfire", new DashboardOptions
        {
            Authorization = new[] { new HangfireAdminAuthFilter() }
        });
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Hangfire dashboard was not started. The API will continue without it.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapGet("/", () => Results.Redirect("http://localhost:3000")).AllowAnonymous();
    app.MapGet("/login", () => Results.Redirect("http://localhost:3000/login")).AllowAnonymous();
}

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();

static void LoadDotEnvConfiguration(ConfigurationManager configuration, string contentRootPath)
{
    var candidates = new[]
    {
        FindDotEnvPath(contentRootPath),
        FindDotEnvPath(Directory.GetCurrentDirectory())
    }
    .Where(path => !string.IsNullOrWhiteSpace(path))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

    foreach (var path in candidates)
    {
        if (path is null || !File.Exists(path)) continue;

        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        foreach (var rawLine in File.ReadLines(path))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue;

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0) continue;

            var key = line[..separatorIndex].Trim();
            var value = line[(separatorIndex + 1)..].Trim().Trim('"');
            if (key.Length == 0) continue;

            values[key] = value;
            values[key.Replace("__", ":", StringComparison.Ordinal)] = value;
            Environment.SetEnvironmentVariable(key, value);
        }

        if (values.Count > 0)
        {
            configuration.AddInMemoryCollection(values);
        }
    }
}

static string? FindDotEnvPath(string? startDirectory)
{
    if (string.IsNullOrWhiteSpace(startDirectory)) return null;

    var directory = new DirectoryInfo(startDirectory);
    while (directory is not null)
    {
        var candidate = Path.Combine(directory.FullName, ".env");
        if (File.Exists(candidate)) return candidate;
        directory = directory.Parent;
    }

    return null;
}

public partial class Program
{
}
