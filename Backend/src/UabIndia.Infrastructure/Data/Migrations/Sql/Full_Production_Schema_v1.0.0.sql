-- ============================================================================
-- UABINDIA ENTERPRISE CLOUD ERP & PLATFORM - MASTER PRODUCTION SCHEMA V1.0.0
-- Generated for Enterprise DBAs, Cloud Deployment Pipelines, and Azure SQL
-- Target Engine: Microsoft SQL Server 2019+ / Azure SQL Database
-- Execution Mode: Idempotent (Safe to run repeatedly on new or existing DB)
-- Generated At: 2026-09-02 (Release v1.0.0-prod-ready)
-- ============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Ensure EF Core Migrations History table exists
IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260324190830_InitialCleanSchema.sql <<<<<
-- ============================================================================
-- Idempotent ERP schema bootstrap
IF OBJECT_ID(N'[BaseEntity]', N'U') IS NOT NULL
    DROP TABLE [BaseEntity];
GO
IF OBJECT_ID(N'dbo.ModuleMigrations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ModuleMigrations (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ModuleKey NVARCHAR(100) NOT NULL,
        Version NVARCHAR(50) NOT NULL,
        AppliedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_ModuleMigrations_Module_Version UNIQUE (ModuleKey, Version)
    );
END
GO
IF OBJECT_ID(N'[AppraisalCompetencies]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[AppraisalCycles]', N'U') IS NULL
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
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'hrms' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[AttendanceCorrections]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'hrms' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[AttendanceRecords]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'auth' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[AuditLogs]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID(N'[ChartOfAccounts]', N'U') IS NULL
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
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'core' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[Companies]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID(N'[ComplianceAudits]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[ComplianceReports]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[ContactSubmissions]', N'U') IS NULL
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
    END
    ELSE IF COL_LENGTH('ContactSubmissions', 'BusinessId') IS NULL
        ALTER TABLE [ContactSubmissions] ADD [BusinessId] nvarchar(max) NULL;
GO
IF OBJECT_ID(N'[Customers]', N'U') IS NULL
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
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'hrms' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[EmployeeLeaves]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'hrms' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[Employees]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'hrms' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[EmployeeStateInsurances]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID(N'[EntityFieldDefinitions]', N'U') IS NULL
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
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'core' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[FeatureFlags]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID(N'[FixedAssets]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[HelpdeskEscalations]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[HelpdeskFaqArticles]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[HelpdeskTickets]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[Holidays]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[IncomeTaxes]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[JournalEntries]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[LeaveAllocations]', N'U') IS NULL
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
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'hrms' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[LeavePolicies]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID(N'[LeavePolicyRules]', N'U') IS NULL
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
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'hrms' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[LeaveRequests]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'hrms' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[LeaveTypes]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID(N'[dbo].[Modules]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[OvertimeRequests]', N'U') IS NULL
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
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'payroll' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[PayrollComponents]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'payroll' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[PayrollRuns]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'payroll' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[PayrollStructures]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'payroll' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[Payslips]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID(N'[Permissions]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[ProfessionalTaxes]', N'U') IS NULL
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
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'core' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[Projects]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID(N'[ProvidentFunds]', N'U') IS NULL
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
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'auth' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[RefreshTokens]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID(N'[RolePermissions]', N'U') IS NULL
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
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'auth' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[Roles]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'hrms' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[Shifts]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID(N'[StatutorySettings]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[dbo].[TenantConfigs]', N'U') IS NULL
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
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'core' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[TenantModules]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'core' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[dbo].[Tenants]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID(N'[TrainingCourses]', N'U') IS NULL
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
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'auth' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[UserRoles]', N'U') IS NULL
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
    END
END
GO
IF OBJECT_ID('dbo.ModuleMigrations','U') IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'auth' AND Version = '0001')
BEGIN
    IF OBJECT_ID(N'[Users]', N'U') IS NULL
    BEGIN
        CREATE TABLE [Users] (
        [Id] uniqueidentifier NOT NULL,
        [Email] nvarchar(450) NOT NULL,
        [PasswordHash] nvarchar(max) NOT NULL,
        [FullName] nvarchar(max) NULL,
        [IsSystemAdmin] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [PasswordResetToken] nvarchar(512) NULL,
        [PasswordResetExpires] datetime2 NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
    );
    END
END
GO
IF OBJECT_ID(N'[Vendors]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[Warehouses]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[WebsitePages]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[WorkflowDefinitions]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[SalesQuotations]', N'U') IS NULL
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
        CONSTRAINT [FK_SalesQuotations_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id])
    );
END
GO
IF OBJECT_ID(N'[ESIBenefits]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[EntityFieldValues]', N'U') IS NULL
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
        CONSTRAINT [FK_EntityFieldValues_EntityFieldDefinitions_FieldDefinitionId] FOREIGN KEY ([FieldDefinitionId]) REFERENCES [EntityFieldDefinitions] ([Id])
    );
END
GO
IF OBJECT_ID(N'[AssetAllocations]', N'U') IS NULL
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
        CONSTRAINT [FK_AssetAllocations_FixedAssets_AssetId] FOREIGN KEY ([AssetId]) REFERENCES [FixedAssets] ([Id])
    );
END
GO
IF OBJECT_ID(N'[AssetDepreciations]', N'U') IS NULL
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
        CONSTRAINT [FK_AssetDepreciations_FixedAssets_AssetId] FOREIGN KEY ([AssetId]) REFERENCES [FixedAssets] ([Id])
    );
END
GO
IF OBJECT_ID(N'[AssetMaintenances]', N'U') IS NULL
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
        CONSTRAINT [FK_AssetMaintenances_FixedAssets_AssetId] FOREIGN KEY ([AssetId]) REFERENCES [FixedAssets] ([Id])
    );
END
GO
IF OBJECT_ID(N'[TaxDeclarations]', N'U') IS NULL
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
        CONSTRAINT [FK_TaxDeclarations_IncomeTaxes_IncomeTaxId] FOREIGN KEY ([IncomeTaxId]) REFERENCES [IncomeTaxes] ([Id])
    );
END
GO
IF OBJECT_ID(N'[JournalEntryLines]', N'U') IS NULL
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
        CONSTRAINT [FK_JournalEntryLines_ChartOfAccounts_AccountId] FOREIGN KEY ([AccountId]) REFERENCES [ChartOfAccounts] ([Id]),
        CONSTRAINT [FK_JournalEntryLines_JournalEntries_JournalEntryId] FOREIGN KEY ([JournalEntryId]) REFERENCES [JournalEntries] ([Id])
    );
END
GO
IF OBJECT_ID(N'[Payments]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[OvertimeApprovals]', N'U') IS NULL
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
        CONSTRAINT [FK_OvertimeApprovals_OvertimeRequests_OvertimeRequestId] FOREIGN KEY ([OvertimeRequestId]) REFERENCES [OvertimeRequests] ([Id])
    );
END
GO
IF OBJECT_ID(N'[OvertimeLogs]', N'U') IS NULL
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
        CONSTRAINT [FK_OvertimeLogs_OvertimeRequests_OvertimeRequestId] FOREIGN KEY ([OvertimeRequestId]) REFERENCES [OvertimeRequests] ([Id])
    );
END
GO
IF OBJECT_ID(N'[PFWithdrawals]', N'U') IS NULL
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
        CONSTRAINT [FK_PFWithdrawals_ProvidentFunds_ProvidentFundId] FOREIGN KEY ([ProvidentFundId]) REFERENCES [ProvidentFunds] ([Id])
    );
END
GO
IF OBJECT_ID(N'[ShiftRotations]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[CourseEnrollments]', N'U') IS NULL
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
        CONSTRAINT [FK_CourseEnrollments_TrainingCourses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [TrainingCourses] ([Id]),
        CONSTRAINT [FK_CourseEnrollments_Users_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Users] ([Id])
    );
END
GO
IF OBJECT_ID(N'[JobPostings]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[PerformanceAppraisals]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[TrainingRequests]', N'U') IS NULL
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
        CONSTRAINT [FK_TrainingRequests_Users_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Users] ([Id])
    );
END
GO
IF OBJECT_ID(N'[Items]', N'U') IS NULL
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
END
GO
IF OBJECT_ID(N'[PurchaseOrders]', N'U') IS NULL
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
        CONSTRAINT [FK_PurchaseOrders_Vendors_VendorId] FOREIGN KEY ([VendorId]) REFERENCES [Vendors] ([Id])
    );
END
GO
IF OBJECT_ID(N'[ApprovalRequests]', N'U') IS NULL
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
        CONSTRAINT [FK_ApprovalRequests_WorkflowDefinitions_WorkflowDefinitionId] FOREIGN KEY ([WorkflowDefinitionId]) REFERENCES [WorkflowDefinitions] ([Id])
    );
END
GO
IF OBJECT_ID(N'[WorkflowSteps]', N'U') IS NULL
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
        CONSTRAINT [FK_WorkflowSteps_WorkflowDefinitions_WorkflowDefinitionId] FOREIGN KEY ([WorkflowDefinitionId]) REFERENCES [WorkflowDefinitions] ([Id])
    );
END
GO
IF OBJECT_ID(N'[SalesOrders]', N'U') IS NULL
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
        CONSTRAINT [FK_SalesOrders_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]),
        CONSTRAINT [FK_SalesOrders_SalesQuotations_SalesQuotationId] FOREIGN KEY ([SalesQuotationId]) REFERENCES [SalesQuotations] ([Id])
    );
END
GO
IF OBJECT_ID(N'[OvertimeCompensations]', N'U') IS NULL
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
        CONSTRAINT [FK_OvertimeCompensations_OvertimeLogs_OvertimeLogId] FOREIGN KEY ([OvertimeLogId]) REFERENCES [OvertimeLogs] ([Id])
    );
END
GO
IF OBJECT_ID(N'[RotationSchedules]', N'U') IS NULL
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
        CONSTRAINT [FK_RotationSchedules_ShiftRotations_RotationId] FOREIGN KEY ([RotationId]) REFERENCES [ShiftRotations] ([Id]),
        CONSTRAINT [FK_RotationSchedules_Shifts_ShiftId] FOREIGN KEY ([ShiftId]) REFERENCES [Shifts] ([Id])
    );
END
GO
IF OBJECT_ID(N'[ShiftAssignments]', N'U') IS NULL
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
        CONSTRAINT [FK_ShiftAssignments_Shifts_ShiftId] FOREIGN KEY ([ShiftId]) REFERENCES [Shifts] ([Id])
    );
END
GO
IF OBJECT_ID(N'[TrainingAssessments]', N'U') IS NULL
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
        CONSTRAINT [FK_TrainingAssessments_CourseEnrollments_EnrollmentId] FOREIGN KEY ([EnrollmentId]) REFERENCES [CourseEnrollments] ([Id])
    );
END
GO
IF OBJECT_ID(N'[TrainingCertificates]', N'U') IS NULL
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
        CONSTRAINT [FK_TrainingCertificates_CourseEnrollments_EnrollmentId] FOREIGN KEY ([EnrollmentId]) REFERENCES [CourseEnrollments] ([Id])
    );
END
GO
IF OBJECT_ID(N'[Candidates]', N'U') IS NULL
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
        CONSTRAINT [FK_Candidates_JobPostings_JobPostingId] FOREIGN KEY ([JobPostingId]) REFERENCES [JobPostings] ([Id]),
        CONSTRAINT [FK_Candidates_Users_InterviewedByUserId] FOREIGN KEY ([InterviewedByUserId]) REFERENCES [Users] ([Id])
    );
END
GO
IF OBJECT_ID(N'[AppraisalRatings]', N'U') IS NULL
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
        CONSTRAINT [FK_AppraisalRatings_PerformanceAppraisals_AppraisalId] FOREIGN KEY ([AppraisalId]) REFERENCES [PerformanceAppraisals] ([Id])
    );
END
GO
IF OBJECT_ID(N'[SalesQuotationItems]', N'U') IS NULL
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
        CONSTRAINT [FK_SalesQuotationItems_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]),
        CONSTRAINT [FK_SalesQuotationItems_SalesQuotations_SalesQuotationId] FOREIGN KEY ([SalesQuotationId]) REFERENCES [SalesQuotations] ([Id])
    );
END
GO
IF OBJECT_ID(N'[StockBalances]', N'U') IS NULL
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
        CONSTRAINT [FK_StockBalances_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]),
        CONSTRAINT [FK_StockBalances_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id])
    );
END
GO
IF OBJECT_ID(N'[StockMovements]', N'U') IS NULL
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
        CONSTRAINT [FK_StockMovements_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]),
        CONSTRAINT [FK_StockMovements_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id])
    );
END
GO
IF OBJECT_ID(N'[PurchaseInvoices]', N'U') IS NULL
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
        CONSTRAINT [FK_PurchaseInvoices_Vendors_VendorId] FOREIGN KEY ([VendorId]) REFERENCES [Vendors] ([Id])
    );
END
GO
IF OBJECT_ID(N'[PurchaseOrderItems]', N'U') IS NULL
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
        CONSTRAINT [FK_PurchaseOrderItems_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]),
        CONSTRAINT [FK_PurchaseOrderItems_PurchaseOrders_PurchaseOrderId] FOREIGN KEY ([PurchaseOrderId]) REFERENCES [PurchaseOrders] ([Id])
    );
