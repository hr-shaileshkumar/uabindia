using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Api.Middleware;
using UabIndia.Api.Services;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Identity;
using UabIndia.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using UabIndia.Api.Authorization;
using System.Data.Common;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Http.Features;
using UabIndia.Core.Authorization;
using UabIndia.Core.Services;
using Hangfire;
using Hangfire.SqlServer;
using Sentry;
using Sentry.AspNetCore;
using System.IO;

var builder = WebApplication.CreateBuilder(args);
LoadDotEnvConfiguration(builder.Configuration, builder.Environment.ContentRootPath);

var explicitEnvironment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
    ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT");
if (string.IsNullOrWhiteSpace(explicitEnvironment))
{
    explicitEnvironment = Environments.Development;
}
builder.Environment.EnvironmentName = explicitEnvironment;
builder.Configuration.AddJsonFile($"appsettings.{explicitEnvironment}.json", optional: true, reloadOnChange: true);

// Application Insights for production monitoring and telemetry
if (!builder.Environment.IsDevelopment())
{
    var aiConnectionString = builder.Configuration["ApplicationInsights:ConnectionString"];
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

var env = builder.Environment;

// Configuration
var configuration = builder.Configuration;
var sqlServerConnectionString = NormalizeSqlServerConnectionString(
    configuration.GetConnectionString("DefaultConnection") ?? @"Server=DESKTOP-6698OV0\SHAILESH;Database=UabIndia_HRMS;User ID=SA;Password=YOUR_PASSWORD;Persist Security Info=True;TrustServerCertificate=True;Encrypt=True;",
    env);
configuration["ConnectionStrings:DefaultConnection"] = sqlServerConnectionString;

// Sentry for error tracking and performance monitoring
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

// Logging: verbose in development, minimal in production
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(env.IsDevelopment()
    ? Microsoft.Extensions.Logging.LogLevel.Debug
    : Microsoft.Extensions.Logging.LogLevel.Information);

// Ensure JWT secrets are provided via configuration or environment variables
string? jwtKey = configuration["Jwt:Key"];
string? jwtIssuer = configuration["Jwt:Issuer"];
string? jwtAudience = configuration["Jwt:Audience"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    jwtKey = Environment.GetEnvironmentVariable("Jwt__Key") ?? Environment.GetEnvironmentVariable("JWT_KEY");
}
if (string.IsNullOrWhiteSpace(jwtIssuer))
{
    jwtIssuer = Environment.GetEnvironmentVariable("Jwt__Issuer") ?? Environment.GetEnvironmentVariable("JWT_ISSUER");
}
if (string.IsNullOrWhiteSpace(jwtAudience))
{
    jwtAudience = Environment.GetEnvironmentVariable("Jwt__Audience") ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE");
}
if (env.IsEnvironment("Test"))
{
    jwtKey ??= "test_jwt_key_for_automated_tests_only_0123456789";
    jwtIssuer ??= "test-issuer";
    jwtAudience ??= "test-audience";
}
if (string.IsNullOrWhiteSpace(jwtKey) || string.IsNullOrWhiteSpace(jwtIssuer) || string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException("JWT configuration missing. Please set 'Jwt:Key', 'Jwt:Issuer' and 'Jwt:Audience' via appsettings or environment variables (Jwt__Key/JWT_KEY etc.).");
}
// HMAC-SHA256 derives its security from key length; anything under 256 bits is signable by brute force.
if (System.Text.Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException("'Jwt:Key' must be at least 32 bytes (256 bits) to sign tokens with HMAC-SHA256.");
}

// Ensure Encryption key is provided via configuration or environment variables
string? encryptionKey = configuration["Encryption:Key"];
if (string.IsNullOrWhiteSpace(encryptionKey))
{
    encryptionKey = Environment.GetEnvironmentVariable("Encryption__Key") ?? Environment.GetEnvironmentVariable("ENCRYPTION_KEY");
}
if (env.IsDevelopment() || env.IsEnvironment("Test"))
{
    encryptionKey ??= "dev_encryption_key_1234567890";
}
if (string.IsNullOrWhiteSpace(encryptionKey))
{
    throw new InvalidOperationException("Encryption key missing. Set 'Encryption:Key' or ENCRYPTION_KEY.");
}
builder.Configuration["Encryption:Key"] = encryptionKey;

if (env.IsDevelopment())
{
    builder.Logging.AddFilter("Microsoft.AspNetCore.Authentication", Microsoft.Extensions.Logging.LogLevel.Debug);
    builder.Logging.AddFilter("Microsoft.AspNetCore.Authorization", Microsoft.Extensions.Logging.LogLevel.Debug);
    builder.Logging.AddFilter("Microsoft.IdentityModel", Microsoft.Extensions.Logging.LogLevel.Debug);
    builder.Logging.AddFilter("System.IdentityModel", Microsoft.Extensions.Logging.LogLevel.Debug);
    builder.Logging.AddFilter("UabIndia.Api", Microsoft.Extensions.Logging.LogLevel.Debug);
    builder.Logging.AddFilter("UabIndia.Identity", Microsoft.Extensions.Logging.LogLevel.Debug);
    builder.Logging.AddFilter("UabIndia.Infrastructure", Microsoft.Extensions.Logging.LogLevel.Debug);
    builder.Logging.AddFilter("UabIndia.Application", Microsoft.Extensions.Logging.LogLevel.Debug);
}

// High-Concurrency Kestrel Server Limits for 200,000 Users
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxConcurrentConnections = 200000;
    options.Limits.MaxConcurrentUpgradedConnections = 50000;
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(15);
});

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});
builder.Services.Configure<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProviderOptions>(options =>
{
    options.Level = System.IO.Compression.CompressionLevel.Fastest;
});

builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10 MB total
    options.ValueLengthLimit = 1024 * 1024; // 1 MB per form value
    options.MultipartHeadersLengthLimit = 32 * 1024; // 32 KB
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("default", policy =>
    {
        var origins = GetAllowedCorsOrigins(configuration);
        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(origin =>
                    origins.Any(allowed => string.Equals(allowed, origin, StringComparison.OrdinalIgnoreCase)) ||
                    IsAllowedDevelopmentOrigin(origin))
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
        else
        {
            policy.WithOrigins(origins)
                .SetIsOriginAllowedToAllowWildcardSubdomains()
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    });
});

// Memory cache for tenant caching
builder.Services.AddMemoryCache();

// Redis distributed cache (requires Redis server running)
var redisConnection = configuration.GetConnectionString("Redis") ?? configuration["Redis:Connection"];
if (!string.IsNullOrEmpty(redisConnection))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnection;
        options.InstanceName = "hrms_";
    });
}
else
{
    // Fallback to distributed memory cache if Redis not configured
    builder.Services.AddDistributedMemoryCache();
}

