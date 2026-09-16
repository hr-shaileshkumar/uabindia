using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Application.Models;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    /// <summary>
    /// Centralized Enterprise Master Data & Enum Lookup Service.
    /// Provides consistent, tenant-isolated reference data for all ERP modules and dynamic forms.
    /// </summary>
    public class LookupService : ILookupService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public LookupService(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private Guid TenantId => _tenantAccessor.GetTenantId();

        public async Task<LookupResultDto> GetLookupItemsAsync(string lookupType, LookupQuery query, CancellationToken ct = default)
        {
            var normalizedType = lookupType?.Trim().ToLowerInvariant() ?? string.Empty;
            var limit = Math.Clamp(query.Limit <= 0 ? 100 : query.Limit, 1, 500);
            var search = query.Search?.Trim().ToLowerInvariant();

            List<LookupItemDto> items;

            switch (normalizedType)
            {
                // ── Organization ──────────────────────────────────────────────
                case "departments":
                case "department":
                {
                    var q = _db.Departments.AsNoTracking().Where(d => d.TenantId == TenantId && !d.IsDeleted);
                    if (query.CompanyId.HasValue && query.CompanyId.Value != Guid.Empty)
                        q = q.Where(d => d.CompanyId == query.CompanyId.Value);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(d => d.Name.ToLower().Contains(search) || d.Code.ToLower().Contains(search));

                    var rows = await q.OrderBy(d => d.Name)
                        .Take(limit)
                        .Select(d => new { d.Id, d.Name, d.Code, d.Description, d.CompanyId })
                        .ToListAsync(ct);

                    items = rows.Select(d => new LookupItemDto
                    {
                        Id = d.Id.ToString(),
                        Name = d.Name,
                        Code = d.Code,
                        Description = d.Description,
                        Category = "Organization",
                        Metadata = new Dictionary<string, object?> { ["companyId"] = d.CompanyId }
                    }).ToList();
                    break;
                }

                case "designations":
                case "designation":
                {
                    var q = _db.Designations.AsNoTracking().Where(d => d.TenantId == TenantId && !d.IsDeleted);
                    if (query.CompanyId.HasValue && query.CompanyId.Value != Guid.Empty)
                        q = q.Where(d => d.CompanyId == query.CompanyId.Value);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(d => d.Name.ToLower().Contains(search) || d.Code.ToLower().Contains(search));

                    var rows = await q.OrderBy(d => d.Name)
                        .Take(limit)
                        .Select(d => new { d.Id, d.Name, d.Code, d.Description, d.Grade, d.Level })
                        .ToListAsync(ct);

                    items = rows.Select(d => new LookupItemDto
                    {
                        Id = d.Id.ToString(),
                        Name = d.Name,
                        Code = d.Code,
                        Description = d.Description,
                        Category = "Organization",
                        Metadata = new Dictionary<string, object?> { ["grade"] = d.Grade, ["level"] = d.Level }
                    }).ToList();
                    break;
                }

                case "branches":
                case "branch":
                {
                    var q = _db.Branches.AsNoTracking().Where(b => b.TenantId == TenantId && !b.IsDeleted);
                    if (query.CompanyId.HasValue && query.CompanyId.Value != Guid.Empty)
                        q = q.Where(b => b.CompanyId == query.CompanyId.Value);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(b => b.Name.ToLower().Contains(search) || b.Code.ToLower().Contains(search) || (b.City != null && b.City.ToLower().Contains(search)));

                    var rows = await q.OrderBy(b => b.Name)
                        .Take(limit)
                        .Select(b => new { b.Id, b.Name, b.Code, b.Description, b.City, b.State, b.Gstin, b.IsWarehouse })
                        .ToListAsync(ct);

                    items = rows.Select(b => new LookupItemDto
                    {
                        Id = b.Id.ToString(),
                        Name = b.Name,
                        Code = b.Code,
                        Description = b.City != null ? $"{b.City}, {b.State}" : b.Description,
                        Category = "Organization",
                        Metadata = new Dictionary<string, object?> { ["gstin"] = b.Gstin, ["isWarehouse"] = b.IsWarehouse }
                    }).ToList();
                    break;
                }

                case "companies":
                case "company":
                {
                    var q = _db.Companies.AsNoTracking().Where(c => c.TenantId == TenantId && !c.IsDeleted);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(c => c.Name.ToLower().Contains(search) || (c.Code != null && c.Code.ToLower().Contains(search)));

                    var rows = await q.OrderBy(c => c.Name)
                        .Take(limit)
                        .Select(c => new { c.Id, c.Name, c.Code, c.Industry, c.FunctionalCurrencyCode, c.TaxId })
                        .ToListAsync(ct);

                    items = rows.Select(c => new LookupItemDto
                    {
                        Id = c.Id.ToString(),
                        Name = c.Name,
                        Code = c.Code,
                        Description = c.Industry,
                        Category = "Organization",
                        Metadata = new Dictionary<string, object?> { ["currency"] = c.FunctionalCurrencyCode, ["taxId"] = c.TaxId }
                    }).ToList();
                    break;
                }

                case "cost-centers":
                case "costcenters":
                case "costcenter":
                {
                    var q = _db.CostCenters.AsNoTracking().Where(c => c.TenantId == TenantId && !c.IsDeleted);
                    if (query.CompanyId.HasValue && query.CompanyId.Value != Guid.Empty)
                        q = q.Where(c => c.CompanyId == query.CompanyId.Value);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(c => c.Name.ToLower().Contains(search) || c.Code.ToLower().Contains(search));

                    var rows = await q.OrderBy(c => c.Name)
                        .Take(limit)
                        .Select(c => new { c.Id, c.Name, c.Code, c.CostCenterType })
                        .ToListAsync(ct);

                    items = rows.Select(c => new LookupItemDto
                    {
                        Id = c.Id.ToString(),
                        Name = c.Name,
                        Code = c.Code,
                        Description = c.CostCenterType,
                        Category = "Finance",
                        Metadata = new Dictionary<string, object?> { ["type"] = c.CostCenterType }
                    }).ToList();
                    break;
                }

                case "business-units":
                case "businessunits":
                {
                    var q = _db.BusinessUnits.AsNoTracking().Where(b => b.TenantId == TenantId && !b.IsDeleted);
                    if (query.CompanyId.HasValue && query.CompanyId.Value != Guid.Empty)
                        q = q.Where(b => b.CompanyId == query.CompanyId.Value);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(b => b.Name.ToLower().Contains(search) || b.Code.ToLower().Contains(search));

                    var rows = await q.OrderBy(b => b.Name)
                        .Take(limit)
                        .Select(b => new { b.Id, b.Name, b.Code, b.Description })
                        .ToListAsync(ct);

                    items = rows.Select(b => new LookupItemDto
                    {
                        Id = b.Id.ToString(),
                        Name = b.Name,
                        Code = b.Code,
                        Description = b.Description,
                        Category = "Organization"
                    }).ToList();
                    break;
                }

                // ── HRMS ──────────────────────────────────────────────────────
                case "employees":
                case "employee":
                {
                    var q = _db.Employees.AsNoTracking().Where(e => e.TenantId == TenantId && !e.IsDeleted);
                    if (query.CompanyId.HasValue && query.CompanyId.Value != Guid.Empty)
                        q = q.Where(e => e.CompanyId == query.CompanyId.Value);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(e => (e.FullName != null && e.FullName.ToLower().Contains(search)) ||
                                         (e.EmployeeCode != null && e.EmployeeCode.ToLower().Contains(search)) ||
                                         (e.WorkEmail != null && e.WorkEmail.ToLower().Contains(search)));

                    var rows = await q.OrderBy(e => e.FullName)
                        .Take(limit)
                        .Select(e => new
                        {
                            e.Id,
                            FullName = e.FullName ?? "Unnamed Employee",
                            e.EmployeeCode,
                            e.Status,
                            e.DepartmentId,
                            e.DesignationId,
                            e.WorkEmail
                        })
                        .ToListAsync(ct);

                    items = rows.Select(e => new LookupItemDto
                    {
                        Id = e.Id.ToString(),
                        Name = e.FullName,
                        Code = e.EmployeeCode,
                        Description = e.WorkEmail,
                        Category = "HRMS",
                        Metadata = new Dictionary<string, object?>
                        {
                            ["status"] = e.Status,
                            ["departmentId"] = e.DepartmentId,
                            ["designationId"] = e.DesignationId,
                            ["workEmail"] = e.WorkEmail
                        }
                    }).ToList();
                    break;
                }

                case "roles":
                case "role":
                {
                    var q = _db.Roles.AsNoTracking().Where(r => r.TenantId == TenantId && !r.IsDeleted);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(r => r.Name.ToLower().Contains(search));

                    var rows = await q.OrderBy(r => r.Name)
                        .Take(limit)
                        .Select(r => new { r.Id, r.Name, r.Description })
                        .ToListAsync(ct);

                    items = rows.Select(r => new LookupItemDto
                    {
                        Id = r.Id.ToString(),
                        Name = r.Name,
                        Code = r.Name,
                        Description = r.Description,
                        Category = "Security"
                    }).ToList();
                    break;
                }

                // ── Finance & Procurement ─────────────────────────────────────
                case "vendors":
                case "vendor":
                {
                    var q = _db.Vendors.AsNoTracking().Where(v => v.TenantId == TenantId && !v.IsDeleted);
                    if (query.CompanyId.HasValue && query.CompanyId.Value != Guid.Empty)
                        q = q.Where(v => v.CompanyId == query.CompanyId.Value);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(v => v.VendorName.ToLower().Contains(search) || v.VendorCode.ToLower().Contains(search));

                    var rows = await q.OrderBy(v => v.VendorName)
                        .Take(limit)
                        .Select(v => new { v.Id, v.VendorName, v.VendorCode, v.VendorType, v.GSTNumber, v.Email, v.PaymentTerms })
                        .ToListAsync(ct);

                    items = rows.Select(v => new LookupItemDto
                    {
                        Id = v.Id.ToString(),
                        Name = v.VendorName,
                        Code = v.VendorCode,
                        Description = v.VendorType,
                        Category = "Procurement",
                        Metadata = new Dictionary<string, object?>
                        {
                            ["gstin"] = v.GSTNumber,
                            ["email"] = v.Email,
                            ["paymentTerms"] = v.PaymentTerms
                        }
                    }).ToList();
                    break;
                }

                case "customers":
                case "customer":
                {
                    var q = _db.Customers.AsNoTracking().Where(c => c.TenantId == TenantId && !c.IsDeleted);
                    if (query.CompanyId.HasValue && query.CompanyId.Value != Guid.Empty)
                        q = q.Where(c => c.CompanyId == query.CompanyId.Value);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(c => c.CustomerName.ToLower().Contains(search) || c.CustomerCode.ToLower().Contains(search));

                    var rows = await q.OrderBy(c => c.CustomerName)
                        .Take(limit)
                        .Select(c => new { c.Id, c.CustomerName, c.CustomerCode, c.CustomerType, c.GSTNumber, c.Email })
                        .ToListAsync(ct);

                    items = rows.Select(c => new LookupItemDto
                    {
                        Id = c.Id.ToString(),
                        Name = c.CustomerName,
                        Code = c.CustomerCode,
                        Description = c.CustomerType,
                        Category = "Sales",
                        Metadata = new Dictionary<string, object?>
                        {
                            ["gstin"] = c.GSTNumber,
                            ["email"] = c.Email
                        }
                    }).ToList();
                    break;
                }

                case "accounts":
                case "chart-of-accounts":
                case "coa":
                {
                    var q = _db.ChartOfAccounts.AsNoTracking().Where(a => a.TenantId == TenantId && !a.IsDeleted && a.IsActive);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(a => a.AccountName.ToLower().Contains(search) || a.AccountCode.ToLower().Contains(search));

                    var rows = await q.OrderBy(a => a.AccountCode)
                        .Take(limit)
                        .Select(a => new { a.Id, a.AccountName, a.AccountCode, a.AccountType, a.SubType, a.IsGroup })
                        .ToListAsync(ct);

                    items = rows.Select(a => new LookupItemDto
                    {
                        Id = a.Id.ToString(),
                        Name = $"{a.AccountCode} - {a.AccountName}",
                        Code = a.AccountCode,
                        Description = a.AccountType,
                        Category = "Finance",
                        Metadata = new Dictionary<string, object?>
                        {
                            ["accountType"] = a.AccountType,
                            ["subType"] = a.SubType,
                            ["isGroup"] = a.IsGroup
                        }
                    }).ToList();
                    break;
                }

                // ── Inventory & Operations ────────────────────────────────────
                case "items":
                case "products":
                case "item":
                {
                    var q = _db.Items.AsNoTracking().Where(i => i.TenantId == TenantId && !i.IsDeleted && i.IsActive);
                    if (query.CompanyId.HasValue && query.CompanyId.Value != Guid.Empty)
                        q = q.Where(i => i.CompanyId == query.CompanyId.Value);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(i => i.ItemName.ToLower().Contains(search) || i.ItemCode.ToLower().Contains(search));

                    var rows = await q.OrderBy(i => i.ItemName)
                        .Take(limit)
                        .Select(i => new { i.Id, i.ItemName, i.ItemCode, i.Description, i.UnitOfMeasure, i.SellingPrice, i.TaxRate, i.Category })
                        .ToListAsync(ct);

                    items = rows.Select(i => new LookupItemDto
                    {
                        Id = i.Id.ToString(),
                        Name = i.ItemName,
                        Code = i.ItemCode,
                        Description = i.Description,
                        Category = "Inventory",
                        Metadata = new Dictionary<string, object?>
                        {
                            ["uom"] = i.UnitOfMeasure,
                            ["price"] = i.SellingPrice,
                            ["taxRate"] = i.TaxRate,
                            ["category"] = i.Category
                        }
                    }).ToList();
                    break;
                }

                case "warehouses":
                case "warehouse":
                {
                    var q = _db.Warehouses.AsNoTracking().Where(w => w.TenantId == TenantId && !w.IsDeleted && w.IsActive);
                    if (query.CompanyId.HasValue && query.CompanyId.Value != Guid.Empty)
                        q = q.Where(w => w.CompanyId == query.CompanyId.Value);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(w => w.WarehouseName.ToLower().Contains(search) || w.WarehouseCode.ToLower().Contains(search));

                    var rows = await q.OrderBy(w => w.WarehouseName)
                        .Take(limit)
                        .Select(w => new { w.Id, w.WarehouseName, w.WarehouseCode, w.City, w.IsDefault })
                        .ToListAsync(ct);

                    items = rows.Select(w => new LookupItemDto
                    {
                        Id = w.Id.ToString(),
                        Name = w.WarehouseName,
                        Code = w.WarehouseCode,
                        Description = w.City,
                        Category = "Inventory",
                        Metadata = new Dictionary<string, object?> { ["isDefault"] = w.IsDefault }
                    }).ToList();
                    break;
                }

                case "projects":
                case "project":
                {
                    var q = _db.Projects.AsNoTracking().Where(p => p.TenantId == TenantId && !p.IsDeleted && p.IsActive);
                    if (query.CompanyId.HasValue && query.CompanyId.Value != Guid.Empty)
                        q = q.Where(p => p.CompanyId == query.CompanyId.Value);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(p => p.Name.ToLower().Contains(search) || p.ProjectCode.ToLower().Contains(search));

                    var rows = await q.OrderBy(p => p.Name)
                        .Take(limit)
                        .Select(p => new { p.Id, p.Name, p.ProjectCode, p.Status, p.Priority })
                        .ToListAsync(ct);

                    items = rows.Select(p => new LookupItemDto
                    {
                        Id = p.Id.ToString(),
                        Name = p.Name,
                        Code = p.ProjectCode,
                        Description = p.Status,
                        Category = "Projects",
                        Metadata = new Dictionary<string, object?> { ["status"] = p.Status, ["priority"] = p.Priority }
                    }).ToList();
                    break;
                }

                // ── Geography ─────────────────────────────────────────────────
                case "countries":
                case "country":
                {
                    var q = _db.GeoCountries.AsNoTracking().Where(c => !c.IsDeleted && c.IsActive);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(c => c.Name.ToLower().Contains(search) || c.Code.ToLower().Contains(search));

                    var rows = await q.OrderBy(c => c.Name)
                        .Take(limit)
                        .Select(c => new { c.Id, c.Name, c.Code, c.CurrencyCode, c.Iso2Code, c.PhoneCode })
                        .ToListAsync(ct);

                    items = rows.Select(c => new LookupItemDto
                    {
                        Id = c.Id.ToString(),
                        Name = c.Name,
                        Code = c.Code,
                        Description = c.CurrencyCode,
                        Category = "Geography",
                        Metadata = new Dictionary<string, object?> { ["iso2"] = c.Iso2Code, ["phoneCode"] = c.PhoneCode }
                    }).ToList();
                    break;
                }

                case "states":
                case "state":
                {
                    var q = _db.GeoStates.AsNoTracking().Where(s => !s.IsDeleted && s.IsActive);
                    if (query.ParentId.HasValue && query.ParentId.Value != Guid.Empty)
                        q = q.Where(s => s.CountryId == query.ParentId.Value);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(s => s.Name.ToLower().Contains(search) || s.StateCode.ToLower().Contains(search));

                    var rows = await q.OrderBy(s => s.Name)
                        .Take(limit)
                        .Select(s => new { s.Id, s.Name, s.StateCode, s.CapitalCity, s.CountryId })
                        .ToListAsync(ct);

                    items = rows.Select(s => new LookupItemDto
                    {
                        Id = s.Id.ToString(),
                        Name = s.Name,
                        Code = s.StateCode,
                        Description = s.CapitalCity,
                        Category = "Geography",
                        Metadata = new Dictionary<string, object?> { ["countryId"] = s.CountryId }
                    }).ToList();
                    break;
                }

                case "cities":
                case "city":
                {
                    var q = _db.GeoCities.AsNoTracking().Where(c => !c.IsDeleted && c.IsActive);
                    if (query.ParentId.HasValue && query.ParentId.Value != Guid.Empty)
                        q = q.Where(c => c.DistrictId == query.ParentId.Value);
                    if (!string.IsNullOrEmpty(search))
                        q = q.Where(c => c.Name.ToLower().Contains(search));

                    var rows = await q.OrderBy(c => c.Name)
                        .Take(limit)
                        .Select(c => new { c.Id, c.Name, c.PostalCode })
                        .ToListAsync(ct);

                    items = rows.Select(c => new LookupItemDto
                    {
                        Id = c.Id.ToString(),
                        Name = c.Name,
                        Code = c.PostalCode,
                        Description = c.PostalCode,
                        Category = "Geography"
                    }).ToList();
                    break;
                }

                // ── System Enums & Presets ────────────────────────────────────
                case "employment-types":
                case "employmenttypes":
                    items = GetStaticLookupItems(new[]
                    {
                        ("Permanent", "Permanent Full-Time", "Full regular employment with statutory benefits"),
                        ("Contract", "Fixed-Term Contract", "Term agreement under specified deliverables"),
                        ("PartTime", "Part-Time", "Reduced weekly working hour arrangement"),
                        ("Intern", "Internship / Trainee", "Apprentice or structured learning tenure"),
                        ("Consultant", "Retainer / Consultant", "Independent advisory contract"),
                        ("Probationary", "Probationary", "Initial trial evaluation period")
                    }, search);
                    break;

                case "currencies":
                case "currency":
                    items = GetStaticLookupItems(new[]
                    {
                        ("INR", "INR - Indian Rupee (₹)", "Domestic official currency"),
                        ("USD", "USD - US Dollar ($)", "US Federal currency"),
                        ("EUR", "EUR - Euro (€)", "European monetary unit"),
                        ("GBP", "GBP - British Pound (£)", "UK Pound Sterling"),
                        ("AED", "AED - UAE Dirham (د.إ)", "United Arab Emirates Dirham"),
                        ("SGD", "SGD - Singapore Dollar (S$)", "Singapore Dollar"),
                        ("CAD", "CAD - Canadian Dollar (C$)", "Canadian Dollar"),
                        ("AUD", "AUD - Australian Dollar (A$)", "Australian Dollar"),
                        ("JPY", "JPY - Japanese Yen (¥)", "Japanese Yen")
                    }, search);
                    break;

                case "payment-modes":
                case "payment-methods":
                case "paymentmodes":
                    items = GetStaticLookupItems(new[]
                    {
                        ("BankTransfer", "Bank Transfer (NEFT/RTGS/IMPS)", "Direct electronic fund remittance"),
                        ("UPI", "UPI Instant Payment", "NPCI Unified Payments Interface"),
                        ("Cheque", "Cheque / Demand Draft", "Instrument with bank clearing cycle"),
                        ("Cash", "Cash / Petty Cash", "Physical cash voucher transaction"),
                        ("CreditCard", "Corporate Credit Card", "Card authorized settlement"),
                        ("LetterOfCredit", "Letter of Credit (LC)", "Commercial trade finance instrument")
                    }, search);
                    break;

                case "statuses":
                case "status":
                    items = GetStaticLookupItems(new[]
                    {
                        ("Draft", "Draft", "Saved draft, pending submission"),
                        ("Submitted", "Submitted", "Submitted for processing/approval"),
                        ("Pending", "Pending Review", "Awaiting review or authorization"),
                        ("Approved", "Approved", "Authorized and certified"),
                        ("Active", "Active", "Operational and valid"),
                        ("Completed", "Completed", "Successfully finalized"),
                        ("Rejected", "Rejected", "Declined or denied"),
                        ("Cancelled", "Cancelled", "Aborted or rescinded"),
                        ("Inactive", "Inactive", "Deactivated / archived")
                    }, search);
                    break;

                case "priorities":
                case "priority":
                    items = GetStaticLookupItems(new[]
                    {
                        ("Low", "Low Priority", "Routine SLA, non-blocking"),
                        ("Medium", "Medium Priority", "Standard workflow turnaround"),
                        ("High", "High Priority", "Elevated attention requested"),
                        ("Urgent", "Urgent Priority", "Critical blocker, immediate dispatch"),
                        ("Critical", "Critical Severity", "Systemic operational risk")
                    }, search);
                    break;

                case "tax-slabs":
                case "taxslabs":
                case "gst-rates":
                    items = GetStaticLookupItems(new[]
                    {
                        ("0", "GST 0% (Nil Rated)", "0% rate bracket"),
                        ("5", "GST 5%", "5% standard tier (2.5% CGST + 2.5% SGST)"),
                        ("12", "GST 12%", "12% standard tier (6% CGST + 6% SGST)"),
                        ("18", "GST 18%", "18% standard tier (9% CGST + 9% SGST)"),
                        ("28", "GST 28%", "28% luxury tier (14% CGST + 14% SGST)"),
                        ("Exempt", "Exempt", "Statutorily exempt supply")
                    }, search);
                    break;

                case "document-types":
                case "documenttypes":
                    items = GetStaticLookupItems(new[]
                    {
                        ("Aadhaar", "Aadhaar Card", "UIDAI 12-digit identity proof"),
                        ("PAN", "PAN Card", "Income Tax 10-digit alphanumeric card"),
                        ("Passport", "Passport", "International travel document"),
                        ("DrivingLicense", "Driving License", "State RTO vehicular license"),
                        ("VoterId", "Voter ID Card", "Election Commission identity card"),
                        ("Form16", "Form 16 / Tax Statement", "Annual TDS deduction certificate"),
                        ("SalarySlip", "Recent Payslip", "Previous employment remuneration voucher"),
                        ("RelievingLetter", "Relieving Letter", "Formal employment separation certificate"),
                        ("DegreeCertificate", "Degree Certificate", "Educational qualification credential"),
                        ("GstCertificate", "GST Registration Certificate", "Form GST REG-06"),
                        ("BankStatement", "Bank Statement / Cancelled Cheque", "Proof of account details & IFSC")
                    }, search);
                    break;

                case "marital-statuses":
                    items = GetStaticLookupItems(new[]
                    {
                        ("Single", "Single", "Unmarried"),
                        ("Married", "Married", "Lawfully married"),
                        ("Divorced", "Divorced", "Separated by decree"),
                        ("Widowed", "Widowed", "Surviving spouse")
                    }, search);
                    break;

                case "blood-groups":
                    items = GetStaticLookupItems(new[]
                    {
                        ("A+", "A Positive (A+)", "A Rh-positive"),
                        ("A-", "A Negative (A-)", "A Rh-negative"),
                        ("B+", "B Positive (B+)", "B Rh-positive"),
                        ("B-", "B Negative (B-)", "B Rh-negative"),
                        ("AB+", "AB Positive (AB+)", "AB Rh-positive universal recipient"),
                        ("AB-", "AB Negative (AB-)", "AB Rh-negative"),
                        ("O+", "O Positive (O+)", "O Rh-positive"),
                        ("O-", "O Negative (O-)", "O Rh-negative universal donor")
                    }, search);
                    break;

                case "genders":
                    items = GetStaticLookupItems(new[]
                    {
                        ("Male", "Male", "Male"),
                        ("Female", "Female", "Female"),
                        ("Other", "Other", "Non-binary / Third gender"),
                        ("PreferNotToSay", "Prefer Not to Say", "Confidential")
                    }, search);
                    break;

                default:
                    items = new List<LookupItemDto>();
                    break;
            }

            return new LookupResultDto
            {
                Type = lookupType ?? string.Empty,
                Items = items,
                Total = items.Count
            };
        }

        public async Task<Dictionary<string, List<LookupItemDto>>> GetBatchLookupsAsync(IEnumerable<string> lookupTypes, Guid? companyId = null, CancellationToken ct = default)
        {
            var result = new Dictionary<string, List<LookupItemDto>>(StringComparer.OrdinalIgnoreCase);
            var query = new LookupQuery { CompanyId = companyId, Limit = 200 };

            foreach (var type in lookupTypes.Where(t => !string.IsNullOrWhiteSpace(t)).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var lookup = await GetLookupItemsAsync(type, query, ct);
                result[type] = lookup.Items;
            }

            return result;
        }

        private static List<LookupItemDto> GetStaticLookupItems((string code, string name, string desc)[] definitions, string? search)
        {
            var query = definitions.AsEnumerable();
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(d => d.code.ToLower().Contains(search) || d.name.ToLower().Contains(search));
            }

            return query.Select(d => new LookupItemDto
            {
                Id = d.code,
                Name = d.name,
                Code = d.code,
                Description = d.desc,
                Category = "StandardEnum"
            }).ToList();
        }
    }
}
