using System;
using System.Collections.Generic;

namespace UabIndia.Core.Services
{
    public class PolicyContext
    {
        public Guid TenantId { get; set; }
        public Guid? UserId { get; set; }
        public Guid? TargetUserId { get; set; }
        public string Resource { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
    }

    public class PolicyDecision
    {
        public bool Allowed { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
