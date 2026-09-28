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
            var result = new DemoSeedResult { Success = true };

            try
            {
                // 1. Company Master
                var company = await _db.Companies.FirstOrDefaultAsync(c => c.TenantId == tenantId);
                if (company == null)
                {
                    company = new Company
                    {
                        Id = Guid.NewGuid(),
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

                // 2. Departments
                var deptDefs = new (string Name, string Code)[]
                {
                    ("Engineering & R&D", "ENG"),
                    ("Sales & Commercial Operations", "SALES"),
                    ("Manufacturing & Logistics", "MFG"),
                    ("Finance & Statutory Accounting", "FIN"),
                    ("Human Capital & People", "HR")
                };

                var existingDepts = await _db.Departments.Where(d => d.TenantId == tenantId).ToDictionaryAsync(d => d.Code, d => d);
                foreach (var (name, code) in deptDefs)
                {
                    if (!existingDepts.ContainsKey(code))
                    {
                        var d = new Department
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            CompanyId = companyId,
                            Name = name,
                            Code = code,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        };
                        _db.Departments.Add(d);
                        existingDepts[code] = d;
                    }
                }
                await _db.SaveChangesAsync();

                // 3. Designations
                var desigDefs = new (string Title, string Code)[]
                {
                    ("Principal Solutions Architect", "DES-01"),
                    ("Enterprise Account Director", "DES-02"),
                    ("Plant Operations Manager", "DES-03"),
                    ("Senior Financial Controller", "DES-04"),
                    ("Head of Human Resources", "DES-05")
                };

                var existingDesigs = await _db.Designations.Where(d => d.TenantId == tenantId).ToDictionaryAsync(d => d.Code, d => d);
                foreach (var (title, code) in desigDefs)
                {
                    if (!existingDesigs.ContainsKey(code))
                    {
                        var des = new Designation
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            CompanyId = companyId,
                            Name = title,
                            Code = code,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        };
                        _db.Designations.Add(des);
                        existingDesigs[code] = des;
                    }
                }
                await _db.SaveChangesAsync();

                // 4. Employees (10 Indian Staff)
                var employeeDefs = new[]
                {
                    ("EMP-001", "Rajesh Kumar", "rajesh.kumar@uabindia.in", "+91 98201 11001", "ENG", "DES-01", 175000m),
                    ("EMP-002", "Priya Sharma", "priya.sharma@uabindia.in", "+91 98201 11002", "SALES", "DES-02", 150000m),
                    ("EMP-003", "Vikram Malhotra", "vikram.malhotra@uabindia.in", "+91 98201 11003", "MFG", "DES-03", 135000m),
                    ("EMP-004", "Ananya Iyer", "ananya.iyer@uabindia.in", "+91 98201 11004", "FIN", "DES-04", 140000m),
                    ("EMP-005", "Amit Patel", "amit.patel@uabindia.in", "+91 98201 11005", "HR", "DES-05", 125000m),
                    ("EMP-006", "Sneha Reddy", "sneha.reddy@uabindia.in", "+91 98201 11006", "ENG", "DES-01", 110000m),
                    ("EMP-007", "Rohan Verma", "rohan.verma@uabindia.in", "+91 98201 11007", "SALES", "DES-02", 95000m),
                    ("EMP-008", "Deepa Nair", "deepa.nair@uabindia.in", "+91 98201 11008", "MFG", "DES-03", 90000m),
                    ("EMP-009", "Sunil Joshi", "sunil.joshi@uabindia.in", "+91 98201 11009", "FIN", "DES-04", 85000m),
                    ("EMP-010", "Kavita Gupta", "kavita.gupta@uabindia.in", "+91 98201 11010", "HR", "DES-05", 80000m),
                };

                var existingEmpCodes = await _db.Employees.Where(e => e.TenantId == tenantId).Select(e => e.EmployeeCode).ToListAsync();
                var empCodeSet = new HashSet<string>(existingEmpCodes.Where(c => c != null).Select(c => c!), StringComparer.OrdinalIgnoreCase);
                var createdEmployees = new List<Employee>();

                foreach (var (code, fullName, email, phone, deptCode, desCode, salary) in employeeDefs)
                {
                    if (!empCodeSet.Contains(code))
                    {
                        var emp = new Employee
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            CompanyId = companyId,
                            DepartmentId = existingDepts.GetValueOrDefault(deptCode)?.Id,
                            DesignationId = existingDesigs.GetValueOrDefault(desCode)?.Id,
                            EmployeeCode = code,
                            FullName = fullName,
                            WorkEmail = email,
                            Phone = phone,
                            DateOfJoining = DateTime.UtcNow.AddMonths(-18),
                            Status = "Active",
                            EmploymentType = "Permanent",
                            MonthlyCtc = salary,
                            BasicSalary = salary * 0.5m,
                            CreatedAt = DateTime.UtcNow
                        };
                        _db.Employees.Add(emp);
                        createdEmployees.Add(emp);
                        result.EmployeesCreated++;
                    }
                }
                await _db.SaveChangesAsync();

                // 5. Attendance Punches for Employees
                var allEmployees = await _db.Employees.Where(e => e.TenantId == tenantId && !e.IsDeleted).Take(10).ToListAsync();
                var hasAttendance = await _db.AttendanceRecords.AnyAsync(a => a.TenantId == tenantId);
                if (!hasAttendance && allEmployees.Count > 0)
                {
                    var today = DateTime.UtcNow.Date;
                    for (int dayOffset = -5; dayOffset <= 0; dayOffset++)
                    {
                        var date = today.AddDays(dayOffset);
                        if (date.DayOfWeek == DayOfWeek.Sunday) continue;

                        foreach (var emp in allEmployees)
                        {
                            var punchIn = date.AddHours(9).AddMinutes(new Random().Next(0, 20));
                            var punchOut = date.AddHours(18).AddMinutes(new Random().Next(0, 30));

                            var pIn = new AttendanceRecord
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                EmployeeId = emp.Id,
                                PunchType = "IN",
                                Timestamp = punchIn,
                                Source = "BiometricTerminal",
                                GeoValidated = true,
                                CreatedAt = punchIn
                            };

                            var pOut = new AttendanceRecord
                            {
                                Id = Guid.NewGuid(),
                                TenantId = tenantId,
                                EmployeeId = emp.Id,
                                PunchType = "OUT",
                                Timestamp = punchOut,
                                Source = "BiometricTerminal",
                                GeoValidated = true,
                                CreatedAt = punchOut
                            };

                            _db.AttendanceRecords.AddRange(pIn, pOut);
                            result.AttendanceCreated += 2;
                        }
                    }
                    await _db.SaveChangesAsync();
                }

                // 6. Chart of Accounts
                var defaultAccounts = new List<ChartOfAccount>
                {
                    new() { TenantId = tenantId, AccountCode = "1001", AccountName = "Cash on Hand", AccountType = "Asset", SubType = "Cash", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1002", AccountName = "HDFC Current Account (A/C: 50200012345678)", AccountType = "Asset", SubType = "Bank", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1101", AccountName = "Trade Debtors (Accounts Receivable)", AccountType = "Asset", SubType = "Current Asset", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1201", AccountName = "Inventory - Finished Goods", AccountType = "Asset", SubType = "Inventory", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1301", AccountName = "Input CGST (9%)", AccountType = "Asset", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1302", AccountName = "Input SGST (9%)", AccountType = "Asset", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1303", AccountName = "Input IGST (18%)", AccountType = "Asset", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1304", AccountName = "RCM Input CGST", AccountType = "Asset", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1305", AccountName = "RCM Input SGST", AccountType = "Asset", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "1306", AccountName = "RCM Input IGST", AccountType = "Asset", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2001", AccountName = "Trade Creditors (Accounts Payable)", AccountType = "Liability", SubType = "Current Liability", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2101", AccountName = "Output CGST (9%)", AccountType = "Liability", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2102", AccountName = "Output SGST (9%)", AccountType = "Liability", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2103", AccountName = "Output IGST (18%)", AccountType = "Liability", SubType = "Tax", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2201", AccountName = "PF Payable (Statutory)", AccountType = "Liability", SubType = "Statutory", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2202", AccountName = "ESIC Payable (Statutory)", AccountType = "Liability", SubType = "Statutory", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2210", AccountName = "TDS Payable - Contractors (Sec 194C)", AccountType = "Liability", SubType = "Statutory", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "2211", AccountName = "TDS Payable - Professional Fees (Sec 194J)", AccountType = "Liability", SubType = "Statutory", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "4001", AccountName = "Domestic Product Sales (18% GST)", AccountType = "Revenue", SubType = "Operating Revenue", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "4201", AccountName = "Rounding Off Reserve (Income)", AccountType = "Revenue", SubType = "Other Income", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "5001", AccountName = "Cost of Goods Sold (COGS)", AccountType = "Expense", SubType = "Cost of Sales", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "5101", AccountName = "Salaries & Wages Expense", AccountType = "Expense", SubType = "Payroll Expense", Currency = "INR", IsActive = true },
                    new() { TenantId = tenantId, AccountCode = "5201", AccountName = "Rounding Off Reserve (Expense)", AccountType = "Expense", SubType = "Other Expense", Currency = "INR", IsActive = true },
                };

                var existingAccounts = await _db.ChartOfAccounts.Where(a => a.TenantId == tenantId).Select(a => a.AccountCode).ToListAsync();
                var accCodeSet = new HashSet<string>(existingAccounts, StringComparer.OrdinalIgnoreCase);
                foreach (var a in defaultAccounts)
                {
                    if (!accCodeSet.Contains(a.AccountCode))
                    {
                        a.CreatedAt = DateTime.UtcNow;
                        _db.ChartOfAccounts.Add(a);
                        result.AccountsCreated++;
                    }
                }
                await _db.SaveChangesAsync();

                // 7. Warehouses
                var whDefs = new (string Name, string Code, string City)[]
                {
                    ("Bhiwandi Central Logistics Hub", "WH-MUM-01", "Thane/Mumbai"),
                    ("Whitefield Fulfillment Depot", "WH-BLR-01", "Bengaluru"),
                    ("Gurugram North Distribution Centre", "WH-NCR-01", "Gurugram")
                };

                var existingWhs = await _db.Warehouses.Where(w => w.TenantId == tenantId).ToDictionaryAsync(w => w.WarehouseCode, w => w);
                foreach (var (name, code, city) in whDefs)
                {
                    if (!existingWhs.ContainsKey(code))
                    {
                        var wh = new Warehouse
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            CompanyId = companyId,
                            WarehouseName = name,
                            WarehouseCode = code,
                            City = city,
                            State = "Maharashtra",
                            Country = "India",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        };
                        _db.Warehouses.Add(wh);
                        existingWhs[code] = wh;
                    }
                }
                await _db.SaveChangesAsync();

                // 8. Items (Products and Components)
                var itemDefs = new (string Code, string Name, decimal Price, decimal Cost, string Category)[]
                {
                    ("SKU-MOT-100", "Industrial Electric Motor 7.5 kW", 45000m, 32000m, "Finished Goods"),
                    ("SKU-PMP-200", "High-Pressure Hydraulic Pump 250 Bar", 68000m, 48000m, "Finished Goods"),
                    ("SKU-VLV-300", "Pneumatic Control Valve 2 Inch", 12500m, 8500m, "Finished Goods"),
                    ("SKU-SNS-400", "Industrial Optical Sensor Unit", 5400m, 3200m, "Electronics"),
                    ("SKU-BRG-500", "Precision Roller Bearing Set", 3800m, 2200m, "Mechanical"),
                    ("SKU-STL-001", "High-Grade Rolled Steel Sheet 3mm", 4200m, 3100m, "Raw Material"),
                    ("SKU-COP-002", "Electrolytic Copper Wire 100m Roll", 8900m, 6800m, "Raw Material"),
                    ("SKU-LUB-003", "Synthetic Hydraulic Lubricant 20L", 7200m, 5100m, "Consumable"),
                    ("SKU-BOX-004", "Heavy Duty Corrugated Shipping Crate", 850m, 520m, "Packaging"),
                    ("SKU-CON-005", "Automated IoT Telemetry Controller", 18500m, 12000m, "Electronics")
                };

                var existingItems = await _db.Items.Where(i => i.TenantId == tenantId).ToDictionaryAsync(i => i.ItemCode, i => i);
                foreach (var (code, name, price, cost, cat) in itemDefs)
                {
                    if (!existingItems.ContainsKey(code))
                    {
                        var it = new Item
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            CompanyId = companyId,
                            ItemCode = code,
                            ItemName = name,
                            SellingPrice = price,
                            PurchasePrice = cost,
                            CurrentStock = 120,
                            ReorderLevel = 25,
                            UnitOfMeasure = "Nos",
                            Category = cat,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        };
                        _db.Items.Add(it);
                        existingItems[code] = it;
                        result.ItemsCreated++;
                    }
                }
                await _db.SaveChangesAsync();

                // 9. Customers
                var custDefs = new (string Code, string Name, string City, string Gst)[]
                {
                    ("CUST-001", "Infosys Technologies Ltd", "Bengaluru", "29AABCI4444D1Z4"),
                    ("CUST-002", "Reliance Industries Ltd", "Mumbai", "27AABCR5555E1Z5")
                };

                var existingCusts = await _db.Customers.Where(c => c.TenantId == tenantId).ToDictionaryAsync(c => c.CustomerCode, c => c);
                foreach (var (code, name, city, gst) in custDefs)
                {
                    if (!existingCusts.ContainsKey(code))
                    {
                        var c = new Customer
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            CompanyId = companyId,
                            CustomerCode = code,
                            CustomerName = name,
                            City = city,
                            State = "Maharashtra",
                            Country = "India",
                            GSTNumber = gst,
                            Status = "Active",
                            CreditLimit = 5000000m,
                            PaymentTerms = 30,
                            CreatedAt = DateTime.UtcNow
                        };
                        _db.Customers.Add(c);
                        existingCusts[code] = c;
                        result.CustomersCreated++;
                    }
                }
                await _db.SaveChangesAsync();

                // 10. Vendors
                var vendorDefs = new (string Code, string Name, string City, string Gst, string VendorType, string Notes)[]
                {
                    ("VEN-001", "Apex Logistics & Transport Pvt Ltd", "Thane", "27AABCA1111A1Z1", "Contractor", "Transport contractor covered under Section 194C TDS"),
                    ("VEN-002", "Kothari & Associates LLP", "Mumbai", "27AABCK2222B1Z2", "Professional", "Statutory audit and tax consultants (194J 10%)"),
                    ("VEN-003", "Tata Communications Ltd", "Mumbai", "27AABCT3333C1Z3", "Enterprise", "Corporate cloud & telecom services")
                };

                var existingVendors = await _db.Vendors.Where(v => v.TenantId == tenantId).ToDictionaryAsync(v => v.VendorCode, v => v);
                foreach (var (code, name, city, gst, vType, notes) in vendorDefs)
                {
                    if (!existingVendors.ContainsKey(code))
                    {
                        var v = new Vendor
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            CompanyId = companyId,
                            VendorCode = code,
                            VendorName = name,
                            VendorType = vType,
                            City = city,
                            State = "Maharashtra",
                            Country = "India",
                            GSTNumber = gst,
                            Status = "Active",
                            PaymentTerms = 30,
                            Notes = notes,
                            CreatedAt = DateTime.UtcNow
                        };
                        _db.Vendors.Add(v);
                        existingVendors[code] = v;
                        result.VendorsCreated++;
                    }
                }
                await _db.SaveChangesAsync();

                // 11. Sales Invoices
                var hasInvoices = await _db.SalesInvoices.AnyAsync(i => i.TenantId == tenantId);
                if (!hasInvoices && existingCusts.Count > 0)
                {
                    var cust = existingCusts.Values.First();
                    var inv1 = new SalesInvoice
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        InvoiceNumber = "INV-2026-0001",
                        CustomerId = cust.Id,
                        InvoiceDate = DateTime.UtcNow.AddDays(-10),
                        DueDate = DateTime.UtcNow.AddDays(20),
                        SubTotal = 270000m,
                        TaxAmount = 48600m,
                        TotalAmount = 318600m,
                        Status = "Paid",
                        CreatedAt = DateTime.UtcNow.AddDays(-10)
                    };

                    var inv2 = new SalesInvoice
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        InvoiceNumber = "INV-2026-0002",
                        CustomerId = cust.Id,
                        InvoiceDate = DateTime.UtcNow.AddDays(-3),
                        DueDate = DateTime.UtcNow.AddDays(27),
                        SubTotal = 450000m,
                        TaxAmount = 81000m,
                        TotalAmount = 531000m,
                        Status = "Issued",
                        CreatedAt = DateTime.UtcNow.AddDays(-3)
                    };

                    _db.SalesInvoices.AddRange(inv1, inv2);
                    result.InvoicesCreated += 2;
                    await _db.SaveChangesAsync();
                }

                // 14. Document Templates
                if (!await _db.DocumentTemplates.AnyAsync(t => t.TenantId == tenantId))
                {
                    _db.DocumentTemplates.AddRange(
                        new DocumentTemplate
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            CompanyId = company?.Id,
                            TemplateKey = "tax_invoice",
                            Name = "GST Tax Invoice",
                            Category = "Commercial",
                            Description = "Official GST-compliant tax invoice template with HSN codes, split CGST/SGST/IGST and bank details.",
                            PageOrientation = "Portrait",
                            HeaderLayout = "modern-split",
                            HasDigitalSignature = true,
                            IsDefault = true,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new DocumentTemplate
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            CompanyId = company?.Id,
                            TemplateKey = "purchase_order",
                            Name = "Procurement Purchase Order",
                            Category = "Commercial",
                            Description = "Standard enterprise purchase order with billing/shipping addresses and line items.",
                            PageOrientation = "Portrait",
                            HeaderLayout = "centered-banner",
                            HasDigitalSignature = true,
                            IsDefault = true,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new DocumentTemplate
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            CompanyId = company?.Id,
                            TemplateKey = "offer_letter",
                            Name = "Talent Acquisition Offer Letter",
                            Category = "HRMS",
                            Description = "Official candidate employment offer letter with compensation structure and joining terms.",
                            PageOrientation = "Portrait",
                            HeaderLayout = "classic-left",
                            HasDigitalSignature = true,
                            IsDefault = true,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new DocumentTemplate
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tenantId,
                            CompanyId = company?.Id,
                            TemplateKey = "appointment_letter",
                            Name = "Executive Appointment Letter",
                            Category = "HRMS",
                            Description = "Formal confirmation of appointment with duties, reporting lines, and probation terms.",
                            PageOrientation = "Portrait",
                            HeaderLayout = "modern-split",
                            HasDigitalSignature = true,
                            IsDefault = true,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        }
                    );
                    await _db.SaveChangesAsync();
                }

                result.Message = $"Seeding complete! Employees: {result.EmployeesCreated}, Items: {result.ItemsCreated}, Invoices: {result.InvoicesCreated}, Attendance: {result.AttendanceCreated}, Accounts: {result.AccountsCreated}, Customers: {result.CustomersCreated}, Vendors: {result.VendorsCreated}.";
                _logger.LogInformation("Demo seeding completed: {Message}", result.Message);
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.Message = ex.Message;
                _logger.LogError(ex, "Error occurred during Indian Enterprise demo seeding.");
            }

            return result;
        }
    }
}
