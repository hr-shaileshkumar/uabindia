using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class LocalizationController : ControllerBase
    {
        private readonly ILocalizationService _localization;
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public LocalizationController(
            ILocalizationService localization,
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor)
        {
            _localization = localization;
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [AllowAnonymous]
        [HttpGet("countries")]
        public IActionResult GetCountries()
        {
            var list = _localization.GetSupportedCountries();
            return Ok(list);
        }

        [AllowAnonymous]
        [HttpGet("profile/{countryCode}")]
        public IActionResult GetCountryProfile(string countryCode)
        {
            var profile = _localization.GetCountryProfile(countryCode);
            return Ok(profile);
        }

        [HttpGet("current-tenant")]
        public async Task<IActionResult> GetCurrentTenantLocalization()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId);
            var countryCode = tenant?.CountryCode ?? "IND";
            var profile = _localization.GetCountryProfile(countryCode);

            return Ok(new
            {
                tenantId,
                countryCode,
                defaultCurrency = tenant?.DefaultCurrencyCode ?? profile.DefaultCurrency,
                defaultTimezone = tenant?.DefaultTimezone ?? profile.DefaultTimezone,
                fiscalYearStartMonth = tenant?.FiscalYearStartMonth ?? profile.FiscalYearStartMonth,
                industryExtension = tenant?.IndustryExtensionCode ?? "Generic",
                profile
            });
        }
    }
}
