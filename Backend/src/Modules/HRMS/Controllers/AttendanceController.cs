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
                PunchType = dto.PunchType,
                Timestamp = dto.Timestamp,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                DeviceId = dto.DeviceId,
                Source = dto.Source,
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
                        where attendance.TenantId == tenantId
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
                            Source = attendance.Source
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
                              where attendance.TenantId == tenantId && attendance.Id == id
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
                                  Source = attendance.Source
                              }).FirstOrDefaultAsync();

            return item == null ? NotFound() : Ok(item);
        }
    }
}
