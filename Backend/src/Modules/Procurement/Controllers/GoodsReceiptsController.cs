using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Procurement.Controllers
{
    [ApiController]
    [Route("api/v1/grn")]
    [Authorize(Policy = "Module:procurement")]
    public class GoodsReceiptsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;
        private readonly IGoodsReceiptService _goodsReceipts;

        public GoodsReceiptsController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers,
            IGoodsReceiptService goodsReceipts)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
            _goodsReceipts = goodsReceipts;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 50)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (page < 1) page = 1;
            if (limit < 1) limit = 50;
            if (limit > 100) limit = 100;

            var query = _db.GoodsReceiptNotes.AsNoTracking()
                .Where(g => g.TenantId == tenantId && !g.IsDeleted);

            var total = await query.CountAsync();
            var rows = await query
                .OrderByDescending(g => g.ReceivedDate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(g => new
                {
                    g.Id,
                    g.GrnNumber,
                    g.PurchaseOrderId,
                    PoReference = g.PoNumber,
                    g.PoNumber,
                    g.VendorId,
                    g.VendorName,
                    g.ReceivedDate,
                    g.TotalItems,
                    g.TotalAmount,
                    g.Status,
                    g.Remarks,
                    g.CreatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = rows, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateGoodsReceiptDto dto)
        {
            if (dto.VendorId == Guid.Empty)
                return BadRequest(new { success = false, error = "Vendor is required" });

            var tenantId = _tenantAccessor.GetTenantId();

            string? vendorName = dto.VendorName;
            var vendor = await _db.Vendors.AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == dto.VendorId && v.TenantId == tenantId && !v.IsDeleted);
            if (vendor == null)
                return BadRequest(new { success = false, error = "Vendor not found" });
            vendorName ??= vendor.VendorName;

            PurchaseOrder? po = null;
            if (dto.PurchaseOrderId.HasValue)
            {
                po = await _db.PurchaseOrders
                    .FirstOrDefaultAsync(p => p.Id == dto.PurchaseOrderId.Value && p.TenantId == tenantId && !p.IsDeleted);
                if (po == null)
                    return BadRequest(new { success = false, error = "Purchase order not found" });
            }
            else if (!string.IsNullOrWhiteSpace(dto.PoReference))
            {
                po = await _db.PurchaseOrders
                    .FirstOrDefaultAsync(p => p.PONumber == dto.PoReference && p.TenantId == tenantId && !p.IsDeleted);
            }

            var status = string.IsNullOrWhiteSpace(dto.Status) ? "PendingQC" : dto.Status;
            var grn = new GoodsReceiptNote
            {
                GrnNumber = string.IsNullOrWhiteSpace(dto.GrnNumber)
                    ? await _numbers.NextAsync("GoodsReceipt", "GRN-", 5)
                    : dto.GrnNumber.Trim(),
                PurchaseOrderId = po?.Id ?? dto.PurchaseOrderId,
                PoNumber = po?.PONumber ?? dto.PoReference,
                VendorId = dto.VendorId,
                VendorName = vendorName,
                ReceivedDate = dto.ReceivedDate == default ? DateTime.UtcNow.Date : dto.ReceivedDate,
                TotalItems = dto.TotalItems > 0 ? dto.TotalItems : 1,
                TotalAmount = dto.TotalAmount > 0 ? dto.TotalAmount : (po?.TotalAmount ?? 0),
                Status = status,
                Remarks = dto.Remarks,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.GoodsReceiptNotes.Add(grn);

            if (po != null && status is "Accepted" or "PartialAccepted")
            {
                po.Status = status == "Accepted" ? "Received" : "Partial";
                po.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "GRN created", data = grn });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGoodsReceiptDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var grn = await _db.GoodsReceiptNotes
                .FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId && !g.IsDeleted);
            if (grn == null)
                return NotFound(new { success = false, error = "GRN not found" });

            if (dto.ReceivedDate.HasValue) grn.ReceivedDate = dto.ReceivedDate.Value;
            if (dto.TotalItems.HasValue) grn.TotalItems = dto.TotalItems.Value;
            if (dto.TotalAmount.HasValue) grn.TotalAmount = dto.TotalAmount.Value;
            if (dto.Status != null) grn.Status = dto.Status;
            if (dto.Remarks != null) grn.Remarks = dto.Remarks;
            grn.UpdatedAt = DateTime.UtcNow;

            if (grn.PurchaseOrderId.HasValue && dto.Status is "Accepted" or "PartialAccepted")
            {
                var po = await _db.PurchaseOrders
                    .FirstOrDefaultAsync(p => p.Id == grn.PurchaseOrderId.Value && p.TenantId == tenantId && !p.IsDeleted);
                if (po != null)
                {
                    po.Status = dto.Status == "Accepted" ? "Received" : "Partial";
                    po.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "GRN updated", data = grn });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var grn = await _db.GoodsReceiptNotes
                .FirstOrDefaultAsync(g => g.Id == id && g.TenantId == tenantId && !g.IsDeleted);
            if (grn == null)
                return NotFound(new { success = false, error = "GRN not found" });

            grn.IsDeleted = true;
            grn.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "GRN deleted" });
        }

        /// <summary>
        /// Accepts a GRN and posts stock In movements for linked PO lines (idempotent when already Accepted).
        /// </summary>
        [HttpPost("{id}/accept")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Accept(Guid id, [FromBody] AcceptGoodsReceiptDto? dto = null)
        {
            try
            {
                var result = await _goodsReceipts.AcceptAsync(id, dto?.WarehouseId);
                if (result.AlreadyAccepted)
                    return Ok(new { success = true, message = "GRN already accepted", data = result.Grn });

                return Ok(new
                {
                    success = true,
                    message = result.Movements.Count == 0
                        ? "GRN accepted (no pending PO lines to stock)."
                        : $"GRN accepted; {result.Movements.Count} stock movement(s) posted.",
                    data = result.Grn,
                    movements = result.Movements
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, error = ex.Message });
            }
        }
    }

    public class CreateGoodsReceiptDto
    {
        public string? GrnNumber { get; set; }
        public Guid? PurchaseOrderId { get; set; }
        public string? PoReference { get; set; }
        public Guid VendorId { get; set; }
        public string? VendorName { get; set; }
        public DateTime ReceivedDate { get; set; }
        public int TotalItems { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Status { get; set; }
        public string? Remarks { get; set; }
    }

    public class UpdateGoodsReceiptDto
    {
        public DateTime? ReceivedDate { get; set; }
        public int? TotalItems { get; set; }
        public decimal? TotalAmount { get; set; }
        public string? Status { get; set; }
        public string? Remarks { get; set; }
    }

    public class AcceptGoodsReceiptDto
    {
        public Guid? WarehouseId { get; set; }
    }
}
