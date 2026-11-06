using System;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class AttendancePunchRequest
    {
        public Guid TenantId { get; set; }
        public Guid EmployeeId { get; set; }
        public string PunchType { get; set; } = "IN"; // IN or OUT
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string? DeviceId { get; set; }
        public string? Source { get; set; } = "MobileApp";
    }

    public class AttendancePunchResult
    {
        public bool Success { get; set; }
        public Guid AttendanceId { get; set; }
        public Guid EmployeeId { get; set; }
        public string PunchType { get; set; } = "IN";
        public DateTime TimestampUtc { get; set; }
        public double DistanceFromOfficeMeters { get; set; }
        public bool IsWithinGeoFence { get; set; }
        public string ValidationStatus { get; set; } = "VerifiedWithinFence";
        public string? ErrorMessage { get; set; }
    }

    public interface IAttendanceVerificationService
    {
        Task<AttendancePunchResult> VerifyAndRecordPunchAsync(
            AttendancePunchRequest request,
            decimal? officeLatitude = null,
            decimal? officeLongitude = null,
            double maxRadiusMeters = 300,
            CancellationToken ct = default);
    }
}
