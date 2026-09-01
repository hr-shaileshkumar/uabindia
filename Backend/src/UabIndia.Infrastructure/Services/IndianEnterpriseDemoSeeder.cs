using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Core.Entities;
using UabIndia.Core.Security;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class IndianEnterpriseDemoSeeder : IIndianEnterpriseDemoSeeder
    {
        private readonly ApplicationDbContext _db;
        private readonly IEncryptionService _encryption;
        private readonly ILogger<IndianEnterpriseDemoSeeder> _logger;

        public IndianEnterpriseDemoSeeder(
            ApplicationDbContext db,
            IEncryptionService encryption,
            ILogger<IndianEnterpriseDemoSeeder> logger)
        {
            _db = db;
            _encryption = encryption;
            _logger = logger;
        }

        public async Task<DemoSeedResult> SeedDemoTenantAsync(Guid tenantId)
        {
            var result = new DemoSeedResult();

            try
            {
                // 1. Seed or Retrieve Company
                var company = await _db.Companies.FirstOrDefaultAsync(c => c.TenantId == tenantId);
                if (company == null)
                {
                    company = new Company
                    {
                        TenantId = tenantId,
                        Name = "Bharat Technologies & Manufacturing Ltd",
                        LegalName = "Bharat Technologies & Manufacturing Private Limited",
                        TaxId = "27AABCB1234F1Z5",
                        RegistrationNumber = "U72200MH2020PTC123456",
                        Email = "finance@bharat-technologies.in",
                        PhoneNumber = "+91 22 6123 4567",
                        FunctionalCurrencyCode = "INR",
                        CountryCode = "IND",
                        IsActive = true,
                        FinancialYearStart = "04-01",
                        FinancialYearEnd = "03-31",
                        City = "Mumbai",
                        State = "Maharashtra",
                        Country = "India",
                        PostalCode = "400051",
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.Companies.Add(company);
                    await _db.SaveChangesAsync();
                    result.CompanyCreated = true;
                }

                var companyId = company.Id;

                // 2. Standard Indian Chart of Accounts
                var defaultAccounts = new List<ChartOfAccount>
                {
                    // Current Assets
                    new() { TenantId = tenantId, AccountCode = "1001", AccountName = "Cash on Hand", AccountType = "Asset", SubType = "Cash", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1002", AccountName = "HDFC Current Account (A/C: 50200012345678)", AccountType = "Asset", SubType = "Bank", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1101", AccountName = "Trade Debtors (Accounts Receivable)", AccountType = "Asset", SubType = "Current Asset", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1201", AccountName = "Inventory - Finished Goods", AccountType = "Asset", SubType = "Inventory", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1301", AccountName = "Input CGST (6%)", AccountType = "Asset", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1302", AccountName = "Input SGST (6%)", AccountType = "Asset", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1303", AccountName = "Input IGST (18%)", AccountType = "Asset", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1304", AccountName = "RCM Input CGST", AccountType = "Asset", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1305", AccountName = "RCM Input SGST", AccountType = "Asset", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1306", AccountName = "RCM Input IGST", AccountType = "Asset", SubType = "Tax", Currency = "INR", IsActive = true },

                    // Current Liabilities
                    new() { TenantId = tenantId, AccountCode = "2001", AccountName = "Trade Creditors (Accounts Payable)", AccountType = "Liability", SubType = "Current Liability", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2101", AccountName = "Output CGST (6%)", AccountType = "Liability", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2102", AccountName = "Output SGST (6%)", AccountType = "Liability", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2103", AccountName = "Output IGST (18%)", AccountType = "Liability", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2204", AccountName = "RCM Output CGST Payable", AccountType = "Liability", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2205", AccountName = "RCM Output SGST Payable", AccountType = "Liability", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2206", AccountName = "RCM Output IGST Payable", AccountType = "Liability", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2210", AccountName = "TDS Payable (Sec 194C / 194J / 194Q)", AccountType = "Liability", SubType = "Current Liability", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2211", AccountName = "EPF Payable (12% + 12%)", AccountType = "Liability", SubType = "Current Liability", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2212", AccountName = "ESIC Payable (0.75% + 3.25%)", AccountType = "Liability", SubType = "Current Liability", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2213", AccountName = "Professional Tax (PT) Payable", AccountType = "Liability", SubType = "Current Liability", Currency = "INR", IsActive = true },

                    // Revenue
                    new() { TenantId = tenantId, AccountCode = "4001", AccountName = "Domestic Product Sales (18% GST)", AccountType = "Revenue", SubType = "Operating Revenue", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "4002", AccountName = "IT Professional Services (18% GST)", AccountType = "Revenue", SubType = "Operating Revenue", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "4201", AccountName = "Rounding Off Reserve (Income)", AccountType = "Revenue", SubType = "Other Income", Currency = "INR", IsActive = true },

                    // Expenses
                    new() { TenantId = tenantId, AccountCode = "5001", AccountName = "Cost of Goods Sold (COGS)", AccountType = "Expense", SubType = "Cost of Sales", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "5101", AccountName = "Contractor & Transport Expenses (Sec 194C)", AccountType = "Expense", SubType = "Direct Expense", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "5102", AccountName = "Legal & Professional Fees (Sec 194J)", AccountType = "Expense", SubType = "Administrative Expense", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "5201", AccountName = "Rounding Off Adjustment (Expense)", AccountType = "Expense", SubType = "Other Expense", Currency = "INR", IsActive = true }
                };

                var existingCodes = await _db.ChartOfAccounts
                    .Where(a => a.TenantId == tenantId)
                    .Select(a => a.AccountCode)
                    .ToListAsync();

                var codesSet = new HashSet<string>(existingCodes, StringComparer.OrdinalIgnoreCase);

                foreach (var acc in defaultAccounts)
                {
                    if (!codesSet.Contains(acc.AccountCode))
                    {
                        acc.CreatedAt = DateTime.UtcNow;
                        _db.ChartOfAccounts.Add(acc);
                        result.AccountsCreated++;
                    }
                }

                // 3. Demo Vendors with Statutory TDS Profiles
                var defaultVendors = new List<Vendor>
                {
                    new()
                    {
                        TenantId = tenantId,
                        CompanyId = companyId,
                        VendorCode = "VEN-001",
                        VendorName = "Apex Logistics & Transport Pvt Ltd",
                        VendorType = "Contractor",
                        CompanyName = "Apex Logistics & Transport Private Limited",
                        GSTNumber = "27AABCA1111A1Z1",
                        PANNumber = "AABCA1111A",
                        Email = "billing@apexlogistics.in",
                        PhoneNumber = "+91 22 2845 1111",
                        Address = "Warehouse Complex, Bhiwandi",
                        City = "Thane",
                        State = "Maharashtra",
                        Country = "India",
                        PostalCode = "421302",
                        ContactPerson = "Sunil Deshmukh",
                        PaymentTerms = 30,
                        Status = "Active",
                        Notes = "TDS Section 194C (2% Corporate Contractor Deduction)"
                    },
                    new()
                    {
                        TenantId = tenantId,
                        CompanyId = companyId,
                        VendorCode = "VEN-002",
                        VendorName = "Kothari & Associates LLP",
                        VendorType = "Service Provider",
                        CompanyName = "Kothari & Associates Chartered Accountants",
                        GSTNumber = "27AABCK2222B1Z2",
                        PANNumber = "AABCK2222B",
                        Email = "accounts@kothariassociates.com",
                        PhoneNumber = "+91 22 2200 2222",
                        Address = "Nariman Point, Marine Drive",
                        City = "Mumbai",
                        State = "Maharashtra",
                        Country = "India",
                        PostalCode = "400021",
                        ContactPerson = "CA Amit Kothari",
                        PaymentTerms = 15,
                        Status = "Active",
                        Notes = "TDS Section 194J (10% Professional Services Deduction)"
                    },
                    new()
                    {
                        TenantId = tenantId,
                        CompanyId = companyId,
                        VendorCode = "VEN-003",
                        VendorName = "Tata Communications Ltd",
                        VendorType = "Service Provider",
                        CompanyName = "Tata Communications Limited",
                        GSTNumber = "27AABCT3333C1Z3",
                        PANNumber = "AABCT3333C",
                        Email = "enterprise@tatacommunications.com",
                        PhoneNumber = "+91 22 6659 3333",
                        Address = "BKC Complex, Bandra East",
                        City = "Mumbai",
                        State = "Maharashtra",
                        Country = "India",
                        PostalCode = "400051",
                        ContactPerson = "Vikram Mehta",
                        PaymentTerms = 30,
                        Status = "Active",
                        Notes = "TDS Section 194J (2% Technical Services Deduction)"
                    }
                };

                var existingVendorCodes = await _db.Vendors
                    .Where(v => v.TenantId == tenantId)
                    .Select(v => v.VendorCode)
                    .ToListAsync();
                var vendorCodeSet = new HashSet<string>(existingVendorCodes, StringComparer.OrdinalIgnoreCase);

                foreach (var v in defaultVendors)
                {
                    if (!vendorCodeSet.Contains(v.VendorCode))
                    {
                        v.CreatedAt = DateTime.UtcNow;
                        _db.Vendors.Add(v);
                        result.VendorsCreated++;
                    }
                }

                // 4. Demo Customers (Corporate B2B)
                var defaultCustomers = new List<Customer>
                {
                    new()
                    {
                        TenantId = tenantId,
                        CompanyId = companyId,
                        CustomerCode = "CUST-001",
                        CustomerName = "Infosys Technologies Ltd",
                        CustomerType = "Company",
                        CompanyName = "Infosys Limited",
                        GSTNumber = "29AABCI4444D1Z4",
                        PANNumber = "AABCI4444D",
                        Email = "procurement@infosys.com",
                        PhoneNumber = "+91 80 2852 0261",
                        BillingAddress = "Electronics City, Hosur Road",
                        ShippingAddress = "Electronics City, Hosur Road",
                        City = "Bengaluru",
                        State = "Karnataka",
                        Country = "India",
                        PostalCode = "560100",
                        ContactPerson = "Ananya Rao",
                        CreditLimit = 5000000m,
                        PaymentTerms = 45,
                        Status = "Active"
                    },
                    new()
                    {
                        TenantId = tenantId,
                        CompanyId = companyId,
                        CustomerCode = "CUST-002",
                        CustomerName = "Reliance Industries Ltd",
                        CustomerType = "Company",
                        CompanyName = "Reliance Industries Limited",
                        GSTNumber = "27AABCR5555E1Z5",
                        PANNumber = "AABCR5555E",
                        Email = "vendor.desk@ril.com",
                        PhoneNumber = "+91 22 3555 5000",
                        BillingAddress = "Maker Chambers IV, Nariman Point",
                        ShippingAddress = "Reliance Corporate Park, Navi Mumbai",
                        City = "Mumbai",
                        State = "Maharashtra",
                        Country = "India",
                        PostalCode = "400021",
                        ContactPerson = "Rohit Verma",
                        CreditLimit = 10000000m,
                        PaymentTerms = 60,
                        Status = "Active"
                    }
                };

                var existingCustomerCodes = await _db.Customers
                    .Where(c => c.TenantId == tenantId)
                    .Select(c => c.CustomerCode)
                    .ToListAsync();
                var customerCodeSet = new HashSet<string>(existingCustomerCodes, StringComparer.OrdinalIgnoreCase);

                foreach (var c in defaultCustomers)
                {
                    if (!customerCodeSet.Contains(c.CustomerCode))
                    {
                        c.CreatedAt = DateTime.UtcNow;
                        _db.Customers.Add(c);
                        result.CustomersCreated++;
                    }
                }

                await _db.SaveChangesAsync();

                result.Success = true;
                result.Message = $"Demo data seeded successfully. Accounts: {result.AccountsCreated}, Vendors: {result.VendorsCreated}, Customers: {result.CustomersCreated}.";
                _logger.LogInformation("Demo seed for tenant {TenantId} completed: {Message}", tenantId, result.Message);
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.Message = ex.Message;
                _logger.LogError(ex, "Failed to seed demo data for tenant {TenantId}", tenantId);
            }

            return result;
        }
    }
}
