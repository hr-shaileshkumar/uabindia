using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Sales.Controllers
{
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
        public int PaymentTerms { get; set; } = 30;
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateCustomerDto
    {
        public string? CustomerName { get; set; }
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
        public decimal? CreditLimit { get; set; }
        public int? PaymentTerms { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }

    [ApiController]
    [Route("api/v1/[controller]")]
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
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100;

            var total = await _db.Customers.CountAsync(c => c.TenantId == tenantId && !c.IsDeleted);
            var customers = await _db.Customers
                .Where(c => c.TenantId == tenantId && !c.IsDeleted)
                .OrderBy(c => c.CustomerName)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return Ok(new { success = true, data = customers, total, page, limit, pages = (total + limit - 1) / limit });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var customer = await _db.Customers
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);

            if (customer == null)
            {
                return NotFound(new { success = false, error = "Customer not found" });
            }

            return Ok(new { success = true, data = customer });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCustomerDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CustomerName))
            {
                return BadRequest(new { success = false, error = "Customer name is required" });
            }

            var tenantId = _tenantAccessor.GetTenantId();
            var customer = new Customer
            {
                CustomerCode = string.IsNullOrWhiteSpace(dto.CustomerCode)
                    ? $"CUST-{DateTime.UtcNow.Ticks.ToString().Substring(10)}"
                    : dto.CustomerCode,
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
                PaymentTerms = dto.PaymentTerms > 0 ? dto.PaymentTerms : 30,
                Status = dto.Status ?? "Active",
                Notes = dto.Notes,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Customers.Add(customer);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Customer created successfully", data = customer });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCustomerDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var customer = await _db.Customers
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);

            if (customer == null)
            {
                return NotFound(new { success = false, error = "Customer not found" });
            }

            if (dto.CustomerName != null) customer.CustomerName = dto.CustomerName;
            if (dto.CustomerType != null) customer.CustomerType = dto.CustomerType;
            if (dto.CompanyName != null) customer.CompanyName = dto.CompanyName;
            if (dto.GSTNumber != null) customer.GSTNumber = dto.GSTNumber;
            if (dto.PANNumber != null) customer.PANNumber = dto.PANNumber;
            if (dto.Email != null) customer.Email = dto.Email;
            if (dto.PhoneNumber != null) customer.PhoneNumber = dto.PhoneNumber;
            if (dto.MobileNumber != null) customer.MobileNumber = dto.MobileNumber;
            if (dto.BillingAddress != null) customer.BillingAddress = dto.BillingAddress;
            if (dto.ShippingAddress != null) customer.ShippingAddress = dto.ShippingAddress;
            if (dto.City != null) customer.City = dto.City;
            if (dto.State != null) customer.State = dto.State;
            if (dto.Country != null) customer.Country = dto.Country;
            if (dto.PostalCode != null) customer.PostalCode = dto.PostalCode;
            if (dto.ContactPerson != null) customer.ContactPerson = dto.ContactPerson;
            if (dto.CreditLimit.HasValue) customer.CreditLimit = dto.CreditLimit.Value;
            if (dto.PaymentTerms.HasValue) customer.PaymentTerms = dto.PaymentTerms.Value;
            if (dto.Status != null) customer.Status = dto.Status;
            if (dto.Notes != null) customer.Notes = dto.Notes;
            customer.UpdatedAt = DateTime.UtcNow;

            _db.Customers.Update(customer);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Customer updated successfully", data = customer });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var customer = await _db.Customers
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);

            if (customer == null)
            {
                return NotFound(new { success = false, error = "Customer not found" });
            }

            customer.IsDeleted = true;
            customer.UpdatedAt = DateTime.UtcNow;

            _db.Customers.Update(customer);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Customer deleted successfully" });
        }
    }
}
