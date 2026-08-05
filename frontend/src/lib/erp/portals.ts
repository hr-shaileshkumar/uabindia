import type { ERPGuardScope, ERPRole } from "@/lib/erp/types";
import { getGuardScope } from "@/lib/erp/access";

export type PortalId = ERPGuardScope;

export type PortalTheme = {
  id: PortalId;
  label: string;
  subtitle: string;
  shellClassName: string;
  sidebarClassName: string;
  sidebarBorderClassName: string;
  sidebarTitleClassName: string;
  sidebarSectionClassName: string;
  sidebarActiveClassName: string;
  sidebarInactiveClassName: string;
  sidebarIconActiveClassName: string;
  sidebarIconInactiveClassName: string;
  topbarClassName: string;
  accentClassName: string;
  badgeClassName: string;
};

export function resolvePortalId(role: ERPRole): PortalId {
  return getGuardScope(role);
}

const lightShellBase = {
  shellClassName: "bg-[var(--erp-canvas)] text-slate-900 dark:text-slate-100",
  sidebarClassName: "bg-[#0b0f19] text-slate-200",
  sidebarBorderClassName: "border-slate-800",
  sidebarSectionClassName: "text-slate-400",
  sidebarInactiveClassName: "text-slate-400 hover:bg-white/5 hover:text-white",
  sidebarIconInactiveClassName: "bg-white/5 text-slate-400",
  topbarClassName: "border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100",
} satisfies Omit<
  PortalTheme,
  | "id"
  | "label"
  | "subtitle"
  | "sidebarTitleClassName"
  | "sidebarActiveClassName"
  | "sidebarIconActiveClassName"
  | "accentClassName"
  | "badgeClassName"
>;

const ownerTheme: PortalTheme = {
  ...lightShellBase,
  id: "platform_owner",
  label: "Software Owner Console",
  subtitle: "Platform governance, tenants, billing, and global health",
  sidebarTitleClassName: "text-violet-400",
  sidebarActiveClassName: "bg-violet-500/15 text-white ring-1 ring-violet-500/30",
  sidebarIconActiveClassName: "bg-violet-500/25 text-violet-300 shadow-sm",
  accentClassName: "text-violet-600 dark:text-violet-400",
  badgeClassName: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-900/50",
};

const businessOwnerTheme: PortalTheme = {
  ...lightShellBase,
  id: "business_owner",
  label: "Business Owner Portal",
  subtitle: "Company control, users, finance, HR, and operations",
  sidebarTitleClassName: "text-indigo-400",
  sidebarActiveClassName: "bg-indigo-500/15 text-white ring-1 ring-indigo-500/30",
  sidebarIconActiveClassName: "bg-indigo-500/25 text-indigo-300 shadow-sm",
  accentClassName: "text-indigo-600 dark:text-indigo-400",
  badgeClassName: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-900/50",
};

const businessTheme: PortalTheme = {
  ...lightShellBase,
  id: "business",
  label: "Company Workspace",
  subtitle: "HR, payroll, finance, procurement, and daily operations",
  sidebarTitleClassName: "text-indigo-400",
  sidebarActiveClassName: "bg-indigo-500/15 text-white ring-1 ring-indigo-500/30",
  sidebarIconActiveClassName: "bg-indigo-500/25 text-indigo-300 shadow-sm",
  accentClassName: "text-indigo-600 dark:text-indigo-400",
  badgeClassName: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700",
};

const essTheme: PortalTheme = {
  ...lightShellBase,
  id: "ess",
  label: "Employee Self Service",
  subtitle: "Attendance, leave, payslips, documents, and support",
  sidebarTitleClassName: "text-sky-400",
  sidebarActiveClassName: "bg-sky-500/15 text-white ring-1 ring-sky-500/30",
  sidebarIconActiveClassName: "bg-sky-500/25 text-sky-300 shadow-sm",
  accentClassName: "text-sky-600 dark:text-sky-400",
  badgeClassName: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 ring-1 ring-sky-200 dark:ring-sky-900/50",
};

export function getPortalTheme(role: ERPRole): PortalTheme {
  const portalId = resolvePortalId(role);
  if (portalId === "platform_owner") return ownerTheme;
  if (portalId === "business_owner") return businessOwnerTheme;
  if (portalId === "ess") return essTheme;
  return businessTheme;
}