END
GO
IF OBJECT_ID(N'[SalesInvoices]', N'U') IS NULL
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
        CONSTRAINT [FK_SalesInvoices_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]),
        CONSTRAINT [FK_SalesInvoices_SalesOrders_SalesOrderId] FOREIGN KEY ([SalesOrderId]) REFERENCES [SalesOrders] ([Id])
    );
END
GO
IF OBJECT_ID(N'[SalesOrderItems]', N'U') IS NULL
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
        CONSTRAINT [FK_SalesOrderItems_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]),
        CONSTRAINT [FK_SalesOrderItems_SalesOrders_SalesOrderId] FOREIGN KEY ([SalesOrderId]) REFERENCES [SalesOrders] ([Id])
    );
END
GO
IF OBJECT_ID(N'[ShiftSwaps]', N'U') IS NULL
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
        CONSTRAINT [FK_ShiftSwaps_ShiftAssignments_RequestorShiftAssignmentId] FOREIGN KEY ([RequestorShiftAssignmentId]) REFERENCES [ShiftAssignments] ([Id]),
        CONSTRAINT [FK_ShiftSwaps_ShiftAssignments_TargetShiftAssignmentId] FOREIGN KEY ([TargetShiftAssignmentId]) REFERENCES [ShiftAssignments] ([Id])
    );
END
GO
IF OBJECT_ID(N'[CandidateScreenings]', N'U') IS NULL
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
        CONSTRAINT [FK_CandidateScreenings_Candidates_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [Candidates] ([Id]),
        CONSTRAINT [FK_CandidateScreenings_Users_InterviewedByUserId] FOREIGN KEY ([InterviewedByUserId]) REFERENCES [Users] ([Id])
    );
END
GO
IF OBJECT_ID(N'[JobApplications]', N'U') IS NULL
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
        CONSTRAINT [FK_JobApplications_Candidates_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [Candidates] ([Id]),
        CONSTRAINT [FK_JobApplications_JobPostings_JobPostingId] FOREIGN KEY ([JobPostingId]) REFERENCES [JobPostings] ([Id]),
        CONSTRAINT [FK_JobApplications_Users_RejectedByUserId] FOREIGN KEY ([RejectedByUserId]) REFERENCES [Users] ([Id])
    );
END
GO
IF OBJECT_ID(N'[OfferLetters]', N'U') IS NULL
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
        CONSTRAINT [FK_OfferLetters_Candidates_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [Candidates] ([Id]),
        CONSTRAINT [FK_OfferLetters_JobPostings_JobPostingId] FOREIGN KEY ([JobPostingId]) REFERENCES [JobPostings] ([Id]),
        CONSTRAINT [FK_OfferLetters_Users_AcceptedByUserId] FOREIGN KEY ([AcceptedByUserId]) REFERENCES [Users] ([Id]),
        CONSTRAINT [FK_OfferLetters_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id])
    );
END
GO
IF OBJECT_ID(N'[PurchaseInvoiceItems]', N'U') IS NULL
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
        CONSTRAINT [FK_PurchaseInvoiceItems_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]),
        CONSTRAINT [FK_PurchaseInvoiceItems_PurchaseInvoices_PurchaseInvoiceId] FOREIGN KEY ([PurchaseInvoiceId]) REFERENCES [PurchaseInvoices] ([Id])
    );
END
GO
IF OBJECT_ID(N'[SalesInvoiceItems]', N'U') IS NULL
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
        CONSTRAINT [FK_SalesInvoiceItems_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]),
        CONSTRAINT [FK_SalesInvoiceItems_SalesInvoices_SalesInvoiceId] FOREIGN KEY ([SalesInvoiceId]) REFERENCES [SalesInvoices] ([Id])
    );
END
GO
CREATE INDEX [IX_AppraisalRatings_AppraisalId] ON [AppraisalRatings] ([AppraisalId]);
GO
CREATE INDEX [IX_AppraisalRatings_CompetencyId] ON [AppraisalRatings] ([CompetencyId]);
GO
CREATE INDEX [IX_ApprovalRequests_WorkflowDefinitionId] ON [ApprovalRequests] ([WorkflowDefinitionId]);
GO
CREATE INDEX [IX_AssetAllocations_AssetId] ON [AssetAllocations] ([AssetId]);
GO
CREATE INDEX [IX_AssetDepreciations_AssetId] ON [AssetDepreciations] ([AssetId]);
GO
CREATE INDEX [IX_AssetMaintenances_AssetId] ON [AssetMaintenances] ([AssetId]);
GO
CREATE INDEX [IX_AttendanceRecords_TenantId_EmployeeId_Timestamp] ON [AttendanceRecords] ([TenantId], [EmployeeId], [Timestamp]);
GO
CREATE INDEX [IX_Candidates_InterviewedByUserId] ON [Candidates] ([InterviewedByUserId]);
GO
CREATE INDEX [IX_Candidates_JobPostingId] ON [Candidates] ([JobPostingId]);
GO
CREATE INDEX [IX_CandidateScreenings_CandidateId] ON [CandidateScreenings] ([CandidateId]);
GO
CREATE INDEX [IX_CandidateScreenings_InterviewedByUserId] ON [CandidateScreenings] ([InterviewedByUserId]);
GO
CREATE INDEX [IX_ChartOfAccounts_ParentAccountId] ON [ChartOfAccounts] ([ParentAccountId]);
GO
CREATE INDEX [IX_CourseEnrollments_CourseId] ON [CourseEnrollments] ([CourseId]);
GO
CREATE INDEX [IX_CourseEnrollments_EmployeeId] ON [CourseEnrollments] ([EmployeeId]);
GO
CREATE INDEX [IX_Employees_TenantId_CompanyId] ON [Employees] ([TenantId], [CompanyId]);
GO
CREATE INDEX [IX_EntityFieldValues_FieldDefinitionId] ON [EntityFieldValues] ([FieldDefinitionId]);
GO
CREATE INDEX [IX_ESIBenefits_EmployeeStateInsuranceId] ON [ESIBenefits] ([EmployeeStateInsuranceId]);
GO
CREATE INDEX [IX_HelpdeskEscalations_TenantId_HelpdeskTicketId_EscalatedAt] ON [HelpdeskEscalations] ([TenantId], [HelpdeskTicketId], [EscalatedAt]);
GO
CREATE UNIQUE INDEX [IX_HelpdeskTickets_TenantId_TicketNumber] ON [HelpdeskTickets] ([TenantId], [TicketNumber]);
GO
CREATE INDEX [IX_Items_DefaultVendorId] ON [Items] ([DefaultVendorId]);
GO
CREATE INDEX [IX_JobApplications_CandidateId] ON [JobApplications] ([CandidateId]);
GO
CREATE INDEX [IX_JobApplications_JobPostingId] ON [JobApplications] ([JobPostingId]);
GO
CREATE INDEX [IX_JobApplications_RejectedByUserId] ON [JobApplications] ([RejectedByUserId]);
GO
CREATE INDEX [IX_JobPostings_CreatedByUserId] ON [JobPostings] ([CreatedByUserId]);
GO
CREATE INDEX [IX_JournalEntryLines_AccountId] ON [JournalEntryLines] ([AccountId]);
GO
CREATE INDEX [IX_JournalEntryLines_JournalEntryId] ON [JournalEntryLines] ([JournalEntryId]);
GO
CREATE INDEX [IX_OfferLetters_AcceptedByUserId] ON [OfferLetters] ([AcceptedByUserId]);
GO
CREATE INDEX [IX_OfferLetters_CandidateId] ON [OfferLetters] ([CandidateId]);
GO
CREATE INDEX [IX_OfferLetters_CreatedByUserId] ON [OfferLetters] ([CreatedByUserId]);
GO
CREATE INDEX [IX_OfferLetters_JobPostingId] ON [OfferLetters] ([JobPostingId]);
GO
CREATE INDEX [IX_OvertimeApprovals_OvertimeRequestId] ON [OvertimeApprovals] ([OvertimeRequestId]);
GO
CREATE INDEX [IX_OvertimeCompensations_OvertimeLogId] ON [OvertimeCompensations] ([OvertimeLogId]);
GO
CREATE UNIQUE INDEX [IX_OvertimeLogs_OvertimeRequestId] ON [OvertimeLogs] ([OvertimeRequestId]);
GO
CREATE INDEX [IX_Payments_JournalEntryId] ON [Payments] ([JournalEntryId]);
GO
CREATE INDEX [IX_PerformanceAppraisals_AppraisalCycleId] ON [PerformanceAppraisals] ([AppraisalCycleId]);
GO
CREATE INDEX [IX_PerformanceAppraisals_EmployeeId] ON [PerformanceAppraisals] ([EmployeeId]);
GO
CREATE INDEX [IX_PerformanceAppraisals_ManagerId] ON [PerformanceAppraisals] ([ManagerId]);
GO
CREATE INDEX [IX_PFWithdrawals_ProvidentFundId] ON [PFWithdrawals] ([ProvidentFundId]);
GO
CREATE INDEX [IX_PurchaseInvoiceItems_ItemId] ON [PurchaseInvoiceItems] ([ItemId]);
GO
CREATE INDEX [IX_PurchaseInvoiceItems_PurchaseInvoiceId] ON [PurchaseInvoiceItems] ([PurchaseInvoiceId]);
GO
CREATE INDEX [IX_PurchaseInvoices_PurchaseOrderId] ON [PurchaseInvoices] ([PurchaseOrderId]);
GO
CREATE INDEX [IX_PurchaseInvoices_VendorId] ON [PurchaseInvoices] ([VendorId]);
GO
CREATE INDEX [IX_PurchaseOrderItems_ItemId] ON [PurchaseOrderItems] ([ItemId]);
GO
CREATE INDEX [IX_PurchaseOrderItems_PurchaseOrderId] ON [PurchaseOrderItems] ([PurchaseOrderId]);
GO
CREATE INDEX [IX_PurchaseOrders_VendorId] ON [PurchaseOrders] ([VendorId]);
GO
CREATE INDEX [IX_RotationSchedules_RotationId] ON [RotationSchedules] ([RotationId]);
GO
CREATE INDEX [IX_RotationSchedules_ShiftId] ON [RotationSchedules] ([ShiftId]);
GO
CREATE INDEX [IX_SalesInvoiceItems_ItemId] ON [SalesInvoiceItems] ([ItemId]);
GO
CREATE INDEX [IX_SalesInvoiceItems_SalesInvoiceId] ON [SalesInvoiceItems] ([SalesInvoiceId]);
GO
CREATE INDEX [IX_SalesInvoices_CustomerId] ON [SalesInvoices] ([CustomerId]);
GO
CREATE INDEX [IX_SalesInvoices_SalesOrderId] ON [SalesInvoices] ([SalesOrderId]);
GO
CREATE INDEX [IX_SalesOrderItems_ItemId] ON [SalesOrderItems] ([ItemId]);
GO
CREATE INDEX [IX_SalesOrderItems_SalesOrderId] ON [SalesOrderItems] ([SalesOrderId]);
GO
CREATE INDEX [IX_SalesOrders_CustomerId] ON [SalesOrders] ([CustomerId]);
GO
CREATE INDEX [IX_SalesOrders_SalesQuotationId] ON [SalesOrders] ([SalesQuotationId]);
GO
CREATE INDEX [IX_SalesQuotationItems_ItemId] ON [SalesQuotationItems] ([ItemId]);
GO
CREATE INDEX [IX_SalesQuotationItems_SalesQuotationId] ON [SalesQuotationItems] ([SalesQuotationId]);
GO
CREATE INDEX [IX_SalesQuotations_CustomerId] ON [SalesQuotations] ([CustomerId]);
GO
CREATE INDEX [IX_ShiftAssignments_RotationId] ON [ShiftAssignments] ([RotationId]);
GO
CREATE INDEX [IX_ShiftAssignments_ShiftId] ON [ShiftAssignments] ([ShiftId]);
GO
CREATE INDEX [IX_ShiftRotations_ShiftId] ON [ShiftRotations] ([ShiftId]);
GO
CREATE INDEX [IX_ShiftSwaps_RequestorShiftAssignmentId] ON [ShiftSwaps] ([RequestorShiftAssignmentId]);
GO
CREATE INDEX [IX_ShiftSwaps_TargetShiftAssignmentId] ON [ShiftSwaps] ([TargetShiftAssignmentId]);
GO
CREATE INDEX [IX_StockBalances_ItemId] ON [StockBalances] ([ItemId]);
GO
CREATE INDEX [IX_StockBalances_WarehouseId] ON [StockBalances] ([WarehouseId]);
GO
CREATE INDEX [IX_StockMovements_ItemId] ON [StockMovements] ([ItemId]);
GO
CREATE INDEX [IX_StockMovements_WarehouseId] ON [StockMovements] ([WarehouseId]);
GO
CREATE INDEX [IX_TaxDeclarations_IncomeTaxId] ON [TaxDeclarations] ([IncomeTaxId]);
GO
CREATE UNIQUE INDEX [IX_TenantModules_TenantId_ModuleKey] ON [TenantModules] ([TenantId], [ModuleKey]);
GO
CREATE INDEX [IX_TrainingAssessments_EnrollmentId] ON [TrainingAssessments] ([EnrollmentId]);
GO
CREATE INDEX [IX_TrainingCertificates_EnrollmentId] ON [TrainingCertificates] ([EnrollmentId]);
GO
CREATE INDEX [IX_TrainingRequests_ApprovedByUserId] ON [TrainingRequests] ([ApprovedByUserId]);
GO
CREATE INDEX [IX_TrainingRequests_EmployeeId] ON [TrainingRequests] ([EmployeeId]);
GO
CREATE UNIQUE INDEX [IX_Users_TenantId_Email] ON [Users] ([TenantId], [Email]);
GO
CREATE INDEX [IX_WorkflowSteps_WorkflowDefinitionId] ON [WorkflowSteps] ([WorkflowDefinitionId]);
GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260324190830_InitialCleanSchema')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260324190830_InitialCleanSchema', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260324190830_InitialCleanSchema.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260809043000_AddOrganizationStructure.sql <<<<<
-- ============================================================================
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

GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260809043000_AddOrganizationStructure')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260809043000_AddOrganizationStructure', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260809043000_AddOrganizationStructure.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260809153000_AddTravelAndAiAgents.sql <<<<<
-- ============================================================================
-- Idempotent companion for AddTravelAndAiAgents EF migration.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TravelRequests')
BEGIN
    CREATE TABLE [TravelRequests] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [RequestNumber] nvarchar(64) NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EmployeeName] nvarchar(max) NOT NULL,
        [Destination] nvarchar(max) NOT NULL,
        [Purpose] nvarchar(max) NOT NULL,
        [StartDate] datetime2 NOT NULL,
        [EndDate] datetime2 NOT NULL,
        [EstimatedAmount] decimal(18,2) NOT NULL DEFAULT 0,
        [CurrencyCode] nvarchar(8) NOT NULL DEFAULT 'INR',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Draft',
        CONSTRAINT [PK_TravelRequests] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_TravelRequests_TenantId_Status] ON [TravelRequests]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AiAgents')
BEGIN
    CREATE TABLE [AiAgents] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [AgentKey] nvarchar(128) NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Provider] nvarchar(64) NOT NULL DEFAULT 'OpenAI',
        [ModelName] nvarchar(max) NOT NULL DEFAULT '',
        [Category] nvarchar(64) NOT NULL DEFAULT 'General',
        [IsEnabled] bit NOT NULL DEFAULT 0,
        CONSTRAINT [PK_AiAgents] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_AiAgents_TenantId_AgentKey] ON [AiAgents]([TenantId], [AgentKey]);
END

GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260809153000_AddTravelAndAiAgents')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260809153000_AddTravelAndAiAgents', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260809153000_AddTravelAndAiAgents.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260811010000_AddCrmLeads.sql <<<<<
-- ============================================================================
-- Idempotent companion for AddCrmLeads EF migration.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CrmLeads')
BEGIN
    CREATE TABLE [CrmLeads] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT [DF_CrmLeads_IsDeleted] DEFAULT 0,
        [LeadCode] nvarchar(64) NOT NULL,
        [LeadName] nvarchar(256) NOT NULL,
        [CompanyName] nvarchar(256) NULL,
        [Email] nvarchar(256) NULL,
        [Phone] nvarchar(64) NULL,
        [Stage] nvarchar(64) NOT NULL CONSTRAINT [DF_CrmLeads_Stage] DEFAULT 'New',
        [Status] nvarchar(64) NOT NULL CONSTRAINT [DF_CrmLeads_Status] DEFAULT 'Open',
        [Value] decimal(18,2) NOT NULL CONSTRAINT [DF_CrmLeads_Value] DEFAULT 0,
        [Probability] int NOT NULL CONSTRAINT [DF_CrmLeads_Probability] DEFAULT 0,
        [ExpectedCloseDate] datetime2 NULL,
        [OwnerName] nvarchar(256) NULL,
        [OwnerUserId] uniqueidentifier NULL,
        [Source] nvarchar(128) NULL,
        [Notes] nvarchar(max) NULL,
        CONSTRAINT [PK_CrmLeads] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_CrmLeads_TenantId_Stage] ON [CrmLeads]([TenantId], [Stage]);
    CREATE INDEX [IX_CrmLeads_TenantId_LeadCode] ON [CrmLeads]([TenantId], [LeadCode]);
END

GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260811010000_AddCrmLeads')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260811010000_AddCrmLeads', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260811010000_AddCrmLeads.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260811020000_AddExpensesAndGrn.sql <<<<<
-- ============================================================================
-- Idempotent companion for AddExpensesAndGrn EF migration.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ExpenseClaims')
BEGIN
    CREATE TABLE [ExpenseClaims] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT [DF_ExpenseClaims_IsDeleted] DEFAULT 0,
        [ClaimNumber] nvarchar(64) NOT NULL,
        [EmployeeId] uniqueidentifier NULL,
        [EmployeeName] nvarchar(256) NOT NULL CONSTRAINT [DF_ExpenseClaims_EmployeeName] DEFAULT '',
        [Title] nvarchar(256) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Category] nvarchar(64) NOT NULL CONSTRAINT [DF_ExpenseClaims_Category] DEFAULT 'General',
        [Amount] decimal(18,2) NOT NULL CONSTRAINT [DF_ExpenseClaims_Amount] DEFAULT 0,
        [CurrencyCode] nvarchar(8) NOT NULL CONSTRAINT [DF_ExpenseClaims_Currency] DEFAULT 'INR',
        [ExpenseDate] datetime2 NOT NULL,
        [Status] nvarchar(32) NOT NULL CONSTRAINT [DF_ExpenseClaims_Status] DEFAULT 'Draft',
        [ReceiptUrl] nvarchar(max) NULL,
        [ApprovedBy] nvarchar(256) NULL,
        [SubmittedAt] datetime2 NULL,
        CONSTRAINT [PK_ExpenseClaims] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_ExpenseClaims_TenantId_Status] ON [ExpenseClaims]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'GoodsReceiptNotes')
BEGIN
    CREATE TABLE [GoodsReceiptNotes] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT [DF_GoodsReceiptNotes_IsDeleted] DEFAULT 0,
        [GrnNumber] nvarchar(64) NOT NULL,
        [PurchaseOrderId] uniqueidentifier NULL,
        [PoNumber] nvarchar(64) NULL,
        [VendorId] uniqueidentifier NOT NULL,
        [VendorName] nvarchar(256) NULL,
        [ReceivedDate] datetime2 NOT NULL,
        [TotalItems] int NOT NULL CONSTRAINT [DF_GoodsReceiptNotes_TotalItems] DEFAULT 0,
        [TotalAmount] decimal(18,2) NOT NULL CONSTRAINT [DF_GoodsReceiptNotes_TotalAmount] DEFAULT 0,
        [Status] nvarchar(32) NOT NULL CONSTRAINT [DF_GoodsReceiptNotes_Status] DEFAULT 'PendingQC',
        [Remarks] nvarchar(max) NULL,
        CONSTRAINT [PK_GoodsReceiptNotes] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_GoodsReceiptNotes_TenantId_Status] ON [GoodsReceiptNotes]([TenantId], [Status]);
    CREATE INDEX [IX_GoodsReceiptNotes_TenantId_VendorId] ON [GoodsReceiptNotes]([TenantId], [VendorId]);
END

GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260811020000_AddExpensesAndGrn')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260811020000_AddExpensesAndGrn', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260811020000_AddExpensesAndGrn.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260811030000_AddBankReconciliations.sql <<<<<
-- ============================================================================
-- Idempotent companion for AddBankReconciliations EF migration.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'BankReconciliations')
BEGIN
    CREATE TABLE [BankReconciliations] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT [DF_BankReconciliations_IsDeleted] DEFAULT 0,
        [AccountId] uniqueidentifier NOT NULL,
        [AccountCode] nvarchar(64) NOT NULL,
        [AccountName] nvarchar(256) NOT NULL,
        [Period] nvarchar(16) NOT NULL,
        [BookBalance] decimal(18,2) NOT NULL CONSTRAINT [DF_BankReconciliations_BookBalance] DEFAULT 0,
        [BankBalance] decimal(18,2) NOT NULL CONSTRAINT [DF_BankReconciliations_BankBalance] DEFAULT 0,
        [Difference] decimal(18,2) NOT NULL CONSTRAINT [DF_BankReconciliations_Difference] DEFAULT 0,
        [Status] nvarchar(32) NOT NULL CONSTRAINT [DF_BankReconciliations_Status] DEFAULT 'Pending',
        [ReconciledAt] datetime2 NOT NULL,
        [Remarks] nvarchar(max) NULL,
        CONSTRAINT [PK_BankReconciliations] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_BankReconciliations_TenantId_Period] ON [BankReconciliations]([TenantId], [Period]);
    CREATE INDEX [IX_BankReconciliations_TenantId_AccountId] ON [BankReconciliations]([TenantId], [AccountId]);
END

GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260811030000_AddBankReconciliations')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260811030000_AddBankReconciliations', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260811030000_AddBankReconciliations.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260811120000_AddProjectTasksAndTimesheets.sql <<<<<
-- ============================================================================
-- Idempotent companion for ProjectTasks + TimesheetEntries (Horizon 2).

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ProjectTasks')
BEGIN
    CREATE TABLE [ProjectTasks] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [CompanyId] uniqueidentifier NOT NULL,
        [ProjectId] uniqueidentifier NOT NULL,
        [TaskCode] nvarchar(64) NOT NULL,
        [Title] nvarchar(256) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Status] nvarchar(32) NOT NULL DEFAULT 'Open',
        [AssignedToEmployeeId] uniqueidentifier NULL,
        [AssignedToName] nvarchar(256) NULL,
        [CostCenterId] uniqueidentifier NULL,
        [DueDate] datetime2 NULL,
        [EstimatedHours] decimal(18,2) NULL,
        [Priority] int NOT NULL DEFAULT 2,
        CONSTRAINT [PK_ProjectTasks] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_ProjectTasks_TenantId_ProjectId] ON [ProjectTasks]([TenantId], [ProjectId]);
    CREATE INDEX [IX_ProjectTasks_TenantId_Status] ON [ProjectTasks]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TimesheetEntries')
BEGIN
    CREATE TABLE [TimesheetEntries] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [CompanyId] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EmployeeName] nvarchar(256) NOT NULL,
        [ProjectId] uniqueidentifier NOT NULL,
        [ProjectTaskId] uniqueidentifier NULL,
        [CostCenterId] uniqueidentifier NULL,
        [WorkDate] datetime2 NOT NULL,
        [Hours] decimal(18,2) NOT NULL,
        [Notes] nvarchar(max) NULL,
        [Status] nvarchar(32) NOT NULL DEFAULT 'Draft',
        [ApprovedBy] nvarchar(256) NULL,
        [SubmittedAt] datetime2 NULL,
        CONSTRAINT [PK_TimesheetEntries] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_TimesheetEntries_TenantId_WorkDate] ON [TimesheetEntries]([TenantId], [WorkDate]);
    CREATE INDEX [IX_TimesheetEntries_TenantId_EmployeeId] ON [TimesheetEntries]([TenantId], [EmployeeId]);
    CREATE INDEX [IX_TimesheetEntries_TenantId_ProjectId] ON [TimesheetEntries]([TenantId], [ProjectId]);
END

IF OBJECT_ID(N'dbo.ExpenseClaims', N'U') IS NOT NULL AND COL_LENGTH('dbo.ExpenseClaims', 'CostCenterId') IS NULL
    ALTER TABLE dbo.ExpenseClaims ADD CostCenterId UNIQUEIDENTIFIER NULL;

IF OBJECT_ID(N'dbo.ExpenseClaims', N'U') IS NOT NULL AND COL_LENGTH('dbo.ExpenseClaims', 'ProjectId') IS NULL
    ALTER TABLE dbo.ExpenseClaims ADD ProjectId UNIQUEIDENTIFIER NULL;

GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260811120000_AddProjectTasksAndTimesheets')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260811120000_AddProjectTasksAndTimesheets', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260811120000_AddProjectTasksAndTimesheets.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260811140000_AddIntegrationConnectors.sql <<<<<
-- ============================================================================
-- Idempotent companion for IntegrationConnectors + IntegrationSyncLogs (Horizon 2).

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationConnectors')
BEGIN
    CREATE TABLE [IntegrationConnectors] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [ConnectorKey] nvarchar(64) NOT NULL,
        [Name] nvarchar(256) NOT NULL,
        [Provider] nvarchar(128) NOT NULL,
        [Category] nvarchar(64) NOT NULL DEFAULT 'Integration',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Inactive',
        [ConfigJson] nvarchar(max) NULL,
        [LastTestedAt] datetime2 NULL,
        [LastSyncAt] datetime2 NULL,
        [LastError] nvarchar(max) NULL,
        CONSTRAINT [PK_IntegrationConnectors] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_IntegrationConnectors_TenantId_ConnectorKey]
        ON [IntegrationConnectors]([TenantId], [ConnectorKey])
        WHERE [IsDeleted] = 0;
    CREATE INDEX [IX_IntegrationConnectors_TenantId_Status]
        ON [IntegrationConnectors]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationSyncLogs')
BEGIN
    CREATE TABLE [IntegrationSyncLogs] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [ConnectorId] uniqueidentifier NOT NULL,
        [ConnectorKey] nvarchar(64) NOT NULL,
        [Direction] nvarchar(32) NOT NULL DEFAULT 'Outbound',
        [Operation] nvarchar(64) NOT NULL DEFAULT 'Sync',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Success',
        [RecordsProcessed] int NOT NULL DEFAULT 0,
        [Message] nvarchar(max) NULL,
        [DetailsJson] nvarchar(max) NULL,
        [StartedAt] datetime2 NOT NULL,
        [CompletedAt] datetime2 NULL,
        CONSTRAINT [PK_IntegrationSyncLogs] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_IntegrationSyncLogs_TenantId_ConnectorId]
        ON [IntegrationSyncLogs]([TenantId], [ConnectorId]);
    CREATE INDEX [IX_IntegrationSyncLogs_TenantId_StartedAt]
        ON [IntegrationSyncLogs]([TenantId], [StartedAt] DESC);
