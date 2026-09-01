using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Configuration;
using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services.Payments
{
    public class PaymentGatewayFactory : IPaymentGatewayFactory
    {
        private readonly Dictionary<string, IPaymentGatewayProvider> _providers;
        private readonly IPaymentGatewayProvider _defaultProvider;

        public PaymentGatewayFactory(IConfiguration configuration)
        {
            var stripe = new StripePaymentProvider(configuration);
            var razorpay = new RazorpayPaymentProvider(configuration);
            var paypal = new PayPalPaymentProvider(configuration);

            _providers = new Dictionary<string, IPaymentGatewayProvider>(StringComparer.OrdinalIgnoreCase)
            {
                { "Stripe", stripe },
                { "Razorpay", razorpay },
                { "PayPal", paypal }
            };

            _defaultProvider = stripe;
        }

        public IPaymentGatewayProvider GetProvider(string providerName)
        {
            if (string.IsNullOrWhiteSpace(providerName)) return _defaultProvider;

            return _providers.TryGetValue(providerName.Trim(), out var provider)
                ? provider
                : _defaultProvider;
        }

        public IPaymentGatewayProvider GetProviderForCurrency(string currencyCode)
        {
            var curr = (currencyCode ?? "USD").Trim().ToUpperInvariant();

            if (curr == "INR")
            {
                return _providers["Razorpay"];
            }

            var matching = _providers.Values.FirstOrDefault(p => p.SupportsCurrency(curr));
            return matching ?? _defaultProvider;
        }

        public IReadOnlyList<string> GetSupportedProviders() => _providers.Keys.ToList();
    }
}
