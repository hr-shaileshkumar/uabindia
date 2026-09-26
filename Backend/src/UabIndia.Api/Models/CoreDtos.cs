using System;

namespace UabIndia.Api.Models
{
    public class TenantDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Subdomain { get; set; } = string.Empty;
        public bool IsDeleted { get; set; }
        public bool IsActive { get; set; }
        public string Status { get; set; } = "active";
        public string ProvisionStatus { get; set; } = "Pending";
        public string SubscriptionPlan { get; set; } = "Basic";
        public string[] SelectedModules { get; set; } = Array.Empty<string>();
        public string AdminEmail { get; set; } = string.Empty;
        public string AdminName { get; set; } = string.Empty;
        public string AdminRole { get; set; } = string.Empty;
        public bool AdminCreated { get; set; }
        public bool PasswordResetPending { get; set; }
        public DateTime? LastRepairAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public int UsersCount { get; set; }
        public DateTime? LastActivityAt { get; set; }

        public string? Address { get; set; }
        public string? State { get; set; }
        public string? District { get; set; }
        public string? Pincode { get; set; }
        public string? ContactNumber { get; set; }
        public string? GstNumber { get; set; }
        public string? PanNumber { get; set; }
        public string? LogoUrl { get; set; }
        public string Timezone { get; set; } = "Asia/Kolkata";
        public string Currency { get; set; } = "INR";
        public string Language { get; set; } = "en";

