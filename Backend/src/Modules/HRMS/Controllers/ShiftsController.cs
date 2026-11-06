using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Services;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/shifts")]
    [Route("api/v1/hrms/shifts")]
    [Route("api/shifts")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class ShiftsController : ControllerBase
    {
        private readonly IShiftRepository _shiftRepository;
        private readonly IDistributedCache _cache;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ILogger<ShiftsController> _logger;

        public ShiftsController(
            IShiftRepository shiftRepository,
            IDistributedCache cache,
            ITenantAccessor tenantAccessor,
            ILogger<ShiftsController> logger)
        {
            _shiftRepository = shiftRepository;
            _cache = cache;
            _tenantAccessor = tenantAccessor;
            _logger = logger;
        }

        #region Shift Endpoints

        /// <summary>
        /// Get all shifts (cached, paginated)
        /// </summary>
        [HttpGet]
        [HttpGet("shifts")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<IEnumerable<ShiftDto>>> GetAllShifts([FromQuery] int skip = 0, [FromQuery] int take = 20)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var cacheKey = $"shifts:all:{tenantId}:{skip}:{take}";

                var cached = await _cache.GetStringAsync(cacheKey);
                if (cached != null)
                {
                    var cachedShifts = System.Text.Json.JsonSerializer.Deserialize<List<ShiftDto>>(cached);
                    return Ok(cachedShifts);
                }

                var shifts = await _shiftRepository.GetAllShiftsAsync(tenantId, skip, take);
                var shiftDtos = shifts.Select(MapToShiftDto).ToList();

                var cacheOptions = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
                };
                await _cache.SetStringAsync(cacheKey, System.Text.Json.JsonSerializer.Serialize(shiftDtos), cacheOptions);

                return Ok(shiftDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all shifts");
                return StatusCode(500, "An error occurred while retrieving shifts");
            }
        }

        /// <summary>
        /// Get shift by ID
        /// </summary>
        [HttpGet("shifts/{id}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<ShiftDto>> GetShiftById(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var shift = await _shiftRepository.GetShiftByIdAsync(id, tenantId);

                if (shift == null)
                    return NotFound($"Shift with ID {id} not found");

                return Ok(MapToShiftDto(shift));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shift {ShiftId}", id);
                return StatusCode(500, "An error occurred while retrieving the shift");
            }
        }

        /// <summary>
        /// Get active shifts
        /// </summary>
        [HttpGet("shifts/active")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<IEnumerable<ShiftDto>>> GetActiveShifts()
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var shifts = await _shiftRepository.GetActiveShiftsAsync(tenantId);
                return Ok(shifts.Select(MapToShiftDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active shifts");
                return StatusCode(500, "An error occurred while retrieving active shifts");
            }
        }

        /// <summary>
        /// Get shifts by type
        /// </summary>
        [HttpGet("shifts/type/{shiftType}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<IEnumerable<ShiftDto>>> GetShiftsByType(ShiftType shiftType)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var shifts = await _shiftRepository.GetShiftsByTypeAsync(shiftType, tenantId);
                return Ok(shifts.Select(MapToShiftDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shifts by type {ShiftType}", shiftType);
                return StatusCode(500, "An error occurred while retrieving shifts");
            }
        }

        /// <summary>
        /// Create a new shift
        /// </summary>
        [HttpPost("shifts")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<ShiftDto>> CreateShift([FromBody] CreateShiftDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();

                // Check if shift code already exists
                if (await _shiftRepository.ShiftCodeExistsAsync(dto.ShiftCode, tenantId))
                    return BadRequest($"Shift code '{dto.ShiftCode}' already exists");

                var shift = new Shift
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    ShiftName = dto.ShiftName,
                    ShiftCode = dto.ShiftCode,
                    Description = dto.Description,
                    StartTime = dto.StartTime,
                    EndTime = dto.EndTime,
                    DurationHours = dto.DurationHours,
                    GracePeriodMinutes = dto.GracePeriodMinutes,
                    BreakDurationMinutes = dto.BreakDurationMinutes,
                    ShiftType = dto.ShiftType,
                    ApplicableDays = dto.ApplicableDays,
                    IsNightShift = dto.IsNightShift,
                    AllowOvernightCrossMidnight = dto.AllowOvernightCrossMidnight,
                    EarlyExitToleranceMinutes = dto.EarlyExitToleranceMinutes,
                    SplitSlot1StartTime = dto.SplitSlot1StartTime,
                    SplitSlot1EndTime = dto.SplitSlot1EndTime,
                    SplitSlot2StartTime = dto.SplitSlot2StartTime,
                    SplitSlot2EndTime = dto.SplitSlot2EndTime,
                    IsFlexiShift = dto.IsFlexiShift,
                    CoreStartTime = dto.CoreStartTime,
                    CoreEndTime = dto.CoreEndTime,
                    FlexiWindowStart = dto.FlexiWindowStart,
                    FlexiWindowEnd = dto.FlexiWindowEnd,
                    Is24HourShift = dto.Is24HourShift,
                    MandatoryRestHoursAfterShift = dto.MandatoryRestHoursAfterShift,
                    IsOnCallStandby = dto.IsOnCallStandby,
                    StandbyRateMultiplier = dto.StandbyRateMultiplier,
                    CountryId = dto.CountryId,
                    CompanyId = dto.CompanyId,
                    ProjectId = dto.ProjectId,
                    OperationalLocationId = dto.OperationalLocationId,
                    NightShiftAllowance = dto.NightShiftAllowance,
                    IsActive = dto.IsActive,
                    MinEmployeesRequired = dto.MinEmployeesRequired,
                    MaxEmployeesAllowed = dto.MaxEmployeesAllowed,
                    DepartmentId = dto.DepartmentId,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _shiftRepository.CreateShiftAsync(shift);

                // Invalidate cache
                await InvalidateShiftCache(tenantId);

                return CreatedAtAction(nameof(GetShiftById), new { id = created.Id }, MapToShiftDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating shift");
                return StatusCode(500, "An error occurred while creating the shift");
            }
        }

        /// <summary>
        /// Update shift
        /// </summary>
        [HttpPut("shifts/{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<ShiftDto>> UpdateShift(Guid id, [FromBody] UpdateShiftDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var shift = await _shiftRepository.GetShiftByIdAsync(id, tenantId);

                if (shift == null)
                    return NotFound($"Shift with ID {id} not found");

                shift.ShiftName = dto.ShiftName;
                shift.Description = dto.Description;
                shift.StartTime = dto.StartTime;
                shift.EndTime = dto.EndTime;
                shift.DurationHours = dto.DurationHours;
                shift.GracePeriodMinutes = dto.GracePeriodMinutes;
                shift.BreakDurationMinutes = dto.BreakDurationMinutes;
                shift.IsNightShift = dto.IsNightShift;
                shift.AllowOvernightCrossMidnight = dto.AllowOvernightCrossMidnight;
                shift.EarlyExitToleranceMinutes = dto.EarlyExitToleranceMinutes;
                shift.SplitSlot1StartTime = dto.SplitSlot1StartTime;
                shift.SplitSlot1EndTime = dto.SplitSlot1EndTime;
                shift.SplitSlot2StartTime = dto.SplitSlot2StartTime;
                shift.SplitSlot2EndTime = dto.SplitSlot2EndTime;
                shift.IsFlexiShift = dto.IsFlexiShift;
                shift.CoreStartTime = dto.CoreStartTime;
                shift.CoreEndTime = dto.CoreEndTime;
                shift.FlexiWindowStart = dto.FlexiWindowStart;
                shift.FlexiWindowEnd = dto.FlexiWindowEnd;
                shift.Is24HourShift = dto.Is24HourShift;
                shift.MandatoryRestHoursAfterShift = dto.MandatoryRestHoursAfterShift;
                shift.IsOnCallStandby = dto.IsOnCallStandby;
                shift.StandbyRateMultiplier = dto.StandbyRateMultiplier;
                shift.CountryId = dto.CountryId;
                shift.CompanyId = dto.CompanyId;
                shift.ProjectId = dto.ProjectId;
                shift.OperationalLocationId = dto.OperationalLocationId;
                shift.NightShiftAllowance = dto.NightShiftAllowance;
                shift.IsActive = dto.IsActive;
                shift.MinEmployeesRequired = dto.MinEmployeesRequired;
                shift.MaxEmployeesAllowed = dto.MaxEmployeesAllowed;
                shift.UpdatedAt = DateTime.UtcNow;

                var updated = await _shiftRepository.UpdateShiftAsync(shift);

                // Invalidate cache
                await InvalidateShiftCache(tenantId);

                return Ok(MapToShiftDto(updated));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating shift {ShiftId}", id);
                return StatusCode(500, "An error occurred while updating the shift");
            }
        }

        /// <summary>
        /// Delete shift
        /// </summary>
        [HttpDelete("shifts/{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<IActionResult> DeleteShift(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var shift = await _shiftRepository.GetShiftByIdAsync(id, tenantId);

                if (shift == null)
                    return NotFound($"Shift with ID {id} not found");

                await _shiftRepository.DeleteShiftAsync(id, tenantId);

                // Invalidate cache
                await InvalidateShiftCache(tenantId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting shift {ShiftId}", id);
                return StatusCode(500, "An error occurred while deleting the shift");
            }
        }

        #endregion

        #region Shift Assignment Endpoints

        /// <summary>
        /// Get all shift assignments
        /// </summary>
        [HttpGet("assignments")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<IEnumerable<ShiftAssignmentDto>>> GetAllAssignments([FromQuery] int skip = 0, [FromQuery] int take = 50)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var assignments = await _shiftRepository.GetAllShiftAssignmentsAsync(tenantId, skip, take);
                return Ok(assignments.Select(MapToShiftAssignmentDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shift assignments");
                return StatusCode(500, "An error occurred while retrieving assignments");
            }
        }

        /// <summary>
        /// Get shift assignments by employee
        /// </summary>
        [HttpGet("assignments/employee/{employeeId}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<IEnumerable<ShiftAssignmentDto>>> GetAssignmentsByEmployee(Guid employeeId)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var assignments = await _shiftRepository.GetShiftAssignmentsByEmployeeAsync(employeeId, tenantId);
                return Ok(assignments.Select(MapToShiftAssignmentDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving assignments for employee {EmployeeId}", employeeId);
                return StatusCode(500, "An error occurred while retrieving assignments");
            }
        }

        /// <summary>
        /// Get current shift assignment for employee
        /// </summary>
        [HttpGet("assignments/employee/{employeeId}/current")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<ShiftAssignmentDto>> GetCurrentAssignment(Guid employeeId)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var assignment = await _shiftRepository.GetCurrentShiftAssignmentAsync(employeeId, tenantId);

                if (assignment == null)
                    return NotFound($"No current shift assignment found for employee {employeeId}");

                return Ok(MapToShiftAssignmentDto(assignment));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving current assignment for employee {EmployeeId}", employeeId);
                return StatusCode(500, "An error occurred while retrieving the assignment");
            }
        }

        /// <summary>
        /// Create shift assignment
        /// </summary>
        [HttpPost("assignments")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<ShiftAssignmentDto>> CreateAssignment([FromBody] CreateShiftAssignmentDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();

                var assignment = new ShiftAssignment
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    ShiftId = dto.ShiftId,
                    EmployeeId = dto.EmployeeId,
                    EffectiveFrom = dto.EffectiveFrom,
                    EffectiveTo = dto.EffectiveTo,
                    AssignmentType = dto.AssignmentType,
                    AssignmentReason = dto.AssignmentReason,
                    Status = ShiftAssignmentStatus.Active,
                    Notes = dto.Notes,
                    IsRotational = dto.IsRotational,
                    RotationId = dto.RotationId,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _shiftRepository.CreateShiftAssignmentAsync(assignment);

                return CreatedAtAction(nameof(GetAssignmentsByEmployee), new { employeeId = created.EmployeeId }, MapToShiftAssignmentDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating shift assignment");
                return StatusCode(500, "An error occurred while creating the assignment");
            }
        }

        /// <summary>
        /// Update shift assignment
        /// </summary>
        [HttpPut("assignments/{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<ShiftAssignmentDto>> UpdateAssignment(Guid id, [FromBody] UpdateShiftAssignmentDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var assignment = await _shiftRepository.GetShiftAssignmentByIdAsync(id, tenantId);

                if (assignment == null)
                    return NotFound($"Assignment with ID {id} not found");

                assignment.EffectiveTo = dto.EffectiveTo;
                assignment.Status = dto.Status;
                assignment.Notes = dto.Notes;
                assignment.UpdatedAt = DateTime.UtcNow;

                var updated = await _shiftRepository.UpdateShiftAssignmentAsync(assignment);

                return Ok(MapToShiftAssignmentDto(updated));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating assignment {AssignmentId}", id);
                return StatusCode(500, "An error occurred while updating the assignment");
            }
        }

        #endregion

        #region Shift Swap Endpoints

        /// <summary>
        /// Get all shift swaps
        /// </summary>
        [HttpGet("swaps")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<IEnumerable<ShiftSwapDto>>> GetAllSwaps([FromQuery] int skip = 0, [FromQuery] int take = 50)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var swaps = await _shiftRepository.GetAllShiftSwapsAsync(tenantId, skip, take);
                return Ok(swaps.Select(MapToShiftSwapDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shift swaps");
                return StatusCode(500, "An error occurred while retrieving swaps");
            }
        }

        /// <summary>
        /// Get pending shift swaps
        /// </summary>
        [HttpGet("swaps/pending")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<IEnumerable<ShiftSwapDto>>> GetPendingSwaps()
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var swaps = await _shiftRepository.GetPendingShiftSwapsAsync(tenantId);
                return Ok(swaps.Select(MapToShiftSwapDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending swaps");
                return StatusCode(500, "An error occurred while retrieving pending swaps");
            }
        }

        /// <summary>
        /// Get shift swaps by employee
        /// </summary>
        [HttpGet("swaps/employee/{employeeId}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<IEnumerable<ShiftSwapDto>>> GetSwapsByEmployee(Guid employeeId)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var swaps = await _shiftRepository.GetShiftSwapsByEmployeeAsync(employeeId, tenantId);
                return Ok(swaps.Select(MapToShiftSwapDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving swaps for employee {EmployeeId}", employeeId);
                return StatusCode(500, "An error occurred while retrieving swaps");
            }
        }

        /// <summary>
        /// Create shift swap request
        /// </summary>
        [HttpPost("swaps")]
        [Authorize(Roles = "Admin,HR,Employee")]
        public async Task<ActionResult<ShiftSwapDto>> CreateSwap([FromBody] CreateShiftSwapDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();

                var swap = new ShiftSwap
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    RequestorEmployeeId = dto.RequestorEmployeeId,
                    RequestorShiftAssignmentId = dto.RequestorShiftAssignmentId,
                    TargetEmployeeId = dto.TargetEmployeeId,
                    TargetShiftAssignmentId = dto.TargetShiftAssignmentId,
                    SwapDate = dto.SwapDate,
                    Reason = dto.Reason,
                    Status = ShiftSwapStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _shiftRepository.CreateShiftSwapAsync(swap);

                return CreatedAtAction(nameof(GetSwapsByEmployee), new { employeeId = created.RequestorEmployeeId }, MapToShiftSwapDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating shift swap");
                return StatusCode(500, "An error occurred while creating the swap request");
            }
        }

        /// <summary>
        /// Update shift swap status (approve/reject)
        /// </summary>
        [HttpPut("swaps/{id}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<ShiftSwapDto>> UpdateSwap(Guid id, [FromBody] UpdateShiftSwapDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var swap = await _shiftRepository.GetShiftSwapByIdAsync(id, tenantId);

                if (swap == null)
                    return NotFound($"Swap with ID {id} not found");

                swap.Status = dto.Status;
                
                if (dto.Status == ShiftSwapStatus.TargetApproved || dto.Status == ShiftSwapStatus.TargetRejected)
                {
                    swap.TargetResponseDate = DateTime.UtcNow;
                    swap.TargetResponseNotes = dto.ResponseNotes;
                }
                else if (dto.Status == ShiftSwapStatus.ManagerApproved)
                {
                    swap.ApprovedDate = DateTime.UtcNow;
                    swap.ApprovalNotes = dto.ResponseNotes;
                }
                else if (dto.Status == ShiftSwapStatus.ManagerRejected)
                {
                    swap.RejectedDate = DateTime.UtcNow;
                    swap.RejectionReason = dto.ResponseNotes;
                }
                else if (dto.Status == ShiftSwapStatus.Completed)
                {
                    swap.ExecutedDate = DateTime.UtcNow;
                }

                swap.UpdatedAt = DateTime.UtcNow;

                var updated = await _shiftRepository.UpdateShiftSwapAsync(swap);

                return Ok(MapToShiftSwapDto(updated));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating swap {SwapId}", id);
                return StatusCode(500, "An error occurred while updating the swap");
            }
        }

        #endregion

        #region Shift Rotation Endpoints

        /// <summary>
        /// Get all shift rotations
        /// </summary>
        [HttpGet("rotations")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<IEnumerable<ShiftRotationDto>>> GetAllRotations([FromQuery] int skip = 0, [FromQuery] int take = 20)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var rotations = await _shiftRepository.GetAllShiftRotationsAsync(tenantId, skip, take);
                return Ok(rotations.Select(MapToShiftRotationDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving rotations");
                return StatusCode(500, "An error occurred while retrieving rotations");
            }
        }

        /// <summary>
        /// Get active shift rotations
        /// </summary>
        [HttpGet("rotations/active")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<IEnumerable<ShiftRotationDto>>> GetActiveRotations()
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var rotations = await _shiftRepository.GetActiveShiftRotationsAsync(tenantId);
                return Ok(rotations.Select(MapToShiftRotationDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active rotations");
                return StatusCode(500, "An error occurred while retrieving active rotations");
            }
        }

        /// <summary>
        /// Create shift rotation
        /// </summary>
        [HttpPost("rotations")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<ShiftRotationDto>> CreateRotation([FromBody] CreateShiftRotationDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();

                var rotation = new ShiftRotation
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    RotationName = dto.RotationName,
                    Description = dto.Description,
                    StartDate = dto.StartDate,
                    EndDate = dto.EndDate,
                    RotationCycleDays = dto.RotationCycleDays,
                    RotationType = dto.RotationType,
                    RotationPattern = dto.RotationPattern,
                    DepartmentId = dto.DepartmentId,
                    IsActive = dto.IsActive,
                    AutoAssign = dto.AutoAssign,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _shiftRepository.CreateShiftRotationAsync(rotation);

                return CreatedAtAction(nameof(GetAllRotations), new { id = created.Id }, MapToShiftRotationDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating rotation");
                return StatusCode(500, "An error occurred while creating the rotation");
            }
        }

        /// <summary>
        /// Update shift rotation
        /// </summary>
        [HttpPut("rotations/{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<ShiftRotationDto>> UpdateRotation(Guid id, [FromBody] UpdateShiftRotationDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var rotation = await _shiftRepository.GetShiftRotationByIdAsync(id, tenantId);

                if (rotation == null)
                    return NotFound($"Rotation with ID {id} not found");

                rotation.RotationName = dto.RotationName;
                rotation.Description = dto.Description;
                rotation.EndDate = dto.EndDate;
                rotation.IsActive = dto.IsActive;
                rotation.AutoAssign = dto.AutoAssign;
                rotation.RotationPattern = dto.RotationPattern;
                rotation.UpdatedAt = DateTime.UtcNow;

                var updated = await _shiftRepository.UpdateShiftRotationAsync(rotation);

                return Ok(MapToShiftRotationDto(updated));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating rotation {RotationId}", id);
                return StatusCode(500, "An error occurred while updating the rotation");
            }
        }

        #endregion

        #region Helper Methods

        private ShiftDto MapToShiftDto(Shift shift)
        {
            return new ShiftDto
            {
                Id = shift.Id,
                ShiftName = shift.ShiftName,
                ShiftCode = shift.ShiftCode,
                Description = shift.Description,
                StartTime = shift.StartTime,
                EndTime = shift.EndTime,
                DurationHours = shift.DurationHours,
                GracePeriodMinutes = shift.GracePeriodMinutes,
                BreakDurationMinutes = shift.BreakDurationMinutes,
                ShiftType = shift.ShiftType,
                ApplicableDays = shift.ApplicableDays,
                IsNightShift = shift.IsNightShift,
                AllowOvernightCrossMidnight = shift.AllowOvernightCrossMidnight,
                EarlyExitToleranceMinutes = shift.EarlyExitToleranceMinutes,
                SplitSlot1StartTime = shift.SplitSlot1StartTime,
                SplitSlot1EndTime = shift.SplitSlot1EndTime,
                SplitSlot2StartTime = shift.SplitSlot2StartTime,
                SplitSlot2EndTime = shift.SplitSlot2EndTime,
                IsFlexiShift = shift.IsFlexiShift,
                CoreStartTime = shift.CoreStartTime,
                CoreEndTime = shift.CoreEndTime,
                FlexiWindowStart = shift.FlexiWindowStart,
                FlexiWindowEnd = shift.FlexiWindowEnd,
                Is24HourShift = shift.Is24HourShift,
                MandatoryRestHoursAfterShift = shift.MandatoryRestHoursAfterShift ?? 24,
                IsOnCallStandby = shift.IsOnCallStandby,
                StandbyRateMultiplier = shift.StandbyRateMultiplier,
                CountryId = shift.CountryId,
                CompanyId = shift.CompanyId,
                ProjectId = shift.ProjectId,
                OperationalLocationId = shift.OperationalLocationId,
                NightShiftAllowance = shift.NightShiftAllowance,
                IsActive = shift.IsActive,
                MinEmployeesRequired = shift.MinEmployeesRequired,
                MaxEmployeesAllowed = shift.MaxEmployeesAllowed,
                CurrentAssignedCount = shift.ShiftAssignments?.Count(sa => !sa.IsDeleted && sa.Status == ShiftAssignmentStatus.Active) ?? 0,
                DepartmentId = shift.DepartmentId,
                CreatedAt = shift.CreatedAt
            };
        }

        private ShiftAssignmentDto MapToShiftAssignmentDto(ShiftAssignment assignment)
        {
            return new ShiftAssignmentDto
            {
                Id = assignment.Id,
                ShiftId = assignment.ShiftId,
                ShiftName = assignment.Shift?.ShiftName ?? string.Empty,
                ShiftCode = assignment.Shift?.ShiftCode ?? string.Empty,
                EmployeeId = assignment.EmployeeId,
                EmployeeName = string.Empty, // Would need employee lookup
                EffectiveFrom = assignment.EffectiveFrom,
                EffectiveTo = assignment.EffectiveTo,
                AssignmentType = assignment.AssignmentType,
                AssignmentReason = assignment.AssignmentReason,
                Status = assignment.Status,
                ApprovedBy = assignment.ApprovedBy,
                ApprovedDate = assignment.ApprovedDate,
                Notes = assignment.Notes,
                IsRotational = assignment.IsRotational,
                RotationId = assignment.RotationId,
                CreatedAt = assignment.CreatedAt
            };
        }

        private ShiftSwapDto MapToShiftSwapDto(ShiftSwap swap)
        {
            return new ShiftSwapDto
            {
                Id = swap.Id,
                RequestorEmployeeId = swap.RequestorEmployeeId,
                RequestorEmployeeName = string.Empty, // Would need employee lookup
                RequestorShiftAssignmentId = swap.RequestorShiftAssignmentId,
                RequestorShiftName = swap.RequestorShiftAssignment?.Shift?.ShiftName ?? string.Empty,
                TargetEmployeeId = swap.TargetEmployeeId,
                TargetEmployeeName = string.Empty, // Would need employee lookup
                TargetShiftAssignmentId = swap.TargetShiftAssignmentId,
                TargetShiftName = swap.TargetShiftAssignment?.Shift?.ShiftName ?? string.Empty,
                SwapDate = swap.SwapDate,
                Reason = swap.Reason,
                Status = swap.Status,
                TargetResponseDate = swap.TargetResponseDate,
                TargetResponseNotes = swap.TargetResponseNotes,
                ApprovedBy = swap.ApprovedBy,
                ApprovedDate = swap.ApprovedDate,
                ApprovalNotes = swap.ApprovalNotes,
                RejectedDate = swap.RejectedDate,
                RejectionReason = swap.RejectionReason,
                ExecutedDate = swap.ExecutedDate,
                CreatedAt = swap.CreatedAt
            };
        }

        private ShiftRotationDto MapToShiftRotationDto(ShiftRotation rotation)
        {
            return new ShiftRotationDto
            {
                Id = rotation.Id,
                RotationName = rotation.RotationName,
                Description = rotation.Description,
                StartDate = rotation.StartDate,
                EndDate = rotation.EndDate,
                RotationCycleDays = rotation.RotationCycleDays,
                RotationType = rotation.RotationType,
                RotationPattern = rotation.RotationPattern,
                DepartmentId = rotation.DepartmentId,
                IsActive = rotation.IsActive,
                AutoAssign = rotation.AutoAssign,
                AssignedEmployeesCount = rotation.Assignments?.Count(a => !a.IsDeleted && a.Status == ShiftAssignmentStatus.Active) ?? 0,
                CreatedAt = rotation.CreatedAt
            };
        }

        private async Task InvalidateShiftCache(Guid tenantId)
        {
            var cacheKeyPattern = $"shifts:all:{tenantId}:*";
            // Note: In production, implement proper cache invalidation
            await Task.CompletedTask;
        }

        #endregion
    }
}
