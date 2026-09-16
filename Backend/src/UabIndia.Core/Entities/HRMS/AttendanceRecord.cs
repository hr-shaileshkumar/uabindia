using System;

namespace UabIndia.Core.Entities
{
    public class AttendanceRecord : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public Guid? ProjectId { get; set; }
        public string PunchType { get; set; } = "IN";
        public DateTime Timestamp { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? DeviceId { get; set; }
        public string? Source { get; set; }
        public bool GeoValidated { get; set; }

        // Geofence Validation Audit
        public double? DistanceFromLocationMeters { get; set; }
        public Guid? MatchedLocationId { get; set; }
        public string? MatchedLocationName { get; set; }
        public bool IsGeofenceBreached { get; set; }
        public string? GeofenceValidationMessage { get; set; }
    }
}
