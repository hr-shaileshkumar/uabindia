import { ROUTES } from "@/constants/routes";
import {
  FALLBACK_PAGE_DEFINITIONS,
  type ModuleKey,
} from "@/config/fallback-module-registry";

export type RoutePermissionRule = {
  path: string;
  moduleKey: ModuleKey;
  permissions: string[];
};

const normalizePath = (path: string) => {
  const stripped = path.split("?")[0].split("#")[0];
  if (!stripped || stripped === "/") return "/";
  return stripped.replace(/\/+$/, "") || "/";
};

const LEGACY_ALIAS_PREFIX: Record<string, string> = {
  "/dashboard": ROUTES.DASHBOARD,
  "/hrms": ROUTES.HRMS_HOME,
  "/payroll": ROUTES.PAYROLL_HOME,
  "/reports": ROUTES.REPORTS_HOME,
  "/notifications": ROUTES.NOTIFICATIONS,
  "/documents": ROUTES.DOCUMENTS,
  "/customers": ROUTES.CUSTOMERS,
  "/vendors": ROUTES.VENDORS,
  "/items": ROUTES.ITEMS,
  "/sales-orders": ROUTES.SALES_ORDERS,
  "/purchase-orders": ROUTES.PURCHASE_ORDERS,
  "/chart-of-accounts": ROUTES.CHART_OF_ACCOUNTS,
  "/journal-entries": ROUTES.JOURNAL_ENTRIES,
  "/payments": ROUTES.PAYMENTS,
  "/warehouses": ROUTES.WAREHOUSES,
  "/stock-movements": ROUTES.STOCK_MOVEMENTS,
  "/approvals": ROUTES.APPROVALS,
  "/licensing": ROUTES.LICENSING_HOME,
  "/security": ROUTES.SECURITY_HOME,
};

export const canonicalizeProtectedPath = (path: string) => {
  const normalized = normalizePath(path);
  if (normalized === "/" || normalized === "/context") return normalized;
  if (normalized.startsWith("/erp/") || normalized.startsWith("/platform")) return normalized;

  for (const [legacyPrefix, canonicalPrefix] of Object.entries(LEGACY_ALIAS_PREFIX)) {
    if (normalized === legacyPrefix || normalized.startsWith(`${legacyPrefix}/`)) {
      const suffix = normalized.slice(legacyPrefix.length);
      return normalizePath(`${canonicalPrefix}${suffix}`);
    }
  }

  return normalized;
};

export const ROUTE_PERMISSION_MATRIX: RoutePermissionRule[] = FALLBACK_PAGE_DEFINITIONS.map((page) => ({
  path: page.path,
  moduleKey: page.moduleKey,
  permissions: page.permissions,
}));

const toFeatureKey = (path: string) =>
  path
    .replace(/^\/+/, "")
    .replace(/\/+/g, ".")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();

export const getRoutePermissionRule = (path: string): RoutePermissionRule | undefined => {
  const normalized = canonicalizeProtectedPath(path);
  let bestMatch: RoutePermissionRule | undefined;

  for (const rule of ROUTE_PERMISSION_MATRIX) {
    const rulePath = normalizePath(rule.path);
    const exact = normalized === rulePath;
    const nested = normalized.startsWith(`${rulePath}/`);
    if (!exact && !nested) continue;

    if (!bestMatch || rulePath.length > bestMatch.path.length) {
      bestMatch = rule;
    }
  }

  return bestMatch;
};

export const getRoutePermissionKeys = (path: string, moduleKeyFallback?: ModuleKey | null): string[] => {
  const canonicalPath = canonicalizeProtectedPath(path);
  const rule = getRoutePermissionRule(canonicalPath);
  const moduleKey = rule?.moduleKey ?? moduleKeyFallback;
  const normalizedPath = toFeatureKey(canonicalPath);

  const keys: string[] = [
    ...(rule?.permissions ?? []),
    `page:${normalizedPath}`,
    `path:${normalizedPath}`,
    normalizedPath,
    `resource:${normalizedPath}.view`,
  ];

  if (moduleKey) {
    keys.push(
      `module:${moduleKey}`,
      `${moduleKey}.*`,
      `${moduleKey}.view`,
      `resource:${moduleKey}.view`
    );
  }

  return [...new Set(keys)];
};

export const getFirstAccessibleRoute = (hasPermissionFn: (keys: string[]) => boolean): string | null => {
  for (const rule of ROUTE_PERMISSION_MATRIX) {
    const keys = getRoutePermissionKeys(rule.path, rule.moduleKey);
    if (hasPermissionFn(keys)) {
      return rule.path;
    }
  }

  return null;
};

export type { ModuleKey };
