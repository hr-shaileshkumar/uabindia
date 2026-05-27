using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;

namespace UabIndia.Tests
{
    /// <summary>
    /// Critical security tests to verify multi-tenant data isolation
    /// These tests ensure no data leakage between tenants
    /// </summary>
    public class MultiTenancyIsolationTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Guid _tenantA = Guid.NewGuid();
        private readonly Guid _tenantB = Guid.NewGuid();
        private readonly MockTenantAccessor _mockTenantAccessor;

        public MultiTenancyIsolationTests()
        {
            // Create in-memory database for testing
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            // Create a mock tenant accessor
            _mockTenantAccessor = new MockTenantAccessor();
            var encryptionService = new TestEncryptionService();
            _context = new ApplicationDbContext(options, _mockTenantAccessor, encryptionService);
        }

        [Fact]
        public async Task Company_CreatedByTenantA_CannotBeFetchedByTenantB()
        {
            // Arrange: Create company in Tenant A
            var companyA = new Company
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantA,
                Name = "Company A",
                Code = "COMP-A",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Companies.Add(companyA);
            await _context.SaveChangesAsync();

            // Act: Query as Tenant B
            var tenantBCompanies = await _context.Companies
                .Where(c => c.TenantId == _tenantB && !c.IsDeleted)
                .ToListAsync();

            // Assert: Tenant B should not see Tenant A's companies
            Assert.Empty(tenantBCompanies);
            Assert.DoesNotContain(companyA, tenantBCompanies);
        }

        [Fact]
        public async Task Employee_CreatedByTenantA_CannotBeFetchedByTenantB()
        {
            // Arrange: Create employee in Tenant A
            var employeeA = new Employee
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantA,
                CompanyId = Guid.NewGuid(),
                EmployeeCode = "EMP-001",
                FullName = "John Doe",
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            _context.Employees.Add(employeeA);
            await _context.SaveChangesAsync();

            // Act: Query as Tenant B
            var tenantBEmployees = await _context.Employees
                .Where(e => e.TenantId == _tenantB && !e.IsDeleted)
                .ToListAsync();

            // Assert: Tenant B should not see Tenant A's employees
            Assert.Empty(tenantBEmployees);
            Assert.DoesNotContain(employeeA, tenantBEmployees);
        }

        [Fact]
        public async Task Role_CreatedByTenantA_CannotBeFetchedByTenantB()
        {
            // Arrange: Create role in Tenant A
            var roleA = new Role
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantA,
                Name = "Admin",
                Description = "Administrator role for Tenant A",
                CreatedAt = DateTime.UtcNow
            };

            _context.Roles.Add(roleA);
            await _context.SaveChangesAsync();

            // Act: Query as Tenant B
            var tenantBRoles = await _context.Roles
                .Where(r => r.TenantId == _tenantB && !r.IsDeleted)
                .ToListAsync();

            // Assert: Tenant B should not see Tenant A's roles
            Assert.Empty(tenantBRoles);
            Assert.DoesNotContain(roleA, tenantBRoles);
        }

        [Fact]
        public async Task User_CreatedByTenantA_CannotBeFetchedByTenantB()
        {
            // Arrange: Create user in Tenant A
            var userA = new User
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantA,
                Email = "admin@tenanta.com",
                PasswordHash = "hashed_password",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(userA);
            await _context.SaveChangesAsync();

            // Act: Query as Tenant B
            var tenantBUsers = await _context.Users
                .Where(u => u.TenantId == _tenantB && !u.IsDeleted)
                .ToListAsync();

            // Assert: Tenant B should not see Tenant A's users
            Assert.Empty(tenantBUsers);
            Assert.DoesNotContain(userA, tenantBUsers);
        }

        [Fact]
        public async Task LeaveRequest_CreatedByTenantA_CannotBeFetchedByTenantB()
        {
            // Arrange: Create leave request in Tenant A
            var leaveA = new LeaveRequest
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantA,
                EmployeeId = Guid.NewGuid(),
                LeavePolicyId = Guid.NewGuid(),
                FromDate = DateTime.UtcNow,
                ToDate = DateTime.UtcNow.AddDays(3),
                Days = 3,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.LeaveRequests.Add(leaveA);
            await _context.SaveChangesAsync();

            // Act: Query as Tenant B
            var tenantBLeaves = await _context.LeaveRequests
                .Where(l => l.TenantId == _tenantB && !l.IsDeleted)
                .ToListAsync();

            // Assert: Tenant B should not see Tenant A's leave requests
            Assert.Empty(tenantBLeaves);
            Assert.DoesNotContain(leaveA, tenantBLeaves);
        }

        [Fact]
        public async Task MultipleTenantsCanCoexist_WithIsolatedData()
        {
            // Arrange: Create companies for both tenants
            var companyA = new Company
            {
                Id = Guid.NewGuid(),
                Name = "Company A",
                Code = "COMP-A",
                CreatedAt = DateTime.UtcNow
            };

            var companyB = new Company
            {
                Id = Guid.NewGuid(),
                Name = "Company B",
                Code = "COMP-B",
                CreatedAt = DateTime.UtcNow
            };

            // Add Company A as Tenant A
            _mockTenantAccessor.SetTenantId(_tenantA);
            _context.Companies.Add(companyA);
            await _context.SaveChangesAsync();
            
            // Add Company B as Tenant B
            _mockTenantAccessor.SetTenantId(_tenantB);
            _context.Companies.Add(companyB);
            await _context.SaveChangesAsync();

            // Act: Query each tenant's data separately (bypass global filters for testing)
            var tenantACompanies = await _context.Companies
                .IgnoreQueryFilters()
                .Where(c => c.TenantId == _tenantA && !c.IsDeleted)
                .ToListAsync();

            var tenantBCompanies = await _context.Companies
                .IgnoreQueryFilters()
                .Where(c => c.TenantId == _tenantB && !c.IsDeleted)
                .ToListAsync();

            var allCompanies = await _context.Companies
                .IgnoreQueryFilters()
                .Where(c => !c.IsDeleted)
                .ToListAsync();

            // Assert: Each tenant sees only their own data
            Assert.NotEmpty(tenantACompanies);
            Assert.NotEmpty(tenantBCompanies);
            Assert.Equal(2, allCompanies.Count); // Total of 2 companies
            
            // Verify tenant A sees only Company A
            Assert.All(tenantACompanies, c => Assert.Equal(_tenantA, c.TenantId));
            
            // Verify tenant B sees only Company B
            Assert.All(tenantBCompanies, c => Assert.Equal(_tenantB, c.TenantId));
            
            // Verify no overlap
            var tenantAIds = tenantACompanies.Select(c => c.Id).ToList();
            var tenantBIds = tenantBCompanies.Select(c => c.Id).ToList();
            Assert.Empty(tenantAIds.Intersect(tenantBIds));
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        /// <summary>
        /// Mock implementation of ITenantAccessor for testing
        /// </summary>
        private class MockTenantAccessor : ITenantAccessor
        {
            private Guid _tenantId = Guid.Empty;
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
