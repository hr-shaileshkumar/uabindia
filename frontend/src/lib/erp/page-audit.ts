/**
 * Production UI audit matrix for protected ERP pages.
 * Status: polished | partial | stub
 * Type: hub | list | form | workflow | redirect
 */
export type PageAuditStatus = "polished" | "partial" | "stub";
export type PageAuditType = "hub" | "list" | "form" | "workflow" | "redirect";

export type PageAuditEntry = {
  route: string;
  type: PageAuditType;
  status: PageAuditStatus;
  notes?: string;
};

/** Canonical audit used by Phase 0 inventory and Phase 5 QA smoke. */
export const PAGE_AUDIT: PageAuditEntry[] = [
  // Cross-cutting
  { route: "/notifications", type: "workflow", status: "polished", notes: "User inbox" },
  { route: "/approvals", type: "workflow", status: "polished", notes: "Cross-module queue" },
  { route: "/documents", type: "list", status: "polished", notes: "Vault with upload" },
  { route: "/ess", type: "hub", status: "polished" },
  { route: "/mss", type: "workflow", status: "polished" },
  { route: "/dashboard", type: "hub", status: "polished" },
  { route: "/profile", type: "form", status: "polished" },

  // People
  { route: "/hrms", type: "hub", status: "polished" },
  { route: "/hrms/employees", type: "list", status: "polished" },
  { route: "/hrms/employees/new", type: "form", status: "polished" },
  { route: "/hrms/attendance", type: "list", status: "polished" },
  { route: "/hrms/leave", type: "list", status: "polished" },
  { route: "/hrms/shifts", type: "list", status: "polished" },
  { route: "/hrms/overtime", type: "list", status: "polished" },
  { route: "/hrms/recruitment", type: "list", status: "polished" },
  { route: "/hrms/onboarding", type: "list", status: "polished" },
  { route: "/hrms/offboarding", type: "list", status: "polished" },
  { route: "/hrms/probation", type: "list", status: "polished" },
  { route: "/hrms/performance", type: "list", status: "polished" },
  { route: "/hrms/training", type: "list", status: "polished" },
  { route: "/hrms/travel", type: "list", status: "polished" },
  { route: "/hrms/assets", type: "list", status: "polished" },
  { route: "/payroll", type: "hub", status: "polished" },
  { route: "/payroll/runs", type: "list", status: "polished" },
  { route: "/payroll/payslips", type: "list", status: "polished" },
  { route: "/payroll/structures", type: "list", status: "polished" },
  { route: "/payroll/final-settlement", type: "list", status: "polished" },

  // Commerce / finance
  { route: "/finance", type: "hub", status: "polished" },
  { route: "/invoices", type: "list", status: "polished" },
  { route: "/sales-orders", type: "list", status: "polished" },
  { route: "/purchase-orders", type: "list", status: "polished" },
  { route: "/grn", type: "list", status: "polished" },
  { route: "/items", type: "list", status: "polished" },
  { route: "/crm/leads", type: "list", status: "polished" },
  { route: "/journal-entries", type: "list", status: "polished" },
  { route: "/payments", type: "list", status: "polished" },
  { route: "/bank-reconciliation", type: "list", status: "polished" },
  { route: "/returns", type: "list", status: "polished" },

  // Ops / platform
  { route: "/projects", type: "hub", status: "polished" },
  { route: "/projects/tasks", type: "list", status: "polished" },
  { route: "/projects/timesheets", type: "list", status: "polished" },
  { route: "/helpdesk/tickets", type: "list", status: "polished" },
  { route: "/platform/users", type: "list", status: "polished" },
  { route: "/platform/companies", type: "list", status: "polished" },
  { route: "/platform/data-management", type: "hub", status: "polished" },
  { route: "/security/mfa", type: "list", status: "polished" },
  { route: "/security/password-policies", type: "form", status: "polished" },
  { route: "/integrations/api-keys", type: "list", status: "polished" },
  { route: "/integrations/apps", type: "list", status: "polished" },
  { route: "/communication/announcements", type: "list", status: "polished" },
  { route: "/reports/custom", type: "list", status: "polished" },
  { route: "/reports/builder", type: "form", status: "polished" },
  { route: "/ai", type: "hub", status: "polished" },

  // Non-product
  { route: "/healthcare", type: "redirect", status: "stub", notes: "No backend — redirect dashboard" },
  { route: "/fleet", type: "redirect", status: "stub", notes: "No backend — redirect dashboard" },
  { route: "/tours", type: "redirect", status: "stub", notes: "Alias → travel" },
];

export function listPagesByStatus(status: PageAuditStatus) {
  return PAGE_AUDIT.filter((entry) => entry.status === status);
}

export function getPageAudit(route: string) {
  return PAGE_AUDIT.find((entry) => entry.route === route);
}

/** Phase 5 smoke checklist — run manually after deploy. */
export const PRODUCTION_SMOKE_CHECKLIST = [
  "Login → /context → /dashboard",
  "Open Notifications inbox → mark one read → mark all read",
  "Open Approvals → filter Pending → view drawer",
  "Documents → upload → download → delete",
  "ESS → clock IN → apply leave → create ticket",
  "MSS → approve or reject a leave/workflow item",
  "HRMS employees → create/edit via form pages",
  "Performance → create cycle → open appraisals",
  "Onboarding/Offboarding → create task → complete",
  "Sales order / PO / Invoice → New drawer → save",
  "Projects hub → tasks → timesheets",
  "Helpdesk tickets → create",
  "AI Copilot → ask a question → clear chat",
  "Reports builder → save → run → activate → export JSON",
  "HRMS Travel → new request; Assets → new + allocate",
  "Permission denied path → /not-authorized",
] as const;
