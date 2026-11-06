using System;
using System.Collections.Generic;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;

namespace UabIndia.Infrastructure.Services.Payroll
{
    public class UkPayrollEngine : IPayrollCalculationEngine
    {
        public string CountryCode => "GBR";
        public string SystemName => "UK PAYE & National Insurance (HMRC)";

        public bool SupportsCountry(string countryCode) =>
            string.Equals(countryCode, "GBR", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(countryCode, "GB", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(countryCode, "UK", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(countryCode, "United Kingdom", StringComparison.OrdinalIgnoreCase);

        public PayrollCalculationResult CalculatePayroll(PayrollCalculationRequest request)
        {
            var gross = request.GrossSalary;
            var deductions = new Dictionary<string, decimal>();
            var contributions = new Dictionary<string, decimal>();

            // Employee NIC (8% on standard earnings above primary threshold £1,048/mo)
            var monthlyPrimaryThreshold = 1048m;
            var nicTaxable = Math.Max(0m, gross - monthlyPrimaryThreshold);
            var employeeNic = IndiaStatutoryCalculator.RoundMoney(nicTaxable * 0.08m);
            deductions["NationalInsurance_Employee"] = employeeNic;

            // Employer NIC (13.8% above secondary threshold £758/mo)
            var monthlySecondaryThreshold = 758m;
            var employerNicTaxable = Math.Max(0m, gross - monthlySecondaryThreshold);
            var employerNic = IndiaStatutoryCalculator.RoundMoney(employerNicTaxable * 0.138m);
            contributions["NationalInsurance_Employer"] = employerNic;

            // Workplace Auto-enrolment Pension (5% Employee, 3% Employer)
            var employeePension = IndiaStatutoryCalculator.RoundMoney(gross * 0.05m);
            var employerPension = IndiaStatutoryCalculator.RoundMoney(gross * 0.03m);
            deductions["WorkplacePension_Employee"] = employeePension;
            contributions["WorkplacePension_Employer"] = employerPension;

            // PAYE Income Tax Estimate (20% basic rate)
            var monthlyPersonalAllowance = 1047m;
            var payeTaxable = Math.Max(0m, gross - monthlyPersonalAllowance);
            var payeTax = IndiaStatutoryCalculator.RoundMoney(payeTaxable * 0.20m);
            deductions["PAYE_IncomeTax"] = payeTax;

            decimal totalDeductions = 0;
            foreach (var val in deductions.Values) totalDeductions += val;

            decimal totalContributions = 0;
            foreach (var val in contributions.Values) totalContributions += val;

            return new PayrollCalculationResult
            {
                CountryCode = "GBR",
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
