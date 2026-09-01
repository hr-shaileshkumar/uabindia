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
    public class WarehousesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;

        public WarehousesController(ApplicationDbContext db, ITenantAccessor tenantAccessor, IDocumentNumberService numbers)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 50)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (page < 1) page = 1;
            if (limit < 1) limit = 50;
            if (limit > 200) limit = 200;

            var query = _db.Warehouses.Where(w => w.TenantId == tenantId);
            var total = await query.CountAsync();
            var data = await query
                .OrderBy(w => w.WarehouseName)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return Ok(new { data, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var wh = await _db.Warehouses.FirstOrDefaultAsync(w => w.Id == id && w.TenantId == tenantId);
            if (wh == null) return NotFound();
            return Ok(wh);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateWarehouseDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var warehouse = new Warehouse
            {
                TenantId = tenantId,
                WarehouseCode = string.IsNullOrWhiteSpace(dto.WarehouseCode)
                    ? await _numbers.NextAsync("Warehouse", "WH-", 5)
                    : dto.WarehouseCode.Trim(),
                WarehouseName = dto.WarehouseName.Trim(),
                Address = dto.Address,
                City = dto.City,
                State = dto.State,
                Country = string.IsNullOrWhiteSpace(dto.Country) ? "India" : dto.Country,
                PostalCode = dto.PostalCode,
                ContactPerson = dto.ContactPerson,
                PhoneNumber = dto.PhoneNumber,
                Email = dto.Email,
                IsDefault = dto.IsDefault,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            if (warehouse.IsDefault)
            {
                var others = await _db.Warehouses.Where(w => w.TenantId == tenantId && w.IsDefault).ToListAsync();
                foreach (var o in others) o.IsDefault = false;
            }

            _db.Warehouses.Add(warehouse);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Warehouse created.", warehouse });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateWarehouseDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var wh = await _db.Warehouses.FirstOrDefaultAsync(w => w.Id == id && w.TenantId == tenantId);
            if (wh == null) return NotFound();

            if (dto.WarehouseName != null) wh.WarehouseName = dto.WarehouseName;
            if (dto.Address != null) wh.Address = dto.Address;
            if (dto.City != null) wh.City = dto.City;
            if (dto.State != null) wh.State = dto.State;
            if (dto.Country != null) wh.Country = dto.Country;
            if (dto.PostalCode != null) wh.PostalCode = dto.PostalCode;
            if (dto.ContactPerson != null) wh.ContactPerson = dto.ContactPerson;
            if (dto.PhoneNumber != null) wh.PhoneNumber = dto.PhoneNumber;
            if (dto.Email != null) wh.Email = dto.Email;
            if (dto.IsActive.HasValue) wh.IsActive = dto.IsActive.Value;
            if (dto.IsDefault == true)
            {
                var others = await _db.Warehouses.Where(w => w.TenantId == tenantId && w.IsDefault && w.Id != id).ToListAsync();
                foreach (var o in others) o.IsDefault = false;
                wh.IsDefault = true;
            }

            wh.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Warehouse updated.", warehouse = wh });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var wh = await _db.Warehouses.FirstOrDefaultAsync(w => w.Id == id && w.TenantId == tenantId);
            if (wh == null) return NotFound();

            wh.IsDeleted = true;
            wh.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Warehouse removed." });
        }
    }

    public class CreateWarehouseDto
    {
        public string WarehouseCode { get; set; } = "";
        public string WarehouseName { get; set; } = "";
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; }
        public string? PostalCode { get; set; }
        public string? ContactPerson { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public bool IsDefault { get; set; }
    }

    public class UpdateWarehouseDto
    {
        public string? WarehouseName { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; }
        public string? PostalCode { get; set; }
        public string? ContactPerson { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsDefault { get; set; }
    }
}
