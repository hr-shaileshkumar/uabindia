using System;

namespace UabIndia.Core.Entities
{
    public class User : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? EmailHash { get; set; }
        public string PasswordHash { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public bool IsSystemAdmin { get; set; }
        public bool IsActive { get; set; } = true;
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetExpires { get; set; }
        public int AccessFailedCount { get; set; }
        public DateTime? LockoutEnd { get; set; }
        public bool LockoutEnabled { get; set; } = true;
        public bool TwoFactorEnabled { get; set; } = false;
        public string? TwoFactorSecret { get; set; }
    }
}
