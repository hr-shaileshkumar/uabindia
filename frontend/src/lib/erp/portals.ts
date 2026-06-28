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

const ownerTheme: PortalTheme = {
  id: "platform_owner",
  label: "Software Owner Console",
  subtitle: "Platform governance, tenants, billing, and global health",
  shellClassName: "bg-[#0b1220] text-slate-100",
  sidebarClassName: "bg-[#0b1220] text-slate-100",
  sidebarBorderClassName: "border-violet-900/40",
  sidebarTitleClassName: "text-violet-300",
  sidebarSectionClassName: "text-violet-400/70",
  sidebarActiveClassName: "bg-violet-500/15 text-violet-100 ring-1 ring-violet-500/30",
  sidebarInactiveClassName: "text-slate-400 hover:bg-white/5 hover:text-white",
  sidebarIconActiveClassName: "bg-violet-500/20 text-violet-200",
  sidebarIconInactiveClassName: "bg-white/5 text-slate-400",
  topbarClassName: "border-violet-900/30 bg-[#0f172a]/95 text-slate-100",
  accentClassName: "text-violet-300",
  badgeClassName: "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/30",
};

const businessOwnerTheme: PortalTheme = {
  id: "business_owner",
  label: "Business Owner Portal",
  subtitle: "Company control, users, finance, HR, and operations",
  shellClassName: "bg-slate-100 text-slate-950",
  sidebarClassName: "bg-[#0c3f5c] text-white",
  sidebarBorderClassName: "border-[#145a7d]",
  sidebarTitleClassName: "text-sky-200",
  sidebarSectionClassName: "text-sky-300/70",
  sidebarActiveClassName: "bg-white/12 text-white ring-1 ring-white/15",
  sidebarInactiveClassName: "text-sky-100/75 hover:bg-white/8 hover:text-white",
  sidebarIconActiveClassName: "bg-white text-[#0c3f5c]",
  sidebarIconInactiveClassName: "bg-white/10 text-sky-100",
  topbarClassName: "border-slate-200 bg-white/95 text-slate-950",
  accentClassName: "text-[#0c3f5c]",
  badgeClassName: "bg-sky-100 text-sky-900 ring-1 ring-sky-200",
};

const businessTheme: PortalTheme = {
  id: "business",
  label: "Company Workspace",
  subtitle: "HR, payroll, finance, procurement, and daily operations",
  shellClassName: "bg-slate-100 text-slate-950",
  sidebarClassName: "bg-white text-slate-900",
  sidebarBorderClassName: "border-slate-200",
  sidebarTitleClassName: "text-sky-700",
  sidebarSectionClassName: "text-slate-400",
  sidebarActiveClassName: "bg-sky-50 text-sky-900 ring-1 ring-sky-100",
  sidebarInactiveClassName: "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
  sidebarIconActiveClassName: "bg-white text-sky-700",
  sidebarIconInactiveClassName: "bg-slate-100 text-slate-500",
  topbarClassName: "border-slate-200 bg-white/95 text-slate-950",
  accentClassName: "text-sky-700",
  badgeClassName: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
};

const essTheme: PortalTheme = {
  id: "ess",
  label: "Employee Self Service",
  subtitle: "Attendance, leave, payslips, documents, and support",
  shellClassName: "bg-[#f3fbf6] text-slate-950",
  sidebarClassName: "bg-[#0f5f46] text-white",
  sidebarBorderClassName: "border-emerald-800",
  sidebarTitleClassName: "text-emerald-200",
  sidebarSectionClassName: "text-emerald-300/70",
  sidebarActiveClassName: "bg-white/12 text-white ring-1 ring-white/15",
  sidebarInactiveClassName: "text-emerald-100/80 hover:bg-white/8 hover:text-white",
  sidebarIconActiveClassName: "bg-white text-emerald-800",
  sidebarIconInactiveClassName: "bg-white/10 text-emerald-100",
  topbarClassName: "border-emerald-100 bg-white/95 text-slate-950",
  accentClassName: "text-emerald-700",
  badgeClassName: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200",
};

export function getPortalTheme(role: ERPRole): PortalTheme {
  const portalId = resolvePortalId(role);
  if (portalId === "platform_owner") return ownerTheme;
  if (portalId === "business_owner") return businessOwnerTheme;
  if (portalId === "ess") return essTheme;
  return businessTheme;
}
