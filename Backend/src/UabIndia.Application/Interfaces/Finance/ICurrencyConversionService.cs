using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public interface ICurrencyConversionService
    {
        Task<decimal> ConvertAsync(decimal amount, string fromCurrency, string toCurrency);
        Task<decimal> GetExchangeRateAsync(string fromCurrency, string toCurrency);
        IReadOnlyDictionary<string, decimal> GetSupportedCurrenciesWithRates(string baseCurrency = "USD");
    }
}
