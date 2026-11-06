using System;
using System.Collections.Generic;

namespace UabIndia.Application.Interfaces
{
    public class PayrollCalculationRequest
    {
        public string CountryCode { get; set; } = "IND";
        public decimal GrossSalary { get; set; }
        public decimal BasicSalary { get; set; }
        public decimal Hra { get; set; } = 0;
        public string? StateCode { get; set; }
        public string? TaxRegime { get; set; } = "Standard";
        public bool HasProvidentFund { get; set; } = true;
        public bool HasEsi { get; set; } = true;
        public decimal AdditionalAllowances { get; set; } = 0;
        public decimal VoluntaryDeductions { get; set; } = 0;
    }

    public class PayrollCalculationResult
    {
        public string CountryCode { get; set; } = string.Empty;
        public string SystemName { get; set; } = string.Empty;
        public decimal GrossEarnings { get; set; }
        public decimal TotalEmployeeDeductions { get; set; }
        public decimal NetPayable { get; set; }
        public decimal TotalEmployerContributions { get; set; }
        public Dictionary<string, decimal> EmployeeDeductions { get; set; } = new();
        public Dictionary<string, decimal> EmployerContributions { get; set; } = new();
    }

    public interface IPayrollCalculationEngine
    {
        string CountryCode { get; }
        string SystemName { get; }
        bool SupportsCountry(string countryCode);
        PayrollCalculationResult CalculatePayroll(PayrollCalculationRequest request);
    }
}
