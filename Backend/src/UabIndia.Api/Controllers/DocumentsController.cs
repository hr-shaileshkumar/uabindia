using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class DocumentsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public DocumentsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("nameidentifier")?.Value
                ?? User?.FindFirst("sub")?.Value;

            return Guid.TryParse(userIdClaim, out var id) ? id : Guid.Empty;
        }

        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] Guid? companyId,
            [FromQuery] Guid? projectId,
            [FromQuery] Guid? employeeId,
            [FromQuery] string? module,
            [FromQuery] string? category)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var roles = User?.Claims
                .Where(c => c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase) || c.Type.EndsWith("role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value)
                .ToArray() ?? Array.Empty<string>();

            var isAdmin = RoleCatalog.IsAdminLike(roles);
            var isManager = RoleCatalog.IsManagerLike(roles);

            var effectiveCompanyId = HttpContext.Items.TryGetValue("CompanyId", out var scopedCompanyObj) && scopedCompanyObj is Guid scopedCompanyId
                ? scopedCompanyId
                : companyId;

            var effectiveProjectId = HttpContext.Items.TryGetValue("ProjectId", out var scopedProjectObj) && scopedProjectObj is Guid scopedProjectId
                ? scopedProjectId
                : projectId;

            var query = _db.DocumentRecords
                .AsNoTracking()
                .Where(d => d.TenantId == tenantId);

            if (effectiveCompanyId.HasValue)
            {
                query = query.Where(d => d.CompanyId == effectiveCompanyId.Value);
            }

            if (effectiveProjectId.HasValue)
            {
                query = query.Where(d => d.ProjectId == effectiveProjectId.Value);
            }

            if (employeeId.HasValue)
            {
                query = query.Where(d => d.EmployeeId == employeeId.Value);
            }

            if (!string.IsNullOrWhiteSpace(module))
            {
                query = query.Where(d => d.Module == module);
            }

            if (!string.IsNullOrWhiteSpace(category))
            {
                query = query.Where(d => d.Category == category);
            }

            if (!isAdmin && isManager)
            {
                query = query.Where(d => d.UploadedByUserId == userId || d.EmployeeId == null ||
                    _db.Employees.Any(e => e.Id == d.EmployeeId && e.TenantId == tenantId && !e.IsDeleted && (e.ReportingManagerId == userId || e.ManagerId == userId || e.UserId == userId)));
            }

            if (!isAdmin && !isManager)
            {
                query = query.Where(d => d.UploadedByUserId == userId ||
                    _db.Employees.Any(e => e.Id == d.EmployeeId && e.TenantId == tenantId && !e.IsDeleted && e.UserId == userId));
            }

            var data = await query
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new DocumentDto
                {
                    Id = d.Id,
                    UploadedByUserId = d.UploadedByUserId,
                    CompanyId = d.CompanyId,
                    ProjectId = d.ProjectId,
                    EmployeeId = d.EmployeeId,
                    Module = d.Module,
                    Category = d.Category,
                    FileName = d.FileName,
                    ContentType = d.ContentType,
                    FileSizeBytes = d.FileSizeBytes,
                    Tags = d.Tags,
                    Description = d.Description,
                    CreatedAt = d.CreatedAt
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpPost("upload")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> Upload(
            [FromForm] IFormFile file,
            [FromForm] Guid? companyId,
            [FromForm] Guid? projectId,
            [FromForm] Guid? employeeId,
            [FromForm] string module = "general",
            [FromForm] string category = "general",
            [FromForm] string? tags = null,
            [FromForm] string? description = null)
        {
            if (file == null || file.Length == 0) return BadRequest(new { message = "File is required." });

            var tenantId = _tenantAccessor.GetTenantId();
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var effectiveCompanyId = HttpContext.Items.TryGetValue("CompanyId", out var scopedCompanyObj) && scopedCompanyObj is Guid scopedCompanyId
                ? scopedCompanyId
                : companyId;

            var effectiveProjectId = HttpContext.Items.TryGetValue("ProjectId", out var scopedProjectObj) && scopedProjectObj is Guid scopedProjectId
                ? scopedProjectId
                : projectId;

            var tenantFolder = Path.Combine(AppContext.BaseDirectory, "uploads", "documents", tenantId.ToString("N"));
            Directory.CreateDirectory(tenantFolder);

            var safeFileName = Path.GetFileName(file.FileName);
            var storedName = $"{Guid.NewGuid():N}_{safeFileName}";
            var absolutePath = Path.Combine(tenantFolder, storedName);

            await using (var stream = System.IO.File.Create(absolutePath))
            {
                await file.CopyToAsync(stream);
            }

            var relativePath = Path.Combine("uploads", "documents", tenantId.ToString("N"), storedName).Replace("\\", "/");

            var doc = new DocumentRecord
            {
                TenantId = tenantId,
                UploadedByUserId = userId,
                CompanyId = effectiveCompanyId,
                ProjectId = effectiveProjectId,
                EmployeeId = employeeId,
                Module = module,
                Category = category,
                FileName = safeFileName,
                ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
                FileSizeBytes = file.Length,
                StoragePath = relativePath,
                Tags = tags,
                Description = description
            };

            _db.DocumentRecords.Add(doc);
            await _db.SaveChangesAsync();

            return Ok(new { id = doc.Id, fileName = doc.FileName, size = doc.FileSizeBytes });
        }

        [HttpGet("{id:guid}/download")]
        public async Task<IActionResult> Download(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var doc = await _db.DocumentRecords.FirstOrDefaultAsync(d => d.TenantId == tenantId && d.Id == id);
            if (doc == null) return NotFound();

            var roles = User?.Claims
                .Where(c => c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase) || c.Type.EndsWith("role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value)
                .ToArray() ?? Array.Empty<string>();

            var isAdmin = RoleCatalog.IsAdminLike(roles);
            var isManager = RoleCatalog.IsManagerLike(roles);

            if (!isAdmin)
            {
                if (isManager)
                {
                    var allowed = doc.UploadedByUserId == userId ||
                                  doc.EmployeeId == null ||
                                  await _db.Employees.AnyAsync(e => e.Id == doc.EmployeeId && e.TenantId == tenantId && !e.IsDeleted && (e.ReportingManagerId == userId || e.ManagerId == userId || e.UserId == userId));
                    if (!allowed) return Forbid();
                }
                else
                {
                    var allowed = doc.UploadedByUserId == userId ||
                                  await _db.Employees.AnyAsync(e => e.Id == doc.EmployeeId && e.TenantId == tenantId && !e.IsDeleted && e.UserId == userId);
                    if (!allowed) return Forbid();
                }
            }

            var absolutePath = Path.Combine(AppContext.BaseDirectory, doc.StoragePath.Replace('/', Path.DirectorySeparatorChar));
            if (!System.IO.File.Exists(absolutePath)) return NotFound(new { message = "File not found on storage." });

            var fileBytes = await System.IO.File.ReadAllBytesAsync(absolutePath);
            return File(fileBytes, doc.ContentType, doc.FileName);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var doc = await _db.DocumentRecords.FirstOrDefaultAsync(d => d.TenantId == tenantId && d.Id == id);
            if (doc == null) return NotFound();

            var roles = User?.Claims
                .Where(c => c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase) || c.Type.EndsWith("role", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value)
                .ToArray() ?? Array.Empty<string>();

            var isAdmin = RoleCatalog.IsAdminLike(roles);
            if (!isAdmin && doc.UploadedByUserId != userId) return Forbid();

            doc.IsDeleted = true;
            await _db.SaveChangesAsync();
            return Ok();
        }
    }
}
