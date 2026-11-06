using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class AttendanceVerificationService : IAttendanceVerificationService
    {
        private readonly ApplicationDbContext _db;

        public AttendanceVerificationService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<AttendancePunchResult> VerifyAndRecordPunchAsync(
            AttendancePunchRequest request,
            decimal? officeLatitude = null,
            decimal? officeLongitude = null,
            double maxRadiusMeters = 300,
            CancellationToken ct = default)
        {
            var employee = await _db.Employees.IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => e.Id == request.EmployeeId && e.TenantId == request.TenantId && !e.IsDeleted, ct);

            if (employee == null)
            {
                return new AttendancePunchResult
                {
                    Success = false,
                    ErrorMessage = "Employee record not found in tenant context."
                };
            }

            double distanceMeters = 0;
            bool isWithinFence = true;
            string validationStatus = "GeoValidationBypassed";

            if (officeLatitude.HasValue && officeLongitude.HasValue)
            {
                distanceMeters = CalculateHaversineDistance(
                    (double)request.Latitude,
                    (double)request.Longitude,
                    (double)officeLatitude.Value,
                    (double)officeLongitude.Value);

                isWithinFence = distanceMeters <= maxRadiusMeters;
                validationStatus = isWithinFence ? "VerifiedWithinFence" : "OutOfFenceAnomaly";
            }

            var record = new AttendanceRecord
            {
                TenantId = request.TenantId,
                EmployeeId = request.EmployeeId,
                ProjectId = employee.ProjectId,
                PunchType = string.IsNullOrWhiteSpace(request.PunchType) ? "IN" : request.PunchType.Trim().ToUpperInvariant(),
                Timestamp = DateTime.UtcNow,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                DeviceId = request.DeviceId,
                Source = request.Source ?? "MobileApp",
                GeoValidated = isWithinFence
            };

            _db.AttendanceRecords.Add(record);
            await _db.SaveChangesAsync(ct);

            return new AttendancePunchResult
            {
                Success = true,
                AttendanceId = record.Id,
                EmployeeId = request.EmployeeId,
                PunchType = record.PunchType,
                TimestampUtc = record.Timestamp,
                DistanceFromOfficeMeters = Math.Round(distanceMeters, 2),
                IsWithinGeoFence = isWithinFence,
                ValidationStatus = validationStatus
            };
        }

        private static double CalculateHaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double EarthRadiusMeters = 6371000;
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return EarthRadiusMeters * c;
        }

        private static double ToRadians(double degrees) => degrees * (Math.PI / 180.0);
    }
}
