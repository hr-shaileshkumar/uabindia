using System;

namespace UabIndia.Core.Entities
{
    public class LeaveType : BaseEntity
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsPaid { get; set; } = true;
        public int DisplayOrder { get; set; } = 0;
    }
}
