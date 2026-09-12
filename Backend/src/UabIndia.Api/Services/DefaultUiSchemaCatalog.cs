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

        private sealed record DerivedModuleSeed(
            string SourceModuleKey,
            string ModuleKey,
            string Name,
            string DisplayName,
            string Description,
            string Icon,
            string BasePath,
            int SortOrder,
            string[] PathPrefixes);

        private static readonly StringComparer Comparer = StringComparer.OrdinalIgnoreCase;

        private static string[] Perms(string moduleKey, params string[] keys)
        {
            var baseList = keys.Where(key => !string.IsNullOrWhiteSpace(key)).ToList();
            var perms = baseList.Concat(new[]
            {
                $"module:{moduleKey}",
                $"{moduleKey}.*",
                $"{moduleKey}.access",
                $"resource:{moduleKey}.access",
            });

            if (Comparer.Equals(moduleKey, "platform") || Comparer.Equals(moduleKey, "administration"))
            {
                var alt = Comparer.Equals(moduleKey, "platform") ? "administration" : "platform";
                perms = perms.Concat(new[]
                {
                    $"module:{alt}",
                    $"{alt}.*",
                    $"{alt}.access",
                    $"resource:{alt}.access",
                });

                var expanded = baseList.Select(k =>
                    k.StartsWith("platform.", StringComparison.OrdinalIgnoreCase)
                        ? "administration." + k["platform.".Length..]
                        : k.StartsWith("administration.", StringComparison.OrdinalIgnoreCase)
                            ? "platform." + k["administration.".Length..]
                            : k);

                perms = perms.Concat(expanded);
            }

            return perms.Distinct(Comparer).ToArray();
        }

        private static string[] LegacyErpPerms(params string[] keys) => Perms("erp", keys);

        private static readonly List<DerivedModuleSeed> DerivedModules = new()
        {
            new("erp", "finance", "Finance", "Finance", "Accounting, journals, transactions, billing, tax, and reconciliation workflows.", "bank", "/finance", 60, new[] { "/finance", "/chart-of-accounts", "/journal-entries", "/payments", "/invoices", "/expenses", "/tax-management", "/bank-reconciliation", "/accounting-periods", "/compliance", "/finance/budgeting", "/finance/consolidation" }),
            new("erp", "inventory", "Inventory", "Inventory", "Items, warehouses, stock movement, adjustments, and transfer visibility.", "box", "/inventory", 80, new[] { "/inventory", "/items", "/warehouses", "/stock-movements", "/inventory-adjustments", "/inventory-transfers", "/inventory/wms", "/manufacturing/work-orders" }),
            new("erp", "procurement", "Procurement", "Procurement", "Vendor, request, purchase order, goods receipt, and vendor bill workflows.", "shopping-cart", "/procurement", 90, new[] { "/procurement", "/vendors", "/purchase-requests", "/purchase-orders", "/grn", "/vendor-bills" }),
            new("erp", "sales", "Sales", "Sales", "Customer, quotation, discount scheme, sales order, and returns activity.", "shopping-bag", "/sales", 100, new[] { "/sales", "/customers", "/crm/customers", "/quotations", "/discounts", "/sales-orders", "/returns", "/sales/pricing", "/portal" }),
            new("erp", "projects", "Projects & Service", "Projects & Service", "Projects, task backlog, timesheets, field service, and fixed assets.", "folder", "/administration/projects", 110, new[] { "/projects", "/administration/projects", "/platform/projects", "/field-service", "/assets/depreciation" }),
            new("erp", "helpdesk", "Helpdesk", "Helpdesk", "Support intake, escalations, and knowledge workflows.", "ticket", "/helpdesk", 130, new[] { "/helpdesk" }),
            new("erp", "communication", "Communication", "Communication", "Announcements and reusable employee or customer message templates.", "megaphone", "/communication", 140, new[] { "/communication" }),
            new("erp", "integrations", "Integrations", "Integrations", "API keys, webhooks, app connections, and diagnostics.", "plug", "/integrations", 150, new[] { "/integrations" }),
        };

        private static DerivedModuleSeed? ResolveDerivedModuleByPath(string? path)
        {
            if (string.IsNullOrWhiteSpace(path))
            {
                return null;
            }

            foreach (var module in DerivedModules)
            {
                if (module.PathPrefixes.Any(prefix => path.Equals(prefix, StringComparison.OrdinalIgnoreCase) || path.StartsWith($"{prefix}/", StringComparison.OrdinalIgnoreCase)))
                {
                    return module;
                }
            }

            return null;
        }

        public static string ResolvePublishedModuleKey(string moduleKey, string? path = null)
        {
            if (!Comparer.Equals(moduleKey, "erp"))
            {
                return moduleKey;
            }

            return ResolveDerivedModuleByPath(path)?.ModuleKey ?? "platform";
        }

        public static List<ModuleMetaDto> ExpandEnabledModules(IEnumerable<ModuleMetaDto> modules)
        {
            var materialized = modules.ToList();
            var result = new List<ModuleMetaDto>();
            var existingKeys = new HashSet<string>(
                materialized
                    .Where(module => !Comparer.Equals(module.Key, "erp"))
                    .Select(module => module.Key),
                Comparer);

            foreach (var module in materialized)
            {
                if (Comparer.Equals(module.Key, "erp"))
                {
                    foreach (var derived in DerivedModules.Where(seed => Comparer.Equals(seed.SourceModuleKey, module.Key)))
                    {
                        if (existingKeys.Contains(derived.ModuleKey))
                        {
                            continue;
                        }

                        result.Add(new ModuleMetaDto
                        {
                            Key = derived.ModuleKey,
                            Name = derived.Name,
                            DisplayName = derived.DisplayName,
                            Description = derived.Description,
                            Icon = derived.Icon,
                            BasePath = derived.BasePath,
                            SortOrder = derived.SortOrder,
                            Version = module.Version,
                        });
                    }

                    continue;
                }

                if (Comparer.Equals(module.Key, "platform"))
                {
                    result.Add(new ModuleMetaDto
                    {
                        Key = module.Key,
                        Name = "Administration",
                        DisplayName = "Administration",
                        Description = module.Description ?? "Enterprise administration, organization governance, system configuration, and control center.",
                        Icon = "sliders",
                        BasePath = "/administration",
                        SortOrder = module.SortOrder,
                        Version = module.Version,
                    });
                    continue;
                }

                result.Add(module);
            }

            return result
                .OrderBy(module => module.SortOrder)
                .ThenBy(module => module.Key, Comparer)
                .ToList();
        }

        public static Dictionary<string, List<NavGroupDto>> ExpandLegacyTenantNavigation(Dictionary<string, List<NavGroupDto>> navigation)
        {
            if (!navigation.TryGetValue("erp", out var legacyGroups) || legacyGroups.Count == 0)
            {
                return navigation;
            }

            var next = new Dictionary<string, List<NavGroupDto>>(navigation, Comparer);

            foreach (var derived in DerivedModules)
            {
                if (next.ContainsKey(derived.ModuleKey))
                {
                    continue;
                }

                var groups = legacyGroups
                    .Select(group => new NavGroupDto
                    {
                        Label = group.Label,
                        SortOrder = group.SortOrder,
                        Items = group.Items
                            .Where(item => Comparer.Equals(ResolvePublishedModuleKey("erp", item.Path), derived.ModuleKey))
                            .ToList(),
                    })
                    .Where(group => group.Items.Count > 0)
                    .ToList();

                if (groups.Count > 0)
                {
                    next[derived.ModuleKey] = groups;
                }
            }

            next.Remove("erp");
            return next;
        }

        public static List<RoutePermissionRuleDto> ExpandLegacyRouteRules(List<RoutePermissionRuleDto> rules)
        {
            return rules
                .Select(rule =>
                {
                    if (!Comparer.Equals(rule.ModuleKey, "erp"))
                    {
                        return rule;
                    }

                    return new RoutePermissionRuleDto
                    {
                        PathPattern = rule.PathPattern,
                        ModuleKey = ResolvePublishedModuleKey(rule.ModuleKey, rule.PathPattern),
                        PermissionKeys = rule.PermissionKeys,
                    };
                })
                .ToList();
        }

        public static DashboardSchemaDto NormalizeDashboardSchema(DashboardSchemaDto schema)
        {
            foreach (var section in schema.Sections)
            {
                foreach (var widget in section.Widgets)
                {
                    if (Comparer.Equals(widget.ModuleKey, "erp"))
                    {
                        widget.ModuleKey = ResolvePublishedModuleKey(widget.ModuleKey, widget.Href);
                    }
                }
            }

            return schema;
        }

        private static readonly List<NavSeed> NavigationItems = new()
        {
            // ── Administration: 1. Organization ──────────────────────────────
            new("platform", "Organization", "platform-tenants", "Tenants", "/administration/tenants", "layers", Perms("platform", "platform.tenants.view")),
            new("platform", "Organization", "platform-companies", "Companies", "/administration/companies", "building", Perms("platform", "platform.companies.view")),
            new("platform", "Organization", "platform-projects", "Projects", "/administration/projects", "folder", Perms("platform", "platform.projects.view")),
            new("platform", "Organization", "platform-branches", "Branches", "/administration/branches", "building", Perms("platform", "platform.companies.view")),
            new("platform", "Organization", "platform-business-units", "Business Units", "/administration/business-units", "layers", Perms("platform", "platform.companies.view")),
            new("platform", "Organization", "platform-departments", "Departments", "/administration/departments", "layers", Perms("platform", "platform.companies.view")),
            new("platform", "Organization", "platform-designations", "Designations", "/administration/designations", "award", Perms("platform", "platform.companies.view")),
            new("platform", "Organization", "platform-cost-centers", "Cost Centers", "/administration/cost-centers", "dollar-sign", Perms("platform", "platform.companies.view")),
            new("platform", "Organization", "platform-holiday-calendar", "Holiday Calendar", "/administration/holiday-calendar", "calendar", Perms("platform", "platform.companies.view")),
            new("platform", "Organization", "platform-org-chart", "Org Chart", "/administration/org-chart", "git-branch", Perms("platform", "platform.companies.view")),

            // ── Administration: 2. User Management ────────────────────────────
            new("platform", "User Management", "platform-users", "Users", "/administration/users", "users", Perms("platform", "platform.users.view")),
            new("platform", "User Management", "platform-roles", "Roles", "/administration/roles", "shield", Perms("platform", "platform.roles.view")),
            new("platform", "User Management", "platform-permissions", "Permissions", "/administration/permissions", "key", Perms("platform", "platform.permissions.view")),

            // ── Administration: 3. Configuration ──────────────────────────────
            new("platform", "Configuration", "platform-module-mapping", "Navigation & Modules", "/administration/module-mapping", "grid", Perms("platform", "platform.settings.view")),
            new("platform", "Configuration", "platform-schema-manager", "Schema Manager", "/administration/schema-manager", "database", Perms("platform", "platform.settings.view")),
            new("platform", "Configuration", "platform-entity-builder", "Entity Builder", "/administration/entity-builder", "layers", Perms("platform", "platform.view")),
            new("platform", "Configuration", "platform-settings", "System Settings", "/administration/settings", "settings", Perms("platform", "platform.settings.view")),
            new("platform", "Configuration", "platform-feature-flags", "Feature Flags", "/administration/feature-flags", "sliders", Perms("platform", "platform.settings.view")),

            // ── Administration: 4. Workflow ───────────────────────────────────
            new("platform", "Workflow", "platform-workflow-config", "Workflows", "/administration/workflow-config", "git-branch", Perms("platform", "platform.settings.view")),
            new("platform", "Workflow", "platform-approvals", "Approvals", "/approvals", "check-circle", Perms("platform", "approvals.view")),

            // ── Administration: 5. Communication ──────────────────────────────
            new("platform", "Communication", "platform-notifications", "Notifications", "/notifications", "bell", Perms("platform", "notifications.view")),
            new("platform", "Communication", "platform-notification-templates", "Notification Templates", "/administration/notification-templates", "mail", Perms("platform", "platform.settings.view")),

            // ── Administration: 6. Security ───────────────────────────────────
            new("platform", "Security", "platform-security-sessions", "Access Control", "/administration/security/sessions", "shield", Perms("platform", "platform.view")),
            new("platform", "Security", "platform-policies", "Security Settings", "/administration/policies", "lock", Perms("platform", "platform.view")),

            // ── Administration: 7. Governance ─────────────────────────────────
            new("platform", "Governance", "platform-audit-logs", "Audit Logs", "/administration/audit-logs", "clipboard", Perms("platform", "audit.view")),
            new("platform", "Governance", "platform-master-data", "Master Data & Localization", "/administration/master-data", "globe", Perms("platform", "platform.view")),
            new("platform", "Governance", "platform-data-management", "Data Governance & Registries", "/administration/data-management", "database", Perms("platform", "platform.view")),
            new("platform", "Governance", "platform-privacy", "Data Privacy & DPDP Vault", "/administration/privacy", "shield", Perms("platform", "platform.view")),
            new("platform", "Governance", "platform-backup", "Backup & Disaster Recovery", "/administration/backup", "hard-drive", Perms("platform", "platform.view")),
            new("platform", "Governance", "platform-recycle-bin", "Recycle Bin", "/administration/recycle-bin", "trash", Perms("platform", "platform.view")),

            // ── Administration: 8. Billing ────────────────────────────────────
            new("platform", "Billing", "platform-licensing", "Licensing & Subscriptions", "/administration/licensing", "credit-card", Perms("platform", "platform.view")),

            // ── Administration: 9. System ─────────────────────────────────────
            new("platform", "System", "platform-system-health", "System Health", "/administration/system-health", "activity", Perms("platform", "platform.view")),
            new("platform", "System", "platform-website-pages", "Websites", "/administration/website/pages", "globe", Perms("platform", "platform.website.pages.view")),
            new("platform", "System", "platform-developer-center", "Developer Center", "/administration/developer-center", "code", Perms("platform", "platform.view")),
            new("platform", "System", "platform-webhooks", "Webhooks", "/administration/webhooks", "webhook", Perms("platform", "platform.view")),
            new("platform", "System", "platform-edi", "EDI X12 Studio", "/administration/edi", "file-text", Perms("platform", "platform.view")),
            new("platform", "System", "platform-contact-submissions", "Contact Submissions", "/administration/contact-submissions", "mail", Perms("platform", "platform.contactsubmissions.view")),

            new("ai", "AI Copilot Engine", "ai-home", "AI HR Copilot", "/ai", "bot", Perms("platform", "platform.view")),
            new("documents", "Document Center", "documents-home", "Document Vault", "/documents", "file-text", Perms("platform", "platform.view")),
            new("helpdesk", "Support", "helpdesk-home", "Service Helpdesk", "/helpdesk", "ticket", LegacyErpPerms()),

            new("administration", "Workspace", "admin-dashboard", "Administration Dashboard", "/dashboard", "dashboard", LegacyErpPerms("dashboard.view")),
            new("administration", "Workspace", "admin-approvals", "Approvals", "/approvals", "check-circle", LegacyErpPerms("approvals.view")),
            new("administration", "Workspace", "admin-notifications", "Notifications", "/notifications", "bell", LegacyErpPerms("notifications.view")),
            new("administration", "Workspace", "admin-documents", "Documents", "/documents", "document", LegacyErpPerms("documents.view")),
            new("administration", "Workspace", "admin-profile", "Profile", "/profile", "user", LegacyErpPerms()),
            new("finance", "Overview", "finance-home", "Finance Dashboard", "/finance", "dashboard", LegacyErpPerms("chartofaccounts.view")),
            new("finance", "Accounting", "finance-chart-of-accounts", "Chart of Accounts", "/chart-of-accounts", "layers", LegacyErpPerms("chartofaccounts.view")),
            new("finance", "Accounting", "finance-journal-entries", "Journal Entries", "/journal-entries", "journal", LegacyErpPerms("journalentries.view")),
            new("finance", "Treasury", "finance-payments", "Payments", "/payments", "credit-card", LegacyErpPerms("payments.view")),
            new("finance", "Treasury", "finance-invoices", "Invoices", "/invoices", "receipt", LegacyErpPerms("payments.view")),
            new("finance", "Treasury", "finance-vendor-bills", "Vendor Bills", "/vendor-bills", "receipt", LegacyErpPerms("payments.view")),
            new("finance", "Compliance", "finance-accounting-periods", "Accounting Periods", "/accounting-periods", "calendar", LegacyErpPerms("journalentries.view")),
            new("finance", "Treasury", "finance-expenses", "Expenses", "/expenses", "wallet", LegacyErpPerms("payments.view")),
            new("finance", "Compliance", "finance-tax-management", "Tax Management", "/tax-management", "calculator", LegacyErpPerms("chartofaccounts.view")),
            new("finance", "Compliance", "finance-bank-reconciliation", "Bank Reconciliation", "/bank-reconciliation", "bank", LegacyErpPerms("payments.view")),
            new("finance", "Compliance", "finance-compliance", "E-Invoicing & Compliance", "/compliance", "shield", LegacyErpPerms("chartofaccounts.view")),
            new("finance", "Planning", "finance-budgeting", "Budgeting & Forecasting", "/finance/budgeting", "trending-up", LegacyErpPerms("chartofaccounts.view")),
            new("finance", "Planning", "finance-consolidation", "Financial Consolidation", "/finance/consolidation", "layers", LegacyErpPerms("chartofaccounts.view")),
            new("procurement", "Overview", "procurement-home", "Procurement Dashboard", "/procurement", "dashboard", LegacyErpPerms("vendor.view")),
            new("procurement", "Sourcing", "procurement-vendors", "Vendors", "/vendors", "truck", LegacyErpPerms("vendor.view")),
            new("procurement", "Demand", "procurement-purchase-requests", "Purchase Requests", "/purchase-requests", "shopping-cart", LegacyErpPerms("purchaseorders.view")),
            new("procurement", "Ordering", "procurement-purchase-orders", "Purchase Orders", "/purchase-orders", "clipboard", LegacyErpPerms("purchaseorders.view")),
            new("procurement", "Receiving", "procurement-grn", "Goods Receipt (GRN)", "/grn", "box", LegacyErpPerms("purchaseorders.view")),
            new("procurement", "Payables", "procurement-vendor-bills", "Vendor Bills", "/vendor-bills", "receipt", LegacyErpPerms("purchaseorders.view")),
            new("sales", "Overview", "sales-home", "Sales Dashboard", "/sales", "dashboard", LegacyErpPerms("customer.view")),
            new("sales", "CRM & Sales", "sales-customers", "Customers", "/customers", "users", LegacyErpPerms("customer.view")),
            new("sales", "CRM & Sales", "sales-quotations", "Quotations", "/quotations", "file-text", LegacyErpPerms("salesorders.view")),
            new("sales", "Pricing", "sales-pricing", "Pricing Matrix", "/sales/pricing", "tag", LegacyErpPerms("salesorders.view")),
            new("sales", "Pricing", "sales-discounts", "Discounts", "/discounts", "percent", LegacyErpPerms("salesorders.view")),
            new("sales", "CRM & Sales", "sales-sales-orders", "Sales Orders", "/sales-orders", "shopping-bag", LegacyErpPerms("salesorders.view")),
            new("sales", "CRM & Sales", "sales-invoices", "Invoices", "/invoices", "receipt", LegacyErpPerms("salesorders.view")),
            new("sales", "CRM & Sales", "sales-returns", "Returns", "/returns", "rotate-ccw", LegacyErpPerms("salesorders.view")),
            new("sales", "CRM & Sales", "sales-portal", "B2B Customer Portal", "/portal", "globe", LegacyErpPerms("customer.view")),
            new("crm", "Overview", "crm-home", "CRM Dashboard", "/crm", "dashboard", Perms("crm", "crm.access")),
            new("crm", "Pipeline", "crm-leads", "Leads", "/crm/leads", "trending-up", Perms("crm", "crm.access")),
            new("crm", "Pipeline", "crm-pipeline", "Visual Pipeline", "/crm/pipeline", "columns", Perms("crm", "crm.access")),
            new("crm", "Accounts", "crm-customers", "Customers", "/crm/customers", "users", Perms("crm", "crm.access")),
            new("crm", "Accounts", "crm-contacts", "Contacts", "/crm/contacts", "contact-round", Perms("crm", "crm.access")),
            new("projects", "Delivery", "projects-home", "Projects Register", "/administration/projects", "folder", Perms("projects", "projects.access")),
            new("projects", "Delivery", "projects-tasks", "Project Tasks", "/projects/tasks", "clipboard", Perms("projects", "projects.access")),
            new("projects", "Delivery", "projects-timesheets", "Timesheets", "/projects/timesheets", "clock", Perms("projects", "projects.access")),
            new("projects", "Delivery", "projects-field-service", "Field Service", "/field-service", "map-pin", Perms("projects", "projects.access")),
            new("projects", "Delivery", "projects-assets-depreciation", "Fixed Asset Depreciation", "/assets/depreciation", "trending-down", Perms("projects", "projects.access")),
            new("inventory", "Overview", "inventory-home", "Inventory Dashboard", "/inventory", "dashboard", LegacyErpPerms("item.view")),
            new("inventory", "Stock Control", "inventory-items", "Items", "/items", "box", LegacyErpPerms("item.view")),
            new("inventory", "Stock Control", "inventory-warehouses", "Warehouses", "/warehouses", "warehouse", LegacyErpPerms("warehouses.view")),
            new("inventory", "Stock Control", "inventory-wms", "WMS & Bin Locations", "/inventory/wms", "layers", LegacyErpPerms("item.view")),
            new("inventory", "Movements", "inventory-stock-movements", "Stock Movements", "/stock-movements", "trending-up", LegacyErpPerms("stockmovements.view")),
            new("inventory", "Movements", "inventory-adjustments", "Inventory Adjustments", "/inventory-adjustments", "sliders", LegacyErpPerms("stockmovements.view")),
            new("inventory", "Movements", "inventory-transfers", "Inventory Transfers", "/inventory-transfers", "arrow-right-left", LegacyErpPerms("stockmovements.view")),
            new("inventory", "Movements", "inventory-work-orders", "Manufacturing Work Orders", "/manufacturing/work-orders", "cpu", LegacyErpPerms("item.view")),
            new("helpdesk", "Service", "helpdesk-home", "Helpdesk Overview", "/helpdesk", "dashboard", LegacyErpPerms()),
            new("helpdesk", "Service", "helpdesk-tickets", "Tickets", "/helpdesk/tickets", "ticket", LegacyErpPerms()),
            new("helpdesk", "Service", "helpdesk-escalations", "Escalations", "/helpdesk/escalations", "alert-triangle", LegacyErpPerms()),
            new("helpdesk", "Service", "helpdesk-faq", "FAQs", "/helpdesk/faq", "help-circle", LegacyErpPerms()),
            new("communication", "Messaging", "communication-home", "Communication Overview", "/communication", "dashboard", LegacyErpPerms()),
            new("communication", "Messaging", "communication-announcements", "Announcements", "/communication/announcements", "megaphone", LegacyErpPerms()),
            new("communication", "Messaging", "communication-email-templates", "Email Templates", "/communication/email-templates", "mail", LegacyErpPerms()),
            new("communication", "Messaging", "communication-sms-templates", "SMS Templates", "/communication/sms-templates", "message-square", LegacyErpPerms()),
            new("integrations", "Connectivity", "integrations-home", "Integrations Overview", "/integrations", "dashboard", LegacyErpPerms()),
            new("integrations", "Connectivity", "integrations-api-keys", "API Keys", "/integrations/api-keys", "key", LegacyErpPerms()),
            new("integrations", "Connectivity", "integrations-webhooks", "Webhooks", "/integrations/webhooks", "webhook", LegacyErpPerms()),
            new("integrations", "Connectivity", "integrations-apps", "Third-Party Apps", "/integrations/apps", "plug", LegacyErpPerms()),

            new("hrms", "Self-Service", "ess-home", "Employee Self-Service (ESS)", "/ess", "user", Perms("hrms", "employee.view")),
            new("hrms", "Self-Service", "mss-home", "Manager Self-Service (MSS)", "/mss", "users", Perms("hrms", "employee.view")),
            new("hrms", "Talent & Compliance", "recruitment-home", "Recruitment ATS", "/recruitment", "search", Perms("hrms", "recruitment.view")),
            new("hrms", "Talent & Compliance", "performance-home", "Performance OKRs", "/performance", "trending-up", Perms("hrms", "performance.view")),
            new("hrms", "Talent & Compliance", "travel-home", "Travel & Expenses", "/travel", "briefcase", Perms("hrms", "employee.view")),
            new("hrms", "Talent & Compliance", "compliance-home", "Statutory Compliance", "/compliance", "shield", Perms("hrms", "hrms.view")),
            new("hrms", "Core HR", "hrms-home", "HR Dashboard", "/hrms", "dashboard", Perms("hrms", "hrms.view")),
            new("hrms", "Core HR", "hrms-employees", "Employees", "/hrms/employees", "employees", Perms("hrms", "employee.view")),
            new("hrms", "Core HR", "hrms-certificates", "Certificates", "/hrms/certificates", "award", Perms("hrms", "certificates.view")),
            new("hrms", "Core HR", "hrms-assets", "Assets", "/hrms/assets", "monitor", Perms("hrms", "hr.assets.view")),
            new("hrms", "Employee Lifecycle", "hrms-onboarding", "Onboarding", "/hrms/onboarding", "user-plus", Perms("hrms", "employee.view")),
            new("hrms", "Employee Lifecycle", "hrms-offboarding", "Offboarding", "/hrms/offboarding", "user-minus", Perms("hrms", "employee.view")),
            new("hrms", "Employee Lifecycle", "hrms-probation", "Probation", "/hrms/probation", "hourglass", Perms("hrms", "employee.view")),
            new("hrms", "Attendance & Time", "hrms-attendance", "Attendance", "/hrms/attendance", "attendance", Perms("hrms", "attendance.view")),
            new("hrms", "Attendance & Time", "hrms-shifts", "Shifts", "/hrms/shifts", "clock", Perms("hrms", "shifts.view")),
            new("hrms", "Attendance & Time", "hrms-overtime", "Overtime", "/hrms/overtime", "timer", Perms("hrms", "overtime.view")),
            new("hrms", "Attendance & Time", "hrms-leave", "Leave", "/hrms/leave", "leave", Perms("hrms", "leave.view")),
            new("hrms", "Talent Acquisition", "hrms-recruitment", "Recruitment", "/hrms/recruitment", "search", Perms("hrms", "recruitment.view")),
            new("hrms", "Talent Acquisition", "hrms-screening-schedule", "Screening Schedule", "/hrms/screening-schedule", "calendar-check", Perms("hrms", "screening.schedule.view")),
            new("hrms", "Talent Acquisition", "hrms-screening-results", "Screening Results", "/hrms/screening-results", "bar-chart", Perms("hrms", "screening.results.view")),
            new("hrms", "Learning & Development", "hrms-training", "Training & Learning", "/hrms/training", "training", Perms("hrms", "training.view")),
            new("hrms", "Learning & Development", "hrms-assessments", "Assessments", "/hrms/assessments", "clipboard-check", Perms("hrms", "assessments.view")),
            new("hrms", "Performance", "hrms-performance", "Performance", "/hrms/performance", "trending-up", Perms("hrms", "performance.view")),
            new("hrms", "HR Operations", "hrms-payroll", "HR Payroll", "/hrms/payroll", "payroll", Perms("hrms", "hr.payroll.view")),

            new("payroll", "Overview", "payroll-home", "Payroll Dashboard", "/payroll", "dashboard", Perms("payroll", "payroll.view")),
            new("payroll", "Processing", "payroll-runs", "Payroll Runs", "/payroll/runs", "play-circle", Perms("payroll", "payroll.runs.view")),
            new("payroll", "Processing", "payroll-payslips", "Payslips", "/payroll/payslips", "file-text", Perms("payroll", "payroll.payslips.view")),
            new("payroll", "Processing", "payroll-bonus", "Bonus & Incentives", "/payroll/bonus", "gift", Perms("payroll", "payroll.runs.view")),
            new("payroll", "Processing", "payroll-arrears", "Arrears", "/payroll/arrears", "clock", Perms("payroll", "payroll.runs.view")),
            new("payroll", "Setup", "payroll-structures", "Structures", "/payroll/structures", "layers", Perms("payroll", "payroll.structures.view")),
            new("payroll", "Setup", "payroll-components", "Components", "/payroll/components", "puzzle", Perms("payroll", "payroll.components.view")),
            new("payroll", "Setup", "payroll-loans", "Loan Management", "/payroll/loans", "credit-card", Perms("payroll", "payroll.view")),
            new("payroll", "Setup", "payroll-reimbursements", "Reimbursements", "/payroll/reimbursements", "receipt", Perms("payroll", "payroll.view")),
            new("payroll", "Compliance", "payroll-statutory", "Statutory", "/payroll/statutory", "shield", Perms("payroll", "payroll.statutory.view")),
            new("payroll", "Compliance", "payroll-final-settlement", "Final Settlement", "/payroll/final-settlement", "clipboard-check", Perms("payroll", "payroll.view")),
            new("payroll", "Compliance", "payroll-tax-declarations", "Tax Declarations", "/payroll/tax-declarations", "calculator", Perms("payroll", "payroll.view")),

            new("reports", "Overview", "reports-home", "Reports Home", "/reports", "dashboard", Perms("reports", "reports.view")),
            new("reports", "HR", "reports-hr", "HR Reports", "/reports/hr", "employees", Perms("reports", "reports.hr.view")),
            new("reports", "Payroll", "reports-payroll", "Payroll Reports", "/reports/payroll", "payroll", Perms("reports", "reports.payroll.view")),
            new("reports", "Compliance", "reports-compliance", "Compliance Reports", "/reports/compliance", "shield", Perms("reports", "reports.compliance.view")),
            new("reports", "Business Operations", "reports-erp", "Platform Operations Reports", "/reports/erp", "briefcase", Perms("reports", "reports.view")),
            new("reports", "Finance", "reports-financial", "Financial Reports", "/reports/financial", "trending-up", Perms("reports", "reports.view")),
            new("reports", "Advanced", "reports-custom", "Custom Reports", "/reports/custom", "sliders", Perms("reports", "reports.view")),

            new("licensing", "Overview", "licensing-home", "Overview", "/licensing", "dashboard", Perms("licensing", "licensing.view")),
            new("licensing", "Product", "licensing-catalog", "Module Catalog", "/licensing/catalog", "grid", Perms("licensing", "licensing.catalog.view")),
            new("licensing", "Product", "licensing-subscriptions", "Subscriptions", "/licensing/subscriptions", "layers", Perms("licensing", "licensing.subscriptions.view")),
            new("licensing", "Billing", "licensing-billing-history", "Billing History", "/licensing/billing-history", "credit-card", Perms("licensing", "licensing.view")),
            new("licensing", "Billing", "licensing-usage", "Usage Analytics", "/licensing/usage", "bar-chart", Perms("licensing", "licensing.view")),
            new("licensing", "Connect", "licensing-integrations", "Integrations", "/licensing/integrations", "plug", Perms("licensing", "licensing.integrations.view")),

            new("security", "Overview", "security-home", "Security Overview", "/security", "shield", Perms("security", "security.view")),
            new("security", "Authentication", "security-mfa", "MFA", "/security/mfa", "smartphone", Perms("security", "security.mfa.view")),
            new("security", "Authentication", "security-sso", "SSO", "/security/sso", "key", Perms("security", "security.view")),
            new("security", "Devices", "security-devices", "Devices", "/security/devices", "monitor", Perms("security", "security.devices.view")),
            new("security", "Sessions", "security-sessions", "Sessions", "/security/sessions", "activity", Perms("security", "security.sessions.view")),
            new("security", "Sessions", "security-access-logs", "Access Logs", "/security/access-logs", "file-text", Perms("security", "audit.view")),
            new("security", "Policies", "security-password-policies", "Password Policies", "/security/password-policies", "lock", Perms("security", "security.passwordpolicies.view")),
            new("security", "Policies", "security-ip-restrictions", "IP Restrictions", "/security/ip-restrictions", "globe", Perms("security", "security.view")),
        };

        private static readonly List<DashboardSeed> DashboardWidgets = new()
        {
            new("workspace-modules", "Workspace modules", "dashboard-platform", "Administration", "/administration", "platform", "sliders", "Tenant governance, access control, system configuration, security, and operational monitoring.", Perms("platform", "platform.view")),
            new("workspace-modules", "Workspace modules", "dashboard-administration", "Administration", "/dashboard", "administration", "dashboard", "Shared approvals, documents, alerts, and personal workspace utilities.", LegacyErpPerms("dashboard.view")),
            new("workspace-modules", "Workspace modules", "dashboard-hrms", "HRMS", "/hrms", "hrms", "employees", "Employee records, attendance, leave, recruitment, training, and lifecycle flows.", Perms("hrms", "hrms.view")),
            new("workspace-modules", "Workspace modules", "dashboard-payroll", "Payroll", "/payroll", "payroll", "payroll", "Runs, payslips, structures, statutory processing, and payroll operations.", Perms("payroll", "payroll.view")),
            new("workspace-modules", "Workspace modules", "dashboard-finance-card", "Finance", "/finance", "finance", "bank", "Accounting, treasury, tax, invoicing, and reconciliation operations.", LegacyErpPerms("chartofaccounts.view")),
            new("workspace-modules", "Workspace modules", "dashboard-inventory-card", "Inventory", "/inventory", "inventory", "box", "Item masters, warehouse control, movements, and stock visibility.", LegacyErpPerms("item.view")),
            new("workspace-modules", "Workspace modules", "dashboard-procurement-card", "Procurement", "/procurement", "procurement", "shopping-cart", "Vendors, requests, purchase orders, and goods receipt workflows.", LegacyErpPerms("vendor.view")),
            new("workspace-modules", "Workspace modules", "dashboard-sales-card", "Sales", "/sales", "sales", "shopping-bag", "Customers, quotations, sales orders, and returns activity.", LegacyErpPerms("customer.view")),
            new("workspace-modules", "Workspace modules", "dashboard-crm-card", "CRM", "/crm", "crm", "contact-round", "Leads, pipeline, and customer relationship workflows.", Perms("crm", "crm.access")),
            new("workspace-modules", "Workspace modules", "dashboard-helpdesk-card", "Helpdesk", "/helpdesk", "helpdesk", "ticket", "Tickets, escalations, FAQs, and service visibility.", LegacyErpPerms()),
            new("workspace-modules", "Workspace modules", "dashboard-communication-card", "Communication", "/communication", "communication", "megaphone", "Announcements and reusable outreach templates.", LegacyErpPerms()),
            new("workspace-modules", "Workspace modules", "dashboard-integrations-card", "Integrations", "/integrations", "integrations", "plug", "API keys, webhooks, and connected app governance.", LegacyErpPerms()),
            new("workspace-modules", "Workspace modules", "dashboard-reports", "Reports", "/reports", "reports", "file", "Cross-module reporting for HR, payroll, finance, compliance, and leadership review.", Perms("reports", "reports.view")),
            new("workspace-modules", "Workspace modules", "dashboard-licensing", "Licensing", "/licensing", "licensing", "box", "Catalog, subscriptions, billing visibility, and integration governance.", Perms("licensing", "licensing.view")),
            new("workspace-modules", "Workspace modules", "dashboard-security", "Security", "/security", "security", "shield", "Sessions, MFA, SSO, password policies, devices, and access oversight.", Perms("security", "security.view")),

            new("daily-work", "Priority actions", "dashboard-approvals", "Review approvals", "/approvals", "administration", "check-circle", "Open queues for leave, attendance, procurement, and finance workflows.", LegacyErpPerms("approvals.view")),
            new("daily-work", "Priority actions", "dashboard-notifications", "View notifications", "/notifications", "administration", "bell", "Unread alerts, escalations, and operational announcements from backend services.", LegacyErpPerms("notifications.view")),
            new("daily-work", "Priority actions", "dashboard-documents", "Open documents", "/documents", "administration", "document", "Document vault, exports, and attached operational records.", LegacyErpPerms("documents.view")),
            new("daily-work", "Priority actions", "dashboard-employees", "Manage employees", "/hrms/employees", "hrms", "users", "Employee master data, reporting structure, and lifecycle tasks.", Perms("hrms", "employee.view")),
            new("daily-work", "Priority actions", "dashboard-payroll-runs", "Run payroll", "/payroll/runs", "payroll", "play-circle", "Current and historical payroll runs with backend-driven approvals.", Perms("payroll", "payroll.runs.view")),
            new("daily-work", "Priority actions", "dashboard-finance", "Review finance", "/finance", "finance", "calculator", "Chart of accounts, journals, and transaction management.", LegacyErpPerms("chartofaccounts.view")),
            new("daily-work", "Priority actions", "dashboard-reports-link", "Open reports", "/reports", "reports", "bar-chart", "Operational analytics and audit-ready reporting across enabled modules.", Perms("reports", "reports.view")),
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
