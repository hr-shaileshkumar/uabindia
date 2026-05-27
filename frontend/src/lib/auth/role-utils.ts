export const normalizeRole = (role: unknown): string => {
  if (typeof role !== "string") return "";
  return role.trim().replace(/\s+/g, "").toLowerCase();
};

export const getNormalizedRoleSet = (roles: Array<unknown> | null | undefined): Set<string> => {
  const normalized = new Set<string>();
  for (const role of roles || []) {
    const value = normalizeRole(role);
    if (value) normalized.add(value);
  }
  return normalized;
};

export const isSuperAdminRole = (role: unknown): boolean => {
  const normalized = normalizeRole(role);
  return normalized === "superadmin" || normalized === "systemadmin";
};

export const isAdminRole = (role: unknown): boolean => {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "tenantadmin" || normalized === "administrator";
};
