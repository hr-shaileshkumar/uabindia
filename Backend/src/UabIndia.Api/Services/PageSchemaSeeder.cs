using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Services
{
    /// <summary>
    /// Seeds default DynamicPage schemas (UiPageDefinition + UiPageVersion) for all
    /// platform pages that use DynamicPage in the frontend. Runs idempotently at startup
    /// for every active tenant. Skips any page that already has a published schema.
    /// Priority order: SuperAdmin => Administration => HRMS => Approvals => Expenses => Helpdesk => Compliance => Portal => Tax
    /// </summary>
    public sealed class PageSchemaSeeder
    {
        private static readonly JsonSerializerOptions _jsonOpts = new()
        {
            WriteIndented = false,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        public async Task EnsurePageSchemasAsync(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ILogger logger)
        {
            List<Tenant> tenants;
            try
            {
                tenants = await db.Tenants.AsNoTracking()
                    .Where(t => t.IsActive && !t.IsDeleted)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "PageSchemaSeeder: could not load tenants, skipping.");
                return;
            }

            var catalog = BuildSchemaCatalog();
            foreach (var tenant in tenants)
            {
                tenantAccessor.SetTenantId(tenant.Id);
                tenantAccessor.SetTenantSchema(
                    $"tenant_{tenant.Subdomain ?? tenant.Id.ToString("N")}");
                try
                {
                    await SeedForTenantAsync(db, tenant.Id, catalog, logger);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex,
                        "PageSchemaSeeder: tenant {TenantId} failed, continuing.", tenant.Id);
                }
            }
        }

        public async Task<int> EnsurePageSchemasForTenantAsync(
            ApplicationDbContext db,
            Guid tenantId,
            ILogger? logger = null)
        {
            var catalog = BuildSchemaCatalog();
            return await SeedForTenantAsync(db, tenantId, catalog, logger);
        }

        public async Task<int> SyncAllTenantsCatalogAsync(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ILogger? logger = null)
        {
            List<Tenant> tenants;
            try
            {
                tenants = await db.Tenants.AsNoTracking()
                    .Where(t => t.IsActive && !t.IsDeleted)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "PageSchemaSeeder: could not load tenants, skipping.");
                return 0;
            }

            var catalog = BuildSchemaCatalog();
            var totalSeeded = 0;
            foreach (var tenant in tenants)
            {
                tenantAccessor.SetTenantId(tenant.Id);
                tenantAccessor.SetTenantSchema($"tenant_{tenant.Subdomain ?? tenant.Id.ToString("N")}");
                try
                {
                    totalSeeded += await SeedForTenantAsync(db, tenant.Id, catalog, logger);
                }
                catch (Exception ex)
                {
                    logger?.LogWarning(ex, "PageSchemaSeeder: tenant {TenantId} failed, continuing.", tenant.Id);
                }
            }
            return totalSeeded;
        }

        private static async Task<int> SeedForTenantAsync(
            ApplicationDbContext db,
            Guid tenantId,
            List<PageSchemaSeed> catalog,
            ILogger? logger)
        {
            var existingKeys = await db.UiPageDefinitions
                .IgnoreQueryFilters()
                .Where(p => p.TenantId == tenantId && !p.IsDeleted)
                .Select(p => p.PageKey.ToLower())
                .ToHashSetAsync();

            var added = 0;
            foreach (var seed in catalog)
            {
                var normalizedKey = seed.PageKey.ToLowerInvariant();
                if (existingKeys.Contains(normalizedKey))
                    continue;

                var schemaJson = JsonSerializer.Serialize(seed.Schema, _jsonOpts);
                var pageDef = new UiPageDefinition
                {
                    TenantId = tenantId,
                    PageKey = seed.PageKey,
                    EntityName = seed.EntityName,
                    Title = seed.Title,
                    SubTitle = seed.SubTitle,
                    ModuleKey = seed.ModuleKey,
                    ViewType = seed.ViewType,
                    RoutePath = seed.RoutePath,
                    Icon = seed.Icon,
                    Status = "Published",
                    PublishedVersion = 1,
                    DraftVersion = null,
                    AddToNavigation = false,
                    RequiredPermission = seed.RequiredPermission,
                };
                var version = new UiPageVersion
                {
                    PageDefinition = pageDef,
                    Version = 1,
                    SchemaJson = schemaJson,
                    IsPublished = true,
                    PublishedAt = DateTime.UtcNow,
                    ChangeSummary = "Initial seeded schema (Phase 1A bootstrap)",
                };
                pageDef.Versions.Add(version);
                db.UiPageDefinitions.Add(pageDef);
                added++;
            }

            if (added > 0)
            {
                await db.SaveChangesAsync();
                logger?.LogInformation(
                    "PageSchemaSeeder: seeded {Count} page schemas for tenant {TenantId}",
                    added, tenantId);
            }

            return added;
        }

        // ─── Internal DTOs ────────────────────────────────────────────────────

        private sealed record PageSchemaSeed(
            string PageKey, string EntityName, string Title, string SubTitle,
            string ModuleKey, string ViewType, string RoutePath, string Icon,
            string? RequiredPermission, DynamicPageSchemaDto Schema);

        private sealed class DynamicPageSchemaDto
        {
            public string SchemaVersion { get; set; } = "1";
            public string PageKey { get; set; } = "";
            public string Title { get; set; } = "";
            public string? SubTitle { get; set; }
            public string EntityName { get; set; } = "";
            public string ViewType { get; set; } = "table";
            public string ApiEndpoint { get; set; } = "";
            public List<ColDto> Columns { get; set; } = new();
            public List<FilterDto> Filters { get; set; } = new();
            public FormDto Form { get; set; } = new();
            public List<ActionDto> Actions { get; set; } = new();
            public List<KpiDto>? Kpis { get; set; }
        }

        private sealed class ColDto
        {
            public string Key { get; set; } = "";
            public string Label { get; set; } = "";
            public string Type { get; set; } = "text";
            public bool Sortable { get; set; } = true;
            public bool DefaultVisible { get; set; } = true;
            public int Width { get; set; } = 160;
            public string? BadgeMap { get; set; }
        }

        private sealed class FilterDto
        {
            public string Key { get; set; } = "";
            public string Label { get; set; } = "";
            public string Type { get; set; } = "text";
            public List<OptionDto>? Options { get; set; }
        }

        private sealed class OptionDto { public string Value { get; set; } = ""; public string Label { get; set; } = ""; }
        private sealed class FormDto { public List<SectionDto> Sections { get; set; } = new(); }

        private sealed class SectionDto
        {
            public string Key { get; set; } = "";
            public string Label { get; set; } = "";
            public List<FieldDto> Fields { get; set; } = new();
        }

        private sealed class FieldDto
        {
            public string Key { get; set; } = "";
            public string Label { get; set; } = "";
            public string Type { get; set; } = "text";
            public bool Required { get; set; }
            public string? Placeholder { get; set; }
            public string? HelpText { get; set; }
            public int? Span { get; set; }
            public List<OptionDto>? Options { get; set; }
        }

        private sealed class ActionDto
        {
            public string Key { get; set; } = "";
            public string Label { get; set; } = "";
            public string Variant { get; set; } = "primary";
            public string? Icon { get; set; }
        }

        private sealed class KpiDto
        {
            public string Key { get; set; } = "";
            public string Label { get; set; } = "";
            public string? Icon { get; set; }
            public string? Color { get; set; }
        }

        // ─── Builder Helpers ──────────────────────────────────────────────────

        private static ColDto Col(string key, string label, string type = "text", bool sortable = true, bool visible = true, int width = 160) =>
            new() { Key = key, Label = label, Type = type, Sortable = sortable, DefaultVisible = visible, Width = width };

        private static ColDto BadgeCol(string key, string label, string badgeMap, int width = 120) =>
            new() { Key = key, Label = label, Type = "badge", Sortable = true, DefaultVisible = true, Width = width, BadgeMap = badgeMap };

        private static FilterDto TF(string key, string label) => new() { Key = key, Label = label, Type = "text" };
        private static FilterDto DF(string key, string label) => new() { Key = key, Label = label, Type = "date" };
        private static FilterDto SF(string key, string label, params (string v, string l)[] opts) =>
            new() { Key = key, Label = label, Type = "select", Options = opts.Select(o => new OptionDto { Value = o.v, Label = o.l }).ToList() };

        private static FieldDto F(string key, string label, string type = "text", bool req = false, string? ph = null, string? help = null, int span = 1) =>
            new() { Key = key, Label = label, Type = type, Required = req, Placeholder = ph, HelpText = help, Span = span };

        private static FieldDto FSel(string key, string label, bool req = false, params (string v, string l)[] opts) =>
            new() { Key = key, Label = label, Type = "select", Required = req, Options = opts.Select(o => new OptionDto { Value = o.v, Label = o.l }).ToList() };

        private static SectionDto Sec(string key, string label, params FieldDto[] fields) =>
            new() { Key = key, Label = label, Fields = fields.ToList() };

        private static ActionDto A(string key, string label, string variant = "primary", string? icon = null) =>
            new() { Key = key, Label = label, Variant = variant, Icon = icon };

        private static KpiDto K(string key, string label, string icon, string color) =>
            new() { Key = key, Label = label, Icon = icon, Color = color };

        // ─── MASTER SCHEMA CATALOG ────────────────────────────────────────────

        private static List<PageSchemaSeed> BuildSchemaCatalog() => new()
        {
            // ══════════ SUPERADMIN ══════════
            new("superadmin.dashboard", "Tenant", "Tenant Management", "All platform tenants and subscriptions.", "superadmin", "table", "/superadmin/dashboard", "Shield", "administration.tenants.read",
            new DynamicPageSchemaDto { PageKey="superadmin.dashboard", EntityName="Tenant", Title="Tenant Management", SubTitle="Manage all tenants across the platform.", ViewType="table", ApiEndpoint="/api/v1/administration/tenants",
                Columns=new(){ Col("name","Tenant Name",width:200), Col("subdomain","Subdomain",width:160), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100), Col("employeeCount","Employees","number",width:100), Col("createdAt","Created","date",width:140) },
                Filters=new(){ TF("search","Search tenants"), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("basic","Tenant", F("name","Tenant Name",req:true), F("subdomain","Subdomain",req:true), F("contactEmail","Contact Email","email",req:true), FSel("plan","Plan",req:true,("starter","Starter"),("professional","Professional"),("enterprise","Enterprise"))), Sec("limits","Limits", F("maxUsers","Max Users","number"), F("storageQuotaMb","Storage (MB)","number"), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add Tenant","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2"), A("export","Export","ghost","Download") },
                Kpis=new(){ K("totalTenants","Total Tenants","Building2","indigo"), K("activeTenants","Active","CheckCircle2","green"), K("trialTenants","Trial","Clock","amber"), K("expiredTenants","Expired","XCircle","red") } }),

            // ══════════ ADMINISTRATION ══════════
            new("administration.users", "User", "User Management", "Create, manage, and audit user accounts.", "administration", "table", "/administration/users", "Users", "administration.users.read",
            new DynamicPageSchemaDto { PageKey="administration.users", EntityName="User", Title="User Management", SubTitle="Manage user accounts, roles, and access.", ViewType="table", ApiEndpoint="/api/v1/administration/users",
                Columns=new(){ Col("avatarUrl","Photo","avatar",sortable:false,width:60), Col("fullName","Full Name",width:200), Col("email","Email",width:220), Col("role","Role",width:160), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100), Col("lastLoginAt","Last Login","datetime",width:160) },
                Filters=new(){ TF("search","Search name or email"), SF("isActive","Status",("true","Active"),("false","Inactive")), SF("role","Role",("Admin","Admin"),("Manager","Manager"),("Employee","Employee")) },
                Form=new(){ Sections=new(){ Sec("identity","Identity", F("fullName","Full Name",req:true), F("email","Email","email",req:true), F("phone","Phone","tel")), Sec("access","Access", FSel("roleId","Role",req:true,("admin","Administrator"),("hr-manager","HR Manager"),("manager","Manager"),("employee","Employee")), F("isActive","Active","boolean"), F("sendWelcomeEmail","Send Welcome Email","boolean")) }},
                Actions=new(){ A("create","Add User","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2"), A("export","Export","ghost","Download"), A("import","Import","ghost","Upload") } }),

            new("administration.roles", "Role", "Role Management", "Define roles and assign permissions.", "administration", "table", "/administration/roles", "Shield", "administration.roles.read",
            new DynamicPageSchemaDto { PageKey="administration.roles", EntityName="Role", Title="Role Management", SubTitle="Create and manage access control roles.", ViewType="table", ApiEndpoint="/api/v1/administration/roles",
                Columns=new(){ Col("name","Role Name",width:200), Col("description","Description",width:300), Col("userCount","Users","number",width:100), Col("permissionCount","Permissions","number",width:120), BadgeCol("isSystem","Type","{\"true\":\"System\",\"false\":\"Custom\"}",100) },
                Filters=new(){ TF("search","Search roles"), SF("isSystem","Type",("true","System"),("false","Custom")) },
                Form=new(){ Sections=new(){ Sec("basic","Role", F("name","Role Name",req:true), F("description","Description","textarea",span:2), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add Role","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.departments", "Department", "Department Master", "Organizational department hierarchy.", "administration", "table", "/administration/departments", "Layers", "administration.departments.read",
            new DynamicPageSchemaDto { PageKey="administration.departments", EntityName="Department", Title="Department Master", SubTitle="Define and manage the department hierarchy.", ViewType="table", ApiEndpoint="/api/v1/hrms/departments",
                Columns=new(){ Col("name","Department Name",width:200), Col("code","Code",width:100), Col("parentDepartmentName","Parent",width:200), Col("managerName","Manager",width:180), Col("employeeCount","Employees","number",width:100), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search"), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("basic","Details", F("name","Department Name",req:true), F("code","Code",req:true), F("parentDepartmentId","Parent","lookup"), F("managerId","Head/Manager","lookup"), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add Department","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2"), A("export","Export","ghost","Download") } }),

            new("administration.designations", "Designation", "Designation Master", "Job titles and grade levels.", "administration", "table", "/administration/designations", "Briefcase", "administration.designations.read",
            new DynamicPageSchemaDto { PageKey="administration.designations", EntityName="Designation", Title="Designation Master", SubTitle="Job titles and organizational grade structure.", ViewType="table", ApiEndpoint="/api/v1/hrms/designations",
                Columns=new(){ Col("name","Designation",width:220), Col("code","Code",width:120), Col("departmentName","Department",width:180), Col("level","Level/Grade",width:140), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search"), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("basic","Details", F("name","Designation Name",req:true), F("code","Code",req:true), F("departmentId","Department","lookup"), F("level","Grade/Level"), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add Designation","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2"), A("export","Export","ghost","Download") } }),

            new("administration.companies", "Company", "Company Master", "Legal entities under this tenant.", "administration", "table", "/administration/companies", "Building2", "administration.companies.read",
            new DynamicPageSchemaDto { PageKey="administration.companies", EntityName="Company", Title="Company Master", SubTitle="Legal entity registration and financial year configuration.", ViewType="table", ApiEndpoint="/api/v1/administration/companies",
                Columns=new(){ Col("name","Company Name",width:240), Col("code","Code",width:100), Col("gstin","GSTIN",width:160), Col("pan","PAN",width:140), Col("financialYearStart","FY Start","date",width:130), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search"), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("identity","Identity", F("name","Company Name",req:true), F("code","Code",req:true)), Sec("tax","Tax", F("gstin","GSTIN"), F("pan","PAN"), F("tan","TAN"), F("cin","CIN")), Sec("calendar","Calendar", F("financialYearStart","FY Start","date"), F("financialYearEnd","FY End","date"), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add Company","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.branches", "Branch", "Branch & Location Master", "Office locations and premises.", "administration", "table", "/administration/branches", "MapPin", "administration.branches.read",
            new DynamicPageSchemaDto { PageKey="administration.branches", EntityName="Branch", Title="Branch & Location Master", SubTitle="Physical office locations and GST registration units.", ViewType="table", ApiEndpoint="/api/v1/hrms/org/branches",
                Columns=new(){ Col("name","Branch Name",width:200), Col("code","Code",width:100), Col("companyName","Company",width:180), Col("city","City",width:140), Col("state","State",width:140), Col("gstin","GSTIN",width:160), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search"), TF("state","State"), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("basic","Details", F("name","Branch Name",req:true), F("code","Code",req:true), F("companyId","Company","lookup",req:true), F("gstin","GSTIN")), Sec("address","Address", F("addressLine1","Address",span:2), F("city","City"), F("state","State"), F("pincode","PIN"), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add Branch","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.cost-centers", "CostCenter", "Cost Center Master", "Financial cost centers.", "administration", "table", "/administration/cost-centers", "CircleDollarSign", "administration.cost_centers.read",
            new DynamicPageSchemaDto { PageKey="administration.cost-centers", EntityName="CostCenter", Title="Cost Center Master", SubTitle="Assign expenses and payroll to financial cost centers.", ViewType="table", ApiEndpoint="/api/v1/hrms/org/cost-centers",
                Columns=new(){ Col("name","Cost Center",width:200), Col("code","Code",width:120), Col("costCenterType","Type",width:140), Col("companyName","Company",width:180), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search"), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("basic","Details", F("name","Name",req:true), F("code","Code",req:true), F("companyId","Company","lookup",req:true), F("costCenterType","Type"), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.business-units", "BusinessUnit", "Business Unit Master", "Strategic business divisions.", "administration", "table", "/administration/business-units", "Network", "administration.business_units.read",
            new DynamicPageSchemaDto { PageKey="administration.business-units", EntityName="BusinessUnit", Title="Business Unit Master", SubTitle="Strategic divisions within the organization.", ViewType="table", ApiEndpoint="/api/v1/hrms/org/business-units",
                Columns=new(){ Col("name","Business Unit",width:200), Col("code","Code",width:120), Col("companyName","Company",width:180), Col("description","Description",width:300), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search") },
                Form=new(){ Sections=new(){ Sec("basic","Details", F("name","Name",req:true), F("code","Code",req:true), F("companyId","Company","lookup"), F("description","Description","textarea"), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.holiday-calendar", "Holiday", "Holiday Calendar Master", "Public and optional company holidays.", "administration", "table", "/administration/holiday-calendar", "CalendarDays", "administration.holidays.read",
            new DynamicPageSchemaDto { PageKey="administration.holiday-calendar", EntityName="Holiday", Title="Holiday Calendar Master", SubTitle="Set up national, state, and company holidays.", ViewType="table", ApiEndpoint="/api/v1/hrms/holidays",
                Columns=new(){ Col("name","Holiday Name",width:200), Col("date","Date","date",width:140), Col("type","Type",width:140), BadgeCol("isOptional","Optional","{\"true\":\"Optional\",\"false\":\"Mandatory\"}",120) },
                Filters=new(){ TF("search","Search"), DF("from","From"), DF("to","To"), SF("type","Type",("national","National"),("state","State"),("company","Company")) },
                Form=new(){ Sections=new(){ Sec("basic","Holiday", F("name","Name",req:true), F("date","Date","date",req:true), FSel("type","Type",req:true,("National","National"),("State","State"),("Company","Company")), F("isOptional","Optional","boolean"), F("description","Description","textarea")) }},
                Actions=new(){ A("create","Add Holiday","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2"), A("export","Export","ghost","Download"), A("import","Import","ghost","Upload") } }),

            new("administration.webhooks", "TenantWebhook", "Webhooks", "Outbound webhook endpoints.", "administration", "table", "/administration/webhooks", "Zap", "administration.webhooks.read",
            new DynamicPageSchemaDto { PageKey="administration.webhooks", EntityName="TenantWebhook", Title="Webhooks", SubTitle="Push event payloads to external systems in real time.", ViewType="table", ApiEndpoint="/api/v1/administration/webhooks",
                Columns=new(){ Col("name","Webhook Name",width:200), Col("url","Endpoint URL",width:300), Col("lastTriggeredAt","Last Triggered","datetime",width:180), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search"), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("basic","Config", F("name","Name",req:true), F("url","Endpoint URL","url",req:true,span:2), F("secretToken","Secret","password"), F("isActive","Active","boolean")), Sec("events","Events", F("events","Events (comma-separated)","textarea",span:2)) }},
                Actions=new(){ A("create","Add Webhook","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.notification-templates", "CommunicationTemplate", "Notification Templates", "Email and SMS templates.", "administration", "table", "/administration/notification-templates", "Mail", "administration.templates.read",
            new DynamicPageSchemaDto { PageKey="administration.notification-templates", EntityName="CommunicationTemplate", Title="Notification Templates", SubTitle="Manage email, SMS and in-app notification templates.", ViewType="table", ApiEndpoint="/api/v1/administration/communication-templates",
                Columns=new(){ Col("name","Template Name",width:200), Col("triggerEvent","Trigger Event",width:200), Col("templateKind","Channel",width:120), Col("language","Language",width:100), BadgeCol("status","Status","{\"Active\":\"Active\",\"Draft\":\"Draft\"}",100) },
                Filters=new(){ TF("search","Search"), SF("templateKind","Channel",("Email","Email"),("SMS","SMS"),("InApp","In-App")) },
                Form=new(){ Sections=new(){ Sec("basic","Details", F("name","Name",req:true), F("triggerEvent","Trigger",req:true), FSel("templateKind","Channel",req:true,("Email","Email"),("SMS","SMS"),("InApp","In-App")), F("language","Language")), Sec("content","Content", F("subject","Subject",span:2), F("message","Body","rich-text",span:2), FSel("status","Status",false,("Active","Active"),("Draft","Draft"))) }},
                Actions=new(){ A("create","Add Template","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.feature-flags", "FeatureFlag", "Feature Flags", "Enable/disable platform features.", "administration", "table", "/administration/feature-flags", "ToggleRight", "administration.feature_flags.read",
            new DynamicPageSchemaDto { PageKey="administration.feature-flags", EntityName="FeatureFlag", Title="Feature Flags", SubTitle="Control feature availability per tenant without code changes.", ViewType="table", ApiEndpoint="/api/v1/administration/feature-flags",
                Columns=new(){ Col("key","Feature Key",width:240), Col("description","Description",width:300), BadgeCol("isEnabled","Enabled","{\"true\":\"Enabled\",\"false\":\"Disabled\"}",100), Col("updatedAt","Modified","datetime",width:160) },
                Filters=new(){ TF("search","Search"), SF("isEnabled","Status",("true","Enabled"),("false","Disabled")) },
                Form=new(){ Sections=new(){ Sec("basic","Feature Flag", F("key","Feature Key",req:true,ph:"hrms.biometric_sync"), F("description","Description","textarea",span:2), F("isEnabled","Enabled","boolean")) }},
                Actions=new(){ A("create","Add Flag","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.audit-logs", "AuditLog", "Audit Logs", "System-wide audit trail.", "administration", "table", "/administration/audit-logs", "FileSearch", "administration.audit.read",
            new DynamicPageSchemaDto { PageKey="administration.audit-logs", EntityName="AuditLog", Title="Audit Logs", SubTitle="Complete trail of all create, update, delete, and access events.", ViewType="table", ApiEndpoint="/api/v1/administration/audit-logs",
                Columns=new(){ Col("performedAt","Timestamp","datetime",width:180), Col("performedByName","User",width:180), Col("action","Action",width:120), Col("entityName","Entity",width:160), Col("entityId","Record ID",width:180), Col("ipAddress","IP Address",width:140) },
                Filters=new(){ TF("search","Search"), TF("entityName","Entity"), DF("from","From"), DF("to","To") },
                Form=new(){ Sections=new() }, Actions=new(){ A("view","View","ghost","Eye"), A("export","Export","ghost","Download") } }),

            new("administration.settings", "TenantConfig", "Company Settings", "Tenant-wide settings.", "administration", "split", "/administration/settings", "Settings", "administration.settings.read",
            new DynamicPageSchemaDto { PageKey="administration.settings", EntityName="TenantConfig", Title="Company Settings", SubTitle="Configure your organization's core preferences.", ViewType="split", ApiEndpoint="/api/v1/administration/settings",
                Columns=new(), Filters=new(),
                Form=new(){ Sections=new(){ Sec("general","General", F("companyDisplayName","Display Name"), F("timezone","Timezone"), F("dateFormat","Date Format"), F("currency","Default Currency")), Sec("hr","HR Defaults", F("defaultWorkingHours","Working Hours/Day","number"), F("defaultWorkingDays","Working Days/Week","number"), F("probationDays","Probation Days","number"), F("noticePeriodDays","Notice Period Days","number")), Sec("branding","Branding", F("logoUrl","Logo URL","url"), F("primaryColor","Primary Color","color"), F("accentColor","Accent Color","color")) }},
                Actions=new(){ A("save","Save Settings","primary","Save") } }),

            new("administration.tenants", "Tenant", "Tenant Management", "Global multi-tenant instances and subscription tiers.", "administration", "table", "/administration/tenants", "Shield", "administration.tenants.read",
            new DynamicPageSchemaDto { PageKey="administration.tenants", EntityName="Tenant", Title="Tenant Management", SubTitle="Multi-tenant instances, subscription tiers, resource quotas, and domain bindings.", ViewType="table", ApiEndpoint="/api/v1/administration/tenants",
                Columns=new(){ Col("name","Tenant Name",width:200), Col("subdomain","Subdomain",width:160), BadgeCol("status","Status","{\"active\":\"Active\",\"inactive\":\"Inactive\",\"suspended\":\"Suspended\",\"trial\":\"Trial\"}",100), Col("subscriptionPlan","Plan",width:140), Col("employeeLimit","Max Users","number",width:100), Col("storageLimitGb","Storage (GB)","number",width:100), Col("createdAt","Created","date",width:130) },
                Filters=new(){ TF("search","Search tenants"), SF("status","Status",("active","Active"),("trial","Trial"),("suspended","Suspended"),("inactive","Inactive")), SF("subscriptionPlan","Plan",("starter","Starter"),("professional","Professional"),("enterprise","Enterprise")) },
                Form=new(){ Sections=new(){ Sec("basic","Tenant Identity", F("name","Tenant Name",req:true), F("subdomain","Subdomain",req:true), F("adminEmail","Admin Email","email",req:true), F("adminName","Admin Full Name",req:true)), Sec("subscription","Subscription", FSel("subscriptionPlan","Plan",req:true,("starter","Starter"),("professional","Professional"),("enterprise","Enterprise")), FSel("status","Status",false,("active","Active"),("trial","Trial"),("suspended","Suspended")), F("employeeLimit","User Limit","number"), F("storageLimitGb","Storage Limit (GB)","number")), Sec("localization","Localization", F("timezone","Timezone"), F("currency","Currency"), F("language","Language")) }},
                Actions=new(){ A("create","Create Tenant","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2"), A("export","Export","ghost","Download") },
                Kpis=new(){ K("totalTenants","Total Tenants","Building2","indigo"), K("activeTenants","Active","CheckCircle2","green"), K("trialTenants","Trial","Clock","amber"), K("expiredTenants","Expired","XCircle","red") } }),

            new("administration.permissions", "Permission", "System Permissions", "Granular access control policies and capabilities.", "administration", "table", "/administration/permissions", "Key", "administration.permissions.read",
            new DynamicPageSchemaDto { PageKey="administration.permissions", EntityName="Permission", Title="System Permissions", SubTitle="Granular access control policies, API scope permissions, and module capabilities.", ViewType="table", ApiEndpoint="/api/v1/administration/permissions",
                Columns=new(){ Col("name","Permission Name",width:240), Col("code","Permission Code",width:200), Col("category","Module / Category",width:160), Col("description","Description",width:300), BadgeCol("isSystem","Type","{\"true\":\"System\",\"false\":\"Custom\"}",100) },
                Filters=new(){ TF("search","Search permissions"), SF("category","Category",("hrms","HRMS"),("payroll","Payroll"),("finance","Finance"),("procurement","Procurement"),("platform","Platform")) },
                Form=new(){ Sections=new(){ Sec("basic","Permission", F("name","Permission Name",req:true), F("code","Permission Code",req:true), F("category","Module/Category",req:true), F("description","Description","textarea",span:2)) }},
                Actions=new(){ A("create","Add Permission","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2"), A("export","Export","ghost","Download") } }),

            new("administration.projects", "Project", "Projects", "Client projects and operational milestones.", "administration", "table", "/administration/projects", "Briefcase", "administration.projects.read",
            new DynamicPageSchemaDto { PageKey="administration.projects", EntityName="Project", Title="Projects & Engagements", SubTitle="Client projects, operational cost tracking, and resource assignments.", ViewType="table", ApiEndpoint="/api/v1/projects",
                Columns=new(){ Col("name","Project Name",width:220), Col("code","Project Code",width:120), Col("clientName","Client",width:180), BadgeCol("status","Status","{\"Active\":\"Active\",\"Completed\":\"Completed\",\"OnHold\":\"On Hold\",\"Planning\":\"Planning\"}",110), Col("startDate","Start Date","date",width:120), Col("endDate","End Date","date",width:120), Col("budget","Budget","currency",width:130) },
                Filters=new(){ TF("search","Search projects"), SF("status","Status",("Active","Active"),("Planning","Planning"),("OnHold","On Hold"),("Completed","Completed")) },
                Form=new(){ Sections=new(){ Sec("basic","Project Details", F("name","Project Name",req:true), F("code","Project Code",req:true), F("clientName","Client Name"), FSel("status","Status",req:true,("Planning","Planning"),("Active","Active"),("OnHold","On Hold"),("Completed","Completed"))), Sec("schedule","Schedule & Budget", F("startDate","Start Date","date"), F("endDate","End Date","date"), F("budget","Budget","currency"), F("description","Description","textarea",span:2)) }},
                Actions=new(){ A("create","Add Project","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2"), A("export","Export","ghost","Download") },
                Kpis=new(){ K("totalProjects","Total Projects","Briefcase","indigo"), K("activeProjects","Active","Clock","green"), K("completedProjects","Completed","CheckCircle2","blue"), K("delayedProjects","At Risk","AlertTriangle","amber") } }),

            new("administration.policies", "PolicyMaster", "Enterprise Policy Rules", "Configurable validation engines and limits.", "administration", "table", "/administration/policies", "FileCheck", "administration.policies.read",
            new DynamicPageSchemaDto { PageKey="administration.policies", EntityName="PolicyMaster", Title="Enterprise Policy Rules", SubTitle="Configurable validation engines, approval matrices, and threshold limits.", ViewType="table", ApiEndpoint="/api/v1/administration/policies",
                Columns=new(){ Col("name","Policy Name",width:220), Col("code","Policy Code",width:140), Col("module","Module",width:140), Col("policyType","Policy Type",width:160), Col("priority","Priority","number",width:90), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100), Col("updatedAt","Modified","datetime",width:140) },
                Filters=new(){ TF("search","Search policies"), SF("module","Module",("hrms","HRMS"),("payroll","Payroll"),("finance","Finance"),("procurement","Procurement")), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("basic","Policy Identity", F("name","Policy Name",req:true), F("code","Policy Code",req:true), F("module","Module",req:true), F("policyType","Policy Type",req:true), F("priority","Priority","number"), F("isActive","Active","boolean")), Sec("rules","Rule Logic", F("description","Description","textarea",span:2), F("ruleJson","Rule JSON Definition","textarea",span:2)) }},
                Actions=new(){ A("create","Add Policy","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2"), A("export","Export","ghost","Download") } }),

            new("administration.security-sessions", "SecuritySession", "Security & Active Sessions", "Active JWT authentication sessions and IP logs.", "administration", "table", "/administration/security/sessions", "ShieldAlert", "administration.security.read",
            new DynamicPageSchemaDto { PageKey="administration.security-sessions", EntityName="SecuritySession", Title="Security & Active Sessions", SubTitle="Live JWT authentication sessions, IP addresses, device agents, and revocation controls.", ViewType="table", ApiEndpoint="/api/v1/security/sessions",
                Columns=new(){ Col("userName","User",width:180), Col("ipAddress","IP Address",width:140), Col("userAgent","Device / Browser",width:220), Col("deviceType","Device Type",width:120), Col("loginAt","Login Time","datetime",width:160), Col("lastActivityAt","Last Active","datetime",width:160), BadgeCol("isRevoked","Status","{\"false\":\"Active\",\"true\":\"Revoked\"}",100) },
                Filters=new(){ TF("search","Search user or IP"), SF("isRevoked","Status",("false","Active"),("true","Revoked")) },
                Form=new(){ Sections=new() },
                Actions=new(){ A("revoke","Revoke Session","danger","XCircle"), A("export","Export Audit","ghost","Download") },
                Kpis=new(){ K("activeSessions","Active Sessions","Users","green"), K("mfaSessions","MFA Verified","ShieldCheck","indigo"), K("untrustedIps","Flagged IPs","AlertTriangle","red"), K("revokedToday","Revoked Today","XCircle","amber") } }),

            new("administration.privacy", "PrivacyRequest", "Data Privacy & Compliance", "DPDP Act 2023 / GDPR subject access requests.", "administration", "table", "/administration/privacy", "Lock", "administration.privacy.read",
            new DynamicPageSchemaDto { PageKey="administration.privacy", EntityName="PrivacyRequest", Title="Data Privacy & Compliance", SubTitle="DPDP Act 2023 / GDPR subject access requests, personal data exports, and erasure logs.", ViewType="table", ApiEndpoint="/api/v1/administration/privacy",
                Columns=new(){ Col("userEmail","User Email",width:220), Col("requestType","Request Type",width:160), BadgeCol("status","Status","{\"Pending\":\"Pending\",\"Completed\":\"Completed\",\"Rejected\":\"Rejected\"}",120), Col("requestedAt","Requested","datetime",width:160), Col("completedAt","Completed","datetime",width:160) },
                Filters=new(){ TF("search","Search email"), SF("requestType","Type",("Export","Data Export"),("Erasure","Right to be Forgotten")), SF("status","Status",("Pending","Pending"),("Completed","Completed")) },
                Form=new(){ Sections=new(){ Sec("request","Data Privacy Request", F("userEmail","User Email","email",req:true), FSel("requestType","Request Type",req:true,("Export","Personal Data Export"),("Erasure","Account Erasure / Right to be Forgotten")), F("reason","Legal Basis / Reason","textarea",span:2)) }},
                Actions=new(){ A("create","Submit Request","primary","Plus"), A("export","Export Log","ghost","Download") } }),

            new("administration.backup", "SystemBackup", "Backup & Disaster Recovery", "Automated snapshots and restore integrity validation.", "administration", "table", "/administration/backup", "Database", "administration.system.read",
            new DynamicPageSchemaDto { PageKey="administration.backup", EntityName="SystemBackup", Title="Backup & Disaster Recovery", SubTitle="Automated snapshot schedules, cold storage retention, and restore integrity validation.", ViewType="table", ApiEndpoint="/api/v1/administration/system",
                Columns=new(){ Col("snapshotName","Snapshot Name",width:240), Col("snapshotType","Type",width:130), BadgeCol("status","Status","{\"Healthy\":\"Healthy\",\"Pending\":\"Pending\",\"Failed\":\"Failed\"}",110), Col("sizeMb","Size (MB)","number",width:110), Col("completedAt","Timestamp","datetime",width:160), Col("checksum","SHA-256 Checksum",width:180) },
                Filters=new(){ TF("search","Search snapshots"), SF("snapshotType","Type",("Full","Full DB Snapshot"),("Incremental","Incremental"),("Config","Tenant Config")) },
                Form=new(){ Sections=new(){ Sec("snapshot","Trigger Manual Snapshot", F("snapshotName","Snapshot Label",req:true), FSel("snapshotType","Type",req:true,("Full","Full Database Snapshot"),("Config","Configuration Only")), F("notes","Notes","textarea",span:2)) }},
                Actions=new(){ A("create","Backup Now","primary","Plus"), A("restore","Restore Snapshot","danger","RotateCcw"), A("export","Export Manifest","ghost","Download") },
                Kpis=new(){ K("lastBackup","Last Backup","Clock","green"), K("storageUsed","Backup Storage","HardDrive","indigo"), K("retentionDays","Retention","Calendar","blue"), K("integrityScore","Integrity","ShieldCheck","green") } }),

            new("administration.recycle-bin", "RecycleBinItem", "Recycle Bin", "Soft-deleted records across all modules with recovery.", "administration", "table", "/administration/recycle-bin", "Trash", "administration.recycle_bin.read",
            new DynamicPageSchemaDto { PageKey="administration.recycle-bin", EntityName="RecycleBinItem", Title="Recycle Bin & Data Recovery", SubTitle="Soft-deleted records across all modules with instant recovery and permanent purge controls.", ViewType="table", ApiEndpoint="/api/v1/administration/recycle-bin",
                Columns=new(){ Col("entityName","Record Type",width:160), Col("recordTitle","Title / Identifier",width:240), Col("deletedByName","Deleted By",width:180), Col("deletedAt","Deleted At","datetime",width:160), Col("retentionDaysRemaining","Days Remaining","number",width:130) },
                Filters=new(){ TF("search","Search deleted records"), SF("entityName","Entity",("Employee","Employee"),("User","User"),("Department","Department"),("Company","Company")) },
                Form=new(){ Sections=new() },
                Actions=new(){ A("restore","Restore Record","success","RotateCcw"), A("purge","Permanent Delete","danger","Trash2") } }),

            new("administration.system-health", "SystemHealthMetric", "System Health & Diagnostics", "Real-time microservices latency and pool health.", "administration", "table", "/administration/system-health", "Activity", "administration.system.read",
            new DynamicPageSchemaDto { PageKey="administration.system-health", EntityName="SystemHealthMetric", Title="System Health & Diagnostics", SubTitle="Real-time microservices latency, database connection pool, memory footprint, and background workers.", ViewType="table", ApiEndpoint="/api/v1/administration/system",
                Columns=new(){ Col("component","Subsystem",width:200), BadgeCol("status","Status","{\"Healthy\":\"Healthy\",\"Degraded\":\"Degraded\",\"Unhealthy\":\"Down\"}",110), Col("responseTimeMs","Latency (ms)","number",width:130), Col("uptimePercent","Uptime %","number",width:110), Col("lastCheckedAt","Last Checked","datetime",width:160) },
                Filters=new(){ TF("search","Search subsystem"), SF("status","Status",("Healthy","Healthy"),("Degraded","Degraded"),("Unhealthy","Unhealthy")) },
                Form=new(){ Sections=new() },
                Actions=new(){ A("refresh","Run Health Check","primary","RefreshCw"), A("export","Export Diagnostics","ghost","Download") },
                Kpis=new(){ K("overallStatus","Cluster Status","CheckCircle2","green"), K("apiLatency","Avg API Latency","Clock","indigo"), K("dbConnections","DB Connections","Database","blue"), K("workerQueues","Hangfire Jobs","Cpu","amber") } }),

            new("administration.developer-center", "DeveloperResource", "Developer Center & API Docs", "Swagger OpenAPI schemas and OAuth2 credentials.", "administration", "table", "/administration/developer-center", "Code", "administration.developer.read",
            new DynamicPageSchemaDto { PageKey="administration.developer-center", EntityName="DeveloperResource", Title="Developer Center & API Docs", SubTitle="Swagger OpenAPI schemas, rate limiting policies, OAuth2 client credentials, and SDK downloads.", ViewType="table", ApiEndpoint="/api/v1/administration/webhooks",
                Columns=new(){ Col("apiName","API Family",width:200), Col("version","Version",width:100), Col("endpoint","Base URL",width:280), Col("rateLimit","Rate Limit",width:140), Col("authType","Auth Type",width:130), BadgeCol("status","Status","{\"GA\":\"General Availability\",\"Beta\":\"Beta\"}",100) },
                Filters=new(){ TF("search","Search API docs") },
                Form=new(){ Sections=new() },
                Actions=new(){ A("export","Download OpenAPI JSON","ghost","Download") } }),

            new("administration.electronic-data-interchange", "EdiTransaction", "EDI & B2B Interchange", "ANSI X12 & EDIFACT parser and invoice generator.", "administration", "table", "/administration/electronic-data-interchange", "FileSpreadsheet", "administration.edi.read",
            new DynamicPageSchemaDto { PageKey="administration.electronic-data-interchange", EntityName="EdiTransaction", Title="EDI & B2B Interchange", SubTitle="ANSI X12 & EDIFACT message parser, invoice (810) generator, and dispatch advice (856).", ViewType="table", ApiEndpoint="/api/v1/administration/webhooks",
                Columns=new(){ Col("transactionType","EDI Standard",width:160), Col("partnerCode","Partner Code",width:140), Col("documentNumber","Doc Number",width:180), BadgeCol("status","Status","{\"Processed\":\"Processed\",\"Pending\":\"Pending\",\"Rejected\":\"Rejected\"}",110), Col("processedAt","Processed","datetime",width:160) },
                Filters=new(){ TF("search","Search partner"), SF("transactionType","Standard",("EDI-810","Invoice (810)"),("EDI-856","Dispatch Advice (856)"),("EDI-850","Purchase Order (850)")) },
                Form=new(){ Sections=new(){ Sec("edi","EDI Message Payload", F("transactionType","Transaction Type",req:true), F("partnerCode","Partner Code",req:true), F("rawPayload","Raw EDI Content","textarea",span:2)) }},
                Actions=new(){ A("create","Parse EDI","primary","Plus"), A("export","Export EDI File","ghost","Download") } }),

            new("administration.contact-submissions", "ContactSubmission", "Contact Inquiries", "Inbound public website leads and queries.", "administration", "table", "/administration/contact-submissions", "MessageSquare", "administration.contact.read",
            new DynamicPageSchemaDto { PageKey="administration.contact-submissions", EntityName="ContactSubmission", Title="Contact Inquiries", SubTitle="Inbound public website leads, corporate queries, and service request submissions.", ViewType="table", ApiEndpoint="/api/v1/contactsubmissions",
                Columns=new(){ Col("fullName","Name",width:180), Col("email","Email",width:200), Col("phone","Phone",width:140), Col("company","Company",width:180), Col("subject","Subject",width:220), Col("createdAt","Received","datetime",width:160) },
                Filters=new(){ TF("search","Search name or company") },
                Form=new(){ Sections=new() },
                Actions=new(){ A("export","Export Inquiries","ghost","Download") } }),

            new("administration.support", "SupportTicket", "Support Center", "Enterprise escalation tickets and SLA tracking.", "administration", "table", "/administration/support", "Headphones", "administration.support.read",
            new DynamicPageSchemaDto { PageKey="administration.support", EntityName="SupportTicket", Title="Enterprise Support Center", SubTitle="Platform escalation tickets, SLA tracking, and technical support dispatches.", ViewType="table", ApiEndpoint="/api/v1/helpdesk/tickets",
                Columns=new(){ Col("ticketNumber","Ticket #",width:120), Col("subject","Subject",width:240), BadgeCol("priority","Priority","{\"Critical\":\"Critical\",\"High\":\"High\",\"Medium\":\"Medium\",\"Low\":\"Low\"}",100), BadgeCol("status","Status","{\"Open\":\"Open\",\"InProgress\":\"In Progress\",\"Resolved\":\"Resolved\",\"Closed\":\"Closed\"}",110), Col("requesterName","Requester",width:160), Col("createdAt","Created","datetime",width:140) },
                Filters=new(){ TF("search","Search tickets"), SF("priority","Priority",("Critical","Critical"),("High","High"),("Medium","Medium"),("Low","Low")), SF("status","Status",("Open","Open"),("InProgress","In Progress"),("Resolved","Resolved")) },
                Form=new(){ Sections=new(){ Sec("ticket","Support Ticket", F("subject","Subject",req:true), FSel("priority","Priority",req:true,("Critical","Critical"),("High","High"),("Medium","Medium"),("Low","Low")), F("category","Category"), F("description","Problem Description","textarea",span:2)) }},
                Actions=new(){ A("create","Open Ticket","primary","Plus"), A("edit","Update Status","secondary","Pencil"), A("export","Export Tickets","ghost","Download") } }),

            new("administration.ai-assistant", "AiAssistantConfig", "AI Copilot & Agents", "LLM routing, token quotas, and prompt guardrails.", "administration", "table", "/administration/ai-assistant", "Sparkles", "administration.ai.read",
            new DynamicPageSchemaDto { PageKey="administration.ai-assistant", EntityName="AiAssistantConfig", Title="AI Copilot & Autonomous Agents", SubTitle="LLM model routing, vector embedding collections, token quotas, and prompt guardrails.", ViewType="table", ApiEndpoint="/api/v1/ai/agents",
                Columns=new(){ Col("agentName","Agent Name",width:200), Col("model","LLM Model",width:160), Col("temperature","Temperature","number",width:110), Col("maxTokens","Max Tokens","number",width:110), BadgeCol("status","Status","{\"Active\":\"Active\",\"Draft\":\"Draft\"}",100), Col("updatedAt","Updated","datetime",width:140) },
                Filters=new(){ TF("search","Search agents"), SF("status","Status",("Active","Active"),("Draft","Draft")) },
                Form=new(){ Sections=new(){ Sec("agent","Agent Configuration", F("agentName","Agent Name",req:true), FSel("model","Model",req:true,("gemini-1.5-pro","Gemini 1.5 Pro"),("claude-3-5-sonnet","Claude 3.5 Sonnet"),("gpt-4o","GPT-4o")), F("temperature","Temperature (0.0 - 1.0)","number"), F("maxTokens","Max Output Tokens","number"), F("systemPrompt","System Instruction Prompt","textarea",span:2)) }},
                Actions=new(){ A("create","Add Agent","primary","Plus"), A("edit","Edit Config","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.master-data", "MasterDataEntity", "Master Data Management", "Centralized lookup values and taxonomy validation.", "administration", "table", "/administration/master-data", "BookOpen", "administration.master_data.read",
            new DynamicPageSchemaDto { PageKey="administration.master-data", EntityName="MasterDataEntity", Title="Master Data Management", SubTitle="Centralized lookup values, categorization taxonomies, and multi-entity data validation rules.", ViewType="table", ApiEndpoint="/api/v1/ui-pages/entities",
                Columns=new(){ Col("name","Entity",width:180), Col("displayName","Display Name",width:200), Col("category","Category",width:140), Col("table","Table",width:180), Col("description","Description",width:300) },
                Filters=new(){ TF("search","Search entity"), SF("category","Category",("HRMS","HRMS"),("Organization","Organization"),("Finance","Finance"),("Inventory","Inventory"),("Sales","Sales")) },
                Form=new(){ Sections=new() },
                Actions=new(){ A("view","View Records","ghost","Eye"), A("export","Export Catalog","ghost","Download") } }),

            new("administration.data-management", "DataMigrationJob", "Data Management & ETL", "Bulk record import and legacy schema mapping.", "administration", "table", "/administration/data-management", "HardDrive", "administration.data_management.read",
            new DynamicPageSchemaDto { PageKey="administration.data-management", EntityName="DataMigrationJob", Title="Data Management & ETL Pipeline", SubTitle="Bulk record import, export data staging, legacy schema mapping, and validation pipelines.", ViewType="table", ApiEndpoint="/api/v1/administration/audit-logs",
                Columns=new(){ Col("jobName","ETL Job Name",width:220), Col("entityType","Target Entity",width:160), Col("totalRows","Total Rows","number",width:110), Col("importedRows","Imported","number",width:100), Col("errorCount","Errors","number",width:90), BadgeCol("status","Status","{\"Completed\":\"Completed\",\"Running\":\"Running\",\"Failed\":\"Failed\"}",110), Col("executedAt","Executed","datetime",width:140) },
                Filters=new(){ TF("search","Search job"), SF("status","Status",("Completed","Completed"),("Running","Running"),("Failed","Failed")) },
                Form=new(){ Sections=new(){ Sec("etl","Create Import Pipeline", F("jobName","Pipeline Name",req:true), FSel("entityType","Entity",req:true,("Employee","Employees"),("Customer","Customers"),("Item","Inventory Items"),("ChartOfAccounts","Chart of Accounts")), F("sourceFile","Upload CSV/Excel","file")) }},
                Actions=new(){ A("create","New ETL Job","primary","Plus"), A("export","Export Log","ghost","Download") } }),

            new("administration.integrations", "IntegrationApp", "Integrations Hub", "Connected SaaS apps and ERP connectors.", "administration", "table", "/administration/integrations", "Puzzle", "administration.integrations.read",
            new DynamicPageSchemaDto { PageKey="administration.integrations", EntityName="IntegrationApp", Title="Integrations Hub", SubTitle="Connected SaaS apps, ERP connectors (SAP, Tally, Salesforce), payment gateways, and SMS/WhatsApp providers.", ViewType="table", ApiEndpoint="/api/v1/integrations",
                Columns=new(){ Col("appName","Integration Name",width:200), Col("provider","Provider",width:160), Col("category","Category",width:140), BadgeCol("status","Status","{\"Connected\":\"Connected\",\"Disconnected\":\"Disconnected\",\"Error\":\"Error\"}",110), Col("lastSyncedAt","Last Synced","datetime",width:160) },
                Filters=new(){ TF("search","Search apps"), SF("category","Category",("ERP","ERP / Finance"),("Payment","Payment Gateway"),("Communication","SMS / WhatsApp"),("Identity","SSO / Identity")) },
                Form=new(){ Sections=new(){ Sec("app","Connection Credentials", F("appName","Integration Name",req:true), F("provider","Provider Name",req:true), F("apiKey","API Key / Client ID","password",req:true), F("webhookUrl","Callback URL","url"), F("isEnabled","Enabled","boolean")) }},
                Actions=new(){ A("create","Add Integration","primary","Plus"), A("edit","Configure","secondary","Pencil"), A("delete","Disconnect","danger","Trash2") } }),

            new("administration.connectors", "IntegrationConnector", "Enterprise Connectors", "Direct sync pipelines for hardware and external software.", "administration", "table", "/administration/integrations/connectors", "Network", "administration.integrations.read",
            new DynamicPageSchemaDto { PageKey="administration.connectors", EntityName="IntegrationConnector", Title="Enterprise Connectors", SubTitle="Dedicated sync pipelines for external accounting, banking, and biometric hardware devices.", ViewType="table", ApiEndpoint="/api/v1/integrations",
                Columns=new(){ Col("connectorName","Connector Name",width:200), Col("protocol","Protocol",width:120), Col("host","Host Endpoint",width:200), Col("syncIntervalMinutes","Sync Frequency (m)","number",width:140), BadgeCol("status","Status","{\"Active\":\"Active\",\"Idle\":\"Idle\",\"Error\":\"Error\"}",100) },
                Filters=new(){ TF("search","Search connectors") },
                Form=new(){ Sections=new(){ Sec("conn","Connector Protocol", F("connectorName","Connector Name",req:true), FSel("protocol","Protocol",req:true,("REST","REST API"),("SOAP","SOAP / XML"),("TCP","TCP / Hardware Socket"),("ODBC","ODBC / Direct SQL")), F("host","Host Endpoint",req:true), F("port","Port","number"), F("syncIntervalMinutes","Interval (Minutes)","number")) }},
                Actions=new(){ A("create","Add Connector","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.entity-builder", "CustomEntity", "Dynamic Entity Builder", "Create custom business tables and fields.", "administration", "table", "/administration/entity-builder", "Layers", "administration.entity_builder.read",
            new DynamicPageSchemaDto { PageKey="administration.entity-builder", EntityName="CustomEntity", Title="Dynamic Entity Builder", SubTitle="Create custom business tables, define field data types, constraints, and relational foreign keys on the fly.", ViewType="table", ApiEndpoint="/api/v1/ui-pages/entities",
                Columns=new(){ Col("name","Entity Key",width:180), Col("displayName","Display Name",width:200), Col("category","Module",width:140), Col("table","Physical Table",width:180), BadgeCol("isSystem","Type","{\"true\":\"System Core\",\"false\":\"User Defined\"}",120) },
                Filters=new(){ TF("search","Search entities"), SF("category","Module",("HRMS","HRMS"),("Organization","Organization"),("Finance","Finance"),("Custom","Custom Tables")) },
                Form=new(){ Sections=new(){ Sec("entity","Entity Definition", F("name","Entity Key (e.g. AssetCategory)",req:true), F("displayName","Display Name",req:true), F("category","Module / Category",req:true), F("description","Description","textarea",span:2)) }},
                Actions=new(){ A("create","Create Entity","primary","Plus"), A("edit","Design Fields","secondary","Pencil"), A("export","Export DDL","ghost","Download") } }),

            new("administration.schema-manager", "UiPageDefinition", "Schema & Custom Fields Master", "Inspect, manage, and version dynamic page layouts.", "administration", "table", "/administration/schema-master", "Sliders", "administration.schema_manager.read",
            new DynamicPageSchemaDto { PageKey="administration.schema-manager", EntityName="UiPageDefinition", Title="Schema & Custom Fields Master", SubTitle="Inspect, manage, and version dynamic page layouts, field placements, and tenant scopes.", ViewType="table", ApiEndpoint="/api/v1/ui-pages",
                Columns=new(){ Col("pageKey","Page Key",width:220), Col("entityName","Target Entity",width:160), Col("title","Page Title",width:200), Col("moduleKey","Module",width:120), Col("viewType","View Type",width:100), Col("publishedVersion","Version","number",width:90), BadgeCol("status","Status","{\"Active\":\"Active\",\"Draft\":\"Draft\",\"AutoSynthesized\":\"Synthesized\"}",110) },
                Filters=new(){ TF("search","Search page key or title"), SF("moduleKey","Module",("administration","Administration"),("hrms","HRMS"),("payroll","Payroll"),("finance","Finance")) },
                Form=new(){ Sections=new(){ Sec("page","Page Registry Details", F("pageKey","Unique Page Key",req:true), F("entityName","Target Entity",req:true), F("title","Title",req:true), F("moduleKey","Module Key",req:true), FSel("viewType","View Type",false,("table","Table"),("split","Split / Detail"),("card","Card Grid"))) }},
                Actions=new(){ A("create","Add Schema","primary","Plus"), A("edit","Open in Page Builder","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.menu-builder", "NavigationMenuItem", "Dynamic Navigation Builder", "Configure module sidebars and role permissions.", "administration", "table", "/administration/menu-builder", "Menu", "administration.menu_builder.read",
            new DynamicPageSchemaDto { PageKey="administration.menu-builder", EntityName="NavigationMenuItem", Title="Dynamic Navigation Builder", SubTitle="Configure module sidebars, nested navigation groups, badge indicators, and role permissions.", ViewType="table", ApiEndpoint="/api/v1/ui-shell/navigation",
                Columns=new(){ Col("title","Menu Title",width:200), Col("route","Route Path",width:240), Col("module","Module",width:130), Col("parentMenu","Parent Group",width:160), Col("sortOrder","Order","number",width:80), BadgeCol("isVisible","Visible","{\"true\":\"Visible\",\"false\":\"Hidden\"}",90) },
                Filters=new(){ TF("search","Search menu item"), SF("module","Module",("administration","Administration"),("hrms","HRMS"),("payroll","Payroll"),("finance","Finance")) },
                Form=new(){ Sections=new(){ Sec("menu","Navigation Entry", F("title","Label",req:true), F("route","Route Path",req:true), F("module","Module",req:true), F("parentMenu","Parent Group"), F("sortOrder","Sort Order","number"), F("isVisible","Visible in Sidebar","boolean")) }},
                Actions=new(){ A("create","Add Nav Item","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.module-mapping", "TenantModuleLicense", "Module Entitlement Mapping", "Enable or restrict functional modules per tenant.", "administration", "table", "/administration/module-mapping", "Boxes", "administration.module_mapping.read",
            new DynamicPageSchemaDto { PageKey="administration.module-mapping", EntityName="TenantModuleLicense", Title="Module Entitlement Mapping", SubTitle="Enable or restrict functional modules per subscription tier and tenant contract.", ViewType="table", ApiEndpoint="/api/v1/modules",
                Columns=new(){ Col("name","Module Name",width:200), Col("moduleKey","Module Key",width:160), Col("category","Suite",width:140), BadgeCol("isEnabled","Status","{\"true\":\"Enabled\",\"false\":\"Disabled\"}",100), Col("seatCount","Seat Quota","number",width:110) },
                Filters=new(){ TF("search","Search module"), SF("isEnabled","Status",("true","Enabled"),("false","Disabled")) },
                Form=new(){ Sections=new(){ Sec("module","Module Licensing", F("name","Module Name",req:true), F("moduleKey","Module Key",req:true), F("isEnabled","Licensed & Active","boolean"), F("seatCount","Seat Quota","number")) }},
                Actions=new(){ A("edit","Update License","secondary","Pencil"), A("export","Export Catalog","ghost","Download") } }),

            new("administration.workflow-config", "WorkflowDefinition", "Workflow & Approval Orchestration", "Multi-tier approval chains and triggers.", "administration", "table", "/administration/workflow-config", "GitMerge", "administration.workflows.read",
            new DynamicPageSchemaDto { PageKey="administration.workflow-config", EntityName="WorkflowDefinition", Title="Workflow & Approval Orchestration", SubTitle="Multi-tier approval chains, conditional routing, auto-escalation timeouts, and webhook triggers.", ViewType="table", ApiEndpoint="/api/v1/workflows",
                Columns=new(){ Col("workflowName","Workflow Name",width:220), Col("targetEntity","Target Entity",width:160), Col("triggerEvent","Trigger Event",width:160), Col("stepCount","Steps","number",width:90), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100), Col("updatedAt","Modified","datetime",width:140) },
                Filters=new(){ TF("search","Search workflows"), SF("targetEntity","Entity",("LeaveRequest","Leave"),("ExpenseClaim","Expense"),("PurchaseOrder","Purchase Order"),("FinalSettlement","F&F")), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("workflow","Workflow Definition", F("workflowName","Workflow Name",req:true), F("targetEntity","Target Entity",req:true), F("triggerEvent","Trigger Event",req:true), F("description","Description","textarea",span:2), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add Workflow","primary","Plus"), A("edit","Configure Steps","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.geography-hierarchy", "GeographyNode", "Geographic Hierarchy", "Country, state, district, city master for compliance.", "administration", "table", "/administration/geography-hierarchy", "Globe", "administration.geo.read",
            new DynamicPageSchemaDto { PageKey="administration.geography-hierarchy", EntityName="GeographyNode", Title="Geographic Hierarchy", SubTitle="Global country, state, district, city, and pincode master for localized compliance and taxation.", ViewType="table", ApiEndpoint="/api/v1/geo/countries",
                Columns=new(){ Col("name","Location Name",width:200), Col("code","Code / ISO",width:120), Col("type","Level",width:140), Col("parentName","Parent Location",width:180), BadgeCol("status","Status","{\"Active\":\"Active\",\"Inactive\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search locations"), SF("type","Level",("Country","Country"),("State","State / Province"),("City","City / District")) },
                Form=new(){ Sections=new(){ Sec("geo","Location Details", F("name","Name",req:true), F("code","ISO / Local Code",req:true), FSel("type","Level",req:true,("Country","Country"),("State","State"),("City","City")), F("parentId","Parent Location","lookup")) }},
                Actions=new(){ A("create","Add Location","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.org-chart", "OrgNode", "Organizational Hierarchy Chart", "Enterprise reporting tree and span of control.", "administration", "table", "/administration/org-chart", "Network", "administration.org_chart.read",
            new DynamicPageSchemaDto { PageKey="administration.org-chart", EntityName="OrgNode", Title="Organizational Hierarchy Chart", SubTitle="Enterprise visual reporting tree, direct/indirect reporting lines, and span of control.", ViewType="table", ApiEndpoint="/api/v1/hrms/employees",
                Columns=new(){ Col("fullName","Employee Name",width:200), Col("employeeCode","Code",width:110), Col("designationName","Designation",width:180), Col("departmentName","Department",width:180), Col("managerName","Reports To",width:180) },
                Filters=new(){ TF("search","Search employee or manager") },
                Form=new(){ Sections=new() },
                Actions=new(){ A("export","Export Hierarchy","ghost","Download") } }),

            new("administration.migration-dashboard", "MigrationJob", "Database Migration Dashboard", "EF Core migrations and tenant multi-database sync.", "administration", "table", "/administration/migration-dashboard", "Cpu", "administration.migrations.read",
            new DynamicPageSchemaDto { PageKey="administration.migration-dashboard", EntityName="MigrationJob", Title="Database Migration Dashboard", SubTitle="EF Core schema migrations, tenant multi-database sync, and seed execution logs.", ViewType="table", ApiEndpoint="/api/v1/ui-pages",
                Columns=new(){ Col("migrationId","Migration ID",width:260), Col("appliedAt","Applied At","datetime",width:160), Col("productVersion","EF Core Version",width:140), BadgeCol("status","Status","{\"Applied\":\"Applied\",\"Pending\":\"Pending\"}",110) },
                Filters=new(){ TF("search","Search migrations") },
                Form=new(){ Sections=new() },
                Actions=new(){ A("export","Export History","ghost","Download") } }),

            new("administration.website.pages", "WebsitePage", "Website CMS Pages", "Public tenant landing pages and portal content.", "administration", "table", "/administration/website/pages", "Globe", "administration.website.read",
            new DynamicPageSchemaDto { PageKey="administration.website.pages", EntityName="WebsitePage", Title="Website CMS Pages", SubTitle="Public tenant landing pages, terms of service, privacy notice, and carrier portal.", ViewType="table", ApiEndpoint="/api/v1/website/pages",
                Columns=new(){ Col("title","Page Title",width:220), Col("pageType","Page Type",width:160), BadgeCol("isPublished","Published","{\"true\":\"Published\",\"false\":\"Draft\"}",100), Col("tenantName","Tenant Scope",width:180), Col("updatedAt","Modified","datetime",width:140) },
                Filters=new(){ TF("search","Search pages"), SF("isPublished","Status",("true","Published"),("false","Draft")) },
                Form=new(){ Sections=new(){ Sec("page","Page Content", F("title","Page Title",req:true), FSel("pageType","Type",req:true,("home","Home Landing"),("about","About Us"),("terms","Terms of Service"),("privacy","Privacy Notice"),("contact","Contact Us")), F("isPublished","Published","boolean"), F("contentJson","Page Content JSON","rich-text",span:2)) }},
                Actions=new(){ A("create","Add Page","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.website.templates", "WebsiteTemplate", "CMS Page Templates", "Reusable responsive layout templates for marketing.", "administration", "table", "/administration/website/templates", "Layout", "administration.website.read",
            new DynamicPageSchemaDto { PageKey="administration.website.templates", EntityName="WebsiteTemplate", Title="CMS Page Templates", SubTitle="Reusable responsive layout templates for marketing, blogs, and customer portal.", ViewType="table", ApiEndpoint="/api/v1/website/templates",
                Columns=new(){ Col("name","Template Name",width:220), Col("category","Category",width:140), Col("layoutType","Layout Engine",width:140), BadgeCol("isDefault","Default","{\"true\":\"Default\",\"false\":\"Standard\"}",100) },
                Filters=new(){ TF("search","Search templates") },
                Form=new(){ Sections=new(){ Sec("tmpl","Template Definition", F("name","Template Name",req:true), F("category","Category",req:true), F("layoutType","Layout Engine",req:true)) }},
                Actions=new(){ A("create","Add Template","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.website.themes", "WebsiteTheme", "Branding Themes", "Tailwind palettes and typography tokens.", "administration", "table", "/administration/website/themes", "Palette", "administration.website.read",
            new DynamicPageSchemaDto { PageKey="administration.website.themes", EntityName="WebsiteTheme", Title="Branding Themes", SubTitle="Tailwind palettes, typography tokens, border radii, and dark/light color schemes.", ViewType="table", ApiEndpoint="/api/v1/website/themes",
                Columns=new(){ Col("themeName","Theme Name",width:200), Col("primaryColor","Primary Color",width:140), Col("accentColor","Accent Color",width:140), Col("fontHeading","Font Family",width:160), BadgeCol("isDefault","Active","{\"true\":\"Active\",\"false\":\"Alternate\"}",100) },
                Filters=new(){ TF("search","Search themes") },
                Form=new(){ Sections=new(){ Sec("theme","Theme Colors & Typography", F("themeName","Theme Name",req:true), F("primaryColor","Primary Color","color",req:true), F("accentColor","Accent Color","color",req:true), F("fontHeading","Heading Font"), F("isDefault","Set as Default Active Theme","boolean")) }},
                Actions=new(){ A("create","Add Theme","primary","Plus"), A("edit","Customize","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.website.settings", "WebsiteSetting", "Website SEO & Domain Settings", "Custom domains, meta tags, and analytics IDs.", "administration", "split", "/administration/website/settings", "Globe", "administration.website.read",
            new DynamicPageSchemaDto { PageKey="administration.website.settings", EntityName="WebsiteSetting", Title="Website SEO & Domain Settings", SubTitle="Custom domain DNS records, OpenGraph meta tags, robots.txt, and Google Analytics IDs.", ViewType="split", ApiEndpoint="/api/v1/website/settings",
                Columns=new(), Filters=new(),
                Form=new(){ Sections=new(){ Sec("seo","SEO & Metadata", F("siteTitle","Site Title"), F("metaDescription","Meta Description","textarea",span:2), F("canonicalDomain","Custom Domain (e.g. erp.uabindia.com)")), Sec("analytics","Tracking & Integrations", F("googleAnalyticsId","Google Analytics (G-XXXX)"), F("facebookPixelId","Meta Pixel ID"), F("enableRobotsTxt","Generate Auto robots.txt","boolean")) }},
                Actions=new(){ A("save","Save SEO Settings","primary","Save") } }),

            // ══════════ HRMS MODULE ══════════
            new("hrms.employees", "Employee", "Employee Master", "Complete workforce directory and personnel records.", "hrms", "table", "/hrms/employees", "Users", "hrms.employees.read",
            new DynamicPageSchemaDto { PageKey="hrms.employees", EntityName="Employee", Title="Employee Master", SubTitle="Personnel records, contact info, compensation, and compliance data.", ViewType="table", ApiEndpoint="/api/v1/hrms/employees",
                Columns=new(){ Col("avatarUrl","Photo","avatar",sortable:false,width:60), Col("employeeCode","Emp. Code",width:110), Col("fullName","Full Name",width:200), Col("designationName","Designation",width:180), Col("departmentName","Department",width:180), Col("employmentType","Type",width:120), Col("joiningDate","Joining Date","date",width:130), Col("monthlyCtc","CTC/Month","currency",width:130,visible:false), BadgeCol("status","Status","{\"Active\":\"Active\",\"Inactive\":\"Inactive\",\"Terminated\":\"Terminated\",\"OnLeave\":\"On Leave\"}",110) },
                Filters=new(){ TF("search","Search by name, code, or email"), SF("status","Status",("Active","Active"),("Inactive","Inactive"),("Terminated","Terminated"),("OnLeave","On Leave")), SF("employmentType","Type",("Permanent","Permanent"),("Contract","Contract"),("Probation","Probation"),("Intern","Intern")), DF("joiningFrom","Joined From"), DF("joiningTo","Joined To") },
                Form=new(){ Sections=new(){ Sec("personal","Personal Information", F("fullName","Full Name",req:true,span:2), F("employeeCode","Employee Code"), FSel("status","Status",false,("Active","Active"),("Onboarding","Onboarding"),("OnLeave","On Leave"),("Inactive","Inactive"),("Terminated","Terminated")), FSel("gender","Gender",false,("Male","Male"),("Female","Female"),("Other","Other")), F("dateOfBirth","Date of Birth","date"), F("phone","Mobile","tel"), F("personalEmail","Personal Email","email")), Sec("employment","Employment Details", F("companyId","Company","lookup",req:true), F("departmentId","Department","lookup",req:true), F("designationId","Designation","lookup",req:true), F("managerId","Reporting Manager","lookup"), F("joiningDate","Date of Joining","date",req:true), FSel("employmentType","Type",req:true,("Permanent","Permanent"),("Contract","Contract"),("Probation","Probation"),("Intern","Intern"),("Consultant","Consultant")), F("workEmail","Work Email","email"), F("workLocation","Work Location"), F("city","City"), F("state","State")), Sec("statutory","Statutory & Compensation", F("pan","PAN Number"), F("aadhaar","Aadhaar"), F("uan","UAN (PF)"), F("esiNumber","ESI Number"), F("bankName","Bank Name"), F("bankAccountNumber","Account Number"), F("bankIfsc","IFSC Code"), F("basicSalary","Basic Salary","currency"), F("monthlyCtc","Monthly CTC","currency")) }},
                Actions=new(){ A("create","Add Employee","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2"), A("export","Export","ghost","Download"), A("import","Import","ghost","Upload") },
                Kpis=new(){ K("totalEmployees","Total Employees","Users","indigo"), K("activeEmployees","Active","UserCheck","green"), K("onLeaveToday","On Leave","Calendar","amber"), K("newJoinersMTD","New Joiners (MTD)","UserPlus","blue") } }),

            new("hrms.leave", "LeaveRequest", "Leave Management", "Employee leave requests, balances, and policies.", "hrms", "table", "/hrms/leave", "Calendar", "hrms.leave.read",
            new DynamicPageSchemaDto { PageKey="hrms.leave", EntityName="LeaveRequest", Title="Leave Management", SubTitle="View, approve, and track all employee leave requests.", ViewType="table", ApiEndpoint="/api/v1/hrms/leave/requests",
                Columns=new(){ Col("employeeName","Employee",width:200), Col("leaveTypeName","Leave Type",width:160), Col("fromDate","From","date",width:120), Col("toDate","To","date",width:120), Col("days","Days","number",width:80), BadgeCol("status","Status","{\"Pending\":\"Pending\",\"Approved\":\"Approved\",\"Rejected\":\"Rejected\",\"Cancelled\":\"Cancelled\"}",110), Col("appliedAt","Applied","date",width:130) },
                Filters=new(){ TF("search","Search employee"), SF("status","Status",("Pending","Pending"),("Approved","Approved"),("Rejected","Rejected"),("Cancelled","Cancelled")), DF("from","From"), DF("to","To") },
                Form=new(){ Sections=new(){ Sec("request","Leave Request", F("employeeId","Employee","lookup",req:true), F("leaveTypeId","Leave Type","lookup",req:true), F("fromDate","From","date",req:true), F("toDate","To","date",req:true), F("reason","Reason","textarea",span:2)) }},
                Actions=new(){ A("create","Apply Leave","primary","Plus"), A("approve","Approve","success","CheckCircle2"), A("reject","Reject","danger","XCircle"), A("export","Export","ghost","Download") },
                Kpis=new(){ K("pendingLeaves","Pending","Clock","amber"), K("approvedMTD","Approved (MTD)","CheckCircle2","green"), K("onLeaveToday","On Leave Today","Calendar","blue") } }),

            new("hrms.probation", "Employee", "Probation Management", "Probation tracking and confirmation workflows.", "hrms", "table", "/hrms/probation", "ClipboardCheck", "hrms.probation.read",
            new DynamicPageSchemaDto { PageKey="hrms.probation", EntityName="Employee", Title="Probation Management", SubTitle="Track probation periods and initiate confirmation workflows.", ViewType="table", ApiEndpoint="/api/v1/hrms/probation",
                Columns=new(){ Col("employeeName","Employee",width:200), Col("designationName","Designation",width:180), Col("joiningDate","Joining Date","date",width:130), Col("probationEndDate","Probation End","date",width:140), Col("daysRemaining","Days Left","number",width:100), BadgeCol("probationStatus","Status","{\"OnProbation\":\"On Probation\",\"Extended\":\"Extended\",\"Confirmed\":\"Confirmed\"}",120) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("OnProbation","On Probation"),("Extended","Extended"),("Confirmed","Confirmed")) },
                Form=new(){ Sections=new(){ Sec("probation","Details", F("employeeId","Employee","lookup",req:true), F("probationStartDate","Start Date","date",req:true), F("probationEndDate","End Date","date",req:true), FSel("status","Status",req:true,("OnProbation","On Probation"),("Extended","Extended"),("Confirmed","Confirmed")), F("managerNotes","Manager Notes","textarea",span:2)) }},
                Actions=new(){ A("confirm","Confirm Employee","success","UserCheck"), A("extend","Extend Probation","warning","Clock"), A("export","Export","ghost","Download") } }),

            new("hrms.recruitment", "JobPosting", "Recruitment", "Job postings, candidates, and hiring pipeline.", "hrms", "table", "/hrms/recruitment", "Briefcase", "hrms.recruitment.read",
            new DynamicPageSchemaDto { PageKey="hrms.recruitment", EntityName="JobPosting", Title="Recruitment", SubTitle="Manage open positions, applicants, and the hiring pipeline.", ViewType="table", ApiEndpoint="/api/v1/hrms/recruitment/postings",
                Columns=new(){ Col("jobTitle","Job Title",width:220), Col("departmentName","Department",width:180), Col("vacancies","Vacancies","number",width:90), Col("applicantCount","Applicants","number",width:100), Col("postedDate","Posted","date",width:120), Col("closingDate","Closing","date",width:120), BadgeCol("status","Status","{\"Open\":\"Open\",\"Closed\":\"Closed\",\"OnHold\":\"On Hold\"}",110) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("Open","Open"),("Closed","Closed"),("OnHold","On Hold")) },
                Form=new(){ Sections=new(){ Sec("posting","Job Posting", F("jobTitle","Job Title",req:true), F("departmentId","Department","lookup",req:true), F("vacancies","Vacancies","number",req:true), F("postedDate","Posted Date","date"), F("closingDate","Closing Date","date"), FSel("status","Status",req:true,("Open","Open"),("Closed","Closed"),("OnHold","On Hold")), F("description","Job Description","rich-text",span:2)) }},
                Actions=new(){ A("create","Add Posting","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2"), A("export","Export","ghost","Download") },
                Kpis=new(){ K("openPositions","Open Positions","Briefcase","blue"), K("totalApplicants","Total Applicants","Users","indigo"), K("interviewsScheduled","Interviews","Calendar","amber"), K("offersExtended","Offers Extended","Send","green") } }),

            new("hrms.overtime", "OvertimeRequest", "Overtime", "Overtime requests and compensation.", "hrms", "table", "/hrms/overtime", "Clock", "hrms.overtime.read",
            new DynamicPageSchemaDto { PageKey="hrms.overtime", EntityName="OvertimeRequest", Title="Overtime Management", SubTitle="Track, approve and compensate employee overtime hours.", ViewType="table", ApiEndpoint="/api/v1/hrms/overtime/requests",
                Columns=new(){ Col("employeeName","Employee",width:200), Col("date","Date","date",width:120), Col("hours","OT Hours","number",width:90), Col("reason","Reason",width:250), BadgeCol("status","Status","{\"Pending\":\"Pending\",\"Approved\":\"Approved\",\"Rejected\":\"Rejected\"}",110) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("Pending","Pending"),("Approved","Approved"),("Rejected","Rejected")), DF("date","Date") },
                Form=new(){ Sections=new(){ Sec("overtime","Details", F("employeeId","Employee","lookup",req:true), F("date","Overtime Date","date",req:true), F("hours","Hours","number",req:true), FSel("compensationType","Compensation",false,("Pay","Cash Payment"),("CompOff","Comp Off")), F("reason","Reason","textarea",span:2)) }},
                Actions=new(){ A("create","Add Request","primary","Plus"), A("approve","Approve","success","CheckCircle2"), A("reject","Reject","danger","XCircle"), A("export","Export","ghost","Download") } }),

            new("hrms.travel", "TravelRequest", "Travel Requests", "Business travel approvals and reimbursements.", "hrms", "table", "/hrms/travel", "Plane", "hrms.travel.read",
            new DynamicPageSchemaDto { PageKey="hrms.travel", EntityName="TravelRequest", Title="Travel Requests", SubTitle="Manage business travel approvals and expense reimbursements.", ViewType="table", ApiEndpoint="/api/v1/hrms/travel",
                Columns=new(){ Col("employeeName","Employee",width:200), Col("purpose","Purpose",width:250), Col("fromLocation","From",width:160), Col("toLocation","To",width:160), Col("travelDate","Travel Date","date",width:130), Col("estimatedAmount","Est. Amount","currency",width:130), BadgeCol("status","Status","{\"Pending\":\"Pending\",\"Approved\":\"Approved\",\"Rejected\":\"Rejected\",\"Completed\":\"Completed\"}",110) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("Pending","Pending"),("Approved","Approved"),("Rejected","Rejected"),("Completed","Completed")), DF("travelDate","Travel Date") },
                Form=new(){ Sections=new(){ Sec("travel","Details", F("employeeId","Employee","lookup",req:true), F("purpose","Purpose",req:true,span:2), F("fromLocation","From",req:true), F("toLocation","To",req:true), F("travelDate","Departure Date","date",req:true), F("returnDate","Return Date","date"), FSel("travelMode","Mode",false,("Air","Air"),("Train","Train"),("Road","Road")), F("estimatedAmount","Budget","currency")) }},
                Actions=new(){ A("create","Apply Travel","primary","Plus"), A("approve","Approve","success","CheckCircle2"), A("reject","Reject","danger","XCircle"), A("export","Export","ghost","Download") } }),

            new("hrms.lifecycle", "HrLifecycleTask", "Employee Lifecycle", "Lifecycle task tracking.", "hrms", "table", "/hrms/lifecycle", "GitBranch", "hrms.lifecycle.read",
            new DynamicPageSchemaDto { PageKey="hrms.lifecycle", EntityName="HrLifecycleTask", Title="Employee Lifecycle", SubTitle="Track all HR lifecycle events and task completion status.", ViewType="table", ApiEndpoint="/api/v1/hrms/lifecycle/tasks",
                Columns=new(){ Col("employeeName","Employee",width:200), Col("taskName","Task",width:220), Col("taskType","Phase",width:140), Col("dueDate","Due Date","date",width:120), Col("assignedToName","Assigned To",width:180), BadgeCol("status","Status","{\"Pending\":\"Pending\",\"InProgress\":\"In Progress\",\"Completed\":\"Completed\",\"Overdue\":\"Overdue\"}",120) },
                Filters=new(){ TF("search","Search"), SF("taskType","Phase",("Onboarding","Onboarding"),("Probation","Probation"),("Confirmation","Confirmation"),("Offboarding","Offboarding")), SF("status","Status",("Pending","Pending"),("InProgress","In Progress"),("Completed","Completed"),("Overdue","Overdue")) },
                Form=new(){ Sections=new(){ Sec("task","Task", F("employeeId","Employee","lookup",req:true), F("taskName","Task Name",req:true), FSel("taskType","Phase",req:true,("Onboarding","Onboarding"),("Probation","Probation"),("Confirmation","Confirmation"),("Offboarding","Offboarding")), F("assignedToId","Assigned To","lookup"), F("dueDate","Due Date","date"), FSel("status","Status",false,("Pending","Pending"),("InProgress","In Progress"),("Completed","Completed"))) }},
                Actions=new(){ A("create","Add Task","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2"), A("export","Export","ghost","Download") } }),

            new("hrms.onboarding", "Employee", "Onboarding", "New joiner onboarding tasks and checklist.", "hrms", "table", "/hrms/onboarding", "UserPlus", "hrms.onboarding.read",
            new DynamicPageSchemaDto { PageKey="hrms.onboarding", EntityName="Employee", Title="Onboarding", SubTitle="Track new joiner onboarding tasks and document collection.", ViewType="table", ApiEndpoint="/api/v1/hrms/employees?employmentType=Probation&status=Active",
                Columns=new(){ Col("employeeName","Employee",width:200), Col("employeeCode","Code",width:110), Col("designationName","Designation",width:180), Col("joiningDate","Join Date","date",width:130), Col("onboardingProgress","Progress","progress",width:140), BadgeCol("onboardingStatus","Status","{\"NotStarted\":\"Not Started\",\"InProgress\":\"In Progress\",\"Completed\":\"Completed\"}",120) },
                Filters=new(){ TF("search","Search"), SF("onboardingStatus","Status",("NotStarted","Not Started"),("InProgress","In Progress"),("Completed","Completed")) },
                Form=new(){ Sections=new() }, Actions=new(){ A("view","View","ghost","Eye"), A("export","Export","ghost","Download") } }),

            new("hrms.offboarding", "Employee", "Offboarding", "Exit clearance and F&F settlement.", "hrms", "table", "/hrms/offboarding", "UserMinus", "hrms.offboarding.read",
            new DynamicPageSchemaDto { PageKey="hrms.offboarding", EntityName="Employee", Title="Offboarding", SubTitle="Manage exit interviews, clearances, and full & final settlements.", ViewType="table", ApiEndpoint="/api/v1/hrms/employees?status=Terminated",
                Columns=new(){ Col("employeeName","Employee",width:200), Col("designationName","Designation",width:180), Col("lastWorkingDate","Last Working Day","date",width:150), Col("exitReason","Exit Reason",width:200), BadgeCol("offboardingStatus","Status","{\"Initiated\":\"Initiated\",\"InProgress\":\"In Progress\",\"Completed\":\"Completed\"}",120) },
                Filters=new(){ TF("search","Search"), SF("offboardingStatus","Status",("Initiated","Initiated"),("InProgress","In Progress"),("Completed","Completed")) },
                Form=new(){ Sections=new() }, Actions=new(){ A("view","View","ghost","Eye"), A("export","Export","ghost","Download") } }),

            new("hrms.performance", "PerformanceAppraisal", "Performance Management", "Appraisal cycles and reviews.", "hrms", "table", "/hrms/performance", "TrendingUp", "hrms.performance.read",
            new DynamicPageSchemaDto { PageKey="hrms.performance", EntityName="PerformanceAppraisal", Title="Performance Management", SubTitle="Appraisal cycles, KRA/KPI reviews, and ratings.", ViewType="table", ApiEndpoint="/api/v1/hrms/appraisals",
                Columns=new(){ Col("employeeName","Employee",width:200), Col("cycleName","Cycle",width:200), Col("reviewPeriod","Period",width:160), Col("selfRating","Self Rating","number",width:110), Col("managerRating","Manager Rating","number",width:130), Col("finalRating","Final Rating","number",width:120), BadgeCol("status","Status","{\"Draft\":\"Draft\",\"SelfReview\":\"Self Review\",\"ManagerReview\":\"Manager Review\",\"Completed\":\"Completed\"}",140) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("Draft","Draft"),("SelfReview","Self Review"),("ManagerReview","Manager Review"),("Completed","Completed")) },
                Form=new(){ Sections=new() }, Actions=new(){ A("view","View","ghost","Eye"), A("export","Export","ghost","Download") },
                Kpis=new(){ K("totalAppraisals","Total Reviews","Star","amber"), K("completed","Completed","CheckCircle2","green"), K("pending","Pending","Clock","orange") } }),

            new("hrms.training", "TrainingCourse", "Training & Development", "Courses, enrollments, and certifications.", "hrms", "table", "/hrms/training", "GraduationCap", "hrms.training.read",
            new DynamicPageSchemaDto { PageKey="hrms.training", EntityName="TrainingCourse", Title="Training & Development", SubTitle="Manage training courses, enrollments, and certificates.", ViewType="table", ApiEndpoint="/api/v1/hrms/training/courses",
                Columns=new(){ Col("name","Course Name",width:240), Col("category","Category",width:160), Col("duration","Duration (hrs)","number",width:110), Col("enrollmentCount","Enrolled","number",width:100), Col("startDate","Start Date","date",width:130), Col("endDate","End Date","date",width:130), BadgeCol("status","Status","{\"Active\":\"Active\",\"Completed\":\"Completed\",\"Cancelled\":\"Cancelled\"}",110) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("Active","Active"),("Completed","Completed"),("Cancelled","Cancelled")) },
                Form=new(){ Sections=new(){ Sec("course","Course", F("name","Course Name",req:true), F("category","Category"), F("description","Description","textarea",span:2), F("duration","Duration (hours)","number"), F("startDate","Start Date","date"), F("endDate","End Date","date"), F("trainerName","Trainer"), F("venue","Venue"), FSel("status","Status",false,("Active","Active"),("Completed","Completed"),("Cancelled","Cancelled"))) }},
                Actions=new(){ A("create","Add Course","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2"), A("export","Export","ghost","Download") } }),

            // ══════════ CROSS-MODULE ══════════
            new("approvals.pending", "ApprovalRequest", "My Approvals", "Pending approvals across all modules.", "approvals", "table", "/approvals", "CheckSquare", null,
            new DynamicPageSchemaDto { PageKey="approvals.pending", EntityName="ApprovalRequest", Title="Pending Approvals", SubTitle="Requests awaiting your action across all modules.", ViewType="table", ApiEndpoint="/api/v1/approvals",
                Columns=new(){ Col("referenceNumber","Reference #",width:140), Col("requestType","Type",width:160), Col("requestedByName","Requested By",width:180), Col("description","Description",width:280), Col("requestedAt","Requested On","datetime",width:160), BadgeCol("status","Status","{\"Pending\":\"Pending\",\"Approved\":\"Approved\",\"Rejected\":\"Rejected\"}",110) },
                Filters=new(){ SF("requestType","Type",("LeaveRequest","Leave"),("OvertimeRequest","Overtime"),("TravelRequest","Travel"),("ExpenseClaim","Expense")), SF("status","Status",("Pending","Pending"),("Approved","Approved"),("Rejected","Rejected")) },
                Form=new(){ Sections=new() }, Actions=new(){ A("view","View","ghost","Eye"), A("approve","Approve","success","CheckCircle2"), A("reject","Reject","danger","XCircle") },
                Kpis=new(){ K("pendingCount","Pending","Clock","amber"), K("overdueCount","Overdue","AlertTriangle","red") } }),

            new("expenses.claims", "ExpenseClaim", "Expense Claims", "Employee expense submissions and reimbursements.", "expenses", "table", "/expenses", "Receipt", "expenses.claims.read",
            new DynamicPageSchemaDto { PageKey="expenses.claims", EntityName="ExpenseClaim", Title="Expense Claims", SubTitle="Submit, review, and reimburse employee expense claims.", ViewType="table", ApiEndpoint="/api/v1/expenses",
                Columns=new(){ Col("referenceNumber","Claim #",width:120), Col("employeeName","Employee",width:200), Col("title","Description",width:250), Col("category","Category",width:140), Col("amount","Amount","currency",width:120), Col("date","Date","date",width:120), BadgeCol("status","Status","{\"Draft\":\"Draft\",\"Submitted\":\"Submitted\",\"Approved\":\"Approved\",\"Rejected\":\"Rejected\",\"Paid\":\"Paid\"}",110) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("Draft","Draft"),("Submitted","Submitted"),("Approved","Approved"),("Rejected","Rejected"),("Paid","Paid")), DF("from","From"), DF("to","To") },
                Form=new(){ Sections=new(){ Sec("claim","Expense", F("employeeId","Employee","lookup",req:true), F("title","Title",req:true,span:2), FSel("category","Category",req:true,("Travel","Travel"),("Meals","Meals"),("Accommodation","Accommodation"),("Fuel","Fuel"),("Other","Other")), F("amount","Amount","currency",req:true), F("date","Date","date",req:true), F("projectId","Project","lookup"), F("receiptUrl","Receipt","file"), F("notes","Notes","textarea",span:2)) }},
                Actions=new(){ A("create","Add Claim","primary","Plus"), A("approve","Approve","success","CheckCircle2"), A("reject","Reject","danger","XCircle"), A("export","Export","ghost","Download") } }),

            new("helpdesk.tickets", "HelpdeskTicket", "Support Tickets", "IT and HR helpdesk ticketing.", "helpdesk", "table", "/helpdesk/tickets", "Ticket", "helpdesk.tickets.read",
            new DynamicPageSchemaDto { PageKey="helpdesk.tickets", EntityName="HelpdeskTicket", Title="Support Tickets", SubTitle="Manage and resolve employee and customer support requests.", ViewType="table", ApiEndpoint="/api/v1/helpdesk/tickets",
                Columns=new(){ Col("ticketNumber","Ticket #",width:110), Col("subject","Subject",width:280), Col("requesterName","Requester",width:180), BadgeCol("priority","Priority","{\"Low\":\"Low\",\"Medium\":\"Medium\",\"High\":\"High\",\"Critical\":\"Critical\"}",100), Col("assignedToName","Assigned To",width:180), Col("slaDueAt","SLA Due","datetime",width:160), BadgeCol("status","Status","{\"Open\":\"Open\",\"InProgress\":\"In Progress\",\"Resolved\":\"Resolved\",\"Closed\":\"Closed\"}",110) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("Open","Open"),("InProgress","In Progress"),("Resolved","Resolved"),("Closed","Closed")), SF("priority","Priority",("Low","Low"),("Medium","Medium"),("High","High"),("Critical","Critical")) },
                Form=new(){ Sections=new(){ Sec("ticket","Ticket", F("subject","Subject",req:true,span:2), F("description","Description","rich-text",span:2), FSel("priority","Priority",req:true,("Low","Low"),("Medium","Medium"),("High","High"),("Critical","Critical")), F("category","Category"), F("assignedToId","Assign To","lookup")) }},
                Actions=new(){ A("create","New Ticket","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("view","View","ghost","Eye"), A("export","Export","ghost","Download") },
                Kpis=new(){ K("openTickets","Open","Ticket","red"), K("inProgressTickets","In Progress","RefreshCw","amber"), K("slaBreached","SLA Breached","AlertTriangle","red"), K("resolvedToday","Resolved Today","CheckCircle2","green") } }),

            new("compliance.dashboard", "ComplianceReport", "Compliance Dashboard", "PF, ESI, TDS, PT statutory compliance.", "compliance", "table", "/compliance", "ShieldCheck", "compliance.read",
            new DynamicPageSchemaDto { PageKey="compliance.dashboard", EntityName="ComplianceReport", Title="Compliance Dashboard", SubTitle="Statutory compliance: PF, ESI, TDS, Professional Tax, and GST.", ViewType="table", ApiEndpoint="/api/v1/compliance/reports",
                Columns=new(){ Col("period","Period",width:120), Col("complianceType","Type",width:140), Col("companyName","Entity",width:200), Col("dueDate","Due Date","date",width:120), Col("filingDate","Filed On","date",width:130), Col("amount","Amount","currency",width:130), BadgeCol("status","Status","{\"Pending\":\"Pending\",\"Filed\":\"Filed\",\"Overdue\":\"Overdue\"}",100) },
                Filters=new(){ SF("complianceType","Type",("PF","PF"),("ESI","ESI"),("TDS","TDS"),("PT","Professional Tax"),("GST","GST")), SF("status","Status",("Pending","Pending"),("Filed","Filed"),("Overdue","Overdue")) },
                Form=new(){ Sections=new() }, Actions=new(){ A("view","View","ghost","Eye"), A("export","Export","ghost","Download") },
                Kpis=new(){ K("pendingFilings","Pending Filings","Clock","amber"), K("overdueFilings","Overdue","AlertTriangle","red"), K("filedThisMonth","Filed (MTD)","CheckCircle2","green") } }),

            new("portal.dashboard", "Employee", "Employee Self Service", "Personal HR portal.", "portal", "split", "/portal", "User", null,
            new DynamicPageSchemaDto { PageKey="portal.dashboard", EntityName="Employee", Title="My Portal", SubTitle="Access your payslips, leaves, attendance, and personal details.", ViewType="split", ApiEndpoint="/api/v1/hrms/employees/me",
                Columns=new(), Filters=new(), Form=new(){ Sections=new() }, Actions=new(),
                Kpis=new(){ K("leaveBalance","Leave Balance","Calendar","green"), K("pendingClaims","Pending Claims","Receipt","amber"), K("lastPayslipNet","Last Net Pay","IndianRupee","blue") } }),

            new("tax.management", "TaxDeclaration", "Tax Management", "GST, TDS, and tax declarations.", "tax", "table", "/tax-management", "IndianRupee", "finance.tax.read",
            new DynamicPageSchemaDto { PageKey="tax.management", EntityName="TaxDeclaration", Title="Tax Management", SubTitle="Manage GST slabs, TDS configuration, and employee tax declarations.", ViewType="table", ApiEndpoint="/api/v1/hrms/payroll/tax-declarations",
                Columns=new(){ Col("employeeName","Employee",width:200), Col("financialYear","Financial Year",width:130), Col("regime","Tax Regime",width:140), Col("declaredInvestments","Declared Investments","currency",width:160), Col("projectedTax","Projected Tax","currency",width:140), BadgeCol("status","Status","{\"Draft\":\"Draft\",\"Submitted\":\"Submitted\",\"Approved\":\"Approved\"}",110) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("Draft","Draft"),("Submitted","Submitted"),("Approved","Approved")) },
                Form=new(){ Sections=new() }, Actions=new(){ A("view","View","ghost","Eye"), A("export","Export","ghost","Download") } }),

            // Frontend Key Aliases
            new("workflow.approvals", "ApprovalRequest", "Pending Approvals", "Requests awaiting your action.", "workflow", "table", "/approvals", "CheckSquare", null,
            new DynamicPageSchemaDto { PageKey="workflow.approvals", EntityName="ApprovalRequest", Title="Pending Approvals", SubTitle="Requests awaiting your action across all modules.", ViewType="table", ApiEndpoint="/api/v1/approvals",
                Columns=new(){ Col("referenceNumber","Reference #",width:140), Col("requestType","Type",width:160), Col("requestedByName","Requested By",width:180), Col("description","Description",width:280), Col("requestedAt","Requested On","datetime",width:160), BadgeCol("status","Status","{\"Pending\":\"Pending\",\"Approved\":\"Approved\",\"Rejected\":\"Rejected\"}",110) },
                Filters=new(){ SF("requestType","Type",("LeaveRequest","Leave"),("OvertimeRequest","Overtime"),("TravelRequest","Travel"),("ExpenseClaim","Expense")), SF("status","Status",("Pending","Pending"),("Approved","Approved"),("Rejected","Rejected")) },
                Form=new(){ Sections=new() }, Actions=new(){ A("view","View","ghost","Eye"), A("approve","Approve","success","CheckCircle2"), A("reject","Reject","danger","XCircle") } }),

            new("finance.expenses", "ExpenseClaim", "Expense Claims", "Employee expense claims.", "finance", "table", "/expenses", "Receipt", "expenses.claims.read",
            new DynamicPageSchemaDto { PageKey="finance.expenses", EntityName="ExpenseClaim", Title="Expense Claims", SubTitle="Submit, review, and reimburse employee expense claims.", ViewType="table", ApiEndpoint="/api/v1/expenses",
                Columns=new(){ Col("claimNumber","Claim #",width:120), Col("employeeName","Employee",width:200), Col("title","Title",width:250), Col("category","Category",width:140), Col("amount","Amount","currency",width:120), Col("expenseDate","Date","date",width:120), BadgeCol("status","Status","{\"Draft\":\"Draft\",\"Submitted\":\"Submitted\",\"Approved\":\"Approved\",\"Rejected\":\"Rejected\",\"Paid\":\"Paid\"}",110) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("Draft","Draft"),("Submitted","Submitted"),("Approved","Approved"),("Rejected","Rejected"),("Paid","Paid")) },
                Form=new(){ Sections=new(){ Sec("claim","Expense", F("employeeId","Employee","lookup",req:true), F("title","Title",req:true,span:2), FSel("category","Category",req:true,("Travel","Travel"),("Meals","Meals"),("Accommodation","Accommodation"),("Fuel","Fuel"),("Other","Other")), F("amount","Amount","currency",req:true), F("date","Date","date",req:true)) }},
                Actions=new(){ A("create","Add Claim","primary","Plus"), A("export","Export","ghost","Download") } }),

            new("compliance.statutory", "ComplianceReport", "Statutory Compliance", "PF, ESI, TDS, PT statutory compliance.", "compliance", "table", "/compliance", "ShieldCheck", "compliance.read",
            new DynamicPageSchemaDto { PageKey="compliance.statutory", EntityName="ComplianceReport", Title="Statutory Compliance", SubTitle="Statutory compliance reports and challans.", ViewType="table", ApiEndpoint="/api/v1/compliance/reports",
                Columns=new(){ Col("period","Period",width:120), Col("complianceType","Type",width:140), Col("companyName","Entity",width:200), Col("dueDate","Due Date","date",width:120), Col("filingDate","Filed On","date",width:130), Col("amount","Amount","currency",width:130), BadgeCol("status","Status","{\"Pending\":\"Pending\",\"Filed\":\"Filed\",\"Overdue\":\"Overdue\"}",100) },
                Filters=new(){ SF("complianceType","Type",("PF","PF"),("ESI","ESI"),("TDS","TDS"),("PT","Professional Tax"),("GST","GST")), SF("status","Status",("Pending","Pending"),("Filed","Filed"),("Overdue","Overdue")) },
                Form=new(){ Sections=new() }, Actions=new(){ A("view","View","ghost","Eye"), A("export","Export","ghost","Download") } }),

            new("finance.tax-management", "TaxDeclaration", "Tax Management", "GST slabs and employee tax declarations.", "finance", "table", "/tax-management", "IndianRupee", "finance.tax.read",
            new DynamicPageSchemaDto { PageKey="finance.tax-management", EntityName="TaxDeclaration", Title="Tax Management", SubTitle="Manage GST slabs, TDS configuration, and employee tax declarations.", ViewType="table", ApiEndpoint="/api/v1/payroll/tax-declarations",
                Columns=new(){ Col("employeeName","Employee",width:200), Col("financialYear","Financial Year",width:130), Col("section80C_Total","80C Total","currency",width:140), Col("section80D_Total","80D Total","currency",width:140), Col("rentPaid","Rent Paid","currency",width:130), BadgeCol("status","Status","{\"Declared\":\"Declared\",\"ProofSubmitted\":\"Proof Submitted\",\"Verified\":\"Verified\"}",120) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("Declared","Declared"),("ProofSubmitted","Proof Submitted"),("Verified","Verified")) },
                Form=new(){ Sections=new() }, Actions=new(){ A("view","View","ghost","Eye"), A("export","Export","ghost","Download") } }),

            new("hrms.employee-self-service", "Employee", "Employee Self Service", "Personal HR portal.", "hrms", "split", "/employee-self-service", "User", null,
            new DynamicPageSchemaDto { PageKey="hrms.employee-self-service", EntityName="Employee", Title="Employee Self Service", SubTitle="Access your payslips, leaves, attendance, and personal details.", ViewType="split", ApiEndpoint="/api/v1/portal/dashboard",
                Columns=new(), Filters=new(), Form=new(){ Sections=new() }, Actions=new(),
                Kpis=new(){ K("leaveBalance","Leave Balance","Calendar","green"), K("pendingClaims","Pending Claims","Receipt","amber"), K("lastPayslipNet","Last Net Pay","IndianRupee","blue") } }),

            // Dedicated Payroll Sub-module Schemas
            new("payroll.runs", "PayrollRun", "Payroll Runs", "Monthly salary batch processing.", "payroll", "table", "/payroll/runs", "PlayCircle", "payroll.runs.read",
            new DynamicPageSchemaDto { PageKey="payroll.runs", EntityName="PayrollRun", Title="Payroll Runs", SubTitle="Run, review, and complete monthly payroll cycles.", ViewType="table", ApiEndpoint="/api/v1/payroll/runs",
                Columns=new(){ Col("id","Run ID",width:120), Col("runDate","Run Date","date",width:140), BadgeCol("status","Status","{\"Draft\":\"Draft\",\"Processing\":\"Processing\",\"Completed\":\"Completed\"}",110), Col("createdAt","Created At","datetime",width:160) },
                Filters=new(){ SF("status","Status",("Draft","Draft"),("Processing","Processing"),("Completed","Completed")) },
                Form=new(){ Sections=new(){ Sec("run","Payroll Run", F("companyId","Company","lookup"), F("runDate","Run Date","date",req:true)) }},
                Actions=new(){ A("create","New Payroll Run","primary","Plus"), A("view","View Payslips","ghost","Eye"), A("export","Export Bank File","secondary","FileText") } }),

            new("payroll.payslips", "Payslip", "Payslips", "Generated employee salary payslips.", "payroll", "table", "/payroll/payslips", "FileText", "payroll.payslips.read",
            new DynamicPageSchemaDto { PageKey="payroll.payslips", EntityName="Payslip", Title="Payslips", SubTitle="View and download individual and bulk monthly payslips.", ViewType="table", ApiEndpoint="/api/v1/payroll/payslips",
                Columns=new(){ Col("employeeCode","Code",width:110), Col("employeeName","Employee",width:200), Col("month","Month","number",width:90), Col("year","Year","number",width:90), Col("gross","Gross Salary","currency",width:130), Col("totalDeductions","Deductions","currency",width:130), Col("net","Net Salary","currency",width:130), BadgeCol("status","Status","{\"Generated\":\"Generated\",\"Draft\":\"Draft\"}",110) },
                Filters=new(){ TF("search","Search"), SF("month","Month",("1","Jan"),("2","Feb"),("3","Mar"),("4","Apr"),("5","May"),("6","Jun"),("7","Jul"),("8","Aug"),("9","Sep"),("10","Oct"),("11","Nov"),("12","Dec")), SF("year","Year",("2025","2025"),("2026","2026"),("2027","2027")) },
                Form=new(){ Sections=new() },
                Actions=new(){ A("download","Download PDF","primary","Download"), A("export","Export CSV","ghost","Download") } }),

            new("payroll.structures", "PayrollStructure", "Payroll Structures Master", "Compensation templates and salary grades.", "payroll", "table", "/payroll/structures", "Sliders", "payroll.structures.read",
            new DynamicPageSchemaDto { PageKey="payroll.structures", EntityName="PayrollStructure", Title="Payroll Structures Master", SubTitle="Define base salary templates, formulas, and allowances.", ViewType="table", ApiEndpoint="/api/v1/payroll/structures",
                Columns=new(){ Col("name","Structure Name",width:220), Col("description","Description",width:260), Col("effectiveFrom","Effective From","date",width:140), Col("isDefault","Default","boolean",width:100), Col("createdAt","Created","datetime",width:140) },
                Filters=new(){ TF("search","Search") },
                Form=new(){ Sections=new(){ Sec("struct","Structure", F("name","Name",req:true), F("description","Description","textarea",span:2), F("effectiveFrom","Effective From","date",req:true), F("isDefault","Default Template","boolean")) }},
                Actions=new(){ A("create","Add Structure","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("payroll.loans", "PayrollLoan", "Employee Loans & Advances", "Disbursed loans and monthly EMI deductions.", "payroll", "table", "/payroll/loans", "CreditCard", "payroll.loans.read",
            new DynamicPageSchemaDto { PageKey="payroll.loans", EntityName="PayrollLoan", Title="Employee Loans & Advances", SubTitle="Manage loan disbursement and automatic payroll EMI recovery.", ViewType="table", ApiEndpoint="/api/v1/payroll/loans",
                Columns=new(){ Col("employeeCode","Code",width:110), Col("employeeName","Employee",width:200), Col("loanType","Type",width:140), Col("principalAmount","Principal","currency",width:130), Col("outstandingAmount","Outstanding","currency",width:130), Col("emiAmount","Monthly EMI","currency",width:120), BadgeCol("status","Status","{\"Pending\":\"Pending\",\"Active\":\"Active\",\"Closed\":\"Closed\"}",110) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("Pending","Pending"),("Active","Active"),("Closed","Closed")) },
                Form=new(){ Sections=new(){ Sec("loan","Loan", F("employeeId","Employee","lookup",req:true), FSel("loanType","Loan Type",req:true,("Personal Loan","Personal Loan"),("Salary Advance","Salary Advance"),("Emergency Loan","Emergency Loan")), F("principalAmount","Principal Amount","currency",req:true), F("emiAmount","Monthly EMI","currency",req:true), F("totalInstallments","Tenure (Months)","number",req:true), F("disbursementDate","Disbursement Date","date",req:true), F("purpose","Purpose","textarea",span:2)) }},
                Actions=new(){ A("create","Apply Loan","primary","Plus"), A("approve","Approve","success","CheckCircle2"), A("export","Export","ghost","Download") } }),

            new("payroll.bonus", "PayrollBonus", "Bonuses & Variable Pay", "One-time incentives and performance bonuses.", "payroll", "table", "/payroll/bonus", "Award", "payroll.bonus.read",
            new DynamicPageSchemaDto { PageKey="payroll.bonus", EntityName="PayrollBonus", Title="Bonuses & Variable Pay", SubTitle="Track performance bonuses and incentives for disbursement.", ViewType="table", ApiEndpoint="/api/v1/payroll/bonuses",
                Columns=new(){ Col("employeeCode","Code",width:110), Col("employeeName","Employee",width:200), Col("bonusType","Bonus Type",width:180), Col("amount","Amount","currency",width:130), Col("paymentMonth","Payment Period",width:140), BadgeCol("status","Status","{\"Pending\":\"Pending\",\"Approved\":\"Approved\",\"Paid\":\"Paid\"}",110) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("Pending","Pending"),("Approved","Approved"),("Paid","Paid")) },
                Form=new(){ Sections=new(){ Sec("bonus","Bonus", F("employeeId","Employee","lookup",req:true), FSel("bonusType","Type",req:true,("Performance Bonus","Performance Bonus"),("Festival Bonus","Festival Bonus"),("Retention Bonus","Retention Bonus"),("Annual Incentive","Annual Incentive")), F("amount","Amount","currency",req:true), F("paymentMonth","Payment Month (YYYY-MM)",req:true), F("remarks","Remarks","textarea",span:2)) }},
                Actions=new(){ A("create","Add Bonus","primary","Plus"), A("approve","Approve","success","CheckCircle2"), A("export","Export","ghost","Download") } }),

            new("payroll.arrears", "PayrollArrear", "Salary Arrears", "Retroactive pay adjustments and increment dues.", "payroll", "table", "/payroll/arrears", "Clock", "payroll.arrears.read",
            new DynamicPageSchemaDto { PageKey="payroll.arrears", EntityName="PayrollArrear", Title="Salary Arrears", SubTitle="Manage back-pay and retroactive salary adjustments.", ViewType="table", ApiEndpoint="/api/v1/payroll/arrears",
                Columns=new(){ Col("employeeCode","Code",width:110), Col("employeeName","Employee",width:200), Col("period","Arrear Period",width:140), Col("amount","Arrear Amount","currency",width:130), Col("reason","Reason",width:220), BadgeCol("status","Status","{\"Pending\":\"Pending\",\"Approved\":\"Approved\",\"Processed\":\"Processed\"}",110) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("Pending","Pending"),("Approved","Approved"),("Processed","Processed")) },
                Form=new(){ Sections=new(){ Sec("arrear","Arrear", F("employeeId","Employee","lookup",req:true), F("period","Period (e.g. 2026-01)",req:true), F("amount","Amount","currency",req:true), F("reason","Reason",req:true,span:2)) }},
                Actions=new(){ A("create","Add Arrear","primary","Plus"), A("approve","Approve","success","CheckCircle2"), A("process","Process in Payroll","secondary","Play") } }),

            new("payroll.final-settlement", "PayrollFinalSettlement", "Full & Final Settlement", "Exit clearances and separation payouts.", "payroll", "table", "/payroll/final-settlement", "UserMinus", "payroll.settlements.read",
            new DynamicPageSchemaDto { PageKey="payroll.final-settlement", EntityName="PayrollFinalSettlement", Title="Full & Final Settlement", SubTitle="Gratuity, leave encashment, notice period pay, and deductions.", ViewType="table", ApiEndpoint="/api/v1/payroll/settlements",
                Columns=new(){ Col("employeeName","Employee",width:200), Col("exitDate","Exit Date","date",width:130), Col("gratuity","Gratuity","currency",width:130), Col("leaveEncashment","Leave Encashment","currency",width:140), Col("otherDues","Other Dues","currency",width:120), Col("recoveries","Recoveries","currency",width:120), Col("netPayable","Net Settlement","currency",width:140), BadgeCol("status","Status","{\"Draft\":\"Draft\",\"PendingApproval\":\"Pending Approval\",\"Approved\":\"Approved\",\"Settled\":\"Settled\"}",130) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("Draft","Draft"),("PendingApproval","Pending Approval"),("Approved","Approved"),("Settled","Settled")) },
                Form=new(){ Sections=new(){ Sec("settlement","Settlement", F("employeeId","Employee","lookup",req:true), F("exitDate","Exit Date","date",req:true), F("gratuity","Gratuity","currency"), F("leaveEncashment","Leave Encashment","currency"), F("otherDues","Other Dues","currency"), F("recoveries","Recoveries","currency"), F("remarks","Remarks","textarea",span:2)) }},
                Actions=new(){ A("create","Initiate F&F","primary","Plus"), A("settle","Mark Settled","success","CheckCheck"), A("export","Export Statement","ghost","Download") } }),

            // ══════════ FINANCE MODULE ══════════
            new("finance.chart-of-accounts", "AccountMaster", "Chart of Accounts Master", "Ledger accounts, classifications, and current balances.", "finance", "table", "/finance/chart-of-accounts", "BookOpen", "finance.accounts.read",
            new DynamicPageSchemaDto { PageKey="finance.chart-of-accounts", EntityName="AccountMaster", Title="Chart of Accounts Master", SubTitle="Manage general ledger accounts, classifications, hierarchies, and real-time balances.", ViewType="table", ApiEndpoint="/api/v1/finance/accounts",
                Columns=new(){ Col("accountCode","Account Code",width:130), Col("accountName","Account Name",width:240), BadgeCol("accountType","Type","{\"Asset\":\"Asset\",\"Liability\":\"Liability\",\"Equity\":\"Equity\",\"Revenue\":\"Revenue\",\"Expense\":\"Expense\"}",120), Col("category","Category",width:160), Col("currentBalance","Current Balance","currency",width:140), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search account code or name"), SF("accountType","Type",("Asset","Asset"),("Liability","Liability"),("Equity","Equity"),("Revenue","Revenue"),("Expense","Expense")), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("account","Account Details", F("accountCode","Account Code",req:true), F("accountName","Account Name",req:true), FSel("accountType","Account Type",req:true,("Asset","Asset"),("Liability","Liability"),("Equity","Equity"),("Revenue","Revenue"),("Expense","Expense")), F("category","Category / Group",req:true), F("parentAccountId","Parent Account","lookup"), F("description","Description","textarea",span:2), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","New Account","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("export","Export COA","ghost","Download") } }),

            new("finance.journal-entries", "JournalEntry", "Journal Entries", "General ledger double-entry bookkeeping vouchers.", "finance", "table", "/finance/journal-entries", "Receipt", "finance.journals.read",
            new DynamicPageSchemaDto { PageKey="finance.journal-entries", EntityName="JournalEntry", Title="Journal Entries", SubTitle="Record and audit double-entry debit and credit journal vouchers.", ViewType="table", ApiEndpoint="/api/v1/finance/journal-entries",
                Columns=new(){ Col("entryNumber","Voucher #",width:140), Col("entryDate","Date","date",width:120), Col("referenceNumber","Reference",width:140), Col("totalDebit","Total Debit","currency",width:130), Col("totalCredit","Total Credit","currency",width:130), BadgeCol("status","Status","{\"Draft\":\"Draft\",\"Posted\":\"Posted\",\"Void\":\"Void\"}",110) },
                Filters=new(){ TF("search","Search voucher # or ref"), SF("status","Status",("Draft","Draft"),("Posted","Posted"),("Void","Void")), DF("fromDate","From"), DF("toDate","To") },
                Form=new(){ Sections=new(){ Sec("voucher","Journal Voucher", F("entryNumber","Voucher Number",req:true), F("entryDate","Date","date",req:true), F("referenceNumber","Reference #"), F("narration","Narration / Memo","textarea",span:2)) }},
                Actions=new(){ A("create","Post Entry","primary","Plus"), A("view","View Voucher","ghost","Eye"), A("export","Export CSV","ghost","Download") } }),

            new("finance.accounting-periods", "FiscalPeriod", "Accounting Periods", "Financial years, quarters, and accounting lock periods.", "finance", "table", "/finance/accounting-periods", "Calendar", "finance.periods.read",
            new DynamicPageSchemaDto { PageKey="finance.accounting-periods", EntityName="FiscalPeriod", Title="Accounting Periods", SubTitle="Manage financial calendar years, open/closed periods, and month-end locks.", ViewType="table", ApiEndpoint="/api/v1/finance/fiscal-periods",
                Columns=new(){ Col("periodName","Period",width:180), Col("startDate","Start Date","date",width:130), Col("endDate","End Date","date",width:130), BadgeCol("status","Status","{\"Open\":\"Open\",\"Closed\":\"Closed\",\"Locked\":\"Locked\"}",110), Col("isCurrent","Current FY","boolean",width:110) },
                Filters=new(){ TF("search","Search period"), SF("status","Status",("Open","Open"),("Closed","Closed"),("Locked","Locked")) },
                Form=new(){ Sections=new(){ Sec("period","Period Details", F("periodName","Period Name",req:true), F("startDate","Start Date","date",req:true), F("endDate","End Date","date",req:true), FSel("status","Status",req:true,("Open","Open"),("Closed","Closed"),("Locked","Locked")), F("isCurrent","Current Financial Year","boolean")) }},
                Actions=new(){ A("create","Open Period","primary","Plus"), A("edit","Edit Period","secondary","Pencil") } }),

            new("finance.bank-reconciliation", "BankReconciliation", "Bank Reconciliation", "Reconcile bank statements against ledger entries.", "finance", "table", "/finance/bank-reconciliation", "Building", "finance.reconciliation.read",
            new DynamicPageSchemaDto { PageKey="finance.bank-reconciliation", EntityName="BankReconciliation", Title="Bank Reconciliation", SubTitle="Match statement transactions with book ledgers and clear differences.", ViewType="table", ApiEndpoint="/api/v1/finance/bank-reconciliation",
                Columns=new(){ Col("accountName","Bank Account",width:200), Col("statementDate","Statement Date","date",width:130), Col("bankBalance","Statement Balance","currency",width:140), Col("bookBalance","Book Balance","currency",width:140), Col("difference","Variance","currency",width:120), BadgeCol("status","Status","{\"Reconciled\":\"Reconciled\",\"InProgress\":\"In Progress\",\"Discrepancy\":\"Discrepancy\"}",120) },
                Filters=new(){ TF("search","Search account"), SF("status","Status",("Reconciled","Reconciled"),("InProgress","In Progress"),("Discrepancy","Discrepancy")) },
                Form=new(){ Sections=new(){ Sec("reconcile","Statement Import", F("bankAccountId","Bank Account","lookup",req:true), F("statementDate","Statement Date","date",req:true), F("bankBalance","Bank Statement Balance","currency",req:true), F("statementFile","Upload Bank Statement (CSV)","file"), F("notes","Notes","textarea",span:2)) }},
                Actions=new(){ A("create","New Reconciliation","primary","Plus"), A("view","Match Entries","secondary","CheckCheck"), A("export","Export Audit","ghost","Download") } }),

            new("finance.budgeting", "BudgetDefinition", "Budgeting & Allocations", "Corporate departmental budgets and variance tracking.", "finance", "table", "/finance/budgeting", "PieChart", "finance.budgeting.read",
            new DynamicPageSchemaDto { PageKey="finance.budgeting", EntityName="BudgetDefinition", Title="Budgeting & Allocations", SubTitle="Define departmental cost allocations, monitor utilization, and control overages.", ViewType="table", ApiEndpoint="/api/v1/finance/budgets",
                Columns=new(){ Col("fiscalYear","Financial Year",width:130), Col("departmentName","Department",width:180), Col("totalBudget","Allocated Budget","currency",width:140), Col("utilizedAmount","Utilized","currency",width:130), Col("variance","Remaining","currency",width:130), BadgeCol("status","Status","{\"Active\":\"Active\",\"Draft\":\"Draft\",\"Exceeded\":\"Exceeded\"}",110) },
                Filters=new(){ TF("search","Search"), SF("status","Status",("Active","Active"),("Draft","Draft"),("Exceeded","Exceeded")) },
                Form=new(){ Sections=new(){ Sec("budget","Budget Allocation", F("fiscalYear","Financial Year (e.g. 2026-2027)",req:true), F("departmentId","Department","lookup",req:true), F("costCenterId","Cost Center","lookup"), F("totalBudget","Total Budget Cap","currency",req:true), F("notes","Allocation Remarks","textarea",span:2)) }},
                Actions=new(){ A("create","Allocate Budget","primary","Plus"), A("edit","Revise Budget","secondary","Pencil"), A("export","Export","ghost","Download") } }),

            new("finance.consolidation", "FinancialConsolidation", "Financial Consolidation", "Multi-entity balance sheet and P&L group consolidation.", "finance", "table", "/finance/consolidation", "FolderGit2", "finance.consolidation.read",
            new DynamicPageSchemaDto { PageKey="finance.consolidation", EntityName="FinancialConsolidation", Title="Financial Consolidation", SubTitle="Consolidate trial balances, inter-company eliminations, and group statements.", ViewType="table", ApiEndpoint="/api/v1/finance/consolidation",
                Columns=new(){ Col("groupName","Consolidation Group",width:220), Col("period","Period",width:140), Col("entityCount","Entities Consolidated","number",width:160), Col("consolidatedAt","Generated On","datetime",width:160), BadgeCol("status","Status","{\"Completed\":\"Completed\",\"Processing\":\"Processing\",\"Failed\":\"Failed\"}",110) },
                Filters=new(){ TF("search","Search group") },
                Form=new(){ Sections=new(){ Sec("group","Run Consolidation", F("groupName","Group Label",req:true), F("period","Consolidation Period",req:true), F("notes","Elimination Notes","textarea",span:2)) }},
                Actions=new(){ A("create","Run Consolidation","primary","Play"), A("export","Export Statement","ghost","Download") } }),

            new("finance.gst", "GstReturn", "GST Filings & Returns", "GSTR-1, GSTR-3B statutory tax filings and reconciliations.", "finance", "table", "/finance/gst", "FileCheck", "finance.gst.read",
            new DynamicPageSchemaDto { PageKey="finance.gst", EntityName="GstReturn", Title="GST Filings & Returns", SubTitle="Track outward supplies (GSTR-1), summary tax (GSTR-3B), and input tax credit (ITC).", ViewType="table", ApiEndpoint="/api/v1/finance/gst",
                Columns=new(){ Col("returnPeriod","Return Period",width:130), Col("gstin","GSTIN",width:160), Col("returnType","Form",width:120), Col("taxableValue","Taxable Value","currency",width:140), Col("igst","IGST","currency",width:120), Col("cgst","CGST","currency",width:110), Col("sgst","SGST","currency",width:110), BadgeCol("status","Status","{\"Filed\":\"Filed\",\"Pending\":\"Pending\",\"Overdue\":\"Overdue\"}",110) },
                Filters=new(){ TF("search","Search GSTIN"), SF("returnType","Form",("GSTR-1","GSTR-1"),("GSTR-3B","GSTR-3B"),("GSTR-9","GSTR-9 Annual")), SF("status","Status",("Filed","Filed"),("Pending","Pending"),("Overdue","Overdue")) },
                Form=new(){ Sections=new() },
                Actions=new(){ A("generate","Generate JSON","primary","FileText"), A("export","Export Excel","ghost","Download") } }),

            new("finance.pnl", "FinancialReport", "Profit & Loss / Financials", "Income statement, gross margins, and net profit analytics.", "finance", "table", "/reports/financial/pnl", "TrendingUp", "finance.reports.read",
            new DynamicPageSchemaDto { PageKey="finance.pnl", EntityName="FinancialReport", Title="Profit & Loss Statement", SubTitle="Comprehensive income statement, operational expenses, EBIT, and net margins.", ViewType="table", ApiEndpoint="/api/v1/finance/reports/pnl",
                Columns=new(){ Col("period","Reporting Period",width:140), Col("revenue","Gross Revenue","currency",width:140), Col("cogs","Cost of Goods Sold (COGS)","currency",width:150), Col("grossProfit","Gross Margin","currency",width:140), Col("operatingExpenses","Operating Exp (OPEX)","currency",width:150), Col("netProfit","Net Profit","currency",width:140) },
                Filters=new(){ DF("from","Start Date"), DF("to","End Date") },
                Form=new(){ Sections=new() },
                Actions=new(){ A("export","Export Financial PDF","primary","Download"), A("exportCsv","Export Raw CSV","ghost","Download") } }),

            // ══════════ INVENTORY MODULE ══════════
            new("inventory.items", "ItemMaster", "Item Master", "SKU catalog, pricing tiers, reorder triggers, and HSN codes.", "inventory", "table", "/inventory/items", "Box", "inventory.items.read",
            new DynamicPageSchemaDto { PageKey="inventory.items", EntityName="ItemMaster", Title="Item Master", SubTitle="SKU catalog, valuation methods (FIFO/Weighted Avg), reorder thresholds, and HSN statutory codes.", ViewType="table", ApiEndpoint="/api/v1/inventory/items",
                Columns=new(){ Col("code","Item Code",width:120), Col("name","Item Name",width:240), Col("sku","SKU",width:130), Col("category","Category",width:150), Col("unitOfMeasure","UOM",width:90), Col("costPrice","Standard Cost","currency",width:130), Col("sellingPrice","Sale Price","currency",width:130), Col("reorderLevel","Reorder Qty","number",width:110), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search item code, SKU, or name"), TF("category","Category"), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("item","Item Identity", F("code","Item Code",req:true), F("name","Item Name",req:true), F("sku","SKU Barcode",req:true), F("category","Category"), F("unitOfMeasure","Unit of Measure (e.g. NOS, KG, LTR)",req:true)), Sec("pricing","Pricing & Replenishment", F("costPrice","Standard Cost Price","currency",req:true), F("sellingPrice","Default Selling Price","currency",req:true), F("reorderLevel","Reorder Threshold","number"), F("hsnCode","HSN Statutory Code"), F("isActive","Active Item","boolean")) }},
                Actions=new(){ A("create","Add Item","primary","Plus"), A("edit","Edit Item","secondary","Pencil"), A("delete","Delete","danger","Trash2"), A("export","Export Catalog","ghost","Download") } }),

            new("inventory.stock-movements", "StockMovement", "Stock Movements & Ledger", "Real-time ledger of all inbound, outbound, and internal transfers.", "inventory", "table", "/stock-movements", "ArrowLeftRight", "inventory.movements.read",
            new DynamicPageSchemaDto { PageKey="inventory.stock-movements", EntityName="StockMovement", Title="Stock Movements & Ledger", SubTitle="Audit trail of receipts, dispatches, adjustments, and bin transfers.", ViewType="table", ApiEndpoint="/api/v1/inventory/stock-movements",
                Columns=new(){ Col("movementNumber","Movement #",width:140), Col("movementDate","Date","datetime",width:150), Col("itemCode","Item Code",width:120), Col("itemName","Item Name",width:200), BadgeCol("movementType","Type","{\"Inward\":\"Inward\",\"Outward\":\"Outward\",\"Transfer\":\"Transfer\",\"Adjustment\":\"Adjustment\"}",110), Col("quantity","Qty","number",width:90), Col("unitOfMeasure","UOM",width:80), Col("warehouseName","Warehouse",width:160) },
                Filters=new(){ TF("search","Search movement # or item"), SF("movementType","Type",("Inward","Inward"),("Outward","Outward"),("Transfer","Transfer"),("Adjustment","Adjustment")), DF("from","From"), DF("to","To") },
                Form=new(){ Sections=new() },
                Actions=new(){ A("export","Export Stock Ledger","ghost","Download") } }),

            new("inventory.warehouses", "Warehouse", "Warehouse Master", "Storage depots, bin locations, and inventory holding centers.", "inventory", "table", "/inventory/warehouses", "Building2", "inventory.warehouses.read",
            new DynamicPageSchemaDto { PageKey="inventory.warehouses", EntityName="Warehouse", Title="Warehouse Master", SubTitle="Physical locations, storage racks, receiving zones, and dispatch bays.", ViewType="table", ApiEndpoint="/api/v1/inventory/warehouses",
                Columns=new(){ Col("code","Warehouse Code",width:130), Col("name","Warehouse Name",width:220), Col("branchName","Branch",width:180), Col("city","City",width:140), Col("capacity","Capacity (Sq.Ft)","number",width:140), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search warehouse"), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("wh","Warehouse Profile", F("code","Warehouse Code",req:true), F("name","Warehouse Name",req:true), F("branchId","Assigned Branch","lookup",req:true), F("address","Address",span:2), F("city","City"), F("capacity","Capacity Area","number"), F("isActive","Active Depot","boolean")) }},
                Actions=new(){ A("create","Add Warehouse","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("inventory.adjustments", "StockAdjustment", "Stock Adjustments", "Physical audit discrepancies, scrap write-offs, and stock corrections.", "inventory", "table", "/inventory-adjustments", "SlidersHorizontal", "inventory.adjustments.read",
            new DynamicPageSchemaDto { PageKey="inventory.adjustments", EntityName="StockAdjustment", Title="Stock Adjustments", SubTitle="Reconcile stock count variances, scrap write-offs, and physical audit adjustments.", ViewType="table", ApiEndpoint="/api/v1/inventory/adjustments",
                Columns=new(){ Col("adjustmentNumber","Adjustment #",width:140), Col("adjustmentDate","Date","date",width:130), Col("warehouseName","Warehouse",width:180), Col("reason","Reason Code",width:180), BadgeCol("status","Status","{\"Draft\":\"Draft\",\"Approved\":\"Approved\",\"Applied\":\"Applied\"}",110) },
                Filters=new(){ TF("search","Search adjustment #"), SF("status","Status",("Draft","Draft"),("Approved","Approved"),("Applied","Applied")) },
                Form=new(){ Sections=new(){ Sec("adj","Adjustment Entry", F("warehouseId","Warehouse","lookup",req:true), F("adjustmentDate","Date","date",req:true), FSel("reason","Reason",req:true,("PhysicalAudit","Physical Count Audit"),("Damaged","Damaged Goods / Scrap"),("Expiry","Expired Material"),("Correction","System Correction")), F("notes","Justification Notes","textarea",span:2)) }},
                Actions=new(){ A("create","New Adjustment","primary","Plus"), A("approve","Approve & Apply","success","CheckCircle2") } }),

            new("inventory.transfers", "StockTransfer", "Inventory Transfers", "Inter-warehouse transit orders, dispatches, and receiving acknowledgments.", "inventory", "table", "/inventory-transfers", "Truck", "inventory.transfers.read",
            new DynamicPageSchemaDto { PageKey="inventory.transfers", EntityName="StockTransfer", Title="Inventory Transfers", SubTitle="Transfer stock between warehouses, depots, and fabrication sites with in-transit tracking.", ViewType="table", ApiEndpoint="/api/v1/inventory/transfers",
                Columns=new(){ Col("transferNumber","Transfer #",width:140), Col("fromWarehouseName","Source Warehouse",width:180), Col("toWarehouseName","Destination Warehouse",width:180), Col("transferDate","Date","date",width:130), BadgeCol("status","Status","{\"Draft\":\"Draft\",\"InTransit\":\"In Transit\",\"Received\":\"Received\",\"Cancelled\":\"Cancelled\"}",120) },
                Filters=new(){ TF("search","Search transfer #"), SF("status","Status",("Draft","Draft"),("InTransit","In Transit"),("Received","Received")) },
                Form=new(){ Sections=new(){ Sec("xfer","Transfer Order", F("fromWarehouseId","Source Warehouse","lookup",req:true), F("toWarehouseId","Destination Warehouse","lookup",req:true), F("transferDate","Dispatch Date","date",req:true), F("remarks","Transit Notes","textarea",span:2)) }},
                Actions=new(){ A("create","Dispatch Transfer","primary","Plus"), A("receive","Receive Goods","success","CheckCheck") } }),

            new("inventory.warehouse-management", "WarehouseBin", "Warehouse Management (WMS)", "Bin locations, pick/pack zones, and slotting topology.", "inventory", "table", "/inventory/warehouse-management", "Grid", "inventory.warehouses.read",
            new DynamicPageSchemaDto { PageKey="inventory.warehouse-management", EntityName="WarehouseBin", Title="Warehouse Topology & Slotting", SubTitle="Manage bin aisles, rack shelving, quarantine zones, and picking paths.", ViewType="table", ApiEndpoint="/api/v1/inventory/warehouses",
                Columns=new(){ Col("binCode","Bin Identifier",width:140), Col("warehouseName","Warehouse",width:180), Col("zone","Zone / Aisle",width:130), Col("capacityKg","Max Weight (KG)","number",width:130), BadgeCol("status","Status","{\"Occupied\":\"Occupied\",\"Available\":\"Available\",\"Reserved\":\"Reserved\"}",110) },
                Filters=new(){ TF("search","Search bin") },
                Form=new(){ Sections=new() },
                Actions=new(){ A("create","Add Bin Location","primary","Plus"), A("export","Export Layout","ghost","Download") } }),

            // ══════════ PROCUREMENT MODULE ══════════
            new("procurement.vendors", "VendorMaster", "Vendor Master", "Supplier profiles, commercial terms, and GSTIN compliance.", "procurement", "table", "/procurement/vendors", "Truck", "procurement.vendors.read",
            new DynamicPageSchemaDto { PageKey="procurement.vendors", EntityName="VendorMaster", Title="Vendor Master", SubTitle="Supplier onboarding, payment terms, GST compliance, and quality rating scorecards.", ViewType="table", ApiEndpoint="/api/v1/procurement/vendors",
                Columns=new(){ Col("code","Vendor Code",width:120), Col("companyName","Supplier Name",width:240), Col("contactPerson","Contact Person",width:180), Col("email","Email",width:200), Col("phone","Phone",width:140), Col("gstNumber","GSTIN",width:160), Col("rating","Rating (1-5)","number",width:110), BadgeCol("status","Status","{\"Active\":\"Active\",\"Pending\":\"Pending\",\"Blacklisted\":\"Blacklisted\"}",110) },
                Filters=new(){ TF("search","Search supplier name, code, or GSTIN"), SF("status","Status",("Active","Active"),("Pending","Pending"),("Blacklisted","Blacklisted")) },
                Form=new(){ Sections=new(){ Sec("vendor","Supplier Identity", F("code","Vendor Code",req:true), F("companyName","Company Name",req:true), F("contactPerson","Contact Representative"), F("email","Procurement Email","email",req:true), F("phone","Contact Phone","tel")), Sec("compliance","Statutory & Payment Terms", F("gstNumber","GSTIN Identification"), F("panNumber","PAN Identification"), FSel("paymentTerms","Payment Terms",false,("Net15","Net 15 Days"),("Net30","Net 30 Days"),("Net60","Net 60 Days"),("Immediate","Immediate")), F("rating","Quality Rating (1-5)","number")) }},
                Actions=new(){ A("create","Add Vendor","primary","Plus"), A("edit","Edit Vendor","secondary","Pencil"), A("delete","Delete","danger","Trash2"), A("export","Export Vendors","ghost","Download") } }),

            new("procurement.orders", "PurchaseOrder", "Purchase Orders Register", "Commercial purchase contracts, price approvals, and delivery milestones.", "procurement", "table", "/procurement/purchase-orders", "FileText", "procurement.orders.read",
            new DynamicPageSchemaDto { PageKey="procurement.orders", EntityName="PurchaseOrder", Title="Purchase Orders Register", SubTitle="Create, approve, and disburse official POs with vendor terms and item line items.", ViewType="table", ApiEndpoint="/api/v1/procurement/orders",
                Columns=new(){ Col("orderNumber","PO Number",width:140), Col("vendorName","Supplier",width:220), Col("orderDate","PO Date","date",width:120), Col("deliveryDate","Delivery Date","date",width:120), Col("totalAmount","Total Value","currency",width:140), BadgeCol("status","Status","{\"Draft\":\"Draft\",\"PendingApproval\":\"Pending Approval\",\"Approved\":\"Approved\",\"Delivered\":\"Delivered\",\"Closed\":\"Closed\"}",140) },
                Filters=new(){ TF("search","Search PO # or supplier"), SF("status","Status",("Draft","Draft"),("PendingApproval","Pending Approval"),("Approved","Approved"),("Delivered","Delivered")) },
                Form=new(){ Sections=new(){ Sec("po","Purchase Order Header", F("vendorId","Supplier","lookup",req:true), F("orderDate","Order Date","date",req:true), F("deliveryDate","Expected Delivery Date","date",req:true), F("shippingAddress","Shipping Destination","textarea",span:2), F("termsAndConditions","Commercial Terms & Notes","textarea",span:2)) }},
                Actions=new(){ A("create","Create Purchase Order","primary","Plus"), A("approve","Approve PO","success","CheckCircle2"), A("print","Print PDF","ghost","Printer"), A("export","Export POs","ghost","Download") } }),

            new("procurement.purchase-requests", "PurchaseRequest", "Purchase Requests", "Internal departmental purchase requisitions awaiting procurement review.", "procurement", "table", "/procurement/purchase-requests", "ClipboardList", "procurement.requests.read",
            new DynamicPageSchemaDto { PageKey="procurement.purchase-requests", EntityName="PurchaseRequest", Title="Purchase Requests", SubTitle="Department requisitions, estimated pricing, budget check, and PO conversion.", ViewType="table", ApiEndpoint="/api/v1/procurement/requests",
                Columns=new(){ Col("requestNumber","PR #",width:130), Col("requestedByName","Requested By",width:180), Col("departmentName","Department",width:160), Col("requiredDate","Required By","date",width:120), Col("estimatedAmount","Est. Amount","currency",width:130), BadgeCol("status","Status","{\"Draft\":\"Draft\",\"Submitted\":\"Submitted\",\"Approved\":\"Approved\",\"ConvertedToPO\":\"Converted to PO\"}",140) },
                Filters=new(){ TF("search","Search PR #"), SF("status","Status",("Draft","Draft"),("Submitted","Submitted"),("Approved","Approved")) },
                Form=new(){ Sections=new(){ Sec("pr","Requisition Details", F("requiredDate","Required By Date","date",req:true), F("departmentId","Department","lookup",req:true), F("justification","Business Justification","textarea",span:2)) }},
                Actions=new(){ A("create","New Request","primary","Plus"), A("approve","Approve Requisition","success","CheckCircle2") } }),

            new("procurement.goods-receipt-notes", "GoodsReceiptNote", "Goods Receipt Notes (GRN)", "Inward material receiving inspection, quantity verification, and QC.", "procurement", "table", "/procurement/goods-receipt-notes", "CheckCheck", "procurement.grn.read",
            new DynamicPageSchemaDto { PageKey="procurement.goods-receipt-notes", EntityName="GoodsReceiptNote", Title="Goods Receipt Notes (GRN)", SubTitle="Inspect incoming supplier consignments, verify against PO, record damages, and accept stock.", ViewType="table", ApiEndpoint="/api/v1/procurement/grn",
                Columns=new(){ Col("grnNumber","GRN #",width:140), Col("purchaseOrderNumber","PO Ref #",width:140), Col("vendorName","Supplier",width:200), Col("receiptDate","Received On","date",width:130), Col("receivedByName","Received By",width:160), BadgeCol("status","Status","{\"Accepted\":\"Accepted\",\"QC_Pending\":\"QC Pending\",\"Rejected\":\"Rejected\"}",120) },
                Filters=new(){ TF("search","Search GRN or PO #"), SF("status","Status",("Accepted","Accepted"),("QC_Pending","QC Pending"),("Rejected","Rejected")) },
                Form=new(){ Sections=new(){ Sec("grn","GRN Inward Entry", F("purchaseOrderId","Purchase Order","lookup",req:true), F("warehouseId","Receiving Warehouse","lookup",req:true), F("receiptDate","Receipt Date","date",req:true), F("carrierInfo","Transport & Lorry Receipt (LR) #"), F("qcRemarks","Inspection Findings","textarea",span:2)) }},
                Actions=new(){ A("create","Generate GRN","primary","Plus"), A("view","View GRN","ghost","Eye"), A("export","Export GRN","ghost","Download") } }),

            // ══════════ SALES MODULE ══════════
            new("sales.orders", "SalesOrder", "Sales Orders Register", "Confirmed customer sales contracts, dispatch schedules, and fulfillment.", "sales", "table", "/sales/orders", "ShoppingBag", "sales.orders.read",
            new DynamicPageSchemaDto { PageKey="sales.orders", EntityName="SalesOrder", Title="Sales Orders Register", SubTitle="Manage customer orders, credit check validation, production reservations, and invoicing.", ViewType="table", ApiEndpoint="/api/v1/sales/orders",
                Columns=new(){ Col("orderNumber","Order #",width:140), Col("customerName","Customer",width:220), Col("orderDate","Order Date","date",width:120), Col("expectedDeliveryDate","Delivery Date","date",width:120), Col("totalAmount","Order Value","currency",width:140), BadgeCol("status","Status","{\"Confirmed\":\"Confirmed\",\"Pending\":\"Pending\",\"Processing\":\"Processing\",\"Dispatched\":\"Dispatched\",\"Delivered\":\"Delivered\"}",130) },
                Filters=new(){ TF("search","Search order # or customer"), SF("status","Status",("Confirmed","Confirmed"),("Pending","Pending"),("Processing","Processing"),("Dispatched","Dispatched")) },
                Form=new(){ Sections=new(){ Sec("order","Order Coordinates", F("customerId","Customer","lookup",req:true), F("orderDate","Order Date","date",req:true), F("expectedDeliveryDate","Delivery Schedule","date",req:true), F("shippingAddress","Delivery Address","textarea",span:2), F("paymentTerms","Payment Terms")) }},
                Actions=new(){ A("create","New Sales Order","primary","Plus"), A("invoice","Generate Invoice","secondary","FileText"), A("export","Export Orders","ghost","Download") } }),

            new("sales.invoices", "SalesInvoice", "Sales Invoices Ledger", "Tax invoices, GST calculations, receivables ledger, and payment tracking.", "sales", "table", "/invoices", "FileSpreadsheet", "sales.invoices.read",
            new DynamicPageSchemaDto { PageKey="sales.invoices", EntityName="SalesInvoice", Title="Sales Invoices Ledger", SubTitle="Generate GST-compliant tax invoices, e-Invoice IRN QR codes, and monitor payments.", ViewType="table", ApiEndpoint="/api/v1/sales/invoices",
                Columns=new(){ Col("invoiceNumber","Invoice #",width:140), Col("customerName","Customer",width:220), Col("invoiceDate","Date","date",width:120), Col("dueDate","Due Date","date",width:120), Col("totalAmount","Total","currency",width:130), Col("paidAmount","Paid","currency",width:130), BadgeCol("status","Status","{\"Paid\":\"Paid\",\"PartiallyPaid\":\"Partial\",\"Unpaid\":\"Unpaid\",\"Overdue\":\"Overdue\"}",110) },
                Filters=new(){ TF("search","Search invoice # or customer"), SF("status","Status",("Paid","Paid"),("PartiallyPaid","Partial"),("Unpaid","Unpaid"),("Overdue","Overdue")) },
                Form=new(){ Sections=new(){ Sec("inv","Invoice Details", F("customerId","Customer","lookup",req:true), F("invoiceDate","Invoice Date","date",req:true), F("dueDate","Payment Due Date","date",req:true), F("salesOrderId","Sales Order Reference","lookup")) }},
                Actions=new(){ A("create","Create Invoice","primary","Plus"), A("view","View PDF","ghost","Eye"), A("export","Export Invoices","ghost","Download") } }),

            new("sales.customers", "Customer", "Customer Master", "Customer master ledger, credit limits, contact directory, and GSTIN.", "sales", "table", "/crm/customers", "Building2", "sales.customers.read",
            new DynamicPageSchemaDto { PageKey="sales.customers", EntityName="Customer", Title="Customer Master", SubTitle="Enterprise client registry, GST statutory details, credit terms, and billing contacts.", ViewType="table", ApiEndpoint="/api/v1/crm/customers",
                Columns=new(){ Col("code","Customer Code",width:120), Col("companyName","Company Name",width:220), Col("contactPerson","Contact Person",width:180), Col("email","Email",width:200), Col("phone","Phone",width:140), Col("gstNumber","GSTIN",width:160), Col("creditLimit","Credit Limit","currency",width:130), BadgeCol("status","Status","{\"Active\":\"Active\",\"Suspended\":\"Suspended\",\"Lead\":\"Lead\"}",110) },
                Filters=new(){ TF("search","Search customer, code, or GSTIN"), SF("status","Status",("Active","Active"),("Suspended","Suspended")) },
                Form=new(){ Sections=new(){ Sec("cust","Client Profile", F("code","Customer Code",req:true), F("companyName","Business Name",req:true), F("contactPerson","Contact Representative"), F("email","Billing Email","email",req:true), F("phone","Contact Phone","tel")), Sec("credit","Credit & Compliance", F("gstNumber","GSTIN Identification"), F("panNumber","PAN Identification"), F("creditLimit","Credit Limit (₹)","currency"), FSel("paymentTerms","Payment Terms",false,("Net15","Net 15 Days"),("Net30","Net 30 Days"),("Net45","Net 45 Days"))) }},
                Actions=new(){ A("create","Add Customer","primary","Plus"), A("edit","Edit Customer","secondary","Pencil"), A("export","Export Customers","ghost","Download") } }),

            new("sales.quotations", "SalesQuotation", "Sales Quotations", "Price quotations, commercial proposals, and conversion tracking.", "sales", "table", "/sales/quotations", "FileQuestion", "sales.quotations.read",
            new DynamicPageSchemaDto { PageKey="sales.quotations", EntityName="SalesQuotation", Title="Sales Quotations", SubTitle="Prepare formal rate quotes, validity deadlines, discount structures, and one-click PO conversion.", ViewType="table", ApiEndpoint="/api/v1/sales/quotations",
                Columns=new(){ Col("quoteNumber","Quote #",width:140), Col("customerName","Client",width:200), Col("quoteDate","Date","date",width:120), Col("validUntil","Valid Until","date",width:120), Col("totalAmount","Estimated Value","currency",width:140), BadgeCol("status","Status","{\"Draft\":\"Draft\",\"Sent\":\"Sent\",\"Accepted\":\"Accepted\",\"Declined\":\"Declined\"}",110) },
                Filters=new(){ TF("search","Search quote #"), SF("status","Status",("Draft","Draft"),("Sent","Sent"),("Accepted","Accepted"),("Declined","Declined")) },
                Form=new(){ Sections=new(){ Sec("quote","Quotation Details", F("customerId","Client","lookup",req:true), F("quoteDate","Quotation Date","date",req:true), F("validUntil","Valid Until","date",req:true), F("terms","Terms & Commercial Notes","textarea",span:2)) }},
                Actions=new(){ A("create","New Quotation","primary","Plus"), A("convert","Convert to Sales Order","success","ArrowRight"), A("export","Print Quote","ghost","Printer") } }),

            new("sales.pricing", "PricingRule", "Pricing & Rate Cards", "Product tier pricing, minimum order quantities, and custom client contracts.", "sales", "table", "/sales/pricing", "Tag", "sales.pricing.read",
            new DynamicPageSchemaDto { PageKey="sales.pricing", EntityName="PricingRule", Title="Pricing & Rate Cards", SubTitle="Contract pricing matrices, dealer discounts, wholesale tiers, and volume breaks.", ViewType="table", ApiEndpoint="/api/v1/sales/pricing",
                Columns=new(){ Col("ruleName","Rule Title",width:200), Col("itemCode","Item SKU",width:130), Col("customerGroup","Customer Tier",width:160), Col("rate","Price (₹)","currency",width:120), Col("validFrom","Effective From","date",width:120), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search pricing rule") },
                Form=new(){ Sections=new(){ Sec("rule","Pricing Rule", F("ruleName","Rule Name",req:true), F("itemId","Catalog Item","lookup",req:true), F("rate","Custom Price","currency",req:true), F("validFrom","Valid From","date",req:true), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add Pricing Rule","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("sales.discounts", "DiscountStructure", "Discounts & Promotions", "Promotional campaigns, seasonal coupons, and rebate schemes.", "sales", "table", "/sales/discounts", "Percent", "sales.discounts.read",
            new DynamicPageSchemaDto { PageKey="sales.discounts", EntityName="DiscountStructure", Title="Discounts & Promotions", SubTitle="Configure percentage coupons, order value rebates, and promotional schemes.", ViewType="table", ApiEndpoint="/api/v1/sales/discounts",
                Columns=new(){ Col("name","Scheme Name",width:220), Col("discountType","Type",width:140), Col("value","Value","number",width:100), Col("minOrderValue","Min Order (₹)","currency",width:130), Col("validTo","Expires","date",width:120), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Expired\"}",100) },
                Filters=new(){ TF("search","Search discount") },
                Form=new(){ Sections=new(){ Sec("disc","Discount Details", F("name","Scheme Title",req:true), FSel("discountType","Type",req:true,("Percentage","Percentage (%)"),("Flat","Flat Amount (₹)")), F("value","Discount Value","number",req:true), F("minOrderValue","Minimum Order Value","currency"), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add Promo Scheme","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("sales.returns", "SalesReturn", "Sales Returns (Credit Notes)", "Customer return authorizations, RMA tracking, and credit note issuance.", "sales", "table", "/sales/returns", "Undo2", "sales.returns.read",
            new DynamicPageSchemaDto { PageKey="sales.returns", EntityName="SalesReturn", Title="Sales Returns & Credit Notes", SubTitle="Manage RMA customer return authorizations, inspection, restock, and credit note generation.", ViewType="table", ApiEndpoint="/api/v1/sales/returns",
                Columns=new(){ Col("returnNumber","Return #",width:140), Col("invoiceNumber","Invoice Ref",width:140), Col("customerName","Customer",width:200), Col("returnDate","Date","date",width:120), Col("totalAmount","Credit Value","currency",width:130), BadgeCol("status","Status","{\"PendingQC\":\"Pending QC\",\"Approved\":\"Credit Note Issued\",\"Rejected\":\"Rejected\"}",140) },
                Filters=new(){ TF("search","Search return #"), SF("status","Status",("PendingQC","Pending QC"),("Approved","Approved"),("Rejected","Rejected")) },
                Form=new(){ Sections=new(){ Sec("ret","Return Authorization", F("invoiceId","Original Invoice","lookup",req:true), F("returnDate","Return Date","date",req:true), F("reason","Reason for Return","textarea",span:2)) }},
                Actions=new(){ A("create","Initiate Return","primary","Plus"), A("credit","Issue Credit Note","secondary","Receipt") } }),

            // ══════════ PROJECTS & MANUFACTURING ══════════
            new("projects.list", "Project", "Projects & Engagements", "Client projects, operational cost tracking, and resource assignments.", "projects", "table", "/projects/tasks", "FolderGit2", "projects.read",
            new DynamicPageSchemaDto { PageKey="projects.list", EntityName="Project", Title="Projects & Engagements", SubTitle="Client projects, milestones, budget burn, and deliverables.", ViewType="table", ApiEndpoint="/api/v1/projects",
                Columns=new(){ Col("name","Project Name",width:220), Col("code","Code",width:110), Col("clientName","Client",width:180), BadgeCol("status","Status","{\"Active\":\"Active\",\"Planning\":\"Planning\",\"Completed\":\"Completed\"}",110), Col("budget","Budget","currency",width:130), Col("startDate","Start Date","date",width:120) },
                Filters=new(){ TF("search","Search project"), SF("status","Status",("Active","Active"),("Planning","Planning"),("Completed","Completed")) },
                Form=new(){ Sections=new(){ Sec("proj","Project Setup", F("name","Project Name",req:true), F("code","Code",req:true), F("clientName","Client Name"), F("budget","Budget Cap","currency"), F("startDate","Start Date","date")) }},
                Actions=new(){ A("create","New Project","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("projects.tasks", "ProjectTask", "Project Tasks & Milestones", "Sprint tasks, assignees, deadlines, and milestone deliverables.", "projects", "table", "/projects/tasks", "CheckSquare", "projects.tasks.read",
            new DynamicPageSchemaDto { PageKey="projects.tasks", EntityName="ProjectTask", Title="Project Tasks & Milestones", SubTitle="Sprint deliverables, work breakdown structure (WBS), priority, and progress tracking.", ViewType="table", ApiEndpoint="/api/v1/projects/tasks",
                Columns=new(){ Col("taskName","Task Title",width:240), Col("projectName","Project",width:180), Col("assigneeName","Assignee",width:160), BadgeCol("priority","Priority","{\"High\":\"High\",\"Medium\":\"Medium\",\"Low\":\"Low\"}",90), Col("dueDate","Due Date","date",width:120), Col("progress","Progress %","number",width:100), BadgeCol("status","Status","{\"Pending\":\"Pending\",\"InProgress\":\"In Progress\",\"Completed\":\"Completed\"}",110) },
                Filters=new(){ TF("search","Search task"), SF("status","Status",("Pending","Pending"),("InProgress","In Progress"),("Completed","Completed")), SF("priority","Priority",("High","High"),("Medium","Medium"),("Low","Low")) },
                Form=new(){ Sections=new(){ Sec("task","Task Assignment", F("taskName","Task Title",req:true), F("projectId","Project","lookup",req:true), F("assigneeId","Assignee","lookup"), FSel("priority","Priority",true,("Low","Low"),("Medium","Medium"),("High","High")), F("dueDate","Due Date","date"), F("description","Task Details","textarea",span:2)) }},
                Actions=new(){ A("create","Add Task","primary","Plus"), A("edit","Edit Task","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("projects.timesheets", "Timesheet", "Employee Timesheets", "Daily and weekly employee project hour logs with manager approvals.", "projects", "table", "/projects/timesheets", "Clock", "projects.timesheets.read",
            new DynamicPageSchemaDto { PageKey="projects.timesheets", EntityName="Timesheet", Title="Employee Timesheets", SubTitle="Track billable and non-billable project hours, task logs, and submit for client billing.", ViewType="table", ApiEndpoint="/api/v1/projects/timesheets",
                Columns=new(){ Col("employeeName","Employee",width:180), Col("projectName","Project",width:180), Col("taskName","Task",width:200), Col("workDate","Date","date",width:120), Col("hoursWorked","Hours","number",width:90), BadgeCol("status","Status","{\"Submitted\":\"Submitted\",\"Approved\":\"Approved\",\"Draft\":\"Draft\"}",110) },
                Filters=new(){ TF("search","Search employee or project"), DF("workDate","Work Date"), SF("status","Status",("Draft","Draft"),("Submitted","Submitted"),("Approved","Approved")) },
                Form=new(){ Sections=new(){ Sec("ts","Log Project Hours", F("projectId","Project","lookup",req:true), F("taskId","Task","lookup"), F("workDate","Log Date","date",req:true), F("hoursWorked","Hours Spent","number",req:true), F("notes","Work Performed Memo","textarea",span:2)) }},
                Actions=new(){ A("create","Log Time","primary","Plus"), A("approve","Approve Hours","success","CheckCircle2"), A("export","Export Timesheet","ghost","Download") } }),

            new("manufacturing.work-orders", "WorkOrder", "Manufacturing Work Orders", "Production scheduling, BOM consumption, and finished goods assembly.", "manufacturing", "table", "/manufacturing/work-orders", "Cpu", "manufacturing.read",
            new DynamicPageSchemaDto { PageKey="manufacturing.work-orders", EntityName="WorkOrder", Title="Manufacturing Work Orders", SubTitle="Production shop-floor schedules, Bill of Materials (BOM) staging, and yield tracking.", ViewType="table", ApiEndpoint="/api/v1/manufacturing/work-orders",
                Columns=new(){ Col("workOrderNumber","WO #",width:140), Col("itemToProduce","Target Finished Good",width:220), Col("plannedQty","Planned Qty","number",width:110), Col("producedQty","Produced Qty","number",width:110), Col("startDate","Start Date","date",width:120), Col("dueDate","Target Date","date",width:120), BadgeCol("status","Status","{\"Scheduled\":\"Scheduled\",\"InProduction\":\"In Production\",\"Completed\":\"Completed\"}",130) },
                Filters=new(){ TF("search","Search WO # or item"), SF("status","Status",("Scheduled","Scheduled"),("InProduction","In Production"),("Completed","Completed")) },
                Form=new(){ Sections=new(){ Sec("wo","Production Order", F("itemId","Finished Good SKU","lookup",req:true), F("plannedQty","Target Production Batch","number",req:true), F("startDate","Production Start","date",req:true), F("dueDate","Completion Target","date",req:true)) }},
                Actions=new(){ A("create","Issue Work Order","primary","Plus"), A("complete","Record Production","success","CheckCheck") } }),

            // ══════════ ASSETS & CRM ══════════
            new("assets.list", "FixedAsset", "Fixed Asset Register", "Machinery, IT assets, depreciation schedules, and maintenance.", "assets", "table", "/assets", "Cpu", "assets.read",
            new DynamicPageSchemaDto { PageKey="assets.list", EntityName="FixedAsset", Title="Fixed Asset Register", SubTitle="Track enterprise capital assets, depreciation (SLM/WDV), maintenance, and physical locations.", ViewType="table", ApiEndpoint="/api/v1/assets",
                Columns=new(){ Col("assetCode","Asset Tag",width:120), Col("assetName","Asset Name",width:220), Col("category","Category",width:140), Col("purchaseDate","Acquisition Date","date",width:130), Col("purchaseCost","Original Cost","currency",width:130), Col("netBookValue","Book Value","currency",width:130), Col("location","Location",width:150), BadgeCol("status","Status","{\"Active\":\"Active\",\"InMaintenance\":\"Maintenance\",\"Disposed\":\"Disposed\"}",120) },
                Filters=new(){ TF("search","Search asset tag or name"), SF("category","Category",("IT","IT Equipment"),("Plant","Plant & Machinery"),("Vehicles","Vehicles"),("Furniture","Furniture")), SF("status","Status",("Active","Active"),("InMaintenance","Maintenance"),("Disposed","Disposed")) },
                Form=new(){ Sections=new(){ Sec("asset","Asset Details", F("assetCode","Asset Tag / Barcode",req:true), F("assetName","Asset Name",req:true), FSel("category","Category",req:true,("IT","IT Equipment"),("Plant","Plant & Machinery"),("Vehicles","Vehicles"),("Furniture","Furniture")), F("purchaseDate","Purchase Date","date",req:true), F("purchaseCost","Original Purchase Cost","currency",req:true), F("location","Physical Location"), FSel("depreciationMethod","Depreciation Method",false,("SLM","Straight Line Method (SLM)"),("WDV","Written Down Value (WDV)"))) }},
                Actions=new(){ A("create","Register Asset","primary","Plus"), A("edit","Edit Asset","secondary","Pencil"), A("export","Export Register","ghost","Download") } }),

            new("crm.leads", "CrmLead", "Lead Pipeline", "Prospective client inquiries, deal stage pipeline, and sales conversion.", "crm", "table", "/crm/leads", "Target", "crm.leads.read",
            new DynamicPageSchemaDto { PageKey="crm.leads", EntityName="CrmLead", Title="Sales Lead Pipeline", SubTitle="Capture inbound leads, track contact cadence, deal values, and conversion milestones.", ViewType="table", ApiEndpoint="/api/v1/crm/leads",
                Columns=new(){ Col("leadName","Contact Name",width:180), Col("company","Organization",width:200), Col("email","Email",width:200), Col("phone","Phone",width:140), Col("source","Lead Source",width:130), Col("estimatedValue","Est. Value","currency",width:130), BadgeCol("status","Status","{\"New\":\"New\",\"Contacted\":\"Contacted\",\"Qualified\":\"Qualified\",\"Lost\":\"Lost\"}",110) },
                Filters=new(){ TF("search","Search lead name or company"), SF("status","Status",("New","New"),("Contacted","Contacted"),("Qualified","Qualified"),("Lost","Lost")) },
                Form=new(){ Sections=new(){ Sec("lead","Lead Information", F("leadName","Lead Full Name",req:true), F("company","Company Name"), F("email","Email Address","email"), F("phone","Phone Number","tel"), FSel("source","Lead Source",false,("Website","Website Inquiry"),("Referral","Referral"),("ColdOutreach","Outreach"),("Event","Exhibition / Event")), F("estimatedValue","Estimated Deal Value","currency")) }},
                Actions=new(){ A("create","Capture Lead","primary","Plus"), A("convert","Convert to Customer","success","ArrowRight"), A("export","Export Leads","ghost","Download") } }),

            new("crm.opportunities", "CrmOpportunity", "Sales Opportunities", "Qualified enterprise pipeline deals, stages, win probability, and quotas.", "crm", "table", "/crm/opportunities", "Award", "crm.opportunities.read",
            new DynamicPageSchemaDto { PageKey="crm.opportunities", EntityName="CrmOpportunity", Title="Sales Opportunities", SubTitle="Manage enterprise deal stages, win probability percentage, revenue forecasts, and closing dates.", ViewType="table", ApiEndpoint="/api/v1/crm/opportunities",
                Columns=new(){ Col("title","Opportunity Title",width:220), Col("customerName","Client",width:180), BadgeCol("stage","Stage","{\"Discovery\":\"Discovery\",\"Proposal\":\"Proposal\",\"Negotiation\":\"Negotiation\",\"ClosedWon\":\"Closed Won\",\"ClosedLost\":\"Closed Lost\"}",130), Col("value","Deal Value","currency",width:130), Col("probability","Win Prob. %","number",width:110), Col("expectedCloseDate","Target Close","date",width:120) },
                Filters=new(){ TF("search","Search opportunity"), SF("stage","Stage",("Discovery","Discovery"),("Proposal","Proposal"),("Negotiation","Negotiation"),("ClosedWon","Closed Won"),("ClosedLost","Closed Lost")) },
                Form=new(){ Sections=new(){ Sec("opp","Deal Parameters", F("title","Deal Title",req:true), F("customerId","Client / Account","lookup",req:true), F("value","Deal Value","currency",req:true), FSel("stage","Stage",req:true,("Discovery","Discovery"),("Proposal","Proposal"),("Negotiation","Negotiation"),("ClosedWon","Closed Won"),("ClosedLost","Closed Lost")), F("probability","Win Probability %","number"), F("expectedCloseDate","Target Close Date","date")) }},
                Actions=new(){ A("create","Add Opportunity","primary","Plus"), A("edit","Edit Deal","secondary","Pencil"), A("export","Export Pipeline","ghost","Download") } }),

            // ══════════ HRMS & PAYROLL ADDITIONS ══════════
            new("hrms.attendance", "AttendanceRecord", "Attendance Ledger", "Daily biometric clock-in/out stamps, working hours, and regularization.", "hrms", "table", "/hrms/attendance", "Clock", "hrms.attendance.read",
            new DynamicPageSchemaDto { PageKey="hrms.attendance", EntityName="AttendanceRecord", Title="Attendance Ledger", SubTitle="Biometric sync stamps, punch times, total hours worked, overtime, and regularization.", ViewType="table", ApiEndpoint="/api/v1/hrms/attendance",
                Columns=new(){ Col("employeeCode","Code",width:100), Col("employeeName","Employee",width:200), Col("date","Date","date",width:120), Col("checkIn","In Time","time",width:110), Col("checkOut","Out Time","time",width:110), Col("workHours","Hours","number",width:90), BadgeCol("status","Status","{\"Present\":\"Present\",\"Absent\":\"Absent\",\"HalfDay\":\"Half Day\",\"OnLeave\":\"Leave\"}",110) },
                Filters=new(){ TF("search","Search employee"), DF("date","Attendance Date"), SF("status","Status",("Present","Present"),("Absent","Absent"),("HalfDay","Half Day"),("OnLeave","On Leave")) },
                Form=new(){ Sections=new() },
                Actions=new(){ A("regularize","Regularize Punch","secondary","Clock"), A("export","Export Monthly Ledger","ghost","Download") } }),

            new("hrms.shifts", "WorkShift", "Work Shifts", "Working hours, roster timing, night shift allowances, and grace periods.", "hrms", "table", "/hrms/shifts", "Clock9", "hrms.shifts.read",
            new DynamicPageSchemaDto { PageKey="hrms.shifts", EntityName="WorkShift", Title="Work Shifts & Rosters", SubTitle="Configure operational shifts, flexible timing, lunch break windows, and grace policies.", ViewType="table", ApiEndpoint="/api/v1/hrms/shifts",
                Columns=new(){ Col("name","Shift Name",width:200), Col("startTime","Start Time",width:110), Col("endTime","End Time",width:110), Col("graceMinutes","Grace Period (m)","number",width:140), Col("isNightShift","Night Shift","boolean",width:110), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search shifts") },
                Form=new(){ Sections=new(){ Sec("shift","Shift Profile", F("name","Shift Name",req:true), F("startTime","Start Time (HH:mm)",req:true), F("endTime","End Time (HH:mm)",req:true), F("graceMinutes","Grace Minutes Allowed","number"), F("isNightShift","Night Shift Window","boolean"), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add Shift","primary","Plus"), A("edit","Edit Shift","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("hrms.assets", "EmployeeAsset", "Employee Asset Allocations", "Laptops, phones, sim cards, and corporate asset handovers.", "hrms", "table", "/hrms/assets", "Laptop", "hrms.assets.read",
            new DynamicPageSchemaDto { PageKey="hrms.assets", EntityName="EmployeeAsset", Title="Employee Asset Allocations", SubTitle="Hardware assignments, serial tags, handover receipts, and return clearances.", ViewType="table", ApiEndpoint="/api/v1/hrms/assets",
                Columns=new(){ Col("assetTag","Asset Tag",width:130), Col("assetName","Asset Model",width:220), Col("employeeName","Allocated To",width:200), Col("allocatedDate","Handover Date","date",width:130), Col("returnDate","Return Date","date",width:130), BadgeCol("status","Status","{\"Allocated\":\"Allocated\",\"Returned\":\"Returned\",\"Damaged\":\"Damaged\"}",110) },
                Filters=new(){ TF("search","Search asset or employee"), SF("status","Status",("Allocated","Allocated"),("Returned","Returned")) },
                Form=new(){ Sections=new(){ Sec("alloc","Asset Allocation", F("assetTag","Asset Barcode / Tag",req:true), F("assetName","Hardware Model / Description",req:true), F("employeeId","Employee","lookup",req:true), F("allocatedDate","Handover Date","date",req:true)) }},
                Actions=new(){ A("create","Allocate Asset","primary","Plus"), A("return","Record Return","secondary","RotateCcw") } }),

            new("hrms.assessments", "SkillAssessment", "Skills & Assessments", "Technical evaluations, performance scores, and competence benchmarks.", "hrms", "table", "/hrms/assessments", "FileCheck", "hrms.assessments.read",
            new DynamicPageSchemaDto { PageKey="hrms.assessments", EntityName="SkillAssessment", Title="Skills & Assessments", SubTitle="Employee skill matrix, certification results, and assessment scores.", ViewType="table", ApiEndpoint="/api/v1/hrms/assessments",
                Columns=new(){ Col("employeeName","Employee",width:200), Col("skillName","Competency / Skill",width:200), Col("assessmentDate","Evaluation Date","date",width:130), Col("score","Score (%)","number",width:100), Col("evaluatorName","Evaluator",width:180), BadgeCol("certified","Certified","{\"true\":\"Certified\",\"false\":\"Needs Improvement\"}",130) },
                Filters=new(){ TF("search","Search employee or skill") },
                Form=new(){ Sections=new(){ Sec("eval","Assessment Record", F("employeeId","Employee","lookup",req:true), F("skillName","Competency Name",req:true), F("score","Score Percentage (0-100)","number",req:true), F("assessmentDate","Date","date",req:true), F("certified","Award Certificate","boolean")) }},
                Actions=new(){ A("create","Record Assessment","primary","Plus"), A("export","Export Matrix","ghost","Download") } }),

            new("hrms.certificates", "EmployeeCertificate", "Certificates & Licenses", "Professional credentials, driver licenses, and regulatory permits.", "hrms", "table", "/hrms/certificates", "Award", "hrms.certificates.read",
            new DynamicPageSchemaDto { PageKey="hrms.certificates", EntityName="EmployeeCertificate", Title="Certificates & Licenses", SubTitle="Upload and track expiry dates for corporate licenses, safety certs, and degrees.", ViewType="table", ApiEndpoint="/api/v1/hrms/certificates",
                Columns=new(){ Col("employeeName","Employee",width:200), Col("certificateName","Certificate Title",width:220), Col("issuingBody","Issuing Authority",width:180), Col("issueDate","Issued On","date",width:120), Col("expiryDate","Expires On","date",width:120), BadgeCol("status","Status","{\"Valid\":\"Valid\",\"ExpiringSoon\":\"Expiring Soon\",\"Expired\":\"Expired\"}",120) },
                Filters=new(){ TF("search","Search certificate") },
                Form=new(){ Sections=new(){ Sec("cert","Certificate Credential", F("employeeId","Employee","lookup",req:true), F("certificateName","Certificate Title",req:true), F("issuingBody","Issuing Body / University"), F("issueDate","Issue Date","date"), F("expiryDate","Expiry Date","date"), F("documentFile","Upload Certificate (PDF)","file")) }},
                Actions=new(){ A("create","Add Credential","primary","Plus"), A("view","View PDF","ghost","Eye") } }),

            new("payroll.components", "SalaryComponent", "Salary Components Master", "Earnings, allowances, statutory deductions, and tax calculation formulas.", "payroll", "table", "/payroll/components", "Sliders", "payroll.components.read",
            new DynamicPageSchemaDto { PageKey="payroll.components", EntityName="SalaryComponent", Title="Salary Components Master", SubTitle="Configure Basic, HRA, Special Allowance, PF, ESIC, and Professional Tax formulas.", ViewType="table", ApiEndpoint="/api/v1/payroll/components",
                Columns=new(){ Col("code","Component Code",width:120), Col("name","Component Name",width:220), BadgeCol("type","Type","{\"Earning\":\"Earning\",\"Deduction\":\"Deduction\"}",110), Col("isTaxable","Taxable","boolean",width:100), Col("calculationFormula","Formula / Logic",width:240), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search component code or name"), SF("type","Type",("Earning","Earning"),("Deduction","Deduction")) },
                Form=new(){ Sections=new(){ Sec("comp","Component Details", F("code","Component Code (e.g. HRA)",req:true), F("name","Display Name",req:true), FSel("type","Component Type",req:true,("Earning","Earning / Allowance"),("Deduction","Deduction")), F("calculationFormula","Formula (e.g. Basic * 0.4)"), F("isTaxable","Taxable under Income Tax","boolean"), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add Component","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("payroll.reimbursements", "PayrollReimbursement", "Payroll Reimbursements", "Medical, fuel, and telephone reimbursement claims against salary.", "payroll", "table", "/payroll/reimbursements", "Receipt", "payroll.reimbursements.read",
            new DynamicPageSchemaDto { PageKey="payroll.reimbursements", EntityName="PayrollReimbursement", Title="Payroll Reimbursements", SubTitle="Submit tax-exempt reimbursement bills (Medical, LTA, Books, Telephone) for payroll credit.", ViewType="table", ApiEndpoint="/api/v1/payroll/reimbursements",
                Columns=new(){ Col("employeeName","Employee",width:200), Col("componentName","Reimbursement Head",width:180), Col("amount","Claim Amount","currency",width:130), Col("billDate","Bill Date","date",width:120), BadgeCol("status","Status","{\"Pending\":\"Pending\",\"Approved\":\"Approved\",\"Paid\":\"Paid\"}",110) },
                Filters=new(){ TF("search","Search employee"), SF("status","Status",("Pending","Pending"),("Approved","Approved"),("Paid","Paid")) },
                Form=new(){ Sections=new(){ Sec("claim","Reimbursement Claim", F("employeeId","Employee","lookup",req:true), F("componentId","Salary Head","lookup",req:true), F("amount","Bill Amount","currency",req:true), F("billDate","Bill Date","date",req:true), F("billReceipt","Upload Receipt (PDF/Image)","file")) }},
                Actions=new(){ A("create","Submit Claim","primary","Plus"), A("approve","Approve Claim","success","CheckCircle2") } }),

            new("payroll.statutory", "StatutoryConfiguration", "Statutory Compliance Rules", "EPFO (12%), ESIC (0.75%/3.25%), Professional Tax, and LWF slabs.", "payroll", "table", "/payroll/statutory", "ShieldCheck", "payroll.statutory.read",
            new DynamicPageSchemaDto { PageKey="payroll.statutory", EntityName="StatutoryConfiguration", Title="Statutory Compliance Rules", SubTitle="State-wise Professional Tax slabs, EPFO pension caps, and ESIC thresholds.", ViewType="table", ApiEndpoint="/api/v1/payroll/statutory",
                Columns=new(){ Col("ruleName","Statutory Rule",width:220), Col("statutoryType","Type",width:130), Col("employeeRate","Employee Rate (%)","number",width:150), Col("employerRate","Employer Rate (%)","number",width:150), Col("threshold","Wage Ceiling","currency",width:140), Col("effectiveDate","Effective From","date",width:130) },
                Filters=new(){ TF("search","Search rule") },
                Form=new(){ Sections=new() },
                Actions=new(){ A("edit","Edit Slabs","secondary","Pencil"), A("export","Export Rules","ghost","Download") } }),

            new("payroll.tax-declarations", "TaxDeclaration", "Tax Declarations & Regimes", "Old vs New Regime (115BAC) and Section 80C/80D investment proofs.", "payroll", "table", "/payroll/tax-declarations", "FileText", "payroll.tax.read",
            new DynamicPageSchemaDto { PageKey="payroll.tax-declarations", EntityName="TaxDeclaration", Title="Tax Declarations & Regimes", SubTitle="Collect IT declarations, verify proofs, calculate monthly TDS, and generate Form 16.", ViewType="table", ApiEndpoint="/api/v1/payroll/tax-declarations",
                Columns=new(){ Col("employeeName","Employee",width:200), Col("financialYear","Financial Year",width:130), BadgeCol("regime","Tax Regime","{\"NewRegime\":\"New Regime (115BAC)\",\"OldRegime\":\"Old Regime\"}",180), Col("total80C","Section 80C","currency",width:130), Col("total80D","Section 80D","currency",width:130), Col("rentDeclared","House Rent","currency",width:130), BadgeCol("status","Status","{\"Declared\":\"Declared\",\"ProofSubmitted\":\"Proof Submitted\",\"Verified\":\"Verified\"}",130) },
                Filters=new(){ TF("search","Search employee"), SF("regime","Regime",("NewRegime","New (115BAC)"),("OldRegime","Old")), SF("status","Status",("Declared","Declared"),("ProofSubmitted","Proof Submitted"),("Verified","Verified")) },
                Form=new(){ Sections=new() },
                Actions=new(){ A("verify","Verify Proofs","secondary","CheckCheck"), A("export","Export TDS Summary","ghost","Download") } }),

            // ══════════ PLATFORM & SECURITY MODULE ══════════
            new("platform.documents", "PlatformDocument", "Enterprise Document Repository", "Cloud attachments, payslip PDFs, statutory challans, and signed NDAs.", "platform", "table", "/administration/documents", "FolderGit2", "platform.documents.read",
            new DynamicPageSchemaDto { PageKey="platform.documents", EntityName="PlatformDocument", Title="Enterprise Document Repository", SubTitle="Centralized repository of employee KYC, signed agreements, vendor contracts, and tax receipts.", ViewType="table", ApiEndpoint="/api/v1/documents",
                Columns=new(){ Col("title","Document Title",width:240), Col("documentType","Category",width:140), Col("entityType","Linked Entity",width:140), Col("uploadedByName","Uploaded By",width:180), Col("uploadedAt","Upload Date","datetime",width:160), Col("fileSizeKb","File Size (KB)","number",width:120) },
                Filters=new(){ TF("search","Search title or tag"), SF("documentType","Category",("KYC","KYC Verification"),("Contract","Contract / NDA"),("Statutory","Statutory Receipt"),("Invoice","Invoice Copy")) },
                Form=new(){ Sections=new(){ Sec("doc","Upload Document", F("title","Document Title",req:true), FSel("documentType","Category",req:true,("KYC","KYC Verification"),("Contract","Contract / NDA"),("Statutory","Statutory Receipt"),("Invoice","Invoice Copy")), F("file","Select File (PDF, PNG, JPG)","file",req:true)) }},
                Actions=new(){ A("create","Upload Document","primary","Plus"), A("download","Download File","ghost","Download") } }),

            new("security.sessions", "SecuritySession", "Active User Sessions", "Live JWT authentication sessions, IP locations, and remote sign-out.", "security", "table", "/security/access-logs", "ShieldCheck", "security.sessions.read",
            new DynamicPageSchemaDto { PageKey="security.sessions", EntityName="SecuritySession", Title="Active User Sessions", SubTitle="Monitor active user logins, IP geographic coordinates, token validity, and revoke rogue sessions.", ViewType="table", ApiEndpoint="/api/v1/security/sessions",
                Columns=new(){ Col("userEmail","User Email",width:200), Col("ipAddress","IP Address",width:140), Col("device","Device / Browser",width:200), Col("loginAt","Logged In","datetime",width:160), Col("lastActivityAt","Last Active","datetime",width:160), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Terminated\"}",100) },
                Filters=new(){ TF("search","Search user or IP") },
                Form=new(){ Sections=new() },
                Actions=new(){ A("revoke","Revoke Session","danger","XCircle"), A("export","Export Audit","ghost","Download") } }),

            new("security.access-logs", "SecurityAccessLog", "Security Access Logs", "Immutable audit trail of authentication attempts, 2FA challenges, and API scopes.", "security", "table", "/security/access-logs", "FileText", "security.logs.read",
            new DynamicPageSchemaDto { PageKey="security.access-logs", EntityName="SecurityAccessLog", Title="Security Access Logs", SubTitle="Comprehensive security ledger tracking login successes, password resets, and authorization failures.", ViewType="table", ApiEndpoint="/api/v1/security/access-logs",
                Columns=new(){ Col("timestamp","Timestamp","datetime",width:170), Col("userEmail","User",width:200), Col("action","Event Action",width:160), Col("ipAddress","IP Address",width:140), BadgeCol("result","Outcome","{\"Success\":\"Success\",\"Failed\":\"Failed\",\"Blocked\":\"Blocked\"}",110) },
                Filters=new(){ TF("search","Search user or IP"), SF("result","Outcome",("Success","Success"),("Failed","Failed"),("Blocked","Blocked")), DF("from","From"), DF("to","To") },
                Form=new(){ Sections=new() },
                Actions=new(){ A("export","Export Security Audit","ghost","Download") } }),

            new("security.ip-restrictions", "IpRestriction", "IP Whitelist & Blacklist", "Restrict corporate portal access by static IP or CIDR subnet.", "security", "table", "/security/ip-restrictions", "Network", "security.ip.read",
            new DynamicPageSchemaDto { PageKey="security.ip-restrictions", EntityName="IpRestriction", Title="IP Restrictions & Perimeter Security", SubTitle="Enforce static IP whitelisting or ban malicious CIDR blocks from accessing admin routes.", ViewType="table", ApiEndpoint="/api/v1/security/ip-restrictions",
                Columns=new(){ Col("ipAddressOrCidr","IP Address / Subnet (CIDR)",width:220), Col("description","Description / Office Tag",width:260), BadgeCol("restrictionType","Rule","{\"Allow\":\"Whitelist (Allow)\",\"Deny\":\"Blacklist (Deny)\"}",160), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search IP"), SF("restrictionType","Rule",("Allow","Allow"),("Deny","Deny")) },
                Form=new(){ Sections=new(){ Sec("rule","IP Rule", F("ipAddressOrCidr","IP / CIDR (e.g. 192.168.1.0/24)",req:true), FSel("restrictionType","Policy",req:true,("Allow","Whitelist (Allow Access)"),("Deny","Blacklist (Deny Access)")), F("description","Location / Office Description"), F("isActive","Active Rule","boolean")) }},
                Actions=new(){ A("create","Add IP Rule","primary","Plus"), A("delete","Delete Rule","danger","Trash2") } }),

            new("security.password-policies", "PasswordPolicy", "Password Policies", "Password complexity rules, rotation cadence, and brute-force lockout limits.", "security", "table", "/security/password-policies", "Lock", "security.password.read",
            new DynamicPageSchemaDto { PageKey="security.password-policies", EntityName="PasswordPolicy", Title="Enterprise Password Policies", SubTitle="Set minimum character length, special character mandates, rotation days, and lockout thresholds.", ViewType="table", ApiEndpoint="/api/v1/security/password-policies",
                Columns=new(){ Col("policyName","Policy Name",width:200), Col("minLength","Min Length","number",width:110), Col("expiryDays","Rotation (Days)","number",width:130), Col("lockoutAttempts","Lockout Tries","number",width:120), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search policy") },
                Form=new(){ Sections=new(){ Sec("pwd","Complexity & Expiry", F("policyName","Policy Title",req:true), F("minLength","Minimum Length (e.g. 10)","number",req:true), F("requireUppercase","Require Uppercase","boolean"), F("requireNumbers","Require Numbers","boolean"), F("requireSymbols","Require Special Symbols","boolean"), F("expiryDays","Password Expiration (Days)","number"), F("lockoutAttempts","Account Lockout After Attempts","number")) }},
                Actions=new(){ A("create","Create Policy","primary","Plus"), A("edit","Edit Policy","secondary","Pencil") } }),

            new("security.single-sign-on", "SsoConfiguration", "Single Sign-On (SSO / SAML)", "Okta, Azure Active Directory, Google Workspace, and SAML 2.0 / OIDC federation.", "security", "table", "/security/single-sign-on", "KeyRound", "security.sso.read",
            new DynamicPageSchemaDto { PageKey="security.single-sign-on", EntityName="SsoConfiguration", Title="Single Sign-On (SSO / SAML 2.0)", SubTitle="Configure SAML 2.0 metadata and OpenID Connect (OIDC) identity providers for enterprise logins.", ViewType="table", ApiEndpoint="/api/v1/security/sso",
                Columns=new(){ Col("providerName","Identity Provider",width:200), Col("protocol","Protocol",width:120), Col("issuerUrl","Issuer / Metadata URL",width:280), BadgeCol("isEnabled","Status","{\"true\":\"Active (SSO Enabled)\",\"false\":\"Disabled\"}",180) },
                Filters=new(){ TF("search","Search IdP") },
                Form=new(){ Sections=new(){ Sec("sso","Identity Provider Federation", F("providerName","Provider Name (e.g. Azure AD, Okta)",req:true), FSel("protocol","Protocol",req:true,("SAML","SAML 2.0"),("OIDC","OpenID Connect (OIDC)")), F("issuerUrl","Issuer Entity ID / Metadata URL",req:true), F("clientId","Client ID / App ID"), F("clientSecret","Client Secret","password"), F("isEnabled","Enable Corporate SSO","boolean")) }},
                Actions=new(){ A("create","Configure SSO Provider","primary","Plus"), A("edit","Edit IdP","secondary","Pencil") } }),

            new("security.multi-factor-authentication", "MfaSetting", "Multi-Factor Authentication (MFA)", "TOTP authenticator app enforcement and SMS OTP configuration.", "security", "table", "/security/multi-factor-authentication", "Smartphone", "security.mfa.read",
            new DynamicPageSchemaDto { PageKey="security.multi-factor-authentication", EntityName="MfaSetting", Title="Multi-Factor Authentication (MFA)", SubTitle="Enforce TOTP authenticator (Google/Microsoft Authenticator) across roles or entire tenant.", ViewType="table", ApiEndpoint="/api/v1/security/mfa",
                Columns=new(){ Col("scope","Enforcement Level",width:200), Col("methods","Permitted Methods",width:220), Col("gracePeriodDays","Grace Period (Days)","number",width:150), BadgeCol("enforced","Enforcement","{\"true\":\"Mandatory\",\"false\":\"Optional\"}",120) },
                Filters=new(){ TF("search","Search") },
                Form=new(){ Sections=new(){ Sec("mfa","MFA Security Rules", FSel("scope","Scope",req:true,("AllUsers","All Corporate Users"),("AdminsOnly","Administrators & HR Only"),("CustomRoles","Specific Roles")), F("enforced","Make MFA Mandatory for Login","boolean"), F("gracePeriodDays","Grace Period for Setup (Days)","number")) }},
                Actions=new(){ A("save","Save Policy","primary","Save") } }),

            new("assets.depreciation", "AssetDepreciation", "Asset Depreciation Schedules", "Fixed asset depreciation calculations, book value schedules, and write-offs.", "assets", "table", "/assets/depreciation", "TrendingDown", "assets.depreciation.read",
            new DynamicPageSchemaDto { PageKey="assets.depreciation", EntityName="AssetDepreciation", Title="Asset Depreciation Schedules", SubTitle="Track straight-line and reducing-balance asset depreciation, current book values, and salvage amounts.", ViewType="table", ApiEndpoint="/api/v1/assets/depreciation",
                Columns=new(){ Col("assetCode","Asset Code",width:140), Col("assetName","Asset Name",width:220), Col("method","Method",width:150), Col("depreciationRate","Rate (%)","number",width:110), Col("originalCost","Cost","currency",width:140), Col("accumulatedDepreciation","Accumulated Depr.","currency",width:160), Col("currentBookValue","Net Book Value","currency",width:160) },
                Filters=new(){ TF("search","Search asset"), SF("method","Method",("StraightLine","Straight Line"),("WrittenDownValue","Written Down Value (WDV)")) },
                Form=new(){ Sections=new(){ Sec("depr","Depreciation Details", F("assetCode","Asset Code",req:true), F("assetName","Asset Name",req:true), FSel("method","Depreciation Method",req:true,("StraightLine","Straight Line"),("WrittenDownValue","Written Down Value")), F("depreciationRate","Depreciation Rate (%)","number",req:true), F("originalCost","Original Purchase Cost","currency",req:true), F("salvageValue","Residual / Salvage Value","currency")) }},
                Actions=new(){ A("create","Post Depreciation","primary","Plus"), A("export","Export Schedule","ghost","Download") } }),

            new("crm.contacts", "CrmContact", "CRM Contacts & Directory", "Customer and lead contact directory, phone numbers, and communication history.", "crm", "table", "/crm/contacts", "Users", "crm.contacts.read",
            new DynamicPageSchemaDto { PageKey="crm.contacts", EntityName="CrmContact", Title="CRM Contacts Directory", SubTitle="Directory of client stakeholders, phone numbers, email addresses, and key decision makers.", ViewType="table", ApiEndpoint="/api/v1/crm/contacts",
                Columns=new(){ Col("fullName","Full Name",width:200), Col("email","Email Address",width:200), Col("phoneNumber","Phone Number",width:150), Col("jobTitle","Job Title / Role",width:160), Col("companyName","Organization",width:180), BadgeCol("isPrimary","Primary Contact","{\"true\":\"Primary\",\"false\":\"Secondary\"}",130) },
                Filters=new(){ TF("search","Search name, email, or company") },
                Form=new(){ Sections=new(){ Sec("contact","Contact Information", F("fullName","Full Name",req:true), F("email","Email Address","email",req:true), F("phoneNumber","Phone Number","tel"), F("jobTitle","Job Title / Designation"), F("companyName","Company / Client Name"), F("isPrimary","Designate as Primary Contact","boolean")) }},
                Actions=new(){ A("create","Add Contact","primary","Plus"), A("export","Export Contacts","ghost","Download") } }),

            new("crm.pipeline", "CrmPipelineStage", "CRM Deals & Pipeline Stages", "Kanban sales pipeline stages, deal probabilities, and revenue forecasts.", "crm", "table", "/crm/pipeline", "GitCommit", "crm.pipeline.read",
            new DynamicPageSchemaDto { PageKey="crm.pipeline", EntityName="CrmPipelineStage", Title="Sales Pipeline Stages & Quotas", SubTitle="Define sales stages, weighted probability percentages, and deal stage velocity rules.", ViewType="table", ApiEndpoint="/api/v1/crm/pipeline",
                Columns=new(){ Col("stageName","Stage Name",width:200), Col("sortOrder","Sequence","number",width:100), Col("winProbability","Probability (%)","number",width:130), Col("dealsCount","Active Deals","number",width:120), Col("pipelineValue","Total Value","currency",width:160), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Archived\"}",100) },
                Filters=new(){ TF("search","Search stage") },
                Form=new(){ Sections=new(){ Sec("stage","Pipeline Stage Configuration", F("stageName","Stage Title (e.g. Qualified, Demo, Proposal)",req:true), F("sortOrder","Sequence Order","number",req:true), F("winProbability","Win Probability (0-100%)","number",req:true), F("isActive","Active Pipeline Stage","boolean")) }},
                Actions=new(){ A("create","Add Pipeline Stage","primary","Plus") } }),

            new("helpdesk.escalations", "HelpdeskEscalation", "SLA Escalations & Breaches", "Automated ticket escalations, SLA violation alerts, and supervisor notifications.", "helpdesk", "table", "/helpdesk/escalations", "AlertTriangle", "helpdesk.escalations.read",
            new DynamicPageSchemaDto { PageKey="helpdesk.escalations", EntityName="HelpdeskEscalation", Title="Helpdesk SLA Escalations", SubTitle="Real-time ledger of tickets breaching first-response or resolution SLAs and elevated to management.", ViewType="table", ApiEndpoint="/api/v1/helpdesk/escalations",
                Columns=new(){ Col("ticketNumber","Ticket #",width:130), Col("subject","Subject",width:240), BadgeCol("severity","Severity","{\"Low\":\"Low\",\"Medium\":\"Medium\",\"High\":\"High\",\"Critical\":\"Critical\"}",110), Col("assignedToName","Escalated Assignee",width:180), Col("escalatedAt","Escalated On","datetime",width:160), BadgeCol("status","Resolution","{\"Pending\":\"Pending Action\",\"Resolved\":\"Resolved\"}",130) },
                Filters=new(){ TF("search","Search ticket # or subject"), SF("severity","Severity",("Low","Low"),("Medium","Medium"),("High","High"),("Critical","Critical")), SF("status","Status",("Pending","Pending Action"),("Resolved","Resolved")) },
                Form=new(){ Sections=new(){ Sec("esc","Escalation Case", F("ticketNumber","Ticket Reference #",req:true), F("subject","Issue Summary",req:true), FSel("severity","Severity Level",req:true,("Low","Low"),("Medium","Medium"),("High","High"),("Critical","Critical")), F("escalationReason","Escalation Reason / SLA Breach Log",req:true)) }},
                Actions=new(){ A("resolve","Acknowledge & Reassign","primary","CheckCircle") } }),

            new("helpdesk.faq", "HelpdeskFaq", "Helpdesk Knowledge Base & FAQ", "Self-service customer articles, troubleshooting guides, and categorized FAQs.", "helpdesk", "table", "/helpdesk/faq", "HelpCircle", "helpdesk.faq.read",
            new DynamicPageSchemaDto { PageKey="helpdesk.faq", EntityName="HelpdeskFaq", Title="Knowledge Base & FAQs", SubTitle="Publish self-service articles, employee onboarding guides, and common troubleshooting answers.", ViewType="table", ApiEndpoint="/api/v1/helpdesk/faq",
                Columns=new(){ Col("question","Question / Article Title",width:300), Col("category","Category",width:160), Col("viewsCount","Views","number",width:100), Col("helpfulCount","Helpful Ratings","number",width:130), BadgeCol("isPublished","Published","{\"true\":\"Published\",\"false\":\"Draft\"}",110) },
                Filters=new(){ TF("search","Search question or keyword"), SF("category","Category",("General","General"),("IT","IT Support"),("HR","HR & Payroll"),("Billing","Billing & Invoices")) },
                Form=new(){ Sections=new(){ Sec("faq","Knowledge Article", F("question","Question / Title",req:true), FSel("category","Category",req:true,("General","General"),("IT","IT Support"),("HR","HR & Payroll"),("Billing","Billing & Invoices")), F("answer","Answer / Resolution Steps","textarea",req:true), F("isPublished","Publish Article","boolean")) }},
                Actions=new(){ A("create","New Article","primary","Plus") } }),

            new("communication.announcements", "CompanyAnnouncement", "Company Announcements", "Broadcast organization-wide news, holiday notices, and executive memos.", "communication", "table", "/communication/announcements", "Megaphone", "communication.announcements.read",
            new DynamicPageSchemaDto { PageKey="communication.announcements", EntityName="CompanyAnnouncement", Title="Company Announcements", SubTitle="Broadcast organization notices, HR policy updates, and executive communications with read receipts.", ViewType="table", ApiEndpoint="/api/v1/communication/announcements",
                Columns=new(){ Col("title","Announcement Title",width:260), Col("category","Category",width:150), Col("publishedAt","Published Date","datetime",width:160), Col("targetAudience","Audience",width:160), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Archived\"}",100) },
                Filters=new(){ TF("search","Search announcements") },
                Form=new(){ Sections=new(){ Sec("announcement","Announcement Details", F("title","Headline / Title",req:true), FSel("category","Category",req:true,("General","General"),("HR","HR & Welfare"),("Emergency","Urgent / Alert"),("Celebration","Celebration / Event")), FSel("targetAudience","Target Audience",req:true,("All","All Employees"),("Corporate","Headquarters"),("Field","Field Staff")), F("content","Announcement Body","textarea",req:true), F("isActive","Publish Live","boolean")) }},
                Actions=new(){ A("create","Publish Announcement","primary","Plus") } }),

            new("communication.email-templates", "CommunicationEmailTemplate", "System Email Templates", "Transactional email templates, merge tags, and notifications.", "communication", "table", "/communication/email-templates", "Mail", "communication.templates.read",
            new DynamicPageSchemaDto { PageKey="communication.email-templates", EntityName="CommunicationEmailTemplate", Title="Transactional Email Templates", SubTitle="Design and customize automated emails for invoices, welcome letters, password resets, and alerts.", ViewType="table", ApiEndpoint="/api/v1/communication/email-templates",
                Columns=new(){ Col("name","Template Identifier",width:200), Col("subject","Default Subject",width:280), Col("category","Module / Category",width:150), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Disabled\"}",100) },
                Filters=new(){ TF("search","Search template name or subject") },
                Form=new(){ Sections=new(){ Sec("tpl","Email Design", F("name","Unique Template Code (e.g. invoice_paid)",req:true), F("subject","Email Subject Line",req:true), F("category","Module Category"), F("htmlBody","HTML Template Body with Merge Tags {{name}}","textarea",req:true), F("isActive","Enable Template","boolean")) }},
                Actions=new(){ A("create","Create Template","primary","Plus") } }),

            new("communication.sms-templates", "CommunicationSmsTemplate", "SMS & WhatsApp Templates", "DLT-registered transactional SMS and WhatsApp business notification templates.", "communication", "table", "/communication/sms-templates", "MessageSquare", "communication.templates.read",
            new DynamicPageSchemaDto { PageKey="communication.sms-templates", EntityName="CommunicationSmsTemplate", Title="SMS & WhatsApp Notification Templates", SubTitle="Configure DLT-approved SMS sender IDs, message bodies, and WhatsApp HSM notification templates.", ViewType="table", ApiEndpoint="/api/v1/communication/sms-templates",
                Columns=new(){ Col("templateId","DLT Template ID",width:170), Col("senderId","Sender ID / Header",width:140), Col("channel","Channel",width:120), Col("messagePreview","Message Sample",width:320), BadgeCol("status","Status","{\"Approved\":\"DLT Approved\",\"Pending\":\"Pending Approval\"}",130) },
                Filters=new(){ TF("search","Search sender ID or text"), SF("channel","Channel",("SMS","SMS"),("WhatsApp","WhatsApp")) },
                Form=new(){ Sections=new(){ Sec("sms","SMS / WhatsApp Template", F("templateId","Registered DLT Template ID",req:true), F("senderId","Approved Sender Header (6 Chars)",req:true), FSel("channel","Channel",req:true,("SMS","SMS Gateway"),("WhatsApp","WhatsApp Business API")), F("messageText","Message Template with Variables {#var#}","textarea",req:true)) }},
                Actions=new(){ A("create","Register Template","primary","Plus") } }),

            new("integrations.api-keys", "TenantApiKey", "API Keys & Developer Tokens", "Tenant REST API access tokens, granular OAuth scopes, and rate limiting.", "integrations", "table", "/integrations/api-keys", "Key", "integrations.apikeys.read",
            new DynamicPageSchemaDto { PageKey="integrations.api-keys", EntityName="TenantApiKey", Title="Tenant API Keys & Developer Tokens", SubTitle="Generate scoped API credentials for connecting ERP data to external BI tools, CRMs, or e-commerce platforms.", ViewType="table", ApiEndpoint="/api/v1/integrations/api-keys",
                Columns=new(){ Col("keyName","Key Label / Name",width:200), Col("maskedKey","API Key Token",width:200), Col("scopes","Assigned Scopes",width:220), Col("createdAt","Generated Date","datetime",width:160), Col("lastUsedAt","Last Invoked","datetime",width:160), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Revoked\"}",100) },
                Filters=new(){ TF("search","Search key name") },
                Form=new(){ Sections=new(){ Sec("key","API Key Credentials", F("keyName","Key Name / System (e.g. Shopify Connector)",req:true), FSel("scopes","Permissions Scope",req:true,("read_only","Read Only (All Modules)"),("read_write","Full Read & Write Access"),("finance_only","Finance Only")), F("expiryDays","Key Validity (Days)","number")) }},
                Actions=new(){ A("create","Generate New Key","primary","Plus"), A("revoke","Revoke Key","danger","Trash2") } }),

            new("integrations.apps", "MarketplaceApp", "Connected Third-Party Apps", "Active connectors for payment gateways, accounting software, and logistics partners.", "integrations", "table", "/integrations/apps", "AppWindow", "integrations.apps.read",
            new DynamicPageSchemaDto { PageKey="integrations.apps", EntityName="MarketplaceApp", Title="Connected Apps & Ecosystem", SubTitle="Manage verified integrations with Razorpay, Stripe, WhatsApp, Tally, Zoho, and AWS.", ViewType="table", ApiEndpoint="/api/v1/integrations/apps",
                Columns=new(){ Col("appName","Application",width:200), Col("category","Category",width:150), Col("connectedAccount","Linked Account",width:220), BadgeCol("connectionStatus","Connection","{\"Connected\":\"Connected (Healthy)\",\"Disconnected\":\"Disconnected\",\"Error\":\"Error\"}",170) },
                Filters=new(){ TF("search","Search app name") },
                Form=new(){ Sections=new(){ Sec("app","Connection Credentials", F("appName","Application Name",req:true), F("apiKeyOrSecret","API Key / Secret Token","password",req:true), F("webhookUrl","Webhook Callback Endpoint")) }},
                Actions=new(){ A("sync","Test & Sync Connection","secondary","RefreshCw") } }),

            new("integrations.logs", "IntegrationLog", "Webhook & API Sync Logs", "Real-time webhook payloads, external API responses, and retry diagnostics.", "integrations", "table", "/integrations/logs", "Terminal", "integrations.logs.read",
            new DynamicPageSchemaDto { PageKey="integrations.logs", EntityName="IntegrationLog", Title="API & Webhook Sync Logs", SubTitle="Diagnostic ledger of inbound webhook deliveries, outbound ERP sync payloads, and HTTP status codes.", ViewType="table", ApiEndpoint="/api/v1/integrations/logs",
                Columns=new(){ Col("timestamp","Timestamp","datetime",width:160), Col("serviceName","Integration Service",width:160), Col("direction","Direction",width:110), Col("endpointUrl","Endpoint URL",width:260), Col("httpStatus","HTTP Status","number",width:110), BadgeCol("status","Result","{\"Success\":\"Success (2xx)\",\"Failed\":\"Failed (4xx/5xx)\"}",140) },
                Filters=new(){ TF("search","Search URL or service"), SF("status","Result",("Success","Success"),("Failed","Failed")) },
                Form=new(){ Sections=new() },
                Actions=new(){ A("retry","Retry Failed Payload","secondary","RotateCcw") } }),

            new("licensing.billing-history", "TenantSubscriptionInvoice", "Subscription Billing History", "Platform SaaS subscription receipts, tax invoices, and payment references.", "licensing", "table", "/licensing/billing-history", "Receipt", "licensing.billing.read",
            new DynamicPageSchemaDto { PageKey="licensing.billing-history", EntityName="TenantSubscriptionInvoice", Title="Subscription Invoices & Receipts", SubTitle="Historical ledger of SaaS subscription billing cycles, GST tax invoices, and payment confirmations.", ViewType="table", ApiEndpoint="/api/v1/licensing/billing-history",
                Columns=new(){ Col("invoiceNumber","Invoice #",width:160), Col("billingCycle","Billing Period",width:180), Col("amountPaid","Amount Paid","currency",width:140), Col("gstAmount","GST Amount","currency",width:130), Col("paidAt","Payment Date","datetime",width:160), BadgeCol("paymentStatus","Status","{\"Paid\":\"Paid\",\"Pending\":\"Pending\",\"Failed\":\"Failed\"}",110) },
                Filters=new(){ TF("search","Search invoice #") },
                Form=new(){ Sections=new() },
                Actions=new(){ A("download","Download Tax Invoice (PDF)","primary","Download") } }),

            new("licensing.subscriptions", "TenantSubscription", "SaaS Subscriptions & Plans", "Current ERP edition, seat allocations, add-on modules, and renewal dates.", "licensing", "table", "/licensing/subscriptions", "CreditCard", "licensing.subscriptions.read",
            new DynamicPageSchemaDto { PageKey="licensing.subscriptions", EntityName="TenantSubscription", Title="SaaS Subscription Plan & Add-Ons", SubTitle="Overview of active enterprise tier (Starter / Professional / Enterprise), licensed user seats, and renewal schedule.", ViewType="table", ApiEndpoint="/api/v1/licensing/subscriptions",
                Columns=new(){ Col("planName","Subscription Tier",width:180), Col("licensedSeats","Licensed Seats","number",width:130), Col("usedSeats","Active Seats","number",width:120), Col("renewalDate","Next Renewal Date","date",width:160), BadgeCol("status","Plan Status","{\"Active\":\"Active\",\"Trial\":\"Free Trial\",\"Expired\":\"Expired\"}",120) },
                Filters=new(){ TF("search","Search") },
                Form=new(){ Sections=new(){ Sec("sub","Plan Upgrade", FSel("planName","Select Plan",req:true,("Professional","Professional Edition"),("Enterprise","Enterprise Edition")), F("licensedSeats","Number of Seats Required","number",req:true)) }},
                Actions=new(){ A("upgrade","Upgrade Plan","primary","ArrowUpRight") } }),

            new("licensing.usage", "TenantUsageMetric", "Resource Usage & Storage Limits", "Tenant cloud database storage, monthly API call consumption, and active employee counts.", "licensing", "table", "/licensing/usage", "Activity", "licensing.usage.read",
            new DynamicPageSchemaDto { PageKey="licensing.usage", EntityName="TenantUsageMetric", Title="Tenant Resource Consumption", SubTitle="Live telemetry on database storage size, monthly document attachments, API quota utilization, and user counts.", ViewType="table", ApiEndpoint="/api/v1/licensing/usage",
                Columns=new(){ Col("metricName","Resource / Metric",width:220), Col("currentUsage","Current Usage",width:150), Col("allocatedLimit","Plan Quota / Limit",width:150), Col("utilizationPercent","Utilization (%)","number",width:140), BadgeCol("healthStatus","Status","{\"Normal\":\"Optimal\",\"Warning\":\"Approaching Limit\",\"Exceeded\":\"Exceeded\"}",140) },
                Filters=new(){ TF("search","Search metric") },
                Form=new(){ Sections=new() },
                Actions=new(){ A("refresh","Refresh Metrics","secondary","RefreshCw") } }),

            new("finance.vendor-bills", "VendorBill", "Vendor Bills & Accounts Payable", "Supplier bills, TDS deductions, three-way purchase matching, and disbursements.", "finance", "table", "/vendor-bills", "FileText", "finance.bills.read",
            new DynamicPageSchemaDto { PageKey="finance.vendor-bills", EntityName="VendorBill", Title="Vendor Bills & Accounts Payable", SubTitle="Record incoming vendor invoices, match against purchase orders and GRNs, calculate TDS, and approve payouts.", ViewType="table", ApiEndpoint="/api/v1/vendor-bills",
                Columns=new(){ Col("billNumber","Bill #",width:140), Col("vendorName","Vendor / Supplier",width:220), Col("billDate","Bill Date","date",width:130), Col("dueDate","Due Date","date",width:130), Col("totalAmount","Total Amount","currency",width:150), Col("tdsAmount","TDS Deducted","currency",width:130), Col("balanceDue","Balance Due","currency",width:150), BadgeCol("paymentStatus","Status","{\"Unpaid\":\"Unpaid\",\"PartiallyPaid\":\"Partial\",\"Paid\":\"Paid\"}",130) },
                Filters=new(){ TF("search","Search bill # or vendor"), SF("paymentStatus","Payment Status",("Unpaid","Unpaid"),("PartiallyPaid","Partially Paid"),("Paid","Paid")), DF("dueDate","Due Before") },
                Form=new(){ Sections=new(){ Sec("bill","Bill Details", F("billNumber","Vendor Invoice / Bill #",req:true), F("vendorName","Vendor Name",req:true), F("billDate","Bill Date","date",req:true), F("dueDate","Payment Due Date","date",req:true), F("totalAmount","Total Invoice Amount","currency",req:true), F("tdsAmount","TDS Deduction","currency"), F("notes","Payment Notes / Instructions","textarea")) }},
                Actions=new(){ A("create","Record Vendor Bill","primary","Plus"), A("approve","Approve Bill","secondary","CheckCircle") } }),

            // ══════════ MISSING ENTERPRISE MASTER SCHEMAS ══════════
            new("hrms.employment-types", "EmploymentType", "Employment Types Master", "Organizational employment categories, notice period parameters, and benefits eligibility.", "hrms", "table", "/hrms/employment-types", "Users", "hrms.employees.read",
            new DynamicPageSchemaDto { PageKey="hrms.employment-types", EntityName="EmploymentType", Title="Employment Types Master", SubTitle="Define employment classifications (Regular, Contractor, Intern, Consultant) and statutory parameters.", ViewType="table", ApiEndpoint="/api/v1/hrms/employment-types",
                Columns=new(){ Col("code","Code",width:120), Col("name","Category Name",width:200), Col("category","Classification",width:160), Col("noticePeriodDays","Notice Period (Days)","number",width:150), BadgeCol("benefitsEligible","Statutory Benefits","{\"true\":\"Eligible\",\"false\":\"Ineligible\"}",140), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search types"), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("basic","Employment Classification", F("code","Category Code",req:true), F("name","Classification Title",req:true), FSel("category","Tier / Type",req:true,("Regular","Regular"),("Contractor","Contractor"),("Intern","Intern"),("Executive","Executive"),("Consultant","Consultant")), F("noticePeriodDays","Notice Period (Days)","number",req:true), F("benefitsEligible","Statutory Benefits Eligible","boolean"), F("description","Policy Notes / Description","textarea",span:2), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","New Employment Type","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("hrms.grades", "EmployeeGrade", "Employee Grade Master", "Organizational grade levels, career progression bands, and salary brackets.", "hrms", "table", "/hrms/grades", "Award", "hrms.employees.read",
            new DynamicPageSchemaDto { PageKey="hrms.grades", EntityName="EmployeeGrade", Title="Employee Grade & Hierarchy Bands", SubTitle="Standardized corporate levels, seniority tiers, and CTC compensation bandwidths.", ViewType="table", ApiEndpoint="/api/v1/hrms/grades",
                Columns=new(){ Col("code","Grade Code",width:120), Col("name","Grade Title",width:220), Col("level","Seniority Level","number",width:130), Col("minSalary","Min Annual CTC","currency",width:160), Col("maxSalary","Max Annual CTC","currency",width:160), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search grades"), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("grade","Grade Details", F("code","Grade Code (e.g. L1, M2)",req:true), F("name","Grade Title",req:true), F("level","Hierarchy Rank / Level","number",req:true), F("minSalary","Minimum CTC (INR)","currency"), F("maxSalary","Maximum CTC (INR)","currency"), F("description","Eligibility Criteria & Responsibilities","textarea",span:2), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add Employee Grade","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("hrms.leave-types", "LeaveType", "Leave Types & Quotas Master", "Statutory absence policies, paid vs unpaid allowances, and accrual frequencies.", "hrms", "table", "/hrms/leave-types", "Calendar", "hrms.leave.read",
            new DynamicPageSchemaDto { PageKey="hrms.leave-types", EntityName="LeaveType", Title="Leave Types & Quotas Master", SubTitle="Configure statutory leaves (Casual, Sick, Privilege, Maternity) and yearly entitlements.", ViewType="table", ApiEndpoint="/api/v1/hrms/leave-types",
                Columns=new(){ Col("code","Code",width:110), Col("name","Leave Type",width:220), Col("annualQuota","Annual Quota (Days)","number",width:160), BadgeCol("isPaid","Paid Leave","{\"true\":\"Paid\",\"false\":\"Unpaid\"}",120), BadgeCol("carryForwardAllowed","Carry Forward","{\"true\":\"Allowed\",\"false\":\"No\"}",130), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search leave types"), SF("isPaid","Type",("true","Paid"),("false","Unpaid")), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("policy","Leave Policy Details", F("code","Leave Code (e.g. CL, SL, PL)",req:true), F("name","Leave Type Name",req:true), F("annualQuota","Yearly Allocation (Days)","number",req:true), F("isPaid","Paid Absence","boolean"), F("carryForwardAllowed","Allow Year-End Rollover","boolean"), F("maxCarryForwardDays","Max Carry Forward Days","number"), F("description","Policy Guidelines & Restrictions","textarea",span:2), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add Leave Type","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.number-ranges", "DocumentNumberRange", "Document Number Ranges Master", "ERP document numbering sequences, prefixes, padding length, and counter rules.", "administration", "table", "/administration/number-ranges", "Hash", "administration.settings.read",
            new DynamicPageSchemaDto { PageKey="administration.number-ranges", EntityName="DocumentNumberRange", Title="Document Number Ranges Master", SubTitle="Configure automated numbering sequences for Invoices, Orders, POs, and Vouchers.", ViewType="table", ApiEndpoint="/api/v1/administration/number-ranges",
                Columns=new(){ Col("module","Module",width:140), Col("documentType","Document Type",width:180), Col("prefix","Prefix",width:120), Col("currentNumber","Current Counter","number",width:140), Col("paddingLength","Padding Length","number",width:130), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search number ranges"), SF("module","Module",("Finance","Finance"),("Sales","Sales"),("Procurement","Procurement"),("HRMS","HRMS")) },
                Form=new(){ Sections=new(){ Sec("range","Number Range Configuration", FSel("module","ERP Module",req:true,("Finance","Finance"),("Sales","Sales"),("Procurement","Procurement"),("Inventory","Inventory"),("HRMS","HRMS")), F("documentType","Document Type (e.g. Sales Invoice)",req:true), F("prefix","Prefix (e.g. INV-, PO-)",req:true), F("currentNumber","Starting / Current Number","number",req:true), F("paddingLength","Zero Padding (e.g. 5 for 00001)","number",req:true), F("suffix","Optional Suffix"), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","New Number Range","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("administration.payment-terms", "PaymentTerm", "Payment Terms Master", "Commercial payment schedules, cash discounts, and credit terms according to SAP OBB8.", "administration", "table", "/administration/payment-terms", "CreditCard", "administration.settings.read",
            new DynamicPageSchemaDto { PageKey="administration.payment-terms", EntityName="PaymentTerm", Title="Payment Terms Master", SubTitle="Define credit terms, Net days, and cash discount schedules for sales & procurement.", ViewType="table", ApiEndpoint="/api/v1/payment-terms",
                Columns=new(){ Col("termCode","Term Code",width:130), Col("description","Term Description",width:240), Col("netDays","Net Days","number",width:110), Col("discountPercentage","Discount %","number",width:120), Col("discountDays","Discount Days","number",width:130), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search terms"), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("terms","Payment Terms Details", F("termCode","Term Code (e.g. NET30, 2/10NET30)",req:true), F("description","Description",req:true,span:2), F("netDays","Net Due Days","number",req:true), F("discountPercentage","Early Payment Discount (%)","number"), F("discountDays","Discount Window (Days)","number"), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","New Payment Term","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("assets.fleet", "Vehicle", "Fleet & Vehicle Master", "Corporate fleet management, tracking, drivers, maintenance schedules, and fuel logs.", "assets", "table", "/fleet", "Truck", "assets.read",
            new DynamicPageSchemaDto { PageKey="assets.fleet", EntityName="Vehicle", Title="Fleet & Vehicle Master", SubTitle="Manage company logistics vehicles, commercial permits, inspection dates, and driver allocations.", ViewType="table", ApiEndpoint="/api/v1/fleet",
                Columns=new(){ Col("vehicleNumber","Registration #",width:150), Col("model","Vehicle Model",width:180), Col("vehicleType","Type",width:140), Col("assignedDriver","Assigned Driver",width:180), BadgeCol("status","Status","{\"Active\":\"Active\",\"InMaintenance\":\"Service\",\"Decommissioned\":\"Decommissioned\"}",130) },
                Filters=new(){ TF("search","Search vehicle #"), SF("status","Status",("Active","Active"),("InMaintenance","Maintenance"),("Decommissioned","Decommissioned")) },
                Form=new(){ Sections=new(){ Sec("vehicle","Vehicle Specification", F("vehicleNumber","Registration / Plate #",req:true), F("model","Make & Model",req:true), FSel("vehicleType","Category",req:true,("CommercialTruck","Heavy Commercial Truck"),("DeliveryVan","Delivery Van"),("CorporateSedan","Corporate Sedan"),("Forklift","Warehouse Forklift")), F("assignedDriver","Assigned Driver"), F("fuelType","Fuel Type"), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Register Vehicle","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("projects.field-service", "ServiceTicket", "Field Service & Maintenance Tickets", "On-site equipment repairs, customer callouts, technician dispatch, and SLA completion.", "projects", "table", "/field-service", "Wrench", "projects.read",
            new DynamicPageSchemaDto { PageKey="projects.field-service", EntityName="ServiceTicket", Title="Field Service Tickets", SubTitle="Track customer service tickets, technician dispatches, parts replacement, and customer sign-off.", ViewType="table", ApiEndpoint="/api/v1/field-service",
                Columns=new(){ Col("ticketNumber","Ticket #",width:130), Col("title","Issue Summary",width:240), Col("customerName","Customer / Client",width:180), Col("technicianName","Assigned Technician",width:170), BadgeCol("priority","Priority","{\"High\":\"High\",\"Medium\":\"Medium\",\"Low\":\"Low\",\"Urgent\":\"Urgent\"}",110), BadgeCol("status","Status","{\"Open\":\"Open\",\"InProgress\":\"In Progress\",\"Resolved\":\"Resolved\",\"Closed\":\"Closed\"}",130) },
                Filters=new(){ TF("search","Search ticket or client"), SF("status","Status",("Open","Open"),("InProgress","In Progress"),("Resolved","Resolved")) },
                Form=new(){ Sections=new(){ Sec("ticket","Service Request", F("ticketNumber","Ticket #",req:true), F("title","Issue Summary",req:true), F("customerName","Client / Customer",req:true), F("technicianName","Dispatched Technician"), FSel("priority","Severity",req:true,("Urgent","Urgent"),("High","High"),("Medium","Medium"),("Low","Low")), F("description","Problem Description & Site Notes","textarea",span:2)) }},
                Actions=new(){ A("create","New Service Ticket","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            // ══════════ ALIASES FOR FRONTEND ROUTE KEYS ══════════
            new("procurement.vendor-bills", "VendorBill", "Vendor Bills & Accounts Payable", "Supplier bills, TDS deductions, three-way purchase matching, and disbursements.", "procurement", "table", "/vendor-bills", "FileText", "finance.bills.read",
            new DynamicPageSchemaDto { PageKey="procurement.vendor-bills", EntityName="VendorBill", Title="Vendor Bills & Accounts Payable", SubTitle="Record incoming vendor invoices, match against purchase orders and GRNs, calculate TDS, and approve payouts.", ViewType="table", ApiEndpoint="/api/v1/vendor-bills",
                Columns=new(){ Col("billNumber","Bill #",width:140), Col("vendorName","Vendor / Supplier",width:220), Col("billDate","Bill Date","date",width:130), Col("dueDate","Due Date","date",width:130), Col("totalAmount","Total Amount","currency",width:150), Col("tdsAmount","TDS Deducted","currency",width:130), Col("balanceDue","Balance Due","currency",width:150), BadgeCol("paymentStatus","Status","{\"Unpaid\":\"Unpaid\",\"PartiallyPaid\":\"Partial\",\"Paid\":\"Paid\"}",130) },
                Filters=new(){ TF("search","Search bill # or vendor"), SF("paymentStatus","Payment Status",("Unpaid","Unpaid"),("PartiallyPaid","Partially Paid"),("Paid","Paid")), DF("dueDate","Due Before") },
                Form=new(){ Sections=new(){ Sec("bill","Bill Details", F("billNumber","Vendor Invoice / Bill #",req:true), F("vendorName","Vendor Name",req:true), F("billDate","Bill Date","date",req:true), F("dueDate","Payment Due Date","date",req:true), F("totalAmount","Total Invoice Amount","currency",req:true), F("tdsAmount","TDS Deduction","currency"), F("notes","Payment Notes / Instructions","textarea")) }},
                Actions=new(){ A("create","Record Vendor Bill","primary","Plus"), A("approve","Approve Bill","secondary","CheckCircle") } }),

            new("inventory.wms", "Warehouse", "Warehouse & Inventory Locations", "Physical facilities, storage bins, aisle locations, and stock holding capacities.", "inventory", "table", "/inventory/warehouse-management", "Warehouse", "inventory.warehouses.read",
            new DynamicPageSchemaDto { PageKey="inventory.wms", EntityName="Warehouse", Title="Warehouse & Storage Locations", SubTitle="Manage main depots, transit hubs, cold storage, and shop floor staging locations.", ViewType="table", ApiEndpoint="/api/v1/inventory/warehouses",
                Columns=new(){ Col("warehouseCode","Code",width:110), Col("warehouseName","Warehouse Name",width:220), Col("city","City",width:140), Col("state","State",width:140), Col("managerName","Manager / Supervisor",width:180), BadgeCol("isDefault","Default Depot","{\"true\":\"Default\",\"false\":\"Standard\"}",120), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search warehouse"), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("details","Depot Information", F("warehouseCode","Warehouse Code",req:true), F("warehouseName","Warehouse Name",req:true), F("city","City",req:true), F("state","State"), F("managerName","Manager / Contact Person"), F("isDefault","Set as Primary Depot","boolean"), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add Warehouse","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),

            new("procurement.grn", "GoodsReceipt", "Goods Receipt Notes (GRN)", "Inward material inspections, delivery challans, PO matching, and stock put-away.", "procurement", "table", "/procurement/goods-receipt-notes", "PackageCheck", "procurement.orders.read",
            new DynamicPageSchemaDto { PageKey="procurement.grn", EntityName="GoodsReceipt", Title="Goods Receipt Notes (GRN)", SubTitle="Receive supplier shipments, log physical inspections, verify PO quantities, and approve store inwarding.", ViewType="table", ApiEndpoint="/api/v1/grn",
                Columns=new(){ Col("grnNumber","GRN #",width:140), Col("poNumber","Purchase Order",width:150), Col("vendorName","Vendor / Supplier",width:200), Col("receivedDate","Receipt Date","date",width:130), Col("totalItems","Items Count","number",width:120), BadgeCol("inspectionStatus","Inspection","{\"Passed\":\"Accepted\",\"Rejected\":\"Rejected\",\"Pending\":\"Pending QA\"}",130) },
                Filters=new(){ TF("search","Search GRN # or vendor"), SF("inspectionStatus","QA Status",("Passed","Accepted"),("Rejected","Rejected"),("Pending","Pending")) },
                Form=new(){ Sections=new(){ Sec("grn","GRN Header", F("grnNumber","GRN Number",req:true), F("poNumber","PO Number",req:true), F("vendorName","Supplier Name",req:true), F("receivedDate","Receipt Date","date",req:true), FSel("inspectionStatus","Inspection Result",req:true,("Passed","Accepted / Cleared"),("Rejected","Quality Rejection"),("Pending","Pending QA Inspection")), F("remarks","Receiving Notes / Discrepancies","textarea")) }},
                Actions=new(){ A("create","Create GRN","primary","Plus"), A("print","Print Note","ghost","Printer") } }),

            new("crm.customers", "Customer", "Customer Accounts & Clients", "B2B client directories, billing contacts, tax classifications, and payment terms.", "crm", "table", "/crm/customers", "Users", "sales.customers.read",
            new DynamicPageSchemaDto { PageKey="crm.customers", EntityName="Customer", Title="Customer Accounts Directory", SubTitle="Comprehensive customer profiles, billing addresses, credit limits, and interaction history.", ViewType="table", ApiEndpoint="/api/v1/crm/customers",
                Columns=new(){ Col("customerCode","Account #",width:120), Col("customerName","Company / Client Name",width:220), Col("email","Email Address",width:200), Col("phone","Contact Phone",width:140), Col("city","City",width:130), Col("creditLimit","Credit Limit","currency",width:140), BadgeCol("isActive","Status","{\"true\":\"Active\",\"false\":\"Inactive\"}",100) },
                Filters=new(){ TF("search","Search client name or email"), SF("isActive","Status",("true","Active"),("false","Inactive")) },
                Form=new(){ Sections=new(){ Sec("account","Customer Profile", F("customerCode","Customer Code",req:true), F("customerName","Company / Customer Name",req:true), F("email","Primary Email","email",req:true), F("phone","Phone Number","tel"), F("gstin","GSTIN"), F("pan","PAN / Tax ID")), Sec("commercial","Commercial Terms", F("creditLimit","Credit Limit (INR)","currency"), F("paymentTerms","Payment Terms"), F("address","Registered Address","textarea",span:2), F("isActive","Active","boolean")) }},
                Actions=new(){ A("create","Add Customer","primary","Plus"), A("edit","Edit","secondary","Pencil"), A("delete","Delete","danger","Trash2") } }),
        };
    }
}
