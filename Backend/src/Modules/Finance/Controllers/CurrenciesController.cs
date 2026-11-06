using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class CurrenciesController : ControllerBase
    {
        private readonly ICurrencyConversionService _currencyService;

        public CurrenciesController(ICurrencyConversionService currencyService)
        {
            _currencyService = currencyService;
        }

        [HttpGet]
        public IActionResult GetSupportedCurrencies([FromQuery] string baseCurrency = "USD")
        {
            var rates = _currencyService.GetSupportedCurrenciesWithRates(baseCurrency);
            var currencies = new[]
            {
                new { code = "USD", symbol = "$", name = "US Dollar", flag = "🇺🇸", rate = rates.GetValueOrDefault("USD", 1.0m) },
                new { code = "INR", symbol = "₹", name = "Indian Rupee", flag = "🇮🇳", rate = rates.GetValueOrDefault("INR", 83.50m) },
                new { code = "EUR", symbol = "€", name = "Euro", flag = "🇪🇺", rate = rates.GetValueOrDefault("EUR", 0.92m) },
                new { code = "GBP", symbol = "£", name = "British Pound", flag = "🇬🇧", rate = rates.GetValueOrDefault("GBP", 0.78m) },
                new { code = "AED", symbol = "د.إ", name = "UAE Dirham", flag = "🇦🇪", rate = rates.GetValueOrDefault("AED", 3.67m) },
                new { code = "SGD", symbol = "S$", name = "Singapore Dollar", flag = "🇸🇬", rate = rates.GetValueOrDefault("SGD", 1.35m) },
                new { code = "JPY", symbol = "¥", name = "Japanese Yen", flag = "🇯🇵", rate = rates.GetValueOrDefault("JPY", 155.20m) },
                new { code = "AUD", symbol = "A$", name = "Australian Dollar", flag = "🇦🇺", rate = rates.GetValueOrDefault("AUD", 1.52m) },
                new { code = "CAD", symbol = "C$", name = "Canadian Dollar", flag = "🇨🇦", rate = rates.GetValueOrDefault("CAD", 1.36m) }
            };

            return Ok(new
            {
                baseCurrency = baseCurrency.ToUpperInvariant(),
                currencies,
                timestamp = System.DateTime.UtcNow
            });
        }

        [HttpGet("convert")]
        public async Task<IActionResult> Convert(
            [FromQuery] decimal amount,
            [FromQuery] string from = "USD",
            [FromQuery] string to = "INR")
        {
            var converted = await _currencyService.ConvertAsync(amount, from, to);
            var rate = await _currencyService.GetExchangeRateAsync(from, to);

            return Ok(new
            {
                originalAmount = amount,
                fromCurrency = from.ToUpperInvariant(),
                toCurrency = to.ToUpperInvariant(),
                rate,
                convertedAmount = converted,
                timestamp = System.DateTime.UtcNow
            });
        }
    }
}
