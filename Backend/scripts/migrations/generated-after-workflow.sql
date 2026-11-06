BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260324190830_InitialCleanSchema'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260324190830_InitialCleanSchema', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260411183016_AddNotificationAndDocumentRecords'
)
BEGIN
    CREATE TABLE [DocumentRecords] (
        [Id] uniqueidentifier NOT NULL,
        [UploadedByUserId] uniqueidentifier NOT NULL,
        [CompanyId] uniqueidentifier NULL,
        [ProjectId] uniqueidentifier NULL,
        [EmployeeId] uniqueidentifier NULL,
        [Module] nvarchar(max) NOT NULL,
        [Category] nvarchar(max) NOT NULL,
        [FileName] nvarchar(max) NOT NULL,
        [ContentType] nvarchar(max) NOT NULL,
        [FileSizeBytes] bigint NOT NULL,
        [StoragePath] nvarchar(max) NOT NULL,
        [Tags] nvarchar(max) NULL,
        [Description] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_DocumentRecords] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260411183016_AddNotificationAndDocumentRecords'
)
BEGIN
    CREATE TABLE [NotificationMessages] (
        [Id] uniqueidentifier NOT NULL,
        [RecipientUserId] uniqueidentifier NOT NULL,
        [CompanyId] uniqueidentifier NULL,
        [ProjectId] uniqueidentifier NULL,
        [Channel] nvarchar(max) NOT NULL,
        [Type] nvarchar(max) NOT NULL,
        [Title] nvarchar(max) NOT NULL,
        [Message] nvarchar(max) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [IsRead] bit NOT NULL,
        [SentAt] datetime2 NULL,
        [ReadAt] datetime2 NULL,
        [MetadataJson] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_NotificationMessages] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260411183016_AddNotificationAndDocumentRecords'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260411183016_AddNotificationAndDocumentRecords', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260413090720_AddNotificationAndDocumentIndexes'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[NotificationMessages]') AND [c].[name] = N'Status');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [NotificationMessages] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [NotificationMessages] ALTER COLUMN [Status] nvarchar(450) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260413090720_AddNotificationAndDocumentIndexes'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[DocumentRecords]') AND [c].[name] = N'Module');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [DocumentRecords] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [DocumentRecords] ALTER COLUMN [Module] nvarchar(450) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260413090720_AddNotificationAndDocumentIndexes'
)
BEGIN
    DECLARE @var2 sysname;
    SELECT @var2 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[DocumentRecords]') AND [c].[name] = N'Category');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [DocumentRecords] DROP CONSTRAINT [' + @var2 + '];');
    ALTER TABLE [DocumentRecords] ALTER COLUMN [Category] nvarchar(450) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260413090720_AddNotificationAndDocumentIndexes'
)
BEGIN
    CREATE INDEX [IX_NotificationMessages_Tenant_Recipient_Status] ON [NotificationMessages] ([TenantId], [RecipientUserId], [Status], [IsRead], [CreatedAt] DESC);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260413090720_AddNotificationAndDocumentIndexes'
)
BEGIN
    CREATE INDEX [IX_DocumentRecords_Tenant_Company_Project] ON [DocumentRecords] ([TenantId], [CompanyId], [ProjectId], [CreatedAt] DESC);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260413090720_AddNotificationAndDocumentIndexes'
)
BEGIN
    CREATE INDEX [IX_DocumentRecords_Tenant_Module_Category] ON [DocumentRecords] ([TenantId], [Module], [Category], [CreatedAt] DESC);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260413090720_AddNotificationAndDocumentIndexes'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260413090720_AddNotificationAndDocumentIndexes', N'8.0.0');
END;
GO

COMMIT;
GO