// Cache service
builder.Services.AddScoped<UabIndia.Core.Services.ICacheService, UabIndia.Infrastructure.Services.DistributedCacheService>();

// Tenant accessor
builder.Services.AddScoped<ITenantAccessor, TenantAccessor>();

// Input sanitization service (XSS protection)
builder.Services.AddScoped<UabIndia.Api.Services.InputSanitizer>();
builder.Services.AddScoped<TenantProvisioningService>();
builder.Services.AddScoped<TenantResolutionService>();
builder.Services.AddScoped<TenantEmailService>();
builder.Services.AddScoped<IUiSchemaService, UiSchemaService>();
builder.Services.AddScoped<IWebsiteContentService, WebsiteContentService>();
builder.Services.AddSingleton<RoleMappingResolver>();

// Encryption service for PII
builder.Services.AddSingleton<IEncryptionService, UabIndia.Infrastructure.Services.AesEncryptionService>();

// Multi-currency conversion service
builder.Services.AddScoped<UabIndia.Application.Interfaces.ICurrencyConversionService, UabIndia.Infrastructure.Services.CurrencyConversionService>();

// Health checks for operational monitoring
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>(
        name: "database",
        tags: new[] { "db", "sql" })
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy(), tags: new[] { "api" });

// DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(sqlServerConnectionString);
    options.ReplaceService<IModelCacheKeyFactory, TenantModelCacheKeyFactory>();
});

// Auth - JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtKey))
    };
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = ctx =>
        {
            // Allow JWT from httpOnly cookie when Authorization header is absent
            if (string.IsNullOrWhiteSpace(ctx.Token) && ctx.Request.Cookies.TryGetValue("access_token", out var token))
            {
                ctx.Token = token;
            }
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = ctx =>
        {
            if (env.IsDevelopment())
            {
                var logger = ctx.HttpContext.RequestServices.GetRequiredService<Microsoft.Extensions.Logging.ILoggerFactory>()
                    .CreateLogger("JwtAuth");
                logger.LogError(ctx.Exception, "JWT authentication failed: {Message}", ctx.Exception.Message);

                string? token = null;
                var authHeader = ctx.Request.Headers["Authorization"].ToString();
                if (!string.IsNullOrWhiteSpace(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    token = authHeader.Substring("Bearer ".Length).Trim();
                }
                if (string.IsNullOrWhiteSpace(token) && ctx.Request.Cookies.TryGetValue("access_token", out var cookieToken))
                {
                    token = cookieToken;
                }

                if (!string.IsNullOrWhiteSpace(token))
                {
                    try
                    {
                        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                        var jwt = handler.ReadJwtToken(token);
                        var aud = string.Join(",", jwt.Audiences);
                        logger.LogWarning("JWT details: Issuer={Issuer}, Audience={Audience}, Expires={Expires}", jwt.Issuer, aud, jwt.ValidTo);
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "Failed to read JWT for diagnostics.");
                    }
                }
            }
            return Task.CompletedTask;
        },
        OnChallenge = ctx =>
        {
            if (env.IsDevelopment())
            {
                var logger = ctx.HttpContext.RequestServices.GetRequiredService<Microsoft.Extensions.Logging.ILoggerFactory>()
                    .CreateLogger("JwtAuth");
                logger.LogWarning("JWT challenge: Error={Error}, Description={Description}, Uri={Uri}", ctx.Error, ctx.ErrorDescription, ctx.ErrorUri);
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    bool IsAdminRole(Microsoft.AspNetCore.Authorization.AuthorizationHandlerContext context)
    {
        var roleClaims = context.User.Claims
            .Where(c => c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase) || c.Type.EndsWith("role", StringComparison.OrdinalIgnoreCase))
            .Select(c => c.Value);

        return RoleCatalog.IsAdminLike(roleClaims);
    }

    // Admin-only policies
    options.AddPolicy("AdminOnly", policy => policy.RequireAssertion(IsAdminRole));
    
    // LAYER 1: Platform / Core (System-level, admin-only)
    options.AddPolicy("Module:platform", policy => 
    {
        policy.RequireAssertion(IsAdminRole); // Platform is admin-only
        policy.Requirements.Add(new ModuleEnabledRequirement("platform"));
    });
    
    // LAYER 2: Modules & Licensing (Product control, admin-only)
    options.AddPolicy("Module:licensing", policy => 
    {
        policy.RequireAssertion(IsAdminRole); // Licensing is admin-only
        policy.Requirements.Add(new ModuleEnabledRequirement("licensing"));
    });
    
    // LAYER 3: Authentication & Security (Identity layer, admin-only for most)
    options.AddPolicy("Module:security", policy => 
    {
        policy.RequireAssertion(IsAdminRole); // Security management is admin-only
        policy.Requirements.Add(new ModuleEnabledRequirement("security"));
    });
    
    // LAYER 4: Business Modules (Client-facing, subscription-based)
    options.AddPolicy("Module:hrms", policy => policy.Requirements.Add(new ModuleEnabledRequirement("hrms")));
    options.AddPolicy("Module:payroll", policy => policy.Requirements.Add(new ModuleEnabledRequirement("payroll")));
    options.AddPolicy("Module:reports", policy => policy.Requirements.Add(new ModuleEnabledRequirement("reports")));
    options.AddPolicy("Module:compliance", policy => policy.Requirements.Add(new ModuleEnabledRequirement("compliance")));
    
    // Future business modules
    options.AddPolicy("Module:crm", policy => policy.Requirements.Add(new ModuleEnabledRequirement("crm")));
    options.AddPolicy("Module:inventory", policy => policy.Requirements.Add(new ModuleEnabledRequirement("inventory")));
    options.AddPolicy("Module:finance", policy => policy.Requirements.Add(new ModuleEnabledRequirement("finance")));
    options.AddPolicy("Module:procurement", policy => policy.Requirements.Add(new ModuleEnabledRequirement("procurement")));
    options.AddPolicy("Module:assets", policy => policy.Requirements.Add(new ModuleEnabledRequirement("assets")));
    options.AddPolicy("Module:notifications", policy => policy.Requirements.Add(new ModuleEnabledRequirement("notifications")));
    options.AddPolicy("Module:projects", policy => policy.Requirements.Add(new ModuleEnabledRequirement("projects")));
    options.AddPolicy("Module:sales", policy => policy.Requirements.Add(new ModuleEnabledRequirement("sales")));
    options.AddPolicy("Module:workflow", policy => policy.Requirements.Add(new ModuleEnabledRequirement("workflow")));
});

