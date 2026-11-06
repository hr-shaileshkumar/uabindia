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
