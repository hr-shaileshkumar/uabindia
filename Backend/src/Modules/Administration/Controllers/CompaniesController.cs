using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Services;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;
using System.Security.Claims;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Route("api/v1/administration/companies")]
    [Authorize]
    public class CompaniesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly InputSanitizer _sanitizer;
        private readonly ICacheService _cache;

        public CompaniesController(ApplicationDbContext db, ITenantAccessor tenantAccessor, InputSanitizer sanitizer, ICacheService cache)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _sanitizer = sanitizer;
            _cache = cache;
        }

        /// <summary>
        /// Invalidates all company list cache pages for a tenant.
        /// </summary>
        private async Task InvalidateCompanyCache(Guid tenantId)
        {
            // Invalidate all company list cache entries for this tenant
            // (ideally with RemoveByPrefixAsync once Redis SCAN is implemented)
            for (int page = 1; page <= 10; page++)
            {
                for (int limit = 1; limit <= 100; limit += 10)
                {
                    var key = $"company_list_{tenantId}_{page}_{limit}";
                    await _cache.RemoveAsync(key);
                    var deletedKey = $"company_list_{tenantId}_{page}_{limit}_True";
                    await _cache.RemoveAsync(deletedKey);
                    var activeKey = $"company_list_{tenantId}_{page}_{limit}_False";
                    await _cache.RemoveAsync(activeKey);
                }
            }
        }

        private bool IsSuperAdmin()
        {
            return User.HasClaim("is_system_admin", "true");
        }

        private static bool IsTenantSchemaUnavailable(Exception ex)
        {
            var text = ex.ToString();
            return text.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase)
                || text.Contains("Cannot find the object", StringComparison.OrdinalIgnoreCase)
                || text.Contains("Could not find object", StringComparison.OrdinalIgnoreCase);
        }

        private static string BuildDefaultCompanyCode(string seed, Guid tenantId)
        {
            var compact = new string((seed ?? string.Empty)
                .Where(char.IsLetterOrDigit)
                .ToArray())
                .ToUpperInvariant();

            if (string.IsNullOrWhiteSpace(compact))
            {
                compact = "COMP";
            }

            if (compact.Length > 8)
            {
                compact = compact[..8];
            }

            var suffix = tenantId.ToString("N")[..4].ToUpperInvariant();
            return $"{compact}-{suffix}";
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int limit = 10, [FromQuery] bool includeDeleted = false)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();

                if (page < 1) page = 1;
                if (limit < 1) limit = 10;
                if (limit > 100) limit = 100;
                
                // Cache key: company_list_{tenantId}_{page}_{limit}_{includeDeleted}
                var cacheKey = $"company_list_{tenantId}_{page}_{limit}_{includeDeleted}";
                
                var cached = await _cache.GetAsync<object>(cacheKey);
                if (cached != null)
                    return Ok(cached);
                
                var query = includeDeleted
                    ? _db.Companies.IgnoreQueryFilters().AsNoTracking().Where(c => c.TenantId == tenantId)
                    : _db.Companies.AsNoTracking().Where(c => c.TenantId == tenantId && !c.IsDeleted);

                var total = await query.CountAsync();

                if (total == 0 && !includeDeleted)
                {
                    var tenant = await _db.Tenants
                        .AsNoTracking()
                        .FirstOrDefaultAsync(t => t.Id == tenantId && !t.IsDeleted);

                    if (tenant != null)
                    {
                        var companyName = string.IsNullOrWhiteSpace(tenant.Name)
                            ? $"{tenant.Subdomain?.ToUpperInvariant() ?? "TENANT"} Company"
                            : tenant.Name.Trim();

                        _db.Companies.Add(new Company
                        {
                            TenantId = tenantId,
                            Name = companyName,
                            LegalName = companyName,
                            Code = BuildDefaultCompanyCode(companyName, tenantId),
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        });

                        await _db.SaveChangesAsync();
                        await InvalidateCompanyCache(tenantId);

                        total = await _db.Companies
                            .Where(c => c.TenantId == tenantId && !c.IsDeleted)
                            .CountAsync();
                    }
                }

                var data = await query
                    .OrderBy(c => c.Name)
                    .Skip((page - 1) * limit)
                    .Take(limit)
                    .Select(c => new CompanyDto
                    {
                        Id = c.Id,
                        TenantId = c.TenantId,
                        IsDeleted = c.IsDeleted,
                        Name = c.Name,
                        LegalName = c.LegalName,
                        Code = c.Code,
                        RegistrationNumber = c.RegistrationNumber,
                        TaxId = c.TaxId,
                        Email = c.Email,
                        PhoneNumber = c.PhoneNumber,
                        WebsiteUrl = c.WebsiteUrl,
                        LogoUrl = c.LogoUrl,
                        Industry = c.Industry,
                        CompanySize = c.CompanySize,
                        RegistrationAddress = c.RegistrationAddress,
                        OperationalAddress = c.OperationalAddress,
                        City = c.City,
                        State = c.State,
                        PostalCode = c.PostalCode,
                        Country = c.Country,
                        CountryCode = c.CountryCode,
                        FunctionalCurrencyCode = c.FunctionalCurrencyCode,
                        ParentCompanyId = c.ParentCompanyId,
                        BankAccountNumber = c.BankAccountNumber,
                        BankName = c.BankName,
                        BankBranch = c.BankBranch,
                        BankRoutingCode = c.BankRoutingCode,
                        BankIban = c.BankIban,
                        BankSwiftCode = c.BankSwiftCode,
                        IFSCCode = c.IFSCCode,
                        FinancialYearStart = c.FinancialYearStart,
                        FinancialYearEnd = c.FinancialYearEnd,
                        MaxEmployees = c.MaxEmployees,
                        ContactPersonName = c.ContactPersonName,
                        ContactPersonPhone = c.ContactPersonPhone,
                        ContactPersonEmail = c.ContactPersonEmail,
                        HR_PersonName = c.HR_PersonName,
                        HR_PersonEmail = c.HR_PersonEmail,
                        BrandColor = c.BrandColor,
                        AccentColor = c.AccentColor,
                        LetterheadLayout = c.LetterheadLayout,
                        SignatoryName = c.SignatoryName,
                        SignatoryDesignation = c.SignatoryDesignation,
                        StampUrl = c.StampUrl,
                        Notes = c.Notes,
                        IsActive = c.IsActive
                    })
                    .ToListAsync();

                var response = new
                {
                    items = data,
                    records = data,
                    companies = data,
                    total,
                    totalCount = total,
                    page,
                    limit
                };
                
                // Cache for 10 minutes
                await _cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(10));
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                if (IsTenantSchemaUnavailable(ex))
                {
                    return Ok(new { items = Array.Empty<CompanyDto>(), records = Array.Empty<CompanyDto>(), companies = Array.Empty<CompanyDto>(), total = 0, totalCount = 0, page, limit, warning = "Tenant schema is still initializing." });
                }

                Console.WriteLine($"❌ Error fetching companies: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new
                {
                    message = "Error fetching companies",
                    error = ex.Message,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        /// <summary>
        /// SuperAdmin-only: returns all companies across all tenants (with tenant names and FY data), no pagination.
        /// Used to populate cross-tenant dropdowns in the admin UI.
        /// </summary>
        [HttpGet("all")]
        public async Task<IActionResult> ListAll()
        {
            if (!IsSuperAdmin())
                return Forbid();

            var companies = await (
                from c in _db.Companies.AsNoTracking().IgnoreQueryFilters()
                where !c.IsDeleted
                join t in _db.Tenants.AsNoTracking().IgnoreQueryFilters() on c.TenantId equals t.Id into ct
                from t in ct.DefaultIfEmpty()
                orderby t.Name, c.Name
                select new
                {
                    id = c.Id,
                    name = c.Name,
                    tenantId = c.TenantId,
                    tenantName = t != null ? t.Name : string.Empty,
                    financialYearStart = c.FinancialYearStart,
                    financialYearEnd = c.FinancialYearEnd,
                }
            ).ToListAsync();

            return Ok(new { companies });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var superAdmin = IsSuperAdmin();
                
                var company = await (superAdmin ? _db.Companies.AsNoTracking().IgnoreQueryFilters() : _db.Companies.AsNoTracking())
                    .Where(c => c.Id == id && (superAdmin || c.TenantId == tenantId) && !c.IsDeleted)
                    .Select(c => new CompanyDto
                    {
                        Id = c.Id,
                        TenantId = c.TenantId,
                        IsDeleted = c.IsDeleted,
                        Name = c.Name,
                        LegalName = c.LegalName,
                        Code = c.Code,
                        RegistrationNumber = c.RegistrationNumber,
                        TaxId = c.TaxId,
                        Email = c.Email,
                        PhoneNumber = c.PhoneNumber,
                        WebsiteUrl = c.WebsiteUrl,
                        LogoUrl = c.LogoUrl,
                        Industry = c.Industry,
                        CompanySize = c.CompanySize,
                        RegistrationAddress = c.RegistrationAddress,
                        OperationalAddress = c.OperationalAddress,
                        City = c.City,
                        State = c.State,
                        PostalCode = c.PostalCode,
                        Country = c.Country,
                        CountryCode = c.CountryCode,
                        FunctionalCurrencyCode = c.FunctionalCurrencyCode,
                        ParentCompanyId = c.ParentCompanyId,
                        BankAccountNumber = c.BankAccountNumber,
                        BankName = c.BankName,
                        BankBranch = c.BankBranch,
                        BankRoutingCode = c.BankRoutingCode,
                        BankIban = c.BankIban,
                        BankSwiftCode = c.BankSwiftCode,
                        IFSCCode = c.IFSCCode,
                        FinancialYearStart = c.FinancialYearStart,
                        FinancialYearEnd = c.FinancialYearEnd,
                        MaxEmployees = c.MaxEmployees,
                        ContactPersonName = c.ContactPersonName,
                        ContactPersonPhone = c.ContactPersonPhone,
                        ContactPersonEmail = c.ContactPersonEmail,
                        HR_PersonName = c.HR_PersonName,
                        HR_PersonEmail = c.HR_PersonEmail,
                        BrandColor = c.BrandColor,
                        AccentColor = c.AccentColor,
                        LetterheadLayout = c.LetterheadLayout,
                        SignatoryName = c.SignatoryName,
                        SignatoryDesignation = c.SignatoryDesignation,
                        StampUrl = c.StampUrl,
                        Notes = c.Notes,
                        IsActive = c.IsActive
                    })
                    .FirstOrDefaultAsync();

                if (company == null) return NotFound(new { message = "Company not found" });
                return Ok(new { company });
            }
            catch (Exception ex)
            {
                if (IsTenantSchemaUnavailable(ex))
                {
                    return NotFound(new { message = "Tenant schema is still initializing." });
                }

                Console.WriteLine($"❌ Error fetching company: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new
                {
                    message = "Error fetching company",
                    error = ex.Message,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CreateCompanyDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();

            // Sanitize all string inputs to prevent XSS
            var sanitizedName = _sanitizer.Sanitize(dto.Name);
            var sanitizedCode = _sanitizer.Sanitize(dto.Code);

            // Check for duplicate code if provided
            if (!string.IsNullOrEmpty(sanitizedCode))
            {
                var codeExists = await _db.Companies
                    .AnyAsync(c => c.Code == sanitizedCode && c.TenantId == tenantId && !c.IsDeleted);
                if (codeExists) return BadRequest(new { message = "Company code already exists" });
            }

            var company = new Company
            {
                Name = sanitizedName ?? dto.Name,
                LegalName = _sanitizer.Sanitize(dto.LegalName),
                Code = sanitizedCode,
                RegistrationNumber = _sanitizer.Sanitize(dto.RegistrationNumber),
                TaxId = _sanitizer.Sanitize(dto.TaxId),
                Email = _sanitizer.Sanitize(dto.Email),
                PhoneNumber = _sanitizer.Sanitize(dto.PhoneNumber),
                WebsiteUrl = _sanitizer.Sanitize(dto.WebsiteUrl),
                LogoUrl = _sanitizer.Sanitize(dto.LogoUrl),
                Industry = _sanitizer.Sanitize(dto.Industry),
                CompanySize = _sanitizer.Sanitize(dto.CompanySize),
                RegistrationAddress = _sanitizer.Sanitize(dto.RegistrationAddress),
                OperationalAddress = _sanitizer.Sanitize(dto.OperationalAddress),
                City = _sanitizer.Sanitize(dto.City),
                State = _sanitizer.Sanitize(dto.State),
                PostalCode = _sanitizer.Sanitize(dto.PostalCode),
                Country = _sanitizer.Sanitize(dto.Country),
                CountryCode = string.IsNullOrWhiteSpace(dto.CountryCode) ? "IND" : dto.CountryCode,
                FunctionalCurrencyCode = string.IsNullOrWhiteSpace(dto.FunctionalCurrencyCode) ? "INR" : dto.FunctionalCurrencyCode,
                ParentCompanyId = dto.ParentCompanyId,
                BankAccountNumber = _sanitizer.Sanitize(dto.BankAccountNumber),
                BankName = _sanitizer.Sanitize(dto.BankName),
                BankBranch = _sanitizer.Sanitize(dto.BankBranch),
                BankRoutingCode = _sanitizer.Sanitize(dto.BankRoutingCode),
                BankIban = _sanitizer.Sanitize(dto.BankIban),
                BankSwiftCode = _sanitizer.Sanitize(dto.BankSwiftCode),
                IFSCCode = _sanitizer.Sanitize(dto.IFSCCode),
                FinancialYearStart = dto.FinancialYearStart,
                FinancialYearEnd = dto.FinancialYearEnd,
                MaxEmployees = dto.MaxEmployees,
                ContactPersonName = _sanitizer.Sanitize(dto.ContactPersonName),
                ContactPersonPhone = _sanitizer.Sanitize(dto.ContactPersonPhone),
                ContactPersonEmail = _sanitizer.Sanitize(dto.ContactPersonEmail),
                HR_PersonName = _sanitizer.Sanitize(dto.HR_PersonName),
                HR_PersonEmail = _sanitizer.Sanitize(dto.HR_PersonEmail),
                BrandColor = !string.IsNullOrWhiteSpace(dto.BrandColor) ? _sanitizer.Sanitize(dto.BrandColor) : "#0f172a",
                AccentColor = !string.IsNullOrWhiteSpace(dto.AccentColor) ? _sanitizer.Sanitize(dto.AccentColor) : "#2563eb",
                LetterheadLayout = !string.IsNullOrWhiteSpace(dto.LetterheadLayout) ? _sanitizer.Sanitize(dto.LetterheadLayout) : "modern-split",
                SignatoryName = _sanitizer.Sanitize(dto.SignatoryName),
                SignatoryDesignation = _sanitizer.Sanitize(dto.SignatoryDesignation),
                StampUrl = _sanitizer.Sanitize(dto.StampUrl),
                Notes = dto.Notes,
                IsActive = dto.IsActive,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Companies.Add(company);
            await _db.SaveChangesAsync();
            
            // Invalidate cache after create
            await InvalidateCompanyCache(company.TenantId);

            return Ok(new
            {
                message = "Company created successfully",
                company = new CompanyDto
                {
                    Id = company.Id,
                    TenantId = company.TenantId,
                    Name = company.Name,
                    LegalName = company.LegalName,
                    Code = company.Code,
                    RegistrationNumber = company.RegistrationNumber,
                    TaxId = company.TaxId,
                    Email = company.Email,
                    PhoneNumber = company.PhoneNumber,
                    WebsiteUrl = company.WebsiteUrl,
                    LogoUrl = company.LogoUrl,
                    Industry = company.Industry,
                    CompanySize = company.CompanySize,
                    RegistrationAddress = company.RegistrationAddress,
                    OperationalAddress = company.OperationalAddress,
                    City = company.City,
                    State = company.State,
                    PostalCode = company.PostalCode,
                    Country = company.Country,
                    CountryCode = company.CountryCode,
                    FunctionalCurrencyCode = company.FunctionalCurrencyCode,
                    ParentCompanyId = company.ParentCompanyId,
                    BankAccountNumber = company.BankAccountNumber,
                    BankName = company.BankName,
                    BankBranch = company.BankBranch,
                    BankRoutingCode = company.BankRoutingCode,
                    BankIban = company.BankIban,
                    BankSwiftCode = company.BankSwiftCode,
                    IFSCCode = company.IFSCCode,
                    FinancialYearStart = company.FinancialYearStart,
                    FinancialYearEnd = company.FinancialYearEnd,
                    MaxEmployees = company.MaxEmployees,
                    ContactPersonName = company.ContactPersonName,
                    ContactPersonPhone = company.ContactPersonPhone,
                    ContactPersonEmail = company.ContactPersonEmail,
                    HR_PersonName = company.HR_PersonName,
                    HR_PersonEmail = company.HR_PersonEmail,
                    BrandColor = company.BrandColor,
                    AccentColor = company.AccentColor,
                    LetterheadLayout = company.LetterheadLayout,
                    SignatoryName = company.SignatoryName,
                    SignatoryDesignation = company.SignatoryDesignation,
                    StampUrl = company.StampUrl,
                    Notes = company.Notes,
                    IsActive = company.IsActive
                }
            });
            }
            catch (Exception ex)
            {
                // Log exception for debugging
                Console.WriteLine($"❌ Error creating company: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new 
                { 
                    message = "Error creating company",
                    error = ex.Message,
                    innerException = ex.InnerException?.Message,
                    details = ex.StackTrace
                });
            }
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCompanyDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var tenantId = _tenantAccessor.GetTenantId();
                var superAdmin = IsSuperAdmin();
                var company = await (superAdmin ? _db.Companies.IgnoreQueryFilters() : _db.Companies)
                    .FirstOrDefaultAsync(c => c.Id == id && (superAdmin || c.TenantId == tenantId) && !c.IsDeleted);

                if (company == null) return NotFound(new { message = "Company not found" });

                var targetTenantId = company.TenantId;

                // Check for duplicate code if changed
                if (!string.IsNullOrEmpty(dto.Code) && dto.Code != company.Code)
                {
                    var sanitizedCode = _sanitizer.Sanitize(dto.Code);
                    var codeExists = await _db.Companies
                        .IgnoreQueryFilters()
                        .AnyAsync(c => c.Code == sanitizedCode && c.TenantId == targetTenantId && c.Id != id && !c.IsDeleted);
                    if (codeExists) return BadRequest(new { message = "Company code already exists" });
                }

            // Update fields with sanitization
            if (!string.IsNullOrEmpty(dto.Name)) company.Name = _sanitizer.Sanitize(dto.Name) ?? dto.Name;
            if (!string.IsNullOrEmpty(dto.LegalName)) company.LegalName = _sanitizer.Sanitize(dto.LegalName);
            if (!string.IsNullOrEmpty(dto.Code)) company.Code = _sanitizer.Sanitize(dto.Code);
            if (!string.IsNullOrEmpty(dto.RegistrationNumber)) company.RegistrationNumber = _sanitizer.Sanitize(dto.RegistrationNumber);
            if (!string.IsNullOrEmpty(dto.TaxId)) company.TaxId = _sanitizer.Sanitize(dto.TaxId);
            if (!string.IsNullOrEmpty(dto.Email)) company.Email = _sanitizer.Sanitize(dto.Email);
            if (!string.IsNullOrEmpty(dto.PhoneNumber)) company.PhoneNumber = _sanitizer.Sanitize(dto.PhoneNumber);
            if (!string.IsNullOrEmpty(dto.WebsiteUrl)) company.WebsiteUrl = _sanitizer.Sanitize(dto.WebsiteUrl);
            if (!string.IsNullOrEmpty(dto.LogoUrl)) company.LogoUrl = _sanitizer.Sanitize(dto.LogoUrl);
            if (!string.IsNullOrEmpty(dto.Industry)) company.Industry = _sanitizer.Sanitize(dto.Industry);
            if (!string.IsNullOrEmpty(dto.CompanySize)) company.CompanySize = _sanitizer.Sanitize(dto.CompanySize);
            if (!string.IsNullOrEmpty(dto.RegistrationAddress)) company.RegistrationAddress = _sanitizer.Sanitize(dto.RegistrationAddress);
            if (!string.IsNullOrEmpty(dto.OperationalAddress)) company.OperationalAddress = _sanitizer.Sanitize(dto.OperationalAddress);
            if (!string.IsNullOrEmpty(dto.City)) company.City = _sanitizer.Sanitize(dto.City);
            if (!string.IsNullOrEmpty(dto.State)) company.State = _sanitizer.Sanitize(dto.State);
            if (!string.IsNullOrEmpty(dto.PostalCode)) company.PostalCode = _sanitizer.Sanitize(dto.PostalCode);
            if (!string.IsNullOrEmpty(dto.Country)) company.Country = _sanitizer.Sanitize(dto.Country);
            if (!string.IsNullOrEmpty(dto.CountryCode)) company.CountryCode = dto.CountryCode;
            if (!string.IsNullOrEmpty(dto.FunctionalCurrencyCode)) company.FunctionalCurrencyCode = dto.FunctionalCurrencyCode;
            if (dto.ParentCompanyId.HasValue) company.ParentCompanyId = dto.ParentCompanyId.Value;
            if (!string.IsNullOrEmpty(dto.BankAccountNumber)) company.BankAccountNumber = _sanitizer.Sanitize(dto.BankAccountNumber);
            if (!string.IsNullOrEmpty(dto.BankName)) company.BankName = _sanitizer.Sanitize(dto.BankName);
            if (!string.IsNullOrEmpty(dto.BankBranch)) company.BankBranch = _sanitizer.Sanitize(dto.BankBranch);
            if (!string.IsNullOrEmpty(dto.BankRoutingCode)) company.BankRoutingCode = _sanitizer.Sanitize(dto.BankRoutingCode);
            if (!string.IsNullOrEmpty(dto.BankIban)) company.BankIban = _sanitizer.Sanitize(dto.BankIban);
            if (!string.IsNullOrEmpty(dto.BankSwiftCode)) company.BankSwiftCode = _sanitizer.Sanitize(dto.BankSwiftCode);
            if (!string.IsNullOrEmpty(dto.IFSCCode)) company.IFSCCode = _sanitizer.Sanitize(dto.IFSCCode);
            if (!string.IsNullOrEmpty(dto.FinancialYearStart)) company.FinancialYearStart = _sanitizer.Sanitize(dto.FinancialYearStart);
            if (!string.IsNullOrEmpty(dto.FinancialYearEnd)) company.FinancialYearEnd = _sanitizer.Sanitize(dto.FinancialYearEnd);
            if (dto.MaxEmployees.HasValue) company.MaxEmployees = dto.MaxEmployees;
            if (!string.IsNullOrEmpty(dto.ContactPersonName)) company.ContactPersonName = _sanitizer.Sanitize(dto.ContactPersonName);
            if (!string.IsNullOrEmpty(dto.ContactPersonPhone)) company.ContactPersonPhone = _sanitizer.Sanitize(dto.ContactPersonPhone);
            if (!string.IsNullOrEmpty(dto.ContactPersonEmail)) company.ContactPersonEmail = _sanitizer.Sanitize(dto.ContactPersonEmail);
            if (!string.IsNullOrEmpty(dto.HR_PersonName)) company.HR_PersonName = _sanitizer.Sanitize(dto.HR_PersonName);
            if (!string.IsNullOrEmpty(dto.HR_PersonEmail)) company.HR_PersonEmail = _sanitizer.Sanitize(dto.HR_PersonEmail);
            if (!string.IsNullOrEmpty(dto.BrandColor)) company.BrandColor = _sanitizer.Sanitize(dto.BrandColor);
            if (!string.IsNullOrEmpty(dto.AccentColor)) company.AccentColor = _sanitizer.Sanitize(dto.AccentColor);
            if (!string.IsNullOrEmpty(dto.LetterheadLayout)) company.LetterheadLayout = _sanitizer.Sanitize(dto.LetterheadLayout);
            if (!string.IsNullOrEmpty(dto.SignatoryName)) company.SignatoryName = _sanitizer.Sanitize(dto.SignatoryName);
            if (!string.IsNullOrEmpty(dto.SignatoryDesignation)) company.SignatoryDesignation = _sanitizer.Sanitize(dto.SignatoryDesignation);
            if (!string.IsNullOrEmpty(dto.StampUrl)) company.StampUrl = _sanitizer.Sanitize(dto.StampUrl);
            if (!string.IsNullOrEmpty(dto.Notes)) company.Notes = _sanitizer.Sanitize(dto.Notes);
            if (dto.IsActive.HasValue) company.IsActive = dto.IsActive.Value;

            company.UpdatedAt = DateTime.UtcNow;
            _db.Companies.Update(company);
            await _db.SaveChangesAsync();
            
            // Invalidate cache after update
            await InvalidateCompanyCache(company.TenantId);

            return Ok(new { message = "Company updated successfully", company });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error updating company: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}" );
                
                return StatusCode(500, new 
                { 
                    message = "Error updating company",
                    error = ex.Message,
                    innerException = ex.InnerException?.Message,
                    details = ex.StackTrace
                });
            }
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var superAdmin = IsSuperAdmin();
                var company = await (superAdmin ? _db.Companies.IgnoreQueryFilters() : _db.Companies)
                    .FirstOrDefaultAsync(c => c.Id == id && (superAdmin || c.TenantId == tenantId) && !c.IsDeleted);

                if (company == null) return NotFound(new { message = "Company not found" });

                // Soft delete
                company.IsDeleted = true;
                company.UpdatedAt = DateTime.UtcNow;
                _db.Companies.Update(company);
                await _db.SaveChangesAsync();
                
                // Invalidate cache after delete
                await InvalidateCompanyCache(company.TenantId);

                return Ok(new { message = "Company deleted successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error deleting company: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new 
                { 
                    message = "Error deleting company",
                    error = ex.Message,
                    innerException = ex.InnerException?.Message,
                    details = ex.StackTrace
                });
            }
        }
    }
}
