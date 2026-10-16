using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services.Payments
{
    public class PaymentGatewayFactory : IPaymentGatewayFactory
    {
        private readonly IConfiguration _configuration;
        private readonly IServiceScopeFactory? _scopeFactory;
        private readonly Dictionary<string, IPaymentGatewayProvider> _systemProviders;
        private readonly IPaymentGatewayProvider _defaultProvider;

        public PaymentGatewayFactory(IConfiguration configuration, IServiceScopeFactory? scopeFactory = null)
        {
            _configuration = configuration;
            _scopeFactory = scopeFactory;

            var stripe = new StripePaymentProvider(configuration);
            var razorpay = new RazorpayPaymentProvider(configuration);
            var paypal = new PayPalPaymentProvider(configuration);
            var cashfree = new CashfreePaymentProvider(configuration);
            var phonepe = new PhonePePaymentProvider(configuration);

            _systemProviders = new Dictionary<string, IPaymentGatewayProvider>(StringComparer.OrdinalIgnoreCase)
            {
                { "Stripe", stripe },
                { "Razorpay", razorpay },
                { "PayPal", paypal },
                { "Cashfree", cashfree },
                { "PhonePe", phonepe }
            };

            _defaultProvider = stripe;
        }

        public IPaymentGatewayProvider GetProvider(string providerName, Guid? tenantId = null)
        {
            if (tenantId.HasValue && tenantId.Value != Guid.Empty && _scopeFactory != null)
            {
                var tenantProvider = TryResolveTenantProvider(tenantId.Value, providerName);
                if (tenantProvider != null) return tenantProvider;
            }

            if (string.IsNullOrWhiteSpace(providerName)) return _defaultProvider;

            return _systemProviders.TryGetValue(providerName.Trim(), out var provider)
                ? provider
                : _defaultProvider;
        }

        public IPaymentGatewayProvider GetProviderForCurrency(string currencyCode, Guid? tenantId = null)
        {
            var curr = (currencyCode ?? "USD").Trim().ToUpperInvariant();

            if (tenantId.HasValue && tenantId.Value != Guid.Empty && _scopeFactory != null)
            {
                var tenantProvider = TryResolveTenantProviderForCurrency(tenantId.Value, curr);
                if (tenantProvider != null) return tenantProvider;
            }

            if (curr == "INR")
            {
                return _systemProviders["Razorpay"];
            }

            var matching = _systemProviders.Values.FirstOrDefault(p => p.SupportsCurrency(curr));
            return matching ?? _defaultProvider;
        }

        public IReadOnlyList<string> GetSupportedProviders() => _systemProviders.Keys.ToList();

        private IPaymentGatewayProvider? TryResolveTenantProvider(Guid tenantId, string? providerName)
        {
            try
            {
                using var scope = _scopeFactory!.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var query = db.IntegrationConnectors.AsNoTracking()
                    .Where(c => c.TenantId == tenantId && !c.IsDeleted && (c.Status == "Connected" || c.Status == "Configured"));

                if (!string.IsNullOrWhiteSpace(providerName))
                {
                    var pKey = providerName.Trim().ToLowerInvariant();
                    query = query.Where(c => c.ConnectorKey.ToLower() == pKey || c.Provider.ToLower() == pKey || c.Name.ToLower() == pKey);
                }
                else
                {
                    query = query.Where(c => c.Category == "Payment");
                }

                var connector = query.OrderByDescending(c => c.Status == "Connected").FirstOrDefault();
                if (connector == null) return null;

                return BuildProviderFromConnector(connector);
            }
            catch
            {
                return null;
            }
        }

        private IPaymentGatewayProvider? TryResolveTenantProviderForCurrency(Guid tenantId, string currency)
        {
            try
            {
                using var scope = _scopeFactory!.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var connectors = db.IntegrationConnectors.AsNoTracking()
                    .Where(c => c.TenantId == tenantId && !c.IsDeleted && (c.Status == "Connected" || c.Status == "Configured") && c.Category == "Payment")
                    .OrderByDescending(c => c.Status == "Connected")
                    .ToList();

                foreach (var c in connectors)
                {
                    var provider = BuildProviderFromConnector(c);
                    if (provider != null && provider.SupportsCurrency(currency))
                    {
                        return provider;
                    }
                }

                return null;
            }
            catch
            {
                return null;
            }
        }

        private IPaymentGatewayProvider? BuildProviderFromConnector(Core.Entities.IntegrationConnector connector)
        {
            var config = ParseConfig(connector.ConfigJson);
            var key = connector.ConnectorKey.ToLowerInvariant();

            if (key.Contains("razorpay"))
            {
                var keyId = Get(config, "keyId") ?? Get(config, "apiKey") ?? "";
                var keySecret = Get(config, "keySecret") ?? Get(config, "secretKey") ?? "";
                var whSecret = Get(config, "webhookSecret") ?? "";
                return new RazorpayPaymentProvider(keyId, keySecret, whSecret);
            }
            if (key.Contains("stripe"))
            {
                var apiKey = Get(config, "apiKey") ?? Get(config, "secretKey") ?? "";
                var whSecret = Get(config, "webhookSecret") ?? "";
                return new StripePaymentProvider(apiKey, whSecret);
            }
            if (key.Contains("cashfree"))
            {
                var appId = Get(config, "appId") ?? Get(config, "clientId") ?? Get(config, "apiKey") ?? "";
                var secretKey = Get(config, "secretKey") ?? "";
                return new CashfreePaymentProvider(appId, secretKey);
            }
            if (key.Contains("phonepe"))
            {
                var mid = Get(config, "merchantId") ?? Get(config, "apiKey") ?? "";
                var saltKey = Get(config, "saltKey") ?? Get(config, "secretKey") ?? "";
                var saltIndex = Get(config, "saltIndex") ?? "1";
                return new PhonePePaymentProvider(mid, saltKey, saltIndex);
            }

            return null;
        }

        private static Dictionary<string, string?> ParseConfig(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
            try
            {
                var dict = JsonSerializer.Deserialize<Dictionary<string, string?>>(json);
                return dict != null
                    ? new Dictionary<string, string?>(dict, StringComparer.OrdinalIgnoreCase)
                    : new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
            }
            catch
            {
                return new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
            }
        }

        private static string? Get(Dictionary<string, string?> config, string key) =>
            config.TryGetValue(key, out var v) ? v : null;
    }
}
