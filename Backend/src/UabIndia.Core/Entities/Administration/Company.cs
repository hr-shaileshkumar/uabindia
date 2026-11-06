using System;

namespace UabIndia.Core.Entities
{
    public class Company : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? LegalName { get; set; }
        public string? Code { get; set; }
        public string? RegistrationNumber { get; set; }
        public string? TaxId { get; set; } // Universal Tax ID: GSTIN/VAT/EIN/TRN
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? LogoUrl { get; set; }
        public string? Industry { get; set; }
        public string? CompanySize { get; set; } // Small, Medium, Large, Enterprise
        public string? RegistrationAddress { get; set; }
        public string? OperationalAddress { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
        public string CountryCode { get; set; } = "IND";
        public string FunctionalCurrencyCode { get; set; } = "INR";
        public Guid? ParentCompanyId { get; set; } // Multi-Company / Subsidiary Hierarchy
        public string? BankAccountNumber { get; set; }
        public string? BankName { get; set; }
        public string? BankBranch { get; set; }
        public string? BankRoutingCode { get; set; } // Universal Routing Code: IFSC/Sort Code/ABA
        public string? BankIban { get; set; }
        public string? BankSwiftCode { get; set; }
        public string? IFSCCode { get; set; } // Regional Backwards Compatibility
        public string? FinancialYearStart { get; set; } // Format: MM-DD
        public string? FinancialYearEnd { get; set; }   // Format: MM-DD
        public int? MaxEmployees { get; set; }
        public string? ContactPersonName { get; set; }
        public string? ContactPersonPhone { get; set; }
        public string? ContactPersonEmail { get; set; }
        public string? HR_PersonName { get; set; }
        public string? HR_PersonEmail { get; set; }
        public string? BrandColor { get; set; } = "#0f172a";
        public string? AccentColor { get; set; } = "#2563eb";
        public string? LetterheadLayout { get; set; } = "modern-split"; // modern-split, centered-banner, classic-left, minimal-ribbon
        public string? SignatoryName { get; set; }
        public string? SignatoryDesignation { get; set; }
        public string? StampUrl { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
