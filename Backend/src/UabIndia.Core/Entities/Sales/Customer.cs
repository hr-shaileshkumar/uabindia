using System;

namespace UabIndia.Core.Entities
{
    public class Customer : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string CustomerCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerType { get; set; } = "Individual"; // Individual, Company
        public string? CompanyName { get; set; }
        public string? GSTNumber { get; set; }
        public string? PANNumber { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? MobileNumber { get; set; }
        public string? BillingAddress { get; set; }
        public string? ShippingAddress { get; set; }
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
        public string? Notes { get; set; }
    }
}
