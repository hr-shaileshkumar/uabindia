# 05 — Database Entity & Schema Mapping Audit

## Executive Summary
The database persistence layer is managed via Entity Framework Core with **172 DbSets** mapped in `ApplicationDbContext.cs` representing **124 domain entities**.

## Multi-Tenant Isolation Enforcement

```
                    Incoming HTTP Request
                              │
                              ▼
                TenantResolutionMiddleware
             (Extracts TenantId from JWT / Host)
                              │
                              ▼
                 Scoped ITenantAccessor
                              │
                              ▼
            ApplicationDbContext (EF Core Interceptor)
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
   Global Query Filters                    Audit Interceptor
  e.TenantId == CurrentTenantId        Auto-assigns CreatedBy,
  e.IsDeleted == false                 CreatedAt, UpdatedBy,
  e.CompanyId == CurrentCompanyId      TenantId on SaveChangesAsync
```

### Global Query Filter Implementation
The repository enforces multi-tenancy at the database engine level via EF Core global query filters configured in `ApplicationDbContext.OnModelCreating`:
- `TenantId`: Automatically filters records to the authenticated tenant.
- `IsDeleted`: Implements soft-delete pattern globally across all primary entities.
- `CompanyId`: Optional hierarchical filter for company-level scoping within a multi-company tenant.

## Entity & DbSet Catalog

