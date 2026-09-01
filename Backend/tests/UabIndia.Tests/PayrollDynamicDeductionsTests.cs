using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Security;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Repositories;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class PayrollDynamicDeductionsTests
    {
        private class DummyEncryptionService : IEncryptionService
        {
            public string Encrypt(string plainText) => plainText;
            public string Decrypt(string cipherText) => cipherText;
            public string ComputeHash(string input) => "hash-" + input;
            public string EncryptBlindIndex(string plainText) => "bi-" + plainText;
        }

        private static ApplicationDbContext CreateInMemoryDbContext(string dbName, ITenantAccessor tenantAccessor)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            return new ApplicationDbContext(options, tenantAccessor, new DummyEncryptionService());
        }

        [Theory]
        [InlineData("BASIC * 0.12", 50000, 6000)]
        [InlineData("(BASIC + HRA) * 0.05", 50000, 3500)] // HRA = 20000, total = 70000 * 0.05 = 3500
        [InlineData("GROSS * 0.02 + 100", 80000, 1700)] // 80000 * 0.02 + 100 = 1700
        [InlineData("CTC * 0.03", 100000, 3000)]
        [InlineData("(BASIC + SPECIAL) / 2", 50000, 30000)] // Basic 50k, Special 10k -> 60k / 2 = 30k
        public void PayrollFormulaEvaluator_ComputesDynamicFormulasCorrectly(
            string formula,
            decimal primaryInput,
            decimal expected)
        {
            var vars = new Dictionary<string, decimal>
            {
                ["BASIC"] = primaryInput,
                ["HRA"] = 20000m,
                ["SPECIAL"] = 10000m,
                ["GROSS"] = 80000m,
                ["CTC"] = 100000m,
                ["DAYS"] = 30m,
                ["FACTOR"] = 1.0m
            };

            var result = PayrollFormulaEvaluator.Evaluate(formula, vars);
            Assert.Equal(expected, result);
        }

        [Fact]
        public async Task PayrollEngine_UsesCustomUserDeductionRatesAndFormulas_OverStatutoryDefaults()
        {
            var tenantId = Guid.NewGuid();
            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(tenantId);

            var db = CreateInMemoryDbContext("DynamicPayrollTestDb_" + Guid.NewGuid(), tenantAccessor);
            var complianceRepo = new ComplianceRepository(db, NullLogger<ComplianceRepository>.Instance);
            var numbers = new DocumentNumberService(db, tenantAccessor);
            var ledgerService = new LedgerPostingService(db, tenantAccessor, numbers);
            var engine = new PayrollEngineService(db, tenantAccessor, complianceRepo, ledgerService);

            // 1. Create Company
            var company = new Company
            {
                TenantId = tenantId,
                Name = "Custom Payroll Solutions Ltd",
                IsActive = true
            };
            db.Companies.Add(company);

            // 2. Create Custom Salary Structure with User-Defined Components
            var structure = new PayrollStructure
            {
                TenantId = tenantId,
                Name = "Custom Tech Structure",
                EffectiveFrom = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            };
            db.PayrollStructures.Add(structure);
            await db.SaveChangesAsync();

            // Add Components to Structure:
            // - Basic: 50,000
            // - HRA: 40% of Basic (20,000)
            // - User Custom PF: 10% (User override instead of default statutory 12%)
            // - User Custom Insurance Formula: "(BASIC + HRA) * 0.05"
            // - User Fixed TDS: ₹4,000 (Fixed amount override)
            // - Canteen Deduction: ₹1,500 (Fixed deduction)
            var components = new List<PayrollComponent>
            {
                new() { TenantId = tenantId, StructureId = structure.Id, Name = "Basic", Type = "Earning", Amount = 50000m },
                new() { TenantId = tenantId, StructureId = structure.Id, Name = "HRA", Type = "Earning", Percentage = 40m },
                new() { TenantId = tenantId, StructureId = structure.Id, Name = "Provident Fund", Type = "Deduction", Percentage = 10m, IsStatutory = true },
                new() { TenantId = tenantId, StructureId = structure.Id, Name = "Health Insurance", Type = "Deduction", Formula = "(BASIC + HRA) * 0.05" },
                new() { TenantId = tenantId, StructureId = structure.Id, Name = "TDS", Type = "Deduction", Amount = 4000m, IsStatutory = true },
                new() { TenantId = tenantId, StructureId = structure.Id, Name = "Canteen Subsidy", Type = "Deduction", Amount = 1500m }
            };
            db.PayrollComponents.AddRange(components);

            // 3. Create Employee linked to Structure
            var employee = new Employee
            {
                TenantId = tenantId,
                CompanyId = company.Id,
                EmployeeCode = "EMP-9001",
                FullName = "Vikram Aditya",
                BasicSalary = 50000m,
                MonthlyCtc = 80000m,
                PayrollStructureId = structure.Id,
                Status = "Active",
                DateOfJoining = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            };
            db.Employees.Add(employee);

            // 4. Create Draft Payroll Run for Month
            var payrollRun = new PayrollRun
            {
                TenantId = tenantId,
                CompanyId = company.Id,
                RunDate = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                PeriodStart = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                PeriodEnd = new DateTime(2026, 4, 30, 0, 0, 0, DateTimeKind.Utc),
                Status = "Draft"
            };
            db.PayrollRuns.Add(payrollRun);
            await db.SaveChangesAsync();

            // 5. Execute CompleteRunAsync
            var result = await engine.CompleteRunAsync(payrollRun.Id);

            Assert.True(result.PayslipsGenerated > 0);
            Assert.Equal(70000m, result.TotalGross); // Basic 50,000 + HRA 20,000 = 70,000 Gross

            // 6. Verify generated payslip lines
            var payslip = await db.Payslips.FirstOrDefaultAsync(p => p.PayrollRunId == payrollRun.Id);
            Assert.NotNull(payslip);

            var lines = await db.PayslipLines.Where(l => l.PayslipId == payslip.Id).ToListAsync();

            // User PF (10% of 50,000 = 5,000, NOT the default 12% statutory)
            var pfLine = lines.FirstOrDefault(l => l.Name == "Provident Fund");
            Assert.NotNull(pfLine);
            Assert.Equal(5000m, pfLine.Amount);

            // User Formula Insurance ((50,000 + 20,000) * 0.05 = 3,500)
            var insLine = lines.FirstOrDefault(l => l.Name == "Health Insurance");
            Assert.NotNull(insLine);
            Assert.Equal(3500m, insLine.Amount);

            // User Fixed TDS (₹4,000 exact user amount)
            var tdsLine = lines.FirstOrDefault(l => l.Name == "TDS");
            Assert.NotNull(tdsLine);
            Assert.Equal(4000m, tdsLine.Amount);

            // Canteen Deduction (₹1,500)
            var canteenLine = lines.FirstOrDefault(l => l.Name == "Canteen Subsidy");
            Assert.NotNull(canteenLine);
            Assert.Equal(1500m, canteenLine.Amount);

            // Total Deductions = 5000 + 3500 + 4000 + 1500 + 200 (PT default fallback since no user PT component) = 14,200
            // Net Payable = 70,000 - 14,200 = 55,800
            Assert.Equal(55800m, payslip.Net);
        }
    }
}
