using System;
using System.Collections.Generic;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;

namespace UabIndia.Infrastructure.Services.Payroll
{
    public class IndiaPayrollEngine : IPayrollCalculationEngine
    {
        public string CountryCode => "IND";
        public string SystemName => "India EPFO / ESIC / PT Statutory Payroll";

        public bool SupportsCountry(string countryCode) =>
            string.Equals(countryCode, "IND", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(countryCode, "IN", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(countryCode, "India", StringComparison.OrdinalIgnoreCase);

        public PayrollCalculationResult CalculatePayroll(PayrollCalculationRequest request)
        {
            var gross = request.GrossSalary > 0 ? request.GrossSalary : request.BasicSalary + request.Hra + request.AdditionalAllowances;
            var basic = request.BasicSalary > 0 ? request.BasicSalary : Math.Round(gross * 0.5m, 2);

            var deductions = new Dictionary<string, decimal>();
            var contributions = new Dictionary<string, decimal>();

            decimal employeePf = 0;
            decimal employerPf = 0;
            decimal employerEps = 0;
            if (request.HasProvidentFund)
            {
                var pfBasis = Math.Min(basic, 15000m); // Statutory wage ceiling 15,000 INR
                employeePf = IndiaStatutoryCalculator.RoundMoney(pfBasis * 0.12m);
                employerEps = IndiaStatutoryCalculator.RoundMoney(pfBasis * 0.0833m);
                employerPf = IndiaStatutoryCalculator.RoundMoney((pfBasis * 0.12m) - employerEps);

                deductions["ProvidentFund_Employee"] = employeePf;
                contributions["ProvidentFund_Employer_EPF"] = employerPf;
                contributions["ProvidentFund_Employer_EPS"] = employerEps;
            }

            decimal employeeEsi = 0;
            decimal employerEsi = 0;
            if (request.HasEsi && gross <= 21000m) // Statutory ESI wage ceiling 21,000 INR
            {
                employeeEsi = IndiaStatutoryCalculator.RoundMoney(gross * 0.0075m);
                employerEsi = IndiaStatutoryCalculator.RoundMoney(gross * 0.0325m);

                deductions["ESIC_Employee"] = employeeEsi;
                contributions["ESIC_Employer"] = employerEsi;
            }

            // Professional Tax (standard ₹200/mo)
            decimal pt = gross > 15000m ? 200m : 0m;
            if (pt > 0)
            {
                deductions["ProfessionalTax"] = pt;
            }

            if (request.VoluntaryDeductions > 0)
            {
                deductions["VoluntaryDeductions"] = request.VoluntaryDeductions;
            }

            decimal totalDeductions = 0;
            foreach (var val in deductions.Values) totalDeductions += val;

            decimal totalContributions = 0;
            foreach (var val in contributions.Values) totalContributions += val;

            var netPayable = gross - totalDeductions;

            return new PayrollCalculationResult
            {
                CountryCode = "IND",
                SystemName = SystemName,
                GrossEarnings = gross,
                TotalEmployeeDeductions = totalDeductions,
                NetPayable = netPayable,
                TotalEmployerContributions = totalContributions,
                EmployeeDeductions = deductions,
                EmployerContributions = contributions
            };
        }
    }
}
