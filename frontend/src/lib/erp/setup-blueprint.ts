import { ROUTES } from "@/constants/routes";

export type SetupHierarchyLevel = {
  key: string;
  label: string;
  description: string;
};

export type SetupDomain = {
  key: string;
  label: string;
  summary: string;
  owner: string;
  route: string;
  status: "ready" | "partial" | "planned";
};

export type SetupStage = {
  step: number;
  title: string;
  summary: string;
  outputs: string[];
  dependencies: string[];
  gate: string;
  linkedDomains: string[];
};

export type SetupPageContext = {
  route: string;
  label: string;
  domainKey: string;
  owner: string;
  stageSteps: number[];
  nextAction: string;
  validationFocus: string;
};

export const setupHierarchy: SetupHierarchyLevel[] = [
  { key: "platform", label: "Platform", description: "Global policies, environment controls, system health, and shared governance." },
  { key: "tenant", label: "Tenant", description: "Workspace subscription, tenant identity, domain, storage, and enabled capabilities." },
  { key: "company", label: "Company", description: "Legal entity, statutory profile, finance, HR, and operating policies." },
  { key: "business-unit", label: "Business Unit", description: "Commercial or operating segment inheriting company-level controls." },
  { key: "division", label: "Division", description: "Mid-level structure for reporting, responsibility, and operational grouping." },
  { key: "branch", label: "Branch", description: "Location-level administration, attendance, payroll, and document ownership." },
  { key: "project", label: "Project", description: "Mini workspace for client delivery, assets, staff deployment, and compliance." },
  { key: "department", label: "Department", description: "Functional grouping for policies, approvals, and reporting structure." },
  { key: "designation", label: "Designation", description: "Role template controlling responsibilities, pay structures, and approvals." },
  { key: "employee", label: "Employee", description: "Final inheriting record for access, workflow, attendance, payroll, and documents." },
];

export const setupDomains: SetupDomain[] = [
  {
    key: "platform-setup",
    label: "Platform Setup",
    summary: "Tenant controls, schema, flags, website, branding, health, and platform operations.",
    owner: "Platform Admin",
    route: ROUTES.PLATFORM_HOME,
    status: "ready",
  },
  {
    key: "tenant-setup",
    label: "Tenant Setup",
    summary: "Provision tenants, map modules, manage lifecycle, billing, and environment isolation.",
    owner: "Platform Admin",
    route: ROUTES.PLATFORM_TENANTS,
    status: "ready",
  },
  {
    key: "company-setup",
    label: "Company Setup",
    summary: "Company master, legal profile, financial year, taxation, attendance, and payroll policies.",
    owner: "Company Admin",
    route: ROUTES.PLATFORM_COMPANIES,
    status: "ready",
  },
  {
    key: "organization-structure",
    label: "Organization Structure",
    summary: "Model branches, departments, designations, projects, and reporting layers with inheritance.",
    owner: "HR / Ops",
    route: ROUTES.PLATFORM_PROJECTS,
    status: "partial",
  },
  {
    key: "security",
    label: "Security",
    summary: "Users, roles, permissions, route access, password policy, sessions, and device controls.",
    owner: "Security Admin",
    route: ROUTES.PLATFORM_USERS,
    status: "ready",
  },
  {
    key: "workflow",
    label: "Workflow",
    summary: "Approval routing, escalation, SLA, and dependency-based approval design.",
    owner: "Process Owner",
    route: ROUTES.PLATFORM_WORKFLOW_CONFIG,
    status: "partial",
  },
  {
    key: "integration",
    label: "Integration",
    summary: "API keys, webhooks, connected apps, versioning, rate control, and delivery monitoring.",
    owner: "Integration Admin",
    route: ROUTES.INTEGRATIONS_HOME,
    status: "ready",
  },
  {
    key: "notifications",
    label: "Notifications",
    summary: "Email, SMS, WhatsApp, in-app templates, queue visibility, and retry behavior.",
    owner: "Communications Admin",
    route: ROUTES.PLATFORM_NOTIFICATION_TEMPLATES,
    status: "partial",
  },
  {
    key: "document-compliance",
    label: "Document & Compliance",
    summary: "Document rules, auditability, retention, approvals, and compliance-linked records.",
    owner: "Compliance Lead",
    route: ROUTES.ADMINISTRATION_DOCUMENTS,
    status: "partial",
  },
  {
    key: "branding-monitoring",
    label: "Branding & Monitoring",
    summary: "Themes, website pages, contact submissions, audit, recycle state, and system health.",
    owner: "Platform Admin",
    route: ROUTES.PLATFORM_WEBSITE_PAGES,
    status: "ready",
  },
];

