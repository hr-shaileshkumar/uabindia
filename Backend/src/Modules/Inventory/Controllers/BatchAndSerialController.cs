using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Inventory.Controllers
{
    [ApiController]
    [Route("api/v1/inventory/batches")]
    [Authorize]
    public class BatchAndSerialController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public BatchAndSerialController(ApplicationDbContext db)
        {
            _db = db;
        }

        // ==================== BATCH & FEFO (First Expired First Out) ====================

        [HttpGet]
        public async Task<IActionResult> GetBatches([FromQuery] Guid? itemId = null, [FromQuery] string? status = null)
        {
            var query = _db.ItemBatches.AsNoTracking()
                .Include(b => b.Item)
                .Include(b => b.Warehouse)
                .Where(b => !b.IsDeleted);

            if (itemId.HasValue && itemId != Guid.Empty)
                query = query.Where(b => b.ItemId == itemId.Value);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(b => b.Status == status);

            var batches = await query
                .OrderBy(b => b.ExpiryDate ?? DateTime.MaxValue) // FEFO Priority!
                .Select(b => new
                {
                    b.Id,
                    b.BatchNumber,
                    b.LotNumber,
                    ItemCode = b.Item.ItemCode,
                    ItemName = b.Item.ItemName,
                    WarehouseName = b.Warehouse.WarehouseName,
                    b.ManufactureDate,
                    b.ExpiryDate,
                    DaysToExpiry = b.ExpiryDate.HasValue ? (int)Math.Ceiling((b.ExpiryDate.Value - DateTime.UtcNow).TotalDays) : (int?)null,
                    b.QuantityReceived,
                    b.QuantityCurrent,
                    b.UnitCost,
                    TotalValue = b.QuantityCurrent * b.UnitCost,
                    b.Status
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                count = batches.Count,
                items = batches
            });
        }

        public class CreateBatchRequest
        {
            public Guid ItemId { get; set; }
            public Guid WarehouseId { get; set; }
            public string BatchNumber { get; set; } = string.Empty;
            public string? LotNumber { get; set; }
            public DateTime? ManufactureDate { get; set; }
            public DateTime? ExpiryDate { get; set; }
            public decimal Quantity { get; set; }
            public decimal UnitCost { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> CreateBatch([FromBody] CreateBatchRequest req)
        {
            var item = await _db.Items.FindAsync(req.ItemId);
            if (item == null) return NotFound(new { success = false, message = "Item not found." });

            var warehouse = await _db.Warehouses.FindAsync(req.WarehouseId);
            if (warehouse == null) return NotFound(new { success = false, message = "Warehouse not found." });

            var batch = new ItemBatch
            {
                ItemId = req.ItemId,
                WarehouseId = req.WarehouseId,
                BatchNumber = req.BatchNumber,
                LotNumber = req.LotNumber,
                ManufactureDate = req.ManufactureDate ?? DateTime.UtcNow,
                ExpiryDate = req.ExpiryDate ?? (item.ShelfLifeDays.HasValue ? DateTime.UtcNow.AddDays(item.ShelfLifeDays.Value) : null),
                QuantityReceived = req.Quantity,
                QuantityCurrent = req.Quantity,
                UnitCost = req.UnitCost,
                Status = "Active"
            };

            _db.ItemBatches.Add(batch);

            // Record Inward Movement with Batch
            var movement = new StockMovement
            {
                MovementNumber = $"MOV-BAT-{DateTime.UtcNow:yyyyMMddHHmmss}",
                MovementDate = DateTime.UtcNow,
                MovementType = "In",
                ItemId = req.ItemId,
                WarehouseId = req.WarehouseId,
                Quantity = req.Quantity,
                UnitPrice = req.UnitCost,
                TotalValue = req.Quantity * req.UnitCost,
                BatchNumber = req.BatchNumber,
                ExpiryDate = batch.ExpiryDate,
                ReferenceType = "BatchReceipt",
                Remarks = $"Batch {req.BatchNumber} created and allocated."
            };
            _db.StockMovements.Add(movement);

            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Batch {req.BatchNumber} created successfully.",
                batchId = batch.Id
            });
        }

        // ==================== SERIAL NUMBER TRACEABILITY ====================

        [HttpGet("/api/v1/inventory/serials")]
        public async Task<IActionResult> GetSerials([FromQuery] string? search = null, [FromQuery] string? status = null)
        {
            var query = _db.ItemSerialNumbers.AsNoTracking()
                .Include(s => s.Item)
                .Include(s => s.Warehouse)
                .Where(s => !s.IsDeleted);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                query = query.Where(s => s.SerialNumber.ToLower().Contains(q) || s.Item.ItemName.ToLower().Contains(q));
            }

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(s => s.Status == status);

            var serials = await query.Take(100).Select(s => new
            {
                s.Id,
                s.SerialNumber,
                ItemCode = s.Item.ItemCode,
                ItemName = s.Item.ItemName,
                WarehouseName = s.Warehouse != null ? s.Warehouse.WarehouseName : "Dispatched",
                s.BatchNumber,
                s.Status,
                s.WarrantyExpiryDate,
                s.AssignedCustomerOrProject
            }).ToListAsync();

            return Ok(new
            {
                success = true,
                count = serials.Count,
                items = serials
            });
        }
    }
}

