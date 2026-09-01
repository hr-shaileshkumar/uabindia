import type { ERPRole } from "@/lib/workspace/types";

export function normalizeRole(role: string | null | undefined): ERPRole {
  const normalized = (role || "").trim().toLowerCase().replace(/\s+/g, "_");
  if (normalized === "platform_owner" || normalized === "software_owner" || normalized === "systemadmin") return "super_admin";
  if (normalized === "super_admin") return "super_admin";
  if (normalized === "superadmin" || normalized === "tenant_owner" || normalized === "tenantowner" || normalized === "business_owner" || normalized === "businessowner" || normalized === "company_owner" || normalized === "companyowner") return "tenant_owner";
  if (normalized === "admin" || normalized === "tenantadmin" || normalized === "administrator") return "company_admin";
  if (normalized === "hr") return "hr";
  if (normalized === "manager") return "manager";
  return "employee";
}

export function getGuardScope(role: ERPRole) {
  if (role === "super_admin") return "platform_owner";
  if (role === "tenant_owner") return "business_owner";
  if (role === "employee") return "ess";
  return "business";
}
