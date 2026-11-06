-- ================================================================================
-- UABIndia Enterprise ERP — Physical Schema Partitioning Migration
-- Blueprint Point 19: Database Architecture & Logical Schema Isolation
-- Moves tables from dbo to 17 logical enterprise schemas:
-- identity, organization, metadata, workflow, audit, notification, integration,
-- hr, payroll, finance, procurement, inventory, sales, crm, projects, assets, manufacturing.
-- Safe, idempotent, and reversible for SQL Server deployments.
-- ================================================================================

-- 1. Create Logical Enterprise Schemas
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'identity') EXEC('CREATE SCHEMA [identity]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'organization') EXEC('CREATE SCHEMA [organization]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'metadata') EXEC('CREATE SCHEMA [metadata]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'workflow') EXEC('CREATE SCHEMA [workflow]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'audit') EXEC('CREATE SCHEMA [audit]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'notification') EXEC('CREATE SCHEMA [notification]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'integration') EXEC('CREATE SCHEMA [integration]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'hr') EXEC('CREATE SCHEMA [hr]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'payroll') EXEC('CREATE SCHEMA [payroll]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'finance') EXEC('CREATE SCHEMA [finance]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'procurement') EXEC('CREATE SCHEMA [procurement]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'inventory') EXEC('CREATE SCHEMA [inventory]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'sales') EXEC('CREATE SCHEMA [sales]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'crm') EXEC('CREATE SCHEMA [crm]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'projects') EXEC('CREATE SCHEMA [projects]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'assets') EXEC('CREATE SCHEMA [assets]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'manufacturing') EXEC('CREATE SCHEMA [manufacturing]');
GO

-- 2. Transfer Identity Tables
IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND OBJECT_ID(N'identity.Users', N'U') IS NULL ALTER SCHEMA [identity] TRANSFER [dbo].[Users];
IF OBJECT_ID(N'dbo.Roles', N'U') IS NOT NULL AND OBJECT_ID(N'identity.Roles', N'U') IS NULL ALTER SCHEMA [identity] TRANSFER [dbo].[Roles];
IF OBJECT_ID(N'dbo.UserRoles', N'U') IS NOT NULL AND OBJECT_ID(N'identity.UserRoles', N'U') IS NULL ALTER SCHEMA [identity] TRANSFER [dbo].[UserRoles];
IF OBJECT_ID(N'dbo.Permissions', N'U') IS NOT NULL AND OBJECT_ID(N'identity.Permissions', N'U') IS NULL ALTER SCHEMA [identity] TRANSFER [dbo].[Permissions];
IF OBJECT_ID(N'dbo.RolePermissions', N'U') IS NOT NULL AND OBJECT_ID(N'identity.RolePermissions', N'U') IS NULL ALTER SCHEMA [identity] TRANSFER [dbo].[RolePermissions];
IF OBJECT_ID(N'dbo.UserPermissions', N'U') IS NOT NULL AND OBJECT_ID(N'identity.UserPermissions', N'U') IS NULL ALTER SCHEMA [identity] TRANSFER [dbo].[UserPermissions];
IF OBJECT_ID(N'dbo.DataScopes', N'U') IS NOT NULL AND OBJECT_ID(N'identity.DataScopes', N'U') IS NULL ALTER SCHEMA [identity] TRANSFER [dbo].[DataScopes];
IF OBJECT_ID(N'dbo.RoleDataScopes', N'U') IS NOT NULL AND OBJECT_ID(N'identity.RoleDataScopes', N'U') IS NULL ALTER SCHEMA [identity] TRANSFER [dbo].[RoleDataScopes];
IF OBJECT_ID(N'dbo.RefreshTokens', N'U') IS NOT NULL AND OBJECT_ID(N'identity.RefreshTokens', N'U') IS NULL ALTER SCHEMA [identity] TRANSFER [dbo].[RefreshTokens];
IF OBJECT_ID(N'dbo.SecurityPolicies', N'U') IS NOT NULL AND OBJECT_ID(N'identity.SecurityPolicies', N'U') IS NULL ALTER SCHEMA [identity] TRANSFER [dbo].[SecurityPolicies];
IF OBJECT_ID(N'dbo.IpAccessRules', N'U') IS NOT NULL AND OBJECT_ID(N'identity.IpAccessRules', N'U') IS NULL ALTER SCHEMA [identity] TRANSFER [dbo].[IpAccessRules];
IF OBJECT_ID(N'dbo.MfaEnrollments', N'U') IS NOT NULL AND OBJECT_ID(N'identity.MfaEnrollments', N'U') IS NULL ALTER SCHEMA [identity] TRANSFER [dbo].[MfaEnrollments];
GO

