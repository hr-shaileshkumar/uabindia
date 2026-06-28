using System;
using System.Collections.Generic;
using System.Linq;
using UabIndia.Api.Models;

namespace UabIndia.Api.Services
{
    internal static class DefaultUiSchemaCatalog
    {
        private sealed record NavSeed(
            string ModuleKey,
            string GroupLabel,
            string Key,
            string Name,
            string Path,
            string Icon,
            string[] Permissions);

        private sealed record DashboardSeed(
            string SectionKey,
            string SectionTitle,
            string Key,
            string Title,
            string Href,
            string ModuleKey,
            string Icon,
            string Summary,
            string[] Permissions);

        private static readonly StringComparer Comparer = StringComparer.OrdinalIgnoreCase;

        private static string[] Perms(string moduleKey, params string[] keys)
        {
            var permissions = keys
                .Where(key => !string.IsNullOrWhiteSpace(key))
                .Concat(new[]
                {
                    $"module:{moduleKey}",
                    $"{moduleKey}.*",
                    $"{moduleKey}.access",
                    $"resource:{moduleKey}.access",
                })
                .Distinct(Comparer)
                .ToArray();

            return permissions;
        }

        private static readonly List<NavSeed> NavigationItems = new()
        {
            new("platform", "Overview", "platform-home", "Admin Overview", "/platform", "dashboard", Perms("platform", "platform.view")),
            new("platform", "Tenant Management", "platform-companies", "Companies", "/platform/companies", "building", Perms("platform", "platform.companies.view")),
            new("platform", "Tenant Management", "platform-tenants", "Tenants", "/platform/tenants", "layers", Perms("platform", "platform.tenants.view")),
            new("platform", "Tenant Management", "platform-projects", "Projects", "/platform/projects", "folder", Perms("platform", "platform.projects.view")),
            new("platform", "Access Control", "platform-users", "Users", "/platform/users", "users", Perms("platform", "platform.users.view")),
            new("platform", "Access Control", "platform-roles", "Roles", "/platform/roles", "shield", Perms("platform", "platform.roles.view")),
            new("platform", "Access Control", "platform-permissions", "Permissions", "/platform/permissions", "key", Perms("platform", "platform.permissions.view")),
            new("platform", "Access Control", "platform-module-mapping", "Navigation Registry", "/platform/module-mapping", "grid", Perms("platform", "platform.settings.view")),
            new("platform", "Configuration", "platform-schema-manager", "Schema Manager", "/platform/schema-manager", "database", Perms("platform", "platform.schemamanager.view")),
            new("platform", "Configuration", "platform-settings", "Settings", "/platform/settings", "settings", Perms("platform", "platform.settings.view")),
            new("platform", "Configuration", "platform-feature-flags", "Feature Flags", "/platform/feature-flags", "flag", Perms("platform", "platform.featureflags.view")),
            new("platform", "Configuration", "platform-workflow-config", "Workflow Config", "/platform/workflow-config", "workflow", Perms("platform", "platform.settings.view")),
            new("platform", "Configuration", "platform-notification-templates", "Notification Templates", "/platform/notification-templates", "bell", Perms("platform", "platform.settings.view")),
            new("platform", "Website & Branding", "platform-website-pages", "Website Pages", "/platform/website/pages", "file-text", Perms("platform", "platform.website.pages.view")),
            new("platform", "Website & Branding", "platform-website-templates", "Page Templates", "/platform/website/templates", "layout", Perms("platform", "platform.website.templates.view")),
            new("platform", "Website & Branding", "platform-website-themes", "Themes", "/platform/website/themes", "palette", Perms("platform", "platform.website.themes.view")),
            new("platform", "Website & Branding", "platform-website-settings", "Website Settings", "/platform/website/settings", "settings", Perms("platform", "platform.website.settings.view")),
            new("platform", "Monitoring", "platform-system-health", "System Health", "/platform/system-health", "activity", Perms("platform", "platform.view")),
            new("platform", "Monitoring", "platform-audit-logs", "Audit Logs", "/platform/audit-logs", "clipboard", Perms("platform", "audit.view")),
            new("platform", "Monitoring", "platform-contact-submissions", "Contact Submissions", "/platform/contact-submissions", "mail", Perms("platform", "platform.contactsubmissions.view")),
            new("platform", "Monitoring", "platform-recycle-bin", "Recycle Bin", "/platform/recycle-bin", "trash", Perms("platform", "platform.view")),

            new("erp", "Overview", "erp-dashboard", "Dashboard", "/erp/dashboard", "dashboard", Perms("erp", "dashboard.view")),
            new("erp", "Overview", "erp-approvals", "Approvals", "/erp/approvals", "check-circle", Perms("erp", "approvals.view")),
            new("erp", "Overview", "erp-notifications", "Notifications", "/erp/notifications", "bell", Perms("erp", "notifications.view")),
            new("erp", "Overview", "erp-documents", "Documents", "/erp/documents", "document", Perms("erp", "documents.view")),
            new("erp", "Overview", "erp-profile", "Profile", "/erp/profile", "user", Perms("erp")),
            new("erp", "Finance", "erp-chart-of-accounts", "Chart of Accounts", "/erp/chart-of-accounts", "layers", Perms("erp", "chartofaccounts.view")),
            new("erp", "Finance", "erp-journal-entries", "Journal Entries", "/erp/journal-entries", "journal", Perms("erp", "journalentries.view")),
            new("erp", "Finance", "erp-payments", "Payments", "/erp/payments", "credit-card", Perms("erp", "payments.view")),
            new("erp", "Finance", "erp-invoices", "Invoices", "/erp/invoices", "receipt", Perms("erp", "payments.view")),
            new("erp", "Finance", "erp-expenses", "Expenses", "/erp/expenses", "wallet", Perms("erp", "payments.view")),
            new("erp", "Finance", "erp-tax-management", "Tax Management", "/erp/tax-management", "calculator", Perms("erp", "chartofaccounts.view")),
            new("erp", "Finance", "erp-bank-reconciliation", "Bank Reconciliation", "/erp/bank-reconciliation", "bank", Perms("erp", "payments.view")),
            new("erp", "Procurement", "erp-vendors", "Vendors", "/erp/vendors", "truck", Perms("erp", "vendor.view")),
            new("erp", "Procurement", "erp-purchase-requests", "Purchase Requests", "/erp/purchase-requests", "shopping-cart", Perms("erp", "purchaseorders.view")),
            new("erp", "Procurement", "erp-purchase-orders", "Purchase Orders", "/erp/purchase-orders", "clipboard", Perms("erp", "purchaseorders.view")),
            new("erp", "Procurement", "erp-grn", "Goods Receipt (GRN)", "/erp/grn", "box", Perms("erp", "purchaseorders.view")),
            new("erp", "Sales & CRM", "erp-customers", "Customers", "/erp/customers", "users", Perms("erp", "customer.view")),
            new("erp", "Sales & CRM", "erp-quotations", "Quotations", "/erp/quotations", "file-text", Perms("erp", "salesorders.view")),
            new("erp", "Sales & CRM", "erp-sales-orders", "Sales Orders", "/erp/sales-orders", "shopping-bag", Perms("erp", "salesorders.view")),
            new("erp", "Sales & CRM", "erp-returns", "Returns", "/erp/returns", "rotate-ccw", Perms("erp", "salesorders.view")),
            new("erp", "Inventory", "erp-items", "Items", "/erp/items", "box", Perms("erp", "item.view")),
            new("erp", "Inventory", "erp-warehouses", "Warehouses", "/erp/warehouses", "warehouse", Perms("erp", "warehouses.view")),
            new("erp", "Inventory", "erp-stock-movements", "Stock Movements", "/erp/stock-movements", "trending-up", Perms("erp", "stockmovements.view")),
            new("erp", "Inventory", "erp-inventory-adjustments", "Inventory Adjustments", "/erp/inventory-adjustments", "sliders", Perms("erp", "stockmovements.view")),
            new("erp", "Inventory", "erp-inventory-transfers", "Inventory Transfers", "/erp/inventory-transfers", "arrow-right-left", Perms("erp", "stockmovements.view")),
            new("erp", "Service", "erp-helpdesk-home", "Helpdesk Overview", "/erp/helpdesk", "dashboard", Perms("erp")),
            new("erp", "Service", "erp-helpdesk-tickets", "Tickets", "/erp/helpdesk/tickets", "ticket", Perms("erp")),
            new("erp", "Service", "erp-helpdesk-escalations", "Escalations", "/erp/helpdesk/escalations", "alert-triangle", Perms("erp")),
            new("erp", "Service", "erp-helpdesk-faq", "FAQs", "/erp/helpdesk/faq", "help-circle", Perms("erp")),
            new("erp", "Service", "erp-communication-home", "Communication Overview", "/erp/communication", "dashboard", Perms("erp")),
            new("erp", "Service", "erp-announcements", "Announcements", "/erp/communication/announcements", "megaphone", Perms("erp")),
            new("erp", "Service", "erp-email-templates", "Email Templates", "/erp/communication/email-templates", "mail", Perms("erp")),
            new("erp", "Service", "erp-sms-templates", "SMS Templates", "/erp/communication/sms-templates", "message-square", Perms("erp")),
            new("erp", "Connectivity", "erp-integrations-home", "Integrations Overview", "/erp/integrations", "dashboard", Perms("erp")),
            new("erp", "Connectivity", "erp-api-keys", "API Keys", "/erp/integrations/api-keys", "key", Perms("erp")),
            new("erp", "Connectivity", "erp-webhooks", "Webhooks", "/erp/integrations/webhooks", "webhook", Perms("erp")),
            new("erp", "Connectivity", "erp-apps", "Third-Party Apps", "/erp/integrations/apps", "plug", Perms("erp")),

            new("hrms", "Core HR", "hrms-home", "HR Dashboard", "/erp/hrms", "dashboard", Perms("hrms", "hrms.view")),
            new("hrms", "Core HR", "hrms-employees", "Employees", "/erp/hrms/employees", "employees", Perms("hrms", "employee.view")),
            new("hrms", "Core HR", "hrms-certificates", "Certificates", "/erp/hrms/certificates", "award", Perms("hrms", "certificates.view")),
            new("hrms", "Core HR", "hrms-assets", "Assets", "/erp/hrms/assets", "monitor", Perms("hrms", "hr.assets.view")),
            new("hrms", "Employee Lifecycle", "hrms-onboarding", "Onboarding", "/erp/hrms/onboarding", "user-plus", Perms("hrms", "employee.view")),
            new("hrms", "Employee Lifecycle", "hrms-offboarding", "Offboarding", "/erp/hrms/offboarding", "user-minus", Perms("hrms", "employee.view")),
            new("hrms", "Employee Lifecycle", "hrms-probation", "Probation", "/erp/hrms/probation", "hourglass", Perms("hrms", "employee.view")),
            new("hrms", "Attendance & Time", "hrms-attendance", "Attendance", "/erp/hrms/attendance", "attendance", Perms("hrms", "attendance.view")),
            new("hrms", "Attendance & Time", "hrms-shifts", "Shifts", "/erp/hrms/shifts", "clock", Perms("hrms", "shifts.view")),
            new("hrms", "Attendance & Time", "hrms-overtime", "Overtime", "/erp/hrms/overtime", "timer", Perms("hrms", "overtime.view")),
            new("hrms", "Attendance & Time", "hrms-leave", "Leave", "/erp/hrms/leave", "leave", Perms("hrms", "leave.view")),
            new("hrms", "Talent Acquisition", "hrms-recruitment", "Recruitment", "/erp/hrms/recruitment", "search", Perms("hrms", "recruitment.view")),
            new("hrms", "Talent Acquisition", "hrms-screening-schedule", "Screening Schedule", "/erp/hrms/screening-schedule", "calendar-check", Perms("hrms", "screening.schedule.view")),
            new("hrms", "Talent Acquisition", "hrms-screening-results", "Screening Results", "/erp/hrms/screening-results", "bar-chart", Perms("hrms", "screening.results.view")),
            new("hrms", "Learning & Development", "hrms-training", "Training & Learning", "/erp/hrms/training", "training", Perms("hrms", "training.view")),
            new("hrms", "Learning & Development", "hrms-assessments", "Assessments", "/erp/hrms/assessments", "clipboard-check", Perms("hrms", "assessments.view")),
            new("hrms", "Performance", "hrms-performance", "Performance", "/erp/hrms/performance", "trending-up", Perms("hrms", "performance.view")),
            new("hrms", "HR Operations", "hrms-payroll", "HR Payroll", "/erp/hrms/payroll", "payroll", Perms("hrms", "hr.payroll.view")),

            new("payroll", "Overview", "payroll-home", "Payroll Dashboard", "/erp/payroll", "dashboard", Perms("payroll", "payroll.view")),
            new("payroll", "Processing", "payroll-runs", "Payroll Runs", "/erp/payroll/runs", "play-circle", Perms("payroll", "payroll.runs.view")),
            new("payroll", "Processing", "payroll-payslips", "Payslips", "/erp/payroll/payslips", "file-text", Perms("payroll", "payroll.payslips.view")),
            new("payroll", "Processing", "payroll-bonus", "Bonus & Incentives", "/erp/payroll/bonus", "gift", Perms("payroll", "payroll.runs.view")),
            new("payroll", "Processing", "payroll-arrears", "Arrears", "/erp/payroll/arrears", "clock", Perms("payroll", "payroll.runs.view")),
            new("payroll", "Setup", "payroll-structures", "Structures", "/erp/payroll/structures", "layers", Perms("payroll", "payroll.structures.view")),
            new("payroll", "Setup", "payroll-components", "Components", "/erp/payroll/components", "puzzle", Perms("payroll", "payroll.components.view")),
            new("payroll", "Setup", "payroll-loans", "Loan Management", "/erp/payroll/loans", "credit-card", Perms("payroll", "payroll.view")),
            new("payroll", "Setup", "payroll-reimbursements", "Reimbursements", "/erp/payroll/reimbursements", "receipt", Perms("payroll", "payroll.view")),
            new("payroll", "Compliance", "payroll-statutory", "Statutory", "/erp/payroll/statutory", "shield", Perms("payroll", "payroll.statutory.view")),
            new("payroll", "Compliance", "payroll-final-settlement", "Final Settlement", "/erp/payroll/final-settlement", "clipboard-check", Perms("payroll", "payroll.view")),
            new("payroll", "Compliance", "payroll-tax-declarations", "Tax Declarations", "/erp/payroll/tax-declarations", "calculator", Perms("payroll", "payroll.view")),

            new("reports", "Overview", "reports-home", "Reports Home", "/erp/reports", "dashboard", Perms("reports", "reports.view")),
            new("reports", "HR", "reports-hr", "HR Reports", "/erp/reports/hr", "employees", Perms("reports", "reports.hr.view")),
            new("reports", "Payroll", "reports-payroll", "Payroll Reports", "/erp/reports/payroll", "payroll", Perms("reports", "reports.payroll.view")),
            new("reports", "Compliance", "reports-compliance", "Compliance Reports", "/erp/reports/compliance", "shield", Perms("reports", "reports.compliance.view")),
            new("reports", "Business Operations", "reports-erp", "Business Operations Reports", "/erp/reports/erp", "briefcase", Perms("reports", "reports.view")),
            new("reports", "Finance", "reports-financial", "Financial Reports", "/erp/reports/financial", "trending-up", Perms("reports", "reports.view")),
            new("reports", "Advanced", "reports-custom", "Custom Reports", "/erp/reports/custom", "sliders", Perms("reports", "reports.view")),

            new("licensing", "Overview", "licensing-home", "Overview", "/erp/licensing", "dashboard", Perms("licensing", "licensing.view")),
            new("licensing", "Product", "licensing-catalog", "Module Catalog", "/erp/licensing/catalog", "grid", Perms("licensing", "licensing.catalog.view")),
            new("licensing", "Product", "licensing-subscriptions", "Subscriptions", "/erp/licensing/subscriptions", "layers", Perms("licensing", "licensing.subscriptions.view")),
            new("licensing", "Billing", "licensing-billing-history", "Billing History", "/erp/licensing/billing-history", "credit-card", Perms("licensing", "licensing.view")),
            new("licensing", "Billing", "licensing-usage", "Usage Analytics", "/erp/licensing/usage", "bar-chart", Perms("licensing", "licensing.view")),
            new("licensing", "Connect", "licensing-integrations", "Integrations", "/erp/licensing/integrations", "plug", Perms("licensing", "licensing.integrations.view")),

            new("security", "Overview", "security-home", "Security Overview", "/erp/security", "shield", Perms("security", "security.view")),
            new("security", "Authentication", "security-mfa", "MFA", "/erp/security/mfa", "smartphone", Perms("security", "security.mfa.view")),
            new("security", "Authentication", "security-sso", "SSO", "/erp/security/sso", "key", Perms("security", "security.view")),
            new("security", "Devices", "security-devices", "Devices", "/erp/security/devices", "monitor", Perms("security", "security.devices.view")),
            new("security", "Sessions", "security-sessions", "Sessions", "/erp/security/sessions", "activity", Perms("security", "security.sessions.view")),
            new("security", "Sessions", "security-access-logs", "Access Logs", "/erp/security/access-logs", "file-text", Perms("security", "audit.view")),
            new("security", "Policies", "security-password-policies", "Password Policies", "/erp/security/password-policies", "lock", Perms("security", "security.passwordpolicies.view")),
            new("security", "Policies", "security-ip-restrictions", "IP Restrictions", "/erp/security/ip-restrictions", "globe", Perms("security", "security.view")),
        };

