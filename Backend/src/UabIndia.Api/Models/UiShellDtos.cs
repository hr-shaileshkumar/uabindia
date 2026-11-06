using System.Collections.Generic;

namespace UabIndia.Api.Models
{
    // ─────────────────────────────────────────────────────────────────────────────
    // Module metadata returned by /modules/enabled (enriched)
    // ─────────────────────────────────────────────────────────────────────────────
    public class ModuleMetaDto
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Icon { get; set; }
        public string? BasePath { get; set; }
        public int SortOrder { get; set; }
        public string Version { get; set; } = "0001";
        public string? CustomDisplayName { get; set; }
        public int? CustomSortOrder { get; set; }
        public string? CustomIcon { get; set; }
        public string? CustomSection { get; set; }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Navigation schema returned by /ui-shell/navigation
    // ─────────────────────────────────────────────────────────────────────────────
    public class NavigationSchemaDto
    {
        public string SchemaVersion { get; set; } = "1";
        public List<NavModuleDto> Modules { get; set; } = new();
    }

    public class NavModuleDto
    {
        public string Key { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public string? HomeHref { get; set; }
        public int SortOrder { get; set; }
        public string? Section { get; set; }
        public List<string>? AllowedRoles { get; set; }
        public List<NavGroupDto> Groups { get; set; } = new();
    }

    public class NavGroupDto
    {
        public string Label { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public List<NavItemDto> Items { get; set; } = new();
    }

    public class NavItemDto
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public int SortOrder { get; set; }
        public List<string> RequiredPermissions { get; set; } = new();
        public List<string>? AllowedRoles { get; set; }
        public List<string>? AllowedCompanyIds { get; set; }
        public List<string>? AllowedProjectIds { get; set; }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Route permission rules returned by /ui-shell/route-rules
    // ─────────────────────────────────────────────────────────────────────────────
    public class RouteRulesDto
    {
        public string SchemaVersion { get; set; } = "1";
        public List<RoutePermissionRuleDto> Rules { get; set; } = new();
    }

    public class RoutePermissionRuleDto
    {
        public string PathPattern { get; set; } = string.Empty;
        public string ModuleKey { get; set; } = string.Empty;
        public List<string> PermissionKeys { get; set; } = new();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Dashboard schema returned by /ui-shell/dashboard
    // ─────────────────────────────────────────────────────────────────────────────
    public class DashboardSchemaDto
    {
        public string SchemaVersion { get; set; } = "1";
        public List<DashboardSectionDto> Sections { get; set; } = new();
    }

    public class DashboardSectionDto
    {
        public string Key { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public List<WidgetDto> Widgets { get; set; } = new();
    }

    public class WidgetDto
    {
        public string Key { get; set; } = string.Empty;
        public string Type { get; set; } = "card"; // card | stat | chart | list | custom
        public string Title { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public string? Href { get; set; }
        public string? DataEndpoint { get; set; }
        public string? ModuleKey { get; set; }
        public int SortOrder { get; set; }
        public List<string> RequiredPermissions { get; set; } = new();
        public Dictionary<string, string> Props { get; set; } = new();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Page schema returned by /ui-shell/page-schema/{pageKey}
    // ─────────────────────────────────────────────────────────────────────────────
    public class PageSchemaDto
    {
        public string SchemaVersion { get; set; } = "1";
        public string PageKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? SubTitle { get; set; }
        public string Layout { get; set; } = "crud"; // crud | tabs | custom
        public string? HandlerKey { get; set; }
        public TableSchemaDto? Table { get; set; }
        public FormSchemaDto? Form { get; set; }
        public List<TabDefDto> Tabs { get; set; } = new();
        public List<ActionDefDto> Actions { get; set; } = new();
    }

    public class TableSchemaDto
    {
        public string ApiEndpoint { get; set; } = string.Empty;
        public List<TableColumnDto> Columns { get; set; } = new();
        public List<FilterDefDto> Filters { get; set; } = new();
        public bool CanCreate { get; set; } = true;
        public bool CanEdit { get; set; } = true;
        public bool CanDelete { get; set; } = true;
    }

    public class TableColumnDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string DataType { get; set; } = "string"; // string | number | date | boolean | badge | currency
        public bool Sortable { get; set; }
        public bool Hidden { get; set; }
        public int SortOrder { get; set; }
        public string? Format { get; set; }
    }

