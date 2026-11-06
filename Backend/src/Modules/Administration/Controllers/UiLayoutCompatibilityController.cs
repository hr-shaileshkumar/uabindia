using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    /// <summary>
    /// Big Tech Backward-Compatibility Gateway:
    /// Serves /api/ui-layout/* endpoints to Uabindia HRMS Vite SPA and Mobile PWA
    /// using UabIndia's versioned enterprise metadata schema engine (UiPageDefinition + UiPageVersion).
    /// </summary>
    [ApiController]
    [Route("api/ui-layout")]
    [Route("api/v1/ui-layout")]
    public class UiLayoutCompatibilityController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ILogger<UiLayoutCompatibilityController> _logger;

        public UiLayoutCompatibilityController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ILogger<UiLayoutCompatibilityController> logger)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _logger = logger;
        }

        private Guid TenantId => _tenantAccessor.GetTenantId();

        /// <summary>
        /// Lists all registered layout pages with current published/draft version.
        /// </summary>
        [HttpGet("pages")]
        public async Task<IActionResult> GetPages(CancellationToken ct)
        {
            try
            {
                var pages = await _db.UiPageDefinitions.AsNoTracking()
                    .Where(p => p.TenantId == TenantId && p.Status != "Archived")
                    .OrderBy(p => p.Title)
                    .Select(p => new
                    {
                        PageId = p.Id,
                        PageKey = p.PageKey,
                        PageTitle = p.Title,
                        Description = p.SubTitle,
                        DefaultView = p.ViewType,
                        Version = (decimal)(p.PublishedVersion ?? p.DraftVersion ?? 1),
                        IsActive = p.Status == "Published" || p.Status == "Draft",
                        CreatedAt = p.CreatedAt,
                        UpdatedAt = p.UpdatedAt
                    })
                    .ToListAsync(ct);

                return Ok(pages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load UI layout pages");
                return StatusCode(500, new { message = "Failed to load layout pages", error = ex.Message });
            }
        }

        /// <summary>
        /// Resolves the full layout schema tree (Table Columns + Tabs + Sections + Fields)
        /// for a given PageKey, normalized across aliases.
        /// </summary>
        [HttpGet("{pageKey}")]
        [HttpGet("pages/{pageKey}")]
        public async Task<IActionResult> GetPageLayout(string pageKey, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(pageKey))
                return BadRequest(new { message = "PageKey is required." });

            string rawKey = pageKey.Trim();
            string normalizedKey = rawKey.ToLowerInvariant() switch
            {
                "candidate_pipeline" or "candidate-pipeline" => "candidates",
                "employees" or "employee-directory" => "hrms.employees",
                "jobs" or "job-postings" => "job_postings",
                "users" or "user-management" => "administration.users",
                "leaves" or "leave-requests" => "hrms.leaves",
                "attendance" or "attendance-logs" => "hrms.attendance",
                "payroll" or "payroll-runs" => "payroll.runs",
                _ => rawKey
            };

            try
            {
                // Query page definition by PageKey or aliases
                var page = await _db.UiPageDefinitions.AsNoTracking()
                    .Include(p => p.Versions)
                    .FirstOrDefaultAsync(p =>
                        p.TenantId == TenantId &&
                        (p.PageKey == normalizedKey || p.PageKey == rawKey || p.PageKey.EndsWith("." + rawKey)),
                        ct);

                if (page == null)
                {
                    // Enterprise Safe Fallback: Return 200 OK baseline schema
                    return Ok(new
                    {
                        pageKey = rawKey,
                        pageTitle = rawKey.Replace("_", " ").Replace("-", " "),
                        isConfigured = false,
                        scopeTier = "DefaultBaseline",
                        version = 1.0,
                        tableColumns = new List<object>(),
                        tabs = new List<object>()
                    });
                }

                // Resolve active version: prefer published, fallback to draft
                var activeVersion = page.Versions
                    .Where(v => v.IsPublished)
                    .OrderByDescending(v => v.Version)
                    .FirstOrDefault()
                    ?? page.Versions.OrderByDescending(v => v.Version).FirstOrDefault();

                string schemaJson = activeVersion?.SchemaJson ?? "{}";
                var doc = JsonDocument.Parse(schemaJson);
                var root = doc.RootElement;

                // Extract Table Columns
                var tableColumns = new List<object>();
                if (root.TryGetProperty("columns", out var colsElem) && colsElem.ValueKind == JsonValueKind.Array)
                {
                    int sort = 1;
                    foreach (var c in colsElem.EnumerateArray())
                    {
                        string colKey = c.TryGetProperty("key", out var k) ? k.GetString() ?? "" : "";
                        string label = c.TryGetProperty("label", out var l) ? l.GetString() ?? colKey : colKey;
                        string dataType = c.TryGetProperty("dataType", out var dt) ? dt.GetString() ?? "string" : "string";
                        bool sortable = !c.TryGetProperty("sortable", out var s) || s.GetBoolean();
                        bool visible = !c.TryGetProperty("hidden", out var h) || !h.GetBoolean();
                        string width = c.TryGetProperty("width", out var w) ? w.GetString() ?? "150px" : "150px";

                        tableColumns.Add(new
                        {
                            columnId = Guid.NewGuid(),
                            columnKey = colKey,
                            headerText = label,
                            displayFormat = dataType,
                            width = width,
                            sortOrder = sort++,
                            isSortable = sortable,
                            isVisible = visible,
                            isSearchable = true,
                            alignment = dataType == "number" || dataType == "currency" ? "right" : "left"
                        });
                    }
                }

                // Extract Tabs and Form Sections
                var tabs = new List<object>();
                if (root.TryGetProperty("form", out var formElem) &&
                    formElem.TryGetProperty("sections", out var secsElem) &&
                    secsElem.ValueKind == JsonValueKind.Array)
                {
                    var defaultTabSections = new List<object>();
                    int secSort = 1;

                    foreach (var s in secsElem.EnumerateArray())
                    {
                        string secTitle = s.TryGetProperty("title", out var st) ? st.GetString() ?? "Section" : "Section";
                        int gridCols = s.TryGetProperty("gridCols", out var gc) && gc.TryGetInt32(out var gv) ? gv : 2;

                        var fields = new List<object>();
                        if (s.TryGetProperty("fields", out var fldsElem) && fldsElem.ValueKind == JsonValueKind.Array)
                        {
                            int fldSort = 1;
                            foreach (var f in fldsElem.EnumerateArray())
                            {
                                string fldKey = f.TryGetProperty("key", out var fk) ? fk.GetString() ?? "" : "";
                                string fldLabel = f.TryGetProperty("label", out var fl) ? fl.GetString() ?? fldKey : fldKey;
                                string fldType = f.TryGetProperty("fieldType", out var ft) ? ft.GetString() ?? "text" : "text";
                                bool req = f.TryGetProperty("required", out var rq) && rq.GetBoolean();
                                bool ro = f.TryGetProperty("readOnly", out var roe) && roe.GetBoolean();

                                fields.Add(new
                                {
                                    fieldId = Guid.NewGuid(),
                                    fieldKey = fldKey,
                                    fieldLabel = fldLabel,
                                    dataType = fldType,
                                    isRequired = req,
                                    isReadOnly = ro,
                                    gridSpan = 1,
                                    sortOrder = fldSort++
                                });
                            }
                        }

                        defaultTabSections.Add(new
                        {
                            sectionId = Guid.NewGuid(),
                            sectionTitle = secTitle,
                            gridColumns = gridCols,
                            sortOrder = secSort++,
                            fields = fields
                        });
                    }

                    tabs.Add(new
                    {
                        tabId = Guid.NewGuid(),
                        tabKey = "general",
                        tabTitle = "General Information",
                        iconName = "FileText",
                        sortOrder = 1,
                        sections = defaultTabSections
                    });
                }

                return Ok(new
                {
                    pageKey = page.PageKey,
                    pageTitle = page.Title,
                    entityName = page.EntityName,
                    version = (decimal)(activeVersion?.Version ?? 1),
                    isConfigured = true,
                    scopeTier = "TenantPublished",
                    tableColumns = tableColumns,
                    tabs = tabs
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to resolve UI layout for pageKey {PageKey}", pageKey);
                return StatusCode(500, new { message = "Failed to resolve layout", error = ex.Message });
            }
        }

        public class UpdateColumnsPayload
        {
            public List<ColumnUpdateItem> Columns { get; set; } = new();
        }

        public class ColumnUpdateItem
        {
            public string ColumnKey { get; set; } = string.Empty;
            public string? HeaderText { get; set; }
            public bool IsVisible { get; set; } = true;
            public int SortOrder { get; set; } = 1;
            public string? Width { get; set; }
        }

        /// <summary>
        /// Saves updated column order and visibility from the Form Studio / Column customizer modal.
        /// </summary>
        [HttpPost("{pageKey}/columns")]
        [HttpPost("pages/{pageKey}/columns")]
        public async Task<IActionResult> UpdateColumns(string pageKey, [FromBody] UpdateColumnsPayload payload, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(pageKey) || payload == null || payload.Columns == null)
                return BadRequest(new { message = "Invalid columns payload." });

            try
            {
                var page = await _db.UiPageDefinitions
                    .Include(p => p.Versions)
                    .FirstOrDefaultAsync(p => p.TenantId == TenantId && p.PageKey == pageKey, ct);

                if (page == null)
                    return NotFound(new { message = $"Page definition '{pageKey}' not found." });

                var activeVersion = page.Versions
                    .OrderByDescending(v => v.Version)
                    .FirstOrDefault();

                if (activeVersion == null)
                    return BadRequest(new { message = "No version found for page to update." });

                // Update SchemaJson with new columns order/visibility
                var doc = JsonDocument.Parse(activeVersion.SchemaJson);
                var root = doc.RootElement.Clone();

                var updatedColumns = payload.Columns.Select(c => new
                {
                    key = c.ColumnKey,
                    label = c.HeaderText ?? c.ColumnKey,
                    hidden = !c.IsVisible,
                    sortOrder = c.SortOrder,
                    width = c.Width ?? "150px"
                }).ToList();

                var dict = JsonSerializer.Deserialize<Dictionary<string, object>>(activeVersion.SchemaJson) ?? new();
                dict["columns"] = updatedColumns;

                // Create incremented draft or update working version
                activeVersion.SchemaJson = JsonSerializer.Serialize(dict);
                activeVersion.UpdatedAt = DateTime.UtcNow;
                page.UpdatedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync(ct);

                return Ok(new { success = true, message = "Columns updated successfully.", version = activeVersion.Version });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update columns for {PageKey}", pageKey);
                return StatusCode(500, new { message = "Failed to update columns", error = ex.Message });
            }
        }
    }
}

