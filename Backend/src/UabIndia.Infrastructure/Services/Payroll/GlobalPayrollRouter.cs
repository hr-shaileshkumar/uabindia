using System;
using System.Collections.Generic;
using System.Linq;
using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services.Payroll
{
    public class GlobalPayrollRouter : IPayrollCalculationEngine
    {
        private readonly List<IPayrollCalculationEngine> _engines;
        private readonly IndiaPayrollEngine _fallbackEngine;

        public GlobalPayrollRouter()
        {
            _fallbackEngine = new IndiaPayrollEngine();
            _engines = new List<IPayrollCalculationEngine>
            {
                _fallbackEngine,
                new UsPayrollEngine(),
                new UkPayrollEngine(),
                new UaePayrollEngine()
            };
        }

        public string CountryCode => "GLOBAL";

        public string SystemName => "Global Multi-Country Payroll Engine Router";

        public bool SupportsCountry(string countryCode) => true;

        public PayrollCalculationResult CalculatePayroll(PayrollCalculationRequest request)
        {
            var country = request.CountryCode ?? "IND";
            var engine = _engines.FirstOrDefault(e => e.SupportsCountry(country) && e != _fallbackEngine) ?? _fallbackEngine;
            return engine.CalculatePayroll(request);
        }
    }
}
