using System;

namespace UabIndia.Core.Entities
{
    public class Vendor : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string VendorCode { get; set; } = string.Empty;
        public string VendorName { get; set; } = string.Empty;
        public string VendorType { get; set; } = "Supplier"; // Supplier, Service Provider, Contractor
        public string? CompanyName { get; set; }
        public string? GSTNumber { get; set; }
        public string? PANNumber { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? MobileNumber { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; } = "India";
        public string? PostalCode { get; set; }
        public string? ContactPerson { get; set; }
        public decimal CreditLimit { get; set; }
        public int PaymentTerms { get; set; } = 30; // Days
        public decimal OpeningBalance { get; set; }
        public decimal CurrentBalance { get; set; }
        public string Status { get; set; } = "Active"; // Active, Inactive, Blocked
        public string? BankName { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? IFSCCode { get; set; }
        public string? Notes { get; set; }
    }
}
