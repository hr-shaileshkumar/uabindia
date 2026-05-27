using System;

namespace UabIndia.Core.Entities
{
    public class User : BaseEntity
    {
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public bool IsSystemAdmin { get; set; }
        public bool IsActive { get; set; } = true;
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetExpires { get; set; }
    }
}
