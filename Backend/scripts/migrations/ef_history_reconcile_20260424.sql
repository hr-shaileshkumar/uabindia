-- EF migration history reconciliation script (SQL Server)
-- Date: 2026-04-24
-- Purpose: reconcile __EFMigrationsHistory where schema objects already existed
-- WARNING: Run only after validating corresponding objects already exist in target DB.

IF OBJECT_ID(N'dbo.LeavePolicyRules', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260201161904_AddLeavePolicyRules')
BEGIN
    INSERT INTO [__EFMigrationsHistory]([MigrationId], [ProductVersion])
    VALUES ('20260201161904_AddLeavePolicyRules', '8.0.0');
END
GO

IF OBJECT_ID(N'dbo.ContactSubmissions', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260205175739_AddContactSubmissions')
BEGIN
    INSERT INTO [__EFMigrationsHistory]([MigrationId], [ProductVersion])
    VALUES ('20260205175739_AddContactSubmissions', '8.0.0');
END
GO

IF OBJECT_ID(N'dbo.Permissions', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260209190829_AddWorkflowTables_Minimal')
BEGIN
    INSERT INTO [__EFMigrationsHistory]([MigrationId], [ProductVersion])
    VALUES ('20260209190829_AddWorkflowTables_Minimal', '8.0.0');
END
GO

IF OBJECT_ID(N'dbo.AppraisalCompetencies', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260324190830_InitialCleanSchema')
BEGIN
    INSERT INTO [__EFMigrationsHistory]([MigrationId], [ProductVersion])
    VALUES ('20260324190830_InitialCleanSchema', '8.0.0');
END
GO
