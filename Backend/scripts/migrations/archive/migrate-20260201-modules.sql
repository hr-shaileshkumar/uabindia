-- Module subscription system migration
-- Add Modules and TenantModules tables for 4-layer ERP architecture

BEGIN TRANSACTION;

-- Module catalog table (no TenantId - global catalog)
CREATE TABLE Modules (
    ModuleKey NVARCHAR(64) NOT NULL PRIMARY KEY,
    DisplayName NVARCHAR(256) NOT NULL,
    Description NVARCHAR(1024) NULL,
    ModuleType NVARCHAR(64) NOT NULL, -- business / platform / licensing / security
    Icon NVARCHAR(256) NULL,
    BasePath NVARCHAR(256) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    SortOrder INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);

-- Tenant module subscriptions (enables per-tenant module access)
CREATE TABLE TenantModules (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    TenantId UNIQUEIDENTIFIER NOT NULL,
    ModuleKey NVARCHAR(64) NOT NULL,
    IsEnabled BIT NOT NULL DEFAULT 1,
    EnabledAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    DisabledAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CreatedBy UNIQUEIDENTIFIER NULL,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_TenantModules_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(Id),
    CONSTRAINT FK_TenantModules_Modules FOREIGN KEY (ModuleKey) REFERENCES Modules(ModuleKey)
);

-- Unique constraint: one subscription per tenant per module
CREATE UNIQUE INDEX IX_TenantModules_Tenant_Module ON TenantModules (TenantId, ModuleKey);

-- Seed module catalog (7 modules in 4 layers)
INSERT INTO Modules (ModuleKey, DisplayName, Description, ModuleType, Icon, BasePath, IsActive, SortOrder)
VALUES 
    -- Business Modules (shown first to users)
    ('hrms', 'HRMS', 'Human Resource Management - Employees, Attendance, Leave', 'business', 'Users', '/app/modules/hrms', 1, 1),
    ('payroll', 'Payroll', 'Salary Structures, Payroll Processing, Payslips, Statutory Compliance', 'business', 'DollarSign', '/app/modules/payroll', 1, 2),
    ('reports', 'Reports & Analytics', 'HR Reports, Payroll Reports, Compliance Dashboards', 'business', 'BarChart', '/app/modules/reports', 1, 3),
    
    -- Platform Layer (admin-only, system-level)
    ('platform', 'Platform Management', 'Tenants, Companies, Projects, Users, Roles, Feature Flags, Audit Logs', 'platform', 'Settings', '/app/platform', 1, 10),
    
    -- Licensing Layer (admin-only, product control)
    ('licensing', 'Licensing & Integrations', 'Module Catalog, Subscriptions, API Keys, Third-party Integrations', 'licensing', 'Key', '/app/licensing', 1, 20),
    
    -- Security Layer (admin-only, identity & security)
    ('security', 'Security & Access', 'Device Sessions, Password Policies, MFA, Security Monitoring', 'security', 'Shield', '/app/security', 1, 30);

-- Grant demo tenant access to all modules
DECLARE @DemoTenantId UNIQUEIDENTIFIER;
SELECT @DemoTenantId = Id FROM Tenants WHERE Subdomain = 'demo';

IF @DemoTenantId IS NOT NULL
BEGIN
    INSERT INTO TenantModules (TenantId, ModuleKey, IsEnabled, EnabledAt)
    VALUES 
        (@DemoTenantId, 'hrms', 1, SYSUTCDATETIME()),
        (@DemoTenantId, 'payroll', 1, SYSUTCDATETIME()),
        (@DemoTenantId, 'reports', 1, SYSUTCDATETIME()),
        (@DemoTenantId, 'platform', 1, SYSUTCDATETIME()),
        (@DemoTenantId, 'licensing', 1, SYSUTCDATETIME()),
        (@DemoTenantId, 'security', 1, SYSUTCDATETIME());
END

COMMIT;

-- Verification query (run separately)
-- SELECT m.ModuleKey, m.DisplayName, m.ModuleType, tm.IsEnabled
-- FROM Modules m
-- LEFT JOIN TenantModules tm ON m.ModuleKey = tm.ModuleKey AND tm.TenantId = (SELECT Id FROM Tenants WHERE Subdomain = 'demo')
-- ORDER BY m.SortOrder;
