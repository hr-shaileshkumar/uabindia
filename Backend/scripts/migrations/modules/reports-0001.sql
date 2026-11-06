-- Module: Reports (0001)
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
