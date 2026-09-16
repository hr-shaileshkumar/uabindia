using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/hrms/employees/{employeeId:guid}/postings")]
    [Authorize]
    public class EmployeePostingController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public EmployeePostingController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private Guid TenantId => _tenantAccessor.GetTenantId();

        [HttpGet]
        public async Task<IActionResult> GetEmployeePostings(Guid employeeId)
        {
            var employee = await _db.Employees.AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == employeeId && e.TenantId == TenantId);

            if (employee == null) return NotFound(new { message = "Employee not found." });

            var postings = await _db.EmployeePostingAssignments.AsNoTracking()
                .Where(p => p.EmployeeId == employeeId && p.TenantId == TenantId)
                .OrderByDescending(p => p.EffectiveFrom)
                .ToListAsync();

            // Enrich references
            var locationIds = postings.Where(p => p.OperationalLocationId.HasValue).Select(p => p.OperationalLocationId!.Value).Distinct().ToList();
            var postingUnitIds = postings.Where(p => p.PostingUnitId.HasValue).Select(p => p.PostingUnitId!.Value).Distinct().ToList();
            var clusterIds = postings.Where(p => p.BusinessClusterId.HasValue).Select(p => p.BusinessClusterId!.Value).Distinct().ToList();
            var stateIds = postings.Where(p => p.StateId.HasValue).Select(p => p.StateId!.Value).Distinct().ToList();
            var districtIds = postings.Where(p => p.DistrictId.HasValue).Select(p => p.DistrictId!.Value).Distinct().ToList();

            var locations = await _db.OperationalLocations.Where(l => locationIds.Contains(l.Id)).ToDictionaryAsync(l => l.Id, l => l.Name);
            var units = await _db.PostingUnits.Where(u => postingUnitIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => new { u.Name, TargetType = u.TargetType.ToString() });
            var clusters = await _db.BusinessClusters.Where(c => clusterIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, c => new { c.Name, c.RegionId });

            var regionIds = clusters.Values.Select(v => v.RegionId).Distinct().ToList();
            var regions = await _db.BusinessRegions.Where(r => regionIds.Contains(r.Id)).ToDictionaryAsync(r => r.Id, r => new { r.Name, r.ZoneId });

            var zoneIds = regions.Values.Select(v => v.ZoneId).Distinct().ToList();
            var zones = await _db.BusinessZones.Where(z => zoneIds.Contains(z.Id)).ToDictionaryAsync(z => z.Id, z => z.Name);

            var states = await _db.GeoStates.Where(s => stateIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id, s => s.Name);
            var districts = await _db.GeoDistricts.Where(d => districtIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.Name);

            var result = postings.Select(p =>
            {
                string? clusterName = null;
                string? regionName = null;
                string? zoneName = null;

                if (p.BusinessClusterId.HasValue && clusters.TryGetValue(p.BusinessClusterId.Value, out var cInfo))
                {
                    clusterName = cInfo.Name;
                    if (regions.TryGetValue(cInfo.RegionId, out var rInfo))
                    {
                        regionName = rInfo.Name;
                        if (zones.TryGetValue(rInfo.ZoneId, out var zn))
                        {
                            zoneName = zn;
                        }
                    }
                }

                return new EmployeePostingAssignmentDto
                {
                    Id = p.Id,
                    EmployeeId = p.EmployeeId,
                    EmployeeName = employee.FullName,
                    EmployeeCode = employee.EmployeeCode,
                    ProjectId = p.ProjectId,
                    BusinessClusterId = p.BusinessClusterId,
                    BusinessClusterName = clusterName,
                    BusinessRegionName = regionName,
                    BusinessZoneName = zoneName,
                    OperationalLocationId = p.OperationalLocationId,
                    OperationalLocationName = p.OperationalLocationId.HasValue && locations.TryGetValue(p.OperationalLocationId.Value, out var locName) ? locName : null,
                    PostingUnitId = p.PostingUnitId,
                    PostingUnitName = p.PostingUnitId.HasValue && units.TryGetValue(p.PostingUnitId.Value, out var uInfo) ? uInfo.Name : null,
                    PostingUnitTargetType = p.PostingUnitId.HasValue && units.TryGetValue(p.PostingUnitId.Value, out var utInfo) ? utInfo.TargetType : null,
                    StateId = p.StateId,
                    StateName = p.StateId.HasValue && states.TryGetValue(p.StateId.Value, out var sName) ? sName : null,
                    DistrictId = p.DistrictId,
                    DistrictName = p.DistrictId.HasValue && districts.TryGetValue(p.DistrictId.Value, out var dName) ? dName : null,
                    EffectiveFrom = p.EffectiveFrom,
                    EffectiveTo = p.EffectiveTo,
                    IsPrimary = p.IsPrimary,
                    AssignmentType = p.AssignmentType,
                    Status = p.Status,
                    Remarks = p.Remarks,
                    CreatedAt = p.CreatedAt
                };
            }).ToList();

            var active = result.FirstOrDefault(p => p.IsPrimary && p.Status == "Active" && (!p.EffectiveTo.HasValue || p.EffectiveTo.Value >= DateTime.UtcNow));

            return Ok(new
            {
                employeeId,
                employeeName = employee.FullName,
                activePosting = active,
                history = result,
                total = result.Count
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreatePosting(Guid employeeId, [FromBody] CreatePostingAssignmentRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var employee = await _db.Employees.FirstOrDefaultAsync(e => e.Id == employeeId && e.TenantId == TenantId);
            if (employee == null) return NotFound(new { message = "Employee not found." });

            // If new assignment is primary, close or unmark existing primary assignments
            if (request.IsPrimary)
            {
                var existingPrimaries = await _db.EmployeePostingAssignments
                    .Where(p => p.EmployeeId == employeeId && p.TenantId == TenantId && p.IsPrimary && p.Status == "Active")
                    .ToListAsync();

                foreach (var prev in existingPrimaries)
                {
                    prev.IsPrimary = false;
                    if (!prev.EffectiveTo.HasValue || prev.EffectiveTo.Value > request.EffectiveFrom)
                    {
                        prev.EffectiveTo = request.EffectiveFrom;
                    }
                    prev.UpdatedAt = DateTime.UtcNow;
                }
            }

            var entity = new EmployeePostingAssignment
            {
                TenantId = TenantId,
                EmployeeId = employeeId,
                ProjectId = request.ProjectId ?? employee.ProjectId,
                BusinessClusterId = request.BusinessClusterId,
                OperationalLocationId = request.OperationalLocationId,
                PostingUnitId = request.PostingUnitId,
                StateId = request.StateId,
                DistrictId = request.DistrictId,
                EffectiveFrom = request.EffectiveFrom,
                EffectiveTo = request.EffectiveTo,
                IsPrimary = request.IsPrimary,
                AssignmentType = string.IsNullOrWhiteSpace(request.AssignmentType) ? "Permanent" : request.AssignmentType.Trim(),
                Status = "Active",
                Remarks = request.Remarks?.Trim()
            };

            _db.EmployeePostingAssignments.Add(entity);

            // Backward compatibility sync: update Employee.WorkLocation string if location exists
            if (request.IsPrimary && request.OperationalLocationId.HasValue)
            {
                var loc = await _db.OperationalLocations.FindAsync(request.OperationalLocationId.Value);
                if (loc != null)
                {
                    var unit = request.PostingUnitId.HasValue ? await _db.PostingUnits.FindAsync(request.PostingUnitId.Value) : null;
                    employee.WorkLocation = unit != null ? $"{loc.Name} - {unit.Name}" : loc.Name;
                    employee.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _db.SaveChangesAsync();

            return Ok(new { message = "Posting assignment created successfully.", assignmentId = entity.Id });
        }
    }
}
