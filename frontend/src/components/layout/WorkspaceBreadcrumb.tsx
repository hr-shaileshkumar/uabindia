"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronDown, Home } from "lucide-react";
import { useUiSchema } from "@/context/UiSchemaContext";
import {
  buildWorkspaceModules,
  findWorkspaceModuleByPath,
  findWorkspacePageByPath,
} from "@/lib/workspace/navigation";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, ref]);
}

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
  const pathname = usePathname() || "";
  const { navigation: schemaNav, enabledModules } = useUiSchema();
  const modules = buildWorkspaceModules(schemaNav.modules, enabledModules);
  const page = findWorkspacePageByPath(modules, pathname);
  const matched = page?.module ?? findWorkspaceModuleByPath(modules, pathname);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setDropdownOpen(false));

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
  const allModulePages = matched?.groups.flatMap((g) => g.items) || [];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 py-1 select-none",
        className
      )}
    >
      <Link
        href={ROUTES.DASHBOARD || "/dashboard"}
        className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-slate-100"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Home</span>
      </Link>

      <ChevronRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />

      {displayModuleLabel ? (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex max-w-[14rem] items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            title={`${displayModuleLabel} quick page menu`}
          >
            <span className="truncate">{displayModuleLabel}</span>
            {allModulePages.length > 1 && (
              <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
            )}
          </button>

          {dropdownOpen && allModulePages.length > 0 && (
            <div className="absolute left-0 top-7 z-50 max-h-80 w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {displayModuleLabel} Navigation
              </div>
              {matched?.groups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-0.5">
                  {group.label && matched.groups.length > 1 && (
                    <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold text-slate-400">
                      {group.label}
                    </div>
                  )}
                  {group.items.map((item) => {
                    const isCurrent = pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setDropdownOpen(false)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                          isCurrent
                            ? "bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            isCurrent ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                          )}
                        />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <ChevronRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
      <span className="max-w-[24rem] truncate font-semibold text-slate-900 dark:text-slate-100">
        {fullPageTitle}
      </span>
    </nav>
  );
}

export default WorkspaceBreadcrumb;
