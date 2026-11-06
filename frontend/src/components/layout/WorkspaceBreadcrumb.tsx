"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useUiSchema } from "@/context/UiSchemaContext";
import {
  buildWorkspaceModules,
  findWorkspaceModuleByPath,
  findWorkspacePageByPath,
} from "@/lib/workspace/navigation";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { getEffectiveWorkspacePath } from "@/lib/workspace/url-lock";

/**
 * Common enterprise acronym expansion dictionary.
 * Prevents cryptic 3-letter abbreviations like "mss", "wms", "grn" from confusing developers/users.
 */
const ACRONYM_EXPANSIONS: Record<string, string> = {
  mss: "Manager Self-Service",
  mms: "Material Management System",
  ess: "Employee Self-Service",
  wms: "Warehouse Management System (WMS)",
  grn: "Goods Receipt Notes (GRN)",
  edi: "Electronic Data Interchange (EDI)",
  mfa: "Multi-Factor Authentication (MFA)",
  sso: "Single Sign-On (SSO)",
  crm: "Customer Relationship Management (CRM)",
  hrms: "Human Resource Management (HRMS)",
  rfq: "Request for Quotation (RFQ)",
  po: "Purchase Orders (PO)",
  pr: "Purchase Requests (PR)",
  pos: "Point of Sale (POS)",
  coa: "Chart of Accounts",
  dpdp: "Data Privacy & DPDP Vault",
  kpi: "Key Performance Indicators (KPI)",
  mvu: "Mobile Medical Units (MVU)",
  sla: "Service Level Agreements (SLA)",
  mis: "Management Information Systems (MIS)",
  faq: "Frequently Asked Questions (FAQ)",
  api: "Application Programming Interface (API)",
  erp: "Enterprise Resource Planning (ERP)",
};

/**
 * Canonical full page titles for direct routes that might otherwise render short or confusing slugs.
 */
const CANONICAL_PATH_TITLES: Record<string, { title: string; moduleLabel?: string }> = {
  "/mss": { title: "Manager Self-Service", moduleLabel: "HRMS" },
  "/manager-self-service": { title: "Manager Self-Service", moduleLabel: "HRMS" },
  "/ess": { title: "Employee Self-Service", moduleLabel: "HRMS" },
  "/employee-self-service": { title: "Employee Self-Service", moduleLabel: "HRMS" },
  "/approvals": { title: "Workflow Approvals Inbox", moduleLabel: "Workflow" },
  "/notifications": { title: "Notification Center", moduleLabel: "Communication" },
  "/profile": { title: "My Profile & Account", moduleLabel: "Administration" },
  "/documents": { title: "Document Vault", moduleLabel: "Administration" },
  "/inventory/wms": { title: "Warehouse Management & Bin Locations", moduleLabel: "Inventory" },
  "/procurement/grn": { title: "Goods Receipt Notes (GRN)", moduleLabel: "Procurement" },
  "/administration/edi": { title: "Electronic Data Interchange (EDI) Studio", moduleLabel: "Administration" },
  "/security/mfa": { title: "Multi-Factor Authentication (MFA)", moduleLabel: "Security" },
  "/security/sso": { title: "Single Sign-On (SSO)", moduleLabel: "Security" },
};

export function WorkspaceBreadcrumb({ className }: { className?: string }) {
  const rawPathname = usePathname() || "";
  const pathname = getEffectiveWorkspacePath(rawPathname);
  const { navigation: schemaNav, enabledModules } = useUiSchema();
  const modules = buildWorkspaceModules(schemaNav.modules, enabledModules);
  const page = findWorkspacePageByPath(modules, pathname);
  const matched = page?.module ?? findWorkspaceModuleByPath(modules, pathname);

  // Hide breadcrumb on the root dashboard page
  if (pathname === (ROUTES.DASHBOARD || "/dashboard") || pathname === "/") {
    return null;
  }

  const pathKey = pathname.toLowerCase();
  const canonicalOverride = CANONICAL_PATH_TITLES[pathKey];
  const lastSlug = pathname.split("/").filter(Boolean).at(-1)?.toLowerCase() || "";
  const acronymExpanded = ACRONYM_EXPANSIONS[lastSlug];

  // Resolve human-readable full title
  const fullPageTitle =
    canonicalOverride?.title ??
    page?.item.name ??
    acronymExpanded ??
    pathname
      .split("/")
      .filter(Boolean)
      .at(-1)
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  if (!fullPageTitle) return null;

  const displayModuleLabel = canonicalOverride?.moduleLabel ?? matched?.label;

  return (
    <div className={cn("flex items-center justify-between gap-2.5 pb-1", className)}>
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 py-1 select-none"
      >
        <Link
          href={ROUTES.DASHBOARD || "/dashboard"}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-slate-100"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>

        {displayModuleLabel ? (
          <>
            <ChevronRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              {displayModuleLabel}
            </span>
          </>
        ) : null}

        <ChevronRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
        <span className="max-w-[24rem] truncate font-semibold text-slate-900 dark:text-slate-100">
          {fullPageTitle}
        </span>
      </nav>
    </div>
  );
}

export default WorkspaceBreadcrumb;
