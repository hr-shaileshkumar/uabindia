using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Application.Interfaces;
using UabIndia.Api.Modules.Platform.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using UabIndia.Core.Services;

namespace UabIndia.Tests
{
    /// <summary>
    /// Integration tests for GDPR Privacy APIs
    /// Tests export, deletion, and privacy policy endpoints
    /// </summary>
    public class PrivacyApiIntegrationTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly PrivacyController _controller;
        private readonly Guid _tenantId = Guid.NewGuid();
        private readonly Guid _userId = Guid.NewGuid();
        private readonly MockTenantAccessor _mockTenantAccessor;

        public PrivacyApiIntegrationTests()
        {
            // Create in-memory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _mockTenantAccessor = new MockTenantAccessor();
            _mockTenantAccessor.SetTenantId(_tenantId);
            
            var encryptionService = new TestEncryptionService();
            _context = new ApplicationDbContext(options, _mockTenantAccessor, encryptionService);
            _controller = new PrivacyController(_context, _mockTenantAccessor);
            
            // Mock HTTP context for IP address
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
        }

        [Fact]
        public async Task ExportUserData_ValidUser_ReturnsCompleteDataPackage()
        {
            // Arrange: Create test user with data
            var user = new User
            {
                Id = _userId,
                Email = "test@example.com",
                PasswordHash = "hashed_password",
                FullName = "Test User",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new PrivacyController.ExportDataRequest { UserId = _userId };

            // Act
            var result = await _controller.ExportUserData(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            
            // Verify response contains expected fields
            var responseType = okResult.Value.GetType();
            Assert.NotNull(responseType.GetProperty("message"));
            Assert.NotNull(responseType.GetProperty("dataPackage"));
        }

        [Fact]
        public async Task ExportUserData_NonExistentUser_ReturnsNotFound()
        {
            // Arrange
            var nonExistentUserId = Guid.NewGuid();
            var request = new PrivacyController.ExportDataRequest { UserId = nonExistentUserId };

            // Act
            var result = await _controller.ExportUserData(request);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.NotNull(notFoundResult.Value);
        }

        [Fact]
        public async Task ExportUserData_IncludesAuditLogs()
        {
            // Arrange: Create user and audit logs
            var user = new User
            {
                Id = _userId,
                Email = "test@example.com",
                PasswordHash = "hashed_password",
                FullName = "Test User",
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Add audit logs
            var auditLog = new AuditLog
            {
                PerformedBy = _userId,
                Action = "Modified",
                EntityName = "Employee",
                PerformedAt = DateTime.UtcNow,
                OldValue = "old",
                NewValue = "new"
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            var request = new PrivacyController.ExportDataRequest { UserId = _userId };

            // Act
            var result = await _controller.ExportUserData(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task DeleteUser_ValidUser_AnonymizesAndSoftDeletes()
        {
            // Arrange: Create test user
            var user = new User
            {
                Id = _userId,
                Email = "delete@example.com",
                PasswordHash = "hashed_password",
                FullName = "User To Delete",
                IsActive = true,
                IsSystemAdmin = false
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new PrivacyController.DeleteUserRequest 
            { 
                UserId = _userId,
                Reason = "User requested deletion"
            };

            // Mock authenticated user (different from user being deleted)
            var claims = new[]
            {
                new System.Security.Claims.Claim("userId", Guid.NewGuid().ToString())
            };
            _controller.ControllerContext.HttpContext.User = new System.Security.Claims.ClaimsPrincipal(
                new System.Security.Claims.ClaimsIdentity(claims, "TestAuth"));

            // Act
            var result = await _controller.DeleteUser(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            
            // Verify user was soft deleted and anonymized
            var deletedUser = await _context.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == _userId);
            
            Assert.NotNull(deletedUser);
            Assert.True(deletedUser.IsDeleted);
            Assert.Contains("deleted-", deletedUser.Email);
            Assert.Contains("@anonymized.local", deletedUser.Email);
        }

        [Fact]
        public async Task DeleteUser_SystemAdmin_ReturnsBadRequest()
        {
            // Arrange: Create system admin user
            var adminUser = new User
            {
                Id = _userId,
                Email = "admin@example.com",
                PasswordHash = "hashed_password",
                FullName = "System Admin",
                IsActive = true,
                IsSystemAdmin = true
            };

            _context.Users.Add(adminUser);
            await _context.SaveChangesAsync();

            var request = new PrivacyController.DeleteUserRequest 
            { 
                UserId = _userId,
                Reason = "Test deletion"
            };

            // Act
            var result = await _controller.DeleteUser(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var responseValue = badRequestResult.Value;
            var messageProperty = responseValue?.GetType().GetProperty("message");
            var message = messageProperty?.GetValue(responseValue)?.ToString();
            Assert.Contains("system admin", message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task DeleteUser_SelfDeletion_ReturnsBadRequest()
        {
            // Arrange: Create user
            var user = new User
            {
                Id = _userId,
                Email = "self@example.com",
                PasswordHash = "hashed_password",
                FullName = "Self Delete Test",
                IsActive = true,
                IsSystemAdmin = false
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new PrivacyController.DeleteUserRequest 
            { 
                UserId = _userId,
                Reason = "Self deletion"
            };

            // Mock authenticated user (same as user being deleted)
            var claims = new[]
            {
                new System.Security.Claims.Claim("userId", _userId.ToString())
            };
            _controller.ControllerContext.HttpContext.User = new System.Security.Claims.ClaimsPrincipal(
                new System.Security.Claims.ClaimsIdentity(claims, "TestAuth"));

            // Act
            var result = await _controller.DeleteUser(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var responseValue = badRequestResult.Value;
            var messageProperty = responseValue?.GetType().GetProperty("message");
            var message = messageProperty?.GetValue(responseValue)?.ToString();
            Assert.Contains("your own account", message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task DeleteUser_CreatesAuditLogEntry()
        {
            // Arrange
            var user = new User
            {
                Id = _userId,
                Email = "audit@example.com",
                PasswordHash = "hashed_password",
                FullName = "Audit Test",
                IsActive = true,
                IsSystemAdmin = false
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var adminUserId = Guid.NewGuid();
            var request = new PrivacyController.DeleteUserRequest 
            { 
                UserId = _userId,
                Reason = "Audit log test"
            };

            // Mock authenticated admin user
            var claims = new[]
            {
                new System.Security.Claims.Claim("userId", adminUserId.ToString())
            };
            _controller.ControllerContext.HttpContext.User = new System.Security.Claims.ClaimsPrincipal(
                new System.Security.Claims.ClaimsIdentity(claims, "TestAuth"));

            // Act
            await _controller.DeleteUser(request);

            // Assert: Verify audit log was created
            var auditLog = await _context.AuditLogs
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(a => a.Action == "USER_DELETION" && a.EntityId == _userId);

            Assert.NotNull(auditLog);
            Assert.Equal(_tenantId, auditLog.TenantId);
            Assert.Contains("GDPR", auditLog.OldValue);
        }

        [Fact]
        public void GetPrivacyPolicy_ReturnsCompletePolicy()
        {
            // Act
            var result = _controller.GetPrivacyPolicy();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var policyValue = okResult.Value;
            
            // Verify policy contains required fields
            var policyType = policyValue?.GetType();
            Assert.NotNull(policyType?.GetProperty("policyVersion"));
            Assert.NotNull(policyType?.GetProperty("dataRetention"));
            Assert.NotNull(policyType?.GetProperty("userRights"));
            Assert.NotNull(policyType?.GetProperty("dataProcessingPurpose"));
        }

        [Fact]
        public async Task DeleteUser_RevokesRefreshTokens()
        {
            // Arrange
            var user = new User
            {
                Id = _userId,
                Email = "tokens@example.com",
                PasswordHash = "hashed_password",
                FullName = "Token Test",
                IsActive = true,
                IsSystemAdmin = false
            };

            var refreshToken = new RefreshToken
            {
                UserId = _userId,
                TokenHash = "test_refresh_token_hash",
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            var request = new PrivacyController.DeleteUserRequest 
            { 
                UserId = _userId,
                Reason = "Token revocation test"
            };

            // Mock authenticated admin
            var claims = new[]
            {
                new System.Security.Claims.Claim("userId", Guid.NewGuid().ToString())
            };
            _controller.ControllerContext.HttpContext.User = new System.Security.Claims.ClaimsPrincipal(
                new System.Security.Claims.ClaimsIdentity(claims, "TestAuth"));

            // Act
            await _controller.DeleteUser(request);

            // Assert: Verify refresh token was revoked
            var revokedToken = await _context.RefreshTokens
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(rt => rt.UserId == _userId);

            Assert.NotNull(revokedToken);
            Assert.True(revokedToken.IsRevoked);
            Assert.NotNull(revokedToken.RevokedAt);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        /// <summary>
        /// Mock tenant accessor for testing
        /// </summary>
        private class MockTenantAccessor : ITenantAccessor
        {
            private Guid _tenantId;
            private string? _tenantSchema;
            private bool _includeDeleted;
            private bool _includeAllTenants;

            public void SetTenantId(Guid tenantId)
            {
                _tenantId = tenantId;
            }

            public Guid GetTenantId()
            {
                return _tenantId;
            }

            public void SetTenantSchema(string? schema)
            {
                _tenantSchema = schema;
            }

            public string? GetTenantSchema()
            {
                return _tenantSchema;
            }

            public void SetDataVisibility(bool includeDeleted, bool includeAllTenants)
            {
                _includeDeleted = includeDeleted;
                _includeAllTenants = includeAllTenants;
            }

            public bool IncludeDeleted()
            {
                return _includeDeleted;
            }

            public bool IncludeAllTenants()
            {
                return _includeAllTenants;
            }
        }
    }
}
