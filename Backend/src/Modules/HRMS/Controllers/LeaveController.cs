using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Authorization;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Api.Modules.Administration.Controllers;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Route("api/v1/hrms/leave")]
    [Route("api/v1/leaves")]
    [Route("api/leaves")]
    [Route("api/leave")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class LeaveController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IWorkflowService _workflow;
        private readonly ILeaveRequestService _leaveRequests;

        public LeaveController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IWorkflowService workflow,
            ILeaveRequestService leaveRequests)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _workflow = workflow;
            _leaveRequests = leaveRequests;
        }

        [HttpGet("applications")]
        public async Task<IActionResult> GetLeaveApplications([FromQuery] Guid? companyId = null, [FromQuery] string? status = null)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var query = _db.LeaveRequests.AsNoTracking()
                    .Where(r => r.TenantId == tenantId && !r.IsDeleted);

                if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(r => r.Status == status);
                }

                var requests = await query
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                if (requests.Count == 0)
                {
                    return Ok(Array.Empty<object>());
                }

                var employeeIds = requests.Select(r => r.EmployeeId).Distinct().ToList();
                var employeeMap = await _db.Employees.AsNoTracking()
                    .Where(e => employeeIds.Contains(e.Id))
                    .ToDictionaryAsync(e => e.Id, e => !string.IsNullOrWhiteSpace(e.FullName) ? e.FullName : (e.EmployeeCode ?? "Employee"));

                var policyIds = requests.Select(r => r.LeavePolicyId).Distinct().ToList();
                var policyMap = await _db.LeavePolicies.AsNoTracking()
                    .Where(p => policyIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id, p => !string.IsNullOrWhiteSpace(p.Name) ? p.Name : (p.Type ?? "Leave"));

                var list = requests.Select(r => new
                {
                    r.Id,
                    r.EmployeeId,
                    EmployeeName = employeeMap.TryGetValue(r.EmployeeId, out var empName) ? empName : "Employee",
                    LeaveTypeId = r.LeavePolicyId,
                    LeaveTypeName = policyMap.TryGetValue(r.LeavePolicyId, out var polName) ? polName : "Leave",
                    StartDate = r.FromDate,
                    EndDate = r.ToDate,
                    TotalDays = r.Days,
                    r.Reason,
                    r.Status,
                    RejectionReason = (string?)null,
                    r.CreatedAt
                }).ToList();

                return Ok(list);
            }
            catch (Exception)
            {
                return Ok(Array.Empty<object>());
            }
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
        public async Task<IActionResult> GetPolicies([FromQuery] Guid? companyId = null, [FromQuery] Guid? projectId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var exists = await _db.LeavePolicies.AnyAsync(p => p.TenantId == tenantId && !p.IsDeleted);
            if (!exists)
            {
                var defaults = new List<LeavePolicy>
                {
                    new LeavePolicy
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Name = "Earned / Privilege Leave (EL/PL)",
                        Description = "Annual 15-day privilege leave allocation with up to 30 days carry forward",
                        Type = "Earned",
                        EntitlementPerYear = 15,
                        CarryForwardAllowed = true,
                        MaxCarryForward = 30,
                        AllocationFrequency = AllocationFrequency.Monthly,
                        EnableProration = true,
                        AutoAllocate = true,
                        IsDefault = true,
                        Status = "Active",
                        CreatedAt = DateTime.UtcNow
                    },
                    new LeavePolicy
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Name = "Casual Leave (CL)",
                        Description = "Standard casual leave quota",
                        Type = "Casual",
                        EntitlementPerYear = 12,
                        CarryForwardAllowed = false,
                        MaxCarryForward = 0,
                        AllocationFrequency = AllocationFrequency.Yearly,
                        EnableProration = true,
                        AutoAllocate = true,
                        IsDefault = false,
                        Status = "Active",
                        CreatedAt = DateTime.UtcNow
                    },
                    new LeavePolicy
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Name = "Sick / Medical Leave (SL)",
                        Description = "Statutory medical and sickness leave",
                        Type = "Sick",
                        EntitlementPerYear = 12,
                        CarryForwardAllowed = true,
                        MaxCarryForward = 15,
                        AllocationFrequency = AllocationFrequency.Yearly,
                        EnableProration = true,
                        AutoAllocate = true,
                        IsDefault = false,
                        Status = "Active",
                        CreatedAt = DateTime.UtcNow
                    }
                };
                _db.LeavePolicies.AddRange(defaults);
                await _db.SaveChangesAsync();
            }

            var query = _db.LeavePolicies
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

            var data = await query
                .OrderByDescending(p => p.IsDefault)
                .ThenBy(p => p.Name)
                .Select(p => new LeavePolicyDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    IsDefault = p.IsDefault,
                    CompanyId = p.CompanyId,
                    ProjectId = p.ProjectId,
                    DepartmentId = p.DepartmentId,
                    Type = p.Type,
                    EntitlementPerYear = p.EntitlementPerYear,
                    CarryForwardAllowed = p.CarryForwardAllowed,
                    MaxCarryForward = p.MaxCarryForward,
                    AllocationFrequency = p.AllocationFrequency.ToString(),
                    EnableProration = p.EnableProration,
                    AutoAllocate = p.AutoAllocate,
                    Status = p.Status
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("policies/{id:guid}")]
        public async Task<IActionResult> GetPolicyById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.LeavePolicies
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);

            if (policy == null) return NotFound();

            return Ok(new LeavePolicyDto
            {
                Id = policy.Id,
                Name = policy.Name,
                Description = policy.Description,
                IsDefault = policy.IsDefault,
                CompanyId = policy.CompanyId,
                ProjectId = policy.ProjectId,
                DepartmentId = policy.DepartmentId,
                Type = policy.Type,
                EntitlementPerYear = policy.EntitlementPerYear,
                CarryForwardAllowed = policy.CarryForwardAllowed,
                MaxCarryForward = policy.MaxCarryForward,
                AllocationFrequency = policy.AllocationFrequency.ToString(),
                EnableProration = policy.EnableProration,
                AutoAllocate = policy.AutoAllocate,
                Status = policy.Status
            });
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPost("policies")]
        public async Task<IActionResult> CreatePolicy([FromBody] CreateLeavePolicyDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            if (dto.IsDefault)
            {
                var existingDefaults = await _db.LeavePolicies
                    .Where(p => p.TenantId == tenantId && p.IsDefault && !p.IsDeleted)
                    .ToListAsync();
                foreach (var ed in existingDefaults) ed.IsDefault = false;
            }

            var policy = new LeavePolicy
            {
                Name = dto.Name,
                Description = dto.Description,
                IsDefault = dto.IsDefault,
                CompanyId = dto.CompanyId,
                ProjectId = dto.ProjectId,
                DepartmentId = dto.DepartmentId,
                Type = dto.Type,
                EntitlementPerYear = dto.EntitlementPerYear,
                CarryForwardAllowed = dto.CarryForwardAllowed,
                MaxCarryForward = dto.MaxCarryForward,
                AllocationFrequency = Enum.Parse<AllocationFrequency>(dto.AllocationFrequency),
                EnableProration = dto.EnableProration,
                AutoAllocate = dto.AutoAllocate,
                Status = dto.Status ?? "Active",
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.LeavePolicies.Add(policy);
            await _db.SaveChangesAsync();

            return Ok(new LeavePolicyDto
            {
                Id = policy.Id,
                Name = policy.Name,
                Description = policy.Description,
                IsDefault = policy.IsDefault,
                CompanyId = policy.CompanyId,
                ProjectId = policy.ProjectId,
                DepartmentId = policy.DepartmentId,
                Type = policy.Type,
                EntitlementPerYear = policy.EntitlementPerYear,
                CarryForwardAllowed = policy.CarryForwardAllowed,
                MaxCarryForward = policy.MaxCarryForward,
                AllocationFrequency = policy.AllocationFrequency.ToString(),
                EnableProration = policy.EnableProration,
                AutoAllocate = policy.AutoAllocate,
                Status = policy.Status
            });
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPut("policies/{id:guid}")]
        public async Task<IActionResult> UpdatePolicy(Guid id, [FromBody] CreateLeavePolicyDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.LeavePolicies.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);
            if (policy == null) return NotFound();

            if (dto.IsDefault && !policy.IsDefault)
            {
                var existingDefaults = await _db.LeavePolicies
                    .Where(p => p.TenantId == tenantId && p.IsDefault && p.Id != id && !p.IsDeleted)
                    .ToListAsync();
                foreach (var ed in existingDefaults) ed.IsDefault = false;
            }

            policy.Name = dto.Name;
            policy.Description = dto.Description;
            policy.IsDefault = dto.IsDefault;
            policy.CompanyId = dto.CompanyId;
            policy.ProjectId = dto.ProjectId;
            policy.DepartmentId = dto.DepartmentId;
            policy.Type = dto.Type;
            policy.EntitlementPerYear = dto.EntitlementPerYear;
            policy.CarryForwardAllowed = dto.CarryForwardAllowed;
            policy.MaxCarryForward = dto.MaxCarryForward;
            policy.AllocationFrequency = Enum.Parse<AllocationFrequency>(dto.AllocationFrequency);
            policy.EnableProration = dto.EnableProration;
            policy.AutoAllocate = dto.AutoAllocate;
            policy.Status = dto.Status ?? "Active";
            policy.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new LeavePolicyDto
            {
                Id = policy.Id,
                Name = policy.Name,
                Description = policy.Description,
                IsDefault = policy.IsDefault,
                CompanyId = policy.CompanyId,
                ProjectId = policy.ProjectId,
                DepartmentId = policy.DepartmentId,
                Type = policy.Type,
                EntitlementPerYear = policy.EntitlementPerYear,
                CarryForwardAllowed = policy.CarryForwardAllowed,
                MaxCarryForward = policy.MaxCarryForward,
                AllocationFrequency = policy.AllocationFrequency.ToString(),
                EnableProration = policy.EnableProration,
                AutoAllocate = policy.AutoAllocate,
                Status = policy.Status
            });
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpDelete("policies/{id:guid}")]
        public async Task<IActionResult> DeletePolicy(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var policy = await _db.LeavePolicies.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId && !p.IsDeleted);
            if (policy == null) return NotFound();

            policy.IsDeleted = true;
            policy.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Leave policy deleted from database." });
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
        public async Task<IActionResult> GetApprovals([FromQuery] string status = "Pending", [FromQuery] bool myTeamOnly = false)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.LeaveRequests
                .AsNoTracking()
                .Where(r => r.TenantId == tenantId && r.Status == status);

            var currentEmpId = await ResolveCurrentEmployeeIdAsync(tenantId);
            var isSuperAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("Admin") || User.IsInRole("HR Manager");

            if (myTeamOnly || (!isSuperAdmin && currentEmpId.HasValue))
            {
                if (currentEmpId.HasValue)
                {
                    var teamEmployeeIds = await _db.Employees
                        .AsNoTracking()
                        .Where(e => e.TenantId == tenantId && !e.IsDeleted &&
                                   (e.ReportingManagerId == currentEmpId.Value || e.ManagerId == currentEmpId.Value || e.ActingManagerId == currentEmpId.Value))
                        .Select(e => e.Id)
                        .ToListAsync();

                    query = query.Where(r => teamEmployeeIds.Contains(r.EmployeeId));
                }
            }

            var requests = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
            return Ok(await MapLeaveRequestsAsync(requests, tenantId));
        }

        [HttpGet("balances/me")]
        public async Task<IActionResult> GetMyBalances()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var employeeId = await ResolveCurrentEmployeeIdAsync(tenantId);
            if (employeeId == null || employeeId == Guid.Empty)
                return NotFound(new { message = "No employee record linked to this user." });
            return await GetBalances(employeeId);
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

            var policyNames = await _db.LeavePolicies
                .AsNoTracking()
                .Where(p => p.TenantId == tenantId)
                .ToDictionaryAsync(p => p.Id, p => p.Name);

            var balances = await query.ToListAsync();
            var data = balances
                .Select(b => new LeaveBalanceDto
                {
                    Id = b.Id,
                    EmployeeId = b.EmployeeId,
                    LeavePolicyId = b.LeavePolicyId,
                    LeaveTypeName = policyNames.TryGetValue(b.LeavePolicyId, out var name) ? name : "Leave",
                    Year = b.Year,
                    Entitled = b.Entitled,
                    Taken = b.Taken,
                    Balance = b.Balance
                })
                .ToList();

            return Ok(data);
        }

        [HttpGet("holidays")]
        [HttpGet("/api/v1/hrms/holidays")]
        [HttpGet("/api/v1/holidays")]
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
        [HttpPost("/api/v1/hrms/holidays")]
        [HttpPost("/api/v1/holidays")]
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

        [Authorize(Policy = "AdminOnly")]
        [HttpPut("holidays/{id:guid}")]
        [HttpPut("/api/v1/hrms/holidays/{id:guid}")]
        public async Task<IActionResult> UpdateHoliday(Guid id, [FromBody] CreateHolidayDto dto)
        {
            var holiday = await _db.Holidays.FirstOrDefaultAsync(h => h.Id == id);
            if (holiday == null) return NotFound(new { message = "Holiday not found." });

            holiday.Name = dto.Name;
            holiday.Date = dto.Date;
            holiday.Type = dto.Type;
            holiday.IsOptional = dto.IsOptional;
            holiday.Description = dto.Description;
            holiday.UpdatedAt = DateTime.UtcNow;

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

        [Authorize(Policy = "AdminOnly")]
        [HttpDelete("holidays/{id:guid}")]
        [HttpDelete("/api/v1/hrms/holidays/{id:guid}")]
        public async Task<IActionResult> DeleteHoliday(Guid id)
        {
            var holiday = await _db.Holidays.FirstOrDefaultAsync(h => h.Id == id);
            if (holiday == null) return NotFound(new { message = "Holiday not found." });

            holiday.IsDeleted = true;
            holiday.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Holiday deleted successfully." });
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

            try
            {
                var userIdClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var initiatedBy = Guid.TryParse(userIdClaim, out var uid) ? uid : Guid.Empty;
                await _workflow.StartInstanceAsync(new UabIndia.Application.Models.StartInstanceRequestDto
                {
                    DefinitionKey = "leave_approval",
                    BusinessKey = request.Id.ToString(),
                    TenantId = tenantId,
                    Variables = new Dictionary<string, object> { ["entityType"] = "LeaveRequest" }
                }, initiatedBy);
            }
            catch
            {
                // Leave still created if workflow definition is missing
            }

            return Ok(await MapLeaveRequestAsync(request, tenantId));
        }

        [Authorize(Roles = "SuperAdmin,Admin,HR Manager,Manager")]
        [HttpPost("requests/{id:guid}/approve")]
        [PolicyCheck("leave", "approve")]
        public async Task<IActionResult> ApproveRequest(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var req = await _db.LeaveRequests.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId);
                if (req == null) return NotFound();

                var currentEmpId = await ResolveCurrentEmployeeIdAsync(tenantId);
                var isSuperAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("Admin") || User.IsInRole("HR Manager");

                if (!isSuperAdmin)
                {
                    var applicant = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == req.EmployeeId && e.TenantId == tenantId);
                    if (applicant != null && currentEmpId.HasValue)
                    {
                        var isDirectMgr = applicant.ReportingManagerId == currentEmpId.Value || applicant.ManagerId == currentEmpId.Value;
                        var isActingMgr = applicant.ActingManagerId == currentEmpId.Value;
                        if (!isDirectMgr && !isActingMgr)
                        {
                            return StatusCode(403, new { message = "You are not authorized to approve leave for this employee. Only their reporting manager or HR can approve." });
                        }
                    }
                }

                var approved = await _leaveRequests.ApproveAsync(id, currentEmpId, ResolveCurrentUserId());
                return Ok(await MapLeaveRequestAsync(approved, tenantId));
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "SuperAdmin,Admin,HR Manager,Manager")]
        [HttpPost("requests/{id:guid}/reject")]
        [PolicyCheck("leave", "reject")]
        public async Task<IActionResult> RejectRequest(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var req = await _db.LeaveRequests.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId);
                if (req == null) return NotFound();

                var currentEmpId = await ResolveCurrentEmployeeIdAsync(tenantId);
                var isSuperAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("Admin") || User.IsInRole("HR Manager");

                if (!isSuperAdmin)
                {
                    var applicant = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == req.EmployeeId && e.TenantId == tenantId);
                    if (applicant != null && currentEmpId.HasValue)
                    {
                        var isDirectMgr = applicant.ReportingManagerId == currentEmpId.Value || applicant.ManagerId == currentEmpId.Value;
                        var isActingMgr = applicant.ActingManagerId == currentEmpId.Value;
                        if (!isDirectMgr && !isActingMgr)
                        {
                            return StatusCode(403, new { message = "You are not authorized to reject leave for this employee. Only their reporting manager or HR can reject." });
                        }
                    }
                }

                var rejected = await _leaveRequests.RejectAsync(id, currentEmpId, ResolveCurrentUserId());
                return Ok(await MapLeaveRequestAsync(rejected, tenantId));
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private Guid ResolveCurrentUserId()
        {
            var userIdClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var uid) ? uid : Guid.Empty;
        }

        private async Task<Guid?> ResolveCurrentEmployeeIdAsync(Guid tenantId)
        {
            var userIdClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId)) return null;

            var employeeId = await _db.Employees.AsNoTracking()
                .Where(e => e.TenantId == tenantId && e.UserId == userId && !e.IsDeleted)
                .Select(e => (Guid?)e.Id)
                .FirstOrDefaultAsync();
            return employeeId;
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
                Reason = request.Reason,
                CreatedAt = request.CreatedAt
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

        // ─────────────────────────────────────────────────────────────────────
        // LEAVE POLICIES (DATABASE & BACKEND GOVERNED)
        // ─────────────────────────────────────────────────────────────────────

        [HttpGet("policies/schema")]
        public async Task<IActionResult> GetPolicySchema([FromQuery] Guid? companyId = null, [FromQuery] Guid? projectId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            await PoliciesController.EnsurePolicyRuleDefinitionsSeededAsync(_db, tenantId);

            var defs = await _db.PolicyRuleDefinitions
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && !d.IsDeleted && d.IsVisible && d.Category == "LEAVE")
                .OrderBy(d => d.DisplayOrder)
                .ToListAsync();

            var resolvedFields = PoliciesController.ResolveFieldDefinitions(defs, companyId, projectId);
            var defaultsDict = resolvedFields.ToDictionary(f => (string)f.key, f => (object)f.defaultValue);

            var schema = new
            {
                category = "LEAVE",
                policyType = "LeavePolicy",
                scope = new { companyId, projectId },
                defaults = defaultsDict,
                fieldDefinitions = resolvedFields
            };

            return Ok(schema);
        }

        // ─────────────────────────────────────────────────────────────────────
        // COMPENSATORY OFF (COMP-OFF) LEDGER & WORKFLOW
        // ─────────────────────────────────────────────────────────────────────

        [HttpGet("comp-off")]
        public async Task<IActionResult> GetCompOffRecords([FromQuery] Guid? employeeId = null, [FromQuery] string? status = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.CompOffRecords.AsNoTracking().Where(r => r.TenantId == tenantId && !r.IsDeleted);

            if (employeeId.HasValue)
            {
                query = query.Where(r => r.EmployeeId == employeeId.Value);
            }

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<CompOffStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(r => r.Status == parsedStatus);
            }

            var records = await query.OrderByDescending(r => r.WorkedDate).ToListAsync();
            var employeeIds = records.Select(r => r.EmployeeId).Distinct().ToList();

            var employees = await _db.Employees.AsNoTracking()
                .Where(e => employeeIds.Contains(e.Id) && e.TenantId == tenantId)
                .ToDictionaryAsync(e => e.Id, e => new { e.FullName, e.EmployeeCode });

            var result = records.Select(r =>
            {
                employees.TryGetValue(r.EmployeeId, out var emp);
                return new CompOffRecordDto
                {
                    Id = r.Id,
                    EmployeeId = r.EmployeeId,
                    EmployeeName = emp?.FullName ?? "Unknown",
                    EmployeeCode = emp?.EmployeeCode ?? "—",
                    WorkedDate = r.WorkedDate,
                    DaysGranted = r.DaysGranted,
                    DaysRemaining = r.DaysRemaining,
                    ExpiryDate = r.ExpiryDate,
                    Status = r.Status.ToString(),
                    Reason = r.Reason,
                    ApprovedBy = r.ApprovedBy,
                    ApprovedAt = r.ApprovedAt
                };
            }).ToList();

            return Ok(result);
        }

        [HttpPost("comp-off/accrue")]
        [PolicyCheck("leave", "apply")]
        public async Task<IActionResult> RequestCompOffAccrual([FromBody] RequestCompOffAccrualDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var employeeExists = await _db.Employees.AnyAsync(e => e.Id == dto.EmployeeId && e.TenantId == tenantId && !e.IsDeleted);
            if (!employeeExists) return BadRequest(new { message = "Invalid employee." });

            var validity = dto.ValidityDays > 0 ? dto.ValidityDays : 60;
            var compOff = new CompOffRecord
            {
                TenantId = tenantId,
                EmployeeId = dto.EmployeeId,
                WorkedDate = dto.WorkedDate.Date,
                DaysGranted = dto.Days > 0 ? dto.Days : 1.0m,
                DaysRemaining = dto.Days > 0 ? dto.Days : 1.0m,
                ExpiryDate = dto.WorkedDate.Date.AddDays(validity),
                Status = CompOffStatus.Pending,
                Reason = dto.Reason
            };

            _db.CompOffRecords.Add(compOff);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                compOff.Id,
                compOff.EmployeeId,
                compOff.WorkedDate,
                compOff.DaysGranted,
                compOff.ExpiryDate,
                Status = compOff.Status.ToString(),
                compOff.Reason
            });
        }

        [Authorize(Roles = "SuperAdmin,Admin,HR Manager,Manager")]
        [HttpPost("comp-off/{id:guid}/approve")]
        [PolicyCheck("leave", "approve")]
        public async Task<IActionResult> ApproveCompOff(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var record = await _db.CompOffRecords.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted);
            if (record == null) return NotFound(new { message = "Comp-off record not found." });

            if (record.Status != CompOffStatus.Pending)
            {
                return BadRequest(new { message = $"Cannot approve comp-off record in '{record.Status}' status." });
            }

            var currentEmpId = await ResolveCurrentEmployeeIdAsync(tenantId);
            record.Status = CompOffStatus.Approved;
            record.ApprovedBy = currentEmpId;
            record.ApprovedAt = DateTime.UtcNow;
            record.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Comp-off record approved successfully.", record.Id, Status = record.Status.ToString() });
        }

        [Authorize(Roles = "SuperAdmin,Admin,HR Manager,Manager")]
        [HttpPost("comp-off/{id:guid}/reject")]
        [PolicyCheck("leave", "reject")]
        public async Task<IActionResult> RejectCompOff(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var record = await _db.CompOffRecords.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted);
            if (record == null) return NotFound(new { message = "Comp-off record not found." });

            if (record.Status != CompOffStatus.Pending)
            {
                return BadRequest(new { message = $"Cannot reject comp-off record in '{record.Status}' status." });
            }

            var currentEmpId = await ResolveCurrentEmployeeIdAsync(tenantId);
            record.Status = CompOffStatus.Rejected;
            record.ApprovedBy = currentEmpId;
            record.ApprovedAt = DateTime.UtcNow;
            record.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Comp-off record rejected.", record.Id, Status = record.Status.ToString() });
        }

        // ─────────────────────────────────────────────────────────────────────
        // LEAVE ENCASHMENT WORKFLOW
        // ─────────────────────────────────────────────────────────────────────

        [HttpGet("encashments")]
        public async Task<IActionResult> GetLeaveEncashments([FromQuery] Guid? employeeId = null, [FromQuery] string? status = null, [FromQuery] int? year = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.LeaveEncashmentRequests.AsNoTracking().Where(r => r.TenantId == tenantId && !r.IsDeleted);

            if (employeeId.HasValue)
            {
                query = query.Where(r => r.EmployeeId == employeeId.Value);
            }

            if (year.HasValue)
            {
                query = query.Where(r => r.Year == year.Value);
            }

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<LeaveEncashmentStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(r => r.Status == parsedStatus);
            }

            var records = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
            var empIds = records.Select(r => r.EmployeeId).Distinct().ToList();
            var policyIds = records.Select(r => r.LeavePolicyId).Distinct().ToList();

            var employees = await _db.Employees.AsNoTracking()
                .Where(e => empIds.Contains(e.Id) && e.TenantId == tenantId)
                .ToDictionaryAsync(e => e.Id, e => new { e.FullName, e.EmployeeCode });

            var policies = await _db.LeavePolicies.AsNoTracking()
                .Where(p => policyIds.Contains(p.Id) && p.TenantId == tenantId)
                .ToDictionaryAsync(p => p.Id, p => p.Name);

            var result = records.Select(r =>
            {
                employees.TryGetValue(r.EmployeeId, out var emp);
                policies.TryGetValue(r.LeavePolicyId, out var policyName);

                return new LeaveEncashmentRequestDto
                {
                    Id = r.Id,
                    EmployeeId = r.EmployeeId,
                    EmployeeName = emp?.FullName ?? "Unknown",
                    EmployeeCode = emp?.EmployeeCode ?? "—",
                    LeavePolicyId = r.LeavePolicyId,
                    PolicyName = policyName ?? "Leave",
                    Year = r.Year,
                    DaysRequested = r.DaysRequested,
                    DailyRate = r.DailyRate,
                    TotalAmount = r.TotalAmount,
                    Status = r.Status.ToString(),
                    Reason = r.Reason,
                    ApprovedBy = r.ApprovedBy,
                    ApprovedAt = r.ApprovedAt,
                    CreatedAt = r.CreatedAt
                };
            }).ToList();

            return Ok(result);
        }

        [HttpPost("encashments")]
        [PolicyCheck("leave", "apply")]
        public async Task<IActionResult> RequestLeaveEncashment([FromBody] CreateLeaveEncashmentRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var employee = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == dto.EmployeeId && e.TenantId == tenantId && !e.IsDeleted);
            if (employee == null) return BadRequest(new { message = "Invalid employee." });

            var policy = await _db.LeavePolicies.AsNoTracking().FirstOrDefaultAsync(p => p.Id == dto.LeavePolicyId && p.TenantId == tenantId && !p.IsDeleted);
            if (policy == null) return BadRequest(new { message = "Invalid leave policy." });

            // Verify policy allows encashment via LeavePolicyRule
            var rule = await _db.LeavePolicyRules.AsNoTracking().FirstOrDefaultAsync(r => r.LeavePolicyId == dto.LeavePolicyId && r.TenantId == tenantId && !r.IsDeleted);
            if (rule != null && !rule.Encashable)
            {
                return BadRequest(new { message = "The selected leave policy does not permit leave encashment." });
            }

            // Check employee balance
            var balance = await _db.EmployeeLeaves.FirstOrDefaultAsync(b =>
                b.EmployeeId == dto.EmployeeId &&
                b.LeavePolicyId == dto.LeavePolicyId &&
                b.Year == dto.Year &&
                b.TenantId == tenantId &&
                !b.IsDeleted);

            if (balance == null || balance.Balance < dto.Days)
            {
                var available = balance?.Balance ?? 0m;
                return BadRequest(new { message = $"Insufficient leave balance. Requested: {dto.Days} day(s), Available: {available} day(s)." });
            }

            var basic = employee.BasicSalary > 0 ? employee.BasicSalary : (employee.MonthlyCtc * 0.40m);
            var dailyRate = basic > 0 ? Math.Round(basic / 30m, 2, MidpointRounding.AwayFromZero) : 0m;
            var totalAmount = Math.Round(dailyRate * dto.Days, 2, MidpointRounding.AwayFromZero);

            var encashment = new LeaveEncashmentRequest
            {
                TenantId = tenantId,
                EmployeeId = dto.EmployeeId,
                LeavePolicyId = dto.LeavePolicyId,
                Year = dto.Year,
                DaysRequested = dto.Days,
                DailyRate = dailyRate,
                TotalAmount = totalAmount,
                Status = LeaveEncashmentStatus.Pending,
                Reason = dto.Reason
            };

            _db.LeaveEncashmentRequests.Add(encashment);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                encashment.Id,
                encashment.EmployeeId,
                encashment.DaysRequested,
                encashment.DailyRate,
                encashment.TotalAmount,
                Status = encashment.Status.ToString(),
                encashment.Reason
            });
        }

        [Authorize(Roles = "SuperAdmin,Admin,HR Manager,Manager")]
        [HttpPost("encashments/{id:guid}/approve")]
        [PolicyCheck("leave", "approve")]
        public async Task<IActionResult> ApproveLeaveEncashment(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var req = await _db.LeaveEncashmentRequests.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted);
            if (req == null) return NotFound(new { message = "Leave encashment request not found." });

            if (req.Status != LeaveEncashmentStatus.Pending)
            {
                return BadRequest(new { message = $"Cannot approve encashment request in '{req.Status}' status." });
            }

            var currentEmpId = await ResolveCurrentEmployeeIdAsync(tenantId);
            req.Status = LeaveEncashmentStatus.Approved;
            req.ApprovedBy = currentEmpId;
            req.ApprovedAt = DateTime.UtcNow;
            req.UpdatedAt = DateTime.UtcNow;

            // 1. Deduct leave balance
            var balance = await _db.EmployeeLeaves.FirstOrDefaultAsync(b =>
                b.EmployeeId == req.EmployeeId &&
                b.LeavePolicyId == req.LeavePolicyId &&
                b.Year == req.Year &&
                b.TenantId == tenantId &&
                !b.IsDeleted);

            if (balance != null)
            {
                balance.Taken += req.DaysRequested;
                balance.Balance = Math.Max(0, balance.Entitled - balance.Taken);
                balance.UpdatedAt = DateTime.UtcNow;
            }

            // 2. Automatically generate approved PayrollBonus component of type "Leave Encashment"
            var employee = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == req.EmployeeId && e.TenantId == tenantId);
            var bonus = new PayrollBonus
            {
                TenantId = tenantId,
                EmployeeId = req.EmployeeId,
                EmployeeName = employee?.FullName ?? "Employee",
                EmployeeCode = employee?.EmployeeCode ?? "—",
                BonusType = "Leave Encashment",
                Amount = req.TotalAmount,
                PaymentMonth = DateTime.UtcNow.ToString("yyyy-MM"),
                Remarks = $"Leave encashment of {req.DaysRequested} day(s) approved on {DateTime.UtcNow:yyyy-MM-dd}",
                Status = "Approved",
                PaidAt = null
            };
            _db.PayrollBonuses.Add(bonus);

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Leave encashment approved successfully. Amount added to payroll earnings queue.",
                req.Id,
                Status = req.Status.ToString(),
                req.TotalAmount,
                payrollBonusId = bonus.Id
            });
        }

        [Authorize(Roles = "SuperAdmin,Admin,HR Manager,Manager")]
        [HttpPost("encashments/{id:guid}/reject")]
        [PolicyCheck("leave", "reject")]
        public async Task<IActionResult> RejectLeaveEncashment(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var req = await _db.LeaveEncashmentRequests.FirstOrDefaultAsync(r => r.Id == id && r.TenantId == tenantId && !r.IsDeleted);
            if (req == null) return NotFound(new { message = "Leave encashment request not found." });

            if (req.Status != LeaveEncashmentStatus.Pending)
            {
                return BadRequest(new { message = $"Cannot reject encashment request in '{req.Status}' status." });
            }

            var currentEmpId = await ResolveCurrentEmployeeIdAsync(tenantId);
            req.Status = LeaveEncashmentStatus.Rejected;
            req.ApprovedBy = currentEmpId;
            req.ApprovedAt = DateTime.UtcNow;
            req.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Leave encashment rejected.", req.Id, Status = req.Status.ToString() });
        }
    }
}