export const setupStages: SetupStage[] = [
  {
    step: 1,
    title: "Platform Initialization",
    summary: "Prepare the environment, schema rules, feature flags, platform identity, and monitoring baselines.",
    outputs: ["Environment profile", "Platform identity", "Baseline health checks"],
    dependencies: [],
    gate: "Platform health, environment, and schema controls must be defined.",
    linkedDomains: ["platform-setup", "branding-monitoring"],
  },
  {
    step: 2,
    title: "Tenant Provisioning",
    summary: "Create tenant workspace, assign modules, storage boundaries, branding, and lifecycle status.",
    outputs: ["Tenant record", "Provisioning baseline", "Module entitlement set"],
    dependencies: ["Platform Initialization"],
    gate: "Tenant must be provisioned and mapped to a valid subscription scope.",
    linkedDomains: ["tenant-setup", "platform-setup"],
  },
  {
    step: 3,
    title: "Subscription & License Assignment",
    summary: "Apply commercial plan, usage rules, enabled modules, and renewal visibility.",
    outputs: ["Subscription plan", "License coverage", "Module access baseline"],
    dependencies: ["Tenant Provisioning"],
    gate: "Tenant cannot continue until module entitlement and licensing are active.",
    linkedDomains: ["tenant-setup", "platform-setup"],
  },
  {
    step: 4,
    title: "Company Creation",
    summary: "Create legal company records and map them into the tenant operating context.",
    outputs: ["Company profile", "Legal identity", "Operating owner"],
    dependencies: ["Subscription & License Assignment"],
    gate: "Company record must exist before downstream structure can inherit policy.",
    linkedDomains: ["company-setup"],
  },
  {
    step: 5,
    title: "Business Unit & Organization Structure",
    summary: "Model branch, project, department, designation, and reporting hierarchy for inheritance.",
    outputs: ["Org hierarchy", "Reporting structure", "Operating units"],
    dependencies: ["Company Creation"],
    gate: "Every downstream employee and project assignment must resolve to a valid structure.",
    linkedDomains: ["organization-structure", "company-setup"],
  },
  {
    step: 6,
    title: "Branch & Location Configuration",
    summary: "Define working locations, branch calendars, shift-relevant timezones, and local ownership.",
    outputs: ["Branch map", "Location rules", "Timezone coverage"],
    dependencies: ["Business Unit & Organization Structure"],
    gate: "Attendance, notifications, and compliance checks require valid branch configuration.",
    linkedDomains: ["organization-structure", "company-setup"],
  },
  {
    step: 7,
    title: "Department & Designation Setup",
    summary: "Create functional structures and designation templates for reporting and compensation logic.",
    outputs: ["Department list", "Designation matrix", "Role structures"],
    dependencies: ["Business Unit & Organization Structure"],
    gate: "Employee onboarding and workflow routing require complete designation mapping.",
    linkedDomains: ["organization-structure", "company-setup"],
  },
  {
    step: 8,
    title: "Financial Year & Compliance Configuration",
    summary: "Define statutory, taxation, fiscal year, and baseline governance records.",
    outputs: ["Financial year", "Compliance profile", "Tax setup"],
    dependencies: ["Company Creation"],
    gate: "Payroll, finance, and audit exports require statutory baseline to be valid.",
    linkedDomains: ["company-setup", "document-compliance"],
  },
  {
    step: 9,
    title: "Security & Data Access",
    summary: "Assign users, roles, permissions, data access, login policy, and scope-level security.",
    outputs: ["User access model", "Permission matrix", "Session policy"],
    dependencies: ["Company Creation", "Business Unit & Organization Structure"],
    gate: "No transactional module should go live before access and scope policy are validated.",
    linkedDomains: ["security"],
  },
  {
    step: 10,
    title: "Approval Workflow Design",
    summary: "Configure process approvals, escalation rules, SLA timers, and exception paths.",
    outputs: ["Workflow templates", "Escalation matrix", "Approval owners"],
    dependencies: ["Security & Data Access", "Department & Designation Setup"],
    gate: "Operational modules require mapped approval actors and rejection flow before activation.",
    linkedDomains: ["workflow", "security"],
  },
  {
    step: 11,
    title: "Notification & Communication Channels",
    summary: "Wire templates, channels, fallback delivery, and operational communication ownership.",
    outputs: ["Channel templates", "Delivery routing", "Notification governance"],
    dependencies: ["Security & Data Access", "Approval Workflow Design"],
    gate: "Alerting and workflow messaging should be verified before user rollout.",
    linkedDomains: ["notifications", "integration"],
  },
  {
    step: 12,
    title: "Project Creation",
    summary: "Create projects as mini operating workspaces with client, budget, structure, and controls.",
    outputs: ["Project workspace", "Client mapping", "Project ownership"],
    dependencies: ["Branch & Location Configuration", "Department & Designation Setup"],
    gate: "Project must inherit valid company and branch policy before assignment.",
    linkedDomains: ["organization-structure", "company-setup"],
  },
  {
    step: 13,
    title: "Project Locations & Hierarchy",
    summary: "Model project sites, deployment zones, department mapping, and local operations chain.",
    outputs: ["Project location structure", "Site hierarchy", "Reporting chain"],
    dependencies: ["Project Creation"],
    gate: "Attendance, assets, vehicles, and cost allocations require project hierarchy.",
    linkedDomains: ["organization-structure"],
  },
  {
    step: 14,
    title: "Employee Role & Reporting Mapping",
    summary: "Map employees to branch, project, department, designation, and line manager structures.",
    outputs: ["Employee structure map", "Manager routing", "Scope assignment"],
    dependencies: ["Department & Designation Setup", "Project Locations & Hierarchy", "Security & Data Access"],
    gate: "No people transaction should start without valid reporting and data access mapping.",
    linkedDomains: ["organization-structure", "security"],
  },
  {
    step: 15,
    title: "Attendance, Shift & Leave Configuration",
    summary: "Configure workforce time controls, leave rules, shifts, rosters, and branch/project policy inheritance.",
    outputs: ["Attendance policy", "Shift framework", "Leave rules"],
    dependencies: ["Employee Role & Reporting Mapping", "Branch & Location Configuration"],
    gate: "Payroll should not start until workforce time policy is validated end to end.",
    linkedDomains: ["company-setup", "organization-structure", "workflow"],
  },
  {
    step: 16,
    title: "Payroll & Statutory Configuration",
    summary: "Set payroll structures, components, statutory rules, declarations, and approval-dependent runs.",
    outputs: ["Payroll structure", "Statutory setup", "Run controls"],
    dependencies: ["Financial Year & Compliance Configuration", "Attendance, Shift & Leave Configuration"],
    gate: "Payroll go-live requires statutory, employee structure, and attendance integrity checks.",
    linkedDomains: ["company-setup", "document-compliance", "workflow"],
  },
  {
    step: 17,
    title: "Asset & Inventory Configuration",
    summary: "Prepare assets, inventory controls, ownership mapping, and project/employee assignment rules.",
    outputs: ["Asset policy", "Inventory ownership", "Assignment controls"],
    dependencies: ["Project Locations & Hierarchy", "Employee Role & Reporting Mapping"],
    gate: "Assets and stock controls require location and accountability owners.",
    linkedDomains: ["organization-structure", "document-compliance"],
  },
  {
    step: 18,
    title: "Document & Compliance Rules",
    summary: "Configure attachment rules, versioning, expiry, approvals, and compliance evidence retention.",
    outputs: ["Document policy", "Retention rules", "Compliance evidence structure"],
    dependencies: ["Security & Data Access", "Project Creation"],
    gate: "Regulated documents need access policy, expiry logic, and audit visibility before production.",
    linkedDomains: ["document-compliance", "security"],
  },
  {
    step: 19,
    title: "API, Integrations & AI Configuration",
    summary: "Enable external interfaces, version control, token policy, webhooks, and governed AI features.",
    outputs: ["API controls", "Integration routing", "AI governance baseline"],
    dependencies: ["Security & Data Access", "Notification & Communication Channels"],
    gate: "External and AI access require explicit security and audit controls before enablement.",
    linkedDomains: ["integration", "security", "platform-setup"],
  },
  {
    step: 20,
    title: "UAT Validation",
    summary: "Run dependency validation, checklist review, workflow tests, and role-based transaction checks.",
    outputs: ["UAT checklist", "Dependency validation", "Issue register"],
    dependencies: ["Payroll & Statutory Configuration", "Document & Compliance Rules", "API, Integrations & AI Configuration"],
    gate: "Open defects, broken inheritance, or failed workflows block go-live readiness.",
    linkedDomains: ["platform-setup", "workflow", "security", "document-compliance"],
  },
  {
    step: 21,
    title: "Go-Live Readiness Review",
    summary: "Confirm readiness on data integrity, owners, security, monitoring, rollback, and support posture.",
    outputs: ["Readiness review", "Rollback plan", "Support coverage"],
    dependencies: ["UAT Validation"],
    gate: "Readiness sign-off must exist for platform, tenant, company, and core operational modules.",
    linkedDomains: ["platform-setup", "security", "branding-monitoring"],
  },
  {
    step: 22,
    title: "Production Activation",
    summary: "Activate production access, release users, open workflows, and shift from setup to operations.",
    outputs: ["Active production workspace", "Enabled users", "Operational controls live"],
    dependencies: ["Go-Live Readiness Review"],
    gate: "Production activation only follows approved readiness review and rollback capability.",
    linkedDomains: ["platform-setup", "tenant-setup", "security"],
  },
  {
    step: 23,
    title: "Continuous Monitoring",
    summary: "Monitor health, audit, backups, usage, cost, failures, and post-go-live adoption trends.",
    outputs: ["Monitoring baseline", "Audit visibility", "Operational review loop"],
    dependencies: ["Production Activation"],
    gate: "Ongoing operations require health alerts, audit tracking, and recovery confidence.",
    linkedDomains: ["branding-monitoring", "platform-setup", "integration"],
  },
];

