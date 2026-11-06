using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class ChartOfAccountsTemplateService : IChartOfAccountsTemplateService
    {
        private readonly ApplicationDbContext _db;

        public ChartOfAccountsTemplateService(ApplicationDbContext db)
        {
            _db = db;
        }

        private record CoaSeedItem(string Code, string Name, string Type, string SubType, bool IsGroup, int Level, string? ParentCode = null);

        public IReadOnlyList<CoaTemplateSummary> GetAvailableTemplates()
        {
            return new List<CoaTemplateSummary>
            {
                new() { Code = "IFRS", Name = "International Financial Reporting Standards (IFRS)", Description = "Standard global 4-digit hierarchy compliant with IASB / IFRS standards.", DefaultCurrency = "USD", TotalAccountsCount = 28 },
                new() { Code = "US_GAAP", Name = "US GAAP Standard Chart of Accounts", Description = "5-digit commercial hierarchy conforming to FASB / US GAAP accounting.", DefaultCurrency = "USD", TotalAccountsCount = 30 },
                new() { Code = "IND_AS", Name = "India Ind AS (Schedule III MCA)", Description = "Hierarchical standard aligned with Ministry of Corporate Affairs Schedule III.", DefaultCurrency = "INR", TotalAccountsCount = 32 },
                new() { Code = "UK_GAAP", Name = "UK GAAP (FRS 102)", Description = "UK Financial Reporting Standard 102 balance sheet and profit & loss layout.", DefaultCurrency = "GBP", TotalAccountsCount = 26 }
            };
        }

        public async Task<int> SeedStandardChartOfAccountsAsync(Guid tenantId, Guid? companyId, string standardType, string? defaultCurrency = null, CancellationToken ct = default)
        {
            var standard = (standardType ?? "IFRS").Trim().ToUpperInvariant();
            var currency = string.IsNullOrWhiteSpace(defaultCurrency) ? (standard == "IND_AS" ? "INR" : standard == "UK_GAAP" ? "GBP" : "USD") : defaultCurrency.Trim().ToUpperInvariant();

            var template = GetTemplateDefinitions(standard);
            var existingCodes = await _db.ChartOfAccounts.IgnoreQueryFilters()
                .Where(a => a.TenantId == tenantId && !a.IsDeleted)
                .Select(a => a.AccountCode)
                .ToHashSetAsync(ct);

            var createdCount = 0;
            var codeToAccountMap = new Dictionary<string, ChartOfAccount>();

            // First pass: create parent group accounts
            foreach (var item in template.Where(t => t.IsGroup))
            {
                if (existingCodes.Contains(item.Code)) continue;

                var account = new ChartOfAccount
                {
                    TenantId = tenantId,
                    AccountCode = item.Code,
                    AccountName = item.Name,
                    AccountType = item.Type,
                    SubType = item.SubType,
                    IsGroup = true,
                    Level = item.Level,
                    Currency = currency,
                    IsActive = true,
                    OpeningBalance = 0,
                    CurrentBalance = 0
                };

                _db.ChartOfAccounts.Add(account);
                codeToAccountMap[item.Code] = account;
                existingCodes.Add(item.Code);
                createdCount++;
            }

            await _db.SaveChangesAsync(ct);

            // Second pass: create child ledger accounts with parent links
            foreach (var item in template.Where(t => !t.IsGroup))
            {
                if (existingCodes.Contains(item.Code)) continue;

                Guid? parentId = null;
                if (!string.IsNullOrEmpty(item.ParentCode) && codeToAccountMap.TryGetValue(item.ParentCode, out var parentAccount))
                {
                    parentId = parentAccount.Id;
                }

                var account = new ChartOfAccount
                {
                    TenantId = tenantId,
                    AccountCode = item.Code,
                    AccountName = item.Name,
                    AccountType = item.Type,
                    SubType = item.SubType,
                    ParentAccountId = parentId,
                    IsGroup = false,
                    Level = item.Level,
                    Currency = currency,
                    IsActive = true,
                    OpeningBalance = 0,
                    CurrentBalance = 0
                };

                _db.ChartOfAccounts.Add(account);
                existingCodes.Add(item.Code);
                createdCount++;
            }

            await _db.SaveChangesAsync(ct);
            return createdCount;
        }

        private static List<CoaSeedItem> GetTemplateDefinitions(string standard)
        {
            return standard switch
            {
                "US_GAAP" => GetUsGaapDefinitions(),
                "IND_AS" => GetIndAsDefinitions(),
                "UK_GAAP" => GetUkGaapDefinitions(),
                _ => GetIfrsDefinitions()
            };
        }

        private static List<CoaSeedItem> GetIfrsDefinitions() => new()
        {
            // Groups
            new("1000", "Assets", "Asset", "Group", true, 1),
            new("1100", "Current Assets", "Asset", "Current Asset", true, 2, "1000"),
            new("1200", "Non-Current Assets", "Asset", "Non-Current Asset", true, 2, "1000"),
            new("2000", "Liabilities", "Liability", "Group", true, 1),
            new("2100", "Current Liabilities", "Liability", "Current Liability", true, 2, "2000"),
            new("2200", "Non-Current Liabilities", "Liability", "Non-Current Liability", true, 2, "2000"),
            new("3000", "Equity", "Equity", "Group", true, 1),
            new("4000", "Revenue", "Revenue", "Group", true, 1),
            new("5000", "Cost of Sales", "Expense", "Group", true, 1),
            new("6000", "Operating Expenses", "Expense", "Group", true, 1),

            // Ledgers
            new("1110", "Cash and Cash Equivalents", "Asset", "Current Asset", false, 3, "1100"),
            new("1120", "Trade Receivables", "Asset", "Current Asset", false, 3, "1100"),
            new("1130", "Inventories", "Asset", "Current Asset", false, 3, "1100"),
            new("1140", "Prepayments and Other Receivables", "Asset", "Current Asset", false, 3, "1100"),
            new("1210", "Property, Plant and Equipment (PPE)", "Asset", "Fixed Asset", false, 3, "1200"),
            new("1220", "Intangible Assets", "Asset", "Non-Current Asset", false, 3, "1200"),
            new("1230", "Accumulated Depreciation", "Asset", "Fixed Asset", false, 3, "1200"),
            new("2110", "Trade Payables", "Liability", "Current Liability", false, 3, "2100"),
            new("2120", "Short-term Borrowings", "Liability", "Current Liability", false, 3, "2100"),
            new("2130", "Accrued Expenses & Provisions", "Liability", "Current Liability", false, 3, "2100"),
            new("2140", "Statutory Taxes Payable", "Liability", "Current Liability", false, 3, "2100"),
            new("2210", "Long-term Borrowings", "Liability", "Non-Current Liability", false, 3, "2200"),
            new("3100", "Share Capital", "Equity", "Share Capital", false, 2, "3000"),
            new("3200", "Retained Earnings", "Equity", "Retained Earnings", false, 2, "3000"),
            new("4100", "Sales Revenue", "Revenue", "Operating Revenue", false, 2, "4000"),
            new("4200", "Service Revenue", "Revenue", "Operating Revenue", false, 2, "4000"),
            new("4300", "Other Income", "Revenue", "Other Income", false, 2, "4000"),
            new("5100", "Cost of Goods Sold (COGS)", "Expense", "Direct Expense", false, 2, "5000"),
            new("6100", "Salaries and Employee Benefits", "Expense", "Operating Expense", false, 2, "6000"),
            new("6200", "Rent and Facilities Expense", "Expense", "Operating Expense", false, 2, "6000"),
            new("6300", "Depreciation and Amortization", "Expense", "Operating Expense", false, 2, "6000"),
            new("6400", "General and Administrative Expense", "Expense", "Operating Expense", false, 2, "6000"),
            new("6500", "Marketing and Sales Expense", "Expense", "Operating Expense", false, 2, "6000")
        };

        private static List<CoaSeedItem> GetUsGaapDefinitions() => new()
        {
            new("10000", "Assets", "Asset", "Group", true, 1),
            new("11000", "Current Assets", "Asset", "Current Asset", true, 2, "10000"),
            new("11100", "Operating Cash Account", "Asset", "Current Asset", false, 3, "11000"),
            new("11200", "Accounts Receivable (A/R)", "Asset", "Current Asset", false, 3, "11000"),
            new("11300", "Allowance for Doubtful Accounts", "Asset", "Current Asset", false, 3, "11000"),
            new("11400", "Inventory Asset", "Asset", "Current Asset", false, 3, "11000"),
            new("15000", "Property, Plant & Equipment", "Asset", "Fixed Asset", true, 2, "10000"),
            new("15100", "Machinery and Equipment", "Asset", "Fixed Asset", false, 3, "15000"),
            new("15200", "Accumulated Depreciation - Equipment", "Asset", "Fixed Asset", false, 3, "15000"),
            new("20000", "Liabilities", "Liability", "Group", true, 1),
            new("21000", "Accounts Payable (A/P)", "Liability", "Current Liability", false, 2, "20000"),
            new("22000", "Accrued Payroll & Taxes", "Liability", "Current Liability", false, 2, "20000"),
            new("25000", "Long-Term Notes Payable", "Liability", "Long-Term Liability", false, 2, "20000"),
            new("30000", "Stockholders Equity", "Equity", "Group", true, 1),
            new("31000", "Common Stock", "Equity", "Equity", false, 2, "30000"),
            new("32000", "Additional Paid-In Capital", "Equity", "Equity", false, 2, "30000"),
            new("33000", "Retained Earnings", "Equity", "Equity", false, 2, "30000"),
            new("40000", "Operating Revenue", "Revenue", "Group", true, 1),
            new("41000", "Product Sales", "Revenue", "Revenue", false, 2, "40000"),
            new("42000", "Consulting & Service Income", "Revenue", "Revenue", false, 2, "40000"),
            new("50000", "Cost of Goods Sold", "Expense", "COGS", false, 1),
            new("60000", "Operating Expenses", "Expense", "Group", true, 1),
            new("61000", "Payroll & Wage Expense", "Expense", "Operating Expense", false, 2, "60000"),
            new("62000", "Rent Expense", "Expense", "Operating Expense", false, 2, "60000"),
            new("63000", "Professional Legal & Accounting", "Expense", "Operating Expense", false, 2, "60000"),
            new("64000", "Software & IT Subscriptions", "Expense", "Operating Expense", false, 2, "60000")
        };

        private static List<CoaSeedItem> GetIndAsDefinitions() => new()
        {
            new("1000", "Non-Current Assets", "Asset", "Group", true, 1),
            new("1010", "Property, Plant and Equipment", "Asset", "Fixed Asset", false, 2, "1000"),
            new("1020", "Capital Work-in-Progress", "Asset", "Fixed Asset", false, 2, "1000"),
            new("1100", "Current Assets", "Asset", "Group", true, 1),
            new("1110", "Inventories", "Asset", "Current Asset", false, 2, "1100"),
            new("1120", "Trade Receivables", "Asset", "Current Asset", false, 2, "1100"),
            new("1130", "Cash and Bank Balances", "Asset", "Current Asset", false, 2, "1100"),
            new("1140", "GST Input Tax Credit (ITC)", "Asset", "Current Asset", false, 2, "1100"),
            new("2000", "Equity", "Equity", "Group", true, 1),
            new("2010", "Equity Share Capital", "Equity", "Share Capital", false, 2, "2000"),
            new("2020", "Other Equity & Reserves", "Equity", "Reserves", false, 2, "2000"),
            new("2100", "Non-Current Liabilities", "Liability", "Group", true, 1),
            new("2110", "Long-Term Borrowings", "Liability", "Long-Term Liability", false, 2, "2100"),
            new("2200", "Current Liabilities", "Liability", "Group", true, 1),
            new("2210", "Trade Payables (MSME & Others)", "Liability", "Current Liability", false, 2, "2200"),
            new("2220", "GST Output Tax Liability", "Liability", "Current Liability", false, 2, "2200"),
            new("2230", "TDS and Statutory Payables", "Liability", "Current Liability", false, 2, "2200"),
            new("3000", "Revenue from Operations", "Revenue", "Operating Revenue", false, 1),
            new("3100", "Other Income", "Revenue", "Other Income", false, 1),
            new("4000", "Cost of Materials Consumed", "Expense", "Direct Expense", false, 1),
            new("4100", "Employee Benefit Expense", "Expense", "Operating Expense", false, 1),
            new("4200", "Finance Costs", "Expense", "Finance Cost", false, 1),
            new("4300", "Depreciation and Amortization Expense", "Expense", "Operating Expense", false, 1),
            new("4400", "Other Expenses", "Expense", "Operating Expense", false, 1)
        };

        private static List<CoaSeedItem> GetUkGaapDefinitions() => new()
        {
            new("1000", "Fixed Assets", "Asset", "Fixed Asset", true, 1),
            new("1010", "Tangible Assets", "Asset", "Fixed Asset", false, 2, "1000"),
            new("1100", "Current Assets", "Asset", "Current Asset", true, 1),
            new("1110", "Stocks / Inventory", "Asset", "Current Asset", false, 2, "1100"),
            new("1120", "Debtors / Trade Debtors", "Asset", "Current Asset", false, 2, "1100"),
            new("1130", "Cash at Bank and in Hand", "Asset", "Current Asset", false, 2, "1100"),
            new("1140", "VAT Input Reclaimable", "Asset", "Current Asset", false, 2, "1100"),
            new("2000", "Creditors: Amounts Falling Due Within One Year", "Liability", "Current Liability", true, 1),
            new("2010", "Trade Creditors", "Liability", "Current Liability", false, 2, "2000"),
            new("2020", "VAT Output Liability (HMRC)", "Liability", "Current Liability", false, 2, "2000"),
            new("2030", "PAYE / NIC Payable", "Liability", "Current Liability", false, 2, "2000"),
            new("2100", "Creditors: Amounts Falling Due After More Than One Year", "Liability", "Long-Term Liability", false, 1),
            new("3000", "Capital and Reserves", "Equity", "Equity", true, 1),
            new("3010", "Called Up Share Capital", "Equity", "Equity", false, 2, "3000"),
            new("3020", "Profit and Loss Account", "Equity", "Equity", false, 2, "3000"),
            new("4000", "Turnover / Sales", "Revenue", "Revenue", false, 1),
            new("5000", "Cost of Sales", "Expense", "Direct Expense", false, 1),
            new("6000", "Administrative Expenses", "Expense", "Operating Expense", false, 1)
        };
    }
}
