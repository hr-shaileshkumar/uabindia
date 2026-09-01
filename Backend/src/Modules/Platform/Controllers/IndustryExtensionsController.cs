using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    [ApiController]
    [Route("api/v1/industry-extensions")]
    [Authorize]
    public class IndustryExtensionsController : ControllerBase
    {
        private readonly IIndustryExtensionService _industryService;
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public IndustryExtensionsController(
            IIndustryExtensionService industryService,
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor)
        {
            _industryService = industryService;
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [AllowAnonymous]
        [HttpGet]
        public IActionResult GetSupportedIndustries()
        {
            var list = _industryService.GetSupportedIndustries();
            return Ok(list);
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveIndustryManifest()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId);
            var code = tenant?.IndustryExtensionCode ?? "Generic";
            var manifest = _industryService.GetIndustryManifest(code);

            return Ok(new
            {
                activeCode = code,
                manifest
            });
        }

        [HttpPost("select/{code}")]
        public async Task<IActionResult> SetActiveIndustry(string code)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
            if (tenant == null) return NotFound();

            var manifest = _industryService.GetIndustryManifest(code);
            tenant.IndustryExtensionCode = manifest.Code;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Active Industry Pack set to '{manifest.Name}' successfully.",
                activeCode = manifest.Code,
                manifest
            });
        }
    }
}
