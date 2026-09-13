using System.Collections.Generic;

namespace UabIndia.Application.Interfaces
{
    public class CountryProfile
    {
        public string CountryCode { get; set; } = "IND";
        public string CountryName { get; set; } = "India";
        public string Flag { get; set; } = "🇮🇳";
        public string DefaultCurrency { get; set; } = "INR";
        public string CurrencySymbol { get; set; } = "₹";
        public string DefaultTimezone { get; set; } = "Asia/Kolkata";
        public int FiscalYearStartMonth { get; set; } = 4; // April
        public string TaxSystemName { get; set; } = "GST (Goods & Services Tax)";
        public string TaxIdLabel { get; set; } = "GSTIN / PAN";
        public string NationalIdLabel { get; set; } = "Aadhaar / National ID";
        public string SocialSecurityLabel { get; set; } = "UAN / PF Number";
        public string BankRoutingLabel { get; set; } = "IFSC Code";
        public List<string> Subdivisions { get; set; } = new();
        public List<string> StandardPayrollDeductions { get; set; } = new();
    }

    public interface ILocalizationService
    {
        IReadOnlyList<CountryProfile> GetSupportedCountries();
        CountryProfile GetCountryProfile(string countryCode);
    }
}