builder.Services.AddScoped<IAuthorizationHandler, ModuleEnabledHandler>();
builder.Services.AddScoped<IPolicyEngine, UabIndia.Infrastructure.Services.PolicyEngineService>();
// Workflow service (EF-backed production implementation)
builder.Services.AddScoped<UabIndia.Application.Interfaces.IWorkflowService, UabIndia.Infrastructure.Services.EfWorkflowService>();

// Startup database bootstrap (migrations + idempotent schema compatibility patches)
builder.Services.AddHostedService<DatabaseInitializationService>();

// Rate limiting - Multi-layer approach
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    var isDev = builder.Environment.IsDevelopment();
    var ipPermitLimit = isDev ? 5000 : 100;
    var ipWindow = isDev ? TimeSpan.FromMinutes(1) : TimeSpan.FromMinutes(1);
    var tenantTokenLimit = isDev ? 500000 : 10000;
    var tenantReplenishment = isDev ? TimeSpan.FromHours(1) : TimeSpan.FromDays(1);
    var tenantTokensPerPeriod = isDev ? 500000 : 10000;

    // Auth-specific limiter (stricter than global)
    options.AddPolicy("auth-login", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = isDev ? 30 : 5,
                Window = isDev ? TimeSpan.FromMinutes(5) : TimeSpan.FromMinutes(15),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    // Forgot-password limiter (stricter: 3 attempts per 15 min)
    options.AddPolicy("auth-forgot", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = isDev ? 20 : 3,
                Window = isDev ? TimeSpan.FromMinutes(5) : TimeSpan.FromMinutes(15),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    // Reset-password limiter
    options.AddPolicy("auth-reset", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = isDev ? 20 : 5,
                Window = isDev ? TimeSpan.FromMinutes(5) : TimeSpan.FromMinutes(15),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    // Layer 1: Per-IP rate limiting (DDoS protection)
    options.AddPolicy("ip-limit", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = ipPermitLimit,
                Window = ipWindow,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));
    
    // Layer 2: Per-Tenant rate limiting (Fair usage enforcement)
    options.AddPolicy("tenant-quota", httpContext =>
    {
        var tenantAccessor = httpContext.RequestServices.GetService<ITenantAccessor>();
        var tenantId = tenantAccessor?.GetTenantId() ?? Guid.Empty;
        
        return RateLimitPartition.GetTokenBucketLimiter(
            partitionKey: tenantId.ToString(),
            factory: _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit = tenantTokenLimit,
                ReplenishmentPeriod = tenantReplenishment,
                TokensPerPeriod = tenantTokensPerPeriod,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });
    
    // Default policy: Combined IP + Tenant limiting
    options.GlobalLimiter = PartitionedRateLimiter.CreateChained(
        PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        {
            var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            return RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: ip,
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = ipPermitLimit,
                    Window = ipWindow,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
        }),
        PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        {
            var tenantAccessor = httpContext.RequestServices.GetService<ITenantAccessor>();
            var tenantId = tenantAccessor?.GetTenantId() ?? Guid.Empty;
            
            return RateLimitPartition.GetTokenBucketLimiter(
                partitionKey: tenantId.ToString(),
                factory: _ => new TokenBucketRateLimiterOptions
                {
                    TokenLimit = tenantTokenLimit,
                    ReplenishmentPeriod = tenantReplenishment,
                    TokensPerPeriod = tenantTokensPerPeriod,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
        })
    );
});

// DI for identity services
builder.Services.AddSingleton<UabIndia.Identity.Services.JwtService>();
builder.Services.AddSingleton<UabIndia.Identity.Services.RefreshTokenService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
// Refresh token repository
builder.Services.AddScoped<UabIndia.Application.Interfaces.IRefreshTokenRepository, UabIndia.Infrastructure.Data.RefreshTokenRepository>();

// Appraisal repository
builder.Services.AddScoped<UabIndia.Application.Interfaces.IAppraisalRepository, UabIndia.Infrastructure.Data.AppraisalRepository>();

// Recruitment repository
builder.Services.AddScoped<UabIndia.Application.Interfaces.IRecruitmentRepository, UabIndia.Infrastructure.Repositories.RecruitmentRepository>();

// Training repository
builder.Services.AddScoped<UabIndia.Application.Interfaces.ITrainingRepository, UabIndia.Infrastructure.Repositories.TrainingRepository>();

// Asset repository
builder.Services.AddScoped<UabIndia.Application.Interfaces.IAssetRepository, UabIndia.Infrastructure.Repositories.AssetRepository>();

// Shift repository
builder.Services.AddScoped<UabIndia.Application.Interfaces.IShiftRepository, UabIndia.Infrastructure.Repositories.ShiftRepository>();

// Overtime repository
builder.Services.AddScoped<UabIndia.Application.Interfaces.IOvertimeRepository, UabIndia.Infrastructure.Repositories.OvertimeRepository>();

// Compliance repository
builder.Services.AddScoped<UabIndia.Application.Interfaces.IComplianceRepository, UabIndia.Infrastructure.Repositories.ComplianceRepository>();

// Hangfire for background jobs (skip in test environment)
if (!env.IsEnvironment("Test"))
{
    var sqlServerConnection = sqlServerConnectionString;
    builder.Services.AddHangfire(config =>
    {
        config.UseSqlServerStorage(sqlServerConnection, new Hangfire.SqlServer.SqlServerStorageOptions
        {
            CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
            SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
            QueuePollInterval = TimeSpan.FromSeconds(15),
            UseRecommendedIsolationLevel = true,
            DisableGlobalLocks = true
        });
    });

    builder.Services.AddHangfireServer(options =>
    {
        options.WorkerCount = Environment.ProcessorCount * 2;
        options.SchedulePollingInterval = TimeSpan.FromSeconds(15);
        options.Queues = new[] { "tenant-provisioning", "default" };
    });

    // Background job service
    builder.Services.AddScoped<UabIndia.Infrastructure.Services.HangfireJobService>();
}

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (!app.Environment.IsEnvironment("Test"))
{
    using var migrationScope = app.Services.CreateScope();
    var migrationDb = migrationScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var migrationLogger = migrationScope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILoggerFactory>()
        .CreateLogger("DatabaseMigration");

    try
    {
        if (migrationDb.Database.IsRelational())
        {
            await migrationDb.Database.MigrateAsync();
            await EnsureSchemaCompatibilityAsync(migrationDb, migrationLogger);
            migrationLogger.LogInformation("Database migrations applied successfully at startup.");
        }
        else
        {
            migrationLogger.LogInformation("Skipping relational database migrations for provider {ProviderName}.",
                migrationDb.Database.ProviderName);
        }
    }
    catch (Exception ex)
    {
        // If migration failed due to objects already existing (e.g. running against a DB that was created manually),
        // attempt to reconcile by marking pending migrations as applied in __EFMigrationsHistory and retrying.
        migrationLogger.LogWarning(ex, "Migrations failed at startup. Attempting reconciliation if schema already exists.");

        // Only handle SQL Server-specific 'object already exists' error (ErrorNumber 2714)
        if (ex is SqlException sqlEx && sqlEx.Number == 2714)
        {
            try
            {
                await MarkPendingMigrationsAsAppliedAsync(migrationDb, migrationLogger);

                using var retryScope = app.Services.CreateScope();
                var retryDb = retryScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                await retryDb.Database.MigrateAsync();
                await EnsureSchemaCompatibilityAsync(retryDb, migrationLogger);
                migrationLogger.LogInformation("Database migrations applied successfully after reconciliation.");
            }
            catch (Exception inner)
            {
                migrationLogger.LogError(inner, "Reconciliation attempt failed while applying migrations.");

                if (ShouldRecoverDevelopmentDatabase(inner, app.Environment))
                {
                    try
                    {
                        migrationLogger.LogWarning("Development database appears to be in a partially migrated state. Attempting non-destructive migration retry.");
                        using var recoveryScope = app.Services.CreateScope();
                        var recoveryDb = recoveryScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                        // Avoid automatically deleting the database to prevent data loss in development
                        await recoveryDb.Database.MigrateAsync();
                        await EnsureSchemaCompatibilityAsync(recoveryDb, migrationLogger);
                        migrationLogger.LogInformation("Development database migrations applied successfully after reconciliation.");
                    }
                    catch (Exception recoveryEx)
                    {
                        migrationLogger.LogError(recoveryEx, "Failed to recover the development database after reconciliation failure.");
                        if (ShouldAllowStartupWithoutDatabase(recoveryEx, app.Environment))
                        {
                            migrationLogger.LogWarning("Continuing startup without a database connection because development SQL initialization is unavailable.");
                        }
                        else
                        {
                            throw;
                        }
                    }
                }
                else
                {
                    if (ShouldAllowStartupWithoutDatabase(inner, app.Environment))
                    {
                        migrationLogger.LogWarning("Continuing startup without a database connection because development SQL initialization is unavailable.");
                    }
                    else
                    {
                        throw;
                    }
                }
            }
        }
        else if (ShouldRecoverDevelopmentDatabase(ex, app.Environment))
        {
            try
            {
                migrationLogger.LogWarning("Development database appears to be in a partially migrated state. Attempting non-destructive migration retry.");
                // Avoid automatically deleting the database to prevent accidental data loss
                await migrationDb.Database.MigrateAsync();
                await EnsureSchemaCompatibilityAsync(migrationDb, migrationLogger);
                migrationLogger.LogInformation("Development database migrations applied successfully.");
            }
            catch (Exception inner)
            {
                migrationLogger.LogError(inner, "Failed to recover the development database.");
                if (ShouldAllowStartupWithoutDatabase(inner, app.Environment))
                {
                    migrationLogger.LogWarning("Continuing startup without a database connection because development SQL initialization is unavailable.");
                }
                else
                {
                    throw;
                }
            }
        }
        else
        {
            migrationLogger.LogError(ex, "Failed to apply database migrations at startup.");
            if (ShouldAllowStartupWithoutDatabase(ex, app.Environment))
            {
                migrationLogger.LogWarning("Continuing startup without a database connection because development SQL initialization is unavailable.");
            }
            else
            {
                throw;
            }
        }
    }
}

static bool ShouldRecoverDevelopmentDatabase(Exception ex, IWebHostEnvironment env)
{
    if (!env.IsDevelopment() || ex is not SqlException)
    {
        return false;
    }

    // Local development may have a partially applied or inconsistent schema.
    // Recover by recreating the database from the current model and marking
    // all migrations as applied when running locally.
    return true;
}

static bool ShouldAllowStartupWithoutDatabase(Exception ex, IWebHostEnvironment env)
{
    if (!env.IsDevelopment())
    {
        return false;
    }

    for (var current = ex; current is not null; current = current.InnerException)
    {
        if (current is SqlException)
        {
            return true;
        }

        if (current.Message.Contains("SSPI", StringComparison.OrdinalIgnoreCase) ||
            current.Message.Contains("requires encryption", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }
    }

    return false;
}

// NOTE: This function is defined but currently unused. It's kept for potential future use in recovery scenarios.
// Uncomment the call in the SqlException handling if needed.
#pragma warning disable CS8321
static async Task MarkAllMigrationsAsAppliedAsync(ApplicationDbContext db, Microsoft.Extensions.Logging.ILogger logger)
{
    var migrations = db.Database.GetMigrations().ToList();
    if (!migrations.Any())
    {
        logger.LogInformation("No migrations found to mark as applied.");
        return;
    }

    await using var conn = db.Database.GetDbConnection();
    try
    {
        if (conn.State == System.Data.ConnectionState.Closed)
            await conn.OpenAsync();

        var createHistorySql = @"
IF OBJECT_ID(N'[dbo].[__EFMigrationsHistory]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;";
        await db.Database.ExecuteSqlRawAsync(createHistorySql);

        var existingHistory = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        await using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT [MigrationId] FROM [dbo].[__EFMigrationsHistory];";
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                existingHistory.Add(reader.GetString(0));
            }
        }

        foreach (var migration in migrations)
        {
            if (existingHistory.Contains(migration))
                continue;

            await db.Database.ExecuteSqlRawAsync(
                "INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ({0}, {1});",
                migration,
                "8.0.0"
            );
            logger.LogInformation("Marked migration '{Migration}' as applied.", migration);
        }
    }
    finally
    {
        if (conn.State != System.Data.ConnectionState.Closed)
            await conn.CloseAsync();
    }
}

static async Task MarkPendingMigrationsAsAppliedAsync(ApplicationDbContext db, Microsoft.Extensions.Logging.ILogger logger)
{
    // Get pending migrations
    var pending = db.Database.GetPendingMigrations().ToList();
    if (!pending.Any())
    {
        logger.LogInformation("No pending migrations to mark as applied.");
        return;
    }

    // Try to locate migration source files (conservative reconciliation)
    var cwd = System.IO.Directory.GetCurrentDirectory();
    var candidatePaths = new[] {
        System.IO.Path.GetFullPath(System.IO.Path.Combine(cwd, "..", "UabIndia.Infrastructure", "Data", "Migrations")),
        System.IO.Path.GetFullPath(System.IO.Path.Combine(cwd, "..", "UabIndia.Infrastructure", "Migrations")),
        System.IO.Path.GetFullPath(System.IO.Path.Combine(cwd, "..", "..", "UabIndia.Infrastructure", "Data", "Migrations")),
        System.IO.Path.GetFullPath(System.IO.Path.Combine(cwd, "..", "..", "UabIndia.Infrastructure", "Migrations"))
    };

    var migrationsFolder = candidatePaths.FirstOrDefault(p => System.IO.Directory.Exists(p));

    await using var conn = db.Database.GetDbConnection();
    try
    {
        if (conn.State == System.Data.ConnectionState.Closed)
            await conn.OpenAsync();

        // Ensure __EFMigrationsHistory table exists (minimal schema)
        var createHistorySql = @"
IF OBJECT_ID(N'[dbo].[__EFMigrationsHistory]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;";
        await db.Database.ExecuteSqlRawAsync(createHistorySql);

        // For each pending migration, if we can detect that its main created tables already exist, mark it applied.
        foreach (var m in pending)
        {
            var tablesDetected = new List<string>();

            if (!string.IsNullOrEmpty(migrationsFolder))
            {
                try
                {
                    var files = System.IO.Directory.GetFiles(migrationsFolder, $"*{m}*.cs");
                    if (files.Length > 0)
                    {
                        var content = System.IO.File.ReadAllText(files[0]);
                        // crude regex to find CreateTable name: "TableName"
                        var rx = new System.Text.RegularExpressions.Regex(@"CreateTable\s*\(\s*name\s*:\s*""(?<t>[^""]+)""", System.Text.RegularExpressions.RegexOptions.Compiled);
                        var matches = rx.Matches(content);
                        foreach (System.Text.RegularExpressions.Match match in matches)
                        {
                            if (match.Success && match.Groups["t"].Success)
                                tablesDetected.Add(match.Groups["t"].Value);
                        }
                        // also check for migrationBuilder.Sql raw creation naming
                        var rx2 = new System.Text.RegularExpressions.Regex(@"CREATE TABLE \[(?<t>[^\]]+)\]", System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.Compiled);
                        var matches2 = rx2.Matches(content);
                        foreach (System.Text.RegularExpressions.Match match in matches2)
                        {
                            if (match.Success && match.Groups["t"].Success)
                                tablesDetected.Add(match.Groups["t"].Value);
                        }
                    }
                }
                catch (Exception readEx)
                {
                    logger.LogDebug(readEx, "Failed to read migration file for {Migration}", m);
                }
            }

            bool shouldMark = false;
            if (tablesDetected.Count == 0)
            {
                // If we couldn't detect files/tables, be conservative and skip marking this migration.
                logger.LogInformation("Skipping automatic mark for migration {Migration} because no table targets were detected.", m);
                shouldMark = false;
            }
            else
            {
                // Check if all detected tables exist
                bool allExist = true;
                foreach (var t in tablesDetected.Distinct())
                {
                    await using var cmd = conn.CreateCommand();
                    cmd.CommandText = $"SELECT CASE WHEN OBJECT_ID(N'[dbo].[{t}]', N'U') IS NOT NULL THEN 1 ELSE 0 END";
                    var res = await cmd.ExecuteScalarAsync();
                    if (res == null || Convert.ToInt32(res) == 0)
                    {
                        allExist = false;
                        break;
                    }
                }

                shouldMark = allExist;
            }

            if (shouldMark)
            {
                var insertSql = $@"IF NOT EXISTS (SELECT 1 FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = '{m}')
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('{m}', '8.0.0');
END;";
                await db.Database.ExecuteSqlRawAsync(insertSql);
                logger.LogInformation("Marked migration {Migration} as applied.", m);
            }
        }

        logger.LogWarning("Migration reconciliation completed (conservative). PendingCount={PendingCount}", pending.Count);
    }
    catch (DbException dbEx)
    {
        logger.LogError(dbEx, "Failed while attempting to mark migrations as applied.");
        throw;
    }
    finally
    {
        try { await conn.CloseAsync(); } catch { }
    }
}

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
        if (path is null || !File.Exists(path))
        {
            continue;
        }

        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        foreach (var rawLine in File.ReadLines(path))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            var value = line[(separatorIndex + 1)..].Trim().Trim('"');
            if (key.Length == 0)
            {
                continue;
            }

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
    if (string.IsNullOrWhiteSpace(startDirectory))
    {
        return null;
    }

    var directory = new DirectoryInfo(startDirectory);
    while (directory is not null)
    {
        var candidate = Path.Combine(directory.FullName, ".env");
        if (File.Exists(candidate))
        {
            return candidate;
        }

        directory = directory.Parent;
    }

    return null;
}
#pragma warning restore CS8321

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
else
{
    app.Logger.LogDebug("JWT config (dev): Issuer={Issuer}, Audience={Audience}, KeyLength={KeyLength}", jwtIssuer, jwtAudience, jwtKey.Length);
}

app.UseResponseCompression();

app.UseHttpsRedirection();

app.UseCors("default");

// Legacy /api/* deprecation schedule (ERP freeze)
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

// Correlation ID for tracing
app.UseMiddleware<CorrelationIdMiddleware>();

// Content Security Policy (CSP) - XSS Protection
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("Content-Security-Policy", 
        "default-src 'self'; " +
        "script-src 'self' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'");
    
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    
    await next();
});

