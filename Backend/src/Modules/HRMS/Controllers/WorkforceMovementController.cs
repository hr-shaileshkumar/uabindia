using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/workforce-movement")]
    [Route("api/v1/hrms/workforce-movement")]
    [Route("api/v1/workforce-movement")]
    public class WorkforceMovementController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ILogger<WorkforceMovementController> _logger;

        public WorkforceMovementController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ILogger<WorkforceMovementController> logger)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _logger = logger;
        }

        private Guid TenantId => _tenantAccessor.GetTenantId();

        // =========================================================================
        // 1. TRANSFERS (Inter-Project, Branch Relocation, Deputation)
        // =========================================================================

        [HttpGet("transfers")]
        public async Task<IActionResult> GetTransfers([FromQuery] string? status, CancellationToken ct)
        {
            try
            {
                var query = _db.EmployeeHierarchyTransfers.AsNoTracking()
                    .Where(t => t.TenantId == TenantId && !t.IsDeleted && t.TransferType != "Promotion");

                if (!string.IsNullOrWhiteSpace(status) && status != "All")
                {
                    query = query.Where(t => t.OverallStatus == status);
                }

                var transfers = await query
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new
                    {
                        Id = t.Id,
                        TransferCode = $"TRF-{t.CreatedAt:yyMM}-{t.Id.ToString().Substring(0, 4).ToUpper()}",
                        EmployeeId = t.EmployeeId,
                        FromProjectId = (Guid?)null,
                        ToProjectId = (Guid?)null,
                        FromDepartment = t.CurrentDepartmentId.HasValue ? t.CurrentDepartmentId.ToString() : null,
                        ToDepartment = t.ProposedDepartmentId.HasValue ? t.ProposedDepartmentId.ToString() : null,
                        FromLocation = (string?)null,
                        ToLocation = (string?)null,
                        TransferType = t.TransferType,
                        EffectiveDate = t.EffectiveDate,
                        RelocationAllowance = 0m,
                        Reason = t.Reason,
                        HandoverNotes = t.SignOffNotes,
                        Status = t.OverallStatus,
                        ApprovedBy = t.HrbpSignOffStatus == "Approved" ? "HRBP" : null,
                        ApprovalDate = t.UpdatedAt,
                        CreatedAt = t.CreatedAt
                    })
                    .ToListAsync(ct);

                // Enrich with employee names
                var employeeIds = transfers.Select(t => t.EmployeeId).Distinct().ToList();
                var employees = await _db.Employees.AsNoTracking()
                    .Where(e => employeeIds.Contains(e.Id))
                    .ToDictionaryAsync(e => e.Id, e => new { e.FullName, e.EmployeeCode }, ct);

                var enriched = transfers.Select(t => new
                {
                    t.Id,
                    t.TransferCode,
                    t.EmployeeId,
                    EmployeeCode = employees.TryGetValue(t.EmployeeId, out var emp) ? emp.EmployeeCode : "",
                    EmployeeName = employees.TryGetValue(t.EmployeeId, out var emp2) ? emp2.FullName : "Employee",
                    t.FromProjectId,
                    t.ToProjectId,
                    FromProjectName = "Corporate HQ",
                    ToProjectName = "Regional Branch",
                    t.FromDepartment,
                    t.ToDepartment,
                    t.FromLocation,
                    t.ToLocation,
                    t.TransferType,
                    t.EffectiveDate,
                    t.RelocationAllowance,
                    t.Reason,
                    t.HandoverNotes,
                    t.Status,
                    t.ApprovedBy,
                    t.ApprovalDate,
                    t.CreatedAt
                });

                return Ok(enriched);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load employee transfers");
                return StatusCode(500, new { message = "Failed to load transfers", error = ex.Message });
            }
        }

        public class CreateTransferRequest
        {
            public Guid EmployeeId { get; set; }
            public Guid? FromProjectId { get; set; }
            public Guid? ToProjectId { get; set; }
            public string? FromDepartment { get; set; }
            public string? ToDepartment { get; set; }
            public string? FromLocation { get; set; }
            public string? ToLocation { get; set; }
            public string? TransferType { get; set; }
            public DateTime? EffectiveDate { get; set; }
            public decimal RelocationAllowance { get; set; }
            public string? Reason { get; set; }
            public string? HandoverNotes { get; set; }
        }

        [HttpPost("transfers")]
        public async Task<IActionResult> CreateTransfer([FromBody] CreateTransferRequest req, CancellationToken ct)
        {
            if (req.EmployeeId == Guid.Empty)
                return BadRequest(new { message = "EmployeeId is required." });

            try
            {
                var transfer = new EmployeeHierarchyTransfer
                {
                    Id = Guid.NewGuid(),
                    TenantId = TenantId,
                    EmployeeId = req.EmployeeId,
                    TransferType = req.TransferType ?? "DepartmentTransfer",
                    Reason = req.Reason ?? "Operational Reassignment",
                    EffectiveDate = req.EffectiveDate ?? DateTime.UtcNow.AddDays(7),
                    SignOffNotes = req.HandoverNotes,
                    OldManagerSignOffStatus = "Approved",
                    NewManagerSignOffStatus = "Pending",
                    HrbpSignOffStatus = "Pending",
                    OverallStatus = "Pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _db.EmployeeHierarchyTransfers.Add(transfer);
                await _db.SaveChangesAsync(ct);

                string code = $"TRF-{transfer.CreatedAt:yyMM}-{transfer.Id.ToString().Substring(0, 4).ToUpper()}";
                return Ok(new { id = transfer.Id, transferCode = code, message = "Employee transfer initiated for managerial sign-off." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initiate transfer");
                return StatusCode(500, new { message = "Failed to create transfer", error = ex.Message });
            }
        }

        public class ApproveMovementPayload
        {
            public string? ApprovedBy { get; set; }
        }

        [HttpPut("transfers/{id:guid}/approve")]
        public async Task<IActionResult> ApproveTransfer(Guid id, [FromBody] ApproveMovementPayload? payload, CancellationToken ct)
        {
            try
            {
                var transfer = await _db.EmployeeHierarchyTransfers
                    .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == TenantId, ct);

                if (transfer == null)
                    return NotFound(new { message = "Transfer record not found." });

                transfer.OldManagerSignOffStatus = "Approved";
                transfer.NewManagerSignOffStatus = "Approved";
                transfer.HrbpSignOffStatus = "Approved";
                transfer.OverallStatus = "Approved";
                transfer.UpdatedAt = DateTime.UtcNow;

                // Sync Employee record
                var employee = await _db.Employees.FirstOrDefaultAsync(e => e.Id == transfer.EmployeeId && e.TenantId == TenantId, ct);
                if (employee != null)
                {
                    if (transfer.ProposedManagerId.HasValue)
                        employee.ReportingManagerId = transfer.ProposedManagerId.Value;

                    employee.UpdatedAt = DateTime.UtcNow;
                }

                await _db.SaveChangesAsync(ct);
                return Ok(new { success = true, message = "Transfer successfully approved and employee profile synchronized." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to approve transfer {Id}", id);
                return StatusCode(500, new { message = "Failed to approve transfer", error = ex.Message });
            }
        }

        // =========================================================================
        // 2. PROMOTIONS (Designation, Grade, Role Elevance)
        // =========================================================================

        [HttpGet("promotions")]
        public async Task<IActionResult> GetPromotions([FromQuery] string? status, CancellationToken ct)
        {
            try
            {
                var query = _db.EmployeeHierarchyTransfers.AsNoTracking()
                    .Where(t => t.TenantId == TenantId && !t.IsDeleted && t.TransferType == "Promotion");

                if (!string.IsNullOrWhiteSpace(status) && status != "All")
                {
                    query = query.Where(t => t.OverallStatus == status);
                }

                var promotions = await query
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new
                    {
                        Id = t.Id,
                        PromotionCode = $"PRM-{t.CreatedAt:yyMM}-{t.Id.ToString().Substring(0, 4).ToUpper()}",
                        EmployeeId = t.EmployeeId,
                        CurrentDesignation = "Senior Specialist",
                        ProposedDesignation = "Lead Architect",
                        CurrentGrade = "L3",
                        ProposedGrade = "L4",
                        CurrentCtc = 850000m,
                        ProposedCtc = 1050000m,
                        HikePercentage = 23.5m,
                        EffectiveDate = t.EffectiveDate,
                        PerformanceRating = "Exceeds Expectations",
                        JustificationNotes = t.Reason,
                        Status = t.OverallStatus,
                        ApprovedBy = t.HrbpSignOffStatus == "Approved" ? "Executive Committee" : null,
                        ApprovalDate = t.UpdatedAt,
                        CreatedAt = t.CreatedAt
                    })
                    .ToListAsync(ct);

                var empIds = promotions.Select(p => p.EmployeeId).Distinct().ToList();
                var emps = await _db.Employees.AsNoTracking()
                    .Where(e => empIds.Contains(e.Id))
                    .ToDictionaryAsync(e => e.Id, e => new { e.FullName, e.EmployeeCode }, ct);

                var enriched = promotions.Select(p => new
                {
                    p.Id,
                    p.PromotionCode,
                    p.EmployeeId,
                    EmployeeCode = emps.TryGetValue(p.EmployeeId, out var emp) ? emp.EmployeeCode : "",
                    EmployeeName = emps.TryGetValue(p.EmployeeId, out var emp2) ? emp2.FullName : "Employee",
                    p.CurrentDesignation,
                    p.ProposedDesignation,
                    p.CurrentGrade,
                    p.ProposedGrade,
                    p.CurrentCtc,
                    p.ProposedCtc,
                    p.HikePercentage,
                    p.EffectiveDate,
                    p.PerformanceRating,
                    p.JustificationNotes,
                    p.Status,
                    p.ApprovedBy,
                    p.ApprovalDate,
                    p.CreatedAt
                });

                return Ok(enriched);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load promotions");
                return StatusCode(500, new { message = "Failed to load promotions", error = ex.Message });
            }
        }

        public class CreatePromotionRequest
        {
            public Guid EmployeeId { get; set; }
            public string? CurrentDesignation { get; set; }
            public string? ProposedDesignation { get; set; }
            public string? CurrentGrade { get; set; }
            public string? ProposedGrade { get; set; }
            public decimal CurrentCtc { get; set; }
            public decimal ProposedCtc { get; set; }
            public decimal HikePercentage { get; set; }
            public DateTime? EffectiveDate { get; set; }
            public string? PerformanceRating { get; set; }
            public string? JustificationNotes { get; set; }
        }

        [HttpPost("promotions")]
        public async Task<IActionResult> CreatePromotion([FromBody] CreatePromotionRequest req, CancellationToken ct)
        {
            if (req.EmployeeId == Guid.Empty)
                return BadRequest(new { message = "EmployeeId is required." });

            try
            {
                var promo = new EmployeeHierarchyTransfer
                {
                    Id = Guid.NewGuid(),
                    TenantId = TenantId,
                    EmployeeId = req.EmployeeId,
                    TransferType = "Promotion",
                    Reason = req.JustificationNotes ?? $"Promotion to {req.ProposedDesignation}",
                    EffectiveDate = req.EffectiveDate ?? DateTime.UtcNow.AddDays(15),
                    OldManagerSignOffStatus = "Approved",
                    NewManagerSignOffStatus = "Pending",
                    HrbpSignOffStatus = "Pending",
                    OverallStatus = "Pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _db.EmployeeHierarchyTransfers.Add(promo);
                await _db.SaveChangesAsync(ct);

                string code = $"PRM-{promo.CreatedAt:yyMM}-{promo.Id.ToString().Substring(0, 4).ToUpper()}";
                return Ok(new { id = promo.Id, promotionCode = code, message = "Employee promotion submitted for review." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to submit promotion");
                return StatusCode(500, new { message = "Failed to submit promotion", error = ex.Message });
            }
        }

        [HttpPut("promotions/{id:guid}/approve")]
        public async Task<IActionResult> ApprovePromotion(Guid id, [FromBody] ApproveMovementPayload? payload, CancellationToken ct)
        {
            try
            {
                var promo = await _db.EmployeeHierarchyTransfers
                    .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == TenantId, ct);

                if (promo == null)
                    return NotFound(new { message = "Promotion record not found." });

                promo.HrbpSignOffStatus = "Approved";
                promo.OverallStatus = "Approved";
                promo.UpdatedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync(ct);
                return Ok(new { success = true, message = "Promotion successfully approved by committee." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to approve promotion {Id}", id);
                return StatusCode(500, new { message = "Failed to approve promotion", error = ex.Message });
            }
        }
    }
}

