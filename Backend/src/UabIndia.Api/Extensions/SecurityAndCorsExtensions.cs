using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using UabIndia.Api.Modules;
using Microsoft.IdentityModel.Tokens;
using UabIndia.Api.Authorization;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Identity.Services;

namespace UabIndia.Api.Extensions
{
    public static class SecurityAndCorsExtensions
    {
        public static IServiceCollection AddEnterpriseSecurityAndCors(
            this IServiceCollection services,
            IConfiguration configuration,
            IHostEnvironment env,
            IModuleRegistry? moduleRegistry = null)
        {
            // JWT Secrets Configuration & Cryptographic Validation
            var (jwtKey, jwtIssuer, jwtAudience) = ResolveJwtConfiguration(configuration, env);
            var encryptionKey = ResolveEncryptionKey(configuration, env);

            services.AddSingleton<JwtService>();
            services.AddSingleton<RefreshTokenService>();
            services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

            // JWT Bearer Authentication
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    RequireExpirationTime = true,
                    RequireSignedTokens = true,
                    ClockSkew = TimeSpan.Zero,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                };
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = ctx =>
                    {
                        var accessToken = ctx.Request.Query["access_token"].ToString();
                        var path = ctx.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                        {
                            ctx.Token = accessToken;
                        }
                        else if (string.IsNullOrWhiteSpace(ctx.Token) && ctx.Request.Cookies.TryGetValue("access_token", out var token))
                        {
                            ctx.Token = token;
                        }
                        return Task.CompletedTask;
                    },
                    OnAuthenticationFailed = ctx =>
                    {
                        if (env.IsDevelopment())
                        {
                            var logger = ctx.HttpContext.RequestServices
                                .GetRequiredService<ILoggerFactory>()
                                .CreateLogger("JwtAuth");
                            logger.LogError(ctx.Exception, "JWT authentication failed: {Message}", ctx.Exception.Message);
                        }
                        return Task.CompletedTask;
                    },
                    OnChallenge = ctx =>
                    {
                        if (env.IsDevelopment())
                        {
                            var logger = ctx.HttpContext.RequestServices
                                .GetRequiredService<ILoggerFactory>()
                                .CreateLogger("JwtAuth");
                            logger.LogWarning("JWT challenge: Error={Error}, Description={Description}, Uri={Uri}", ctx.Error, ctx.ErrorDescription, ctx.ErrorUri);
                        }
                        return Task.CompletedTask;
                    }
                };
            });

            // Policy-Based Authorization Catalog
            services.AddAuthorization(options =>
            {
                options.FallbackPolicy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build();

                bool IsAdminRole(AuthorizationHandlerContext context)
                {
                    var roleClaims = context.User.Claims
                        .Where(c => c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase) || c.Type.EndsWith("role", StringComparison.OrdinalIgnoreCase))
                        .Select(c => c.Value);

                    return RoleCatalog.IsAdminLike(roleClaims);
                }

                // System / Platform level admin policies
                options.AddPolicy("AdminOnly", policy => policy.RequireAssertion(IsAdminRole));
                options.AddPolicy("Module:platform", policy =>
                {
                    policy.RequireAssertion(IsAdminRole);
                    policy.Requirements.Add(new ModuleEnabledRequirement("platform"));
                });
                options.AddPolicy("Module:licensing", policy =>
                {
                    policy.RequireAssertion(IsAdminRole);
                    policy.Requirements.Add(new ModuleEnabledRequirement("licensing"));
                });
                options.AddPolicy("Module:security", policy =>
                {
                    policy.RequireAssertion(IsAdminRole);
                    policy.Requirements.Add(new ModuleEnabledRequirement("security"));
                });

                // Business Modules
                var businessModules = new[]
                {
                    "hrms", "payroll", "reports", "compliance", "crm",
                    "inventory", "finance", "procurement", "assets",
                    "notifications", "projects", "sales", "workflow"
                };

                foreach (var module in businessModules)
                {
                    options.AddPolicy($"Module:{module}", policy =>
                        policy.Requirements.Add(new ModuleEnabledRequirement(module)));
                }
            });

            services.AddScoped<IAuthorizationHandler, ModuleEnabledHandler>();

            // Enterprise CORS Policy
            services.AddCors(options =>
            {
                options.AddPolicy("Strict", policy =>
                {
                    // Resolve module registry if not provided
                    var registry = moduleRegistry ?? services.BuildServiceProvider().GetService<IModuleRegistry>();
                    var origins = GetAllowedCorsOrigins(configuration, registry);
                    if (env.IsDevelopment())
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

            return services;
        }

        public static (string Key, string Issuer, string Audience) ResolveJwtConfiguration(IConfiguration configuration, IHostEnvironment env)
        {
            string? jwtKey = configuration["Jwt:Key"]
                ?? Environment.GetEnvironmentVariable("Jwt__Key")
                ?? Environment.GetEnvironmentVariable("JWT_KEY");

            string? jwtIssuer = configuration["Jwt:Issuer"]
                ?? Environment.GetEnvironmentVariable("Jwt__Issuer")
                ?? Environment.GetEnvironmentVariable("JWT_ISSUER");

            string? jwtAudience = configuration["Jwt:Audience"]
                ?? Environment.GetEnvironmentVariable("Jwt__Audience")
                ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE");

            if (env.IsEnvironment("Test"))
            {
                jwtKey ??= "test_jwt_key_for_automated_tests_only_0123456789";
                jwtIssuer ??= "test-issuer";
                jwtAudience ??= "test-audience";
            }

            if (string.IsNullOrWhiteSpace(jwtKey) || string.IsNullOrWhiteSpace(jwtIssuer) || string.IsNullOrWhiteSpace(jwtAudience))
            {
                throw new InvalidOperationException("JWT configuration missing. Please set 'Jwt:Key', 'Jwt:Issuer' and 'Jwt:Audience' via appsettings or environment variables.");
            }

            if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
            {
                throw new InvalidOperationException("'Jwt:Key' must be at least 32 bytes (256 bits) to sign tokens with HMAC-SHA256.");
            }

            return (jwtKey, jwtIssuer, jwtAudience);
        }

        public static string ResolveEncryptionKey(IConfiguration configuration, IHostEnvironment env)
        {
            string? encryptionKey = configuration["Encryption:Key"]
                ?? Environment.GetEnvironmentVariable("Encryption__Key")
                ?? Environment.GetEnvironmentVariable("ENCRYPTION_KEY");

            if (env.IsDevelopment() || env.IsEnvironment("Test"))
            {
                encryptionKey ??= "dev_encryption_key_1234567890";
            }

            if (string.IsNullOrWhiteSpace(encryptionKey))
            {
                throw new InvalidOperationException("Encryption key missing. Set 'Encryption:Key' or ENCRYPTION_KEY environment variable.");
            }

            configuration["Encryption:Key"] = encryptionKey;
            return encryptionKey;
        }

        public static string[] GetAllowedCorsOrigins(IConfiguration configuration, IModuleRegistry? registry = null)
    {
        var configuredOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
        var csvOrigins = configuration["Cors:AllowedOriginsCsv"]
            ?? configuration["Cors__AllowedOriginsCsv"]
            ?? configuration["CORS_ALLOWED_ORIGINS"];

            var staticOrigins = configuredOrigins
            .Concat((csvOrigins ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Where(origin => !string.IsNullOrWhiteSpace(origin));

        // Include module-defined origins if registry is available
        var moduleOrigins = registry?.GetModules()
            .Select(m => m.Path)
            .Where(p => !string.IsNullOrWhiteSpace(p)) ?? Enumerable.Empty<string>();

        return staticOrigins
            .Concat(moduleOrigins)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        }

        public static bool IsAllowedDevelopmentOrigin(string originOrReferer)
        {
            if (string.IsNullOrWhiteSpace(originOrReferer)) return false;
            if (!Uri.TryCreate(originOrReferer, UriKind.Absolute, out var uri)) return false;
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

            if (IPAddress.TryParse(host, out var ip) && ip.AddressFamily == AddressFamily.InterNetwork)
            {
                var bytes = ip.GetAddressBytes();
                return bytes[0] == 10 ||
                       (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
                       (bytes[0] == 192 && bytes[1] == 168);
            }

            return false;
        }
    }
}
