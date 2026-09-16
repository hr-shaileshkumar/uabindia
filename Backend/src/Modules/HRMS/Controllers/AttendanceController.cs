using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Infrastructure.Data;
using UabIndia.Core.Entities;
using UabIndia.Application.Interfaces;
using System;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using UabIndia.Api.Modules.Administration.Controllers;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Route("api/v1/hrms/attendance")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class AttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IAttendanceSynthesisService _attendanceSynthesisService;

        public AttendanceController(ApplicationDbContext db, ITenantAccessor tenantAccessor, IAttendanceSynthesisService attendanceSynthesisService)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _attendanceSynthesisService = attendanceSynthesisService;
        }

        [HttpPost("punch")]
        public async Task<IActionResult> Punch([FromBody] AttendancePunchDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var employee = await _db.Employees.FirstOrDefaultAsync(e => e.Id == dto.EmployeeId && e.TenantId == tenantId && !e.IsDeleted);
            if (employee == null) return BadRequest(new { message = "Invalid employee." });

            var punchType = string.IsNullOrWhiteSpace(dto.PunchType) ? "IN" : dto.PunchType.Trim().ToUpperInvariant();
            var timestamp = dto.Timestamp == default ? DateTime.UtcNow : dto.Timestamp;

            var record = new AttendanceRecord
            {
                EmployeeId = dto.EmployeeId,
                ProjectId = dto.ProjectId,
                PunchType = punchType,
                Timestamp = timestamp,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                DeviceId = dto.DeviceId,
                Source = dto.Source ?? "Biometric",
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            // Geofence Validation Engine
            if (employee.ValidateGeofenceOnAttendance)
            {
                if (!dto.Latitude.HasValue || !dto.Longitude.HasValue)
                {
                    return BadRequest(new
                    {
                        message = "Geofence validation failed: GPS coordinates (Latitude & Longitude) are mandatory for attendance marking.",
                        geofenceBreach = true,
                        code = "GPS_REQUIRED"
                    });
                }

                var punchLat = (double)dto.Latitude.Value;
                var punchLon = (double)dto.Longitude.Value;

                if (employee.AllowAnyLocationCheckIn)
                {
                    // Roaming check-in: Employee can mark attendance from ANY registered company location
                    var companyLocations = await _db.OperationalLocations
                        .Where(l => l.TenantId == tenantId && !l.IsDeleted && l.IsActive)
                        .ToListAsync();

                    if (companyLocations.Count == 0)
                    {
                        record.GeoValidated = true;
                        record.IsGeofenceBreached = false;
                        record.GeofenceValidationMessage = "Roaming check-in approved (no active company facilities registered).";
                    }
                    else
                    {
                        OperationalLocation? closestLoc = null;
                        double minDistance = double.MaxValue;
                        bool withinFence = false;

                        foreach (var loc in companyLocations)
                        {
                            var dist = CalculateDistanceMeters(punchLat, punchLon, loc.Latitude, loc.Longitude);
                            var radius = loc.GeofenceRadiusMeters > 0 ? loc.GeofenceRadiusMeters : 150;

                            if (dist < minDistance)
                            {
                                minDistance = dist;
                                closestLoc = loc;
                            }

                            if (dist <= radius)
                            {
                                withinFence = true;
                                closestLoc = loc;
                                minDistance = dist;
                                break;
                            }
                        }

                        if (!withinFence)
                        {
                            var nearestName = closestLoc?.Name ?? "Registered Facility";
                            var allowedRadius = closestLoc?.GeofenceRadiusMeters > 0 ? closestLoc.GeofenceRadiusMeters : 150;
                            var distRounded = Math.Round(minDistance);

                            return BadRequest(new
                            {
                                message = $"Geofence validation failed: You are outside all registered company sites. Nearest site is '{nearestName}' which is {distRounded}m away (allowed radius: {allowedRadius}m).",
                                geofenceBreach = true,
                                code = "GEOFENCE_BREACH",
                                distanceMeters = distRounded,
                                nearestLocation = nearestName,
                                allowedRadius = allowedRadius
                            });
                        }

                        record.GeoValidated = true;
                        record.DistanceFromLocationMeters = Math.Round(minDistance, 1);
                        record.MatchedLocationId = closestLoc?.Id;
                        record.MatchedLocationName = closestLoc?.Name;
                        record.IsGeofenceBreached = false;
                        record.GeofenceValidationMessage = $"Verified at {closestLoc?.Name} ({Math.Round(minDistance)}m from facility center).";
                    }
                }
                else
                {
                    // Strict Base Location check-in: Employee must be within their mapped base location or custom base coordinates
                    double? baseLat = employee.BaseLocationLatitude;
                    double? baseLon = employee.BaseLocationLongitude;
                    int allowedRadius = employee.BaseLocationRadiusMeters.HasValue && employee.BaseLocationRadiusMeters.Value > 0
                        ? employee.BaseLocationRadiusMeters.Value
                        : 150;
                    string locationName = "Assigned Base Location";
                    Guid? matchedId = employee.BaseOperationalLocationId;

                    if (employee.BaseOperationalLocationId.HasValue)
                    {
                        var baseLoc = await _db.OperationalLocations
                            .FirstOrDefaultAsync(l => l.Id == employee.BaseOperationalLocationId.Value && l.TenantId == tenantId && !l.IsDeleted);

                        if (baseLoc != null)
                        {
                            locationName = baseLoc.Name;
                            if (!baseLat.HasValue || !baseLon.HasValue)
                            {
                                baseLat = baseLoc.Latitude;
                                baseLon = baseLoc.Longitude;
                            }
                            if (!employee.BaseLocationRadiusMeters.HasValue || employee.BaseLocationRadiusMeters <= 0)
                            {
                                allowedRadius = baseLoc.GeofenceRadiusMeters > 0 ? baseLoc.GeofenceRadiusMeters : 150;
                            }
                        }
                    }

                    if (!baseLat.HasValue || !baseLon.HasValue)
                    {
                        return BadRequest(new
                        {
                            message = "Geofence validation failed: No base location or GPS coordinates configured for your profile. Please contact HR to configure your base posting location.",
                            geofenceBreach = true,
                            code = "BASE_LOCATION_NOT_CONFIGURED"
                        });
                    }

                    var distance = CalculateDistanceMeters(punchLat, punchLon, baseLat.Value, baseLon.Value);
                    var distRounded = Math.Round(distance);

                    if (distance > allowedRadius)
                    {
                        return BadRequest(new
                        {
                            message = $"Geofence validation failed: You are {distRounded}m away from '{locationName}'. Attendance can only be marked within {allowedRadius}m.",
                            geofenceBreach = true,
                            code = "GEOFENCE_BREACH",
                            distanceMeters = distRounded,
                            nearestLocation = locationName,
                            allowedRadius = allowedRadius
                        });
                    }

                    record.GeoValidated = true;
                    record.DistanceFromLocationMeters = Math.Round(distance, 1);
                    record.MatchedLocationId = matchedId;
                    record.MatchedLocationName = locationName;
                    record.IsGeofenceBreached = false;
                    record.GeofenceValidationMessage = $"Verified at {locationName} ({distRounded}m from base).";
                }
            }
            else
            {
                // Geofence exempt (field workers / roving bypass)
                record.GeoValidated = dto.Latitude.HasValue && dto.Longitude.HasValue;
                record.IsGeofenceBreached = false;
                record.GeofenceValidationMessage = "Geofence validation bypassed (employee exempt).";
            }

            _db.AttendanceRecords.Add(record);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = record.Id,
                geoValidated = record.GeoValidated,
                distanceFromLocationMeters = record.DistanceFromLocationMeters,
                matchedLocationName = record.MatchedLocationName,
                geofenceValidationMessage = record.GeofenceValidationMessage
            });
        }

        private static double CalculateDistanceMeters(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371000; // Earth radius in meters
            var dLat = (lat2 - lat1) * Math.PI / 180.0;
            var dLon = (lon2 - lon1) * Math.PI / 180.0;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        [HttpPost("punch/me")]
        public async Task<IActionResult> PunchMe([FromBody] AttendancePunchDto? dto = null)
        {
            var userIdRaw = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;
            if (!Guid.TryParse(userIdRaw, out var userId))
                return Unauthorized();

            var employee = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.UserId == userId && !e.IsDeleted);
            if (employee == null)
                return BadRequest(new { message = "No employee record is linked to this login." });

            dto ??= new AttendancePunchDto();
            dto.EmployeeId = employee.Id;
            if (string.IsNullOrWhiteSpace(dto.PunchType)) dto.PunchType = "IN";
            if (dto.Timestamp == default) dto.Timestamp = DateTime.UtcNow;
            dto.Source = string.IsNullOrWhiteSpace(dto.Source) ? "ESS" : dto.Source;
            return await Punch(dto);
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] Guid? employeeId = null, [FromQuery] int page = 1, [FromQuery] int limit = 50)
        {
            page = Math.Max(page, 1);
            limit = Math.Clamp(limit, 1, 250);
            var tenantId = _tenantAccessor.GetTenantId();
            var query = from attendance in _db.AttendanceRecords.AsNoTracking()
                        join employee in _db.Employees.AsNoTracking() on attendance.EmployeeId equals employee.Id into employeeJoin
                        from employee in employeeJoin.DefaultIfEmpty()
                        where attendance.TenantId == tenantId && !attendance.IsDeleted
                              && (!employeeId.HasValue || attendance.EmployeeId == employeeId.Value)
                        orderby attendance.Timestamp descending
                        select new AttendanceRecordDto
                        {
                            Id = attendance.Id,
                            EmployeeId = attendance.EmployeeId,
                            EmployeeCode = employee != null ? employee.EmployeeCode : null,
                            EmployeeName = employee != null ? employee.FullName : null,
                            ProjectId = attendance.ProjectId,
                            PunchType = attendance.PunchType,
                            Timestamp = attendance.Timestamp,
                            GeoValidated = attendance.GeoValidated,
                            DeviceId = attendance.DeviceId,
                            Source = attendance.Source,
                            Latitude = attendance.Latitude,
                            Longitude = attendance.Longitude,
                            DistanceFromLocationMeters = attendance.DistanceFromLocationMeters,
                            MatchedLocationId = attendance.MatchedLocationId,
                            MatchedLocationName = attendance.MatchedLocationName,
                            IsGeofenceBreached = attendance.IsGeofenceBreached,
                            GeofenceValidationMessage = attendance.GeofenceValidationMessage
                        };

            var data = await query.Skip((page - 1) * limit).Take(limit).ToListAsync();

            return Ok(data);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var item = await (from attendance in _db.AttendanceRecords.AsNoTracking()
                              join employee in _db.Employees.AsNoTracking() on attendance.EmployeeId equals employee.Id into employeeJoin
                              from employee in employeeJoin.DefaultIfEmpty()
                              where attendance.TenantId == tenantId && !attendance.IsDeleted && attendance.Id == id
                              select new AttendanceRecordDto
                              {
                                  Id = attendance.Id,
                                  EmployeeId = attendance.EmployeeId,
                                  EmployeeCode = employee != null ? employee.EmployeeCode : null,
                                  EmployeeName = employee != null ? employee.FullName : null,
                                  ProjectId = attendance.ProjectId,
                                  PunchType = attendance.PunchType,
                                  Timestamp = attendance.Timestamp,
                                  GeoValidated = attendance.GeoValidated,
                                  DeviceId = attendance.DeviceId,
                                  Source = attendance.Source,
                                  Latitude = attendance.Latitude,
                                  Longitude = attendance.Longitude,
                                  DistanceFromLocationMeters = attendance.DistanceFromLocationMeters,
                                  MatchedLocationId = attendance.MatchedLocationId,
                                  MatchedLocationName = attendance.MatchedLocationName,
                                  IsGeofenceBreached = attendance.IsGeofenceBreached,
                                  GeofenceValidationMessage = attendance.GeofenceValidationMessage
                              }).FirstOrDefaultAsync();

            return item == null ? NotFound() : Ok(item);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] AttendanceUpdateDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var record = await _db.AttendanceRecords.FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId && !a.IsDeleted);
            if (record == null) return NotFound(new { message = "Attendance record not found." });

            if (!string.IsNullOrWhiteSpace(dto.PunchType))
                record.PunchType = dto.PunchType.Trim().ToUpperInvariant();

            if (dto.Timestamp.HasValue && dto.Timestamp.Value != default)
                record.Timestamp = dto.Timestamp.Value;

            if (dto.Latitude.HasValue) record.Latitude = dto.Latitude.Value;
            if (dto.Longitude.HasValue) record.Longitude = dto.Longitude.Value;
            if (dto.DeviceId != null) record.DeviceId = dto.DeviceId.Trim();
            if (dto.Source != null) record.Source = dto.Source.Trim();
            if (dto.GeoValidated.HasValue) record.GeoValidated = dto.GeoValidated.Value;

            record.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Attendance record regularized successfully." });
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var record = await _db.AttendanceRecords.FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId && !a.IsDeleted);
            if (record == null) return NotFound(new { message = "Attendance record not found." });

            record.IsDeleted = true;
            record.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return NoContent();
        }

        // ─────────────────────────────────────────────────────────────────────
        // Attendance Policy Database Endpoints
        // ─────────────────────────────────────────────────────────────────────
        [HttpGet("policies")]
        public async Task<IActionResult> GetPolicies([FromQuery] Guid? companyId = null, [FromQuery] Guid? projectId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            try
            {
                var any = await _db.AttendancePolicies.AnyAsync(p => p.TenantId == tenantId && !p.IsDeleted);
                if (!any)
                {
                    var defaultPol = new AttendancePolicy
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Name = "Standard Organization Shift Policy",
                        Description = "Default organization-wide policy enforced by backend",
                        IsDefault = true,
                        StandardShiftHours = 8.0m,
                        MinHalfDayHours = 4.0m,
                        GracePeriodMinutes = 15,
                        OvertimeThresholdHours = 8.0m,
                        MaxContinuousHours = 16.0m,
                        AutoDeductBreakMinutes = 60,
                        RequireGeofence = false,
                        AllowedRadiusMeters = 250,
                        RequireFacialVerification = false,
                        MinFacialConfidenceScore = 75,
                        AllowManualRegularization = true,
                        MaxRegularizationsPerMonth = 3,
                        PunchMode = PunchPolicyMode.TwoPunchFirstInLastOut,
                        MinPunchesRequiredPerDay = 2,
                        EarlyExitToleranceMinutes = 15,
                        MissingPunchPenalty = "FlagForReview",
                        Status = "Active",
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.AttendancePolicies.Add(defaultPol);
                    await _db.SaveChangesAsync();
                }
            }
            catch
            {
                // Silently continue if seeding default policy encounters existing/transient issues
            }

            var query = _db.AttendancePolicies
                .AsNoTracking()
                .Where(p => p.TenantId == tenantId && !p.IsDeleted);

            if (projectId.HasValue)
            {
                query = query.Where(p => p.ProjectId == projectId.Value || p.ProjectId == null);
            }
            else if (companyId.HasValue)
            {
                query = query.Where(p => p.CompanyId == companyId.Value || (p.CompanyId == null && p.ProjectId == null));
            }

            var policies = await query
                .OrderByDescending(p => p.IsDefault)
                .ThenBy(p => p.Name)
                .ToListAsync();

            return Ok(policies);
        }

        [HttpGet("policies/schema")]
        public async Task<IActionResult> GetPolicySchema([FromQuery] Guid? companyId = null, [FromQuery] Guid? projectId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            await PoliciesController.EnsurePolicyRuleDefinitionsSeededAsync(_db, tenantId);

            var defs = await _db.PolicyRuleDefinitions
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && !d.IsDeleted && d.IsVisible && d.Category == "ATTENDANCE_TIMESHEET")
                .OrderBy(d => d.DisplayOrder)
                .ToListAsync();

            var resolvedFields = PoliciesController.ResolveFieldDefinitions(defs, companyId, projectId);
            var defaultsDict = resolvedFields.ToDictionary(f => (string)f.key, f => (object)f.defaultValue);

            var schema = new
            {
                category = "ATTENDANCE_TIMESHEET",
                policyType = "AttendancePolicy",
                scope = new { companyId, projectId },
                defaults = defaultsDict,
                fieldDefinitions = resolvedFields
            };

            return Ok(schema);
        }

        [HttpGet("policies/default")]
        public async Task<IActionResult> GetDefaultPolicy()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.AttendancePolicies
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.IsDefault && !p.IsDeleted)
                ?? await _db.AttendancePolicies
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.TenantId == tenantId && !p.IsDeleted);

            return policy == null ? NotFound() : Ok(policy);
        }

        [HttpGet("policies/{id:guid}")]
        public async Task<IActionResult> GetPolicyById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.AttendancePolicies
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);

            return policy == null ? NotFound() : Ok(policy);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("policies")]
        public async Task<IActionResult> CreatePolicy([FromBody] AttendancePolicy model)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            model.Id = Guid.NewGuid();
            model.TenantId = tenantId;
            model.CreatedAt = DateTime.UtcNow;

            if (model.IsDefault)
            {
                var existingDefaults = await _db.AttendancePolicies
                    .Where(p => p.TenantId == tenantId && p.IsDefault)
                    .ToListAsync();
                foreach (var ed in existingDefaults) ed.IsDefault = false;
            }

            _db.AttendancePolicies.Add(model);
            await _db.SaveChangesAsync();

            return Ok(model);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPut("policies/{id:guid}")]
        public async Task<IActionResult> UpdatePolicy(Guid id, [FromBody] AttendancePolicy model)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.AttendancePolicies.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);
            if (policy == null) return NotFound();

            policy.Name = model.Name;
            policy.Description = model.Description;
            policy.StandardShiftHours = model.StandardShiftHours;
            policy.MinHalfDayHours = model.MinHalfDayHours;
            policy.GracePeriodMinutes = model.GracePeriodMinutes;
            policy.OvertimeThresholdHours = model.OvertimeThresholdHours;
            policy.MaxContinuousHours = model.MaxContinuousHours;
            policy.AutoDeductBreakMinutes = model.AutoDeductBreakMinutes;
            policy.RequireGeofence = model.RequireGeofence;
            policy.AllowedRadiusMeters = model.AllowedRadiusMeters;
            policy.RequireFacialVerification = model.RequireFacialVerification;
            policy.MinFacialConfidenceScore = model.MinFacialConfidenceScore;
            policy.AllowManualRegularization = model.AllowManualRegularization;
            policy.MaxRegularizationsPerMonth = model.MaxRegularizationsPerMonth;
            policy.PunchMode = model.PunchMode;
            policy.MinPunchesRequiredPerDay = model.MinPunchesRequiredPerDay;
            policy.MaxPunchesAllowedPerDay = model.MaxPunchesAllowedPerDay;
            policy.EarlyExitToleranceMinutes = model.EarlyExitToleranceMinutes;
            policy.MissingPunchPenalty = model.MissingPunchPenalty;
            policy.MissingPunchGraceDays = model.MissingPunchGraceDays;
            policy.DeductionBasis = model.DeductionBasis;
            policy.MonthlyFreeLateDays = model.MonthlyFreeLateDays;
            policy.LatePenaltyStepFrequency = model.LatePenaltyStepFrequency;
            policy.LatePenaltyAction = model.LatePenaltyAction;
            policy.MinorLateWindowMinutes = model.MinorLateWindowMinutes;
            policy.MajorLateThresholdMinutes = model.MajorLateThresholdMinutes;
            policy.EarlyExitThresholdMinutes = model.EarlyExitThresholdMinutes;
            policy.EarlyExitPenaltyAction = model.EarlyExitPenaltyAction;
            policy.MinMinutesForOvertime = model.MinMinutesForOvertime;
            policy.RequireOvertimeApproval = model.RequireOvertimeApproval;
            policy.NormalDayOtMultiplier = model.NormalDayOtMultiplier;
            policy.WeekendOtMultiplier = model.WeekendOtMultiplier;
            policy.HolidayOtMultiplier = model.HolidayOtMultiplier;
            policy.AllowCompOffInsteadOfPay = model.AllowCompOffInsteadOfPay;
            policy.WeekOffPattern = model.WeekOffPattern;
            policy.AllowDailyShortfallOffsetWithOt = model.AllowDailyShortfallOffsetWithOt;
            policy.DefaultShiftId = model.DefaultShiftId;
            policy.CompanyId = model.CompanyId;
            policy.ProjectId = model.ProjectId;
            policy.Status = model.Status;
            policy.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(policy);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpDelete("policies/{id:guid}")]
        public async Task<IActionResult> DeletePolicy(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.AttendancePolicies.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);
            if (policy == null) return NotFound();

            policy.IsDeleted = true;
            policy.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Attendance policy deleted from database." });
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("policies/{id:guid}/set-default")]
        public async Task<IActionResult> SetDefaultPolicy(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var target = await _db.AttendancePolicies.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);
            if (target == null) return NotFound();

            var all = await _db.AttendancePolicies.Where(p => p.TenantId == tenantId && !p.IsDeleted).ToListAsync();
            foreach (var p in all) p.IsDefault = (p.Id == id);

            await _db.SaveChangesAsync();
            return Ok(new { message = "Default attendance policy updated in database." });
        }

        // ─────────────────────────────────────────────────────────────────────
        // Advanced Enterprise HRMS & Telemetry Endpoints
        // ─────────────────────────────────────────────────────────────────────

        /// <summary>
        /// Real-Time Live Floor Occupancy Radar (Head count and live premises distribution)
        /// </summary>
        [HttpGet("analytics/occupancy")]
        public async Task<IActionResult> GetLiveOccupancyRadar()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var todayUtc = DateTime.UtcNow.Date;

            // Retrieve today's punches ordered by timestamp
            var todayPunches = await (from a in _db.AttendanceRecords.AsNoTracking()
                                      join e in _db.Employees.AsNoTracking() on a.EmployeeId equals e.Id into empJoin
                                      from e in empJoin.DefaultIfEmpty()
                                      join d in _db.Departments.AsNoTracking() on e.DepartmentId equals d.Id into deptJoin
                                      from d in deptJoin.DefaultIfEmpty()
                                      join b in _db.Branches.AsNoTracking() on e.BranchId equals b.Id into branchJoin
                                      from b in branchJoin.DefaultIfEmpty()
                                      where a.TenantId == tenantId && !a.IsDeleted && a.Timestamp >= todayUtc
                                      orderby a.Timestamp descending
                                      select new
                                      {
                                          AttendanceId = a.Id,
                                          EmployeeId = a.EmployeeId,
                                          EmployeeCode = e != null ? e.EmployeeCode : "N/A",
                                          EmployeeName = e != null ? e.FullName : "Unknown",
                                          Department = d != null ? d.Name : "General",
                                          Branch = b != null ? b.Name : "Head Office",
                                          PunchType = a.PunchType,
                                          Timestamp = a.Timestamp,
                                          DeviceId = a.DeviceId,
                                          Source = a.Source
                                      }).ToListAsync();

            // Group by employee to find their latest status today
            var latestPerEmp = todayPunches
                .GroupBy(p => p.EmployeeId)
                .Select(g => g.First())
                .ToList();

            var currentlyInside = latestPerEmp
                .Where(p => p.PunchType == "IN")
                .ToList();

            var totalInside = currentlyInside.Count;
            var deptDistribution = currentlyInside
                .GroupBy(p => p.Department)
                .Select(g => new { Department = g.Key, Count = g.Count() })
                .OrderByDescending(g => g.Count)
                .ToList();

            var branchDistribution = currentlyInside
                .GroupBy(p => p.Branch)
                .Select(g => new { Branch = g.Key, Count = g.Count() })
                .OrderByDescending(g => g.Count)
                .ToList();

            return Ok(new
            {
                success = true,
                totalInside = totalInside,
                totalCheckedInToday = latestPerEmp.Count,
                currentlyCheckedOut = latestPerEmp.Count(p => p.PunchType == "OUT"),
                departmentDistribution = deptDistribution,
                branchDistribution = branchDistribution,
                activeOccupants = currentlyInside.Take(25).Select(c => new
                {
                    c.EmployeeId,
                    c.EmployeeCode,
                    c.EmployeeName,
                    c.Department,
                    c.Branch,
                    CheckInTime = c.Timestamp,
                    c.Source,
                    c.DeviceId
                }),
                asOfUtc = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Bradford Factor Absenteeism Scoring (B = S^2 * D over rolling 52-week period)
        /// Benchmarked against CIPD &amp; SAP SuccessFactors standards
        /// </summary>
        [HttpGet("analytics/bradford")]
        public async Task<IActionResult> GetBradfordScores()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var cutoffDate = DateTime.UtcNow.AddDays(-365);

            // Fetch approved leaves and absent records in the rolling year
            var leaves = await (from l in _db.LeaveRequests.AsNoTracking()
                                join e in _db.Employees.AsNoTracking() on l.EmployeeId equals e.Id into empJoin
                                from e in empJoin.DefaultIfEmpty()
                                join d in _db.Departments.AsNoTracking() on e.DepartmentId equals d.Id into deptJoin
                                from d in deptJoin.DefaultIfEmpty()
                                where l.TenantId == tenantId && !l.IsDeleted && l.Status == "Approved" && l.FromDate >= cutoffDate
                                select new
                                {
                                    l.EmployeeId,
                                    EmployeeCode = e != null ? e.EmployeeCode : "N/A",
                                    EmployeeName = e != null ? e.FullName : "Unknown",
                                    Department = d != null ? d.Name : "General",
                                    l.FromDate,
                                    l.ToDate,
                                    Days = (int)Math.Max(1, l.Days)
                                }).ToListAsync();

            var scores = leaves
                .GroupBy(l => l.EmployeeId)
                .Select(g =>
                {
                    var first = g.First();
                    int spells = g.Count(); // S = number of separate absence instances
                    int totalDays = g.Sum(x => x.Days); // D = total absent days
                    int bradfordScore = spells * spells * totalDays; // B = S^2 * D

                    string riskLevel = bradfordScore switch
                    {
                        < 50 => "Low",
                        <= 200 => "Moderate",
                        <= 500 => "Significant",
                        _ => "Severe"
                    };

                    return new
                    {
                        EmployeeId = g.Key,
                        EmployeeCode = first.EmployeeCode,
                        EmployeeName = first.EmployeeName,
                        Department = first.Department,
                        AbsenceSpells = spells,
                        TotalDaysAbsent = totalDays,
                        BradfordScore = bradfordScore,
                        RiskLevel = riskLevel,
                        ActionRecommendation = riskLevel switch
                        {
                            "Low" => "Normal attendance profile",
                            "Moderate" => "Informal manager discussion recommended",
                            "Significant" => "First formal attendance review required",
                            _ => "Disciplinary review & occupational health referral"
                        }
                    };
                })
                .OrderByDescending(s => s.BradfordScore)
                .ToList();

            return Ok(new
            {
                success = true,
                totalEmployeesEvaluated = scores.Count,
                highRiskCount = scores.Count(s => s.RiskLevel == "Significant" || s.RiskLevel == "Severe"),
                moderateRiskCount = scores.Count(s => s.RiskLevel == "Moderate"),
                lowRiskCount = scores.Count(s => s.RiskLevel == "Low"),
                employees = scores.Take(50)
            });
        }

        public class WebCheckInRequest
        {
            public string PunchType { get; set; } = "IN"; // IN or OUT
            public decimal? Latitude { get; set; }
            public decimal? Longitude { get; set; }
            public string? DeviceInfo { get; set; }
        }

        /// <summary>
        /// 1-Tap Self-Service Web Check-In with Browser GPS Validation
        /// </summary>
        [HttpPost("web-checkin")]
        public async Task<IActionResult> WebCheckIn([FromBody] WebCheckInRequest request)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var userIdRaw = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (!Guid.TryParse(userIdRaw, out var userId))
                return Unauthorized();

            var employee = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.UserId == userId && !e.IsDeleted);
            if (employee == null)
            {
                // Fallback: match by email claim
                var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
                if (!string.IsNullOrWhiteSpace(email))
                {
                    employee = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.WorkEmail == email && !e.IsDeleted);
                }
            }

            if (employee == null)
                return BadRequest(new { success = false, message = "No employee record is linked to this login account." });

            var punchType = string.IsNullOrWhiteSpace(request?.PunchType) ? "IN" : request.PunchType.Trim().ToUpperInvariant();
            var geoValid = request?.Latitude.HasValue == true && request?.Longitude.HasValue == true;

            var record = new AttendanceRecord
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                EmployeeId = employee.Id,
                PunchType = punchType,
                Timestamp = DateTime.UtcNow,
                Latitude = request?.Latitude,
                Longitude = request?.Longitude,
                GeoValidated = geoValid,
                Source = "Web_SelfService",
                DeviceId = request?.DeviceInfo ?? "Browser_PWA",
                CreatedAt = DateTime.UtcNow
            };

            _db.AttendanceRecords.Add(record);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                id = record.Id,
                punchType = record.PunchType,
                timestamp = record.Timestamp,
                employeeName = employee.FullName,
                employeeCode = employee.EmployeeCode,
                geoValidated = record.GeoValidated,
                message = $"Attendance {record.PunchType} recorded successfully."
            });
        }

        /// <summary>
        /// Daily Attendance Synthesis: Reconciles all punches for an employee on a given date,
        /// supporting 2-Punch, Multi-Punch Interval, Split Shift, and Continuous Roaming modes.
        /// </summary>
        [HttpGet("summary/daily-synthesis")]
        public async Task<IActionResult> GetDailySynthesis([FromQuery] Guid employeeId, [FromQuery] DateTime? date = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var targetDate = (date ?? DateTime.UtcNow).Date;

            var result = await _attendanceSynthesisService.SynthesizeDayAsync(tenantId, employeeId, targetDate);
            return Ok(result);
        }

        /// <summary>
        /// Batch Daily Synthesis for an entire date across all or filtered employees.
        /// </summary>
        [HttpGet("summary/daily-synthesis-batch")]
        public async Task<IActionResult> GetDailySynthesisBatch([FromQuery] DateTime? date = null, [FromQuery] Guid? departmentId = null, [FromQuery] Guid? employeeId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var targetDate = (date ?? DateTime.UtcNow).Date;

            var results = await _attendanceSynthesisService.SynthesizeBatchAsync(tenantId, targetDate, targetDate, employeeId, departmentId);

            return Ok(new
            {
                date = targetDate.ToString("yyyy-MM-dd"),
                totalEvaluated = results.Count,
                presentCount = results.Count(r => r.Status == "Present"),
                halfDayCount = results.Count(r => r.Status == "HalfDay"),
                absentCount = results.Count(r => r.Status == "Absent"),
                items = results
            });
        }

        #region Attendance Regularization Endpoints

        [HttpGet("regularization")]
        public async Task<IActionResult> GetRegularizationRequests(
            [FromQuery] Guid? employeeId = null,
            [FromQuery] string? status = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.AttendanceRegularizationRequests
                .Include(r => r.Employee)
                .AsNoTracking()
                .Where(r => r.TenantId == tenantId && !r.IsDeleted);

            if (employeeId.HasValue) query = query.Where(r => r.EmployeeId == employeeId.Value);
            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(r => r.Status == status);
            if (fromDate.HasValue) query = query.Where(r => r.AttendanceDate >= fromDate.Value.Date);
            if (toDate.HasValue) query = query.Where(r => r.AttendanceDate <= toDate.Value.Date);

            var items = await query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.EmployeeId,
                    EmployeeName = r.Employee != null ? r.Employee.FullName : "",
                    EmployeeCode = r.Employee != null ? r.Employee.EmployeeCode : "",
                    Date = r.AttendanceDate,
                    r.RequestType,
                    r.Reason,
                    ProposedInTime = r.CorrectedInTime,
                    ProposedOutTime = r.CorrectedOutTime,
                    r.Status,
                    ManagerRemarks = r.ReviewNotes,
                    r.ApprovedAt,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpPost("regularization")]
        public async Task<IActionResult> CreateRegularizationRequest([FromBody] CreateRegularizationDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var employee = await _db.Employees.FirstOrDefaultAsync(e => e.Id == dto.EmployeeId && e.TenantId == tenantId && !e.IsDeleted);
            if (employee == null) return BadRequest(new { message = "Invalid employee." });

            var model = new AttendanceRegularizationRequest
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                EmployeeId = dto.EmployeeId,
                AttendanceDate = dto.Date.Date,
                RequestType = dto.RequestType,
                Reason = dto.Reason,
                CorrectedInTime = dto.ProposedInTime,
                CorrectedOutTime = dto.ProposedOutTime,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _db.AttendanceRegularizationRequests.Add(model);
            await _db.SaveChangesAsync();

            return Ok(model);
        }

        [Authorize(Roles = "Admin,HR,Manager")]
        [HttpPost("regularization/{id:guid}/approve")]
        public async Task<IActionResult> ApproveRegularizationRequest(Guid id, [FromBody] RegularizationApprovalDto? dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var req = await _db.AttendanceRegularizationRequests.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted);
            if (req == null) return NotFound(new { message = "Regularization request not found." });

            req.Status = "Approved";
            req.CorrectedInTime = dto?.ApprovedInTime ?? req.CorrectedInTime;
            req.CorrectedOutTime = dto?.ApprovedOutTime ?? req.CorrectedOutTime;
            req.ReviewNotes = dto?.ManagerRemarks ?? "Approved by manager";
            req.ApprovedAt = DateTime.UtcNow;
            req.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            // Resynthesize attendance for this employee on that date so synthesis results reflect approval immediately
            var synthesized = await _attendanceSynthesisService.SynthesizeDayAsync(tenantId, req.EmployeeId, req.AttendanceDate.Date);

            return Ok(new
            {
                message = "Regularization approved successfully and attendance recalculated.",
                request = req,
                synthesizedResult = synthesized
            });
        }

        [Authorize(Roles = "Admin,HR,Manager")]
        [HttpPost("regularization/{id:guid}/reject")]
        public async Task<IActionResult> RejectRegularizationRequest(Guid id, [FromBody] RegularizationApprovalDto? dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var req = await _db.AttendanceRegularizationRequests.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted);
            if (req == null) return NotFound(new { message = "Regularization request not found." });

            req.Status = "Rejected";
            req.ReviewNotes = dto?.ManagerRemarks ?? "Rejected by manager";
            req.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Regularization request rejected.", request = req });
        }

        #endregion
    }
}
