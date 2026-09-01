using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Procurement.Controllers
{
    [ApiController]
    [Route("api/v1/purchaserequests")]
    [Authorize]
    [Authorize(Policy = "Module:procurement")]
    public class PurchaseRequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;
        private readonly IDocumentConversionService _conversions;
        private readonly IPurchaseRequestService _requests;

        public PurchaseRequestsController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers,
            IDocumentConversionService conversions,
            IPurchaseRequestService requests)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
            _conversions = conversions;
            _requests = requests;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int limit = 50, [FromQuery] string? status = null)
        {
            page = Math.Max(1, page);
            limit = Math.Clamp(limit, 1, 200);
            var query = _db.PurchaseRequests.AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(r => r.Status == status);
            var total = await query.CountAsync();
            var data = await query.OrderByDescending(r => r.CreatedAt).Skip((page - 1) * limit).Take(limit).ToListAsync();
            return Ok(new { data, total, page, limit });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PurchaseRequest dto)
        {
            if (string.IsNullOrWhiteSpace(dto.ItemDescription) || dto.Quantity <= 0)
                return BadRequest(new { message = "Item description and quantity are required." });

            var tenantId = _tenantAccessor.GetTenantId();
            var userId = GetUserId();
            var row = new PurchaseRequest
            {
                TenantId = tenantId,
                RequestNumber = await _numbers.NextAsync("PurchaseRequest", "PR-", 5),
                RequestedByUserId = userId == Guid.Empty ? null : userId,
                RequestedBy = User.Identity?.Name ?? "User",
                Department = dto.Department ?? "Operations",
                ItemId = dto.ItemId,
                ItemDescription = dto.ItemDescription,
                Quantity = dto.Quantity,
                Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "Pcs" : dto.Unit,
                EstimatedCost = dto.EstimatedCost,
                RequiredDate = dto.RequiredDate,
                Justification = dto.Justification ?? "",
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };
            _db.PurchaseRequests.Add(row);
            await _db.SaveChangesAsync();
            return Ok(row);
        }

        [HttpPost("{id:guid}/approve")]
        [Authorize(Roles = "SuperAdmin,Admin,Manager")]
        public async Task<IActionResult> Approve(Guid id)
        {
            try
            {
                var row = await _requests.ApproveAsync(id, GetUserId());
                return Ok(row);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpPost("{id:guid}/reject")]
        [Authorize(Roles = "SuperAdmin,Admin,Manager")]
        public async Task<IActionResult> Reject(Guid id)
        {
            try
            {
                var row = await _requests.RejectAsync(id);
                return Ok(row);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpPost("{id:guid}/convert")]
        [Authorize(Roles = "SuperAdmin,Admin,Manager")]
        public async Task<IActionResult> ConvertToPo(Guid id)
        {
            try
            {
                var result = await _conversions.ConvertPurchaseRequestAsync(id);
                return Ok(new
                {
                    request = result.Request,
                    purchaseOrderId = result.PurchaseOrderId,
                    poNumber = result.PoNumber
                });
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

        [HttpGet("match/{purchaseOrderId:guid}")]
        public async Task<IActionResult> ThreeWayMatch(Guid purchaseOrderId)
        {
            try
            {
                var match = await _requests.MatchPurchaseOrderAsync(purchaseOrderId);
                return Ok(new
                {
                    purchaseOrderId = match.PurchaseOrderId,
                    poNumber = match.PoNumber,
                    orderedQuantity = match.OrderedQuantity,
                    receivedQuantity = match.ReceivedQuantity,
                    billedAmount = match.BilledAmount,
                    poAmount = match.PoAmount,
                    status = match.Status
                });
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        private Guid GetUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }
    }
}