END

GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260811140000_AddIntegrationConnectors')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260811140000_AddIntegrationConnectors', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260811140000_AddIntegrationConnectors.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260811160000_AddIntegrationApiKeys.sql <<<<<
-- ============================================================================
-- Idempotent companion for IntegrationApiKeys.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationApiKeys')
BEGIN
    CREATE TABLE [IntegrationApiKeys] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [Name] nvarchar(128) NOT NULL,
        [Prefix] nvarchar(32) NOT NULL,
        [KeyHash] nvarchar(128) NOT NULL,
        [Scope] nvarchar(64) NOT NULL DEFAULT 'read',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Active',
        [LastUsedAt] datetime2 NULL,
        [RevokedAt] datetime2 NULL,
        CONSTRAINT [PK_IntegrationApiKeys] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_IntegrationApiKeys_TenantId_KeyHash]
        ON [IntegrationApiKeys]([TenantId], [KeyHash])
        WHERE [IsDeleted] = 0;
    CREATE INDEX [IX_IntegrationApiKeys_TenantId_Status]
        ON [IntegrationApiKeys]([TenantId], [Status]);
END

GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260811160000_AddIntegrationApiKeys')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260811160000_AddIntegrationApiKeys', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260811160000_AddIntegrationApiKeys.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260811170000_AddPayrollFinalSettlements.sql <<<<<
-- ============================================================================
-- Idempotent companion for PayrollFinalSettlements.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PayrollFinalSettlements')
BEGIN
    CREATE TABLE [PayrollFinalSettlements] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EmployeeName] nvarchar(256) NOT NULL,
        [ExitDate] datetime2 NOT NULL,
        [Gratuity] decimal(18,2) NOT NULL DEFAULT 0,
        [LeaveEncashment] decimal(18,2) NOT NULL DEFAULT 0,
        [OtherDues] decimal(18,2) NOT NULL DEFAULT 0,
        [Recoveries] decimal(18,2) NOT NULL DEFAULT 0,
        [TotalSettlement] decimal(18,2) NOT NULL DEFAULT 0,
        [Status] nvarchar(32) NOT NULL DEFAULT 'Pending',
        [Remarks] nvarchar(max) NULL,
        [SettledAt] datetime2 NULL,
        CONSTRAINT [PK_PayrollFinalSettlements] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_PayrollFinalSettlements_TenantId_EmployeeId]
        ON [PayrollFinalSettlements]([TenantId], [EmployeeId]);
    CREATE INDEX [IX_PayrollFinalSettlements_TenantId_Status]
        ON [PayrollFinalSettlements]([TenantId], [Status]);
END

GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260811170000_AddPayrollFinalSettlements')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260811170000_AddPayrollFinalSettlements', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260811170000_AddPayrollFinalSettlements.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260811180000_AddPayrollEmployeeFinance.sql <<<<<
-- ============================================================================
-- Idempotent companion for payroll loans, bonuses, and arrears.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PayrollLoans')
BEGIN
    CREATE TABLE [PayrollLoans] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EmployeeName] nvarchar(256) NOT NULL,
        [EmployeeCode] nvarchar(64) NOT NULL DEFAULT '',
        [LoanType] nvarchar(64) NOT NULL DEFAULT 'Personal Loan',
        [PrincipalAmount] decimal(18,2) NOT NULL DEFAULT 0,
        [OutstandingAmount] decimal(18,2) NOT NULL DEFAULT 0,
        [EmiAmount] decimal(18,2) NOT NULL DEFAULT 0,
        [InterestRate] decimal(18,4) NOT NULL DEFAULT 0,
        [DisbursementDate] datetime2 NOT NULL,
        [TotalInstallments] int NOT NULL DEFAULT 12,
        [InstallmentsPaid] int NOT NULL DEFAULT 0,
        [Purpose] nvarchar(max) NULL,
        [Status] nvarchar(32) NOT NULL DEFAULT 'Pending',
        [ClosedAt] datetime2 NULL,
        CONSTRAINT [PK_PayrollLoans] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_PayrollLoans_TenantId_EmployeeId] ON [PayrollLoans]([TenantId], [EmployeeId]);
    CREATE INDEX [IX_PayrollLoans_TenantId_Status] ON [PayrollLoans]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PayrollBonuses')
BEGIN
    CREATE TABLE [PayrollBonuses] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EmployeeName] nvarchar(256) NOT NULL,
        [EmployeeCode] nvarchar(64) NOT NULL DEFAULT '',
        [BonusType] nvarchar(64) NOT NULL DEFAULT 'Performance Bonus',
        [Amount] decimal(18,2) NOT NULL DEFAULT 0,
        [PaymentMonth] nvarchar(16) NOT NULL,
        [Remarks] nvarchar(max) NULL,
        [Status] nvarchar(32) NOT NULL DEFAULT 'Pending',
        [PaidAt] datetime2 NULL,
        CONSTRAINT [PK_PayrollBonuses] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_PayrollBonuses_TenantId_EmployeeId] ON [PayrollBonuses]([TenantId], [EmployeeId]);
    CREATE INDEX [IX_PayrollBonuses_TenantId_Status] ON [PayrollBonuses]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PayrollArrears')
BEGIN
    CREATE TABLE [PayrollArrears] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EmployeeName] nvarchar(256) NOT NULL,
        [EmployeeCode] nvarchar(64) NOT NULL DEFAULT '',
        [Period] nvarchar(16) NOT NULL,
        [Amount] decimal(18,2) NOT NULL DEFAULT 0,
        [Reason] nvarchar(128) NOT NULL DEFAULT 'Other',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Pending',
        [ProcessedAt] datetime2 NULL,
        CONSTRAINT [PK_PayrollArrears] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_PayrollArrears_TenantId_EmployeeId] ON [PayrollArrears]([TenantId], [EmployeeId]);
    CREATE INDEX [IX_PayrollArrears_TenantId_Status] ON [PayrollArrears]([TenantId], [Status]);
END

GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260811180000_AddPayrollEmployeeFinance')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260811180000_AddPayrollEmployeeFinance', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260811180000_AddPayrollEmployeeFinance.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260811190000_AddSecurityControls.sql <<<<<
-- ============================================================================
-- Idempotent companion for SSO providers, IP rules, MFA enrollments, and tenant security policy.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SecurityPolicies')
BEGIN
    CREATE TABLE [SecurityPolicies] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [MinLength] int NOT NULL DEFAULT 8,
        [RequireUppercase] bit NOT NULL DEFAULT 1,
        [RequireLowercase] bit NOT NULL DEFAULT 1,
        [RequireNumber] bit NOT NULL DEFAULT 1,
        [RequireSpecial] bit NOT NULL DEFAULT 0,
        [MaxAgeDays] int NOT NULL DEFAULT 90,
        [MaxFailedAttempts] int NOT NULL DEFAULT 5,
        [LockoutMinutes] int NOT NULL DEFAULT 15,
        [RequireMfaPlatformAdmins] bit NOT NULL DEFAULT 0,
        [RequireMfaTenantAdmins] bit NOT NULL DEFAULT 0,
        [AllowTotp] bit NOT NULL DEFAULT 1,
        [AllowSmsOtp] bit NOT NULL DEFAULT 0,
        CONSTRAINT [PK_SecurityPolicies] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_SecurityPolicies_TenantId]
        ON [SecurityPolicies]([TenantId])
        WHERE [IsDeleted] = 0;
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SsoIdentityProviders')
BEGIN
    CREATE TABLE [SsoIdentityProviders] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [Name] nvarchar(128) NOT NULL,
        [Protocol] nvarchar(32) NOT NULL DEFAULT 'OIDC',
        [Provider] nvarchar(64) NOT NULL DEFAULT 'Custom',
        [Issuer] nvarchar(512) NOT NULL DEFAULT '',
        [ClientId] nvarchar(256) NOT NULL DEFAULT '',
        [ClientSecretHash] nvarchar(128) NULL,
        [MetadataUrl] nvarchar(512) NULL,
        [RedirectUri] nvarchar(512) NULL,
        [Scopes] nvarchar(256) NULL,
        [Status] nvarchar(32) NOT NULL DEFAULT 'Inactive',
        [LastError] nvarchar(max) NULL,
        [LastTestedAt] datetime2 NULL,
        [EnabledAt] datetime2 NULL,
        CONSTRAINT [PK_SsoIdentityProviders] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_SsoIdentityProviders_TenantId_Status]
        ON [SsoIdentityProviders]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IpAccessRules')
BEGIN
    CREATE TABLE [IpAccessRules] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [IpRange] nvarchar(64) NOT NULL,
        [Description] nvarchar(256) NULL,
        [Action] nvarchar(16) NOT NULL DEFAULT 'ALLOW',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Active',
        CONSTRAINT [PK_IpAccessRules] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_IpAccessRules_TenantId_Status]
        ON [IpAccessRules]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'MfaEnrollments')
BEGIN
    CREATE TABLE [MfaEnrollments] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [UserId] uniqueidentifier NULL,
        [UserName] nvarchar(256) NOT NULL DEFAULT '',
        [UserEmail] nvarchar(256) NOT NULL DEFAULT '',
        [Method] nvarchar(32) NOT NULL DEFAULT 'TOTP',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Pending',
        [EnrolledAt] datetime2 NULL,
        CONSTRAINT [PK_MfaEnrollments] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_MfaEnrollments_TenantId_Status]
        ON [MfaEnrollments]([TenantId], [Status]);
END

GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260811190000_AddSecurityControls')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260811190000_AddSecurityControls', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260811190000_AddSecurityControls.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260811200000_AddCustomReportsAndLicensing.sql <<<<<
-- ============================================================================
-- Idempotent companion for saved custom reports and licensing invoices.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CustomReports')
BEGIN
    CREATE TABLE [CustomReports] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [Name] nvarchar(256) NOT NULL,
        [ReportType] nvarchar(32) NOT NULL DEFAULT 'sales',
        [DateRange] nvarchar(32) NOT NULL DEFAULT 'last30days',
        [OutputFormat] nvarchar(16) NOT NULL DEFAULT 'pdf',
        [Schedule] nvarchar(32) NOT NULL DEFAULT 'Manual',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Draft',
        [CreatedByName] nvarchar(256) NOT NULL DEFAULT '',
        [LastRunAt] datetime2 NULL,
        [LastRowCount] int NOT NULL DEFAULT 0,
        [LastRunSummary] nvarchar(max) NULL,
        CONSTRAINT [PK_CustomReports] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_CustomReports_TenantId_Status]
        ON [CustomReports]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'LicenseInvoices')
BEGIN
    CREATE TABLE [LicenseInvoices] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [InvoiceNumber] nvarchar(64) NOT NULL,
        [Period] nvarchar(16) NOT NULL,
        [Plan] nvarchar(64) NOT NULL DEFAULT 'Standard',
        [Amount] decimal(18,2) NOT NULL DEFAULT 0,
        [Status] nvarchar(32) NOT NULL DEFAULT 'Pending',
        [PaidDate] datetime2 NULL,
        [Remarks] nvarchar(max) NULL,
        CONSTRAINT [PK_LicenseInvoices] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_LicenseInvoices_TenantId_InvoiceNumber]
        ON [LicenseInvoices]([TenantId], [InvoiceNumber])
        WHERE [IsDeleted] = 0;
    CREATE INDEX [IX_LicenseInvoices_TenantId_Status]
        ON [LicenseInvoices]([TenantId], [Status]);
END

GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260811200000_AddCustomReportsAndLicensing')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260811200000_AddCustomReportsAndLicensing', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260811200000_AddCustomReportsAndLicensing.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260817120000_AddProductionReadyHrFinance.sql <<<<<
-- ============================================================================
-- Production-ready HRMS/ERP schema: employee master, payroll engine, PR, lifecycle, GST, returns.