        public DateTime? BillingStartDate { get; set; }
        public DateTime? BillingEndDate { get; set; }
        public DateTime? TrialExpiryDate { get; set; }
        public int? EmployeeLimit { get; set; }
        public int? StorageLimitGb { get; set; }
        public int? SmsCredits { get; set; }
        public bool WhatsAppIntegrationEnabled { get; set; }
        public string? SmtpHost { get; set; }
        public int? SmtpPort { get; set; }
        public string? SmtpUsername { get; set; }
        public string? SmtpFromEmail { get; set; }
        public string? CustomDomain { get; set; }
        public bool WhiteLabelEnabled { get; set; }
    }

    public class CreateTenantDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(60)]
        public string Subdomain { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.EmailAddress]
        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string AdminEmail { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(150)]
        public string AdminName { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(50)]
        public string AdminRole { get; set; } = "ADMIN";

        [System.ComponentModel.DataAnnotations.StringLength(200, MinimumLength = 8)]
        public string? AdminPassword { get; set; }

        public bool SendInviteLink { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(120)]
        public string? TenantProvisionRequestId { get; set; }

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(50)]
        public string SubscriptionPlan { get; set; } = "Basic";

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(20)]
        public string Status { get; set; } = "active";

        [System.ComponentModel.DataAnnotations.Required]
        public string[] SelectedModules { get; set; } = Array.Empty<string>();

        [System.ComponentModel.DataAnnotations.StringLength(500)]
        public string? Address { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(100)]
        public string? State { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(100)]
        public string? District { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(20)]
        public string? Pincode { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(30)]
        public string? ContactNumber { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(30)]
        public string? GstNumber { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(30)]
        public string? PanNumber { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(500)]
        public string? LogoUrl { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(100)]
        public string Timezone { get; set; } = "Asia/Kolkata";

        [System.ComponentModel.DataAnnotations.StringLength(10)]
        public string Currency { get; set; } = "INR";

        [System.ComponentModel.DataAnnotations.StringLength(20)]
        public string Language { get; set; } = "en";

        public DateTime? BillingStartDate { get; set; }
        public DateTime? BillingEndDate { get; set; }
        public DateTime? TrialExpiryDate { get; set; }
        public int? EmployeeLimit { get; set; }
        public int? StorageLimitGb { get; set; }
        public int? SmsCredits { get; set; }
        public bool WhatsAppIntegrationEnabled { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string? SmtpHost { get; set; }

        public int? SmtpPort { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string? SmtpUsername { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(256)]
        public string? SmtpPassword { get; set; }

        [System.ComponentModel.DataAnnotations.EmailAddress]
        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string? SmtpFromEmail { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string? CustomDomain { get; set; }

        public bool WhiteLabelEnabled { get; set; }
    }

    public class UpdateTenantDto
    {
        [System.ComponentModel.DataAnnotations.StringLength(100)]
        public string? Name { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(60)]
        public string? Subdomain { get; set; }

        public bool? IsActive { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(20)]
        public string? Status { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(50)]
        public string? SubscriptionPlan { get; set; }

        public string[]? SelectedModules { get; set; }

        [System.ComponentModel.DataAnnotations.EmailAddress]
        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string? AdminEmail { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(150)]
        public string? AdminName { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(500)]
        public string? Address { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(100)]
        public string? State { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(100)]
        public string? District { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(20)]
        public string? Pincode { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(30)]
        public string? ContactNumber { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(30)]
        public string? GstNumber { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(30)]
        public string? PanNumber { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(500)]
        public string? LogoUrl { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(100)]
        public string? Timezone { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(10)]
        public string? Currency { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(20)]
        public string? Language { get; set; }

        public DateTime? BillingStartDate { get; set; }
        public DateTime? BillingEndDate { get; set; }
        public DateTime? TrialExpiryDate { get; set; }
        public int? EmployeeLimit { get; set; }
        public int? StorageLimitGb { get; set; }
        public int? SmsCredits { get; set; }
        public bool? WhatsAppIntegrationEnabled { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string? SmtpHost { get; set; }

        public int? SmtpPort { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string? SmtpUsername { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(256)]
        public string? SmtpPassword { get; set; }

        [System.ComponentModel.DataAnnotations.EmailAddress]
        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string? SmtpFromEmail { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string? CustomDomain { get; set; }

        public bool? WhiteLabelEnabled { get; set; }
    }

    public class CompanyDto
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public bool IsDeleted { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? LegalName { get; set; }
        public string? Code { get; set; }
        public string? RegistrationNumber { get; set; }
        public string? TaxId { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? LogoUrl { get; set; }
        public string? Industry { get; set; }
        public string? CompanySize { get; set; }
        public string? RegistrationAddress { get; set; }
        public string? OperationalAddress { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
        public string CountryCode { get; set; } = "IND";
        public string FunctionalCurrencyCode { get; set; } = "INR";
        public Guid? ParentCompanyId { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? BankName { get; set; }
        public string? BankBranch { get; set; }
        public string? BankRoutingCode { get; set; }
        public string? BankIban { get; set; }
        public string? BankSwiftCode { get; set; }
        public string? IFSCCode { get; set; }
        public string? FinancialYearStart { get; set; }
        public string? FinancialYearEnd { get; set; }
        public int? MaxEmployees { get; set; }
        public string? ContactPersonName { get; set; }
        public string? ContactPersonPhone { get; set; }
        public string? ContactPersonEmail { get; set; }
        public string? HR_PersonName { get; set; }
        public string? HR_PersonEmail { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateCompanyDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        public string Name { get; set; } = string.Empty;
        
        public string? LegalName { get; set; }
        public string? Code { get; set; }
        public string? RegistrationNumber { get; set; }
        public string? TaxId { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? LogoUrl { get; set; }
        public string? Industry { get; set; }
        public string? CompanySize { get; set; }
        public string? RegistrationAddress { get; set; }
        public string? OperationalAddress { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
        public string CountryCode { get; set; } = "IND";
        public string FunctionalCurrencyCode { get; set; } = "INR";
        public Guid? ParentCompanyId { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? BankName { get; set; }
        public string? BankBranch { get; set; }
        public string? BankRoutingCode { get; set; }
        public string? BankIban { get; set; }
        public string? BankSwiftCode { get; set; }
        public string? IFSCCode { get; set; }
        public string? FinancialYearStart { get; set; }
        public string? FinancialYearEnd { get; set; }
        public int? MaxEmployees { get; set; }
        public string? ContactPersonName { get; set; }
        public string? ContactPersonPhone { get; set; }
        public string? ContactPersonEmail { get; set; }
        public string? HR_PersonName { get; set; }
        public string? HR_PersonEmail { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateCompanyDto
    {
        public string? Name { get; set; }
        public string? LegalName { get; set; }
        public string? Code { get; set; }
        public string? RegistrationNumber { get; set; }
        public string? TaxId { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? LogoUrl { get; set; }
        public string? Industry { get; set; }
        public string? CompanySize { get; set; }
        public string? RegistrationAddress { get; set; }
        public string? OperationalAddress { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
        public string? CountryCode { get; set; }
        public string? FunctionalCurrencyCode { get; set; }
        public Guid? ParentCompanyId { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? BankName { get; set; }
        public string? BankBranch { get; set; }
        public string? BankRoutingCode { get; set; }
        public string? BankIban { get; set; }
        public string? BankSwiftCode { get; set; }
        public string? IFSCCode { get; set; }
        public string? FinancialYearStart { get; set; }
        public string? FinancialYearEnd { get; set; }
        public int? MaxEmployees { get; set; }
        public string? ContactPersonName { get; set; }
        public string? ContactPersonPhone { get; set; }
        public string? ContactPersonEmail { get; set; }
        public string? HR_PersonName { get; set; }
        public string? HR_PersonEmail { get; set; }
        public string? Notes { get; set; }
        public bool? IsActive { get; set; }
    }

    public class ProjectDto
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Guid CompanyId { get; set; }
        public string? CompanyName { get; set; }
            public string? TenantName { get; set; }
        public string ProjectCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ProjectType { get; set; } = "Internal";
        public string Priority { get; set; } = "Medium";
        public string Status { get; set; } = "Planned";
            public bool IsDeleted { get; set; }
        public bool IsActive { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? ActualStartDate { get; set; }
        public DateTime? ActualEndDate { get; set; }
        public decimal? Budget { get; set; }
        public decimal? ActualCost { get; set; }
        public string CurrencyCode { get; set; } = "INR";
        public string? ClientName { get; set; }
        public string? ContractNumber { get; set; }
        public string? BillingType { get; set; }
        public int CompletionPercentage { get; set; }
        public Guid? ProjectManagerId { get; set; }
        public string? Location { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateProjectDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required]
        public Guid CompanyId { get; set; }

        /// <summary>SuperAdmin only: explicitly set the target tenant. Ignored for non-SuperAdmin callers.</summary>
        public Guid? TenantId { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(50)]
        public string? ProjectCode { get; set; }

        public string? Description { get; set; }
        public string ProjectType { get; set; } = "Internal";
        public string Priority { get; set; } = "Medium";
        public string Status { get; set; } = "Planned";
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal? Budget { get; set; }
        public string CurrencyCode { get; set; } = "INR";
        public string? ClientName { get; set; }
        public string? ContractNumber { get; set; }
        public string? BillingType { get; set; }
        public Guid? ProjectManagerId { get; set; }
        public string? Location { get; set; }
    }

    public class UpdateProjectDto
    {
        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string? Name { get; set; }

        public Guid? CompanyId { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(50)]
        public string? ProjectCode { get; set; }

        public string? Description { get; set; }
        public string? ProjectType { get; set; }
        public string? Priority { get; set; }
        public string? Status { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? ActualStartDate { get; set; }
        public DateTime? ActualEndDate { get; set; }
        public decimal? Budget { get; set; }
        public decimal? ActualCost { get; set; }
        public string? CurrencyCode { get; set; }
        public string? ClientName { get; set; }
        public string? ContractNumber { get; set; }
        public string? BillingType { get; set; }
        public int? CompletionPercentage { get; set; }
        public Guid? ProjectManagerId { get; set; }
        public string? Location { get; set; }
        public Guid? UpdatedBy { get; set; }
    }

    public class RoleDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class ModuleCatalogDto
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsEnabled { get; set; }
        public string Version { get; set; } = "0001";
    }

    public class TenantModuleDto
    {
        public string ModuleKey { get; set; } = string.Empty;
        public bool IsEnabled { get; set; }
    }

    public class UpdateTenantModulesDto
    {
        public TenantModuleDto[] Subscriptions { get; set; } = Array.Empty<TenantModuleDto>();
    }

    public class AuditLogDto
    {
        public Guid Id { get; set; }
        public string EntityName { get; set; } = string.Empty;
        public Guid? EntityId { get; set; }
        public string Action { get; set; } = string.Empty;
        public DateTime PerformedAt { get; set; }
        public Guid? PerformedBy { get; set; }
        public string? Ip { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
    }

    public class ApiKeyDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Prefix { get; set; } = string.Empty;
        public string Scope { get; set; } = "read";
        public string Status { get; set; } = "Active";
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
        public string? PlaintextKey { get; set; }
    }

    public class CreateApiKeyDto
    {
        public string Name { get; set; } = string.Empty;
        public string Scope { get; set; } = "read";
    }

    public class IntegrationDto
    {
        public Guid Id { get; set; }
        public string ConnectorKey { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Provider { get; set; } = string.Empty;
        public string Category { get; set; } = "Integration";
        public string Status { get; set; } = "Inactive";
        public Dictionary<string, string?>? Config { get; set; }
        public DateTime? LastTestedAt { get; set; }
        public DateTime? LastSyncAt { get; set; }
        public string? LastError { get; set; }
    }

    public class DeviceSessionDto
    {
        public Guid Id { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public bool IsRevoked { get; set; }
    }

    public class PasswordPolicyDto
    {
        public int MinLength { get; set; }
        public bool RequireUppercase { get; set; }
        public bool RequireLowercase { get; set; }
        public bool RequireNumber { get; set; }
        public bool RequireSpecial { get; set; }
        public int MaxAgeDays { get; set; }
        public int MaxFailedAttempts { get; set; } = 5;
        public int LockoutMinutes { get; set; } = 15;
    }

    public class MfaPolicyDto
    {
        public bool RequireMfaPlatformAdmins { get; set; }
        public bool RequireMfaTenantAdmins { get; set; }
        public bool AllowTotp { get; set; } = true;
        public bool AllowSmsOtp { get; set; }
    }

    public class CreateSsoProviderDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        public string Name { get; set; } = string.Empty;
        public string Protocol { get; set; } = "OIDC";
        public string Provider { get; set; } = "Custom";
        public string Issuer { get; set; } = string.Empty;
        public string ClientId { get; set; } = string.Empty;
        public string? ClientSecret { get; set; }
        public string? MetadataUrl { get; set; }
        public string? RedirectUri { get; set; }
        public string? Scopes { get; set; }
    }

    public class CreateIpAccessRuleDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        public string IpRange { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Action { get; set; } = "ALLOW";
    }

    public class CreateMfaEnrollmentDto
    {
        public Guid? UserId { get; set; }
        public string? UserName { get; set; }
        public string? UserEmail { get; set; }
        public string Method { get; set; } = "TOTP";
    }

    public class CreateCustomReportDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        public string Name { get; set; } = string.Empty;
        public string ReportType { get; set; } = "sales";
        public string DateRange { get; set; } = "last30days";
        public string OutputFormat { get; set; } = "pdf";
        public string Schedule { get; set; } = "Manual";
    }

    public class CreateLicenseInvoiceDto
    {
        public string? InvoiceNumber { get; set; }
        public string? Period { get; set; }
        public string Plan { get; set; } = "Standard";
        public decimal Amount { get; set; }
        public string? Remarks { get; set; }
    }
}