// Origin Header Validation Middleware (CSRF Protection)
app.Use(async (context, next) =>
{
    var method = context.Request.Method;
    var isStateChanging = method == "POST" || method == "PUT" || method == "DELETE" || method == "PATCH";
    
    if (isStateChanging)
    {
        var allowedOrigins = GetAllowedCorsOrigins(builder.Configuration);
        var legacyAllowedOrigin = builder.Configuration["CORS:AllowedOrigin"];

        var origin = context.Request.Headers["Origin"].ToString();
        var referer = context.Request.Headers["Referer"].ToString();

        if (string.IsNullOrWhiteSpace(origin) && string.IsNullOrWhiteSpace(referer))
        {
            await next();
            return;
        }
        
        // Check if origin matches allowed origins
        var isValidOrigin = !string.IsNullOrEmpty(origin) &&
                           (allowedOrigins.Any(allowed => string.Equals(origin, allowed, StringComparison.OrdinalIgnoreCase)) ||
                            (!string.IsNullOrWhiteSpace(legacyAllowedOrigin) && string.Equals(origin, legacyAllowedOrigin, StringComparison.OrdinalIgnoreCase)) ||
                            (app.Environment.IsDevelopment() && IsAllowedDevelopmentOrigin(origin)));
        
        // Fallback to referer check if origin is missing (some API clients don't send Origin)
        var isValidReferer = string.IsNullOrEmpty(origin) && !string.IsNullOrEmpty(referer) &&
                            (allowedOrigins.Any(allowed => referer.StartsWith(allowed, StringComparison.OrdinalIgnoreCase)) ||
                             (!string.IsNullOrWhiteSpace(legacyAllowedOrigin) && referer.StartsWith(legacyAllowedOrigin, StringComparison.OrdinalIgnoreCase)) ||
                             (app.Environment.IsDevelopment() && IsAllowedDevelopmentOrigin(referer)));
        
        if (!isValidOrigin && !isValidReferer)
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new { error = "Invalid origin", message = "Request origin is not allowed" });
            return;
        }
    }
    
    await next();
});

