using System;
using System.Collections.Generic;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;

namespace UabIndia.Infrastructure.Services.Payroll
{
    public class UaePayrollEngine : IPayrollCalculationEngine
    {
        public string CountryCode => "ARE";
        public string SystemName => "UAE Wages Protection System (WPS) & End of Service Gratuity";

        public bool SupportsCountry(string countryCode) =>
            string.Equals(countryCode, "ARE", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(countryCode, "AE", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(countryCode, "UAE", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(countryCode, "United Arab Emirates", StringComparison.OrdinalIgnoreCase);

        public PayrollCalculationResult CalculatePayroll(PayrollCalculationRequest request)
        {
            var gross = request.GrossSalary;
            var basic = request.BasicSalary > 0 ? request.BasicSalary : Math.Round(gross * 0.6m, 2);

            var deductions = new Dictionary<string, decimal>();
            var contributions = new Dictionary<string, decimal>();

            // UAE has 0% personal income tax and 0% employee social security for expatriates

            // End of Service Gratuity (EOSG) monthly employer accrual (21 days basic pay per year: (21/365)*12/12 = ~5.75% of basic)
            var eosgAccrual = IndiaStatutoryCalculator.RoundMoney(basic * (21m / 365m));
            contributions["EOSG_GratuityAccrual_Employer"] = eosgAccrual;

            if (request.VoluntaryDeductions > 0)
            {
                deductions["VoluntaryDeductions"] = request.VoluntaryDeductions;
            }

            decimal totalDeductions = 0;
            foreach (var val in deductions.Values) totalDeductions += val;

            decimal totalContributions = 0;
            foreach (var val in contributions.Values) totalContributions += val;

            return new PayrollCalculationResult
            {
                CountryCode = "ARE",
                SystemName = SystemName,
                GrossEarnings = gross,
                TotalEmployeeDeductions = totalDeductions,
                NetPayable = gross - totalDeductions,
                TotalEmployerContributions = totalContributions,
                EmployeeDeductions = deductions,
                EmployerContributions = contributions
            };
        }
    }
}
