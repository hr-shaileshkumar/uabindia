using Microsoft.EntityFrameworkCore;
using UabIndia.Core.Entities;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace UabIndia.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IEncryptionService _encryptionService;

        internal string? CurrentTenantSchema => _tenantAccessor.GetTenantSchema();

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ITenantAccessor tenantAccessor, IEncryptionService encryptionService)
            : base(options)
        {
            _tenantAccessor = tenantAccessor;
            _encryptionService = encryptionService;
        }

        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<Project> Projects { get; set; }
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
        public DbSet<Payslip> Payslips { get; set; }
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

        // Workflow & Approvals
        public DbSet<WorkflowDefinition> WorkflowDefinitions { get; set; }
        public DbSet<WorkflowStep> WorkflowSteps { get; set; }
        public DbSet<ApprovalRequest> ApprovalRequests { get; set; }

        // Finance & Accounting
        public DbSet<ChartOfAccount> ChartOfAccounts { get; set; }
        public DbSet<JournalEntry> JournalEntries { get; set; }
        public DbSet<JournalEntryLine> JournalEntryLines { get; set; }
        public DbSet<Payment> Payments { get; set; }

        // Sales & CRM
        public DbSet<Customer> Customers { get; set; }
        public DbSet<SalesQuotation> SalesQuotations { get; set; }
        public DbSet<SalesQuotationItem> SalesQuotationItems { get; set; }
        public DbSet<SalesOrder> SalesOrders { get; set; }
        public DbSet<SalesOrderItem> SalesOrderItems { get; set; }
        public DbSet<SalesInvoice> SalesInvoices { get; set; }
        public DbSet<SalesInvoiceItem> SalesInvoiceItems { get; set; }

        // Purchase & Procurement
        public DbSet<Vendor> Vendors { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
        public DbSet<PurchaseInvoice> PurchaseInvoices { get; set; }
        public DbSet<PurchaseInvoiceItem> PurchaseInvoiceItems { get; set; }

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
            modelBuilder.Entity<User>().ToTable("Users");
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

            // Sales & CRM
            modelBuilder.Entity<Customer>().ToTable("Customers");
            modelBuilder.Entity<SalesQuotation>().ToTable("SalesQuotations");
            modelBuilder.Entity<SalesQuotationItem>().ToTable("SalesQuotationItems");
            modelBuilder.Entity<SalesOrder>().ToTable("SalesOrders");
            modelBuilder.Entity<SalesOrderItem>().ToTable("SalesOrderItems");
            modelBuilder.Entity<SalesInvoice>().ToTable("SalesInvoices");
            modelBuilder.Entity<SalesInvoiceItem>().ToTable("SalesInvoiceItems");

            // Purchase & Procurement
            modelBuilder.Entity<Vendor>().ToTable("Vendors");
            modelBuilder.Entity<PurchaseOrder>().ToTable("PurchaseOrders");
            modelBuilder.Entity<PurchaseOrderItem>().ToTable("PurchaseOrderItems");
            modelBuilder.Entity<PurchaseInvoice>().ToTable("PurchaseInvoices");
            modelBuilder.Entity<PurchaseInvoiceItem>().ToTable("PurchaseInvoiceItems");

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

            modelBuilder.Entity<TenantModule>().HasIndex(t => new { t.TenantId, t.ModuleKey }).IsUnique();

            // Apply global query filter for multi-tenant + soft delete
            modelBuilder.Entity<Tenant>().HasQueryFilter(e => _tenantAccessor.IncludeDeleted() || !e.IsDeleted);
            modelBuilder.Entity<Company>().HasQueryFilter(e => (_tenantAccessor.IncludeDeleted() || !e.IsDeleted) && (_tenantAccessor.IncludeAllTenants() || e.TenantId == _tenantAccessor.GetTenantId()));
            modelBuilder.Entity<Project>().HasQueryFilter(e => (_tenantAccessor.IncludeDeleted() || !e.IsDeleted) && (_tenantAccessor.IncludeAllTenants() || e.TenantId == _tenantAccessor.GetTenantId()));
            modelBuilder.Entity<User>().HasQueryFilter(e => (_tenantAccessor.IncludeDeleted() || !e.IsDeleted) && (_tenantAccessor.IncludeAllTenants() || e.TenantId == _tenantAccessor.GetTenantId()));
            modelBuilder.Entity<Role>().HasQueryFilter(e => (_tenantAccessor.IncludeDeleted() || !e.IsDeleted) && (_tenantAccessor.IncludeAllTenants() || e.TenantId == _tenantAccessor.GetTenantId()));
            modelBuilder.Entity<UserRole>().HasQueryFilter(e => (_tenantAccessor.IncludeDeleted() || !e.IsDeleted) && (_tenantAccessor.IncludeAllTenants() || e.TenantId == _tenantAccessor.GetTenantId()));
            modelBuilder.Entity<EntityFieldDefinition>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<EntityFieldValue>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<DocumentRecord>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<NotificationMessage>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<CommunicationTemplate>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<HelpdeskTicket>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<HelpdeskEscalation>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<HelpdeskFaqArticle>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<Employee>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
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
            modelBuilder.Entity<PayrollRun>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<Payslip>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
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
            modelBuilder.Entity<JournalEntry>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<JournalEntryLine>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<Payment>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());

            // Sales & CRM Query Filters
            modelBuilder.Entity<Customer>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<SalesQuotation>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<SalesQuotationItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<SalesOrder>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<SalesOrderItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<SalesInvoice>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<SalesInvoiceItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());

            // Purchase & Procurement Query Filters
            modelBuilder.Entity<Vendor>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<PurchaseOrder>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<PurchaseOrderItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<PurchaseInvoice>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<PurchaseInvoiceItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());

            // Inventory Management Query Filters
            modelBuilder.Entity<Item>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<Warehouse>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<StockMovement>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
            modelBuilder.Entity<StockBalance>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());

            // Asset Management Query Filters (consolidated — no duplicates)
            modelBuilder.Entity<FixedAsset>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());
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

            // Decimal precision for geo coordinates to match SQL schema
            modelBuilder.Entity<AttendanceRecord>().Property(a => a.Latitude).HasPrecision(10,7);
            modelBuilder.Entity<AttendanceRecord>().Property(a => a.Longitude).HasPrecision(10,7);

            modelBuilder.Entity<User>().HasIndex(u => new { u.TenantId, u.Email }).IsUnique();
            modelBuilder.Entity<Employee>().HasIndex(e => new { e.TenantId, e.CompanyId });
            modelBuilder.Entity<AttendanceRecord>().HasIndex(a => new { a.TenantId, a.EmployeeId, a.Timestamp });
            modelBuilder.Entity<HelpdeskTicket>().HasIndex(t => new { t.TenantId, t.TicketNumber }).IsUnique();
            modelBuilder.Entity<HelpdeskEscalation>().HasIndex(e => new { e.TenantId, e.HelpdeskTicketId, e.EscalatedAt });

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

            foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.TenantId = tenantId;
                    entry.Entity.CreatedAt = now;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = now;
                }
            }

            AddAuditLogs(tenantId, now);

            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var now = System.DateTime.UtcNow;
            var tenantId = _tenantAccessor.GetTenantId();

            foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.TenantId = tenantId;
                    entry.Entity.CreatedAt = now;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = now;
                }
            }

            AddAuditLogs(tenantId, now);

            return await base.SaveChangesAsync(cancellationToken);
        }

        private void AddAuditLogs(System.Guid tenantId, System.DateTime now)
        {
            var entries = ChangeTracker.Entries<BaseEntity>()
                .Where(e => e.Entity is not AuditLog)
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted)
                .ToList();

            if (entries.Count == 0) return;

            foreach (var entry in entries)
            {
                var audit = new AuditLog
                {
                    TenantId = tenantId,
                    EntityName = entry.Entity.GetType().Name,
                    EntityId = entry.Entity.Id,
                    Action = entry.State.ToString(),
                    PerformedAt = now
                };

                AuditLogs.Add(audit);
            }
        }
    }

    // Domain entities are defined in UabIndia.Core.Entities
}
