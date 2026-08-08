using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Authorization;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Route("api/v1/hrms/leave")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class LeaveController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public LeaveController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        // Leave Types
        [HttpGet("types")]
        public async Task<IActionResult> GetLeaveTypes()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var data = await _db.LeaveTypes
                .AsNoTracking()
                .Where(t => t.TenantId == tenantId && t.IsActive)
                .OrderBy(t => t.DisplayOrder)
                .ThenBy(t => t.Name)
                .Select(t => new LeaveTypeDto
                {
                    Id = t.Id,
                    Code = t.Code,
                    Name = t.Name,
                    Description = t.Description,
                    IsActive = t.IsActive,
                    DisplayOrder = t.DisplayOrder
                })
                .ToListAsync();

            return Ok(data);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("types")]
        public async Task<IActionResult> CreateLeaveType([FromBody] CreateLeaveTypeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var leaveType = new LeaveType
            {
                Code = dto.Code,
                Name = dto.Name,
                Description = dto.Description,
                IsActive = dto.IsActive,
                DisplayOrder = dto.DisplayOrder,
                TenantId = _tenantAccessor.GetTenantId()
            };

            _db.LeaveTypes.Add(leaveType);
            await _db.SaveChangesAsync();

            return Ok(new LeaveTypeDto
            {
                Id = leaveType.Id,
                Code = leaveType.Code,
                Name = leaveType.Name,
                Description = leaveType.Description,
                IsActive = leaveType.IsActive,
                DisplayOrder = leaveType.DisplayOrder
            });
        }

        [HttpGet("policies")]
        public async Task<IActionResult> GetPolicies()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var data = await _db.LeavePolicies
                .AsNoTracking()
                .Where(p => p.TenantId == tenantId)
                .Select(p => new LeavePolicyDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Type = p.Type,
                    EntitlementPerYear = p.EntitlementPerYear,
                    CarryForwardAllowed = p.CarryForwardAllowed,
                    MaxCarryForward = p.MaxCarryForward,
                    AllocationFrequency = p.AllocationFrequency.ToString(),
                    EnableProration = p.EnableProration,
                    AutoAllocate = p.AutoAllocate
                })
                .ToListAsync();

            return Ok(data);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("policies")]
        public async Task<IActionResult> CreatePolicy([FromBody] CreateLeavePolicyDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var policy = new LeavePolicy
            {
                Name = dto.Name,
                Type = dto.Type,
                EntitlementPerYear = dto.EntitlementPerYear,
                CarryForwardAllowed = dto.CarryForwardAllowed,
                MaxCarryForward = dto.MaxCarryForward,
                AllocationFrequency = Enum.Parse<AllocationFrequency>(dto.AllocationFrequency),
                EnableProration = dto.EnableProration,
                AutoAllocate = dto.AutoAllocate,
                TenantId = _tenantAccessor.GetTenantId()
            };

            _db.LeavePolicies.Add(policy);
            await _db.SaveChangesAsync();

            return Ok(new LeavePolicyDto
            {
                Id = policy.Id,
                Name = policy.Name,
                Type = policy.Type,
                EntitlementPerYear = policy.EntitlementPerYear,
                CarryForwardAllowed = policy.CarryForwardAllowed,
                MaxCarryForward = policy.MaxCarryForward,
                AllocationFrequency = policy.AllocationFrequency.ToString(),
                EnableProration = policy.EnableProration,
                AutoAllocate = policy.AutoAllocate
            });
        }

        [HttpGet("policies/{policyId:guid}/rules")]
        public async Task<IActionResult> GetPolicyRules(Guid policyId)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policyExists = await _db.LeavePolicies.AnyAsync(p => p.Id == policyId && p.TenantId == tenantId);
            if (!policyExists) return NotFound(new { message = "Policy not found." });

            var data = await _db.LeavePolicyRules
                .AsNoTracking()
                .Where(r => r.LeavePolicyId == policyId)
                .Select(r => new LeavePolicyRuleDto
                {
                    Id = r.Id,
                    LeavePolicyId = r.LeavePolicyId,
                    ApplicableGender = r.ApplicableGender,
                    EmploymentType = r.EmploymentType,
                    Encashable = r.Encashable,
                    CarryForwardAllowed = r.CarryForwardAllowed,
                    MaxCarryForward = r.MaxCarryForward
                })
                .ToListAsync();

            return Ok(data);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("policies/{policyId:guid}/rules")]
        public async Task<IActionResult> CreatePolicyRule(Guid policyId, [FromBody] CreateLeavePolicyRuleDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var policyExists = await _db.LeavePolicies.AnyAsync(p => p.Id == policyId && p.TenantId == tenantId);
            if (!policyExists) return NotFound(new { message = "Policy not found." });

            var rule = new LeavePolicyRule
            {
                LeavePolicyId = policyId,
                ApplicableGender = dto.ApplicableGender,
                EmploymentType = dto.EmploymentType,
                Encashable = dto.Encashable,
                CarryForwardAllowed = dto.CarryForwardAllowed,
                MaxCarryForward = dto.MaxCarryForward,
                TenantId = tenantId
            };

            _db.LeavePolicyRules.Add(rule);
            await _db.SaveChangesAsync();

            return Ok(new LeavePolicyRuleDto
            {
                Id = rule.Id,
                LeavePolicyId = rule.LeavePolicyId,
                ApplicableGender = rule.ApplicableGender,
                EmploymentType = rule.EmploymentType,
                Encashable = rule.Encashable,
                CarryForwardAllowed = rule.CarryForwardAllowed,
                MaxCarryForward = rule.MaxCarryForward
            });
        }

        [HttpGet("requests")]
        public async Task<IActionResult> GetRequests([FromQuery] int page = 1, [FromQuery] int limit = 50)
        {
            if (page < 1) page = 1;
            if (limit < 1 || limit > 200) limit = 50;

            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.LeaveRequests
                .AsNoTracking()
                .Where(r => r.TenantId == tenantId);

            var total = await query.CountAsync();
            var requests = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            var mapped = await MapLeaveRequestsAsync(requests, tenantId);
            return Ok(new { requests = mapped, total, page, limit });
        }

        [HttpGet("requests/{id:guid}")]
        public async Task<IActionResult> GetRequestById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var request = await _db.LeaveRequests
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId);

            if (request == null)
            {
                return NotFound();
            }

            return Ok(await MapLeaveRequestAsync(request, tenantId));
        }

        [HttpGet("approvals")]
        public async Task<IActionResult> GetApprovals([FromQuery] string status = "Pending")
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var requests = await _db.LeaveRequests
                .AsNoTracking()
                .Where(r => r.TenantId == tenantId && r.Status == status)
                .ToListAsync();

            return Ok(await MapLeaveRequestsAsync(requests, tenantId));
        }

        [HttpGet("balances")]
        public async Task<IActionResult> GetBalances([FromQuery] Guid? employeeId)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.EmployeeLeaves
                .AsNoTracking()
                .Where(b => b.TenantId == tenantId);

            if (employeeId.HasValue)
            {
                query = query.Where(b => b.EmployeeId == employeeId.Value);
            }

            var data = await query
                .Select(b => new LeaveBalanceDto
                {
                    Id = b.Id,
                    EmployeeId = b.EmployeeId,
                    LeavePolicyId = b.LeavePolicyId,
                    Year = b.Year,
                    Entitled = b.Entitled,
                    Taken = b.Taken,
                    Balance = b.Balance
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("holidays")]
        public async Task<IActionResult> GetHolidays([FromQuery] int? year)
        {
            var query = _db.Holidays.AsNoTracking();
            if (year.HasValue)
            {
                query = query.Where(h => h.Date.Year == year.Value);
            }

            var data = await query
                .Select(h => new HolidayDto
                {
                    Id = h.Id,
                    Name = h.Name,
                    Date = h.Date,
                    Type = h.Type,
                    IsOptional = h.IsOptional,
                    Description = h.Description
                })
                .ToListAsync();

            return Ok(data);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("holidays")]
        public async Task<IActionResult> CreateHoliday([FromBody] CreateHolidayDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var holiday = new Holiday
            {
                Name = dto.Name,
                Date = dto.Date,
                Type = dto.Type,
                IsOptional = dto.IsOptional,
                Description = dto.Description,
                TenantId = _tenantAccessor.GetTenantId()
            };

            _db.Holidays.Add(holiday);
            await _db.SaveChangesAsync();

            return Ok(new HolidayDto
            {
                Id = holiday.Id,
                Name = holiday.Name,
                Date = holiday.Date,
                Type = holiday.Type,
                IsOptional = holiday.IsOptional,
                Description = holiday.Description
            });
        }

        [HttpPost("requests")]
        [PolicyCheck("leave", "apply")]
        public async Task<IActionResult> CreateRequest([FromBody] CreateLeaveRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var employeeExists = await _db.Employees.AnyAsync(e => e.Id == dto.EmployeeId && e.TenantId == tenantId);
            var policyExists = await _db.LeavePolicies.AnyAsync(p => p.Id == dto.LeavePolicyId && p.TenantId == tenantId);
            if (!employeeExists || !policyExists) return BadRequest(new { message = "Invalid employee or policy." });

            var request = new LeaveRequest
            {
                EmployeeId = dto.EmployeeId,
                LeavePolicyId = dto.LeavePolicyId,
                FromDate = dto.FromDate,
                ToDate = dto.ToDate,
                Days = dto.Days,
                Period = Enum.Parse<LeavePeriod>(dto.Period),
                Reason = dto.Reason,
                Status = "Pending",
                TenantId = tenantId
            };

            _db.LeaveRequests.Add(request);
            await _db.SaveChangesAsync();

            return Ok(await MapLeaveRequestAsync(request, tenantId));
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("requests/{id:guid}/approve")]
        [PolicyCheck("leave", "approve")]
        public async Task<IActionResult> ApproveRequest(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var req = await _db.LeaveRequests.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId);
            if (req == null) return NotFound();

            req.Status = "Approved";
            req.ApprovedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(await MapLeaveRequestAsync(req, tenantId));
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("requests/{id:guid}/reject")]
        [PolicyCheck("leave", "reject")]
        public async Task<IActionResult> RejectRequest(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var req = await _db.LeaveRequests.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId);
            if (req == null) return NotFound();

            req.Status = "Rejected";
            req.ApprovedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(await MapLeaveRequestAsync(req, tenantId));
        }

        // Leave Allocations
        [HttpGet("allocations")]
        public async Task<IActionResult> GetAllocations([FromQuery] Guid? employeeId, [FromQuery] int? year)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.LeaveAllocations
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId);

            if (employeeId.HasValue)
                query = query.Where(a => a.EmployeeId == employeeId.Value);

            if (year.HasValue)
                query = query.Where(a => a.Year == year.Value);

            var data = await query
                .Select(a => new LeaveAllocationDto
                {
                    Id = a.Id,
                    EmployeeId = a.EmployeeId,
                    LeavePolicyId = a.LeavePolicyId,
                    Year = a.Year,
                    AllocatedDays = a.AllocatedDays,
                    EffectiveFrom = a.EffectiveFrom,
                    EffectiveTo = a.EffectiveTo,
                    AllocationReason = a.AllocationReason,
                    IsProrated = a.IsProrated,
                    CarryForwardDays = a.CarryForwardDays
                })
                .ToListAsync();

            return Ok(data);
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("allocations")]
        public async Task<IActionResult> CreateAllocation([FromBody] CreateLeaveAllocationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var allocation = new LeaveAllocation
            {
                EmployeeId = dto.EmployeeId,
                LeavePolicyId = dto.LeavePolicyId,
                Year = dto.Year,
                AllocatedDays = dto.AllocatedDays,
                EffectiveFrom = dto.EffectiveFrom,
                EffectiveTo = dto.EffectiveTo,
                AllocationReason = dto.AllocationReason,
                IsProrated = dto.IsProrated,
                CarryForwardDays = dto.CarryForwardDays,
                TenantId = _tenantAccessor.GetTenantId()
            };

            _db.LeaveAllocations.Add(allocation);
            await _db.SaveChangesAsync();

            return Ok(new LeaveAllocationDto
            {
                Id = allocation.Id,
                EmployeeId = allocation.EmployeeId,
                LeavePolicyId = allocation.LeavePolicyId,
                Year = allocation.Year,
                AllocatedDays = allocation.AllocatedDays,
                EffectiveFrom = allocation.EffectiveFrom,
                EffectiveTo = allocation.EffectiveTo,
                AllocationReason = allocation.AllocationReason,
                IsProrated = allocation.IsProrated,
                CarryForwardDays = allocation.CarryForwardDays
            });
        }

        private async Task<List<LeaveRequestDto>> MapLeaveRequestsAsync(IEnumerable<LeaveRequest> requests, Guid tenantId)
        {
            var requestList = requests.ToList();
            var employeeIds = requestList
                .Select(r => r.EmployeeId)
                .Concat(requestList.Where(r => r.ApprovedBy.HasValue).Select(r => r.ApprovedBy!.Value))
                .Distinct()
                .ToList();

            var employeeNames = await GetEmployeeNamesAsync(employeeIds, tenantId);
            return requestList.Select(r => MapLeaveRequest(r, employeeNames)).ToList();
        }

        private async Task<LeaveRequestDto> MapLeaveRequestAsync(LeaveRequest request, Guid tenantId)
        {
            var employeeNames = await GetEmployeeNamesAsync(new[] { request.EmployeeId }.Concat(request.ApprovedBy.HasValue ? new[] { request.ApprovedBy.Value } : Array.Empty<Guid>()), tenantId);
            return MapLeaveRequest(request, employeeNames);
        }

        private static LeaveRequestDto MapLeaveRequest(LeaveRequest request, IReadOnlyDictionary<Guid, string?> employeeNames)
        {
            employeeNames.TryGetValue(request.EmployeeId, out var employeeName);

            string? approvedByName = null;
            if (request.ApprovedBy.HasValue)
            {
                employeeNames.TryGetValue(request.ApprovedBy.Value, out approvedByName);
            }

            return new LeaveRequestDto
            {
                Id = request.Id,
                EmployeeId = request.EmployeeId,
                EmployeeName = employeeName,
                LeavePolicyId = request.LeavePolicyId,
                FromDate = request.FromDate,
                ToDate = request.ToDate,
                Days = request.Days,
                Period = request.Period.ToString(),
                Status = request.Status,
                ApprovedBy = request.ApprovedBy,
                ApprovedByName = approvedByName,
                ApprovedAt = request.ApprovedAt,
                Reason = request.Reason
            };
        }

        private async Task<Dictionary<Guid, string?>> GetEmployeeNamesAsync(IEnumerable<Guid> employeeIds, Guid tenantId)
        {
            var ids = employeeIds.Distinct().ToList();
            if (ids.Count == 0)
            {
                return new Dictionary<Guid, string?>();
            }

            return await _db.Employees
                .AsNoTracking()
                .Where(e => e.TenantId == tenantId && ids.Contains(e.Id))
                .Select(e => new
                {
                    e.Id,
                    Name = e.FullName,
                    e.EmployeeCode
                })
                .ToDictionaryAsync(
                    employee => employee.Id,
                    employee => !string.IsNullOrWhiteSpace(employee.Name) ? employee.Name : employee.EmployeeCode);
        }
    }
}
