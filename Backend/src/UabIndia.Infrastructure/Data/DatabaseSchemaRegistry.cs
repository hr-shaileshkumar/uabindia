using System;
using System.Collections.Generic;
using UabIndia.Core.Entities;

namespace UabIndia.Infrastructure.Data
{
    public static class DatabaseSchemaRegistry
    {
        public const string Dbo = "dbo";
        public const string Identity = "identity";
        public const string Organization = "organization";
        public const string Metadata = "metadata";
        public const string Workflow = "workflow";
        public const string Audit = "audit";
        public const string Notification = "notification";
        public const string Integration = "integration";
        public const string Hr = "hr";
        public const string Payroll = "payroll";
        public const string Finance = "finance";
        public const string Procurement = "procurement";
        public const string Inventory = "inventory";
        public const string Sales = "sales";
        public const string Crm = "crm";
        public const string Projects = "projects";
        public const string Assets = "assets";
        public const string Manufacturing = "manufacturing";

        public static readonly IReadOnlyDictionary<Type, string> EntityToSchemaMap = new Dictionary<Type, string>
        {
            // Identity
            [typeof(User)] = Identity,
            [typeof(Role)] = Identity,
            [typeof(UserRole)] = Identity,
            [typeof(Permission)] = Identity,
            [typeof(RolePermission)] = Identity,
            [typeof(UserPermission)] = Identity,
            [typeof(DataScope)] = Identity,
            [typeof(RoleDataScope)] = Identity,
            [typeof(RefreshToken)] = Identity,
            [typeof(SecurityPolicy)] = Identity,
            [typeof(SsoIdentityProvider)] = Identity,
            [typeof(IpAccessRule)] = Identity,
            [typeof(MfaEnrollment)] = Identity,

            // Organization
            [typeof(Tenant)] = Organization,
            [typeof(Company)] = Organization,
            [typeof(Project)] = Organization,
            [typeof(Department)] = Organization,
            [typeof(Designation)] = Organization,
            [typeof(Branch)] = Organization,
            [typeof(CostCenter)] = Organization,
            [typeof(BusinessUnit)] = Organization,
            [typeof(GeoCountry)] = Organization,
            [typeof(GeoState)] = Organization,
            [typeof(GeoDistrict)] = Organization,
            [typeof(GeoCity)] = Organization,
            [typeof(BusinessZone)] = Organization,
            [typeof(BusinessRegion)] = Organization,
            [typeof(BusinessCluster)] = Organization,
            [typeof(OperationalLocation)] = Organization,
            [typeof(PostingUnit)] = Organization,

            // Metadata & UI Builder
            [typeof(UiPageDefinition)] = Metadata,
            [typeof(UiPageVersion)] = Metadata,
            [typeof(UiViewDefinition)] = Metadata,
            [typeof(EntityFieldDefinition)] = Metadata,
            [typeof(EntityFieldValue)] = Metadata,
            [typeof(DashboardDefinition)] = Metadata,
            [typeof(WidgetDefinition)] = Metadata,
            [typeof(DashboardWidget)] = Metadata,

            // Workflow
            [typeof(WorkflowDefinition)] = Workflow,
            [typeof(WorkflowStep)] = Workflow,
            [typeof(ApprovalRequest)] = Workflow,

            // Audit
            [typeof(AuditLog)] = Audit,

            // Notification
            [typeof(NotificationMessage)] = Notification,
            [typeof(CommunicationTemplate)] = Notification,

            // Integration
            [typeof(IntegrationConnector)] = Integration,
            [typeof(IntegrationSyncLog)] = Integration,
            [typeof(IntegrationApiKey)] = Integration,
            [typeof(TenantWebhook)] = Integration,
            [typeof(WebhookDeliveryLog)] = Integration,
            [typeof(OutboxMessage)] = Integration,

            // HRMS
            [typeof(Employee)] = Hr,
            [typeof(AttendanceRecord)] = Hr,
            [typeof(BiometricDevice)] = Hr,
            [typeof(AttendanceCorrection)] = Hr,
            [typeof(AttendanceRegularizationRequest)] = Hr,
            [typeof(LeaveType)] = Hr,
            [typeof(LeavePolicy)] = Hr,
            [typeof(EmployeeLeave)] = Hr,
            [typeof(LeaveRequest)] = Hr,
            [typeof(LeavePolicyRule)] = Hr,
            [typeof(LeaveAllocation)] = Hr,
            [typeof(Shift)] = Hr,
            [typeof(ShiftAssignment)] = Hr,
            [typeof(ShiftSwap)] = Hr,
            [typeof(ShiftRotation)] = Hr,
            [typeof(StaffingPlan)] = Hr,
            [typeof(JobPosting)] = Hr,
            [typeof(Candidate)] = Hr,
            [typeof(CandidateScreening)] = Hr,
            [typeof(JobApplication)] = Hr,
            [typeof(OfferLetter)] = Hr,
            [typeof(AppointmentLetter)] = Hr,
            [typeof(TrainingCourse)] = Hr,
            [typeof(CourseEnrollment)] = Hr,
            [typeof(TrainingAssessment)] = Hr,
            [typeof(TrainingCertificate)] = Hr,
            [typeof(TrainingRequest)] = Hr,
            [typeof(AppraisalCycle)] = Hr,
            [typeof(PerformanceAppraisal)] = Hr,
            [typeof(AppraisalRating)] = Hr,
            [typeof(AppraisalCompetency)] = Hr,
            [typeof(HrLifecycleTask)] = Hr,

            // Payroll & Statutory
            [typeof(PayrollStructure)] = Payroll,
            [typeof(PayrollComponent)] = Payroll,
            [typeof(PayrollRun)] = Payroll,
            [typeof(PayrollFinalSettlement)] = Payroll,
            [typeof(PayrollLoan)] = Payroll,
            [typeof(PayrollBonus)] = Payroll,
            [typeof(PayrollArrear)] = Payroll,
            [typeof(Payslip)] = Payroll,
            [typeof(PayslipLine)] = Payroll,
            [typeof(EmployeeSalaryAssignment)] = Payroll,
            [typeof(ProvidentFund)] = Payroll,
            [typeof(EmployeeStateInsurance)] = Payroll,
            [typeof(IncomeTax)] = Payroll,
            [typeof(ProfessionalTax)] = Payroll,
            [typeof(TaxDeclaration)] = Payroll,
            [typeof(PFWithdrawal)] = Payroll,
            [typeof(ESIBenefit)] = Payroll,
            [typeof(StatutorySettings)] = Payroll,

            // Finance
            [typeof(ChartOfAccount)] = Finance,
            [typeof(JournalEntry)] = Finance,
            [typeof(JournalEntryLine)] = Finance,
            [typeof(Payment)] = Finance,
            [typeof(ExpenseClaim)] = Finance,
            [typeof(BankReconciliation)] = Finance,
            [typeof(AccountingPeriod)] = Finance,
            [typeof(CostCenterBudget)] = Finance,

            // Procurement
            [typeof(Vendor)] = Procurement,
            [typeof(PurchaseOrder)] = Procurement,
            [typeof(PurchaseOrderItem)] = Procurement,
            [typeof(PurchaseInvoice)] = Procurement,
            [typeof(PurchaseInvoiceItem)] = Procurement,
            [typeof(GoodsReceiptNote)] = Procurement,
            [typeof(PurchaseRequest)] = Procurement,

            // Inventory
            [typeof(Item)] = Inventory,
            [typeof(Warehouse)] = Inventory,
            [typeof(StockMovement)] = Inventory,
            [typeof(StockBalance)] = Inventory,
            [typeof(WarehouseBin)] = Inventory,

            // Sales & CRM
            [typeof(Customer)] = Crm,
            [typeof(CrmLead)] = Crm,
            [typeof(CrmContact)] = Crm,
            [typeof(SalesOrder)] = Sales,
            [typeof(SalesOrderItem)] = Sales,
            [typeof(SalesInvoice)] = Sales,
            [typeof(SalesInvoiceItem)] = Sales,
            [typeof(SalesQuotation)] = Sales,
            [typeof(SalesQuotationItem)] = Sales,
            [typeof(SalesReturn)] = Sales,
            [typeof(DiscountScheme)] = Sales,
            [typeof(DiscountSchemeLine)] = Sales,

            // Projects
            [typeof(ProjectTask)] = Projects,
            [typeof(TimesheetEntry)] = Projects,
            [typeof(FieldServiceTicket)] = Projects,
            [typeof(FieldServiceTechnician)] = Projects,

            // Assets & Fleet
            [typeof(FixedAsset)] = Assets,
            [typeof(AssetAllocation)] = Assets,
            [typeof(AssetDepreciation)] = Assets,
            [typeof(AssetMaintenance)] = Assets,
            [typeof(FleetVehicle)] = Assets,
            [typeof(FleetMaintenance)] = Assets,
            [typeof(FleetFuelLog)] = Assets,

            // Manufacturing
            [typeof(WorkOrder)] = Manufacturing,
            [typeof(WorkOrderOperation)] = Manufacturing,
            [typeof(BillOfMaterial)] = Manufacturing,
            [typeof(BomItem)] = Manufacturing
        };