// CSRF token validation for state-changing requests
app.UseMiddleware<CsrfValidationMiddleware>();

// File upload validation (size/type limits)
app.UseMiddleware<FileUploadValidationMiddleware>();

// Structured request/response logging
app.UseMiddleware<RequestResponseLoggingMiddleware>();

app.UseRateLimiter();

// Log request/response bodies only in development to avoid sensitive data exposure
if (app.Environment.IsDevelopment())
{
    app.UseMiddleware<UabIndia.Api.Middleware.RequestResponseLoggingMiddleware>();
    app.Use(async (context, next) =>
    {
        if (context.Request.Path.StartsWithSegments("/api/v1/auth/me"))
        {
            var authHeader = context.Request.Headers["Authorization"].ToString();
            var hasAuthHeader = !string.IsNullOrWhiteSpace(authHeader);
            var hasCookie = context.Request.Cookies.ContainsKey("access_token");
            var logger = context.RequestServices.GetRequiredService<Microsoft.Extensions.Logging.ILoggerFactory>()
                .CreateLogger("AuthHeaderDebug");
            var snippet = hasAuthHeader && authHeader.StartsWith("Bearer ")
                ? authHeader.Substring(0, Math.Min(authHeader.Length, 24)) + "..."
                : authHeader;
            logger.LogDebug("/auth/me auth header present={HasHeader}, cookie present={HasCookie}, authHeaderSnippet={Snippet}", hasAuthHeader, hasCookie, snippet);
        }
        await next();
    });
}
app.UseMiddleware<ExceptionMiddleware>();
app.UseAuthentication();
app.UseMiddleware<TenantResolverMiddleware>();
app.UseAuthorization();

