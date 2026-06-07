"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";

const LABEL_MAP: Record<string, string> = {
  erp: "Workspace",
  hrms: "HR",
  payroll: "Payroll",
  reports: "Analytics & Reports",
  platform: "Admin",
  licensing: "Licensing",
  security: "Security",
  dashboard: "Dashboard",
  employees: "Employees",
  attendance: "Attendance",
  leave: "Leave",
  customers: "Customers",
  vendors: "Vendors",
  items: "Items",
  notifications: "Notifications",
  documents: "Documents",
  "chart-of-accounts": "Chart of accounts",
  "sales-orders": "Sales orders",
  "purchase-orders": "Purchase orders",
  "journal-entries": "Journal entries",
  "stock-movements": "Stock movements",
  "contact-submissions": "Contact submissions",
  "feature-flags": "Feature flags",
  "password-policies": "Password policies",
  audit: "Audit",
  logs: "Logs",
};

const toLabel = (segment: string): string => {
  const normalized = segment.toLowerCase();
  if (LABEL_MAP[normalized]) return LABEL_MAP[normalized];
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  type Crumb = { href: string; label: string; isLast: boolean };
  const crumbs: Crumb[] = [{ href: ROUTES.DASHBOARD, label: "Home", isLast: false }];

  if (segments[0] === "erp") {
    let acc = "";
    for (let i = 1; i < segments.length; i++) {
      acc += `/${segments[i]}`;
      crumbs.push({
        href: `/erp${acc}`,
        label: toLabel(segments[i]),
        isLast: false,
      });
    }
  } else {
    let acc = "";
    for (let i = 0; i < segments.length; i++) {
      acc += `/${segments[i]}`;
      crumbs.push({
        href: acc,
        label: toLabel(segments[i]),
        isLast: false,
      });
    }
  }

  if (crumbs.length <= 1) return null;

  crumbs[crumbs.length - 1].isLast = true;
  for (let i = 0; i < crumbs.length - 1; i++) {
    crumbs[i].isLast = false;
  }

  return (
    <nav aria-label="Breadcrumb" className="erp-breadcrumb-nav">
      {crumbs.map((crumb, index) => (
        <div key={`${crumb.href}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && (
            <span className="erp-breadcrumb-sep select-none" aria-hidden>
              /
            </span>
          )}
          {crumb.isLast ? (
            <span className="erp-breadcrumb-current">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="erp-breadcrumb-link"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
