using System;
using System.Collections.Generic;
using System.Linq;
using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services
{
    public class GlobalLocalizationService : ILocalizationService
    {
        private static readonly Dictionary<string, CountryProfile> Profiles = new(StringComparer.OrdinalIgnoreCase)
        {
            ["IND"] = new CountryProfile
            {
                CountryCode = "IND",
                CountryName = "India",
                Flag = "🇮🇳",
                DefaultCurrency = "INR",
                CurrencySymbol = "₹",
                DefaultTimezone = "Asia/Kolkata",
                FiscalYearStartMonth = 4,
                TaxSystemName = "GST (CGST, SGST, IGST)",
                TaxIdLabel = "GSTIN / PAN",
                NationalIdLabel = "Aadhaar Card",
                SocialSecurityLabel = "Provident Fund (UAN)",
                BankRoutingLabel = "IFSC Code",
                Subdivisions = new List<string>
                {
                    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa",
                    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
                    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
                    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
                },
                StandardPayrollDeductions = new List<string> { "Provident Fund (PF - 12%)", "Employee State Insurance (ESI)", "Professional Tax (PT)", "TDS / Income Tax" }
            },
            ["USA"] = new CountryProfile
            {
                CountryCode = "USA",
                CountryName = "United States",
                Flag = "🇺🇸",
                DefaultCurrency = "USD",
                CurrencySymbol = "$",
                DefaultTimezone = "America/New_York",
                FiscalYearStartMonth = 1,
                TaxSystemName = "US Sales & Use Tax",
                TaxIdLabel = "EIN / Federal Tax ID",
                NationalIdLabel = "Social Security Number (SSN)",
                SocialSecurityLabel = "Social Security Administration (SSA)",
                BankRoutingLabel = "ABA Routing Transit Number",
                Subdivisions = new List<string>
                {
                    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
                    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
                    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
                    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
                    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
                    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
                    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
                },
                StandardPayrollDeductions = new List<string> { "Federal Income Tax Withholding (W-4)", "State Income Tax", "Social Security (FICA - 6.2%)", "Medicare (1.45%)", "401(k) Retirement" }
            },
            ["GBR"] = new CountryProfile
            {
                CountryCode = "GBR",
                CountryName = "United Kingdom",
                Flag = "🇬🇧",
                DefaultCurrency = "GBP",
                CurrencySymbol = "£",
                DefaultTimezone = "Europe/London",
                FiscalYearStartMonth = 4,
                TaxSystemName = "UK VAT (HMRC)",
                TaxIdLabel = "VAT Registration Number / UTR",
                NationalIdLabel = "National Insurance (NI) Number",
                SocialSecurityLabel = "State Pension Scheme",
                BankRoutingLabel = "Sort Code (6 Digits)",
                Subdivisions = new List<string>
                {
                    "England", "Scotland", "Wales", "Northern Ireland", "Greater London", "West Midlands", "Greater Manchester"
                },
                StandardPayrollDeductions = new List<string> { "PAYE Income Tax", "National Insurance (Class 1 NIC)", "Workplace Workplace Pension" }
            },
            ["ARE"] = new CountryProfile
            {
                CountryCode = "ARE",
                CountryName = "United Arab Emirates",
                Flag = "🇦🇪",
                DefaultCurrency = "AED",
                CurrencySymbol = "د.إ",
                DefaultTimezone = "Asia/Dubai",
                FiscalYearStartMonth = 1,
                TaxSystemName = "UAE Federal Tax Authority (FTA VAT)",
                TaxIdLabel = "Tax Registration Number (TRN)",
                NationalIdLabel = "Emirates ID",
                SocialSecurityLabel = "GPSSA (National Pension)",
                BankRoutingLabel = "IBAN (UAE Central Bank)",
                Subdivisions = new List<string>
                {
                    "Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"
                },
                StandardPayrollDeductions = new List<string> { "WPS Processing Fee", "End of Service Gratuity (EOSG Provision)" }
            },
            ["SGP"] = new CountryProfile
            {
                CountryCode = "SGP",
                CountryName = "Singapore",
                Flag = "🇸🇬",
                DefaultCurrency = "SGD",
                CurrencySymbol = "S$",
                DefaultTimezone = "Asia/Singapore",
                FiscalYearStartMonth = 1,
                TaxSystemName = "IRAS GST (9%)",
                TaxIdLabel = "UEN / GST Registration Number",
                NationalIdLabel = "NRIC / FIN Number",
                SocialSecurityLabel = "CPF (Central Provident Fund)",
                BankRoutingLabel = "Bank & Branch Code",
                Subdivisions = new List<string>
                {
                    "Central Region", "East Region", "North Region", "North-East Region", "West Region"
                },
                StandardPayrollDeductions = new List<string> { "CPF Employee Contribution (20%)", "SHG Contribution (CDAC/SINDA/MENDAKI)" }
            },
            ["GLOBAL"] = new CountryProfile
            {
                CountryCode = "GLOBAL",
                CountryName = "International / Multi-Region",
                Flag = "🌐",
                DefaultCurrency = "USD",
                CurrencySymbol = "$",
                DefaultTimezone = "UTC",
                FiscalYearStartMonth = 1,
                TaxSystemName = "Standard Commercial Sales Tax / VAT",
                TaxIdLabel = "Corporate Tax ID / VAT ID",
                NationalIdLabel = "National Citizen ID",
                SocialSecurityLabel = "Social Security / Pension Reference",
                BankRoutingLabel = "Routing Code / SWIFT / IBAN",
                Subdivisions = new List<string> { "North Region", "South Region", "East Region", "West Region", "Central District" },
                StandardPayrollDeductions = new List<string> { "National Statutory Withholding", "Mandatory Pension / Social Insurance" }
            }
        };

        public IReadOnlyList<CountryProfile> GetSupportedCountries()
        {
            return Profiles.Values.ToList();
        }

        public CountryProfile GetCountryProfile(string countryCode)
        {
            if (string.IsNullOrWhiteSpace(countryCode)) return Profiles["GLOBAL"];
            return Profiles.TryGetValue(countryCode, out var profile) ? profile : Profiles["GLOBAL"];
        }
    }
}
