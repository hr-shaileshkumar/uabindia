import {
  FALLBACK_PAGE_DEFINITIONS,
  type ModuleKey,
} from "@/config/fallback-module-registry";

export type SubModuleLink = {
  key: string;
  name: string;
  path: string;
  icon?: string;
  group?: string;
  order?: number;
};

type IndexedSubModuleLink = SubModuleLink & {
  order: number;
};

const MODULE_KEY_ALIASES: Record<string, string> = {
  erp: "operations",
  operations: "operations",
  workspace: "operations",
  ops: "operations",
  finance: "erp_finance",
  erpfinance: "erp_finance",
  "erp-finance": "erp_finance",
  procurement: "erp_procurement",
  erpprocurement: "erp_procurement",
  "erp-procurement": "erp_procurement",
  sales: "erp_sales",
  crm: "erp_sales",
  salescrm: "erp_sales",
  sales_crm: "erp_sales",
  "sales-crm": "erp_sales",
  erpsales: "erp_sales",
  "erp-sales": "erp_sales",
  inventory: "erp_inventory",
  erpinventory: "erp_inventory",
  "erp-inventory": "erp_inventory",
  admin: "platform",
  adminconsole: "platform",
  admin_console: "platform",
  "admin-console": "platform",
};

const moduleMap = FALLBACK_PAGE_DEFINITIONS.reduce<Record<string, IndexedSubModuleLink[]>>((acc, page, index) => {
  if (!acc[page.moduleKey]) {
    acc[page.moduleKey] = [];
  }

  acc[page.moduleKey].push({
    key: page.key,
    name: page.name,
    path: page.path,
    icon: page.icon,
    group: page.group,
    order: index,
  });

  return acc;
}, {});

Object.keys(moduleMap).forEach((moduleKey) => {
  moduleMap[moduleKey] = moduleMap[moduleKey].sort((left, right) => {
    const explicit = (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER);
    if (explicit !== 0) return explicit;

    const leftGroup = left.group ?? "Pages";
    const rightGroup = right.group ?? "Pages";

    return leftGroup === rightGroup
      ? left.name.localeCompare(right.name)
      : leftGroup.localeCompare(rightGroup);
  });
});

export function resolveModuleNavigationKey(moduleKey: string): string {
  const raw = (moduleKey || "").trim();
  if (!raw) return raw;
  if (moduleMap[raw]) return raw;

  const normalized = raw.toLowerCase();
  if (moduleMap[normalized]) return normalized;

  const compact = normalized.replace(/[^a-z0-9_]/g, "");
  const aliased = MODULE_KEY_ALIASES[normalized] || MODULE_KEY_ALIASES[compact] || raw;
  return moduleMap[aliased] ? aliased : aliased;
}

export const IMPLEMENTED_PAGES = new Set<string>(FALLBACK_PAGE_DEFINITIONS.map((page) => page.path));

export function getSubModulesForModule(moduleKey: string): SubModuleLink[] {
  const resolvedKey = resolveModuleNavigationKey(moduleKey) as ModuleKey;
  return (moduleMap[resolvedKey] || []).filter((link) => IMPLEMENTED_PAGES.has(link.path));
}

export default moduleMap;
