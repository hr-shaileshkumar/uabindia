using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Inventory.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class StockMovementsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IInventoryStockService _stock;

        public StockMovementsController(ApplicationDbContext db, ITenantAccessor tenantAccessor, IInventoryStockService stock)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _stock = stock;
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
                    Remarks = m.Remarks,
                    FromWarehouseId = m.FromWarehouseId,
                    ToWarehouseId = m.ToWarehouseId
                })
                .ToListAsync();

            return Ok(new { data, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateStockMovementDto dto)
        {
            try
            {
                var movement = await _stock.RecordAsync(new RecordStockMovementCommand(
                    dto.MovementDate,
                    dto.MovementType,
                    dto.ItemId,
                    dto.WarehouseId,
                    dto.Quantity,
                    dto.UnitPrice,
                    dto.TotalValue,
                    dto.ReferenceType,
                    dto.ReferenceId,
                    dto.ReferenceNumber,
                    dto.Remarks,
                    dto.AdjustmentType,
                    dto.FromWarehouseId,
                    dto.ToWarehouseId));
                return Ok(new { message = "Stock movement recorded.", movement });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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
        public Guid? FromWarehouseId { get; set; }
        public Guid? ToWarehouseId { get; set; }
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
        public string? AdjustmentType { get; set; }
        public Guid? FromWarehouseId { get; set; }
        public Guid? ToWarehouseId { get; set; }
    }
}
