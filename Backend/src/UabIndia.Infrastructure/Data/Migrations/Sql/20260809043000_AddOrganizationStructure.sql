-- REQUIRES APPROVAL: Apply via EF migration or DBA review before production.
-- Local dev: runs automatically when AddOrganizationStructure EF migration is applied.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Departments')
BEGIN
    CREATE TABLE [Departments] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [CompanyId] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Code] nvarchar(64) NOT NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [ParentDepartmentId] uniqueidentifier NULL,
        [HeadEmployeeName] nvarchar(max) NULL,
        CONSTRAINT [PK_Departments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Departments_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies]([Id])
    );
    CREATE UNIQUE INDEX [IX_Departments_TenantId_CompanyId_Code] ON [Departments]([TenantId], [CompanyId], [Code]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Designations')
BEGIN
    CREATE TABLE [Designations] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [CompanyId] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Code] nvarchar(64) NOT NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [Grade] nvarchar(max) NULL,
        [Level] nvarchar(max) NULL,
        CONSTRAINT [PK_Designations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Designations_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies]([Id])
    );
    CREATE UNIQUE INDEX [IX_Designations_TenantId_CompanyId_Code] ON [Designations]([TenantId], [CompanyId], [Code]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Branches')
BEGIN
    CREATE TABLE [Branches] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [CompanyId] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Code] nvarchar(64) NOT NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [City] nvarchar(max) NULL,
        [State] nvarchar(max) NULL,
        [Gstin] nvarchar(max) NULL,
        [IsWarehouse] bit NOT NULL DEFAULT 0,
        CONSTRAINT [PK_Branches] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Branches_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies]([Id])
    );
    CREATE UNIQUE INDEX [IX_Branches_TenantId_CompanyId_Code] ON [Branches]([TenantId], [CompanyId], [Code]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CostCenters')
BEGIN
    CREATE TABLE [CostCenters] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [CompanyId] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Code] nvarchar(64) NOT NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [CostCenterType] nvarchar(max) NULL,
        CONSTRAINT [PK_CostCenters] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CostCenters_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies]([Id])
    );
    CREATE UNIQUE INDEX [IX_CostCenters_TenantId_CompanyId_Code] ON [CostCenters]([TenantId], [CompanyId], [Code]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'BusinessUnits')
BEGIN
    CREATE TABLE [BusinessUnits] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [CompanyId] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Code] nvarchar(64) NOT NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [ParentBusinessUnitId] uniqueidentifier NULL,
        CONSTRAINT [PK_BusinessUnits] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_BusinessUnits_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies]([Id])
    );
    CREATE UNIQUE INDEX [IX_BusinessUnits_TenantId_CompanyId_Code] ON [BusinessUnits]([TenantId], [CompanyId], [Code]);
END
