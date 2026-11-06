using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
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
    public class DataImportControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _db;
        private readonly TestTenantAccessor _tenantAccessor;
        private readonly TestHubContext<NotificationHub> _hubContext;
        private readonly DataImportController _controller;
        private readonly Guid _tenantId = Guid.NewGuid();

        public DataImportControllerTests()
        {
            var inMemoryConfig = new Dictionary<string, string?>
            {
                ["Encryption:Key"] = "test-key-32-chars-long-for-abac-tests!!!"
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();

            _tenantAccessor = new TestTenantAccessor();
            _tenantAccessor.SetTenantId(_tenantId);

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            var encryption = new AesEncryptionService(config);
            _db = new ApplicationDbContext(options, _tenantAccessor, encryption);
            _hubContext = new TestHubContext<NotificationHub>();

            _controller = new DataImportController(
                _db,
                _tenantAccessor,
                _hubContext,
                NullLogger<DataImportController>.Instance);
        }

        public void Dispose()
        {
            _db.Dispose();
        }

        [Fact]
        public async Task ValidateBatchImport_WithEmptyRequest_ReturnsBadRequest()
        {
            var request = new DataImportController.BatchImportRequest
            {
                EntityKey = "",
                Records = new List<Dictionary<string, object?>>()
            };

            var result = await _controller.ValidateBatchImport(request, CancellationToken.None);
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task ValidateBatchImport_WithValidEmployeeRows_ReturnsValid()
        {
            var request = new DataImportController.BatchImportRequest
            {
                EntityKey = "employees",
                Records = new List<Dictionary<string, object?>>
                {
                    new()
                    {
                        ["name"] = "Alice Smith",
                        ["email"] = "alice@example.com",
                        ["code"] = "EMP-001"
                    },
                    new()
                    {
                        ["name"] = "Bob Jones",
                        ["email"] = "bob@example.com",
                        ["code"] = "EMP-002"
                    }
                }
            };

            var actionResult = await _controller.ValidateBatchImport(request, CancellationToken.None);
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<DataImportController.BatchImportValidationResult>>(okResult.Value);

            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.True(response.Data.IsValid);
            Assert.Equal(2, response.Data.ValidRecords);
            Assert.Equal(0, response.Data.InvalidRecords);
            Assert.Empty(response.Data.Errors);
        }

        [Fact]
        public async Task ValidateBatchImport_WithInvalidEmailAndDuplicateCodes_ReturnsErrors()
        {
            var request = new DataImportController.BatchImportRequest
            {
                EntityKey = "employees",
                Records = new List<Dictionary<string, object?>>
                {
                    new()
                    {
                        ["name"] = "Alice Smith",
                        ["email"] = "not-an-email",
                        ["code"] = "EMP-001"
                    },
                    new()
                    {
                        ["name"] = "Bob Jones",
                        ["email"] = "bob@example.com",
                        ["code"] = "EMP-001" // Duplicate code in batch
                    },
                    new()
                    {
                        ["name"] = "", // Missing name
                        ["email"] = "charlie@example.com",
                        ["code"] = "EMP-003"
                    }
                }
            };

            var actionResult = await _controller.ValidateBatchImport(request, CancellationToken.None);
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<DataImportController.BatchImportValidationResult>>(okResult.Value);

            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.False(response.Data.IsValid);
            Assert.True(response.Data.InvalidRecords >= 2);
            Assert.NotEmpty(response.Data.Errors);
        }

        [Fact]
        public async Task ExecuteBatchImport_WithValidEmployees_PersistsToDb()
        {
            var request = new DataImportController.BatchImportRequest
            {
                EntityKey = "employees",
                Records = new List<Dictionary<string, object?>>
                {
                    new()
                    {
                        ["name"] = "Clark Kent",
                        ["email"] = "clark@dailyplanet.com",
                        ["code"] = "EMP-100",
                        ["phone"] = "9876543210"
                    },
                    new()
                    {
                        ["name"] = "Bruce Wayne",
                        ["email"] = "bruce@wayneenterprises.com",
                        ["code"] = "EMP-101",
                        ["phone"] = "9876543211"
                    }
                }
            };

            var actionResult = await _controller.ExecuteBatchImport(request, CancellationToken.None);
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<DataImportController.BatchImportResult>>(okResult.Value);

            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.Equal(2, response.Data.SuccessCount);
            Assert.Equal(0, response.Data.FailedCount);

            // Verify in Database
            var emp1 = await _db.Employees.FirstOrDefaultAsync(e => e.EmployeeCode == "EMP-100");
            Assert.NotNull(emp1);
            Assert.Equal("Clark Kent", emp1!.FullName);
            Assert.Equal(_tenantId, emp1.TenantId);

            var emp2 = await _db.Employees.FirstOrDefaultAsync(e => e.EmployeeCode == "EMP-101");
            Assert.NotNull(emp2);
            Assert.Equal("Bruce Wayne", emp2!.FullName);
        }

        [Fact]
        public async Task ExecuteBatchImport_WithGenericEntity_PersistsUsingReflection()
        {
            var request = new DataImportController.BatchImportRequest
            {
                EntityKey = "departments",
                Records = new List<Dictionary<string, object?>>
                {
                    new()
                    {
                        ["Name"] = "Information Technology",
                        ["Code"] = "DEPT-IT"
                    },
                    new()
                    {
                        ["Name"] = "Human Resources",
                        ["Code"] = "DEPT-HR"
                    }
                }
            };

            var actionResult = await _controller.ExecuteBatchImport(request, CancellationToken.None);
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<ApiResponse<DataImportController.BatchImportResult>>(okResult.Value);

            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.Equal(2, response.Data.SuccessCount);

            // Verify in Database
            var dept = await _db.Departments.FirstOrDefaultAsync(d => d.Code == "DEPT-IT");
            Assert.NotNull(dept);
            Assert.Equal("Information Technology", dept!.Name);
            Assert.Equal(_tenantId, dept.TenantId);
        }
    }
}