-- 3. Transfer Organization Tables
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND OBJECT_ID(N'organization.Tenants', N'U') IS NULL ALTER SCHEMA [organization] TRANSFER [dbo].[Tenants];
IF OBJECT_ID(N'dbo.Companies', N'U') IS NOT NULL AND OBJECT_ID(N'organization.Companies', N'U') IS NULL ALTER SCHEMA [organization] TRANSFER [dbo].[Companies];
IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND OBJECT_ID(N'organization.Projects', N'U') IS NULL ALTER SCHEMA [organization] TRANSFER [dbo].[Projects];
IF OBJECT_ID(N'dbo.Departments', N'U') IS NOT NULL AND OBJECT_ID(N'organization.Departments', N'U') IS NULL ALTER SCHEMA [organization] TRANSFER [dbo].[Departments];
IF OBJECT_ID(N'dbo.Designations', N'U') IS NOT NULL AND OBJECT_ID(N'organization.Designations', N'U') IS NULL ALTER SCHEMA [organization] TRANSFER [dbo].[Designations];
IF OBJECT_ID(N'dbo.Branches', N'U') IS NOT NULL AND OBJECT_ID(N'organization.Branches', N'U') IS NULL ALTER SCHEMA [organization] TRANSFER [dbo].[Branches];
IF OBJECT_ID(N'dbo.CostCenters', N'U') IS NOT NULL AND OBJECT_ID(N'organization.CostCenters', N'U') IS NULL ALTER SCHEMA [organization] TRANSFER [dbo].[CostCenters];
IF OBJECT_ID(N'dbo.BusinessUnits', N'U') IS NOT NULL AND OBJECT_ID(N'organization.BusinessUnits', N'U') IS NULL ALTER SCHEMA [organization] TRANSFER [dbo].[BusinessUnits];
IF OBJECT_ID(N'dbo.GeoCountries', N'U') IS NOT NULL AND OBJECT_ID(N'organization.GeoCountries', N'U') IS NULL ALTER SCHEMA [organization] TRANSFER [dbo].[GeoCountries];
IF OBJECT_ID(N'dbo.GeoStates', N'U') IS NOT NULL AND OBJECT_ID(N'organization.GeoStates', N'U') IS NULL ALTER SCHEMA [organization] TRANSFER [dbo].[GeoStates];
IF OBJECT_ID(N'dbo.GeoDistricts', N'U') IS NOT NULL AND OBJECT_ID(N'organization.GeoDistricts', N'U') IS NULL ALTER SCHEMA [organization] TRANSFER [dbo].[GeoDistricts];
IF OBJECT_ID(N'dbo.GeoCities', N'U') IS NOT NULL AND OBJECT_ID(N'organization.GeoCities', N'U') IS NULL ALTER SCHEMA [organization] TRANSFER [dbo].[GeoCities];
GO

-- 4. Transfer Metadata & Dashboard Tables
IF OBJECT_ID(N'dbo.UiPageDefinitions', N'U') IS NOT NULL AND OBJECT_ID(N'metadata.UiPageDefinitions', N'U') IS NULL ALTER SCHEMA [metadata] TRANSFER [dbo].[UiPageDefinitions];
IF OBJECT_ID(N'dbo.UiPageVersions', N'U') IS NOT NULL AND OBJECT_ID(N'metadata.UiPageVersions', N'U') IS NULL ALTER SCHEMA [metadata] TRANSFER [dbo].[UiPageVersions];
IF OBJECT_ID(N'dbo.EntityFieldDefinitions', N'U') IS NOT NULL AND OBJECT_ID(N'metadata.EntityFieldDefinitions', N'U') IS NULL ALTER SCHEMA [metadata] TRANSFER [dbo].[EntityFieldDefinitions];
IF OBJECT_ID(N'dbo.EntityFieldValues', N'U') IS NOT NULL AND OBJECT_ID(N'metadata.EntityFieldValues', N'U') IS NULL ALTER SCHEMA [metadata] TRANSFER [dbo].[EntityFieldValues];
IF OBJECT_ID(N'dbo.DashboardDefinitions', N'U') IS NOT NULL AND OBJECT_ID(N'metadata.DashboardDefinitions', N'U') IS NULL ALTER SCHEMA [metadata] TRANSFER [dbo].[DashboardDefinitions];
IF OBJECT_ID(N'dbo.WidgetDefinitions', N'U') IS NOT NULL AND OBJECT_ID(N'metadata.WidgetDefinitions', N'U') IS NULL ALTER SCHEMA [metadata] TRANSFER [dbo].[WidgetDefinitions];
IF OBJECT_ID(N'dbo.DashboardWidgets', N'U') IS NOT NULL AND OBJECT_ID(N'metadata.DashboardWidgets', N'U') IS NULL ALTER SCHEMA [metadata] TRANSFER [dbo].[DashboardWidgets];
GO

