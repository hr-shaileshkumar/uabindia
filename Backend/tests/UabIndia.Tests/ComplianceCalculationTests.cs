using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Repositories;

namespace UabIndia.Tests
{
    public class ComplianceCalculationTests
    {
        private static (ApplicationDbContext Context, ComplianceRepository Repository) CreateRepository(Guid tenantId)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            var tenantAccessor = new MockTenantAccessor(tenantId);
            var encryptionService = new TestEncryptionService();
            var context = new ApplicationDbContext(options, tenantAccessor, encryptionService);
            var repository = new ComplianceRepository(context, NullLogger<ComplianceRepository>.Instance);

            return (context, repository);
        }

        [Fact]
        public async Task CreateProvidentFundAsync_UsesCeilingAndCalculatesContributions()
        {
            var (context, repository) = CreateRepository(Guid.NewGuid());

            var pf = new ProvidentFund
            {
                EmployeeId = Guid.NewGuid(),
                EmployeeNumber = "EMP-001",
                EmployeeName = "Test User",
                DepartmentId = Guid.NewGuid(),
                DepartmentName = "HR",
                PFAccountNumber = "PF-123",
                EffectiveFrom = DateTime.UtcNow,
                BasicSalary = 20000m,
                DA = 0m,
                FinancialYear = 2026,
                MonthYear = 202602
            };

            var created = await repository.CreateProvidentFundAsync(pf);

            Assert.Equal(15000m, created.PFWages);
            Assert.Equal(1800m, created.EmployeeContribution, 2);
            Assert.Equal(1249.5m, created.EmployerContributionPF, 2);
            Assert.Equal(250.5m, created.EmployerContributionEPS, 2);
            Assert.Equal(49.5m, created.AdminCharges, 2);
            Assert.Equal(3300m, created.TotalContribution, 2);

            context.Dispose();
        }

        [Fact]
        public async Task CreateESIAsync_UsesCeilingAndEligibility()
        {
            var (context, repository) = CreateRepository(Guid.NewGuid());

            var esi = new EmployeeStateInsurance
            {
                EmployeeId = Guid.NewGuid(),
                EmployeeNumber = "EMP-002",
                EmployeeName = "ESI User",
                DepartmentId = Guid.NewGuid(),
                ESINumber = "ESI-001",
                StateCode = "KA",
                StateName = "Karnataka",
                EffectiveFrom = DateTime.UtcNow,
                MonthlySalary = 30000m,
                FinancialYear = 2026,
                MonthYear = 202602
            };

            var created = await repository.CreateESIAsync(esi);

            Assert.Equal(21000m, created.ESIWages);
            Assert.False(created.IsESIEligible);
            Assert.Equal(157.5m, created.EmployeeContribution, 2);
            Assert.Equal(682.5m, created.EmployerContribution, 2);
            Assert.Equal(840m, created.TotalContribution, 2);

            context.Dispose();
        }

        [Fact]
        public async Task CreatePTAsync_UsesStateSlab()
        {
            var tenantId = Guid.NewGuid();
            var (context, repository) = CreateRepository(tenantId);

            var slabs = new List<object>
            {
                new { From = 0m, To = 10000m, Rate = 200m },
                new { From = 10000m, To = 20000m, Rate = 300m }
            };

            var slabSetting = new StatutorySettings
            {
                SettingKey = "PT_SLAB_KA_FY2026",
                SettingValue = System.Text.Json.JsonSerializer.Serialize(slabs),
                FinancialYear = 2026,
                Description = "Test PT slabs",
                EffectiveFrom = DateTime.UtcNow,
                IsActive = true
            };

            context.StatutorySettings.Add(slabSetting);
            await context.SaveChangesAsync();

            var pt = new ProfessionalTax
            {
                EmployeeId = Guid.NewGuid(),
                EmployeeNumber = "EMP-003",
                EmployeeName = "PT User",
                DepartmentId = Guid.NewGuid(),
                StateCode = "KA",
                StateName = "Karnataka",
                PTRegistrationNumber = "PT-001",
                EffectiveFrom = DateTime.UtcNow,
                MonthlySalary = 9000m,
                FinancialYear = 2026,
                MonthYear = 202602
            };

            var created = await repository.CreatePTAsync(pt);

            Assert.Equal(200m, created.PTDeduction);
            Assert.False(created.IsPTExempt);

            context.Dispose();
        }

        [Fact]
        public async Task CreateIncomeTaxAsync_ComputesTaxableIncomeAndLiability_NewRegime()
        {
            var (context, repository) = CreateRepository(Guid.NewGuid());

            var incomeTax = new IncomeTax
            {
                EmployeeId = Guid.NewGuid(),
                EmployeeNumber = "EMP-004",
                EmployeeName = "Tax User",
                PAN = "ABCDE1234F",
                DepartmentId = Guid.NewGuid(),
                TaxRegime = TaxRegime.NewRegime,
                BasicSalary = 1000000m,
                DA = 0m,
                HRA = 0m,
                SpecialAllowance = 0m,
                OtherAllowance = 0m,
                FinancialYear = 2026,
                AssessmentYear = 2027
            };

            var created = await repository.CreateIncomeTaxAsync(incomeTax);

            Assert.Equal(950000m, created.TaxableIncome);
            Assert.Equal(46800m, created.TotalTaxLiability, 2);
            Assert.Equal(0m, created.RebateUnder87A);

            context.Dispose();
        }

        private sealed class MockTenantAccessor : ITenantAccessor
        {
            private Guid _tenantId;
            private string? _tenantSchema;
            private bool _includeDeleted;
            private bool _includeAllTenants;

            public MockTenantAccessor(Guid tenantId)
            {
                _tenantId = tenantId;
            }

            public void SetTenantId(Guid tenantId) => _tenantId = tenantId;

            public Guid GetTenantId() => _tenantId;

            public void SetTenantSchema(string? schema) => _tenantSchema = schema;

            public string? GetTenantSchema() => _tenantSchema;

            public void SetDataVisibility(bool includeDeleted, bool includeAllTenants)
            {
                _includeDeleted = includeDeleted;
                _includeAllTenants = includeAllTenants;
            }

            public bool IncludeDeleted() => _includeDeleted;

            public bool IncludeAllTenants() => _includeAllTenants;
        }
    }
}
