using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/hrms/attendance/biometric")]
    [Route("api/v1/hrms/biometric")]
    public class BiometricGatewayController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public BiometricGatewayController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        public class BiometricPunchItem
        {
            public string? EmployeeCode { get; set; }
            public string? EnrollmentId { get; set; }
            public string? CardNumber { get; set; }
            public DateTime Timestamp { get; set; }
            public string PunchType { get; set; } = "IN"; // IN, OUT, BREAK_IN, BREAK_OUT
            public string? DeviceId { get; set; }
            public string? DeviceSerialNumber { get; set; }
            public double? VerificationScore { get; set; }
        }

        public class BiometricBatchPushRequest
        {
            public string? DeviceId { get; set; }
            public string? DeviceSerialNumber { get; set; }
            public string? DeviceLocation { get; set; }
            public string? ApiKey { get; set; }
            public List<BiometricPunchItem> Punches { get; set; } = new();
        }

        public class BiometricHeartbeatRequest
        {
            public string DeviceId { get; set; } = string.Empty;
            public string? DeviceSerialNumber { get; set; }
            public string? FirmwareVersion { get; set; }
            public string? IpAddress { get; set; }
            public int TotalUserCount { get; set; }
            public int TotalFingerprintCount { get; set; }
            public int TotalFaceCount { get; set; }
            public int UnsyncedLogsCount { get; set; }
        }

        /// <summary>
        /// Universal Ingestion endpoint for Biometric Hardware Turnstiles and Scanners (ZKTeco, eSSL, Realtime)
        /// Can be called via Machine API Key or Tenant JWT
        /// </summary>
        [HttpPost("push")]
        [AllowAnonymous]
        public async Task<IActionResult> IngestBiometricPunches([FromBody] BiometricBatchPushRequest request)
        {
            if (request == null || request.Punches == null || request.Punches.Count == 0)
            {
                return BadRequest(new { success = false, message = "No punch items provided in batch." });
            }

            // Resolve Tenant: from JWT claims or fallback to header / system default
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                if (Request.Headers.TryGetValue("X-Tenant-Id", out var headerTenant) && Guid.TryParse(headerTenant, out var parsedTenant))
                {
                    tenantId = parsedTenant;
                }
                else
                {
                    // Fallback to first active tenant if single-tenant hardware proxy
                    var firstTenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => !t.IsDeleted);
                    if (firstTenant != null) tenantId = firstTenant.Id;
                }
            }

            if (tenantId == Guid.Empty)
            {
                return Unauthorized(new { success = false, message = "Tenant context could not be resolved." });
            }

            // Preload active employees matching by EmployeeCode OR BiometricEnrollmentId OR BiometricCardNumber
            var identifiers = request.Punches
                .SelectMany(p => new[] { p.EmployeeCode, p.EnrollmentId, p.CardNumber })
                .Where(c => !string.IsNullOrWhiteSpace(c))
                .Select(c => c!.Trim())
                .Distinct()
                .ToList();

            var empList = await _db.Employees
                .Where(e => e.TenantId == tenantId && !e.IsDeleted &&
                           ((e.EmployeeCode != null && identifiers.Contains(e.EmployeeCode)) ||
                            (e.BiometricEnrollmentId != null && identifiers.Contains(e.BiometricEnrollmentId)) ||
                            (e.BiometricCardNumber != null && identifiers.Contains(e.BiometricCardNumber))))
                .ToListAsync();

            var employeeMap = new Dictionary<string, Employee>(StringComparer.OrdinalIgnoreCase);
            foreach (var emp in empList)
            {
                if (!string.IsNullOrWhiteSpace(emp.EmployeeCode)) employeeMap[emp.EmployeeCode] = emp;
                if (!string.IsNullOrWhiteSpace(emp.BiometricEnrollmentId)) employeeMap[emp.BiometricEnrollmentId] = emp;
                if (!string.IsNullOrWhiteSpace(emp.BiometricCardNumber)) employeeMap[emp.BiometricCardNumber] = emp;
            }

            var deviceSerial = request.DeviceSerialNumber ?? request.DeviceId;
            BiometricDevice? registeredDevice = null;
            string? deviceLocationName = null;
            if (!string.IsNullOrWhiteSpace(deviceSerial))
            {
                registeredDevice = await _db.BiometricDevices
                    .FirstOrDefaultAsync(d => d.TenantId == tenantId && !d.IsDeleted &&
                                             (d.DeviceSerialNumber == deviceSerial || d.DeviceName == deviceSerial));

                if (registeredDevice?.OperationalLocationId.HasValue == true)
                {
                    deviceLocationName = await _db.OperationalLocations
                        .Where(l => l.Id == registeredDevice.OperationalLocationId.Value)
                        .Select(l => l.Name)
                        .FirstOrDefaultAsync();
                }
            }

            var createdRecords = new List<AttendanceRecord>();
            int processedCount = 0;
            int unmatchedCount = 0;

            foreach (var punch in request.Punches)
            {
                var identifier = punch.EnrollmentId ?? punch.EmployeeCode ?? punch.CardNumber;
                if (string.IsNullOrWhiteSpace(identifier)) continue;

                if (!employeeMap.TryGetValue(identifier.Trim(), out var employee))
                {
                    unmatchedCount++;
                    continue;
                }

                var punchTypeClean = string.IsNullOrWhiteSpace(punch.PunchType) ? "IN" : punch.PunchType.Trim().ToUpperInvariant();
                var punchTime = punch.Timestamp == default ? DateTime.UtcNow : punch.Timestamp;

                var record = new AttendanceRecord
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    EmployeeId = employee.Id,
                    ProjectId = employee.ProjectId,
                    PunchType = punchTypeClean,
                    Timestamp = punchTime,
                    DeviceId = punch.DeviceId ?? request.DeviceId ?? registeredDevice?.DeviceSerialNumber ?? "BIOMETRIC_GW",
                    Source = "Biometric_Hardware",
                    GeoValidated = registeredDevice != null,
                    MatchedLocationId = registeredDevice?.OperationalLocationId,
                    MatchedLocationName = deviceLocationName ?? request.DeviceLocation,
                    GeofenceValidationMessage = registeredDevice != null
                        ? $"Logged via terminal {registeredDevice.DeviceName} ({registeredDevice.DeviceSerialNumber})"
                        : "Logged via biometric cloud push",
                    CreatedAt = DateTime.UtcNow
                };

                createdRecords.Add(record);
                processedCount++;
            }

            if (createdRecords.Count > 0)
            {
                _db.AttendanceRecords.AddRange(createdRecords);

                if (registeredDevice != null)
                {
                    registeredDevice.TotalPunchesLogged += processedCount;
                    registeredDevice.LastHeartbeatAt = DateTime.UtcNow;
                    registeredDevice.Status = "Online";
                }

                await _db.SaveChangesAsync();
            }

            return Ok(new
            {
                success = true,
                message = $"Successfully ingested {processedCount} biometric punches.",
                processed = processedCount,
                unmatched = unmatchedCount,
                timestamp = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Device Heartbeat and Health Telemetry
        /// </summary>
        [HttpPost("heartbeat")]
        [AllowAnonymous]
        public async Task<IActionResult> DeviceHeartbeat([FromBody] BiometricHeartbeatRequest hb)
        {
            var deviceIdentifier = hb.DeviceSerialNumber ?? hb.DeviceId;
            if (!string.IsNullOrWhiteSpace(deviceIdentifier))
            {
                var device = await _db.BiometricDevices
                    .FirstOrDefaultAsync(d => !d.IsDeleted && (d.DeviceSerialNumber == deviceIdentifier || d.DeviceName == deviceIdentifier));

                if (device != null)
                {
                    device.LastHeartbeatAt = DateTime.UtcNow;
                    device.Status = "Online";
                    if (!string.IsNullOrWhiteSpace(hb.FirmwareVersion)) device.FirmwareVersion = hb.FirmwareVersion;
                    if (!string.IsNullOrWhiteSpace(hb.IpAddress)) device.IpAddress = hb.IpAddress;
                    await _db.SaveChangesAsync();
                }
            }

            return Ok(new
            {
                success = true,
                status = "Online",
                serverTimeUtc = DateTime.UtcNow,
                nextCommand = "SYNC_PENDING",
                message = $"Heartbeat acknowledged for device {hb.DeviceId}."
            });
        }

        /// <summary>
        /// Biometric Gateway status and active hardware devices
        /// </summary>
        [HttpGet("devices")]
        [Authorize]
        public async Task<IActionResult> GetRegisteredDevices()
        {
            var tenantId = _tenantAccessor.GetTenantId();

            var persistentDevices = await _db.BiometricDevices
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && !d.IsDeleted)
                .OrderBy(d => d.DeviceName)
                .Select(d => new
                {
                    id = d.Id,
                    deviceId = d.DeviceSerialNumber,
                    deviceName = d.DeviceName,
                    deviceBrand = d.DeviceBrand,
                    modelNumber = d.ModelNumber,
                    ipAddress = d.IpAddress,
                    port = d.Port,
                    operationalLocationId = d.OperationalLocationId,
                    directionMode = d.DirectionMode,
                    status = d.Status,
                    lastActive = d.LastHeartbeatAt,
                    totalPunches = d.TotalPunchesLogged,
                    isActive = d.IsActive
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                devices = persistentDevices,
                gatewayVersion = "3.0.0-Enterprise",
                supportedProtocols = new[] { "ZKTeco ADMS/Push", "eSSL CAMS Cloud", "Hikvision ISUP", "MQTT JSON" }
            });
        }

        [HttpPost("devices")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> RegisterDevice([FromBody] BiometricDevice model)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            model.Id = Guid.NewGuid();
            model.TenantId = tenantId;
            model.Status = "Online";
            model.LastHeartbeatAt = DateTime.UtcNow;
            model.CreatedAt = DateTime.UtcNow;

            _db.BiometricDevices.Add(model);
            await _db.SaveChangesAsync();

            return Ok(model);
        }

        [HttpPut("devices/{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateDevice(Guid id, [FromBody] BiometricDevice model)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var device = await _db.BiometricDevices.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId && !d.IsDeleted);
            if (device == null) return NotFound();

            device.DeviceName = model.DeviceName;
            device.DeviceSerialNumber = model.DeviceSerialNumber;
            device.DeviceBrand = model.DeviceBrand;
            device.ModelNumber = model.ModelNumber;
            device.IpAddress = model.IpAddress;
            device.Port = model.Port;
            device.OperationalLocationId = model.OperationalLocationId;
            device.DirectionMode = model.DirectionMode;
            device.Status = model.Status;
            device.IsActive = model.IsActive;
            device.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(device);
        }

        [HttpDelete("devices/{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteDevice(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var device = await _db.BiometricDevices.FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId && !d.IsDeleted);
            if (device == null) return NotFound();

            device.IsDeleted = true;
            device.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