-- 5. Transfer Workflow & Approval Tables
IF OBJECT_ID(N'dbo.WorkflowDefinitions', N'U') IS NOT NULL AND OBJECT_ID(N'workflow.WorkflowDefinitions', N'U') IS NULL ALTER SCHEMA [workflow] TRANSFER [dbo].[WorkflowDefinitions];
IF OBJECT_ID(N'dbo.WorkflowSteps', N'U') IS NOT NULL AND OBJECT_ID(N'workflow.WorkflowSteps', N'U') IS NULL ALTER SCHEMA [workflow] TRANSFER [dbo].[WorkflowSteps];
IF OBJECT_ID(N'dbo.ApprovalRequests', N'U') IS NOT NULL AND OBJECT_ID(N'workflow.ApprovalRequests', N'U') IS NULL ALTER SCHEMA [workflow] TRANSFER [dbo].[ApprovalRequests];
IF OBJECT_ID(N'dbo.ApprovalHistories', N'U') IS NOT NULL AND OBJECT_ID(N'workflow.ApprovalHistories', N'U') IS NULL ALTER SCHEMA [workflow] TRANSFER [dbo].[ApprovalHistories];
GO

-- 6. Transfer Audit & Log Tables
IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL AND OBJECT_ID(N'audit.AuditLogs', N'U') IS NULL ALTER SCHEMA [audit] TRANSFER [dbo].[AuditLogs];
IF OBJECT_ID(N'dbo.UserSessions', N'U') IS NOT NULL AND OBJECT_ID(N'audit.UserSessions', N'U') IS NULL ALTER SCHEMA [audit] TRANSFER [dbo].[UserSessions];
IF OBJECT_ID(N'dbo.SecurityIncidents', N'U') IS NOT NULL AND OBJECT_ID(N'audit.SecurityIncidents', N'U') IS NULL ALTER SCHEMA [audit] TRANSFER [dbo].[SecurityIncidents];
GO

-- 7. Transfer HR & Payroll Tables
IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND OBJECT_ID(N'hr.Employees', N'U') IS NULL ALTER SCHEMA [hr] TRANSFER [dbo].[Employees];
IF OBJECT_ID(N'dbo.LeaveRequests', N'U') IS NOT NULL AND OBJECT_ID(N'hr.LeaveRequests', N'U') IS NULL ALTER SCHEMA [hr] TRANSFER [dbo].[LeaveRequests];
IF OBJECT_ID(N'dbo.Attendances', N'U') IS NOT NULL AND OBJECT_ID(N'hr.Attendances', N'U') IS NULL ALTER SCHEMA [hr] TRANSFER [dbo].[Attendances];
IF OBJECT_ID(N'dbo.PayrollRuns', N'U') IS NOT NULL AND OBJECT_ID(N'payroll.PayrollRuns', N'U') IS NULL ALTER SCHEMA [payroll] TRANSFER [dbo].[PayrollRuns];
IF OBJECT_ID(N'dbo.Payslips', N'U') IS NOT NULL AND OBJECT_ID(N'payroll.Payslips', N'U') IS NULL ALTER SCHEMA [payroll] TRANSFER [dbo].[Payslips];
IF OBJECT_ID(N'dbo.SalaryStructures', N'U') IS NOT NULL AND OBJECT_ID(N'payroll.SalaryStructures', N'U') IS NULL ALTER SCHEMA [payroll] TRANSFER [dbo].[SalaryStructures];
GO

