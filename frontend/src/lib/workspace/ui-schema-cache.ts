export type UiSchemaCacheUser = {
  userId?: string;
  id?: string;
  tenantId?: string;
  companyId?: string;
  role?: string;
};

export const UI_SCHEMA_CACHE_PREFIX = "uiSchemaCache_v2";
export const LEGACY_UI_SCHEMA_CACHE_KEY = "uiSchemaCache_v1";

export const resolveUiSchemaCacheKey = (user: UiSchemaCacheUser | null) => {
  const userId = user?.userId || user?.id || "anonymous";
  const tenantId = user?.tenantId || "none";
  const companyId = user?.companyId || "none";
  const role = user?.role || "unknown";
  return `${UI_SCHEMA_CACHE_PREFIX}:${userId}:${tenantId}:${companyId}:${role}`;
};
