using System.Threading.Tasks;
using UabIndia.Infrastructure.Services;
using Xunit;

namespace UabIndia.Tests
{
    public class CurrencyConversionServiceTests
    {
        private readonly CurrencyConversionService _service;

        public CurrencyConversionServiceTests()
        {
            _service = new CurrencyConversionService();
        }

        [Fact]
        public async Task ConvertAsync_SameCurrency_ReturnsSameAmount()
        {
            var result = await _service.ConvertAsync(100m, "USD", "USD");
            Assert.Equal(100m, result);
        }

        [Fact]
        public async Task ConvertAsync_UsdToInr_ConvertsCorrectly()
        {
            var result = await _service.ConvertAsync(100m, "USD", "INR");
            Assert.Equal(8350m, result);
        }

        [Fact]
        public async Task ConvertAsync_ZeroAmount_ReturnsZero()
        {
            var result = await _service.ConvertAsync(0m, "USD", "EUR");
            Assert.Equal(0m, result);
        }

        [Fact]
        public async Task GetExchangeRateAsync_SameCurrency_ReturnsOne()
        {
            var rate = await _service.GetExchangeRateAsync("INR", "INR");
            Assert.Equal(1.0m, rate);
        }

        [Fact]
        public void GetSupportedCurrenciesWithRates_ReturnsRatesDictionary()
        {
            var rates = _service.GetSupportedCurrenciesWithRates("USD");
            Assert.NotNull(rates);
            Assert.True(rates.ContainsKey("INR"));
            Assert.True(rates.ContainsKey("EUR"));
            Assert.True(rates.ContainsKey("GBP"));
        }
    }
}
