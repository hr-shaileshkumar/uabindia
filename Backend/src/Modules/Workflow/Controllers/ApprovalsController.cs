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
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Workflow.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class ApprovalsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IApprovalRequestService _approvals;

        public ApprovalsController(ApplicationDbContext db, ITenantAccessor tenantAccessor, IApprovalRequestService approvals)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _approvals = approvals;
        }

        [HttpGet]
        [PolicyCheck("approval", "view")]
        public async Task<IActionResult> List([FromQuery] string? status = "Pending")
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.ApprovalRequests
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId);

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                var lowerStatus = status.Trim().ToLower();
                query = query.Where(a => a.Status.ToLower() == lowerStatus);
            }

            var requests = await query
                .OrderByDescending(a => a.RequestedAt)
                .Take(200)
                .ToListAsync();

            if (requests.Count == 0)
            {
                return Ok(Array.Empty<ApprovalRequestDto>());
            }

            // Gather entity IDs by type for batch lookups
            var poIds = requests
                .Where(r => string.Equals(r.EntityType, "PurchaseOrder", StringComparison.OrdinalIgnoreCase))
                .Select(r => r.EntityId)
                .Distinct()
                .ToList();

            var expenseIds = requests
                .Where(r => string.Equals(r.EntityType, "ExpenseClaim", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(r.EntityType, "Expense", StringComparison.OrdinalIgnoreCase))
                .Select(r => r.EntityId)
                .Distinct()
                .ToList();

            var leaveIds = requests
                .Where(r => string.Equals(r.EntityType, "LeaveRequest", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(r.EntityType, "Leave", StringComparison.OrdinalIgnoreCase))
                .Select(r => r.EntityId)
                .Distinct()
                .ToList();

            var invoiceIds = requests
                .Where(r => string.Equals(r.EntityType, "PurchaseInvoice", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(r.EntityType, "VendorBill", StringComparison.OrdinalIgnoreCase))
                .Select(r => r.EntityId)
                .Distinct()
                .ToList();

            var requesterUserIds = requests.Select(r => r.RequestedBy).Distinct().ToList();
            var workflowDefIds = requests.Select(r => r.WorkflowDefinitionId).Distinct().ToList();

            // Batch queries
            var pos = poIds.Count > 0
                ? await _db.PurchaseOrders
                    .AsNoTracking()
                    .Where(p => poIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id, p => new { p.PONumber, p.TotalAmount, p.Notes })
                : new();

            var expenses = expenseIds.Count > 0
                ? await _db.ExpenseClaims
                    .AsNoTracking()
                    .Where(e => expenseIds.Contains(e.Id))
                    .ToDictionaryAsync(e => e.Id, e => new { e.ClaimNumber, e.Amount, e.Title, e.EmployeeName, e.Category })
                : new();

            var leaves = leaveIds.Count > 0
                ? await _db.LeaveRequests
                    .AsNoTracking()
                    .Where(l => leaveIds.Contains(l.Id))
                    .ToDictionaryAsync(l => l.Id, l => new { l.Days, l.Reason })
                : new();

            var invoices = invoiceIds.Count > 0
                ? await _db.PurchaseInvoices
                    .AsNoTracking()
                    .Where(i => invoiceIds.Contains(i.Id))
                    .ToDictionaryAsync(i => i.Id, i => new { i.InvoiceNumber, i.TotalAmount, i.Notes })
                : new();

            var employees = requesterUserIds.Count > 0
                ? await _db.Employees
                    .AsNoTracking()
                    .Where(e => (e.UserId.HasValue && requesterUserIds.Contains(e.UserId.Value)) || requesterUserIds.Contains(e.Id))
                    .ToListAsync()
                : new List<UabIndia.Core.Entities.Employee>();

            var employeeMapByUserId = employees
                .Where(e => e.UserId.HasValue)
                .GroupBy(e => e.UserId!.Value)
                .ToDictionary(g => g.Key, g => g.First());

            var employeeMapById = employees
                .GroupBy(e => e.Id)
                .ToDictionary(g => g.Key, g => g.First());

            var workflowStepCounts = workflowDefIds.Count > 0
                ? await _db.WorkflowDefinitions
                    .AsNoTracking()
                    .Where(w => workflowDefIds.Contains(w.Id))
                    .Select(w => new { w.Id, StepCount = w.Steps.Count })
                    .ToDictionaryAsync(w => w.Id, w => w.StepCount)
                : new();

            var result = requests.Select(a =>
            {
                decimal? amount = null;
                string? department = null;
                string? title = null;
                string? urgency = "Normal";

                if (pos.TryGetValue(a.EntityId, out var po))
                {
                    amount = po.TotalAmount;
                    department = "Procurement";
                    title = $"PO #{po.PONumber}";
                }
                else if (expenses.TryGetValue(a.EntityId, out var exp))
                {
                    amount = exp.Amount;
                    department = exp.Category ?? "Finance";
                    title = string.IsNullOrWhiteSpace(exp.Title) ? $"Claim #{exp.ClaimNumber}" : exp.Title;
                }
                else if (leaves.TryGetValue(a.EntityId, out var lv))
                {
                    department = "HR Operations";
                    title = $"Leave Application ({lv.Days:0.#} days)";
                    if (lv.Days > 5) urgency = "Urgent";
                }
                else if (invoices.TryGetValue(a.EntityId, out var inv))
                {
                    amount = inv.TotalAmount;
                    department = "Accounts Payable";
                    title = $"Invoice #{inv.InvoiceNumber}";
                }

                if (amount.HasValue)
                {
                    if (amount.Value > 100000) urgency = "Urgent";
                    else if (amount.Value > 25000) urgency = "High";
                }

                string? requesterName = null;
                if (employeeMapByUserId.TryGetValue(a.RequestedBy, out var empUser))
                {
                    requesterName = empUser.FullName;
                }
                else if (employeeMapById.TryGetValue(a.RequestedBy, out var empDirect))
                {
                    requesterName = empDirect.FullName;
                }
                else if (expenses.TryGetValue(a.EntityId, out var claimOwner) && !string.IsNullOrWhiteSpace(claimOwner.EmployeeName))
                {
                    requesterName = claimOwner.EmployeeName;
                }

                var totalSteps = workflowStepCounts.TryGetValue(a.WorkflowDefinitionId, out var count) && count > 0
                    ? count
                    : 1;

                return new ApprovalRequestDto
                {
                    Id = a.Id,
                    ModuleKey = a.ModuleKey,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    CurrentStep = a.CurrentStep,
                    TotalSteps = totalSteps,
                    Status = a.Status,
                    RequestedBy = a.RequestedBy,
                    RequesterName = requesterName,
                    RequestedAt = a.RequestedAt,
                    ApprovedBy = a.ApprovedBy,
                    ApprovedAt = a.ApprovedAt,
                    RejectedBy = a.RejectedBy,
                    RejectedAt = a.RejectedAt,
                    Comments = a.Comments,
                    Amount = amount,
                    Department = department,
                    Urgency = urgency,
                    Title = title
                };
            }).ToList();

            return Ok(result);
        }

        [HttpPost]
        [PolicyCheck("approval", "create")]
        public async Task<IActionResult> Create([FromBody] CreateApprovalRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            try
            {
                await _approvals.CreateAsync(dto.ModuleKey, dto.EntityType, dto.EntityId, dto.Comments, userId);
                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/approve")]
        [PolicyCheck("approval", "approve")]
        public async Task<IActionResult> Approve(Guid id, [FromBody] ApprovalActionDto dto)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            try
            {
                await _approvals.ApproveAsync(id, userId, dto?.Comments);
                return Ok();
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

        [HttpPost("bulk-approve")]
        [PolicyCheck("approval", "approve")]
        public async Task<IActionResult> BulkApprove([FromBody] BulkApprovalRequestDto dto)
        {
            if (dto?.RequestIds == null || dto.RequestIds.Count == 0)
                return BadRequest(new { message = "At least one approval request ID is required." });

            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            int approvedCount = 0;
            var errors = new List<string>();

            foreach (var reqId in dto.RequestIds)
            {
                try
                {
                    await _approvals.ApproveAsync(reqId, userId, dto.Comments);
                    approvedCount++;
                }
                catch (Exception ex)
                {
                    errors.Add($"Request {reqId}: {ex.Message}");
                }
            }

            return Ok(new
            {
                message = $"{approvedCount} requests approved successfully.",
                approvedCount,
                totalRequested = dto.RequestIds.Count,
                errors = errors.Count > 0 ? errors : null
            });
        }

        [HttpPost("{id}/escalate")]
        [PolicyCheck("approval", "approve")]
        public async Task<IActionResult> Escalate(Guid id, [FromBody] EscalateApprovalDto? dto)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            try
            {
                await _approvals.EscalateAsync(id, userId, dto?.Reason);
                return Ok(new { message = "Approval request escalated successfully." });
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

        [HttpPost("{id}/reject")]
        [PolicyCheck("approval", "reject")]
        public async Task<IActionResult> Reject(Guid id, [FromBody] ApprovalActionDto dto)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            try
            {
                await _approvals.RejectAsync(id, userId, dto?.Comments);
                return Ok();
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

        private Guid GetUserId()
        {
            var userIdClaim = User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("nameidentifier")?.Value
                ?? User?.FindFirst("sub")?.Value;

            return Guid.TryParse(userIdClaim, out var id) ? id : Guid.Empty;
        }
    }
}
