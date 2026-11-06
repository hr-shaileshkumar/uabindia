const normalizeRoleValue = (role: unknown): string => {
  if (typeof role !== "string") return "";
  return role.trim().toLowerCase().replace(/[\s-]+/g, "_");
};

const SUPER_ADMIN_ROLES = new Set([
  "super_admin",
  "superadmin",
  "system_admin",
  "systemadmin",
  "platform_owner",
  "software_owner",
]);

const ADMIN_ROLES = new Set([
  "admin",
  "administrator",
  "company_admin",
  "tenant_admin",
  "tenantadmin",
  "tenant_owner",
  "business_owner",
  "company_owner",
]);

export const normalizeRole = normalizeRoleValue;

export const getNormalizedRoleSet = (roles: Array<unknown> | null | undefined): Set<string> => {
  const normalized = new Set<string>();
  for (const role of roles || []) {
    const value = normalizeRoleValue(role);
    if (value) normalized.add(value);
  }
  return normalized;
};

export const isSuperAdminRole = (role: unknown): boolean => {
  return SUPER_ADMIN_ROLES.has(normalizeRoleValue(role));
};

export const isAdminRole = (role: unknown): boolean => {
  return ADMIN_ROLES.has(normalizeRoleValue(role));
};
