using System;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Tenant singleton for password complexity, lockout, and MFA enforcement flags.
    /// </summary>
    public class SecurityPolicy : BaseEntity
    {
        public int MinLength { get; set; } = 8;
        public bool RequireUppercase { get; set; } = true;
        public bool RequireLowercase { get; set; } = true;
        public bool RequireNumber { get; set; } = true;
        public bool RequireSpecial { get; set; } = false;
        public int MaxAgeDays { get; set; } = 90;
        public int MaxFailedAttempts { get; set; } = 5;
        public int LockoutMinutes { get; set; } = 15;
        public bool RequireMfaPlatformAdmins { get; set; }
        public bool RequireMfaTenantAdmins { get; set; }
        public bool AllowTotp { get; set; } = true;
        public bool AllowSmsOtp { get; set; }
    }

    public class SsoIdentityProvider : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Protocol { get; set; } = "OIDC"; // OIDC, SAML, OAuth2
        public string Provider { get; set; } = "Custom"; // Azure AD, Google Workspace, Okta, Auth0, ADFS, Custom
        public string Issuer { get; set; } = string.Empty;
        public string ClientId { get; set; } = string.Empty;
        public string? ClientSecretHash { get; set; }
        public string? MetadataUrl { get; set; }
        public string? RedirectUri { get; set; }
        public string? Scopes { get; set; }
        public string Status { get; set; } = "Inactive"; // Inactive, Configured, Active, Error
        public string? LastError { get; set; }
        public DateTime? LastTestedAt { get; set; }
        public DateTime? EnabledAt { get; set; }
    }

    public class IpAccessRule : BaseEntity
    {
        public string IpRange { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Action { get; set; } = "ALLOW"; // ALLOW, BLOCK
        public string Status { get; set; } = "Active";
    }

    public class MfaEnrollment : BaseEntity
    {
        public Guid? UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string Method { get; set; } = "TOTP"; // TOTP, SMS, Email
        public string Status { get; set; } = "Pending"; // Pending, Enrolled, Disabled
        public DateTime? EnrolledAt { get; set; }
    }
}
