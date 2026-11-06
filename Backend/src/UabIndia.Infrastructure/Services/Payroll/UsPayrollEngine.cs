using System;
using System.Collections.Generic;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;

namespace UabIndia.Infrastructure.Services.Payroll
{
    public class UsPayrollEngine : IPayrollCalculationEngine
    {
        public string CountryCode => "USA";
        public string SystemName => "US FICA (Social Security / Medicare) & Federal Withholding";

        public bool SupportsCountry(string countryCode) =>
            string.Equals(countryCode, "USA", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(countryCode, "US", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(countryCode, "United States", StringComparison.OrdinalIgnoreCase);

        public PayrollCalculationResult CalculatePayroll(PayrollCalculationRequest request)
        {
            var gross = request.GrossSalary;
            var deductions = new Dictionary<string, decimal>();
            var contributions = new Dictionary<string, decimal>();

            // Social Security: 6.2% Employee, 6.2% Employer
            var socSecEmployee = IndiaStatutoryCalculator.RoundMoney(gross * 0.062m);
            var socSecEmployer = socSecEmployee;
            deductions["FICA_SocialSecurity_Employee"] = socSecEmployee;
            contributions["FICA_SocialSecurity_Employer"] = socSecEmployer;

            // Medicare: 1.45% Employee, 1.45% Employer
            var medicareEmployee = IndiaStatutoryCalculator.RoundMoney(gross * 0.0145m);
            var medicareEmployer = medicareEmployee;
            deductions["FICA_Medicare_Employee"] = medicareEmployee;
            contributions["FICA_Medicare_Employer"] = medicareEmployer;

            // Federal Income Tax estimate (10% flat standard deduction)
            var federalWithholding = IndiaStatutoryCalculator.RoundMoney(gross * 0.10m);
            deductions["FederalIncomeTax_Withholding"] = federalWithholding;

            if (request.VoluntaryDeductions > 0)
            {
                deductions["VoluntaryDeductions_401k"] = request.VoluntaryDeductions;
            }

            decimal totalDeductions = 0;
            foreach (var val in deductions.Values) totalDeductions += val;

            decimal totalContributions = 0;
            foreach (var val in contributions.Values) totalContributions += val;

            return new PayrollCalculationResult
            {
                CountryCode = "USA",
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