// Centralized backend-driven data visibility context (SuperAdmin: all tenants + deleted)
app.UseMiddleware<DataVisibilityMiddleware>();

// Permission enforcement (policy-first)
app.UseMiddleware<UabIndia.Api.Middleware.PolicyEnforcementMiddleware>();

// Company/Project scope enforcement
app.UseMiddleware<UabIndia.Api.Middleware.OrgScopeMiddleware>();

// Audit middleware - captures all POST/PUT/DELETE for compliance
app.UseMiddleware<AuditMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Dev-only seed to avoid "Invalid credentials" on fresh DB
if (app.Environment.IsDevelopment())
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
        var tenantAccessor = scope.ServiceProvider.GetRequiredService<ITenantAccessor>();

        await UabIndia.Infrastructure.Data.Migrations.MigrationBootstrap.EnsureExtendedSchemaAsync(db);

        var tenant = db.Tenants.FirstOrDefault(t => t.Subdomain == "api") ?? db.Tenants.FirstOrDefault();
        if (tenant == null)
        {
            tenant = new Tenant { Subdomain = "api", Name = "UabIndia API Tenant", IsActive = true };
            db.Tenants.Add(tenant);
            db.SaveChanges();
        }

        // Ensure tenant filter and SaveChanges use the demo tenant
        tenantAccessor.SetTenantId(tenant.Id);
        tenantAccessor.SetTenantSchema($"tenant_{tenant.Subdomain ?? tenant.Id.ToString("N")}");

        var tenantRoles = db.Roles.Where(r => r.TenantId == tenant.Id).ToList();
        var adminRole = tenantRoles.FirstOrDefault(r => RoleCatalog.Parse(r.Name) == SystemRole.Admin);
        var superAdminRole = tenantRoles.FirstOrDefault(r => RoleCatalog.Parse(r.Name) == SystemRole.SuperAdmin);

    if (adminRole != null && !string.Equals(adminRole.Name, RoleCatalog.AdminRoleName, StringComparison.Ordinal))
    {
        adminRole.Name = RoleCatalog.AdminRoleName;
        adminRole.UpdatedAt = DateTime.UtcNow;
        db.SaveChanges();
    }

    if (superAdminRole != null && !string.Equals(superAdminRole.Name, RoleCatalog.SuperAdminRoleName, StringComparison.Ordinal))
    {
        superAdminRole.Name = RoleCatalog.SuperAdminRoleName;
        superAdminRole.UpdatedAt = DateTime.UtcNow;
        db.SaveChanges();
    }

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

    var adminUser = db.Users.IgnoreQueryFilters().FirstOrDefault(u => u.TenantId == tenant.Id && u.Email == "admin@uabindia.in");
    if (adminUser == null)
    {
        adminUser = new User
        {
            TenantId = tenant.Id,
            Email = "admin@uabindia.in",
            FullName = "Admin User",
            IsSystemAdmin = true,
            IsActive = true
        };
        adminUser.PasswordHash = hasher.HashPassword(adminUser, "Admin@123");
        db.Users.Add(adminUser);
        db.SaveChanges();
    }
    else
    {
        // Restore if soft-deleted and ensure correct state and deterministic encryption
        adminUser.IsDeleted = false;
        adminUser.IsActive = true;
        adminUser.IsSystemAdmin = true;
        adminUser.Email = "admin@uabindia.in";
        adminUser.PasswordHash = hasher.HashPassword(adminUser, "Admin@123");
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
    else if (adminUserRole.IsDeleted)
    {
        adminUserRole.IsDeleted = false;
        db.UserRoles.Update(adminUserRole);
        db.SaveChanges();
    }

    var superUserRole = db.UserRoles.IgnoreQueryFilters().FirstOrDefault(ur => ur.TenantId == tenant.Id && ur.UserId == adminUser.Id && ur.RoleId == superAdminRole.Id);
    if (superUserRole == null)
    {
        db.UserRoles.Add(new UserRole { TenantId = tenant.Id, UserId = adminUser.Id, RoleId = superAdminRole.Id });
        db.SaveChanges();
    }
    else if (superUserRole.IsDeleted)
    {
        superUserRole.IsDeleted = false;
        db.UserRoles.Update(superUserRole);
        db.SaveChanges();
    }

    // Seed ERP module
    var erpModule = db.Modules.FirstOrDefault(m => m.ModuleKey == "erp");
    if (erpModule == null)
    {
        erpModule = new Module
        {
            ModuleKey = "erp",
            Name = "ERP",
            IsEnabled = true,
            Version = "1.0.0"
        };
        db.Modules.Add(erpModule);
        db.SaveChanges();
    }

    var erpTenantModule = db.TenantModules.FirstOrDefault(tm => tm.TenantId == tenant.Id && tm.ModuleKey == "erp");
    if (erpTenantModule == null)
    {
        db.TenantModules.Add(new TenantModule
        {
            TenantId = tenant.Id,
            ModuleKey = "erp",
            IsEnabled = true
        });
        db.SaveChanges();
    }

    // Seed HRMS module
    var hrmsModule = db.Modules.FirstOrDefault(m => m.ModuleKey == "hrms");
    if (hrmsModule == null)
    {
        hrmsModule = new Module
        {
            ModuleKey = "hrms",
            Name = "HRMS",
            IsEnabled = true,
            Version = "1.0.0"
        };
        db.Modules.Add(hrmsModule);
        db.SaveChanges();
    }

    var hrmsTenantModule = db.TenantModules.FirstOrDefault(tm => tm.TenantId == tenant.Id && tm.ModuleKey == "hrms");
    if (hrmsTenantModule == null)
    {
        db.TenantModules.Add(new TenantModule
        {
            TenantId = tenant.Id,
            ModuleKey = "hrms",
            IsEnabled = true
        });
        db.SaveChanges();
    }

    // Seed Payroll module
    var payrollModule = db.Modules.FirstOrDefault(m => m.ModuleKey == "payroll");
    if (payrollModule == null)
    {
        payrollModule = new Module
        {
            ModuleKey = "payroll",
            Name = "Payroll",
            IsEnabled = true,
            Version = "1.0.0"
        };
        db.Modules.Add(payrollModule);
        db.SaveChanges();
    }

    var payrollTenantModule = db.TenantModules.FirstOrDefault(tm => tm.TenantId == tenant.Id && tm.ModuleKey == "payroll");
    if (payrollTenantModule == null)
    {
        db.TenantModules.Add(new TenantModule
        {
            TenantId = tenant.Id,
            ModuleKey = "payroll",
            IsEnabled = true
        });
        db.SaveChanges();
    }

    // Seed Reports module
    var reportsModule = db.Modules.FirstOrDefault(m => m.ModuleKey == "reports");
    if (reportsModule == null)
    {
        reportsModule = new Module
        {
            ModuleKey = "reports",
            Name = "Reports",
            IsEnabled = true,
            Version = "1.0.0"
        };
        db.Modules.Add(reportsModule);
        db.SaveChanges();
    }

    var reportsTenantModule = db.TenantModules.FirstOrDefault(tm => tm.TenantId == tenant.Id && tm.ModuleKey == "reports");
    if (reportsTenantModule == null)
    {
        db.TenantModules.Add(new TenantModule
        {
            TenantId = tenant.Id,
            ModuleKey = "reports",
            IsEnabled = true
        });
        db.SaveChanges();
    }

    // Seed Platform module (admin-only)
    var platformModule = db.Modules.FirstOrDefault(m => m.ModuleKey == "platform");
    if (platformModule == null)
    {
        platformModule = new Module
        {
            ModuleKey = "platform",
            Name = "Platform / Core",
            IsEnabled = true,
            Version = "1.0.0"
        };
        db.Modules.Add(platformModule);
        db.SaveChanges();
    }

    var platformTenantModule = db.TenantModules.FirstOrDefault(tm => tm.TenantId == tenant.Id && tm.ModuleKey == "platform");
    if (platformTenantModule == null)
    {
        db.TenantModules.Add(new TenantModule
        {
            TenantId = tenant.Id,
            ModuleKey = "platform",
            IsEnabled = true
        });
        db.SaveChanges();
    }

    // Seed Licensing module (admin-only)
    var licensingModule = db.Modules.FirstOrDefault(m => m.ModuleKey == "licensing");
    if (licensingModule == null)
    {
        licensingModule = new Module
        {
            ModuleKey = "licensing",
            Name = "Modules & Licensing",
            IsEnabled = true,
            Version = "1.0.0"
        };
        db.Modules.Add(licensingModule);
        db.SaveChanges();
    }

    var licensingTenantModule = db.TenantModules.FirstOrDefault(tm => tm.TenantId == tenant.Id && tm.ModuleKey == "licensing");
    if (licensingTenantModule == null)
    {
        db.TenantModules.Add(new TenantModule
        {
            TenantId = tenant.Id,
            ModuleKey = "licensing",
            IsEnabled = true
        });
        db.SaveChanges();
    }

    // Seed Security module (admin-only)
    var securityModule = db.Modules.FirstOrDefault(m => m.ModuleKey == "security");
    if (securityModule == null)
    {
        securityModule = new Module
        {
            ModuleKey = "security",
            Name = "Authentication & Security",
            IsEnabled = true,
            Version = "1.0.0"
        };
        db.Modules.Add(securityModule);
        db.SaveChanges();
    }

        var securityTenantModule = db.TenantModules.FirstOrDefault(tm => tm.TenantId == tenant.Id && tm.ModuleKey == "security");
        if (securityTenantModule == null)
        {
            db.TenantModules.Add(new TenantModule
            {
                TenantId = tenant.Id,
                ModuleKey = "security",
                IsEnabled = true
            });
            db.SaveChanges();
        }
    }
    catch (Exception ex) when (ShouldAllowStartupWithoutDatabase(ex, app.Environment))
    {
        app.Logger.LogWarning(ex, "Skipping development seed because the local database connection is unavailable.");
    }
}

