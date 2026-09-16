import { ROUTES } from "@/constants/routes";

export const AUTH_PATH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/otp-verification",
] as const;

export const OWNER_PATH_PREFIXES = [
  "/administration",
  "/platform",
  "/superadmin",
] as const;

export const BUSINESS_PATH_PREFIXES = [
  "/erp",
  "/dashboard",
  "/administration",
  "/ai",
  "/compliance",
  "/employee-self-service",
  "/ess",
  "/fleet",
  "/finance",
  "/grn",
  "/healthcare",
  "/inventory",
  "/manager-self-service",
  "/mss",
  "/performance",
  "/profile",
  "/projects",
  "/procurement",
  "/purchase-requests",
  "/quotations",
  "/discounts",
  "/recruitment",
  "/returns",
  "/crm",
  "/sales",
  "/hrms",
  "/payroll",
  "/reports",
  "/tours",
  "/travel",
  "/notifications",
  "/documents",
  "/customers",
  "/vendors",
  "/items",
  "/sales-orders",
  "/purchase-orders",
  "/chart-of-accounts",
  "/journal-entries",
  "/payments",
  "/invoices",
  "/vendor-bills",
  "/expenses",
  "/tax-management",
  "/bank-reconciliation",
  "/accounting-periods",
  "/warehouses",
  "/stock-movements",
  "/inventory-adjustments",
  "/inventory-transfers",
  "/approvals",
  "/helpdesk",
  "/assets",
  "/communication",
  "/integrations",
  "/licensing",
  "/security",
] as const;

export const PUBLIC_PATH_PREFIXES = [
  "/",
  "/products",
  "/industries",
  "/pricing",
  "/book-demo",
  "/contact",
  "/about",
  "/careers",
  "/resources",
  "/help-support",
  "/privacy",
  "/terms",
  "/tenant-not-found",
  "/not-authorized",
] as const;

const LEGACY_ALIAS_PREFIX: Record<string, string> = {
  "/dashboard": ROUTES.DASHBOARD,
  "/mss": ROUTES.MANAGER_SELF_SERVICE,
  "/ess": ROUTES.EMPLOYEE_SELF_SERVICE,
  "/administration/edi": ROUTES.ADMINISTRATION_ELECTRONIC_DATA_INTERCHANGE,
  "/inventory/wms": ROUTES.INVENTORY_WAREHOUSE_MANAGEMENT,
  "/procurement/grn": ROUTES.PROCUREMENT_GOODS_RECEIPT_NOTES,
  "/security/mfa": ROUTES.SECURITY_MULTI_FACTOR_AUTHENTICATION,
  "/security/sso": ROUTES.SECURITY_SINGLE_SIGN_ON,
  "/hrms/departments": ROUTES.PLATFORM_DEPARTMENTS,
  "/hrms/designations": ROUTES.PLATFORM_DESIGNATIONS,
  "/recruitment": ROUTES.RECRUITMENT,
  "/performance": ROUTES.PERFORMANCE,
  "/travel": ROUTES.TRAVEL,
  "/tours": ROUTES.TRAVEL,
  "/fleet": ROUTES.DASHBOARD,
  "/healthcare": ROUTES.DASHBOARD,
  "/projects": ROUTES.PLATFORM_PROJECTS,
  "/security/sessions": "/platform/security/sessions",
  "/security/devices": "/platform/security/sessions",
  "/hrms": ROUTES.HRMS_HOME,
  "/payroll": ROUTES.PAYROLL_HOME,
  "/reports": ROUTES.REPORTS_HOME,
  "/notifications": ROUTES.ADMINISTRATION_NOTIFICATIONS,
  "/documents": ROUTES.DOCUMENTS,
  "/customers": ROUTES.CUSTOMERS,
  "/administration/documents": ROUTES.DOCUMENTS,
  "/vendors": ROUTES.VENDORS,
  "/items": ROUTES.ITEMS,
  "/sales-orders": ROUTES.SALES_ORDERS,
  "/purchase-orders": ROUTES.PURCHASE_ORDERS,
  "/chart-of-accounts": ROUTES.CHART_OF_ACCOUNTS,
  "/journal-entries": ROUTES.JOURNAL_ENTRIES,
  "/payments": ROUTES.PAYMENTS,
  "/invoices": ROUTES.INVOICES,
  "/expenses": ROUTES.EXPENSES,
  "/tax-management": ROUTES.TAX_MANAGEMENT,
  "/bank-reconciliation": ROUTES.BANK_RECONCILIATION,
  "/warehouses": ROUTES.WAREHOUSES,
  "/stock-movements": ROUTES.STOCK_MOVEMENTS,
  "/inventory-adjustments": ROUTES.INVENTORY_ADJUSTMENTS,
  "/inventory-transfers": ROUTES.INVENTORY_TRANSFERS,
  "/approvals": ROUTES.ADMINISTRATION_APPROVALS,
  "/assets": ROUTES.HR_ASSETS,
  "/helpdesk": ROUTES.HELPDESK_HOME,
  "/communication": ROUTES.COMMUNICATION_HOME,
  "/integrations": ROUTES.INTEGRATIONS_HOME,
  "/licensing": ROUTES.LICENSING_HOME,
  "/security": ROUTES.SECURITY_HOME,
};

