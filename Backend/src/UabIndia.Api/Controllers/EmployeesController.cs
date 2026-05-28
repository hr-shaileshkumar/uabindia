using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using UabIndia.Infrastructure.Data;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Authorization;
using Microsoft.AspNetCore.Authorization;
using UabIndia.Api.Services;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class EmployeesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IPasswordHasher<User> _hasher;
        private readonly RoleMappingResolver _roleMappingResolver;

        public EmployeesController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IPasswordHasher<User> hasher,
            RoleMappingResolver roleMappingResolver)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _hasher = hasher;
            _roleMappingResolver = roleMappingResolver;
        }

        [HttpPost]
        [Authorize(Roles = "SuperAdmin,Admin,HR Manager")]
        public async Task<IActionResult> Create([FromBody] CreateEmployeeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            if (dto.CreateLogin && string.IsNullOrWhiteSpace(dto.WorkEmail))
            {
                return BadRequest(new { message = "WorkEmail is required when CreateLogin is enabled." });
            }

            var companyExists = await _db.Companies.AnyAsync(c => c.Id == dto.CompanyId && c.TenantId == tenantId && !c.IsDeleted);
            if (!companyExists) return BadRequest(new { message = "Invalid company." });

            var employee = new Employee
            {
                FullName = dto.FullName,
                EmployeeCode = dto.EmployeeCode,
                CompanyId = dto.CompanyId,
                ProjectId = dto.ProjectId,
                Status = dto.Status,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Employees.Add(employee);
            var loginCreated = false;
            string? workEmail = null;

            if (dto.CreateLogin)
            {
                workEmail = dto.WorkEmail!.Trim();
                var existingUser = await _db.Users
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Email == workEmail && !u.IsDeleted);

                if (existingUser != null)
                {
                    return BadRequest(new { message = "A user with this email already exists." });
                }

                var roleName = ResolveEmployeeLoginRole(dto.LoginRole);
                var role = await _db.Roles
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(r => r.TenantId == tenantId && r.Name == roleName && !r.IsDeleted);

                if (role == null)
                {
                    role = new Role
                    {
                        TenantId = tenantId,
                        Name = roleName,
                        Description = roleName == RoleCatalog.EmployeeRoleName ? "Standard employee" : "Employee login role"
                    };
                    _db.Roles.Add(role);
                }

                var user = new User
                {
                    TenantId = tenantId,
                    Email = workEmail,
                    FullName = dto.FullName,
                    IsSystemAdmin = false,
                    IsActive = true
                };

                var password = string.IsNullOrWhiteSpace(dto.InitialPassword)
                    ? BuildTemporaryPassword()
                    : dto.InitialPassword!.Trim();

                user.PasswordHash = _hasher.HashPassword(user, password);
                _db.Users.Add(user);

                _db.UserRoles.Add(new UserRole
                {
                    TenantId = tenantId,
                    UserId = user.Id,
                    RoleId = role.Id
                });

                loginCreated = true;
            }

            await _db.SaveChangesAsync();

            var result = new EmployeeDto
            {
                Id = employee.Id,
                FullName = employee.FullName,
                CompanyId = employee.CompanyId,
                EmployeeCode = employee.EmployeeCode,
                ProjectId = employee.ProjectId,
                Status = employee.Status,
                LoginCreated = loginCreated,
                WorkEmail = workEmail
            };
            return CreatedAtAction(nameof(Get), new { id = employee.Id }, result);
        }

        private string ResolveEmployeeLoginRole(string? requestedRole)
        {
            return _roleMappingResolver.ResolveEmployeeRole(requestedRole);
        }

        private static string BuildTemporaryPassword()
            => $"Emp@{Guid.NewGuid():N}"[..18];

        [HttpGet]
        public async Task<IActionResult> List(
            int page = 1,
            int limit = 10,
            string? companyId = null,
            string? projectId = null,
            string? search = null,
            string? status = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.Employees
                .AsNoTracking()
                .Where(e => e.TenantId == tenantId && !e.IsDeleted);

            if (!string.IsNullOrWhiteSpace(companyId) && Guid.TryParse(companyId, out var companyGuid))
            {
                query = query.Where(e => e.CompanyId == companyGuid);
            }

            if (!string.IsNullOrWhiteSpace(projectId) && Guid.TryParse(projectId, out var projectGuid))
            {
                query = query.Where(e => e.ProjectId == projectGuid);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(e => (e.FullName != null && e.FullName.Contains(search))
                                       || (e.EmployeeCode != null && e.EmployeeCode.Contains(search)));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(e => e.Status == status);
            }

            var total = await query.CountAsync();
            var data = await query
                .OrderBy(e => e.FullName)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    FullName = e.FullName,
                    CompanyId = e.CompanyId,
                    EmployeeCode = e.EmployeeCode,
                    ProjectId = e.ProjectId,
                    Status = e.Status
                })
                .ToListAsync();

            return Ok(new { employees = data, total });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "SuperAdmin,Admin,HR Manager")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmployeeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var employee = await _db.Employees.FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId && !e.IsDeleted);
            if (employee == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.FullName)) employee.FullName = dto.FullName;
            if (!string.IsNullOrWhiteSpace(dto.EmployeeCode)) employee.EmployeeCode = dto.EmployeeCode;
            if (dto.CompanyId.HasValue) employee.CompanyId = dto.CompanyId.Value;
            if (dto.ProjectId.HasValue) employee.ProjectId = dto.ProjectId;
            if (!string.IsNullOrWhiteSpace(dto.Status)) employee.Status = dto.Status;

            employee.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "SuperAdmin,Admin,HR Manager")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var employee = await _db.Employees.FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId && !e.IsDeleted);
            if (employee == null) return NotFound();

            employee.IsDeleted = true;
            employee.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var emp = await _db.Employees.FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId && !e.IsDeleted);
            if (emp == null) return NotFound();
            var res = new EmployeeDto { Id = emp.Id, FullName = emp.FullName, CompanyId = emp.CompanyId, EmployeeCode = emp.EmployeeCode, ProjectId = emp.ProjectId, Status = emp.Status };
            return Ok(res);
        }
    }
}
