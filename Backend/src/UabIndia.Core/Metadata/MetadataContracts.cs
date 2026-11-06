using System;
using System.Collections.Generic;

namespace UabIndia.Core.Metadata
{
    public enum PageViewType
    {
        Table = 1,
        Form = 2,
        Detail = 3,
        Dashboard = 4,
        Workspace = 5,
        Kanban = 6,
        Calendar = 7,
        Timeline = 8,
        Tree = 9,
        Map = 10,
        Report = 11,
        Wizard = 12,
        ApprovalInbox = 13,
        Pivot = 14,
        Matrix = 15,
        Gantt = 16,
        Search = 17,
        Settings = 18
    }

    /// <summary>
    /// Master 25+ Field Component Registry for Enterprise Forms & Grids
    /// </summary>
    public enum MetadataControlType
    {
        Text,
        Number,
        Currency,
        Percentage,
        Date,
        DateTime,
        Time,
        Boolean,
        Dropdown,
        MultiSelect,
        Radio,
        Checkbox,
        Lookup,
        EntityLookup,
        UserLookup,
        EmployeeLookup,
        CompanyLookup,
        ProjectLookup,
        LocationLookup,
        File,
        Image,
        RichText,
        TextArea,
        Phone,
        Email,
        Rating,
        Formula,
        ReadOnly,
        Password,
        Signature,
        Gps,
        CustomComponent
    }

    public enum LayoutType
    {
        Tabs,
        Accordion,
        Wizard,
        SplitView,
        Drawer,
        FullPage,
        Modal
    }

    public enum RelationshipType
    {
        OneToOne,
        OneToMany,
        ManyToOne,
        ManyToMany,
        ParentChild,
        ChildGrid,
        RelatedList
    }

    public enum FieldMaskType
    {
        None,
        Full,
        Partial,
        LastFour
    }

    public enum OrgHierarchyLevel
    {
        Platform,
        Tenant,
        Company,
        Project,
        BusinessUnit,
        LegalEntity,
        Country,
        Zone,
        Region,
        State,
        District,
        Location,
        PostingLocation
    }

    public class ValidationDefinition
    {
        public bool IsRequired { get; set; }
        public double? Min { get; set; }
        public double? Max { get; set; }
        public int? MinLength { get; set; }
        public int? MaxLength { get; set; }
        public string? RegexPattern { get; set; }
        public string? ErrorMessage { get; set; }
        public string? CustomRuleExpression { get; set; }
    }

    /// <summary>
    /// Declarative conditional rules for zero-code dynamic forms (visibleWhen, requiredWhen, etc.)
    /// </summary>
    public class ConditionalRulesContract
    {
        public string? VisibleWhen { get; set; }
        public string? RequiredWhen { get; set; }
        public string? ReadonlyWhen { get; set; }
        public string? DisabledWhen { get; set; }
        public string? DefaultWhen { get; set; }
        public string? ValidationWhen { get; set; }
    }

    public class RuleDefinition
    {
        public string RuleId { get; set; } = Guid.NewGuid().ToString();
        public string TriggerField { get; set; } = string.Empty;
        public string Condition { get; set; } = string.Empty; // e.g., "value == 'Contract'"
        public string ActionType { get; set; } = "SetVisibility"; // SetVisibility | SetRequired | SetReadOnly | SetValue | Calculate
        public string TargetField { get; set; } = string.Empty;
        public object? ActionValue { get; set; }
    }

    public class FieldSecurityContract
    {
        public FieldMaskType MaskType { get; set; } = FieldMaskType.None;
        public List<string> RestrictedRoles { get; set; } = new();
        public List<string> RestrictedPermissions { get; set; } = new();
        public List<string> RestrictedDataScopes { get; set; } = new();
        public bool CanView { get; set; } = true;
        public bool CanEdit { get; set; } = true;
    }

    public class ActionDefinition
    {
        public string ActionKey { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string ActionType { get; set; } = "apiCall"; // apiCall | modal | navigate | workflowTrigger | export | print | clone | transition
        public string? ApiEndpoint { get; set; }
        public string? HttpMethod { get; set; } = "POST";
        public string? RequiredPermission { get; set; }
        public bool IsBulkAction { get; set; }
        public string Tone { get; set; } = "default"; // default | primary | danger
        public string? ConfirmationMessage { get; set; }
        public bool RequireReason { get; set; }
        public string? WorkflowTriggerKey { get; set; }
        public string? SuccessMessage { get; set; }
        public string? FailureMessage { get; set; }
        public string? AuditEventName { get; set; }
        public List<string> NotificationChannels { get; set; } = new();
    }

    public class FilterDefinition
    {
        public string FieldKey { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string FilterType { get; set; } = "text"; // text | select | dateRange | numberRange | boolean
        public string? OptionsEndpoint { get; set; }
        public List<string>? StaticOptions { get; set; }
    }

