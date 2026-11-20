# 💾 UAB INDIA ENTERPRISE SUITE — DATABASE & ENTITY AUDIT
**Document ID:** `AUDIT-DOC-007`  
**Evaluation Date:** November 2026  
**Auditor Roles:** Database Architect, Enterprise Software Architect & Senior Backend Engineer  

---

## 1. Database Architecture Overview

The database layer runs on **Microsoft SQL Server 2022 Enterprise / Azure SQL Database**, accessed via **Entity Framework Core 10.0.14**. The system employs a **Single Database with Discriminator-Based Multi-Tenancy (TenantId)** backed by EF Core **Global Query Filters**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SQL SERVER 2022 (UabIndia_Enterprise)                 │
│                                                                             │
│   Schema Isolation Model:                                                   │
│   - Application Tables: Hosted in default [dbo] schema                      │
│   - Multi-Tenancy: Enforced at query execution time via Global Query Filter │
│     WHERE [TenantId] = @__tenantAccessor_GetTenantId_0                      │
│   - Soft Delete: Automatically filtered via AND [IsDeleted] = 0             │
│   - Concurrency: Tracked via UpdatedAt / RowVersion optimistic patterns     │
│   - Connection Pool: Max Pool Size = 256; MultipleActiveResultSets = true   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Table & Entity Master Inventory

The database model is mapped in `ApplicationDbContext.cs` (1,267 lines) across 100+ distinct entities categorized into functional bounded contexts:

### 2.1 Multi-Tenancy, Security & Administration (24 Tables)
- `Tenants`, `TenantConfigs`, `TenantModules`, `TenantSubscriptions`, `TenantWebhooks`, `WebhookDeliveryLogs`
- `Users`, `Roles`, `UserRoles`, `Permissions`, `RolePermissions`, `UserPermissions`
- `DataScopes`, `RoleDataScopes` (ABAC security matrix)
- `AuditLogs`, `RefreshTokens`, `SecurityPolicies`, `SsoIdentityProviders`, `IpAccessRules`, `MfaEnrollments`
- `UiPageDefinitions`, `UiPageVersions`, `UiViewDefinitions`, `DashboardDefinitions`, `WidgetDefinitions`, `DashboardWidgets`, `EntityFieldDefinitions`, `EntityFieldValues`, `BusinessIdSequences`

### 2.2 Organization Hierarchy & Geography (18 Tables)
- `Companies`, `Branches`, `Departments`, `Designations`, `CostCenters`, `BusinessUnits`, `PostingUnits`, `EmployeePostingAssignments`
- `GeoCountries`, `GeoStates`, `GeoDistricts`, `GeoCities`, `BusinessZones`, `BusinessRegions`, `BusinessClusters`, `OperationalLocations`
- `Projects`, `ProjectTasks`, `TimesheetEntries`

### 2.3 HRMS Core & Lifecycle (22 Tables)
- `Employees`, `EmployeeHierarchyTransfers`, `HrLifecycleTasks`, `AppointmentLetters`
- `LeaveTypes`, `LeavePolicies`, `LeavePolicyRules`, `LeaveAllocations`, `EmployeeLeaves`, `LeaveRequests`, `Holidays`
- `AttendanceRecords`, `AttendancePolicies`, `AttendanceCorrections`, `AttendanceRegularizationRequests`, `BiometricDevices`
- `Shifts`, `ShiftAssignments`, `ShiftSwaps`, `ShiftRotations`, `RotationSchedules`
- `OvertimeRequests`, `OvertimeApprovals`, `OvertimeLogs`, `OvertimeCompensations`

### 2.4 Payroll & Indian Statutory (16 Tables)
- `PayrollStructures`, `PayrollComponents`, `EmployeeSalaryAssignments`
- `PayrollRuns`, `Payslips`, `PayslipLines`, `PayrollArrears`, `PayrollLoans`, `PayrollBonuses`, `PayrollFinalSettlements`
- `ProvidentFunds`, `EmployeeStateInsurances`, `ProfessionalTaxes`, `IncomeTaxes`, `TaxDeclarations`, `PFWithdrawals`, `ESIBenefits`, `StatutorySettings`

### 2.5 Talent Acquisition & Development (12 Tables)
- `StaffingPlans`, `JobPostings`, `Candidates`, `CandidateScreenings`, `JobApplications`, `OfferLetters`
- `TrainingCourses`, `CourseEnrollments`, `TrainingAssessments`, `TrainingCertificates`, `TrainingRequests`
- `AppraisalCycles`, `PerformanceAppraisals`, `AppraisalRatings`, `AppraisalCompetencies`