| Entity Type | DbSet Property | DbContext Container |
| :--- | :--- | :--- |
| `Tenant` | `Tenants` | `ApplicationDbContext.cs` |
| `Company` | `Companies` | `ApplicationDbContext.cs` |
| `Project` | `Projects` | `ApplicationDbContext.cs` |
| `Department` | `Departments` | `ApplicationDbContext.cs` |
| `Designation` | `Designations` | `ApplicationDbContext.cs` |
| `Branch` | `Branches` | `ApplicationDbContext.cs` |
| `CostCenter` | `CostCenters` | `ApplicationDbContext.cs` |
| `BusinessUnit` | `BusinessUnits` | `ApplicationDbContext.cs` |
| `GeoCountry` | `GeoCountries` | `ApplicationDbContext.cs` |
| `GeoState` | `GeoStates` | `ApplicationDbContext.cs` |
| `GeoDistrict` | `GeoDistricts` | `ApplicationDbContext.cs` |
| `GeoCity` | `GeoCities` | `ApplicationDbContext.cs` |
| `BusinessZone` | `BusinessZones` | `ApplicationDbContext.cs` |
| `BusinessRegion` | `BusinessRegions` | `ApplicationDbContext.cs` |
| `BusinessCluster` | `BusinessClusters` | `ApplicationDbContext.cs` |
| `OperationalLocation` | `OperationalLocations` | `ApplicationDbContext.cs` |
| `PostingUnit` | `PostingUnits` | `ApplicationDbContext.cs` |
| `EmployeePostingAssignment` | `EmployeePostingAssignments` | `ApplicationDbContext.cs` |
| `User` | `Users` | `ApplicationDbContext.cs` |
| `Role` | `Roles` | `ApplicationDbContext.cs` |
| `UserRole` | `UserRoles` | `ApplicationDbContext.cs` |
| `Permission` | `Permissions` | `ApplicationDbContext.cs` |
| `RolePermission` | `RolePermissions` | `ApplicationDbContext.cs` |
| `UserPermission` | `UserPermissions` | `ApplicationDbContext.cs` |
| `Employee` | `Employees` | `ApplicationDbContext.cs` |
| `AttendanceRecord` | `AttendanceRecords` | `ApplicationDbContext.cs` |
| `BiometricDevice` | `BiometricDevices` | `ApplicationDbContext.cs` |
| `AttendanceCorrection` | `AttendanceCorrections` | `ApplicationDbContext.cs` |
| `AttendanceRegularizationRequest` | `AttendanceRegularizationRequests` | `ApplicationDbContext.cs` |
| `LeaveType` | `LeaveTypes` | `ApplicationDbContext.cs` |
| `LeavePolicy` | `LeavePolicies` | `ApplicationDbContext.cs` |
| `EmployeeLeave` | `EmployeeLeaves` | `ApplicationDbContext.cs` |
| `EmployeeHierarchyTransfer` | `EmployeeHierarchyTransfers` | `ApplicationDbContext.cs` |
| `LeaveRequest` | `LeaveRequests` | `ApplicationDbContext.cs` |
| `LeavePolicyRule` | `LeavePolicyRules` | `ApplicationDbContext.cs` |
| `LeaveAllocation` | `LeaveAllocations` | `ApplicationDbContext.cs` |
| `AttendancePolicy` | `AttendancePolicies` | `ApplicationDbContext.cs` |
| `PayrollPolicy` | `PayrollPolicies` | `ApplicationDbContext.cs` |
| `PolicyMaster` | `PolicyMasters` | `ApplicationDbContext.cs` |
| `PolicyVersion` | `PolicyVersions` | `ApplicationDbContext.cs` |
| `TravelExpensePolicy` | `TravelExpensePolicies` | `ApplicationDbContext.cs` |
| `ProbationPolicy` | `ProbationPolicies` | `ApplicationDbContext.cs` |
| `PolicyRuleDefinition` | `PolicyRuleDefinitions` | `ApplicationDbContext.cs` |
| `Holiday` | `Holidays` | `ApplicationDbContext.cs` |
| `PayrollStructure` | `PayrollStructures` | `ApplicationDbContext.cs` |
| `PayrollComponent` | `PayrollComponents` | `ApplicationDbContext.cs` |
| `PayrollRun` | `PayrollRuns` | `ApplicationDbContext.cs` |
| `PayrollFinalSettlement` | `PayrollFinalSettlements` | `ApplicationDbContext.cs` |
| `PayrollLoan` | `PayrollLoans` | `ApplicationDbContext.cs` |
| `PayrollBonus` | `PayrollBonuses` | `ApplicationDbContext.cs` |
| `PayrollArrear` | `PayrollArrears` | `ApplicationDbContext.cs` |
| `Payslip` | `Payslips` | `ApplicationDbContext.cs` |
| `PayslipLine` | `PayslipLines` | `ApplicationDbContext.cs` |
| `EmployeeSalaryAssignment` | `EmployeeSalaryAssignments` | `ApplicationDbContext.cs` |
| `PurchaseRequest` | `PurchaseRequests` | `ApplicationDbContext.cs` |
| `HrLifecycleTask` | `HrLifecycleTasks` | `ApplicationDbContext.cs` |
| `SalesReturn` | `SalesReturns` | `ApplicationDbContext.cs` |
| `AccountingPeriod` | `AccountingPeriods` | `ApplicationDbContext.cs` |
| `FeatureFlag` | `FeatureFlags` | `ApplicationDbContext.cs` |
| `RefreshToken` | `RefreshTokens` | `ApplicationDbContext.cs` |
| `AuditLog` | `AuditLogs` | `ApplicationDbContext.cs` |
| `Module` | `Modules` | `ApplicationDbContext.cs` |
| `TenantModule` | `TenantModules` | `ApplicationDbContext.cs` |
| `TenantConfig` | `TenantConfigs` | `ApplicationDbContext.cs` |
| `WebsitePage` | `WebsitePages` | `ApplicationDbContext.cs` |
| `ContactSubmission` | `ContactSubmissions` | `ApplicationDbContext.cs` |
| `EntityFieldDefinition` | `EntityFieldDefinitions` | `ApplicationDbContext.cs` |
| `EntityFieldValue` | `EntityFieldValues` | `ApplicationDbContext.cs` |
| `UiPageDefinition` | `UiPageDefinitions` | `ApplicationDbContext.cs` |
| `UiPageVersion` | `UiPageVersions` | `ApplicationDbContext.cs` |
| `DocumentRecord` | `DocumentRecords` | `ApplicationDbContext.cs` |
| `NotificationMessage` | `NotificationMessages` | `ApplicationDbContext.cs` |
| `CommunicationTemplate` | `CommunicationTemplates` | `ApplicationDbContext.cs` |
| `HelpdeskTicket` | `HelpdeskTickets` | `ApplicationDbContext.cs` |
| `HelpdeskEscalation` | `HelpdeskEscalations` | `ApplicationDbContext.cs` |
| `HelpdeskFaqArticle` | `HelpdeskFaqArticles` | `ApplicationDbContext.cs` |
| `TravelRequest` | `TravelRequests` | `ApplicationDbContext.cs` |
| `AiAgent` | `AiAgents` | `ApplicationDbContext.cs` |
| `ProjectTask` | `ProjectTasks` | `ApplicationDbContext.cs` |
| `TimesheetEntry` | `TimesheetEntries` | `ApplicationDbContext.cs` |
| `IntegrationConnector` | `IntegrationConnectors` | `ApplicationDbContext.cs` |
| `IntegrationSyncLog` | `IntegrationSyncLogs` | `ApplicationDbContext.cs` |
| `IntegrationApiKey` | `IntegrationApiKeys` | `ApplicationDbContext.cs` |
| `SecurityPolicy` | `SecurityPolicies` | `ApplicationDbContext.cs` |
| `SsoIdentityProvider` | `SsoIdentityProviders` | `ApplicationDbContext.cs` |
| `IpAccessRule` | `IpAccessRules` | `ApplicationDbContext.cs` |
| `MfaEnrollment` | `MfaEnrollments` | `ApplicationDbContext.cs` |
| `CustomReport` | `CustomReports` | `ApplicationDbContext.cs` |
| `LicenseInvoice` | `LicenseInvoices` | `ApplicationDbContext.cs` |
| `SubscriptionPlan` | `SubscriptionPlans` | `ApplicationDbContext.cs` |
| `TenantSubscription` | `TenantSubscriptions` | `ApplicationDbContext.cs` |
| `TenantWebhook` | `TenantWebhooks` | `ApplicationDbContext.cs` |
| `OutboxMessage` | `OutboxMessages` | `ApplicationDbContext.cs` |
| `WebhookDeliveryLog` | `WebhookDeliveryLogs` | `ApplicationDbContext.cs` |
| `WorkflowDefinition` | `WorkflowDefinitions` | `ApplicationDbContext.cs` |
| `WorkflowStep` | `WorkflowSteps` | `ApplicationDbContext.cs` |
| `ApprovalRequest` | `ApprovalRequests` | `ApplicationDbContext.cs` |
| `ChartOfAccount` | `ChartOfAccounts` | `ApplicationDbContext.cs` |
| `JournalEntry` | `JournalEntries` | `ApplicationDbContext.cs` |
| `JournalEntryLine` | `JournalEntryLines` | `ApplicationDbContext.cs` |
| `Payment` | `Payments` | `ApplicationDbContext.cs` |
| `ExpenseClaim` | `ExpenseClaims` | `ApplicationDbContext.cs` |
| `BankReconciliation` | `BankReconciliations` | `ApplicationDbContext.cs` |
| `Customer` | `Customers` | `ApplicationDbContext.cs` |
| `CrmLead` | `CrmLeads` | `ApplicationDbContext.cs` |
| `SalesQuotation` | `SalesQuotations` | `ApplicationDbContext.cs` |
| `SalesQuotationItem` | `SalesQuotationItems` | `ApplicationDbContext.cs` |
| `SalesOrder` | `SalesOrders` | `ApplicationDbContext.cs` |
| `SalesOrderItem` | `SalesOrderItems` | `ApplicationDbContext.cs` |
| `SalesInvoice` | `SalesInvoices` | `ApplicationDbContext.cs` |
| `SalesInvoiceItem` | `SalesInvoiceItems` | `ApplicationDbContext.cs` |
| `DiscountScheme` | `DiscountSchemes` | `ApplicationDbContext.cs` |
| `DiscountSchemeLine` | `DiscountSchemeLines` | `ApplicationDbContext.cs` |
| `Vendor` | `Vendors` | `ApplicationDbContext.cs` |
| `PurchaseOrder` | `PurchaseOrders` | `ApplicationDbContext.cs` |
| `PurchaseOrderItem` | `PurchaseOrderItems` | `ApplicationDbContext.cs` |
| `PurchaseInvoice` | `PurchaseInvoices` | `ApplicationDbContext.cs` |
| `PurchaseInvoiceItem` | `PurchaseInvoiceItems` | `ApplicationDbContext.cs` |
| `GoodsReceiptNote` | `GoodsReceiptNotes` | `ApplicationDbContext.cs` |
| `Item` | `Items` | `ApplicationDbContext.cs` |
| `Warehouse` | `Warehouses` | `ApplicationDbContext.cs` |
| `StockMovement` | `StockMovements` | `ApplicationDbContext.cs` |
| `StockBalance` | `StockBalances` | `ApplicationDbContext.cs` |
| `FixedAsset` | `FixedAssets` | `ApplicationDbContext.cs` |
| `AssetAllocation` | `AssetAllocations` | `ApplicationDbContext.cs` |
| `AssetDepreciation` | `AssetDepreciations` | `ApplicationDbContext.cs` |
| `AssetMaintenance` | `AssetMaintenances` | `ApplicationDbContext.cs` |
| `WorkOrder` | `WorkOrders` | `ApplicationDbContext.cs` |
| `WorkOrderOperation` | `WorkOrderOperations` | `ApplicationDbContext.cs` |
| `BillOfMaterial` | `BillsOfMaterial` | `ApplicationDbContext.cs` |
| `BomItem` | `BomItems` | `ApplicationDbContext.cs` |
| `FleetVehicle` | `FleetVehicles` | `ApplicationDbContext.cs` |
| `FleetMaintenance` | `FleetMaintenances` | `ApplicationDbContext.cs` |
| `FleetFuelLog` | `FleetFuelLogs` | `ApplicationDbContext.cs` |
| `FieldServiceTicket` | `FieldServiceTickets` | `ApplicationDbContext.cs` |
| `FieldServiceTechnician` | `FieldServiceTechnicians` | `ApplicationDbContext.cs` |
| `WarehouseBin` | `WarehouseBins` | `ApplicationDbContext.cs` |
| `CostCenterBudget` | `CostCenterBudgets` | `ApplicationDbContext.cs` |
| `AppraisalCycle` | `AppraisalCycles` | `ApplicationDbContext.cs` |
| `PerformanceAppraisal` | `PerformanceAppraisals` | `ApplicationDbContext.cs` |
| `AppraisalRating` | `AppraisalRatings` | `ApplicationDbContext.cs` |
| `AppraisalCompetency` | `AppraisalCompetencies` | `ApplicationDbContext.cs` |
| `JobPosting` | `JobPostings` | `ApplicationDbContext.cs` |
| `Candidate` | `Candidates` | `ApplicationDbContext.cs` |
| `CandidateScreening` | `CandidateScreenings` | `ApplicationDbContext.cs` |
| `JobApplication` | `JobApplications` | `ApplicationDbContext.cs` |
| `OfferLetter` | `OfferLetters` | `ApplicationDbContext.cs` |
| `TrainingCourse` | `TrainingCourses` | `ApplicationDbContext.cs` |
| `CourseEnrollment` | `CourseEnrollments` | `ApplicationDbContext.cs` |
| `TrainingAssessment` | `TrainingAssessments` | `ApplicationDbContext.cs` |
| `TrainingCertificate` | `TrainingCertificates` | `ApplicationDbContext.cs` |
| `TrainingRequest` | `TrainingRequests` | `ApplicationDbContext.cs` |
| `Shift` | `Shifts` | `ApplicationDbContext.cs` |
| `ShiftAssignment` | `ShiftAssignments` | `ApplicationDbContext.cs` |
| `ShiftSwap` | `ShiftSwaps` | `ApplicationDbContext.cs` |
| `ShiftRotation` | `ShiftRotations` | `ApplicationDbContext.cs` |
| `RotationSchedule` | `RotationSchedules` | `ApplicationDbContext.cs` |
| `OvertimeRequest` | `OvertimeRequests` | `ApplicationDbContext.cs` |
| `OvertimeApproval` | `OvertimeApprovals` | `ApplicationDbContext.cs` |
| `OvertimeLog` | `OvertimeLogs` | `ApplicationDbContext.cs` |
| `OvertimeCompensation` | `OvertimeCompensations` | `ApplicationDbContext.cs` |
| `ProvidentFund` | `ProvidentFunds` | `ApplicationDbContext.cs` |
| `EmployeeStateInsurance` | `EmployeeStateInsurances` | `ApplicationDbContext.cs` |
| `IncomeTax` | `IncomeTaxes` | `ApplicationDbContext.cs` |
| `ProfessionalTax` | `ProfessionalTaxes` | `ApplicationDbContext.cs` |
| `TaxDeclaration` | `TaxDeclarations` | `ApplicationDbContext.cs` |
| `PFWithdrawal` | `PFWithdrawals` | `ApplicationDbContext.cs` |
| `ESIBenefit` | `ESIBenefits` | `ApplicationDbContext.cs` |
| `StatutorySettings` | `StatutorySettings` | `ApplicationDbContext.cs` |
| `ComplianceReport` | `ComplianceReports` | `ApplicationDbContext.cs` |
| `ComplianceAudit` | `ComplianceAudits` | `ApplicationDbContext.cs` |
| `BusinessIdSequence` | `BusinessIdSequences` | `ApplicationDbContext.cs` |

## Core Entity Base Classes & Interfaces
1. **`BaseEntity<TKey>`**: Provides `Id` primary key with GUID or Integer standard.
2. **`ITenantScopedEntity`**: Enforces `public Guid TenantId { get; set; }`.
3. **`ISoftDeletable`**: Enforces `public bool IsDeleted { get; set; }` and `public DateTime? DeletedAt { get; set; }`.
4. **`IAuditableEntity`**: Enforces `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy`.
