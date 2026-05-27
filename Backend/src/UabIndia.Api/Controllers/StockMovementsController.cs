using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class StockMovementsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public StockMovementsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 20)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (page < 1) page = 1;
            if (limit < 1) limit = 20;
            if (limit > 100) limit = 100;

            var query = _db.StockMovements
                .AsNoTracking()
                .Include(m => m.Item)
                .Include(m => m.Warehouse)
                .Where(m => m.TenantId == tenantId);

            var total = await query.CountAsync();
            var data = await query
                .OrderByDescending(m => m.MovementDate)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(m => new StockMovementListDto
                {
                    Id = m.Id,
                    MovementNumber = m.MovementNumber,
                    MovementDate = m.MovementDate,
                    MovementType = m.MovementType,
                    ItemId = m.ItemId,
                    ItemCode = m.Item != null ? m.Item.ItemCode : "",
                    ItemName = m.Item != null ? m.Item.ItemName : "",
                    WarehouseId = m.WarehouseId,
                    WarehouseName = m.Warehouse != null ? m.Warehouse.WarehouseName : null,
                    Quantity = m.Quantity,
                    UnitPrice = m.UnitPrice,
                    TotalValue = m.TotalValue,
                    ReferenceNumber = m.ReferenceNumber,
                    Remarks = m.Remarks
                })
                .ToListAsync();

            return Ok(new { data, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateStockMovementDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (dto.Quantity == 0)
                return BadRequest(new { message = "Quantity cannot be zero." });

            var item = await _db.Items.FirstOrDefaultAsync(i => i.Id == dto.ItemId && i.TenantId == tenantId);
            if (item == null) return NotFound(new { message = "Item not found." });

            Warehouse? warehouse = null;
            if (dto.WarehouseId.HasValue)
            {
                warehouse = await _db.Warehouses.FirstOrDefaultAsync(w => w.Id == dto.WarehouseId && w.TenantId == tenantId);
                if (warehouse == null) return BadRequest(new { message = "Warehouse not found." });
            }

            var movementType = string.IsNullOrWhiteSpace(dto.MovementType) ? "In" : dto.MovementType;
            var qty = dto.Quantity;
            var unitPrice = dto.UnitPrice >= 0 ? dto.UnitPrice : item.PurchasePrice;
            var totalValue = dto.TotalValue > 0 ? dto.TotalValue : Math.Abs(qty) * unitPrice;

            await using var trx = await _db.Database.BeginTransactionAsync();

            if (movementType.Equals("In", StringComparison.OrdinalIgnoreCase))
            {
                item.CurrentStock += Math.Abs(qty);
            }
            else if (movementType.Equals("Out", StringComparison.OrdinalIgnoreCase))
            {
                var outQty = Math.Abs(qty);
                if (item.CurrentStock < outQty)
                {
                    await trx.RollbackAsync();
                    return BadRequest(new { message = "Insufficient stock for this item." });
                }
                item.CurrentStock -= outQty;
            }
            else if (movementType.Equals("Adjustment", StringComparison.OrdinalIgnoreCase))
            {
                item.CurrentStock += qty;
                if (item.CurrentStock < 0)
                {
                    await trx.RollbackAsync();
                    return BadRequest(new { message = "Adjustment would make stock negative." });
                }
            }
            else
            {
                await trx.RollbackAsync();
                return BadRequest(new { message = "MovementType must be In, Out, or Adjustment." });
            }

            item.UpdatedAt = DateTime.UtcNow;

            var movement = new StockMovement
            {
                TenantId = tenantId,
                MovementNumber = $"MV-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(10000, 99999)}",
                MovementDate = dto.MovementDate.Kind == DateTimeKind.Unspecified
                    ? DateTime.SpecifyKind(dto.MovementDate, DateTimeKind.Utc)
                    : dto.MovementDate.ToUniversalTime(),
                MovementType = movementType,
                ItemId = dto.ItemId,
                WarehouseId = dto.WarehouseId,
                Quantity = qty,
                UnitPrice = unitPrice,
                TotalValue = totalValue,
                ReferenceType = dto.ReferenceType,
                ReferenceId = dto.ReferenceId,
                ReferenceNumber = dto.ReferenceNumber,
                Remarks = dto.Remarks,
                FromWarehouseId = dto.FromWarehouseId,
                ToWarehouseId = dto.ToWarehouseId,
                CreatedAt = DateTime.UtcNow
            };

            _db.StockMovements.Add(movement);

            await _db.SaveChangesAsync();
            await trx.CommitAsync();

            return Ok(new { message = "Stock movement recorded.", movement });
        }
    }

    public class StockMovementListDto
    {
        public Guid Id { get; set; }
        public string MovementNumber { get; set; } = "";
        public DateTime MovementDate { get; set; }
        public string MovementType { get; set; } = "";
        public Guid ItemId { get; set; }
        public string ItemCode { get; set; } = "";
        public string ItemName { get; set; } = "";
        public Guid? WarehouseId { get; set; }
        public string? WarehouseName { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalValue { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Remarks { get; set; }
    }

    public class CreateStockMovementDto
    {
        public DateTime MovementDate { get; set; } = DateTime.UtcNow.Date;
        public string? MovementType { get; set; }
        public Guid ItemId { get; set; }
        public Guid? WarehouseId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalValue { get; set; }
        public string? ReferenceType { get; set; }
        public Guid? ReferenceId { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Remarks { get; set; }
        public Guid? FromWarehouseId { get; set; }
        public Guid? ToWarehouseId { get; set; }
    }
}
