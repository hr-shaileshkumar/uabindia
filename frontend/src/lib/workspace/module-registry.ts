export type WorkspaceTier = "platform" | "company" | "business" | "cross-cutting" | "planned";

export type ModuleDefinition = {
  key: string;
  label: string;
  eyebrow: string;
  description: string;
  icon: string;
  shellOrder: number;
  tier: WorkspaceTier;
  sourceModuleKey?: string;
  pathPrefixes?: string[];
  /** When true, module routes still work but it is NOT rendered in the sidebar top-level nav */
  hiddenFromSidebar?: boolean;
};


const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    key: "platform",
    label: "Administration",
    eyebrow: "Administration / Control Center",
    description: "Enterprise system administration, organization structure, identity, configuration, security, and governance.",
    icon: "sliders",
    shellOrder: 10,
    tier: "platform",
    pathPrefixes: ["/administration", "/platform"],
  },
  {
    key: "superadmin",
    label: "Super Admin",
    eyebrow: "Administration / Super Admin",
    description: "Global operator workspace for platform-wide oversight and escalation handling.",
    icon: "shield",
    shellOrder: 20,
    tier: "platform",
  },
  {
    key: "company",
    label: "Company Workspace",
    eyebrow: "Company / Workspace",
    description: "Company-level administration for branches, departments, designations, users, and settings.",
    icon: "building",
    shellOrder: 30,
    tier: "company",
    hiddenFromSidebar: true,
  },

  {
    key: "ai",
    label: "AI Copilot Engine",
    eyebrow: "AI / Copilot",
    description: "AI HR Copilot assistant for screening, attendance anomaly detection, and natural language analytics.",
    icon: "bot",
    shellOrder: 42,
    tier: "business",
  },
  {
    key: "documents",
    label: "Document Vault",
    eyebrow: "Documents / Vault",
    description: "Document templates, policy vault, employee ID card generators, and cryptographic digital signatures.",
    icon: "file-text",
    shellOrder: 43,
    tier: "business",
  },
  {
    key: "ess",
    label: "Employee Self-Service",
    eyebrow: "ESS / Portal",
    description: "Employee self-service portal for attendance, leave, payslips, and claims.",
    icon: "user",
    shellOrder: 45,
    tier: "business",
    pathPrefixes: ["/employee-self-service", "/ess"],
  },
  {
    key: "mss",
    label: "Manager Self-Service",
    eyebrow: "MSS / Portal",
    description: "Manager self-service portal for team attendance, approvals, and performance.",
    icon: "users",
    shellOrder: 46,
    tier: "business",
    pathPrefixes: ["/manager-self-service", "/mss"],
  },
  {
    key: "hrms",
    label: "HRMS",
    eyebrow: "HRMS / Workspace",
    description: "Employee operations, attendance, leave, recruitment, and people lifecycle workflows.",
    icon: "users",
    shellOrder: 50,
    tier: "business",
  },
  {
    key: "attendance",
    label: "Attendance",
    eyebrow: "HRMS / Attendance",
    description: "Attendance capture, regularization, shifts, rostering, and workforce time control.",
    icon: "clock",
    shellOrder: 60,
    tier: "business",
    sourceModuleKey: "hrms",
    pathPrefixes: ["/hrms/attendance", "/hrms/shifts", "/hrms/overtime"],
    hiddenFromSidebar: true,
  },
  {
    key: "leave",
    label: "Leave",
    eyebrow: "HRMS / Leave",
    description: "Leave policies, balances, requests, approvals, and employee absence workflows.",
    icon: "calendar",
    shellOrder: 70,
    tier: "business",
    sourceModuleKey: "hrms",
    pathPrefixes: ["/hrms/leave"],
    hiddenFromSidebar: true,
  },
  {
    key: "recruitment",
    label: "Recruitment",
    eyebrow: "HRMS / Recruitment",
    description: "Hiring pipelines, screening, interviews, and candidate lifecycle management.",
    icon: "search",
    shellOrder: 80,
    tier: "business",
    sourceModuleKey: "hrms",
    pathPrefixes: ["/hrms/recruitment", "/hrms/screening-schedule", "/hrms/screening-results"],
    hiddenFromSidebar: true,
  },
  {
    key: "payroll",
    label: "Payroll",
    eyebrow: "Payroll / Workspace",
    description: "Payroll processing, statutory setup, reimbursements, and employee payout workflows.",
    icon: "wallet",
    shellOrder: 90,
    tier: "business",
  },
  {
    key: "finance",
    label: "Finance",
    eyebrow: "Finance / Workspace",
    description: "Accounting, journals, payments, expenses, invoicing, tax, and reconciliation operations.",
    icon: "bank",
    shellOrder: 100,
    tier: "business",
    sourceModuleKey: "erp",
    pathPrefixes: [
      "/finance",
      "/chart-of-accounts",
      "/journal-entries",
      "/payments",
      "/invoices",
      "/expenses",
      "/tax-management",
      "/bank-reconciliation",
      "/accounting-periods",
      "/compliance",
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    eyebrow: "Inventory / Workspace",
    description: "Item masters, warehouses, stock movement, adjustments, and transfer control.",
    icon: "box",
    shellOrder: 110,
    tier: "business",
    sourceModuleKey: "erp",
    pathPrefixes: [
      "/inventory",
      "/items",
      "/warehouses",
      "/stock-movements",
      "/inventory-adjustments",
      "/inventory-transfers",
    ],
  },
  {
    key: "manufacturing",
    label: "Manufacturing",
    eyebrow: "Manufacturing / Workspace",
    description: "Production orders, assembly lines, shop floor tracking, and work order management.",
    icon: "factory",
    shellOrder: 115,
    tier: "business",
    sourceModuleKey: "erp",
    pathPrefixes: ["/manufacturing"],
  },
  {
    key: "procurement",
    label: "Procurement",
    eyebrow: "Procurement / Workspace",
    description: "Vendors, purchase requests, purchase orders, and goods receipt workflows.",
    icon: "shopping-cart",
    shellOrder: 120,
    tier: "business",
    sourceModuleKey: "erp",
    pathPrefixes: ["/procurement", "/vendors", "/purchase-requests", "/purchase-orders", "/grn", "/vendor-bills"],
  },
  {
    key: "crm",
    label: "CRM",
    eyebrow: "CRM / Workspace",
    description: "Lead funnels, customer interactions, quotations, and demand development workflows.",
    icon: "contact-round",
    shellOrder: 130,
    tier: "business",
    pathPrefixes: ["/crm"],
  },
  {
    key: "sales",
    label: "Sales",
    eyebrow: "Sales / Workspace",
    description: "Customers, quotations, sales orders, returns, and commercial execution flows.",
    icon: "shopping-bag",
    shellOrder: 140,
    tier: "business",
    sourceModuleKey: "erp",
    pathPrefixes: ["/sales", "/customers", "/crm/customers", "/quotations", "/discounts", "/sales-orders", "/returns", "/portal"],
  },
  {
    key: "projects",
    label: "Projects & Service",
    eyebrow: "Projects / Workspace",
    description: "Project masters, tasks, delivery governance, timesheets, field service, and asset depreciation.",
    icon: "kanban",
    shellOrder: 150,
    tier: "business",
    sourceModuleKey: "erp",
    pathPrefixes: ["/projects", "/platform/projects", "/field-service", "/assets/depreciation"],
  },
  {
    key: "assets",
    label: "Assets",
    eyebrow: "Assets / Workspace",
    description: "Asset master, assignment, maintenance, recovery, and lifecycle control.",
    icon: "monitor",
    shellOrder: 160,
    tier: "business",
    sourceModuleKey: "erp",
    pathPrefixes: ["/assets", "/hrms/assets"],
  },
  {
    key: "reports",
    label: "Reports",
    eyebrow: "Reports / Workspace",
    description: "Cross-module reporting for HR, payroll, compliance, finance, and leadership review.",
    icon: "bar-chart",
    shellOrder: 170,
    tier: "cross-cutting",
  },
  {
    key: "notifications",
    label: "Notifications",
    eyebrow: "My work / Inbox",
    description: "In-app notification inbox — read, mark all read, and review operational alerts.",
    icon: "bell",
    shellOrder: 47,
    tier: "cross-cutting",
    pathPrefixes: ["/notifications"],
  },
  {
    key: "workflow",
    label: "Approvals",
    eyebrow: "My work / Approvals",
    description: "Cross-module approval queue — approve or reject pending workflow requests.",
    icon: "git-branch",
    shellOrder: 48,
    tier: "cross-cutting",
    pathPrefixes: ["/approvals", "/platform/workflow-config"],
  },
  {
    key: "helpdesk",
    label: "Helpdesk",
    eyebrow: "Administration / Helpdesk",
    description: "Support intake, escalations, SLA visibility, and service knowledge workflows.",
    icon: "ticket",
    shellOrder: 200,
    tier: "cross-cutting",
    sourceModuleKey: "erp",
    pathPrefixes: ["/helpdesk"],
  },
  {
    key: "communication",
    label: "Communication",
    eyebrow: "Administration / Communication",
    description: "Announcements and reusable message templates for internal or external outreach.",
    icon: "megaphone",
    shellOrder: 210,
    tier: "cross-cutting",
    sourceModuleKey: "erp",
    pathPrefixes: ["/communication"],
  },
  {
    key: "integrations",
    label: "Integrations",
    eyebrow: "Administration / Integrations",
    description: "API keys, webhooks, connected apps, and diagnostics for external systems.",
    icon: "plug",
    shellOrder: 220,
    tier: "cross-cutting",
    sourceModuleKey: "erp",
    pathPrefixes: ["/integrations"],
  },
  {
    key: "licensing",
    label: "Licensing",
    eyebrow: "Platform / Licensing",
    description: "Subscription plans, billing visibility, module packaging, and commercial controls.",
    icon: "layers",
    shellOrder: 230,
    tier: "planned",
    hiddenFromSidebar: true,
  },
  {
    key: "security",
    label: "Security",
    eyebrow: "Platform / Security",
    description: "Sessions, MFA, SSO, devices, access logs, password policy, and network controls.",
    icon: "shield",
    shellOrder: 240,
    tier: "platform",
  },
  {
    key: "settings",
    label: "Settings",
    eyebrow: "Administration / Settings",
    description: "Company settings, module settings, templates, numbering, and configuration controls.",
    icon: "settings-2",
    shellOrder: 250,
    tier: "cross-cutting",
  },
];

