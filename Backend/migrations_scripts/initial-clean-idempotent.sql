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

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    DROP TABLE [BaseEntity];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [AppraisalCompetencies] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Weight] decimal(18,4) NOT NULL,
        [Category] nvarchar(max) NULL,
        [SortOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AppraisalCompetencies] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [AppraisalCycles] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [StartDate] datetime2 NOT NULL,
        [EndDate] datetime2 NOT NULL,
        [SelfAssessmentDeadline] datetime2 NOT NULL,
        [ManagerAssessmentDeadline] datetime2 NOT NULL,
        [Status] int NOT NULL,
        [IsActive] bit NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AppraisalCycles] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [AttendanceCorrections] (
        [Id] uniqueidentifier NOT NULL,
        [OriginalAttendanceId] uniqueidentifier NOT NULL,
        [ProposedTimestamp] datetime2 NOT NULL,
        [Reason] nvarchar(max) NULL,
        [Status] nvarchar(max) NULL,
        [RequestedBy] uniqueidentifier NULL,
        [ApprovedBy] uniqueidentifier NULL,
        [ApprovedAt] datetime2 NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AttendanceCorrections] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [AttendanceRecords] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [ProjectId] uniqueidentifier NULL,
        [PunchType] nvarchar(max) NOT NULL,
        [Timestamp] datetime2 NOT NULL,
        [Latitude] decimal(10,7) NULL,
        [Longitude] decimal(10,7) NULL,
        [DeviceId] nvarchar(max) NULL,
        [Source] nvarchar(max) NULL,
        [GeoValidated] bit NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AttendanceRecords] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] uniqueidentifier NOT NULL,
        [EntityName] nvarchar(max) NULL,
        [EntityId] uniqueidentifier NULL,
        [Action] nvarchar(max) NULL,
        [OldValue] nvarchar(max) NULL,
        [NewValue] nvarchar(max) NULL,
        [PerformedBy] uniqueidentifier NULL,
        [Ip] nvarchar(max) NULL,
        [PerformedAt] datetime2 NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [ChartOfAccounts] (
        [Id] uniqueidentifier NOT NULL,
        [AccountCode] nvarchar(max) NOT NULL,
        [AccountName] nvarchar(max) NOT NULL,
        [AccountType] nvarchar(max) NOT NULL,
        [SubType] nvarchar(max) NOT NULL,
        [ParentAccountId] uniqueidentifier NULL,
        [Description] nvarchar(max) NULL,
        [OpeningBalance] decimal(18,4) NOT NULL,
        [CurrentBalance] decimal(18,4) NOT NULL,
        [Currency] nvarchar(max) NOT NULL,
        [IsGroup] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [Level] int NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ChartOfAccounts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ChartOfAccounts_ChartOfAccounts_ParentAccountId] FOREIGN KEY ([ParentAccountId]) REFERENCES [ChartOfAccounts] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [Companies] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [LegalName] nvarchar(max) NULL,
        [Code] nvarchar(max) NULL,
        [RegistrationNumber] nvarchar(max) NULL,
        [TaxId] nvarchar(max) NULL,
        [Email] nvarchar(max) NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [WebsiteUrl] nvarchar(max) NULL,
        [LogoUrl] nvarchar(max) NULL,
        [Industry] nvarchar(max) NULL,
        [CompanySize] nvarchar(max) NULL,
        [RegistrationAddress] nvarchar(max) NULL,
        [OperationalAddress] nvarchar(max) NULL,
        [City] nvarchar(max) NULL,
        [State] nvarchar(max) NULL,
        [PostalCode] nvarchar(max) NULL,
        [Country] nvarchar(max) NULL,
        [BankAccountNumber] nvarchar(max) NULL,
        [BankName] nvarchar(max) NULL,
        [BankBranch] nvarchar(max) NULL,
        [IFSCCode] nvarchar(max) NULL,
        [FinancialYearStart] nvarchar(max) NULL,
        [FinancialYearEnd] nvarchar(max) NULL,
        [MaxEmployees] int NULL,
        [ContactPersonName] nvarchar(max) NULL,
        [ContactPersonPhone] nvarchar(max) NULL,
        [ContactPersonEmail] nvarchar(max) NULL,
        [HR_PersonName] nvarchar(max) NULL,
        [HR_PersonEmail] nvarchar(max) NULL,
        [Notes] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Companies] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [ComplianceAudits] (
        [Id] uniqueidentifier NOT NULL,
        [AuditType] nvarchar(max) NOT NULL,
        [FinancialYear] int NOT NULL,
        [AuditDate] datetime2 NOT NULL,
        [AuditedByUserId] uniqueidentifier NOT NULL,
        [AuditedByName] nvarchar(max) NOT NULL,
        [TotalRecordsChecked] int NOT NULL,
        [DiscrepanciesFound] int NOT NULL,
        [CorrectionsMade] int NOT NULL,
        [AuditFindings] nvarchar(max) NOT NULL,
        [Status] int NOT NULL,
        [Remarks] nvarchar(max) NOT NULL,
        [StartDate] datetime2 NOT NULL,
        [CompletionDate] datetime2 NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ComplianceAudits] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [ComplianceReports] (
        [Id] uniqueidentifier NOT NULL,
        [ReportType] nvarchar(max) NOT NULL,
        [FinancialYear] int NOT NULL,
        [MonthYear] int NOT NULL,
        [GeneratedDate] datetime2 NOT NULL,
        [TotalEmployees] int NOT NULL,
        [TotalAmount] decimal(18,4) NOT NULL,
        [EmployeeContribution] decimal(18,4) NOT NULL,
        [EmployerContribution] decimal(18,4) NOT NULL,
        [PFDtrCode] nvarchar(max) NOT NULL,
        [PFEstablishmentId] nvarchar(max) NOT NULL,
        [ESIRegistrationNumber] nvarchar(max) NOT NULL,
        [TDSQuarter] int NOT NULL,
        [TDSCategory] nvarchar(max) NOT NULL,
        [EmployeeId] uniqueidentifier NULL,
        [CertificateNumber] nvarchar(max) NOT NULL,
        [DeductorPAN] nvarchar(max) NOT NULL,
        [Status] int NOT NULL,
        [SubmissionDeadline] datetime2 NOT NULL,
        [SubmittedDate] datetime2 NULL,
        [ReferenceNumber] nvarchar(max) NOT NULL,
        [FileLocation] nvarchar(max) NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ComplianceReports] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [ContactSubmissions] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Email] nvarchar(max) NOT NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [CompanyName] nvarchar(max) NULL,
        [Subject] nvarchar(max) NULL,
        [Message] nvarchar(max) NOT NULL,
        [Source] nvarchar(max) NULL,
        [IsResolved] bit NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ContactSubmissions] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [Customers] (
        [Id] uniqueidentifier NOT NULL,
        [CustomerCode] nvarchar(max) NOT NULL,
        [CustomerName] nvarchar(max) NOT NULL,
        [CustomerType] nvarchar(max) NOT NULL,
        [CompanyName] nvarchar(max) NULL,
        [GSTNumber] nvarchar(max) NULL,
        [PANNumber] nvarchar(max) NULL,
        [Email] nvarchar(max) NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [MobileNumber] nvarchar(max) NULL,
        [BillingAddress] nvarchar(max) NULL,
        [ShippingAddress] nvarchar(max) NULL,
        [City] nvarchar(max) NULL,
        [State] nvarchar(max) NULL,
        [Country] nvarchar(max) NULL,
        [PostalCode] nvarchar(max) NULL,
        [ContactPerson] nvarchar(max) NULL,
        [CreditLimit] decimal(18,4) NOT NULL,
        [PaymentTerms] int NOT NULL,
        [OpeningBalance] decimal(18,4) NOT NULL,
        [CurrentBalance] decimal(18,4) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [Notes] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Customers] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
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
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [EmployeeLeaves] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [LeavePolicyId] uniqueidentifier NOT NULL,
        [Year] int NOT NULL,
        [Entitled] decimal(18,4) NOT NULL,
        [Taken] decimal(18,4) NOT NULL,
        [Balance] decimal(18,4) NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_EmployeeLeaves] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [Employees] (
        [Id] uniqueidentifier NOT NULL,
        [CompanyId] uniqueidentifier NOT NULL,
        [FullName] nvarchar(max) NULL,
        [EmployeeCode] nvarchar(max) NULL,
        [ProjectId] uniqueidentifier NULL,
        [ManagerId] uniqueidentifier NULL,
        [ReportingManagerId] uniqueidentifier NULL,
        [UserId] uniqueidentifier NULL,
        [Status] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Employees] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [EmployeeStateInsurances] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EmployeeNumber] nvarchar(max) NOT NULL,
        [EmployeeName] nvarchar(max) NOT NULL,
        [DepartmentId] uniqueidentifier NOT NULL,
        [ESINumber] nvarchar(max) NOT NULL,
        [StateCode] nvarchar(max) NOT NULL,
        [StateName] nvarchar(max) NOT NULL,
        [EffectiveFrom] datetime2 NOT NULL,
        [ESICoverageEndDate] datetime2 NULL,
        [IsESIEligible] bit NOT NULL,
        [MonthlySalary] decimal(18,4) NOT NULL,
        [ESIWages] decimal(18,4) NOT NULL,
        [EmployeeContribution] decimal(18,4) NOT NULL,
        [EmployerContribution] decimal(18,4) NOT NULL,
        [TotalContribution] decimal(18,4) NOT NULL,
        [FinancialYear] int NOT NULL,
        [MonthYear] int NOT NULL,
        [ContributionMonth] datetime2 NOT NULL,
        [ContributionDays] int NOT NULL,
        [Status] int NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_EmployeeStateInsurances] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [EntityFieldDefinitions] (
        [Id] uniqueidentifier NOT NULL,
        [EntityName] nvarchar(max) NOT NULL,
        [FieldKey] nvarchar(max) NOT NULL,
        [FieldLabel] nvarchar(max) NOT NULL,
        [FieldType] nvarchar(max) NOT NULL,
        [OptionsJson] nvarchar(max) NULL,
        [IsRequired] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [SortOrder] int NOT NULL,
        [Section] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_EntityFieldDefinitions] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [FeatureFlags] (
        [Id] uniqueidentifier NOT NULL,
        [FeatureKey] nvarchar(max) NOT NULL,
        [IsEnabled] bit NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_FeatureFlags] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [FixedAssets] (
        [Id] uniqueidentifier NOT NULL,
        [AssetCode] nvarchar(max) NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [Category] int NOT NULL,
        [Status] int NOT NULL,
        [SerialNumber] nvarchar(max) NOT NULL,
        [Location] nvarchar(max) NOT NULL,
        [PurchaseValue] decimal(18,4) NOT NULL,
        [CurrentValue] decimal(18,4) NOT NULL,
        [SalvageValue] decimal(18,4) NOT NULL,
        [AccumulatedDepreciation] decimal(18,4) NOT NULL,
        [PurchaseDate] datetime2 NOT NULL,
        [DepreciationStartDate] datetime2 NOT NULL,
        [UsefulLifeYears] int NOT NULL,
        [DisposalDate] datetime2 NULL,
        [DepreciationMethod] int NOT NULL,
        [DepreciationRate] decimal(18,4) NOT NULL,
        [AllocatedToEmployeeId] uniqueidentifier NULL,
        [AllocationDate] datetime2 NULL,
        [DeallocationDate] datetime2 NULL,
        [Supplier] nvarchar(max) NOT NULL,
        [WarrantyInfo] nvarchar(max) NOT NULL,
        [WarrantyExpiryDate] datetime2 NULL,
        [IsUnderWarranty] bit NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_FixedAssets] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [HelpdeskEscalations] (
        [Id] uniqueidentifier NOT NULL,
        [HelpdeskTicketId] uniqueidentifier NOT NULL,
        [Reason] nvarchar(max) NOT NULL,
        [EscalatedToUserId] uniqueidentifier NULL,
        [EscalatedAt] datetime2 NOT NULL,
        [SlaBreached] bit NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_HelpdeskEscalations] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [HelpdeskFaqArticles] (
        [Id] uniqueidentifier NOT NULL,
        [Question] nvarchar(max) NOT NULL,
        [Answer] nvarchar(max) NOT NULL,
        [Category] nvarchar(max) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [Views] int NOT NULL,
        [HelpfulCount] int NOT NULL,
        [DisplayOrder] int NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_HelpdeskFaqArticles] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [HelpdeskTickets] (
        [Id] uniqueidentifier NOT NULL,
        [TicketNumber] nvarchar(450) NOT NULL,
        [Subject] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [Category] nvarchar(max) NOT NULL,
        [Priority] nvarchar(max) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [RequesterUserId] uniqueidentifier NOT NULL,
        [AssignedToUserId] uniqueidentifier NULL,
        [CompanyId] uniqueidentifier NULL,
        [ProjectId] uniqueidentifier NULL,
        [SlaDueAt] datetime2 NULL,
        [FirstResponseAt] datetime2 NULL,
        [ResolvedAt] datetime2 NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_HelpdeskTickets] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [Holidays] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Date] datetime2 NOT NULL,
        [Type] nvarchar(max) NOT NULL,
        [IsOptional] bit NOT NULL,
        [Description] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Holidays] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [IncomeTaxes] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EmployeeNumber] nvarchar(max) NOT NULL,
        [EmployeeName] nvarchar(max) NOT NULL,
        [PAN] nvarchar(max) NOT NULL,
        [DepartmentId] uniqueidentifier NOT NULL,
        [TaxRegime] int NOT NULL,
        [OptedOldRegime] bit NOT NULL,
        [BasicSalary] decimal(18,4) NOT NULL,
        [DA] decimal(18,4) NOT NULL,
        [HRA] decimal(18,4) NOT NULL,
        [SpecialAllowance] decimal(18,4) NOT NULL,
        [OtherAllowance] decimal(18,4) NOT NULL,
        [GrossSalary] decimal(18,4) NOT NULL,
        [StandardDeduction] decimal(18,4) NOT NULL,
        [TaxableIncome] decimal(18,4) NOT NULL,
        [TaxCalculated] decimal(18,4) NOT NULL,
        [RebateUnder87A] decimal(18,4) NOT NULL,
        [TaxAfterRebate] decimal(18,4) NOT NULL,
        [SurCharge] decimal(18,4) NOT NULL,
        [HealthEducationCess] decimal(18,4) NOT NULL,
        [TotalTaxLiability] decimal(18,4) NOT NULL,
        [TDSDeducted] decimal(18,4) NOT NULL,
        [AdvanceTaxPaid] decimal(18,4) NOT NULL,
        [TotalPaymentsMade] decimal(18,4) NOT NULL,
        [TaxRefundable] decimal(18,4) NOT NULL,
        [FinancialYear] int NOT NULL,
        [AssessmentYear] int NOT NULL,
        [Status] int NOT NULL,
        [CalculatedDate] datetime2 NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_IncomeTaxes] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [JournalEntries] (
        [Id] uniqueidentifier NOT NULL,
        [JournalNumber] nvarchar(max) NOT NULL,
        [EntryDate] datetime2 NOT NULL,
        [EntryType] nvarchar(max) NOT NULL,
        [ReferenceNumber] nvarchar(max) NULL,
        [Description] nvarchar(max) NULL,
        [TotalDebit] decimal(18,4) NOT NULL,
        [TotalCredit] decimal(18,4) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [PostedDate] datetime2 NULL,
        [PostedBy] uniqueidentifier NULL,
        [Narration] nvarchar(max) NULL,
        [IsReconciled] bit NOT NULL,
        [AttachmentUrl] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_JournalEntries] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [LeaveAllocations] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [LeavePolicyId] uniqueidentifier NOT NULL,
        [Year] int NOT NULL,
        [AllocatedDays] decimal(18,4) NOT NULL,
        [EffectiveFrom] datetime2 NOT NULL,
        [EffectiveTo] datetime2 NULL,
        [AllocationReason] nvarchar(max) NOT NULL,
        [IsProrated] bit NOT NULL,
        [CarryForwardDays] decimal(18,4) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_LeaveAllocations] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [LeavePolicies] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Type] nvarchar(max) NOT NULL,
        [EntitlementPerYear] decimal(18,4) NOT NULL,
        [CarryForwardAllowed] bit NOT NULL,
        [MaxCarryForward] decimal(18,4) NULL,
        [AllocationFrequency] int NOT NULL,
        [EnableProration] bit NOT NULL,
        [AutoAllocate] bit NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_LeavePolicies] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [LeavePolicyRules] (
        [Id] uniqueidentifier NOT NULL,
        [LeavePolicyId] uniqueidentifier NOT NULL,
        [ApplicableGender] nvarchar(max) NOT NULL,
        [EmploymentType] nvarchar(max) NOT NULL,
        [Encashable] bit NOT NULL,
        [CarryForwardAllowed] bit NOT NULL,
        [MaxCarryForward] decimal(18,4) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_LeavePolicyRules] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [LeaveRequests] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [LeavePolicyId] uniqueidentifier NOT NULL,
        [FromDate] datetime2 NOT NULL,
        [ToDate] datetime2 NOT NULL,
        [Days] decimal(18,4) NOT NULL,
        [Period] int NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [ApprovedBy] uniqueidentifier NULL,
        [ApprovedAt] datetime2 NULL,
        [Reason] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_LeaveRequests] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [LeaveTypes] (
        [Id] uniqueidentifier NOT NULL,
        [Code] nvarchar(max) NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [DisplayOrder] int NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_LeaveTypes] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [dbo].[Modules] (
        [ModuleKey] nvarchar(64) NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [DisplayName] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [ModuleType] nvarchar(max) NOT NULL,
        [Icon] nvarchar(max) NULL,
        [BasePath] nvarchar(max) NULL,
        [IsEnabled] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [SortOrder] int NOT NULL,
        [Version] nvarchar(max) NOT NULL,
        [LicensedTo] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Modules] PRIMARY KEY ([ModuleKey])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
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
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [OvertimeRequests] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [OvertimeDate] datetime2 NOT NULL,
        [StartTime] time NOT NULL,
        [EndTime] time NOT NULL,
        [TotalHours] decimal(18,4) NOT NULL,
        [BreakMinutes] int NOT NULL,
        [NetOvertimeHours] decimal(18,4) NOT NULL,
        [Reason] nvarchar(500) NOT NULL,
        [ProjectCode] nvarchar(200) NULL,
        [ProjectId] uniqueidentifier NULL,
        [OvertimeType] int NOT NULL,
        [Status] int NOT NULL,
        [ManagerId] uniqueidentifier NULL,
        [IsPreApproved] bit NOT NULL,
        [CompensationType] int NOT NULL,
        [OvertimeRate] decimal(18,4) NOT NULL,
        [OvertimeAmount] decimal(18,4) NOT NULL,
        [EmployeeNotes] nvarchar(500) NULL,
        [IsActualWorked] bit NOT NULL,
        [ActualWorkedHours] decimal(18,4) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_OvertimeRequests] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [PayrollComponents] (
        [Id] uniqueidentifier NOT NULL,
        [StructureId] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Type] nvarchar(max) NOT NULL,
        [Amount] decimal(18,4) NULL,
        [Percentage] decimal(18,4) NULL,
        [IsStatutory] bit NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_PayrollComponents] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [PayrollRuns] (
        [Id] uniqueidentifier NOT NULL,
        [CompanyId] uniqueidentifier NULL,
        [RunDate] datetime2 NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_PayrollRuns] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [PayrollStructures] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [EffectiveFrom] datetime2 NOT NULL,
        [EffectiveTo] datetime2 NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_PayrollStructures] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [Payslips] (
        [Id] uniqueidentifier NOT NULL,
        [PayrollRunId] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [Gross] decimal(18,4) NOT NULL,
        [Net] decimal(18,4) NOT NULL,
        [Details] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Payslips] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [Permissions] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Module] nvarchar(max) NOT NULL,
        [Action] nvarchar(max) NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Permissions] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [ProfessionalTaxes] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EmployeeNumber] nvarchar(max) NOT NULL,
        [EmployeeName] nvarchar(max) NOT NULL,
        [DepartmentId] uniqueidentifier NOT NULL,
        [StateCode] nvarchar(max) NOT NULL,
        [StateName] nvarchar(max) NOT NULL,
        [PTRegistrationNumber] nvarchar(max) NOT NULL,
        [EffectiveFrom] datetime2 NOT NULL,
        [MonthlySalary] decimal(18,4) NOT NULL,
        [PTDeduction] decimal(18,4) NOT NULL,
        [FinancialYear] int NOT NULL,
        [MonthYear] int NOT NULL,
        [Status] int NOT NULL,
        [IsPTExempt] bit NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ProfessionalTaxes] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [Projects] (
        [Id] uniqueidentifier NOT NULL,
        [CompanyId] uniqueidentifier NOT NULL,
        [ProjectCode] nvarchar(max) NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [ProjectType] nvarchar(max) NOT NULL,
        [Priority] nvarchar(max) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [IsActive] bit NOT NULL,
        [StartDate] datetime2 NULL,
        [EndDate] datetime2 NULL,
        [ActualStartDate] datetime2 NULL,
        [ActualEndDate] datetime2 NULL,
        [Budget] decimal(18,4) NULL,
        [ActualCost] decimal(18,4) NULL,
        [CurrencyCode] nvarchar(max) NOT NULL,
        [ClientName] nvarchar(max) NULL,
        [ContractNumber] nvarchar(max) NULL,
        [BillingType] nvarchar(max) NULL,
        [CompletionPercentage] int NOT NULL,
        [ProjectManagerId] uniqueidentifier NULL,
        [Location] nvarchar(max) NULL,
        [UpdatedBy] uniqueidentifier NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Projects] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [ProvidentFunds] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EmployeeNumber] nvarchar(max) NOT NULL,
        [EmployeeName] nvarchar(max) NOT NULL,
        [DepartmentId] uniqueidentifier NOT NULL,
        [DepartmentName] nvarchar(max) NOT NULL,
        [PFAccountNumber] nvarchar(max) NOT NULL,
        [EffectiveFrom] datetime2 NOT NULL,
        [BasicSalary] decimal(18,4) NOT NULL,
        [DA] decimal(18,4) NOT NULL,
        [PFWages] decimal(18,4) NOT NULL,
        [EmployeeContribution] decimal(18,4) NOT NULL,
        [EmployerContributionPF] decimal(18,4) NOT NULL,
        [EmployerContributionEPS] decimal(18,4) NOT NULL,
        [AdminCharges] decimal(18,4) NOT NULL,
        [TotalContribution] decimal(18,4) NOT NULL,
        [InterestEarned] decimal(18,4) NOT NULL,
        [TotalBalance] decimal(18,4) NOT NULL,
        [FinancialYear] int NOT NULL,
        [MonthYear] int NOT NULL,
        [Status] int NOT NULL,
        [ClosureDate] datetime2 NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ProvidentFunds] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [RefreshTokens] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [TokenHash] nvarchar(max) NULL,
        [DeviceId] nvarchar(max) NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [IsRevoked] bit NOT NULL,
        [RevokedAt] datetime2 NULL,
        [ParentTokenId] uniqueidentifier NULL,
        [ReplacedByTokenId] uniqueidentifier NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [RolePermissions] (
        [Id] uniqueidentifier NOT NULL,
        [RoleId] uniqueidentifier NOT NULL,
        [PermissionId] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_RolePermissions] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [Roles] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [Shifts] (
        [Id] uniqueidentifier NOT NULL,
        [ShiftName] nvarchar(100) NOT NULL,
        [ShiftCode] nvarchar(50) NOT NULL,
        [Description] nvarchar(500) NULL,
        [StartTime] time NOT NULL,
        [EndTime] time NOT NULL,
        [DurationHours] decimal(18,4) NOT NULL,
        [GracePeriodMinutes] int NOT NULL,
        [BreakDurationMinutes] int NOT NULL,
        [ShiftType] int NOT NULL,
        [ApplicableDays] nvarchar(200) NULL,
        [IsNightShift] bit NOT NULL,
        [NightShiftAllowance] decimal(18,4) NOT NULL,
        [IsActive] bit NOT NULL,
        [MinEmployeesRequired] int NOT NULL,
        [MaxEmployeesAllowed] int NOT NULL,
        [DepartmentId] uniqueidentifier NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Shifts] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [StatutorySettings] (
        [Id] uniqueidentifier NOT NULL,
        [SettingKey] nvarchar(max) NOT NULL,
        [SettingValue] nvarchar(max) NOT NULL,
        [FinancialYear] int NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [EffectiveFrom] datetime2 NOT NULL,
        [EffectiveTo] datetime2 NULL,
        [IsActive] bit NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_StatutorySettings] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [dbo].[TenantConfigs] (
        [Id] uniqueidentifier NOT NULL,
        [ConfigJson] nvarchar(max) NOT NULL,
        [UiSchemaJson] nvarchar(max) NOT NULL,
        [WorkflowJson] nvarchar(max) NOT NULL,
        [BrandingJson] nvarchar(max) NOT NULL,
        [Notes] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_TenantConfigs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [TenantModules] (
        [Id] uniqueidentifier NOT NULL,
        [ModuleKey] nvarchar(450) NOT NULL,
        [IsEnabled] bit NOT NULL,
        [EnabledAt] datetime2 NOT NULL,
        [DisabledAt] datetime2 NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_TenantModules] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [dbo].[Tenants] (
        [Id] uniqueidentifier NOT NULL,
        [Subdomain] nvarchar(max) NULL,
        [Name] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [ProvisionStatus] nvarchar(32) NOT NULL DEFAULT N'Pending',
        [DeletedAt] datetime2 NULL,
        [DeletedBy] uniqueidentifier NULL,
        [FeatureFlags] nvarchar(max) NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Tenants] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [TrainingCourses] (
        [Id] uniqueidentifier NOT NULL,
        [Title] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [Instructor] nvarchar(max) NULL,
        [InstructorId] uniqueidentifier NULL,
        [Category] nvarchar(max) NOT NULL,
        [Level] nvarchar(max) NOT NULL,
        [DurationHours] int NOT NULL,
        [Duration] int NOT NULL,
        [StartDate] datetime2 NOT NULL,
        [EndDate] datetime2 NULL,
        [MaxParticipants] int NOT NULL,
        [Cost] decimal(18,4) NULL,
        [Location] nvarchar(max) NULL,
        [DeliveryMode] int NOT NULL,
        [Status] int NOT NULL,
        [IsActive] bit NOT NULL,
        [Syllabus] nvarchar(max) NULL,
        [PrerequisiteSkills] nvarchar(max) NULL,
        [CurrentEnrollment] int NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_TrainingCourses] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [UserRoles] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [RoleId] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_UserRoles] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] uniqueidentifier NOT NULL,
        [Email] nvarchar(450) NOT NULL,
        [PasswordHash] nvarchar(max) NOT NULL,
        [FullName] nvarchar(max) NULL,
        [IsSystemAdmin] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [PasswordResetToken] nvarchar(max) NULL,
        [PasswordResetExpires] datetime2 NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [Vendors] (
        [Id] uniqueidentifier NOT NULL,
        [VendorCode] nvarchar(max) NOT NULL,
        [VendorName] nvarchar(max) NOT NULL,
        [VendorType] nvarchar(max) NOT NULL,
        [CompanyName] nvarchar(max) NULL,
        [GSTNumber] nvarchar(max) NULL,
        [PANNumber] nvarchar(max) NULL,
        [Email] nvarchar(max) NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [MobileNumber] nvarchar(max) NULL,
        [Address] nvarchar(max) NULL,
        [City] nvarchar(max) NULL,
        [State] nvarchar(max) NULL,
        [Country] nvarchar(max) NULL,
        [PostalCode] nvarchar(max) NULL,
        [ContactPerson] nvarchar(max) NULL,
        [CreditLimit] decimal(18,4) NOT NULL,
        [PaymentTerms] int NOT NULL,
        [OpeningBalance] decimal(18,4) NOT NULL,
        [CurrentBalance] decimal(18,4) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [BankName] nvarchar(max) NULL,
        [BankAccountNumber] nvarchar(max) NULL,
        [IFSCCode] nvarchar(max) NULL,
        [Notes] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Vendors] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [Warehouses] (
        [Id] uniqueidentifier NOT NULL,
        [WarehouseCode] nvarchar(max) NOT NULL,
        [WarehouseName] nvarchar(max) NOT NULL,
        [Address] nvarchar(max) NULL,
        [City] nvarchar(max) NULL,
        [State] nvarchar(max) NULL,
        [Country] nvarchar(max) NULL,
        [PostalCode] nvarchar(max) NULL,
        [ContactPerson] nvarchar(max) NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [Email] nvarchar(max) NULL,
        [IsDefault] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Warehouses] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [WebsitePages] (
        [Id] uniqueidentifier NOT NULL,
        [PageType] nvarchar(max) NOT NULL,
        [Title] nvarchar(max) NOT NULL,
        [ContentJson] nvarchar(max) NOT NULL,
        [IsPublished] bit NOT NULL,
        [PublishedAt] datetime2 NULL,
        [PublishedBy] uniqueidentifier NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_WebsitePages] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [WorkflowDefinitions] (
        [Id] uniqueidentifier NOT NULL,
        [ModuleKey] nvarchar(max) NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [IsActive] bit NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_WorkflowDefinitions] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [SalesQuotations] (
        [Id] uniqueidentifier NOT NULL,
        [QuotationNumber] nvarchar(max) NOT NULL,
        [QuotationDate] datetime2 NOT NULL,
        [CustomerId] uniqueidentifier NOT NULL,
        [ValidUntil] datetime2 NOT NULL,
        [SubTotal] decimal(18,4) NOT NULL,
        [TaxAmount] decimal(18,4) NOT NULL,
        [DiscountAmount] decimal(18,4) NOT NULL,
        [ShippingCharges] decimal(18,4) NOT NULL,
        [TotalAmount] decimal(18,4) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [Terms] nvarchar(max) NULL,
        [Notes] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_SalesQuotations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SalesQuotations_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [ESIBenefits] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [ESIId] uniqueidentifier NOT NULL,
        [BenefitType] nvarchar(max) NOT NULL,
        [BenefitStartDate] datetime2 NOT NULL,
        [BenefitEndDate] datetime2 NOT NULL,
        [BenefitAmount] decimal(18,4) NOT NULL,
        [Status] int NOT NULL,
        [EmployeeStateInsuranceId] uniqueidentifier NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ESIBenefits] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ESIBenefits_EmployeeStateInsurances_EmployeeStateInsuranceId] FOREIGN KEY ([EmployeeStateInsuranceId]) REFERENCES [EmployeeStateInsurances] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [EntityFieldValues] (
        [Id] uniqueidentifier NOT NULL,
        [FieldDefinitionId] uniqueidentifier NOT NULL,
        [RecordId] uniqueidentifier NOT NULL,
        [Value] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_EntityFieldValues] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_EntityFieldValues_EntityFieldDefinitions_FieldDefinitionId] FOREIGN KEY ([FieldDefinitionId]) REFERENCES [EntityFieldDefinitions] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [AssetAllocations] (
        [Id] uniqueidentifier NOT NULL,
        [AssetId] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [AllocationDate] datetime2 NOT NULL,
        [DeallocationDate] datetime2 NULL,
        [Purpose] nvarchar(max) NOT NULL,
        [AllocationNotes] nvarchar(max) NOT NULL,
        [DeallocationReason] nvarchar(max) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [ConditionOnAllocation] nvarchar(max) NOT NULL,
        [ConditionOnDeallocation] nvarchar(max) NOT NULL,
        [ConditionAssessmentValue] decimal(18,4) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AssetAllocations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AssetAllocations_FixedAssets_AssetId] FOREIGN KEY ([AssetId]) REFERENCES [FixedAssets] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [AssetDepreciations] (
        [Id] uniqueidentifier NOT NULL,
        [AssetId] uniqueidentifier NOT NULL,
        [DepreciationPeriodStart] datetime2 NOT NULL,
        [DepreciationPeriodEnd] datetime2 NOT NULL,
        [DepreciationAmount] decimal(18,4) NOT NULL,
        [OpeningValue] decimal(18,4) NOT NULL,
        [ClosingValue] decimal(18,4) NOT NULL,
        [DepreciationPercent] decimal(18,4) NOT NULL,
        [IsPosted] bit NOT NULL,
        [PostedDate] datetime2 NULL,
        [JournalEntryNumber] nvarchar(max) NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AssetDepreciations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AssetDepreciations_FixedAssets_AssetId] FOREIGN KEY ([AssetId]) REFERENCES [FixedAssets] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [AssetMaintenances] (
        [Id] uniqueidentifier NOT NULL,
        [AssetId] uniqueidentifier NOT NULL,
        [MaintenanceDate] datetime2 NOT NULL,
        [ScheduledDate] datetime2 NULL,
        [MaintenanceType] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [Status] int NOT NULL,
        [MaintenanceCost] decimal(18,4) NOT NULL,
        [VendorName] nvarchar(max) NOT NULL,
        [VendorContact] nvarchar(max) NOT NULL,
        [TechnicianName] nvarchar(max) NOT NULL,
        [TechnicianNotes] nvarchar(max) NOT NULL,
        [StartDateTime] datetime2 NOT NULL,
        [EndDateTime] datetime2 NOT NULL,
        [DurationHours] decimal(18,4) NOT NULL,
        [NextMaintenanceDate] datetime2 NULL,
        [MaintenanceFrequency] nvarchar(max) NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AssetMaintenances] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AssetMaintenances_FixedAssets_AssetId] FOREIGN KEY ([AssetId]) REFERENCES [FixedAssets] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [TaxDeclarations] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [IncomeTaxId] uniqueidentifier NOT NULL,
        [EmployeeNumber] nvarchar(max) NOT NULL,
        [EmployeeName] nvarchar(max) NOT NULL,
        [DepartmentId] uniqueidentifier NOT NULL,
        [FinancialYear] int NOT NULL,
        [DeclarationDate] datetime2 NOT NULL,
        [IsRevised] bit NOT NULL,
        [Section80CLIFPremium] decimal(18,4) NOT NULL,
        [Section80CELSSInvestment] decimal(18,4) NOT NULL,
        [Section80CFDDeposit] decimal(18,4) NOT NULL,
        [Section80C_Total] decimal(18,4) NOT NULL,
        [Section80D_SelfFamily] decimal(18,4) NOT NULL,
        [Section80D_Parents] decimal(18,4) NOT NULL,
        [Section80D_Total] decimal(18,4) NOT NULL,
        [Section80G_Donation] decimal(18,4) NOT NULL,
        [Section80G_DeductionClaimed] decimal(18,4) NOT NULL,
        [Section80E_InterestOnEducationLoan] decimal(18,4) NOT NULL,
        [OtherDeductions] decimal(18,4) NOT NULL,
        [TotalDeductionsUnderOldRegime] decimal(18,4) NOT NULL,
        [HRAClaim] decimal(18,4) NOT NULL,
        [RentPaid] decimal(18,4) NOT NULL,
        [IsHRAApplied] bit NOT NULL,
        [Status] int NOT NULL,
        [ProofSubmissionDeadline] datetime2 NOT NULL,
        [ProofSubmitted] bit NOT NULL,
        [ProofSubmittedDate] datetime2 NULL,
        [ProofDocuments] nvarchar(max) NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_TaxDeclarations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TaxDeclarations_IncomeTaxes_IncomeTaxId] FOREIGN KEY ([IncomeTaxId]) REFERENCES [IncomeTaxes] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [JournalEntryLines] (
        [Id] uniqueidentifier NOT NULL,
        [JournalEntryId] uniqueidentifier NOT NULL,
        [AccountId] uniqueidentifier NOT NULL,
        [DebitAmount] decimal(18,4) NOT NULL,
        [CreditAmount] decimal(18,4) NOT NULL,
        [Description] nvarchar(max) NULL,
        [ReferenceType] nvarchar(max) NULL,
        [ReferenceId] uniqueidentifier NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_JournalEntryLines] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_JournalEntryLines_ChartOfAccounts_AccountId] FOREIGN KEY ([AccountId]) REFERENCES [ChartOfAccounts] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_JournalEntryLines_JournalEntries_JournalEntryId] FOREIGN KEY ([JournalEntryId]) REFERENCES [JournalEntries] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [Payments] (
        [Id] uniqueidentifier NOT NULL,
        [PaymentNumber] nvarchar(max) NOT NULL,
        [PaymentDate] datetime2 NOT NULL,
        [PaymentType] nvarchar(max) NOT NULL,
        [PartyType] nvarchar(max) NULL,
        [PartyId] uniqueidentifier NULL,
        [PartyName] nvarchar(max) NULL,
        [Amount] decimal(18,4) NOT NULL,
        [PaymentMode] nvarchar(max) NOT NULL,
        [ReferenceNumber] nvarchar(max) NULL,
        [ReferenceDate] datetime2 NULL,
        [BankName] nvarchar(max) NULL,
        [BankAccountId] uniqueidentifier NULL,
        [InvoiceType] nvarchar(max) NULL,
        [InvoiceId] uniqueidentifier NULL,
        [InvoiceNumber] nvarchar(max) NULL,
        [Status] nvarchar(max) NOT NULL,
        [Remarks] nvarchar(max) NULL,
        [JournalEntryId] uniqueidentifier NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Payments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Payments_JournalEntries_JournalEntryId] FOREIGN KEY ([JournalEntryId]) REFERENCES [JournalEntries] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [OvertimeApprovals] (
        [Id] uniqueidentifier NOT NULL,
        [OvertimeRequestId] uniqueidentifier NOT NULL,
        [ApproverId] uniqueidentifier NOT NULL,
        [ApproverName] nvarchar(100) NOT NULL,
        [ApproverRole] nvarchar(50) NOT NULL,
        [Status] int NOT NULL,
        [ApprovedDate] datetime2 NULL,
        [RejectedDate] datetime2 NULL,
        [ApprovalNotes] nvarchar(500) NULL,
        [RejectionReason] nvarchar(500) NULL,
        [ApprovalLevel] int NOT NULL,
        [IsRequired] bit NOT NULL,
        [ApprovedHours] decimal(18,4) NULL,
        [ApprovedAmount] decimal(18,4) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_OvertimeApprovals] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OvertimeApprovals_OvertimeRequests_OvertimeRequestId] FOREIGN KEY ([OvertimeRequestId]) REFERENCES [OvertimeRequests] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [OvertimeLogs] (
        [Id] uniqueidentifier NOT NULL,
        [OvertimeRequestId] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [OvertimeDate] datetime2 NOT NULL,
        [OvertimeHours] decimal(18,4) NOT NULL,
        [OvertimeRate] decimal(18,4) NOT NULL,
        [OvertimeAmount] decimal(18,4) NOT NULL,
        [OvertimeType] int NOT NULL,
        [CompensationType] int NOT NULL,
        [IsProcessedInPayroll] bit NOT NULL,
        [PayrollRunId] uniqueidentifier NULL,
        [PayrollProcessedDate] datetime2 NULL,
        [CompensatoryLeaveHours] decimal(18,4) NULL,
        [CompensatoryLeaveExpiryDate] datetime2 NULL,
        [IsCompensatoryLeaveUtilized] bit NOT NULL,
        [Notes] nvarchar(500) NULL,
        [ProjectCode] nvarchar(200) NULL,
        [ProjectId] uniqueidentifier NULL,
        [PayslipLineItemId] uniqueidentifier NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_OvertimeLogs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OvertimeLogs_OvertimeRequests_OvertimeRequestId] FOREIGN KEY ([OvertimeRequestId]) REFERENCES [OvertimeRequests] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [PFWithdrawals] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [PFId] uniqueidentifier NOT NULL,
        [EmployeeNumber] nvarchar(max) NOT NULL,
        [EmployeeName] nvarchar(max) NOT NULL,
        [WithdrawalType] int NOT NULL,
        [WithdrawalAmount] decimal(18,4) NOT NULL,
        [PFBalance] decimal(18,4) NOT NULL,
        [Reason] nvarchar(max) NOT NULL,
        [ApplicationDate] datetime2 NOT NULL,
        [ApprovedDate] datetime2 NULL,
        [RejectedDate] datetime2 NULL,
        [ProcessedDate] datetime2 NULL,
        [ApproverId] uniqueidentifier NULL,
        [ApproverName] nvarchar(max) NOT NULL,
        [Status] int NOT NULL,
        [RejectionReason] nvarchar(max) NOT NULL,
        [BankAccountNumber] nvarchar(max) NOT NULL,
        [BankIFSC] nvarchar(max) NOT NULL,
        [TransactionReference] nvarchar(max) NOT NULL,
        [TDSOnWithdrawal] decimal(18,4) NOT NULL,
        [ProvidentFundId] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_PFWithdrawals] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PFWithdrawals_ProvidentFunds_ProvidentFundId] FOREIGN KEY ([ProvidentFundId]) REFERENCES [ProvidentFunds] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [ShiftRotations] (
        [Id] uniqueidentifier NOT NULL,
        [RotationName] nvarchar(100) NOT NULL,
        [Description] nvarchar(500) NULL,
        [StartDate] datetime2 NOT NULL,
        [EndDate] datetime2 NULL,
        [RotationCycleDays] int NOT NULL,
        [RotationType] int NOT NULL,
        [RotationPattern] nvarchar(2000) NULL,
        [DepartmentId] uniqueidentifier NULL,
        [IsActive] bit NOT NULL,
        [AutoAssign] bit NOT NULL,
        [ShiftId] uniqueidentifier NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ShiftRotations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ShiftRotations_Shifts_ShiftId] FOREIGN KEY ([ShiftId]) REFERENCES [Shifts] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [CourseEnrollments] (
        [Id] uniqueidentifier NOT NULL,
        [CourseId] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EnrollmentDate] datetime2 NOT NULL,
        [Status] int NOT NULL,
        [CompletionDate] datetime2 NULL,
        [IsCompleted] bit NOT NULL,
        [Score] decimal(18,4) NULL,
        [Feedback] nvarchar(max) NULL,
        [CertificateIssuedDate] datetime2 NULL,
        [HasCertificate] bit NOT NULL,
        [CertificateId] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_CourseEnrollments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CourseEnrollments_TrainingCourses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [TrainingCourses] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_CourseEnrollments_Users_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [JobPostings] (
        [Id] uniqueidentifier NOT NULL,
        [Title] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [Department] nvarchar(max) NOT NULL,
        [Location] nvarchar(max) NOT NULL,
        [Level] int NOT NULL,
        [JobType] int NOT NULL,
        [MinSalary] decimal(18,4) NOT NULL,
        [MaxSalary] decimal(18,4) NOT NULL,
        [RequiredSkills] nvarchar(max) NULL,
        [NiceToHaveSkills] nvarchar(max) NULL,
        [PostedDate] datetime2 NOT NULL,
        [ClosingDate] datetime2 NULL,
        [Status] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedByUserId] uniqueidentifier NULL,
        [NumberOfPositions] int NULL,
        [ApplicationCount] int NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_JobPostings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_JobPostings_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [PerformanceAppraisals] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [ManagerId] uniqueidentifier NOT NULL,
        [AppraisalCycleId] uniqueidentifier NOT NULL,
        [SelfAssessmentScore] decimal(18,4) NULL,
        [SelfAssessmentComments] nvarchar(max) NULL,
        [SelfAssessmentSubmittedAt] datetime2 NULL,
        [ManagerAssessmentScore] decimal(18,4) NULL,
        [ManagerAssessmentComments] nvarchar(max) NULL,
        [ManagerAssessmentSubmittedAt] datetime2 NULL,
        [OverallRating] decimal(18,4) NULL,
        [Status] int NOT NULL,
        [IsFinalized] bit NOT NULL,
        [FinalizedAt] datetime2 NULL,
        [ApprovedBy] uniqueidentifier NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_PerformanceAppraisals] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PerformanceAppraisals_AppraisalCycles_AppraisalCycleId] FOREIGN KEY ([AppraisalCycleId]) REFERENCES [AppraisalCycles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_PerformanceAppraisals_Users_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_PerformanceAppraisals_Users_ManagerId] FOREIGN KEY ([ManagerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [TrainingRequests] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [CourseTitle] nvarchar(max) NOT NULL,
        [Justification] nvarchar(max) NOT NULL,
        [RequestDate] datetime2 NOT NULL,
        [StartDate] datetime2 NULL,
        [Status] int NOT NULL,
        [ApprovedBy] uniqueidentifier NULL,
        [ApprovedByUserId] uniqueidentifier NULL,
        [ApprovedDate] datetime2 NULL,
        [RejectionReason] nvarchar(max) NULL,
        [RejectionDate] datetime2 NULL,
        [RequestedBudget] decimal(18,4) NULL,
        [ApprovedBudget] decimal(18,4) NULL,
        [SkillsToAcquire] nvarchar(max) NULL,
        [TrainingType] nvarchar(max) NULL,
        [Description] nvarchar(max) NULL,
        [BudgetAmount] decimal(18,4) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_TrainingRequests] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TrainingRequests_Users_ApprovedByUserId] FOREIGN KEY ([ApprovedByUserId]) REFERENCES [Users] ([Id]),
        CONSTRAINT [FK_TrainingRequests_Users_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [Items] (
        [Id] uniqueidentifier NOT NULL,
        [ItemCode] nvarchar(max) NOT NULL,
        [ItemName] nvarchar(max) NOT NULL,
        [ItemType] nvarchar(max) NOT NULL,
        [Category] nvarchar(max) NULL,
        [SubCategory] nvarchar(max) NULL,
        [Description] nvarchar(max) NULL,
        [UnitOfMeasure] nvarchar(max) NOT NULL,
        [HSNCode] nvarchar(max) NULL,
        [PurchasePrice] decimal(18,4) NOT NULL,
        [SellingPrice] decimal(18,4) NOT NULL,
        [MRP] decimal(18,4) NOT NULL,
        [MinStockLevel] decimal(18,4) NOT NULL,
        [MaxStockLevel] decimal(18,4) NOT NULL,
        [ReorderLevel] decimal(18,4) NOT NULL,
        [ReorderQuantity] decimal(18,4) NOT NULL,
        [CurrentStock] decimal(18,4) NOT NULL,
        [ImageUrl] nvarchar(max) NULL,
        [Barcode] nvarchar(max) NULL,
        [IsTaxable] bit NOT NULL,
        [TaxRate] decimal(18,4) NOT NULL,
        [IsActive] bit NOT NULL,
        [DefaultVendorId] uniqueidentifier NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Items] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Items_Vendors_DefaultVendorId] FOREIGN KEY ([DefaultVendorId]) REFERENCES [Vendors] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [PurchaseOrders] (
        [Id] uniqueidentifier NOT NULL,
        [PONumber] nvarchar(max) NOT NULL,
        [PODate] datetime2 NOT NULL,
        [VendorId] uniqueidentifier NOT NULL,
        [VendorReference] nvarchar(max) NULL,
        [ExpectedDeliveryDate] datetime2 NULL,
        [SubTotal] decimal(18,4) NOT NULL,
        [TaxAmount] decimal(18,4) NOT NULL,
        [DiscountAmount] decimal(18,4) NOT NULL,
        [ShippingCharges] decimal(18,4) NOT NULL,
        [TotalAmount] decimal(18,4) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [ShippingAddress] nvarchar(max) NULL,
        [BillingAddress] nvarchar(max) NULL,
        [Terms] nvarchar(max) NULL,
        [Notes] nvarchar(max) NULL,
        [ApprovedBy] uniqueidentifier NULL,
        [ApprovedDate] datetime2 NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_PurchaseOrders] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PurchaseOrders_Vendors_VendorId] FOREIGN KEY ([VendorId]) REFERENCES [Vendors] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [ApprovalRequests] (
        [Id] uniqueidentifier NOT NULL,
        [ModuleKey] nvarchar(max) NOT NULL,
        [EntityType] nvarchar(max) NOT NULL,
        [EntityId] uniqueidentifier NOT NULL,
        [WorkflowDefinitionId] uniqueidentifier NOT NULL,
        [CurrentStep] int NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [RequestedBy] uniqueidentifier NOT NULL,
        [RequestedAt] datetime2 NOT NULL,
        [ApprovedBy] uniqueidentifier NULL,
        [ApprovedAt] datetime2 NULL,
        [RejectedBy] uniqueidentifier NULL,
        [RejectedAt] datetime2 NULL,
        [Comments] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ApprovalRequests] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ApprovalRequests_WorkflowDefinitions_WorkflowDefinitionId] FOREIGN KEY ([WorkflowDefinitionId]) REFERENCES [WorkflowDefinitions] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [WorkflowSteps] (
        [Id] uniqueidentifier NOT NULL,
        [WorkflowDefinitionId] uniqueidentifier NOT NULL,
        [StepOrder] int NOT NULL,
        [RoleRequired] nvarchar(max) NOT NULL,
        [ApprovalType] nvarchar(max) NOT NULL,
        [EscalationDays] int NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_WorkflowSteps] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_WorkflowSteps_WorkflowDefinitions_WorkflowDefinitionId] FOREIGN KEY ([WorkflowDefinitionId]) REFERENCES [WorkflowDefinitions] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [SalesOrders] (
        [Id] uniqueidentifier NOT NULL,
        [SONumber] nvarchar(max) NOT NULL,
        [SODate] datetime2 NOT NULL,
        [CustomerId] uniqueidentifier NOT NULL,
        [SalesQuotationId] uniqueidentifier NULL,
        [CustomerPONumber] nvarchar(max) NULL,
        [ExpectedDeliveryDate] datetime2 NULL,
        [SubTotal] decimal(18,4) NOT NULL,
        [TaxAmount] decimal(18,4) NOT NULL,
        [DiscountAmount] decimal(18,4) NOT NULL,
        [ShippingCharges] decimal(18,4) NOT NULL,
        [TotalAmount] decimal(18,4) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [ShippingAddress] nvarchar(max) NULL,
        [BillingAddress] nvarchar(max) NULL,
        [Terms] nvarchar(max) NULL,
        [Notes] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_SalesOrders] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SalesOrders_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_SalesOrders_SalesQuotations_SalesQuotationId] FOREIGN KEY ([SalesQuotationId]) REFERENCES [SalesQuotations] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [OvertimeCompensations] (
        [Id] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [OvertimeLogId] uniqueidentifier NOT NULL,
        [CompensationType] int NOT NULL,
        [CashAmount] decimal(18,4) NULL,
        [TimeOffHours] decimal(18,4) NULL,
        [TimeOffExpiryDate] datetime2 NULL,
        [IsTimeOffUtilized] bit NOT NULL,
        [TimeOffUtilizedDate] datetime2 NULL,
        [LeaveRequestId] uniqueidentifier NULL,
        [PaymentReference] nvarchar(100) NULL,
        [PaymentDate] datetime2 NULL,
        [Status] int NOT NULL,
        [Notes] nvarchar(500) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_OvertimeCompensations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OvertimeCompensations_OvertimeLogs_OvertimeLogId] FOREIGN KEY ([OvertimeLogId]) REFERENCES [OvertimeLogs] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [RotationSchedules] (
        [Id] uniqueidentifier NOT NULL,
        [RotationId] uniqueidentifier NOT NULL,
        [ShiftId] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [DayNumber] int NOT NULL,
        [ScheduledDate] datetime2 NOT NULL,
        [WeekNumber] int NOT NULL,
        [Status] int NOT NULL,
        [Notes] nvarchar(500) NULL,
        [IsAutoGenerated] bit NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_RotationSchedules] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RotationSchedules_ShiftRotations_RotationId] FOREIGN KEY ([RotationId]) REFERENCES [ShiftRotations] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_RotationSchedules_Shifts_ShiftId] FOREIGN KEY ([ShiftId]) REFERENCES [Shifts] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [ShiftAssignments] (
        [Id] uniqueidentifier NOT NULL,
        [ShiftId] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EffectiveFrom] datetime2 NOT NULL,
        [EffectiveTo] datetime2 NULL,
        [AssignmentType] int NOT NULL,
        [AssignmentReason] nvarchar(500) NULL,
        [Status] int NOT NULL,
        [ApprovedBy] uniqueidentifier NULL,
        [ApprovedDate] datetime2 NULL,
        [Notes] nvarchar(500) NULL,
        [IsRotational] bit NOT NULL,
        [RotationId] uniqueidentifier NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ShiftAssignments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ShiftAssignments_ShiftRotations_RotationId] FOREIGN KEY ([RotationId]) REFERENCES [ShiftRotations] ([Id]),
        CONSTRAINT [FK_ShiftAssignments_Shifts_ShiftId] FOREIGN KEY ([ShiftId]) REFERENCES [Shifts] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [TrainingAssessments] (
        [Id] uniqueidentifier NOT NULL,
        [EnrollmentId] uniqueidentifier NOT NULL,
        [AssessmentType] nvarchar(max) NOT NULL,
        [Title] nvarchar(max) NOT NULL,
        [AssessmentDate] datetime2 NOT NULL,
        [TotalMarks] decimal(18,4) NOT NULL,
        [ObtainedMarks] decimal(18,4) NOT NULL,
        [PercentageScore] decimal(18,4) NOT NULL,
        [Result] int NOT NULL,
        [Comments] nvarchar(max) NULL,
        [ReviewedBy] nvarchar(max) NULL,
        [ReviewDate] datetime2 NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_TrainingAssessments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TrainingAssessments_CourseEnrollments_EnrollmentId] FOREIGN KEY ([EnrollmentId]) REFERENCES [CourseEnrollments] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [TrainingCertificates] (
        [Id] uniqueidentifier NOT NULL,
        [EnrollmentId] uniqueidentifier NOT NULL,
        [CertificateNumber] nvarchar(max) NOT NULL,
        [Title] nvarchar(max) NOT NULL,
        [IssuedDate] datetime2 NOT NULL,
        [ExpiryDate] datetime2 NULL,
        [IsExpired] bit NOT NULL,
        [DigitalCertificateUrl] nvarchar(max) NULL,
        [FinalScore] decimal(18,4) NOT NULL,
        [Notes] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_TrainingCertificates] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TrainingCertificates_CourseEnrollments_EnrollmentId] FOREIGN KEY ([EnrollmentId]) REFERENCES [CourseEnrollments] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [Candidates] (
        [Id] uniqueidentifier NOT NULL,
        [FirstName] nvarchar(max) NOT NULL,
        [LastName] nvarchar(max) NOT NULL,
        [Email] nvarchar(max) NOT NULL,
        [PhoneNumber] nvarchar(max) NOT NULL,
        [CurrentCompany] nvarchar(max) NOT NULL,
        [CurrentDesignation] nvarchar(max) NOT NULL,
        [YearsOfExperience] int NOT NULL,
        [Resume] nvarchar(max) NULL,
        [CoverLetter] nvarchar(max) NULL,
        [Status] int NOT NULL,
        [OverallRating] int NOT NULL,
        [SourceOfRecruit] nvarchar(max) NULL,
        [Notes] nvarchar(max) NULL,
        [AppliedDate] datetime2 NOT NULL,
        [InterviewDate] datetime2 NULL,
        [InterviewFeedback] nvarchar(max) NULL,
        [InterviewedBy] uniqueidentifier NULL,
        [InterviewedByUserId] uniqueidentifier NULL,
        [JobPostingId] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Candidates] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Candidates_JobPostings_JobPostingId] FOREIGN KEY ([JobPostingId]) REFERENCES [JobPostings] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Candidates_Users_InterviewedByUserId] FOREIGN KEY ([InterviewedByUserId]) REFERENCES [Users] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [AppraisalRatings] (
        [Id] uniqueidentifier NOT NULL,
        [AppraisalId] uniqueidentifier NOT NULL,
        [CompetencyId] uniqueidentifier NOT NULL,
        [SelfScore] decimal(18,4) NULL,
        [ManagerScore] decimal(18,4) NULL,
        [Comments] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AppraisalRatings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AppraisalRatings_AppraisalCompetencies_CompetencyId] FOREIGN KEY ([CompetencyId]) REFERENCES [AppraisalCompetencies] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_AppraisalRatings_PerformanceAppraisals_AppraisalId] FOREIGN KEY ([AppraisalId]) REFERENCES [PerformanceAppraisals] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [SalesQuotationItems] (
        [Id] uniqueidentifier NOT NULL,
        [SalesQuotationId] uniqueidentifier NOT NULL,
        [ItemId] uniqueidentifier NOT NULL,
        [Description] nvarchar(max) NULL,
        [Quantity] decimal(18,4) NOT NULL,
        [UnitPrice] decimal(18,4) NOT NULL,
        [TaxRate] decimal(18,4) NOT NULL,
        [TaxAmount] decimal(18,4) NOT NULL,
        [DiscountPercent] decimal(18,4) NOT NULL,
        [DiscountAmount] decimal(18,4) NOT NULL,
        [TotalAmount] decimal(18,4) NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_SalesQuotationItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SalesQuotationItems_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_SalesQuotationItems_SalesQuotations_SalesQuotationId] FOREIGN KEY ([SalesQuotationId]) REFERENCES [SalesQuotations] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [StockBalances] (
        [Id] uniqueidentifier NOT NULL,
        [ItemId] uniqueidentifier NOT NULL,
        [WarehouseId] uniqueidentifier NOT NULL,
        [QuantityOnHand] decimal(18,4) NOT NULL,
        [QuantityReserved] decimal(18,4) NOT NULL,
        [QuantityAvailable] decimal(18,4) NOT NULL,
        [AverageUnitCost] decimal(18,4) NOT NULL,
        [TotalValue] decimal(18,4) NOT NULL,
        [LastUpdated] datetime2 NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_StockBalances] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_StockBalances_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_StockBalances_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [StockMovements] (
        [Id] uniqueidentifier NOT NULL,
        [MovementNumber] nvarchar(max) NOT NULL,
        [MovementDate] datetime2 NOT NULL,
        [MovementType] nvarchar(max) NOT NULL,
        [ItemId] uniqueidentifier NOT NULL,
        [WarehouseId] uniqueidentifier NULL,
        [Quantity] decimal(18,4) NOT NULL,
        [UnitPrice] decimal(18,4) NOT NULL,
        [TotalValue] decimal(18,4) NOT NULL,
        [ReferenceType] nvarchar(max) NULL,
        [ReferenceId] uniqueidentifier NULL,
        [ReferenceNumber] nvarchar(max) NULL,
        [Remarks] nvarchar(max) NULL,
        [FromWarehouseId] uniqueidentifier NULL,
        [ToWarehouseId] uniqueidentifier NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_StockMovements] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_StockMovements_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_StockMovements_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [PurchaseInvoices] (
        [Id] uniqueidentifier NOT NULL,
        [InvoiceNumber] nvarchar(max) NOT NULL,
        [InvoiceDate] datetime2 NOT NULL,
        [VendorId] uniqueidentifier NOT NULL,
        [PurchaseOrderId] uniqueidentifier NULL,
        [VendorInvoiceNumber] nvarchar(max) NULL,
        [VendorInvoiceDate] datetime2 NULL,
        [DueDate] datetime2 NULL,
        [SubTotal] decimal(18,4) NOT NULL,
        [TaxAmount] decimal(18,4) NOT NULL,
        [DiscountAmount] decimal(18,4) NOT NULL,
        [OtherCharges] decimal(18,4) NOT NULL,
        [TotalAmount] decimal(18,4) NOT NULL,
        [PaidAmount] decimal(18,4) NOT NULL,
        [BalanceAmount] decimal(18,4) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [PaymentStatus] nvarchar(max) NOT NULL,
        [Notes] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_PurchaseInvoices] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PurchaseInvoices_PurchaseOrders_PurchaseOrderId] FOREIGN KEY ([PurchaseOrderId]) REFERENCES [PurchaseOrders] ([Id]),
        CONSTRAINT [FK_PurchaseInvoices_Vendors_VendorId] FOREIGN KEY ([VendorId]) REFERENCES [Vendors] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [PurchaseOrderItems] (
        [Id] uniqueidentifier NOT NULL,
        [PurchaseOrderId] uniqueidentifier NOT NULL,
        [ItemId] uniqueidentifier NOT NULL,
        [Description] nvarchar(max) NULL,
        [Quantity] decimal(18,4) NOT NULL,
        [UnitPrice] decimal(18,4) NOT NULL,
        [TaxRate] decimal(18,4) NOT NULL,
        [TaxAmount] decimal(18,4) NOT NULL,
        [DiscountPercent] decimal(18,4) NOT NULL,
        [DiscountAmount] decimal(18,4) NOT NULL,
        [TotalAmount] decimal(18,4) NOT NULL,
        [ReceivedQuantity] decimal(18,4) NOT NULL,
        [PendingQuantity] decimal(18,4) NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_PurchaseOrderItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PurchaseOrderItems_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PurchaseOrderItems_PurchaseOrders_PurchaseOrderId] FOREIGN KEY ([PurchaseOrderId]) REFERENCES [PurchaseOrders] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [SalesInvoices] (
        [Id] uniqueidentifier NOT NULL,
        [InvoiceNumber] nvarchar(max) NOT NULL,
        [InvoiceDate] datetime2 NOT NULL,
        [CustomerId] uniqueidentifier NOT NULL,
        [SalesOrderId] uniqueidentifier NULL,
        [DueDate] datetime2 NULL,
        [SubTotal] decimal(18,4) NOT NULL,
        [TaxAmount] decimal(18,4) NOT NULL,
        [DiscountAmount] decimal(18,4) NOT NULL,
        [ShippingCharges] decimal(18,4) NOT NULL,
        [OtherCharges] decimal(18,4) NOT NULL,
        [TotalAmount] decimal(18,4) NOT NULL,
        [PaidAmount] decimal(18,4) NOT NULL,
        [BalanceAmount] decimal(18,4) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [PaymentStatus] nvarchar(max) NOT NULL,
        [Notes] nvarchar(max) NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_SalesInvoices] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SalesInvoices_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_SalesInvoices_SalesOrders_SalesOrderId] FOREIGN KEY ([SalesOrderId]) REFERENCES [SalesOrders] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [SalesOrderItems] (
        [Id] uniqueidentifier NOT NULL,
        [SalesOrderId] uniqueidentifier NOT NULL,
        [ItemId] uniqueidentifier NOT NULL,
        [Description] nvarchar(max) NULL,
        [Quantity] decimal(18,4) NOT NULL,
        [UnitPrice] decimal(18,4) NOT NULL,
        [TaxRate] decimal(18,4) NOT NULL,
        [TaxAmount] decimal(18,4) NOT NULL,
        [DiscountPercent] decimal(18,4) NOT NULL,
        [DiscountAmount] decimal(18,4) NOT NULL,
        [TotalAmount] decimal(18,4) NOT NULL,
        [DeliveredQuantity] decimal(18,4) NOT NULL,
        [PendingQuantity] decimal(18,4) NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_SalesOrderItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SalesOrderItems_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_SalesOrderItems_SalesOrders_SalesOrderId] FOREIGN KEY ([SalesOrderId]) REFERENCES [SalesOrders] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [ShiftSwaps] (
        [Id] uniqueidentifier NOT NULL,
        [RequestorEmployeeId] uniqueidentifier NOT NULL,
        [RequestorShiftAssignmentId] uniqueidentifier NOT NULL,
        [TargetEmployeeId] uniqueidentifier NOT NULL,
        [TargetShiftAssignmentId] uniqueidentifier NOT NULL,
        [SwapDate] datetime2 NOT NULL,
        [Reason] nvarchar(500) NOT NULL,
        [Status] int NOT NULL,
        [TargetResponseDate] datetime2 NULL,
        [TargetResponseNotes] nvarchar(500) NULL,
        [ApprovedBy] uniqueidentifier NULL,
        [ApprovedDate] datetime2 NULL,
        [ApprovalNotes] nvarchar(500) NULL,
        [RejectedDate] datetime2 NULL,
        [RejectionReason] nvarchar(500) NULL,
        [ExecutedDate] datetime2 NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ShiftSwaps] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ShiftSwaps_ShiftAssignments_RequestorShiftAssignmentId] FOREIGN KEY ([RequestorShiftAssignmentId]) REFERENCES [ShiftAssignments] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ShiftSwaps_ShiftAssignments_TargetShiftAssignmentId] FOREIGN KEY ([TargetShiftAssignmentId]) REFERENCES [ShiftAssignments] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [CandidateScreenings] (
        [Id] uniqueidentifier NOT NULL,
        [CandidateId] uniqueidentifier NOT NULL,
        [ScreeningType] nvarchar(max) NOT NULL,
        [ScheduledDate] datetime2 NOT NULL,
        [Status] int NOT NULL,
        [Interviewer] nvarchar(max) NULL,
        [InterviewedBy] uniqueidentifier NULL,
        [InterviewedByUserId] uniqueidentifier NULL,
        [TechnicalSkillsRating] int NOT NULL,
        [CommunicationRating] int NOT NULL,
        [CulturalFitRating] int NOT NULL,
        [OverallScore] decimal(18,4) NOT NULL,
        [Comments] nvarchar(max) NULL,
        [CompletedDate] datetime2 NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_CandidateScreenings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CandidateScreenings_Candidates_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [Candidates] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_CandidateScreenings_Users_InterviewedByUserId] FOREIGN KEY ([InterviewedByUserId]) REFERENCES [Users] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [JobApplications] (
        [Id] uniqueidentifier NOT NULL,
        [CandidateId] uniqueidentifier NOT NULL,
        [JobPostingId] uniqueidentifier NOT NULL,
        [Status] int NOT NULL,
        [ApplicationDate] datetime2 NOT NULL,
        [RejectionReason] nvarchar(max) NULL,
        [RejectionDate] datetime2 NULL,
        [RejectedBy] uniqueidentifier NULL,
        [RejectedByUserId] uniqueidentifier NULL,
        [ScreeningRound] int NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_JobApplications] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_JobApplications_Candidates_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [Candidates] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_JobApplications_JobPostings_JobPostingId] FOREIGN KEY ([JobPostingId]) REFERENCES [JobPostings] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_JobApplications_Users_RejectedByUserId] FOREIGN KEY ([RejectedByUserId]) REFERENCES [Users] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [OfferLetters] (
        [Id] uniqueidentifier NOT NULL,
        [JobPostingId] uniqueidentifier NOT NULL,
        [CandidateId] uniqueidentifier NOT NULL,
        [OfferSalary] decimal(18,4) NOT NULL,
        [OfferDate] datetime2 NOT NULL,
        [ExpiryDate] datetime2 NOT NULL,
        [JoiningDate] datetime2 NULL,
        [JoiningDesignation] nvarchar(max) NULL,
        [Department] nvarchar(max) NULL,
        [ReportingManager] nvarchar(max) NULL,
        [Status] int NOT NULL,
        [AcceptedDate] datetime2 NULL,
        [RejectedDate] datetime2 NULL,
        [RejectionReason] nvarchar(max) NULL,
        [IsJoined] bit NOT NULL,
        [CreatedByUserId] uniqueidentifier NULL,
        [AcceptedBy] uniqueidentifier NULL,
        [AcceptedByUserId] uniqueidentifier NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_OfferLetters] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OfferLetters_Candidates_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [Candidates] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_OfferLetters_JobPostings_JobPostingId] FOREIGN KEY ([JobPostingId]) REFERENCES [JobPostings] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_OfferLetters_Users_AcceptedByUserId] FOREIGN KEY ([AcceptedByUserId]) REFERENCES [Users] ([Id]),
        CONSTRAINT [FK_OfferLetters_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [PurchaseInvoiceItems] (
        [Id] uniqueidentifier NOT NULL,
        [PurchaseInvoiceId] uniqueidentifier NOT NULL,
        [ItemId] uniqueidentifier NOT NULL,
        [Description] nvarchar(max) NULL,
        [Quantity] decimal(18,4) NOT NULL,
        [UnitPrice] decimal(18,4) NOT NULL,
        [TaxRate] decimal(18,4) NOT NULL,
        [TaxAmount] decimal(18,4) NOT NULL,
        [DiscountPercent] decimal(18,4) NOT NULL,
        [DiscountAmount] decimal(18,4) NOT NULL,
        [TotalAmount] decimal(18,4) NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_PurchaseInvoiceItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PurchaseInvoiceItems_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PurchaseInvoiceItems_PurchaseInvoices_PurchaseInvoiceId] FOREIGN KEY ([PurchaseInvoiceId]) REFERENCES [PurchaseInvoices] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE TABLE [SalesInvoiceItems] (
        [Id] uniqueidentifier NOT NULL,
        [SalesInvoiceId] uniqueidentifier NOT NULL,
        [ItemId] uniqueidentifier NOT NULL,
        [Description] nvarchar(max) NULL,
        [Quantity] decimal(18,4) NOT NULL,
        [UnitPrice] decimal(18,4) NOT NULL,
        [TaxRate] decimal(18,4) NOT NULL,
        [TaxAmount] decimal(18,4) NOT NULL,
        [DiscountPercent] decimal(18,4) NOT NULL,
        [DiscountAmount] decimal(18,4) NOT NULL,
        [TotalAmount] decimal(18,4) NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_SalesInvoiceItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SalesInvoiceItems_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_SalesInvoiceItems_SalesInvoices_SalesInvoiceId] FOREIGN KEY ([SalesInvoiceId]) REFERENCES [SalesInvoices] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_AppraisalRatings_AppraisalId] ON [AppraisalRatings] ([AppraisalId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_AppraisalRatings_CompetencyId] ON [AppraisalRatings] ([CompetencyId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_ApprovalRequests_WorkflowDefinitionId] ON [ApprovalRequests] ([WorkflowDefinitionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_AssetAllocations_AssetId] ON [AssetAllocations] ([AssetId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_AssetDepreciations_AssetId] ON [AssetDepreciations] ([AssetId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_AssetMaintenances_AssetId] ON [AssetMaintenances] ([AssetId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_AttendanceRecords_TenantId_EmployeeId_Timestamp] ON [AttendanceRecords] ([TenantId], [EmployeeId], [Timestamp]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_Candidates_InterviewedByUserId] ON [Candidates] ([InterviewedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_Candidates_JobPostingId] ON [Candidates] ([JobPostingId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_CandidateScreenings_CandidateId] ON [CandidateScreenings] ([CandidateId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_CandidateScreenings_InterviewedByUserId] ON [CandidateScreenings] ([InterviewedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_ChartOfAccounts_ParentAccountId] ON [ChartOfAccounts] ([ParentAccountId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_CourseEnrollments_CourseId] ON [CourseEnrollments] ([CourseId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_CourseEnrollments_EmployeeId] ON [CourseEnrollments] ([EmployeeId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_Employees_TenantId_CompanyId] ON [Employees] ([TenantId], [CompanyId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_EntityFieldValues_FieldDefinitionId] ON [EntityFieldValues] ([FieldDefinitionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_ESIBenefits_EmployeeStateInsuranceId] ON [ESIBenefits] ([EmployeeStateInsuranceId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_HelpdeskEscalations_TenantId_HelpdeskTicketId_EscalatedAt] ON [HelpdeskEscalations] ([TenantId], [HelpdeskTicketId], [EscalatedAt]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE UNIQUE INDEX [IX_HelpdeskTickets_TenantId_TicketNumber] ON [HelpdeskTickets] ([TenantId], [TicketNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_Items_DefaultVendorId] ON [Items] ([DefaultVendorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_JobApplications_CandidateId] ON [JobApplications] ([CandidateId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_JobApplications_JobPostingId] ON [JobApplications] ([JobPostingId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_JobApplications_RejectedByUserId] ON [JobApplications] ([RejectedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_JobPostings_CreatedByUserId] ON [JobPostings] ([CreatedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_JournalEntryLines_AccountId] ON [JournalEntryLines] ([AccountId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_JournalEntryLines_JournalEntryId] ON [JournalEntryLines] ([JournalEntryId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_OfferLetters_AcceptedByUserId] ON [OfferLetters] ([AcceptedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_OfferLetters_CandidateId] ON [OfferLetters] ([CandidateId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_OfferLetters_CreatedByUserId] ON [OfferLetters] ([CreatedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_OfferLetters_JobPostingId] ON [OfferLetters] ([JobPostingId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_OvertimeApprovals_OvertimeRequestId] ON [OvertimeApprovals] ([OvertimeRequestId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_OvertimeCompensations_OvertimeLogId] ON [OvertimeCompensations] ([OvertimeLogId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE UNIQUE INDEX [IX_OvertimeLogs_OvertimeRequestId] ON [OvertimeLogs] ([OvertimeRequestId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_Payments_JournalEntryId] ON [Payments] ([JournalEntryId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_PerformanceAppraisals_AppraisalCycleId] ON [PerformanceAppraisals] ([AppraisalCycleId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_PerformanceAppraisals_EmployeeId] ON [PerformanceAppraisals] ([EmployeeId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_PerformanceAppraisals_ManagerId] ON [PerformanceAppraisals] ([ManagerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_PFWithdrawals_ProvidentFundId] ON [PFWithdrawals] ([ProvidentFundId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_PurchaseInvoiceItems_ItemId] ON [PurchaseInvoiceItems] ([ItemId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_PurchaseInvoiceItems_PurchaseInvoiceId] ON [PurchaseInvoiceItems] ([PurchaseInvoiceId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_PurchaseInvoices_PurchaseOrderId] ON [PurchaseInvoices] ([PurchaseOrderId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_PurchaseInvoices_VendorId] ON [PurchaseInvoices] ([VendorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_PurchaseOrderItems_ItemId] ON [PurchaseOrderItems] ([ItemId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_PurchaseOrderItems_PurchaseOrderId] ON [PurchaseOrderItems] ([PurchaseOrderId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_PurchaseOrders_VendorId] ON [PurchaseOrders] ([VendorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_RotationSchedules_RotationId] ON [RotationSchedules] ([RotationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_RotationSchedules_ShiftId] ON [RotationSchedules] ([ShiftId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_SalesInvoiceItems_ItemId] ON [SalesInvoiceItems] ([ItemId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_SalesInvoiceItems_SalesInvoiceId] ON [SalesInvoiceItems] ([SalesInvoiceId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_SalesInvoices_CustomerId] ON [SalesInvoices] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_SalesInvoices_SalesOrderId] ON [SalesInvoices] ([SalesOrderId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_SalesOrderItems_ItemId] ON [SalesOrderItems] ([ItemId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_SalesOrderItems_SalesOrderId] ON [SalesOrderItems] ([SalesOrderId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_SalesOrders_CustomerId] ON [SalesOrders] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_SalesOrders_SalesQuotationId] ON [SalesOrders] ([SalesQuotationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_SalesQuotationItems_ItemId] ON [SalesQuotationItems] ([ItemId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_SalesQuotationItems_SalesQuotationId] ON [SalesQuotationItems] ([SalesQuotationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_SalesQuotations_CustomerId] ON [SalesQuotations] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_ShiftAssignments_RotationId] ON [ShiftAssignments] ([RotationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_ShiftAssignments_ShiftId] ON [ShiftAssignments] ([ShiftId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_ShiftRotations_ShiftId] ON [ShiftRotations] ([ShiftId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_ShiftSwaps_RequestorShiftAssignmentId] ON [ShiftSwaps] ([RequestorShiftAssignmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_ShiftSwaps_TargetShiftAssignmentId] ON [ShiftSwaps] ([TargetShiftAssignmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_StockBalances_ItemId] ON [StockBalances] ([ItemId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_StockBalances_WarehouseId] ON [StockBalances] ([WarehouseId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_StockMovements_ItemId] ON [StockMovements] ([ItemId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_StockMovements_WarehouseId] ON [StockMovements] ([WarehouseId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_TaxDeclarations_IncomeTaxId] ON [TaxDeclarations] ([IncomeTaxId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TenantModules_TenantId_ModuleKey] ON [TenantModules] ([TenantId], [ModuleKey]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_TrainingAssessments_EnrollmentId] ON [TrainingAssessments] ([EnrollmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_TrainingCertificates_EnrollmentId] ON [TrainingCertificates] ([EnrollmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_TrainingRequests_ApprovedByUserId] ON [TrainingRequests] ([ApprovedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_TrainingRequests_EmployeeId] ON [TrainingRequests] ([EmployeeId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_TenantId_Email] ON [Users] ([TenantId], [Email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    CREATE INDEX [IX_WorkflowSteps_WorkflowDefinitionId] ON [WorkflowSteps] ([WorkflowDefinitionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260522190506__FullSchemaFromInitial'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260522190506__FullSchemaFromInitial', N'8.0.0');
END;
GO

COMMIT;
GO