// Ensure policy catalog is seeded for all tenants (admin roles default)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var tenantAccessor = scope.ServiceProvider.GetRequiredService<ITenantAccessor>();
    var logger = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILoggerFactory>()
        .CreateLogger("PolicySeeder");
    var seeder = new UabIndia.Api.Services.PolicySeeder();
    try
    {
        await seeder.EnsurePoliciesAsync(db, tenantAccessor, logger);
    }
    catch (Exception ex) when (ShouldAllowStartupWithoutDatabase(ex, app.Environment))
    {
        logger.LogWarning(ex, "Policy seeding skipped because the local database connection is unavailable.");
    }
}

// Health Check Endpoints for Kubernetes/Docker Orchestration
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
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
});

if (!app.Environment.IsEnvironment("Test"))
{
    try
    {
        // Hangfire Dashboard — restricted to SuperAdmin/Admin roles only
        app.UseHangfireDashboard("/hangfire", new Hangfire.DashboardOptions
        {
            Authorization = new[] { new HangfireAdminAuthFilter() }
        });

        // Schedule recurring background jobs
        using var connection = JobStorage.Current.GetConnection();
        var recurringJobManager = new RecurringJobManager();
        var jobService = app.Services.CreateScope().ServiceProvider.GetRequiredService<UabIndia.Infrastructure.Services.HangfireJobService>();

        // Monthly payroll processing - runs at 11:00 PM on the last day of each month
        RecurringJob.AddOrUpdate(
            "monthly-payroll",
            () => jobService.ProcessMonthlyPayroll(),
            "0 23 L * *",
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc }
        );

        // Leave expiry processing - runs at 1:00 AM on the 1st of each month
        RecurringJob.AddOrUpdate(
            "leave-expiry",
            () => jobService.ExpireLeaveBalances(),
            Cron.Monthly(1, 1),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc }
        );

        // Audit log archival - runs at 2:00 AM every Sunday
        RecurringJob.AddOrUpdate(
            "audit-log-archival",
            () => jobService.ArchiveAuditLogs(),
            Cron.Weekly(DayOfWeek.Sunday, 2),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc }
        );

        // Send pending notifications - runs every 30 minutes
        RecurringJob.AddOrUpdate(
            "send-notifications",
            () => jobService.SendPendingNotifications(),
            "*/30 * * * *",
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc }
        );

        // Temporary data cleanup - runs daily at 3:00 AM
        RecurringJob.AddOrUpdate(
            "cleanup-temp-data",
            () => jobService.CleanupTemporaryData(),
            Cron.Daily(3),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc }
        );
    }
    catch (Exception ex) when (ShouldAllowStartupWithoutDatabase(ex, app.Environment))
    {
        app.Logger.LogWarning(ex, "Skipping Hangfire startup because the local database connection is unavailable.");
    }
}