-- Employee master columns
IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.Employees', 'WorkEmail') IS NULL ALTER TABLE dbo.Employees ADD WorkEmail NVARCHAR(256) NULL;
    IF COL_LENGTH('dbo.Employees', 'PersonalEmail') IS NULL ALTER TABLE dbo.Employees ADD PersonalEmail NVARCHAR(256) NULL;
    IF COL_LENGTH('dbo.Employees', 'Phone') IS NULL ALTER TABLE dbo.Employees ADD Phone NVARCHAR(32) NULL;
    IF COL_LENGTH('dbo.Employees', 'AlternatePhone') IS NULL ALTER TABLE dbo.Employees ADD AlternatePhone NVARCHAR(32) NULL;
    IF COL_LENGTH('dbo.Employees', 'DateOfBirth') IS NULL ALTER TABLE dbo.Employees ADD DateOfBirth DATETIME2 NULL;
    IF COL_LENGTH('dbo.Employees', 'Gender') IS NULL ALTER TABLE dbo.Employees ADD Gender NVARCHAR(32) NULL;
    IF COL_LENGTH('dbo.Employees', 'MaritalStatus') IS NULL ALTER TABLE dbo.Employees ADD MaritalStatus NVARCHAR(32) NULL;
    IF COL_LENGTH('dbo.Employees', 'Nationality') IS NULL ALTER TABLE dbo.Employees ADD Nationality NVARCHAR(64) NULL;
    IF COL_LENGTH('dbo.Employees', 'Address') IS NULL ALTER TABLE dbo.Employees ADD Address NVARCHAR(512) NULL;
    IF COL_LENGTH('dbo.Employees', 'City') IS NULL ALTER TABLE dbo.Employees ADD City NVARCHAR(128) NULL;
    IF COL_LENGTH('dbo.Employees', 'State') IS NULL ALTER TABLE dbo.Employees ADD [State] NVARCHAR(64) NULL;
    IF COL_LENGTH('dbo.Employees', 'PostalCode') IS NULL ALTER TABLE dbo.Employees ADD PostalCode NVARCHAR(16) NULL;
    IF COL_LENGTH('dbo.Employees', 'DateOfJoining') IS NULL ALTER TABLE dbo.Employees ADD DateOfJoining DATETIME2 NULL;
    IF COL_LENGTH('dbo.Employees', 'ConfirmationDate') IS NULL ALTER TABLE dbo.Employees ADD ConfirmationDate DATETIME2 NULL;
    IF COL_LENGTH('dbo.Employees', 'ProbationEndDate') IS NULL ALTER TABLE dbo.Employees ADD ProbationEndDate DATETIME2 NULL;
    IF COL_LENGTH('dbo.Employees', 'ExitDate') IS NULL ALTER TABLE dbo.Employees ADD ExitDate DATETIME2 NULL;
    IF COL_LENGTH('dbo.Employees', 'EmploymentType') IS NULL ALTER TABLE dbo.Employees ADD EmploymentType NVARCHAR(32) NULL;
    IF COL_LENGTH('dbo.Employees', 'WorkLocation') IS NULL ALTER TABLE dbo.Employees ADD WorkLocation NVARCHAR(128) NULL;
    IF COL_LENGTH('dbo.Employees', 'DepartmentId') IS NULL ALTER TABLE dbo.Employees ADD DepartmentId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.Employees', 'DesignationId') IS NULL ALTER TABLE dbo.Employees ADD DesignationId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.Employees', 'BranchId') IS NULL ALTER TABLE dbo.Employees ADD BranchId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.Employees', 'CostCenterId') IS NULL ALTER TABLE dbo.Employees ADD CostCenterId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.Employees', 'Pan') IS NULL ALTER TABLE dbo.Employees ADD Pan NVARCHAR(20) NULL;
    IF COL_LENGTH('dbo.Employees', 'Aadhaar') IS NULL ALTER TABLE dbo.Employees ADD Aadhaar NVARCHAR(20) NULL;
    IF COL_LENGTH('dbo.Employees', 'Uan') IS NULL ALTER TABLE dbo.Employees ADD Uan NVARCHAR(32) NULL;
    IF COL_LENGTH('dbo.Employees', 'EsiNumber') IS NULL ALTER TABLE dbo.Employees ADD EsiNumber NVARCHAR(32) NULL;
    IF COL_LENGTH('dbo.Employees', 'PfNumber') IS NULL ALTER TABLE dbo.Employees ADD PfNumber NVARCHAR(32) NULL;
    IF COL_LENGTH('dbo.Employees', 'BankName') IS NULL ALTER TABLE dbo.Employees ADD BankName NVARCHAR(128) NULL;
    IF COL_LENGTH('dbo.Employees', 'BankAccountHolder') IS NULL ALTER TABLE dbo.Employees ADD BankAccountHolder NVARCHAR(128) NULL;
    IF COL_LENGTH('dbo.Employees', 'BankAccountNumber') IS NULL ALTER TABLE dbo.Employees ADD BankAccountNumber NVARCHAR(64) NULL;
    IF COL_LENGTH('dbo.Employees', 'BankIfsc') IS NULL ALTER TABLE dbo.Employees ADD BankIfsc NVARCHAR(20) NULL;
    IF COL_LENGTH('dbo.Employees', 'PayrollStructureId') IS NULL ALTER TABLE dbo.Employees ADD PayrollStructureId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.Employees', 'MonthlyCtc') IS NULL ALTER TABLE dbo.Employees ADD MonthlyCtc DECIMAL(18,2) NOT NULL CONSTRAINT DF_Employees_MonthlyCtc DEFAULT 0;
    IF COL_LENGTH('dbo.Employees', 'BasicSalary') IS NULL ALTER TABLE dbo.Employees ADD BasicSalary DECIMAL(18,2) NOT NULL CONSTRAINT DF_Employees_BasicSalary DEFAULT 0;
    IF COL_LENGTH('dbo.Employees', 'ProbationStatus') IS NULL ALTER TABLE dbo.Employees ADD ProbationStatus NVARCHAR(32) NULL;
    IF COL_LENGTH('dbo.Employees', 'ProbationScore') IS NULL ALTER TABLE dbo.Employees ADD ProbationScore DECIMAL(18,2) NULL;
    IF COL_LENGTH('dbo.Employees', 'ProbationComments') IS NULL ALTER TABLE dbo.Employees ADD ProbationComments NVARCHAR(MAX) NULL;
END
GO

IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL
AND COL_LENGTH('dbo.Employees', 'EmployeeCode') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.Employees', 'EmployeeCode') = -1
        ALTER TABLE dbo.Employees ALTER COLUMN EmployeeCode NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Employees_TenantId_EmployeeCode' AND object_id = OBJECT_ID('dbo.Employees'))
BEGIN
    CREATE UNIQUE INDEX [IX_Employees_TenantId_EmployeeCode]
        ON [dbo].[Employees]([TenantId], [EmployeeCode])
        WHERE [IsDeleted] = 0 AND [EmployeeCode] IS NOT NULL AND [EmployeeCode] <> '';
END
GO

IF OBJECT_ID(N'dbo.LeaveTypes', N'U') IS NOT NULL AND COL_LENGTH('dbo.LeaveTypes', 'IsPaid') IS NULL
    ALTER TABLE dbo.LeaveTypes ADD IsPaid BIT NOT NULL CONSTRAINT DF_LeaveTypes_IsPaid DEFAULT 1;
GO

