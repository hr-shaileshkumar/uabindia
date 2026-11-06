using System;

namespace UabIndia.Core.Entities
{
    public class RefreshToken : BaseEntity
    {
        public Guid UserId { get; set; }
        public string? TokenHash { get; set; }
        public string? DeviceId { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsRevoked { get; set; }
        public DateTime? RevokedAt { get; set; }
        public Guid? ParentTokenId { get; set; }
        public Guid? ReplacedByTokenId { get; set; }
    }
}
