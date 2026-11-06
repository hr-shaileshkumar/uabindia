-- =============================================================================
-- Migration: Add UiPageDefinitions and UiPageVersions for No-Code Page Builder
-- =============================================================================

IF OBJECT_ID(N'[dbo].[UiPageDefinitions]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[UiPageDefinitions] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [PageKey] nvarchar(150) NOT NULL,
        [EntityName] nvarchar(100) NOT NULL,
        [Title] nvarchar(200) NOT NULL,
        [SubTitle] nvarchar(500) NULL,
        [ModuleKey] nvarchar(100) NOT NULL,
        [ViewType] nvarchar(50) NOT NULL DEFAULT 'table',
        [RoutePath] nvarchar(250) NOT NULL,
        [Icon] nvarchar(50) NOT NULL DEFAULT 'Layers',
        [Status] nvarchar(50) NOT NULL DEFAULT 'Draft',
        [PublishedVersion] int NULL,
        [DraftVersion] int NULL,
        [AddToNavigation] bit NOT NULL DEFAULT 1,
        [NavGroup] nvarchar(100) NULL,
        [NavSortOrder] int NOT NULL DEFAULT 0,
        [RequiredPermission] nvarchar(150) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        CONSTRAINT [PK_UiPageDefinitions] PRIMARY KEY ([Id])
    );

    CREATE UNIQUE INDEX [IX_UiPageDefinitions_Tenant_PageKey]
        ON [dbo].[UiPageDefinitions] ([TenantId], [PageKey])
        WHERE [IsDeleted] = 0;

    CREATE INDEX [IX_UiPageDefinitions_Tenant_Module]
        ON [dbo].[UiPageDefinitions] ([TenantId], [ModuleKey]);

    PRINT 'Created table [UiPageDefinitions]';
END
ELSE
BEGIN
    PRINT 'Table [UiPageDefinitions] already exists - skipped';
END
GO

IF OBJECT_ID(N'[dbo].[UiPageVersions]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[UiPageVersions] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [PageDefinitionId] uniqueidentifier NOT NULL,
        [Version] int NOT NULL DEFAULT 1,
        [SchemaJson] nvarchar(max) NOT NULL,
        [ChangeSummary] nvarchar(500) NULL,
        [IsPublished] bit NOT NULL DEFAULT 0,
        [PublishedAt] datetime2 NULL,
        [PublishedBy] uniqueidentifier NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        CONSTRAINT [PK_UiPageVersions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_UiPageVersions_UiPageDefinitions] FOREIGN KEY ([PageDefinitionId])
            REFERENCES [dbo].[UiPageDefinitions] ([Id]) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX [IX_UiPageVersions_Definition_Version]
        ON [dbo].[UiPageVersions] ([PageDefinitionId], [Version])
        WHERE [IsDeleted] = 0;

    PRINT 'Created table [UiPageVersions]';
END
ELSE
BEGIN
    PRINT 'Table [UiPageVersions] already exists - skipped';
END
GO
