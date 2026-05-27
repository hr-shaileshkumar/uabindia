import defaultModuleMap, { type SubModuleLink } from "@/app/(protected)/module-navigation";
import { ROUTE_PERMISSION_MATRIX, type ModuleKey } from "@/config/route-permissions.config";
import { ROUTES } from "@/constants/routes";

export const MODULE_MAPPING_STORAGE_KEY = "erp.platform.module-page-mapping.v1";
export const MODULE_MAPPING_UPDATED_EVENT = "erp:module-mapping-updated";

export type ModuleMeta = {
  key: ModuleKey;
  label: string;
  icon: string;
  description: string;
  homeHref: string;
};

export type ModuleMappingOverrides = Record<string, ModuleKey[]>;

export type PageRegistryItem = {
  id: string;
  key: string;
  name: string;
  path: string;
  icon?: string;
  group?: string;
  modules: ModuleKey[];
  permissionKeys: string[];
};

export const MODULE_META: ModuleMeta[] = [
  {
    key: "platform",
    label: "Admin Console",
    icon: "settings",
    description: "Governance, roles, users, settings, and platform operations.",
    homeHref: ROUTES.PLATFORM_HOME,
  },
  {
    key: "operations",
    label: "Operations",
    icon: "module-operations",
    description: "Shared workspace — dashboard, approvals, notifications, and documents.",
    homeHref: ROUTES.DASHBOARD,
  },
  {
    key: "erp_finance",
    label: "Finance",
    icon: "payroll",
    description: "Chart of accounts, journal entries, payments, invoices, expenses, and tax.",
    homeHref: ROUTES.CHART_OF_ACCOUNTS,
  },
  {
    key: "erp_procurement",
    label: "Procurement",
    icon: "box",
    description: "Vendors, purchase requests, purchase orders, and goods receipt (GRN).",
    homeHref: ROUTES.VENDORS,
  },
  {
    key: "erp_sales",
    label: "Sales & CRM",
    icon: "users",
    description: "Customers, quotations, sales orders, and returns.",
    homeHref: ROUTES.CUSTOMERS,
  },
  {
    key: "erp_inventory",
    label: "Inventory",
    icon: "box",
    description: "Items, warehouses, stock movements, adjustments, and transfers.",
    homeHref: ROUTES.ITEMS,
  },
  {
    key: "hrms",
    label: "HRMS",
    icon: "employees",
    description: "People operations, attendance, leave, recruitment, and performance.",
    homeHref: ROUTES.HRMS_HOME,
  },
  {
    key: "payroll",
    label: "Payroll",
    icon: "payroll",
    description: "Salary runs, statutory, components, structures, and payslips.",
    homeHref: ROUTES.PAYROLL_HOME,
  },
  {
    key: "reports",
    label: "Analytics & Reports",
    icon: "file",
    description: "Cross-module analytics and reporting for HR, payroll, ERP, and compliance.",
    homeHref: ROUTES.REPORTS_HOME,
  },
  {
    key: "licensing",
    label: "Licensing",
    icon: "box",
    description: "Catalog, subscriptions, billing, and integrations.",
    homeHref: ROUTES.LICENSING_HOME,
  },
  {
    key: "security",
    label: "Security",
    icon: "shield",
    description: "Sessions, MFA, SSO, devices, and password governance.",
    homeHref: ROUTES.SECURITY_HOME,
  },
  {
    key: "integrations",
    label: "Integrations",
    icon: "settings",
    description: "API keys, webhooks, third-party apps, and integration logs.",
    homeHref: ROUTES.INTEGRATIONS_HOME,
  },
  {
    key: "helpdesk",
    label: "Helpdesk",
    icon: "employees",
    description: "Support tickets, escalations, and FAQs.",
    homeHref: ROUTES.HELPDESK_HOME,
  },
  {
    key: "communication",
    label: "Communication",
    icon: "bell",
    description: "Announcements, email/SMS templates, and push notifications.",
    homeHref: ROUTES.COMMUNICATION_HOME,
  },
];

const MODULE_ORDER = new Map(MODULE_META.map((module, index) => [module.key, index]));
const VALID_MODULES = new Set(MODULE_META.map((module) => module.key));

const sortModuleKeys = (modules: ModuleKey[]) =>
  [...modules].sort((left, right) => (MODULE_ORDER.get(left) ?? 999) - (MODULE_ORDER.get(right) ?? 999));

const getEmptyModuleMap = (): Record<ModuleKey, SubModuleLink[]> =>
  Object.fromEntries(MODULE_META.map((module) => [module.key, [] as SubModuleLink[]])) as Record<ModuleKey, SubModuleLink[]>;