IF OBJECT_ID(N'dbo.PayrollRuns', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.PayrollRuns', 'PeriodStart') IS NULL ALTER TABLE dbo.PayrollRuns ADD PeriodStart DATETIME2 NULL;
    IF COL_LENGTH('dbo.PayrollRuns', 'PeriodEnd') IS NULL ALTER TABLE dbo.PayrollRuns ADD PeriodEnd DATETIME2 NULL;
    IF COL_LENGTH('dbo.PayrollRuns', 'JournalEntryId') IS NULL ALTER TABLE dbo.PayrollRuns ADD JournalEntryId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.PayrollRuns', 'PayslipCount') IS NULL ALTER TABLE dbo.PayrollRuns ADD PayslipCount INT NOT NULL CONSTRAINT DF_PayrollRuns_PayslipCount DEFAULT 0;
    IF COL_LENGTH('dbo.PayrollRuns', 'TotalGross') IS NULL ALTER TABLE dbo.PayrollRuns ADD TotalGross DECIMAL(18,2) NOT NULL CONSTRAINT DF_PayrollRuns_TotalGross DEFAULT 0;
    IF COL_LENGTH('dbo.PayrollRuns', 'TotalNet') IS NULL ALTER TABLE dbo.PayrollRuns ADD TotalNet DECIMAL(18,2) NOT NULL CONSTRAINT DF_PayrollRuns_TotalNet DEFAULT 0;
END
GO

IF OBJECT_ID(N'dbo.Payslips', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.Payslips', 'Month') IS NULL ALTER TABLE dbo.Payslips ADD [Month] INT NOT NULL CONSTRAINT DF_Payslips_Month DEFAULT 0;
    IF COL_LENGTH('dbo.Payslips', 'Year') IS NULL ALTER TABLE dbo.Payslips ADD [Year] INT NOT NULL CONSTRAINT DF_Payslips_Year DEFAULT 0;
    IF COL_LENGTH('dbo.Payslips', 'WorkingDays') IS NULL ALTER TABLE dbo.Payslips ADD WorkingDays DECIMAL(18,2) NOT NULL CONSTRAINT DF_Payslips_WorkingDays DEFAULT 0;
    IF COL_LENGTH('dbo.Payslips', 'PayableDays') IS NULL ALTER TABLE dbo.Payslips ADD PayableDays DECIMAL(18,2) NOT NULL CONSTRAINT DF_Payslips_PayableDays DEFAULT 0;
    IF COL_LENGTH('dbo.Payslips', 'LopDays') IS NULL ALTER TABLE dbo.Payslips ADD LopDays DECIMAL(18,2) NOT NULL CONSTRAINT DF_Payslips_LopDays DEFAULT 0;
    IF COL_LENGTH('dbo.Payslips', 'Basic') IS NULL ALTER TABLE dbo.Payslips ADD Basic DECIMAL(18,2) NOT NULL CONSTRAINT DF_Payslips_Basic DEFAULT 0;
    IF COL_LENGTH('dbo.Payslips', 'TotalEarnings') IS NULL ALTER TABLE dbo.Payslips ADD TotalEarnings DECIMAL(18,2) NOT NULL CONSTRAINT DF_Payslips_TotalEarnings DEFAULT 0;
    IF COL_LENGTH('dbo.Payslips', 'TotalDeductions') IS NULL ALTER TABLE dbo.Payslips ADD TotalDeductions DECIMAL(18,2) NOT NULL CONSTRAINT DF_Payslips_TotalDeductions DEFAULT 0;
    IF COL_LENGTH('dbo.Payslips', 'PfEmployee') IS NULL ALTER TABLE dbo.Payslips ADD PfEmployee DECIMAL(18,2) NOT NULL CONSTRAINT DF_Payslips_PfEmployee DEFAULT 0;
    IF COL_LENGTH('dbo.Payslips', 'EsiEmployee') IS NULL ALTER TABLE dbo.Payslips ADD EsiEmployee DECIMAL(18,2) NOT NULL CONSTRAINT DF_Payslips_EsiEmployee DEFAULT 0;
    IF COL_LENGTH('dbo.Payslips', 'ProfessionalTax') IS NULL ALTER TABLE dbo.Payslips ADD ProfessionalTax DECIMAL(18,2) NOT NULL CONSTRAINT DF_Payslips_ProfessionalTax DEFAULT 0;
    IF COL_LENGTH('dbo.Payslips', 'Tds') IS NULL ALTER TABLE dbo.Payslips ADD Tds DECIMAL(18,2) NOT NULL CONSTRAINT DF_Payslips_Tds DEFAULT 0;
    IF COL_LENGTH('dbo.Payslips', 'JournalEntryId') IS NULL ALTER TABLE dbo.Payslips ADD JournalEntryId UNIQUEIDENTIFIER NULL;
END
GO

IF OBJECT_ID(N'dbo.PayslipLines', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[PayslipLines] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(64) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT DF_PayslipLines_IsDeleted DEFAULT 0,
        [PayslipId] uniqueidentifier NOT NULL,
        [Name] nvarchar(128) NOT NULL,
        [Type] nvarchar(32) NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [IsStatutory] bit NOT NULL CONSTRAINT DF_PayslipLines_IsStatutory DEFAULT 0,
        [SortOrder] int NOT NULL CONSTRAINT DF_PayslipLines_SortOrder DEFAULT 0,
        CONSTRAINT [PK_PayslipLines] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_PayslipLines_PayslipId] ON [dbo].[PayslipLines]([PayslipId]);
    CREATE INDEX [IX_PayslipLines_TenantId] ON [dbo].[PayslipLines]([TenantId]);
END
GO

IF OBJECT_ID(N'dbo.EmployeeSalaryAssignments', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[EmployeeSalaryAssignments] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(64) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT DF_EmployeeSalaryAssignments_IsDeleted DEFAULT 0,
        [EmployeeId] uniqueidentifier NOT NULL,
        [StructureId] uniqueidentifier NULL,
        [MonthlyCtc] decimal(18,2) NOT NULL CONSTRAINT DF_ESA_MonthlyCtc DEFAULT 0,
        [BasicSalary] decimal(18,2) NOT NULL CONSTRAINT DF_ESA_Basic DEFAULT 0,
        [Hra] decimal(18,2) NOT NULL CONSTRAINT DF_ESA_Hra DEFAULT 0,
        [SpecialAllowance] decimal(18,2) NOT NULL CONSTRAINT DF_ESA_SA DEFAULT 0,
        [EffectiveFrom] datetime2 NOT NULL,
        [EffectiveTo] datetime2 NULL,
        [IsActive] bit NOT NULL CONSTRAINT DF_ESA_IsActive DEFAULT 1,
        CONSTRAINT [PK_EmployeeSalaryAssignments] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_ESA_Tenant_Employee] ON [dbo].[EmployeeSalaryAssignments]([TenantId], [EmployeeId]);
END
GO

IF OBJECT_ID(N'dbo.PurchaseRequests', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[PurchaseRequests] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(64) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT DF_PurchaseRequests_IsDeleted DEFAULT 0,
        [RequestNumber] nvarchar(32) NOT NULL,
        [RequestedByUserId] uniqueidentifier NULL,
        [RequestedBy] nvarchar(256) NOT NULL,
        [Department] nvarchar(128) NOT NULL,
        [ItemId] uniqueidentifier NULL,
        [ItemDescription] nvarchar(512) NOT NULL,
        [Quantity] decimal(18,4) NOT NULL,
        [Unit] nvarchar(32) NOT NULL,
        [EstimatedCost] decimal(18,2) NOT NULL,
        [RequiredDate] datetime2 NULL,
        [Justification] nvarchar(max) NOT NULL,
        [Status] nvarchar(32) NOT NULL,
        [ApprovedBy] uniqueidentifier NULL,
        [ApprovedAt] datetime2 NULL,
        [PurchaseOrderId] uniqueidentifier NULL,
        [Notes] nvarchar(max) NULL,
        CONSTRAINT [PK_PurchaseRequests] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_PurchaseRequests_Tenant_Number]
        ON [dbo].[PurchaseRequests]([TenantId], [RequestNumber]) WHERE [IsDeleted] = 0;
END
GO

IF OBJECT_ID(N'dbo.HrLifecycleTasks', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[HrLifecycleTasks] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(64) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT DF_HrLifecycleTasks_IsDeleted DEFAULT 0,
        [EmployeeId] uniqueidentifier NOT NULL,
        [Kind] nvarchar(32) NOT NULL,
        [Title] nvarchar(256) NOT NULL,
        [Category] nvarchar(64) NOT NULL,
        [Status] nvarchar(32) NOT NULL,
        [DueDate] datetime2 NULL,
        [CompletedAt] datetime2 NULL,
        [AssignedToUserId] uniqueidentifier NULL,
        [SortOrder] int NOT NULL CONSTRAINT DF_HrLifecycleTasks_Sort DEFAULT 0,
        [Notes] nvarchar(max) NULL,
        CONSTRAINT [PK_HrLifecycleTasks] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_HrLifecycleTasks_Tenant_Employee] ON [dbo].[HrLifecycleTasks]([TenantId], [EmployeeId], [Kind]);
END
GO

IF OBJECT_ID(N'dbo.SalesReturns', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[SalesReturns] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(64) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT DF_SalesReturns_IsDeleted DEFAULT 0,
        [ReturnNumber] nvarchar(32) NOT NULL,
        [CustomerId] uniqueidentifier NOT NULL,
        [SalesInvoiceId] uniqueidentifier NULL,
        [OriginalOrderRef] nvarchar(64) NULL,
        [Amount] decimal(18,2) NOT NULL,
        [Reason] nvarchar(256) NOT NULL,
        [ReturnDate] datetime2 NOT NULL,
        [Status] nvarchar(32) NOT NULL,
        [CreditNoteNumber] nvarchar(32) NULL,
        [JournalEntryId] uniqueidentifier NULL,
        CONSTRAINT [PK_SalesReturns] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_SalesReturns_Tenant_Number]
        ON [dbo].[SalesReturns]([TenantId], [ReturnNumber]) WHERE [IsDeleted] = 0;
END
GO

IF OBJECT_ID(N'dbo.AccountingPeriods', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AccountingPeriods] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(64) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT DF_AccountingPeriods_IsDeleted DEFAULT 0,
        [Year] int NOT NULL,
        [Month] int NOT NULL,
        [Status] nvarchar(16) NOT NULL,
        [ClosedAt] datetime2 NULL,
        [ClosedBy] uniqueidentifier NULL,
        [Notes] nvarchar(512) NULL,
        CONSTRAINT [PK_AccountingPeriods] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_AccountingPeriods_Tenant_Year_Month]
        ON [dbo].[AccountingPeriods]([TenantId], [Year], [Month]) WHERE [IsDeleted] = 0;
END
GO

IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.SalesInvoices', 'PlaceOfSupply') IS NULL ALTER TABLE dbo.SalesInvoices ADD PlaceOfSupply NVARCHAR(64) NULL;
    IF COL_LENGTH('dbo.SalesInvoices', 'IsInterState') IS NULL ALTER TABLE dbo.SalesInvoices ADD IsInterState BIT NOT NULL CONSTRAINT DF_SalesInvoices_IsInterState DEFAULT 0;
    IF COL_LENGTH('dbo.SalesInvoices', 'CgstAmount') IS NULL ALTER TABLE dbo.SalesInvoices ADD CgstAmount DECIMAL(18,2) NOT NULL CONSTRAINT DF_SalesInvoices_Cgst DEFAULT 0;
    IF COL_LENGTH('dbo.SalesInvoices', 'SgstAmount') IS NULL ALTER TABLE dbo.SalesInvoices ADD SgstAmount DECIMAL(18,2) NOT NULL CONSTRAINT DF_SalesInvoices_Sgst DEFAULT 0;
    IF COL_LENGTH('dbo.SalesInvoices', 'IgstAmount') IS NULL ALTER TABLE dbo.SalesInvoices ADD IgstAmount DECIMAL(18,2) NOT NULL CONSTRAINT DF_SalesInvoices_Igst DEFAULT 0;
    IF COL_LENGTH('dbo.SalesInvoices', 'JournalEntryId') IS NULL ALTER TABLE dbo.SalesInvoices ADD JournalEntryId UNIQUEIDENTIFIER NULL;
END
GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260817120000_AddProductionReadyHrFinance')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260817120000_AddProductionReadyHrFinance', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260817120000_AddProductionReadyHrFinance.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260818010000_AddDocumentNumberIndexes.sql <<<<<
-- ============================================================================
-- Unique document numbers per tenant.
-- SQL Server cannot index nvarchar(max) (error 1919). Shrink oversized columns first.

IF OBJECT_ID(N'dbo.ExpenseClaims', N'U') IS NOT NULL AND COL_LENGTH('dbo.ExpenseClaims', 'JournalEntryId') IS NULL
    ALTER TABLE dbo.ExpenseClaims ADD JournalEntryId UNIQUEIDENTIFIER NULL;
GO

-- COL_LENGTH returns -1 for nvarchar(max). Index keys must be <= 1700 bytes.
IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL
AND COL_LENGTH('dbo.SalesInvoices', 'InvoiceNumber') IS NOT NULL
AND (COL_LENGTH('dbo.SalesInvoices', 'InvoiceNumber') = -1 OR COL_LENGTH('dbo.SalesInvoices', 'InvoiceNumber') > 128)
BEGIN
    UPDATE dbo.SalesInvoices SET InvoiceNumber = LEFT(InvoiceNumber, 64) WHERE InvoiceNumber IS NOT NULL AND LEN(InvoiceNumber) > 64;
    ALTER TABLE dbo.SalesInvoices ALTER COLUMN InvoiceNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.PurchaseInvoices', N'U') IS NOT NULL
AND COL_LENGTH('dbo.PurchaseInvoices', 'InvoiceNumber') IS NOT NULL
AND (COL_LENGTH('dbo.PurchaseInvoices', 'InvoiceNumber') = -1 OR COL_LENGTH('dbo.PurchaseInvoices', 'InvoiceNumber') > 128)
BEGIN
    UPDATE dbo.PurchaseInvoices SET InvoiceNumber = LEFT(InvoiceNumber, 64) WHERE InvoiceNumber IS NOT NULL AND LEN(InvoiceNumber) > 64;
    ALTER TABLE dbo.PurchaseInvoices ALTER COLUMN InvoiceNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.PurchaseOrders', N'U') IS NOT NULL
AND COL_LENGTH('dbo.PurchaseOrders', 'PONumber') IS NOT NULL
AND (COL_LENGTH('dbo.PurchaseOrders', 'PONumber') = -1 OR COL_LENGTH('dbo.PurchaseOrders', 'PONumber') > 128)
BEGIN
    UPDATE dbo.PurchaseOrders SET PONumber = LEFT(PONumber, 64) WHERE PONumber IS NOT NULL AND LEN(PONumber) > 64;
    ALTER TABLE dbo.PurchaseOrders ALTER COLUMN PONumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.SalesOrders', N'U') IS NOT NULL
AND COL_LENGTH('dbo.SalesOrders', 'SONumber') IS NOT NULL
AND (COL_LENGTH('dbo.SalesOrders', 'SONumber') = -1 OR COL_LENGTH('dbo.SalesOrders', 'SONumber') > 128)
BEGIN
    UPDATE dbo.SalesOrders SET SONumber = LEFT(SONumber, 64) WHERE SONumber IS NOT NULL AND LEN(SONumber) > 64;
    ALTER TABLE dbo.SalesOrders ALTER COLUMN SONumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.SalesQuotations', N'U') IS NOT NULL
AND COL_LENGTH('dbo.SalesQuotations', 'QuotationNumber') IS NOT NULL
AND (COL_LENGTH('dbo.SalesQuotations', 'QuotationNumber') = -1 OR COL_LENGTH('dbo.SalesQuotations', 'QuotationNumber') > 128)
BEGIN
    UPDATE dbo.SalesQuotations SET QuotationNumber = LEFT(QuotationNumber, 64) WHERE QuotationNumber IS NOT NULL AND LEN(QuotationNumber) > 64;
    ALTER TABLE dbo.SalesQuotations ALTER COLUMN QuotationNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.Payments', N'U') IS NOT NULL
AND COL_LENGTH('dbo.Payments', 'PaymentNumber') IS NOT NULL
AND (COL_LENGTH('dbo.Payments', 'PaymentNumber') = -1 OR COL_LENGTH('dbo.Payments', 'PaymentNumber') > 128)
BEGIN
    UPDATE dbo.Payments SET PaymentNumber = LEFT(PaymentNumber, 64) WHERE PaymentNumber IS NOT NULL AND LEN(PaymentNumber) > 64;
    ALTER TABLE dbo.Payments ALTER COLUMN PaymentNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.JournalEntries', N'U') IS NOT NULL
AND COL_LENGTH('dbo.JournalEntries', 'JournalNumber') IS NOT NULL
AND (COL_LENGTH('dbo.JournalEntries', 'JournalNumber') = -1 OR COL_LENGTH('dbo.JournalEntries', 'JournalNumber') > 128)
BEGIN
    UPDATE dbo.JournalEntries SET JournalNumber = LEFT(JournalNumber, 64) WHERE JournalNumber IS NOT NULL AND LEN(JournalNumber) > 64;
    ALTER TABLE dbo.JournalEntries ALTER COLUMN JournalNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.ExpenseClaims', N'U') IS NOT NULL
AND COL_LENGTH('dbo.ExpenseClaims', 'ClaimNumber') IS NOT NULL
AND (COL_LENGTH('dbo.ExpenseClaims', 'ClaimNumber') = -1 OR COL_LENGTH('dbo.ExpenseClaims', 'ClaimNumber') > 128)
BEGIN
    UPDATE dbo.ExpenseClaims SET ClaimNumber = LEFT(ClaimNumber, 64) WHERE ClaimNumber IS NOT NULL AND LEN(ClaimNumber) > 64;
    ALTER TABLE dbo.ExpenseClaims ALTER COLUMN ClaimNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.GoodsReceiptNotes', N'U') IS NOT NULL
AND COL_LENGTH('dbo.GoodsReceiptNotes', 'GrnNumber') IS NOT NULL
AND (COL_LENGTH('dbo.GoodsReceiptNotes', 'GrnNumber') = -1 OR COL_LENGTH('dbo.GoodsReceiptNotes', 'GrnNumber') > 128)
BEGIN
    UPDATE dbo.GoodsReceiptNotes SET GrnNumber = LEFT(GrnNumber, 64) WHERE GrnNumber IS NOT NULL AND LEN(GrnNumber) > 64;
    ALTER TABLE dbo.GoodsReceiptNotes ALTER COLUMN GrnNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.StockMovements', N'U') IS NOT NULL
AND COL_LENGTH('dbo.StockMovements', 'MovementNumber') IS NOT NULL
AND (COL_LENGTH('dbo.StockMovements', 'MovementNumber') = -1 OR COL_LENGTH('dbo.StockMovements', 'MovementNumber') > 128)
BEGIN
    UPDATE dbo.StockMovements SET MovementNumber = LEFT(MovementNumber, 64) WHERE MovementNumber IS NOT NULL AND LEN(MovementNumber) > 64;
    ALTER TABLE dbo.StockMovements ALTER COLUMN MovementNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.CrmLeads', N'U') IS NOT NULL
AND COL_LENGTH('dbo.CrmLeads', 'LeadCode') IS NOT NULL
AND (COL_LENGTH('dbo.CrmLeads', 'LeadCode') = -1 OR COL_LENGTH('dbo.CrmLeads', 'LeadCode') > 128)
BEGIN
    UPDATE dbo.CrmLeads SET LeadCode = LEFT(LeadCode, 64) WHERE LeadCode IS NOT NULL AND LEN(LeadCode) > 64;
    ALTER TABLE dbo.CrmLeads ALTER COLUMN LeadCode NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.TravelRequests', N'U') IS NOT NULL
AND COL_LENGTH('dbo.TravelRequests', 'RequestNumber') IS NOT NULL
AND (COL_LENGTH('dbo.TravelRequests', 'RequestNumber') = -1 OR COL_LENGTH('dbo.TravelRequests', 'RequestNumber') > 128)
BEGIN
    UPDATE dbo.TravelRequests SET RequestNumber = LEFT(RequestNumber, 64) WHERE RequestNumber IS NOT NULL AND LEN(RequestNumber) > 64;
    ALTER TABLE dbo.TravelRequests ALTER COLUMN RequestNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.ProjectTasks', N'U') IS NOT NULL
AND COL_LENGTH('dbo.ProjectTasks', 'TaskCode') IS NOT NULL
AND (COL_LENGTH('dbo.ProjectTasks', 'TaskCode') = -1 OR COL_LENGTH('dbo.ProjectTasks', 'TaskCode') > 128)
BEGIN
    UPDATE dbo.ProjectTasks SET TaskCode = LEFT(TaskCode, 64) WHERE TaskCode IS NOT NULL AND LEN(TaskCode) > 64;
    ALTER TABLE dbo.ProjectTasks ALTER COLUMN TaskCode NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.Vendors', N'U') IS NOT NULL
AND COL_LENGTH('dbo.Vendors', 'VendorCode') IS NOT NULL
AND (COL_LENGTH('dbo.Vendors', 'VendorCode') = -1 OR COL_LENGTH('dbo.Vendors', 'VendorCode') > 128)
BEGIN
    UPDATE dbo.Vendors SET VendorCode = LEFT(VendorCode, 64) WHERE VendorCode IS NOT NULL AND LEN(VendorCode) > 64;
    ALTER TABLE dbo.Vendors ALTER COLUMN VendorCode NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.Items', N'U') IS NOT NULL
AND COL_LENGTH('dbo.Items', 'ItemCode') IS NOT NULL
AND (COL_LENGTH('dbo.Items', 'ItemCode') = -1 OR COL_LENGTH('dbo.Items', 'ItemCode') > 128)
BEGIN
    UPDATE dbo.Items SET ItemCode = LEFT(ItemCode, 64) WHERE ItemCode IS NOT NULL AND LEN(ItemCode) > 64;
    ALTER TABLE dbo.Items ALTER COLUMN ItemCode NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.Warehouses', N'U') IS NOT NULL
AND COL_LENGTH('dbo.Warehouses', 'WarehouseCode') IS NOT NULL
AND (COL_LENGTH('dbo.Warehouses', 'WarehouseCode') = -1 OR COL_LENGTH('dbo.Warehouses', 'WarehouseCode') > 128)
BEGIN
    UPDATE dbo.Warehouses SET WarehouseCode = LEFT(WarehouseCode, 64) WHERE WarehouseCode IS NOT NULL AND LEN(WarehouseCode) > 64;
    ALTER TABLE dbo.Warehouses ALTER COLUMN WarehouseCode NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SalesInvoices_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.SalesInvoices'))
AND NOT EXISTS (SELECT 1 FROM dbo.SalesInvoices WHERE IsDeleted = 0 AND InvoiceNumber IS NOT NULL AND InvoiceNumber <> '' GROUP BY TenantId, InvoiceNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_SalesInvoices_Tenant_Number] ON [dbo].[SalesInvoices]([TenantId], [InvoiceNumber]) WHERE [IsDeleted] = 0 AND [InvoiceNumber] IS NOT NULL AND [InvoiceNumber] <> '';
GO

IF OBJECT_ID(N'dbo.PurchaseInvoices', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PurchaseInvoices_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.PurchaseInvoices'))
AND NOT EXISTS (SELECT 1 FROM dbo.PurchaseInvoices WHERE IsDeleted = 0 AND InvoiceNumber IS NOT NULL AND InvoiceNumber <> '' GROUP BY TenantId, InvoiceNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_PurchaseInvoices_Tenant_Number] ON [dbo].[PurchaseInvoices]([TenantId], [InvoiceNumber]) WHERE [IsDeleted] = 0 AND [InvoiceNumber] IS NOT NULL AND [InvoiceNumber] <> '';
GO

IF OBJECT_ID(N'dbo.PurchaseOrders', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PurchaseOrders_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.PurchaseOrders'))
AND NOT EXISTS (SELECT 1 FROM dbo.PurchaseOrders WHERE IsDeleted = 0 AND PONumber IS NOT NULL AND PONumber <> '' GROUP BY TenantId, PONumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_PurchaseOrders_Tenant_Number] ON [dbo].[PurchaseOrders]([TenantId], [PONumber]) WHERE [IsDeleted] = 0 AND [PONumber] IS NOT NULL AND [PONumber] <> '';
GO

IF OBJECT_ID(N'dbo.SalesOrders', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SalesOrders_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.SalesOrders'))
AND NOT EXISTS (SELECT 1 FROM dbo.SalesOrders WHERE IsDeleted = 0 AND SONumber IS NOT NULL AND SONumber <> '' GROUP BY TenantId, SONumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_SalesOrders_Tenant_Number] ON [dbo].[SalesOrders]([TenantId], [SONumber]) WHERE [IsDeleted] = 0 AND [SONumber] IS NOT NULL AND [SONumber] <> '';
GO

IF OBJECT_ID(N'dbo.SalesQuotations', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SalesQuotations_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.SalesQuotations'))
AND NOT EXISTS (SELECT 1 FROM dbo.SalesQuotations WHERE IsDeleted = 0 AND QuotationNumber IS NOT NULL AND QuotationNumber <> '' GROUP BY TenantId, QuotationNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_SalesQuotations_Tenant_Number] ON [dbo].[SalesQuotations]([TenantId], [QuotationNumber]) WHERE [IsDeleted] = 0 AND [QuotationNumber] IS NOT NULL AND [QuotationNumber] <> '';
GO

IF OBJECT_ID(N'dbo.Payments', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Payments_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.Payments'))
AND NOT EXISTS (SELECT 1 FROM dbo.Payments WHERE IsDeleted = 0 AND PaymentNumber IS NOT NULL AND PaymentNumber <> '' GROUP BY TenantId, PaymentNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_Payments_Tenant_Number] ON [dbo].[Payments]([TenantId], [PaymentNumber]) WHERE [IsDeleted] = 0 AND [PaymentNumber] IS NOT NULL AND [PaymentNumber] <> '';
GO

IF OBJECT_ID(N'dbo.JournalEntries', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_JournalEntries_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.JournalEntries'))
AND NOT EXISTS (SELECT 1 FROM dbo.JournalEntries WHERE IsDeleted = 0 AND JournalNumber IS NOT NULL AND JournalNumber <> '' GROUP BY TenantId, JournalNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_JournalEntries_Tenant_Number] ON [dbo].[JournalEntries]([TenantId], [JournalNumber]) WHERE [IsDeleted] = 0 AND [JournalNumber] IS NOT NULL AND [JournalNumber] <> '';
GO

IF OBJECT_ID(N'dbo.ExpenseClaims', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ExpenseClaims_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.ExpenseClaims'))
AND NOT EXISTS (SELECT 1 FROM dbo.ExpenseClaims WHERE IsDeleted = 0 AND ClaimNumber IS NOT NULL AND ClaimNumber <> '' GROUP BY TenantId, ClaimNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_ExpenseClaims_Tenant_Number] ON [dbo].[ExpenseClaims]([TenantId], [ClaimNumber]) WHERE [IsDeleted] = 0 AND [ClaimNumber] IS NOT NULL AND [ClaimNumber] <> '';
GO

IF OBJECT_ID(N'dbo.GoodsReceiptNotes', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_GoodsReceiptNotes_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.GoodsReceiptNotes'))
AND NOT EXISTS (SELECT 1 FROM dbo.GoodsReceiptNotes WHERE IsDeleted = 0 AND GrnNumber IS NOT NULL AND GrnNumber <> '' GROUP BY TenantId, GrnNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_GoodsReceiptNotes_Tenant_Number] ON [dbo].[GoodsReceiptNotes]([TenantId], [GrnNumber]) WHERE [IsDeleted] = 0 AND [GrnNumber] IS NOT NULL AND [GrnNumber] <> '';
GO

IF OBJECT_ID(N'dbo.StockMovements', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_StockMovements_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.StockMovements'))
AND NOT EXISTS (SELECT 1 FROM dbo.StockMovements WHERE IsDeleted = 0 AND MovementNumber IS NOT NULL AND MovementNumber <> '' GROUP BY TenantId, MovementNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_StockMovements_Tenant_Number] ON [dbo].[StockMovements]([TenantId], [MovementNumber]) WHERE [IsDeleted] = 0 AND [MovementNumber] IS NOT NULL AND [MovementNumber] <> '';
GO

IF OBJECT_ID(N'dbo.CrmLeads', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_CrmLeads_Tenant_LeadCode' AND object_id = OBJECT_ID(N'dbo.CrmLeads'))
AND NOT EXISTS (SELECT 1 FROM dbo.CrmLeads WHERE IsDeleted = 0 AND LeadCode IS NOT NULL AND LeadCode <> '' GROUP BY TenantId, LeadCode HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_CrmLeads_Tenant_LeadCode] ON [dbo].[CrmLeads]([TenantId], [LeadCode]) WHERE [IsDeleted] = 0 AND [LeadCode] IS NOT NULL AND [LeadCode] <> '';
GO

IF OBJECT_ID(N'dbo.TravelRequests', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TravelRequests_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.TravelRequests'))
AND NOT EXISTS (SELECT 1 FROM dbo.TravelRequests WHERE IsDeleted = 0 AND RequestNumber IS NOT NULL AND RequestNumber <> '' GROUP BY TenantId, RequestNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_TravelRequests_Tenant_Number] ON [dbo].[TravelRequests]([TenantId], [RequestNumber]) WHERE [IsDeleted] = 0 AND [RequestNumber] IS NOT NULL AND [RequestNumber] <> '';
GO

IF OBJECT_ID(N'dbo.ProjectTasks', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ProjectTasks_Tenant_Code' AND object_id = OBJECT_ID(N'dbo.ProjectTasks'))
AND NOT EXISTS (SELECT 1 FROM dbo.ProjectTasks WHERE IsDeleted = 0 AND TaskCode IS NOT NULL AND TaskCode <> '' GROUP BY TenantId, TaskCode HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_ProjectTasks_Tenant_Code] ON [dbo].[ProjectTasks]([TenantId], [TaskCode]) WHERE [IsDeleted] = 0 AND [TaskCode] IS NOT NULL AND [TaskCode] <> '';
GO

IF OBJECT_ID(N'dbo.Vendors', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Vendors_Tenant_Code' AND object_id = OBJECT_ID(N'dbo.Vendors'))
AND NOT EXISTS (SELECT 1 FROM dbo.Vendors WHERE IsDeleted = 0 AND VendorCode IS NOT NULL AND VendorCode <> '' GROUP BY TenantId, VendorCode HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_Vendors_Tenant_Code] ON [dbo].[Vendors]([TenantId], [VendorCode]) WHERE [IsDeleted] = 0 AND [VendorCode] IS NOT NULL AND [VendorCode] <> '';
GO

IF OBJECT_ID(N'dbo.Items', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Items_Tenant_Code' AND object_id = OBJECT_ID(N'dbo.Items'))
AND NOT EXISTS (SELECT 1 FROM dbo.Items WHERE IsDeleted = 0 AND ItemCode IS NOT NULL AND ItemCode <> '' GROUP BY TenantId, ItemCode HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_Items_Tenant_Code] ON [dbo].[Items]([TenantId], [ItemCode]) WHERE [IsDeleted] = 0 AND [ItemCode] IS NOT NULL AND [ItemCode] <> '';
GO

IF OBJECT_ID(N'dbo.Warehouses', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Warehouses_Tenant_Code' AND object_id = OBJECT_ID(N'dbo.Warehouses'))
AND NOT EXISTS (SELECT 1 FROM dbo.Warehouses WHERE IsDeleted = 0 AND WarehouseCode IS NOT NULL AND WarehouseCode <> '' GROUP BY TenantId, WarehouseCode HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_Warehouses_Tenant_Code] ON [dbo].[Warehouses]([TenantId], [WarehouseCode]) WHERE [IsDeleted] = 0 AND [WarehouseCode] IS NOT NULL AND [WarehouseCode] <> '';
GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260818010000_AddDocumentNumberIndexes')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260818010000_AddDocumentNumberIndexes', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260818010000_AddDocumentNumberIndexes.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260819053000_OptionalDocumentLineItemIds.sql <<<<<
-- ============================================================================
-- Allow document lines without a catalog item so users can type a manual item.

IF OBJECT_ID(N'dbo.SalesQuotationItems', N'U') IS NOT NULL
AND COL_LENGTH('dbo.SalesQuotationItems', 'ItemId') IS NOT NULL
AND COLUMNPROPERTY(OBJECT_ID(N'dbo.SalesQuotationItems'), 'ItemId', 'AllowsNull') = 0
    ALTER TABLE dbo.SalesQuotationItems ALTER COLUMN ItemId UNIQUEIDENTIFIER NULL;
GO

IF OBJECT_ID(N'dbo.SalesOrderItems', N'U') IS NOT NULL
AND COL_LENGTH('dbo.SalesOrderItems', 'ItemId') IS NOT NULL
AND COLUMNPROPERTY(OBJECT_ID(N'dbo.SalesOrderItems'), 'ItemId', 'AllowsNull') = 0
    ALTER TABLE dbo.SalesOrderItems ALTER COLUMN ItemId UNIQUEIDENTIFIER NULL;
GO

IF OBJECT_ID(N'dbo.SalesInvoiceItems', N'U') IS NOT NULL
AND COL_LENGTH('dbo.SalesInvoiceItems', 'ItemId') IS NOT NULL
AND COLUMNPROPERTY(OBJECT_ID(N'dbo.SalesInvoiceItems'), 'ItemId', 'AllowsNull') = 0
    ALTER TABLE dbo.SalesInvoiceItems ALTER COLUMN ItemId UNIQUEIDENTIFIER NULL;
GO

IF OBJECT_ID(N'dbo.PurchaseOrderItems', N'U') IS NOT NULL
AND COL_LENGTH('dbo.PurchaseOrderItems', 'ItemId') IS NOT NULL
AND COLUMNPROPERTY(OBJECT_ID(N'dbo.PurchaseOrderItems'), 'ItemId', 'AllowsNull') = 0
    ALTER TABLE dbo.PurchaseOrderItems ALTER COLUMN ItemId UNIQUEIDENTIFIER NULL;
GO

IF OBJECT_ID(N'dbo.PurchaseInvoiceItems', N'U') IS NOT NULL
AND COL_LENGTH('dbo.PurchaseInvoiceItems', 'ItemId') IS NOT NULL
AND COLUMNPROPERTY(OBJECT_ID(N'dbo.PurchaseInvoiceItems'), 'ItemId', 'AllowsNull') = 0
    ALTER TABLE dbo.PurchaseInvoiceItems ALTER COLUMN ItemId UNIQUEIDENTIFIER NULL;
GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260819053000_OptionalDocumentLineItemIds')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260819053000_OptionalDocumentLineItemIds', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260819053000_OptionalDocumentLineItemIds.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260819060000_AddDiscountSchemes.sql <<<<<
-- ============================================================================
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

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260819060000_AddDiscountSchemes')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260819060000_AddDiscountSchemes', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260819060000_AddDiscountSchemes.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260819080000_AddOrgScopeColumns.sql <<<<<
-- ============================================================================
DECLARE @tables TABLE (
    TableName sysname NOT NULL,
    AddProject bit NOT NULL
);

INSERT INTO @tables (TableName, AddProject) VALUES
    ('Customers', 1),
    ('Vendors', 1),
    ('Items', 1),
    ('Warehouses', 1),
    ('StockMovements', 1),
    ('StockBalances', 0),
    ('SalesQuotations', 1),
    ('SalesOrders', 1),
    ('SalesInvoices', 1),
    ('PurchaseOrders', 1),
    ('PurchaseInvoices', 1),
    ('PurchaseRequests', 1),
    ('GoodsReceiptNotes', 1),
    ('JournalEntries', 1),
    ('Payments', 1),
    ('ExpenseClaims', 0),
    ('CrmLeads', 1),
    ('DiscountSchemes', 1),
    ('BankReconciliations', 0),
    ('SalesReturns', 1),
    ('FixedAssets', 1);

DECLARE @table sysname;
DECLARE @addProject bit;
DECLARE @sql nvarchar(max);

DECLARE table_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT TableName, AddProject FROM @tables;

OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @table, @addProject;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF OBJECT_ID(N'dbo.' + @table, N'U') IS NOT NULL AND COL_LENGTH('dbo.' + @table, 'CompanyId') IS NULL
    BEGIN
        SET @sql = N'ALTER TABLE dbo.' + QUOTENAME(@table) + N' ADD CompanyId uniqueidentifier NULL';
        EXEC sp_executesql @sql;
    END

    IF @addProject = 1 AND OBJECT_ID(N'dbo.' + @table, N'U') IS NOT NULL AND COL_LENGTH('dbo.' + @table, 'ProjectId') IS NULL
    BEGIN
        SET @sql = N'ALTER TABLE dbo.' + QUOTENAME(@table) + N' ADD ProjectId uniqueidentifier NULL';
        EXEC sp_executesql @sql;
    END

    FETCH NEXT FROM table_cursor INTO @table, @addProject;
END

CLOSE table_cursor;
DEALLOCATE table_cursor;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId
FROM dbo.Customers t
INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId
WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.Vendors t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.Items t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.Warehouses t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.SalesInvoices t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.SalesOrders t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.SalesQuotations t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.PurchaseOrders t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.PurchaseInvoices t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.JournalEntries t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.Payments t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.CrmLeads t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.ExpenseClaims t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.DiscountSchemes t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.StockMovements t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.GoodsReceiptNotes t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.PurchaseRequests t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.SalesReturns t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.FixedAssets t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.BankReconciliations t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.StockBalances t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260819080000_AddOrgScopeColumns')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260819080000_AddOrgScopeColumns', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260819080000_AddOrgScopeColumns.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260819090000_AddOrgScopeIndexes.sql <<<<<
-- ============================================================================
IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL AND COL_LENGTH('dbo.SalesInvoices', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SalesInvoices_Tenant_Company_Date' AND object_id = OBJECT_ID(N'dbo.SalesInvoices'))
    CREATE NONCLUSTERED INDEX [IX_SalesInvoices_Tenant_Company_Date] ON dbo.SalesInvoices ([TenantId], [CompanyId], [InvoiceDate] DESC) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.SalesOrders', N'U') IS NOT NULL AND COL_LENGTH('dbo.SalesOrders', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SalesOrders_Tenant_Company_Date' AND object_id = OBJECT_ID(N'dbo.SalesOrders'))
    CREATE NONCLUSTERED INDEX [IX_SalesOrders_Tenant_Company_Date] ON dbo.SalesOrders ([TenantId], [CompanyId], [SODate] DESC) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.SalesQuotations', N'U') IS NOT NULL AND COL_LENGTH('dbo.SalesQuotations', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SalesQuotations_Tenant_Company_Date' AND object_id = OBJECT_ID(N'dbo.SalesQuotations'))
    CREATE NONCLUSTERED INDEX [IX_SalesQuotations_Tenant_Company_Date] ON dbo.SalesQuotations ([TenantId], [CompanyId], [QuotationDate] DESC) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.PurchaseOrders', N'U') IS NOT NULL AND COL_LENGTH('dbo.PurchaseOrders', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PurchaseOrders_Tenant_Company_Date' AND object_id = OBJECT_ID(N'dbo.PurchaseOrders'))
    CREATE NONCLUSTERED INDEX [IX_PurchaseOrders_Tenant_Company_Date] ON dbo.PurchaseOrders ([TenantId], [CompanyId], [PODate] DESC) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.PurchaseInvoices', N'U') IS NOT NULL AND COL_LENGTH('dbo.PurchaseInvoices', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PurchaseInvoices_Tenant_Company_Date' AND object_id = OBJECT_ID(N'dbo.PurchaseInvoices'))
    CREATE NONCLUSTERED INDEX [IX_PurchaseInvoices_Tenant_Company_Date] ON dbo.PurchaseInvoices ([TenantId], [CompanyId], [InvoiceDate] DESC) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.Customers', N'U') IS NOT NULL AND COL_LENGTH('dbo.Customers', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Customers_Tenant_Company' AND object_id = OBJECT_ID(N'dbo.Customers'))
    CREATE NONCLUSTERED INDEX [IX_Customers_Tenant_Company] ON dbo.Customers ([TenantId], [CompanyId]) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.Vendors', N'U') IS NOT NULL AND COL_LENGTH('dbo.Vendors', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Vendors_Tenant_Company' AND object_id = OBJECT_ID(N'dbo.Vendors'))
    CREATE NONCLUSTERED INDEX [IX_Vendors_Tenant_Company] ON dbo.Vendors ([TenantId], [CompanyId]) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.Items', N'U') IS NOT NULL AND COL_LENGTH('dbo.Items', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Items_Tenant_Company' AND object_id = OBJECT_ID(N'dbo.Items'))
    CREATE NONCLUSTERED INDEX [IX_Items_Tenant_Company] ON dbo.Items ([TenantId], [CompanyId]) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.JournalEntries', N'U') IS NOT NULL AND COL_LENGTH('dbo.JournalEntries', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_JournalEntries_Tenant_Company_Date' AND object_id = OBJECT_ID(N'dbo.JournalEntries'))
    CREATE NONCLUSTERED INDEX [IX_JournalEntries_Tenant_Company_Date] ON dbo.JournalEntries ([TenantId], [CompanyId], [EntryDate] DESC) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.Payments', N'U') IS NOT NULL AND COL_LENGTH('dbo.Payments', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Payments_Tenant_Company_Date' AND object_id = OBJECT_ID(N'dbo.Payments'))
    CREATE NONCLUSTERED INDEX [IX_Payments_Tenant_Company_Date] ON dbo.Payments ([TenantId], [CompanyId], [PaymentDate] DESC) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Employees_UserId' AND object_id = OBJECT_ID(N'dbo.Employees'))
    CREATE NONCLUSTERED INDEX [IX_Employees_UserId] ON dbo.Employees ([UserId]) WHERE [UserId] IS NOT NULL AND [IsDeleted] = 0;
GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260819090000_AddOrgScopeIndexes')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260819090000_AddOrgScopeIndexes', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260819090000_AddOrgScopeIndexes.sql <<<<<

-- ============================================================================
-- >>>>> BEGIN MIGRATION: 20260901_AddMultiTenantCompositeIndexes.sql <<<<<
-- ============================================================================
-- 20260901_AddMultiTenantCompositeIndexes.sql
-- High performance composite indexes for high-frequency multi-tenant queries

-- 1. AuditLogs Composite Indexes
IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.AuditLogs', 'Hash') IS NULL
        ALTER TABLE dbo.AuditLogs ADD Hash NVARCHAR(128) NULL;
    IF COL_LENGTH('dbo.AuditLogs', 'PrevHash') IS NULL
        ALTER TABLE dbo.AuditLogs ADD PrevHash NVARCHAR(128) NULL;
    IF COL_LENGTH('dbo.AuditLogs', 'Action') IS NOT NULL AND (COL_LENGTH('dbo.AuditLogs', 'Action') = -1 OR COL_LENGTH('dbo.AuditLogs', 'Action') > 200)
        ALTER TABLE dbo.AuditLogs ALTER COLUMN [Action] NVARCHAR(100) NULL;
    IF COL_LENGTH('dbo.AuditLogs', 'EntityName') IS NOT NULL AND (COL_LENGTH('dbo.AuditLogs', 'EntityName') = -1 OR COL_LENGTH('dbo.AuditLogs', 'EntityName') > 200)
        ALTER TABLE dbo.AuditLogs ALTER COLUMN [EntityName] NVARCHAR(100) NULL;
END;
GO

IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_Tenant_CreatedAt' AND object_id = OBJECT_ID(N'dbo.AuditLogs'))
    CREATE NONCLUSTERED INDEX [IX_AuditLogs_Tenant_CreatedAt] ON dbo.AuditLogs ([TenantId], [CreatedAt] DESC);
GO

IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_Tenant_Action_CreatedAt' AND object_id = OBJECT_ID(N'dbo.AuditLogs'))
    CREATE NONCLUSTERED INDEX [IX_AuditLogs_Tenant_Action_CreatedAt] ON dbo.AuditLogs ([TenantId], [Action], [CreatedAt] DESC);
GO

-- 2. SalesInvoices Status & Date Composite Index
IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.SalesInvoices', 'Status') IS NOT NULL AND (COL_LENGTH('dbo.SalesInvoices', 'Status') = -1 OR COL_LENGTH('dbo.SalesInvoices', 'Status') > 100)
        ALTER TABLE dbo.SalesInvoices ALTER COLUMN [Status] NVARCHAR(50) NULL;
END;
GO

IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SalesInvoices_Tenant_Status_Date' AND object_id = OBJECT_ID(N'dbo.SalesInvoices'))
    CREATE NONCLUSTERED INDEX [IX_SalesInvoices_Tenant_Status_Date] ON dbo.SalesInvoices ([TenantId], [Status], [InvoiceDate] DESC) WHERE [IsDeleted] = 0;
GO

-- 3. StockMovements Item & Date Composite Index
IF OBJECT_ID(N'dbo.StockMovements', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_StockMovements_Tenant_Item_Date' AND object_id = OBJECT_ID(N'dbo.StockMovements'))
    CREATE NONCLUSTERED INDEX [IX_StockMovements_Tenant_Item_Date] ON dbo.StockMovements ([TenantId], [ItemId], [MovementDate] DESC) WHERE [IsDeleted] = 0;
GO

-- 4. AttendanceRecords Employee & Date Composite Index
IF OBJECT_ID(N'dbo.AttendanceRecords', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AttendanceRecords_Tenant_Employee_Date' AND object_id = OBJECT_ID(N'dbo.AttendanceRecords'))
    CREATE NONCLUSTERED INDEX [IX_AttendanceRecords_Tenant_Employee_Date] ON dbo.AttendanceRecords ([TenantId], [EmployeeId], [Date] DESC) WHERE [IsDeleted] = 0;
GO

-- 5. BankTransactions BankAccount & Date Composite Index
IF OBJECT_ID(N'dbo.BankTransactions', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_BankTransactions_Tenant_Account_Date' AND object_id = OBJECT_ID(N'dbo.BankTransactions'))
    CREATE NONCLUSTERED INDEX [IX_BankTransactions_Tenant_Account_Date] ON dbo.BankTransactions ([TenantId], [BankAccountId], [TransactionDate] DESC) WHERE [IsDeleted] = 0;
GO

-- 6. Users EmailHash Blind-Index Lookups
IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Users_Tenant_EmailHash' AND object_id = OBJECT_ID(N'dbo.Users'))
    CREATE NONCLUSTERED INDEX [IX_Users_Tenant_EmailHash] ON dbo.Users ([TenantId], [EmailHash]) WHERE [EmailHash] IS NOT NULL AND [IsDeleted] = 0;
GO

-- Record migration history if not already recorded
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260901_AddMultiTenantCompositeIndexes')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260901_AddMultiTenantCompositeIndexes', N'10.0.11');
END;
GO

-- >>>>> END MIGRATION: 20260901_AddMultiTenantCompositeIndexes.sql <<<<<

