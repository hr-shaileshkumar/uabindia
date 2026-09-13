using System;

namespace UabIndia.Core.Entities
{
    public class Holiday : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Type { get; set; } = "Public"; // Public, Optional, Regional
        public bool IsOptional { get; set; }
        public string? Description { get; set; }
    }
}
