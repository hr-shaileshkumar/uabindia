using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;

namespace UabIndia.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IEncryptionService _encryptionService;
        private readonly IRequestContext? _requestContext;

        internal string? CurrentTenantSchema => _tenantAccessor.GetTenantSchema();

        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options,
            ITenantAccessor tenantAccessor,
            IEncryptionService encryptionService,
            IRequestContext? requestContext = null)
            : base(options)
        {
            _tenantAccessor = tenantAccessor;
            _encryptionService = encryptionService;
            _requestContext = requestContext;
        }

        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Designation> Designations { get; set; }
        public DbSet<Branch> Branches { get; set; }
        public DbSet<CostCenter> CostCenters { get; set; }
        public DbSet<BusinessUnit> BusinessUnits { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<AttendanceRecord> AttendanceRecords { get; set; }
        public DbSet<AttendanceCorrection> AttendanceCorrections { get; set; }
        public DbSet<LeaveType> LeaveTypes { get; set; }
        public DbSet<LeavePolicy> LeavePolicies { get; set; }
        public DbSet<EmployeeLeave> EmployeeLeaves { get; set; }
        public DbSet<LeaveRequest> LeaveRequests { get; set; }
        public DbSet<LeavePolicyRule> LeavePolicyRules { get; set; }
        public DbSet<LeaveAllocation> LeaveAllocations { get; set; }
        public DbSet<Holiday> Holidays { get; set; }
        public DbSet<PayrollStructure> PayrollStructures { get; set; }
        public DbSet<PayrollComponent> PayrollComponents { get; set; }
        public DbSet<PayrollRun> PayrollRuns { get; set; }
        public DbSet<PayrollFinalSettlement> PayrollFinalSettlements { get; set; }
        public DbSet<PayrollLoan> PayrollLoans { get; set; }
        public DbSet<PayrollBonus> PayrollBonuses { get; set; }
        public DbSet<PayrollArrear> PayrollArrears { get; set; }
        public DbSet<Payslip> Payslips { get; set; }
        public DbSet<PayslipLine> PayslipLines { get; set; }
        public DbSet<EmployeeSalaryAssignment> EmployeeSalaryAssignments { get; set; }
        public DbSet<PurchaseRequest> PurchaseRequests { get; set; }
        public DbSet<HrLifecycleTask> HrLifecycleTasks { get; set; }
        public DbSet<SalesReturn> SalesReturns { get; set; }
        public DbSet<AccountingPeriod> AccountingPeriods { get; set; }
        public DbSet<FeatureFlag> FeatureFlags { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Module> Modules { get; set; }
        public DbSet<TenantModule> TenantModules { get; set; }
        public DbSet<TenantConfig> TenantConfigs { get; set; }
        public DbSet<WebsitePage> WebsitePages { get; set; }
        public DbSet<ContactSubmission> ContactSubmissions { get; set; }
        public DbSet<EntityFieldDefinition> EntityFieldDefinitions { get; set; }
        public DbSet<EntityFieldValue> EntityFieldValues { get; set; }
        public DbSet<DocumentRecord> DocumentRecords { get; set; }
        public DbSet<NotificationMessage> NotificationMessages { get; set; }
        public DbSet<CommunicationTemplate> CommunicationTemplates { get; set; }
        public DbSet<HelpdeskTicket> HelpdeskTickets { get; set; }
        public DbSet<HelpdeskEscalation> HelpdeskEscalations { get; set; }
        public DbSet<HelpdeskFaqArticle> HelpdeskFaqArticles { get; set; }
        public DbSet<TravelRequest> TravelRequests { get; set; }
        public DbSet<AiAgent> AiAgents { get; set; }
        public DbSet<ProjectTask> ProjectTasks { get; set; }
        public DbSet<TimesheetEntry> TimesheetEntries { get; set; }
        public DbSet<IntegrationConnector> IntegrationConnectors { get; set; }
        public DbSet<IntegrationSyncLog> IntegrationSyncLogs { get; set; }
        public DbSet<IntegrationApiKey> IntegrationApiKeys { get; set; }
        public DbSet<SecurityPolicy> SecurityPolicies { get; set; }
        public DbSet<SsoIdentityProvider> SsoIdentityProviders { get; set; }
        public DbSet<IpAccessRule> IpAccessRules { get; set; }
        public DbSet<MfaEnrollment> MfaEnrollments { get; set; }
        public DbSet<CustomReport> CustomReports { get; set; }
        public DbSet<LicenseInvoice> LicenseInvoices { get; set; }
        public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }
        public DbSet<TenantSubscription> TenantSubscriptions { get; set; }
        public DbSet<TenantWebhook> TenantWebhooks { get; set; }
        public DbSet<OutboxMessage> OutboxMessages { get; set; }
        public DbSet<WebhookDeliveryLog> WebhookDeliveryLogs { get; set; }

        // Workflow & Approvals
        public DbSet<WorkflowDefinition> WorkflowDefinitions { get; set; }
        public DbSet<WorkflowStep> WorkflowSteps { get; set; }
        public DbSet<ApprovalRequest> ApprovalRequests { get; set; }

        // Finance & Accounting
        public DbSet<ChartOfAccount> ChartOfAccounts { get; set; }
        public DbSet<JournalEntry> JournalEntries { get; set; }
        public DbSet<JournalEntryLine> JournalEntryLines { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<ExpenseClaim> ExpenseClaims { get; set; }
        public DbSet<BankReconciliation> BankReconciliations { get; set; }

        // Sales & CRM
        public DbSet<Customer> Customers { get; set; }
        public DbSet<CrmLead> CrmLeads { get; set; }
        public DbSet<SalesQuotation> SalesQuotations { get; set; }
        public DbSet<SalesQuotationItem> SalesQuotationItems { get; set; }
        public DbSet<SalesOrder> SalesOrders { get; set; }
        public DbSet<SalesOrderItem> SalesOrderItems { get; set; }
        public DbSet<SalesInvoice> SalesInvoices { get; set; }
        public DbSet<SalesInvoiceItem> SalesInvoiceItems { get; set; }
        public DbSet<DiscountScheme> DiscountSchemes { get; set; }
        public DbSet<DiscountSchemeLine> DiscountSchemeLines { get; set; }

        // Purchase & Procurement
        public DbSet<Vendor> Vendors { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
        public DbSet<PurchaseInvoice> PurchaseInvoices { get; set; }
        public DbSet<PurchaseInvoiceItem> PurchaseInvoiceItems { get; set; }
        public DbSet<GoodsReceiptNote> GoodsReceiptNotes { get; set; }

        // Inventory Management
        public DbSet<Item> Items { get; set; }
        public DbSet<Warehouse> Warehouses { get; set; }
        public DbSet<StockMovement> StockMovements { get; set; }
        public DbSet<StockBalance> StockBalances { get; set; }

        // Asset Management
        public DbSet<FixedAsset> FixedAssets { get; set; }
        public DbSet<AssetAllocation> AssetAllocations { get; set; }
        public DbSet<AssetDepreciation> AssetDepreciations { get; set; }
        public DbSet<AssetMaintenance> AssetMaintenances { get; set; }

        // Performance Management & Appraisals
        public DbSet<AppraisalCycle> AppraisalCycles { get; set; }
        public DbSet<PerformanceAppraisal> PerformanceAppraisals { get; set; }
        public DbSet<AppraisalRating> AppraisalRatings { get; set; }
        public DbSet<AppraisalCompetency> AppraisalCompetencies { get; set; }

        // Recruitment Module
        public DbSet<JobPosting> JobPostings { get; set; }
        public DbSet<Candidate> Candidates { get; set; }
        public DbSet<CandidateScreening> CandidateScreenings { get; set; }
        public DbSet<JobApplication> JobApplications { get; set; }
        public DbSet<OfferLetter> OfferLetters { get; set; }

        // Training & Development Module
        public DbSet<TrainingCourse> TrainingCourses { get; set; }
        public DbSet<CourseEnrollment> CourseEnrollments { get; set; }
        public DbSet<TrainingAssessment> TrainingAssessments { get; set; }
        public DbSet<TrainingCertificate> TrainingCertificates { get; set; }
        public DbSet<TrainingRequest> TrainingRequests { get; set; }

        // Shift Management Module
        public DbSet<Shift> Shifts { get; set; }
        public DbSet<ShiftAssignment> ShiftAssignments { get; set; }
        public DbSet<ShiftSwap> ShiftSwaps { get; set; }
        public DbSet<ShiftRotation> ShiftRotations { get; set; }
        public DbSet<RotationSchedule> RotationSchedules { get; set; }

        // Overtime Tracking Module
        public DbSet<OvertimeRequest> OvertimeRequests { get; set; }
        public DbSet<OvertimeApproval> OvertimeApprovals { get; set; }
        public DbSet<OvertimeLog> OvertimeLogs { get; set; }
        public DbSet<OvertimeCompensation> OvertimeCompensations { get; set; }

        // Compliance Module
        public DbSet<ProvidentFund> ProvidentFunds { get; set; }
        public DbSet<EmployeeStateInsurance> EmployeeStateInsurances { get; set; }
        public DbSet<IncomeTax> IncomeTaxes { get; set; }
        public DbSet<ProfessionalTax> ProfessionalTaxes { get; set; }
        public DbSet<TaxDeclaration> TaxDeclarations { get; set; }
        public DbSet<PFWithdrawal> PFWithdrawals { get; set; }
        public DbSet<ESIBenefit> ESIBenefits { get; set; }
        public DbSet<StatutorySettings> StatutorySettings { get; set; }
        public DbSet<ComplianceReport> ComplianceReports { get; set; }
        public DbSet<ComplianceAudit> ComplianceAudits { get; set; }
        public DbSet<BusinessIdSequence> BusinessIdSequences { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // The live SQL deployment keeps application tables in dbo and enforces
            // tenant isolation through TenantId filters. Provisioning services may
            // still manage tenant schema metadata separately, but the EF model
            // should not remap every entity to tenant_* schemas at runtime.

            // Apply a safe default precision for all decimal properties to prevent truncation warnings.
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                var clrType = entityType.ClrType;
                if (clrType == null)
                {
                    continue;
                }

                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType != typeof(decimal) && property.ClrType != typeof(decimal?))
                    {
                        continue;
                    }

                    if (property.GetPrecision() != null)
                    {
                        continue;
                    }

                    modelBuilder.Entity(clrType).Property(property.Name).HasPrecision(18, 4);
                }
            }

            var encryptedString = new ValueConverter<string?, string?>(
                v => string.IsNullOrWhiteSpace(v) ? null : _encryptionService.Encrypt(v),
                v => string.IsNullOrWhiteSpace(v) ? null : _encryptionService.Decrypt(v));

            var encryptedRequiredString = new ValueConverter<string, string>(
                v => string.IsNullOrWhiteSpace(v) ? string.Empty : _encryptionService.Encrypt(v),
                v => string.IsNullOrWhiteSpace(v) ? string.Empty : _encryptionService.Decrypt(v));

            // Table mapping
            modelBuilder.Entity<Tenant>().ToTable("Tenants");
            modelBuilder.Entity<Company>().ToTable("Companies");
            modelBuilder.Entity<Project>().ToTable("Projects");
            modelBuilder.Entity<Department>().ToTable("Departments");
            modelBuilder.Entity<Designation>().ToTable("Designations");
            modelBuilder.Entity<Branch>().ToTable("Branches");
            modelBuilder.Entity<CostCenter>().ToTable("CostCenters");
            modelBuilder.Entity<BusinessUnit>().ToTable("BusinessUnits");
            modelBuilder.Entity<User>().ToTable("Users");

            foreach (var orgType in new[] { typeof(Department), typeof(Designation), typeof(Branch), typeof(CostCenter), typeof(BusinessUnit) })
            {
                modelBuilder.Entity(orgType).HasIndex("TenantId", "CompanyId", "Code").IsUnique();
            }

            modelBuilder.Entity<Department>()
                .HasOne<Company>().WithMany().HasForeignKey(d => d.CompanyId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Designation>()
                .HasOne<Company>().WithMany().HasForeignKey(d => d.CompanyId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Branch>()
                .HasOne<Company>().WithMany().HasForeignKey(d => d.CompanyId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<CostCenter>()
                .HasOne<Company>().WithMany().HasForeignKey(d => d.CompanyId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<BusinessUnit>()
                .HasOne<Company>().WithMany().HasForeignKey(d => d.CompanyId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Role>().ToTable("Roles");
            modelBuilder.Entity<UserRole>().ToTable("UserRoles");
            modelBuilder.Entity<Employee>().ToTable("Employees");
            modelBuilder.Entity<AttendanceRecord>().ToTable("AttendanceRecords");
            modelBuilder.Entity<AttendanceCorrection>().ToTable("AttendanceCorrections");
            modelBuilder.Entity<LeaveType>().ToTable("LeaveTypes");
            modelBuilder.Entity<LeavePolicy>().ToTable("LeavePolicies");
            modelBuilder.Entity<EmployeeLeave>().ToTable("EmployeeLeaves");
            modelBuilder.Entity<LeaveRequest>().ToTable("LeaveRequests");
            modelBuilder.Entity<LeavePolicyRule>().ToTable("LeavePolicyRules");
            modelBuilder.Entity<LeaveAllocation>().ToTable("LeaveAllocations");
            modelBuilder.Entity<Holiday>().ToTable("Holidays");
            modelBuilder.Entity<PayrollStructure>().ToTable("PayrollStructures");
            modelBuilder.Entity<PayrollComponent>().ToTable("PayrollComponents");
            modelBuilder.Entity<PayrollRun>().ToTable("PayrollRuns");
            modelBuilder.Entity<PayrollFinalSettlement>().ToTable("PayrollFinalSettlements");
            modelBuilder.Entity<PayrollLoan>().ToTable("PayrollLoans");
            modelBuilder.Entity<PayrollBonus>().ToTable("PayrollBonuses");
            modelBuilder.Entity<PayrollArrear>().ToTable("PayrollArrears");
            modelBuilder.Entity<Payslip>().ToTable("Payslips");
            modelBuilder.Entity<FeatureFlag>().ToTable("FeatureFlags");
            modelBuilder.Entity<RefreshToken>().ToTable("RefreshTokens");
            modelBuilder.Entity<AuditLog>().ToTable("AuditLogs");
            modelBuilder.Entity<Module>().ToTable("Modules");
            modelBuilder.Entity<TenantModule>().ToTable("TenantModules");
            modelBuilder.Entity<TenantConfig>().ToTable("TenantConfigs", "dbo");
            modelBuilder.Entity<ContactSubmission>().ToTable("ContactSubmissions");
            modelBuilder.Entity<EntityFieldDefinition>().ToTable("EntityFieldDefinitions");
            modelBuilder.Entity<EntityFieldValue>().ToTable("EntityFieldValues");
            modelBuilder.Entity<DocumentRecord>().ToTable("DocumentRecords");
            modelBuilder.Entity<NotificationMessage>().ToTable("NotificationMessages");
            modelBuilder.Entity<CommunicationTemplate>().ToTable("CommunicationTemplates");
            modelBuilder.Entity<HelpdeskTicket>().ToTable("HelpdeskTickets");
            modelBuilder.Entity<HelpdeskEscalation>().ToTable("HelpdeskEscalations");
            modelBuilder.Entity<HelpdeskFaqArticle>().ToTable("HelpdeskFaqArticles");
            modelBuilder.Entity<TravelRequest>().ToTable("TravelRequests");
            modelBuilder.Entity<AiAgent>().ToTable("AiAgents");
            modelBuilder.Entity<ProjectTask>().ToTable("ProjectTasks");
            modelBuilder.Entity<TimesheetEntry>().ToTable("TimesheetEntries");
            modelBuilder.Entity<IntegrationConnector>().ToTable("IntegrationConnectors");
            modelBuilder.Entity<IntegrationSyncLog>().ToTable("IntegrationSyncLogs");
            modelBuilder.Entity<IntegrationApiKey>().ToTable("IntegrationApiKeys");
            modelBuilder.Entity<SecurityPolicy>().ToTable("SecurityPolicies");
            modelBuilder.Entity<SsoIdentityProvider>().ToTable("SsoIdentityProviders");
            modelBuilder.Entity<IpAccessRule>().ToTable("IpAccessRules");
            modelBuilder.Entity<MfaEnrollment>().ToTable("MfaEnrollments");
            modelBuilder.Entity<CustomReport>().ToTable("CustomReports");
            modelBuilder.Entity<LicenseInvoice>().ToTable("LicenseInvoices");
            modelBuilder.Entity<BusinessIdSequence>().ToTable("BusinessIdSequences");

            // Performance Management
            modelBuilder.Entity<AppraisalCycle>().ToTable("AppraisalCycles");
            modelBuilder.Entity<PerformanceAppraisal>().ToTable("PerformanceAppraisals");
            modelBuilder.Entity<AppraisalRating>().ToTable("AppraisalRatings");
            modelBuilder.Entity<AppraisalCompetency>().ToTable("AppraisalCompetencies");

            // Performance Appraisal Relationships
            modelBuilder.Entity<PerformanceAppraisal>()
                .HasOne(pa => pa.AppraisalCycle)
                .WithMany(ac => ac.Appraisals)
                .HasForeignKey(pa => pa.AppraisalCycleId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PerformanceAppraisal>()
                .HasOne(pa => pa.Employee)
                .WithMany()
                .HasForeignKey(pa => pa.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PerformanceAppraisal>()
                .HasOne(pa => pa.Manager)
                .WithMany()
                .HasForeignKey(pa => pa.ManagerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AppraisalRating>()
                .HasOne(ar => ar.Appraisal)
                .WithMany(pa => pa.Ratings)
                .HasForeignKey(ar => ar.AppraisalId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AppraisalRating>()
                .HasOne(ar => ar.Competency)
                .WithMany(ac => ac.Ratings)
                .HasForeignKey(ar => ar.CompetencyId)
                .OnDelete(DeleteBehavior.Restrict);

            // PII Encryption mappings
            modelBuilder.Entity<User>().Property(u => u.Email).HasConversion(encryptedRequiredString);

            modelBuilder.Entity<Company>().Property(c => c.Email).HasConversion(encryptedString);
            modelBuilder.Entity<Company>().Property(c => c.PhoneNumber).HasConversion(encryptedString);
            modelBuilder.Entity<Company>().Property(c => c.RegistrationAddress).HasConversion(encryptedString);
            modelBuilder.Entity<Company>().Property(c => c.OperationalAddress).HasConversion(encryptedString);
            modelBuilder.Entity<Company>().Property(c => c.ContactPersonPhone).HasConversion(encryptedString);
            modelBuilder.Entity<Company>().Property(c => c.ContactPersonEmail).HasConversion(encryptedString);
            modelBuilder.Entity<Company>().Property(c => c.HR_PersonEmail).HasConversion(encryptedString);
            modelBuilder.Entity<Company>().Property(c => c.BankAccountNumber).HasConversion(encryptedString);
            modelBuilder.Entity<Company>().Property(c => c.IFSCCode).HasConversion(encryptedString);

            modelBuilder.Entity<ContactSubmission>().Property(c => c.Email).HasConversion(encryptedRequiredString);
            modelBuilder.Entity<ContactSubmission>().Property(c => c.PhoneNumber).HasConversion(encryptedString);

            modelBuilder.Entity<Customer>().Property(c => c.Email).HasConversion(encryptedString);
            modelBuilder.Entity<Customer>().Property(c => c.PhoneNumber).HasConversion(encryptedString);
            modelBuilder.Entity<Customer>().Property(c => c.MobileNumber).HasConversion(encryptedString);
            modelBuilder.Entity<Customer>().Property(c => c.BillingAddress).HasConversion(encryptedString);
            modelBuilder.Entity<Customer>().Property(c => c.ShippingAddress).HasConversion(encryptedString);

            modelBuilder.Entity<Vendor>().Property(v => v.Email).HasConversion(encryptedString);
            modelBuilder.Entity<Vendor>().Property(v => v.PhoneNumber).HasConversion(encryptedString);
            modelBuilder.Entity<Vendor>().Property(v => v.MobileNumber).HasConversion(encryptedString);
            modelBuilder.Entity<Vendor>().Property(v => v.Address).HasConversion(encryptedString);
            modelBuilder.Entity<Vendor>().Property(v => v.BankAccountNumber).HasConversion(encryptedString);
            modelBuilder.Entity<Vendor>().Property(v => v.IFSCCode).HasConversion(encryptedString);

            modelBuilder.Entity<Employee>().Property(e => e.WorkEmail).HasConversion(encryptedString);
            modelBuilder.Entity<Employee>().Property(e => e.PersonalEmail).HasConversion(encryptedString);
            modelBuilder.Entity<Employee>().Property(e => e.Phone).HasConversion(encryptedString);
            modelBuilder.Entity<Employee>().Property(e => e.AlternatePhone).HasConversion(encryptedString);
            modelBuilder.Entity<Employee>().Property(e => e.Address).HasConversion(encryptedString);
            modelBuilder.Entity<Employee>().Property(e => e.Pan).HasConversion(encryptedString);
            modelBuilder.Entity<Employee>().Property(e => e.Aadhaar).HasConversion(encryptedString);
            modelBuilder.Entity<Employee>().Property(e => e.BankAccountNumber).HasConversion(encryptedString);
            modelBuilder.Entity<Employee>().Property(e => e.BankIfsc).HasConversion(encryptedString);

            modelBuilder.Entity<Warehouse>().Property(w => w.Address).HasConversion(encryptedString);
            modelBuilder.Entity<Warehouse>().Property(w => w.PhoneNumber).HasConversion(encryptedString);
            modelBuilder.Entity<Warehouse>().Property(w => w.Email).HasConversion(encryptedString);

            modelBuilder.Entity<SalesOrder>().Property(s => s.ShippingAddress).HasConversion(encryptedString);
            modelBuilder.Entity<SalesOrder>().Property(s => s.BillingAddress).HasConversion(encryptedString);

            modelBuilder.Entity<PurchaseOrder>().Property(p => p.ShippingAddress).HasConversion(encryptedString);
            modelBuilder.Entity<PurchaseOrder>().Property(p => p.BillingAddress).HasConversion(encryptedString);

            // Workflow & Approvals
            modelBuilder.Entity<WorkflowDefinition>().ToTable("WorkflowDefinitions");
            modelBuilder.Entity<WorkflowStep>().ToTable("WorkflowSteps");
            modelBuilder.Entity<ApprovalRequest>().ToTable("ApprovalRequests");

            // Finance & Accounting
            modelBuilder.Entity<ChartOfAccount>().ToTable("ChartOfAccounts");
            modelBuilder.Entity<JournalEntry>().ToTable("JournalEntries");
            modelBuilder.Entity<JournalEntryLine>().ToTable("JournalEntryLines");
            modelBuilder.Entity<Payment>().ToTable("Payments");
            modelBuilder.Entity<ExpenseClaim>().ToTable("ExpenseClaims");
            modelBuilder.Entity<BankReconciliation>().ToTable("BankReconciliations");

            // Sales & CRM
            modelBuilder.Entity<Customer>().ToTable("Customers");
            modelBuilder.Entity<CrmLead>().ToTable("CrmLeads");
            modelBuilder.Entity<SalesQuotation>().ToTable("SalesQuotations");
            modelBuilder.Entity<SalesQuotationItem>().ToTable("SalesQuotationItems");
            modelBuilder.Entity<SalesOrder>().ToTable("SalesOrders");
            modelBuilder.Entity<SalesOrderItem>().ToTable("SalesOrderItems");
            modelBuilder.Entity<SalesInvoice>().ToTable("SalesInvoices");
            modelBuilder.Entity<SalesInvoiceItem>().ToTable("SalesInvoiceItems");
            modelBuilder.Entity<SalesQuotationItem>()
                .HasOne(e => e.Item)
                .WithMany()
                .HasForeignKey(e => e.ItemId)
                .IsRequired(false);
            modelBuilder.Entity<SalesOrderItem>()
                .HasOne(e => e.Item)
                .WithMany()
                .HasForeignKey(e => e.ItemId)
                .IsRequired(false);
            modelBuilder.Entity<SalesInvoiceItem>()
                .HasOne(e => e.Item)
                .WithMany()
                .HasForeignKey(e => e.ItemId)
                .IsRequired(false);
            modelBuilder.Entity<DiscountScheme>().ToTable("DiscountSchemes");
            modelBuilder.Entity<DiscountSchemeLine>().ToTable("DiscountSchemeLines");
            modelBuilder.Entity<DiscountSchemeLine>()
                .HasOne(e => e.DiscountScheme)
                .WithMany(e => e.Lines)
                .HasForeignKey(e => e.DiscountSchemeId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<DiscountSchemeLine>()
                .HasOne(e => e.Item)
                .WithMany()
                .HasForeignKey(e => e.ItemId)
                .IsRequired(false);
            modelBuilder.Entity<SalesReturn>().ToTable("SalesReturns");
            modelBuilder.Entity<PayslipLine>().ToTable("PayslipLines");
            modelBuilder.Entity<EmployeeSalaryAssignment>().ToTable("EmployeeSalaryAssignments");
            modelBuilder.Entity<PurchaseRequest>().ToTable("PurchaseRequests");
            modelBuilder.Entity<HrLifecycleTask>().ToTable("HrLifecycleTasks");
            modelBuilder.Entity<AccountingPeriod>().ToTable("AccountingPeriods");

            // Purchase & Procurement
            modelBuilder.Entity<Vendor>().ToTable("Vendors");
            modelBuilder.Entity<PurchaseOrder>().ToTable("PurchaseOrders");
            modelBuilder.Entity<PurchaseOrderItem>().ToTable("PurchaseOrderItems");
            modelBuilder.Entity<PurchaseInvoice>().ToTable("PurchaseInvoices");
            modelBuilder.Entity<PurchaseInvoiceItem>().ToTable("PurchaseInvoiceItems");
            modelBuilder.Entity<PurchaseOrderItem>()
                .HasOne(e => e.Item)
                .WithMany()
                .HasForeignKey(e => e.ItemId)
                .IsRequired(false);
            modelBuilder.Entity<PurchaseInvoiceItem>()
                .HasOne(e => e.Item)
                .WithMany()
                .HasForeignKey(e => e.ItemId)
                .IsRequired(false);
            modelBuilder.Entity<GoodsReceiptNote>().ToTable("GoodsReceiptNotes");

            // Inventory Management
            modelBuilder.Entity<Item>().ToTable("Items");
            modelBuilder.Entity<Warehouse>().ToTable("Warehouses");
            modelBuilder.Entity<StockMovement>().ToTable("StockMovements");
            modelBuilder.Entity<StockBalance>().ToTable("StockBalances");

            // Asset Management (consolidated — no duplicates)
            modelBuilder.Entity<FixedAsset>().ToTable("FixedAssets");
            modelBuilder.Entity<AssetAllocation>().ToTable("AssetAllocations");
            modelBuilder.Entity<AssetDepreciation>().ToTable("AssetDepreciations");
            modelBuilder.Entity<AssetMaintenance>().ToTable("AssetMaintenances");

            // Training & Development Module
            modelBuilder.Entity<TrainingCourse>().ToTable("TrainingCourses");
            modelBuilder.Entity<CourseEnrollment>().ToTable("CourseEnrollments");
            modelBuilder.Entity<TrainingAssessment>().ToTable("TrainingAssessments");
            modelBuilder.Entity<TrainingCertificate>().ToTable("TrainingCertificates");
            modelBuilder.Entity<TrainingRequest>().ToTable("TrainingRequests");

            // Shift Management Module
            modelBuilder.Entity<Shift>().ToTable("Shifts");
            modelBuilder.Entity<ShiftAssignment>().ToTable("ShiftAssignments");
            modelBuilder.Entity<ShiftSwap>().ToTable("ShiftSwaps");
            modelBuilder.Entity<ShiftSwap>()
                .HasOne(s => s.RequestorShiftAssignment)
                .WithMany()
                .HasForeignKey(s => s.RequestorShiftAssignmentId)
                .OnDelete(DeleteBehavior.NoAction);
            modelBuilder.Entity<ShiftSwap>()
                .HasOne(s => s.TargetShiftAssignment)
                .WithMany()
                .HasForeignKey(s => s.TargetShiftAssignmentId)
                .OnDelete(DeleteBehavior.NoAction);
            modelBuilder.Entity<ShiftRotation>().ToTable("ShiftRotations");
            modelBuilder.Entity<RotationSchedule>().ToTable("RotationSchedules");

            // Overtime Tracking Module
            modelBuilder.Entity<OvertimeRequest>().ToTable("OvertimeRequests");
            modelBuilder.Entity<OvertimeApproval>().ToTable("OvertimeApprovals");
            modelBuilder.Entity<OvertimeLog>().ToTable("OvertimeLogs");
            modelBuilder.Entity<OvertimeCompensation>().ToTable("OvertimeCompensations");

            // Compliance Module
            modelBuilder.Entity<ProvidentFund>().ToTable("ProvidentFunds");
            modelBuilder.Entity<EmployeeStateInsurance>().ToTable("EmployeeStateInsurances");
            modelBuilder.Entity<IncomeTax>().ToTable("IncomeTaxes");
            modelBuilder.Entity<ProfessionalTax>().ToTable("ProfessionalTaxes");
            modelBuilder.Entity<TaxDeclaration>().ToTable("TaxDeclarations");
            modelBuilder.Entity<PFWithdrawal>().ToTable("PFWithdrawals");
            modelBuilder.Entity<ESIBenefit>().ToTable("ESIBenefits");
            modelBuilder.Entity<StatutorySettings>().ToTable("StatutorySettings");
            modelBuilder.Entity<ComplianceReport>().ToTable("ComplianceReports");
            modelBuilder.Entity<ComplianceAudit>().ToTable("ComplianceAudits");

            modelBuilder.Entity<Tenant>().ToTable("Tenants", "dbo");
            modelBuilder.Entity<Tenant>().Ignore(t => t.TenantId);
            modelBuilder.Entity<Tenant>().Property(t => t.ProvisionStatus)
                .HasMaxLength(32)
                .HasDefaultValue("Pending");

            modelBuilder.Entity<Module>().ToTable("Modules", "dbo");

            modelBuilder.Entity<Module>().HasKey(m => m.ModuleKey);
            modelBuilder.Entity<Module>().Property(m => m.ModuleKey).HasMaxLength(64);

            modelBuilder.Entity<SalesInvoice>().Property(e => e.InvoiceNumber).HasMaxLength(64);
            modelBuilder.Entity<PurchaseInvoice>().Property(e => e.InvoiceNumber).HasMaxLength(64);
            modelBuilder.Entity<PurchaseOrder>().Property(e => e.PONumber).HasMaxLength(64);
            modelBuilder.Entity<SalesOrder>().Property(e => e.SONumber).HasMaxLength(64);
            modelBuilder.Entity<SalesQuotation>().Property(e => e.QuotationNumber).HasMaxLength(64);
            modelBuilder.Entity<Payment>().Property(e => e.PaymentNumber).HasMaxLength(64);
            modelBuilder.Entity<JournalEntry>().Property(e => e.JournalNumber).HasMaxLength(64);
            modelBuilder.Entity<ExpenseClaim>().Property(e => e.ClaimNumber).HasMaxLength(64);
            modelBuilder.Entity<GoodsReceiptNote>().Property(e => e.GrnNumber).HasMaxLength(64);
            modelBuilder.Entity<StockMovement>().Property(e => e.MovementNumber).HasMaxLength(64);
            modelBuilder.Entity<CrmLead>().Property(e => e.LeadCode).HasMaxLength(64);
            modelBuilder.Entity<TravelRequest>().Property(e => e.RequestNumber).HasMaxLength(64);
            modelBuilder.Entity<ProjectTask>().Property(e => e.TaskCode).HasMaxLength(64);
            modelBuilder.Entity<Vendor>().Property(e => e.VendorCode).HasMaxLength(64);
            modelBuilder.Entity<Item>().Property(e => e.ItemCode).HasMaxLength(64);
            modelBuilder.Entity<Warehouse>().Property(e => e.WarehouseCode).HasMaxLength(64);

            modelBuilder.Entity<TenantModule>().HasIndex(t => new { t.TenantId, t.ModuleKey }).IsUnique();

            // Apply global query filter for multi-tenant + soft delete
            modelBuilder.Entity<Tenant>().HasQueryFilter(e => _tenantAccessor.IncludeDeleted() || !e.IsDeleted);
            modelBuilder.Entity<Company>().HasQueryFilter(e => (_tenantAccessor.IncludeDeleted() || !e.IsDeleted) && (_tenantAccessor.IncludeAllTenants() || e.TenantId == _tenantAccessor.GetTenantId()));
            modelBuilder.Entity<Project>().HasQueryFilter(e => (_tenantAccessor.IncludeDeleted() || !e.IsDeleted) && (_tenantAccessor.IncludeAllTenants() || e.TenantId == _tenantAccessor.GetTenantId()) && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()));
            modelBuilder.Entity<Department>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()));
            modelBuilder.Entity<Designation>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()));
            modelBuilder.Entity<Branch>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()));
            modelBuilder.Entity<CostCenter>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()));
            modelBuilder.Entity<BusinessUnit>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()));
            modelBuilder.Entity<User>().HasQueryFilter(e => (_tenantAccessor.IncludeDeleted() || !e.IsDeleted) && (_tenantAccessor.IncludeAllTenants() || e.TenantId == _tenantAccessor.GetTenantId()));
            modelBuilder.Entity<Role>().HasQueryFilter(e => (_tenantAccessor.IncludeDeleted() || !e.IsDeleted) && (_tenantAccessor.IncludeAllTenants() || e.TenantId == _tenantAccessor.GetTenantId()));
            modelBuilder.Entity<UserRole>().HasQueryFilter(e => (_tenantAccessor.IncludeDeleted() || !e.IsDeleted) && (_tenantAccessor.IncludeAllTenants() || e.TenantId == _tenantAccessor.GetTenantId()));
            modelBuilder.Entity<ContactSubmission>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<EntityFieldDefinition>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<EntityFieldValue>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<DocumentRecord>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == null || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<NotificationMessage>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == null || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()));
            modelBuilder.Entity<HelpdeskTicket>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == null || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<CommunicationTemplate>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<HelpdeskEscalation>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<HelpdeskFaqArticle>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<TravelRequest>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<AiAgent>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<ProjectTask>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<TimesheetEntry>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<IntegrationConnector>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<IntegrationSyncLog>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<IntegrationApiKey>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<SecurityPolicy>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<SsoIdentityProvider>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<IpAccessRule>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<MfaEnrollment>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<CustomReport>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<LicenseInvoice>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<Employee>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<AttendanceRecord>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<AttendanceCorrection>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<LeaveType>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<LeavePolicy>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<EmployeeLeave>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<LeaveRequest>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<LeavePolicyRule>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<LeaveAllocation>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<Holiday>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<PayrollStructure>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<PayrollComponent>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<PayrollRun>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == null || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()));
            modelBuilder.Entity<PayrollFinalSettlement>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<PayrollLoan>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<PayrollBonus>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<PayrollArrear>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<Payslip>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<PayslipLine>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<EmployeeSalaryAssignment>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<PurchaseRequest>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<HrLifecycleTask>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<SalesReturn>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<AccountingPeriod>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<FeatureFlag>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<RefreshToken>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<AuditLog>().HasQueryFilter(e => (_tenantAccessor.IncludeDeleted() || !e.IsDeleted) && (_tenantAccessor.IncludeAllTenants() || e.TenantId == _tenantAccessor.GetTenantId()));
            modelBuilder.Entity<TenantModule>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<TenantConfig>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());

            modelBuilder.Entity<WorkflowDefinition>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<WorkflowStep>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<ApprovalRequest>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());

            // Finance & Accounting Query Filters
            modelBuilder.Entity<ChartOfAccount>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<JournalEntry>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<JournalEntryLine>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<Payment>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<ExpenseClaim>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<BankReconciliation>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()));

            // Sales & CRM Query Filters
            modelBuilder.Entity<Customer>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<CrmLead>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<SalesQuotation>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<SalesQuotationItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<SalesOrder>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<SalesOrderItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<SalesInvoice>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<SalesInvoiceItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<DiscountScheme>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<DiscountSchemeLine>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());

            // Purchase & Procurement Query Filters
            modelBuilder.Entity<Vendor>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<PurchaseOrder>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<PurchaseOrderItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<PurchaseInvoice>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<PurchaseInvoiceItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<GoodsReceiptNote>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));

            // Inventory Management Query Filters
            modelBuilder.Entity<Item>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<Warehouse>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<StockMovement>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<StockBalance>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()));

            // Asset Management Query Filters (consolidated — no duplicates)
            modelBuilder.Entity<FixedAsset>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId() && (_tenantAccessor.GetCompanyIdOrEmpty() == Guid.Empty || e.CompanyId == _tenantAccessor.GetCompanyIdOrEmpty()) && (_tenantAccessor.GetProjectIdOrEmpty() == Guid.Empty || e.ProjectId == null || e.ProjectId == _tenantAccessor.GetProjectIdOrEmpty()));
            modelBuilder.Entity<AssetAllocation>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<AssetDepreciation>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<AssetMaintenance>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());

            // Training & Development Query Filters
            modelBuilder.Entity<TrainingCourse>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<CourseEnrollment>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<TrainingAssessment>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<TrainingCertificate>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<TrainingRequest>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());

            // Performance Management Query Filters
            modelBuilder.Entity<AppraisalCycle>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<PerformanceAppraisal>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<AppraisalRating>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<AppraisalCompetency>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());

            // Shift Management Query Filters
            modelBuilder.Entity<Shift>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<ShiftAssignment>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<ShiftSwap>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<ShiftRotation>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<RotationSchedule>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());

            // Overtime Tracking Query Filters
            modelBuilder.Entity<OvertimeRequest>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<OvertimeApproval>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<OvertimeLog>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<OvertimeCompensation>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());

            // Compliance Query Filters
            modelBuilder.Entity<ProvidentFund>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<EmployeeStateInsurance>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<IncomeTax>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<ProfessionalTax>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<TaxDeclaration>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<PFWithdrawal>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<ESIBenefit>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<StatutorySettings>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<ComplianceReport>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<ComplianceAudit>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<BusinessIdSequence>().HasQueryFilter(e => e.TenantId == _tenantAccessor.GetTenantId());

            // Decimal precision for geo coordinates to match SQL schema
            modelBuilder.Entity<AttendanceRecord>().Property(a => a.Latitude).HasPrecision(10,7);
            modelBuilder.Entity<AttendanceRecord>().Property(a => a.Longitude).HasPrecision(10,7);

            modelBuilder.Entity<User>().Property(u => u.EmailHash).HasMaxLength(64);
            modelBuilder.Entity<User>().HasIndex(u => new { u.TenantId, u.EmailHash });
            modelBuilder.Entity<User>().HasIndex(u => new { u.TenantId, u.Email }).IsUnique();
            modelBuilder.Entity<Customer>().HasIndex(c => c.TenantId);
            modelBuilder.Entity<Customer>().HasIndex(c => new { c.TenantId, c.CustomerCode }).IsUnique().HasFilter("[IsDeleted] = 0");
            modelBuilder.Entity<TenantConfig>().HasIndex(c => c.CustomDomain).HasFilter("[CustomDomain] IS NOT NULL AND [IsDeleted] = 0");
            modelBuilder.Entity<Employee>().HasIndex(e => new { e.TenantId, e.CompanyId });
            modelBuilder.Entity<Employee>().HasIndex(e => new { e.TenantId, e.EmployeeCode }).IsUnique().HasFilter("[IsDeleted] = 0 AND [EmployeeCode] IS NOT NULL AND [EmployeeCode] <> ''");
            modelBuilder.Entity<PayslipLine>().HasOne(l => l.Payslip).WithMany(p => p.Lines).HasForeignKey(l => l.PayslipId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<AttendanceRecord>().HasIndex(a => new { a.TenantId, a.EmployeeId, a.Timestamp });
            modelBuilder.Entity<HelpdeskTicket>().HasIndex(t => new { t.TenantId, t.TicketNumber }).IsUnique();
            modelBuilder.Entity<HelpdeskEscalation>().HasIndex(e => new { e.TenantId, e.HelpdeskTicketId, e.EscalatedAt });
            modelBuilder.Entity<BusinessIdSequence>().HasIndex(e => new { e.TenantId, e.EntityName }).IsUnique();

            // Previously missing query filters — prevents cross-tenant data leakage
            modelBuilder.Entity<Permission>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<RolePermission>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<WebsitePage>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<JobPosting>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<Candidate>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<CandidateScreening>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<JobApplication>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<OfferLetter>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
        }

        public override int SaveChanges()
        {
            var now = System.DateTime.UtcNow;
            var tenantId = _tenantAccessor.GetTenantId();
            ApplyBaseEntityStamps(now, tenantId);
            AddAuditLogs(tenantId, now);
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var now = System.DateTime.UtcNow;
            var tenantId = _tenantAccessor.GetTenantId();
            ApplyBaseEntityStamps(now, tenantId);
            AddAuditLogs(tenantId, now);
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void ApplyBaseEntityStamps(System.DateTime now, System.Guid tenantId)
        {
            foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            {
                if (entry.State == EntityState.Added)
                {
                    // Respect explicit TenantId if already set (e.g. provisioning/seeding/cross-tenant jobs);
                    // otherwise stamp from current request context.
                    if (entry.Entity.TenantId == System.Guid.Empty && tenantId != System.Guid.Empty)
                    {
                        entry.Entity.TenantId = tenantId;
                    }

                    entry.Entity.CreatedAt = now;
                    ApplyOrgScopeStamps(entry);
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = now;
                }

                if (entry.Entity is User user && !string.IsNullOrWhiteSpace(user.Email))
                {
                    if (entry.State == EntityState.Added || entry.State == EntityState.Modified || string.IsNullOrWhiteSpace(user.EmailHash))
                    {
                        user.EmailHash = _encryptionService.ComputeHash(user.Email);
                    }
                }
            }
        }

        private void ApplyOrgScopeStamps(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
        {
            var companyId = _tenantAccessor.GetCompanyId();
            var projectId = _tenantAccessor.GetProjectId();
            var companyProp = entry.Metadata.FindProperty("CompanyId");
            if (companyProp != null && companyId.HasValue)
            {
                var current = entry.Property("CompanyId").CurrentValue;
                var empty = current == null || current is System.Guid guid && guid == System.Guid.Empty;
                if (empty)
                {
                    entry.Property("CompanyId").CurrentValue = companyProp.ClrType == typeof(System.Guid)
                        ? companyId.Value
                        : companyId;
                }
            }

            var projectProp = entry.Metadata.FindProperty("ProjectId");
            if (projectProp != null && projectId.HasValue)
            {
                var current = entry.Property("ProjectId").CurrentValue;
                if (current == null)
                {
                    entry.Property("ProjectId").CurrentValue = projectId.Value;
                }
            }
        }

        private static readonly HashSet<string> SensitivePropertyNames = new(StringComparer.OrdinalIgnoreCase)
        {
            "PasswordHash", "SecurityStamp", "ConcurrencyStamp", "SecretKey", "EncryptionKey", "ApiKey", "Token", "Salt", "NormalizedEmail", "NormalizedUserName"
        };

        private void AddAuditLogs(Guid tenantId, DateTime now)
        {
            var entries = ChangeTracker.Entries<BaseEntity>()
                .Where(e => e.Entity is not AuditLog && e.Entity is not OutboxMessage)
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted)
                .ToList();

            if (entries.Count == 0) return;

            foreach (var entry in entries)
            {
                var targetTenantId = tenantId != Guid.Empty ? tenantId : entry.Entity.TenantId;

                Guid? entityCompanyId = null;
                if (entry.Entity is BaseOrgEntity orgEntity)
                {
                    entityCompanyId = orgEntity.CompanyId;
                }
                else
                {
                    var companyProp = entry.Metadata.FindProperty("CompanyId");
                    if (companyProp != null)
                    {
                        var val = entry.Property("CompanyId").CurrentValue;
                        if (val is Guid g && g != Guid.Empty) entityCompanyId = g;
                    }
                }

                Guid? entityProjectId = null;
                var projectProp = entry.Metadata.FindProperty("ProjectId");
                if (projectProp != null)
                {
                    var val = entry.Property("ProjectId").CurrentValue;
                    if (val is Guid g && g != Guid.Empty) entityProjectId = g;
                }

                var audit = new AuditLog
                {
                    TenantId = targetTenantId,
                    CompanyId = entityCompanyId,
                    ProjectId = entityProjectId,
                    EntityName = entry.Entity.GetType().Name,
                    EntityId = entry.Entity.Id,
                    Action = entry.State.ToString(),
                    PerformedBy = entry.Entity.CreatedBy,
                    PerformedAt = now
                };

                if (entry.State == EntityState.Added)
                {
                    var newValues = new Dictionary<string, object?>();
                    foreach (var prop in entry.Properties)
                    {
                        if (prop.Metadata.IsPrimaryKey() || SensitivePropertyNames.Contains(prop.Metadata.Name)) continue;
                        if (prop.CurrentValue != null)
                        {
                            newValues[prop.Metadata.Name] = prop.CurrentValue;
                        }
                    }
                    audit.NewValue = JsonSerializer.Serialize(newValues);
                }
                else if (entry.State == EntityState.Modified)
                {
                    var oldValues = new Dictionary<string, object?>();
                    var newValues = new Dictionary<string, object?>();

                    foreach (var prop in entry.Properties)
                    {
                        if (!prop.IsModified || SensitivePropertyNames.Contains(prop.Metadata.Name)) continue;

                        oldValues[prop.Metadata.Name] = prop.OriginalValue;
                        newValues[prop.Metadata.Name] = prop.CurrentValue;
                    }

                    if (oldValues.Count > 0)
                    {
                        audit.OldValue = JsonSerializer.Serialize(oldValues);
                        audit.NewValue = JsonSerializer.Serialize(newValues);
                    }
                }
                else if (entry.State == EntityState.Deleted)
                {
                    var oldValues = new Dictionary<string, object?>();
                    foreach (var prop in entry.Properties)
                    {
                        if (SensitivePropertyNames.Contains(prop.Metadata.Name)) continue;
                        if (prop.OriginalValue != null)
                        {
                            oldValues[prop.Metadata.Name] = prop.OriginalValue;
                        }
                    }
                    audit.OldValue = JsonSerializer.Serialize(oldValues);
                }

                AuditLogs.Add(audit);
            }
        }
    }

    // Domain entities are defined in UabIndia.Core.Entities
}
