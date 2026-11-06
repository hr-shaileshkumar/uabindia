using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/hrms/organization")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class OrganizationHierarchyController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public OrganizationHierarchyController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private Guid CurrentTenantId => _tenantAccessor.GetTenantId();

        private Guid GetUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }

        // ==========================================
        // 1. RECURSIVE ORG HIERARCHY TREE
        // ==========================================
        [HttpGet("tree")]
        public async Task<ActionResult<List<OrgTreeNodeDto>>> GetOrgTree(
            [FromQuery] Guid? rootEmployeeId = null,
            [FromQuery] Guid? departmentId = null,
            CancellationToken ct = default)
        {
            var tenantId = CurrentTenantId;
            var query = _db.Employees
                .AsNoTracking()
                .Where(e => e.TenantId == tenantId && !e.IsDeleted);

            if (departmentId.HasValue)
            {
                query = query.Where(e => e.DepartmentId == departmentId.Value);
            }

            var employees = await query
                .Select(e => new
                {
                    e.Id,
                    e.FullName,
                    e.EmployeeCode,
                    e.WorkEmail,
                    e.Phone,
                    e.DepartmentId,
                    e.DesignationId,
                    e.Status,
                    e.ReportingManagerId,
                    e.ActingManagerId,
                    e.DelegationStartDate,
                    e.DelegationEndDate,
                    e.IsOrganizationHead
                })
                .ToListAsync(ct);

            var depts = await _db.Departments
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && !d.IsDeleted)
                .ToDictionaryAsync(d => d.Id, d => d.Name, ct);

            var desigs = await _db.Designations
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && !d.IsDeleted)
                .ToDictionaryAsync(d => d.Id, d => d.Name, ct);

            var empNameMap = employees.ToDictionary(e => e.Id, e => e.FullName ?? "Unnamed");

            var flatNodes = employees.Select(e =>
            {
                string? actingMgr = null;
                var now = DateTime.UtcNow;
                if (e.ActingManagerId.HasValue &&
                    (!e.DelegationStartDate.HasValue || e.DelegationStartDate.Value <= now) &&
                    (!e.DelegationEndDate.HasValue || e.DelegationEndDate.Value >= now))
                {
                    actingMgr = empNameMap.GetValueOrDefault(e.ActingManagerId.Value);
                }

                return new OrgTreeNodeDto
                {
                    Id = e.Id,
                    FullName = e.FullName ?? "Unnamed",
                    EmployeeCode = e.EmployeeCode,
                    WorkEmail = e.WorkEmail,
                    Phone = e.Phone,
                    DepartmentId = e.DepartmentId,
                    DepartmentName = e.DepartmentId.HasValue ? depts.GetValueOrDefault(e.DepartmentId.Value) : null,
                    DesignationId = e.DesignationId,
                    DesignationName = e.DesignationId.HasValue ? desigs.GetValueOrDefault(e.DesignationId.Value) : null,
                    Status = e.Status,
                    ReportingManagerId = e.ReportingManagerId,
                    ReportingManagerName = e.ReportingManagerId.HasValue ? empNameMap.GetValueOrDefault(e.ReportingManagerId.Value) : null,
                    ActingManagerId = e.ActingManagerId,
                    ActingManagerName = actingMgr,
                    IsOrganizationHead = e.IsOrganizationHead,
                    Subordinates = new List<OrgTreeNodeDto>()
                };
            }).ToList();

            var lookup = flatNodes.ToLookup(n => n.ReportingManagerId);

            foreach (var node in flatNodes)
            {
                node.DirectReportsCount = lookup[node.Id].Count();
            }

            List<OrgTreeNodeDto> BuildSubtree(Guid? parentId)
            {
                var children = lookup[parentId].OrderBy(c => c.FullName).ToList();
                foreach (var child in children)
                {
                    child.Subordinates = BuildSubtree(child.Id);
                }
                return children;
            }

            if (rootEmployeeId.HasValue)
            {
                var root = flatNodes.FirstOrDefault(n => n.Id == rootEmployeeId.Value);
                if (root == null) return NotFound(new { message = "Root employee not found." });
                root.Subordinates = BuildSubtree(root.Id);
                return Ok(new List<OrgTreeNodeDto> { root });
            }

            // Roots are employees who have no ReportingManager (e.g. CEO / MD or Top HODs)
            var roots = BuildSubtree(null);
            if (!roots.Any() && flatNodes.Any())
            {
                // Fallback if every employee has a manager or circular data existed before
                roots = flatNodes.Take(1).ToList();
                roots[0].Subordinates = BuildSubtree(roots[0].Id);
            }

            return Ok(roots);
        }

        // ==========================================
        // 2. ASSIGN REPORTING MANAGER (WITH CYCLE DETECTION)
        // ==========================================
        [HttpPost("employees/{id}/assign-manager")]
        public async Task<IActionResult> AssignManager(Guid id, [FromBody] AssignManagerRequestDto dto, CancellationToken ct = default)
        {
            var tenantId = CurrentTenantId;
            var employee = await _db.Employees
                .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId && !e.IsDeleted, ct);

            if (employee == null) return NotFound(new { message = "Employee not found." });

            if (dto.ReportingManagerId.HasValue)
            {
                if (dto.ReportingManagerId.Value == id)
                {
                    return BadRequest(new { message = "An employee cannot report to themselves." });
                }

                var manager = await _db.Employees
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == dto.ReportingManagerId.Value && e.TenantId == tenantId && !e.IsDeleted, ct);

                if (manager == null)
                {
                    return BadRequest(new { message = "Selected manager does not exist or is inactive." });
                }

                if (manager.Status != "Active")
                {
                    return BadRequest(new { message = $"Cannot assign manager with status '{manager.Status}'. Manager must be Active." });
                }

                // Cycle Detection
                var wouldCreateCycle = await WouldCreateCycleAsync(id, dto.ReportingManagerId.Value, tenantId, ct);
                if (wouldCreateCycle)
                {
                    return BadRequest(new { message = "Circular reporting hierarchy detected! The selected manager is already subordinate to this employee." });
                }

                employee.ReportingManagerId = dto.ReportingManagerId.Value;
                employee.ManagerId = dto.ReportingManagerId.Value;
                employee.IsOrganizationHead = false;
            }
            else
            {
                // Unsetting manager makes this employee a top-level organization head
                employee.ReportingManagerId = null;
                employee.ManagerId = null;
                employee.IsOrganizationHead = true;
            }

            employee.UpdatedAt = DateTime.UtcNow;

            // Audit in Lifecycle Tasks
            _db.HrLifecycleTasks.Add(new HrLifecycleTask
            {
                TenantId = tenantId,
                EmployeeId = employee.Id,
                Kind = "HierarchyChange",
                Title = $"Manager Reassigned to {(dto.ReportingManagerId.HasValue ? dto.ReportingManagerId.Value.ToString() : "Organization Root")}",
                Notes = dto.Reason ?? "Direct hierarchy assignment update.",
                Status = "Completed",
                DueDate = dto.EffectiveDate ?? DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync(ct);

            return Ok(new
            {
                message = "Reporting manager successfully updated.",
                employeeId = employee.Id,
                reportingManagerId = employee.ReportingManagerId
            });
        }

        // ==========================================
        // 3. CHAIN OF COMMAND (BOTTOM-UP TO CEO)
        // ==========================================
        [HttpGet("employees/{id}/chain-of-command")]
        public async Task<ActionResult<List<EmployeeSummaryDto>>> GetChainOfCommand(Guid id, CancellationToken ct = default)
        {
            var tenantId = CurrentTenantId;
            var chain = new List<EmployeeSummaryDto>();
            var visited = new HashSet<Guid>();
            var currentId = (Guid?)id;

            var depts = await _db.Departments.Where(d => d.TenantId == tenantId && !d.IsDeleted).ToDictionaryAsync(d => d.Id, d => d.Name, ct);
            var desigs = await _db.Designations.Where(d => d.TenantId == tenantId && !d.IsDeleted).ToDictionaryAsync(d => d.Id, d => d.Name, ct);

            while (currentId.HasValue && visited.Add(currentId.Value))
            {
                var emp = await _db.Employees
                    .AsNoTracking()
                    .Where(e => e.Id == currentId.Value && e.TenantId == tenantId && !e.IsDeleted)
                    .Select(e => new
                    {
                        e.Id,
                        e.FullName,
                        e.EmployeeCode,
                        e.DepartmentId,
                        e.DesignationId,
                        e.ReportingManagerId
                    })
                    .FirstOrDefaultAsync(ct);

                if (emp == null) break;

                chain.Add(new EmployeeSummaryDto
                {
                    Id = emp.Id,
                    FullName = emp.FullName ?? "Unnamed",
                    EmployeeCode = emp.EmployeeCode,
                    Department = emp.DepartmentId.HasValue ? depts.GetValueOrDefault(emp.DepartmentId.Value) : null,
                    Designation = emp.DesignationId.HasValue ? desigs.GetValueOrDefault(emp.DesignationId.Value) : null
                });

                currentId = emp.ReportingManagerId;
            }

            return Ok(chain);
        }

        // ==========================================
        // 4. PROCESS B: PROMOTIONS & TRANSFERS WORKFLOW
        // ==========================================
        [HttpGet("transfers")]
        public async Task<ActionResult<List<HierarchyTransferDto>>> GetTransfers(
            [FromQuery] string? status = null,
            CancellationToken ct = default)
        {
            var tenantId = CurrentTenantId;
            var query = _db.EmployeeHierarchyTransfers
                .AsNoTracking()
                .Where(t => t.TenantId == tenantId && !t.IsDeleted);

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(t => t.OverallStatus == status);
            }

            var transfers = await query.OrderByDescending(t => t.CreatedAt).ToListAsync(ct);

            var empIds = transfers.Select(t => t.EmployeeId)
                .Concat(transfers.Where(t => t.CurrentManagerId.HasValue).Select(t => t.CurrentManagerId!.Value))
                .Concat(transfers.Where(t => t.ProposedManagerId.HasValue).Select(t => t.ProposedManagerId!.Value))
                .Distinct()
                .ToList();

            var employees = await _db.Employees
                .AsNoTracking()
                .Where(e => empIds.Contains(e.Id))
                .Select(e => new { e.Id, e.FullName, e.EmployeeCode })
                .ToDictionaryAsync(e => e.Id, ct);

            var depts = await _db.Departments
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && !d.IsDeleted)
                .ToDictionaryAsync(d => d.Id, d => d.Name, ct);

            var result = transfers.Select(t =>
            {
                var emp = employees.GetValueOrDefault(t.EmployeeId);
                var curMgr = t.CurrentManagerId.HasValue ? employees.GetValueOrDefault(t.CurrentManagerId.Value) : null;
                var propMgr = t.ProposedManagerId.HasValue ? employees.GetValueOrDefault(t.ProposedManagerId.Value) : null;

                return new HierarchyTransferDto
                {
                    Id = t.Id,
                    EmployeeId = t.EmployeeId,
                    EmployeeName = emp?.FullName,
                    EmployeeCode = emp?.EmployeeCode,
                    CurrentManagerId = t.CurrentManagerId,
                    CurrentManagerName = curMgr?.FullName,
                    ProposedManagerId = t.ProposedManagerId,
                    ProposedManagerName = propMgr?.FullName,
                    CurrentDepartmentId = t.CurrentDepartmentId,
                    CurrentDepartmentName = t.CurrentDepartmentId.HasValue ? depts.GetValueOrDefault(t.CurrentDepartmentId.Value) : null,
                    ProposedDepartmentId = t.ProposedDepartmentId,
                    ProposedDepartmentName = t.ProposedDepartmentId.HasValue ? depts.GetValueOrDefault(t.ProposedDepartmentId.Value) : null,
                    TransferType = t.TransferType,
                    Reason = t.Reason,
                    EffectiveDate = t.EffectiveDate,
                    OldManagerSignOffStatus = t.OldManagerSignOffStatus,
                    NewManagerSignOffStatus = t.NewManagerSignOffStatus,
                    HrbpSignOffStatus = t.HrbpSignOffStatus,
                    OverallStatus = t.OverallStatus,
                    SignOffNotes = t.SignOffNotes,
                    CreatedAt = t.CreatedAt
                };
            }).ToList();

            return Ok(result);
        }

        [HttpPost("transfers")]
        public async Task<IActionResult> RequestTransfer([FromBody] HierarchyTransferRequestDto dto, CancellationToken ct = default)
        {
            var tenantId = CurrentTenantId;
            var employee = await _db.Employees
                .FirstOrDefaultAsync(e => e.Id == dto.EmployeeId && e.TenantId == tenantId && !e.IsDeleted, ct);

            if (employee == null) return NotFound(new { message = "Employee not found." });

            if (dto.ProposedManagerId.HasValue)
            {
                if (dto.ProposedManagerId.Value == dto.EmployeeId)
                    return BadRequest(new { message = "Employee cannot be assigned as their own manager." });

                var wouldCreateCycle = await WouldCreateCycleAsync(dto.EmployeeId, dto.ProposedManagerId.Value, tenantId, ct);
                if (wouldCreateCycle)
                    return BadRequest(new { message = "Proposed manager would create a circular hierarchy loop." });
            }

            var transfer = new EmployeeHierarchyTransfer
            {
                TenantId = tenantId,
                EmployeeId = dto.EmployeeId,
                CurrentManagerId = employee.ReportingManagerId,
                ProposedManagerId = dto.ProposedManagerId,
                CurrentDepartmentId = employee.DepartmentId,
                ProposedDepartmentId = dto.ProposedDepartmentId ?? employee.DepartmentId,
                TransferType = dto.TransferType,
                Reason = dto.Reason,
                EffectiveDate = dto.EffectiveDate,
                OldManagerSignOffStatus = employee.ReportingManagerId.HasValue ? "Pending" : "NotApplicable",
                NewManagerSignOffStatus = dto.ProposedManagerId.HasValue ? "Pending" : "NotApplicable",
                HrbpSignOffStatus = "Pending",
                OverallStatus = "Pending",
                CreatedBy = GetUserId(),
                CreatedAt = DateTime.UtcNow
            };

            _db.EmployeeHierarchyTransfers.Add(transfer);
            await _db.SaveChangesAsync(ct);

            return CreatedAtAction(nameof(GetTransfers), new { id = transfer.Id }, new { message = "Transfer/Promotion request raised successfully.", transferId = transfer.Id });
        }

        [HttpPost("transfers/{id}/sign-off")]
        public async Task<IActionResult> SignOffTransfer(Guid id, [FromBody] HierarchyTransferSignOffDto dto, CancellationToken ct = default)
        {
            var tenantId = CurrentTenantId;
            var transfer = await _db.EmployeeHierarchyTransfers
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && !t.IsDeleted, ct);

            if (transfer == null) return NotFound(new { message = "Transfer request not found." });
            if (transfer.OverallStatus != "Pending")
                return BadRequest(new { message = $"Transfer is already {transfer.OverallStatus}." });

            var role = dto.Role.Trim();
            var decision = dto.Decision.Trim();

            if (decision == "Rejected")
            {
                transfer.OverallStatus = "Rejected";
                transfer.SignOffNotes = $"{transfer.SignOffNotes}\n[{role} Rejected]: {dto.Notes}".Trim();
                transfer.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(ct);
                return Ok(new { message = "Transfer request rejected.", overallStatus = transfer.OverallStatus });
            }

            if (role.Equals("OldManager", StringComparison.OrdinalIgnoreCase))
                transfer.OldManagerSignOffStatus = "Approved";
            else if (role.Equals("NewManager", StringComparison.OrdinalIgnoreCase))
                transfer.NewManagerSignOffStatus = "Approved";
            else if (role.Equals("HRBP", StringComparison.OrdinalIgnoreCase))
                transfer.HrbpSignOffStatus = "Approved";
            else
                return BadRequest(new { message = "Invalid role. Must be OldManager, NewManager, or HRBP." });

            transfer.SignOffNotes = $"{transfer.SignOffNotes}\n[{role} Approved]: {dto.Notes}".Trim();

            // Check if all required sign-offs are complete
            var oldComplete = transfer.OldManagerSignOffStatus is "Approved" or "NotApplicable";
            var newComplete = transfer.NewManagerSignOffStatus is "Approved" or "NotApplicable";
            var hrbpComplete = transfer.HrbpSignOffStatus is "Approved";

            if (oldComplete && newComplete && hrbpComplete)
            {
                transfer.OverallStatus = "Approved";

                // If effective date has arrived, execute the transfer immediately
                if (transfer.EffectiveDate <= DateTime.UtcNow)
                {
                    var employee = await _db.Employees
                        .FirstOrDefaultAsync(e => e.Id == transfer.EmployeeId && e.TenantId == tenantId && !e.IsDeleted, ct);

                    if (employee != null)
                    {
                        employee.ReportingManagerId = transfer.ProposedManagerId;
                        employee.ManagerId = transfer.ProposedManagerId;
                        if (transfer.ProposedDepartmentId.HasValue)
                        {
                            employee.DepartmentId = transfer.ProposedDepartmentId.Value;
                        }
                        employee.UpdatedAt = DateTime.UtcNow;
                        transfer.OverallStatus = "Effective";
                    }
                }
            }

            transfer.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            return Ok(new
            {
                message = "Sign-off recorded successfully.",
                transfer.OldManagerSignOffStatus,
                transfer.NewManagerSignOffStatus,
                transfer.HrbpSignOffStatus,
                transfer.OverallStatus
            });
        }

        // ==========================================
        // 5. PROCESS C: MANAGER EXIT & ORPHAN PREVENTION
        // ==========================================
        [HttpGet("orphan-risks")]
        public async Task<ActionResult<List<OrphanRiskDto>>> GetOrphanRisks(CancellationToken ct = default)
        {
            var tenantId = CurrentTenantId;

            // Managers who are either on notice, resigned, terminated, or inactive
            var exitStatuses = new[] { "NoticePeriod", "Resigned", "Terminated", "Inactive", "Exit" };
            var exitingManagers = await _db.Employees
                .AsNoTracking()
                .Where(e => e.TenantId == tenantId && (exitStatuses.Contains(e.Status) || e.ExitDate != null))
                .Select(e => new
                {
                    e.Id,
                    e.FullName,
                    e.EmployeeCode,
                    e.Status,
                    e.ExitDate,
                    e.ReportingManagerId
                })
                .ToListAsync(ct);

            var exitingManagerIds = exitingManagers.Select(m => m.Id).ToList();

            // Find all active employees whose manager is in exitingManagers
            var directReports = await _db.Employees
                .AsNoTracking()
                .Where(e => e.TenantId == tenantId && !e.IsDeleted && e.Status == "Active" && e.ReportingManagerId.HasValue && exitingManagerIds.Contains(e.ReportingManagerId.Value))
                .Select(e => new
                {
                    e.Id,
                    e.FullName,
                    e.EmployeeCode,
                    e.ReportingManagerId,
                    e.DepartmentId,
                    e.DesignationId
                })
                .ToListAsync(ct);

            var depts = await _db.Departments.Where(d => d.TenantId == tenantId && !d.IsDeleted).ToDictionaryAsync(d => d.Id, d => d.Name, ct);
            var desigs = await _db.Designations.Where(d => d.TenantId == tenantId && !d.IsDeleted).ToDictionaryAsync(d => d.Id, d => d.Name, ct);
            var allEmpNames = await _db.Employees.Where(e => e.TenantId == tenantId).ToDictionaryAsync(e => e.Id, e => e.FullName ?? "Unnamed", ct);

            var groupedReports = directReports.ToLookup(r => r.ReportingManagerId!.Value);

            var result = new List<OrphanRiskDto>();

            foreach (var mgr in exitingManagers)
            {
                var reports = groupedReports[mgr.Id].ToList();
                if (!reports.Any()) continue; // No orphan risk if no direct reports

                result.Add(new OrphanRiskDto
                {
                    ExitingManagerId = mgr.Id,
                    ExitingManagerName = mgr.FullName ?? "Unnamed",
                    ExitingManagerCode = mgr.EmployeeCode,
                    Status = mgr.Status ?? "Exit",
                    ExitDate = mgr.ExitDate,
                    SkipLevelManagerId = mgr.ReportingManagerId,
                    SkipLevelManagerName = mgr.ReportingManagerId.HasValue ? allEmpNames.GetValueOrDefault(mgr.ReportingManagerId.Value) : "Organization Head",
                    DirectReportsCount = reports.Count,
                    DirectReports = reports.Select(r => new EmployeeSummaryDto
                    {
                        Id = r.Id,
                        FullName = r.FullName ?? "Unnamed",
                        EmployeeCode = r.EmployeeCode,
                        Department = r.DepartmentId.HasValue ? depts.GetValueOrDefault(r.DepartmentId.Value) : null,
                        Designation = r.DesignationId.HasValue ? desigs.GetValueOrDefault(r.DesignationId.Value) : null
                    }).ToList()
                });
            }

            return Ok(result);
        }

        [HttpPost("orphan-risks/{managerId}/reassign-to-skip-level")]
        public async Task<IActionResult> ReassignOrphansToSkipLevel(
            Guid managerId,
            [FromQuery] Guid? targetManagerId = null,
            CancellationToken ct = default)
        {
            var tenantId = CurrentTenantId;
            var manager = await _db.Employees
                .FirstOrDefaultAsync(e => e.Id == managerId && e.TenantId == tenantId, ct);

            if (manager == null) return NotFound(new { message = "Exiting manager not found." });

            var effectiveTargetId = targetManagerId ?? manager.ReportingManagerId;

            // Direct reports of exiting manager
            var reports = await _db.Employees
                .Where(e => e.TenantId == tenantId && !e.IsDeleted && e.ReportingManagerId == managerId)
                .ToListAsync(ct);

            if (!reports.Any())
            {
                return Ok(new { message = "No direct reports found for this manager.", count = 0 });
            }

            foreach (var report in reports)
            {
                report.ReportingManagerId = effectiveTargetId;
                report.ManagerId = effectiveTargetId;
                report.UpdatedAt = DateTime.UtcNow;

                _db.HrLifecycleTasks.Add(new HrLifecycleTask
                {
                    TenantId = tenantId,
                    EmployeeId = report.Id,
                    Kind = "OrphanPrevention",
                    Title = "Reassigned to Skip-Level Manager",
                    Notes = $"Automated fallback reassignment due to manager {manager.FullName} exit.",
                    Status = "Completed",
                    CompletedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync(ct);

            return Ok(new
            {
                message = $"Successfully reassigned {reports.Count} direct reports to Skip-Level Manager.",
                targetManagerId = effectiveTargetId,
                reassignedCount = reports.Count
            });
        }

        // ==========================================
        // 6. PROCESS D: DELEGATION OF AUTHORITY (DoA)
        // ==========================================
        [HttpPost("delegations")]
        public async Task<IActionResult> DelegateAuthority([FromBody] DelegateAuthorityRequestDto dto, CancellationToken ct = default)
        {
            var tenantId = CurrentTenantId;
            var userId = GetUserId();

            // Find employee linked to this user or take from query
            var manager = await _db.Employees
                .FirstOrDefaultAsync(e => e.TenantId == tenantId && (e.UserId == userId || e.Id == dto.ActingManagerId) && !e.IsDeleted, ct);

            if (manager == null)
            {
                manager = await _db.Employees.FirstOrDefaultAsync(e => e.TenantId == tenantId && !e.IsDeleted, ct);
            }

            if (dto.ActingManagerId.HasValue && dto.ActingManagerId.Value == manager!.Id)
            {
                return BadRequest(new { message = "Cannot delegate authority to yourself." });
            }

            manager!.ActingManagerId = dto.ActingManagerId;
            manager.DelegationStartDate = dto.StartDate ?? DateTime.UtcNow;
            manager.DelegationEndDate = dto.EndDate ?? DateTime.UtcNow.AddDays(7);
            manager.DelegationReason = dto.Reason;
            manager.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);

            return Ok(new
            {
                message = "Delegation of Authority configured successfully.",
                managerId = manager.Id,
                actingManagerId = manager.ActingManagerId,
                startDate = manager.DelegationStartDate,
                endDate = manager.DelegationEndDate
            });
        }

        [HttpGet("delegations")]
        public async Task<IActionResult> GetDelegations(CancellationToken ct = default)
        {
            var tenantId = CurrentTenantId;
            var delegations = await _db.Employees
                .AsNoTracking()
                .Where(e => e.TenantId == tenantId && !e.IsDeleted && e.ActingManagerId.HasValue)
                .Select(e => new
                {
                    ManagerId = e.Id,
                    ManagerName = e.FullName,
                    e.EmployeeCode,
                    e.ActingManagerId,
                    e.DelegationStartDate,
                    e.DelegationEndDate,
                    e.DelegationReason
                })
                .ToListAsync(ct);

            var actingIds = delegations.Select(d => d.ActingManagerId!.Value).Distinct().ToList();
            var names = await _db.Employees
                .AsNoTracking()
                .Where(e => actingIds.Contains(e.Id))
                .ToDictionaryAsync(e => e.Id, e => e.FullName ?? "Unnamed", ct);

            var result = delegations.Select(d => new
            {
                d.ManagerId,
                d.ManagerName,
                d.EmployeeCode,
                d.ActingManagerId,
                ActingManagerName = names.GetValueOrDefault(d.ActingManagerId!.Value),
                d.DelegationStartDate,
                d.DelegationEndDate,
                d.DelegationReason,
                IsActive = (!d.DelegationStartDate.HasValue || d.DelegationStartDate.Value <= DateTime.UtcNow) &&
                           (!d.DelegationEndDate.HasValue || d.DelegationEndDate.Value >= DateTime.UtcNow)
            });

            return Ok(result);
        }

        [HttpDelete("delegations/{employeeId}")]
        public async Task<IActionResult> RevokeDelegation(Guid employeeId, CancellationToken ct = default)
        {
            var tenantId = CurrentTenantId;
            var emp = await _db.Employees
                .FirstOrDefaultAsync(e => e.Id == employeeId && e.TenantId == tenantId && !e.IsDeleted, ct);

            if (emp == null) return NotFound(new { message = "Employee not found." });

            emp.ActingManagerId = null;
            emp.DelegationStartDate = null;
            emp.DelegationEndDate = null;
            emp.DelegationReason = null;
            emp.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Delegation revoked successfully." });
        }

        // ==========================================
        // 7. PROCESS: MANAGER "MY TEAM" PORTAL
        // ==========================================
        [HttpGet("my-team")]
        public async Task<ActionResult<MyTeamDashboardDto>> GetMyTeamDashboard(
            [FromQuery] Guid? managerId = null,
            CancellationToken ct = default)
        {
            var tenantId = CurrentTenantId;
            var userId = GetUserId();

            Employee? manager = null;
            if (managerId.HasValue)
            {
                manager = await _db.Employees
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == managerId.Value && e.TenantId == tenantId && !e.IsDeleted, ct);
            }
            else
            {
                manager = await _db.Employees
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.UserId == userId && e.TenantId == tenantId && !e.IsDeleted, ct);
            }

            if (manager == null)
            {
                // Fallback for demo / testing if logged-in user is admin without explicit employee link
                var firstManagerId = await _db.Employees
                    .AsNoTracking()
                    .Where(e => e.TenantId == tenantId && !e.IsDeleted && e.ReportingManagerId.HasValue)
                    .Select(e => e.ReportingManagerId)
                    .FirstOrDefaultAsync(ct);

                if (firstManagerId.HasValue)
                {
                    manager = await _db.Employees
                        .AsNoTracking()
                        .FirstOrDefaultAsync(e => e.Id == firstManagerId.Value && e.TenantId == tenantId && !e.IsDeleted, ct);
                }
            }

            if (manager == null)
            {
                return NotFound(new { message = "No manager profile found." });
            }

            var now = DateTime.UtcNow;
            var today = now.Date;

            // Direct reports of this manager OR where this manager is acting manager under active delegation
            var directReports = await _db.Employees
                .AsNoTracking()
                .Where(e => e.TenantId == tenantId && !e.IsDeleted && e.Status == "Active" &&
                           (e.ReportingManagerId == manager.Id || e.ManagerId == manager.Id))
                .ToListAsync(ct);

            var reportIds = directReports.Select(r => r.Id).ToList();

            // Attendance records for today
            var todayPunches = await _db.AttendanceRecords
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && !a.IsDeleted &&
                            reportIds.Contains(a.EmployeeId) &&
                            a.Timestamp.Date == today)
                .OrderBy(a => a.Timestamp)
                .ToListAsync(ct);

            var punchesByEmp = todayPunches.ToLookup(p => p.EmployeeId);

            // Approved leaves covering today
            var leavesToday = await _db.LeaveRequests
                .AsNoTracking()
                .Where(l => l.TenantId == tenantId && !l.IsDeleted &&
                            reportIds.Contains(l.EmployeeId) &&
                            l.Status == "Approved" &&
                            l.FromDate.Date <= today && l.ToDate.Date >= today)
                .Select(l => l.EmployeeId)
                .Distinct()
                .ToListAsync(ct);

            var onLeaveSet = new HashSet<Guid>(leavesToday);

            // Leave balances for current year
            var balances = await _db.EmployeeLeaves
                .AsNoTracking()
                .Where(b => b.TenantId == tenantId && !b.IsDeleted &&
                            reportIds.Contains(b.EmployeeId) &&
                            b.Year == today.Year)
                .ToListAsync(ct);

            var balanceByEmp = balances.GroupBy(b => b.EmployeeId)
                .ToDictionary(g => g.Key, g => g.Sum(x => x.Balance));

            // Departments & Designations lookup
            var depts = await _db.Departments
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && !d.IsDeleted)
                .ToDictionaryAsync(d => d.Id, d => d.Name, ct);

            var desigs = await _db.Designations
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId && !d.IsDeleted)
                .ToDictionaryAsync(d => d.Id, d => d.Name, ct);

            // Map team member DTOs
            var memberDtos = new List<MyTeamMemberDto>();
            int presentCount = 0;
            int onLeaveCount = 0;
            int notCheckedInCount = 0;

            foreach (var emp in directReports)
            {
                string status = "Not Checked In";
                string? firstPunch = null;

                if (onLeaveSet.Contains(emp.Id))
                {
                    status = "On Leave";
                    onLeaveCount++;
                }
                else
                {
                    var empPunches = punchesByEmp[emp.Id].ToList();
                    if (empPunches.Any())
                    {
                        status = "Present";
                        firstPunch = empPunches.First().Timestamp.ToString("hh:mm tt");
                        presentCount++;
                    }
                    else
                    {
                        notCheckedInCount++;
                    }
                }

                memberDtos.Add(new MyTeamMemberDto
                {
                    Id = emp.Id,
                    FullName = emp.FullName ?? "Unnamed",
                    EmployeeCode = emp.EmployeeCode,
                    Designation = emp.DesignationId.HasValue ? desigs.GetValueOrDefault(emp.DesignationId.Value) : null,
                    Department = emp.DepartmentId.HasValue ? depts.GetValueOrDefault(emp.DepartmentId.Value) : null,
                    WorkEmail = emp.WorkEmail,
                    Phone = emp.Phone,
                    DateOfJoining = emp.DateOfJoining,
                    Status = emp.Status ?? "Active",
                    TodayAttendanceStatus = status,
                    FirstPunchInTime = firstPunch,
                    LeaveBalance = balanceByEmp.GetValueOrDefault(emp.Id, 0)
                });
            }

            // Pending Leave Requests from direct reports
            var pendingLeavesRaw = await _db.LeaveRequests
                .AsNoTracking()
                .Where(l => l.TenantId == tenantId && !l.IsDeleted &&
                            reportIds.Contains(l.EmployeeId) &&
                            l.Status == "Pending")
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync(ct);

            var policyNames = await _db.LeavePolicies
                .AsNoTracking()
                .Where(p => p.TenantId == tenantId && !p.IsDeleted)
                .ToDictionaryAsync(p => p.Id, p => p.Name, ct);

            var empNameMap = directReports.ToDictionary(e => e.Id, e => e.FullName ?? "Unnamed");

            var pendingLeaves = pendingLeavesRaw.Select(l => new LeaveRequestDto
            {
                Id = l.Id,
                EmployeeId = l.EmployeeId,
                EmployeeName = empNameMap.GetValueOrDefault(l.EmployeeId, "Employee"),
                LeavePolicyId = l.LeavePolicyId,
                LeavePolicyName = policyNames.GetValueOrDefault(l.LeavePolicyId, "Leave"),
                FromDate = l.FromDate,
                ToDate = l.ToDate,
                Days = l.Days,
                Period = l.Period.ToString(),
                Status = l.Status,
                Reason = l.Reason,
                CreatedAt = l.CreatedAt
            }).ToList();

            var mgrDesig = manager.DesignationId.HasValue ? desigs.GetValueOrDefault(manager.DesignationId.Value) : null;

            return Ok(new MyTeamDashboardDto
            {
                ManagerId = manager.Id,
                ManagerName = manager.FullName ?? "Manager",
                ManagerCode = manager.EmployeeCode,
                ManagerDesignation = mgrDesig,
                TotalTeamMembers = directReports.Count,
                PresentToday = presentCount,
                OnLeaveToday = onLeaveCount,
                NotCheckedInToday = notCheckedInCount,
                PendingApprovalsCount = pendingLeaves.Count,
                TeamMembers = memberDtos.OrderBy(m => m.FullName).ToList(),
                PendingLeaves = pendingLeaves
            });
        }

        // ==========================================
        // HELPER: CYCLE DETECTION (ANCESTOR TRAVERSAL)
        // ==========================================
        private async Task<bool> WouldCreateCycleAsync(Guid employeeId, Guid newManagerId, Guid tenantId, CancellationToken ct)
        {
            if (employeeId == newManagerId) return true;

            var currentAncestorId = (Guid?)newManagerId;
            var visited = new HashSet<Guid>();

            while (currentAncestorId.HasValue)
            {
                if (currentAncestorId.Value == employeeId)
                {
                    return true; // Loop detected! Employee is already an ancestor of newManagerId
                }

                if (!visited.Add(currentAncestorId.Value))
                {
                    return true; // Graph loop detected
                }

                currentAncestorId = await _db.Employees
                    .AsNoTracking()
                    .Where(e => e.Id == currentAncestorId.Value && e.TenantId == tenantId && !e.IsDeleted)
                    .Select(e => e.ReportingManagerId)
                    .FirstOrDefaultAsync(ct);
            }

            return false;
        }
    }
}
