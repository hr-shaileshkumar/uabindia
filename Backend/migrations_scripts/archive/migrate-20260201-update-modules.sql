-- Update Modules table with new properties
-- Required for enhanced module metadata support

BEGIN TRANSACTION;

-- Add missing columns to Modules table
ALTER TABLE Modules
ADD DisplayName NVARCHAR(256) NULL,
    Description NVARCHAR(1024) NULL,
    ModuleType NVARCHAR(64) NULL DEFAULT 'business',
    Icon NVARCHAR(256) NULL,
    BasePath NVARCHAR(256) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    SortOrder INT NOT NULL DEFAULT 0,
    UpdatedAt DATETIME2 NULL;

-- Now populate the columns (after they exist)
UPDATE Modules
SET DisplayName = CASE ModuleKey
        WHEN 'hrms' THEN 'HRMS'
        WHEN 'payroll' THEN 'Payroll'
        WHEN 'reports' THEN 'Reports & Analytics'
        WHEN 'platform' THEN 'Platform Management'
        WHEN 'licensing' THEN 'Licensing & Integrations'
        WHEN 'security' THEN 'Security & Access'
        ELSE Name
    END
WHERE DisplayName IS NULL;

UPDATE Modules
SET Description = CASE ModuleKey
        WHEN 'hrms' THEN 'Human Resource Management - Employees, Attendance, Leave'
        WHEN 'payroll' THEN 'Salary Structures, Payroll Processing, Payslips, Statutory Compliance'
        WHEN 'reports' THEN 'HR Reports, Payroll Reports, Compliance Dashboards'
        WHEN 'platform' THEN 'Tenants, Companies, Projects, Users, Roles, Feature Flags, Audit Logs'
        WHEN 'licensing' THEN 'Module Catalog, Subscriptions, API Keys, Third-party Integrations'
        WHEN 'security' THEN 'Device Sessions, Password Policies, MFA, Security Monitoring'
    END;

UPDATE Modules
SET ModuleType = CASE ModuleKey
        WHEN 'hrms' THEN 'business'
        WHEN 'payroll' THEN 'business'
        WHEN 'reports' THEN 'business'
        WHEN 'platform' THEN 'platform'
        WHEN 'licensing' THEN 'licensing'
        WHEN 'security' THEN 'security'
        ELSE 'business'
    END
WHERE ModuleType IS NULL;

UPDATE Modules
SET Icon = CASE ModuleKey
        WHEN 'hrms' THEN 'Users'
        WHEN 'payroll' THEN 'DollarSign'
        WHEN 'reports' THEN 'BarChart'
        WHEN 'platform' THEN 'Settings'
        WHEN 'licensing' THEN 'Key'
        WHEN 'security' THEN 'Shield'
    END;

UPDATE Modules
SET BasePath = CASE ModuleKey
        WHEN 'hrms' THEN '/app/modules/hrms'
        WHEN 'payroll' THEN '/app/modules/payroll'
        WHEN 'reports' THEN '/app/modules/reports'
        WHEN 'platform' THEN '/app/platform'
        WHEN 'licensing' THEN '/app/licensing'
        WHEN 'security' THEN '/app/security'
    END;

UPDATE Modules
SET SortOrder = CASE ModuleKey
        WHEN 'hrms' THEN 1
        WHEN 'payroll' THEN 2
        WHEN 'reports' THEN 3
        WHEN 'platform' THEN 10
        WHEN 'licensing' THEN 20
        WHEN 'security' THEN 30
        ELSE 99
    END
WHERE SortOrder = 0;

COMMIT;
