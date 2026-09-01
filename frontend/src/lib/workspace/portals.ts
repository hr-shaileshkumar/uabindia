import type { ERPGuardScope, ERPRole } from "@/lib/workspace/types";
import { getGuardScope } from "@/lib/workspace/access";

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

/** Shared light enterprise shell — matches public white + sapphire/teal */
const lightShellBase = {
  shellClassName: "bg-[#fafbfc] text-slate-900",
  sidebarClassName: "bg-white text-slate-900",
  sidebarBorderClassName: "border-slate-200",
  sidebarSectionClassName: "text-slate-500",
  sidebarInactiveClassName: "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
  sidebarIconInactiveClassName: "bg-slate-100 text-slate-500",
  topbarClassName: "border-slate-200 bg-white text-slate-900",
  sidebarTitleClassName: "text-slate-900",
  sidebarActiveClassName: "bg-blue-50 text-blue-700 font-semibold",
  sidebarIconActiveClassName: "bg-blue-100 text-blue-700",
  accentClassName: "text-blue-700",
  badgeClassName: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
} satisfies Omit<PortalTheme, "id" | "label" | "subtitle">;

const ownerTheme: PortalTheme = {
  ...lightShellBase,
  id: "platform_owner",
  label: "Software Owner Console",
  subtitle: "Platform governance, tenants, billing, and global health",
};

const businessOwnerTheme: PortalTheme = {
  ...lightShellBase,
  id: "business_owner",
  label: "Business Owner Portal",
  subtitle: "Company control, users, finance, HR, and operations",
};

const businessTheme: PortalTheme = {
  ...lightShellBase,
  id: "business",
  label: "Company Workspace",
  subtitle: "HR, payroll, finance, procurement, and daily operations",
};

const essTheme: PortalTheme = {
  ...lightShellBase,
  id: "ess",
  label: "Employee Self Service",
  subtitle: "Attendance, leave, payslips, documents, and support",
};

export function getPortalTheme(role: ERPRole): PortalTheme {
  const portalId = resolvePortalId(role);
  if (portalId === "platform_owner") return ownerTheme;
  if (portalId === "business_owner") return businessOwnerTheme;
  if (portalId === "ess") return essTheme;
  return businessTheme;
}