export function getDefaultPageRegistry(): PageRegistryItem[] {
  const pages = new Map<string, PageRegistryItem>();

  (Object.entries(defaultModuleMap) as Array<[ModuleKey, SubModuleLink[]]>).forEach(([moduleKey, links]) => {
    links.forEach((link) => {
      const existing = pages.get(link.path);
      const permissionKeys = ROUTE_PERMISSION_MATRIX.find((rule) => rule.path === link.path)?.permissions ?? [];

      if (existing) {
        if (!existing.modules.includes(moduleKey)) {
          existing.modules = sortModuleKeys([...existing.modules, moduleKey]);
        }
        if ((!existing.group || existing.group === "Pages") && link.group) {
          existing.group = link.group;
        }
        if (!existing.icon && link.icon) {
          existing.icon = link.icon;
        }
        if (permissionKeys.length > existing.permissionKeys.length) {
          existing.permissionKeys = permissionKeys;
        }
        return;
      }

      pages.set(link.path, {
        id: link.path,
        key: link.key,
        name: link.name,
        path: link.path,
        icon: link.icon,
        group: link.group,
        modules: [moduleKey],
        permissionKeys,
      });
    });
  });

  return [...pages.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export function normalizeModuleMappingOverrides(input: ModuleMappingOverrides): ModuleMappingOverrides {
  const normalized: ModuleMappingOverrides = {};

  Object.entries(input || {}).forEach(([path, modules]) => {
    if (!path || !Array.isArray(modules)) return;

    const filtered = sortModuleKeys(
      modules.filter((moduleKey): moduleKey is ModuleKey => VALID_MODULES.has(moduleKey))
    );

    normalized[path] = [...new Set(filtered)];
  });

  return normalized;
}

export function resolvePageRegistry(overrides: ModuleMappingOverrides = {}): PageRegistryItem[] {
  const normalizedOverrides = normalizeModuleMappingOverrides(overrides);

  return getDefaultPageRegistry().map((page) => ({
    ...page,
    modules: normalizedOverrides[page.path] ?? page.modules,
  }));
}

export function resolveModuleNavigationMap(overrides: ModuleMappingOverrides = {}): Record<ModuleKey, SubModuleLink[]> {
  const moduleMap = getEmptyModuleMap();

  resolvePageRegistry(overrides).forEach((page) => {
    page.modules.forEach((moduleKey) => {
      moduleMap[moduleKey].push({
        key: page.key,
        name: page.name,
        path: page.path,
        icon: page.icon,
        group: page.group,
      });
    });
  });

  (Object.keys(moduleMap) as ModuleKey[]).forEach((moduleKey) => {
    moduleMap[moduleKey] = moduleMap[moduleKey].sort((left, right) => {
      const leftGroup = left.group ?? "Pages";
      const rightGroup = right.group ?? "Pages";
      return leftGroup === rightGroup
        ? left.name.localeCompare(right.name)
        : leftGroup.localeCompare(rightGroup);
    });
  });

  return moduleMap;
}

export function readModuleMappingOverrides(): ModuleMappingOverrides {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(MODULE_MAPPING_STORAGE_KEY);
    if (!raw) return {};
    return normalizeModuleMappingOverrides(JSON.parse(raw) as ModuleMappingOverrides);
  } catch {
    return {};
  }
}

export function persistModuleMappingOverrides(overrides: ModuleMappingOverrides) {
  if (typeof window === "undefined") return;

  const normalized = normalizeModuleMappingOverrides(overrides);
  window.localStorage.setItem(MODULE_MAPPING_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(MODULE_MAPPING_UPDATED_EVENT));
}

export function clearModuleMappingOverrides() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(MODULE_MAPPING_STORAGE_KEY);
  window.dispatchEvent(new Event(MODULE_MAPPING_UPDATED_EVENT));
}

export function buildNavigationOverridePayload(pages: PageRegistryItem[]) {
  return {
    navigation: {
      modules: MODULE_META.map((module) => {
        const grouped = new Map<string, Array<{
          key: string;
          name: string;
          path: string;
          icon?: string;
          requiredPermissions: string[];
        }>>();

        pages
          .filter((page) => page.modules.includes(module.key))
          .forEach((page) => {
            const groupLabel = page.group?.trim() || "Pages";
            const items = grouped.get(groupLabel) ?? [];
            items.push({
              key: page.key,
              name: page.name,
              path: page.path,
              icon: page.icon,
              requiredPermissions: page.permissionKeys,
            });
            grouped.set(groupLabel, items);
          });

        return {
          key: module.key,
          groups: [...grouped.entries()].map(([label, items]) => ({
            label,
            items,
          })),
        };
      }),
    },
  };
}
