using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using UabIndia.Infrastructure.Data;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Authorization;
using UabIndia.Core.Services;
using Microsoft.AspNetCore.Authorization;
using UabIndia.Api.Services;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Route("api/v1/hrms/employees")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class EmployeesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IPasswordHasher<User> _hasher;
        private readonly RoleMappingResolver _roleMappingResolver;
        private readonly IDocumentNumberService _numbers;
        private readonly IEmployeeService _employeeService;
        private readonly IEncryptionService _encryption;

        public EmployeesController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IPasswordHasher<User> hasher,
            RoleMappingResolver roleMappingResolver,
            IDocumentNumberService numbers,
            IEmployeeService employeeService,
            IEncryptionService encryption)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _hasher = hasher;
            _roleMappingResolver = roleMappingResolver;
            _numbers = numbers;
            _employeeService = employeeService;
            _encryption = encryption;
        }

        [HttpPost]
        [Authorize(Roles = "SuperAdmin,Admin,HR Manager")]
        public async Task<IActionResult> Create([FromBody] CreateEmployeeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (string.IsNullOrWhiteSpace(dto.FullName) || dto.CompanyId == Guid.Empty)
                return BadRequest(new { message = "Full name and company are required." });

            var tenantId = _tenantAccessor.GetTenantId();
            if (dto.CreateLogin && string.IsNullOrWhiteSpace(dto.WorkEmail))
                return BadRequest(new { message = "WorkEmail is required when CreateLogin is enabled." });

            var companyExists = await _db.Companies.AnyAsync(c => c.Id == dto.CompanyId && c.TenantId == tenantId && !c.IsDeleted);
            if (!companyExists) return BadRequest(new { message = "Invalid company." });

            var code = string.IsNullOrWhiteSpace(dto.EmployeeCode)
                ? await _numbers.NextAsync("Employee", "EMP-", 5)
                : dto.EmployeeCode.Trim();

            var codeTaken = await _db.Employees.AnyAsync(e => e.EmployeeCode == code && !e.IsDeleted);
            if (codeTaken) return BadRequest(new { message = "Employee code already exists." });

            var employee = new Employee { TenantId = tenantId, CreatedAt = DateTime.UtcNow };
            Apply(employee, dto, code);

            // HR Process A: Mandatory Reporting Manager for Active Status
            var hasOtherEmployees = await _db.Employees.AnyAsync(e => e.TenantId == tenantId && !e.IsDeleted);
            if (hasOtherEmployees && (employee.ReportingManagerId == null && employee.ManagerId == null) && !employee.IsOrganizationHead)
            {
                if (string.Equals(employee.Status, "Active", StringComparison.OrdinalIgnoreCase))
                {
                    // If no reporting manager is assigned upon onboarding, status defaults to Onboarding until manager is assigned
                    employee.Status = "Onboarding";
                }
            }

            _db.Employees.Add(employee);
            var loginCreated = false;
            string? workEmail = dto.WorkEmail?.Trim();
            string? temporaryPassword = null;

            if (dto.CreateLogin && !string.IsNullOrWhiteSpace(workEmail))
            {
                var normalizedWorkEmail = workEmail.ToLowerInvariant();
                var workEmailHash = _encryption.ComputeHash(normalizedWorkEmail);

                var existingUser = await _db.Users
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(u => u.TenantId == tenantId && u.EmailHash == workEmailHash && !u.IsDeleted);
                if (existingUser != null)
                    return BadRequest(new { message = "A user with this email already exists." });

                var roleName = _roleMappingResolver.ResolveEmployeeRole(dto.LoginRole);
                var role = await _db.Roles.IgnoreQueryFilters()
                    .FirstOrDefaultAsync(r => r.TenantId == tenantId && r.Name == roleName && !r.IsDeleted);
                if (role == null)
                {
                    role = new Role { TenantId = tenantId, Name = roleName, Description = "Employee login role" };
                    _db.Roles.Add(role);
                }

                var user = new User
                {
                    TenantId = tenantId,
                    Email = normalizedWorkEmail,
                    EmailHash = workEmailHash,
                    FullName = dto.FullName,
                    IsSystemAdmin = false,
                    IsActive = true
                };
                temporaryPassword = string.IsNullOrWhiteSpace(dto.InitialPassword)
                    ? BuildTemporaryPassword()
                    : dto.InitialPassword!.Trim();
                user.PasswordHash = _hasher.HashPassword(user, temporaryPassword);
                _db.Users.Add(user);
                _db.UserRoles.Add(new UserRole { TenantId = tenantId, UserId = user.Id, RoleId = role.Id });
                employee.UserId = user.Id;
                loginCreated = true;
            }

            SeedLifecycleTasks(employee, "Onboarding");
            await _db.SaveChangesAsync();

            var result = await MapAsync(employee.Id);
            result.LoginCreated = loginCreated;
            result.TemporaryPassword = temporaryPassword;
            return CreatedAtAction(nameof(Get), new { id = employee.Id }, result);
        }

        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();
            var emp = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.UserId == userId && !e.IsDeleted);
            return emp == null ? NotFound(new { message = "No employee record linked to this user." }) : Ok(await MapAsync(emp.Id));
        }

        [HttpGet]
        public async Task<IActionResult> List(
            int page = 1,
            int limit = 10,
            string? companyId = null,
            string? projectId = null,
            string? search = null,
            string? status = null,
            bool? probation = null)
        {
            try
            {
                page = Math.Max(1, page);
                limit = Math.Clamp(limit, 1, 200);

                var tenantId = _tenantAccessor.GetTenantId();
                var query = _db.Employees.AsNoTracking().Where(e => !e.IsDeleted);
                if (tenantId != Guid.Empty && !_tenantAccessor.IncludeAllTenants())
                    query = query.Where(e => e.TenantId == tenantId);

                if (!string.IsNullOrWhiteSpace(companyId) && Guid.TryParse(companyId, out var companyGuid))
                    query = query.Where(e => e.CompanyId == companyGuid);
                if (!string.IsNullOrWhiteSpace(projectId) && Guid.TryParse(projectId, out var projectGuid))
                    query = query.Where(e => e.ProjectId == projectGuid);
                if (!string.IsNullOrWhiteSpace(search))
                    query = query.Where(e => (e.FullName != null && e.FullName.Contains(search)) || (e.EmployeeCode != null && e.EmployeeCode.Contains(search)));
                if (!string.IsNullOrWhiteSpace(status))
                    query = query.Where(e => e.Status == status);
                if (probation == true)
                    query = query.Where(e =>
                        e.Status == "OnProbation"
                        || e.ProbationStatus == "Active"
                        || e.ProbationStatus == "Extended"
                        || (e.ConfirmationDate == null && e.Status != "Terminated" && e.Status != "Inactive"));

                var total = await query.CountAsync();
                var employees = await query.OrderBy(e => e.FullName).Skip((page - 1) * limit).Take(limit).ToListAsync();
                
                var deptIds = employees.Where(e => e.DepartmentId.HasValue).Select(e => e.DepartmentId!.Value).Distinct().ToList();
                var desigIds = employees.Where(e => e.DesignationId.HasValue).Select(e => e.DesignationId!.Value).Distinct().ToList();

                var depts = deptIds.Count > 0
                    ? await _db.Departments.AsNoTracking().Where(d => deptIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.Name)
                    : new System.Collections.Generic.Dictionary<Guid, string>();
                var desigs = desigIds.Count > 0
                    ? await _db.Designations.AsNoTracking().Where(d => desigIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.Name)
                    : new System.Collections.Generic.Dictionary<Guid, string>();

                var data = employees.Select(emp => new EmployeeDto
                {
                    Id = emp.Id,
                    FullName = emp.FullName,
                    CompanyId = emp.CompanyId,
                    EmployeeCode = emp.EmployeeCode,
                    ProjectId = emp.ProjectId,
                    Status = emp.Status,
                    WorkEmail = emp.WorkEmail,
                    Phone = emp.Phone,
                    DateOfBirth = emp.DateOfBirth,
                    Gender = emp.Gender,
                    Address = emp.Address,
                    City = emp.City,
                    State = emp.State,
                    DateOfJoining = emp.DateOfJoining,
                    ConfirmationDate = emp.ConfirmationDate,
                    ProbationEndDate = emp.ProbationEndDate,
                    ExitDate = emp.ExitDate,
                    EmploymentType = emp.EmploymentType,
                    WorkLocation = emp.WorkLocation,
                    DepartmentId = emp.DepartmentId,
                    DepartmentName = emp.DepartmentId.HasValue && depts.TryGetValue(emp.DepartmentId.Value, out var dName) ? dName : null,
                    DesignationId = emp.DesignationId,
                    DesignationName = emp.DesignationId.HasValue && desigs.TryGetValue(emp.DesignationId.Value, out var desName) ? desName : null,
                    ManagerId = emp.ManagerId,
                    UserId = emp.UserId,
                    Pan = emp.Pan,
                    Uan = emp.Uan,
                    EsiNumber = emp.EsiNumber,
                    PfNumber = emp.PfNumber,
                    BankName = emp.BankName,
                    BankIfsc = emp.BankIfsc,
                    PayrollStructureId = emp.PayrollStructureId,
                    MonthlyCtc = emp.MonthlyCtc,
                    BasicSalary = emp.BasicSalary,
                    ProbationStatus = emp.ProbationStatus,
                    ProbationScore = emp.ProbationScore,
                    ProbationComments = emp.ProbationComments,
                    CreatedAt = emp.CreatedAt,
                    UpdatedAt = emp.UpdatedAt
                }).ToList();

                return Ok(new { employees = data, total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to load employees", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "SuperAdmin,Admin,HR Manager")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmployeeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var tenantId = _tenantAccessor.GetTenantId();
            var employee = await _db.Employees.FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId && !e.IsDeleted);
            if (employee == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.EmployeeCode) && dto.EmployeeCode != employee.EmployeeCode)
            {
                var taken = await _db.Employees.AnyAsync(e => e.Id != id && e.EmployeeCode == dto.EmployeeCode && !e.IsDeleted);
                if (taken) return BadRequest(new { message = "Employee code already exists." });
            }

            Apply(employee, dto, dto.EmployeeCode ?? employee.EmployeeCode);
            if (!string.IsNullOrWhiteSpace(dto.ProbationStatus))
            {
                if (dto.ProbationStatus == "Confirmed")
                {
                    employee.ConfirmationDate ??= DateTime.UtcNow;
                    employee.Status = "Active";
                }
                else if (dto.ProbationStatus == "Terminated")
                {
                    employee.Status = "Terminated";
                    employee.ExitDate ??= DateTime.UtcNow;
                    SeedLifecycleTasks(employee, "Offboarding");
                }
            }

            if (employee.Status == "Terminated" || employee.Status == "Inactive")
                SeedLifecycleTasks(employee, "Offboarding");

            employee.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(await MapAsync(employee.Id));
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
            var mapped = await MapAsync(id);
            return mapped.Id == Guid.Empty ? NotFound() : Ok(mapped);
        }

        [HttpGet("{id}/profile-360")]
        public async Task<IActionResult> GetProfile360(Guid id, System.Threading.CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var profile = await _employeeService.GetProfile360Async(id, tenantId, ct);
            if (profile == null) return NotFound(new { message = "Employee not found." });
            return Ok(profile);
        }

        private void Apply(Employee employee, CreateEmployeeDto dto, string? code)
        {
            employee.FullName = dto.FullName;
            employee.EmployeeCode = code;
            if (dto.CompanyId != Guid.Empty) employee.CompanyId = dto.CompanyId;
            employee.ProjectId = dto.ProjectId;
            employee.Status = string.IsNullOrWhiteSpace(dto.Status) ? employee.Status ?? "Active" : dto.Status;
            employee.WorkEmail = dto.WorkEmail ?? employee.WorkEmail;
            employee.PersonalEmail = dto.PersonalEmail ?? employee.PersonalEmail;
            employee.Phone = dto.Phone ?? employee.Phone;
            employee.AlternatePhone = dto.AlternatePhone ?? employee.AlternatePhone;
            employee.DateOfBirth = dto.DateOfBirth ?? employee.DateOfBirth;
            employee.Gender = dto.Gender ?? employee.Gender;
            employee.MaritalStatus = dto.MaritalStatus ?? employee.MaritalStatus;
            employee.Address = dto.Address ?? employee.Address;
            employee.City = dto.City ?? employee.City;
            employee.State = dto.State ?? employee.State;
            employee.PostalCode = dto.PostalCode ?? employee.PostalCode;
            employee.DateOfJoining = dto.DateOfJoining ?? employee.DateOfJoining ?? DateTime.UtcNow.Date;
            employee.ConfirmationDate = dto.ConfirmationDate ?? employee.ConfirmationDate;
            employee.ProbationEndDate = dto.ProbationEndDate ?? employee.ProbationEndDate ?? employee.DateOfJoining?.AddMonths(3);
            employee.ExitDate = dto.ExitDate ?? employee.ExitDate;
            employee.EmploymentType = dto.EmploymentType ?? employee.EmploymentType ?? "Permanent";
            employee.WorkLocation = dto.WorkLocation ?? employee.WorkLocation;
            employee.DepartmentId = dto.DepartmentId ?? employee.DepartmentId;
            employee.DesignationId = dto.DesignationId ?? employee.DesignationId;
            employee.BranchId = dto.BranchId ?? employee.BranchId;
            employee.CostCenterId = dto.CostCenterId ?? employee.CostCenterId;
            employee.ManagerId = dto.ManagerId ?? employee.ManagerId;
            employee.ReportingManagerId = dto.ReportingManagerId ?? employee.ReportingManagerId;
            employee.Pan = dto.Pan ?? employee.Pan;
            employee.Aadhaar = dto.Aadhaar ?? employee.Aadhaar;
            employee.Uan = dto.Uan ?? employee.Uan;
            employee.EsiNumber = dto.EsiNumber ?? employee.EsiNumber;
            employee.PfNumber = dto.PfNumber ?? employee.PfNumber;
            employee.BankName = dto.BankName ?? employee.BankName;
            employee.BankAccountHolder = dto.BankAccountHolder ?? employee.BankAccountHolder;
            employee.BankAccountNumber = dto.BankAccountNumber ?? employee.BankAccountNumber;
            employee.BankIfsc = dto.BankIfsc ?? employee.BankIfsc;
            employee.PayrollStructureId = dto.PayrollStructureId ?? employee.PayrollStructureId;
            if (dto.MonthlyCtc > 0) employee.MonthlyCtc = dto.MonthlyCtc;
            if (dto.BasicSalary > 0) employee.BasicSalary = dto.BasicSalary;
            employee.ProbationStatus = dto.ProbationStatus ?? employee.ProbationStatus;
            employee.ProbationScore = dto.ProbationScore ?? employee.ProbationScore;
            employee.ProbationComments = dto.ProbationComments ?? employee.ProbationComments;
        }

        private void SeedLifecycleTasks(Employee employee, string kind)
        {
            var exists = _db.HrLifecycleTasks.Local.Any(t => t.EmployeeId == employee.Id && t.Kind == kind)
                || _db.HrLifecycleTasks.Any(t => t.EmployeeId == employee.Id && t.Kind == kind && !t.IsDeleted);
            if (exists) return;

            var titles = kind == "Offboarding"
                ? new[] { "Clearance from manager", "IT asset return", "Finance / F&F checklist", "Revoke system access", "Exit interview" }
                : new[] { "Collect identity documents", "Bank and statutory enrollment", "IT assets allocation", "Induction / policy acknowledgement", "Assign buddy / manager" };

            for (var i = 0; i < titles.Length; i++)
            {
                _db.HrLifecycleTasks.Add(new HrLifecycleTask
                {
                    TenantId = employee.TenantId,
                    EmployeeId = employee.Id,
                    Kind = kind,
                    Title = titles[i],
                    Category = "HR",
                    Status = "Pending",
                    SortOrder = i + 1,
                    DueDate = DateTime.UtcNow.Date.AddDays(7 + i),
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        private async Task<EmployeeDto> MapAsync(Guid id)
        {
            var emp = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
            if (emp == null) return new EmployeeDto();

            var dept = emp.DepartmentId.HasValue
                ? await _db.Departments.AsNoTracking().Where(d => d.Id == emp.DepartmentId).Select(d => d.Name).FirstOrDefaultAsync()
                : null;
            var desig = emp.DesignationId.HasValue
                ? await _db.Designations.AsNoTracking().Where(d => d.Id == emp.DesignationId).Select(d => d.Name).FirstOrDefaultAsync()
                : null;

            var mgrId = emp.ReportingManagerId ?? emp.ManagerId;
            var mgrName = mgrId.HasValue
                ? await _db.Employees.AsNoTracking().Where(m => m.Id == mgrId.Value).Select(m => m.FullName).FirstOrDefaultAsync()
                : null;

            var actingMgrName = emp.ActingManagerId.HasValue
                ? await _db.Employees.AsNoTracking().Where(m => m.Id == emp.ActingManagerId.Value).Select(m => m.FullName).FirstOrDefaultAsync()
                : null;

            return new EmployeeDto
            {
                Id = emp.Id,
                FullName = emp.FullName,
                CompanyId = emp.CompanyId,
                EmployeeCode = emp.EmployeeCode,
                ProjectId = emp.ProjectId,
                Status = emp.Status,
                WorkEmail = emp.WorkEmail,
                Phone = emp.Phone,
                DateOfBirth = emp.DateOfBirth,
                Gender = emp.Gender,
                Address = emp.Address,
                City = emp.City,
                State = emp.State,
                DateOfJoining = emp.DateOfJoining,
                ConfirmationDate = emp.ConfirmationDate,
                ProbationEndDate = emp.ProbationEndDate,
                ExitDate = emp.ExitDate,
                EmploymentType = emp.EmploymentType,
                WorkLocation = emp.WorkLocation,
                DepartmentId = emp.DepartmentId,
                DepartmentName = dept,
                DesignationId = emp.DesignationId,
                DesignationName = desig,
                ManagerId = mgrId,
                ReportingManagerId = mgrId,
                ReportingManagerName = mgrName,
                ActingManagerId = emp.ActingManagerId,
                ActingManagerName = actingMgrName,
                DelegationStartDate = emp.DelegationStartDate,
                DelegationEndDate = emp.DelegationEndDate,
                DelegationReason = emp.DelegationReason,
                IsOrganizationHead = emp.IsOrganizationHead,
                UserId = emp.UserId,
                Pan = emp.Pan,
                Uan = emp.Uan,
                EsiNumber = emp.EsiNumber,
                PfNumber = emp.PfNumber,
                BankName = emp.BankName,
                BankIfsc = emp.BankIfsc,
                PayrollStructureId = emp.PayrollStructureId,
                MonthlyCtc = emp.MonthlyCtc,
                BasicSalary = emp.BasicSalary,
                ProbationStatus = emp.ProbationStatus,
                ProbationScore = emp.ProbationScore,
                ProbationComments = emp.ProbationComments,
                CreatedAt = emp.CreatedAt,
                UpdatedAt = emp.UpdatedAt
            };
        }

        private static string BuildTemporaryPassword() => $"Emp@{Guid.NewGuid():N}"[..18];

        private Guid GetUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }
    }
}
