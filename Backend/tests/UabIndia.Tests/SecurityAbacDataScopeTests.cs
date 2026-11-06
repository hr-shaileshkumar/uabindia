using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class SecurityAbacDataScopeTests : IDisposable
    {
        private readonly ApplicationDbContext _db;
        private readonly TestTenantAccessor _tenantAccessor;
        private readonly DataScopeEvaluator _evaluator;
        private readonly LocalStorageProvider _storageProvider;
        private readonly BusinessRuleEvaluator _ruleEvaluator;
        private readonly Guid _tenantId = Guid.NewGuid();
        private readonly string _tempStorageDir;

        public SecurityAbacDataScopeTests()
        {
            _tempStorageDir = Path.Combine(Path.GetTempPath(), "uab_test_storage_" + Guid.NewGuid().ToString("N"));
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
            _evaluator = new DataScopeEvaluator(_db);
            _storageProvider = new LocalStorageProvider(config, NullLogger<LocalStorageProvider>.Instance);
            _ruleEvaluator = new BusinessRuleEvaluator();
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
        public async Task DataScopeEvaluator_SuperAdmin_BypassesAllScopeRestrictions()
        {
            var userContext = new DataScopeContext
            {
                TenantId = _tenantId,
                UserId = Guid.NewGuid(),
                IsSuperAdmin = true
            };

            var record = new EntityScopeTarget
            {
                CompanyId = Guid.NewGuid(),
                DepartmentId = Guid.NewGuid(),
                OwnerUserId = Guid.NewGuid()
            };

            var canAccess = await _evaluator.CanAccessRecordAsync(userContext, "finance", "JournalEntry", "read", record);
            Assert.True(canAccess);
        }

        [Fact]
        public async Task DataScopeEvaluator_CompanyScope_BlocksCrossCompanyRecordAccess()
        {
            var userId = Guid.NewGuid();
            var userCompanyId = Guid.NewGuid();
            var otherCompanyId = Guid.NewGuid();
            var roleId = Guid.NewGuid();

            // Set up role and user role
            _db.UserRoles.Add(new UserRole { TenantId = _tenantId, UserId = userId, RoleId = roleId });

            // Create Company-level DataScope
            var companyScope = new DataScope
            {
                TenantId = _tenantId,
                Name = "Company Finance Scope",
                Level = DataScopeLevel.Company,
                IsActive = true
            };
            _db.DataScopes.Add(companyScope);

            _db.RoleDataScopes.Add(new RoleDataScope
            {
                TenantId = _tenantId,
                RoleId = roleId,
                DataScopeId = companyScope.Id,
                DataScope = companyScope,
                ModuleKey = "finance"
            });
            await _db.SaveChangesAsync();

            var userContext = new DataScopeContext
            {
                TenantId = _tenantId,
                UserId = userId,
                UserCompanyId = userCompanyId,
                IsAdmin = false,
                IsSuperAdmin = false
            };

            // 1. Same company target record -> Accessible
            var sameCompanyRecord = new EntityScopeTarget { CompanyId = userCompanyId };
            var allowed = await _evaluator.CanAccessRecordAsync(userContext, "finance", "Invoice", "read", sameCompanyRecord);
            Assert.True(allowed);

            // 2. Different company target record -> Denied
            var otherCompanyRecord = new EntityScopeTarget { CompanyId = otherCompanyId };
            var denied = await _evaluator.CanAccessRecordAsync(userContext, "finance", "Invoice", "read", otherCompanyRecord);
            Assert.False(denied);
        }

        [Fact]
        public async Task DataScopeEvaluator_DepartmentScope_RestrictsAccessToMatchingDepartment()
        {
            var userId = Guid.NewGuid();
            var userDeptId = Guid.NewGuid();
            var otherDeptId = Guid.NewGuid();
            var roleId = Guid.NewGuid();

            _db.UserRoles.Add(new UserRole { TenantId = _tenantId, UserId = userId, RoleId = roleId });

            var deptScope = new DataScope
            {
                TenantId = _tenantId,
                Name = "Department HR Scope",
                Level = DataScopeLevel.Department,
                IsActive = true
            };
            _db.DataScopes.Add(deptScope);

            _db.RoleDataScopes.Add(new RoleDataScope
            {
                TenantId = _tenantId,
                RoleId = roleId,
                DataScopeId = deptScope.Id,
                DataScope = deptScope,
                ModuleKey = "hrms"
            });
            await _db.SaveChangesAsync();

            var userContext = new DataScopeContext
            {
                TenantId = _tenantId,
                UserId = userId,
                UserDepartmentId = userDeptId
            };

            var sameDeptRecord = new EntityScopeTarget { DepartmentId = userDeptId };
            var otherDeptRecord = new EntityScopeTarget { DepartmentId = otherDeptId };

            Assert.True(await _evaluator.CanAccessRecordAsync(userContext, "hrms", "LeaveRequest", "read", sameDeptRecord));
            Assert.False(await _evaluator.CanAccessRecordAsync(userContext, "hrms", "LeaveRequest", "read", otherDeptRecord));
        }

        [Fact]
        public async Task DataScopeEvaluator_SelfScope_OnlyAllowsOwnerOrAssignedEmployee()
        {
            var userId = Guid.NewGuid();
            var employeeId = Guid.NewGuid();
            var roleId = Guid.NewGuid();

            _db.UserRoles.Add(new UserRole { TenantId = _tenantId, UserId = userId, RoleId = roleId });

            var selfScope = new DataScope
            {
                TenantId = _tenantId,
                Name = "Self Scope",
                Level = DataScopeLevel.Self,
                IsActive = true
            };
            _db.DataScopes.Add(selfScope);

            _db.RoleDataScopes.Add(new RoleDataScope
            {
                TenantId = _tenantId,
                RoleId = roleId,
                DataScopeId = selfScope.Id,
                DataScope = selfScope
            });
            await _db.SaveChangesAsync();

            var userContext = new DataScopeContext
            {
                TenantId = _tenantId,
                UserId = userId,
                EmployeeId = employeeId
            };

            var myRecord = new EntityScopeTarget { OwnerUserId = userId };
            var myEmployeeRecord = new EntityScopeTarget { EmployeeId = employeeId };
            var strangerRecord = new EntityScopeTarget { OwnerUserId = Guid.NewGuid(), EmployeeId = Guid.NewGuid() };

            Assert.True(await _evaluator.CanAccessRecordAsync(userContext, "hrms", "Payslip", "read", myRecord));
            Assert.True(await _evaluator.CanAccessRecordAsync(userContext, "hrms", "Payslip", "read", myEmployeeRecord));
            Assert.False(await _evaluator.CanAccessRecordAsync(userContext, "hrms", "Payslip", "read", strangerRecord));
        }

        [Fact]
        public async Task MultiTenant_DashboardDefinition_IsIsolatedBetweenTenants()
        {
            var tenantA = Guid.NewGuid();
            var tenantB = Guid.NewGuid();

            var dashA = new DashboardDefinition
            {
                TenantId = tenantA,
                DashboardKey = "executive_cockpit",
                Title = "Tenant A Cockpit",
                ModuleKey = "general"
            };

            var dashB = new DashboardDefinition
            {
                TenantId = tenantB,
                DashboardKey = "executive_cockpit",
                Title = "Tenant B Cockpit",
                ModuleKey = "general"
            };

            _db.DashboardDefinitions.AddRange(dashA, dashB);
            await _db.SaveChangesAsync();

            // Act as Tenant A -> should only see Tenant A's dashboard
            _tenantAccessor.SetTenantId(tenantA);
            var tenantAItems = await _db.DashboardDefinitions.ToListAsync();

            Assert.Single(tenantAItems);
            Assert.Equal("Tenant A Cockpit", tenantAItems[0].Title);
            Assert.DoesNotContain(dashB, tenantAItems);

            // Act as Tenant B -> should only see Tenant B's dashboard
            _tenantAccessor.SetTenantId(tenantB);
            var tenantBItems = await _db.DashboardDefinitions.ToListAsync();

            Assert.Single(tenantBItems);
            Assert.Equal("Tenant B Cockpit", tenantBItems[0].Title);
            Assert.DoesNotContain(dashA, tenantBItems);
        }

        [Fact]
        public async Task LocalStorageProvider_UploadsAndDownloads_PartitionedByTenant()
        {
            var content = "UABIndia Enterprise Confidential Document";
            using var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));

            var key = await _storageProvider.UploadFileAsync(stream, "confidential.txt", "text/plain", _tenantId, "finance/invoices");

            Assert.Contains(_tenantId.ToString("N"), key);
            Assert.Contains("confidential.txt", key);

            string downloadedText;
            using (var downloaded = await _storageProvider.DownloadFileAsync(key, _tenantId))
            using (var reader = new StreamReader(downloaded))
            {
                downloadedText = await reader.ReadToEndAsync();
            }

            Assert.Equal(content, downloadedText);

            var deleted = await _storageProvider.DeleteFileAsync(key, _tenantId);
            Assert.True(deleted);
        }

        [Fact]
        public void BusinessRuleEvaluator_EvaluatesConditionsAndRules_Safely()
        {
            var context = new Dictionary<string, object?>
            {
                ["baseSalary"] = 50000.0,
                ["totalAmount"] = 125000.0,
                ["status"] = "Approved"
            };

            // Condition evaluation
            var isLargeOrder = _ruleEvaluator.EvaluateCondition("totalAmount > 50000", context);
            Assert.True(isLargeOrder);

            var isSmallOrder = _ruleEvaluator.EvaluateCondition("totalAmount < 10000", context);
            Assert.False(isSmallOrder);

            var isApproved = _ruleEvaluator.EvaluateCondition("status == 'Approved'", context);
            Assert.True(isApproved);

            // Rule evaluation
            var rules = new List<UabIndia.Core.Metadata.RuleDefinition>
            {
                new()
                {
                    Condition = "totalAmount > 100000",
                    ActionType = "require_approval",
                    TargetField = "ApproverId",
                    ActionValue = "Director"
                }
            };

            var results = _ruleEvaluator.EvaluateRules(rules, context);
            Assert.Single(results);
            Assert.True(results[0].IsConditionMet);
            Assert.Equal("Director", results[0].ActionValue);
        }
    }
}
