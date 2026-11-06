using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;

namespace UabIndia.Infrastructure.Services
{
    public class CurrencyExchangeService : ICurrencyExchangeService
    {
        // Standard baseline exchange rates against USD (1 USD = X Currency)
        private static readonly Dictionary<string, decimal> DefaultRatesPerUsd = new(StringComparer.OrdinalIgnoreCase)
        {
            { "USD", 1.00m },
            { "EUR", 0.92m },
            { "GBP", 0.79m },
            { "INR", 83.50m },
            { "AED", 3.67m },
            { "SAR", 3.75m },
            { "SGD", 1.34m },
            { "JPY", 155.20m },
            { "CAD", 1.37m },
            { "AUD", 1.52m },
            { "CHF", 0.90m },
            { "CNY", 7.23m },
            { "HKD", 7.82m }
        };

        private readonly ConcurrentDictionary<string, decimal> _dynamicRates = new(DefaultRatesPerUsd, StringComparer.OrdinalIgnoreCase);

        public Task<decimal> GetExchangeRateAsync(string fromCurrency, string toCurrency, DateTime? asOfDate = null, CancellationToken ct = default)
        {
            var from = Normalize(fromCurrency);
            var to = Normalize(toCurrency);

            if (from == to) return Task.FromResult(1.0m);

            if (!_dynamicRates.TryGetValue(from, out var fromToUsd))
            {
                fromToUsd = 1.0m;
            }

            if (!_dynamicRates.TryGetValue(to, out var toToUsd))
            {
                toToUsd = 1.0m;
            }

            // Rate: 1 FROM = (toToUsd / fromToUsd) TO
            var rate = toToUsd / fromToUsd;
            return Task.FromResult(Math.Round(rate, 6));
        }

        public async Task<CurrencyConversionResult> ConvertAmountAsync(decimal amount, string fromCurrency, string toCurrency, DateTime? asOfDate = null, CancellationToken ct = default)
        {
            var from = Normalize(fromCurrency);
            var to = Normalize(toCurrency);
            var rate = await GetExchangeRateAsync(from, to, asOfDate, ct);
            var converted = IndiaStatutoryCalculator.RoundMoney(amount * rate);

            return new CurrencyConversionResult
            {
                OriginalAmount = amount,
                FromCurrency = from,
                ToCurrency = to,
                ExchangeRate = rate,
                ConvertedAmount = converted,
                RateTimestampUtc = DateTime.UtcNow
            };
        }

        public Task<IReadOnlyDictionary<string, decimal>> GetExchangeRatesAsync(string baseCurrency, DateTime? asOfDate = null, CancellationToken ct = default)
        {
            var baseCurr = Normalize(baseCurrency);
            if (!_dynamicRates.TryGetValue(baseCurr, out var baseToUsd))
            {
                baseToUsd = 1.0m;
            }

            var dict = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
            foreach (var (curr, usdRate) in _dynamicRates)
            {
                var crossRate = Math.Round(usdRate / baseToUsd, 6);
                dict[curr] = crossRate;
            }

            return Task.FromResult<IReadOnlyDictionary<string, decimal>>(dict);
        }

        public FxGainLossResult CalculateRealizedFxGainLoss(decimal foreignAmount, decimal bookRate, decimal settlementRate, string functionalCurrency = "USD")
        {
            var bookValue = IndiaStatutoryCalculator.RoundMoney(foreignAmount * bookRate);
            var settlementValue = IndiaStatutoryCalculator.RoundMoney(foreignAmount * settlementRate);
            var diff = settlementValue - bookValue;

            return new FxGainLossResult
            {
                ForeignAmount = foreignAmount,
                BookExchangeRate = bookRate,
                CurrentExchangeRate = settlementRate,
                BookValueFunctional = bookValue,
                CurrentValueFunctional = settlementValue,
                FxDifference = diff,
                FunctionalCurrency = Normalize(functionalCurrency)
            };
        }

        public FxGainLossResult CalculateUnrealizedFxGainLoss(decimal foreignAmount, decimal bookRate, decimal currentMarketRate, string functionalCurrency = "USD")
        {
            var bookValue = IndiaStatutoryCalculator.RoundMoney(foreignAmount * bookRate);
            var marketValue = IndiaStatutoryCalculator.RoundMoney(foreignAmount * currentMarketRate);
            var diff = marketValue - bookValue;

            return new FxGainLossResult
            {
                ForeignAmount = foreignAmount,
                BookExchangeRate = bookRate,
                CurrentExchangeRate = currentMarketRate,
                BookValueFunctional = bookValue,
                CurrentValueFunctional = marketValue,
                FxDifference = diff,
                FunctionalCurrency = Normalize(functionalCurrency)
            };
        }

        private static string Normalize(string currency) =>
            string.IsNullOrWhiteSpace(currency) ? "USD" : currency.Trim().ToUpperInvariant();
    }
}
