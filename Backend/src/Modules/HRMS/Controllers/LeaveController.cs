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
    }
}