export function normalizePathname(pathname: string) {
  const stripped = pathname.split("?")[0].split("#")[0];
  if (!stripped || stripped === "/") return "/";
  return stripped.replace(/\/+$/, "") || "/";
}

export function matchesAnyPrefix(pathname: string, prefixes: readonly string[]) {
  const normalized = normalizePathname(pathname);
  return prefixes.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

export function canonicalizeProtectedPath(pathname: string) {
  const normalized = normalizePathname(pathname);
  if (normalized === "/" || normalized === "/context") return normalized;

  if (normalized === "/platform" || normalized.startsWith("/platform/")) {
    const suffix = normalized.slice("/platform".length);
    return normalizePathname(`/administration${suffix}`);
  }

  if (matchesAnyPrefix(normalized, OWNER_PATH_PREFIXES)) return normalized;

  if (normalized === "/erp") {
    return ROUTES.DASHBOARD;
  }

  if (normalized.startsWith("/erp/")) {
    const legacyPath = normalized.slice("/erp".length);

    if (legacyPath === "/dashboard") return ROUTES.DASHBOARD;
    return normalizePathname(legacyPath);
  }

  for (const [legacyPrefix, canonicalPrefix] of Object.entries(LEGACY_ALIAS_PREFIX)) {
    if (normalized === legacyPrefix || normalized.startsWith(`${legacyPrefix}/`)) {
      const suffix = normalized.slice(legacyPrefix.length);
      return normalizePathname(`${canonicalPrefix}${suffix}`);
    }
  }

  return normalized;
}

export function getRoleDefaultPath(roleOrRoles?: string | string[], isSuperAdmin?: boolean): string {
  if (isSuperAdmin) {
    return ROUTES.DASHBOARD; // "/dashboard" (Unified Dashboard with SuperAdmin view)
  }

  const roleList = Array.isArray(roleOrRoles)
    ? roleOrRoles
    : typeof roleOrRoles === "string"
    ? [roleOrRoles]
    : [];

  const normalizedRoles = roleList.map((r) => r.toLowerCase().trim());
  const isSuper = normalizedRoles.some(
    (r) => r.includes("superadmin") || r.includes("super_admin") || r.includes("platform_owner")
  );

  if (isSuper) {
    return ROUTES.DASHBOARD; // "/dashboard"
  }

  const isAdmin = normalizedRoles.some(
    (r) => r.includes("admin") || r.includes("manager") || r.includes("hr") || r.includes("accountant")
  );

  if (isAdmin) {
    return ROUTES.DASHBOARD; // "/dashboard" (Executive Tenant Dashboard)
  }

  // Other users (Standard Employees / ESS Users)
  return ROUTES.DASHBOARD; // "/dashboard" (Employee ESS Dashboard)
}

export function getDefaultAppPath(roleOrRoles?: string | string[], isSuperAdmin?: boolean) {
  if (roleOrRoles || isSuperAdmin !== undefined) {
    return getRoleDefaultPath(roleOrRoles, isSuperAdmin);
  }
  return ROUTES.DASHBOARD;
}

