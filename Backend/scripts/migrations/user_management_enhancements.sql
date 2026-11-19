-- User Management Enhancements Migration
-- Adds Permissions and RolePermissions tables for granular access control

SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    -- ==============================
    -- Module: Auth (0002) - Permissions
    -- ==============================
    IF NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'auth' AND Version = '0002')
    BEGIN
        IF OBJECT_ID('dbo.Permissions', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Permissions (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                Name NVARCHAR(128) NOT NULL,
                Description NVARCHAR(512) NULL,
                Module NVARCHAR(64) NOT NULL,
                Action NVARCHAR(64) NOT NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_Permissions_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id),
                CONSTRAINT UQ_Permissions_Tenant_Module_Action UNIQUE (TenantId, Module, Action)
            );
        END

        IF OBJECT_ID('dbo.RolePermissions', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.RolePermissions (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                RoleId UNIQUEIDENTIFIER NOT NULL,
                PermissionId UNIQUEIDENTIFIER NOT NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id),
                CONSTRAINT FK_RolePermissions_Permissions FOREIGN KEY (PermissionId) REFERENCES dbo.Permissions(Id),
                CONSTRAINT UQ_RolePermissions_Role_Permission UNIQUE (RoleId, PermissionId)
            );
        END

        -- Insert default permissions for demo tenant
        DECLARE @DemoTenantId UNIQUEIDENTIFIER;
        SELECT TOP 1 @DemoTenantId = Id FROM dbo.Tenants WHERE Subdomain = 'erp';

        IF @DemoTenantId IS NOT NULL
        BEGIN
            -- Update tenant name if needed
            UPDATE dbo.Tenants SET Name = 'UAB India ERP' WHERE Id = @DemoTenantId AND Name != 'UAB India ERP';
            -- User Management Permissions
            INSERT INTO dbo.Permissions (TenantId, Name, Description, Module, Action)
            VALUES
            (@DemoTenantId, 'Create Users', 'Can create new users', 'users', 'create'),
            (@DemoTenantId, 'Read Users', 'Can view users', 'users', 'read'),
            (@DemoTenantId, 'Update Users', 'Can update user information', 'users', 'update'),
            (@DemoTenantId, 'Delete Users', 'Can delete users', 'users', 'delete'),
            (@DemoTenantId, 'Manage Roles', 'Can assign and remove roles', 'users', 'manageroles'),

            -- Company Management Permissions
            (@DemoTenantId, 'Create Companies', 'Can create new companies', 'companies', 'create'),
            (@DemoTenantId, 'Read Companies', 'Can view companies', 'companies', 'read'),
            (@DemoTenantId, 'Update Companies', 'Can update company information', 'companies', 'update'),
            (@DemoTenantId, 'Delete Companies', 'Can delete companies', 'companies', 'delete'),

            -- HRMS Permissions
            (@DemoTenantId, 'Manage Employees', 'Can manage employee records', 'hrms', 'manage'),
            (@DemoTenantId, 'View Attendance', 'Can view attendance records', 'hrms', 'viewattendance'),
            (@DemoTenantId, 'Manage Leave', 'Can approve/reject leave requests', 'hrms', 'manageleave'),
            (@DemoTenantId, 'View Payslips', 'Can view payslips', 'hrms', 'viewpayslips'),

            -- Payroll Permissions
            (@DemoTenantId, 'Run Payroll', 'Can execute payroll runs', 'payroll', 'run'),
            (@DemoTenantId, 'Manage Payroll Components', 'Can configure payroll components', 'payroll', 'managecomponents'),

            -- Reports Permissions
            (@DemoTenantId, 'View Reports', 'Can access reports', 'reports', 'view'),
            (@DemoTenantId, 'Export Reports', 'Can export reports', 'reports', 'export');

            -- Create default roles and assign permissions
            DECLARE @ErpOwnerRoleId UNIQUEIDENTIFIER = NEWID();
            DECLARE @SystemAdminRoleId UNIQUEIDENTIFIER = NEWID();
            DECLARE @CompanyAdminRoleId UNIQUEIDENTIFIER = NEWID();
            DECLARE @ManagerRoleId UNIQUEIDENTIFIER = NEWID();
            DECLARE @EmployeeRoleId UNIQUEIDENTIFIER = NEWID();

            INSERT INTO dbo.Roles (Id, TenantId, Name, Description)
            VALUES
            (@ErpOwnerRoleId, @DemoTenantId, 'Super Admin', 'Super admin with full access to all modules and configurations'),
            (@SystemAdminRoleId, @DemoTenantId, 'Administrator', 'Handles configurations and master data'),
            (@CompanyAdminRoleId, @DemoTenantId, 'Admin', 'Manages users within their company'),
            (@ManagerRoleId, @DemoTenantId, 'Reporting Manager', 'Access limited to assigned modules'),
            (@EmployeeRoleId, @DemoTenantId, 'Employee', 'Self-service access');

            -- Assign all permissions to ERP Owner
            INSERT INTO dbo.RolePermissions (TenantId, RoleId, PermissionId)
            SELECT @DemoTenantId, @ErpOwnerRoleId, Id FROM dbo.Permissions WHERE TenantId = @DemoTenantId;

            -- Assign relevant permissions to other roles
            -- System Admin: users, companies, hrms, payroll, reports
            INSERT INTO dbo.RolePermissions (TenantId, RoleId, PermissionId)
            SELECT @DemoTenantId, @SystemAdminRoleId, Id FROM dbo.Permissions
            WHERE TenantId = @DemoTenantId AND Module IN ('users', 'companies', 'hrms', 'payroll', 'reports');

            -- Company Admin: users (except delete), companies (read/update), hrms, payroll, reports
            INSERT INTO dbo.RolePermissions (TenantId, RoleId, PermissionId)
            SELECT @DemoTenantId, @CompanyAdminRoleId, Id FROM dbo.Permissions
            WHERE TenantId = @DemoTenantId AND 
            ((Module IN ('users', 'companies', 'hrms', 'payroll', 'reports') AND Action != 'delete') OR
             (Module = 'companies' AND Action IN ('read', 'update')));

            -- Manager: hrms, payroll, reports
            INSERT INTO dbo.RolePermissions (TenantId, RoleId, PermissionId)
            SELECT @DemoTenantId, @ManagerRoleId, Id FROM dbo.Permissions
            WHERE TenantId = @DemoTenantId AND Module IN ('hrms', 'payroll', 'reports');

            -- Employee: hrms (viewattendance, manageleave, viewpayslips)
            INSERT INTO dbo.RolePermissions (TenantId, RoleId, PermissionId)
            SELECT @DemoTenantId, @EmployeeRoleId, Id FROM dbo.Permissions
            WHERE TenantId = @DemoTenantId AND Module = 'hrms'
            AND Action IN ('viewattendance', 'manageleave', 'viewpayslips');

            -- Note: Default users with static password hashes have been removed for security.
            -- User accounts and passwords must be provisioned securely via application startup seeding
            -- using SEED_ADMIN_PASSWORD / environment variables and cryptographic password hashers.
        END

        INSERT INTO dbo.ModuleMigrations (ModuleKey, Version) VALUES ('auth', '0002');
    END

    COMMIT TRANSACTION;
    PRINT 'User Management Enhancements migration completed successfully.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH