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

namespace UabIndia.Api.Modules.CRM.Controllers
{
    [ApiController]
    [Route("api/v1/crm/customers")]
    [Authorize]
    public class CustomersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public CustomersController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            
            var total = await _db.Customers.CountAsync(c => c.TenantId == tenantId && !c.IsDeleted);
            var customers = await _db.Customers
                .Where(c => c.TenantId == tenantId && !c.IsDeleted)
                .OrderBy(c => c.CustomerName)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return Ok(new
            {
                data = customers,
                total,
                page,
                limit,
                pages = (total + limit - 1) / limit
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var customer = await _db.Customers
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

            if (customer == null)
                return NotFound(new { message = "Customer not found" });

            return Ok(customer);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateCustomerDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();

            // Check for duplicate code
            var exists = await _db.Customers
                .AnyAsync(c => c.CustomerCode == dto.CustomerCode && c.TenantId == tenantId && !c.IsDeleted);
            if (exists)
                return BadRequest(new { message = "Customer code already exists" });

            var customer = new Customer
            {
                CustomerCode = dto.CustomerCode,
                CustomerName = dto.CustomerName,
                CustomerType = dto.CustomerType ?? "Individual",
                CompanyName = dto.CompanyName,
                GSTNumber = dto.GSTNumber,
                PANNumber = dto.PANNumber,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                MobileNumber = dto.MobileNumber,
                BillingAddress = dto.BillingAddress,
                ShippingAddress = dto.ShippingAddress,
                City = dto.City,
                State = dto.State,
                Country = dto.Country ?? "India",
                PostalCode = dto.PostalCode,
                ContactPerson = dto.ContactPerson,
                CreditLimit = dto.CreditLimit,
                PaymentTerms = dto.PaymentTerms ?? 30,
                OpeningBalance = dto.OpeningBalance,
                Status = "Active",
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Customers.Add(customer);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Customer created successfully", customer });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCustomerDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var customer = await _db.Customers
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);

            if (customer == null)
                return NotFound(new { message = "Customer not found" });

            customer.CustomerName = dto.CustomerName ?? customer.CustomerName;
            customer.Email = dto.Email ?? customer.Email;
            customer.PhoneNumber = dto.PhoneNumber ?? customer.PhoneNumber;
            customer.MobileNumber = dto.MobileNumber ?? customer.MobileNumber;
            customer.BillingAddress = dto.BillingAddress ?? customer.BillingAddress;
            customer.ShippingAddress = dto.ShippingAddress ?? customer.ShippingAddress;
            customer.City = dto.City ?? customer.City;
            customer.State = dto.State ?? customer.State;
            customer.PostalCode = dto.PostalCode ?? customer.PostalCode;
            customer.CreditLimit = dto.CreditLimit ?? customer.CreditLimit;
            customer.Status = dto.Status ?? customer.Status;
            customer.UpdatedAt = DateTime.UtcNow;

            _db.Customers.Update(customer);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Customer updated successfully", customer });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var customer = await _db.Customers
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);

            if (customer == null)
                return NotFound(new { message = "Customer not found" });

            customer.IsDeleted = true;
            customer.UpdatedAt = DateTime.UtcNow;
            _db.Customers.Update(customer);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Customer deleted successfully" });
        }
    }

    public class CreateCustomerDto
    {
        public string CustomerCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerType { get; set; }
        public string? CompanyName { get; set; }
        public string? GSTNumber { get; set; }
        public string? PANNumber { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? MobileNumber { get; set; }
        public string? BillingAddress { get; set; }
        public string? ShippingAddress { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; }
        public string? PostalCode { get; set; }
        public string? ContactPerson { get; set; }
        public decimal CreditLimit { get; set; }
        public int? PaymentTerms { get; set; }
        public decimal OpeningBalance { get; set; }
    }

    public class UpdateCustomerDto
    {
        public string? CustomerName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? MobileNumber { get; set; }
        public string? BillingAddress { get; set; }
        public string? ShippingAddress { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public decimal? CreditLimit { get; set; }
        public string? Status { get; set; }
    }
}
