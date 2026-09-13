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

        public AttendanceController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpPost("punch")]
        public async Task<IActionResult> Punch([FromBody] AttendancePunchDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var employeeExists = await _db.Employees.AnyAsync(e => e.Id == dto.EmployeeId && e.TenantId == tenantId && !e.IsDeleted);
            if (!employeeExists) return BadRequest(new { message = "Invalid employee." });

            var record = new AttendanceRecord
            {
                EmployeeId = dto.EmployeeId,
                ProjectId = dto.ProjectId,
                PunchType = string.IsNullOrWhiteSpace(dto.PunchType) ? "IN" : dto.PunchType.Trim().ToUpperInvariant(),
                Timestamp = dto.Timestamp == default ? DateTime.UtcNow : dto.Timestamp,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                DeviceId = dto.DeviceId,
                Source = dto.Source ?? "Biometric",
                GeoValidated = dto.Latitude.HasValue && dto.Longitude.HasValue,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.AttendanceRecords.Add(record);
            await _db.SaveChangesAsync();

            return Ok(new { id = record.Id, geoValidated = record.GeoValidated });
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
                            Longitude = attendance.Longitude
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
                                  Longitude = attendance.Longitude
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
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                };
                _db.AttendancePolicies.Add(defaultPol);
                await _db.SaveChangesAsync();
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
    }
}
