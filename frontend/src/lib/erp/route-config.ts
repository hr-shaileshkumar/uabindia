import { ROUTES } from "@/constants/routes";

export const AUTH_PATH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/otp-verification",
] as const;

export const OWNER_PATH_PREFIXES = [
  "/platform",
] as const;

export const BUSINESS_PATH_PREFIXES = [
  "/erp",
  "/dashboard",
  "/hrms",
  "/payroll",
  "/reports",
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
  "/expenses",
  "/tax-management",
  "/bank-reconciliation",
  "/warehouses",
  "/stock-movements",
  "/inventory-adjustments",
  "/inventory-transfers",
  "/approvals",
  "/helpdesk",
  "/communication",
  "/integrations",
  "/licensing",
  "/security",
] as const;

export const PUBLIC_PATH_PREFIXES = [
  "/",
  "/contact",
  "/about",
  "/careers",
  "/tenant-not-found",
  "/not-authorized",
] as const;

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
  "/invoices": ROUTES.INVOICES,
  "/expenses": ROUTES.EXPENSES,
  "/tax-management": ROUTES.TAX_MANAGEMENT,
  "/bank-reconciliation": ROUTES.BANK_RECONCILIATION,
  "/warehouses": ROUTES.WAREHOUSES,
  "/stock-movements": ROUTES.STOCK_MOVEMENTS,
  "/inventory-adjustments": ROUTES.INVENTORY_ADJUSTMENTS,
  "/inventory-transfers": ROUTES.INVENTORY_TRANSFERS,
  "/approvals": ROUTES.APPROVALS,
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
  if (normalized.startsWith("/erp/") || matchesAnyPrefix(normalized, OWNER_PATH_PREFIXES)) return normalized;

  for (const [legacyPrefix, canonicalPrefix] of Object.entries(LEGACY_ALIAS_PREFIX)) {
    if (normalized === legacyPrefix || normalized.startsWith(`${legacyPrefix}/`)) {
      const suffix = normalized.slice(legacyPrefix.length);
      return normalizePathname(`${canonicalPrefix}${suffix}`);
    }
  }

  return normalized;
}

export function getDefaultAppPath() {
  return ROUTES.CONTEXT;
}
