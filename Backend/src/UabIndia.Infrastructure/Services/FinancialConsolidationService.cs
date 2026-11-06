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
    public class FinancialConsolidationService : IFinancialConsolidationService
    {
        private readonly ApplicationDbContext _db;
        private readonly ICurrencyExchangeService _currencyService;

        public FinancialConsolidationService(ApplicationDbContext db, ICurrencyExchangeService currencyService)
        {
            _db = db;
            _currencyService = currencyService;
        }

        public async Task<ConsolidatedBalanceSheetResult> GenerateConsolidatedBalanceSheetAsync(
            Guid tenantId,
            Guid? parentCompanyId,
            DateTime asOfDate,
            string targetCurrency = "USD",
            CancellationToken ct = default)
        {
            var target = string.IsNullOrWhiteSpace(targetCurrency) ? "USD" : targetCurrency.Trim().ToUpperInvariant();

            var companiesQuery = _db.Companies.IgnoreQueryFilters()
                .Where(c => c.TenantId == tenantId && !c.IsDeleted && c.IsActive);

            if (parentCompanyId.HasValue && parentCompanyId.Value != Guid.Empty)
            {
                companiesQuery = companiesQuery.Where(c => c.Id == parentCompanyId.Value || c.ParentCompanyId == parentCompanyId.Value);
            }

            var companies = await companiesQuery.ToListAsync(ct);
            var result = new ConsolidatedBalanceSheetResult
            {
                AsOfDate = asOfDate,
                TargetCurrency = target
            };

            decimal totalAssets = 0;
            decimal totalLiabilities = 0;
            decimal totalEquity = 0;

            foreach (var company in companies)
            {
                var companyCurrency = string.IsNullOrWhiteSpace(company.FunctionalCurrencyCode) ? "USD" : company.FunctionalCurrencyCode;
                var rate = await _currencyService.GetExchangeRateAsync(companyCurrency, target, asOfDate, ct);

                // Fetch accounts for this company or shared accounts
                var accounts = await _db.ChartOfAccounts.IgnoreQueryFilters()
                    .Where(a => a.TenantId == tenantId && !a.IsDeleted && a.IsActive && !a.IsGroup)
                    .ToListAsync(ct);

                var assets = accounts.Where(a => a.AccountType == "Asset").Sum(a => a.CurrentBalance);
                var liabilities = accounts.Where(a => a.AccountType == "Liability").Sum(a => a.CurrentBalance);
                var equity = accounts.Where(a => a.AccountType == "Equity").Sum(a => a.CurrentBalance);

                var convertedAssets = Math.Round(assets * rate, 2);
                var convertedLiabilities = Math.Round(liabilities * rate, 2);
                var convertedEquity = Math.Round(equity * rate, 2);

                result.EntityContributions.Add(new ConsolidatedEntityBalance
                {
                    CompanyId = company.Id,
                    CompanyName = company.Name ?? "Entity",
                    FunctionalCurrency = companyCurrency,
                    ConvertedAssets = convertedAssets,
                    ConvertedLiabilities = convertedLiabilities,
                    ConvertedEquity = convertedEquity
                });

                totalAssets += convertedAssets;
                totalLiabilities += convertedLiabilities;
                totalEquity += convertedEquity;
            }

            // Intercompany eliminations (mutual balances between corporate subsidiaries)
            var intercompanyEntries = await _db.JournalEntries.IgnoreQueryFilters()
                .Where(j => j.TenantId == tenantId && !j.IsDeleted && j.Status == "Posted" &&
                            (j.EntryType == "Intercompany" || (j.Narration != null && j.Narration.Contains("Intercompany")) || (j.Description != null && j.Description.Contains("Intercompany"))))
                .Include(j => j.Lines)
                .ToListAsync(ct);

            decimal intercompanyEliminations = 0;
            foreach (var entry in intercompanyEntries)
            {
                intercompanyEliminations += entry.Lines.Sum(l => l.DebitAmount);
            }

            result.InterCompanyEliminationsTotal = intercompanyEliminations;
            result.TotalConsolidatedAssets = Math.Max(0, totalAssets - intercompanyEliminations);
            result.TotalConsolidatedLiabilities = Math.Max(0, totalLiabilities - intercompanyEliminations);
            result.TotalConsolidatedEquity = totalEquity;

            return result;
        }

        public async Task<ConsolidatedIncomeStatementResult> GenerateConsolidatedIncomeStatementAsync(
            Guid tenantId,
            Guid? parentCompanyId,
            DateTime fromDate,
            DateTime toDate,
            string targetCurrency = "USD",
            CancellationToken ct = default)
        {
            var target = string.IsNullOrWhiteSpace(targetCurrency) ? "USD" : targetCurrency.Trim().ToUpperInvariant();

            var companiesQuery = _db.Companies.IgnoreQueryFilters()
                .Where(c => c.TenantId == tenantId && !c.IsDeleted && c.IsActive);

            if (parentCompanyId.HasValue && parentCompanyId.Value != Guid.Empty)
            {
                companiesQuery = companiesQuery.Where(c => c.Id == parentCompanyId.Value || c.ParentCompanyId == parentCompanyId.Value);
            }

            var companies = await companiesQuery.ToListAsync(ct);
            var result = new ConsolidatedIncomeStatementResult
            {
                FromDate = fromDate,
                ToDate = toDate,
                TargetCurrency = target
            };

            decimal totalRevenue = 0;
            decimal totalExpenses = 0;

            foreach (var company in companies)
            {
                var companyCurrency = string.IsNullOrWhiteSpace(company.FunctionalCurrencyCode) ? "USD" : company.FunctionalCurrencyCode;
                var rate = await _currencyService.GetExchangeRateAsync(companyCurrency, target, toDate, ct);

                var invoicesSum = await _db.SalesInvoices.IgnoreQueryFilters()
                    .Where(i => i.TenantId == tenantId && !i.IsDeleted && i.Status != "Cancelled" &&
                                (i.CompanyId == null || i.CompanyId == company.Id) &&
                                i.InvoiceDate >= fromDate && i.InvoiceDate <= toDate)
                    .SumAsync(i => (decimal?)i.SubTotal, ct) ?? 0m;

                var expensesSum = await _db.ExpenseClaims.IgnoreQueryFilters()
                    .Where(e => e.TenantId == tenantId && !e.IsDeleted && e.Status == "Approved" &&
                                (e.CompanyId == null || e.CompanyId == company.Id) &&
                                e.ExpenseDate >= fromDate && e.ExpenseDate <= toDate)
                    .SumAsync(e => (decimal?)e.Amount, ct) ?? 0m;

                var convertedRev = Math.Round(invoicesSum * rate, 2);
                var convertedExp = Math.Round(expensesSum * rate, 2);

                result.EntityContributions.Add(new ConsolidatedEntityBalance
                {
                    CompanyId = company.Id,
                    CompanyName = company.Name ?? "Entity",
                    FunctionalCurrency = companyCurrency,
                    ConvertedRevenue = convertedRev,
                    ConvertedExpenses = convertedExp
                });

                totalRevenue += convertedRev;
                totalExpenses += convertedExp;
            }

            // Intercompany revenue/expense eliminations
            var intercompanyJournalLines = await _db.JournalEntries.IgnoreQueryFilters()
                .Where(j => j.TenantId == tenantId && !j.IsDeleted && j.Status == "Posted" &&
                            (j.EntryType == "Intercompany" || (j.Narration != null && j.Narration.Contains("Intercompany"))) &&
                            j.EntryDate >= fromDate && j.EntryDate <= toDate)
                .SelectMany(j => j.Lines)
                .SumAsync(l => (decimal?)l.DebitAmount, ct) ?? 0m;

            result.InterCompanyEliminationsTotal = intercompanyJournalLines;
            result.TotalConsolidatedRevenue = Math.Max(0, totalRevenue - intercompanyJournalLines);
            result.TotalConsolidatedExpenses = Math.Max(0, totalExpenses - intercompanyJournalLines);

            return result;
        }
    }
}
