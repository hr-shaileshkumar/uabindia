using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/v1/finance")]
    [Authorize]
    public class FinanceConsolidationController : ControllerBase
    {
        private readonly ICurrencyExchangeService _currencyService;
        private readonly IChartOfAccountsTemplateService _coaTemplateService;
        private readonly IFinancialConsolidationService _consolidationService;
        private readonly ITenantAccessor _tenantAccessor;

        public FinanceConsolidationController(
            ICurrencyExchangeService currencyService,
            IChartOfAccountsTemplateService coaTemplateService,
            IFinancialConsolidationService consolidationService,
            ITenantAccessor tenantAccessor)
        {
            _currencyService = currencyService;
            _coaTemplateService = coaTemplateService;
            _consolidationService = consolidationService;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("currency/rates")]
        public async Task<IActionResult> GetRates([FromQuery] string? baseCurrency = "USD")
        {
            var rates = await _currencyService.GetExchangeRatesAsync(baseCurrency ?? "USD");
            return Ok(new { success = true, baseCurrency = baseCurrency ?? "USD", rates });
        }

        public class ConvertCurrencyRequest
        {
            public decimal Amount { get; set; }
            public string FromCurrency { get; set; } = "USD";
            public string ToCurrency { get; set; } = "EUR";
        }

        [HttpPost("currency/convert")]
        public async Task<IActionResult> ConvertCurrency([FromBody] ConvertCurrencyRequest req)
        {
            var result = await _currencyService.ConvertAmountAsync(req.Amount, req.FromCurrency, req.ToCurrency);
            return Ok(new { success = true, data = result });
        }

        public class FxGainLossRequest
        {
            public decimal ForeignAmount { get; set; }
            public decimal BookExchangeRate { get; set; }
            public decimal CurrentExchangeRate { get; set; }
            public string FunctionalCurrency { get; set; } = "USD";
        }

        [HttpPost("currency/fx-gain-loss")]
        public IActionResult CalculateFxGainLoss([FromBody] FxGainLossRequest req)
        {
            var result = _currencyService.CalculateRealizedFxGainLoss(
                req.ForeignAmount,
                req.BookExchangeRate,
                req.CurrentExchangeRate,
                req.FunctionalCurrency);

            return Ok(new { success = true, data = result });
        }

        [HttpGet("coa/templates")]
        public IActionResult GetCoaTemplates()
        {
            var templates = _coaTemplateService.GetAvailableTemplates();
            return Ok(new { success = true, data = templates });
        }

        public class SeedCoaRequest
        {
            public string StandardType { get; set; } = "IFRS";
            public string? DefaultCurrency { get; set; }
            public Guid? CompanyId { get; set; }
        }

        [HttpPost("coa/seed")]
        public async Task<IActionResult> SeedCoaTemplate([FromBody] SeedCoaRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context is required." });
            }

            var count = await _coaTemplateService.SeedStandardChartOfAccountsAsync(
                tenantId,
                req.CompanyId,
                req.StandardType,
                req.DefaultCurrency);

            return Ok(new { success = true, seededAccountsCount = count, standard = req.StandardType });
        }

        [HttpGet("consolidation/balance-sheet")]
        public async Task<IActionResult> GetConsolidatedBalanceSheet(
            [FromQuery] Guid? parentCompanyId = null,
            [FromQuery] string targetCurrency = "USD",
            [FromQuery] DateTime? asOfDate = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var result = await _consolidationService.GenerateConsolidatedBalanceSheetAsync(
                tenantId,
                parentCompanyId,
                asOfDate ?? DateTime.UtcNow,
                targetCurrency);

            return Ok(new { success = true, data = result });
        }

        [HttpGet("consolidation/income-statement")]
        public async Task<IActionResult> GetConsolidatedIncomeStatement(
            [FromQuery] DateTime fromDate,
            [FromQuery] DateTime toDate,
            [FromQuery] Guid? parentCompanyId = null,
            [FromQuery] string targetCurrency = "USD")
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var result = await _consolidationService.GenerateConsolidatedIncomeStatementAsync(
                tenantId,
                parentCompanyId,
                fromDate,
                toDate,
                targetCurrency);

            return Ok(new { success = true, data = result });
        }
    }
}
