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
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public double? DistanceFromLocationMeters { get; set; }
        public Guid? MatchedLocationId { get; set; }
        public string? MatchedLocationName { get; set; }
        public bool IsGeofenceBreached { get; set; }
        public string? GeofenceValidationMessage { get; set; }
    }

    public class AttendanceUpdateDto
    {
        public string? PunchType { get; set; }
        public DateTime? Timestamp { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? DeviceId { get; set; }
        public string? Source { get; set; }
        public bool? GeoValidated { get; set; }
    }

    public class CreateRegularizationDto
    {
        [Required]
        public Guid EmployeeId { get; set; }
        [Required]
        public DateTime Date { get; set; }
        [Required]
        public string RequestType { get; set; } = "MissingPunch"; // MissingPunch, OnDuty, WorkFromHome
        [Required]
        public string Reason { get; set; } = string.Empty;
        public TimeSpan? ProposedInTime { get; set; }
        public TimeSpan? ProposedOutTime { get; set; }
    }

    public class RegularizationApprovalDto
    {
        public TimeSpan? ApprovedInTime { get; set; }
        public TimeSpan? ApprovedOutTime { get; set; }
        public string? ManagerRemarks { get; set; }
    }
}
