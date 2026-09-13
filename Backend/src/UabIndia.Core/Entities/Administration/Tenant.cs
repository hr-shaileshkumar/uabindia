using System;

namespace UabIndia.Core.Entities
{
    public class Tenant : BaseEntity
    {
        public string? Subdomain { get; set; }
        public string? Name { get; set; }
        public bool IsActive { get; set; } = true;
        public string ProvisionStatus { get; set; } = "Pending";
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }
        public string? FeatureFlags { get; set; }

        // Global Localization Configurations
        public string CountryCode { get; set; } = "IND";
        public string DefaultCurrencyCode { get; set; } = "INR";
        public string DefaultTimezone { get; set; } = "Asia/Kolkata";
        public int FiscalYearStartMonth { get; set; } = 4; // 4 = April (India/UK), 1 = January (US/UAE/SG)
        public string? IndustryExtensionCode { get; set; } = "Generic";
    }
}
