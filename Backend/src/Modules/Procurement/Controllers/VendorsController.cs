using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace UabIndia.Api.Modules.Procurement.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class VendorsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public VendorsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100;
            var total = await _db.Vendors.CountAsync();
            var vendors = await _db.Vendors
                .Where(v => v.TenantId == tenantId)
                .OrderBy(v => v.VendorName)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return Ok(new { success = true, data = vendors, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var vendor = await _db.Vendors
                .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId);
            if (vendor == null) return NotFound();
            return Ok(vendor);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateVendorDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var vendor = new Vendor
            {
                VendorCode = dto.VendorCode,
                VendorName = dto.VendorName,
                VendorType = dto.VendorType ?? "Supplier",
                CompanyName = dto.CompanyName,
                GSTNumber = dto.GSTNumber,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Address = dto.Address,
                City = dto.City,
                State = dto.State,
                Country = dto.Country ?? "India",
                PostalCode = dto.PostalCode,
                CreditLimit = dto.CreditLimit,
                PaymentTerms = dto.PaymentTerms ?? 30,
                Status = "Active",
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Vendors.Add(vendor);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Vendor created successfully", vendor });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVendorDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var vendor = await _db.Vendors
                .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId && !v.IsDeleted);
            if (vendor == null) return NotFound();

            if (dto.VendorName != null) vendor.VendorName = dto.VendorName;
            if (dto.Email != null) vendor.Email = dto.Email;
            if (dto.PhoneNumber != null) vendor.PhoneNumber = dto.PhoneNumber;
            vendor.UpdatedAt = DateTime.UtcNow;

            _db.Vendors.Update(vendor);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Vendor updated successfully", vendor });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var vendor = await _db.Vendors
                .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId && !v.IsDeleted);
            if (vendor == null) return NotFound();

            vendor.IsDeleted = true;
            vendor.UpdatedAt = DateTime.UtcNow;
            _db.Vendors.Update(vendor);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Vendor deleted successfully" });
        }
    }

    public class CreateVendorDto
    {
        public string VendorCode { get; set; } = string.Empty;
        public string VendorName { get; set; } = string.Empty;
        public string? VendorType { get; set; }
        public string? CompanyName { get; set; }
        public string? GSTNumber { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; }
        public string? PostalCode { get; set; }
        public decimal CreditLimit { get; set; }
        public int? PaymentTerms { get; set; }
    }

    public class UpdateVendorDto
    {
        public string? VendorName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
    }
}