const MODULE_REGISTRY_BY_KEY = new Map(
  MODULE_REGISTRY.map((definition) => [definition.key, definition])
);

export function getModuleDefinition(key: string) {
  return MODULE_REGISTRY_BY_KEY.get(key);
}

export function getModuleLabel(key: string, fallback?: string) {
  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }
  return getModuleDefinition(key)?.label || key;
}

export function getModuleEyebrow(key: string, fallback = "Workspace / Module") {
  return getModuleDefinition(key)?.eyebrow || fallback;
}

export function getModuleDescription(key: string, fallback?: string) {
  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }
  return getModuleDefinition(key)?.description || fallback;
}

export function getModuleIcon(key: string, fallback?: string | null) {
  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }
  return getModuleDefinition(key)?.icon || undefined;
}

export function getModuleShellOrder(key: string, fallback?: number) {
  if (typeof fallback === "number" && !isNaN(fallback)) {
    return fallback;
  }
  return getModuleDefinition(key)?.shellOrder ?? Number.MAX_SAFE_INTEGER;
}

export function listDerivedModules(sourceModuleKey: string) {
  return MODULE_REGISTRY.filter(
    (definition) =>
      definition.sourceModuleKey === sourceModuleKey &&
      Array.isArray(definition.pathPrefixes) &&
      definition.pathPrefixes.length > 0
  );
}

export function listModuleRegistry() {
  return MODULE_REGISTRY.slice();
}

/** Returns only modules that should appear in the sidebar top-level nav (excludes hiddenFromSidebar) */
export function listSidebarVisibleModuleRegistry() {
  return MODULE_REGISTRY.filter((d) => !d.hiddenFromSidebar);
}
