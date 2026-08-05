using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services
{
    public class CurrencyConversionService : ICurrencyConversionService
    {
        // Base rates relative to USD
        private static readonly Dictionary<string, decimal> UsdBaseRates = new(StringComparer.OrdinalIgnoreCase)
        {
            { "USD", 1.0m },
            { "INR", 83.50m },
            { "EUR", 0.92m },
            { "GBP", 0.78m },
            { "AED", 3.67m },
            { "SGD", 1.35m },
            { "JPY", 155.20m },
            { "AUD", 1.52m },
            { "CAD", 1.36m }
        };

        public Task<decimal> GetExchangeRateAsync(string fromCurrency, string toCurrency)
        {
            if (string.IsNullOrWhiteSpace(fromCurrency) || string.IsNullOrWhiteSpace(toCurrency))
            {
                return Task.FromResult(1.0m);
            }

            var fromUpper = fromCurrency.Trim().ToUpperInvariant();
            var toUpper = toCurrency.Trim().ToUpperInvariant();

            if (fromUpper == toUpper)
            {
                return Task.FromResult(1.0m);
            }

            var fromRate = UsdBaseRates.TryGetValue(fromUpper, out var fRate) ? fRate : 1.0m;
            var toRate = UsdBaseRates.TryGetValue(toUpper, out var tRate) ? tRate : 1.0m;

            var crossRate = Math.Round(toRate / fromRate, 6);
            return Task.FromResult(crossRate);
        }

        public async Task<decimal> ConvertAsync(decimal amount, string fromCurrency, string toCurrency)
        {
            if (amount == 0m)
            {
                return 0m;
            }

            var rate = await GetExchangeRateAsync(fromCurrency, toCurrency);
            return Math.Round(amount * rate, 2);
        }

        public IReadOnlyDictionary<string, decimal> GetSupportedCurrenciesWithRates(string baseCurrency = "USD")
        {
            var baseUpper = string.IsNullOrWhiteSpace(baseCurrency) ? "USD" : baseCurrency.Trim().ToUpperInvariant();
            var baseRate = UsdBaseRates.TryGetValue(baseUpper, out var bRate) ? bRate : 1.0m;

            var convertedRates = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
            foreach (var (curr, rate) in UsdBaseRates)
            {
                convertedRates[curr] = Math.Round(rate / baseRate, 6);
            }

            return convertedRates;
        }
    }
}
