using System;

namespace UabIndia.Core.Entities
{
    public class FieldServiceTechnician : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Specialty { get; set; } = "General Systems";
        public bool IsAvailable { get; set; } = true;
        public decimal? CurrentLatitude { get; set; }
        public decimal? CurrentLongitude { get; set; }
    }
}