// Liveness probe - is the application process running?
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("api")
});

// Readiness probe - is the application ready to serve requests?
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("db")
});

if (app.Environment.IsDevelopment())
{
    app.MapGet("/", () => Results.Redirect("http://localhost:3000"));
    app.MapGet("/login", () => Results.Redirect("http://localhost:3000/login"));
}

app.MapControllers();

app.Run();

static async Task EnsureSchemaCompatibilityAsync(ApplicationDbContext db, Microsoft.Extensions.Logging.ILogger logger)
{
    await UabIndia.Infrastructure.Data.Migrations.MigrationBootstrap.EnsureInitialCleanSchemaAsync(db, logger);

    const string ensureColumnsSql = @"
IF OBJECT_ID(N'[dbo].[Tenants]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.Tenants', 'ProvisionStatus') IS NULL
    BEGIN
        ALTER TABLE [dbo].[Tenants] ADD [ProvisionStatus] nvarchar(32) NOT NULL DEFAULT N'Pending';
    END;

    IF COL_LENGTH('dbo.Tenants', 'DeletedAt') IS NULL
    BEGIN
        ALTER TABLE [dbo].[Tenants] ADD [DeletedAt] datetime2 NULL;
    END;

    IF COL_LENGTH('dbo.Tenants', 'DeletedBy') IS NULL
    BEGIN
        ALTER TABLE [dbo].[Tenants] ADD [DeletedBy] uniqueidentifier NULL;
    END;
END;

IF OBJECT_ID(N'[dbo].[Users]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.Users', 'PasswordResetToken') IS NULL
    BEGIN
        ALTER TABLE [dbo].[Users] ADD [PasswordResetToken] nvarchar(512) NULL;
    END;

    IF COL_LENGTH('dbo.Users', 'PasswordResetExpires') IS NULL
    BEGIN
        ALTER TABLE [dbo].[Users] ADD [PasswordResetExpires] datetime2 NULL;
    END;

    IF COL_LENGTH('dbo.Users', 'PasswordResetToken') IS NOT NULL
    BEGIN
        -- If an index depends on PasswordResetToken, drop it before altering the column
        IF EXISTS (
            SELECT 1 FROM sys.indexes WHERE name = N'IX_Users_PasswordResetToken' AND object_id = OBJECT_ID(N'[dbo].[Users]')
        )
        BEGIN
            DROP INDEX [IX_Users_PasswordResetToken] ON [dbo].[Users];
        END

        ALTER TABLE [dbo].[Users] ALTER COLUMN [PasswordResetToken] nvarchar(512) NULL;
    END;
END;";

    var rowsAffected = await db.Database.ExecuteSqlRawAsync(ensureColumnsSql);

    const string ensureIndexesSql = @"
IF OBJECT_ID(N'[dbo].[Users]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.Users', 'PasswordResetToken') IS NOT NULL
       AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Users_PasswordResetToken'
          AND object_id = OBJECT_ID(N'[dbo].[Users]')
    )
    BEGIN
        CREATE INDEX [IX_Users_PasswordResetToken]
            ON [dbo].[Users]([PasswordResetToken])
            WHERE [PasswordResetToken] IS NOT NULL;
    END;

    IF COL_LENGTH('dbo.Users', 'PasswordResetExpires') IS NOT NULL
       AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Users_PasswordResetExpires'
          AND object_id = OBJECT_ID(N'[dbo].[Users]')
    )
    BEGIN
        CREATE INDEX [IX_Users_PasswordResetExpires]
            ON [dbo].[Users]([PasswordResetExpires])
            WHERE [PasswordResetExpires] IS NOT NULL;
    END;
END;";
    await db.Database.ExecuteSqlRawAsync(ensureIndexesSql);
    if (rowsAffected >= 0)
    {
        logger.LogInformation("Schema compatibility check completed.");
    }
}

static bool IsAllowedDevelopmentOrigin(string originOrReferer)
{
    if (string.IsNullOrWhiteSpace(originOrReferer))
    {
        return false;
    }

    if (!Uri.TryCreate(originOrReferer, UriKind.Absolute, out var uri))
    {
        return false;
    }

    if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
    {
        return false;
    }

    var host = uri.Host.ToLowerInvariant();
    if (host is "localhost" or "127.0.0.1" or "0.0.0.0" or "::1" || host.EndsWith(".localhost"))
    {
        return true;
    }

    if (System.Net.IPAddress.TryParse(host, out var ip) &&
        ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
    {
        var bytes = ip.GetAddressBytes();
        return bytes[0] == 10 ||
               (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
               (bytes[0] == 192 && bytes[1] == 168);
    }

    return false;
}

static string[] GetAllowedCorsOrigins(ConfigurationManager configuration)
{
    var configuredOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    var csvOrigins = configuration["Cors:AllowedOriginsCsv"]
        ?? configuration["Cors__AllowedOriginsCsv"]
        ?? configuration["CORS_ALLOWED_ORIGINS"];

    var combinedOrigins = configuredOrigins
        .Concat((csvOrigins ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        .Where(origin => !string.IsNullOrWhiteSpace(origin))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();

    return combinedOrigins;
}

static string NormalizeSqlServerConnectionString(string connectionString, IWebHostEnvironment env)
{
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return connectionString;
    }

    var builder = new SqlConnectionStringBuilder(connectionString);

    if (env.IsDevelopment())
    {
        builder.TrustServerCertificate = true;
    }

    return builder.ConnectionString;
}

public partial class Program
{
}