### 2.6 ERP Commercial, Finance & Operations (20 Tables)
- `ChartOfAccounts`, `JournalEntries`, `JournalEntryLines`, `Payments`, `ExpenseClaims`, `BankReconciliations`, `AccountingPeriods`, `CostCenterBudgets`
- `Customers`, `CrmLeads`, `CrmContacts`, `SalesQuotations`, `SalesQuotationItems`, `SalesOrders`, `SalesOrderItems`, `SalesInvoices`, `SalesInvoiceItems`, `SalesReturns`, `DiscountSchemes`, `DiscountSchemeLines`
- `Vendors`, `PurchaseRequests`, `PurchaseOrders`, `PurchaseOrderItems`, `PurchaseInvoices`, `PurchaseInvoiceItems`, `GoodsReceiptNotes`
- `Items`, `Warehouses`, `StockMovements`, `StockBalances`, `ItemBatches`, `ItemSerialNumbers`, `WarehouseBins`
- `FixedAssets`, `AssetAllocations`, `AssetDepreciations`, `AssetMaintenances`
- `WorkOrders`, `WorkOrderOperations`, `BillsOfMaterial`, `BomItems`, `QualityInspectionLots`, `SubcontractOrders`

---

## 3. Relational Keys, Indexes & Constraints Audit

### 3.1 Clustered Primary Keys
- Every entity implements standard GUID (`uniqueidentifier`) primary keys.
- **Architectural Observation**: In SQL Server, random GUIDs (`Guid.NewGuid()`) used as clustered primary keys cause index fragmentation during high-throughput insert operations (e.g. bulk attendance punch ingestion).
- **Recommendation**: Implement Sequential GUIDs (`RT.Comb` or `NewSequentialId()`) in production or migrate to integer identity keys for high-frequency append-only tables (`AttendanceRecords`, `StockMovements`, `AuditLogs`).

### 3.2 Multi-Tenant Composite Unique Indexes
To prevent organizational code collisions while guaranteeing unique business identifiers within an organization, the database enforces composite unique indexes:
```csharp
// ApplicationDbContext.cs:335-341
foreach (var orgType in new[] { 
    typeof(Department), typeof(Designation), typeof(Branch), typeof(CostCenter), 
    typeof(BusinessUnit), typeof(BusinessZone), typeof(BusinessRegion), 
    typeof(BusinessCluster), typeof(OperationalLocation), typeof(PostingUnit)
})
{
    modelBuilder.Entity(orgType).HasIndex("TenantId", "CompanyId", "Code").IsUnique();
}
```
This correctly allows two different companies in the same tenant (or two different tenants) to use the same department code (e.g. `DEP-ENG`), while strictly forbidding duplicate codes within the same company.

### 3.3 Foreign Key Delete Behaviors
- **Finding**: Critical entity relationships use `DeleteBehavior.Restrict` (e.g. `Department -> Company`, `Employee -> Company`, `AttendanceRegularization -> Employee`).
- **Verdict**: **EXCELLENT PRACTICE**. This strictly prevents accidental cascade deletion of corporate payroll or attendance history if a department or parent company row is deleted.

---

## 4. Multi-Tenant Query Filtering & Isolation Analysis

Multi-tenancy is enforced globally in EF Core via:
```csharp
// ApplicationDbContext.cs:716-986
modelBuilder.Entity<Employee>().HasQueryFilter(e => 
    !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
```

### Safety Audit of `IgnoreQueryFilters()` Usage:
Because global query filters automatically restrict every LINQ query to the current `TenantId`, bypassing filters via `.IgnoreQueryFilters()` must be strictly controlled.

We conducted a full code audit of all `.IgnoreQueryFilters()` usages:
1. `AuthController.cs:164`: Used to query `SecurityPolicies` for account lockout limits before user tenant context is established. (Safe)
2. `AuthController.cs:206`: Used during sign-in to load roles for the verified user by exact user ID. (Safe)
3. `AuditLogsController.cs:298-403`: Used by Platform SuperAdmin to cascade-purge all child tables of a deleted tenant. Guarded by `IsSuperAdmin()` check. (Safe)
4. `TenantResolverMiddleware.cs`: Used during host-to-subdomain mapping lookup. (Safe)

**Verdict**: No unauthorized tenant leakage or improper bypass was found.

---

## 5. Audit Fields & Soft-Delete Automation

In `ApplicationDbContext.cs:989-1060`, `SaveChanges()` and `SaveChangesAsync()` automatically intercept entity state transitions:
1. **Creation**: Populates `CreatedAt = DateTime.UtcNow` and `TenantId = _tenantAccessor.GetTenantId()`.
2. **Modification**: Populates `UpdatedAt = DateTime.UtcNow`.
3. **Audit Trail**: Automatically serializes changed entity values and writes a corresponding record into the `AuditLogs` table.

---

## 6. Migration Strategy & Schema Initialization

The platform uses a hybrid migration approach:
1. **EF Core Migrations**: 25+ migration files dating from January 2026 to November 2026 recorded in `__EFMigrationsHistory`.
2. **Idempotent SQL Bootstrap (`MigrationBootstrap.cs`, 2,948 lines)**:
   - On application startup, `EnsureInitialCleanSchemaAsync` verifies if `dbo.Tenants` exists.
   - If missing (e.g. fresh installation or blank staging DB), it executes `initial-clean-idempotent.sql` (137 KB) to instantiate the entire relational schema in a single execution.
   - It reconciles `__EFMigrationsHistory` so subsequent EF migrations do not fail.
- **Verdict**: Reliable bootstrap for automated container deployments and continuous delivery environments.
