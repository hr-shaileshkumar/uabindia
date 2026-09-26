using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using UabIndia.Api.Hubs;
using UabIndia.Api.Modules.Administration.Controllers;
using UabIndia.Application.Common.Models;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class DataExportControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _db;
        private readonly TestTenantAccessor _tenantAccessor;
        private readonly LocalStorageProvider _storageProvider;
        private readonly TestHubContext<NotificationHub> _hubContext;
        private readonly DataExportController _controller;
        private readonly Guid _tenantId = Guid.NewGuid();
        private readonly string _tempStorageDir;

        public DataExportControllerTests()
        {
            _tempStorageDir = Path.Combine(Path.GetTempPath(), "uab_export_tests_" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_tempStorageDir);

            var inMemoryConfig = new Dictionary<string, string?>
            {
                ["Encryption:Key"] = "test-key-32-chars-long-for-abac-tests!!!",
                ["Storage:LocalBasePath"] = _tempStorageDir
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();

            _tenantAccessor = new TestTenantAccessor();
            _tenantAccessor.SetTenantId(_tenantId);

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            var encryption = new AesEncryptionService(config);
            _db = new ApplicationDbContext(options, _tenantAccessor, encryption);
            _storageProvider = new LocalStorageProvider(config, NullLogger<LocalStorageProvider>.Instance);
            _hubContext = new TestHubContext<NotificationHub>();

            _controller = new DataExportController(
                _db,
                _tenantAccessor,
                _storageProvider,
                _hubContext,
                NullLogger<DataExportController>.Instance);
        }

        public void Dispose()
        {
            _db.Dispose();
            if (Directory.Exists(_tempStorageDir))
            {
                try { Directory.Delete(_tempStorageDir, true); } catch { }
            }
        }

        [Fact]
        public void GetExportableEntities_ReturnsExpectedCatalog()
        {
            var result = _controller.GetExportableEntities() as OkObjectResult;
            Assert.NotNull(result);

            var response = result.Value as ApiResponse<object>;
            Assert.NotNull(response);
            Assert.True(response.Success);
        }

        [Fact]
        public async Task GenerateExport_SynchronousCsv_ReturnsFileWithContent()
        {
            // Seed sample employee
            _db.Employees.Add(new Employee
            {
                TenantId = _tenantId,
                EmployeeCode = "EMP-EXPORT-01",
                FullName = "Meera Nambiar",
                WorkEmail = "meera@enterprise.in",
                Phone = "+919876543210",
                Status = "Active"
            });
            await _db.SaveChangesAsync();

            var request = new DataExportController.ExportRequestDto
            {
                EntityKey = "employees",
                Format = "csv",
                RunAsync = false
            };

            var fileResult = await _controller.GenerateExport(request, CancellationToken.None) as FileContentResult;
            Assert.NotNull(fileResult);
            Assert.Equal("text/csv; charset=utf-8", fileResult.ContentType);
            Assert.Contains("employees_export_", fileResult.FileDownloadName);

            var csvString = Encoding.UTF8.GetString(fileResult.FileContents);
            Assert.Contains("EMP-EXPORT-01", csvString);
            Assert.Contains("Meera Nambiar", csvString);
            Assert.Contains("meera@enterprise.in", csvString);
        }

        [Fact]
        public async Task GenerateExport_SynchronousJson_ReturnsJsonFile()
        {
            _db.Customers.Add(new Customer
            {
                TenantId = _tenantId,
                CustomerCode = "CUST-EXPORT-01",
                CustomerName = "Tata Consultancy Enterprise",
                Email = "procurement@tata.com",
                PhoneNumber = "+912212345678",
                City = "Mumbai",
                State = "Maharashtra"
            });
            await _db.SaveChangesAsync();

            var request = new DataExportController.ExportRequestDto
            {
                EntityKey = "customers",
                Format = "json",
                RunAsync = false
            };

            var fileResult = await _controller.GenerateExport(request, CancellationToken.None) as FileContentResult;
            Assert.NotNull(fileResult);
            Assert.Equal("application/json", fileResult.ContentType);

            var jsonString = Encoding.UTF8.GetString(fileResult.FileContents);
            Assert.Contains("Tata Consultancy Enterprise", jsonString);
            Assert.Contains("CUST-EXPORT-01", jsonString);
        }
    }
}