-- 8. Transfer Finance Tables
IF OBJECT_ID(N'dbo.ChartOfAccounts', N'U') IS NOT NULL AND OBJECT_ID(N'finance.ChartOfAccounts', N'U') IS NULL ALTER SCHEMA [finance] TRANSFER [dbo].[ChartOfAccounts];
IF OBJECT_ID(N'dbo.JournalEntries', N'U') IS NOT NULL AND OBJECT_ID(N'finance.JournalEntries', N'U') IS NULL ALTER SCHEMA [finance] TRANSFER [dbo].[JournalEntries];
IF OBJECT_ID(N'dbo.JournalEntryLines', N'U') IS NOT NULL AND OBJECT_ID(N'finance.JournalEntryLines', N'U') IS NULL ALTER SCHEMA [finance] TRANSFER [dbo].[JournalEntryLines];
IF OBJECT_ID(N'dbo.BankAccounts', N'U') IS NOT NULL AND OBJECT_ID(N'finance.BankAccounts', N'U') IS NULL ALTER SCHEMA [finance] TRANSFER [dbo].[BankAccounts];
IF OBJECT_ID(N'dbo.BankStatements', N'U') IS NOT NULL AND OBJECT_ID(N'finance.BankStatements', N'U') IS NULL ALTER SCHEMA [finance] TRANSFER [dbo].[BankStatements];
IF OBJECT_ID(N'dbo.TaxSlabs', N'U') IS NOT NULL AND OBJECT_ID(N'finance.TaxSlabs', N'U') IS NULL ALTER SCHEMA [finance] TRANSFER [dbo].[TaxSlabs];
GO

-- 9. Transfer Procurement, Inventory & Sales Tables
IF OBJECT_ID(N'dbo.Vendors', N'U') IS NOT NULL AND OBJECT_ID(N'procurement.Vendors', N'U') IS NULL ALTER SCHEMA [procurement] TRANSFER [dbo].[Vendors];
IF OBJECT_ID(N'dbo.PurchaseOrders', N'U') IS NOT NULL AND OBJECT_ID(N'procurement.PurchaseOrders', N'U') IS NULL ALTER SCHEMA [procurement] TRANSFER [dbo].[PurchaseOrders];
IF OBJECT_ID(N'dbo.PurchaseOrderLines', N'U') IS NOT NULL AND OBJECT_ID(N'procurement.PurchaseOrderLines', N'U') IS NULL ALTER SCHEMA [procurement] TRANSFER [dbo].[PurchaseOrderLines];
IF OBJECT_ID(N'dbo.GoodsReceiptNotes', N'U') IS NOT NULL AND OBJECT_ID(N'procurement.GoodsReceiptNotes', N'U') IS NULL ALTER SCHEMA [procurement] TRANSFER [dbo].[GoodsReceiptNotes];
IF OBJECT_ID(N'dbo.VendorBills', N'U') IS NOT NULL AND OBJECT_ID(N'procurement.VendorBills', N'U') IS NULL ALTER SCHEMA [procurement] TRANSFER [dbo].[VendorBills];
IF OBJECT_ID(N'dbo.Items', N'U') IS NOT NULL AND OBJECT_ID(N'inventory.Items', N'U') IS NULL ALTER SCHEMA [inventory] TRANSFER [dbo].[Items];
IF OBJECT_ID(N'dbo.Warehouses', N'U') IS NOT NULL AND OBJECT_ID(N'inventory.Warehouses', N'U') IS NULL ALTER SCHEMA [inventory] TRANSFER [dbo].[Warehouses];
IF OBJECT_ID(N'dbo.StockMovements', N'U') IS NOT NULL AND OBJECT_ID(N'inventory.StockMovements', N'U') IS NULL ALTER SCHEMA [inventory] TRANSFER [dbo].[StockMovements];
IF OBJECT_ID(N'dbo.Customers', N'U') IS NOT NULL AND OBJECT_ID(N'sales.Customers', N'U') IS NULL ALTER SCHEMA [sales] TRANSFER [dbo].[Customers];
IF OBJECT_ID(N'dbo.SalesOrders', N'U') IS NOT NULL AND OBJECT_ID(N'sales.SalesOrders', N'U') IS NULL ALTER SCHEMA [sales] TRANSFER [dbo].[SalesOrders];
IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL AND OBJECT_ID(N'sales.SalesInvoices', N'U') IS NULL ALTER SCHEMA [sales] TRANSFER [dbo].[SalesInvoices];
GO

PRINT 'UABIndia Enterprise Schema Partitioning Migration completed successfully.'
GO
