IF OBJECT_ID(N'dbo.DiscountSchemes', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[DiscountSchemes] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT [DF_DiscountSchemes_IsDeleted] DEFAULT 0,
        [SchemeCode] nvarchar(64) NOT NULL,
        [SchemeName] nvarchar(256) NOT NULL,
        [DiscountType] nvarchar(32) NOT NULL CONSTRAINT [DF_DiscountSchemes_DiscountType] DEFAULT 'Percent',
        [Scope] nvarchar(32) NOT NULL CONSTRAINT [DF_DiscountSchemes_Scope] DEFAULT 'Items',
        [Value] decimal(18,4) NOT NULL CONSTRAINT [DF_DiscountSchemes_Value] DEFAULT 0,
        [Priority] int NOT NULL CONSTRAINT [DF_DiscountSchemes_Priority] DEFAULT 10,
        [ValidFrom] datetime2 NOT NULL,
        [ValidTo] datetime2 NOT NULL,
        [MinQuantity] decimal(18,4) NOT NULL CONSTRAINT [DF_DiscountSchemes_MinQuantity] DEFAULT 0,
        [MinBillAmount] decimal(18,4) NOT NULL CONSTRAINT [DF_DiscountSchemes_MinBillAmount] DEFAULT 0,
        [MaxDiscountAmount] decimal(18,4) NOT NULL CONSTRAINT [DF_DiscountSchemes_MaxDiscountAmount] DEFAULT 0,
        [Status] nvarchar(32) NOT NULL CONSTRAINT [DF_DiscountSchemes_Status] DEFAULT 'Active',
        [Category] nvarchar(128) NULL,
        [Notes] nvarchar(max) NULL,
        CONSTRAINT [PK_DiscountSchemes] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_DiscountSchemes_TenantId_Status] ON [dbo].[DiscountSchemes]([TenantId], [Status]);
    CREATE INDEX [IX_DiscountSchemes_TenantId_SchemeCode] ON [dbo].[DiscountSchemes]([TenantId], [SchemeCode]);
END
GO

IF OBJECT_ID(N'dbo.DiscountSchemeLines', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[DiscountSchemeLines] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT [DF_DiscountSchemeLines_IsDeleted] DEFAULT 0,
        [DiscountSchemeId] uniqueidentifier NOT NULL,
        [ItemId] uniqueidentifier NULL,
        [Category] nvarchar(128) NULL,
        [Value] decimal(18,4) NULL,
        CONSTRAINT [PK_DiscountSchemeLines] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DiscountSchemeLines_DiscountSchemes] FOREIGN KEY ([DiscountSchemeId]) REFERENCES [dbo].[DiscountSchemes]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_DiscountSchemeLines_Items] FOREIGN KEY ([ItemId]) REFERENCES [dbo].[Items]([Id])
    );
    CREATE INDEX [IX_DiscountSchemeLines_DiscountSchemeId] ON [dbo].[DiscountSchemeLines]([DiscountSchemeId]);
    CREATE INDEX [IX_DiscountSchemeLines_ItemId] ON [dbo].[DiscountSchemeLines]([ItemId]);
END
GO
