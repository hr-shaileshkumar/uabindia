using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Infrastructure.Services.Payroll;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests;

public class GlobalHrmsPayrollTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly GlobalPayrollRouter _payrollRouter;
    private readonly HrLifecycleService _lifecycleService;
    private readonly AttendanceVerificationService _attendanceService;
    private readonly Guid _tenantId = Guid.NewGuid();

    public GlobalHrmsPayrollTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Encryption:Key"] = "test-key-32-chars-long-for-hrms-tests!!"
            })
            .Build();

        var encryption = new AesEncryptionService(config);
        var tenantAccessor = new TestTenantAccessor();
        tenantAccessor.SetTenantId(_tenantId);

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new ApplicationDbContext(options, tenantAccessor, encryption);
        _payrollRouter = new GlobalPayrollRouter();
        _lifecycleService = new HrLifecycleService(_db);
        _attendanceService = new AttendanceVerificationService(_db);
    }

    [Fact]
    public void IndiaPayrollEngine_CalculatesPfEsiAndPtAccurately()
    {
        var req = new PayrollCalculationRequest
        {
            CountryCode = "IND",
            GrossSalary = 20000m,
            BasicSalary = 10000m,
            HasProvidentFund = true,
            HasEsi = true
        };

        var result = _payrollRouter.CalculatePayroll(req);

        Assert.Equal("IND", result.CountryCode);
        Assert.Equal(20000m, result.GrossEarnings);
        Assert.Equal(1200m, result.EmployeeDeductions["ProvidentFund_Employee"]); // 12% of 10k
        Assert.Equal(150m, result.EmployeeDeductions["ESIC_Employee"]); // 0.75% of 20k
        Assert.Equal(200m, result.EmployeeDeductions["ProfessionalTax"]);
        Assert.Equal(1550m, result.TotalEmployeeDeductions);
        Assert.Equal(18450m, result.NetPayable);
    }

    [Fact]
    public void UsPayrollEngine_CalculatesFicaAndFederalWithholding()
    {
        var req = new PayrollCalculationRequest
        {
            CountryCode = "USA",
            GrossSalary = 6000m
        };

        var result = _payrollRouter.CalculatePayroll(req);

        Assert.Equal("USA", result.CountryCode);
        Assert.Equal(372m, result.EmployeeDeductions["FICA_SocialSecurity_Employee"]); // 6.2% of 6k
        Assert.Equal(87m, result.EmployeeDeductions["FICA_Medicare_Employee"]); // 1.45% of 6k
        Assert.Equal(600m, result.EmployeeDeductions["FederalIncomeTax_Withholding"]); // 10% of 6k
        Assert.Equal(4941m, result.NetPayable);
    }

    [Fact]
    public void UkPayrollEngine_CalculatesNicAndWorkplacePension()
    {
        var req = new PayrollCalculationRequest
        {
            CountryCode = "GBR",
            GrossSalary = 3000m
        };

        var result = _payrollRouter.CalculatePayroll(req);

        Assert.Equal("GBR", result.CountryCode);
        Assert.True(result.EmployeeDeductions.ContainsKey("NationalInsurance_Employee"));
        Assert.Equal(150m, result.EmployeeDeductions["WorkplacePension_Employee"]); // 5% of 3k
        Assert.Equal(90m, result.EmployerContributions["WorkplacePension_Employer"]); // 3% of 3k
    }

    [Fact]
    public void UaePayrollEngine_CalculatesZeroPersonalTaxAndEosgAccrual()
    {
        var req = new PayrollCalculationRequest
        {
            CountryCode = "ARE",
            GrossSalary = 15000m,
            BasicSalary = 9000m
        };

        var result = _payrollRouter.CalculatePayroll(req);

        Assert.Equal("ARE", result.CountryCode);
        Assert.Equal(0m, result.TotalEmployeeDeductions);
        Assert.Equal(15000m, result.NetPayable);
        Assert.True(result.EmployerContributions.ContainsKey("EOSG_GratuityAccrual_Employer"));
        Assert.True(result.EmployerContributions["EOSG_GratuityAccrual_Employer"] > 0);
    }

    [Fact]
    public async Task HrLifecycleService_InitializesStandardOnboardingTasks()
    {
        var employee = new Employee
        {
            TenantId = _tenantId,
            FullName = "John Doe",
            WorkEmail = "john.doe@enterprise.com"
        };
        _db.Employees.Add(employee);
        await _db.SaveChangesAsync();

        var result = await _lifecycleService.InitializeEmployeeLifecycleTasksAsync(_tenantId, employee.Id, "Onboarding");

        Assert.Equal(6, result.TasksCreatedCount);
        Assert.Contains(result.CreatedTasks, t => t.Title.Contains("IT Hardware Provisioning"));
        Assert.Contains(result.CreatedTasks, t => t.Title.Contains("Document Verification"));
    }

    [Fact]
    public async Task AttendanceVerificationService_ValidatesGeoFenceDistance()
    {
        var employee = new Employee
        {
            TenantId = _tenantId,
            FullName = "Alice Smith"
        };
        _db.Employees.Add(employee);
        await _db.SaveChangesAsync();

        // Office location: Bangalore MG Road
        var officeLat = 12.9716m;
        var officeLon = 77.5946m;

        // Punch 1: Close to office (~50 meters)
        var closePunchReq = new AttendancePunchRequest
        {
            TenantId = _tenantId,
            EmployeeId = employee.Id,
            PunchType = "IN",
            Latitude = 12.9718m,
            Longitude = 77.5948m
        };

        var closeResult = await _attendanceService.VerifyAndRecordPunchAsync(closePunchReq, officeLat, officeLon, maxRadiusMeters: 200);

        Assert.True(closeResult.Success);
        Assert.True(closeResult.IsWithinGeoFence);
        Assert.Equal("VerifiedWithinFence", closeResult.ValidationStatus);

        // Punch 2: Far from office (~10 kilometers away)
        var farPunchReq = new AttendancePunchRequest
        {
            TenantId = _tenantId,
            EmployeeId = employee.Id,
            PunchType = "OUT",
            Latitude = 13.0500m,
            Longitude = 77.6500m
        };

        var farResult = await _attendanceService.VerifyAndRecordPunchAsync(farPunchReq, officeLat, officeLon, maxRadiusMeters: 200);

        Assert.True(farResult.Success);
        Assert.False(farResult.IsWithinGeoFence);
        Assert.Equal("OutOfFenceAnomaly", farResult.ValidationStatus);
    }

    public void Dispose() => _db.Dispose();
}