    public class FieldDefinitionContract
    {
        public string FieldKey { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public MetadataControlType ControlType { get; set; } = MetadataControlType.Text;
        public string? Placeholder { get; set; }
        public string? HelpText { get; set; }
        public object? DefaultValue { get; set; }
        public bool IsRequired { get; set; }
        public bool IsReadOnly { get; set; }
        public bool IsHidden { get; set; }
        public int DisplayOrder { get; set; }
        public string? SectionKey { get; set; }
        public string? TabKey { get; set; }
        public ValidationDefinition? Validation { get; set; }
        public ConditionalRulesContract? ConditionalRules { get; set; }
        public FieldSecurityContract? Security { get; set; }
        public List<RuleDefinition> Rules { get; set; } = new();
        public string? LookupEndpoint { get; set; }
        public string? LookupEntityName { get; set; }
        public string? FormulaExpression { get; set; }
    }

    public class RelationshipDefinitionContract
    {
        public string RelationshipKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public RelationshipType Type { get; set; } = RelationshipType.OneToMany;
        public string TargetEntity { get; set; } = string.Empty;
        public string ForeignKey { get; set; } = string.Empty;
        public string? DisplayField { get; set; }
        public bool CascadeDelete { get; set; }
        public List<string> Columns { get; set; } = new();
    }

    public class SectionDefinition
    {
        public string SectionKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int Columns { get; set; } = 2; // 1 to 4
        public int DisplayOrder { get; set; }
        public bool Collapsible { get; set; } = true;
        public bool DefaultCollapsed { get; set; }
        public string? VisibleWhen { get; set; }
    }

    public class TabDefinition
    {
        public string TabKey { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public int DisplayOrder { get; set; }
        public List<string> SectionKeys { get; set; } = new();
        public string? VisibleWhen { get; set; }
    }

    public class LayoutDefinitionContract
    {
        public LayoutType Type { get; set; } = LayoutType.Tabs;
        public int DefaultColumns { get; set; } = 2;
        public string Density { get; set; } = "standard"; // compact | standard | comfortable
        public bool EnableSplitView { get; set; }
        public bool EnableSideDrawer { get; set; } = true;
    }

    public class FormDefinition
    {
        public LayoutDefinitionContract Layout { get; set; } = new();
        public List<TabDefinition> Tabs { get; set; } = new();
        public List<SectionDefinition> Sections { get; set; } = new();
        public List<FieldDefinitionContract> Fields { get; set; } = new();
        public List<RelationshipDefinitionContract> Relationships { get; set; } = new();
        public List<RuleDefinition> FormRules { get; set; } = new();
    }

    public class ViewDefinition
    {
        public PageViewType ViewType { get; set; } = PageViewType.Table;
        public List<string> VisibleColumns { get; set; } = new();
        public List<FilterDefinition> Filters { get; set; } = new();
        public List<ActionDefinition> Actions { get; set; } = new();
        public string? DefaultSortBy { get; set; }
        public bool DefaultSortDescending { get; set; }
        public int DefaultPageSize { get; set; } = 25;
    }

    public class NavigationNodeContract
    {
        public string NodeKey { get; set; } = string.Empty;
        public string ModuleKey { get; set; } = string.Empty;
        public string? MenuKey { get; set; }
        public string? SubmenuKey { get; set; }
        public string PageKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string Route { get; set; } = string.Empty;
        public string? RequiredPermission { get; set; }
        public int SortOrder { get; set; }
        public string? FeatureFlag { get; set; }
        public bool IsVisible { get; set; } = true;
    }

    public class DocumentTemplateContract
    {
        public string TemplateKey { get; set; } = string.Empty;
        public string EntityName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string OutputFormat { get; set; } = "pdf"; // pdf | html | docx | print
        public string? HeaderHtml { get; set; }
        public string BodyTemplate { get; set; } = string.Empty;
        public string? FooterHtml { get; set; }
        public List<string> Variables { get; set; } = new();
        public bool HasBarcode { get; set; }
        public bool HasQrCode { get; set; }
        public bool HasDigitalSignature { get; set; }
        public string? WatermarkText { get; set; }
    }

    public class SearchContract
    {
        public bool IsSearchable { get; set; } = true;
        public List<string> ExactMatchFields { get; set; } = new();
        public List<string> PrefixMatchFields { get; set; } = new();
        public List<string> FuzzyMatchFields { get; set; } = new();
        public int GlobalSearchPriority { get; set; } = 100;
    }

    public class PageDefinitionSchema
    {
        public string SchemaVersion { get; set; } = "2.1";
        public string PageKey { get; set; } = string.Empty;
        public string EntityName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? SubTitle { get; set; }
        public string ModuleKey { get; set; } = string.Empty;
        public ViewDefinition View { get; set; } = new();
        public FormDefinition Form { get; set; } = new();
        public List<ActionDefinition> PageActions { get; set; } = new();
        public SearchContract Search { get; set; } = new();
        public List<DocumentTemplateContract> DocumentTemplates { get; set; } = new();
        public string Status { get; set; } = "Published"; // Draft | Validate | Published | Archived
        public int Version { get; set; } = 1;
    }
}
