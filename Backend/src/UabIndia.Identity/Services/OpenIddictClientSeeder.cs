using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenIddict.Abstractions;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Identity.Services
{
    public class OpenIddictClientSeeder : IHostedService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IConfiguration _configuration;
        private readonly ILogger<OpenIddictClientSeeder> _logger;

        public OpenIddictClientSeeder(
            IServiceProvider serviceProvider,
            IConfiguration configuration,
            ILogger<OpenIddictClientSeeder> logger)
        {
            _serviceProvider = serviceProvider;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var appManager = scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>();
                var scopeManager = scope.ServiceProvider.GetRequiredService<IOpenIddictScopeManager>();

                // 1. Seed Scopes
                await SeedScopesAsync(scopeManager, cancellationToken);

                // 2. Seed Standard Clients
                await SeedClientsAsync(appManager, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to seed default OpenIddict applications and scopes.");
            }
        }

        private async Task SeedScopesAsync(IOpenIddictScopeManager scopeManager, CancellationToken cancellationToken)
        {
            string[] scopes = {
                OpenIddictConstants.Scopes.OpenId,
                OpenIddictConstants.Scopes.Profile,
                OpenIddictConstants.Scopes.Email,
                OpenIddictConstants.Scopes.Roles,
                OpenIddictConstants.Scopes.OfflineAccess,
                "tenant"
            };

            foreach (var scopeName in scopes)
            {
                if (await scopeManager.FindByNameAsync(scopeName, cancellationToken) == null)
                {
                    await scopeManager.CreateAsync(new OpenIddictScopeDescriptor
                    {
                        Name = scopeName,
                        DisplayName = $"{scopeName} scope",
                        Resources = { "uabindia-api" }
                    }, cancellationToken);
                    _logger.LogInformation("OpenIddict scope '{ScopeName}' seeded successfully.", scopeName);
                }
            }
        }

        private async Task SeedClientsAsync(IOpenIddictApplicationManager appManager, CancellationToken cancellationToken)
        {
            var erpBaseUrl = _configuration["Clients:Erp:BaseUrl"] ?? "http://localhost:3000";
            var hrmsBaseUrl = _configuration["Clients:Hrms:BaseUrl"] ?? "http://localhost:5173";

            // 1. ERP Next.js Web Client (Public SPA with PKCE)
            if (await appManager.FindByClientIdAsync("uab-erp-web", cancellationToken) == null)
            {
                await appManager.CreateAsync(new OpenIddictApplicationDescriptor
                {
                    ClientId = "uab-erp-web",
                    DisplayName = "UAB India Enterprise ERP Web Portal",
                    ClientType = OpenIddictConstants.ClientTypes.Public,
                    ConsentType = OpenIddictConstants.ConsentTypes.Implicit,
                    Permissions =
                    {
                        OpenIddictConstants.Permissions.Endpoints.Authorization,
                        OpenIddictConstants.Permissions.Endpoints.Token,
                        OpenIddictConstants.Permissions.Endpoints.EndSession,
                        OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode,
                        OpenIddictConstants.Permissions.GrantTypes.RefreshToken,
                        OpenIddictConstants.Permissions.ResponseTypes.Code,
                        OpenIddictConstants.Permissions.Scopes.Email,
                        OpenIddictConstants.Permissions.Scopes.Profile,
                        OpenIddictConstants.Permissions.Scopes.Roles,
                        OpenIddictConstants.Permissions.Prefixes.Scope + OpenIddictConstants.Scopes.OpenId,
                        OpenIddictConstants.Permissions.Prefixes.Scope + OpenIddictConstants.Scopes.OfflineAccess,
                        OpenIddictConstants.Permissions.Prefixes.Scope + "tenant"
                    },
                    RedirectUris =
                    {
                        new Uri($"{erpBaseUrl}/api/auth/callback"),
                        new Uri($"{erpBaseUrl}/callback"),
                        new Uri("https://app.uabindia.in/callback"),
                        new Uri("https://app.uabindia.in/api/auth/callback")
                    },
                    PostLogoutRedirectUris =
                    {
                        new Uri(erpBaseUrl),
                        new Uri("https://app.uabindia.in")
                    },
                    Requirements =
                    {
                        OpenIddictConstants.Requirements.Features.ProofKeyForCodeExchange
                    }
                }, cancellationToken);
                _logger.LogInformation("OpenIddict client 'uab-erp-web' registered.");
            }

            // 2. HRMS React Web Client (Public SPA with PKCE)
            if (await appManager.FindByClientIdAsync("uab-hrms-web", cancellationToken) == null)
            {
                await appManager.CreateAsync(new OpenIddictApplicationDescriptor
                {
                    ClientId = "uab-hrms-web",
                    DisplayName = "UAB India HRMS & Payroll Portal",
                    ClientType = OpenIddictConstants.ClientTypes.Public,
                    ConsentType = OpenIddictConstants.ConsentTypes.Implicit,
                    Permissions =
                    {
                        OpenIddictConstants.Permissions.Endpoints.Authorization,
                        OpenIddictConstants.Permissions.Endpoints.Token,
                        OpenIddictConstants.Permissions.Endpoints.EndSession,
                        OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode,
                        OpenIddictConstants.Permissions.GrantTypes.RefreshToken,
                        OpenIddictConstants.Permissions.ResponseTypes.Code,
                        OpenIddictConstants.Permissions.Scopes.Email,
                        OpenIddictConstants.Permissions.Scopes.Profile,
                        OpenIddictConstants.Permissions.Scopes.Roles,
                        OpenIddictConstants.Permissions.Prefixes.Scope + OpenIddictConstants.Scopes.OpenId,
                        OpenIddictConstants.Permissions.Prefixes.Scope + OpenIddictConstants.Scopes.OfflineAccess,
                        OpenIddictConstants.Permissions.Prefixes.Scope + "tenant"
                    },
                    RedirectUris =
                    {
                        new Uri($"{hrmsBaseUrl}/callback"),
                        new Uri($"{hrmsBaseUrl}/auth/callback"),
                        new Uri("https://hrms.uabindia.in/callback")
                    },
                    PostLogoutRedirectUris =
                    {
                        new Uri(hrmsBaseUrl),
                        new Uri("https://hrms.uabindia.in")
                    },
                    Requirements =
                    {
                        OpenIddictConstants.Requirements.Features.ProofKeyForCodeExchange
                    }
                }, cancellationToken);
                _logger.LogInformation("OpenIddict client 'uab-hrms-web' registered.");
            }

            // 3. Mobile Client (React Native / Expo with PKCE)
            if (await appManager.FindByClientIdAsync("uab-mobile-app", cancellationToken) == null)
            {
                await appManager.CreateAsync(new OpenIddictApplicationDescriptor
                {
                    ClientId = "uab-mobile-app",
                    DisplayName = "UAB India Mobile App",
                    ClientType = OpenIddictConstants.ClientTypes.Public,
                    ConsentType = OpenIddictConstants.ConsentTypes.Implicit,
                    Permissions =
                    {
                        OpenIddictConstants.Permissions.Endpoints.Authorization,
                        OpenIddictConstants.Permissions.Endpoints.Token,
                        OpenIddictConstants.Permissions.Endpoints.EndSession,
                        OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode,
                        OpenIddictConstants.Permissions.GrantTypes.RefreshToken,
                        OpenIddictConstants.Permissions.ResponseTypes.Code,
                        OpenIddictConstants.Permissions.Scopes.Email,
                        OpenIddictConstants.Permissions.Scopes.Profile,
                        OpenIddictConstants.Permissions.Scopes.Roles,
                        OpenIddictConstants.Permissions.Prefixes.Scope + OpenIddictConstants.Scopes.OpenId,
                        OpenIddictConstants.Permissions.Prefixes.Scope + OpenIddictConstants.Scopes.OfflineAccess,
                        OpenIddictConstants.Permissions.Prefixes.Scope + "tenant"
                    },
                    RedirectUris =
                    {
                        new Uri("uabindia://auth-callback"),
                        new Uri("exp://localhost:8081/--/auth-callback")
                    },
                    Requirements =
                    {
                        OpenIddictConstants.Requirements.Features.ProofKeyForCodeExchange
                    }
                }, cancellationToken);
                _logger.LogInformation("OpenIddict client 'uab-mobile-app' registered.");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}

