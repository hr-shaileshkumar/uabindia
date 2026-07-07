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
  shellClassName: "bg-[var(--erp-canvas)] text-slate-950",
  sidebarClassName: "bg-white/92 text-slate-900",
  sidebarBorderClassName: "border-slate-200/80",
  sidebarSectionClassName: "text-slate-400",
  sidebarInactiveClassName: "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
  sidebarIconInactiveClassName: "bg-slate-100 text-slate-500",
  topbarClassName: "border-slate-200/80 bg-white/90 text-slate-950",
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
  sidebarTitleClassName: "text-indigo-700",
  sidebarActiveClassName: "bg-indigo-50 text-indigo-900 ring-1 ring-indigo-100",
  sidebarIconActiveClassName: "bg-white text-indigo-700 shadow-sm",
  accentClassName: "text-indigo-700",
  badgeClassName: "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-100",
};

const businessOwnerTheme: PortalTheme = {
  ...lightShellBase,
  id: "business_owner",
  label: "Business Owner Portal",
  subtitle: "Company control, users, finance, HR, and operations",
  sidebarTitleClassName: "text-blue-700",
  sidebarActiveClassName: "bg-blue-50 text-blue-900 ring-1 ring-blue-100",
  sidebarIconActiveClassName: "bg-white text-blue-700 shadow-sm",
  accentClassName: "text-blue-700",
  badgeClassName: "bg-blue-50 text-blue-800 ring-1 ring-blue-100",
};

const businessTheme: PortalTheme = {
  ...lightShellBase,
  id: "business",
  label: "Company Workspace",
  subtitle: "HR, payroll, finance, procurement, and daily operations",
  sidebarTitleClassName: "text-sky-700",
  sidebarActiveClassName: "bg-sky-50 text-sky-900 ring-1 ring-sky-100",
  sidebarIconActiveClassName: "bg-white text-sky-700 shadow-sm",
  accentClassName: "text-sky-700",
  badgeClassName: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
};

const essTheme: PortalTheme = {
  ...lightShellBase,
  id: "ess",
  label: "Employee Self Service",
  subtitle: "Attendance, leave, payslips, documents, and support",
  sidebarTitleClassName: "text-cyan-700",
  sidebarActiveClassName: "bg-cyan-50 text-cyan-900 ring-1 ring-cyan-100",
  sidebarIconActiveClassName: "bg-white text-cyan-700 shadow-sm",
  accentClassName: "text-cyan-700",
  badgeClassName: "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-100",
};

export function getPortalTheme(role: ERPRole): PortalTheme {
  const portalId = resolvePortalId(role);
  if (portalId === "platform_owner") return ownerTheme;
  if (portalId === "business_owner") return businessOwnerTheme;
  if (portalId === "ess") return essTheme;
  return businessTheme;
}
