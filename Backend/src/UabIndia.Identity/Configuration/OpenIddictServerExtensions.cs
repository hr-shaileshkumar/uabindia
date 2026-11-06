using System;
using System.IO;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using OpenIddict.Validation.AspNetCore;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Identity.Configuration
{
    public static class UabIndiaOpenIddictServerExtensions
    {
        public const string CentralCookieScheme = "UabIndia.SSO";

        public static IServiceCollection AddUabIndiaOpenIddict(
            this IServiceCollection services,
            IConfiguration configuration,
            IHostEnvironment environment)
        {
            // 1. Configure OpenIddict Core & Entity Framework integration
            services.AddOpenIddict()
                .AddCore(options =>
                {
                    options.UseEntityFrameworkCore()
                           .UseDbContext<ApplicationDbContext>();
                })
                .AddServer(options =>
                {
                    // Endpoints
                    options.SetAuthorizationEndpointUris("/connect/authorize")
                           .SetTokenEndpointUris("/connect/token")
                           .SetUserInfoEndpointUris("/connect/userinfo")
                           .SetEndSessionEndpointUris("/connect/logout")
                           .SetIntrospectionEndpointUris("/connect/introspect");

                    // Supported Grant Types & Security Flows
                    options.AllowAuthorizationCodeFlow()
                           .RequireProofKeyForCodeExchange() // Mandatory PKCE for SPA & Mobile
                           .AllowRefreshTokenFlow()
                           .AllowClientCredentialsFlow();

                    // Register custom & standard scopes
                    options.RegisterScopes(
                        OpenIddictConstants.Scopes.OpenId,
                        OpenIddictConstants.Scopes.Profile,
                        OpenIddictConstants.Scopes.Email,
                        OpenIddictConstants.Scopes.Roles,
                        OpenIddictConstants.Scopes.OfflineAccess,
                        "tenant");

                    // Token Lifetimes
                    var accessMinutes = configuration.GetValue("OpenIddict:AccessTokenLifetimeMinutes", 15);
                    var refreshDays = configuration.GetValue("OpenIddict:RefreshTokenLifetimeDays", 14);

                    options.SetAccessTokenLifetime(TimeSpan.FromMinutes(accessMinutes))
                           .SetRefreshTokenLifetime(TimeSpan.FromDays(refreshDays))
                           .SetAuthorizationCodeLifetime(TimeSpan.FromMinutes(5));

                    // Signing and Encryption Credentials
                    if (environment.IsDevelopment())
                    {
                        options.AddDevelopmentEncryptionCertificate()
                               .AddDevelopmentSigningCertificate();
                    }
                    else
                    {
                        var certPath = configuration["OpenIddict:CertificatePath"];
                        var certPass = configuration["OpenIddict:CertificatePassword"];
                        if (!string.IsNullOrWhiteSpace(certPath) && File.Exists(certPath))
                        {
#pragma warning disable SYSLIB0057
                            var certificate = new X509Certificate2(certPath, certPass);
#pragma warning restore SYSLIB0057
                            options.AddSigningCertificate(certificate)
                                   .AddEncryptionCertificate(certificate);
                        }
                        else
                        {
                            // Fallback to development keys if certificate not explicitly configured
                            options.AddDevelopmentEncryptionCertificate()
                                   .AddDevelopmentSigningCertificate();
                        }
                    }

                    // Enable ASP.NET Core MVC/API pass-through
                    options.UseAspNetCore()
                           .EnableAuthorizationEndpointPassthrough()
                           .EnableTokenEndpointPassthrough()
                           .EnableUserInfoEndpointPassthrough()
                           .EnableEndSessionEndpointPassthrough()
                           .DisableTransportSecurityRequirement(); // Handled by Reverse Proxy / Nginx in prod
                })
                .AddValidation(options =>
                {
                    // Import configuration from local OpenIddict server instance
                    options.UseLocalServer();
                    options.UseAspNetCore();
                });

            // 2. Cookie Authentication for Central SSO Session
            services.AddAuthentication()
            .AddCookie(CentralCookieScheme, options =>
            {
                options.Cookie.Name = "UabIndia.SSO.Session";
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
                options.LoginPath = "/auth/login";
                options.LogoutPath = "/auth/logout";
                options.ExpireTimeSpan = TimeSpan.FromDays(14);
                options.SlidingExpiration = true;

                // Shared domain if configured (e.g., .uabindia.in)
                var cookieDomain = configuration["Auth:CookieDomain"];
                if (!string.IsNullOrWhiteSpace(cookieDomain))
                {
                    options.Cookie.Domain = cookieDomain;
                }
            });

            // 3. Register client & scope background seeder
            services.AddHostedService<Services.OpenIddictClientSeeder>();

            return services;
        }
    }
}