    public class FormSchemaDto
    {
        public string ApiEndpoint { get; set; } = string.Empty;
        public List<FieldDefDto> Fields { get; set; } = new();
    }

    public class FieldDefDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string FieldType { get; set; } = "text"; // text | number | select | date | textarea | checkbox | email | phone
        public bool Required { get; set; }
        public bool ReadOnly { get; set; }
        public int SortOrder { get; set; }
        public string? Placeholder { get; set; }
        public string? DefaultValue { get; set; }
        public string? OptionsEndpoint { get; set; }
        public List<SelectOptionDto> Options { get; set; } = new();
        public Dictionary<string, string> Validation { get; set; } = new();
    }

    public class SelectOptionDto
    {
        public string Value { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
    }

    public class TabDefDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public string? ContentSchemaKey { get; set; }
        public List<string> RequiredPermissions { get; set; } = new();
    }

    public class FilterDefDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string FilterType { get; set; } = "text"; // text | select | date | boolean
        public string? OptionsEndpoint { get; set; }
        public List<SelectOptionDto> Options { get; set; } = new();
    }

    public class ActionDefDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string ActionType { get; set; } = "button"; // button | link | menu
        public string Variant { get; set; } = "primary"; // primary | secondary | danger
        public string? Icon { get; set; }
        public string? Href { get; set; }
        public string? HandlerKey { get; set; }
        public List<string> RequiredPermissions { get; set; } = new();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Admin schema update DTOs
    // ─────────────────────────────────────────────────────────────────────────────
    public class UpdateUiSchemaDto
    {
        public string UiSchemaJson { get; set; } = "{}";
    }

    public class UpdateWorkflowSchemaDto
    {
        public string WorkflowJson { get; set; } = "{}";
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Dynamic UI Shell Visibility Configuration (Topbar, Public Header, Scopes)
    // ─────────────────────────────────────────────────────────────────────────────
    public class UiShellConfigDto
    {
        public TopbarConfigDto Topbar { get; set; } = new();
        public PublicHeaderConfigDto PublicHeader { get; set; } = new();
    }

    public class TopbarConfigDto
    {
        public bool ShowCompanySwitcher { get; set; } = true;
        public bool ShowProjectSwitcher { get; set; } = true;
        public bool ShowNotifications { get; set; } = true;
        public bool ShowGlobalSearch { get; set; } = true;
        public bool ShowQuickRefresh { get; set; } = true;
        public List<ProfileLinkDto> ProfileLinks { get; set; } = new()
        {
            new() { Label = "My Profile", Href = "/profile", Icon = "UserRound" },
            new() { Label = "Employee Self-Service", Href = "/ess", Icon = "Users" },
            new() { Label = "Manager Self-Service", Href = "/mss", Icon = "Users", RequiredRole = "Manager" },
            new() { Label = "Workspace Settings", Href = "/platform/settings", Icon = "Settings", RequiredRole = "Admin" },
        };
    }

    public class ProfileLinkDto
    {
        public string Label { get; set; } = string.Empty;
        public string Href { get; set; } = string.Empty;
        public string Icon { get; set; } = "Link";
        public string? RequiredRole { get; set; }
        public string? RequiredPermission { get; set; }
    }

    public class PublicHeaderConfigDto
    {
        public List<PublicHeaderNavLinkDto> NavLinks { get; set; } = new()
        {
            new() { Label = "About", Href = "/about" },
            new() { Label = "Careers", Href = "/careers" },
            new() { Label = "Contact", Href = "/contact" },
        };
        public bool ShowLoginButton { get; set; } = true;
        public string PrimaryCtaLabel { get; set; } = "Login";
        public string PrimaryCtaHref { get; set; } = "/login";
    }

    public class PublicHeaderNavLinkDto
    {
        public string Label { get; set; } = string.Empty;
        public string Href { get; set; } = string.Empty;
        public string? Target { get; set; }
    }
}
