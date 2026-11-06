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
