using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Api.Authorization;
using UabIndia.Infrastructure.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/overtime")]
    [Route("api/v1/hrms/overtime")]
    [Route("api/overtime")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class OvertimeController : ControllerBase
    {
        private readonly IOvertimeRepository _overtimeRepository;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ILogger<OvertimeController> _logger;
        private readonly ApplicationDbContext _db;

        public OvertimeController(
            IOvertimeRepository overtimeRepository,
            ITenantAccessor tenantAccessor,
            ILogger<OvertimeController> logger,
            ApplicationDbContext db)
        {
            _overtimeRepository = overtimeRepository;
            _tenantAccessor = tenantAccessor;
            _logger = logger;
            _db = db;
        }

        #region Overtime Request Endpoints

        /// <summary>
        /// Get all overtime requests (paginated)
        /// </summary>
        [HttpGet("requests")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<IEnumerable<OvertimeRequestDto>>> GetAllRequests([FromQuery] int skip = 0, [FromQuery] int take = 50)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var requests = (await _overtimeRepository.GetAllOvertimeRequestsAsync(tenantId, skip, take)).ToList();
                var employeeNames = await GetEmployeeNamesAsync(
                    requests.Select(r => r.EmployeeId)
                        .Concat(requests.Where(r => r.ManagerId.HasValue).Select(r => r.ManagerId!.Value)),
                    tenantId);
                return Ok(requests.Select(request => MapToOvertimeRequestDto(request, employeeNames)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving overtime requests");
                return StatusCode(500, "An error occurred while retrieving overtime requests");
            }
        }

        /// <summary>
        /// Get overtime request by ID
        /// </summary>
        [HttpGet("requests/{id}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<OvertimeRequestDto>> GetRequestById(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var request = await _overtimeRepository.GetOvertimeRequestByIdAsync(id, tenantId);

                if (request == null)
                    return NotFound($"Overtime request with ID {id} not found");

                var employeeNames = await GetEmployeeNamesAsync(
                    new[] { request.EmployeeId }.Concat(request.ManagerId.HasValue ? new[] { request.ManagerId.Value } : Array.Empty<Guid>()),
                    tenantId);

                return Ok(MapToOvertimeRequestDto(request, employeeNames));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving overtime request {RequestId}", id);
                return StatusCode(500, "An error occurred while retrieving the overtime request");
            }
        }

        /// <summary>
        /// Get overtime requests by employee
        /// </summary>
        [HttpGet("requests/employee/{employeeId}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<IEnumerable<OvertimeRequestDto>>> GetRequestsByEmployee(Guid employeeId)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var requests = (await _overtimeRepository.GetOvertimeRequestsByEmployeeAsync(employeeId, tenantId)).ToList();
                var employeeNames = await GetEmployeeNamesAsync(
                    requests.Select(r => r.EmployeeId)
                        .Concat(requests.Where(r => r.ManagerId.HasValue).Select(r => r.ManagerId!.Value))
                        .Append(employeeId),
                    tenantId);
                return Ok(requests.Select(request => MapToOvertimeRequestDto(request, employeeNames)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving requests for employee {EmployeeId}", employeeId);
                return StatusCode(500, "An error occurred while retrieving overtime requests");
            }
        }

        /// <summary>
        /// Get pending overtime requests
        /// </summary>
        [HttpGet("requests/pending")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<IEnumerable<OvertimeRequestDto>>> GetPendingRequests()
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var requests = (await _overtimeRepository.GetPendingOvertimeRequestsAsync(tenantId)).ToList();
                var employeeNames = await GetEmployeeNamesAsync(
                    requests.Select(r => r.EmployeeId)
                        .Concat(requests.Where(r => r.ManagerId.HasValue).Select(r => r.ManagerId!.Value)),
                    tenantId);
                return Ok(requests.Select(request => MapToOvertimeRequestDto(request, employeeNames)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending overtime requests");
                return StatusCode(500, "An error occurred while retrieving pending requests");
            }
        }

        /// <summary>
        /// Create overtime request
        /// </summary>
        [HttpPost("requests")]
        [Authorize(Roles = "Admin,HR,Employee")]
        [PolicyCheck("overtime", "request")]
        public async Task<ActionResult<OvertimeRequestDto>> CreateRequest([FromBody] CreateOvertimeRequestDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();

                var request = new OvertimeRequest
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    EmployeeId = dto.EmployeeId,
                    OvertimeDate = dto.OvertimeDate,
                    StartTime = dto.StartTime,
                    EndTime = dto.EndTime,
                    BreakMinutes = dto.BreakMinutes,
                    Reason = dto.Reason,
                    ProjectCode = dto.ProjectCode,
                    ProjectId = dto.ProjectId,
                    OvertimeType = dto.OvertimeType,
                    ManagerId = dto.ManagerId,
                    IsPreApproved = dto.IsPreApproved,
                    CompensationType = dto.CompensationType,
                    OvertimeRate = dto.OvertimeRate,
                    EmployeeNotes = dto.EmployeeNotes,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _overtimeRepository.CreateOvertimeRequestAsync(request);
                var employeeNames = await GetEmployeeNamesAsync(
                    new[] { created.EmployeeId }.Concat(created.ManagerId.HasValue ? new[] { created.ManagerId.Value } : Array.Empty<Guid>()),
                    tenantId);

                return CreatedAtAction(nameof(GetRequestById), new { id = created.Id }, MapToOvertimeRequestDto(created, employeeNames));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating overtime request");
                return StatusCode(500, "An error occurred while creating the overtime request");
            }
        }

        /// <summary>
        /// Update overtime request
        /// </summary>
        [HttpPut("requests/{id}")]
        [Authorize(Roles = "Admin,HR,Employee")]
        public async Task<ActionResult<OvertimeRequestDto>> UpdateRequest(Guid id, [FromBody] UpdateOvertimeRequestDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var request = await _overtimeRepository.GetOvertimeRequestByIdAsync(id, tenantId);

                if (request == null)
                    return NotFound($"Overtime request with ID {id} not found");

                request.OvertimeDate = dto.OvertimeDate;
                request.StartTime = dto.StartTime;
                request.EndTime = dto.EndTime;
                request.BreakMinutes = dto.BreakMinutes;
                request.Reason = dto.Reason;
                request.ProjectId = dto.ProjectId;
                request.CompensationType = dto.CompensationType;
                request.EmployeeNotes = dto.EmployeeNotes;
                request.UpdatedAt = DateTime.UtcNow;

                var updated = await _overtimeRepository.UpdateOvertimeRequestAsync(request);
                var employeeNames = await GetEmployeeNamesAsync(
                    new[] { updated.EmployeeId }.Concat(updated.ManagerId.HasValue ? new[] { updated.ManagerId.Value } : Array.Empty<Guid>()),
                    tenantId);

                return Ok(MapToOvertimeRequestDto(updated, employeeNames));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating overtime request {RequestId}", id);
                return StatusCode(500, "An error occurred while updating the overtime request");
            }
        }

        /// <summary>
        /// Delete overtime request
        /// </summary>
        [HttpDelete("requests/{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> DeleteRequest(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var request = await _overtimeRepository.GetOvertimeRequestByIdAsync(id, tenantId);

                if (request == null)
                    return NotFound($"Overtime request with ID {id} not found");

                await _overtimeRepository.DeleteOvertimeRequestAsync(id, tenantId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting overtime request {RequestId}", id);
                return StatusCode(500, "An error occurred while deleting the overtime request");
            }
        }

        #endregion

        #region Overtime Approval Endpoints

        /// <summary>
        /// Get approvals for overtime request
        /// </summary>
        [HttpGet("approvals/request/{requestId}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<IEnumerable<OvertimeApprovalDto>>> GetApprovalsByRequest(Guid requestId)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var approvals = await _overtimeRepository.GetApprovalsByRequestAsync(requestId, tenantId);
                return Ok(approvals.Select(MapToOvertimeApprovalDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving approvals for request {RequestId}", requestId);
                return StatusCode(500, "An error occurred while retrieving approvals");
            }
        }

        /// <summary>
        /// Get pending approvals for approver
        /// </summary>
        [HttpGet("approvals/pending/{approverId}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<IEnumerable<OvertimeApprovalDto>>> GetPendingApprovals(Guid approverId)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var approvals = await _overtimeRepository.GetPendingApprovalsAsync(approverId, tenantId);
                return Ok(approvals.Select(MapToOvertimeApprovalDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending approvals for {ApproverId}", approverId);
                return StatusCode(500, "An error occurred while retrieving pending approvals");
            }
        }

        /// <summary>
        /// Create/update overtime approval
        /// </summary>
        [HttpPost("approvals")]
        [PolicyCheck("overtime", "approve")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<OvertimeApprovalDto>> CreateApproval([FromBody] CreateOvertimeApprovalDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();

                // Get current user info (would come from JWT claims in production)
                var approverId = Guid.NewGuid(); // Placeholder
                var approverName = "Manager Name"; // Would come from user context
                var approverRole = "Manager"; // Would come from user context

                var approval = new OvertimeApproval
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    OvertimeRequestId = dto.OvertimeRequestId,
                    ApproverId = approverId,
                    ApproverName = approverName,
                    ApproverRole = approverRole,
                    Status = dto.Status,
                    ApprovalNotes = dto.ApprovalNotes,
                    RejectionReason = dto.RejectionReason,
                    ApprovedHours = dto.ApprovedHours,
                    ApprovedAmount = dto.ApprovedAmount,
                    ApprovalLevel = 1,
                    IsRequired = true,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _overtimeRepository.CreateOvertimeApprovalAsync(approval);

                // Update request status based on approval
                var request = await _overtimeRepository.GetOvertimeRequestByIdAsync(dto.OvertimeRequestId, tenantId);
                if (request != null)
                {
                    if (dto.Status == ApprovalStatus.Approved)
                    {
                        request.Status = OvertimeRequestStatus.Approved;
                    }
                    else if (dto.Status == ApprovalStatus.Rejected)
                    {
                        request.Status = OvertimeRequestStatus.Rejected;
                    }
                    await _overtimeRepository.UpdateOvertimeRequestAsync(request);
                }

                return CreatedAtAction(nameof(GetApprovalsByRequest), new { requestId = created.OvertimeRequestId }, MapToOvertimeApprovalDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating overtime approval");
                return StatusCode(500, "An error occurred while creating the approval");
            }
        }

        #endregion

        #region Overtime Log Endpoints

        /// <summary>
        /// Get all overtime logs
        /// </summary>
        [HttpGet("logs")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<IEnumerable<OvertimeLogDto>>> GetAllLogs([FromQuery] int skip = 0, [FromQuery] int take = 50)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var logs = (await _overtimeRepository.GetAllOvertimeLogsAsync(tenantId, skip, take)).ToList();
                var employeeNames = await GetEmployeeNamesAsync(logs.Select(log => log.EmployeeId), tenantId);
                return Ok(logs.Select(log => MapToOvertimeLogDto(log, employeeNames)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving overtime logs");
                return StatusCode(500, "An error occurred while retrieving overtime logs");
            }
        }

        /// <summary>
        /// Get overtime logs by employee
        /// </summary>
        [HttpGet("logs/employee/{employeeId}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<IEnumerable<OvertimeLogDto>>> GetLogsByEmployee(Guid employeeId)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var logs = (await _overtimeRepository.GetOvertimeLogsByEmployeeAsync(employeeId, tenantId)).ToList();
                var employeeNames = await GetEmployeeNamesAsync(logs.Select(log => log.EmployeeId).Append(employeeId), tenantId);
                return Ok(logs.Select(log => MapToOvertimeLogDto(log, employeeNames)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving logs for employee {EmployeeId}", employeeId);
                return StatusCode(500, "An error occurred while retrieving overtime logs");
            }
        }

        /// <summary>
        /// Get unprocessed overtime logs
        /// </summary>
        [HttpGet("logs/unprocessed")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<IEnumerable<OvertimeLogDto>>> GetUnprocessedLogs()
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var logs = (await _overtimeRepository.GetUnprocessedOvertimeLogsAsync(tenantId)).ToList();
                var employeeNames = await GetEmployeeNamesAsync(logs.Select(log => log.EmployeeId), tenantId);
                return Ok(logs.Select(log => MapToOvertimeLogDto(log, employeeNames)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving unprocessed overtime logs");
                return StatusCode(500, "An error occurred while retrieving unprocessed logs");
            }
        }

        /// <summary>
        /// Create overtime log
        /// </summary>
        [HttpPost("logs")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<OvertimeLogDto>> CreateLog([FromBody] CreateOvertimeLogDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();

                var log = new OvertimeLog
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    OvertimeRequestId = dto.OvertimeRequestId,
                    EmployeeId = dto.EmployeeId,
                    OvertimeDate = dto.OvertimeDate,
                    OvertimeHours = dto.OvertimeHours,
                    OvertimeRate = dto.OvertimeRate,
                    OvertimeType = dto.OvertimeType,
                    CompensationType = dto.CompensationType,
                    CompensatoryLeaveHours = dto.CompensatoryLeaveHours,
                    CompensatoryLeaveExpiryDate = dto.CompensatoryLeaveExpiryDate,
                    Notes = dto.Notes,
                    ProjectId = dto.ProjectId,
                    IsProcessedInPayroll = false,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _overtimeRepository.CreateOvertimeLogAsync(log);
                var employeeNames = await GetEmployeeNamesAsync(new[] { created.EmployeeId }, tenantId);

                return CreatedAtAction(nameof(GetLogsByEmployee), new { employeeId = created.EmployeeId }, MapToOvertimeLogDto(created, employeeNames));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating overtime log");
                return StatusCode(500, "An error occurred while creating the overtime log");
            }
        }

        #endregion

        #region Statistics Endpoints

        /// <summary>
        /// Get overtime statistics for employee
        /// </summary>
        [HttpGet("statistics/employee/{employeeId}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<object>> GetEmployeeStatistics(Guid employeeId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var totalHours = await _overtimeRepository.GetTotalOvertimeHoursAsync(employeeId, startDate, endDate, tenantId);
                var totalAmount = await _overtimeRepository.GetTotalOvertimeAmountAsync(employeeId, startDate, endDate, tenantId);

                return Ok(new
                {
                    employeeId,
                    startDate,
                    endDate,
                    totalHours,
                    totalAmount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving statistics for employee {EmployeeId}", employeeId);
                return StatusCode(500, "An error occurred while retrieving statistics");
            }
        }

        #endregion

        #region Helper Methods

        private OvertimeRequestDto MapToOvertimeRequestDto(OvertimeRequest request, IReadOnlyDictionary<Guid, string?> employeeNames)
        {
            employeeNames.TryGetValue(request.EmployeeId, out var employeeName);
            string? managerName = null;
            if (request.ManagerId.HasValue)
            {
                employeeNames.TryGetValue(request.ManagerId.Value, out managerName);
            }

            return new OvertimeRequestDto
            {
                Id = request.Id,
                EmployeeId = request.EmployeeId,
                EmployeeName = employeeName ?? string.Empty,
                OvertimeDate = request.OvertimeDate,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                TotalHours = request.TotalHours,
                BreakMinutes = request.BreakMinutes,
                NetOvertimeHours = request.NetOvertimeHours,
                Reason = request.Reason,
                ProjectCode = request.ProjectCode,
                ProjectId = request.ProjectId,
                OvertimeType = request.OvertimeType,
                Status = request.Status,
                ManagerId = request.ManagerId,
                ManagerName = managerName,
                IsPreApproved = request.IsPreApproved,
                CompensationType = request.CompensationType,
                OvertimeRate = request.OvertimeRate,
                OvertimeAmount = request.OvertimeAmount,
                EmployeeNotes = request.EmployeeNotes,
                IsActualWorked = request.IsActualWorked,
                ActualWorkedHours = request.ActualWorkedHours,
                ApprovalCount = request.Approvals?.Count ?? 0,
                CreatedAt = request.CreatedAt
            };
        }

        private OvertimeApprovalDto MapToOvertimeApprovalDto(OvertimeApproval approval)
        {
            return new OvertimeApprovalDto
            {
                Id = approval.Id,
                OvertimeRequestId = approval.OvertimeRequestId,
                ApproverId = approval.ApproverId,
                ApproverName = approval.ApproverName,
                ApproverRole = approval.ApproverRole,
                Status = approval.Status,
                ApprovedDate = approval.ApprovedDate,
                RejectedDate = approval.RejectedDate,
                ApprovalNotes = approval.ApprovalNotes,
                RejectionReason = approval.RejectionReason,
                ApprovalLevel = approval.ApprovalLevel,
                IsRequired = approval.IsRequired,
                ApprovedHours = approval.ApprovedHours,
                ApprovedAmount = approval.ApprovedAmount,
                CreatedAt = approval.CreatedAt
            };
        }

        private OvertimeLogDto MapToOvertimeLogDto(OvertimeLog log, IReadOnlyDictionary<Guid, string?> employeeNames)
        {
            employeeNames.TryGetValue(log.EmployeeId, out var employeeName);

            return new OvertimeLogDto
            {
                Id = log.Id,
                OvertimeRequestId = log.OvertimeRequestId,
                EmployeeId = log.EmployeeId,
                EmployeeName = employeeName ?? string.Empty,
                OvertimeDate = log.OvertimeDate,
                OvertimeHours = log.OvertimeHours,
                OvertimeRate = log.OvertimeRate,
                OvertimeAmount = log.OvertimeAmount,
                OvertimeType = log.OvertimeType,
                CompensationType = log.CompensationType,
                IsProcessedInPayroll = log.IsProcessedInPayroll,
                PayrollRunId = log.PayrollRunId,
                PayrollProcessedDate = log.PayrollProcessedDate,
                CompensatoryLeaveHours = log.CompensatoryLeaveHours,
                CompensatoryLeaveExpiryDate = log.CompensatoryLeaveExpiryDate,
                IsCompensatoryLeaveUtilized = log.IsCompensatoryLeaveUtilized,
                Notes = log.Notes,
                ProjectCode = log.ProjectCode,
                ProjectId = log.ProjectId,
                CreatedAt = log.CreatedAt
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

        #endregion
    }
}