        private static readonly List<DashboardSeed> DashboardWidgets = new()
        {
            new("workspace-modules", "Workspace modules", "dashboard-platform", "Platform control", "/platform", "platform", "settings", "Tenant governance, access control, website administration, and operational monitoring.", Perms("platform", "platform.view")),
            new("workspace-modules", "Workspace modules", "dashboard-erp", "Business workspace", "/erp/dashboard", "erp", "dashboard", "Shared approvals, documents, finance, procurement, CRM, inventory, and service operations.", Perms("erp", "dashboard.view")),
            new("workspace-modules", "Workspace modules", "dashboard-hrms", "HRMS", "/erp/hrms", "hrms", "employees", "Employee records, attendance, leave, recruitment, training, and lifecycle flows.", Perms("hrms", "hrms.view")),
            new("workspace-modules", "Workspace modules", "dashboard-payroll", "Payroll", "/erp/payroll", "payroll", "payroll", "Runs, payslips, structures, statutory processing, and payroll operations.", Perms("payroll", "payroll.view")),
            new("workspace-modules", "Workspace modules", "dashboard-reports", "Reports", "/erp/reports", "reports", "file", "Cross-module reporting for HR, payroll, finance, compliance, and leadership review.", Perms("reports", "reports.view")),
            new("workspace-modules", "Workspace modules", "dashboard-licensing", "Licensing", "/erp/licensing", "licensing", "box", "Catalog, subscriptions, billing visibility, and integration governance.", Perms("licensing", "licensing.view")),
            new("workspace-modules", "Workspace modules", "dashboard-security", "Security", "/erp/security", "security", "shield", "Sessions, MFA, SSO, password policies, devices, and access oversight.", Perms("security", "security.view")),

            new("daily-work", "Priority actions", "dashboard-approvals", "Review approvals", "/erp/approvals", "erp", "check-circle", "Open queues for leave, attendance, procurement, and finance workflows.", Perms("erp", "approvals.view")),
            new("daily-work", "Priority actions", "dashboard-notifications", "View notifications", "/erp/notifications", "erp", "bell", "Unread alerts, escalations, and operational announcements from backend services.", Perms("erp", "notifications.view")),
            new("daily-work", "Priority actions", "dashboard-documents", "Open documents", "/erp/documents", "erp", "document", "Document vault, exports, and attached operational records.", Perms("erp", "documents.view")),
            new("daily-work", "Priority actions", "dashboard-employees", "Manage employees", "/erp/hrms/employees", "hrms", "users", "Employee master data, reporting structure, and lifecycle tasks.", Perms("hrms", "employee.view")),
            new("daily-work", "Priority actions", "dashboard-payroll-runs", "Run payroll", "/erp/payroll/runs", "payroll", "play-circle", "Current and historical payroll runs with backend-driven approvals.", Perms("payroll", "payroll.runs.view")),
            new("daily-work", "Priority actions", "dashboard-finance", "Review finance", "/erp/chart-of-accounts", "erp", "calculator", "Chart of accounts, journals, and transaction management.", Perms("erp", "chartofaccounts.view")),
            new("daily-work", "Priority actions", "dashboard-reports-link", "Open reports", "/erp/reports", "reports", "bar-chart", "Operational analytics and audit-ready reporting across enabled modules.", Perms("reports", "reports.view")),
        };

