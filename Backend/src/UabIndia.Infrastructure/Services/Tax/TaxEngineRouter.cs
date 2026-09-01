using System;
using System.Collections.Generic;
using System.Linq;
using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services.Tax
{
    public class TaxEngineRouter : ITaxCalculationEngine
    {
        private readonly List<ITaxCalculationEngine> _engines;
        private readonly GenericSalesTaxEngine _fallbackEngine;

        public TaxEngineRouter()
        {
            _fallbackEngine = new GenericSalesTaxEngine();
            _engines = new List<ITaxCalculationEngine>
            {
                new IndiaGstTaxEngine(),
                new UkVatTaxEngine(),
                new UaeVatTaxEngine(),
                _fallbackEngine
            };
        }

        public string TaxSystemName => "Dynamic Global Tax Engine Router";

        public bool SupportsCountry(string countryCode) => true;

        public TaxCalculationResult CalculateTax(TaxCalculationRequest request)
        {
            var country = request.CountryCode ?? string.Empty;
            var engine = _engines.FirstOrDefault(e => e.SupportsCountry(country) && e != _fallbackEngine) ?? _fallbackEngine;
            return engine.CalculateTax(request);
        }
    }
}
