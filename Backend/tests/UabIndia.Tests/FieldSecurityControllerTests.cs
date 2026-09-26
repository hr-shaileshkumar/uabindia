using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using UabIndia.Api.Modules.Administration.Controllers;
using UabIndia.Application.Common.Models;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class FieldSecurityControllerTests
    {
        private static ApplicationDbContext CreateContext(TestTenantAccessor tenantAccessor)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            return new ApplicationDbContext(options, tenantAccessor, new TestEncryptionService());
        }

        private static FieldSecurityController CreateController(ApplicationDbContext db, TestTenantAccessor tenantAccessor, Guid userId, string role)
        {
            var controller = new FieldSecurityController(db, tenantAccessor)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext
                    {
                        User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                            new Claim(ClaimTypes.Role, role)
                        }, "TestAuth"))
                    }
                }
            };
            return controller;
        }

        [Fact]
        public async Task UnmaskField_WithValidJustificationAndRole_ReturnsUnmaskedValue_AndLogsAudit()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            await using var db = CreateContext(tenantAccessor);

            var emp = new Employee
            {
                TenantId = tenantId,
                FullName = "Rohan Sharma",
                EmployeeCode = "EMP001",
                Pan = "ABCDE1234F",
                Status = "Active"
            };
            db.Employees.Add(emp);
            await db.SaveChangesAsync();

            var userId = Guid.NewGuid();
            var controller = CreateController(db, tenantAccessor, userId, "HR Manager");

            var request = new UnmaskFieldRequestDto
            {
                EntityName = "Employee",
                EntityId = emp.Id,
                FieldName = "Pan",
                Justification = "Statutory income tax compliance verification"
            };

            var result = await controller.UnmaskField(request);
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<ApiResponse<UnmaskFieldResponseDto>>(okResult.Value);

            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.Equal("Pan", response.Data.FieldName);
            Assert.Equal("ABCDE1234F", response.Data.UnmaskedValue);

            // Verify Audit Log entry created
            var audit = await db.AuditLogs.FirstOrDefaultAsync(a => a.EntityId == emp.Id && a.Action.Contains("FieldUnmask"));
            Assert.NotNull(audit);
            Assert.Equal(tenantId, audit.TenantId);
            Assert.Equal("Masked", audit.OldValue);
            Assert.Contains("Statutory income tax compliance verification", audit.NewValue);
            Assert.Equal(userId, audit.PerformedBy);
        }

        [Fact]
        public async Task UnmaskField_WithoutJustification_ReturnsBadRequest()
        {
            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(Guid.NewGuid());
            await using var db = CreateContext(tenantAccessor);

            var controller = CreateController(db, tenantAccessor, Guid.NewGuid(), "Admin");

            var request = new UnmaskFieldRequestDto
            {
                EntityName = "Employee",
                EntityId = Guid.NewGuid(),
                FieldName = "Pan",
                Justification = "hi" // too short (< 5 chars)
            };

            var result = await controller.UnmaskField(request);
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<ApiResponse<UnmaskFieldResponseDto>>(badRequest.Value);

            Assert.False(response.Success);
            Assert.Equal("JUSTIFICATION_REQUIRED", response.StructuredErrors[0].Code);
        }

        [Fact]
        public async Task UnmaskField_UnauthorizedRole_ReturnsForbid()
        {
            var tenantAccessor = new TestTenantAccessor();
            var tenantId = Guid.NewGuid();
            tenantAccessor.SetTenantId(tenantId);
            await using var db = CreateContext(tenantAccessor);

            var emp = new Employee
            {
                TenantId = tenantId,
                FullName = "Pooja Verma",
                EmployeeCode = "EMP002",
                Pan = "XYZPA9876Q",
                Status = "Active"
            };
            db.Employees.Add(emp);
            await db.SaveChangesAsync();

            var controller = CreateController(db, tenantAccessor, Guid.NewGuid(), "Employee"); // Regular employee role

            var request = new UnmaskFieldRequestDto
            {
                EntityName = "Employee",
                EntityId = emp.Id,
                FieldName = "Pan",
                Justification = "Curious to see PAN card"
            };

            var result = await controller.UnmaskField(request);
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task UnmaskField_NonExistentRecord_ReturnsNotFound()
        {
            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(Guid.NewGuid());
            await using var db = CreateContext(tenantAccessor);

            var controller = CreateController(db, tenantAccessor, Guid.NewGuid(), "SuperAdmin");

            var request = new UnmaskFieldRequestDto
            {
                EntityName = "Employee",
                EntityId = Guid.NewGuid(),
                FieldName = "Pan",
                Justification = "Auditing employee records"
            };

            var result = await controller.UnmaskField(request);
            var notFound = Assert.IsType<NotFoundObjectResult>(result);
            var response = Assert.IsType<ApiResponse<UnmaskFieldResponseDto>>(notFound.Value);

            Assert.False(response.Success);
            Assert.Equal("RECORD_NOT_FOUND", response.StructuredErrors[0].Code);
        }
    }
}