        public static List<NavGroupDto> GetNavigationGroups(string moduleKey)
        {
            return NavigationItems
                .Where(item => Comparer.Equals(item.ModuleKey, moduleKey))
                .GroupBy(item => item.GroupLabel, Comparer)
                .Select((group, groupIndex) => new NavGroupDto
                {
                    Label = group.Key,
                    SortOrder = groupIndex,
                    Items = group
                        .Select((item, itemIndex) => new NavItemDto
                        {
                            Key = item.Key,
                            Name = item.Name,
                            Path = item.Path,
                            Icon = item.Icon,
                            SortOrder = itemIndex,
                            RequiredPermissions = item.Permissions.ToList(),
                        })
                        .ToList(),
                })
                .ToList();
        }

        public static List<RoutePermissionRuleDto> GetRouteRules()
        {
            return NavigationItems
                .Select(item => new RoutePermissionRuleDto
                {
                    PathPattern = item.Path,
                    ModuleKey = item.ModuleKey,
                    PermissionKeys = item.Permissions.ToList(),
                })
                .GroupBy(rule => rule.PathPattern, Comparer)
                .Select(group => group.First())
                .ToList();
        }

        public static DashboardSchemaDto GetDashboardSchema(ISet<string> enabledModuleKeys)
        {
            var sections = DashboardWidgets
                .Where(widget => enabledModuleKeys.Contains(widget.ModuleKey))
                .GroupBy(widget => new { widget.SectionKey, widget.SectionTitle })
                .Select((group, sectionIndex) => new DashboardSectionDto
                {
                    Key = group.Key.SectionKey,
                    Title = group.Key.SectionTitle,
                    SortOrder = sectionIndex,
                    Widgets = group
                        .Select((widget, widgetIndex) => new WidgetDto
                        {
                            Key = widget.Key,
                            Type = "card",
                            Title = widget.Title,
                            Icon = widget.Icon,
                            Href = widget.Href,
                            ModuleKey = widget.ModuleKey,
                            SortOrder = widgetIndex,
                            RequiredPermissions = widget.Permissions.ToList(),
                            Props = new Dictionary<string, string>
                            {
                                ["summary"] = widget.Summary,
                            },
                        })
                        .ToList(),
                })
                .ToList();

            return new DashboardSchemaDto
            {
                SchemaVersion = "1",
                Sections = sections,
            };
        }
    }
}
