using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class AttendancePunchDto
    {
        [Required]
        public Guid EmployeeId { get; set; }
        public Guid? ProjectId { get; set; }
        [Required]
        public string PunchType { get; set; } = "IN";
        [Required]
        public DateTime Timestamp { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? DeviceId { get; set; }
        public string? Source { get; set; }
    }

    public class AttendanceRecordDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string? EmployeeCode { get; set; }
        public string? EmployeeName { get; set; }
        public Guid? ProjectId { get; set; }
        public string PunchType { get; set; } = "IN";
        public DateTime Timestamp { get; set; }
        public bool GeoValidated { get; set; }
        public string? DeviceId { get; set; }
        public string? Source { get; set; }
    }
}
