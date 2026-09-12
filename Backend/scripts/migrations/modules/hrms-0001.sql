-- Module: HRMS (0001)
SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRANSACTION;

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

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