export const setupGates = [
  "Hierarchy inheritance must resolve cleanly from platform to employee.",
  "Security, data access, and workflow routing must be assigned before transactional go-live.",
  "Statutory and financial year setup must pass before payroll or finance activation.",
  "UAT must validate dependencies, checklists, and role-based flows before production.",
  "Production must retain monitoring, audit, backup, and rollback visibility from day one.",
];

export const setupDomainMap = new Map(setupDomains.map((domain) => [domain.key, domain]));
export const setupStageMap = new Map(setupStages.map((stage) => [stage.step, stage]));

export const setupPageContexts: SetupPageContext[] = [
  {
    route: ROUTES.PLATFORM_SETTINGS,
    label: "Master & Configuration",
    domainKey: "platform-setup",
    owner: "Platform Admin",
    stageSteps: [1, 20, 21, 22, 23],
    nextAction: "Use this workspace to sequence rollout, owners, dependencies, and go-live gates.",
    validationFocus: "Cross-domain dependency readiness and production activation gates.",
  },
  {
    route: ROUTES.PLATFORM_TENANTS,
    label: "Tenant Setup",
    domainKey: "tenant-setup",
    owner: "Platform Admin",
    stageSteps: [2, 3],
    nextAction: "Provision tenant records, map modules, and confirm subscription readiness.",
    validationFocus: "Tenant lifecycle, module entitlement, and provisioning completeness.",
  },
  {
    route: ROUTES.PLATFORM_SCHEMA_MANAGER,
    label: "Schema Manager",
    domainKey: "platform-setup",
    owner: "Platform Admin",
    stageSteps: [1, 20],
    nextAction: "Define governed extensions before teams create one-off fields inside business pages.",
    validationFocus: "Entity extension governance, field consistency, and UAT-safe customization.",
  },
  {
    route: ROUTES.PLATFORM_FEATURE_FLAGS,
    label: "Feature Flags",
    domainKey: "platform-setup",
    owner: "Platform Admin",
    stageSteps: [1, 19, 22],
    nextAction: "Use controlled rollouts to enable capabilities only after dependency validation passes.",
    validationFocus: "Release safety, staged rollout, and module activation control.",
  },
  {
    route: ROUTES.PLATFORM_WORKFLOW_CONFIG,
    label: "Workflow Configuration",
    domainKey: "workflow",
    owner: "Process Owner",
    stageSteps: [10, 20],
    nextAction: "Map approval actors, escalation, SLA, and rejection paths before transactional rollout.",
    validationFocus: "Approval chain completeness and workflow dependency testing.",
  },
  {
    route: ROUTES.PLATFORM_NOTIFICATION_TEMPLATES,
    label: "Notification Templates",
    domainKey: "notifications",
    owner: "Communications Admin",
    stageSteps: [11, 19],
    nextAction: "Prepare templates and fallback delivery before user-facing workflow alerts go live.",
    validationFocus: "Channel readiness, template coverage, and delivery fallback behavior.",
  },
  {
    route: ROUTES.PLATFORM_SYSTEM_HEALTH,
    label: "System Health",
    domainKey: "branding-monitoring",
    owner: "Platform Admin",
    stageSteps: [1, 21, 23],
    nextAction: "Track operational baseline, release health, and post-go-live stability from one monitor.",
    validationFocus: "Environment health, monitoring readiness, and production stability.",
  },
  {
    route: ROUTES.PLATFORM_CONTACT_SUBMISSIONS,
    label: "Contact Submissions",
    domainKey: "branding-monitoring",
    owner: "Service Operations",
    stageSteps: [11, 23],
    nextAction: "Route inbound contact and service demand into governed response ownership.",
    validationFocus: "Intake routing, operator response handling, and post-go-live service visibility.",
  },
  {
    route: ROUTES.AUDIT_LOGS,
    label: "Audit Logs",
    domainKey: "document-compliance",
    owner: "Compliance Lead",
    stageSteps: [18, 20, 23],
    nextAction: "Validate that critical platform actions remain traceable before and after go-live.",
    validationFocus: "Traceability, actor visibility, and audit evidence completeness.",
  },
  {
    route: ROUTES.PLATFORM_WEBSITE_PAGES,
    label: "Website Pages",
    domainKey: "branding-monitoring",
    owner: "Platform Admin",
    stageSteps: [1, 11, 22],
    nextAction: "Keep public messaging and publication state aligned with activation readiness.",
    validationFocus: "Brand control, publish governance, and activation-safe public content.",
  },
  {
    route: ROUTES.PLATFORM_WEBSITE_THEMES,
    label: "Website Themes",
    domainKey: "branding-monitoring",
    owner: "Platform Admin",
    stageSteps: [1, 11, 22],
    nextAction: "Apply the public color and shell system only after brand and rollout governance are approved.",
    validationFocus: "Brand consistency, shell readiness, and activation-safe theme rollout.",
  },
  {
    route: ROUTES.PLATFORM_WEBSITE_SETTINGS,
    label: "Website Settings",
    domainKey: "branding-monitoring",
    owner: "Platform Admin",
    stageSteps: [1, 11, 19, 22],
    nextAction: "Keep site config, workflow JSON, and branding payload aligned with controlled release readiness.",
    validationFocus: "Website config integrity, publish workflow, and safe activation governance.",
  },
  {
    route: ROUTES.PLATFORM_COMPANIES,
    label: "Company Master",
    domainKey: "company-setup",
    owner: "Company Admin",
    stageSteps: [4, 5, 8, 9],
    nextAction: "Complete legal entity setup before branch, compliance, payroll, and user access inheritance expands.",
    validationFocus: "Company identity completeness, statutory baseline, and downstream policy inheritance.",
  },
  {
    route: ROUTES.PLATFORM_ROLES,
    label: "Roles & Access Control",
    domainKey: "security",
    owner: "Security Admin",
    stageSteps: [9, 10, 20],
    nextAction: "Finalize role matrix and access boundaries before workflow and production activation testing.",
    validationFocus: "Permission coverage, role separation, and role-based UAT readiness.",
  },
  {
    route: ROUTES.PLATFORM_PERMISSIONS,
    label: "Permissions Catalog",
    domainKey: "security",
    owner: "Security Admin",
    stageSteps: [9, 10, 20],
    nextAction: "Keep permission naming, module scope, and action coverage aligned before assigning live access.",
    validationFocus: "Access definition quality, module-action consistency, and role-safe permission governance.",
  },
  {
    route: ROUTES.PLATFORM_MODULE_MAPPING,
    label: "Module Mapping",
    domainKey: "platform-setup",
    owner: "Platform Admin",
    stageSteps: [1, 19, 20],
    nextAction: "Validate module navigation, route protection, and widget mapping before rollout reaches end users.",
    validationFocus: "Navigation correctness, route governance, and UI-schema consistency.",
  },
  {
    route: ROUTES.PLATFORM_RECYCLE_BIN,
    label: "Recycle Bin",
    domainKey: "document-compliance",
    owner: "Compliance Lead",
    stageSteps: [18, 20, 23],
    nextAction: "Keep deleted-record handling governed so restore and purge actions remain auditable after go-live.",
    validationFocus: "Recovery controls, purge traceability, and compliance-safe deletion handling.",
  },
];

export function getSetupPageContext(route: string) {
  return setupPageContexts.find((context) => context.route === route) ?? null;
}
