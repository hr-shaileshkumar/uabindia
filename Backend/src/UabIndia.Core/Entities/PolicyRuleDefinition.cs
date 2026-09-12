using System;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Database-persisted definition of an enterprise policy rule or form field.
    /// Governs UI schema, validation bounds, statutory defaults, and evaluation parameters.
    /// Supports multi-level hierarchy inheritance: Tenant -> Company -> Project.
    /// Admins and Superadmins can dynamically add, update, or customize rules per company or project.
    /// </summary>
    public class PolicyRuleDefinition : BaseEntity
    {
        /// <summary>
        /// Optional Company scoping for company-specific policy rules.
        /// If null, applies as tenant-wide baseline.
        /// </summary>
        public Guid? CompanyId { get; set; }

        /// <summary>
        /// Optional Project scoping for project-specific policy rules.
        /// If null, applies as company or tenant baseline.
        /// </summary>
        public Guid? ProjectId { get; set; }

        /// <summary>
        /// Enterprise Category: PAYROLL_COMPENSATION, HR_CORE, ATTENDANCE_TIMESHEET, LEAVE,
        /// STATUTORY_COMPLIANCE, TRAVEL_EXPENSE, SEPARATION, PERFORMANCE_APPRAISAL, etc.
        /// </summary>
        public string Category { get; set; } = string.Empty;

        /// <summary>
        /// Policy Code identifier (e.g. PAYROLL_STATUTORY, ATT_SHIFT, LEV_STANDARD, PROB_CONFIRMATION).
        /// </summary>
        public string PolicyCode { get; set; } = string.Empty;

        /// <summary>
        /// Programmatic field/rule identifier (e.g. basicPercentageOfGross, pfWageCeiling, gracePeriodMinutes).
        /// </summary>
        public string FieldKey { get; set; } = string.Empty;

        /// <summary>
        /// Human-readable field label displayed in drawers and forms.
        /// </summary>
        public string FieldLabel { get; set; } = string.Empty;

        /// <summary>
        /// Field data type: number, text, boolean, select, date
        /// </summary>
        public string FieldType { get; set; } = "text";

        /// <summary>
        /// UI section group (e.g. "Basic Identification", "Salary Component Ratios", "Provident Fund (EPFO)").
        /// </summary>
        public string Section { get; set; } = "General";

        /// <summary>
        /// Default value formatted as string representation (e.g. "50.0", "15000", "true", "Monthly").
        /// </summary>
        public string DefaultValue { get; set; } = string.Empty;

        /// <summary>
        /// Numeric lower bound (if applicable).
        /// </summary>
        public decimal? MinValue { get; set; }

        /// <summary>
        /// Numeric upper bound (if applicable).
        /// </summary>
        public decimal? MaxValue { get; set; }

        /// <summary>
        /// Step increment for numeric sliders or spin inputs.
        /// </summary>
        public decimal? Step { get; set; }

        /// <summary>
        /// Display unit (e.g. "%", "₹", "Days", "Minutes", "Hours").
        /// </summary>
        public string? Unit { get; set; }

        /// <summary>
        /// JSON array of selectable options for "select" field type (e.g. ["Monthly", "Quarterly", "Yearly"]).
        /// </summary>
        public string? OptionsJson { get; set; }

        /// <summary>
        /// Contextual tooltip/help text explaining the statutory or operational intent.
        /// </summary>
        public string? HelpText { get; set; }

        /// <summary>
        /// Whether the field is mandatory in policy creation.
        /// </summary>
        public bool IsRequired { get; set; } = true;

        /// <summary>
        /// Governs frontend visibility dynamically from the database.
        /// </summary>
        public bool IsVisible { get; set; } = true;

        /// <summary>
        /// Whether the rule is locked from regular modification (statutory mandate).
        /// </summary>
        public bool IsReadOnly { get; set; } = false;

        /// <summary>
        /// Display ordering within its UI section.
        /// </summary>
        public int DisplayOrder { get; set; } = 0;

        /// <summary>
        /// Active, Inactive, Archived
        /// </summary>
        public string Status { get; set; } = "Active";
    }
}
