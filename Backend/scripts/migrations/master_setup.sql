-- HRMS Master Setup (Module-wise, Idempotent)
-- Applies Core + Auth + HRMS + Payroll + Reports modules in a single run.
-- Safe to re-run on existing databases (creates missing objects and columns only).

SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    -- ==============================
    -- Meta: Modules & Migrations
    -- ==============================
    IF OBJECT_ID('dbo.Modules', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Modules (
            ModuleKey NVARCHAR(64) NOT NULL PRIMARY KEY,
            Name NVARCHAR(128) NOT NULL,
            IsEnabled BIT NOT NULL DEFAULT 1,
            Version NVARCHAR(32) NOT NULL DEFAULT '0001',
            LicensedTo NVARCHAR(256) NULL,
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
    END

    IF OBJECT_ID('dbo.ModuleMigrations', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.ModuleMigrations (
            Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
            ModuleKey NVARCHAR(64) NOT NULL,
            Version NVARCHAR(32) NOT NULL,
            AppliedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            CONSTRAINT UQ_ModuleMigrations_Module_Version UNIQUE (ModuleKey, Version)
        );
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.Modules WHERE ModuleKey = 'core')
        INSERT INTO dbo.Modules (ModuleKey, Name, IsEnabled, Version) VALUES ('core', 'Core/Tenant', 1, '0001');
    IF NOT EXISTS (SELECT 1 FROM dbo.Modules WHERE ModuleKey = 'auth')
        INSERT INTO dbo.Modules (ModuleKey, Name, IsEnabled, Version) VALUES ('auth', 'Auth', 1, '0001');
    IF NOT EXISTS (SELECT 1 FROM dbo.Modules WHERE ModuleKey = 'hrms')
        INSERT INTO dbo.Modules (ModuleKey, Name, IsEnabled, Version) VALUES ('hrms', 'HRMS', 1, '0001');
    IF NOT EXISTS (SELECT 1 FROM dbo.Modules WHERE ModuleKey = 'payroll')
        INSERT INTO dbo.Modules (ModuleKey, Name, IsEnabled, Version) VALUES ('payroll', 'Payroll', 1, '0001');
    IF NOT EXISTS (SELECT 1 FROM dbo.Modules WHERE ModuleKey = 'reports')
        INSERT INTO dbo.Modules (ModuleKey, Name, IsEnabled, Version) VALUES ('reports', 'Reports', 1, '0001');

    -- ==============================
    -- Module: Core/Tenant (0001)
    -- ==============================
    IF NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'core' AND Version = '0001')
    BEGIN
        IF OBJECT_ID('dbo.Tenants', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Tenants (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                Subdomain NVARCHAR(128) NOT NULL UNIQUE,
                Name NVARCHAR(256) NOT NULL,
                IsActive BIT NOT NULL DEFAULT 1,
                FeatureFlags NVARCHAR(MAX) NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.Tenants', 'FeatureFlags') IS NULL
                ALTER TABLE dbo.Tenants ADD FeatureFlags NVARCHAR(MAX) NULL;
            IF COL_LENGTH('dbo.Tenants', 'IsActive') IS NULL
                ALTER TABLE dbo.Tenants ADD IsActive BIT NOT NULL DEFAULT 1;
            IF COL_LENGTH('dbo.Tenants', 'IsDeleted') IS NULL
                ALTER TABLE dbo.Tenants ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        IF OBJECT_ID('dbo.Companies', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Companies (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                Name NVARCHAR(256) NOT NULL,
                LegalName NVARCHAR(512) NULL,
                IsActive BIT NOT NULL DEFAULT 1,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_Companies_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id)
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.Companies', 'LegalName') IS NULL
                ALTER TABLE dbo.Companies ADD LegalName NVARCHAR(512) NULL;
            IF COL_LENGTH('dbo.Companies', 'IsActive') IS NULL
                ALTER TABLE dbo.Companies ADD IsActive BIT NOT NULL DEFAULT 1;
        END

        IF OBJECT_ID('dbo.Projects', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Projects (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                CompanyId UNIQUEIDENTIFIER NOT NULL,
                ProjectCode NVARCHAR(50) NOT NULL DEFAULT '',
                Name NVARCHAR(256) NOT NULL,
                Description NVARCHAR(MAX) NULL,
                ProjectType NVARCHAR(50) NOT NULL DEFAULT 'Internal',
                Priority NVARCHAR(20) NOT NULL DEFAULT 'Medium',
                Status NVARCHAR(30) NOT NULL DEFAULT 'Planned',
                IsActive BIT NOT NULL DEFAULT 1,
                StartDate DATETIME2 NULL,
                EndDate DATETIME2 NULL,
                ActualStartDate DATETIME2 NULL,
                ActualEndDate DATETIME2 NULL,
                Budget DECIMAL(18,2) NULL,
                ActualCost DECIMAL(18,2) NULL,
                CurrencyCode CHAR(3) NOT NULL DEFAULT 'INR',
                ClientName NVARCHAR(256) NULL,
                ContractNumber NVARCHAR(100) NULL,
                BillingType NVARCHAR(30) NULL,
                CompletionPercentage INT NOT NULL DEFAULT 0,
                ProjectManagerId UNIQUEIDENTIFIER NULL,
                Location NVARCHAR(256) NULL,
                UpdatedBy UNIQUEIDENTIFIER NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_Projects_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies(Id)
            );
        END

        IF OBJECT_ID('dbo.TenantModules', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.TenantModules (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                ModuleKey NVARCHAR(64) NOT NULL,
                IsEnabled BIT NOT NULL DEFAULT 1,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_TenantModules_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id)
            );
        END

        IF OBJECT_ID('dbo.FeatureFlags', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.FeatureFlags (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                FeatureKey NVARCHAR(256) NOT NULL,
                IsEnabled BIT NOT NULL DEFAULT 0,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.FeatureFlags', 'UpdatedAt') IS NULL
                ALTER TABLE dbo.FeatureFlags ADD UpdatedAt DATETIME2 NULL;
            IF COL_LENGTH('dbo.FeatureFlags', 'CreatedBy') IS NULL
                ALTER TABLE dbo.FeatureFlags ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.FeatureFlags', 'IsDeleted') IS NULL
                ALTER TABLE dbo.FeatureFlags ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TenantModules_Tenant_Module' AND object_id = OBJECT_ID('dbo.TenantModules'))
            CREATE UNIQUE INDEX IX_TenantModules_Tenant_Module ON dbo.TenantModules (TenantId, ModuleKey);

        IF NOT EXISTS (SELECT 1 FROM dbo.Tenants)
        BEGIN
            INSERT INTO dbo.Tenants (Id, Subdomain, Name, IsActive, CreatedAt)
            VALUES (NEWID(), 'erp', 'UAB India ERP', 1, SYSUTCDATETIME());
        END

        DECLARE @DemoTenantId UNIQUEIDENTIFIER;
        SELECT TOP 1 @DemoTenantId = Id FROM dbo.Tenants WHERE Subdomain = 'demo';

        IF @DemoTenantId IS NOT NULL
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM dbo.TenantModules WHERE TenantId = @DemoTenantId AND ModuleKey = 'core')
                INSERT INTO dbo.TenantModules (TenantId, ModuleKey, IsEnabled) VALUES (@DemoTenantId, 'core', 1);
            IF NOT EXISTS (SELECT 1 FROM dbo.TenantModules WHERE TenantId = @DemoTenantId AND ModuleKey = 'hrms')
                INSERT INTO dbo.TenantModules (TenantId, ModuleKey, IsEnabled) VALUES (@DemoTenantId, 'hrms', 1);
            IF NOT EXISTS (SELECT 1 FROM dbo.TenantModules WHERE TenantId = @DemoTenantId AND ModuleKey = 'payroll')
                INSERT INTO dbo.TenantModules (TenantId, ModuleKey, IsEnabled) VALUES (@DemoTenantId, 'payroll', 1);
            IF NOT EXISTS (SELECT 1 FROM dbo.TenantModules WHERE TenantId = @DemoTenantId AND ModuleKey = 'reports')
                INSERT INTO dbo.TenantModules (TenantId, ModuleKey, IsEnabled) VALUES (@DemoTenantId, 'reports', 1);
        END

        INSERT INTO dbo.ModuleMigrations (ModuleKey, Version) VALUES ('core', '0001');
    END

    -- ==============================
    -- Module: Auth (0001)
    -- ==============================
    IF NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'auth' AND Version = '0001')
    BEGIN
        IF OBJECT_ID('dbo.Users', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Users (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                Email NVARCHAR(256) NOT NULL,
                PasswordHash NVARCHAR(512) NOT NULL,
                FullName NVARCHAR(256) NULL,
                IsSystemAdmin BIT NOT NULL DEFAULT 0,
                IsActive BIT NOT NULL DEFAULT 1,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_Users_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id)
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.Users', 'IsSystemAdmin') IS NULL
                ALTER TABLE dbo.Users ADD IsSystemAdmin BIT NOT NULL DEFAULT 0;
            IF COL_LENGTH('dbo.Users', 'IsActive') IS NULL
                ALTER TABLE dbo.Users ADD IsActive BIT NOT NULL DEFAULT 1;
            IF COL_LENGTH('dbo.Users', 'Email') IS NULL
                ALTER TABLE dbo.Users ADD Email NVARCHAR(256) NOT NULL DEFAULT '';
            IF COL_LENGTH('dbo.Users', 'PasswordHash') IS NULL
                ALTER TABLE dbo.Users ADD PasswordHash NVARCHAR(512) NOT NULL DEFAULT '';
            IF COL_LENGTH('dbo.Users', 'FullName') IS NULL
                ALTER TABLE dbo.Users ADD FullName NVARCHAR(256) NULL;
        END

        IF OBJECT_ID('dbo.Roles', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Roles (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                Name NVARCHAR(128) NOT NULL,
                Description NVARCHAR(512) NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT UQ_Roles_Tenant_Name UNIQUE (TenantId, Name)
            );
        END

        IF OBJECT_ID('dbo.UserRoles', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.UserRoles (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                UserId UNIQUEIDENTIFIER NOT NULL,
                RoleId UNIQUEIDENTIFIER NOT NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_UserRoles_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
                CONSTRAINT FK_UserRoles_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id)
            );
        END

        IF OBJECT_ID('dbo.RefreshTokens', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.RefreshTokens (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                UserId UNIQUEIDENTIFIER NOT NULL,
                TokenHash NVARCHAR(512) NOT NULL,
                DeviceId NVARCHAR(256) NULL,
                ExpiresAt DATETIME2 NOT NULL,
                IsRevoked BIT NOT NULL DEFAULT 0,
                RevokedAt DATETIME2 NULL,
                ParentTokenId UNIQUEIDENTIFIER NULL,
                ReplacedByTokenId UNIQUEIDENTIFIER NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.RefreshTokens', 'UpdatedAt') IS NULL
                ALTER TABLE dbo.RefreshTokens ADD UpdatedAt DATETIME2 NULL;
            IF COL_LENGTH('dbo.RefreshTokens', 'CreatedBy') IS NULL
                ALTER TABLE dbo.RefreshTokens ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.RefreshTokens', 'IsDeleted') IS NULL
                ALTER TABLE dbo.RefreshTokens ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        IF OBJECT_ID('dbo.AuditLogs', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.AuditLogs (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                EntityName NVARCHAR(256) NOT NULL,
                EntityId UNIQUEIDENTIFIER NULL,
                Action NVARCHAR(64) NOT NULL,
                OldValue NVARCHAR(MAX) NULL,
                NewValue NVARCHAR(MAX) NULL,
                PerformedBy UNIQUEIDENTIFIER NULL,
                PerformedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                Ip NVARCHAR(64) NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.AuditLogs', 'CreatedAt') IS NULL
                ALTER TABLE dbo.AuditLogs ADD CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME();
            IF COL_LENGTH('dbo.AuditLogs', 'UpdatedAt') IS NULL
                ALTER TABLE dbo.AuditLogs ADD UpdatedAt DATETIME2 NULL;
            IF COL_LENGTH('dbo.AuditLogs', 'CreatedBy') IS NULL
                ALTER TABLE dbo.AuditLogs ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.AuditLogs', 'IsDeleted') IS NULL
                ALTER TABLE dbo.AuditLogs ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_Tenant_Email' AND object_id = OBJECT_ID('dbo.Users'))
            CREATE UNIQUE INDEX IX_Users_Tenant_Email ON dbo.Users (TenantId, Email);

        INSERT INTO dbo.ModuleMigrations (ModuleKey, Version) VALUES ('auth', '0001');
    END

    -- ==============================
    -- Module: HRMS (0001)
    -- ==============================
    IF NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'hrms' AND Version = '0001')
    BEGIN
        IF OBJECT_ID('dbo.Employees', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Employees (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                CompanyId UNIQUEIDENTIFIER NOT NULL,
                ProjectId UNIQUEIDENTIFIER NULL,
                FullName NVARCHAR(256) NOT NULL,
                EmployeeCode NVARCHAR(64) NULL,
                Status NVARCHAR(64) NULL,
                ManagerId UNIQUEIDENTIFIER NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_Employees_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies(Id)
            );
        END

        IF OBJECT_ID('dbo.AttendanceRecords', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.AttendanceRecords (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                EmployeeId UNIQUEIDENTIFIER NOT NULL,
                ProjectId UNIQUEIDENTIFIER NULL,
                PunchType NVARCHAR(16) NOT NULL,
                Timestamp DATETIME2 NOT NULL,
                Latitude DECIMAL(10,7) NULL,
                Longitude DECIMAL(10,7) NULL,
                DeviceId NVARCHAR(128) NULL,
                Source NVARCHAR(64) NULL,
                GeoValidated BIT NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_Attendance_Employees FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees(Id)
            );
        END

        IF OBJECT_ID('dbo.AttendanceCorrections', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.AttendanceCorrections (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                EmployeeId UNIQUEIDENTIFIER NOT NULL,
                OriginalAttendanceId UNIQUEIDENTIFIER NULL,
                ProposedTimestamp DATETIME2 NOT NULL,
                Reason NVARCHAR(1024) NULL,
                Status NVARCHAR(32) NOT NULL DEFAULT 'Draft',
                ApprovedBy UNIQUEIDENTIFIER NULL,
                ApprovedAt DATETIME2 NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END

        IF OBJECT_ID('dbo.LeavePolicies', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.LeavePolicies (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                Name NVARCHAR(256) NOT NULL,
                Type NVARCHAR(64) NOT NULL,
                EntitlementPerYear DECIMAL(8,2) NOT NULL,
                CarryForwardAllowed BIT NOT NULL DEFAULT 0,
                MaxCarryForward DECIMAL(8,2) NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END

        IF OBJECT_ID('dbo.EmployeeLeaves', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.EmployeeLeaves (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                EmployeeId UNIQUEIDENTIFIER NOT NULL,
                LeavePolicyId UNIQUEIDENTIFIER NOT NULL,
                Year INT NOT NULL,
                Entitled DECIMAL(8,2) NOT NULL,
                Taken DECIMAL(8,2) NOT NULL DEFAULT 0,
                Balance DECIMAL(8,2) NOT NULL,
                UpdatedAt DATETIME2 NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.EmployeeLeaves', 'CreatedBy') IS NULL
                ALTER TABLE dbo.EmployeeLeaves ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.EmployeeLeaves', 'IsDeleted') IS NULL
                ALTER TABLE dbo.EmployeeLeaves ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        IF OBJECT_ID('dbo.LeaveRequests', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.LeaveRequests (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                EmployeeId UNIQUEIDENTIFIER NOT NULL,
                LeavePolicyId UNIQUEIDENTIFIER NOT NULL,
                FromDate DATE NOT NULL,
                ToDate DATE NOT NULL,
                Days DECIMAL(8,2) NOT NULL,
                Status NVARCHAR(32) NOT NULL DEFAULT 'Pending',
                ApprovedBy UNIQUEIDENTIFIER NULL,
                ApprovedAt DATETIME2 NULL,
                Reason NVARCHAR(1024) NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.LeaveRequests', 'UpdatedAt') IS NULL
                ALTER TABLE dbo.LeaveRequests ADD UpdatedAt DATETIME2 NULL;
            IF COL_LENGTH('dbo.LeaveRequests', 'CreatedBy') IS NULL
                ALTER TABLE dbo.LeaveRequests ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.LeaveRequests', 'IsDeleted') IS NULL
                ALTER TABLE dbo.LeaveRequests ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Employees_Tenant_Company' AND object_id = OBJECT_ID('dbo.Employees'))
            CREATE INDEX IX_Employees_Tenant_Company ON dbo.Employees (TenantId, CompanyId);

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Attendance_Tenant_Employee_Timestamp' AND object_id = OBJECT_ID('dbo.AttendanceRecords'))
            CREATE INDEX IX_Attendance_Tenant_Employee_Timestamp ON dbo.AttendanceRecords (TenantId, EmployeeId, Timestamp);

        INSERT INTO dbo.ModuleMigrations (ModuleKey, Version) VALUES ('hrms', '0001');
    END

    -- ==============================
    -- Module: Payroll (0001)
    -- ==============================
    IF NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'payroll' AND Version = '0001')
    BEGIN
        IF OBJECT_ID('dbo.PayrollStructures', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.PayrollStructures (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                Name NVARCHAR(256) NOT NULL,
                EffectiveFrom DATE NOT NULL,
                EffectiveTo DATE NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.PayrollStructures', 'UpdatedAt') IS NULL
                ALTER TABLE dbo.PayrollStructures ADD UpdatedAt DATETIME2 NULL;
            IF COL_LENGTH('dbo.PayrollStructures', 'CreatedBy') IS NULL
                ALTER TABLE dbo.PayrollStructures ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.PayrollStructures', 'IsDeleted') IS NULL
                ALTER TABLE dbo.PayrollStructures ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        IF OBJECT_ID('dbo.PayrollComponents', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.PayrollComponents (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                StructureId UNIQUEIDENTIFIER NOT NULL,
                Name NVARCHAR(256) NOT NULL,
                Type NVARCHAR(32) NOT NULL,
                Amount DECIMAL(18,2) NULL,
                Percentage DECIMAL(8,4) NULL,
                IsStatutory BIT NOT NULL DEFAULT 0,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.PayrollComponents', 'CreatedAt') IS NULL
                ALTER TABLE dbo.PayrollComponents ADD CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME();
            IF COL_LENGTH('dbo.PayrollComponents', 'UpdatedAt') IS NULL
                ALTER TABLE dbo.PayrollComponents ADD UpdatedAt DATETIME2 NULL;
            IF COL_LENGTH('dbo.PayrollComponents', 'CreatedBy') IS NULL
                ALTER TABLE dbo.PayrollComponents ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.PayrollComponents', 'IsDeleted') IS NULL
                ALTER TABLE dbo.PayrollComponents ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        IF OBJECT_ID('dbo.PayrollRuns', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.PayrollRuns (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                CompanyId UNIQUEIDENTIFIER NULL,
                RunDate DATE NOT NULL,
                Status NVARCHAR(32) NOT NULL DEFAULT 'Draft',
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.PayrollRuns', 'UpdatedAt') IS NULL
                ALTER TABLE dbo.PayrollRuns ADD UpdatedAt DATETIME2 NULL;
            IF COL_LENGTH('dbo.PayrollRuns', 'CreatedBy') IS NULL
                ALTER TABLE dbo.PayrollRuns ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.PayrollRuns', 'IsDeleted') IS NULL
                ALTER TABLE dbo.PayrollRuns ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        IF OBJECT_ID('dbo.Payslips', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Payslips (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                PayrollRunId UNIQUEIDENTIFIER NOT NULL,
                EmployeeId UNIQUEIDENTIFIER NOT NULL,
                Gross DECIMAL(18,2) NOT NULL,
                Net DECIMAL(18,2) NOT NULL,
                Details NVARCHAR(MAX) NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.Payslips', 'UpdatedAt') IS NULL
                ALTER TABLE dbo.Payslips ADD UpdatedAt DATETIME2 NULL;
            IF COL_LENGTH('dbo.Payslips', 'CreatedBy') IS NULL
                ALTER TABLE dbo.Payslips ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.Payslips', 'IsDeleted') IS NULL
                ALTER TABLE dbo.Payslips ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        INSERT INTO dbo.ModuleMigrations (ModuleKey, Version) VALUES ('payroll', '0001');
    END

    -- ==============================
    -- Module: Reports (0001)
    -- ==============================
    IF NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'reports' AND Version = '0001')
    BEGIN
        IF OBJECT_ID('dbo.vw_AttendanceSummary', 'V') IS NULL
        BEGIN
            EXEC ('CREATE VIEW dbo.vw_AttendanceSummary AS SELECT TenantId, COUNT(1) AS TotalRecords FROM dbo.AttendanceRecords GROUP BY TenantId');
        END

        INSERT INTO dbo.ModuleMigrations (ModuleKey, Version) VALUES ('reports', '0001');
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