        public static readonly IReadOnlyList<string> AllSchemas = new[]
        {
            Identity,
            Organization,
            Metadata,
            Workflow,
            Audit,
            Notification,
            Integration,
            Hr,
            Payroll,
            Finance,
            Procurement,
            Inventory,
            Sales,
            Crm,
            Projects,
            Assets,
            Manufacturing
        };

        public static string GetSchemaForEntity(Type entityType, bool usePartitionedSchemas = false)
        {
            if (!usePartitionedSchemas)
            {
                return Dbo;
            }

            return EntityToSchemaMap.TryGetValue(entityType, out var schema) ? schema : Dbo;
        }

        public static string GeneratePhysicalMigrationScript()
        {
            var sb = new System.Text.StringBuilder();
            sb.AppendLine("-- ================================================================================");
            sb.AppendLine("-- UABIndia Enterprise ERP — Physical Schema Partitioning Migration");
            sb.AppendLine("-- Moves tables from dbo to 17 logical enterprise schemas");
            sb.AppendLine("-- Safe and idempotent for SQL Server");
            sb.AppendLine("-- ================================================================================");
            sb.AppendLine();

            foreach (var schema in AllSchemas)
            {
                sb.AppendLine($"IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'{schema}')");
                sb.AppendLine("BEGIN");
                sb.AppendLine($"    EXEC('CREATE SCHEMA [{schema}]');");
                sb.AppendLine("END;");
            }
            sb.AppendLine("GO");
            sb.AppendLine();

            foreach (var kvp in EntityToSchemaMap)
            {
                var entityType = kvp.Key;
                var targetSchema = kvp.Value;
                var tableName = entityType.Name;

                sb.AppendLine($"IF OBJECT_ID(N'dbo.{tableName}', N'U') IS NOT NULL AND OBJECT_ID(N'{targetSchema}.{tableName}', N'U') IS NULL");
                sb.AppendLine("BEGIN");
                sb.AppendLine($"    ALTER SCHEMA [{targetSchema}] TRANSFER [dbo].[{tableName}];");
                sb.AppendLine("END;");

                // Check plural forms for standard tables (e.g. Users, Roles)
                var plural = tableName.EndsWith("y") ? tableName[..^1] + "ies" : tableName + "s";
                sb.AppendLine($"IF OBJECT_ID(N'dbo.{plural}', N'U') IS NOT NULL AND OBJECT_ID(N'{targetSchema}.{plural}', N'U') IS NULL");
                sb.AppendLine("BEGIN");
                sb.AppendLine($"    ALTER SCHEMA [{targetSchema}] TRANSFER [dbo].[{plural}];");
                sb.AppendLine("END;");
            }
            sb.AppendLine("GO");

            return sb.ToString();
        }
    }
}
