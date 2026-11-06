using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class CurrencyConversionResult
    {
        public decimal OriginalAmount { get; set; }
        public string FromCurrency { get; set; } = string.Empty;
        public string ToCurrency { get; set; } = string.Empty;
        public decimal ExchangeRate { get; set; }
        public decimal ConvertedAmount { get; set; }
        public DateTime RateTimestampUtc { get; set; }
    }

    public class FxGainLossResult
    {
        public decimal ForeignAmount { get; set; }
        public decimal BookExchangeRate { get; set; }
        public decimal CurrentExchangeRate { get; set; }
        public decimal BookValueFunctional { get; set; }
        public decimal CurrentValueFunctional { get; set; }
        public decimal FxDifference { get; set; }
        public bool IsGain => FxDifference > 0;
        public bool IsLoss => FxDifference < 0;
        public string FunctionalCurrency { get; set; } = string.Empty;
    }

    public interface ICurrencyExchangeService
    {
        Task<decimal> GetExchangeRateAsync(string fromCurrency, string toCurrency, DateTime? asOfDate = null, CancellationToken ct = default);
        Task<CurrencyConversionResult> ConvertAmountAsync(decimal amount, string fromCurrency, string toCurrency, DateTime? asOfDate = null, CancellationToken ct = default);
        Task<IReadOnlyDictionary<string, decimal>> GetExchangeRatesAsync(string baseCurrency, DateTime? asOfDate = null, CancellationToken ct = default);
        FxGainLossResult CalculateRealizedFxGainLoss(decimal foreignAmount, decimal bookRate, decimal settlementRate, string functionalCurrency = "USD");
        FxGainLossResult CalculateUnrealizedFxGainLoss(decimal foreignAmount, decimal bookRate, decimal currentMarketRate, string functionalCurrency = "USD");
    }
}
