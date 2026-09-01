using System;
using System.Threading.Tasks;
using UabIndia.Infrastructure.Services;
using Xunit;

namespace UabIndia.Tests;

public class CurrencyExchangeServiceTests
{
    private readonly CurrencyExchangeService _service;

    public CurrencyExchangeServiceTests()
    {
        _service = new CurrencyExchangeService();
    }

    [Fact]
    public async Task GetExchangeRateAsync_SameCurrency_ReturnsOne()
    {
        var rate = await _service.GetExchangeRateAsync("USD", "USD");
        Assert.Equal(1.0m, rate);
    }

    [Fact]
    public async Task ConvertAmountAsync_ConvertsUsdToInrAccurately()
    {
        var result = await _service.ConvertAmountAsync(100m, "USD", "INR");

        Assert.Equal(100m, result.OriginalAmount);
        Assert.Equal("USD", result.FromCurrency);
        Assert.Equal("INR", result.ToCurrency);
        Assert.Equal(83.50m, result.ExchangeRate);
        Assert.Equal(8350m, result.ConvertedAmount);
    }

    [Fact]
    public async Task ConvertAmountAsync_SyntheticCrossRate_EurToGbp()
    {
        // 1 USD = 0.92 EUR, 1 USD = 0.79 GBP => 1 EUR = 0.79 / 0.92 = 0.858696 GBP
        var result = await _service.ConvertAmountAsync(1000m, "EUR", "GBP");

        Assert.True(result.ExchangeRate > 0.85m && result.ExchangeRate < 0.87m);
        Assert.True(result.ConvertedAmount > 850m && result.ConvertedAmount < 870m);
    }

    [Fact]
    public void CalculateRealizedFxGainLoss_RecognizesGainWhenSettledHigher()
    {
        // Booked: 10,000 USD at 82.00 INR/USD = 820,000 INR
        // Settled: 10,000 USD at 83.50 INR/USD = 835,000 INR
        // Gain: +15,000 INR
        var fx = _service.CalculateRealizedFxGainLoss(10000m, 82.00m, 83.50m, "INR");

        Assert.True(fx.IsGain);
        Assert.False(fx.IsLoss);
        Assert.Equal(820000m, fx.BookValueFunctional);
        Assert.Equal(835000m, fx.CurrentValueFunctional);
        Assert.Equal(15000m, fx.FxDifference);
    }

    [Fact]
    public void CalculateRealizedFxGainLoss_RecognizesLossWhenSettledLower()
    {
        // Booked: 10,000 USD at 83.50 INR/USD = 835,000 INR
        // Settled: 10,000 USD at 81.50 INR/USD = 815,000 INR
        // Loss: -20,000 INR
        var fx = _service.CalculateRealizedFxGainLoss(10000m, 83.50m, 81.50m, "INR");

        Assert.True(fx.IsLoss);
        Assert.False(fx.IsGain);
        Assert.Equal(-20000m, fx.FxDifference);
    }
}
