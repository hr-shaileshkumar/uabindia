/*
  Role cleanup and standardization script
  Target canonical roles:
    - SUPER_ADMIN
    - ADMIN
    - MANAGER
    - EMPLOYEE

  What this script does (idempotent):
    1) Ensures canonical roles exist per tenant.
    2) Maps known alias roles to canonical roles.
    3) Repoints UserRoles and RolePermissions to canonical role IDs.
    4) Soft-deletes duplicate alias roles.
    5) Removes duplicate UserRoles / RolePermissions rows created by remap.
*/

SET NOCOUNT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    ;WITH TenantsWithRoles AS (
        SELECT DISTINCT r.TenantId
        FROM Roles r
        WHERE r.IsDeleted = 0
    )
    INSERT INTO Roles (Id, TenantId, Name, Description, IsDeleted, CreatedAt)
    SELECT NEWID(), t.TenantId, c.Name, c.Description, 0, GETUTCDATE()
    FROM TenantsWithRoles t
    CROSS JOIN (
        VALUES
            ('SUPER_ADMIN', 'System super administrator'),
            ('ADMIN', 'Tenant administrator'),
            ('MANAGER', 'Department or reporting manager'),
            ('EMPLOYEE', 'Standard employee')
    ) c(Name, Description)
    WHERE NOT EXISTS (
        SELECT 1
        FROM Roles r
        WHERE r.TenantId = t.TenantId
          AND r.IsDeleted = 0
          AND UPPER(r.Name) = c.Name
    );

    IF OBJECT_ID('tempdb..#RoleMap') IS NOT NULL DROP TABLE #RoleMap;
    CREATE TABLE #RoleMap (
        OldRoleId UNIQUEIDENTIFIER NOT NULL,
        CanonicalRoleId UNIQUEIDENTIFIER NOT NULL
    );

    ;WITH AliasMap AS (
        SELECT *
        FROM (
            VALUES
                ('superadmin', 'SUPER_ADMIN'),
                ('super_admin', 'SUPER_ADMIN'),
                ('super admin', 'SUPER_ADMIN'),
                ('systemadmin', 'SUPER_ADMIN'),
                ('system_admin', 'SUPER_ADMIN'),
                ('system admin', 'SUPER_ADMIN'),

                ('admin', 'ADMIN'),
                ('administrator', 'ADMIN'),
                ('tenantadmin', 'ADMIN'),
                ('tenant_admin', 'ADMIN'),
                ('tenant admin', 'ADMIN'),

                ('manager', 'MANAGER'),
                ('reportingmanager', 'MANAGER'),
                ('reporting_manager', 'MANAGER'),
                ('reporting manager', 'MANAGER'),
                ('projectmanager', 'MANAGER'),
                ('project_manager', 'MANAGER'),
                ('project manager', 'MANAGER'),
                ('hrmanager', 'MANAGER'),
                ('hr_manager', 'MANAGER'),
                ('hr manager', 'MANAGER'),

                ('employee', 'EMPLOYEE')
        ) v(AliasName, CanonicalName)
    ), RoleWithCanonical AS (
        SELECT
            r.Id AS OldRoleId,
            r.TenantId,
            r.Name,
            a.CanonicalName
        FROM Roles r
        JOIN AliasMap a
            ON LOWER(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(r.Name)), ' ', ''), '_', ''), '-', ''))
             = LOWER(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(a.AliasName)), ' ', ''), '_', ''), '-', ''))
        WHERE r.IsDeleted = 0
    )
    INSERT INTO #RoleMap (OldRoleId, CanonicalRoleId)
    SELECT rwc.OldRoleId, canonical.Id
    FROM RoleWithCanonical rwc
    JOIN Roles canonical
      ON canonical.TenantId = rwc.TenantId
     AND canonical.IsDeleted = 0
     AND UPPER(canonical.Name) = rwc.CanonicalName
    WHERE rwc.OldRoleId <> canonical.Id;

    UPDATE ur
       SET ur.RoleId = rm.CanonicalRoleId
    FROM UserRoles ur
    JOIN #RoleMap rm ON rm.OldRoleId = ur.RoleId
    WHERE ur.IsDeleted = 0;

    UPDATE rp
       SET rp.RoleId = rm.CanonicalRoleId
    FROM RolePermissions rp
    JOIN #RoleMap rm ON rm.OldRoleId = rp.RoleId
    WHERE rp.IsDeleted = 0;

    UPDATE r
       SET r.IsDeleted = 1,
           r.UpdatedAt = GETUTCDATE()
    FROM Roles r
    JOIN #RoleMap rm ON rm.OldRoleId = r.Id
    WHERE r.IsDeleted = 0;

    ;WITH DedupUserRoles AS (
        SELECT
            ur.Id,
            ROW_NUMBER() OVER (
                PARTITION BY ur.TenantId, ur.UserId, ur.RoleId
                ORDER BY ur.CreatedAt, ur.Id
            ) AS rn
        FROM UserRoles ur
        WHERE ur.IsDeleted = 0
    )
    UPDATE ur
       SET ur.IsDeleted = 1,
           ur.UpdatedAt = GETUTCDATE()
    FROM UserRoles ur
    JOIN DedupUserRoles d ON d.Id = ur.Id
    WHERE d.rn > 1;

    ;WITH DedupRolePerms AS (
        SELECT
            rp.Id,
            ROW_NUMBER() OVER (
                PARTITION BY rp.TenantId, rp.RoleId, rp.PermissionId
                ORDER BY rp.CreatedAt, rp.Id
            ) AS rn
        FROM RolePermissions rp
        WHERE rp.IsDeleted = 0
    )
    UPDATE rp
       SET rp.IsDeleted = 1,
           rp.UpdatedAt = GETUTCDATE()
    FROM RolePermissions rp
    JOIN DedupRolePerms d ON d.Id = rp.Id
    WHERE d.rn > 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
