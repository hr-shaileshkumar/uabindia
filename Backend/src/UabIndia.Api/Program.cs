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
using Microsoft.AspNetCore.Http.Features;
using UabIndia.Core.Authorization;
using UabIndia.Core.Services;
using Hangfire;
using Hangfire.SqlServer;
using Sentry;
using Sentry.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

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
    jwtKey ??= "test_jwt_key_1234567890";
    jwtIssuer ??= "test-issuer";
    jwtAudience ??= "test-audience";
}
if (string.IsNullOrWhiteSpace(jwtKey) || string.IsNullOrWhiteSpace(jwtIssuer) || string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException("JWT configuration missing. Please set 'Jwt:Key', 'Jwt:Issuer' and 'Jwt:Audience' via appsettings or environment variables (Jwt__Key/JWT_KEY etc.).");
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

builder.Services.AddControllers();

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
        var origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
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

// Encryption service for PII
builder.Services.AddSingleton<IEncryptionService, UabIndia.Infrastructure.Services.AesEncryptionService>();

// Health checks for operational monitoring
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>(
        name: "database",
        tags: new[] { "db", "sql" })
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy(), tags: new[] { "api" });

// DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var conn = configuration.GetConnectionString("DefaultConnection") ?? "Server=.;Database=UabIndia_HRMS;Trusted_Connection=True;";
    options.UseSqlServer(conn);
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
});

builder.Services.AddScoped<IAuthorizationHandler, ModuleEnabledHandler>();
builder.Services.AddScoped<IPolicyEngine, UabIndia.Infrastructure.Services.PolicyEngineService>();
// Workflow service (EF-backed production implementation)
builder.Services.AddScoped<UabIndia.Application.Interfaces.IWorkflowService, UabIndia.Infrastructure.Services.EfWorkflowService>();

// Rate limiting - Multi-layer approach
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    var isDev = builder.Environment.IsDevelopment();

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
    
    // Layer 1: Per-IP rate limiting (DDoS protection)
    options.AddPolicy("ip-limit", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
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
                TokenLimit = 10000,              // 10k requests per day per tenant
                ReplenishmentPeriod = TimeSpan.FromDays(1),
                TokensPerPeriod = 10000,
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
                    PermitLimit = 100,
                    Window = TimeSpan.FromMinutes(1),
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
                    TokenLimit = 10000,
                    ReplenishmentPeriod = TimeSpan.FromDays(1),
                    TokensPerPeriod = 10000,
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
    var sqlServerConnection = configuration.GetConnectionString("DefaultConnection") ?? "Server=.;Database=UabIndia_HRMS;Trusted_Connection=True;";
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
    });

    // Background job service
    builder.Services.AddScoped<UabIndia.Infrastructure.Services.HangfireJobService>();
}

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
else
{
    app.Logger.LogDebug("JWT config (dev): Issuer={Issuer}, Audience={Audience}, KeyLength={KeyLength}", jwtIssuer, jwtAudience, jwtKey.Length);
}

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
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "connect-src 'self' http://localhost:3000 http://localhost:5000; " +
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
        var allowedOrigins = new[]
        {
            "http://localhost:3000",   // Development frontend
            "http://localhost:5173",   // Vite dev server
            "https://hrms.uabindia.com", // Production domain
            builder.Configuration["CORS:AllowedOrigin"] ?? ""
        };

        var origin = context.Request.Headers["Origin"].ToString();
        var referer = context.Request.Headers["Referer"].ToString();
        
        // Check if origin matches allowed origins
        var isValidOrigin = !string.IsNullOrEmpty(origin) && 
                           allowedOrigins.Any(allowed => origin.StartsWith(allowed, StringComparison.OrdinalIgnoreCase));
        
        // Fallback to referer check if origin is missing (some API clients don't send Origin)
        var isValidReferer = string.IsNullOrEmpty(origin) && !string.IsNullOrEmpty(referer) &&
                            allowedOrigins.Any(allowed => referer.StartsWith(allowed, StringComparison.OrdinalIgnoreCase));
        
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

// Structured request logging
app.UseMiddleware<RequestLoggingMiddleware>();

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
app.UseMiddleware<TenantResolverMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

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
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
    var tenantAccessor = scope.ServiceProvider.GetRequiredService<ITenantAccessor>();

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

    var adminRole = db.Roles.FirstOrDefault(r => r.TenantId == tenant.Id && r.Name == RoleCatalog.AdminRoleName);
    var superAdminRole = db.Roles.FirstOrDefault(r => r.TenantId == tenant.Id && r.Name == RoleCatalog.SuperAdminRoleName);
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

    var adminUser = db.Users.FirstOrDefault(u => u.TenantId == tenant.Id && u.Email == "admin@uabindia.in");
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
        var verify = hasher.VerifyHashedPassword(adminUser, adminUser.PasswordHash, "Admin@123");
        if (verify == PasswordVerificationResult.Failed)
        {
            adminUser.PasswordHash = hasher.HashPassword(adminUser, "Admin@123");
            db.Users.Update(adminUser);
            db.SaveChanges();
        }
    }

    var adminUserRole = db.UserRoles.FirstOrDefault(ur => ur.TenantId == tenant.Id && ur.UserId == adminUser.Id && ur.RoleId == adminRole.Id);
    if (adminUserRole == null)
    {
        db.UserRoles.Add(new UserRole { TenantId = tenant.Id, UserId = adminUser.Id, RoleId = adminRole.Id });
        db.SaveChanges();
    }

    var superUserRole = db.UserRoles.FirstOrDefault(ur => ur.TenantId == tenant.Id && ur.UserId == adminUser.Id && ur.RoleId == superAdminRole.Id);
    if (superUserRole == null)
    {
        db.UserRoles.Add(new UserRole { TenantId = tenant.Id, UserId = adminUser.Id, RoleId = superAdminRole.Id });
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
    catch (Microsoft.Data.SqlClient.SqlException ex)
    {
        logger.LogWarning(ex, "Policy seeding skipped because required tables are missing. Run migrations first.");
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
    // Hangfire Dashboard (admin-only: /hangfire)
    app.UseHangfireDashboard("/hangfire");

    // Schedule recurring background jobs
    using (var connection = JobStorage.Current.GetConnection())
    {
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

app.MapControllers();

app.Run();

public partial class Program
{
}
